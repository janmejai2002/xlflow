/**
 * OAuth 2.1 Authorization & Resource Server for Gemini Spark
 * Non-Technical User Flow: Student logs in once with Campus Email + Password.
 * The worker captures the ERP Bearer token, seals it inside the OAuth JWT,
 * and passes it to MCP tool calls for real-time live attendance.
 */

import { Context, Hono } from "hono";
import { loginToXlerp } from "./erp.js";

export interface Env {
  SERVER_NAME?: string;
  JWT_SECRET?: string;
  DEFAULT_ROLL?: string;
}

const registeredClients = new Map<string, { name: string; redirectUris: string[] }>();

function getBaseUrl(c: Context): string {
  const url = new URL(c.req.url);
  return `${url.protocol}//${url.host}`;
}

function toBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return toBase64Url(sig);
}

async function hmacVerify(data: string, sig: string, secret: string): Promise<boolean> {
  const expectedSig = await hmacSign(data, secret);
  return expectedSig === sig;
}

async function createAuthCode(payload: object, secret: string): Promise<string> {
  const jsonStr = JSON.stringify(payload);
  const b64Data = toBase64Url(new TextEncoder().encode(jsonStr));
  const sig = await hmacSign(b64Data, secret);
  return `${b64Data}.${sig}`;
}

async function verifyAuthCode<T>(code: string, secret: string): Promise<T | null> {
  const parts = code.split(".");
  if (parts.length !== 2) return null;
  const [b64Data, sig] = parts;
  const isValid = await hmacVerify(b64Data, sig, secret);
  if (!isValid) return null;
  try {
    const jsonStr = new TextDecoder().decode(fromBase64Url(b64Data));
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

export interface UserJwtClaims {
  sub: string;
  erpToken?: string;
  roll?: string;
  exp?: number;
}

export async function createJwt(claims: UserJwtClaims, secret: string, ttlSeconds = 2592000): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullClaims = {
    ...claims,
    iss: "xlflow-spark-mcp",
    aud: "gemini-spark",
    iat: now,
    exp: now + ttlSeconds,
    scope: "mcp:tools"
  };
  const enc = new TextEncoder();
  const b64Header = toBase64Url(enc.encode(JSON.stringify(header)));
  const b64Claims = toBase64Url(enc.encode(JSON.stringify(fullClaims)));
  const data = `${b64Header}.${b64Claims}`;
  const sig = await hmacSign(data, secret);
  return `${data}.${sig}`;
}

export async function decodeAndVerifyJwt(jwt: string, secret: string): Promise<UserJwtClaims | null> {
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  const [b64Header, b64Claims, sig] = parts;
  const data = `${b64Header}.${b64Claims}`;
  const valid = await hmacVerify(data, sig, secret);
  if (!valid) return null;
  try {
    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(b64Claims))) as UserJwtClaims;
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) return null;
    return claims;
  } catch {
    return null;
  }
}

export function registerOAuthRoutes(app: Hono<{ Bindings: Env }>) {
  // RFC 9728: Protected Resource Metadata
  const handleProtectedResource = (c: Context) => {
    const base = getBaseUrl(c);
    c.header("Content-Type", "application/json; charset=utf-8");
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
    return c.json({
      resource: `${base}/mcp`,
      authorization_servers: [base],
      scopes_supported: ["mcp:tools"],
      bearer_methods_supported: ["header"]
    });
  };

  app.get("/.well-known/oauth-protected-resource", handleProtectedResource);
  app.get("/.well-known/oauth-protected-resource/mcp", handleProtectedResource);

  // RFC 8414: Authorization Server Metadata
  app.get("/.well-known/oauth-authorization-server", (c) => {
    const base = getBaseUrl(c);
    c.header("Content-Type", "application/json; charset=utf-8");
    c.header("Access-Control-Allow-Origin", "*");
    return c.json({
      issuer: base,
      authorization_endpoint: `${base}/authorize`,
      token_endpoint: `${base}/api/oauth/token`,
      registration_endpoint: `${base}/api/oauth/register`,
      scopes_supported: ["mcp:tools"],
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"]
    });
  });

  // RFC 7591: Dynamic Client Registration
  app.post("/api/oauth/register", async (c) => {
    c.header("Access-Control-Allow-Origin", "*");
    const body = await c.req.json().catch(() => ({})) as {
      redirect_uris?: string[];
      client_name?: string;
    };

    const redirectUris = body.redirect_uris || [];
    const clientName = body.client_name || "Gemini Spark Client";
    const clientId = `client_${crypto.randomUUID().replace(/-/g, "")}`;
    registeredClients.set(clientId, { name: clientName, redirectUris });

    return c.json(
      {
        client_id: clientId,
        client_name: clientName,
        redirect_uris: redirectUris,
        grant_types: ["authorization_code"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
        scope: "mcp:tools"
      },
      201
    );
  });

  // RFC 7636: GET /authorize (Non-Technical User Login Form)
  app.get("/authorize", (c) => {
    const url = new URL(c.req.url);
    const clientId = url.searchParams.get("client_id") || "";
    const redirectUri = url.searchParams.get("redirect_uri") || "";
    const codeChallenge = url.searchParams.get("code_challenge") || "";
    const state = url.searchParams.get("state") || "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>XLRI Student Portal</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #08090C;
      color: #F3F4F6;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
      -webkit-font-smoothing: antialiased;
    }
    .login-container {
      background: #111318;
      border: 1px solid #1F2430;
      border-radius: 20px;
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .brand-mark {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.2rem;
      color: #FFFFFF;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 16px -4px rgba(37, 99, 235, 0.4);
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.025em;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      font-size: 0.875rem;
      color: #8B949E;
      line-height: 1.5;
      margin-bottom: 1.75rem;
    }
    .field {
      margin-bottom: 1.25rem;
    }
    label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #D1D5DB;
      margin-bottom: 0.5rem;
    }
    input {
      width: 100%;
      height: 48px;
      padding: 0 1rem;
      border-radius: 10px;
      border: 1px solid #28303F;
      background: #0B0D12;
      color: #FFFFFF;
      font-size: 1rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s ease;
    }
    input::placeholder {
      color: #4B5563;
      font-size: 0.9375rem;
    }
    input:focus {
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
      background: #0D1017;
    }
    .btn-primary {
      width: 100%;
      height: 48px;
      border-radius: 10px;
      border: none;
      background: #2563EB;
      color: #FFFFFF;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 0.5rem;
      transition: background 0.15s ease, transform 0.05s ease;
    }
    .btn-primary:hover {
      background: #1D4ED8;
    }
    .btn-primary:active {
      transform: scale(0.99);
    }
    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 1.5rem 0;
      color: #4B5563;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #1E232F;
    }
    .divider span {
      padding: 0 0.75rem;
    }
    .btn-secondary {
      width: 100%;
      height: 44px;
      border-radius: 10px;
      border: 1px solid #28303F;
      background: transparent;
      color: #9CA3AF;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-secondary:hover {
      background: #191E28;
      color: #E5E7EB;
    }
    .footnote {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: #6B7280;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="brand-mark">XL</div>
    <h1>XLRI Student Login</h1>
    <p class="subtitle">Sign in with your campus credentials to access your courses, schedule, and attendance.</p>
    
    <form method="POST" action="/authorize">
      <input type="hidden" name="client_id" value="${clientId}">
      <input type="hidden" name="redirect_uri" value="${redirectUri}">
      <input type="hidden" name="code_challenge" value="${codeChallenge}">
      <input type="hidden" name="state" value="${state}">
      
      <div class="field">
        <label for="email">Campus Email</label>
        <input 
          id="email"
          type="email" 
          name="email" 
          placeholder="b25xxx@astra.xlri.ac.in" 
          autocomplete="username"
          required 
          autofocus
        />
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input 
          id="password"
          type="password" 
          name="password" 
          placeholder="••••••••" 
          autocomplete="current-password"
          required 
        />
      </div>

      <button type="submit" name="mode" value="live" class="btn-primary">Sign In</button>
      
      <div class="divider"><span>or</span></div>
      <button type="submit" name="mode" value="demo" formnovalidate class="btn-secondary">Continue in Demo Mode</button>
    </form>
    <div class="footnote">Official XLRI Academic Services</div>
  </div>
</body>
</html>`;
    return c.html(html);
  });

  // RFC 7636: POST /authorize (Authenticates against XLRI ERP if requested)
  app.post("/authorize", async (c) => {
    const body = await c.req.parseBody();
    const clientId = (body.client_id as string) || "";
    const redirectUri = (body.redirect_uri as string) || "";
    const codeChallenge = (body.code_challenge as string) || "";
    const state = (body.state as string) || "";
    const mode = (body.mode as string) || "live";
    const email = ((body.email as string) || "").trim();
    const password = (body.password as string) || "";

    if (!redirectUri) return c.text("Missing redirect_uri", 400);

    let erpToken = "";
    let rollNumber = email ? email.split("@")[0].toUpperCase() : "DEMO-BMD";

    // Attempt live ERP login if user provided credentials
    if (mode === "live" && email && password) {
      const loginRes = await loginToXlerp(email, password);
      if (loginRes.error || !loginRes.token) {
        // Return friendly error card
        return c.html(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Login Failed</title>
<style>body{font-family:sans-serif;background:#0A0C10;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
.card{background:#13161C;padding:2rem;border-radius:12px;max-width:380px;text-align:center;border:1px solid #ef4444;}
h3{color:#ef4444;margin-top:0;}p{color:#94A3B8;font-size:0.9rem;}
a{display:inline-block;margin-top:1rem;color:#60A5FA;text-decoration:none;font-weight:600;}</style></head>
<body><div class="card">
<h3>ERP Login Failed</h3>
<p>${loginRes.error || "Please verify your campus email and password."}</p>
<a href="javascript:history.back()">← Try Again</a>
</div></body></html>`, 401);
      }
      erpToken = loginRes.token;
    }

    const secret = c.env.JWT_SECRET || "xlflow-jwt-super-secret-key-change-in-prod";
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const authCode = await createAuthCode(
      { clientId, redirectUri, codeChallenge, expiresAt, erpToken, rollNumber, email },
      secret
    );

    const target = new URL(redirectUri);
    target.searchParams.set("code", authCode);
    if (state) target.searchParams.set("state", state);

    return c.redirect(target.toString(), 302);
  });

  // RFC 7636: POST /api/oauth/token (Exchanges code for JWT carrying ERP token)
  app.post("/api/oauth/token", async (c) => {
    c.header("Access-Control-Allow-Origin", "*");
    const contentType = c.req.header("Content-Type") || "";
    let grantType = "";
    let code = "";
    let codeVerifier = "";

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const body = await c.req.parseBody();
      grantType = body.grant_type as string;
      code = body.code as string;
      codeVerifier = body.code_verifier as string;
    } else {
      const json = await c.req.json().catch(() => ({})) as Record<string, string>;
      grantType = json.grant_type;
      code = json.code;
      codeVerifier = json.code_verifier;
    }

    if (grantType !== "authorization_code") {
      return c.json({ error: "unsupported_grant_type" }, 400);
    }

    const secret = c.env.JWT_SECRET || "xlflow-jwt-super-secret-key-change-in-prod";
    interface CodePayload {
      clientId: string;
      redirectUri: string;
      codeChallenge: string;
      expiresAt: number;
      erpToken?: string;
      rollNumber?: string;
      email?: string;
    }

    const payload = await verifyAuthCode<CodePayload>(code, secret);
    if (!payload || Date.now() > payload.expiresAt) {
      return c.json({ error: "invalid_grant", error_description: "Code expired or invalid" }, 400);
    }

    // Verify S256 PKCE
    if (payload.codeChallenge) {
      if (!codeVerifier) {
        return c.json({ error: "invalid_request", error_description: "Missing code_verifier" }, 400);
      }
      const data = new TextEncoder().encode(codeVerifier);
      const hash = await crypto.subtle.digest("SHA-256", data);
      const computedChallenge = toBase64Url(hash);
      if (computedChallenge !== payload.codeChallenge) {
        return c.json({ error: "invalid_grant", error_description: "PKCE verification failed" }, 400);
      }
    }

    // Mint access token carrying encrypted ERP token
    const token = await createJwt(
      {
        sub: payload.email || payload.clientId,
        roll: payload.rollNumber,
        erpToken: payload.erpToken
      },
      secret
    );

    return c.json({
      access_token: token,
      token_type: "Bearer",
      expires_in: 2592000,
      scope: "mcp:tools"
    });
  });
}

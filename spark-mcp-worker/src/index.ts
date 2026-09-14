/**
 * XLFlow Cloudflare Worker MCP Server for Gemini Spark
 * Full RFC 9728, RFC 8414, RFC 7591 (DCR), and RFC 7636 (PKCE) Compliant.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env, registerOAuthRoutes, decodeAndVerifyJwt } from "./oauth.js";
import { handleMcpRequest } from "./mcp.js";

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for all discovery and client endpoints
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "HEAD", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type", "Accept"],
    exposeHeaders: ["WWW-Authenticate"]
  })
);

// Register OAuth 2.1 discovery & DCR routes
registerOAuthRoutes(app);

// Helper for 401 challenge header expected by Gemini Spark
function sendChallenge(c: any, description = "Missing or invalid token"): Response {
  const url = new URL(c.req.url);
  const base = `${url.protocol}//${url.host}`;
  c.header(
    "WWW-Authenticate",
    `Bearer error="invalid_token", error_description="${description}", resource_metadata="${base}/.well-known/oauth-protected-resource"`
  );
  return c.text("Unauthorized", 401);
}

// Spark probes HEAD / and HEAD /mcp before authenticating
app.use("*", async (c, next) => {
  if (c.req.method === "HEAD" && (c.req.path === "/" || c.req.path === "/mcp")) {
    return sendChallenge(c, "Initial OAuth probe");
  }
  await next();
});

// Root info / health check (only GET)
app.get("/", (c) => {
  const url = new URL(c.req.url);
  const base = `${url.protocol}//${url.host}`;
  return c.json({
    service: c.env.SERVER_NAME || "XLFlow ERP Spark Assistant",
    status: "healthy",
    mcp_endpoint: `${base}/mcp`,
    oauth_metadata: `${base}/.well-known/oauth-authorization-server`,
    protected_resource: `${base}/.well-known/oauth-protected-resource`
  });
});

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Protected MCP Endpoint: supports both /mcp and /
const mcpHandler = async (c: any) => {
  const authHeader = c.req.header("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return sendChallenge(c, "Missing Bearer token");
  }

  const token = authHeader.replace(/^Bearer\s+/, "").trim();
  const secret = c.env.JWT_SECRET || "xlflow-jwt-super-secret-key-change-in-prod";
  const claims = await decodeAndVerifyJwt(token, secret);

  if (!claims) {
    return sendChallenge(c, "Token expired or signature invalid");
  }

  return handleMcpRequest(c, claims);
};

app.post("/mcp", mcpHandler);
app.post("/", mcpHandler);

export default app;

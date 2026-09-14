import { describe, expect, it } from "bun:test";
import app from "../src/index.js";

async function generatePkce() {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const challenge = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { verifier, challenge };
}

describe("Gemini Spark Full Autonomous MCP Suite", () => {
  const env = {
    SERVER_NAME: "XLFlow ERP Spark Assistant",
    JWT_SECRET: "test-secret-key-12345",
    DEFAULT_ROLL: "DEMO-BMD"
  };

  let clientId = "";
  let authCode = "";
  let accessToken = "";
  let pkceVerifier = "";

  it("1. HEAD / returns 401 challenge with resource_metadata pointer", async () => {
    const res = await app.request("/", { method: "HEAD" }, env);
    expect(res.status).toBe(401);
    const authHeader = res.headers.get("WWW-Authenticate") || "";
    expect(authHeader).toContain("resource_metadata=");
  });

  it("2. GET /.well-known/oauth-protected-resource returns RFC 9728 metadata", async () => {
    const res = await app.request("/.well-known/oauth-protected-resource", { method: "GET" }, env);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.resource).toBeDefined();
    expect(json.authorization_servers).toBeArray();
    expect(json.scopes_supported).toContain("mcp:tools");
  });

  it("3. GET /.well-known/oauth-authorization-server returns RFC 8414 metadata", async () => {
    const res = await app.request("/.well-known/oauth-authorization-server", { method: "GET" }, env);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.registration_endpoint).toContain("/api/oauth/register");
    expect(json.token_endpoint).toContain("/api/oauth/token");
    expect(json.authorization_endpoint).toContain("/authorize");
  });

  it("4. POST /api/oauth/register supports RFC 7591 Dynamic Client Registration", async () => {
    const res = await app.request("/api/oauth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "Google Gemini Spark",
        redirect_uris: ["https://gemini.google.com/oauth/callback"]
      })
    }, env);

    expect(res.status).toBe(201);
    const json = await res.json() as any;
    expect(json.client_id).toBeDefined();
    expect(json.token_endpoint_auth_method).toBe("none");
    clientId = json.client_id;
  });

  it("5. GET /authorize returns non-technical login consent UI", async () => {
    const pkce = await generatePkce();
    pkceVerifier = pkce.verifier;

    const url = `/authorize?client_id=${clientId}&redirect_uri=https://gemini.google.com/oauth/callback&response_type=code&code_challenge=${pkce.challenge}&code_challenge_method=S256&state=state123`;
    const res = await app.request(url, { method: "GET" }, env);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("XLRI Student Login");
    expect(html).toContain("Campus Email");
  });

  it("6. POST /authorize issues authorization code in Demo/Sample mode", async () => {
    const pkce = await generatePkce();
    const formData = new FormData();
    formData.append("client_id", clientId);
    formData.append("redirect_uri", "https://gemini.google.com/oauth/callback");
    formData.append("code_challenge", pkce.challenge);
    formData.append("state", "state123");
    formData.append("mode", "demo");

    const res = await app.request("/authorize", {
      method: "POST",
      body: formData
    }, env);

    expect(res.status).toBe(302);
    const loc = res.headers.get("Location") || "";
    expect(loc).toContain("code=");
    expect(loc).toContain("state=state123");

    const parsedUrl = new URL(loc);
    authCode = parsedUrl.searchParams.get("code") || "";
    expect(authCode).not.toBeEmpty();
  });

  it("7. POST /api/oauth/token completes PKCE S256 exchange and returns JWT", async () => {
    const res = await app.request("/api/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        code: authCode,
        redirect_uri: "https://gemini.google.com/oauth/callback",
        code_verifier: pkceVerifier
      })
    }, env);

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.access_token).toBeDefined();
    expect(json.token_type).toBe("Bearer");
    accessToken = json.access_token;
  });

  it("8. POST /mcp rejects unauthenticated requests with 401", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" })
    }, env);

    expect(res.status).toBe(401);
  });

  it("9. POST /mcp responds to 'initialize' with protocol version and serverInfo", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2024-11-05" }
      })
    }, env);

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.result.serverInfo.name).toBe("XLFlow ERP Spark Assistant");
    expect(json.result.instructions).toContain("XLFlow Academic Chief of Staff");
    expect(json.result.capabilities.prompts).toBeDefined();
    expect(json.result.capabilities.resources).toBeDefined();
  });

  it("10. POST /mcp responds to 'tools/list' with all 8 autonomous ERP tools", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list"
      })
    }, env);

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    const toolNames = json.result.tools.map((t: any) => t.name);
    expect(toolNames).toContain("get_daily_briefing");
    expect(toolNames).toContain("get_attendance_safety");
    expect(toolNames).toContain("get_student_schedule");
    expect(toolNames).toContain("simulate_bunk_impact");
    expect(toolNames).toContain("get_academic_deadlines");
    expect(toolNames).toContain("find_natural_getaways");
    expect(toolNames).toContain("search_batch_roster");
    expect(toolNames).toContain("get_enrolled_courses");
  });

  it("11. POST /mcp executes 'get_daily_briefing'", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "get_daily_briefing", arguments: {} }
      })
    }, env);

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.result.content[0].text).toContain("Daily Academic Briefing");
  });

  it("12. POST /mcp executes 'get_attendance_safety'", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: { name: "get_attendance_safety", arguments: { courseCode: "OMCR" } }
      })
    }, env);

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.result.content[0].text).toContain("OMCR");
    expect(json.result.content[0].text).toContain("Safe Bunks");
  });

  it("13. POST /mcp executes 'simulate_bunk_impact'", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: { name: "simulate_bunk_impact", arguments: { courseCode: "OMCR", skips: 2, attends: 0 } }
      })
    }, env);

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.result.content[0].text).toContain("Bunk Simulation for OMCR");
  });

  it("14. POST /mcp executes 'get_academic_deadlines'", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 6,
        method: "tools/call",
        params: { name: "get_academic_deadlines", arguments: {} }
      })
    }, env);

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.result.content[0].text).toContain("Academic Deadlines");
  });

  it("15. POST /mcp executes 'find_natural_getaways'", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 7,
        method: "tools/call",
        params: { name: "find_natural_getaways", arguments: { minDays: 3 } }
      })
    }, env);

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.result.content[0].text).toContain("Natural Getaway Windows");
  });

  it("16. POST /mcp executes 'get_enrolled_courses'", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 8,
        method: "tools/call",
        params: { name: "get_enrolled_courses", arguments: {} }
      })
    }, env);

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.result.content[0].text).toContain("Enrolled Courses for Term-5");
  });

  it("17. POST /mcp responds to 'prompts/list' and 'prompts/get'", async () => {
    const listRes = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 9,
        method: "prompts/list"
      })
    }, env);
    expect(listRes.status).toBe(200);
    const listJson = await listRes.json() as any;
    const promptNames = listJson.result.prompts.map((p: any) => p.name);
    expect(promptNames).toContain("class_reminder");
    expect(promptNames).toContain("attendance_audit");
    expect(promptNames).toContain("plan_getaway");

    const getRes = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 10,
        method: "prompts/get",
        params: { name: "class_reminder", arguments: { timeOfDay: "morning" } }
      })
    }, env);
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json() as any;
    expect(getJson.result.messages[0].content.text).toContain("Send me a short class reminder");
  });

  it("18. POST /mcp responds to 'resources/list' and 'resources/read'", async () => {
    const listRes = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 11,
        method: "resources/list"
      })
    }, env);
    expect(listRes.status).toBe(200);
    const listJson = await listRes.json() as any;
    expect(listJson.result.resources.length).toBeGreaterThanOrEqual(2);

    const readRes = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 12,
        method: "resources/read",
        params: { uri: "xlflow://policy/attendance" }
      })
    }, env);
    expect(readRes.status).toBe(200);
    const readJson = await readRes.json() as any;
    expect(readJson.result.contents[0].text).toContain("XLRI Statutory Attendance Policy");
  });

  it("19. POST /mcp executes 'get_daily_briefing' with timeOfDay='morning'", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 13,
        method: "tools/call",
        params: { name: "get_daily_briefing", arguments: { timeOfDay: "morning" } }
      })
    }, env);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.result.content[0].text).toContain("Today's Classes");
    expect(json.result.content[0].text).not.toContain("[object Object]");
  });
});

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function run() {
  console.log("Connecting to XL-Flow MCP Server via Stdio...");
  const transport = new StdioClientTransport({
    command: "bun",
    args: ["mcp-server/stdio.js"],
    cwd: process.cwd()
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✓ Connected successfully!");

  console.log("\n1. Querying available tools...");
  const tools = await client.listTools();
  console.log(`✓ Tools discovered (${tools.tools.length}):`);
  tools.tools.forEach(t => console.log(`   - ${t.name}: ${t.description.substring(0, 60)}...`));

  console.log("\n2. Calling tool: get_attendance_safety...");
  const attendanceRes = await client.callTool({
    name: "get_attendance_safety",
    arguments: { courseCode: "OMCR" }
  });
  console.log("✓ Result:", attendanceRes.content[0].text);

  console.log("\n3. Calling tool: search_batch_roster for 'Section E'...");
  const rosterRes = await client.callTool({
    name: "search_batch_roster",
    arguments: { query: "E" }
  });
  console.log("✓ Result:", rosterRes.content[0].text);

  await client.close();
  console.log("\n=== MCP STDIO VERIFICATION COMPLETE ===");
}

run().catch(console.error);

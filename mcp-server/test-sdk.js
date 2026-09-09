import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

console.log("Server:", typeof Server);
console.log("StdioServerTransport:", typeof StdioServerTransport);
console.log("ListToolsRequestSchema:", typeof ListToolsRequestSchema);

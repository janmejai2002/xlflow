#!/usr/bin/env bun
/**
 * Universal Academic Intelligence MCP Server (Stdio Transport)
 * Built with official @modelcontextprotocol/sdk.
 * Compatible with Claude Desktop, Cursor, Antigravity, and any CLI MCP host.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { SAMPLE_STUDENT, SAMPLE_COURSES, SAMPLE_SCHEDULE } from '../src/data/sampleData.js';
import { BATCH_ROSTER } from '../src/data/rosterData.js';
import { calculateBunkStats, simulateAttendance, STATUTORY_THRESHOLD } from '../src/services/bunkCalculator.js';
import { findNaturalGetaways } from '../src/services/tripPlanner.js';

// MCP Server Instance
const server = new Server(
  {
    name: "xlflow-academic-mcp",
    version: "1.2.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// MCP Tool Catalog
const MCP_TOOLS = [
  {
    name: "get_student_schedule",
    description: "Fetches current student schedule and upcoming lectures with timing, faculty, and room codes for Term-5.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Optional date in YYYY-MM-DD format to filter schedule" },
        courseCode: { type: "string", description: "Optional course code filter (e.g. OMCR, BDM, B2B, IMCE)" }
      }
    }
  },
  {
    name: "get_attendance_safety",
    description: "Retrieves real-time attendance percentages and statutory safe bunk calculations under XLRI's mandatory 80.0% policy.",
    inputSchema: {
      type: "object",
      properties: {
        courseCode: { type: "string", description: "Optional course code to check specific safety margin" }
      }
    }
  },
  {
    name: "simulate_bunk_impact",
    description: "Simulates the mathematical degradation or recovery of attendance percentage if upcoming classes are skipped.",
    inputSchema: {
      type: "object",
      properties: {
        courseCode: { type: "string", description: "Course code to simulate (e.g. OMCR, BDM)" },
        skips: { type: "number", description: "Number of upcoming lectures to skip" },
        attends: { type: "number", description: "Number of upcoming lectures to attend (default 0)" }
      },
      required: ["courseCode", "skips"]
    }
  },
  {
    name: "search_batch_roster",
    description: "Searches across all 178 batchmates in Sections E, F, and G by roll number, name, or section.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query: 3-digit roll number, student name, or section" }
      },
      required: ["query"]
    }
  },
  {
    name: "find_natural_getaways",
    description: "Discovers prime weekend vacation gaps with minimal classes missed and zero exam conflicts.",
    inputSchema: {
      type: "object",
      properties: {
        minDays: { type: "number", description: "Minimum duration in consecutive days (default 3)" },
        maxBunksAllowed: { type: "number", description: "Maximum allowable class misses (default 1)" }
      }
    }
  },
  {
    name: "trigger_browser_action",
    description: "Remotely controls the live XL-Flow web browser tab. Can switch tabs (radar, bunkmeter, timetable, trips, deadlines), trigger celebration confetti chimes, toggle 432Hz ambient soundscape, or open the batch roster live in the user's viewport.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["NAVIGATE_TAB", "TRIGGER_CELEBRATION", "TOGGLE_SOUNDSCAPE", "OPEN_ROSTER", "SIMULATE_BUNK"],
          description: "Action type to execute on the live web application"
        },
        tab: {
          type: "string",
          enum: ["radar", "bunkmeter", "timetable", "trips", "deadlines"],
          description: "Tab name if action is NAVIGATE_TAB"
        },
        courseCode: {
          type: "string",
          description: "Course code for simulation or focus (e.g. OMCR, BDM)"
        }
      },
      required: ["action"]
    }
  }
];

// Forward to HTTP MCP server if running to bridge to browser
async function forwardToHttpBridge(toolName, toolArgs) {
  try {
    const res = await fetch("http://localhost:3100/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: toolName, arguments: toolArgs }
      }),
      signal: AbortSignal.timeout(1500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.result?.content?.[0]?.text) {
        return JSON.parse(data.result.content[0].text);
      }
    }
  } catch (e) {
    // Local fallback if HTTP server not running
  }
  return null;
}

// Register Tool List Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: MCP_TOOLS };
});

// Register Tool Execution Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  // Try HTTP bridge first for remote browser control actions
  if (name === "trigger_browser_action" || name === "simulate_bunk_impact") {
    const bridged = await forwardToHttpBridge(name, args);
    if (bridged) {
      return {
        content: [{ type: "text", text: JSON.stringify(bridged, null, 2) }]
      };
    }
  }

  // Local calculation handlers
  switch (name) {
    case "get_student_schedule": {
      let filtered = [...SAMPLE_SCHEDULE];
      if (args.date) filtered = filtered.filter(s => s.classDate === args.date);
      if (args.courseCode) filtered = filtered.filter(s => s.courseCode.toUpperCase() === args.courseCode.toUpperCase());
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ student: SAMPLE_STUDENT, count: filtered.length, schedule: filtered }, null, 2)
        }]
      };
    }

    case "get_attendance_safety": {
      const results = SAMPLE_COURSES.map(c => {
        const stats = calculateBunkStats(c.attended, c.conducted, c.totalPlanned);
        return {
          code: c.code,
          name: c.name,
          faculty: c.faculty,
          currentPercentage: stats.currentPercentage,
          safeBunks: stats.safeBunks,
          immediateBunks: stats.immediateBunks,
          tier: stats.tier,
          isDebarred: stats.isDebarred
        };
      });
      const res = args.courseCode
        ? (results.find(c => c.code.toUpperCase() === args.courseCode.toUpperCase()) || { error: "Course not found" })
        : { courses: results };
      return {
        content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
      };
    }

    case "simulate_bunk_impact": {
      const course = SAMPLE_COURSES.find(c => c.code.toUpperCase() === args.courseCode.toUpperCase());
      if (!course) {
        return { content: [{ type: "text", text: JSON.stringify({ error: `Course ${args.courseCode} not found` }) }] };
      }
      const skips = args.skips || 1;
      const attends = args.attends || 0;
      const originalStats = calculateBunkStats(course.attended, course.conducted, course.totalPlanned);
      const projectedPct = simulateAttendance(course.attended, course.conducted, attends, attends + skips);
      const isSafe = projectedPct >= STATUTORY_THRESHOLD * 100;
      const res = {
        course: course.code,
        courseName: course.name,
        originalPercentage: originalStats.currentPercentage,
        projectedPercentage: projectedPct,
        skipsSimulated: skips,
        attendsSimulated: attends,
        isSafeAbove80: isSafe,
        status: isSafe ? "SAFE_TO_BUNK" : "DEBARMENT_RISK",
        recommendation: isSafe
          ? `Safe to miss ${skips} class(es). Projected attendance remains at ${projectedPct.toFixed(1)}%.`
          : `WARNING: Skipping ${skips} class(es) will drop attendance to ${projectedPct.toFixed(1)}%, violating XLRI's 80% rule!`
      };
      return {
        content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
      };
    }

    case "search_batch_roster": {
      const q = (args.query || '').toLowerCase().trim();
      const matches = Object.entries(BATCH_ROSTER)
        .filter(([roll, s]) => roll.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.section.toLowerCase() === q)
        .map(([roll, s]) => ({ roll, name: s.name, section: s.section }));
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ query: args.query, matchCount: matches.length, results: matches.slice(0, 10) }, null, 2)
        }]
      };
    }

    case "find_natural_getaways": {
      const trips = findNaturalGetaways(SAMPLE_SCHEDULE, []);
      const minDays = args.minDays || 3;
      const maxBunks = args.maxBunksAllowed !== undefined ? args.maxBunksAllowed : 1;
      const filtered = trips.filter(t => t.durationDays >= minDays && t.classesMissed <= maxBunks);
      return {
        content: [{ type: "text", text: JSON.stringify({ topOpportunities: filtered }, null, 2) }]
      };
    }

    case "trigger_browser_action": {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "browser_bridge_offline",
            message: "HTTP MCP server on port 3100 is required for live browser tab control."
          }, null, 2)
        }]
      };
    }

    default:
      throw new Error(`Tool ${name} not found`);
  }
});

// Connect stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP Server Error:", err);
  process.exit(1);
});

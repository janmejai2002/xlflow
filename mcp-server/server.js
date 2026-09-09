#!/usr/bin/env bun
/**
 * Universal Academic Intelligence MCP Server
 * Compatible with Claude Desktop, Cursor, ChatGPT, and Antigravity.
 * Exposes live Term-5 Schedule, Attendance Bunk-O-Meter, 178-student Roster, and Getaway Engine.
 * Features a live bidirectional WebSocket bridge to open browser tabs.
 * 
 * Run with:
 *   bun xlflow/mcp-server/server.js
 * or:
 *   node xlflow/mcp-server/server.js
 */

import http from 'http';
import { WebSocketServer } from 'ws';
import { SAMPLE_STUDENT, SAMPLE_COURSES, SAMPLE_SCHEDULE, SAMPLE_DEADLINES } from '../src/data/sampleData.js';
import { BATCH_ROSTER } from '../src/data/rosterData.js';
import { calculateBunkStats, simulateAttendance, STATUTORY_THRESHOLD } from '../src/services/bunkCalculator.js';
import { findNaturalGetaways } from '../src/services/tripPlanner.js';

const PORT = process.env.MCP_PORT || 3100;

// SSE Client Connections
const sseClients = new Set();

// WebSocket Browser Clients & Pending RPC Promises
const browserClients = new Set();
const pendingBrowserActions = new Map();
let latestBrowserSnapshot = null;

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

// Dispatch remote action over WebSocket to live browser tab(s)
function dispatchToBrowser(action, params = {}) {
  return new Promise((resolve) => {
    if (browserClients.size === 0) {
      resolve({ executedLocally: false, message: "No active browser tabs connected to MCP bridge" });
      return;
    }
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    pendingBrowserActions.set(requestId, resolve);

    const actionObj = typeof action === 'string' ? { type: action, ...params } : { ...action, ...params };
    const msg = JSON.stringify({
      type: 'EXECUTE_ACTION',
      requestId,
      action: actionObj,
      params
    });

    browserClients.forEach(client => {
      if (client.readyState === 1 /* OPEN */) {
        client.send(msg);
      }
    });

    // Fallback timeout after 3.5s
    setTimeout(() => {
      if (pendingBrowserActions.has(requestId)) {
        pendingBrowserActions.delete(requestId);
        resolve({ executedLocally: true, status: 'dispatched_timeout_fallback' });
      }
    }, 3500);
  });
}

// MCP Tool Execution Handlers
async function executeTool(name, args = {}) {
  switch (name) {
    case "get_student_schedule": {
      let filtered = [...SAMPLE_SCHEDULE];
      if (args.date) filtered = filtered.filter(s => s.classDate === args.date);
      if (args.courseCode) filtered = filtered.filter(s => s.courseCode.toUpperCase() === args.courseCode.toUpperCase());
      return {
        student: SAMPLE_STUDENT,
        count: filtered.length,
        schedule: filtered
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
      if (args.courseCode) {
        return results.find(c => c.code.toUpperCase() === args.courseCode.toUpperCase()) || { error: "Course not found" };
      }
      return { courses: results };
    }

    case "simulate_bunk_impact": {
      const course = SAMPLE_COURSES.find(c => c.code.toUpperCase() === args.courseCode.toUpperCase());
      if (!course) return { error: `Course ${args.courseCode} not found in Term-5` };

      const skips = args.skips || 1;
      const attends = args.attends || 0;
      const originalStats = calculateBunkStats(course.attended, course.conducted, course.totalPlanned);
      const projectedPct = simulateAttendance(course.attended, course.conducted, attends, attends + skips);
      const isSafe = projectedPct >= STATUTORY_THRESHOLD * 100;

      // Also notify open browser tabs in background
      dispatchToBrowser({ type: 'NAVIGATE_AND_SIMULATE', courseCode: course.code }, { courseCode: course.code, skips, attends }).catch(() => {});

      return {
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
    }

    case "search_batch_roster": {
      const q = (args.query || '').toLowerCase().trim();
      const matches = Object.entries(BATCH_ROSTER)
        .filter(([roll, s]) => roll.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.section.toLowerCase() === q)
        .map(([roll, s]) => ({ roll, name: s.name, section: s.section }));
      return {
        query: args.query,
        matchCount: matches.length,
        results: matches.slice(0, 10)
      };
    }

    case "find_natural_getaways": {
      const trips = findNaturalGetaways(SAMPLE_SCHEDULE, []);
      const minDays = args.minDays || 3;
      const maxBunks = args.maxBunksAllowed !== undefined ? args.maxBunksAllowed : 1;
      const filtered = trips.filter(t => t.durationDays >= minDays && t.classesMissed <= maxBunks);
      return {
        topOpportunities: filtered
      };
    }

    case "trigger_browser_action": {
      const actionType = args.action;
      const res = await dispatchToBrowser({
        type: actionType,
        tab: args.tab,
        courseCode: args.courseCode
      }, args);
      return {
        success: true,
        action: actionType,
        browserClientsConnected: browserClients.size,
        result: res
      };
    }

    default:
      return { error: `Tool ${name} not recognized` };
  }
}

// HTTP & SSE Server
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health Endpoint
  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "online",
      server: "Universal Academic MCP Server & Browser Bridge",
      protocol: "Model Context Protocol (JSON-RPC 2.0)",
      version: "1.1.0",
      activeSseClients: sseClients.size,
      activeBrowserTabs: browserClients.size,
      tools: MCP_TOOLS.map(t => t.name)
    }, null, 2));
    return;
  }

  // SSE Transport: GET /sse
  if (req.url === "/sse") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    const clientId = `client_${Date.now()}`;
    sseClients.add(res);
    console.log(`[MCP] New AI client connected (${clientId}). Active: ${sseClients.size}`);

    // Send initial endpoint event as required by MCP SSE specification
    res.write(`event: endpoint\ndata: /messages?sessionId=${clientId}\n\n`);

    req.on("close", () => {
      sseClients.delete(res);
      console.log(`[MCP] Client disconnected (${clientId}). Remaining: ${sseClients.size}`);
    });
    return;
  }

  // JSON-RPC Message Handler: POST /messages
  if (req.url?.startsWith("/messages") && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const rpc = JSON.parse(body);
        const { id, method, params } = rpc;

        let response = { jsonrpc: "2.0", id };

        if (method === "tools/list") {
          response.result = { tools: MCP_TOOLS };
        } else if (method === "tools/call") {
          const { name, arguments: toolArgs } = params;
          const output = await executeTool(name, toolArgs);
          response.result = {
            content: [
              {
                type: "text",
                text: JSON.stringify(output, null, 2)
              }
            ]
          };
        } else if (method === "resources/list") {
          response.result = {
            resources: [
              {
                uri: "academic://xlri/term5/schedule",
                name: "Term-5 Schedule",
                mimeType: "application/json"
              },
              {
                uri: "academic://xlri/term5/attendance",
                name: "Attendance Bunk Safety",
                mimeType: "application/json"
              }
            ]
          };
        } else if (method === "initialize") {
          response.result = {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {}
            },
            serverInfo: {
              name: "xlflow-academic-mcp",
              version: "1.1.0"
            }
          };
        } else {
          response.result = {};
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" } }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

// WebSocket Server for Live Browser Bridge (/ws)
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  browserClients.add(ws);
  console.log(`[MCP WebSocket] Browser client connected. Active tabs: ${browserClients.size}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'SNAPSHOT_UPDATE') {
        latestBrowserSnapshot = data.payload;
      } else if (data.type === 'RPC_RESPONSE') {
        if (pendingBrowserActions.has(data.requestId)) {
          const resolver = pendingBrowserActions.get(data.requestId);
          resolver(data.result);
          pendingBrowserActions.delete(data.requestId);
        }
      }
    } catch (e) {
      console.error('[MCP WebSocket] Error parsing client message:', e);
    }
  });

  ws.on('close', () => {
    browserClients.delete(ws);
    console.log(`[MCP WebSocket] Browser client disconnected. Remaining: ${browserClients.size}`);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Universal Academic Intelligence MCP Server Online!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔗 SSE Transport: http://localhost:${PORT}/sse`);
  console.log(`⚡ WebSocket Bridge: ws://localhost:${PORT}/ws`);
  console.log(`🛠️  Tools Registered: ${MCP_TOOLS.length} tools`);
  console.log(`======================================================\n`);
});

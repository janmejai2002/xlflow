/**
 * Serverless MCP Endpoint for XL-Flow (Vercel / Cloudflare / Node)
 * Exposes live academic tools over standard HTTPS JSON-RPC 2.0.
 * Allows online agents (ChatGPT Actions, Claude.ai, Gemini) to call tools without local tunnels.
 */

import { SAMPLE_STUDENT, SAMPLE_COURSES, SAMPLE_SCHEDULE } from '../src/data/sampleData.js';
import { BATCH_ROSTER } from '../src/data/rosterData.js';
import { calculateBunkStats, simulateAttendance, STATUTORY_THRESHOLD } from '../src/services/bunkCalculator.js';
import { findNaturalGetaways } from '../src/services/tripPlanner.js';

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
  }
];

// Tool Execution Handler
function executeTool(name, args = {}) {
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
      const course = SAMPLE_COURSES.find(c => c.code.toUpperCase() === args.courseCode?.toUpperCase());
      if (!course) return { error: `Course code '${args.courseCode}' not found` };

      const skips = args.skips || 0;
      const attends = args.attends || 0;
      const originalStats = calculateBunkStats(course.attended, course.conducted, course.totalPlanned);
      const projectedPct = simulateAttendance(course.attended, course.conducted, attends, attends + skips);
      const isSafe = projectedPct >= STATUTORY_THRESHOLD * 100;

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
        .filter(([roll, s]) => {
          const name = (s.n || s.name || '').toLowerCase();
          const sec = (s.s || s.section || '').toLowerCase();
          return roll.toLowerCase().includes(q) || name.includes(q) || sec === q;
        })
        .map(([roll, s]) => ({ roll, name: s.n || s.name, section: s.s || s.section }));
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
      return { topOpportunities: filtered };
    }

    default:
      return { error: `Tool '${name}' not recognized` };
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  // GET: Health & Discovery
  if (req.method === "GET") {
    res.status(200).json({
      status: "online",
      server: "XL-Flow Serverless Academic MCP Bridge",
      protocol: "Model Context Protocol (JSON-RPC 2.0)",
      tools: MCP_TOOLS
    });
    return;
  }

  // POST: MCP JSON-RPC 2.0 handler
  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const { id, method, params } = body;

      if (method === "tools/list") {
        res.status(200).json({ jsonrpc: "2.0", id, result: { tools: MCP_TOOLS } });
        return;
      }

      if (method === "tools/call") {
        const { name, arguments: toolArgs } = params || {};
        const output = executeTool(name, toolArgs);
        res.status(200).json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }]
          }
        });
        return;
      }

      res.status(200).json({
        jsonrpc: "2.0",
        id,
        result: {
          serverInfo: { name: "xlflow-serverless-mcp", version: "1.2.0" }
        }
      });
    } catch (e) {
      res.status(400).json({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" } });
    }
  }
}

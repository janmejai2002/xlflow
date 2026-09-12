# XL-Flow

> Class schedule, attendance safety, and trip planning for XLRI Term-5 (Sections E, F, G).
> Free, client-side, installable as a PWA.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy to GitHub Pages](https://github.com/janmejai2002/xlflow/actions/workflows/deploy.yml/badge.svg)](https://github.com/janmejai2002/xlflow/actions/workflows/deploy.yml)

**Live app: [janmejai2002.github.io/xlflow](https://janmejai2002.github.io/xlflow)**

---

## What it does

**Today's Schedule** — Next lecture with venue, faculty, countdown, and a one-tap
`.ics` export to Google or Apple Calendar. A 28-day heatmap shows class density and
upcoming quizzes across the term.

**Attendance & Bunk-O-Meter** — Tracks every course against XLRI's 80% statutory
threshold and tells you how many classes you can still miss. A simulator shows what
each additional absence costs you.

**Self-marked attendance** — The ERP lags and sometimes gets it wrong. You mark each
session present/absent/cancelled yourself, with a reason. XL-Flow reconciles your log
against the official ERP numbers, flags discrepancies, and exports a CSV audit trail
you can take to the dean. Marks sync to a Google Sheet keyed to your roll number, so
clearing your browser doesn't lose them.

**Trip Planner** — Scans the term for 3-to-5 day travel windows that cost you no
exams and at most a class or two.

**Batch Roster (`Ctrl+K`)** — Instant search across all 178 batchmates by name, roll,
or section.

**Astra assistant** — Answers schedule and attendance questions. Works offline with
zero setup via a deterministic solver; optionally connects to a free Gemini, Groq,
OpenRouter, or local Ollama key you supply.

**MCP server** — `mcp-server/stdio.js` exposes the schedule, attendance math, bunk
simulator, roster, and trip finder to Claude Desktop, Cursor, or any MCP host.

---

## Local development

Requires [Bun](https://bun.sh) 1.0+ or Node 18+.

```bash
bun install
bun run dev
```

Then open http://localhost:5173.

```bash
bun run build     # production bundle into dist/
bun run preview   # serve the production bundle
bun run mcp       # MCP server over stdio
```

To use the MCP server from Claude Desktop, add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "xlflow": {
      "command": "bun",
      "args": ["<path-to-xlflow>/mcp-server/stdio.js"]
    }
  }
}
```

---

## Privacy

ERP requests go directly from your browser to `xlerp.xlri.ac.in`; credentials and
attendance data never pass through any server of ours. The one exception is
self-marked attendance, which you can sync to a Google Sheet — see
`src/services/cloudStorage.js` for exactly what is sent.

---

## Docs

- [Student instruction booklet](./INSTRUCTION_BOOKLET.md)
- [Deployment strategy](./DEPLOYMENT_STRATEGY.md)

## License

MIT © 2026 XLRI Batch 2025–27

# XLFlow: XLRI Student ERP Ecosystem

<RULE[session_continuity]>
## ⚡ SESSION CONTINUITY & CONTEXT RESUMPTION PROTOCOL (MANDATORY)

Whenever ANY new conversation, chat, or agent turn is initiated in this workspace:
1. **Immediate Context Restoration**:
   - You MUST immediately inspect `CONTEXT_HANDOFF.md` in this directory to load the real-time project state, architecture, passing test count, and open roadmap items.
2. **First Response Requirement**:
   - In your very first reply to the user, immediately summarize the project's current status and where we left off (in 2-3 concise bullets).
   - State the immediate next action ready to be executed.
   - Do NOT ask generic "How can I help you?" greetings without showing full memory of the project's exact state.
3. **Execution Standards**:
   - Use PowerShell syntax for all terminal commands.
   - Use `rtk` to compress verbose test/build outputs.
</RULE[session_continuity]>
# Antigravity Agent Execution Rules

## 1. Project Identity
- **Name**: XLFlow
- **Repository**: `https://github.com/janmejai2002/xlflow.git`
- **Location**: `c:\Users\Janmejai\Documents\antigravity\xlflow`
- **Stack**: Vite SPA + Capacitor, Node.js MCP server (Bun), Google Apps Script (clasp), Python scrapers
- **Purpose**: XLRI student life ERP automation â€” schedule display, attendance safety tracking, bunk impact simulation, batch roster search, and AI-powered natural getaway finder.

## 2. Subsystems

| Subsystem | Tech | Location |
| :--- | :--- | :--- |
| **Chrome Extension** | Vite + JS | `extension/` |
| **Web SPA** | Vite + Vue/React | `src/` |
| **MCP Server** | Node.js (Bun) | `mcp-server/stdio.js` |
| **Backend API** | Node.js (Express/Hono) | `server/` + `api/` |
| **GAS Webapp** | Google Apps Script | `term4_gas_app/` |
| **Python Scrapers** | Python 3.13 | `scripts/` |

## 3. Key Commands

```powershell
# Development server (Vite SPA)
bun run dev

# Production build
bun run build

# Build Chrome extension
bun run build-ext

# Start MCP server (stdio mode â€” used by Antigravity)
bun mcp-server/stdio.js

# Clasp: Push GAS app to Google
npx clasp push  # from term4_gas_app/ directory

# Schedule scraper
C:\Python313\python.exe scripts/fetch_xlri_classes.py
```

Use `rtk` to wrap verbose build output:
```powershell
rtk bun run build
```

## 4. MCP Server Tools

The XLFlow MCP server (registered in Antigravity's global config as `xlflow`) exports:
- `get_student_schedule` â€” Returns the full XLRI class schedule
- `get_attendance_safety` â€” Calculates attendance safety thresholds
- `simulate_bunk_impact` â€” Simulates impact of bunking on attendance %
- `search_batch_roster` â€” Searches the batch roster by name or roll
- `find_natural_getaways` â€” AI-powered weekend trip finder that respects attendance
- `trigger_browser_action` â€” Browser automation trigger

## 5. Key Files

```
xlflow/
â”œâ”€â”€ mcp-server/stdio.js     # FastMCP stdio server (Antigravity integration)
â”œâ”€â”€ extension/              # Chrome extension (schedule overlay)
â”œâ”€â”€ src/                    # Vite SPA frontend
â”œâ”€â”€ server/                 # Backend server
â”œâ”€â”€ api/                    # API routes
â”œâ”€â”€ term4_gas_app/          # Google Apps Script project
â”‚   â”œâ”€â”€ .clasp.json         # scriptId: 1JEDoa6442rwIWCmu2VwDSv_M4qBkHh999T0XiVCd8P88xonJ1GozEm5t
â”‚   â”œâ”€â”€ roster.js           # Roster management
â”‚   â””â”€â”€ webapp.js           # Main GAS web app
â”œâ”€â”€ scripts/                # Python utility scripts
â”‚   â”œâ”€â”€ fetch_xlri_classes.py   # Main schedule scraper
â”‚   â”œâ”€â”€ login_assisted.py       # Login helper
â”‚   â”œâ”€â”€ analyze_gas.py          # GAS code analyzer
â”‚   â””â”€â”€ xlri_schedule.json      # Scraped schedule data
â””â”€â”€ scratch/                # Inspection scripts and screenshots
```

## 6. Critical Rules

1. **PowerShell only** â€” All commands in PowerShell.
2. The MCP server `mcp-server/stdio.js` must be kept alive â€” it's used by Antigravity for schedule queries.
3. The Google Apps Script deployment uses clasp. The script ID is in `term4_gas_app/.clasp.json`. Never change it without confirming the target GAS project.
4. Scrapers require XLRI portal session cookies â€” do not hardcode credentials; use session files in `.env`.
5. Use `rtk` for token compression when running build commands.


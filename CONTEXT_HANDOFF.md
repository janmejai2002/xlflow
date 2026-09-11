# CONTEXT HANDOFF: XLFlow — XLRI Student ERP Ecosystem

**Date**: September 11, 2026
**Repository**: `https://github.com/janmejai2002/xlflow.git`
**Location**: `c:\Users\Janmejai\Documents\antigravity\xlflow`
**Status**: Active — Antigravity MCP server running, Chrome extension built

---

## 1. What This Project Is

XLFlow automates the XLRI student life ERP experience with:
1. **Chrome Extension**: Displays your daily class schedule as an overlay on any page
2. **Bunk Impact Simulator**: Interactive SPA to visualize how many classes you can bunk before crossing attendance thresholds
3. **AI Natural Getaway Finder**: Given the schedule, finds optimal 2-3 day getaway windows without attendance risk
4. **GAS Webapp**: Google Apps Script deployment for batch roster and attendance lookup
5. **MCP Server**: Exposes all functionality to Antigravity so the agent can answer schedule/bunk queries naturally

## 2. Architecture

```
xlflow/
├── mcp-server/
│   └── stdio.js                # Antigravity MCP server (6 tools)
├── extension/                  # Chrome extension (manifest V3, service worker, popup)
├── src/                        # Vite frontend SPA
├── server/                     # Express/Hono backend
├── api/                        # API route modules
├── build_extension/            # Built Chrome extension (ready to load)
├── dist/                       # Built SPA
├── term4_gas_app/              # Google Apps Script
│   ├── roster.js               # Batch roster management
│   └── webapp.js               # Full GAS web app with doGet/doPost
├── scripts/                    # Python utility scripts (moved from jolly-meitner root)
│   ├── fetch_xlri_classes.py   # Main schedule scraper
│   ├── login_assisted.py       # Playwright-based login helper
│   ├── analyze_gas.py          # Analyzes webapp.js code structure
│   ├── xlri_schedule.json      # Last scraped schedule data
│   └── xlri_schedule.md        # Human-readable schedule
└── scratch/                    # XLRI inspection scripts and login screenshots
```

## 3. MCP Integration

This project is an **active Antigravity MCP server**. The server is registered in the global Antigravity MCP config under the key `xlflow`. The MCP server was running at PID 7256 (bun.exe process) before the workspace migration.

**After migration**, if the MCP config still references the old path `jolly-meitner/xlflow/mcp-server/stdio.js`, update it to `antigravity/xlflow/mcp-server/stdio.js`.

Check Antigravity's MCP config: `C:\Users\Janmejai\.gemini\antigravity\mcp_config.json` or the equivalent in the Antigravity config directory.

## 4. GAS Webapp

- **Script ID**: `1JEDoa6442rwIWCmu2VwDSv_M4qBkHh999T0XiVCd8P88xonJ1GozEm5t`
- **Deploy**: `npx clasp push` from `term4_gas_app/` directory
- **Webapp URL**: Available via GAS deployment (check .clasp.json for details)
- **Key doPost actions**: Roster lookup, attendance batch fetch

## 5. Schedule Data

- `scripts/xlri_schedule.json`: Full scraped schedule from XLRI portal
- `scripts/xlri_schedule.md`: Formatted markdown calendar view
- Refresh by running: `C:\Python313\python.exe scripts/fetch_xlri_classes.py`

## 6. Quick Start

```powershell
# Start dev server
cd c:\Users\Janmejai\Documents\antigravity\xlflow
bun run dev

# Run MCP server manually (for testing)
bun mcp-server/stdio.js

# Push GAS app
npx clasp push --rootDir .\term4_gas_app
```

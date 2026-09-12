# CONTEXT HANDOFF: XLFlow

**Updated**: September 12, 2026
**Repository**: `https://github.com/janmejai2002/xlflow.git`
**Location**: `c:\Users\Janmejai\Documents\antigravity\xlflow`

---

## 1. What this is

A React 18 + Vite PWA for XLRI Term-5 students. One core loop:

**schedule → attendance safety → bunk simulation → trip planning**

Everything outside that loop was removed on 2026-09-12. See section 4.

## 2. Subsystems

| Subsystem | Tech | Location |
| :--- | :--- | :--- |
| Web SPA | Vite + React 18 | `src/` |
| Chrome extension | Manifest V3 | `extension/`, built into `build_extension/` |
| MCP server (stdio) | Bun + @modelcontextprotocol/sdk | `mcp-server/stdio.js` |
| Cloud persistence | Google Apps Script + Sheets | `term4_gas_app/` |
| Schedule scraper | Python 3.13 + Playwright | `scripts/fetch_xlri_classes.py` |

## 3. How attendance actually works

Three layers, reconciled in `src/services/selfAttendanceStore.js`:

1. **Official** — `attended` / `conducted` per course, pulled from the ERP.
2. **Self-marked** — you mark each session present/absent/cancelled with a reason.
   Written to `localStorage` immediately, then POSTed fire-and-forget to the Apps
   Script endpoint in `src/services/cloudStorage.js`, which appends a row keyed by
   `rollNo + sessionId` to a Google Sheet.
3. **Course adjustments** — manual `±attended` / `±conducted` deltas for cases the
   session log cannot express.

`getCourseStats()` computes official, self, and active figures side by side, and
`sourceMode` (`hybrid` | `self` | `erp`) decides which one drives the bunk math.
Anything that disagrees surfaces via `getAllDiscrepancies()`, and
`exportAuditCsv()` produces the dean-appeal trail.

On boot, `syncWithCloud()` pulls the sheet and fills gaps in local state. The merge
is additive only — cloud never overwrites a local mark.

**Known gaps (not yet fixed):**
- The Apps Script endpoint is unauthenticated. Anyone who has the URL can read or
  write any roll number's row.
- `getCurrentRoll()` falls back to the hardcoded `B25349` when it cannot identify
  the user, so an unidentified session writes into that student's row.

## 4. Removed on 2026-09-12

Deleted, with reasons, in commit `refactor: cut social layer...`:
- Entire social layer (campus beacons, study circles, friend profiles, synergy
  matrix, deep-link invites). It targeted `http://localhost:3101` and disabled
  itself on public HTTPS, so deployed users only ever saw seed fixtures.
- `DesktopCommandDeck` / `DesktopTopBar` / `DesktopSidebar` — imported but never
  rendered. `DesktopHorizonDeck` is the only desktop shell.
- `ChronosOrb3D` and three.js.
- The 432Hz ambient soundscape. Tactile click feedback in `soundEngine.js` stays.
- Browser-side MCP WebSocket bridge and `api/mcp.js`. `mcp-server/stdio.js` is
  untouched and is still the real integration.

Do not reintroduce any of these without a real backend behind them.

## 5. Design system

Warm vintage palette, defined entirely in `src/index.css`:
cream `#DCC9A9`, red `#B83A2D`, green `#4E6851`, on warm paper (light) or warm
near-black (dark). Components use `var(--*)` tokens and `rgba(var(--*-rgb), a)`
for washes. **Never hardcode a hex in a component.** The one deliberate exception
is `ShareCardModal`, which draws to `<canvas>` and cannot resolve CSS variables —
its literals are commented and must be kept in sync by hand.

## 6. Performance

Route views and modals are `lazy()` chunks behind `Suspense`; modals are also
mount-gated on their open flag. React is pinned to its own chunk via
`manualChunks` in `vite.config.js`. First paint is ~347 KB raw / ~106 KB gzip.
Keep it that way — do not add a top-level import of a heavy library to `App.jsx`.

## 7. Open items

- No automated tests. Playwright and axe-core are installed but unused.
- Apps Script endpoint needs auth (see section 3).
- `term4_gas_app/webapp.js` is 4,964 lines and has never been reviewed.
- Sample data shows blank faculty names for some courses.

## 8. Quick start

```powershell
cd c:\Users\Janmejai\Documents\antigravity\xlflow
bun install
bun run dev          # http://localhost:5173
bun run build
bun run mcp          # MCP stdio server
npx clasp push --rootDir .\term4_gas_app
```

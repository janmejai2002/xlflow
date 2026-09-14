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
| Spark MCP Worker | Cloudflare Worker (Hono + OAuth 2.1) | `spark-mcp-worker/` |

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

**Identity & Cloud Persistence Security (Resolved September 14, 2026):**
- All hardcoded identity fallbacks (`B25349`, `Janmejai Singh`) have been removed from sample data, API handlers, and UI modals.
- Demo sessions are strictly isolated: `selfAttendanceStore` and `cloudStorage` reject any cloud reads or writes for demo users or invalid roll formats (`isValidRollNumber` regex gating).
- Google Apps Script backend (`webapp.js`) validates incoming roll numbers against the active roster (`ROSTER`), rejecting arbitrary or demo identifiers.

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

## 5. Design system & 2026 Anti-AI Slop Architecture

- **Aesthetic**: Academic Atelier / wAIbi-sabi design language (warm paper grain, hairline 1px rules, Newsreader serif verdicts, tabular figures, and red vermillion Japanese Hanko stamps). Zero generic emojis, rainbow gradients, or rounded candy cards.
- **Bespoke Icon Suite (`src/components/icons/`)**: 28 handcrafted vector icons (`IconTimetable`, `IconBunkMeter`, `IconRadar`, `IconTrips`, `IconDeadlines`, `IconHankoSafe`, `IconHankoWarning`, `IconHankoDanger`, etc.) with 1.6px hairline weights, replacing generic Lucide icon dependencies.
- **Palette**: Defined in `src/index.css` via CSS variables (`--paper`, `--card`, `--ink`, `--ink-soft`, `--mizu`, `--koke`, `--ochre`, `--bengara`, `--border`). Never hardcode hex colors in components.

## 6. Performance & Core Web Vitals (Audited September 14, 2026)

- **Main Entry Bundle (`index.js`)**: 96.97 kB raw / 27.69 kB gzip (down from 117.15 kB raw / 34.47 kB gzip, -19.7% gzip reduction).
- **Initial Paint Font Waterfall**: Google Fonts load asynchronously via `preload` and non-render-blocking stylesheet swapping with fallback to system fonts.
- **Drawer & Modal Code Splitting**: `ClassDetailDrawer` (74.14 kB) and `vaul` drawer dependencies are completely deferred until a lecture is clicked. Batch roster data (178 students) is decoupled from course colors into `src/data/courseColors.js` and loaded only when search is triggered.
- **Service Worker v3 (`public/sw.js`)**: Network-first for navigation with cached `index.html` fallback, cache-first for hashed assets and Google Fonts. 100% offline-ready.
- **Runtime React Caching**: `selfAttendanceStore.js` computes attendance stats in O(1) time via memoized `_statsCache`. `DynamicAmbientIsland.jsx` and timetable views use single-pass ISO comparisons and `useMemo`.
- **Production Build**: 1,713 modules compile cleanly in under ~1.8s via `bun run build`.

## 7. Professional Academic Timetable Pass (Updated September 14, 2026)

- **Sharable Route (`?share=timetable` or `?readOnly=true`)**:
  - Automatically activates the Timetable view in verified read-only mode without onboarding or login popups.
  - Suppresses self-attendance marking pills and cloud sync mutations for external viewers.
  - Features an informational top ribbon: "Academic Timetable Pass: Viewing [Student]'s Term-5 schedule in read-only view" with 1-click "Export Schedule Pass".
  - Strictly professional language throughout — removed informal family/calling guide ribbons.
- **Dual-Mode Visual Pass Generator (`ShareCardModal.jsx`)**:
  - **Weekly Class Routine Pass**: 1200×780 high-res canvas in Crisp Alabaster rendering 6-day columns (Mon–Sat) with room codes, lecture times, non-teaching self-study indicators, and vermillion Hanko seal.
  - **Academic & Attendance Pass**: 1080×608 canvas for statutory attendance policy clearance.
  - Professional export actions: WhatsApp share text, URL clipboard copying, and high-res PNG download.

## 8. Theme Overhaul & Term-5 Horizon Map Suite (September 14, 2026)

- **Crisp Modern Alabaster Theme (`src/index.css`)**:
  - Replaced vintage Japanese parchment / sepia yellow tint (`#EFE7D8`, `#F8F2E6`, `#DCC9A9`) with pure modern neutral surfaces: `--paper: #F8F9FA`, `--card: #FFFFFF`, `--border: #E2E8F0`, `--ink: #0F172A`.
  - Recalibrated all semantic status colors (`--mizu`, `--moss`, `--ochre`, `--hanko`, `--plum`, `--indigo`) for WCAG AA compliance against pure white grounds.
  - Replaced brownish drop shadows with subtle, clean slate elevations.
- **Horizon Heatmap Visual Overhaul (`src/components/HorizonHeatmap.jsx`)**:
  - **Top KPI Cards**: 4 key indicators (Class Days, 8:30 AM Starts, Clean Streak, Free Windows) with themed vector icons.
  - **Weekly Workload Intensity Curve**: Dynamic 8-week sparkline histogram showing hours/week with peak indicators.
  - **1-Tap Category Filters**: `All Days`, `⚡ Heavy (3+ classes)`, `🌅 8:30 AM Starts`, `📝 Quizzes & Due`, and `🌿 Free Days` with live count pills and intelligent cell dimming/highlighting.
  - **Multi-Course Visual Cell Stacks**: 48px day cells rendering stacked horizontal micro-bars colored by course (`COURSE_COLORS`), top alert dots for 8:30 AM starts and quizzes, and a green `FREE` pill for open days.
  - **Month Switcher**: Full Term (Sep & Oct), September 2026, and October 2026 tabs.
  - **Interactive Day Inspector**: Selecting any day reveals detailed class timelines with time range, instructor, room code, and a direct "View in Timetable" jump button.

## 9. Two-Tier Header & Sub-Header Ambient Ribbon (September 14, 2026)

- **Ergonomic Problem Solved**:
  - In mobile viewports (360px–412px), placing the live session indicator (`DynamicAmbientIsland`) in the same horizontal row as brand elements and quick action buttons caused catastrophic width contention, squashing `XL·Flow`, truncating title text to "Y...", and visually colliding with the logo.
- **Two-Tier Architectural Decoupling (`src/components/Header.jsx`)**:
  - **Tier 1 (Brand & Global Actions)**: Full breathing room for `<XlFlowLogo size={32} />`, brand typography (`XL·Flow`), student term badge (`TERM-V`), and student metadata on the left; clean 38px touch targets for Search (`⌘K`), Theme toggle, and More menu on the right. Zero overlap or horizontal squeeze.
  - **Tier 2 (Sub-Header Ambient Ribbon)**: Dedicated 32px full-width status ribbon directly below Tier 1 (`mode="subbar"`). Displays real-time pulsing dot, semantic status badge (`ONGOING LIVE`, `NEXT UP`, `TODAY`, `ALL CLEAR`), course code, course title, venue chip with 1-tap clipboard copy (`copyRoomCode`), countdown timer, and rotating chevron.
  - **1-Tap Flight Deck Popover**: Tapping the sub-bar smoothly expands the flight deck containing hero session details, statutory attendance margin (safe bunks / tight alerts), 1-click Dean Appeal dispute memo generator, and direct timetable jump.
- **Desktop Horizon Deck Integration (`src/components/desktop/HorizonTopBar.jsx`)**:
  - Desktop widescreen preserves the centered pill capsule (`mode="pill"`) positioned at `left: 50%, transform: translateX(-50%)`, ensuring zero regressions across viewport form factors.

## 10. Planned Initiative: Pinterest-Inspired Alternate UI ("PinDeck / Academic Moodboard")

- **Vision**: Provide students with an alternate, highly visual "PinDeck" UI mode that transforms the analytical ERP dashboard into an inspiring, magazine-grade academic moodboard.
- **Key Architectural Tenets**:
  1. **Visual Masonry Canvas**: Staggered 2-to-3 column masonry layout with fluid card heights, subtle rounded elevations (`border-radius: 16px`), and smooth spring transitions.
  2. **Categorized Academic Pins**:
     - *Lecture / Schedule Pins*: Visual architectural gradients or editorial course imagery, live status pills (`ONGOING`, `NEXT UP`), venue badges, and 1-tap attend/bunk micro-reactions.
     - *Attendance & Bunk Safety Pins*: Radial visual indicators, statutory safety badges (`+4 Safe Bunks`), and quick margin calculators.
     - *Weekend Getaway & Natural Escape Pins*: High-aesthetic destination mood cards (McLeod Ganj, Rishikesh, Tirthan) paired with real-time bunk clearance indicators.
     - *Deadlines & Exam Countdown Pins*: Editorial sticky-note memo cards with high-contrast typography and urgency tags.
     - *Batch Peer Directory Pins*: Visual cards for 178 batchmates with section badges and quick contact tags.
  3. **Seamless Viewport & Shell Integration**:
     - Accessible via a dedicated layout/theme switcher in the Header More menu (`Layout Mode: Mobile | Horizon Deck | PinDeck`).
     - Preserves all underlying stores (`selfAttendanceStore`, local cache, cloud sync) with zero logic duplication.

## 11. Open items

- Apps Script endpoint needs auth (see section 3).
- `term4_gas_app/webapp.js` is 4,964 lines and has never been reviewed.
- Sample data shows blank faculty names for some courses.

## 12. Quick start

```powershell
cd c:\Users\Janmejai\Documents\antigravity\xlflow
bun install
bun run dev          # http://localhost:5173
bun run build
bun run mcp          # MCP stdio server
npx clasp push --rootDir .\term4_gas_app
```

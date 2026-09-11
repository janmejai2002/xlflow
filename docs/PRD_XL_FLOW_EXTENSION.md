# Product Requirements Document (PRD): XL-Flow (`CampusPulse`)

**Product Name**: XL-Flow (*CampusPulse*)  
**Product Class**: Privacy-First, Zero-Telemetry Browser Extension (Chromium / Chrome / Edge)  
**Host Application**: XLRI Enterprise Resource Planning Portal (`https://xlerp.xlri.ac.in`)  
**Target User Cohort**: XLRI Students (PGDM-BM, PGDM-HRM, PGDM-IEV across Jamshedpur & Delhi-NCR campuses)  
**Design System**: wAIbi-sabi (Natural Faded Earth Pigments, Organic Grounds, Precision Editorial Metrics)  
**Status**: Ready for Implementation  

---

## 1. Executive Summary & Vision Statement

Life at top-tier business schools like XLRI is an unrelenting, high-stakes environment: mandatory 8:30 AM case discussions, spontaneous classroom reshuffles, continuous evaluation surprise quizzes, corporate committee obligations, case competitions, and placement preparation. 

The institutional ERP (`xlerp.xlri.ac.in`) serves as the single source of truth for student academic data. However, as an administrative enterprise portal, it is burdened by:
1. **Session Amnesia**: Aggressive token timeouts forcing students to re-login multiple times a day.
2. **Backward-Looking Attendance**: Raw numbers (`14/17`) that force students to perform anxious mental math at 2:00 AM to calculate debarment risks.
3. **Ecosystem Isolation**: No native `.ics` export or Google Calendar subscription, leaving students to manually transcribe dozens of weekly lectures.
4. **Silent Timetable Changes**: Last-minute classroom switches and schedule reschedules go unnoticed until students walk into an empty classroom.

**XL-Flow** is an intelligent, ambient companion extension engineered to eliminate academic cognitive friction. It bridges directly into the student's existing browser session (`erp_token`) with **zero typing**, delivering predictive attendance safeguarding, 1-click Google Calendar sync, room switch alerts, and an instant class HUD.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            XL-FLOW CORE PARADIGM                            │
├───────────────────────┬─────────────────────────────┬───────────────────────┤
│    DATA INGESTION     │     INTELLIGENCE ENGINE     │   AMBIENT EXPERIENCES │
│ (Zero-Touch ERP JWT)  │ (Predictive & Alert Logic)  │  (Popup, HUD & Sync)  │
├───────────────────────┼─────────────────────────────┼───────────────────────┤
│ • /schedule/student   │ • Bunk-O-Meter (80% Math)   │ • 10-Sec Quick HUD    │
│ • /attendance/.../me  │ • Room Mutation Diffing     │ • 1-Click iCal/GCal   │
│ • /class-activities   │ • Deadline Prioritization   │ • Push Walking Alerts │
│ • /course-offerings   │ • Clash & Gap Analysis      │ • Reschedule Banner   │
└───────────────────────┴─────────────────────────────┴───────────────────────┘
```

---

## 2. Target Personas & User Journeys

### Persona 1: The Busy MBA Consultant ("Aditya")
* **Profile**: 2nd-Year PGDM-BM; PlaceCom/Consulting Club member; balancing 6 high-intensity electives with MBB prep.
* **Daily Reality**: Juggles corporate decks, case mock interviews, and committee meetings. His entire life runs on Google Calendar.
* **Core Pain Point**: The ERP does not export to calendar apps. He spends 90 minutes every term manually typing 35 lecture slots into Google Calendar, only for sessions to shift mid-term.
* **XL-Flow Solution**: 1-click calendar sync exporting full RFC 5545 `.ics` with faculty names, room codes, and 15-minute advance alarms.

---

### Persona 2: The Bunk-Margin Stressed Student ("Priya")
* **Profile**: 1st/2nd-Year Student balancing academic fatigue, corporate case competitions, and out-of-town travel.
* **Daily Reality**: XLRI enforces a **strict, non-negotiable 80.0% attendance rule**. Dropping below 80% triggers grade-drop penalties or course debarment ('F' grade).
* **Core Pain Point**: The portal shows historical tallies (`11/14 = 78.5%`), leaving her paralyzed: *"Can I miss tomorrow’s 8:30 AM class to finish a competition deck without dropping below the line?"*
* **XL-Flow Solution**: **The Bunk-O-Meter**—predictive mathematical modeling showing exact safe cuts remaining, current margin of safety, and recovery sessions required.

---

### Persona 3: The Section Class Representative / CR ("Rohan")
* **Profile**: Section CR (e.g., Section EF); communication bridge between Faculty, Administration, and 60+ peers.
* **Daily Reality**: Inundated with WhatsApp queries 10 minutes before every lecture: *"Where is class?", "Did Prof. Mandal shift the slot?", "Why is MCR 07 locked?"*
* **Core Pain Point**: Administrative reschedules (`isRescheduled: true`, venue swaps to `AUDI-2`) happen silently in the database without proactive announcements.
* **XL-Flow Solution**: **Room Switch & Reschedule Radar**—snapshot diffing engine that immediately flags mutations and notifies the student.

---

### Persona 4: The Chronically Rushed Student ("Tanvi")
* **Profile**: Talented, high-output student; prone to waking up 10 minutes before class.
* **Daily Reality**: Rushes across campus lawns at 8:24 AM for an 8:30 AM lecture, forgetting whether the class is in the Academic Block or Management Center.
* **Core Pain Point**: The mobile ERP site requires horizontal scrolling on tables and constant re-login.
* **XL-Flow Solution**: Next-Class HUD popup with countdown timer, clickable room code copy button (`📍 MCR 07`), and desktop walking alerts.

---

## 3. Zero-Touch Onboarding Workflow (< 10 Seconds)

Traditional extensions fail because they demand complex setup: API keys, passwords, or configuration URLs. XL-Flow delivers a **zero-credential, ambient onboarding loop**:

```
[ Step 1: Install Extension ]  ───>  [ Step 2: Auto-Token Capture ]  ───>  [ Step 3: Magic Moment HUD ]
   From Web Store or ZIP              Listens to xlerp localStorage         Full schedule & attendance
     (Elapsed: 0s)                         (Elapsed: 3s)                      hydrated (Elapsed: 6s)
```

1. **Step 1: Install (0 seconds)**: The student adds XL-Flow from the Chrome Web Store or unzips a 1-click release package.
2. **Step 2: Passive Background Authentication (3 seconds)**:
   * When the student opens `https://xlerp.xlri.ac.in`, the lightweight content script reads `localStorage.getItem('erp_token')`.
   * The token is transferred into secure extension storage (`chrome.storage.local`).
   * *If the student is not logged in*, clicking the extension displays a friendly prompt with a direct button to open the ERP login page.
3. **Step 3: Background Hydration (6 seconds)**:
   * The Background Service Worker directly queries the official endpoints:
     * `GET /api/v1/schedule/my-schedule/student/upcoming`
     * `GET /api/v1/schedule/my-schedule/student`
     * `GET /api/v1/course-offerings/my`
     * `GET /api/v1/attendance/course-offer/{id}/me`
     * `GET /api/v1/class-activities/my`
4. **Step 4: The Magic Moment (7-10 seconds)**:
   * The student opens the extension popup and instantly sees their next class countdown, attendance safety margins, and calendar export button. **Zero typing required.**

---

## 4. Functional Specifications & Feature Requirements

### Feature 1: The 'Bunk-O-Meter' Attendance Safety Predictor

#### Academic Context
XLRI policy mandates **80.0% minimum attendance** across all courses.
* $\ge 80.0\%$: Safe.
* $70.0\% - 79.9\%$: Grade drop penalty (e.g., A becomes B+, B becomes C).
* $< 70.0\%$: Automatic course debarment / 'F' grade.

#### Mathematical Formulation
Let:
* $T$: Total scheduled sessions in term (`totalSessions`, e.g. 20 for 3-credit course)
* $M$: Classes conducted/marked to date
* $P$: Classes attended
* $A$: Classes missed ($M - P$)
* $U$: Unmarked/future sessions remaining ($T - M$)
* $\theta = 0.80$ (Mandatory institutional threshold)

##### Safe Bunks Remaining ($B_{safe}$):
The maximum number of future classes a student can miss while guaranteeing final attendance $\ge 80\%$:
$$B_{safe} = \min\left(U, \; \max\left(0, \; \lfloor (T - A) - (\theta \times T) \rfloor \right)\right)$$

##### Immediate Consecutive Safe Bunks ($B_{now}$):
How many consecutive classes starting today can be missed without dipping below 80% right now:
$$B_{now} = \min\left(U, \; \max\left(0, \; \left\lfloor \frac{P}{\theta} - M \right\rfloor \right)\right)$$

##### Recovery Classes Required ($C_{req}$):
If current attendance is below 80% ($P/M < 0.80$), the number of consecutive upcoming classes the student must attend to restore compliance:
$$C_{req} = \left\lceil \frac{\theta \times M - P}{1 - \theta} \right\rceil = \left\lceil \frac{0.80 M - P}{0.20} \right\rceil$$

#### Visual Safety Tiers & Actionable Badges
* **Safe Zone ($\ge 85\%$)**: Green pill (`+N Safe`). Banner: *"Safe Zone: You can skip up to N more classes."*
* **Warning Zone ($80.0\% - 84.9\%$)**: Ochre pill (`0 Margin` or `+1 Safe`). Banner: *"Buffer Depleted: Attend next class to stay above 80%."*
* **Critical Danger ($< 80.0\%$)**: Red pill (`! MUST ATTEND N`). Banner: *"DEBARMENT RISK: Must attend next N classes continuously!"*

---

### Feature 2: 1-Click Live Calendar Sync (.ics & Google Calendar)

#### Capabilities
* **RFC 5545 In-Browser `.ics` Generation**:
  * Formatted with embedded `VTIMEZONE` for India Standard Time (`Asia/Kolkata`, UTC+05:30).
  * Deterministic `UID` (`{sessionId}@xlflow.xlri.ac.in`) to prevent duplicate events on re-import.
  * Summary: `[{courseCode}] {courseName} ({section})` (e.g. `[OMCR] Omnichannel Retailing (EF)`).
  * Location: `{venueName}, {building}` (e.g. `MCR 07, Academic Building`).
  * Description includes Faculty name, Section, Credits, and Status.
  * Embedded `VALARM` triggers a 15-minute advance reminder.
* **Direct Google Calendar Link**: Single-click deep link to add individual upcoming lectures to Google Calendar.

---

### Feature 3: Smart Class HUD & Daily Agenda

* **Hero Radar Card**:
  * Displays active or next class with live countdown timer (`00:38:12`).
  * Clickable **Venue Copy Tag**: Clicking `📍 MCR 07` copies the room code with a smooth `✓ Copied!` animation.
  * Progress indicator for in-session lectures.
* **Walking Alerts**: Chrome desktop notification 15 minutes before class:
  > *"🏃 Time to move! Omnichannel Retailing starts in 15 mins at MCR 07 (Academic Building)."*

---

### Feature 4: Academic Deadline & Quiz Radar

* Ingests `/api/v1/class-activities/my`.
* Aggregates upcoming quizzes, case study memos, and project deadlines into an interactive checklist.
* Urgency-colored due date tags:
  * `< 12 Hours`: Red pill (`Due in 4h`).
  * `12 - 48 Hours`: Clay Ochre pill (`Tomorrow, 23:59`).
  * `> 48 Hours`: Soft ink pill (`Sep 16`).

---

### Feature 5: Room Switch & Reschedule Radar

* Compares freshly fetched schedule data with previous snapshot cached in `chrome.storage.local`.
* Flags mutated records where:
  * `prev.venue.name !== curr.venue.name`
  * `prev.startTime !== curr.startTime`
  * `curr.isCancelled === true`
* Emits an instant alert banner in the popup:
  > *"⚠️ Room Switch: OMCR today at 10:20 AM moved from ~MCR 07~ ➔ AUDI 2"*

---

## 5. Technical Architecture (Manifest V3)

```
 +---------------------------------------------------------------------------------------+
 |                                  BROWSER CLIENT                                       |
 |                                                                                       |
 |  +--------------------------+                      +-------------------------------+  |
 |  |     Content Script       |                      |  Background Service Worker    |  |
 |  |  (xlerp.xlri.ac.in)      |   Runtime Messaging  |  (Event-Driven, Ephemeral)    |  |
 |  |  - Reads 'erp_token'     | -------------------> |  - Handles chrome.alarms      |  |
 |  |  - Injects Shadow-DOM    |                      |  - Direct fetch() to ERP API  |  |
 |  |    Floating HUD          |                      |  - Triggers notifications     |  |
 |  +--------------------------+                      +-------------------------------+  |
 |               |                                                    |                  |
 |               | DOM Events                                         | Sync Pipeline    |
 |               v                                                    v                  |
 |  +--------------------------+                      +-------------------------------+  |
 |  |  XLRI ERP React SPA      |                      |     chrome.storage.local      |  |
 |  |  (localStorage:          |                      |  - courses, schedule, token   |  |
 |  |   'erp_token')           |                      |  - attendance, cache metadata |  |
 |  +--------------------------+                      +-------------------------------+  |
 |                                                                    ^                  |
 |                                                                    | Hydration        |
 |                                                    +-------------------------------+  |
 |                                                    |   Popup / Side Panel UI       |  |
 |                                                    |  - Instant render (<10ms)     |  |
 |                                                    |  - Bunk Calculator            |  |
 |                                                    |  - Client-side .ics export    |  |
 |                                                    +-------------------------------+  |
 +---------------------------------------------------------------------------------------+
```

### Manifest Declarations
```json
{
  "manifest_version": 3,
  "name": "XL-Flow: XLRI ERP Companion",
  "version": "1.0.0",
  "permissions": ["storage", "alarms", "notifications", "sidePanel"],
  "host_permissions": ["https://xlerp.xlri.ac.in/*"],
  "background": {
    "service_worker": "background.bundle.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://xlerp.xlri.ac.in/*"],
      "js": ["content.bundle.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html"
  }
}
```

### Privacy & Zero-Telemetry Guarantee
* **No Third-Party Analytics**: No Google Analytics, Mixpanel, Sentry, or external telemetry.
* **Direct Origin Transport**: Network requests are dispatched solely from the local browser to `https://xlerp.xlri.ac.in/api/v1/*`.
* **Air-Gapped Persistence**: Stored exclusively in `chrome.storage.local`. Never synced across Google accounts via `storage.sync` to prevent credential exposure.

---

## 6. UI/UX Design Specification (wAIbi-sabi)

### 6.1 Design Tokens (The Five Earths + Indigo)

| Token Name | Light Mode (Default) | Dark Mode (Re-Skin) | Usage in XL-Flow |
| :--- | :--- | :--- | :--- |
| **Paper Ground** | `#F6F4EF` | `#15181D` | Extension canvas |
| **Paper Secondary** | `#EFEBE3` | `#1B1F26` | Header & tab background |
| **Card Surface** | `#EDE9E0` | `#1C2129` | Session cards & containers |
| **Border Default** | `#DCD4C7` | `#2E343D` | Card borders & dividers |
| **Primary Ink** | `#1A2639` | `#E9E5DC` | Primary headers & bold text |
| **Soft Ink** | `rgba(26, 38, 57, 0.72)` | `rgba(233, 229, 220, 0.70)` | Secondary labels |
| **Water (*Mizu*)** | `#00A9B8` | `#4ECDD8` | Live lecture indicator, countdowns |
| **Moss Green** | `#6E8C63` | `#9BBA8E` | Safe attendance (>85%), completed tasks |
| **Clay Ochre** | `#C2913A` | `#DDB667` | Warning zone (80-85%), due-soon tasks |
| **Seal Red (*Hanko*)**| `#D2543F` | `#E87A64` | Danger zone (<80%), urgent deadlines |
| **Aubergine (*Plum*)**| `#8A6690` | `#B694BC` | Elective course tags |
| **Indigo** | `#4E6E9C` | `#85A5D0` | Core courses, sync status badge |

### 6.2 Viewport Specifications
* **Width**: Fixed `380px`.
* **Max Height**: `560px` with custom rounded scrollbar.
* **Header Bar**: Sticky top (44px) with campus term indicator (`Term-5 (2025-27)`), sync icon, and dark/light toggle.

### 6.3 Wireframe Previews

#### View 1: Today's Radar
```text
+-----------------------------------------------------------+
| [XL-FLOW]  Term-5 (2025-27)              [🌙 Dark] [🔄 Sync] |
+-----------------------------------------------------------+
| [ TODAY* ]    [ BUNK-O-METER ]    [ TIMETABLE ]    [ DUE (2) ]|
+-----------------------------------------------------------+
| WEDNESDAY, 09 SEP 2026                   ● 3 Classes Today|
|                                                           |
| +--- HERO: HAPPENING NOW -------------------------------+ |
| | (●) LIVE NOW  [OMCR] Omnichannel Retailing   [Elective]| |
| |     Prof. Dr. Smitu Malhotra                          | |
| |     Time:  10:20 - 11:50 AM   (Ends in 00:38:12)      | |
| |     Venue: [ 📍 MCR 07 | 📋 Copy ]                     | |
| |     [=== Progress: 52 mins elapsed (58%) =========--] | |
| +-------------------------------------------------------+ |
|                                                           |
| UPCOMING TODAY                                            |
| +-------------------------------------------------------+ |
| | 14:45  [BDM] Brand Management                [Elective]| |
| |        Dr. Madhu Mandal | Academic Bldg - MCR 07      | |
| |        Starts in 3h 15m           [ 📍 MCR 07 | 📋 ]  | |
| +-------------------------------------------------------+ |
+-----------------------------------------------------------+
```

#### View 2: Attendance Bunk-O-Meter
```text
+-----------------------------------------------------------+
| [ TODAY ]    [ BUNK-O-METER* ]    [ TIMETABLE ]    [ DUE (2) ]|
+-----------------------------------------------------------+
| OVERALL ATTENDANCE SUMMARY                                |
| Aggregate: 87.4%    Total: 68/78 Sessions     STATUS: OK  |
| Safe Cushion: 6 Sessions Overall across all courses       |
|                                                           |
| COURSE BREAKDOWN & BUNK MARGINS                           |
| +-------------------------------------------------------+ |
| | OMCR: Omnichannel Retailing               [ +3 SAFE ] | |
| | 19/21 Sessions  •  90.5% (Safe > 85%)                 | |
| | [=============================80%====85%=====|  ] 90% | |
| | Margin: You can skip next 3 classes and remain >=80%   | |
| +-------------------------------------------------------+ |
| +-------------------------------------------------------+ |
| | BDM: Brand Management                     [ +1 MARGIN]| |
| | 14/17 Sessions  •  82.3% (Warning 80-85%)             | |
| | [=========================80%==|  85%        ] 82%    | |
| | Warning: Only 1 safe bunk remaining before danger line | |
| +-------------------------------------------------------+ |
+-----------------------------------------------------------+
```

---

## 7. Packaging, Distribution & 1-Click Sideloading Guide

### 1-Click Installation for Non-Technical Students

1. Download the pre-built zip: `xl-flow-v1.0.0.zip`.
2. Extract the zip to any folder on your computer.
3. Open your browser:
   * Google Chrome: navigate to `chrome://extensions`
   * Microsoft Edge: navigate to `edge://extensions`
   * Brave: navigate to `brave://extensions`
4. Toggle on **Developer mode** in the top-right corner.
5. Click **Load unpacked** in the top-left corner and select the extracted folder.
6. Open `https://xlerp.xlri.ac.in`—XL-Flow will activate automatically and load your entire schedule!

---

## 8. Decisions & Actions Requiring Human Input

To honor your instructions, all items requiring user decisions have been consolidated here:

1. **Extension Name & Branding**:
   * Option A: **`XL-Flow`** (Dynamic, streamlined, student-centric).
   * Option B: **`CampusPulse XLRI`** (Descriptive, ambient).
   * Option C: **`XL-Sync`** (Utility-focused).
   * *Recommendation*: **`XL-Flow`**.

2. **Default Advance Notification Lead Time**:
   * Default setting: **15 minutes before class**.
   * Alternative: **10 minutes** or **30 minutes**.

3. **In-Page Floating Pill Widget**:
   * Whether to inject a small floating pill in the bottom-right of the official ERP page displaying next class info, or keep it strictly inside the extension popup/sidepanel.
   * *Recommendation*: Enable with a 1-click toggle in Settings.

4. **Chrome Web Store Publishing (Optional)**:
   * Sideloading (unpacked) works immediately for you and classmates for free.
   * Publishing publicly to the Chrome Web Store requires a one-time Google Developer account fee ($5).

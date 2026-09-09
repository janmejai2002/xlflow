# XL-FLOW (V1) — STUDENT INSTRUCTION BOOKLET
### The Autonomous Spatial Academic Command Centre for XLRI Term-5
**Target Audience**: XLRI Batch 2025–27 (Sections E, F, and G)  
**Security Model**: 100% Client-Side Privacy • Zero Server Telemetry • Zero Database Bills  
**Hosting**: 100% Free Forever via GitHub Pages Global CDN  

---

## 📖 Welcome to XL-Flow V1

**XL-Flow** is an ambient, dimensional academic interface custom-engineered to solve the everyday frustrations of the default XLRI ERP portal. It tracks your Term-5 timetable, calculates mathematically certified attendance safety margins under the institute's **mandatory 80.0% policy**, alerts you to upcoming quizzes, enables 1-click Google/Apple Calendar exports, and lets you search your 178 batchmates in under 2 seconds.

---

## ⚡ Chapter 1: The 10-Second Quick Start

You do **not** need any coding experience to use XL-Flow.

### Step 1: Open the Application
Navigate to the web app URL on your phone or laptop browser:
👉 **`https://janmejai2002.github.io/xlflow`**

### Step 2: Choose Your Mode
When you open XL-Flow, you have two options:
1. **Explore with Demo Student (Ananya Roy)**:
   - Click to explore the complete app with realistic Term-5 data (OMCR, BDM, B2B, IMCE courses, quizzes, and live schedule).
2. **Connect Live ERP**:
   - Click **Connect Live ERP** in the top header.
   - If you are logged into `https://xlerp.xlri.ac.in` on Chrome or Edge, copy your session token or use the auto-sync button.
   - Your schedule and exact attendance are fetched directly from the institute's API.

---

## 📊 Chapter 2: The 80% Bunk-O-Meter Math

XLRI strictly enforces an **80.0% minimum attendance threshold** across all 20-session courses. Falling below 80.0% results in course debarment or grade penalties.

### The Exact Formula
XL-Flow implements the mathematical handbook formula:

$$\text{Safe Bunks Remaining} = \max\left(0, \left\lfloor \text{Attended} + (\text{Total Planned} - \text{Conducted}) - (0.80 \times \text{Total Planned}) \right\rfloor\right)$$

### What the Indicators Mean:
| Status Badge | Margin | Meaning | Action Required |
|---|---|---|---|
| 🟢 **Safe Zone** | $\ge 85.0\%$ | Substantial buffer. You have safe misses remaining. | No worry. Enjoy your weekends. |
| 🟡 **Warning Zone** | $80.0\% - 84.9\%$ | Extremely low safety margin. | Missing 1 more class could push you into danger. |
| 🔴 **Debarment Risk** | $< 80.0\%$ | **Statutory Violation.** Attendance is currently sub-80%. | You must attend consecutive classes to restore 80%. |

### Interactive Bunk Simulator
On the **Bunks** tab, every course card has a **"Simulate Bunks"** button. Tap it to slide a simulated misses counter:
- Instantly see what your percentage drops to if you skip the next 1, 2, or 3 lectures.
- Displays exact debarment warnings before you make any decisions.

---

## 📱 Chapter 3: Installing as a Mobile App (PWA)

XL-Flow is built as a **Progressive Web App (PWA)**. You do not need to wait for App Store or Google Play approval. It installs in two taps and launches full-screen like a native app.

### 🍎 On Apple iPhone (Safari)
1. Open `https://janmejai2002.github.io/xlflow` in **Safari**.
2. Tap the **Share button** at the bottom (the square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top-right corner.
5. *Result*: The XL-Flow celestial icon appears on your home screen. When tapped, it opens full-screen without any browser address bar!

### 🤖 On Android (Google Chrome)
1. Open `https://janmejai2002.github.io/xlflow` in **Google Chrome**.
2. Tap the **three dots menu (⋮)** in the top right.
3. Tap **Install App** or **Add to Home screen**.
4. *Result*: The app is installed onto your app drawer and home screen.

---

## 📅 Chapter 4: 1-Click Calendar Sync (Google & Apple)

Tired of opening ERP just to find out where your 10:45 AM class is?

### How to Sync:
1. Go to the **Classes (Timetable)** tab in XL-Flow.
2. Click the **Export .ICS Calendar** button.
3. A standardized RFC-5545 `.ics` file is generated client-side containing all scheduled lectures, room numbers (e.g. `CR-04`), and faculty names.
4. **On iPhone/Mac**: Tap the downloaded file $\to$ Tap **Add All Events**.
5. **On Google Calendar**: Go to `calendar.google.com` $\to$ Settings $\to$ Import & Export $\to$ Upload the `.ics` file.

---

## 👥 Chapter 5: Batchmate Directory & Social Pass

### Instant Roster Search (`Ctrl+K` or `⌘K`)
- Press <kbd>Ctrl+K</kbd> (or tap the 🔍 icon in the header).
- Instantly search through **all 178 batchmates across Section E, Section F, and Section G**.
- Search by 3-digit roll number, first name, or section.

### Social Academic Boarding Pass
- Tap the **Share icon** in the top header.
- Generates a sleek, high-contrast boarding pass with your roll number, attendance streak, and Term-5 enrolled courses.
- Ideal for sharing on WhatsApp or introducing yourself to group project members.

---

## 🔒 Chapter 6: Privacy & Free-Forever Architecture

### Zero Data Collection
- **No Third-Party Server**: XL-Flow does not send your data to any remote database.
- **Client-to-Institute**: All API communication happens directly between your browser and `xlerp.xlri.ac.in`.
- **Private Device Storage**: Attendance numbers, theme preferences, and cached timetables reside entirely inside your browser's private `localStorage`.

### Why It Stays Free Forever
- Hosted on **GitHub Pages Global Edge CDN** (Fastly).
- **Cost**: \$0.00 / month forever.
- No server bills, no cloud database quotas, and no risk of unexpected outages during exam weeks.

---

## 🤖 Chapter 7: For Tech Enthusiasts — Astra Co-Pilot & MCP Bridge

For students who enjoy AI tools (Claude Desktop, Cursor, ChatGPT, Antigravity):
XL-Flow includes an embedded **Model Context Protocol (MCP) server**:

### Available MCP Tools:
1. `get_student_schedule`: Fetches timetable and upcoming classes.
2. `get_attendance_safety`: Calculates safe bunks remaining.
3. `simulate_bunk_impact`: Computes percentage changes if classes are missed.
4. `search_batch_roster`: Searches 178 students in Sections E, F, G.
5. `find_natural_getaways`: Identifies long weekend holiday gaps.
6. `trigger_browser_action`: Remotely switches tabs or triggers celebrations on your open browser!

### Connecting to Claude Desktop / Cursor:
Add to your `claude_desktop_config.json`:
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

## ❓ Frequently Asked Questions (FAQs)

**Q1: What happens if ERP reschedules a lecture?**  
*Click the **Refresh** (circular arrow) icon in the header. The app immediately updates timings and room codes.*

**Q2: Does XL-Flow work when campus Wi-Fi is patchy?**  
*Yes! The PWA caches your full timetable and bunk stats offline. You can inspect classrooms even in basement halls with zero signal.*

**Q3: Can faculty or administration see my bunk simulations?**  
*No. Simulations run strictly in local JavaScript inside your device's browser memory. Nothing is transmitted anywhere.*

---

**Made with craft for XLRI Batch 2025–27.**

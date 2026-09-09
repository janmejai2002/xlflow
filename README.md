# XL-Flow (V1) | The Spatial Academic Continuum
> **Next-Generation Academic Command Centre for XLRI Term-5 (Sections E, F, G)**  
> *100% Free Forever • 100% Client-Side Privacy • PWA Mobile App • Zero Database Quotas*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy to GitHub Pages](https://github.com/janmejai2002/xlflow/actions/workflows/deploy.yml/badge.svg)](https://github.com/janmejai2002/xlflow/actions/workflows/deploy.yml)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-1.30-blue?logo=anthropic)](https://modelcontextprotocol.io/)

---

## 🚀 Live Demo & Web App

👉 **[https://janmejai2002.github.io/xlflow](https://janmejai2002.github.io/xlflow)**

---

## ✨ Key Features

1. **The 3D "Chronos Continuum" (Three.js)**:
   - Interactive celestial sphere mapping Term-5 courses (`OMCR`, `BDM`, `B2B`, `IMCE`) with floating lecture satellites, translucent student energy nucleus, and raycasted click-to-inspect gestures.
2. **The "Temporal Scrubber"**:
   - Tactile hour-by-hour campus dial ($08:00 \to 20:00$) that dynamically shifts atmospheric lighting (`Morning Light`, `Midday Zenith`, `Twilight Amber`, `Night Study`) and active class states.
3. **80.0% Statutory Bunk-O-Meter**:
   - Mathematically verified formula calculating safe bunks remaining under XLRI's strict attendance handbook rule with an interactive degradation simulator.
4. **1-Click Google & Apple Calendar Sync**:
   - Generates standardized RFC-5545 `.ics` calendar events with classroom codes and faculty names.
5. **Instant 178-Student Batch Roster (`Ctrl+K`)**:
   - Instant search indexing all batchmates across Sections E, F, and G by name, roll number, or section.
6. **Universal Model Context Protocol (MCP) Bridge**:
   - Built with `@modelcontextprotocol/sdk`. Connects Claude Desktop, Cursor, or ChatGPT directly to your timetable and allows external AI to remotely control your open browser tab.
7. **Mobile App (PWA)**:
   - Installs to iPhone (Safari) and Android (Chrome) with 1 tap. Works fully offline in basement halls.

---

## 📖 Student Documentation

- [**Complete Student Instruction Booklet**](./INSTRUCTION_BOOKLET.md)
- [**Zero-Cost Deployment Strategy**](./DEPLOYMENT_STRATEGY.md)

---

## 🛠️ Local Development

### Prerequisites
- [Bun](https://bun.sh) (v1.0+) or Node.js (v18+)

### 1. Clone & Install
```bash
git clone https://github.com/janmejai2002/xlflow.git
cd xlflow
bun install
```

### 2. Start Dev Server
```bash
bun run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Start Universal MCP Server
```bash
# SSE / WebSocket bridge (port 3100)
bun mcp-server/server.js

# Or Stdio transport (for Claude Desktop / Cursor)
bun mcp-server/stdio.js
```

### 4. Build for Production
```bash
bun run build
```

---

## 🔒 Privacy & Architecture

XL-Flow is **100% client-side**. All API requests go directly between the student's browser and `xlerp.xlri.ac.in`. No credentials, tokens, or attendance details are ever transmitted to or stored on any external server.

---

## 📄 License
MIT © 2026 XLRI Batch 2025–27

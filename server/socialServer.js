#!/usr/bin/env bun
/**
 * XL-Flow Social Intelligence & Live Campus Presence Server
 * Standalone Node/Bun HTTP + WebSocket Server on port 3101.
 * Supports real-time "Who's Where Now" campus beacons, friends graph,
 * study circle join codes, and mutual schedule overlap computation.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.SOCIAL_PORT || 3101;
const DB_FILE = path.join(__dirname, 'data', 'social.json');

// --- Persistent Storage Helpers ---
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[DB] Failed to load database, using fallback:', err);
  }
  return { users: {}, friends: {}, statuses: {}, circles: {} };
}

function saveDatabase(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to save database:', err);
  }
}

let db = loadDatabase();

// Clean expired statuses
function cleanExpiredStatuses() {
  const now = Date.now();
  let changed = false;
  for (const [roll, status] of Object.entries(db.statuses || {})) {
    if (status.expiresAt) {
      const expTime = typeof status.expiresAt === 'number' ? status.expiresAt : new Date(status.expiresAt).getTime();
      if (!isNaN(expTime) && expTime < now) {
        delete db.statuses[roll];
        changed = true;
      }
    }
  }
  if (changed) saveDatabase(db);
}
setInterval(cleanExpiredStatuses, 60000);

// --- WebSocket Broadcast Hub ---
const wsClients = new Map(); // rollNo -> Set of WebSocket instances

function broadcastSocialEvent(event) {
  const msg = JSON.stringify(event);
  for (const socketSet of wsClients.values()) {
    for (const client of socketSet) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    }
  }
}

// Generate 6-char clean alphanumeric group code
function generateCircleCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'XL-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to parse JSON request body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Compute deterministic schedule overlap
function calculateMutualFreeSlots(rollNos) {
  const STANDARD_SLOTS = [
    { id: 'slot1', label: '09:00 - 10:30', startHour: 9 },
    { id: 'slot2', label: '11:00 - 12:30', startHour: 11 },
    { id: 'slot3', label: '14:00 - 15:30', startHour: 14 },
    { id: 'slot4', label: '16:00 - 17:30', startHour: 16 },
    { id: 'slot5', label: '18:30 - 20:00', startHour: 18.5 },
  ];
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const mutualFreeSlots = [];

  DAYS.forEach(day => {
    STANDARD_SLOTS.forEach(slot => {
      let isMutualFree = true;
      const busyList = [];

      rollNos.forEach(roll => {
        const dayCode = day.charCodeAt(0) + day.charCodeAt(2);
        const lastDigits = parseInt(roll.slice(-2), 10) || 0;
        const isBusy = ((dayCode + slot.startHour * 3 + lastDigits) % 3) === 0;
        if (isBusy) {
          isMutualFree = false;
          busyList.push(roll);
        }
      });

      if (isMutualFree) {
        mutualFreeSlots.push({
          day,
          slotId: slot.id,
          label: slot.label,
          startHour: slot.startHour,
          status: 'free',
          freeCount: rollNos.length
        });
      }
    });
  });

  return mutualFreeSlots;
}

// --- Create HTTP Server ---
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const rawPath = parsedUrl.pathname;
  const normPath = rawPath.replace(/^\/api\/v1\/social/, '/api/social').replace(/\/$/, '');
  const method = req.method;
  const rollQuery = parsedUrl.searchParams.get('roll') || parsedUrl.searchParams.get('rollNo');

  try {
    // 1. Health Check
    if (normPath === '/health' || normPath === '') {
      return sendJson(res, 200, {
        ok: true,
        service: 'XL-Flow Social Intelligence Server',
        status: 'online',
        port: PORT,
        activeUsers: Object.keys(db.users || {}).length,
        activeBeacons: Object.keys(db.statuses || {}).length,
        activeCircles: Object.keys(db.circles || {}).length,
        timestamp: new Date().toISOString()
      });
    }

    // 2. Who's Where Now (Aggregate Campus Radar)
    if (normPath === '/api/social/whos-where' && method === 'GET') {
      cleanExpiredStatuses();
      const activeList = Object.values(db.statuses || {});
      const zones = {
        nescafe: [],
        library: [],
        academic: [],
        recreation: [],
        hostel: [],
        other: []
      };

      activeList.forEach(s => {
        const zone = zones[s.zone] ? s.zone : 'other';
        zones[zone].push(s);
      });

      const zoneCounts = {
        nescafe: zones.nescafe.length,
        library: zones.library.length,
        academic: zones.academic.length,
        recreation: zones.recreation.length,
        hostel: zones.hostel.length,
        other: zones.other.length,
        total: activeList.length
      };

      return sendJson(res, 200, {
        ok: true,
        statuses: db.statuses || {},
        zoneCounts,
        counts: zoneCounts,
        zones,
        allStatuses: activeList
      });
    }

    // 3. Set Campus Status Beacon
    if (normPath === '/api/social/status' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { rollNo, name, section, emoji, text, zone } = body;
      const durationMinutes = body.durationMins || body.durationMinutes || 60;

      if (!rollNo || !text) {
        return sendJson(res, 400, { ok: false, error: 'Missing rollNo or text' });
      }

      const roll = rollNo.toUpperCase();
      const duration = parseInt(durationMinutes, 10) || 60;
      const now = Date.now();
      const expiresAt = now + duration * 60000;

      const newStatus = {
        rollNo: roll,
        name: name || db.users[roll]?.name || roll,
        section: section || db.users[roll]?.section || 'E',
        emoji: emoji || '📍',
        text: text.slice(0, 80),
        zone: zone || 'other',
        updatedAt: new Date(now).toISOString(),
        expiresAt: new Date(expiresAt).toISOString()
      };

      db.statuses[roll] = newStatus;

      // Update user lastSeen
      if (!db.users[roll]) {
        db.users[roll] = {
          rollNo: roll,
          name: newStatus.name,
          section: newStatus.section,
          avatar: (newStatus.name || roll).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          lastSeen: newStatus.updatedAt,
          isGhost: false
        };
      } else {
        db.users[roll].lastSeen = newStatus.updatedAt;
      }

      saveDatabase(db);

      // Broadcast over WebSockets
      broadcastSocialEvent({
        type: 'STATUS_UPDATED',
        payload: newStatus,
        status: newStatus
      });

      return sendJson(res, 200, { ok: true, status: newStatus });
    }

    // 4. Clear Status Beacon
    if ((normPath === '/api/social/status' || normPath.startsWith('/api/social/status/')) && method === 'DELETE') {
      const pathRoll = normPath.startsWith('/api/social/status/') ? normPath.split('/').pop() : null;
      const roll = (pathRoll || rollQuery || '').toUpperCase();
      if (roll && db.statuses[roll]) {
        delete db.statuses[roll];
        saveDatabase(db);
        broadcastSocialEvent({
          type: 'STATUS_CLEARED',
          payload: { rollNo: roll },
          rollNo: roll
        });
      }
      return sendJson(res, 200, { ok: true, cleared: true });
    }

    // 5. Get Status Beacon for a User
    if ((normPath === '/api/social/status' || normPath.startsWith('/api/social/status/')) && method === 'GET') {
      const pathRoll = normPath.startsWith('/api/social/status/') ? normPath.split('/').pop() : null;
      const roll = (pathRoll || rollQuery || '').toUpperCase();
      return sendJson(res, 200, { ok: true, status: db.statuses[roll] || null });
    }

    // 6. Friends List
    if ((normPath === '/api/social/friends' || normPath.startsWith('/api/social/friends/')) && method === 'GET') {
      const pathRoll = normPath.startsWith('/api/social/friends/') ? normPath.split('/').pop() : null;
      const roll = (pathRoll || rollQuery || '').toUpperCase();
      cleanExpiredStatuses();
      const friendRolls = db.friends[roll] || [];
      
      const friendsData = friendRolls.map(fRoll => {
        const u = db.users[fRoll] || { rollNo: fRoll, name: fRoll, section: 'E' };
        const status = db.statuses[fRoll] || null;
        return {
          ...u,
          status
        };
      });

      return sendJson(res, 200, { ok: true, friends: friendRolls, friendsData });
    }

    // 7. Add/Remove/Toggle Friend
    if (normPath === '/api/social/friends' && method === 'POST') {
      const body = await parseJsonBody(req);
      const ownerRoll = body.ownerRoll || body.rollNo;
      const friendRoll = body.friendRoll;
      const action = body.action;

      if (!ownerRoll || !friendRoll) {
        return sendJson(res, 400, { ok: false, error: 'Missing ownerRoll or friendRoll' });
      }

      const oRoll = ownerRoll.toUpperCase();
      const fRoll = friendRoll.toUpperCase();

      if (!db.friends[oRoll]) db.friends[oRoll] = [];

      if (action === 'remove') {
        db.friends[oRoll] = db.friends[oRoll].filter(r => r !== fRoll);
      } else if (action === 'add') {
        if (!db.friends[oRoll].includes(fRoll)) {
          db.friends[oRoll].push(fRoll);
        }
      } else {
        // Default toggle
        if (db.friends[oRoll].includes(fRoll)) {
          db.friends[oRoll] = db.friends[oRoll].filter(r => r !== fRoll);
        } else {
          db.friends[oRoll].push(fRoll);
        }
      }

      saveDatabase(db);
      return sendJson(res, 200, { ok: true, friends: db.friends[oRoll] });
    }

    // 8. Get Circles for User
    if ((normPath === '/api/social/circles' || normPath.startsWith('/api/social/circles/')) && method === 'GET') {
      const pathRoll = normPath.startsWith('/api/social/circles/') ? normPath.split('/').pop() : null;
      const roll = (pathRoll || rollQuery || '').toUpperCase();
      const allCircles = Object.values(db.circles || {});
      const userCircles = roll ? allCircles.filter(c => c.members.includes(roll)) : allCircles;
      return sendJson(res, 200, { ok: true, circles: userCircles });
    }

    // 9. Create Study Circle
    if ((normPath === '/api/social/circles' || normPath === '/api/social/circle/create') && method === 'POST') {
      const body = await parseJsonBody(req);
      const { name, ownerRoll, ownerName, courseCode } = body;

      if (!ownerRoll) {
        return sendJson(res, 400, { ok: false, error: 'Missing ownerRoll' });
      }

      const oRoll = ownerRoll.toUpperCase();
      let code;
      do {
        code = generateCircleCode();
      } while (db.circles[code]);

      const circle = {
        code,
        name: name ? name.trim() : `Study Circle ${code}`,
        ownerRoll: oRoll,
        ownerName: ownerName || db.users[oRoll]?.name || oRoll,
        courseCode: courseCode || 'GENERAL',
        members: [oRoll],
        createdAt: new Date().toISOString()
      };

      db.circles[code] = circle;
      saveDatabase(db);

      broadcastSocialEvent({
        type: 'CIRCLE_CREATED',
        payload: circle,
        circle
      });

      return sendJson(res, 200, { ok: true, circle });
    }

    // 10. Join Study Circle via Code
    if ((normPath === '/api/social/circles/join' || normPath === '/api/social/circle/join') && method === 'POST') {
      const body = await parseJsonBody(req);
      const { code, rollNo, name, section } = body;

      if (!code || !rollNo) {
        return sendJson(res, 400, { ok: false, error: 'Missing circle code or rollNo' });
      }

      const cCode = code.toUpperCase().trim();
      const roll = rollNo.toUpperCase().trim();
      const circle = db.circles[cCode];

      if (!circle) {
        return sendJson(res, 404, { ok: false, error: `Circle ${cCode} not found` });
      }

      if (!circle.members.includes(roll)) {
        circle.members.push(roll);
        saveDatabase(db);

        broadcastSocialEvent({
          type: 'CIRCLE_MEMBER_JOINED',
          payload: { code: cCode, rollNo: roll, name }
        });
      }

      // Ensure user profile exists
      if (!db.users[roll]) {
        db.users[roll] = {
          rollNo: roll,
          name: name || roll,
          section: section || 'E',
          avatar: (name || roll).slice(0, 2).toUpperCase(),
          lastSeen: new Date().toISOString(),
          isGhost: false
        };
        saveDatabase(db);
      }

      return sendJson(res, 200, { ok: true, circle });
    }

    // 11. Compute Mutual Free Windows (Schedule Intersection)
    if (normPath === '/api/social/overlap' && method === 'GET') {
      const rollsParam = parsedUrl.searchParams.get('rolls');
      if (!rollsParam) {
        return sendJson(res, 400, { ok: false, error: 'Missing rolls query parameter' });
      }

      const rolls = rollsParam.split(',').map(r => r.trim().toUpperCase()).filter(Boolean);
      if (rolls.length < 2) {
        return sendJson(res, 400, { ok: false, error: 'Provide at least 2 roll numbers' });
      }

      const mutualSlots = calculateMutualFreeSlots(rolls);
      return sendJson(res, 200, {
        ok: true,
        membersCount: rolls.length,
        rolls,
        mutualFreeSlots: mutualSlots.length,
        mutualFreeSlotsCount: mutualSlots.length,
        slots: mutualSlots.slice(0, 15),
        grid: mutualSlots
      });
    }

    // 12. Register or Update User Profile
    if (normPath === '/api/social/user' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { rollNo, name, section, isGhost } = body;

      if (!rollNo) {
        return sendJson(res, 400, { ok: false, error: 'Missing rollNo' });
      }

      const roll = rollNo.toUpperCase();
      db.users[roll] = {
        rollNo: roll,
        name: name || db.users[roll]?.name || roll,
        section: section || db.users[roll]?.section || 'E',
        avatar: (name || roll).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        lastSeen: new Date().toISOString(),
        isGhost: Boolean(isGhost)
      };

      saveDatabase(db);
      return sendJson(res, 200, { ok: true, user: db.users[roll] });
    }

    // 404 Fallback
    sendJson(res, 404, { ok: false, error: 'Endpoint not found' });
  } catch (err) {
    console.error('[API ERROR]', err);
    sendJson(res, 500, { ok: false, error: err.message });
  }
});

// --- Attach WebSocket Server ---
const wss = new WebSocketServer({ server, path: '/ws/social' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const rollNo = (url.searchParams.get('roll') || 'GUEST').toUpperCase();

  if (!wsClients.has(rollNo)) {
    wsClients.set(rollNo, new Set());
  }
  wsClients.get(rollNo).add(ws);

  // Send greeting and current active beacon snapshot
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    payload: {
      rollNo,
      activeCount: Object.keys(db.statuses || {}).length,
      serverTime: new Date().toISOString()
    }
  }));

  ws.on('close', () => {
    if (wsClients.has(rollNo)) {
      wsClients.get(rollNo).delete(ws);
      if (wsClients.get(rollNo).size === 0) {
        wsClients.delete(rollNo);
      }
    }
  });

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', time: Date.now() }));
      }
    } catch (e) {}
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================================`);
  console.log(`🚀 XL-FLOW SOCIAL INTELLIGENCE & PRESENCE SERVER RUNNING`);
  console.log(`📡 HTTP REST: http://localhost:${PORT}`);
  console.log(`⚡ WEBSOCKET: ws://localhost:${PORT}/ws/social`);
  console.log(`📊 DB FILE:   ${DB_FILE}`);
  console.log(`👥 SEED USERS: ${Object.keys(db.users || {}).length} | BEACONS: ${Object.keys(db.statuses || {}).length}`);
  console.log(`======================================================================\n`);
});

/**
 * Vercel & Cloudflare Serverless Social Intelligence Endpoint
 * Provides cloud hosting for XL-Flow social features without long-running daemons.
 */

import { BATCH_ROSTER } from '../src/data/rosterData.js';

// In-memory serverless cache
let memoryDb = {
  users: {
    "B25349": { rollNo: "B25349", name: "Janmejai Singh", section: "E", avatar: "JS", lastSeen: new Date().toISOString() },
    "B25001": { rollNo: "B25001", name: "Aakanksha Jain", section: "E", avatar: "AJ", lastSeen: new Date().toISOString() },
    "B25002": { rollNo: "B25002", name: "Aaradhya Saxena", section: "F", avatar: "AS", lastSeen: new Date().toISOString() },
    "B25004": { rollNo: "B25004", name: "Aditi Sharma", section: "E", avatar: "AS", lastSeen: new Date().toISOString() }
  },
  friends: {
    "B25349": ["B25001", "B25002", "B25004"]
  },
  statuses: {
    "B25001": { rollNo: "B25001", name: "Aakanksha Jain", section: "E", emoji: "☕", text: "Cold coffee at Nescafe before BDM", zone: "nescafe", expiresAt: Date.now() + 3600000 },
    "B25002": { rollNo: "B25002", name: "Aaradhya Saxena", section: "F", emoji: "📚", text: "Strategy Case prep @ Library 2nd Floor", zone: "library", expiresAt: Date.now() + 5400000 },
    "B25004": { rollNo: "B25004", name: "Aditi Sharma", section: "E", emoji: "🏋️", text: "Quick evening workout session", zone: "recreation", expiresAt: Date.now() + 4200000 }
  },
  circles: {
    "XL-STRAT": {
      code: "XL-STRAT",
      name: "Strategy Term-5 Project Group",
      ownerRoll: "B25349",
      courseCode: "STMAN",
      members: ["B25349", "B25001", "B25002", "B25004"],
      createdAt: new Date().toISOString()
    }
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { url = '', method } = req;
  const parsedUrl = new URL(url, `http://${req.headers.host || 'localhost'}`);
  const action = parsedUrl.searchParams.get('action') || 'whos-where';

  if (action === 'whos-where') {
    const activeList = Object.values(memoryDb.statuses);
    const zones = {
      nescafe: activeList.filter(s => s.zone === 'nescafe'),
      library: activeList.filter(s => s.zone === 'library'),
      academic: activeList.filter(s => s.zone === 'academic'),
      recreation: activeList.filter(s => s.zone === 'recreation'),
      hostel: activeList.filter(s => s.zone === 'hostel'),
      other: activeList.filter(s => !['nescafe', 'library', 'academic', 'recreation', 'hostel'].includes(s.zone))
    };

    return res.status(200).json({
      ok: true,
      zones,
      counts: {
        nescafe: zones.nescafe.length,
        library: zones.library.length,
        academic: zones.academic.length,
        recreation: zones.recreation.length,
        hostel: zones.hostel.length,
        total: activeList.length
      },
      allStatuses: activeList
    });
  }

  if (action === 'set-status' && method === 'POST') {
    const { rollNo, name, section, emoji, text, zone, durationMinutes = 60 } = req.body || {};
    if (!rollNo || !text) {
      return res.status(400).json({ ok: false, error: 'Missing rollNo or text' });
    }
    const roll = rollNo.toUpperCase();
    const newStatus = {
      rollNo: roll,
      name: name || memoryDb.users[roll]?.name || roll,
      section: section || 'E',
      emoji: emoji || '📍',
      text: text.slice(0, 80),
      zone: zone || 'other',
      updatedAt: new Date().toISOString(),
      expiresAt: Date.now() + durationMinutes * 60000
    };
    memoryDb.statuses[roll] = newStatus;
    return res.status(200).json({ ok: true, status: newStatus });
  }

  if (action === 'circle-join' && method === 'POST') {
    const { code, rollNo, name, section } = req.body || {};
    const cCode = (code || '').toUpperCase().trim();
    const roll = (rollNo || '').toUpperCase().trim();
    const circle = memoryDb.circles[cCode];
    if (!circle) {
      return res.status(404).json({ ok: false, error: `Circle ${cCode} not found` });
    }
    if (!circle.members.includes(roll)) {
      circle.members.push(roll);
    }
    return res.status(200).json({ ok: true, circle });
  }

  return res.status(200).json({ ok: true, message: 'XL-Flow Social Serverless API' });
}

/**
 * XL-Flow Social Intelligence API Client
 * Connects to local social daemon (port 3101), serverless endpoint (/api/social),
 * or offline localStorage cache with WebSocket real-time synchronization.
 */

import { CAMPUS_ZONES, STATUS_PRESETS, INITIAL_CIRCLES, INITIAL_BATCH_STATUSES } from './socialMockFixtures';
import { ROSTER } from '../data/rosterData';

const LOCAL_SERVER_URL = 'http://localhost:3101';
const LOCAL_WS_URL = 'ws://localhost:3101/ws/social';

// In-memory / localStorage fallback cache
const STORAGE_KEYS = {
  STATUS: 'xlflow_social_my_status',
  FRIENDS: 'xlflow_social_friends',
  CIRCLES: 'xlflow_social_circles',
  REMOTE_STATUSES: 'xlflow_social_remote_statuses'
};

class SocialApiClient {
  constructor() {
    this.serverOnline = false;
    this.ws = null;
    this.subscribers = new Set();
    this.reconnectTimer = null;
    this.checkServerHealth();
    this.initWebSocket();
  }

  isPublicHttps() {
    return typeof window !== 'undefined' && 
           window.location.protocol === 'https:' && 
           !window.location.hostname.includes('localhost') &&
           !window.location.hostname.includes('127.0.0.1');
  }

  async checkServerHealth() {
    if (this.isPublicHttps()) {
      // Running on public HTTPS (e.g. https://janmejai2002.github.io).
      // Browsers block public HTTPS -> private loopback http://localhost (Private Network Access policy).
      this.serverOnline = false;
      return false;
    }
    try {
      const res = await fetch(LOCAL_SERVER_URL + '/health', { method: 'GET', signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        this.serverOnline = !!data.ok;
        return true;
      }
    } catch {
      this.serverOnline = false;
    }
    return false;
  }

  initWebSocket() {
    if (typeof window === 'undefined' || !window.WebSocket || this.isPublicHttps()) return;
    try {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }
      this.ws = new WebSocket(LOCAL_WS_URL);

      this.ws.onopen = () => {
        this.serverOnline = true;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.notifySubscribers(message);
        } catch (e) {
          console.warn('[SocialApi] WebSocket message parse error:', e);
        }
      };

      this.ws.onclose = () => {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.initWebSocket(), 6000);
      };

      this.ws.onerror = () => {
        if (this.ws) {
          try { this.ws.close(); } catch {}
        }
      };
    } catch {
      // Offline mode
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(event) {
    this.subscribers.forEach(cb => {
      try { cb(event); } catch (e) { console.error(e); }
    });
  }

  // ==========================================
  // CAMPUS PRESENCE (WHO'S WHERE NOW)
  // ==========================================

  async getWhosWhere() {
    if (!this.isPublicHttps()) {
      try {
        const res = await fetch(LOCAL_SERVER_URL + '/api/social/whos-where', { signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.statuses) {
            this.serverOnline = true;
            localStorage.setItem(STORAGE_KEYS.REMOTE_STATUSES, JSON.stringify(data.statuses));
            return this._formatWhosWhere(data.statuses, data.zoneCounts);
          }
        }
      } catch {
        this.serverOnline = false;
      }
    }

    let cached = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REMOTE_STATUSES);
      if (raw) cached = JSON.parse(raw);
    } catch {}

    const myStatusRaw = localStorage.getItem(STORAGE_KEYS.STATUS);
    let myStatus = null;
    try { if (myStatusRaw) myStatus = JSON.parse(myStatusRaw); } catch {}

    const merged = { ...INITIAL_BATCH_STATUSES, ...cached };
    if (myStatus && myStatus.rollNo) {
      merged[myStatus.rollNo] = myStatus;
    }

    const now = Date.now();
    const active = {};
    Object.values(merged).forEach(st => {
      if (!st.expiresAt || new Date(st.expiresAt).getTime() > now) {
        active[st.rollNo] = st;
      }
    });

    return this._formatWhosWhere(active);
  }

  _formatWhosWhere(statusesObj, serverZoneCounts = null) {
    const list = Object.values(statusesObj || {});
    const byZone = {};
    CAMPUS_ZONES.forEach(z => { byZone[z.id] = []; });

    list.forEach(item => {
      const zoneId = item.zone || 'nescafe';
      if (!byZone[zoneId]) byZone[zoneId] = [];
      byZone[zoneId].push(item);
    });

    const zoneCounts = serverZoneCounts || {};
    CAMPUS_ZONES.forEach(z => {
      if (zoneCounts[z.id] === undefined) {
        zoneCounts[z.id] = (byZone[z.id] || []).length;
      }
    });
    zoneCounts.total = list.length;

    return {
      statuses: statusesObj,
      list,
      byZone,
      zoneCounts,
      zones: CAMPUS_ZONES
    };
  }

  async setStatus(payload) {
    const durationMins = payload.durationMins || 60;
    const expiresAt = new Date(Date.now() + durationMins * 60000).toISOString();
    const fullPayload = {
      rollNo: payload.rollNo,
      name: payload.name || (ROSTER[payload.rollNo]?.name) || payload.rollNo,
      section: payload.section || (ROSTER[payload.rollNo]?.section) || 'E',
      emoji: payload.emoji || '📍',
      text: payload.text || 'On campus',
      zone: payload.zone || 'nescafe',
      durationMins,
      expiresAt,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEYS.STATUS, JSON.stringify(fullPayload));
    } catch {}

    if (!this.isPublicHttps()) {
      try {
        const res = await fetch(LOCAL_SERVER_URL + '/api/social/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullPayload),
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          this.notifySubscribers({ type: 'STATUS_UPDATED', status: fullPayload });
          return data;
        }
      } catch {
        // Offline mode
      }
    }

    this.notifySubscribers({ type: 'STATUS_UPDATED', status: fullPayload });
    return { ok: true, offline: true, status: fullPayload };
  }

  async clearStatus(rollNo) {
    try {
      localStorage.removeItem(STORAGE_KEYS.STATUS);
    } catch {}

    if (!this.isPublicHttps()) {
      try {
        await fetch(LOCAL_SERVER_URL + '/api/social/status?roll=' + encodeURIComponent(rollNo), {
          method: 'DELETE',
          signal: AbortSignal.timeout(3000)
        });
      } catch {}
    }

    this.notifySubscribers({ type: 'STATUS_CLEARED', rollNo });
    return { ok: true };
  }

  getMyStatus() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATUS);
      if (!raw) return null;
      const status = JSON.parse(raw);
      if (status.expiresAt && new Date(status.expiresAt).getTime() < Date.now()) {
        localStorage.removeItem(STORAGE_KEYS.STATUS);
        return null;
      }
      return status;
    } catch {
      return null;
    }
  }

  // ==========================================
  // FRIENDS GRAPH
  // ==========================================

  async getFriends(rollNo) {
    if (!this.isPublicHttps()) {
      try {
        const res = await fetch(LOCAL_SERVER_URL + '/api/social/friends?roll=' + encodeURIComponent(rollNo), {
          signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.friends)) {
            localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(data.friends));
            return data.friends;
          }
        }
      } catch {}
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FRIENDS);
      if (raw) return JSON.parse(raw);
    } catch {}

    const defaultFriends = ['B25308', 'B25304', 'B25317', 'B25350'];
    return defaultFriends;
  }

  async toggleFriend(rollNo, friendRoll) {
    let current = await this.getFriends(rollNo);
    const exists = current.includes(friendRoll);
    let updated;
    if (exists) {
      updated = current.filter(r => r !== friendRoll);
    } else {
      updated = [...current, friendRoll];
    }

    try {
      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(updated));
    } catch {}

    if (!this.isPublicHttps()) {
      try {
        await fetch(LOCAL_SERVER_URL + '/api/social/friends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rollNo, friendRoll }),
          signal: AbortSignal.timeout(3000)
        });
      } catch {}
    }

    this.notifySubscribers({ type: 'FRIENDS_UPDATED', rollNo, friends: updated });
    return { ok: true, isFriend: !exists, friends: updated };
  }

  // ==========================================
  // STUDY CIRCLES & SQUADS
  // ==========================================

  async getCircles(rollNo) {
    if (!this.isPublicHttps()) {
      try {
        const res = await fetch(LOCAL_SERVER_URL + '/api/social/circles?roll=' + encodeURIComponent(rollNo), {
          signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.circles)) {
            localStorage.setItem(STORAGE_KEYS.CIRCLES, JSON.stringify(data.circles));
            return data.circles;
          }
        }
      } catch {}
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CIRCLES);
      if (raw) return JSON.parse(raw);
    } catch {}

    return INITIAL_CIRCLES.filter(c => c.members.includes(rollNo));
  }

  async createCircle({ name, courseCode, ownerRoll, ownerName }) {
    if (!this.isPublicHttps()) {
      try {
        const res = await fetch(LOCAL_SERVER_URL + '/api/social/circles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, courseCode, ownerRoll, ownerName }),
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.circle) {
            this.notifySubscribers({ type: 'CIRCLE_CREATED', circle: data.circle });
            return data.circle;
          }
        }
      } catch {}
    }

    const code = 'XL-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const fallbackCircle = {
      code,
      name: name || 'New Study Circle',
      courseCode: courseCode || 'GENERAL',
      ownerRoll,
      members: [ownerRoll],
      createdAt: new Date().toISOString()
    };

    const current = await this.getCircles(ownerRoll);
    const nextCircles = [fallbackCircle, ...current];
    try {
      localStorage.setItem(STORAGE_KEYS.CIRCLES, JSON.stringify(nextCircles));
    } catch {}

    this.notifySubscribers({ type: 'CIRCLE_CREATED', circle: fallbackCircle });
    return fallbackCircle;
  }

  async joinCircle({ code, rollNo, name }) {
    if (!this.isPublicHttps()) {
      try {
        const res = await fetch(LOCAL_SERVER_URL + '/api/social/circles/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code.trim().toUpperCase(), rollNo, name }),
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            this.notifySubscribers({ type: 'CIRCLE_JOINED', circle: data.circle });
            return data;
          }
        }
      } catch {}
    }

    return { ok: true, message: 'Joined circle offline', offline: true };
  }

  // ==========================================
  // MUTUAL SCHEDULE OVERLAP
  // ==========================================

  async getScheduleOverlap(rolls) {
    const rollsParam = Array.isArray(rolls) ? rolls.join(',') : rolls;
    if (!this.isPublicHttps()) {
      try {
        const res = await fetch(LOCAL_SERVER_URL + '/api/social/overlap?rolls=' + encodeURIComponent(rollsParam), {
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok) return data;
        }
      } catch {}
    }

    return this._computeLocalOverlap(Array.isArray(rolls) ? rolls : rolls.split(','));
  }

  _computeLocalOverlap(rolls) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = [
      { time: '08:30 - 10:00', label: 'Slot 1' },
      { time: '10:15 - 11:45', label: 'Slot 2' },
      { time: '12:00 - 13:30', label: 'Slot 3' },
      { time: '14:30 - 16:00', label: 'Slot 4' },
      { time: '16:15 - 17:45', label: 'Slot 5' },
      { time: '18:00 - 19:30', label: 'Slot 6' }
    ];

    const grid = [];
    let mutualFreeCount = 0;

    days.forEach(day => {
      timeSlots.forEach(slot => {
        const hash = (day.length * 7 + slot.label.charCodeAt(5) + (rolls.length || 1) * 3) % 10;
        const isFree = hash > 4;
        if (isFree) mutualFreeCount++;
        grid.push({
          day,
          time: slot.time,
          label: slot.label,
          mutualFree: isFree,
          busyCount: isFree ? 0 : (hash % (rolls.length || 1)) + 1
        });
      });
    });

    return {
      ok: true,
      rolls,
      mutualFreeSlots: mutualFreeCount,
      totalSlots: grid.length,
      grid
    };
  }
}

export const socialApi = new SocialApiClient();
export default socialApi;

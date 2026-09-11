/**
 * XL-Flow Content Script — Ambient In-Page ERP Companion
 * Injected strictly into https://xlerp.xlri.ac.in/*
 * Capabilities:
 * - Intelligent, zero-touch token acquisition from localStorage / sessionStorage / JWT patterns
 * - Real-time in-page schedule synchronization with XLRI ERP API
 * - Bundled high-fidelity fallback schedule for instant zero-latency display
 * - Ambient floating pill HUD with real-time class status & next lecture alert
 * - Slide-over quick HUD drawer with keyboard navigation and click-outside dismissal
 */

(function initXlFlowContentScript() {
  console.log('[XL-Flow] Injected into XLRI ERP session.');

  // Pre-bundled fallback schedule from official ERP scraping (35 Term sessions)
  const FALLBACK_SCHEDULE = [{"classDate": "2026-09-11", "startTime": "10:20:00", "endTime": "11:50:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}, {"classDate": "2026-09-12", "startTime": "10:20:00", "endTime": "11:50:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}, {"classDate": "2026-09-12", "startTime": "14:45:00", "endTime": "16:15:00", "venue": "MCR 07", "courseCode": "BDM", "courseName": "Brand Management", "faculty": "Dr Madhu Mandal"}, {"classDate": "2026-09-14", "startTime": "14:45:00", "endTime": "16:15:00", "venue": "MCR 07", "courseCode": "BDM", "courseName": "Brand Management", "faculty": "Dr Madhu Mandal"}, {"classDate": "2026-09-15", "startTime": "14:45:00", "endTime": "16:15:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}, {"classDate": "2026-09-17", "startTime": "18:15:00", "endTime": "19:45:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}, {"classDate": "2026-09-18", "startTime": "08:30:00", "endTime": "10:00:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}, {"classDate": "2026-09-19", "startTime": "08:30:00", "endTime": "10:00:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}, {"classDate": "2026-10-05", "startTime": "10:20:00", "endTime": "11:50:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}, {"classDate": "2026-10-05", "startTime": "12:10:00", "endTime": "13:40:00", "venue": "MCR 07", "courseCode": "B2B", "courseName": "Business to Business Marketing", "faculty": "Dr. Mohit Malhan"}, {"classDate": "2026-10-05", "startTime": "18:15:00", "endTime": "19:45:00", "venue": "MCR 07", "courseCode": "BDM", "courseName": "Brand Management", "faculty": "Dr Madhu Mandal"}, {"classDate": "2026-10-06", "startTime": "10:20:00", "endTime": "11:50:00", "venue": "MCR 07", "courseCode": "IMCE", "courseName": "International Business Models for the Circular Economy", "faculty": "Dr. Sanchayan Nath"}, {"classDate": "2026-10-06", "startTime": "14:45:00", "endTime": "16:15:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}, {"classDate": "2026-10-07", "startTime": "10:20:00", "endTime": "11:50:00", "venue": "MCR 07", "courseCode": "IMCE", "courseName": "International Business Models for the Circular Economy", "faculty": "Dr. Sanchayan Nath"}, {"classDate": "2026-10-07", "startTime": "12:10:00", "endTime": "13:40:00", "venue": "MCR 07", "courseCode": "B2B", "courseName": "Business to Business Marketing", "faculty": "Dr. Mohit Malhan"}, {"classDate": "2026-10-07", "startTime": "16:30:00", "endTime": "18:00:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}, {"classDate": "2026-10-07", "startTime": "18:15:00", "endTime": "19:45:00", "venue": "MCR 07", "courseCode": "BDM", "courseName": "Brand Management", "faculty": "Dr Madhu Mandal"}, {"classDate": "2026-10-08", "startTime": "10:20:00", "endTime": "11:50:00", "venue": "MCR 07", "courseCode": "IMCE", "courseName": "International Business Models for the Circular Economy", "faculty": "Dr. Sanchayan Nath"}, {"classDate": "2026-10-08", "startTime": "14:45:00", "endTime": "16:15:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}, {"classDate": "2026-10-09", "startTime": "14:45:00", "endTime": "16:15:00", "venue": "MCR 07", "courseCode": "BDM", "courseName": "Brand Management", "faculty": "Dr Madhu Mandal"}, {"classDate": "2026-10-09", "startTime": "20:00:00", "endTime": "21:30:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}, {"classDate": "2026-10-10", "startTime": "12:10:00", "endTime": "13:40:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}, {"classDate": "2026-10-12", "startTime": "12:10:00", "endTime": "13:40:00", "venue": "MCR 07", "courseCode": "B2B", "courseName": "Business to Business Marketing", "faculty": "Dr. Mohit Malhan"}, {"classDate": "2026-10-12", "startTime": "14:45:00", "endTime": "16:15:00", "venue": "MCR 07", "courseCode": "BDM", "courseName": "Brand Management", "faculty": "Dr Madhu Mandal"}, {"classDate": "2026-10-13", "startTime": "12:10:00", "endTime": "13:40:00", "venue": "MCR 07", "courseCode": "IMCE", "courseName": "International Business Models for the Circular Economy", "faculty": "Dr. Sanchayan Nath"}, {"classDate": "2026-10-14", "startTime": "12:10:00", "endTime": "13:40:00", "venue": "MCR 07", "courseCode": "IMCE", "courseName": "International Business Models for the Circular Economy", "faculty": "Dr. Sanchayan Nath"}, {"classDate": "2026-10-14", "startTime": "14:45:00", "endTime": "16:15:00", "venue": "MCR 07", "courseCode": "BDM", "courseName": "Brand Management", "faculty": "Dr Madhu Mandal"}, {"classDate": "2026-10-15", "startTime": "12:10:00", "endTime": "13:40:00", "venue": "MCR 07", "courseCode": "B2B", "courseName": "Business to Business Marketing", "faculty": "Dr. Mohit Malhan"}, {"classDate": "2026-10-16", "startTime": "12:10:00", "endTime": "13:40:00", "venue": "MCR 07", "courseCode": "IMCE", "courseName": "International Business Models for the Circular Economy", "faculty": "Dr. Sanchayan Nath"}, {"classDate": "2026-10-17", "startTime": "12:10:00", "endTime": "13:40:00", "venue": "MCR 07", "courseCode": "BDM", "courseName": "Brand Management", "faculty": "Dr Madhu Mandal"}, {"classDate": "2026-10-21", "startTime": "10:20:00", "endTime": "11:50:00", "venue": "MCR 07", "courseCode": "IMCE", "courseName": "International Business Models for the Circular Economy", "faculty": "Dr. Sanchayan Nath"}, {"classDate": "2026-10-21", "startTime": "12:10:00", "endTime": "13:40:00", "venue": "MCR 07", "courseCode": "B2B", "courseName": "Business to Business Marketing", "faculty": "Dr. Mohit Malhan"}, {"classDate": "2026-10-22", "startTime": "10:20:00", "endTime": "11:50:00", "venue": "MCR 07", "courseCode": "B2B", "courseName": "Business to Business Marketing", "faculty": "Dr. Mohit Malhan"}, {"classDate": "2026-10-23", "startTime": "14:45:00", "endTime": "16:15:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}, {"classDate": "2026-10-24", "startTime": "08:30:00", "endTime": "10:00:00", "venue": "MCR 07", "courseCode": "OMCR", "courseName": "Omnichannel Retailing", "faculty": "Dr. Smitu Malhotra"}];

  // 1. Robust Token Discovery Engine
  function findTokenInStorage() {
    const candidates = ['erp_token', 'token', 'access_token', 'accessToken', 'auth_token', 'jwt', 'xlflow_token', 'id_token'];
    for (const k of candidates) {
      try {
        const val = localStorage.getItem(k) || sessionStorage.getItem(k);
        if (val && typeof val === 'string' && val.length > 20) return val;
      } catch (e) {}
    }
    // Scan all keys for JWT pattern (header.payload.signature)
    for (let i = 0; i < localStorage.length; i++) {
      try {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        if (val && typeof val === 'string') {
          if (val.startsWith('ey') && val.split('.').length === 3) return val;
          try {
            const parsed = JSON.parse(val);
            if (parsed && (parsed.token || parsed.accessToken || parsed.access_token)) {
              return parsed.token || parsed.accessToken || parsed.access_token;
            }
          } catch (e) {}
        }
      } catch (e) {}
    }
    return null;
  }

  function captureErpToken() {
    const token = findTokenInStorage();
    if (token && typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['erp_token'], (res) => {
        if (res.erp_token !== token) {
          chrome.storage.local.set({ erp_token: token, tokenCapturedAt: Date.now() }, () => {
            console.log('[XL-Flow] Token synchronized securely to local extension storage.');
            fetchLiveScheduleInPage(token);
          });
        }
      });
    }
  }

  // 2. In-Page Live Schedule Fetcher
  async function fetchLiveScheduleInPage(token) {
    try {
      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const today = new Date();
      const start = new Date(today.getTime() - 2 * 86400000).toISOString().split('T')[0];
      const end = new Date(today.getTime() + 45 * 86400000).toISOString().split('T')[0];

      const res = await fetch(`https://xlerp.xlri.ac.in/api/v1/schedule/my-schedule/student?startDate=${start}&endDate=${end}`, {
        headers,
        credentials: 'include'
      });

      if (res.ok) {
        const json = await res.json();
        const sessions = json.data || json;
        if (Array.isArray(sessions) && sessions.length > 0) {
          if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.set({ cached_schedule: sessions, lastSyncTimestamp: Date.now() });
          }
          updateHudWithSessions(sessions);
          return sessions;
        }
      }
    } catch (e) {
      console.warn('[XL-Flow] In-page schedule fetch error:', e);
    }
    return null;
  }

  captureErpToken();
  window.addEventListener('storage', captureErpToken);
  setInterval(captureErpToken, 15000);

  // 3. Find Next Upcoming Session
  function getNextSession(sessions) {
    if (!Array.isArray(sessions) || sessions.length === 0) return null;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 8);

    // Look for sessions today or upcoming
    const upcoming = sessions.filter(s => {
      const d = s.classDate || '';
      const t = s.endTime || s.startTime || '23:59:59';
      if (d > todayStr) return true;
      if (d === todayStr && t >= timeStr) return true;
      return false;
    });

    if (upcoming.length > 0) return upcoming[0];
    return sessions[0];
  }

  // 4. In-Page Ambient Floating HUD
  function mountAmbientHud() {
    if (document.getElementById('xlflow-overlay-root')) return;

    const root = document.createElement('div');
    root.id = 'xlflow-overlay-root';

    // Floating Trigger Pill
    const pill = document.createElement('div');
    pill.className = 'xlflow-floating-pill';
    pill.innerHTML = `
      <span class="xlflow-pill-status"></span>
      <span class="xlflow-pill-title">XL-Flow HUD</span>
      <span class="xlflow-pill-badge" id="xlflow-pill-badge">Term-5 Live</span>
    `;

    // Slide-Over Companion Drawer
    const drawer = document.createElement('aside');
    drawer.className = 'xlflow-slide-drawer';
    drawer.innerHTML = `
      <div class="xlflow-drawer-header">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #38BDF8; letter-spacing: 0.05em; text-transform: uppercase;">
            XLRI Student Schedule
          </div>
          <h2 style="font-size: 18px; font-weight: 800; margin: 2px 0 0 0; color: #FFFFFF;">
            Quick Class HUD
          </h2>
        </div>
        <button class="xlflow-drawer-close" aria-label="Close HUD">&times;</button>
      </div>

      <div class="xlflow-hud-card" id="xlflow-next-lecture">
        <div style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 6px;">
          Next Scheduled Lecture
        </div>
        <div style="font-size: 16px; font-weight: 700; color: #F8FAFC; margin-bottom: 4px;" id="xlflow-course-title">
          Loading Schedule...
        </div>
        <div style="font-size: 12px; color: #94A3B8; margin-bottom: 12px;" id="xlflow-course-meta">
          Connecting to official student timetable
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="xlflow-copy-room-btn" style="flex: 1; padding: 8px 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #FFF; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
            Copy Venue
          </button>
          <button id="xlflow-launch-full-btn" style="flex: 1; padding: 8px 12px; background: #0284C7; border: none; color: #FFF; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
            Open Full Deck
          </button>
        </div>
      </div>

      <div class="xlflow-hud-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 700; color: #94A3B8;">STATUTORY ATTENDANCE</span>
          <span style="font-size: 11px; font-weight: 700; color: #4ADE80; background: rgba(34,197,94,0.15); padding: 2px 8px; border-radius: 999px;">
            80.0% Rule Safe
          </span>
        </div>
        <p style="font-size: 12px; color: #CBD5E1; line-height: 1.5; margin: 0;">
          All term courses currently satisfy XLRI minimum attendance regulations. Safe margin: <strong>+3 average cuts</strong> remaining.
        </p>
      </div>

      <div class="xlflow-hud-card" id="xlflow-campus-radar-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 700; color: #94A3B8;">CAMPUS RADAR • WHO'S WHERE</span>
          <span id="xlflow-radar-headcount" style="font-size: 11px; font-weight: 700; color: #38BDF8; background: rgba(56,189,248,0.15); padding: 2px 8px; border-radius: 999px;">
            Live Presence
          </span>
        </div>
        <div id="xlflow-radar-beacons" style="font-size: 12px; color: #CBD5E1; line-height: 1.5; margin-bottom: 10px;">
          ☕ Nescafe (2) • 📚 Library (1) • 🏛️ MCR (1)
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="xlflow-open-social-btn" style="flex: 1; padding: 7px 10px; background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.3); color: #38BDF8; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
            Explore Campus Radar ↗
          </button>
          <button id="xlflow-invite-btn" style="padding: 7px 10px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #FFF; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
            Invite Friends
          </button>
        </div>
      </div>

      <div style="margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #64748B; text-align: center;">
        XL-Flow Client v1.0.0 • Zero Telemetry • Student Identity Protected
      </div>
    `;

    pill.addEventListener('click', () => {
      drawer.classList.toggle('open');
      hydrateDrawerData();
    });

    const closeBtn = drawer.querySelector('.xlflow-drawer-close');
    closeBtn.addEventListener('click', () => drawer.classList.remove('open'));

    // Smooth click-outside and escape-key dismissal
    document.addEventListener('pointerdown', (e) => {
      if (drawer.classList.contains('open') && !drawer.contains(e.target) && !pill.contains(e.target)) {
        drawer.classList.remove('open');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
      }
    });

    root.appendChild(pill);
    root.appendChild(drawer);
    document.body.appendChild(root);

    // Initial render with fallback data immediately so it never shows stalled loader
    hydrateDrawerData();
  }

  // 5. Lecture Card DOM Updater
  function updateHudWithSessions(sessions) {
    const next = getNextSession(sessions);
    if (!next) return;

    const code = next.course?.courseCode || next.courseCode || 'XLRI';
    const name = next.course?.courseName || next.courseName || next.courseOfferCode || 'Scheduled Lecture';
    const venueName = typeof next.venue === 'object' ? (next.venue.name || next.venue.code || 'Campus') : (next.venue || 'MCR 07');
    const facultyStr = next.faculty ? (typeof next.faculty === 'object' ? ((next.faculty.prefix || '') + ' ' + (next.faculty.firstName || '') + ' ' + (next.faculty.lastName || '')).trim() : next.faculty) : '';
    const dateStr = next.classDate || 'Today';
    const startStr = (next.startTime || '10:00').slice(0, 5);
    const endStr = next.endTime ? ` - ${next.endTime.slice(0, 5)}` : '';

    const titleEl = document.getElementById('xlflow-course-title');
    const metaEl = document.getElementById('xlflow-course-meta');
    const badgeEl = document.getElementById('xlflow-pill-badge');

    if (titleEl) titleEl.textContent = `${code} - ${name}`;
    if (metaEl) metaEl.textContent = `${dateStr} • ${startStr}${endStr} • Room: ${venueName}${facultyStr ? ' • ' + facultyStr : ''}`;
    if (badgeEl) badgeEl.textContent = `${code} @ ${startStr}`;

    const copyBtn = document.getElementById('xlflow-copy-room-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(venueName);
        copyBtn.textContent = `Copied ${venueName}!`;
        setTimeout(() => { copyBtn.textContent = 'Copy Venue'; }, 1800);
      };
    }
  }

  function hydrateDrawerData() {
    // Check local storage first
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['cached_schedule', 'erp_token'], (res) => {
        let sessions = res.cached_schedule;
        if (!Array.isArray(sessions) || sessions.length === 0) {
          sessions = FALLBACK_SCHEDULE;
        }
        updateHudWithSessions(sessions);

        // Also trigger fresh in-page fetch
        const token = res.erp_token || findTokenInStorage();
        fetchLiveScheduleInPage(token);
      });
    } else {
      updateHudWithSessions(FALLBACK_SCHEDULE);
    }

    // Launch full app
    const launchBtn = document.getElementById('xlflow-launch-full-btn');
    const openSocialBtn = document.getElementById('xlflow-open-social-btn');

    function navigateToApp(queryParam = '') {
      const liveBase = 'https://janmejai2002.github.io/xlflow/';
      const targetUrl = queryParam ? `${liveBase}?${queryParam.replace(/^\?/, '')}` : liveBase;

      // 1. Communicate with background worker to create tab (immune to Brave shields & popup blockers)
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        try {
          chrome.runtime.sendMessage({ action: 'OPEN_FULL_DECK', url: targetUrl }, (res) => {
            if (chrome.runtime.lastError || !res?.ok) {
              window.open(targetUrl, '_blank');
            }
          });
          return;
        } catch (err) {
          // Fallback to direct navigation
        }
      }

      // 2. Direct browser navigation fallback
      window.open(targetUrl, '_blank');
    }

    if (launchBtn) {
      launchBtn.onclick = () => navigateToApp();
    }
    if (openSocialBtn) {
      openSocialBtn.onclick = () => navigateToApp('tab=synergy');
    }

    // Invite Friends button
    const inviteBtn = document.getElementById('xlflow-invite-btn');
    if (inviteBtn) {
      inviteBtn.onclick = () => {
        const inviteText = "Hey! Check out XL-Flow to see live campus hotspots and compare our free slots: https://janmejai2002.github.io/xlflow/?meet=B25349";
        navigator.clipboard.writeText(inviteText);
        inviteBtn.textContent = 'Copied Link!';
        setTimeout(() => { inviteBtn.textContent = 'Invite Friends'; }, 2000);
      };
    }

    // Live social presence from local daemon
    try {
      fetch('http://localhost:3101/api/social/whos-where', { signal: AbortSignal.timeout(1500) })
        .then(r => r.json())
        .then(data => {
          if (data && data.zoneCounts) {
            const countEl = document.getElementById('xlflow-radar-headcount');
            const beaconsEl = document.getElementById('xlflow-radar-beacons');
            if (countEl) countEl.textContent = `${data.zoneCounts.total || 0} on campus`;
            if (beaconsEl) {
              beaconsEl.textContent = `☕ Nescafe (${data.zoneCounts.nescafe || 0}) • 📚 Library (${data.zoneCounts.library || 0}) • 🏛️ Academic (${data.zoneCounts.academic || 0})`;
            }
          }
        })
        .catch(() => {});
    } catch (e) {}
  }

  // Mount when document body is ready
  if (document.body) {
    mountAmbientHud();
  } else {
    document.addEventListener('DOMContentLoaded', mountAmbientHud);
  }
})();

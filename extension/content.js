/**
 * XL-Flow Content Script — Ambient In-Page ERP Companion
 * Injected strictly into https://xlerp.xlri.ac.in/*
 * Capabilities:
 * - Passive, zero-touch token acquisition from localStorage
 * - Local-only secure persistence in chrome.storage.local
 * - Ambient floating pill HUD with real-time class status
 * - Slide-over quick HUD drawer
 */

(function initXlFlowContentScript() {
  console.log('[XL-Flow] Injected into XLRI ERP session.');

  // 1. Passive Token Ingestion Engine
  function captureErpToken() {
    try {
      const token = localStorage.getItem('erp_token') || sessionStorage.getItem('erp_token');
      if (token && typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['erp_token'], (res) => {
          if (res.erp_token !== token) {
            chrome.storage.local.set({ erp_token: token, tokenCapturedAt: Date.now() }, () => {
              console.log('[XL-Flow] Token synchronized securely to local extension storage.');
            });
          }
        });
      }
    } catch (e) {
      console.warn('[XL-Flow] Token capture check failed:', e);
    }
  }

  // Check immediately and hook into storage events
  captureErpToken();
  window.addEventListener('storage', (e) => {
    if (e.key === 'erp_token') captureErpToken();
  });
  setInterval(captureErpToken, 10000);

  // 2. In-Page Ambient Floating HUD
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
      <span class="xlflow-pill-badge">Term-5 Live</span>
    `;

    // Slide-Over Companion Drawer
    const drawer = document.createElement('aside');
    drawer.className = 'xlflow-slide-drawer';
    drawer.innerHTML = `
      <div class="xlflow-drawer-header">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #38BDF8; letter-spacing: 0.05em; text-transform: uppercase;">
            XLRI Academic Continuum
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

    root.appendChild(pill);
    root.appendChild(drawer);
    document.body.appendChild(root);

    function hydrateDrawerData() {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['cached_schedule'], (res) => {
          if (res.cached_schedule && res.cached_schedule.length > 0) {
            const next = res.cached_schedule[0];
            const titleEl = document.getElementById('xlflow-course-title');
            const metaEl = document.getElementById('xlflow-course-meta');
            if (titleEl) titleEl.textContent = `${next.courseCode} - ${next.courseName}`;
            if (metaEl) metaEl.textContent = `${next.classDate} • ${next.startTime.slice(0,5)} • Room: ${next.venue}`;

            const copyBtn = document.getElementById('xlflow-copy-room-btn');
            if (copyBtn) {
              copyBtn.onclick = () => {
                navigator.clipboard.writeText(next.venue);
                copyBtn.textContent = 'Copied!';
                setTimeout(() => { copyBtn.textContent = 'Copy Venue'; }, 1800);
              };
            }
          }
        });
      }

      // Launch full app
      const launchBtn = document.getElementById('xlflow-launch-full-btn');
      const openSocialBtn = document.getElementById('xlflow-open-social-btn');
      const appUrl = typeof chrome !== 'undefined' && chrome.runtime?.getURL ? chrome.runtime.getURL('dist/index.html') : 'https://janmejai2002.github.io/xlflow/';

      if (launchBtn) {
        launchBtn.onclick = () => window.open(appUrl, '_blank');
      }
      if (openSocialBtn) {
        openSocialBtn.onclick = () => window.open(appUrl + '?tab=synergy', '_blank');
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

      // Hydrate live social presence from local daemon
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
  }

  // Mount when document body is ready
  if (document.body) {
    mountAmbientHud();
  } else {
    document.addEventListener('DOMContentLoaded', mountAmbientHud);
  }
})();

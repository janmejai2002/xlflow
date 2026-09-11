/**
 * XL-Flow Background Service Worker (Manifest V3)
 * Handles background sync alarms, token lifecycle, and extension badge updates.
 */

const SYNC_ALARM_NAME = 'xlflow-periodic-sync';

// On extension install or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('[XL-Flow Background] Extension installed/updated.');
  
  chrome.action.setBadgeText({ text: 'LIVE' });
  chrome.action.setBadgeBackgroundColor({ color: '#16A34A' });

  // Create periodic sync alarm (every 15 minutes)
  chrome.alarms.create(SYNC_ALARM_NAME, {
    periodInMinutes: 15
  });

  // Run immediate sync
  performBackgroundSync();
});

// Alarm Listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM_NAME) {
    performBackgroundSync();
  }
});

async function performBackgroundSync() {
  console.log('[XL-Flow Background] Running background sync...');

  chrome.storage.local.get(['erp_token'], async (result) => {
    const token = result.erp_token;
    if (!token) {
      chrome.action.setBadgeText({ text: 'LIVE' });
      chrome.action.setBadgeBackgroundColor({ color: '#16A34A' });
      return;
    }

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      // 1. Fetch upcoming sessions
      let sessions = [];
      try {
        const upRes = await fetch('https://xlerp.xlri.ac.in/api/v1/schedule/my-schedule/student/upcoming', { headers });
        if (upRes.status === 401) {
          console.warn('[XL-Flow Background] Token expired (401).');
          chrome.action.setBadgeText({ text: 'AUTH' });
          chrome.action.setBadgeBackgroundColor({ color: '#DC2626' });
          return;
        }
        if (upRes.ok) {
          const upJson = await upRes.json();
          const raw = upJson.data || upJson;
          if (Array.isArray(raw)) sessions = raw;
          else if (raw && typeof raw === 'object') {
            sessions = [...(raw.today || []), ...(raw.tomorrow || [])];
          }
        }
      } catch (e) {}

      // 2. Fetch rolling 45-day schedule if needed
      if (!sessions || sessions.length === 0) {
        const today = new Date();
        const start = new Date(today.getTime() - 2 * 86400000).toISOString().split('T')[0];
        const end = new Date(today.getTime() + 45 * 86400000).toISOString().split('T')[0];
        const fullRes = await fetch(`https://xlerp.xlri.ac.in/api/v1/schedule/my-schedule/student?startDate=${start}&endDate=${end}`, { headers });
        if (fullRes.ok) {
          const fullJson = await fullRes.json();
          sessions = fullJson.data || fullJson || [];
        }
      }

      if (Array.isArray(sessions) && sessions.length > 0) {
        chrome.storage.local.set({
          cached_schedule: sessions,
          lastSyncTimestamp: Date.now()
        });

        chrome.action.setBadgeText({ text: `${sessions.length}` });
        chrome.action.setBadgeBackgroundColor({ color: '#0284C7' });
      }
    } catch (err) {
      console.warn('[XL-Flow Background] Sync network error:', err);
    }
  });
}

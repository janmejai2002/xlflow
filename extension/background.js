/**
 * XL-Flow Background Service Worker (Manifest V3)
 * Handles background sync alarms, token lifecycle, and extension badge updates.
 */

const SYNC_ALARM_NAME = 'xlflow-periodic-sync';

// On extension install or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('[XL-Flow Background] Extension installed/updated.');
  
  // Set default badge
  chrome.action.setBadgeText({ text: 'LIVE' });
  chrome.action.setBadgeBackgroundColor({ color: '#16A34A' });

  // Create periodic sync alarm (every 30 minutes)
  chrome.alarms.create(SYNC_ALARM_NAME, {
    periodInMinutes: 30
  });
});

// Alarm Listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM_NAME) {
    performBackgroundSync();
  }
});

async function performBackgroundSync() {
  console.log('[XL-Flow Background] Running periodic sync...');

  chrome.storage.local.get(['erp_token'], async (result) => {
    const token = result.erp_token;
    if (!token) {
      chrome.action.setBadgeText({ text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: '#64748B' });
      return;
    }

    try {
      // Query official XLRI ERP upcoming schedule endpoint
      const response = await fetch('https://xlerp.xlri.ac.in/api/v1/schedule/my-schedule/student/upcoming', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.status === 401) {
        console.warn('[XL-Flow Background] Token expired (401). Clearing stale session.');
        chrome.storage.local.remove(['erp_token']);
        chrome.action.setBadgeText({ text: 'AUTH' });
        chrome.action.setBadgeBackgroundColor({ color: '#DC2626' });
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const scheduleData = await response.json();
      if (Array.isArray(scheduleData) && scheduleData.length > 0) {
        chrome.storage.local.set({
          cached_schedule: scheduleData,
          lastSyncTimestamp: Date.now()
        });

        // Set badge with next class venue or count
        chrome.action.setBadgeText({ text: `${scheduleData.length}` });
        chrome.action.setBadgeBackgroundColor({ color: '#0284C7' });
      }
    } catch (err) {
      console.warn('[XL-Flow Background] Sync network error:', err);
    }
  });
}

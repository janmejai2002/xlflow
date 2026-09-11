/**
 * Universal Google Sheets Cloud Persistence Engine for XL-Flow
 * Uses Google Apps Script backend over Google Sheets (100% free serverless storage).
 * Ensures zero data loss even when cookies, browser cache, or localStorage are wiped.
 */

export const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbymFXMRs78rb8_KjyqZ7VQBK6PV8iUL5f6ansiPRGPqGTSN5B5UV5ZEJQcsCMLHFOjzjg/exec';

/**
 * Execute a POST request to the Google Apps Script Web App.
 * Uses 'text/plain' Content-Type to prevent browser CORS preflight (OPTIONS) blockers on GAS.
 */
async function postToGas(payload) {
  try {
    const res = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    if (!res.ok) {
      console.warn(`[CloudStorage] GAS responded with status ${res.status}`);
      return { ok: false, status: res.status };
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (parseErr) {
      console.warn('[CloudStorage] Non-JSON response from GAS:', text.slice(0, 100));
      return { ok: false, error: 'Non-JSON response' };
    }
  } catch (err) {
    console.warn('[CloudStorage] Network error syncing with Google Sheets:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Fetches all cloud attendance marks recorded for a student's roll number.
 */
export async function fetchCloudAttendance(rollNo) {
  if (!rollNo) return {};
  const res = await postToGas({ action: 'get', rollNo: rollNo.toUpperCase() });
  if (res && res.ok && res.data) {
    return res.data;
  }
  return {};
}

/**
 * Persists an attendance mark for a specific session to Google Sheets.
 */
export async function saveCloudAttendance(rollNo, skey, status, userSection = '') {
  if (!rollNo || !skey) return { ok: false };
  return await postToGas({
    action: 'set',
    rollNo: rollNo.toUpperCase(),
    skey: String(skey),
    status: status || '',
    userSection: userSection || '',
    src: 'xlflow-web-app'
  });
}

/**
 * Fetches saved user preferences (courses, section, groups) from Google Sheets.
 */
export async function fetchCloudPrefs(rollNo) {
  if (!rollNo) return null;
  const res = await postToGas({ action: 'getPrefs', rollNo: rollNo.toUpperCase() });
  if (res && res.ok && res.data) {
    return res.data;
  }
  return null;
}

/**
 * Persists user preferences and enrolled courses to Google Sheets.
 */
export async function saveCloudPrefs(rollNo, prefs = {}) {
  if (!rollNo) return { ok: false };
  return await postToGas({
    action: 'setPrefs',
    rollNo: rollNo.toUpperCase(),
    section: prefs.section || '',
    courses: prefs.courses || [],
    courseSections: prefs.courseSections || {},
    groups: prefs.groups || []
  });
}

/**
 * Logs user access for attendance audit and campus activity.
 */
export async function logCloudUser(rollNo, name = '') {
  if (!rollNo) return { ok: false };
  return await postToGas({
    action: 'logUser',
    rollNo: rollNo.toUpperCase(),
    name: name || ''
  });
}

/**
 * One-click full recovery from Google Sheets.
 * Restores attendance and preferences if local storage has been cleared.
 */
export async function restoreFromCloud(rollNo) {
  if (!rollNo) return null;
  const cleanRoll = rollNo.toUpperCase();

  try {
    const [attData, prefsData] = await Promise.all([
      fetchCloudAttendance(cleanRoll),
      fetchCloudPrefs(cleanRoll)
    ]);

    return {
      rollNo: cleanRoll,
      attendance: attData || {},
      prefs: prefsData || null
    };
  } catch (err) {
    console.error('[CloudStorage] Full cloud restoration failed:', err);
    return null;
  }
}

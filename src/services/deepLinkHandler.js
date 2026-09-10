/**
 * XL-Flow Deep-Linking & Viral Sharing Engine
 * Handles query parameter ingestion (?meet=ROLL, ?join=CODE, ?beacon=ZONE)
 * and generates high-converting WhatsApp / Telegram / Direct share payloads.
 */

import { ROSTER } from '../data/rosterData';

export function parseDeepLink(search = window.location.search) {
  const params = new URLSearchParams(search);
  const result = {
    hasLink: false,
    type: null, // 'meet' | 'join' | 'beacon'
    raw: Object.fromEntries(params.entries())
  };

  // 1. Mutual Free Slot Comparison Invite (?meet=B25349)
  if (params.has('meet')) {
    const roll = params.get('meet').trim().toUpperCase();
    const student = ROSTER[roll] || { name: 'Batchmate', section: 'E' };
    result.hasLink = true;
    result.type = 'meet';
    result.inviterRoll = roll;
    result.inviterName = student.name;
    result.inviterSection = student.section;
    return result;
  }

  // 2. Study Circle Squad Invite (?join=XL-STRAT)
  if (params.has('join')) {
    const code = params.get('join').trim().toUpperCase();
    result.hasLink = true;
    result.type = 'join';
    result.circleCode = code;
    return result;
  }

  // 3. Campus Zone Beacon Broadcast (?beacon=nescafe)
  if (params.has('beacon')) {
    const zone = params.get('beacon').trim().toLowerCase();
    result.hasLink = true;
    result.type = 'beacon';
    result.zone = zone;
    return result;
  }

  return result;
}

export function clearDeepLinkParams() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('meet');
  url.searchParams.delete('join');
  url.searchParams.delete('beacon');
  window.history.replaceState({}, document.title, url.pathname + (url.search || ''));
}

export function getBaseAppUrl() {
  if (typeof window !== 'undefined' && window.location.origin) {
    // If running in file:// or extension popup, return standard link or origin
    if (window.location.origin.startsWith('http')) {
      return window.location.origin;
    }
  }
  return 'https://xlflow.app';
}

// ----------------------------------------------------
// VIRAL WHATSAPP & CLIPBOARD GENERATORS
// ----------------------------------------------------

export function generateMeetSharePayload(myRoll, myName) {
  const name = myName || ROSTER[myRoll]?.name || 'Me';
  const url = getBaseAppUrl() + '?meet=' + encodeURIComponent(myRoll);
  const text = "Hey! I'm using XL-Flow for our Term-5 timetable & attendance. Tap here to see our mutual free slots this week: " + url;
  const whatsappUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text);

  return { url, text, whatsappUrl };
}

export function generateCircleSharePayload(circleName, circleCode) {
  const url = getBaseAppUrl() + '?join=' + encodeURIComponent(circleCode);
  const text = 'Join our *' + circleName + '* project group on XL-Flow! Squad Code: *' + circleCode + '*\nTap to sync schedules & find meeting slots: ' + url;
  const whatsappUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text);

  return { url, text, whatsappUrl };
}

export function generateBeaconSharePayload(status) {
  const zone = status.zone || 'nescafe';
  const url = getBaseAppUrl() + '?beacon=' + encodeURIComponent(zone);
  const emoji = status.emoji || '📍';
  const statusNote = status.text || 'Catch me on campus!';
  const text = emoji + ' ' + statusNote + '\nSee live campus spots on XL-Flow: ' + url;
  const whatsappUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text);

  return { url, text, whatsappUrl };
}

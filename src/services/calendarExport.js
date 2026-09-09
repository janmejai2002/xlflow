/**
 * RFC 5545 iCalendar (.ics) Generator & Google Calendar Linker
 * Completely client-side, zero external libraries.
 */

// Formats "2026-09-11" and "10:20:00" to "20260911T102000"
function formatDateTime(dateStr, timeStr) {
  const d = (dateStr || '').replace(/-/g, '');
  const t = (timeStr || '').replace(/:/g, '').slice(0, 6).padEnd(6, '0');
  return `${d}T${t}`;
}

// RFC 5545 line folding (max 75 octets per line)
function foldLine(line) {
  if (line.length <= 75) return line;
  let res = '';
  let curr = line;
  let first = true;
  while (curr.length > 0) {
    const limit = first ? 75 : 74;
    res += (first ? '' : '\r\n ') + curr.substring(0, limit);
    curr = curr.substring(limit);
    first = false;
  }
  return res;
}

function escapeText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateIcs(sessions, calName = 'XLRI Class Schedule') {
  const nowUtc = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//XL-Flow//XLRI Student Calendar 1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calName)}`,
    'X-WR-TIMEZONE:Asia/Kolkata',
    // Embedded VTIMEZONE for Asia/Kolkata (IST: UTC+05:30)
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Kolkata',
    'X-LIC-LOCATION:Asia/Kolkata',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0530',
    'TZOFFSETTO:+0530',
    'TZNAME:IST',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE'
  ];

  for (const s of sessions) {
    const dtStart = formatDateTime(s.classDate, s.startTime);
    const dtEnd = formatDateTime(s.classDate, s.endTime);
    const summary = `[${s.courseCode}] ${s.courseName}`;
    const location = `${s.venue || 'MCR'}, ${s.building || 'Academic Building'}`;
    const desc = `Course: ${s.courseName} (${s.courseCode})\\nFaculty: ${s.faculty || 'Faculty'}\\nSection: ${s.section || 'General'}\\nStatus: Scheduled\\n\\nSynced via XL-Flow`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${s.sessionId || Math.random().toString(36).substring(2)}@xlflow.xlri.ac.in`);
    lines.push(`DTSTAMP:${nowUtc}`);
    lines.push(`DTSTART;TZID=Asia/Kolkata:${dtStart}`);
    lines.push(`DTEND;TZID=Asia/Kolkata:${dtEnd}`);
    lines.push(`SUMMARY:${escapeText(summary)}`);
    lines.push(`LOCATION:${escapeText(location)}`);
    lines.push(`DESCRIPTION:${desc}`);
    lines.push('STATUS:CONFIRMED');

    // 15-Minute Advance Reminder Alarm
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT15M');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Reminder: ${escapeText(summary)} in 15 mins at ${escapeText(location)}`);
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

export function downloadIcsFile(sessions, filename = 'xlri_classes.ics') {
  const icsData = generateIcs(sessions);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(session) {
  const dtStart = formatDateTime(session.classDate, session.startTime);
  const dtEnd = formatDateTime(session.classDate, session.endTime);
  const title = encodeURIComponent(`[${session.courseCode}] ${session.courseName}`);
  const details = encodeURIComponent(`Faculty: ${session.faculty}\nSection: ${session.section}\nVenue: ${session.venue}, ${session.building}`);
  const location = encodeURIComponent(`${session.venue}, ${session.building}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dtStart}/${dtEnd}&details=${details}&location=${location}&ctz=Asia/Kolkata`;
}

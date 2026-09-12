import React from 'react';
import { Check, X, Ban } from 'lucide-react';
import { selfAttendanceStore } from '../../services/selfAttendanceStore';
import { playTactileClick } from '../../services/soundEngine';

/**
 * Classes that have already finished but carry no mark yet.
 *
 * This is the fast path: a student between lectures should be able to clear the
 * backlog with one thumb, without opening a modal or choosing a reason. Reasons
 * and notes live in the details modal for the rare absence that needs one.
 */
function toDateTime(session, timeKey) {
  const time = session[timeKey] || '00:00:00';
  return new Date(`${session.classDate}T${time}`);
}

export function getUnmarkedSessions(schedule = [], limit = 6) {
  const now = new Date();
  return schedule
    .filter((s) => {
      if (!s.sessionId || !s.classDate) return false;
      const end = toDateTime(s, 'endTime');
      if (Number.isNaN(end.getTime()) || end > now) return false;
      return !selfAttendanceStore.getSessionStatus(s.sessionId);
    })
    .sort((a, b) => toDateTime(b, 'endTime') - toDateTime(a, 'endTime'))
    .slice(0, limit);
}

function relativeDay(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${dateStr}T00:00:00`);
  const days = Math.round((today - d) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function QuickMarkStrip({ sessions = [] }) {
  if (sessions.length === 0) return null;

  const mark = (session, status) => {
    playTactileClick(status === 'present' ? 650 : 450);
    selfAttendanceStore.markSession(session.sessionId, status, {
      courseCode: session.courseCode,
      courseName: session.courseName,
      classDate: session.classDate,
      venue: session.venue
    });
  };

  const actionStyle = (bg, border, color) => ({
    minWidth: '46px',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    backgroundColor: bg,
    border: `1px solid ${border}`,
    color,
    cursor: 'pointer',
    flexShrink: 0
  });

  return (
    <section
      aria-label="Classes waiting to be marked"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          padding: '11px 14px',
          borderBottom: '1px solid var(--border-soft)',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Were you there?</span>
        <span style={{ fontSize: '11px', color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
          {sessions.length} to mark
        </span>
      </div>

      {sessions.map((s, i) => (
        <div
          key={s.sessionId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)'
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--ink)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {s.courseCode} · {s.courseName}
            </div>
            <div
              style={{
                fontSize: '11.5px',
                color: 'var(--ink-faint)',
                fontFamily: 'var(--font-mono)',
                marginTop: '1px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {relativeDay(s.classDate)} · {(s.startTime || '').slice(0, 5)} · {s.venue}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => mark(s, 'present')}
              aria-label={`Mark ${s.courseCode} on ${s.classDate} as present`}
              style={actionStyle('var(--wash-moss)', 'rgba(var(--moss-rgb), 0.4)', 'var(--moss-text)')}
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => mark(s, 'absent')}
              aria-label={`Mark ${s.courseCode} on ${s.classDate} as absent`}
              style={actionStyle('var(--wash-hanko)', 'rgba(var(--hanko-rgb), 0.4)', 'var(--hanko-text)')}
            >
              <X size={18} />
            </button>
            <button
              onClick={() => mark(s, 'cancelled')}
              aria-label={`Mark ${s.courseCode} on ${s.classDate} as cancelled`}
              style={actionStyle('var(--paper)', 'var(--border)', 'var(--ink-faint)')}
            >
              <Ban size={17} />
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}

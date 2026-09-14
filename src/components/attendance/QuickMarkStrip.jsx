import React from 'react';
import { Check, X, Ban } from 'lucide-react';
import { selfAttendanceStore } from '../../services/selfAttendanceStore';
import { playTactileClick } from '../../services/soundEngine';

/**
 * Classes that have already finished but carry no mark yet.
 *
 * Fast path: A student between lectures clears the backlog with one thumb,
 * without navigating away or opening modal dialogs.
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

  return (
    <section
      aria-label="Classes waiting to be marked"
      className="editorial-slate"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Header: Audit Title & Hanko Pending Stamp */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          backgroundColor: 'var(--paper-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'var(--ink-faint)',
              textTransform: 'uppercase'
            }}
          >
            Self-Audit
          </span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--ink)'
            }}
          >
            Concluded Classes Awaiting Mark
          </span>
        </div>
        <span
          className="hanko-stamp"
          style={{
            color: 'var(--ochre)',
            borderColor: 'rgba(var(--ochre-rgb), 0.45)',
            backgroundColor: 'var(--wash-ochre)'
          }}
        >
          {sessions.length} TO LOG
        </span>
      </div>

      {/* Session Rows with Hairline Dividers */}
      {sessions.map((s, i) => (
        <div
          key={s.sessionId}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '11px 16px',
            borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)'
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: 'var(--ink)',
                  flexShrink: 0
                }}
              >
                {s.courseCode}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--ink-soft)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {s.courseName}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '11px',
                color: 'var(--ink-faint)',
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {relativeDay(s.classDate)} · {(s.startTime || '').slice(0, 5)}
              {s.endTime ? `–${(s.endTime || '').slice(0, 5)}` : ''} · {s.venue || 'Classroom'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              className="btn-tactile"
              onClick={() => mark(s, 'present')}
              aria-label={`Mark ${s.courseCode} on ${s.classDate} as present`}
              title="Mark Present"
              style={{
                minWidth: '42px',
                minHeight: '38px',
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                borderRadius: '4px',
                backgroundColor: 'var(--wash-moss)',
                border: '1px solid rgba(var(--moss-rgb), 0.35)',
                color: 'var(--moss-text)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <Check size={15} strokeWidth={2.5} />
              <span>Present</span>
            </button>
            <button
              className="btn-tactile"
              onClick={() => mark(s, 'absent')}
              aria-label={`Mark ${s.courseCode} on ${s.classDate} as absent`}
              title="Mark Absent"
              style={{
                minWidth: '42px',
                minHeight: '38px',
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                borderRadius: '4px',
                backgroundColor: 'var(--wash-hanko)',
                border: '1px solid rgba(var(--hanko-rgb), 0.35)',
                color: 'var(--hanko-text)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <X size={15} strokeWidth={2.5} />
              <span>Absent</span>
            </button>
            <button
              className="btn-tactile"
              onClick={() => mark(s, 'cancelled')}
              aria-label={`Mark ${s.courseCode} on ${s.classDate} as cancelled`}
              title="Class Cancelled"
              style={{
                minWidth: '38px',
                minHeight: '38px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--border)',
                color: 'var(--ink-faint)',
                cursor: 'pointer'
              }}
            >
              <Ban size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}

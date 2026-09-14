import React, { useState } from 'react';
import { COURSE_COLORS } from '../data/courseColors';
import { getGoogleCalendarUrl } from '../services/calendarExport';
import { playTactileClick } from '../services/soundEngine';
import SelfAttendanceMarkPill from './attendance/SelfAttendanceMarkPill';
import { toast } from 'sonner';
import {
  IconTimetable,
  IconChronometer,
  IconMapPin,
  IconCopy,
  IconCheckmark,
  IconStatutoryShield,
  IconHankoSafe,
  IconHankoWarning,
  IconHankoDanger
} from './icons';

/**
 * TimetableDocketCard: 2026 Swiss/Japanese Departure Board Docket
 *
 * Designed to eliminate generic bubbly cards and establish an architectural
 * lecture departure entry with hairline dividers, tabular monospace timing,
 * 1-click room code copying, Japanese Hanko attendance safety stamps, and tactile mechanics.
 */
export default function TimetableDocketCard({
  session,
  course,
  isNextUp = false,
  relativeTime = null,
  onSelectSession,
  isCompact = false
}) {
  const [isCopied, setIsCopied] = useState(false);

  // Retrieve course aesthetic tokens
  const courseCode = session.courseCode || 'CORE';
  const colors = COURSE_COLORS[courseCode] || {
    accent: 'var(--mizu)',
    border: 'rgba(var(--mizu-rgb), 0.3)',
    wash: 'rgba(var(--mizu-rgb), 0.12)',
    bg: '#00555E'
  };

  const handleCopyVenue = (e) => {
    e.stopPropagation();
    playTactileClick(600);
    navigator.clipboard.writeText(session.venue || 'MCR');
    setIsCopied(true);
    toast.success(`Venue Copied: ${session.venue}`, {
      description: 'Room designation copied to clipboard'
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSyncGCal = (e) => {
    e.stopPropagation();
    playTactileClick(500);
  };

  // Compute attendance safety status if course data is available
  const stats = course?.stats;
  const tier = stats?.tier || 'safe';
  const isSafe = tier === 'safe';
  const safeBunks = stats ? stats.safeBunksRemaining : null;

  return (
    <div
      className="timetable-docket-card editorial-slate"
      onClick={() => {
        playTactileClick();
        onSelectSession?.(session);
      }}
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${colors.accent}`,
        borderRadius: '6px',
        padding: isCompact ? '10px 14px' : '13px 16px',
        boxShadow: isNextUp ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease, border-color 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isNextUp ? 'var(--shadow-md)' : 'var(--shadow-sm)';
      }}
    >
      {/* Row 1: Departure Time, Duration, Next Up & Course Code */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Time Badge in Bold Tabular Monospace */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontFamily: 'var(--font-mono)',
              fontFeatureSettings: '"tnum"',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '12.5px',
              fontWeight: 800,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              backgroundColor: 'var(--paper)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border)'
            }}
          >
            <IconChronometer size={13} color="var(--mizu)" />
            <span>{(session.startTime || '').slice(0, 5)} – {(session.endTime || '').slice(0, 5)}</span>
          </div>

          {/* 90-Min Duration Tag */}
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              fontFeatureSettings: '"tnum"',
              color: 'var(--ink-faint)',
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: 'var(--paper-subtle)',
              border: '1px solid var(--border-soft)',
              letterSpacing: '0.04em'
            }}
          >
            90 MIN
          </span>

          {/* Next Up / Departure Indicator */}
          {isNextUp && (
            <span
              className="hanko-stamp"
              style={{
                color: 'var(--mizu)',
                borderColor: 'rgba(var(--mizu-rgb), 0.45)',
                backgroundColor: 'var(--wash-mizu)'
              }}
            >
              NEXT UP
            </span>
          )}

          {!isNextUp && relativeTime && (
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontFeatureSettings: '"tnum"',
                color: 'var(--ink-faint)'
              }}
            >
              · {relativeTime}
            </span>
          )}
        </div>

        {/* Course Code Monospace Chip */}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: colors.wash,
            color: colors.accent,
            border: `1px solid ${colors.border}`,
            letterSpacing: '0.04em'
          }}
        >
          {session.courseCode} · Sec {session.section}
        </span>
      </div>

      {/* Row 2: Course Title & Faculty Meta */}
      <div>
        <h3
          style={{
            fontFamily: 'var(--font-brand)',
            fontSize: isCompact ? '14.5px' : '16px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            margin: '0 0 2px 0',
            lineHeight: 1.3
          }}
        >
          {session.courseName}
        </h3>
        <p
          style={{
            fontSize: '11.5px',
            color: 'var(--ink-soft)',
            margin: 0,
            display: 'flex',
            alignItems: 'baseline',
            gap: '5px'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--ink-faint)'
            }}
          >
            Instructor:
          </span>
          <span>{session.faculty}</span>
        </p>
      </div>

      {/* Row 2.5: 1-Tap Sovereign Self-Attendance Marking */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          backgroundColor: 'var(--paper-subtle)',
          borderRadius: '4px',
          border: '1px solid var(--border-soft)',
          gap: '8px'
        }}
      >
        <span
          style={{
            fontSize: '10.5px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'var(--ink-muted)',
            textTransform: 'uppercase'
          }}
        >
          Attendance Log:
        </span>
        <SelfAttendanceMarkPill session={session} isCompact={true} />
      </div>

      {/* Row 3: Venue Pill with 1-Click Copy, Japanese Hanko Stamp & GCal Sync */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '9px',
          borderTop: '1px solid var(--border-soft)',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Venue Pill with Tactile Copy */}
          <button
            className="btn-tactile"
            onClick={handleCopyVenue}
            title="Click to copy room code"
            aria-label={`Copy venue ${session.venue}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--paper)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <IconMapPin size={13} color="var(--mizu)" />
            <span>{session.venue}</span>
            {isCopied ? (
              <IconCheckmark size={12} color="var(--moss)" />
            ) : (
              <IconCopy size={11} color="var(--ink-faint)" />
            )}
            {isCopied && (
              <span style={{ fontSize: '10px', color: 'var(--moss-text)', fontWeight: 700 }}>COPIED</span>
            )}
          </button>

          {/* Japanese Hanko Stamp Badge: Remaining Safe Bunks */}
          {safeBunks !== null && (
            <span
              className="hanko-stamp"
              title={`Statutory safe bunks remaining before 80% threshold: ${safeBunks}`}
              style={{
                color: isSafe ? 'var(--moss)' : 'var(--hanko)',
                borderColor: isSafe ? 'rgba(var(--moss-rgb), 0.45)' : 'rgba(var(--hanko-rgb), 0.45)',
                backgroundColor: isSafe ? 'var(--wash-moss)' : 'var(--wash-hanko)'
              }}
            >
              {isSafe ? (
                <IconHankoSafe size={11} color="var(--moss)" />
              ) : (
                <IconHankoDanger size={11} color="var(--hanko)" />
              )}
              <span>{isSafe ? `+${safeBunks} SAFE BUNKS` : '0 BUFFER — COMPULSORY'}</span>
            </span>
          )}
        </div>

        {/* 1-Click Google Calendar Sync */}
        <a
          href={getGoogleCalendarUrl(session)}
          onClick={handleSyncGCal}
          target="_blank"
          rel="noopener noreferrer"
          title="Add to Google Calendar"
          className="btn-tactile"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 9px',
            borderRadius: '4px',
            backgroundColor: 'var(--wash-mizu)',
            border: '1px solid rgba(var(--mizu-rgb), 0.3)',
            color: 'var(--mizu)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textDecoration: 'none'
          }}
        >
          <IconTimetable size={12} color="var(--mizu)" />
          <span>SYNC GCAL</span>
        </a>
      </div>
    </div>
  );
}

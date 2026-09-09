import React, { useState } from 'react';
import { Clock, MapPin, Calendar, User, Copy, Check, ExternalLink, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';
import { COURSE_COLORS } from '../data/rosterData';
import { getGoogleCalendarUrl } from '../services/calendarExport';
import { toast } from 'sonner';

/**
 * TimetableDocketCard: High-Aesthetic Academic Schedule Docket
 * Built following taste-design, responsive-ui-and-creative-engine, and waibi-sabi design tokens.
 * Features:
 * - Plus Jakarta Sans brand typography (--font-brand)
 * - Tabular monospace timing (--font-mono)
 * - Timeline spine connection node with course accent glow
 * - Dynamic academic safety margin pill (safe bunks remaining)
 * - Zero emojis (clean Lucide SVG icons)
 * - 1-click copy venue with tactile Sonner feedback
 * - 1-click Google Calendar sync
 * - Interactive tap to trigger ClassDetailDrawer
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
    accent: '#00A9B8',
    border: 'rgba(0, 169, 184, 0.3)',
    wash: 'rgba(0, 169, 184, 0.12)',
    bg: '#00555E'
  };

  const handleCopyVenue = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(session.venue || 'MCR');
    setIsCopied(true);
    toast.success(`Venue Copied: ${session.venue}`, {
      description: 'Room code copied to clipboard'
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSyncGCal = (e) => {
    e.stopPropagation();
    // Default link behavior opens Google Calendar
  };

  // Compute attendance safety status if course data is available
  const stats = course?.stats;
  const isSafe = stats ? stats.tier === 'safe' : true;
  const safeBunks = stats ? stats.safeBunksRemaining : null;

  return (
    <div
      className="timetable-docket-card"
      onClick={() => onSelectSession?.(session)}
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: isCompact ? '12px 14px' : '16px',
        boxShadow: isNextUp ? 'var(--shadow-md)' : 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.18s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = colors.border;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isNextUp ? 'var(--shadow-md)' : 'var(--shadow-card)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* 3px Top Brand Accent Ribbon */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${colors.accent}, transparent)`
        }}
      />

      {/* Row 1: Time, Relative Badge & Course Chip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Time Badge in Tabular Monospace */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: 800,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              backgroundColor: 'var(--paper)',
              padding: '3px 8px',
              borderRadius: '7px',
              border: '1px solid var(--border)'
            }}
          >
            <Clock size={13} color="var(--mizu)" />
            <span>{session.startTime.slice(0, 5)} - {session.endTime.slice(0, 5)}</span>
          </div>

          {/* 90-Min Duration Tag */}
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink-soft)',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'var(--card-hover)'
            }}
          >
            90 min
          </span>

          {/* Next Up / Relative Time Pill */}
          {isNextUp && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--mizu-text)',
                backgroundColor: 'var(--wash-mizu)',
                border: '1px solid rgba(0, 169, 184, 0.3)',
                padding: '2px 7px',
                borderRadius: '999px'
              }}
            >
              <Sparkles size={10} />
              <span>Next Up</span>
            </span>
          )}

          {!isNextUp && relativeTime && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--ink-soft)'
              }}
            >
              • {relativeTime}
            </span>
          )}
        </div>

        {/* Course Code Chip */}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            padding: '2px 8px',
            borderRadius: '6px',
            backgroundColor: colors.wash,
            color: colors.accent,
            border: `1px solid ${colors.border}`,
            letterSpacing: '0.04em'
          }}
        >
          {session.courseCode} • Sec {session.section}
        </span>
      </div>

      {/* Row 2: Course Title & Faculty Meta */}
      <div>
        <h3
          style={{
            fontFamily: 'var(--font-brand)',
            fontSize: isCompact ? '15px' : '17px',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--ink)',
            margin: '0 0 3px 0',
            lineHeight: 1.25
          }}
        >
          {session.courseName}
        </h3>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--ink-soft)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <User size={12} color="var(--ink-faint)" />
          <span>{session.faculty}</span>
        </p>
      </div>

      {/* Row 3: Venue Pill, Academic Safety Context & Sync Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid var(--border)',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Venue Pill with Tactile Copy */}
          <button
            onClick={handleCopyVenue}
            title="Click to copy room code"
            aria-label={`Copy venue ${session.venue}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 9px',
              borderRadius: '8px',
              backgroundColor: 'var(--paper)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--card-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--paper)'}
          >
            <MapPin size={12} color="var(--mizu)" />
            <span>{session.venue}</span>
            {isCopied ? (
              <Check size={12} color="var(--moss)" />
            ) : (
              <Copy size={11} color="var(--ink-soft)" />
            )}
            {isCopied && (
              <span style={{ fontSize: '10px', color: 'var(--moss-text)', fontWeight: 600 }}>Copied</span>
            )}
          </button>

          {/* Academic Attendance Safety Margin Context */}
          {safeBunks !== null && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: isSafe ? 'var(--moss-text)' : 'var(--hanko-text)',
                backgroundColor: isSafe ? 'var(--wash-moss)' : 'var(--wash-hanko)',
                border: `1px solid ${isSafe ? 'rgba(110, 140, 99, 0.3)' : 'rgba(210, 84, 63, 0.3)'}`,
                padding: '3px 8px',
                borderRadius: '6px'
              }}
            >
              {isSafe ? (
                <ShieldCheck size={11} color="var(--moss)" />
              ) : (
                <AlertTriangle size={11} color="var(--hanko)" />
              )}
              <span>{isSafe ? `+${safeBunks} Safe` : '0 Buffer'}</span>
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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 10px',
            borderRadius: '8px',
            backgroundColor: 'var(--wash-mizu)',
            border: '1px solid rgba(0, 169, 184, 0.25)',
            color: 'var(--mizu)',
            fontSize: '11px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 169, 184, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--wash-mizu)'}
        >
          <Calendar size={12} />
          <span>Sync GCal</span>
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}

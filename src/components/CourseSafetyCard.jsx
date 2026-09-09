import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Check, SlidersHorizontal, User, Clock, BookOpen } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { COURSE_COLORS } from '../data/rosterData';
import { STATUTORY_THRESHOLD } from '../services/bunkCalculator';
import { playTactileClick } from '../services/soundEngine';

/**
 * CourseSafetyCard: High-Aesthetic Academic Safety Cockpit
 * Designed following taste-design, responsive-ui-and-creative-engine, and waibi-sabi directives.
 * Features:
 * - Brand typography in Plus Jakarta Sans
 * - Tabular figures in font-mono
 * - Mechanical NumberFlow rolling odometer
 * - Multi-layered Safety Horizon Dual-Track Gauge with 80% statutory needle
 * - 3 Glassmorphic micro-stat tiles
 * - Inline interactive quick-skip stepper (0 to 6 skips) with live recalculation
 * - Zero emojis, tactile micro-interactions
 */
export default function CourseSafetyCard({
  course,
  onOpenDeepSim,
  isCompact = false,
  className = ''
}) {
  // Retrieve course colors or fallback to institutional indigo
  const colors = COURSE_COLORS[course.code] || {
    accent: '#4E6E9C',
    border: 'rgba(78, 110, 156, 0.3)',
    wash: 'rgba(78, 110, 156, 0.12)',
    bg: '#2A4870'
  };

  const originalStats = course.stats;
  const projectedPct = originalStats.currentPercentage;
  const isSafe = projectedPct >= STATUTORY_THRESHOLD * 100;
  const isWarning = projectedPct >= STATUTORY_THRESHOLD * 100 && projectedPct < 85;
  const isDanger = projectedPct < STATUTORY_THRESHOLD * 100;
  const projectedSafeBunks = originalStats.safeBunksRemaining;

  // Status tokens
  let statusColor = 'var(--moss)';
  let statusTextColor = 'var(--moss-text)';
  let statusWash = 'var(--wash-moss)';
  let statusBorder = 'rgba(110, 140, 99, 0.3)';
  let statusLabel = 'Safe Zone';

  if (isDanger) {
    statusColor = 'var(--hanko)';
    statusTextColor = 'var(--hanko-text)';
    statusWash = 'var(--wash-hanko)';
    statusBorder = 'rgba(210, 84, 63, 0.35)';
    statusLabel = 'Debarment Risk';
  } else if (isWarning) {
    statusColor = 'var(--ochre)';
    statusTextColor = 'var(--ochre-text)';
    statusWash = 'var(--wash-ochre)';
    statusBorder = 'rgba(194, 145, 58, 0.35)';
    statusLabel = 'Caution Margin';
  }

  // Circular gauge calculations (r=18, circumference = 2 * PI * 18 = 113.1)
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, projectedPct)) / 100) * circumference;

  return (
    <div
      className={`course-safety-card ${className}`}
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = colors.border;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Top Course Color Accent Line */}
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

      {/* 1. Header Row: Course Meta + Circular Radial Ring Gauge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Course Code Chip + Credits */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                padding: '2px 7px',
                borderRadius: '6px',
                backgroundColor: colors.wash,
                color: colors.accent,
                border: `1px solid ${colors.border}`,
                letterSpacing: '0.04em'
              }}
            >
              {course.code}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
              {course.credits || 3.0} Credits • {course.term || 'Term-5'}
            </span>
          </div>

          {/* Course Title in Modern Plus Jakarta Sans */}
          <h3
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: isCompact ? '16px' : '17px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--ink)',
              margin: '0 0 3px 0',
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: isCompact ? 'nowrap' : 'normal'
            }}
            title={course.name}
          >
            {course.name}
          </h3>

          {/* Faculty Meta */}
          <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} color="var(--ink-faint)" />
            <span>{course.faculty}</span>
          </p>
        </div>

        {/* Circular Progress Gauge & Odometer Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: statusWash,
            border: `1px solid ${statusBorder}`,
            borderRadius: '12px',
            padding: '6px 8px',
            flexShrink: 0
          }}
        >
          {/* Radial SVG Mini Arc */}
          <div style={{ position: 'relative', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="38" height="38" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background ring */}
              <circle
                cx="20"
                cy="20"
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth="3.5"
                opacity="0.4"
              />
              {/* Active progress arc */}
              <circle
                cx="20"
                cy="20"
                r={radius}
                fill="none"
                stroke={statusColor}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.4s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease' }}
              />
            </svg>
            {/* Center Status Icon */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isSafe ? (
                <ShieldCheck size={14} color={statusColor} />
              ) : (
                <AlertTriangle size={14} color={statusColor} />
              )}
            </div>
          </div>

          {/* Odometer Numeric Percentage */}
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '17px',
                fontWeight: 800,
                color: statusTextColor,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'baseline'
              }}
            >
              <NumberFlow
                value={projectedPct}
                format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              />
              <span style={{ fontSize: '11px', fontWeight: 600, marginLeft: '1px' }}>%</span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: statusTextColor, marginTop: '2px', letterSpacing: '0.02em' }}>
              {statusLabel}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Safety Horizon Dual-Track Gauge */}
      <div>
        <div style={{ position: 'relative', width: '100%', height: '9px', backgroundColor: 'var(--stone)', borderRadius: '999px', overflow: 'hidden' }}>
          {/* Statutory 0-80% Risk Zone background shading */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '80%',
              backgroundColor: 'rgba(210, 84, 63, 0.08)'
            }}
          />

          {/* Active Attendance Fill with Gradient */}
          <div
            style={{
              width: `${Math.min(100, Math.max(0, projectedPct))}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${colors.accent} 0%, ${statusColor} 100%)`,
              borderRadius: '999px',
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />

          {/* 80% Mandatory Threshold Vertical Needle */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '80%',
              width: '2px',
              backgroundColor: 'var(--ink)',
              opacity: 0.85,
              zIndex: 3
            }}
          />
        </div>

        {/* Gauge Scale Labels with Tabular Monospace */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink-soft)',
            marginTop: '5px'
          }}
        >
          <span>0%</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: 'var(--ink)' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--mizu)', display: 'inline-block' }} />
            80% Statutory Rule
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* 3. Three Tactile Micro-Stat Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px'
        }}
      >
        {/* Tile 1: Conducted Sessions */}
        <div
          style={{
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '10px', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <BookOpen size={10} color="var(--ink-faint)" />
            <span>Conducted</span>
          </span>
          <div style={{ marginTop: '3px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'var(--ink)' }}>
            {course.attended} / {course.conducted}
            <span style={{ fontSize: '10px', color: 'var(--ink-soft)', fontWeight: 500, marginLeft: '3px' }}>
              ({(course.totalPlanned || 24) - course.conducted} left)
            </span>
          </div>
        </div>

        {/* Tile 2: Safe Bunks Remaining */}
        <div
          style={{
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '10px', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <ShieldCheck size={10} color="var(--moss)" />
            <span>Safe Margin</span>
          </span>
          <div
            style={{
              marginTop: '3px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '13px',
              color: isDanger ? 'var(--hanko-text)' : 'var(--moss-text)'
            }}
          >
            {isDanger ? (
              <span>0 Safe</span>
            ) : (
              <span>+{projectedSafeBunks} Safe</span>
            )}
          </div>
        </div>

        {/* Tile 3: Next Session Safety */}
        <div
          style={{
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '10px', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={10} color="var(--ink-faint)" />
            <span>Next Class</span>
          </span>
          <div style={{ marginTop: '3px' }}>
            {isDanger ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--hanko-text)',
                  backgroundColor: 'var(--wash-hanko)',
                  padding: '2px 5px',
                  borderRadius: '5px'
                }}
              >
                Must Attend
              </span>
            ) : originalStats.safeImmediateBunks > 0 ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--moss-text)',
                  backgroundColor: 'var(--wash-moss)',
                  padding: '2px 5px',
                  borderRadius: '5px'
                }}
              >
                Safe to Miss
              </span>
            ) : (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--ochre-text)',
                  backgroundColor: 'var(--wash-ochre)',
                  padding: '2px 5px',
                  borderRadius: '5px'
                }}
              >
                Zero Buffer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Interactive Inline Quick-Skip Stepper & Deep Sim Trigger */}
      {/* Row 4: Statutory Compliance Status & Details */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-soft)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: isDanger ? 'var(--hanko-text)' : (isWarning ? 'var(--ochre-text)' : 'var(--moss-text)'),
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <ShieldCheck size={13} color={statusColor} />
            {isDanger ? 'Immediate Attendance Required' : (isWarning ? 'Caution: Minimal Absence Buffer' : 'Compliant with 80% Policy')}
          </span>
        </div>

        {/* Detailed Course Standing Trigger */}
        <button
          onClick={() => {
            playTactileClick();
            onOpenDeepSim?.(course.code);
          }}
          title={`View Academic Standing for ${course.code}`}
          aria-label={`View academic standing for ${course.code}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '7px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            color: 'var(--ink)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--card-hover)';
            e.currentTarget.style.borderColor = 'var(--border-strong)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--paper)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <SlidersHorizontal size={12} color="var(--mizu)" />
          <span>Details</span>
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { Drawer } from 'vaul';
import { COURSE_COLORS } from '../data/courseColors';
import { getGoogleCalendarUrl } from '../services/calendarExport';
import { playTactileClick } from '../services/soundEngine';
import { toast } from 'sonner';
import {
  IconMapPin,
  IconChronometer,
  IconCopy,
  IconCheckmark,
  IconCross,
  IconTimetable
} from './icons';

/**
 * ClassDetailDrawer: 2026 Academic Lecture Dossier
 *
 * Provides a structured academic session dossier with hairline dividers,
 * monospace identifiers, tabular timings, and tactile action triggers.
 */
export default function ClassDetailDrawer({ isOpen, onClose, session, course }) {
  if (!session) return null;
  const courseCode = session.courseCode || 'CORE';
  const color = COURSE_COLORS[courseCode] || COURSE_COLORS.DEFAULT;

  const handleCopyVenue = () => {
    playTactileClick(600);
    navigator.clipboard.writeText(session.venue || 'MCR');
    toast.success(`Venue Copied: ${session.venue}`, {
      description: 'Room designation copied to clipboard'
    });
  };

  const handleGCalClick = () => {
    playTactileClick(500);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(28, 26, 23, 0.6)',
            zIndex: 80,
            backdropFilter: 'blur(4px)'
          }}
        />
        <Drawer.Content
          className="max-h-[85vh] overflow-y-auto editorial-slate"
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            backgroundColor: 'var(--card)',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            border: '1px solid var(--border)',
            borderBottom: 'none',
            boxShadow: '0 -8px 32px rgba(28, 26, 23, 0.16)',
            zIndex: 90,
            padding: '16px 20px 28px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            outline: 'none'
          }}
        >
          {/* Minimal Drag Handle Datum */}
          <div
            style={{
              width: '32px',
              height: '3px',
              borderRadius: '2px',
              backgroundColor: 'var(--border-strong)',
              margin: '0 auto 4px auto'
            }}
          />

          {/* Dossier Header: Course Code, Title & Close Button */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  color: color.accent,
                  backgroundColor: color.wash,
                  padding: '2px 7px',
                  borderRadius: '3px',
                  border: `1px solid ${color.border}`,
                  flexShrink: 0
                }}
              >
                {session.courseCode}
              </span>
              <Drawer.Title
                style={{
                  fontFamily: 'var(--font-brand)',
                  fontSize: '17px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                  margin: 0,
                  lineHeight: 1.3
                }}
              >
                {session.courseName}
              </Drawer.Title>
            </div>

            <button
              className="btn-tactile"
              onClick={onClose}
              aria-label="Close dossier"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-faint)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '3px'
              }}
            >
              <IconCross size={16} />
            </button>
          </div>

          <Drawer.Description style={{ display: 'none' }}>
            Academic lecture dossier for {session.courseName}
          </Drawer.Description>

          {/* Hairline Dossier Grid: Schedule vs Venue */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              overflow: 'hidden',
              backgroundColor: 'var(--paper)'
            }}
          >
            {/* Cell 1: Schedule */}
            <div style={{ padding: '12px 14px', borderRight: '1px solid var(--border)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--ink-faint)',
                  textTransform: 'uppercase'
                }}
              >
                <IconChronometer size={12} color="var(--mizu)" />
                <span>Schedule</span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontFeatureSettings: '"tnum"',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: 'var(--ink)',
                  marginTop: '4px'
                }}
              >
                {(session.startTime || '').slice(0, 5)} – {(session.endTime || '').slice(0, 5)}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontFeatureSettings: '"tnum"',
                  fontSize: '11px',
                  color: 'var(--ink-soft)',
                  marginTop: '2px'
                }}
              >
                {session.classDate}
              </div>
            </div>

            {/* Cell 2: Venue */}
            <div style={{ padding: '12px 14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--ink-faint)',
                  textTransform: 'uppercase'
                }}
              >
                <IconMapPin size={12} color="var(--mizu)" />
                <span>Venue</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: 'var(--ink)'
                  }}
                >
                  {session.venue || 'MCR'}
                </span>
                <button
                  className="btn-tactile"
                  onClick={handleCopyVenue}
                  title="Copy room code"
                  aria-label="Copy room code"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--mizu)',
                    padding: '2px'
                  }}
                >
                  <IconCopy size={12} />
                </button>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--ink-soft)',
                  marginTop: '2px'
                }}
              >
                {session.building || 'Main Campus'}
              </div>
            </div>
          </div>

          {/* Faculty & Session Identification */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--paper-subtle)',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-brand)' }}>
                {session.faculty || 'Prof. Faculty'}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-faint)',
                  marginTop: '2px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                Section {session.section || 'E'} · Session #{session.sessionNumber || '1'}
              </div>
            </div>

            <span
              className="hanko-stamp"
              style={{
                color: 'var(--indigo)',
                borderColor: 'rgba(var(--indigo-rgb), 0.45)',
                backgroundColor: 'var(--wash-indigo)'
              }}
            >
              TERM-V
            </span>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
            <a
              href={getGoogleCalendarUrl(session)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleGCalClick}
              className="btn-tactile"
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '4px',
                backgroundColor: 'var(--ink)',
                color: 'var(--paper)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textDecoration: 'none'
              }}
            >
              <IconTimetable size={13} color="var(--paper)" />
              <span>SYNC GOOGLE CALENDAR</span>
            </a>

            <button
              className="btn-tactile"
              onClick={handleCopyVenue}
              style={{
                padding: '9px 14px',
                borderRadius: '4px',
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <IconCopy size={13} color="var(--mizu)" />
              <span>COPY ROOM</span>
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

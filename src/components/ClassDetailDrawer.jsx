import React from 'react';
import { Drawer } from 'vaul';
import { MapPin, Clock, Calendar, User, Copy, X } from 'lucide-react';
import { COURSE_COLORS } from '../data/rosterData';
import { getGoogleCalendarUrl } from '../services/calendarExport';
import { toast } from 'sonner';

export default function ClassDetailDrawer({ isOpen, onClose, session, course }) {
  if (!session) return null;
  const courseCode = session.courseCode || 'CORE';
  const color = COURSE_COLORS[courseCode] || COURSE_COLORS.DEFAULT;

  const handleCopyVenue = () => {
    navigator.clipboard.writeText(session.venue || 'MCR');
    toast.success(`Venue Copied: ${session.venue}`, { description: 'Ready to share with batchmates' });
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 80,
          backdropFilter: 'blur(3px)'
        }} />
        <Drawer.Content style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          backgroundColor: 'var(--card)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
          zIndex: 90,
          padding: '16px 20px 32px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          outline: 'none'
        }}>
          {/* Top Drag Handle */}
          <div style={{
            width: '36px',
            height: '4px',
            borderRadius: '9999px',
            backgroundColor: 'var(--border)',
            margin: '0 auto 6px auto'
          }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                color: color.accent,
                backgroundColor: color.wash,
                padding: '3px 8px',
                borderRadius: '6px',
                border: `1px solid ${color.border}`
              }}>
                {session.courseCode}
              </span>
              <Drawer.Title style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: 0
              }}>
                {session.courseName}
              </Drawer.Title>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-soft)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>

          <Drawer.Description style={{ display: 'none' }}>
            Lecture details for {session.courseName}
          </Drawer.Description>

          {/* Timing & Venue Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            backgroundColor: 'var(--paper)',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> Schedule
              </span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginTop: '4px' }}>
                {session.startTime} - {session.endTime}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                {session.classDate}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> Venue
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                  {session.venue || 'Academic Block'}
                </span>
                <button
                  onClick={handleCopyVenue}
                  title="Copy venue"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--mizu)',
                    padding: '2px'
                  }}
                >
                  <Copy size={13} />
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                {session.building || 'Main Campus'}
              </div>
            </div>
          </div>

          {/* Faculty Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            backgroundColor: 'var(--paper)',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--wash-indigo)',
                color: 'var(--indigo)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                  {session.faculty || 'Prof. Faculty'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                  Section {session.section || 'E'} • Session #{session.sessionNumber || '1'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <a
              href={getGoogleCalendarUrl(session)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: 'var(--ink)',
                color: 'var(--paper)',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <Calendar size={14} /> Add to Google Calendar
            </a>

            <button
              onClick={handleCopyVenue}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Copy size={14} /> Copy Room
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

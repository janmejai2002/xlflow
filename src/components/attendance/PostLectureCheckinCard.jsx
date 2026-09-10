import React, { useState, useEffect } from 'react';
import { Check, X, Ban, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { selfAttendanceStore } from '../../services/selfAttendanceStore';
import { playTactileClick } from '../../services/soundEngine';

export default function PostLectureCheckinCard({ schedule = [], courses = [], isSlim = false }) {
  const [unmarkedLecture, setUnmarkedLecture] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed || !schedule.length) return;

    // Find any past or today's lecture that has not been marked in self-attendance
    const today = new Date().toISOString().slice(0, 10);
    
    // Look for today's lectures or most recent conducted lecture
    const pending = schedule.find(s => {
      const isMarked = selfAttendanceStore.getSessionStatus(s.sessionId);
      return !isMarked;
    });

    setUnmarkedLecture(pending || null);
  }, [schedule, isDismissed]);

  if (isDismissed || !unmarkedLecture) return null;

  const handleMark = (status) => {
    playTactileClick(status === 'present' ? 700 : 400);
    selfAttendanceStore.markSession(unmarkedLecture.sessionId, status, {
      courseCode: unmarkedLecture.courseCode,
      courseName: unmarkedLecture.courseName,
      classDate: unmarkedLecture.classDate,
      venue: unmarkedLecture.venue
    });
    setUnmarkedLecture(null);
  };

  if (isSlim) {
    return (
      <div style={{
        backgroundColor: 'var(--card)',
        border: '1px solid rgba(0, 169, 184, 0.3)',
        borderRadius: '10px',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        flexShrink: 0,
        animation: 'sectorFadeIn 0.2s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <Sparkles size={13} color="var(--mizu)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mizu)', letterSpacing: '0.04em' }}>
            CHECK-IN:
          </span>
          <span style={{ fontSize: '11px', color: 'var(--ink)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Did you attend {unmarkedLecture.courseCode} ({unmarkedLecture.venue})?
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => handleMark('present')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'var(--moss)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Check size={11} />
            <span>Present</span>
          </button>
          <button
            onClick={() => handleMark('bunk')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'var(--paper)',
              color: 'var(--hanko)',
              border: '1px solid rgba(210, 84, 63, 0.3)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <X size={11} />
            <span>Bunk</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            title="Dismiss check-in"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-faint)',
              fontSize: '10px',
              cursor: 'pointer',
              padding: '2px 4px'
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--card)',
      border: '1px solid rgba(0, 169, 184, 0.35)',
      borderRadius: '16px',
      padding: '14px 18px',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '14px',
      position: 'relative',
      overflow: 'hidden',
      animation: 'sectorFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Top Accent Strip */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, var(--mizu) 0%, var(--moss) 100%)'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          backgroundColor: 'var(--wash-mizu)',
          color: 'var(--mizu)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Sparkles size={16} />
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--mizu)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Self-Attendance Check-In
            </span>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>•</span>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
              {unmarkedLecture.venue}
            </span>
          </div>

          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--ink)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Did you attend {unmarkedLecture.courseCode} ({unmarkedLecture.courseName})?
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
            {unmarkedLecture.classDate} • {unmarkedLecture.startTime.slice(0, 5)} - {unmarkedLecture.endTime.slice(0, 5)}
          </div>
        </div>
      </div>

      {/* 1-Tap Action Cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          onClick={() => handleMark('present')}
          title="Mark I Attended This Class"
          aria-label="Mark I attended this class"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--moss)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
            transition: 'transform 0.1s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
        >
          <Check size={13} />
          <span>Attended</span>
        </button>

        <button
          onClick={() => handleMark('absent')}
          title="Mark Bunked / Absent"
          aria-label="Mark bunked or absent"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--wash-hanko)',
            color: 'var(--hanko)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--wash-hanko)'}
        >
          <X size={13} />
          <span>Bunked</span>
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          title="Dismiss check-in"
          aria-label="Dismiss check-in"
          style={{
            padding: '6px 8px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            color: 'var(--ink-faint)',
            border: 'none',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
}

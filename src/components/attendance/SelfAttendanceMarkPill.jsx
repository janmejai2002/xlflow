import React, { useState } from 'react';
import { Check, X, Ban, ChevronDown, MessageSquare } from 'lucide-react';
import { selfAttendanceStore, ABSENCE_REASONS } from '../../services/selfAttendanceStore';
import { playTactileClick } from '../../services/soundEngine';

export default function SelfAttendanceMarkPill({
  sessionId,
  courseCode,
  courseName,
  classDate,
  venue,
  size = 'md', // 'sm' | 'md'
  showReasons = true
}) {
  const [isOpenReasonMenu, setIsOpenReasonMenu] = useState(false);
  const [note, setNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const mark = selfAttendanceStore.getSessionStatus(sessionId);

  const handleMark = (status, reason = '') => {
    playTactileClick(status === 'present' ? 650 : status === 'absent' ? 450 : 350);
    selfAttendanceStore.markSession(sessionId, status, {
      courseCode,
      courseName,
      classDate,
      venue,
      reason,
      note
    });
    setIsOpenReasonMenu(false);
    setIsAddingNote(false);
  };

  const handleUnmark = () => {
    playTactileClick(300);
    selfAttendanceStore.unmarkSession(sessionId);
    setIsOpenReasonMenu(false);
  };

  const isSmall = size === 'sm';

  // If already marked, show high-contrast tactile status pill
  if (mark) {
    const isPresent = mark.status === 'present';
    const isAbsent = mark.status === 'absent';
    const isCancelled = mark.status === 'cancelled';
    const reasonObj = ABSENCE_REASONS.find(r => r.id === mark.reason);

    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpenReasonMenu(prev => !prev);
          }}
          title={`Marked: ${mark.status.toUpperCase()} ${reasonObj ? `(${reasonObj.label})` : ''}. Click to change or unmark.`}
          aria-label={`Marked ${mark.status}. Click to change.`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: isSmall ? '2px 8px' : '4px 10px',
            borderRadius: '9999px',
            fontSize: isSmall ? '10px' : '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            backgroundColor: isPresent ? 'var(--wash-moss)' : isAbsent ? 'var(--wash-hanko)' : 'var(--stone)',
            color: isPresent ? 'var(--moss-text)' : isAbsent ? 'var(--hanko-text)' : 'var(--ink-soft)',
            border: `1px solid ${isPresent ? 'rgba(var(--moss-rgb), 0.35)' : isAbsent ? 'rgba(var(--hanko-rgb), 0.35)' : 'var(--border)'}`
          }}
        >
          {isPresent && <Check size={isSmall ? 11 : 13} color="var(--moss)" />}
          {isAbsent && <X size={isSmall ? 11 : 13} color="var(--hanko)" />}
          {isCancelled && <Ban size={isSmall ? 11 : 13} color="var(--ink-faint)" />}
          
          <span>
            {isPresent ? 'Present' : isAbsent ? `Bunked${reasonObj ? ` • ${reasonObj.label.split('/')[0].trim()}` : ''}` : 'Cancelled'}
          </span>
          <ChevronDown size={11} opacity={0.6} />
        </button>

        {/* Change / Unmark Popover */}
        {isOpenReasonMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              zIndex: 50,
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: 'var(--shadow-lg)',
              minWidth: '220px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink-soft)', padding: '2px 6px' }}>
              CHANGE ATTENDANCE
            </div>

            <button
              onClick={() => handleMark('present')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '6px',
                border: 'none',
                background: isPresent ? 'var(--wash-moss)' : 'transparent',
                color: 'var(--ink)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Check size={13} color="var(--moss)" />
              <span>Mark Present</span>
            </button>

            <button
              onClick={() => handleMark('absent', 'personal')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '6px',
                border: 'none',
                background: isAbsent ? 'var(--wash-hanko)' : 'transparent',
                color: 'var(--ink)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <X size={13} color="var(--hanko)" />
              <span>Mark Absent / Bunk</span>
            </button>

            {isAbsent && (
              <div style={{ padding: '4px 6px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '2px 0' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--ink-faint)', marginBottom: '4px' }}>
                  TAG REASON FOR APPEAL
                </div>
                {ABSENCE_REASONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleMark('absent', r.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      border: 'none',
                      background: mark.reason === r.id ? 'var(--wash-ochre)' : 'transparent',
                      color: mark.reason === r.id ? 'var(--ochre-text)' : 'var(--ink-soft)',
                      fontSize: '10px',
                      fontWeight: mark.reason === r.id ? 700 : 500,
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    • {r.label}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => handleMark('cancelled')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '6px',
                border: 'none',
                background: isCancelled ? 'var(--stone)' : 'transparent',
                color: 'var(--ink)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Ban size={13} color="var(--ink-faint)" />
              <span>Class Was Cancelled</span>
            </button>

            <button
              onClick={handleUnmark}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: 'var(--ink-faint)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                borderTop: '1px solid var(--border)',
                marginTop: '2px'
              }}
            >
              <span>Clear / Reset Mark</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Unmarked state: Fast 1-tap buttons
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'var(--paper)',
        padding: isSmall ? '1px 3px' : '2px 4px',
        borderRadius: '9999px',
        border: '1px solid var(--border)'
      }}
    >
      <button
        onClick={() => handleMark('present')}
        title="Quick Mark Present"
        aria-label="Quick mark present"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: isSmall ? '2px 6px' : '3px 8px',
          borderRadius: '9999px',
          border: 'none',
          backgroundColor: 'transparent',
          color: 'var(--moss)',
          fontSize: isSmall ? '10px' : '11px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--wash-moss)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <Check size={isSmall ? 11 : 12} />
        <span>Present</span>
      </button>

      <span style={{ color: 'var(--border)', fontSize: '10px' }}>|</span>

      <button
        onClick={() => handleMark('absent', 'personal')}
        title="Quick Mark Bunk / Absent"
        aria-label="Quick mark absent"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: isSmall ? '2px 6px' : '3px 8px',
          borderRadius: '9999px',
          border: 'none',
          backgroundColor: 'transparent',
          color: 'var(--hanko)',
          fontSize: isSmall ? '10px' : '11px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--wash-hanko)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <X size={isSmall ? 11 : 12} />
        <span>Bunk</span>
      </button>
    </div>
  );
}

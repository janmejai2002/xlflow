import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  MapPin,
  ShieldCheck,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { playSoftClick, playHapticSuccess, playHarmonicChime } from '../services/soundEngine';
import { selfAttendanceStore } from '../services/selfAttendanceStore';
import { calculateBunkStats } from '../services/bunkCalculator';

export default function DynamicAmbientIsland({
  schedule = [],
  courses = [],
  deadlines = [],
  student = {},
  onInspectSession,
  onSelectTab,
  isCompact = false,
  mode = 'subbar' // 'subbar' (mobile dedicated ribbon) | 'pill' (desktop capsule)
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const popoverRef = useRef(null);
  const [storeVer, setStoreVer] = useState(0);

  useEffect(() => {
    const unsub = selfAttendanceStore.subscribe(() => setStoreVer(v => v + 1));
    return unsub;
  }, []);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen]);

  // Sort schedule chronologically (memoized with fast string comparison)
  const sortedSessions = useMemo(() => {
    return [...schedule].sort((a, b) => {
      const timeA = `${a.classDate}T${a.startTime || '08:00:00'}`;
      const timeB = `${b.classDate}T${b.startTime || '08:00:00'}`;
      return timeA.localeCompare(timeB);
    });
  }, [schedule]);

  // Find next upcoming session
  const nextSession = useMemo(() => {
    if (!sortedSessions.length) return null;
    const nowMs = Date.now();
    return sortedSessions.find(s => {
      const sessionTime = new Date(`${s.classDate}T${s.endTime || '23:59:59'}`).getTime();
      return sessionTime >= nowMs;
    }) || sortedSessions[0];
  }, [sortedSessions]);

  // Comprehensive session state, status badge & timing calculations
  const sessionState = useMemo(() => {
    if (!nextSession) {
      return {
        isLive: false,
        badge: 'All Clear',
        label: 'No Classes Scheduled',
        color: 'var(--moss)',
        wash: 'var(--wash-moss)'
      };
    }
    const now = new Date();
    const sessionStart = new Date(`${nextSession.classDate}T${nextSession.startTime || '08:00:00'}`).getTime();
    const sessionEnd = new Date(`${nextSession.classDate}T${nextSession.endTime || '23:59:59'}`).getTime();
    const nowMs = now.getTime();

    if (nowMs >= sessionStart && nowMs <= sessionEnd) {
      const remMins = Math.max(1, Math.round((sessionEnd - nowMs) / (60 * 1000)));
      return {
        isLive: true,
        badge: 'Ongoing Live',
        label: `Ends in ${remMins}m`,
        color: 'var(--hanko)',
        wash: 'var(--wash-hanko)'
      };
    }

    const diffMs = sessionStart - nowMs;
    if (diffMs < 0) {
      return {
        isLive: false,
        badge: 'Done',
        label: 'Session Ended',
        color: 'var(--ink-faint)',
        wash: 'var(--paper)'
      };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs <= 2 * 60 * 60 * 1000) {
      const timeStr = diffHours > 0 ? `In ${diffHours}h ${diffMins}m` : `In ${diffMins}m`;
      return {
        isLive: false,
        badge: 'Next Up',
        label: timeStr,
        color: 'var(--ochre)',
        wash: 'var(--wash-ochre)'
      };
    }

    const mmStr = now.getMonth() + 1 < 10 ? '0' + (now.getMonth() + 1) : String(now.getMonth() + 1);
    const ddStr = now.getDate() < 10 ? '0' + now.getDate() : String(now.getDate());
    const todayStr = `${now.getFullYear()}-${mmStr}-${ddStr}`;
    const isToday = nextSession.classDate === todayStr;

    if (isToday) {
      const timeStr = `Today at ${nextSession.startTime ? nextSession.startTime.slice(0, 5) : '00:00'}`;
      return {
        isLive: false,
        badge: 'Today',
        label: timeStr,
        color: 'var(--mizu)',
        wash: 'var(--wash-mizu)'
      };
    }

    const days = Math.floor(diffHours / 24);
    const remH = diffHours % 24;
    const timeStr = days > 0 ? `In ${days}d ${remH}h` : `In ${diffHours}h`;
    return {
      isLive: false,
      badge: 'Upcoming',
      label: timeStr,
      color: 'var(--indigo)',
      wash: 'var(--wash-indigo)'
    };
  }, [nextSession]);

  // Course standing, used by the expanded panel
  const evaluatedCourses = useMemo(() => {
    return courses.map(course => {
      const recon = selfAttendanceStore.getCourseStats(course, schedule);
      return {
        ...course,
        stats: recon ? recon.active : calculateBunkStats(course.attended, course.conducted, course.totalPlanned),
        discrepancy: recon?.discrepancy
      };
    });
  }, [courses, schedule, storeVer]);

  const { dangerCourses, warningCourses, discrepancies } = useMemo(() => {
    const danger = [];
    const warning = [];
    const disc = [];
    for (const c of evaluatedCourses) {
      if (c.stats.tier === 'danger') danger.push(c);
      else if (c.stats.tier === 'warning') warning.push(c);
      if (c.discrepancy?.hasDiscrepancy) disc.push(c);
    }
    return { dangerCourses: danger, warningCourses: warning, discrepancies: disc };
  }, [evaluatedCourses]);

  const copyRoomCode = (e) => {
    e?.stopPropagation();
    if (!nextSession?.venue) return;
    navigator.clipboard.writeText(nextSession.venue);
    setCopiedCode(true);
    playHapticSuccess();
    toast.success(`Copied Venue Code: ${nextSession.venue}`, {
      description: `${nextSession.courseCode} • Scheduled in ${nextSession.venue}`
    });
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const copyDisputeDossier = (e) => {
    e?.stopPropagation();
    if (discrepancies.length === 0) return;
    const firstDisc = discrepancies[0];
    const memo = `Subject: Academic Attendance Verification & ERP Discrepancy Reconciliation - ${firstDisc.code}
To: Dean of Academics / Course Coordinator (${firstDisc.faculty || 'Office of Programs'})
From: ${student?.name || 'Student'} (Roll No. ${student?.id || '[Roll No]'}, Section ${student?.section || 'EF'})
Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}

Respected Professor / Administration,

I am writing to formally request a reconciliation of attendance records for the course ${firstDisc.code}: ${firstDisc.name}.

Upon cross-verifying my verified daily attendance log with the current ERP snapshot:
- Official ERP Record: ${firstDisc.officialStats?.attended || firstDisc.attended} / ${firstDisc.officialStats?.conducted || firstDisc.conducted} sessions (${firstDisc.officialStats?.percentage || firstDisc.percentage}%)
- Personal Verified Log: ${firstDisc.selfStats?.attended || firstDisc.attended} / ${firstDisc.selfStats?.conducted || firstDisc.conducted} sessions
- Identified Delta: Discrepancy of ${firstDisc.discrepancy?.difference > 0 ? `+${firstDisc.discrepancy?.difference}` : firstDisc.discrepancy?.difference} session(s) due to administrative lag or manual roster entry.

I have attended all listed lectures punctually. Kindly verify the physical/biometric roster and update the ERP record accordingly to maintain accurate compliance with the statutory 80% attendance policy.

Warm regards,
${student?.name || 'Student'}
Roll No: ${student?.id || '[Roll No]'}
${student?.program || 'PGDM'} Batch • XLRI Jamshedpur / Delhi-NCR`;

    navigator.clipboard.writeText(memo);
    playHapticSuccess();
    toast.success('Dispute Dossier Copied to Clipboard!', {
      description: 'Formal Dean Appeal email draft is ready to paste into Outlook.'
    });
  };

  const renderPopoverDeck = (isSubbar = false) => (
    <div
      style={{
        position: isSubbar ? 'absolute' : (isCompact ? 'fixed' : 'absolute'),
        top: isSubbar ? '100%' : (isCompact ? 'max(60px, calc(env(safe-area-inset-top, 10px) + 50px))' : 'calc(100% + 8px)'),
        left: isSubbar ? '8px' : (isCompact ? '12px' : '50%'),
        right: isSubbar ? '8px' : (isCompact ? '12px' : 'auto'),
        transform: isSubbar || isCompact ? 'none' : 'translateX(-50%)',
        width: isSubbar || isCompact ? 'auto' : '320px',
        maxWidth: isSubbar ? '520px' : (isCompact ? '420px' : '320px'),
        margin: isSubbar ? '4px auto 0 auto' : (isCompact ? '0 auto' : '0'),
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '14px',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        animation: 'sectorFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Header Row: Imminent Flight Deck */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: sessionState.wash,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={11} color={sessionState.color} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em' }}>
            {sessionState.isLive ? 'CURRENT SESSION IN PROGRESS' : 'IMMINENT LECTURE'}
          </span>
        </div>
        <span style={{
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          color: sessionState.color,
          backgroundColor: sessionState.wash,
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          {sessionState.label}
        </span>
      </div>

      {/* Next Class Hero Tile */}
      {nextSession ? (
        <div style={{
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--mizu)',
              backgroundColor: 'var(--wash-mizu)',
              padding: '2px 6px',
              borderRadius: '5px'
            }}>
              {nextSession.courseCode}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
              {nextSession.startTime?.slice(0, 5)} - {nextSession.endTime?.slice(0, 5)}
            </span>
          </div>

          <div style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--ink)',
            marginBottom: '4px',
            lineHeight: 1.3
          }}>
            {nextSession.courseName}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginBottom: '10px' }}>
            Prof. {nextSession.faculty || 'Faculty'}
          </div>

          {/* Venue Chip with 1-Click Copy */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 10px',
            backgroundColor: 'var(--card)',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={13} color="var(--mizu)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                {nextSession.venue}
              </span>
            </div>
            <button
              onClick={copyRoomCode}
              title="Copy venue code to clipboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: copiedCode ? 'var(--wash-moss)' : 'var(--paper)',
                border: copiedCode ? '1px solid var(--moss)' : '1px solid var(--border)',
                color: copiedCode ? 'var(--moss-text)' : 'var(--ink)',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {copiedCode ? <Check size={11} color="var(--moss)" /> : <Copy size={11} />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--ink-soft)', textAlign: 'center', padding: '12px' }}>
          No upcoming classes scheduled.
        </div>
      )}

      {/* Courses below the 80% line */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        backgroundColor: dangerCourses.length === 0 ? 'var(--wash-moss)' : 'var(--wash-hanko)',
        border: `1px solid ${dangerCourses.length === 0 ? 'rgba(var(--moss-rgb), 0.3)' : 'rgba(var(--hanko-rgb), 0.3)'}`,
        borderRadius: '12px'
      }}>
        <span style={{
          fontSize: '12.5px',
          fontWeight: 700,
          color: dangerCourses.length === 0 ? 'var(--moss-text)' : 'var(--hanko-text)'
        }}>
          {dangerCourses.length === 0
            ? 'Every course above 80%'
            : `${dangerCourses.length} course${dangerCourses.length === 1 ? '' : 's'} below 80%`}
        </span>
        {warningCourses.length > 0 && (
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ochre-text)' }}>
            {warningCourses.length} tight
          </span>
        )}
      </div>

      {/* ERP Discrepancy Dispute Dossier 1-Click Action */}
      {discrepancies.length > 0 && (
        <div style={{
          backgroundColor: 'var(--paper)',
          border: '1px solid rgba(var(--ochre-rgb), 0.35)',
          borderRadius: '10px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: 'var(--ochre-text)' }}>
            <AlertTriangle size={12} color="var(--ochre)" />
            <span>ERP Lag Detected ({discrepancies.length} delta)</span>
          </div>
          <p style={{ fontSize: '10.5px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.35 }}>
            Your sovereign log differs from ERP. Copy a respectful Dean Appeal memo:
          </p>
          <button
            onClick={copyDisputeDossier}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 10px',
              backgroundColor: 'var(--wash-ochre)',
              border: '1px solid rgba(var(--ochre-rgb), 0.4)',
              borderRadius: '6px',
              color: 'var(--ochre-text)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
          >
            <FileText size={12} />
            <span>Copy Dean Dispute Email</span>
          </button>
        </div>
      )}

      {/* Bottom Quick Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', paddingTop: '4px' }}>
        <button
          onClick={() => {
            playSoftClick(750);
            setIsOpen(false);
            if (nextSession) onInspectSession?.(nextSession);
            else onSelectTab?.('timetable');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: 'var(--ink)',
            border: 'none',
            color: 'var(--paper)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <span>View in Timetable</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );

  // 1. SUB-HEADER AMBIENT BAR MODE (Default for Mobile Header)
  if (mode === 'subbar') {
    return (
      <div
        ref={popoverRef}
        style={{
          width: '100%',
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            playSoftClick(880);
            setIsOpen(prev => !prev);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              playSoftClick(880);
              setIsOpen(prev => !prev);
            }
          }}
          title="Tap to expand lecture flight deck & attendance margin"
          aria-label="Academic status ticker"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            backgroundColor: isOpen
              ? 'var(--card)'
              : sessionState.isLive
              ? 'rgba(var(--hanko-rgb), 0.08)'
              : 'var(--paper)',
            borderTop: '1px solid var(--border)',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            userSelect: 'none'
          }}
        >
          {/* Left: Indicator dot + Status Badge + Course Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: sessionState.color,
              boxShadow: sessionState.isLive ? `0 0 8px ${sessionState.color}` : 'none',
              flexShrink: 0
            }} />

            <span style={{
              fontSize: '9.5px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
              padding: '1.5px 6px',
              borderRadius: '4px',
              backgroundColor: sessionState.wash,
              color: sessionState.color,
              textTransform: 'uppercase',
              flexShrink: 0
            }}>
              {sessionState.badge}
            </span>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minWidth: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 800,
                fontFamily: 'var(--font-brand)',
                color: 'var(--ink)'
              }}>
                {nextSession?.courseCode || 'No Classes'}
              </span>
              {nextSession?.courseName && (
                <span style={{
                  fontSize: '11px',
                  color: 'var(--ink-soft)',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  • {nextSession.courseName}
                </span>
              )}
            </div>

            {nextSession?.venue && (
              <span
                onClick={copyRoomCode}
                title="Click to copy venue code"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  flexShrink: 0
                }}
              >
                <MapPin size={9} color="var(--mizu)" />
                {copiedCode ? 'COPIED' : nextSession.venue}
              </span>
            )}
          </div>

          {/* Right: Countdown & Chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: sessionState.isLive ? 'var(--hanko)' : 'var(--ink-soft)'
            }}>
              {sessionState.label}
            </span>
            <ChevronDown
              size={13}
              color="var(--ink-soft)"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </div>
        </div>

        {isOpen && renderPopoverDeck(true)}
      </div>
    );
  }

  // 2. PILL CAPSULE MODE (Desktop Horizon Topbar)
  return (
    <div ref={popoverRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => {
          playSoftClick(880);
          setIsOpen(prev => !prev);
        }}
        title="Next lecture and attendance standing"
        aria-label="Next lecture and attendance standing"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isCompact ? '6px' : '8px',
          height: isCompact ? '32px' : '34px',
          padding: isCompact ? '0 10px' : '0 12px',
          backgroundColor: isOpen ? 'var(--card)' : 'var(--paper)',
          border: `1px solid ${isOpen ? 'var(--mizu)' : 'var(--border)'}`,
          borderRadius: '9999px',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 2px rgba(var(--mizu-rgb), 0.18), var(--shadow-sm)' : '0 1px 2px rgba(0,0,0,0.04)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          maxWidth: isCompact ? '190px' : '320px',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--mizu)';
            e.currentTarget.style.backgroundColor = 'var(--card)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.backgroundColor = 'var(--paper)';
          }
        }}
      >
        {/* Pulsing Status Dot */}
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: sessionState.color,
          boxShadow: `0 0 6px ${sessionState.color}`,
          flexShrink: 0
        }} />

        {/* Dynamic Display Text */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11.5px',
          fontWeight: 600,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--mizu)',
              letterSpacing: '-0.02em'
            }}>
              {nextSession?.venue || 'Room --'}
            </span>
            <span style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>•</span>
            <span style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>{sessionState.label}</span>
          </span>
        </div>

        {/* Expand Indicator */}
        <ChevronDown
          size={12}
          color="var(--ink-soft)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }}
        />
      </button>

      {isOpen && renderPopoverDeck(false)}
    </div>
  );
}

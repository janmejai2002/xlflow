import React, { useState, useEffect, useRef } from 'react';
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
  onInspectSession,
  onSelectTab,
  isCompact = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeCycle, setActiveCycle] = useState(0); // 0: Next Lecture, 1: Peace of Mind
  const popoverRef = useRef(null);
  const [, setStoreVer] = useState(0);

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

  // Subtle 8s carousel cycle when closed (unless audio is active)
  useEffect(() => {
    if (isOpen) return;
    const interval = setInterval(() => {
      setActiveCycle(prev => (prev + 1) % 3);
    }, 7000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Find next upcoming session
  const now = new Date();
  const sortedSessions = [...schedule].sort((a, b) => {
    const timeA = new Date(`${a.classDate}T${a.startTime || '08:00:00'}`).getTime();
    const timeB = new Date(`${b.classDate}T${b.startTime || '08:00:00'}`).getTime();
    return timeA - timeB;
  });

  const nextSession = sortedSessions.find(s => {
    const sessionTime = new Date(`${s.classDate}T${s.endTime || '23:59:59'}`).getTime();
    return sessionTime >= now.getTime();
  }) || sortedSessions[0];

  // Calculate time remaining string
  const getTimeRemaining = (session) => {
    if (!session) return 'No Classes';
    const sessionStart = new Date(`${session.classDate}T${session.startTime || '08:00:00'}`).getTime();
    const diffMs = sessionStart - now.getTime();

    if (diffMs < 0) {
      const sessionEnd = new Date(`${session.classDate}T${session.endTime || '23:59:59'}`).getTime();
      if (sessionEnd >= now.getTime()) return 'Ongoing Live';
      return 'Session Ended';
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      const remHours = diffHours % 24;
      return `In ${days}d ${remHours}h`;
    }
    if (diffHours > 0) return `In ${diffHours}h ${diffMins}m`;
    return `In ${diffMins}m`;
  };

  const timeRemainingStr = getTimeRemaining(nextSession);

  // Compute Academic Peace of Mind (0 - 100)
  const evaluatedCourses = courses.map(course => {
    const recon = selfAttendanceStore.getCourseStats(course, schedule);
    return {
      ...course,
      stats: recon ? recon.active : calculateBunkStats(course.attended, course.conducted, course.totalPlanned),
      discrepancy: recon?.discrepancy
    };
  });

  const dangerCourses = evaluatedCourses.filter(c => c.stats.tier === 'danger');
  const warningCourses = evaluatedCourses.filter(c => c.stats.tier === 'warning');
  const discrepancies = evaluatedCourses.filter(c => c.discrepancy?.hasDiscrepancy);

  let peaceOfMindScore = 98;
  if (dangerCourses.length > 0) peaceOfMindScore -= dangerCourses.length * 16;
  if (warningCourses.length > 0) peaceOfMindScore -= warningCourses.length * 6;
  if (discrepancies.length > 0) peaceOfMindScore -= discrepancies.length * 3;
  peaceOfMindScore = Math.max(45, Math.min(100, peaceOfMindScore));

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
From: Janmejai Singh (Roll No. B25349, Section EF)
Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}

Respected Professor / Administration,

I am writing to formally request a reconciliation of attendance records for the course ${firstDisc.code}: ${firstDisc.name}.

Upon cross-verifying my verified daily attendance log with the current ERP snapshot:
- Official ERP Record: ${firstDisc.officialStats?.attended || firstDisc.attended} / ${firstDisc.officialStats?.conducted || firstDisc.conducted} sessions (${firstDisc.officialStats?.percentage || firstDisc.percentage}%)
- Personal Verified Log: ${firstDisc.selfStats?.attended || firstDisc.attended} / ${firstDisc.selfStats?.conducted || firstDisc.conducted} sessions
- Identified Delta: Discrepancy of ${firstDisc.discrepancy?.difference > 0 ? `+${firstDisc.discrepancy?.difference}` : firstDisc.discrepancy?.difference} session(s) due to administrative lag or manual roster entry.

I have attended all listed lectures punctually. Kindly verify the physical/biometric roster and update the ERP record accordingly to maintain accurate compliance with the statutory 80% attendance policy.

Warm regards,
Janmejai Singh
Roll No: B25349
BM Batch 2024-26 • XLRI Jamshedpur / Delhi-NCR`;

    navigator.clipboard.writeText(memo);
    playHapticSuccess();
    toast.success('Dispute Dossier Copied to Clipboard!', {
      description: 'Formal Dean Appeal email draft is ready to paste into Outlook.'
    });
  };

  const statusColor = dangerCourses.length > 0 ? 'var(--hanko)' : (warningCourses.length > 0 ? 'var(--ochre)' : 'var(--moss)');

  return (
    <div ref={popoverRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {/* Morphing Dynamic Island Capsule */}
      <button
        onClick={() => {
          playSoftClick(880);
          setIsOpen(prev => !prev);
        }}
        title="Dynamic Ambient Island: Glanceable Lecture Countdown & Academic Peace of Mind"
        aria-label="Dynamic Ambient Island"
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
            backgroundColor: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
            flexShrink: 0
          }} />

        {/* Dynamic Display Text based on Cycle & State */}
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
          {activeCycle === 1 ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: peaceOfMindScore >= 90 ? 'var(--moss-text)' : 'var(--ochre-text)' }}>
              <ShieldCheck size={12} color={peaceOfMindScore >= 90 ? 'var(--moss)' : 'var(--ochre)'} />
              <span>{peaceOfMindScore}% Peace</span>
            </span>
          ) : (
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
              <span style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>{timeRemainingStr}</span>
            </span>
          )}
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

      {/* 2026 Interactive Glance Popover Deck */}
      {isOpen && (
        <div
          style={{
            position: isCompact ? 'fixed' : 'absolute',
            top: isCompact ? 'max(60px, calc(env(safe-area-inset-top, 10px) + 50px))' : 'calc(100% + 8px)',
            left: isCompact ? '12px' : '50%',
            right: isCompact ? '12px' : 'auto',
            transform: isCompact ? 'none' : 'translateX(-50%)',
            width: isCompact ? 'auto' : '320px',
            maxWidth: isCompact ? '420px' : '320px',
            margin: isCompact ? '0 auto' : '0',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '14px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.22)',
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
                backgroundColor: 'var(--wash-mizu)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={11} color="var(--mizu)" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em' }}>
                IMMINENT LECTURE
              </span>
            </div>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--mizu)',
              backgroundColor: 'var(--wash-mizu)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {timeRemainingStr}
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
                Prof. {nextSession.faculty}
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

          {/* Academic Peace-of-Mind Gauge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            backgroundColor: peaceOfMindScore >= 90 ? 'var(--wash-moss)' : 'var(--wash-ochre)',
            border: `1px solid ${peaceOfMindScore >= 90 ? 'rgba(var(--moss-rgb), 0.3)' : 'rgba(var(--ochre-rgb), 0.3)'}`,
            borderRadius: '12px'
          }}>
            <div>
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                color: peaceOfMindScore >= 90 ? 'var(--moss-text)' : 'var(--ochre-text)',
                letterSpacing: '0.04em'
              }}>
                ACADEMIC WELLNESS
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 800,
                color: peaceOfMindScore >= 90 ? 'var(--moss-text)' : 'var(--ochre-text)',
                marginTop: '1px'
              }}>
                {peaceOfMindScore}% Peace of Mind
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: peaceOfMindScore >= 90 ? 'var(--moss-text)' : 'var(--ochre-text)'
            }}>
              {dangerCourses.length === 0 ? 'All 80% Safe' : `${dangerCourses.length} Need Attention`}
            </span>
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
                padding: '7px',
                borderRadius: '8px',
                backgroundColor: 'var(--ink)',
                border: 'none',
                color: 'var(--paper)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>Inspect Class</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

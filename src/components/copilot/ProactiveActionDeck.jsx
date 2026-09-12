import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Compass,
  ArrowRight,
  Copy,
  Check,
  Zap,
  Sliders,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { playSoftClick, playHapticSuccess } from '../../services/soundEngine';
import { calculateBunkStats } from '../../services/bunkCalculator';
import { selfAttendanceStore } from '../../services/selfAttendanceStore';

export default function ProactiveActionDeck({
  context = {},
  onExecuteAction,
  onSendQuery,
  isCompact = false
}) {
  const [copiedVenue, setCopiedVenue] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);

  const { courses = [], schedule = [], deadlines = [], student = {} } = context;

  // 1. Next upcoming session
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

  // 2. Evaluated courses & bunk arbitrage
  const evaluatedCourses = courses.map(course => {
    const recon = selfAttendanceStore.getCourseStats(course, schedule);
    return {
      ...course,
      stats: recon ? recon.active : calculateBunkStats(course.attended, course.conducted, course.totalPlanned),
      discrepancy: recon?.discrepancy
    };
  });

  // Find safest course for bunk arbitrage and danger course
  const safeCourses = [...evaluatedCourses].sort((a, b) => b.stats.safeBunksRemaining - a.stats.safeBunksRemaining);
  const bestBunkCourse = safeCourses[0];
  const dangerCourses = evaluatedCourses.filter(c => c.stats.tier === 'danger' || c.stats.tier === 'warning');
  const criticalCourse = dangerCourses[0];
  const discrepancies = evaluatedCourses.filter(c => c.discrepancy?.hasDiscrepancy);

  const handleCopyVenue = (venue) => {
    if (!venue) return;
    navigator.clipboard.writeText(venue);
    setCopiedVenue(true);
    playHapticSuccess();
    toast.success(`Copied Room Code: ${venue}`);
    setTimeout(() => setCopiedVenue(false), 2000);
  };

  const handleCopyDisputeMemo = () => {
    if (discrepancies.length === 0) return;
    const target = discrepancies[0];
    const memo = `Subject: Academic Attendance Verification & ERP Discrepancy - ${target.code}
To: Academic Dean / Course Faculty (${target.faculty || 'Office of Programs'})
From: Janmejai Singh (Roll No. B25349, Section EF)
Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}

Respected Administration,

I am writing to formally request a review of attendance records for course ${target.code}: ${target.name}.
My sovereign class log records ${target.selfStats?.attended || target.attended} attended sessions, whereas the ERP snapshot reflects ${target.officialStats?.attended || target.attended} sessions.

Kindly cross-verify the attendance sheet to ensure accurate records under the 80% statutory policy.

Warm regards,
Janmejai Singh (B25349)`;

    navigator.clipboard.writeText(memo);
    setCopiedMemo(true);
    playHapticSuccess();
    toast.success('Dean Appeal Memo Copied!');
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '12px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Zap size={12} color="var(--mizu)" />
          <span style={{
            fontSize: '10.5px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            color: 'var(--mizu)',
            textTransform: 'uppercase'
          }}>
            Proactive Agentic Actions
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>
          Zero-Typing Actions
        </span>
      </div>

      {/* Action Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '8px'
      }}>
        {/* Card 1: Immediate Lecture */}
        {nextSession && (
          <div style={{
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: 'var(--mizu)',
                  backgroundColor: 'var(--wash-mizu)',
                  padding: '1px 5px',
                  borderRadius: '4px'
                }}>
                  NEXT CLASS
                </span>
                <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>
                  {nextSession.startTime?.slice(0, 5)}
                </span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                {nextSession.courseCode} • {nextSession.venue}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                Prof. {nextSession.faculty}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleCopyVenue(nextSession.venue)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  backgroundColor: copiedVenue ? 'var(--wash-moss)' : 'var(--card)',
                  border: '1px solid var(--border)',
                  color: copiedVenue ? 'var(--moss-text)' : 'var(--ink)',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {copiedVenue ? <Check size={11} color="var(--moss)" /> : <Copy size={11} />}
                <span>{copiedVenue ? 'Copied' : 'Copy Room'}</span>
              </button>

              <button
                onClick={() => {
                  playSoftClick(750);
                  onExecuteAction?.({
                    type: 'INSPECT_CLASS',
                    session: nextSession
                  });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--ink)',
                  border: 'none',
                  color: 'var(--paper)',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>Inspect</span>
                <ArrowRight size={10} />
              </button>
            </div>
          </div>
        )}

        {/* Card 2: Bunk Safety Arbitrage */}
        {bestBunkCourse && (
          <div style={{
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: 'var(--moss-text)',
                  backgroundColor: 'var(--wash-moss)',
                  padding: '1px 5px',
                  borderRadius: '4px'
                }}>
                  BUNK ARBITRAGE
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--moss-text)' }}>
                  +{bestBunkCourse.stats.safeBunksRemaining} Safe
                </span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                {bestBunkCourse.code}: {bestBunkCourse.stats.currentPercentage}%
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                Can skip without dropping below 80%
              </div>
            </div>

            <button
              onClick={() => {
                playSoftClick(750);
                onExecuteAction?.({
                  type: 'NAVIGATE_AND_SIMULATE',
                  courseCode: bestBunkCourse.code,
                  skips: 1
                });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '5px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--wash-moss)',
                border: '1px solid rgba(var(--moss-rgb), 0.35)',
                color: 'var(--moss-text)',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Sliders size={11} />
              <span>Simulate 1 Bunk ({bestBunkCourse.code})</span>
            </button>
          </div>
        )}

        {/* Card 3: Long Weekend Opportunity */}
        <div style={{
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{
                fontSize: '9.5px',
                fontWeight: 700,
                color: 'var(--ochre-text)',
                backgroundColor: 'var(--wash-ochre)',
                padding: '1px 5px',
                borderRadius: '4px'
              }}>
                VACATION RADAR
              </span>
              <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>
                Term-5
              </span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
              Gandhi Jayanti Getaway
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
              3 Days Off • 0 Bunks Required
            </div>
          </div>

          <button
            onClick={() => {
              playSoftClick(750);
              onExecuteAction?.({
                type: 'NAVIGATE_TAB',
                tab: 'trips'
              });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '5px 8px',
              borderRadius: '6px',
              backgroundColor: 'var(--wash-ochre)',
              border: '1px solid rgba(var(--ochre-rgb), 0.35)',
              color: 'var(--ochre-text)',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Compass size={11} />
            <span>Explore Trip Itinerary</span>
          </button>
        </div>

        {/* Card 4: Discrepancy Dispute Email (if diffs exist) */}
        {discrepancies.length > 0 && (
          <div style={{
            backgroundColor: 'var(--paper)',
            border: '1px solid rgba(var(--ochre-rgb), 0.35)',
            borderRadius: '10px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: 'var(--ochre-text)',
                  backgroundColor: 'var(--wash-ochre)',
                  padding: '1px 5px',
                  borderRadius: '4px'
                }}>
                  ERP DELTA
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ochre-text)' }}>
                  {discrepancies.length} Diff
                </span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                {discrepancies[0].code} Discrepancy
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                Sovereign log differs from ERP snapshot
              </div>
            </div>

            <button
              onClick={handleCopyDisputeMemo}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '5px 8px',
                borderRadius: '6px',
                backgroundColor: copiedMemo ? 'var(--wash-moss)' : 'var(--wash-ochre)',
                border: '1px solid rgba(var(--ochre-rgb), 0.4)',
                color: copiedMemo ? 'var(--moss-text)' : 'var(--ochre-text)',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {copiedMemo ? <Check size={11} color="var(--moss)" /> : <FileText size={11} />}
              <span>{copiedMemo ? 'Memo Copied' : 'Copy Dispute Email'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

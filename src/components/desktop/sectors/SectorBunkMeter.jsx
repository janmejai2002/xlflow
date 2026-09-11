import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { calculateBunkStats } from '../../../services/bunkCalculator';
import { selfAttendanceStore } from '../../../services/selfAttendanceStore';
import AttendanceLogModal from '../../attendance/AttendanceLogModal';
import { toast } from 'sonner';
import CourseSafetyCard from '../../CourseSafetyCard';
import { playHapticSuccess } from '../../../services/soundEngine';

export default function SectorBunkMeter({ courses = [], schedule = [], student = {} }) {
  const [filterTerm, setFilterTerm] = useState('all');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [, setStoreVer] = useState(0);

  useEffect(() => {
    const unsub = selfAttendanceStore.subscribe(() => setStoreVer(v => v + 1));
    return unsub;
  }, []);

  const sourceMode = selfAttendanceStore.getSourceMode();

  const evaluatedCourses = courses.map(course => {
    const recon = selfAttendanceStore.getCourseStats(course, schedule);
    return {
      ...course,
      stats: recon ? recon.active : calculateBunkStats(course.attended, course.conducted, course.totalPlanned),
      selfStats: recon?.self,
      officialStats: recon?.official,
      discrepancy: recon?.discrepancy
    };
  });

  const discrepancies = evaluatedCourses.filter(c => c.discrepancy?.hasDiscrepancy);

  const filteredCourses = evaluatedCourses.filter(c => {
    if (filterTerm === 'all') return true;
    return c.term?.includes(filterTerm);
  });

  const totalCourses = evaluatedCourses.length;
  const safeCount = evaluatedCourses.filter(c => c.stats.tier === 'safe').length;
  const riskCount = evaluatedCourses.filter(c => c.stats.tier === 'warning' || c.stats.tier === 'danger').length;
  const dangerCourses = evaluatedCourses.filter(c => c.stats.tier === 'danger');
  const warningCourses = evaluatedCourses.filter(c => c.stats.tier === 'warning');

  let peaceOfMindScore = 100;
  if (dangerCourses.length > 0) peaceOfMindScore -= dangerCourses.length * 15;
  if (warningCourses.length > 0) peaceOfMindScore -= warningCourses.length * 5;
  if (discrepancies.length > 0) peaceOfMindScore -= discrepancies.length * 2;
  peaceOfMindScore = Math.max(48, Math.min(100, peaceOfMindScore));

  const handleExportAuditPdf = () => {
    window.print();
    toast.success('Generated Dean Appeal Attendance Report');
  };

  const handleCopyDeanAppealEmail = () => {
    if (discrepancies.length === 0) return;
    const first = discrepancies[0];
    const emailText = `Subject: Academic Attendance Discrepancy & Official ERP Record Reconciliation - [${first.code}]
To: Dean of Academics / Program Office (academics@xlri.ac.in)
From: ${student?.name || 'Janmejai Singh'} (Roll No: ${student?.id || 'B25349'}, Section EF)
Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}

Dear Dean of Academics / Course Coordinator,

I am writing to formally submit an attendance reconciliation request for the following course(s):

Course: ${first.code} - ${first.name}
Faculty: ${first.faculty}
- Official ERP Record: ${first.officialStats?.attended || first.attended} / ${first.officialStats?.conducted || first.conducted} sessions
- Personal Verified Log: ${first.selfStats?.attended || first.attended} / ${first.selfStats?.conducted || first.conducted} sessions
- Difference: Discrepancy of ${first.discrepancy?.difference > 0 ? '+' + first.discrepancy?.difference : first.discrepancy?.difference} session(s).

I have maintained complete punctuality and attended all designated class sessions. Due to administrative upload latency in the ERP portal, the official record currently lags behind actual ground reality.

Kindly initiate a review against the physical attendance roster sheet and update the academic database accordingly.

Warm regards,
${student?.name || 'Janmejai Singh'}
Roll Number: ${student?.id || 'B25349'}
XLRI Jamshedpur / Delhi-NCR`;

    navigator.clipboard.writeText(emailText);
    playHapticSuccess();
    toast.success('Dean Appeal Email Copied!', {
      description: 'Formal reconciliation memo copied to clipboard. Ready to paste in Outlook.'
    });
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '1440px',
      margin: '0 auto',
      boxSizing: 'border-box',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      overflow: 'hidden'
    }}>
      {/* Sector Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--wash-moss)',
            border: '1px solid rgba(110, 140, 99, 0.3)',
            color: 'var(--moss)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(110, 140, 99, 0.15)'
          }}>
            <ShieldCheck size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--moss)', letterSpacing: '0.06em' }}>
                ATTENDANCE
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>80% Requirement & Safe Leave Tracker</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '2px 0 0 0',
              letterSpacing: '-0.025em'
            }}>
              Attendance & Bunk Calculator
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Source Mode Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--card)',
            padding: '2px',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            <button
              onClick={() => selfAttendanceStore.setSourceMode('hybrid')}
              title="Ground reality: combines personal log with ERP"
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: sourceMode === 'hybrid' ? 'var(--mizu)' : 'transparent',
                color: sourceMode === 'hybrid' ? '#FFFFFF' : 'var(--ink-soft)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Hybrid Reality
            </button>
            <button
              onClick={() => selfAttendanceStore.setSourceMode('self')}
              title="Sovereign personal log only"
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: sourceMode === 'self' ? 'var(--moss)' : 'transparent',
                color: sourceMode === 'self' ? '#FFFFFF' : 'var(--ink-soft)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Self-Log
            </button>
            <button
              onClick={() => selfAttendanceStore.setSourceMode('erp')}
              title="Official ERP snapshot"
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: sourceMode === 'erp' ? 'var(--ink)' : 'transparent',
                color: sourceMode === 'erp' ? '#FFFFFF' : 'var(--ink-soft)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ERP Stale
            </button>
          </div>

          {/* Self-Attendance Manager Trigger Button */}
          <button
            onClick={() => setIsLogModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              backgroundColor: discrepancies.length > 0 ? 'var(--wash-ochre)' : 'var(--wash-moss)',
              border: `1px solid ${discrepancies.length > 0 ? 'rgba(217, 119, 6, 0.35)' : 'rgba(22, 163, 74, 0.35)'}`,
              borderRadius: '8px',
              color: discrepancies.length > 0 ? 'var(--ochre-text)' : 'var(--moss-text)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ShieldCheck size={14} color={discrepancies.length > 0 ? 'var(--ochre)' : 'var(--moss)'} />
            <span>Self-Log Manager</span>
            {discrepancies.length > 0 && (
              <span style={{
                backgroundColor: 'var(--ochre)',
                color: '#FFFFFF',
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '9999px',
                fontWeight: 800
              }}>
                {discrepancies.length} Diff
              </span>
            )}
          </button>

          <button
            onClick={handleExportAuditPdf}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--ink)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <FileText size={13} />
            <span>Audit Report</span>
          </button>

          {/* Filter Pills */}
          {['all', 'Term-5', 'Term-4'].map(t => (
            <button
              key={t}
              onClick={() => setFilterTerm(t)}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '8px',
                border: filterTerm === t ? '1px solid var(--ink)' : '1px solid var(--border)',
                backgroundColor: filterTerm === t ? 'var(--ink)' : 'var(--card)',
                color: filterTerm === t ? 'var(--paper)' : 'var(--ink)',
                cursor: 'pointer'
              }}
            >
              {t === 'all' ? 'All Terms' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Ribbon (4-Tile 2026 Academic Wellness Grid) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        flexShrink: 0
      }}>
        {/* Tile 1: Academic Peace of Mind Score */}
        <div style={{
          backgroundColor: peaceOfMindScore >= 90 ? 'var(--wash-moss)' : 'var(--wash-ochre)',
          padding: '12px 18px',
          borderRadius: '12px',
          border: `1px solid ${peaceOfMindScore >= 90 ? 'rgba(110, 140, 99, 0.35)' : 'rgba(194, 145, 58, 0.35)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: peaceOfMindScore >= 90 ? 'var(--moss-text)' : 'var(--ochre-text)',
              letterSpacing: '0.04em'
            }}>
              PEACE OF MIND INDEX
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 800,
              color: peaceOfMindScore >= 90 ? 'var(--moss-text)' : 'var(--ochre-text)',
              marginTop: '2px'
            }}>
              {peaceOfMindScore}% Safe
            </div>
          </div>
          <ShieldCheck size={22} color={peaceOfMindScore >= 90 ? 'var(--moss)' : 'var(--ochre)'} />
        </div>

        {/* Tile 2: Total Courses */}
        <div style={{
          backgroundColor: 'var(--card)',
          padding: '12px 18px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>TOTAL COURSES</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
              {totalCourses} Tracked
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Term-5 / Core</span>
        </div>

        {/* Tile 3: Safe Zone */}
        <div style={{
          backgroundColor: 'var(--card)',
          padding: '12px 18px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--moss-text)' }}>SAFE ZONE (≥85%)</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--moss-text)', marginTop: '2px' }}>
              {safeCount} Courses
            </div>
          </div>
          <ShieldCheck size={20} color="var(--moss)" />
        </div>

        {/* Tile 4: Attendance Watch */}
        <div style={{
          backgroundColor: riskCount > 0 ? 'var(--wash-ochre)' : 'var(--card)',
          padding: '12px 18px',
          borderRadius: '12px',
          border: riskCount > 0 ? '1px solid rgba(194, 145, 58, 0.3)' : '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--ochre-text)' }}>ATTENDANCE WATCH</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ochre-text)', marginTop: '2px' }}>
              {riskCount} Under Watch
            </div>
          </div>
          <AlertTriangle size={20} color="var(--ochre)" />
        </div>
      </div>

      {/* Discrepancy Alert Banner with 1-Click Appeal Action */}
      {discrepancies.length > 0 && (
        <div style={{
          backgroundColor: 'var(--wash-ochre)',
          border: '1px solid rgba(217, 119, 6, 0.35)',
          borderRadius: '12px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--ochre-text)',
          animation: 'sectorFadeIn 0.2s ease-out',
          flexShrink: 0,
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="var(--ochre)" style={{ flexShrink: 0 }} />
            <span>
              <strong>ERP Admin Lag Detected:</strong> {discrepancies.length} course(s) have differences between your personal attendance log and official ERP records.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleCopyDeanAppealEmail}
              title="Copy formal Dean Appeal email to clipboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--paper)',
                border: '1px solid rgba(194, 145, 58, 0.4)',
                color: 'var(--ochre-text)',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <FileText size={12} />
              <span>Copy Dean Appeal Email</span>
            </button>
            <button
              onClick={() => setIsLogModalOpen(true)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--ochre)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Reconcile & Audit
            </button>
          </div>
        </div>
      )}

      {/* Responsive Course Grid */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gridAutoRows: 'max-content',
        gap: '16px',
        alignContent: 'start',
        paddingBottom: '28px',
        paddingRight: '6px'
      }}>
        {filteredCourses.map(course => (
          <CourseSafetyCard
            key={course.id || course.code}
            course={course}
            isCompact={true}
            onOpenDeepSim={(code) => {
              toast.info(`Opening detailed scenario planner for ${code}`);
            }}
          />
        ))}
      </div>

      {/* Sovereign Self-Attendance Log & Discrepancy Modal */}
      <AttendanceLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        courses={courses}
        schedule={schedule}
        student={student}
      />
    </div>
  );
}

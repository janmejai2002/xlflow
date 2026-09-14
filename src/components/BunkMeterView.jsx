import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { selfAttendanceStore } from '../services/selfAttendanceStore';
const AttendanceLogModal = lazy(() => import('./attendance/AttendanceLogModal'));
import AttendanceCourseCard from './attendance/AttendanceCourseCard';
import QuickMarkStrip, { getUnmarkedSessions } from './attendance/QuickMarkStrip';
import { resolveCurrentTerm, isCurrentTerm } from '../services/academicTerm';
import { playTactileClick } from '../services/soundEngine';

/**
 * BunkMeterView - Editorial Academic Attendance Ledger
 *
 * Sovereign Self-Attendance reconciled against Institutional ERP records.
 * Built strictly according to 2026 wAIbi-sabi academic editorial principles:
 * - Zero bubbly AI slop or nested card-in-card containers
 * - Hairline architectural grid & ledger dividers
 * - Hanko stamp statutory state indicators
 * - Newsreader serif editorial prose
 * - Tactile mechanical button interactions
 */
export default function BunkMeterView({ courses = [], schedule = [], student = {} }) {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);
  const [isRuleOpen, setIsRuleOpen] = useState(false);
  const [onlyAtRisk, setOnlyAtRisk] = useState(false);
  const [showEarlier, setShowEarlier] = useState(false);
  const [storeVer, setStoreVer] = useState(0);

  useEffect(() => {
    const unsub = selfAttendanceStore.subscribe(() => setStoreVer((v) => v + 1));
    return unsub;
  }, []);

  // The ERP returns every course ever taken. Resolve the active term.
  const currentTerm = useMemo(() => resolveCurrentTerm(courses, schedule), [courses, schedule]);

  const allEvaluated = useMemo(
    () =>
      courses
        .map((course) => ({ course, recon: selfAttendanceStore.getCourseStats(course, schedule) }))
        .filter((e) => e.recon),
    // storeVer triggers recomputation on local storage mutation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [courses, schedule, storeVer]
  );

  const otherTermCount = useMemo(
    () => allEvaluated.filter((e) => !isCurrentTerm(e.course, currentTerm)).length,
    [allEvaluated, currentTerm]
  );

  const evaluated = useMemo(
    () => (showEarlier ? allEvaluated : allEvaluated.filter((e) => isCurrentTerm(e.course, currentTerm))),
    [showEarlier, allEvaluated, currentTerm]
  );

  const unmarked = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => getUnmarkedSessions(schedule),
    [schedule, storeVer]
  );

  const atRisk = useMemo(() => evaluated.filter((e) => e.recon.active.tier !== 'safe'), [evaluated]);
  const mismatched = useMemo(() => evaluated.filter((e) => e.recon.discrepancy.hasDiscrepancy), [evaluated]);
  const visible = useMemo(() => (onlyAtRisk ? atRisk : evaluated), [onlyAtRisk, atRisk, evaluated]);

  const openDetails = (code) => {
    setSelectedCourseForModal(code);
    setIsLogModalOpen(true);
  };

  const handleFilterToggle = () => {
    playTactileClick(500);
    setOnlyAtRisk((v) => !v);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '32px' }}>
      {/* Header: Editorial Academic Title & Term Hanko Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              margin: 0
            }}
          >
            Attendance Ledger
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '4px', margin: 0 }}>
            Sovereign student log reconciled against official ERP records.
          </p>
        </div>

        {currentTerm !== null && (
          <span
            className="hanko-stamp"
            style={{
              color: 'var(--indigo)',
              borderColor: 'rgba(var(--indigo-rgb), 0.45)',
              backgroundColor: 'var(--wash-indigo)',
              alignSelf: 'flex-start',
              marginTop: '2px'
            }}
          >
            TERM {currentTerm}
          </span>
        )}
      </div>

      {/* Fast path: Sovereign Audit for unrecorded sessions */}
      <QuickMarkStrip sessions={unmarked} />

      {/* Summary Status Ledger & Filter Strip */}
      <div
        className="editorial-slate"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          {/* Ledger Tally Breakdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              fontFamily: 'var(--font-mono)',
              fontFeatureSettings: '"tnum"',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '12px'
            }}
          >
            <div>
              <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '13px' }}>{evaluated.length}</span>
              <span
                style={{
                  color: 'var(--ink-faint)',
                  fontSize: '10px',
                  fontWeight: 700,
                  marginLeft: '4px',
                  letterSpacing: '0.06em'
                }}
              >
                ENROLLED
              </span>
            </div>
            <span style={{ color: 'var(--border-soft)' }}>|</span>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--moss-text)', fontSize: '13px' }}>
                {evaluated.length - atRisk.length}
              </span>
              <span
                style={{
                  color: 'var(--ink-faint)',
                  fontSize: '10px',
                  fontWeight: 700,
                  marginLeft: '4px',
                  letterSpacing: '0.06em'
                }}
              >
                SAFE
              </span>
            </div>
            <span style={{ color: 'var(--border-soft)' }}>|</span>
            <div>
              <span
                style={{
                  fontWeight: 700,
                  color: atRisk.length > 0 ? 'var(--hanko-text)' : 'var(--ink-faint)',
                  fontSize: '13px'
                }}
              >
                {atRisk.length}
              </span>
              <span
                style={{
                  color: 'var(--ink-faint)',
                  fontSize: '10px',
                  fontWeight: 700,
                  marginLeft: '4px',
                  letterSpacing: '0.06em'
                }}
              >
                AT RISK
              </span>
            </div>
          </div>

          {/* Filter Action Button */}
          {atRisk.length > 0 ? (
            <button
              className="btn-tactile"
              onClick={handleFilterToggle}
              aria-pressed={onlyAtRisk}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '32px',
                padding: '0 12px',
                borderRadius: '4px',
                backgroundColor: onlyAtRisk ? 'var(--ink)' : 'var(--paper)',
                border: `1px solid ${onlyAtRisk ? 'var(--ink)' : 'var(--border-strong)'}`,
                color: onlyAtRisk ? 'var(--paper)' : 'var(--ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: 'pointer'
              }}
            >
              <span>{onlyAtRisk ? 'SHOW ALL ENROLLED' : `FILTER ${atRisk.length} AT RISK`}</span>
            </button>
          ) : (
            <span
              className="hanko-stamp"
              style={{
                color: 'var(--moss)',
                borderColor: 'rgba(var(--moss-rgb), 0.45)',
                backgroundColor: 'var(--wash-moss)'
              }}
            >
              ALL STANDARDS MET
            </span>
          )}
        </div>
      </div>

      {/* Discrepancy Reconciliation Notice */}
      {mismatched.length > 0 && !onlyAtRisk && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '4px',
            backgroundColor: 'var(--wash-ochre)',
            border: '1px solid rgba(var(--ochre-rgb), 0.35)',
            borderLeft: '3px solid var(--ochre)',
            fontSize: '12.5px',
            color: 'var(--ochre-text)',
            lineHeight: 1.45
          }}
        >
          <AlertTriangle size={15} color="var(--ochre)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginRight: '6px'
              }}
            >
              Reconciliation Advisory:
            </span>
            <span>
              {mismatched.length} course{mismatched.length === 1 ? '' : 's'} contain variance between self-recorded
              sessions and ERP snapshots. The safety margin conservative engine enforces whichever is lower.
            </span>
          </div>
        </div>
      )}

      {/* Course Ledger Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {visible.map(({ course, recon }) => (
          <AttendanceCourseCard
            key={course.code}
            course={course}
            recon={recon}
            onOpenDetails={openDetails}
            onMarkClass={openDetails}
          />
        ))}

        {visible.length === 0 && (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--card)',
              border: '1px dashed var(--border)',
              borderRadius: '4px'
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '15px',
                color: 'var(--ink-soft)',
                margin: 0
              }}
            >
              No courses matching active ledger criteria.
            </p>
            {onlyAtRisk && (
              <button
                className="btn-tactile"
                onClick={() => {
                  playTactileClick();
                  setOnlyAtRisk(false);
                }}
                style={{
                  marginTop: '12px',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: 'pointer'
                }}
              >
                RESET FILTER
              </button>
            )}
          </div>
        )}
      </div>

      {/* Other Terms Expansion Button */}
      {otherTermCount > 0 && !onlyAtRisk && (
        <button
          className="btn-tactile"
          onClick={() => {
            playTactileClick();
            setShowEarlier((v) => !v)}
          }
          style={{
            minHeight: '40px',
            borderRadius: '4px',
            border: '1px dashed var(--border-strong)',
            backgroundColor: 'transparent',
            color: 'var(--ink-soft)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {showEarlier
            ? 'HIDE OTHER TERMS'
            : `SHOW ${otherTermCount} COURSE${otherTermCount === 1 ? '' : 'S'} FROM OTHER TERMS`}
        </button>
      )}

      {/* Statutory Code Accordion: 80% Rule */}
      <div
        className="editorial-slate"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <button
          className="btn-tactile"
          onClick={() => {
            playTactileClick();
            setIsRuleOpen((v) => !v);
          }}
          aria-expanded={isRuleOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            minHeight: '42px',
            padding: '0 16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--ink)',
            fontSize: '12.5px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ink-faint)'
              }}
            >
              Statutory Code
            </span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-brand)', fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
              Statutory 80.0% Minimum Attendance Policy
            </span>
          </div>
          <ChevronDown
            size={16}
            style={{
              transform: isRuleOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
              color: 'var(--ink-soft)'
            }}
          />
        </button>
        {isRuleOpen && (
          <div
            style={{
              padding: '14px 16px',
              borderTop: '1px solid var(--border-soft)',
              backgroundColor: 'var(--paper-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '14.5px',
                color: 'var(--ink)',
                lineHeight: 1.55,
                margin: 0
              }}
            >
              Students are required to attend a minimum of 80.0% of scheduled academic sessions in each registered course
              to be eligible for end-term assessment. Failure to satisfy this threshold without formally approved
              administrative leave may result in grade deduction or statutory debarment.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '11.5px',
                color: 'var(--ink-muted)',
                lineHeight: 1.5,
                margin: 0
              }}
            >
              The permissible absence margin computes the exact count of sessions a student may miss before breaching the
              80.0% threshold. When the margin drops to zero, every remaining scheduled class is strictly mandatory.
            </p>
          </div>
        )}
      </div>

      {/* Sovereign Attendance Audit Modal */}
      {isLogModalOpen && (
        <Suspense fallback={null}>
          <AttendanceLogModal
            isOpen={isLogModalOpen}
            onClose={() => {
              setIsLogModalOpen(false);
              setSelectedCourseForModal(null);
            }}
            courses={courses}
            schedule={schedule}
            student={student}
            initialCourseCode={selectedCourseForModal}
          />
        </Suspense>
      )}
    </div>
  );
}

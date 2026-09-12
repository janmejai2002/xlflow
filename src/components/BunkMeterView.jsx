import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { selfAttendanceStore } from '../services/selfAttendanceStore';
import AttendanceLogModal from './attendance/AttendanceLogModal';
import AttendanceCourseCard from './attendance/AttendanceCourseCard';
import QuickMarkStrip, { getUnmarkedSessions } from './attendance/QuickMarkStrip';
import { resolveCurrentTerm, isCurrentTerm } from '../services/academicTerm';

/**
 * Attendance.
 *
 * Two numbers per course — what you logged and what the ERP says — and one
 * sentence telling you how much room that leaves. Anything that needed a
 * paragraph of explanation was either removed or moved into the details modal.
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

  // The ERP hands back every course the student has ever taken. Only the term
  // actually running is worth opening on — see services/academicTerm.js for why
  // that is not simply the highest term number.
  const currentTerm = useMemo(() => resolveCurrentTerm(courses, schedule), [courses, schedule]);

  const allEvaluated = useMemo(
    () =>
      courses
        .map((course) => ({ course, recon: selfAttendanceStore.getCourseStats(course, schedule) }))
        .filter((e) => e.recon),
    // storeVer is the subscription tick: marks mutate the store in place, so it
    // is the only signal that the derived stats need recomputing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [courses, schedule, storeVer]
  );

  const otherTermCount = allEvaluated.filter((e) => !isCurrentTerm(e.course, currentTerm)).length;
  const evaluated = showEarlier ? allEvaluated : allEvaluated.filter((e) => isCurrentTerm(e.course, currentTerm));

  const unmarked = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => getUnmarkedSessions(schedule),
    [schedule, storeVer]
  );

  const atRisk = evaluated.filter((e) => e.recon.active.tier !== 'safe');
  const mismatched = evaluated.filter((e) => e.recon.discrepancy.hasDiscrepancy);
  const visible = onlyAtRisk ? atRisk : evaluated;

  const openDetails = (code) => {
    setSelectedCourseForModal(code);
    setIsLogModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '28px' }}>
      {/* Header */}
      <div>
        <h2
          style={{
            fontFamily: 'var(--font-brand)',
            fontSize: '23px',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: 'var(--ink)',
            margin: 0
          }}
        >
          Attendance
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '3px' }}>
          Your log against the ERP. You need 80% in every course.
        </p>
        {currentTerm !== null && (
          <p style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            Showing Term {currentTerm}
          </p>
        )}
      </div>

      {/* Fast path: clear the backlog of unmarked classes */}
      <QuickMarkStrip sessions={unmarked} />

      {/* Status line — doubles as the at-risk filter */}
      <button
        onClick={() => atRisk.length > 0 && setOnlyAtRisk((v) => !v)}
        aria-pressed={onlyAtRisk}
        disabled={atRisk.length === 0}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          width: '100%',
          minHeight: '44px',
          padding: '0 14px',
          borderRadius: '12px',
          backgroundColor: onlyAtRisk ? 'var(--ink)' : 'var(--card)',
          border: `1px solid ${onlyAtRisk ? 'var(--ink)' : 'var(--border)'}`,
          color: onlyAtRisk ? 'var(--paper)' : 'var(--ink)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: atRisk.length > 0 ? 'pointer' : 'default',
          textAlign: 'left'
        }}
      >
        <span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>{evaluated.length}</strong> courses ·{' '}
          <strong style={{ fontFamily: 'var(--font-mono)', color: onlyAtRisk ? 'var(--paper)' : 'var(--moss-text)' }}>
            {evaluated.length - atRisk.length}
          </strong>{' '}
          safe ·{' '}
          <strong style={{ fontFamily: 'var(--font-mono)', color: onlyAtRisk ? 'var(--paper)' : 'var(--hanko-text)' }}>
            {atRisk.length}
          </strong>{' '}
          at risk
        </span>
        {atRisk.length > 0 && (
          <span style={{ fontSize: '11.5px', fontWeight: 700, opacity: 0.85, whiteSpace: 'nowrap' }}>
            {onlyAtRisk ? 'Show all' : 'Show at risk'}
          </span>
        )}
      </button>

      {/* Only surfaced when the ERP and your log actually disagree somewhere */}
      {mismatched.length > 0 && !onlyAtRisk && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '10px 13px',
            borderRadius: '12px',
            backgroundColor: 'var(--wash-ochre)',
            border: '1px solid rgba(var(--ochre-rgb), 0.3)',
            fontSize: '12.5px',
            color: 'var(--ochre-text)',
            lineHeight: 1.4
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>
            {mismatched.length} course{mismatched.length === 1 ? "'s" : "s'"} ERP numbers don't match your log. Margins
            below use whichever side is worse.
          </span>
        </div>
      )}

      {/* Courses */}
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
              padding: '28px 16px',
              textAlign: 'center',
              color: 'var(--ink-faint)',
              fontSize: '13px',
              backgroundColor: 'var(--card)',
              border: '1px dashed var(--border)',
              borderRadius: '14px'
            }}
          >
            No courses to show.
          </div>
        )}
      </div>

      {otherTermCount > 0 && !onlyAtRisk && (
        <button
          onClick={() => setShowEarlier((v) => !v)}
          style={{
            minHeight: '44px',
            borderRadius: '12px',
            border: '1px dashed var(--border-strong)',
            backgroundColor: 'transparent',
            color: 'var(--ink-soft)',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {showEarlier ? 'Hide other terms' : `Show ${otherTermCount} course${otherTermCount === 1 ? '' : 's'} from other terms`}
        </button>
      )}

      {/* The rule, folded away until asked for */}
      <div
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <button
          onClick={() => setIsRuleOpen((v) => !v)}
          aria-expanded={isRuleOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            minHeight: '44px',
            padding: '0 14px',
            background: 'transparent',
            border: 'none',
            color: 'var(--ink-soft)',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <span>How the 80% rule works</span>
          <ChevronDown
            size={16}
            style={{ transform: isRuleOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          />
        </button>
        {isRuleOpen && (
          <div
            style={{
              padding: '0 14px 14px',
              fontSize: '12.5px',
              color: 'var(--ink-soft)',
              lineHeight: 1.55,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <p style={{ margin: 0 }}>
              You must attend at least <strong style={{ color: 'var(--ink)' }}>80% of the classes held</strong> in a
              course to sit its end-term exam. Below that, without approved leave, the course is open to grade reduction
              or debarment.
            </p>
            <p style={{ margin: 0 }}>
              "Can miss N more" counts the absences still available to you across the rest of the term before you cross
              that line. At zero, every remaining class is compulsory.
            </p>
          </div>
        )}
      </div>

      {isLogModalOpen && (
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
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Ban,
  Calendar,
  Download,
  Printer,
  Upload,
  RefreshCw,
  AlertTriangle,
  Plus,
  Minus,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { selfAttendanceStore, ABSENCE_REASONS } from '../../services/selfAttendanceStore';
import { playTactileClick } from '../../services/soundEngine';

export default function AttendanceLogModal({
  isOpen,
  onClose,
  courses = [],
  schedule = [],
  student = {},
  initialCourseCode = null
}) {
  const [selectedCourseCode, setSelectedCourseCode] = useState(() => initialCourseCode || courses[0]?.code || 'ALL');
  const [storeState, setStoreState] = useState(() => selfAttendanceStore.state);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editReason, setEditReason] = useState('personal');
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    if (initialCourseCode) {
      setSelectedCourseCode(initialCourseCode);
    }
  }, [initialCourseCode, isOpen]);

  useEffect(() => {
    const unsub = selfAttendanceStore.subscribe((newState) => {
      setStoreState({ ...newState });
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const currentCourse = courses.find(c => c.code === selectedCourseCode);
  const courseStats = currentCourse ? selfAttendanceStore.getCourseStats(currentCourse, schedule) : null;

  // Filter schedule sessions
  const filteredSessions = schedule.filter(s => {
    if (selectedCourseCode === 'ALL') return true;
    return s.courseCode === selectedCourseCode;
  });

  const handleToggleStatus = (session, newStatus) => {
    playTactileClick(newStatus === 'present' ? 650 : 450);
    selfAttendanceStore.markSession(session.sessionId, newStatus, {
      courseCode: session.courseCode,
      courseName: session.courseName,
      classDate: session.classDate,
      venue: session.venue,
      reason: newStatus === 'absent' ? 'personal' : ''
    });
  };

  const handleSaveNotes = (sessionId) => {
    const existing = selfAttendanceStore.getSessionStatus(sessionId) || {};
    selfAttendanceStore.markSession(sessionId, existing.status || 'absent', {
      ...existing,
      reason: editReason,
      note: editNote
    });
    setEditingSessionId(null);
  };

  const handleExportCsv = () => {
    playTactileClick(800);
    const csv = selfAttendanceStore.exportAuditCsv(courses, schedule, student);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `XL-Flow_Self_Attendance_${student.id || 'Audit'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 26, 23, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'sectorFadeIn 0.2s ease-out'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--paper)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--wash-moss)',
              color: 'var(--moss)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(var(--moss-rgb), 0.3)'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--ink)' }}>
                  Class log
                </h3>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ink-soft)' }}>
                Mark each class yourself so you are not relying on the ERP being up to date.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close self-attendance modal"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--ink-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Course Filter Tabs */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          backgroundColor: 'var(--card)'
        }}>
          {courses.map(c => {
            const isSelected = selectedCourseCode === c.code;
            const stats = selfAttendanceStore.getCourseStats(c, schedule);
            const hasDiscrepancy = stats?.discrepancy.hasDiscrepancy;

            return (
              <button
                key={c.code}
                onClick={() => {
                  playTactileClick();
                  setSelectedCourseCode(c.code);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: isSelected ? '1px solid var(--mizu)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--wash-mizu)' : 'var(--paper)',
                  color: isSelected ? 'var(--mizu)' : 'var(--ink-soft)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{c.code}</span>
                {hasDiscrepancy && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--ochre)'
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Active Course Reconciliation Cockpit */}
          {courseStats && (
            <div style={{
              backgroundColor: 'var(--paper)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
                    {courseStats.courseCode} • {courseStats.courseName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                    {courseStats.official.totalPlanned} classes planned • 80% needed
                  </div>
                </div>

              </div>

              {/* Comparison — stacks on a phone, three across on a wide screen */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '10px'
                }}
              >
                {/* 1. What you logged */}
                <div style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  border: '1px solid rgba(var(--moss-rgb), 0.25)'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--moss-text)', textTransform: 'uppercase' }}>
                    You logged
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '4px 0', fontFamily: 'var(--font-mono)' }}>
                    {courseStats.self.attended} / {courseStats.self.conducted}
                    {courseStats.self.conducted > 0 && (
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--moss-text)', marginLeft: '6px' }}>
                        ({courseStats.self.currentPercentage}%)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                    {courseStats.self.conducted === 0
                      ? 'Nothing marked yet'
                      : 'Can miss ' + courseStats.self.safeBunksRemaining + ' more'}
                  </div>
                </div>

                {/* 2. What the ERP says */}
                <div style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
                    ERP
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '4px 0', fontFamily: 'var(--font-mono)' }}>
                    {courseStats.official.attended} / {courseStats.official.conducted}
                    {courseStats.official.conducted > 0 && (
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-soft)', marginLeft: '6px' }}>
                        ({courseStats.official.currentPercentage}%)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                    {courseStats.official.conducted === 0 ? 'No term data entered yet' : 'As of the last sync'}
                  </div>
                </div>

                {/* 3. Whether they agree, and a manual correction if not */}
                <div style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  border: courseStats.discrepancy.hasDiscrepancy ? '1px solid rgba(var(--ochre-rgb), 0.35)' : '1px solid var(--border)'
                }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: courseStats.discrepancy.hasDiscrepancy ? 'var(--ochre-text)' : 'var(--ink-faint)'
                  }}>
                    {courseStats.discrepancy.hasDiscrepancy ? 'They disagree' : 'They agree'}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', margin: '4px 0', lineHeight: 1.35 }}>
                    {courseStats.discrepancy.hasDiscrepancy
                      ? Math.abs(courseStats.discrepancy.conductedDiff) + ' class' + (Math.abs(courseStats.discrepancy.conductedDiff) === 1 ? '' : 'es') + ' apart'
                      : 'Nothing to reconcile'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => selfAttendanceStore.quickAdjustCourse(courseStats.courseCode, 'add_present')}
                      title="Record one extra class you attended"
                      style={{
                        minHeight: '34px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--paper)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--moss-text)',
                        cursor: 'pointer'
                      }}
                    >
                      + Attended
                    </button>

                    <button
                      onClick={() => selfAttendanceStore.quickAdjustCourse(courseStats.courseCode, 'add_absent')}
                      title="Record one extra class you missed"
                      style={{
                        minHeight: '34px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--paper)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--hanko-text)',
                        cursor: 'pointer'
                      }}
                    >
                      + Missed
                    </button>

                    {(courseStats.selfCounts.adjAttended !== 0 || courseStats.selfCounts.adjConducted !== 0) && (
                      <button
                        onClick={() => selfAttendanceStore.resetCourseAdjustment(courseStats.courseCode)}
                        title="Clear manual corrections"
                        style={{
                          minHeight: '34px',
                          padding: '0 8px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          fontSize: '11px',
                          color: 'var(--ink-faint)',
                          cursor: 'pointer'
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Session Timeline Breakdown */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)' }}>
                Every class ({filteredSessions.length})
              </div>
              <span style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>Tap to change</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredSessions.map((s, idx) => {
                const mark = storeState.markedSessions[s.sessionId];
                const isEditing = editingSessionId === s.sessionId;
                const reasonObj = mark ? ABSENCE_REASONS.find(r => r.id === mark.reason) : null;

                return (
                  <div
                    key={s.sessionId || idx}
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    {/* Left: Date, Time, Venue */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                          {s.classDate}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                          {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--ink-soft)',
                          backgroundColor: 'var(--paper)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--border)'
                        }}>
                          {s.venue}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                        {s.courseCode} • {s.courseName}
                      </div>

                      {mark?.reason && (
                        <div style={{ fontSize: '11px', color: 'var(--ochre-text)', marginTop: '4px' }}>
                          Reason: <strong>{reasonObj?.label || mark.reason}</strong> {mark.note ? `• "${mark.note}"` : ''}
                        </div>
                      )}
                    </div>

                    {/* Right: Quick Toggle Group & Reason Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleToggleStatus(s, mark?.status === 'present' ? 'unmarked' : 'present')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: mark?.status === 'present' ? '1px solid var(--moss)' : '1px solid var(--border)',
                          backgroundColor: mark?.status === 'present' ? 'var(--wash-moss)' : 'var(--paper)',
                          color: mark?.status === 'present' ? 'var(--moss-text)' : 'var(--ink-soft)',
                          fontSize: '11px',
                          fontWeight: mark?.status === 'present' ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        <Check size={12} color={mark?.status === 'present' ? 'var(--moss)' : 'currentColor'} />
                        <span>Present</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(s, mark?.status === 'absent' ? 'unmarked' : 'absent')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: mark?.status === 'absent' ? '1px solid var(--hanko)' : '1px solid var(--border)',
                          backgroundColor: mark?.status === 'absent' ? 'var(--wash-hanko)' : 'var(--paper)',
                          color: mark?.status === 'absent' ? 'var(--hanko-text)' : 'var(--ink-soft)',
                          fontSize: '11px',
                          fontWeight: mark?.status === 'absent' ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        <X size={12} color={mark?.status === 'absent' ? 'var(--hanko)' : 'currentColor'} />
                        <span>Bunk</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingSessionId(isEditing ? null : s.sessionId);
                          setEditReason(mark?.reason || 'personal');
                          setEditNote(mark?.note || '');
                        }}
                        title="Add reason or notes for Dean appeal"
                        style={{
                          padding: '6px 8px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          backgroundColor: isEditing ? 'var(--ink)' : 'var(--paper)',
                          color: isEditing ? '#FFFFFF' : 'var(--ink-soft)',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        <FileText size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer: Export & Actions */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--paper)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleExportCsv}
              title="Download full attendance log as CSV"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              title="Print formatted appeal report"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={13} />
              <span>Print appeal</span>
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}

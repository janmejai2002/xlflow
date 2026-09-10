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
  student = {}
}) {
  const [selectedCourseCode, setSelectedCourseCode] = useState(courses[0]?.code || 'ALL');
  const [storeState, setStoreState] = useState(() => selfAttendanceStore.state);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editReason, setEditReason] = useState('personal');
  const [editNote, setEditNote] = useState('');

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
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
              border: '1px solid rgba(22, 163, 74, 0.3)'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
                  Self-Attendance Log & Discrepancy Manager
                </h3>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: 'var(--wash-mizu)',
                  color: 'var(--mizu)',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(2, 132, 199, 0.25)'
                }}>
                  Student Sovereign
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--ink-soft)' }}>
                Keep an accurate personal audit trail independent of administrative ERP delay.
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
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
                    Mandatory 80.0% statutory threshold • {courseStats.official.totalPlanned} planned sessions
                  </div>
                </div>

                {/* Mode Selector */}
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
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: courseStats.sourceMode === 'hybrid' ? 'var(--mizu)' : 'transparent',
                      color: courseStats.sourceMode === 'hybrid' ? '#FFFFFF' : 'var(--ink-soft)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Hybrid Reality
                  </button>
                  <button
                    onClick={() => selfAttendanceStore.setSourceMode('self')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: courseStats.sourceMode === 'self' ? 'var(--moss)' : 'transparent',
                      color: courseStats.sourceMode === 'self' ? '#FFFFFF' : 'var(--ink-soft)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Self Only
                  </button>
                  <button
                    onClick={() => selfAttendanceStore.setSourceMode('erp')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: courseStats.sourceMode === 'erp' ? 'var(--ink)' : 'transparent',
                      color: courseStats.sourceMode === 'erp' ? '#FFFFFF' : 'var(--ink-soft)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ERP Stale
                  </button>
                </div>
              </div>

              {/* Comparison Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                
                {/* 1. Self Logged Stand */}
                <div style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  border: '1px solid rgba(22, 163, 74, 0.25)'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--moss)', textTransform: 'uppercase' }}>
                    Self-Tracked Reality
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '4px 0' }}>
                    {courseStats.self.attended} / {courseStats.self.conducted}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--moss)', marginLeft: '6px' }}>
                      ({courseStats.self.currentPercentage}%)
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                    +{courseStats.self.safeBunksRemaining} safe bunks remaining
                  </div>
                </div>

                {/* 2. Official ERP Stored */}
                <div style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink-faint)', textTransform: 'uppercase' }}>
                    Official ERP Snapshot
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: '4px 0' }}>
                    {courseStats.official.attended} / {courseStats.official.conducted}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-soft)', marginLeft: '6px' }}>
                      ({courseStats.official.currentPercentage}%)
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                    {courseStats.official.conducted === 0 ? 'Admin has not entered term data' : 'Last sync from ERP'}
                  </div>
                </div>

                {/* 3. Discrepancy & Quick Adjust */}
                <div style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  border: courseStats.discrepancy.hasDiscrepancy ? '1px solid rgba(217, 119, 6, 0.35)' : '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: courseStats.discrepancy.hasDiscrepancy ? 'var(--ochre)' : 'var(--moss)', textTransform: 'uppercase' }}>
                    {courseStats.discrepancy.hasDiscrepancy ? 'ERP Lag Discrepancy' : 'Perfect Sync'}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', margin: '4px 0' }}>
                    {courseStats.discrepancy.hasDiscrepancy
                      ? `${courseStats.discrepancy.conductedDiff > 0 ? `+${courseStats.discrepancy.conductedDiff}` : courseStats.discrepancy.conductedDiff} sessions diff`
                      : '0 discrepancies detected'}
                  </div>

                  {/* Term Quick Adjust Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <button
                      onClick={() => selfAttendanceStore.quickAdjustCourse(courseStats.courseCode, 'add_present')}
                      title="Add 1 Attended class to self-log"
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--paper)',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--moss)',
                        cursor: 'pointer'
                      }}
                    >
                      + Attend
                    </button>

                    <button
                      onClick={() => selfAttendanceStore.quickAdjustCourse(courseStats.courseCode, 'add_absent')}
                      title="Add 1 Bunked class to self-log"
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--paper)',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--hanko)',
                        cursor: 'pointer'
                      }}
                    >
                      + Bunk
                    </button>

                    {(courseStats.selfCounts.adjAttended !== 0 || courseStats.selfCounts.adjConducted !== 0) && (
                      <button
                        onClick={() => selfAttendanceStore.resetCourseAdjustment(courseStats.courseCode)}
                        title="Reset manual adjustments"
                        style={{
                          padding: '3px 6px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          fontSize: '10px',
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
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase' }}>
                Session-by-Session Audit Trail ({filteredSessions.length} sessions)
              </div>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                Tap status to toggle • Add reason for waiver appeals
              </span>
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
              <span>Export Audit CSV</span>
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
              <span>Print Official Appeal</span>
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

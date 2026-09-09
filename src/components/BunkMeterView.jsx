import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, Calculator, Check, ArrowRight, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateBunkStats, simulateAttendance, STATUTORY_THRESHOLD } from '../services/bunkCalculator';
import NumberFlow from '@number-flow/react';

export default function BunkMeterView({ courses = [] }) {
  const [filterTerm, setFilterTerm] = useState('all'); // 'all' | 'Term-5' | 'Term-4'
  const [selectedCourseForSim, setSelectedCourseForSim] = useState(courses[0]?.code || 'OMCR');
  const [skipCount, setSkipCount] = useState(1);
  const [attendCount, setAttendCount] = useState(2);
  const [showSimDrawer, setShowSimDrawer] = useState(false);

  // Compute stats for all courses
  const evaluatedCourses = courses.map(course => {
    const stats = calculateBunkStats(course.attended, course.conducted, course.totalPlanned);
    return {
      ...course,
      stats
    };
  });

  // Filtered courses
  const filteredCourses = evaluatedCourses.filter(c => {
    if (filterTerm === 'all') return true;
    return c.term?.includes(filterTerm);
  });

  // Overall metrics
  const totalCourses = evaluatedCourses.length;
  const warningOrDanger = evaluatedCourses.filter(c => c.stats.tier === 'warning' || c.stats.tier === 'danger').length;
  const safeCount = evaluatedCourses.filter(c => c.stats.tier === 'safe').length;

  // Course selected for simulation
  const simCourse = evaluatedCourses.find(c => c.code === selectedCourseForSim) || evaluatedCourses[0];
  const simOriginalStats = simCourse ? simCourse.stats : null;
  const simProjectedPct = simCourse
    ? simulateAttendance(simCourse.attended, simCourse.conducted, attendCount, attendCount + skipCount)
    : 100.0;

  const simIsSafe = simProjectedPct >= STATUTORY_THRESHOLD * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
      {/* Title & Statutory Banner */}
      <div>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '24px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--ink)'
        }}>
          Bunk-O-Meter
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '2px' }}>
          Real-time safety margins calibrated for XLRI's mandatory 80.0% policy.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px'
      }}>
        <div style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 500 }}>Tracked</span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
            <NumberFlow value={totalCourses} />
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--wash-moss)',
          border: '1px solid rgba(110, 140, 99, 0.25)',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--moss)', fontWeight: 600 }}>Safe (&ge;85%)</span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--moss)', marginTop: '2px' }}>
            <NumberFlow value={safeCount} />
          </div>
        </div>

        <div style={{
          backgroundColor: warningOrDanger > 0 ? 'var(--wash-hanko)' : 'var(--card)',
          border: `1px solid ${warningOrDanger > 0 ? 'rgba(210, 84, 63, 0.25)' : 'var(--border)'}`,
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: warningOrDanger > 0 ? 'var(--hanko)' : 'var(--ink-soft)', fontWeight: 600 }}>
            Risk / Action
          </span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: warningOrDanger > 0 ? 'var(--hanko)' : 'var(--ink)', marginTop: '2px' }}>
            <NumberFlow value={warningOrDanger} />
          </div>
        </div>
      </div>

      {/* Term Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'all', label: 'All Terms' },
          { id: 'Term-5', label: 'Term-5 (Current)' },
          { id: 'Term-4', label: 'Term-4 (Historical)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTerm(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: filterTerm === tab.id ? '1px solid var(--ink)' : '1px solid var(--border)',
              backgroundColor: filterTerm === tab.id ? 'var(--ink)' : 'var(--card)',
              color: filterTerm === tab.id ? 'var(--paper)' : 'var(--ink-soft)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Course Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredCourses.map(course => {
          const { stats } = course;
          const isDanger = stats.tier === 'danger';
          const isWarning = stats.tier === 'warning';

          let statusColor = 'var(--moss)';
          let washColor = 'var(--wash-moss)';
          let borderColor = 'rgba(110, 140, 99, 0.25)';
          let statusText = 'Safe Zone';

          if (isDanger) {
            statusColor = 'var(--hanko)';
            washColor = 'var(--wash-hanko)';
            borderColor = 'rgba(210, 84, 63, 0.25)';
            statusText = stats.isDebarredRisk ? 'Debarred Risk' : 'Below 80% Rule';
          } else if (isWarning) {
            statusColor = 'var(--ochre)';
            washColor = 'var(--wash-ochre)';
            borderColor = 'rgba(194, 145, 58, 0.25)';
            statusText = 'Caution Margin';
          }

          return (
            <div
              key={course.code}
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '16px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* Header: Course Code + Status Badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '5px',
                      backgroundColor: 'var(--wash-indigo)',
                      color: 'var(--indigo)'
                    }}>
                      {course.code}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                      {course.credits} Credits • {course.term}
                    </span>
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginTop: '4px'
                  }}>
                    {course.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                    {course.faculty}
                  </p>
                </div>

                {/* Percentage Badge */}
                <div style={{
                  textAlign: 'right',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  backgroundColor: washColor,
                  border: `1px solid ${borderColor}`
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: statusColor, lineHeight: 1 }}>
                    {stats.currentPercentage}%
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: statusColor, marginTop: '3px' }}>
                    {statusText}
                  </div>
                </div>
              </div>

              {/* Visual Progress Bar with 80% Marker */}
              <div>
                <div style={{ position: 'relative', width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, stats.currentPercentage)}%`,
                    height: '100%',
                    backgroundColor: statusColor,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease-out'
                  }} />
                  {/* 80% statutory needle */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: '80%',
                    width: '2px',
                    backgroundColor: 'var(--ink)',
                    opacity: 0.8,
                    zIndex: 2
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  <span>0%</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>80% Statutory Rule</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Metric Chips */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border)',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--ink-soft)', display: 'block' }}>Conducted</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                    {course.attended} / {course.conducted}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: 'var(--ink-soft)', display: 'block' }}>Safe Bunks</span>
                  <span style={{ fontWeight: 700, color: isDanger ? 'var(--hanko)' : 'var(--moss)' }}>
                    {isDanger ? '0 Safe' : `+${stats.safeBunksRemaining} Safe`}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '10px', color: 'var(--ink-soft)', display: 'block' }}>
                    {isDanger ? 'Recovery Req.' : 'Immediate Bunk'}
                  </span>
                  <span style={{ fontWeight: 600, color: isDanger ? 'var(--hanko)' : 'var(--ink)' }}>
                    {isDanger
                      ? `${stats.recoveryRequired} Classes`
                      : (stats.safeImmediateBunks > 0 ? `Yes (${stats.safeImmediateBunks} cl)` : 'No')}
                  </span>
                </div>
              </div>

              {/* Quick Simulate Button */}
              <button
                onClick={() => {
                  setSelectedCourseForSim(course.code);
                  setShowSimDrawer(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--paper)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Calculator size={13} style={{ color: 'var(--mizu)' }} />
                <span>Simulate Bunks for {course.code}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Interactive What-If Simulator Widget */}
      <div style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '18px',
        boxShadow: 'var(--shadow-card)',
        marginTop: '8px'
      }}>
        <div
          onClick={() => setShowSimDrawer(!showSimDrawer)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: 'var(--wash-ochre)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ochre)'
            }}>
              <Sliders size={16} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 600, color: 'var(--ink)' }}>
                What-If Attendance Simulator
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                Plan your leaves without risking debarment
              </p>
            </div>
          </div>
          {showSimDrawer ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>

        {showSimDrawer && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Select Course Dropdown */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>
                Select Course to Simulate:
              </label>
              <select
                value={selectedCourseForSim}
                onChange={(e) => setSelectedCourseForSim(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--paper)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                {evaluatedCourses.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name} ({c.stats.currentPercentage}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Steppers: Skips vs Attends */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '10px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--hanko)', fontWeight: 600, display: 'block' }}>
                  Classes to Skip
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '6px' }}>
                  <button
                    onClick={() => setSkipCount(Math.max(0, skipCount - 1))}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >-</button>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
                    <NumberFlow value={skipCount} />
                  </span>
                  <button
                    onClick={() => setSkipCount(skipCount + 1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >+</button>
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '10px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--moss)', fontWeight: 600, display: 'block' }}>
                  Classes to Attend
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '6px' }}>
                  <button
                    onClick={() => setAttendCount(Math.max(0, attendCount - 1))}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >-</button>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
                    <NumberFlow value={attendCount} />
                  </span>
                  <button
                    onClick={() => setAttendCount(attendCount + 1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >+</button>
                </div>
              </div>
            </div>

            {/* Projection Output */}
            <div style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: simIsSafe ? 'var(--wash-moss)' : 'var(--wash-hanko)',
              border: `1px solid ${simIsSafe ? 'rgba(110, 140, 99, 0.3)' : 'rgba(210, 84, 63, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: simIsSafe ? 'var(--moss)' : 'var(--hanko)' }}>
                  Projected Attendance:
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--ink-soft)', textDecoration: 'line-through' }}>
                    {simOriginalStats?.currentPercentage}%
                  </span>
                  <ArrowRight size={14} style={{ color: 'var(--ink-soft)' }} />
                  <span style={{ fontSize: '20px', fontWeight: 800, color: simIsSafe ? 'var(--moss)' : 'var(--hanko)' }}>
                    <NumberFlow value={simProjectedPct} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />%
                  </span>
                </div>
              </div>

              <div style={{
                textAlign: 'right',
                fontSize: '12px',
                fontWeight: 700,
                color: simIsSafe ? 'var(--moss)' : 'var(--hanko)'
              }}>
                {simIsSafe ? 'Safe to Proceed' : 'Debarment Danger!'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

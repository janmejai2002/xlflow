import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, Calculator, Check, ArrowRight, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateBunkStats, simulateAttendance, STATUTORY_THRESHOLD } from '../services/bunkCalculator';
import NumberFlow from '@number-flow/react';
import CourseSafetyCard from './CourseSafetyCard';

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
          fontFamily: 'var(--font-brand)',
          fontSize: '24px',
          fontWeight: 800,
          letterSpacing: '-0.025em',
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
          <span style={{ fontSize: '11px', color: 'var(--moss-text)', fontWeight: 600 }}>Safe (&ge;85%)</span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--moss-text)', marginTop: '2px' }}>
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
          <span style={{ fontSize: '11px', color: warningOrDanger > 0 ? 'var(--hanko-text)' : 'var(--ink-soft)', fontWeight: 600 }}>
            Risk / Action
          </span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: warningOrDanger > 0 ? 'var(--hanko-text)' : 'var(--ink)', marginTop: '2px' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredCourses.map(course => (
          <CourseSafetyCard
            key={course.code}
            course={course}
            onOpenDeepSim={(code) => {
              setSelectedCourseForSim(code);
              setShowSimDrawer(true);
            }}
          />
        ))}
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

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Sliders,
  Check,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileText
} from 'lucide-react';
import { calculateBunkStats, simulateAttendance, STATUTORY_THRESHOLD } from '../../../services/bunkCalculator';
import { COURSE_COLORS } from '../../../data/rosterData';
import { toast } from 'sonner';

export default function SectorBunkMeter({ courses = [] }) {
  const [filterTerm, setFilterTerm] = useState('all');
  const [simulations, setSimulations] = useState({});

  const evaluatedCourses = courses.map(course => {
    const stats = calculateBunkStats(course.attended, course.conducted, course.totalPlanned);
    return {
      ...course,
      stats
    };
  });

  const filteredCourses = evaluatedCourses.filter(c => {
    if (filterTerm === 'all') return true;
    return c.term?.includes(filterTerm);
  });

  const totalCourses = evaluatedCourses.length;
  const safeCount = evaluatedCourses.filter(c => c.stats.tier === 'safe').length;
  const riskCount = evaluatedCourses.filter(c => c.stats.tier === 'warning' || c.stats.tier === 'danger').length;

  const handleSimulateChange = (code, deltaSkips) => {
    setSimulations(prev => {
      const current = prev[code] || 0;
      const next = Math.max(0, Math.min(10, current + deltaSkips));
      return { ...prev, [code]: next };
    });
  };

  const handleExportAuditPdf = () => {
    window.print();
    toast.success('Generated Dean Appeal Attendance Report');
  };

  return (
    <div style={{
      width: '1200px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      flexShrink: 0
    }}>
      {/* Sector Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                SECTOR 03
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Statutory Attendance Safety & Risk Simulation</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '2px 0 0 0',
              letterSpacing: '-0.025em'
            }}>
              Bunk-O-Meter Safety Matrix
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* Summary KPI Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px'
      }}>
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

        <div style={{
          backgroundColor: 'var(--wash-moss)',
          padding: '12px 18px',
          borderRadius: '12px',
          border: '1px solid rgba(110, 140, 99, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--moss-text)' }}>SAFE ZONE (≥85%)</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--moss-text)', marginTop: '2px' }}>
              {safeCount} Courses Safe
            </div>
          </div>
          <ShieldCheck size={20} color="var(--moss)" />
        </div>

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

      {/* 3-Column Course Grid */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '14px',
        alignContent: 'start'
      }}>
        {filteredCourses.map(course => {
          const simSkips = simulations[course.code] || 0;
          const projectedPct = simSkips > 0
            ? simulateAttendance(course.attended, course.conducted, 0, simSkips)
            : course.stats.currentPercentage;
          const colors = COURSE_COLORS[course.code] || { accent: '#4E6E9C' };
          const isSafe = projectedPct >= STATUTORY_THRESHOLD * 100;

          return (
            <div
              key={course.id || course.code}
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--shadow-card)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Color accent header */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                backgroundColor: colors.accent
              }} />

              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: colors.accent,
                  backgroundColor: 'var(--paper)',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)'
                }}>
                  {course.code}
                </span>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isSafe ? 'var(--moss)' : 'var(--hanko)',
                  backgroundColor: isSafe ? 'var(--wash-moss)' : 'var(--wash-hanko)',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {projectedPct.toFixed(1)}% {simSkips > 0 ? `(Sim -${simSkips})` : ''}
                </span>
              </div>

              <div>
                <h4 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: '0 0 2px 0',
                  lineHeight: 1.2
                }}>
                  {course.name}
                </h4>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                  {course.faculty} • {course.credits || 3.0} Credits
                </div>
              </div>

              {/* Statutory 80% Bar */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-soft)', marginBottom: '4px' }}>
                  <span>Conducted: {course.attended}/{course.conducted}</span>
                  <span>Min 80.0% Required</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'var(--paper)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${Math.min(100, projectedPct)}%`,
                    height: '100%',
                    backgroundColor: isSafe ? 'var(--moss)' : 'var(--hanko)',
                    borderRadius: '999px',
                    transition: 'width 0.2s'
                  }} />
                </div>
              </div>

              {/* Safe bunks indicator */}
              <div style={{
                fontSize: '11px',
                color: 'var(--ink-soft)',
                backgroundColor: 'var(--paper)',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                {course.stats.safeBunksRemaining > 0 ? (
                  <span>✅ <strong style={{ color: 'var(--moss)' }}>+{course.stats.safeBunksRemaining} safe bunks</strong> remaining</span>
                ) : (
                  <span>⚠️ <strong style={{ color: 'var(--hanko)' }}>Must attend {course.stats.recoveryRequired} classes</strong> to recover</span>
                )}
              </div>

              {/* Interactive What-If Slider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border)',
                fontSize: '11px'
              }}>
                <span style={{ color: 'var(--ink-soft)' }}>Simulate skip:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => handleSimulateChange(course.code, -1)}
                    disabled={simSkips <= 0}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--paper)',
                      color: 'var(--ink)',
                      cursor: simSkips <= 0 ? 'default' : 'pointer',
                      opacity: simSkips <= 0 ? 0.3 : 1
                    }}
                  >
                    -
                  </button>
                  <span style={{ minWidth: '18px', textAlign: 'center', fontWeight: 700, color: 'var(--ink)' }}>
                    {simSkips}
                  </span>
                  <button
                    onClick={() => handleSimulateChange(course.code, 1)}
                    disabled={simSkips >= 5}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--paper)',
                      color: 'var(--ink)',
                      cursor: simSkips >= 5 ? 'default' : 'pointer',
                      opacity: simSkips >= 5 ? 0.3 : 1
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

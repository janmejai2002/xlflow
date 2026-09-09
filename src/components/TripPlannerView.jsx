import React, { useState } from 'react';
import { Compass, Calendar, Sun, Palmtree, Sliders, AlertCircle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { findNaturalGetaways, findCustomTrips } from '../services/tripPlanner';
import { COURSE_COLORS } from '../data/rosterData';

export default function TripPlannerView({ schedule = [], deadlines = [], courses = [] }) {
  const [tab, setTab] = useState('natural'); // 'natural' | 'custom' | 'group'
  const [customDur, setCustomDur] = useState(3);
  const [customMaxMiss, setCustomMaxMiss] = useState(1);

  // Group Planner Simulation State
  const [selectedElectives, setSelectedElectives] = useState(['OMCR', 'BDM', 'B2B']);

  const naturalGetaways = findNaturalGetaways(schedule, deadlines);
  const customTrips = findCustomTrips(schedule, deadlines, customDur, customMaxMiss);

  const toggleElective = (code) => {
    if (selectedElectives.includes(code)) {
      if (selectedElectives.length > 1) {
        setSelectedElectives(selectedElectives.filter(c => c !== code));
      }
    } else {
      setSelectedElectives([...selectedElectives, code]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
      
      {/* View Header */}
      <div>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '24px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--ink)'
        }}>
          Getaways & Trip Planner
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '2px' }}>
          Find zero-exam long weekends with minimal attendance impact.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'natural', label: `Natural Getaways (${naturalGetaways.length})` },
          { id: 'custom', label: 'Custom Trip Finder' },
          { id: 'group', label: 'Group Clash Optimizer' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: tab === t.id ? '1px solid var(--ink)' : '1px solid var(--border)',
              backgroundColor: tab === t.id ? 'var(--ink)' : 'var(--card)',
              color: tab === t.id ? 'var(--paper)' : 'var(--ink-soft)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Natural Getaways */}
      {tab === 'natural' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            backgroundColor: 'var(--wash-moss)',
            border: '1px solid rgba(110, 140, 99, 0.25)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Palmtree size={20} style={{ color: 'var(--moss)', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: 'var(--ink)' }}>
              <span style={{ fontWeight: 700, color: 'var(--moss)' }}>Smart Gap Detection:</span> Scanning for 3+ day windows with 0 exams and ≤ 1 class missed across Term-5.
            </div>
          </div>

          {naturalGetaways.map((trip, idx) => {
            const startDateObj = new Date(trip.startDate + 'T00:00:00');
            const endDateObj = new Date(trip.endDate + 'T00:00:00');
            const startFmt = startDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const endFmt = endDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

            const isZeroMiss = trip.classesMissed === 0;

            return (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${isZeroMiss ? 'var(--moss)' : 'var(--ochre)'}`,
                  borderRadius: '14px',
                  padding: '16px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--ink)'
                    }}>
                      {trip.lengthDays} Days Stretch
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: isZeroMiss ? 'var(--wash-moss)' : 'var(--wash-ochre)',
                      color: isZeroMiss ? 'var(--moss)' : 'var(--ochre)',
                      border: `1px solid ${isZeroMiss ? 'rgba(110, 140, 99, 0.3)' : 'rgba(194, 145, 58, 0.3)'}`
                    }}>
                      {trip.rating}
                    </span>
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                    0 Exams / Quizzes
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                  📅 {startFmt} <span style={{ color: 'var(--ink-soft)' }}>to</span> {endFmt}
                </div>

                {/* Missed classes breakdown */}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--paper)',
                  border: '1px solid var(--border)',
                  fontSize: '12px'
                }}>
                  {isZeroMiss ? (
                    <span style={{ color: 'var(--moss)', fontWeight: 600 }}>
                      🎉 Clear schedule! You can travel with zero attendance impact.
                    </span>
                  ) : (
                    <div>
                      <span style={{ color: 'var(--ochre)', fontWeight: 600 }}>
                        Missed classes ({trip.classesMissed}):
                      </span>
                      <span style={{ color: 'var(--ink)', marginLeft: '6px' }}>
                        {Object.entries(trip.missedCourses).map(([c, n]) => `${c} (${n})`).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {naturalGetaways.length === 0 && (
            <div style={{ textAlign: 'center', padding: '36px', backgroundColor: 'var(--card)', borderRadius: '12px' }}>
              <Compass size={28} style={{ color: 'var(--ink-soft)', margin: '0 auto 10px auto' }} />
              <p style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
                No long natural getaways found in this period.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Custom Trip Duration Calculator */}
      {tab === 'custom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
              Custom Travel Parameters
            </h3>

            {/* Duration Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>Trip Duration:</span>
                <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{customDur} Days</span>
              </div>
              <input
                type="range"
                min="1"
                max="7"
                value={customDur}
                onChange={(e) => setCustomDur(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--mizu)' }}
              />
            </div>

            {/* Max Misses Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>Max Classes You Can Miss:</span>
                <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{customMaxMiss} Class{customMaxMiss === 1 ? '' : 'es'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                value={customMaxMiss}
                onChange={(e) => setCustomMaxMiss(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--mizu)' }}
              />
            </div>
          </div>

          {/* Results list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
              Found {customTrips.length} viable {customDur}-day trip window{customTrips.length === 1 ? '' : 's'}:
            </span>

            {customTrips.map((trip, idx) => {
              const d1 = new Date(trip.startDate + 'T00:00:00');
              const d2 = new Date(trip.endDate + 'T00:00:00');
              const d1s = d1.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const d2s = d2.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                      {d1s} — {d2s}
                    </div>
                    <div style={{ fontSize: '11px', color: trip.classesMissed === 0 ? 'var(--moss)' : 'var(--ochre)', marginTop: '2px' }}>
                      {trip.classesMissed === 0 ? '0 Classes missed 🌴' : `Misses ${trip.classesMissed} classes: ${Object.entries(trip.missedCourses).map(([c, n]) => `${c} (${n})`).join(', ')}`}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--wash-mizu)',
                    color: 'var(--mizu)'
                  }}>
                    {trip.lengthDays}d
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Group Clash Optimizer */}
      {tab === 'group' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
              Group Vulnerability & Clash Optimizer
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: 0 }}>
              Ported from Term-4 Command Centre: computes joint penalty using standard deviation fairness and non-linear attendance risk.
            </p>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: '6px' }}>
                Select Active Courses in Your Travel Group:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['OMCR', 'BDM', 'B2B', 'IMCE'].map(code => {
                  const isSel = selectedElectives.includes(code);
                  const ccolor = COURSE_COLORS[code] || COURSE_COLORS.DEFAULT;
                  return (
                    <button
                      key={code}
                      onClick={() => toggleElective(code)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: isSel ? `1.5px solid ${ccolor.border}` : '1px solid var(--border)',
                        backgroundColor: isSel ? ccolor.wash : 'var(--paper)',
                        color: isSel ? ccolor.border : 'var(--ink-soft)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vulnerability Scale Card */}
            <div style={{
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: 'var(--paper)',
              border: '1px solid var(--border)',
              fontSize: '11px',
              color: 'var(--ink-soft)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Mathematical Vulnerability Scale:</span>
              <span>• $\le 0$ Safe Bunks $\to$ <strong>1000 Penalty</strong> (Prunes trip automatically)</span>
              <span>• $1$ Safe Bunk $\to$ <strong>10 Penalty</strong> (High debarment risk)</span>
              <span>• $2$ Safe Bunks $\to$ <strong>3 Penalty</strong> (Moderate cushion)</span>
              <span>• $\ge 3$ Safe Bunks $\to$ <strong>1 Penalty</strong> (Safe to travel)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

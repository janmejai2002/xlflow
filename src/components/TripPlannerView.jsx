import React, { useState, useMemo } from 'react';
import { findNaturalGetaways, findCustomTrips } from '../services/tripPlanner';
import { COURSE_COLORS } from '../data/courseColors';
import { playTactileClick } from '../services/soundEngine';
import {
  IconTrips,
  IconChronometer,
  IconStatutoryShield,
  IconArrowRight,
  IconHankoSafe,
  IconHankoWarning,
  IconHankoDanger
} from './icons';

/**
 * TripPlannerView: 2026 Academic Expedition & Travel Itinerary Docket
 *
 * Scans academic timetable calendars for zero-exam getaway stretches,
 * computes non-linear attendance safety margin penalties, and generates
 * cartographic itinerary dockets adhering to wAIbi-sabi academic design.
 */
export default function TripPlannerView({ schedule = [], deadlines = [], courses = [] }) {
  const [tab, setTab] = useState('natural'); // 'natural' | 'custom' | 'group'
  const [customDur, setCustomDur] = useState(3);
  const [customMaxMiss, setCustomMaxMiss] = useState(1);

  // Group Planner Simulation State
  const [selectedElectives, setSelectedElectives] = useState(['OMCR', 'BDM', 'B2B']);

  const naturalGetaways = useMemo(() => findNaturalGetaways(schedule, deadlines), [schedule, deadlines]);
  const customTrips = useMemo(
    () => findCustomTrips(schedule, deadlines, customDur, customMaxMiss),
    [schedule, deadlines, customDur, customMaxMiss]
  );

  const toggleElective = (code) => {
    playTactileClick(450);
    if (selectedElectives.includes(code)) {
      if (selectedElectives.length > 1) {
        setSelectedElectives(selectedElectives.filter((c) => c !== code));
      }
    } else {
      setSelectedElectives([...selectedElectives, code]);
    }
  };

  const handleTabChange = (newTab) => {
    playTactileClick(500);
    setTab(newTab);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '36px' }}>
      {/* View Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--moss)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}
          >
            EXPEDITION DOCKET
          </span>
          <span style={{ fontSize: '11px', color: 'var(--border)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-faint)' }}>
            SOVEREIGN TRAVEL PLANNER
          </span>
        </div>
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
          Getaways & Travel Itinerary
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '3px', margin: 0 }}>
          Algorithmic zero-exam long weekends calculated against statutory 80% attendance margins.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'natural', label: `NATURAL GETAWAYS (${naturalGetaways.length})` },
          { id: 'custom', label: 'CUSTOM TRIP FINDER' },
          { id: 'group', label: 'GROUP CLASH OPTIMIZER' }
        ].map((t) => (
          <button
            key={t.id}
            className="btn-tactile"
            onClick={() => handleTabChange(t.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              border: tab === t.id ? '1px solid var(--ink)' : '1px solid var(--border)',
              backgroundColor: tab === t.id ? 'var(--ink)' : 'var(--card)',
              color: tab === t.id ? 'var(--paper)' : 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Natural Getaways */}
      {tab === 'natural' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Smart Scan Callout Strip */}
          <div
            className="editorial-slate"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--moss)',
              borderRadius: '4px',
              padding: '11px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <IconTrips size={18} color="var(--moss)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '12.5px', color: 'var(--ink)' }}>
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.04em', color: 'var(--moss)' }}>
                CALENDAR GAP AUDIT:
              </strong>{' '}
              Scanning for contiguous 3+ day windows with 0 formal exams and ≤ 1 class missed across Term-5.
            </div>
          </div>

          {/* Expedition Passes / Getaway Dockets */}
          {naturalGetaways.map((trip, idx) => {
            const startDateObj = new Date(trip.startDate + 'T00:00:00');
            const endDateObj = new Date(trip.endDate + 'T00:00:00');
            const startFmt = startDateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            });
            const endFmt = endDateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            });

            const isZeroMiss = trip.classesMissed === 0;

            return (
              <div
                key={idx}
                className="editorial-slate"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${isZeroMiss ? 'var(--moss)' : 'var(--ochre)'}`,
                  borderRadius: '6px',
                  padding: '14px 16px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Header: Headline in Newsreader Serif + Japanese Hanko Seals */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <h3
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontStyle: 'italic',
                        fontSize: '18px',
                        fontWeight: 700,
                        color: 'var(--ink)',
                        margin: 0,
                        lineHeight: 1.2
                      }}
                    >
                      {trip.lengthDays} Days Expedition Stretch
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      className="hanko-stamp"
                      style={{
                        color: 'var(--indigo)',
                        borderColor: 'rgba(var(--indigo-rgb), 0.45)',
                        backgroundColor: 'var(--wash-indigo)'
                      }}
                    >
                      +{trip.lengthDays} DAYS
                    </span>

                    <span
                      className="hanko-stamp"
                      style={{
                        color: isZeroMiss ? 'var(--moss)' : 'var(--ochre)',
                        borderColor: isZeroMiss ? 'rgba(var(--moss-rgb), 0.45)' : 'rgba(var(--ochre-rgb), 0.45)',
                        backgroundColor: isZeroMiss ? 'var(--wash-moss)' : 'var(--wash-ochre)'
                      }}
                    >
                      {isZeroMiss ? (
                        <IconHankoSafe size={11} color="var(--moss)" />
                      ) : (
                        <IconHankoWarning size={11} color="var(--ochre)" />
                      )}
                      <span>{isZeroMiss ? 'ZERO CLASH' : `${trip.classesMissed} SKIP REQUIRED`}</span>
                    </span>
                  </div>
                </div>

                {/* Tabular Monospace Date Range */}
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontFeatureSettings: '"tnum"',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{startFmt}</span>
                    <IconArrowRight size={13} color="var(--ink-faint)" />
                    <span>{endFmt}</span>
                  </div>

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: 'var(--ink-faint)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase'
                    }}
                  >
                    0 Exam / Quiz Clashes
                  </span>
                </div>

                {/* Missed classes audit ledger */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--paper)',
                    border: '1px solid var(--border-soft)',
                    fontSize: '12px'
                  }}
                >
                  {isZeroMiss ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--moss)' }}>
                      <IconStatutoryShield size={14} color="var(--moss)" />
                      <span style={{ fontWeight: 600 }}>
                        Clear academic schedule — zero attendance impact or margin reduction.
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <IconChronometer size={14} color="var(--ochre)" />
                      <span style={{ color: 'var(--ochre)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                        Missed lectures ({trip.classesMissed}):
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                        {Object.entries(trip.missedCourses)
                          .map(([c, n]) => `${c} (${n})`)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {naturalGetaways.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '36px',
                backgroundColor: 'var(--card)',
                borderRadius: '4px',
                border: '1px dashed var(--border)'
              }}
            >
              <IconTrips size={28} color="var(--ink-faint)" style={{ margin: '0 auto 10px auto' }} />
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '14.5px',
                  color: 'var(--ink-soft)',
                  margin: 0
                }}
              >
                No natural getaways found in the active calendar window.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Custom Trip Duration Calculator */}
      {tab === 'custom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Custom Parameters Form */}
          <div
            className="editorial-slate"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '17px',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: 0
              }}
            >
              Custom Travel Parameters
            </h3>

            {/* Duration Slider */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  marginBottom: '6px',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>TRIP DURATION:</span>
                <span style={{ color: 'var(--ink)', fontWeight: 800 }}>{customDur} DAYS</span>
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  marginBottom: '6px',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>MAX CLASSES PERMISSIBLE TO MISS:</span>
                <span style={{ color: 'var(--ink)', fontWeight: 800 }}>
                  {customMaxMiss} CLASS{customMaxMiss === 1 ? '' : 'ES'}
                </span>
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

          {/* Results List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--ink-faint)',
                letterSpacing: '0.04em'
              }}
            >
              Found {customTrips.length} viable {customDur}-day trip window{customTrips.length === 1 ? '' : 's'}:
            </span>

            {customTrips.map((trip, idx) => {
              const d1 = new Date(trip.startDate + 'T00:00:00');
              const d2 = new Date(trip.endDate + 'T00:00:00');
              const d1s = d1.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              });
              const d2s = d2.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={idx}
                  className="editorial-slate"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '11px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontFeatureSettings: '"tnum"',
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--ink)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{d1s}</span>
                      <IconArrowRight size={12} color="var(--ink-faint)" />
                      <span>{d2s}</span>
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: trip.classesMissed === 0 ? 'var(--moss)' : 'var(--ochre)',
                        marginTop: '2px'
                      }}
                    >
                      {trip.classesMissed === 0
                        ? '0 Classes missed · Zero attendance impact'
                        : `Misses ${trip.classesMissed} classes: ${Object.entries(trip.missedCourses)
                            .map(([c, n]) => `${c} (${n})`)
                            .join(', ')}`}
                    </div>
                  </div>

                  <span
                    className="hanko-stamp"
                    style={{
                      color: trip.classesMissed === 0 ? 'var(--moss)' : 'var(--ochre)',
                      borderColor: trip.classesMissed === 0 ? 'rgba(var(--moss-rgb), 0.4)' : 'rgba(var(--ochre-rgb), 0.4)',
                      backgroundColor: trip.classesMissed === 0 ? 'var(--wash-moss)' : 'var(--wash-ochre)'
                    }}
                  >
                    {trip.lengthDays}D STRETCH
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
          <div
            className="editorial-slate"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '17px',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: 0
              }}
            >
              Group Vulnerability & Clash Optimizer
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.45 }}>
              Computes joint group absence penalty using standard deviation fairness and non-linear attendance safety
              margins across multiple electives.
            </p>

            <div>
              <label
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                  display: 'block',
                  marginBottom: '8px'
                }}
              >
                Select Active Courses in Your Travel Group:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['OMCR', 'BDM', 'B2B', 'IMCE'].map((code) => {
                  const isSel = selectedElectives.includes(code);
                  const ccolor = COURSE_COLORS[code] || { accent: 'var(--mizu)' };
                  return (
                    <button
                      key={code}
                      className="btn-tactile"
                      onClick={() => toggleElective(code)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '4px',
                        border: isSel ? `1px solid ${ccolor.accent}` : '1px solid var(--border)',
                        backgroundColor: isSel ? 'var(--ink)' : 'var(--paper)',
                        color: isSel ? 'var(--paper)' : 'var(--ink)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
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
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '4px',
                backgroundColor: 'var(--paper-subtle)',
                border: '1px solid var(--border-soft)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                color: 'var(--ink-soft)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span style={{ fontWeight: 800, color: 'var(--ink)', letterSpacing: '0.04em' }}>
                MATHEMATICAL VULNERABILITY MATRIX:
              </span>
              <span>• ≤ 0 Safe Bunks → 1000 Penalty (Automatically prunes trip window)</span>
              <span>• 1 Safe Bunk → 10 Penalty (High statutory debarment hazard)</span>
              <span>• 2 Safe Bunks → 3 Penalty (Moderate safety cushion)</span>
              <span>• ≥ 3 Safe Bunks → 1 Penalty (Statutorily safe to travel)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

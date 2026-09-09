import React, { useState } from 'react';
import {
  Palmtree,
  Calendar,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Sun,
  Sparkles
} from 'lucide-react';
import { findNaturalGetaways } from '../../../services/tripPlanner';
import { toast } from 'sonner';

export default function SectorTrips({ schedule = [], deadlines = [], courses = [] }) {
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Discover natural getaways
  const naturalGetaways = findNaturalGetaways(schedule, deadlines) || [
    {
      id: 'trip_1',
      title: 'Dussehra Mega Long Weekend',
      startDate: '2026-10-18',
      endDate: '2026-10-22',
      durationDays: 5,
      classesMissed: 1,
      coursesAffected: ['OMCR'],
      examConflicts: 0,
      description: 'Prime opportunity for North-East or Goa getaway with minimal academic impact.'
    },
    {
      id: 'trip_2',
      title: 'Gandhi Jayanti Break',
      startDate: '2026-10-02',
      endDate: '2026-10-04',
      durationDays: 3,
      classesMissed: 0,
      coursesAffected: [],
      examConflicts: 0,
      description: 'Zero bunks required. Ideal for quick retreat to Purulia / Ranchi hills.'
    },
    {
      id: 'trip_3',
      title: 'Term-5 Post-Midterm Breathing Room',
      startDate: '2026-11-06',
      endDate: '2026-11-09',
      durationDays: 4,
      classesMissed: 2,
      coursesAffected: ['BDM', 'STMAN'],
      examConflicts: 0,
      description: '4-day recovery window immediately after strategy midterms.'
    }
  ];

  return (
    <div style={{
      width: 'min(1120px, calc(100vw - 80px))',
      maxWidth: '100%',
      boxSizing: 'border-box',
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
            background: 'var(--wash-ochre)',
            border: '1px solid rgba(194, 145, 58, 0.3)',
            color: 'var(--ochre)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(194, 145, 58, 0.15)'
          }}>
            <Palmtree size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ochre)', letterSpacing: '0.06em' }}>
                SECTOR 04
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Vacation Arbitrage & Long Weekend Optimizer</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '2px 0 0 0',
              letterSpacing: '-0.025em'
            }}>
              Getaways & Natural Travel Windows
            </h2>
          </div>
        </div>

        <span style={{
          fontSize: '11px',
          color: 'var(--moss-text)',
          backgroundColor: 'var(--wash-moss)',
          padding: '4px 10px',
          borderRadius: '8px',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Sparkles size={12} />
          {naturalGetaways.length} Optimal Windows Detected
        </span>
      </div>

      {/* Main Vacation Cards Grid */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        alignContent: 'start'
      }}>
        {naturalGetaways.map((trip, idx) => {
          const isZeroBunk = trip.classesMissed === 0;

          return (
            <div
              key={trip.id || idx}
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-card)',
                position: 'relative',
                overflow: 'hidden',
                gap: '14px'
              }}
            >
              {/* Header Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isZeroBunk ? 'var(--moss)' : 'var(--ochre)',
                  backgroundColor: isZeroBunk ? 'var(--wash-moss)' : 'var(--wash-ochre)',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  {isZeroBunk ? '🌟 ZERO BUNKS' : `⚡ ${trip.classesMissed} CLASS MISSED`}
                </span>

                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink)',
                  fontWeight: 600,
                  backgroundColor: 'var(--paper)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)'
                }}>
                  {trip.durationDays} Days
                </span>
              </div>

              <div>
                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: '0 0 6px 0',
                  lineHeight: 1.25
                }}>
                  {trip.title}
                </h3>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'var(--ink-soft)',
                  marginBottom: '8px'
                }}>
                  <Calendar size={13} color="var(--ink-soft)" />
                  <span>{trip.startDate} – {trip.endDate}</span>
                </div>

                <p style={{
                  fontSize: '12px',
                  color: 'var(--ink-soft)',
                  lineHeight: 1.4,
                  margin: 0
                }}>
                  {trip.description}
                </p>
              </div>

              {/* Attendance Impact Metric */}
              <div style={{
                padding: '10px 12px',
                backgroundColor: 'var(--paper)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '11px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Exam Conflicts:</span>
                  <strong style={{ color: 'var(--moss)' }}>0 None</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>Courses Impacted:</span>
                  <span>{trip.coursesAffected?.length > 0 ? trip.coursesAffected.join(', ') : 'None (Free)'}</span>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => {
                  toast.success(`Bookmarked: ${trip.title}`, {
                    description: `${trip.durationDays}-day window from ${trip.startDate} to ${trip.endDate}`
                  });
                }}
                style={{
                  width: '100%',
                  padding: '9px',
                  backgroundColor: 'var(--ink)',
                  color: 'var(--paper)',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plane size={13} />
                <span>Bookmark Vacation Plan</span>
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
}

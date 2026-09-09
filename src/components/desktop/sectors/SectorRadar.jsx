import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Calendar,
  User,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Flame,
  ArrowRight,
  Compass
} from 'lucide-react';
import { COURSE_COLORS } from '../../../data/rosterData';
import { calculateBunkStats } from '../../../services/bunkCalculator';
import { getGoogleCalendarUrl } from '../../../services/calendarExport';
import ChronosOrb3D from '../../ChronosOrb3D';
import TemporalScrubber from '../../TemporalScrubber';
import HorizonHeatmap from '../../HorizonHeatmap';
import { toast } from 'sonner';

export default function SectorRadar({
  schedule = [],
  courses = [],
  deadlines = [],
  onSelectSession,
  onSelectDate
}) {
  const [copiedVenue, setCopiedVenue] = useState(false);
  const [spatialMode, setSpatialMode] = useState('2d');
  const [simulatedHour, setSimulatedHour] = useState(10.5);
  const [isLiveTime, setIsLiveTime] = useState(true);

  // Active / next lecture calculation
  const nextSession = schedule[0] || {
    sessionId: 'omcr_demo',
    courseCode: 'OMCR',
    courseName: 'Omnichannel Retailing',
    faculty: 'Dr. Smitu Malhotra',
    venue: 'MCR 07',
    building: 'Academic Building',
    classDate: '2026-09-11',
    startTime: '10:20:00',
    endTime: '11:50:00',
    section: 'EF'
  };

  const courseMatch = courses.find(c => c.code === nextSession.courseCode) || {
    code: nextSession.courseCode,
    attended: 16,
    conducted: 16,
    totalPlanned: 20
  };

  const stats = calculateBunkStats(courseMatch.attended, courseMatch.conducted, courseMatch.totalPlanned);
  const colors = COURSE_COLORS[nextSession.courseCode] || { accent: '#4E6E9C', bg: 'var(--card)' };

  const handleCopyVenue = (venue) => {
    navigator.clipboard.writeText(venue);
    setCopiedVenue(true);
    toast.success(`Venue Copied: ${venue}`);
    setTimeout(() => setCopiedVenue(false), 2000);
  };

  const handleOpenGCal = () => {
    const url = getGoogleCalendarUrl(nextSession);
    window.open(url, '_blank');
  };

  return (
    <div style={{
      width: '1140px',
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
            backgroundColor: 'var(--ink)',
            color: 'var(--mizu)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Compass size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mizu)', letterSpacing: '0.06em' }}>
                SECTOR 01
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Live Spatial Flight Deck</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '22px',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: '2px 0 0 0',
              letterSpacing: '-0.02em'
            }}>
              Today's Radar & Chronos Continuum
            </h2>
          </div>
        </div>

        {/* 2D / 3D Spatial Continuum Switch */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--card)',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid var(--border)'
        }}>
          <button
            onClick={() => setSpatialMode('2d')}
            style={{
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: spatialMode === '2d' ? 'var(--ink)' : 'transparent',
              color: spatialMode === '2d' ? 'var(--paper)' : 'var(--ink-soft)',
              cursor: 'pointer'
            }}
          >
            2D Tactical View
          </button>
          <button
            onClick={() => setSpatialMode('3d')}
            style={{
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: spatialMode === '3d' ? 'var(--ink)' : 'transparent',
              color: spatialMode === '3d' ? 'var(--paper)' : 'var(--ink-soft)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sparkles size={11} color={spatialMode === '3d' ? 'var(--mizu)' : 'currentColor'} />
            <span>3D Celestial Orb</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Cockpit Container */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        minHeight: 0,
        overflowY: 'auto'
      }}>
        {/* Left Column: Hero Class Card + Upcoming slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Hero Next Lecture Card */}
          <div
            onClick={() => onSelectSession?.(nextSession)}
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            {/* Color Stripe */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              backgroundColor: colors.accent
            }} />

            {/* Top Bar: Section & Countdown */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: colors.accent,
                backgroundColor: 'var(--paper)',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border)'
              }}>
                {nextSession.courseCode} • SECTION {nextSession.section || 'EF'}
              </span>

              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--mizu)',
                backgroundColor: 'var(--wash-mizu)',
                padding: '3px 8px',
                borderRadius: '8px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Clock size={12} />
                Upcoming in 1d 9h
              </span>
            </div>

            {/* Title */}
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '22px',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: '0 0 6px 0',
              lineHeight: 1.25
            }}>
              {nextSession.courseName}
            </h3>

            {/* Faculty */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '14px' }}>
              <User size={14} color="var(--ink-soft)" />
              <span>{nextSession.faculty}</span>
            </div>

            {/* Timing Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--ink)',
              marginBottom: '14px'
            }}>
              <Clock size={14} color="var(--ink-soft)" />
              <strong>{nextSession.startTime.slice(0, 5)} - {nextSession.endTime.slice(0, 5)}</strong>
              <span style={{ color: 'var(--ink-soft)', fontSize: '12px' }}>({nextSession.classDate})</span>
            </div>

            {/* Venue & GCal Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid var(--border)'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyVenue(nextSession.venue);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--paper)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <MapPin size={13} color={colors.accent} />
                <span>📍 {nextSession.venue}</span>
                {copiedVenue ? <Check size={12} color="var(--moss)" /> : <Copy size={12} color="var(--ink-soft)" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenGCal();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--wash-mizu)',
                  border: '1px solid rgba(0, 169, 184, 0.25)',
                  color: 'var(--mizu)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Calendar size={13} />
                <span>Add to GCal</span>
              </button>
            </div>

            {/* Attendance Safety Footer */}
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: stats.tier === 'danger' ? 'var(--wash-hanko)' : 'var(--wash-moss)',
              border: `1px solid ${stats.tier === 'danger' ? 'rgba(210, 84, 63, 0.25)' : 'rgba(110, 140, 99, 0.25)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: stats.tier === 'danger' ? 'var(--hanko)' : 'var(--moss)'
              }}>
                Safe Attendance: {(stats.currentPercentage || 100).toFixed(0)}% (+{stats.safeBunksRemaining || 4} bunks safe)
              </span>
              <ArrowRight size={13} color={stats.tier === 'danger' ? 'var(--hanko)' : 'var(--moss)'} />
            </div>
          </div>

          {/* Upcoming Schedule Horizon Stream */}
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flex: 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
                UPCOMING LECTURE PIPELINE
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                {schedule.length} slots loaded
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
              {schedule.slice(1, 5).map((s, idx) => {
                const sColors = COURSE_COLORS[s.courseCode] || { accent: '#4E6E9C' };
                return (
                  <div
                    key={s.sessionId || idx}
                    onClick={() => onSelectSession?.(s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      backgroundColor: 'var(--paper)',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = sColors.accent}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: sColors.accent
                      }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                          {s.courseName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                          {s.classDate} • {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--ink-soft)',
                      backgroundColor: 'var(--card)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid var(--border)'
                    }}>
                      📍 {s.venue}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Temporal Scrubber + Chronos Continuum Canvas + Heatmap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Temporal Scrubber Dial */}
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '14px 18px'
          }}>
            <TemporalScrubber
              simulatedHour={simulatedHour}
              onChangeHour={setSimulatedHour}
              isLive={isLiveTime}
              onResetLive={() => {
                setSimulatedHour(10.5);
                setIsLiveTime(true);
              }}
            />
          </div>

          {/* 3D Orb / Tactical Visualizer */}
          {spatialMode === '3d' ? (
            <div style={{
              height: '240px',
              backgroundColor: 'var(--card)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <ChronosOrb3D
                schedule={schedule}
                simulatedHour={simulatedHour}
                onSelectSession={onSelectSession}
              />
            </div>
          ) : (
            <div style={{
              backgroundColor: 'var(--card)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '16px'
            }}>
              <HorizonHeatmap
                schedule={schedule}
                deadlines={deadlines}
                onSelectDate={onSelectDate}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

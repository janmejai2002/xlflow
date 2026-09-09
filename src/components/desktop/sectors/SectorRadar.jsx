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
  Compass,
  Globe,
  CalendarDays
} from 'lucide-react';
import { COURSE_COLORS } from '../../../data/rosterData';
import { calculateBunkStats } from '../../../services/bunkCalculator';
import { getGoogleCalendarUrl } from '../../../services/calendarExport';
import HorizonHeatmap from '../../HorizonHeatmap';
import ChronosOrb3D from '../../ChronosOrb3D';
import { playTactileClick } from '../../../services/soundEngine';
import { toast } from 'sonner';

export default function SectorRadar({
  schedule = [],
  courses = [],
  deadlines = [],
  onSelectSession,
  onSelectDate
}) {
  const [copiedVenue, setCopiedVenue] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [spatialMode, setSpatialMode] = useState('3d'); // '3d' | 'heatmap'

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

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
      width: 'min(1140px, calc(100vw - 80px))',
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
            background: 'var(--wash-mizu)',
            border: '1px solid rgba(0, 169, 184, 0.3)',
            color: 'var(--mizu)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 169, 184, 0.15)'
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
              fontFamily: 'var(--font-brand)',
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: 'var(--ink)',
              margin: 0
            }}>
              Today's Radar & Chronos Continuum
            </h2>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'var(--card)',
          padding: '5px 12px',
          borderRadius: '9999px',
          border: '1px solid var(--border)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--ink-soft)'
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--moss)', display: 'inline-block' }} />
          <span>Real-Time Campus Feed</span>
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
              fontFamily: 'var(--font-brand)',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
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
                <span>{nextSession.venue}</span>
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

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              overflowY: 'auto',
              maxHeight: '220px',
              flex: 1,
              minHeight: 0
            }}>
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={10} color="var(--hanko)" />
                        <span>{s.venue}</span>
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Live Campus Real-Time Phase + Heatmap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Live Campus Real-Time Phase Indicator */}
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '14px 18px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--wash-moss)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--moss)'
              }}>
                <Clock size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                  Live Campus Clock • IST
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                  XLRI Delhi-NCR • Term-5 Academic Continuum
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--moss)',
              backgroundColor: 'var(--wash-moss)',
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(22, 163, 74, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--moss)', animation: 'pulse 2s infinite' }} />
              Live Real-Time
            </span>
          </div>

          {/* Spatial Continuum & Heatmap Visualizer Deck */}
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1
          }}>
            {/* View Switcher Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-soft)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => { playTactileClick(); setSpatialMode('3d'); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: spatialMode === '3d' ? 'var(--wash-mizu)' : 'transparent',
                    border: spatialMode === '3d' ? '1px solid rgba(0, 169, 184, 0.3)' : '1px solid transparent',
                    color: spatialMode === '3d' ? 'var(--mizu)' : 'var(--ink-soft)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <Globe size={13} />
                  <span>3D Chronos Continuum</span>
                </button>

                <button
                  onClick={() => { playTactileClick(); setSpatialMode('heatmap'); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: spatialMode === 'heatmap' ? 'var(--wash-mizu)' : 'transparent',
                    border: spatialMode === 'heatmap' ? '1px solid rgba(0, 169, 184, 0.3)' : '1px solid transparent',
                    color: spatialMode === 'heatmap' ? 'var(--mizu)' : 'var(--ink-soft)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <CalendarDays size={13} />
                  <span>Horizon Heatmap</span>
                </button>
              </div>

              <span style={{ fontSize: '11px', color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
                {spatialMode === '3d' ? 'Three.js Spatial Engine' : '28-Day Density Matrix'}
              </span>
            </div>

            {/* View Canvas Body */}
            <div style={{ flex: 1, minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
              {spatialMode === '3d' ? (
                <ChronosOrb3D
                  schedule={schedule}
                  courses={courses}
                  onSelectSession={onSelectSession}
                />
              ) : (
                <HorizonHeatmap
                  schedule={schedule}
                  deadlines={deadlines}
                  onSelectDate={onSelectDate}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

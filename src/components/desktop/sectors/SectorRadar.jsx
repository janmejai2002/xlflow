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
import { selfAttendanceStore } from '../../../services/selfAttendanceStore';
import SelfAttendanceMarkPill from '../../attendance/SelfAttendanceMarkPill';
import PostLectureCheckinCard from '../../attendance/PostLectureCheckinCard';
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
  const [, setStoreVer] = useState(0);

  useEffect(() => {
    const unsub = selfAttendanceStore.subscribe(() => setStoreVer(v => v + 1));
    return unsub;
  }, []);

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

  const courseStatsObj = selfAttendanceStore.getCourseStats(courseMatch, schedule);
  const stats = courseStatsObj?.active || calculateBunkStats(courseMatch.attended, courseMatch.conducted, courseMatch.totalPlanned);
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
      width: '100%',
      maxWidth: '1440px',
      margin: '0 auto',
      boxSizing: 'border-box',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      overflow: 'hidden'
    }}>
      {/* Sector Header & Live Campus Real-Time Phase */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        flexShrink: 0
      }}>
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
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: 'var(--ink)',
              margin: 0
            }}>
              Today's Radar & Chronos Continuum
            </h2>
          </div>
        </div>

        {/* Live Campus Clock & Real-time Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--card)',
            padding: '5px 12px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--ink)'
          }}>
            <Clock size={12} color="var(--moss)" />
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST</span>
            <span style={{ color: 'var(--ink-faint)' }}>•</span>
            <span style={{ color: 'var(--ink-soft)' }}>XLRI Delhi-NCR</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--wash-moss)',
            padding: '5px 12px',
            borderRadius: '9999px',
            border: '1px solid rgba(22, 163, 74, 0.25)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--moss)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--moss)', display: 'inline-block' }} />
            <span>Live Real-Time</span>
          </div>
        </div>
      </div>

      {/* Slim Inline Self-Attendance Check-In Prompt */}
      <PostLectureCheckinCard schedule={schedule} courses={courses} isSlim={true} />

      {/* Main Dual-Cockpit Container - Height Locked to Screen */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        gap: '14px',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Left Column: Hero Class Card + Upcoming Lecture Pipeline */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Hero Next Lecture Card - Streamlined & High-Density */}
          <div
            onClick={() => onSelectSession?.(nextSession)}
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '14px 18px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              flexShrink: 0
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
              height: '3.5px',
              backgroundColor: colors.accent
            }} />

            {/* Top Bar: Section & Countdown */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: colors.accent,
                backgroundColor: 'var(--paper)',
                padding: '2px 7px',
                borderRadius: '6px',
                border: '1px solid var(--border)'
              }}>
                {nextSession.courseCode} • SEC {nextSession.section || 'EF'}
              </span>

              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--mizu)',
                backgroundColor: 'var(--wash-mizu)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Clock size={11} />
                In 1d 9h
              </span>
            </div>

            {/* Title */}
            <h3 style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--ink)',
              margin: '0 0 4px 0',
              lineHeight: 1.25
            }}>
              {nextSession.courseName}
            </h3>

            {/* Faculty & Timing Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--ink-soft)' }}>
                <User size={13} color="var(--ink-soft)" />
                <span>{nextSession.faculty}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ink)', fontWeight: 600 }}>
                <Clock size={12} color="var(--mizu)" />
                <span>{nextSession.startTime.slice(0, 5)} - {nextSession.endTime.slice(0, 5)}</span>
                <span style={{ color: 'var(--ink-soft)', fontSize: '11px', fontWeight: 400 }}>({nextSession.classDate})</span>
              </div>
            </div>

            {/* Venue, GCal & Self-Attendance Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1px solid var(--border)',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyVenue(nextSession.venue);
                  }}
                  title="Click to copy classroom venue code"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '9px',
                    backgroundColor: 'var(--paper)',
                    border: '1.5px solid var(--border)',
                    color: 'var(--ink)',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <MapPin size={13} color={colors.accent} />
                  <span>{nextSession.venue}</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: copiedVenue ? 'var(--moss)' : 'var(--ink-soft)',
                    backgroundColor: copiedVenue ? 'var(--wash-moss)' : 'var(--card)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    border: '1px solid var(--border)'
                  }}>
                    {copiedVenue ? 'COPIED!' : 'COPY'}
                  </span>
                  {copiedVenue ? <Check size={11} color="var(--moss)" /> : <Copy size={11} color="var(--ink-soft)" />}
                </button>

                <SelfAttendanceMarkPill
                  sessionId={nextSession.sessionId}
                  courseCode={nextSession.courseCode}
                  courseName={nextSession.courseName}
                  classDate={nextSession.classDate}
                  venue={nextSession.venue}
                  isCompact={true}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenGCal();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--wash-mizu)',
                    border: '1px solid rgba(0, 169, 184, 0.25)',
                    color: 'var(--mizu)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Calendar size={12} />
                  <span>GCal</span>
                </button>
              </div>
            </div>

            {/* Attendance Safety Footer - Plain English Zero Mental Math */}
            <div style={{
              marginTop: '10px',
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: stats.tier === 'danger' ? 'var(--wash-hanko)' : stats.tier === 'warning' ? 'var(--wash-ochre)' : 'var(--wash-moss)',
              border: `1px solid ${stats.tier === 'danger' ? 'rgba(210, 84, 63, 0.35)' : stats.tier === 'warning' ? 'rgba(194, 145, 58, 0.35)' : 'rgba(110, 140, 99, 0.35)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                <ShieldCheck size={14} color={stats.tier === 'danger' ? 'var(--hanko)' : stats.tier === 'warning' ? 'var(--ochre)' : 'var(--moss)'} style={{ flexShrink: 0 }} />
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: stats.tier === 'danger' ? 'var(--hanko)' : stats.tier === 'warning' ? 'var(--ochre-text)' : 'var(--moss-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {stats.tier === 'danger'
                    ? `⚠️ Attendance Danger: ${(stats.currentPercentage || 0).toFixed(0)}% — Attend next ${stats.classesNeededToRecover || 1} classes to reach 80%`
                    : stats.safeBunksRemaining === 0
                    ? `🟡 Caution: ${(stats.currentPercentage || 0).toFixed(0)}% — 0 safe bunks remaining (attend to stay safe)`
                    : `✅ Attendance Safe: ${(stats.currentPercentage || 100).toFixed(0)}% (${stats.safeBunksRemaining || 4} safe bunks remaining before 80%)`}
                </span>
              </div>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: stats.tier === 'danger' ? 'var(--hanko)' : stats.tier === 'warning' ? 'var(--ochre)' : 'var(--moss)',
                flexShrink: 0
              }}>
                80% Rule
              </span>
            </div>
          </div>

          {/* Upcoming Schedule Horizon Stream - Element Scroll Only */}
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em' }}>
                UPCOMING LECTURE PIPELINE
              </span>
              <span style={{ fontSize: '10px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                {schedule.length} slots loaded
              </span>
            </div>

            {/* Inner Scrollable Pipeline - ELEMENT SCROLL ONLY */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
              paddingRight: '4px'
            }}>
              {schedule.slice(1, 10).map((s, idx) => {
                const sColors = COURSE_COLORS[s.courseCode] || { accent: '#4E6E9C' };
                return (
                  <div
                    key={s.sessionId || idx}
                    onClick={() => onSelectSession?.(s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      backgroundColor: 'var(--paper)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = sColors.accent}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: sColors.accent,
                        flexShrink: 0
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.courseName}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>
                          {s.classDate} • {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <SelfAttendanceMarkPill
                        sessionId={s.sessionId}
                        courseCode={s.courseCode}
                        courseName={s.courseName}
                        classDate={s.classDate}
                        venue={s.venue}
                        isCompact={true}
                      />

                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--ink-soft)',
                        backgroundColor: 'var(--card)',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)'
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={9} color="var(--hanko)" />
                          <span>{s.venue}</span>
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Spatial Continuum & Horizon Heatmap Visualizer Deck */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          height: '100%'
        }}>
          {/* View Switcher Deck - Takes 100% Height */}
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden'
          }}>
            {/* View Switcher Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-soft)',
              paddingBottom: '8px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => { playTactileClick(); setSpatialMode('3d'); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor: spatialMode === '3d' ? 'var(--wash-mizu)' : 'transparent',
                    border: spatialMode === '3d' ? '1px solid rgba(0, 169, 184, 0.3)' : '1px solid transparent',
                    color: spatialMode === '3d' ? 'var(--mizu)' : 'var(--ink-soft)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <Globe size={12} />
                  <span>3D Chronos Continuum</span>
                </button>

                <button
                  onClick={() => { playTactileClick(); setSpatialMode('heatmap'); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor: spatialMode === 'heatmap' ? 'var(--wash-mizu)' : 'transparent',
                    border: spatialMode === 'heatmap' ? '1px solid rgba(0, 169, 184, 0.3)' : '1px solid transparent',
                    color: spatialMode === 'heatmap' ? 'var(--mizu)' : 'var(--ink-soft)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <CalendarDays size={12} />
                  <span>Horizon Heatmap</span>
                </button>
              </div>

              <span style={{ fontSize: '10px', color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
                {spatialMode === '3d' ? 'Three.js Spatial Engine' : '28-Day Density Matrix'}
              </span>
            </div>

            {/* View Canvas Body - Flex Fill 100% */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {spatialMode === '3d' ? (
                <ChronosOrb3D
                  schedule={schedule}
                  courses={courses}
                  onSelectSession={onSelectSession}
                />
              ) : (
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
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
      </div>
    </div>
  );
}

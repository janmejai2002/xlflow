import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Copy, Check, Calendar, ArrowRight, User, AlertCircle, Sparkles, Palmtree, Globe, CalendarDays } from 'lucide-react';
import { getGoogleCalendarUrl } from '../services/calendarExport';
import { calculateBunkStats } from '../services/bunkCalculator';
import { COURSE_COLORS } from '../data/rosterData';
import HorizonHeatmap from './HorizonHeatmap';
import ChronosOrb3D from './ChronosOrb3D';
import ClassDetailDrawer from './ClassDetailDrawer';
import { playTactileClick } from '../services/soundEngine';
import { toast } from 'sonner';

export default function RadarView({ schedule = [], courses = [], deadlines = [], onSelectTab, onSelectDate }) {
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDrawerSession, setSelectedDrawerSession] = useState(null);
  const [spatialMode, setSpatialMode] = useState('heatmap'); // 'heatmap' | '3d'

  // Tick clock every minute for live countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyVenue = (venue, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(venue);
    setCopiedRoom(true);
    toast.success(`Venue Copied: ${venue}`, {
      description: 'Ready to share with batchmates or paste in maps'
    });
    setTimeout(() => setCopiedRoom(false), 2000);
  };

  // Sort schedule chronologically
  const sortedSessions = [...schedule].sort((a, b) => {
    const dtA = new Date(`${a.classDate}T${a.startTime}`);
    const dtB = new Date(`${b.classDate}T${b.startTime}`);
    return dtA - dtB;
  });

  const nowMs = currentTime.getTime();

  let activeClass = null;
  let nextClass = null;
  let upcomingList = [];

  for (const s of sortedSessions) {
    const startMs = new Date(`${s.classDate}T${s.startTime}`).getTime();
    const endMs = new Date(`${s.classDate}T${s.endTime}`).getTime();

    if (nowMs >= startMs && nowMs <= endMs) {
      activeClass = s;
    } else if (startMs > nowMs && !nextClass) {
      nextClass = s;
      upcomingList.push(s);
    } else if (startMs > nowMs) {
      upcomingList.push(s);
    }
  }

  const featuredClass = activeClass || nextClass || sortedSessions[0];

  let countdownText = 'Starting soon';
  let isOngoing = false;

  if (featuredClass) {
    const startMs = new Date(`${featuredClass.classDate}T${featuredClass.startTime}`).getTime();
    const endMs = new Date(`${featuredClass.classDate}T${featuredClass.endTime}`).getTime();

    if (nowMs >= startMs && nowMs <= endMs) {
      isOngoing = true;
      const minsLeft = Math.max(1, Math.round((endMs - nowMs) / 60000));
      countdownText = `Ongoing • Ends in ${minsLeft}m`;
    } else if (startMs > nowMs) {
      const diffMs = startMs - nowMs;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffDays = Math.floor(diffHrs / 24);

      if (diffDays > 0) {
        countdownText = `In ${diffDays}d ${diffHrs % 24}h`;
      } else if (diffHrs > 0) {
        countdownText = `In ${diffHrs}h ${diffMins}m`;
      } else {
        countdownText = `In ${diffMins}m`;
      }
    } else {
      countdownText = `Upcoming Lecture`;
    }
  }

  const featuredCourseData = courses.find(c => c.code === featuredClass?.courseCode);
  const featuredBunkStats = featuredCourseData
    ? calculateBunkStats(featuredCourseData.attended, featuredCourseData.conducted, featuredCourseData.totalPlanned)
    : null;

  const featuredColor = featuredClass
    ? (COURSE_COLORS[featuredClass.courseCode] || COURSE_COLORS.DEFAULT)
    : COURSE_COLORS.DEFAULT;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>
      
      {/* Date & Campus Headline */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        padding: '4px 2px'
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-brand)',
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--ink)'
          }}>
            Today's Radar
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '2px' }}>
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '4px 9px',
          borderRadius: '9999px',
          backgroundColor: isOngoing ? 'var(--wash-mizu)' : 'var(--wash-moss)',
          color: isOngoing ? 'var(--mizu)' : 'var(--moss)',
          border: `1px solid ${isOngoing ? 'rgba(0, 169, 184, 0.3)' : 'rgba(110, 140, 99, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isOngoing ? 'var(--mizu)' : 'var(--moss)',
            animation: 'pulse 2s infinite'
          }} />
          {isOngoing ? 'Class In Session' : 'Campus Live'}
        </span>
      </div>

      {/* Hero Card: Next / Active Class with Left Course Ribbon */}
      {featuredClass ? (
        <div
          onClick={() => setSelectedDrawerSession(featuredClass)}
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderLeft: `4.5px solid ${featuredColor.border}`,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {/* Card Header: Countdown & Course Tag */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: featuredColor.wash,
              color: featuredColor.border
            }}>
              {featuredClass.courseCode} • Section {featuredClass.section}
            </span>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: isOngoing ? 'var(--mizu)' : 'var(--ochre)'
            }}>
              <Clock size={14} />
              <span>{countdownText}</span>
            </div>
          </div>

          {/* Course Name */}
          <h3 style={{
            fontFamily: 'var(--font-brand)',
            fontSize: '19px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            color: 'var(--ink)',
            marginBottom: '8px'
          }}>
            {featuredClass.courseName}
          </h3>

          {/* Faculty & Time */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ink-soft)' }}>
              <User size={14} />
              <span>{featuredClass.faculty}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ink)' }}>
              <Clock size={14} />
              <span style={{ fontWeight: 600 }}>
                {featuredClass.startTime.slice(0, 5)} - {featuredClass.endTime.slice(0, 5)}
              </span>
              <span style={{ color: 'var(--ink-soft)', fontSize: '12px' }}>
                ({featuredClass.classDate})
              </span>
            </div>
          </div>

          {/* Venue Copy Pill & Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border)'
          }}>
            <button
              onClick={() => handleCopyVenue(featuredClass.venue)}
              title="Click to copy room code"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <MapPin size={14} style={{ color: 'var(--mizu)' }} />
              <span>{featuredClass.venue}</span>
              {copiedRoom ? <Check size={13} style={{ color: 'var(--moss)' }} /> : <Copy size={13} style={{ color: 'var(--ink-soft)' }} />}
              <span style={{ fontSize: '11px', color: copiedRoom ? 'var(--moss)' : 'var(--ink-soft)' }}>
                {copiedRoom ? 'Copied!' : 'Copy'}
              </span>
            </button>

            <a
              href={getGoogleCalendarUrl(featuredClass)}
              target="_blank"
              rel="noopener noreferrer"
              title="Add to Google Calendar"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--wash-mizu)',
                border: '1px solid rgba(0, 169, 184, 0.25)',
                color: 'var(--mizu)',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <Calendar size={14} />
              <span>Add to GCal</span>
            </a>
          </div>

          {/* Attendance Safety Hint */}
          {featuredBunkStats && (
            <div
              onClick={() => onSelectTab('bunkmeter')}
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: featuredBunkStats.tier === 'danger' ? 'var(--wash-hanko)' : 'var(--wash-moss)',
                border: `1px solid ${featuredBunkStats.tier === 'danger' ? 'rgba(210, 84, 63, 0.25)' : 'rgba(110, 140, 99, 0.25)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: featuredBunkStats.tier === 'danger' ? 'var(--hanko)' : 'var(--moss)'
              }}>
                {featuredBunkStats.tier === 'danger'
                  ? `Attendance Alert: ${featuredBunkStats.currentPercentage}% (Needs ${featuredBunkStats.recoveryRequired} classes)`
                  : `Safe Attendance: ${featuredBunkStats.currentPercentage}% (+${featuredBunkStats.safeBunksRemaining} bunks safe)`}
              </span>
              <ArrowRight size={13} style={{ color: featuredBunkStats.tier === 'danger' ? 'var(--hanko)' : 'var(--moss)' }} />
            </div>
          )}
        </div>
      ) : (
        <div style={{
          padding: '36px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)'
        }}>
          <Sparkles size={28} style={{ color: 'var(--moss)', margin: '0 auto 12px auto' }} />
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--ink)', marginBottom: '4px' }}>
            All Clear for Today
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
            No more lectures scheduled today. Rest well or catch up on cases!
          </p>
        </div>
      )}

      {/* Visual Spatial / Heatmap Deck */}
      <div style={{
        backgroundColor: 'var(--card)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-soft)',
          paddingBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => { playTactileClick(); setSpatialMode('heatmap'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '7px',
                backgroundColor: spatialMode === 'heatmap' ? 'var(--wash-mizu)' : 'transparent',
                border: spatialMode === 'heatmap' ? '1px solid rgba(0, 169, 184, 0.3)' : '1px solid transparent',
                color: spatialMode === 'heatmap' ? 'var(--mizu)' : 'var(--ink-soft)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <CalendarDays size={12} />
              <span>Schedule Heatmap</span>
            </button>

            <button
              onClick={() => { playTactileClick(); setSpatialMode('3d'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '7px',
                backgroundColor: spatialMode === '3d' ? 'var(--wash-mizu)' : 'transparent',
                border: spatialMode === '3d' ? '1px solid rgba(0, 169, 184, 0.3)' : '1px solid transparent',
                color: spatialMode === '3d' ? 'var(--mizu)' : 'var(--ink-soft)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Globe size={12} />
              <span>3D Timeline</span>
            </button>
          </div>

          <span style={{ fontSize: '10px', color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
            {spatialMode === '3d' ? '3D View' : 'Schedule Heatmap'}
          </span>
        </div>

        <div>
          {spatialMode === 'heatmap' ? (
            <HorizonHeatmap
              schedule={schedule}
              deadlines={deadlines}
              onSelectDate={onSelectDate}
            />
          ) : (
            <div style={{ height: '360px', width: '100%', overflow: 'hidden' }}>
              <ChronosOrb3D
                schedule={schedule}
                courses={courses}
                onSelectSession={(s) => setSelectedDrawerSession(s)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Long-Weekend / Getaways Quick Teaser */}
      <div
        onClick={() => onSelectTab('trips')}
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--wash-moss)',
            color: 'var(--moss)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Palmtree size={17} />
          </div>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
              Weekend Getaway Radar
            </span>
            <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: 0 }}>
              Find 3-day travel windows with zero exams & $\le 1$ miss
            </p>
          </div>
        </div>
        <ArrowRight size={15} style={{ color: 'var(--mizu)' }} />
      </div>

      {/* Up Next Timeline with Left Course Ribbon */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 style={{
            fontFamily: 'var(--font-brand)',
            fontSize: '17px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--ink)'
          }}>
            Upcoming Sessions
          </h3>
          <button
            onClick={() => onSelectTab('timetable')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--mizu)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            Full Timetable <ArrowRight size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {upcomingList.slice(0, 4).map((session, idx) => {
            const ccolor = COURSE_COLORS[session.courseCode] || COURSE_COLORS.DEFAULT;

            return (
              <div
                key={session.sessionId || idx}
                onClick={() => setSelectedDrawerSession(session)}
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderLeft: `3.5px solid ${ccolor.border}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: ccolor.wash,
                    color: ccolor.border,
                    fontSize: '11px',
                    fontWeight: 700,
                    textAlign: 'center',
                    minWidth: '50px'
                  }}>
                    {session.courseCode}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                      {session.courseName}
                    </h4>
                    <p style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                      {session.classDate} • {session.startTime.slice(0, 5)} - {session.endTime.slice(0, 5)}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    backgroundColor: 'var(--paper)',
                    border: '1px solid var(--border)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <MapPin size={11} style={{ color: 'var(--mizu)' }} />
                    <span>{session.venue}</span>
                  </span>
                </div>
              </div>
            );
          })}

          {upcomingList.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', textAlign: 'center', padding: '16px' }}>
              No upcoming lectures found for this term.
            </p>
          )}
        </div>
      </div>

      {/* iOS-Style Class Detail Bottom Drawer */}
      <ClassDetailDrawer
        isOpen={!!selectedDrawerSession}
        onClose={() => setSelectedDrawerSession(null)}
        session={selectedDrawerSession}
      />
    </div>
  );
}

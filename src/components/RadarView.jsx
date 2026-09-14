import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { getGoogleCalendarUrl } from '../services/calendarExport';
import { calculateBunkStats } from '../services/bunkCalculator';
import { COURSE_COLORS } from '../data/courseColors';
import HorizonHeatmap from './HorizonHeatmap';
const ClassDetailDrawer = React.lazy(() => import('./ClassDetailDrawer'));
import { playTactileClick } from '../services/soundEngine';
import { toast } from 'sonner';
import {
  IconRadar,
  IconChronometer,
  IconMapPin,
  IconCopy,
  IconCheckmark,
  IconStatutoryShield,
  IconArrowRight,
  IconHankoSafe,
  IconHankoWarning,
  IconTrips
} from './icons';

/**
 * RadarView: 2026 Academic Live Radar & Situational Dashboard
 *
 * Provides instant 1.2-second situational clarity for active & upcoming lectures,
 * schedule heatmaps, and travel opportunities using wAIbi-sabi academic design tokens.
 */
export default function RadarView({ schedule = [], courses = [], deadlines = [], onSelectTab, onSelectDate }) {
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDrawerSession, setSelectedDrawerSession] = useState(null);

  // Tick clock every 30s for real-time lecture countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyVenue = (venue, e) => {
    if (e) e.stopPropagation();
    playTactileClick(600);
    navigator.clipboard.writeText(venue);
    setCopiedRoom(true);
    toast.success(`Venue Copied: ${venue}`, {
      description: 'Room designation copied to clipboard'
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
      countdownText = `ONGOING · ENDS IN ${minsLeft}M`;
    } else if (startMs > nowMs) {
      const diffMs = startMs - nowMs;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffDays = Math.floor(diffHrs / 24);

      if (diffDays > 0) {
        countdownText = `IN ${diffDays}D ${diffHrs % 24}H`;
      } else if (diffHrs > 0) {
        countdownText = `IN ${diffHrs}H ${diffMins}M`;
      } else {
        countdownText = `IN ${diffMins}M`;
      }
    } else {
      countdownText = `UPCOMING LECTURE`;
    }
  }

  const featuredCourseData = courses.find((c) => c.code === featuredClass?.courseCode);
  const featuredBunkStats = featuredCourseData
    ? calculateBunkStats(featuredCourseData.attended, featuredCourseData.conducted, featuredCourseData.totalPlanned)
    : null;

  const featuredColor = featuredClass
    ? COURSE_COLORS[featuredClass.courseCode] || COURSE_COLORS.DEFAULT
    : COURSE_COLORS.DEFAULT;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '28px' }}>
      {/* Date & Campus Headline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          padding: '2px 0',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div>
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
            Today's Radar
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '3px', margin: 0 }}>
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Live Operational Status Hanko Stamp */}
        <span
          className="hanko-stamp"
          style={{
            color: isOngoing ? 'var(--mizu)' : 'var(--moss)',
            borderColor: isOngoing ? 'rgba(var(--mizu-rgb), 0.45)' : 'rgba(var(--moss-rgb), 0.45)',
            backgroundColor: isOngoing ? 'var(--wash-mizu)' : 'var(--wash-moss)'
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: isOngoing ? 'var(--mizu)' : 'var(--moss)',
              animation: 'radar-pulse 2s infinite'
            }}
          />
          <span>{isOngoing ? 'CLASS IN SESSION' : 'CAMPUS LIVE'}</span>
        </span>
      </div>

      {/* Featured Hero Card: Next / Active Class as Architectural Slate */}
      {featuredClass ? (
        <div
          className="editorial-slate"
          onClick={() => {
            playTactileClick();
            setSelectedDrawerSession(featuredClass);
          }}
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderLeft: `4px solid ${featuredColor.accent || featuredColor.border}`,
            borderRadius: '6px',
            padding: '16px 18px',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
        >
          {/* Card Header: Course Chip & Tabular Countdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '10px'
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: featuredColor.wash,
                color: featuredColor.border,
                border: `1px solid ${featuredColor.border}`
              }}
            >
              {featuredClass.courseCode} · Section {featuredClass.section}
            </span>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontFamily: 'var(--font-mono)',
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '11.5px',
                fontWeight: 700,
                color: isOngoing ? 'var(--mizu-text)' : 'var(--ochre-text)',
                backgroundColor: isOngoing ? 'var(--wash-mizu)' : 'var(--wash-ochre)',
                border: `1px solid ${isOngoing ? 'rgba(var(--mizu-rgb), 0.3)' : 'rgba(var(--ochre-rgb), 0.3)'}`,
                padding: '2px 8px',
                borderRadius: '4px'
              }}
            >
              <IconChronometer size={13} color={isOngoing ? 'var(--mizu)' : 'var(--ochre)'} />
              <span>{countdownText}</span>
            </div>
          </div>

          {/* Course Name in Newsreader Serif */}
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              color: 'var(--ink)',
              margin: '0 0 8px 0'
            }}
          >
            {featuredClass.courseName}
          </h3>

          {/* Faculty & Time Meta */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              fontSize: '12px',
              color: 'var(--ink-soft)',
              marginBottom: '12px'
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                  marginRight: '5px'
                }}
              >
                Instructor:
              </span>
              <span>{featuredClass.faculty}</span>
            </div>

            <span style={{ color: 'var(--border)' }}>·</span>

            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                  marginRight: '5px'
                }}
              >
                Schedule:
              </span>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                {(featuredClass.startTime || '').slice(0, 5)} – {(featuredClass.endTime || '').slice(0, 5)}
              </span>
              <span style={{ color: 'var(--ink-faint)', marginLeft: '4px' }}>({featuredClass.classDate})</span>
            </div>
          </div>

          {/* Venue Copy Pill & GCal Action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              paddingTop: '11px',
              borderTop: '1px solid var(--border-soft)'
            }}
          >
            <button
              className="btn-tactile"
              onClick={(e) => handleCopyVenue(featuredClass.venue, e)}
              title="Click to copy room code"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '4px',
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <IconMapPin size={13} color="var(--mizu)" />
              <span>{featuredClass.venue}</span>
              {copiedRoom ? <IconCheckmark size={12} color="var(--moss)" /> : <IconCopy size={11} color="var(--ink-faint)" />}
              <span style={{ fontSize: '10px', color: copiedRoom ? 'var(--moss-text)' : 'var(--ink-faint)', fontWeight: 700 }}>
                {copiedRoom ? 'COPIED' : 'COPY'}
              </span>
            </button>

            <a
              href={getGoogleCalendarUrl(featuredClass)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                playTactileClick(500);
              }}
              title="Add to Google Calendar"
              className="btn-tactile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '4px',
                backgroundColor: 'var(--wash-mizu)',
                border: '1px solid rgba(var(--mizu-rgb), 0.3)',
                color: 'var(--mizu)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textDecoration: 'none'
              }}
            >
              <Calendar size={12} />
              <span>SYNC GCAL</span>
            </a>
          </div>

          {/* Attendance Safety Margin Context */}
          {featuredBunkStats && (
            <div
              className="btn-tactile"
              onClick={(e) => {
                e.stopPropagation();
                playTactileClick(500);
                onSelectTab('bunkmeter');
              }}
              style={{
                marginTop: '10px',
                padding: '7px 12px',
                borderRadius: '4px',
                backgroundColor: featuredBunkStats.tier === 'danger' ? 'var(--wash-hanko)' : 'var(--wash-moss)',
                border: `1px solid ${
                  featuredBunkStats.tier === 'danger' ? 'rgba(var(--hanko-rgb), 0.3)' : 'rgba(var(--moss-rgb), 0.3)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <span
                style={{
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  fontFeatureSettings: '"tnum"',
                  fontWeight: 700,
                  color: featuredBunkStats.tier === 'danger' ? 'var(--hanko-text)' : 'var(--moss-text)'
                }}
              >
                {featuredBunkStats.tier === 'danger'
                  ? `ATTENDANCE DEFICIT: ${featuredBunkStats.currentPercentage}% (NEEDS ${featuredBunkStats.recoveryRequired} CLASSES)`
                  : `STATUTORY MARGIN: ${featuredBunkStats.currentPercentage}% (+${featuredBunkStats.safeBunksRemaining} SAFE BUNKS)`}
              </span>
              <IconArrowRight
                size={13}
                color={featuredBunkStats.tier === 'danger' ? 'var(--hanko)' : 'var(--moss)'}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--card)',
            borderRadius: '6px',
            border: '1px dashed var(--border)'
          }}
        >
          <IconRadar size={28} color="var(--moss)" style={{ margin: '0 auto 10px auto' }} />
          <h4
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--ink)',
              margin: '0 0 4px 0'
            }}
          >
            All Scheduled Lectures Concluded
          </h4>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '14px',
              color: 'var(--ink-soft)',
              margin: 0
            }}
          >
            No further sessions slated for today. Enjoy your academic breather.
          </p>
        </div>
      )}

      {/* Visual Spatial / Heatmap Deck */}
      <div
        className="editorial-slate"
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid var(--border-soft)',
            paddingBottom: '8px'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)'
            }}
          >
            SPATIAL RADAR
          </span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--ink)'
            }}
          >
            Term-5 Workload Distribution Heatmap
          </span>
        </div>

        <div>
          <HorizonHeatmap schedule={schedule} deadlines={deadlines} onSelectDate={onSelectDate} />
        </div>
      </div>

      {/* Long-Weekend / Getaways Quick Teaser */}
      <div
        className="editorial-slate btn-tactile"
        onClick={() => {
          playTactileClick(500);
          onSelectTab('trips');
        }}
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '11px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              backgroundColor: 'var(--wash-moss)',
              color: 'var(--moss)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconTrips size={18} />
          </div>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-brand)' }}>
              Weekend Getaway Radar
            </span>
            <p style={{ fontSize: '11.5px', color: 'var(--ink-soft)', margin: 0, fontFamily: 'var(--font-mono)' }}>
              Find 3-day travel windows with zero exams & ≤ 1 missed session
            </p>
          </div>
        </div>
        <IconArrowRight size={15} color="var(--mizu)" />
      </div>

      {/* Up Next Timeline: Departure Docket Entries */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '17px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              margin: 0
            }}
          >
            Upcoming Sessions
          </h3>
          <button
            className="btn-tactile"
            onClick={() => {
              playTactileClick(450);
              onSelectTab('timetable');
            }}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              fontWeight: 700,
              color: 'var(--mizu)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>FULL TIMETABLE</span>
            <IconArrowRight size={11} />
          </button>
        </div>

        <div
          className="editorial-slate"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {upcomingList.slice(0, 4).map((session, idx) => {
            const ccolor = COURSE_COLORS[session.courseCode] || COURSE_COLORS.DEFAULT;

            return (
              <div
                key={session.sessionId || idx}
                className="btn-tactile"
                onClick={() => {
                  playTactileClick();
                  setSelectedDrawerSession(session);
                }}
                style={{
                  borderTop: idx === 0 ? 'none' : '1px solid var(--border-soft)',
                  borderLeft: `3.5px solid ${ccolor.border}`,
                  padding: '11px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: 'var(--card)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: ccolor.wash,
                      color: ccolor.border,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 800,
                      textAlign: 'center',
                      flexShrink: 0
                    }}
                  >
                    {session.courseCode}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--ink)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {session.courseName}
                    </h4>
                    <p
                      style={{
                        fontSize: '11px',
                        color: 'var(--ink-faint)',
                        fontFamily: 'var(--font-mono)',
                        fontFeatureSettings: '"tnum"',
                        margin: '2px 0 0 0'
                      }}
                    >
                      {session.classDate} · {(session.startTime || '').slice(0, 5)} –{' '}
                      {(session.endTime || '').slice(0, 5)}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--ink)',
                      backgroundColor: 'var(--paper)',
                      border: '1px solid var(--border)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <IconMapPin size={11} color="var(--mizu)" />
                    <span>{session.venue}</span>
                  </span>
                </div>
              </div>
            );
          })}

          {upcomingList.length === 0 && (
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '13.5px',
                color: 'var(--ink-faint)',
                textAlign: 'center',
                padding: '24px 16px',
                margin: 0
              }}
            >
              No upcoming lectures found for this term.
            </p>
          )}
        </div>
      </div>

      {/* Class Detail Academic Dossier Drawer */}
      {selectedDrawerSession && (
        <React.Suspense fallback={null}>
          <ClassDetailDrawer
            isOpen={!!selectedDrawerSession}
            onClose={() => setSelectedDrawerSession(null)}
            session={selectedDrawerSession}
          />
        </React.Suspense>
      )}
    </div>
  );
}

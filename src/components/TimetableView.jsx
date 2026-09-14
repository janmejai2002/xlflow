import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  Filter,
  List,
  LayoutGrid
} from 'lucide-react';
import { downloadIcsFile } from '../services/calendarExport';
import { COURSE_COLORS } from '../data/courseColors';
import TimetableDocketCard from './TimetableDocketCard';
const ClassDetailDrawer = React.lazy(() => import('./ClassDetailDrawer'));
import { playTactileClick } from '../services/soundEngine';
import { toast } from 'sonner';
import {
  IconTimetable,
  IconChronometer
} from './icons';

/**
 * TimetableView: 2026 Swiss/Japanese Departure Board & Academic Docket
 *
 * Replaces generic AI-slop metric decks and bubbly cards with:
 * - Quiet, single-line horizontal ledger strip with hairline dividers (border-r: 1px solid var(--border-soft))
 * - Departure board day ribbon with tabular monospace figures
 * - Interconnected chronological timeline spine
 * - 1-click .ICS export with tactile feedback
 * - Deep drawer integration for session syllabus and attendance inspection
 */
export default function TimetableView({ schedule = [], courses = [], selectedDateProp = null }) {
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'compact'
  const [selectedDrawerSession, setSelectedDrawerSession] = useState(null);

  useEffect(() => {
    if (selectedDateProp) {
      setSelectedDate(selectedDateProp);
    }
  }, [selectedDateProp]);

  // Fast map of courses by code for instant attendance lookup
  const courseMap = React.useMemo(() => {
    const map = {};
    courses.forEach((c) => {
      map[c.code] = c;
    });
    return map;
  }, [courses]);

  // Extract unique sorted dates and course codes
  const uniqueDates = React.useMemo(() => Array.from(new Set(schedule.map((s) => s.classDate))).sort(), [schedule]);
  const uniqueCourses = React.useMemo(() => Array.from(new Set(schedule.map((s) => s.courseCode))).sort(), [schedule]);

  // Filter & sort schedule chronologically
  const filteredSchedule = React.useMemo(() => {
    return schedule
      .filter((s) => {
        const matchesDate = selectedDate === 'all' || s.classDate === selectedDate;
        const matchesCourse = selectedCourseFilter === 'all' || s.courseCode === selectedCourseFilter;
        return matchesDate && matchesCourse;
      })
      .sort((a, b) => {
        const timeA = `${a.classDate}T${a.startTime || '00:00'}`;
        const timeB = `${b.classDate}T${b.startTime || '00:00'}`;
        return timeA.localeCompare(timeB);
      });
  }, [schedule, selectedDate, selectedCourseFilter]);

  // Identify next upcoming session
  const nextSession = filteredSchedule[0] || null;

  // Group filtered schedule by date
  const groupedSchedule = React.useMemo(() => {
    const groups = {};
    filteredSchedule.forEach((session) => {
      if (!groups[session.classDate]) {
        groups[session.classDate] = [];
      }
      groups[session.classDate].push(session);
    });
    return groups;
  }, [filteredSchedule]);

  const handleExportAllIcs = () => {
    playTactileClick(700);
    downloadIcsFile(schedule, 'xlri_term5_timetable.ics');
    toast.success('Calendar Exported (.ics)', {
      description: 'Import to Apple, Google, or Outlook Calendar with advance alarms'
    });
  };

  const handleDateSelect = (dateKey) => {
    playTactileClick(500);
    setSelectedDate(dateKey);
  };

  const handleViewModeSelect = (mode) => {
    playTactileClick(450);
    setViewMode(mode);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '36px' }}>
      {/* 1. View Header with Mode Toggle & .ICS Download */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--mizu)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              LECTURE TIMETABLE DOCKET
            </span>
            <span style={{ fontSize: '11px', color: 'var(--border)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-faint)' }}>
              IST (UTC+05:30)
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
            Timetable & Schedule
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '3px', margin: 0 }}>
            {schedule.length} lecture slots scheduled for Term-5 · Sec EF.
          </p>
        </div>

        {/* Action Controls: View Switcher & ICS Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View Mode Switcher */}
          <div
            className="editorial-slate"
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '2px'
            }}
          >
            <button
              className="btn-tactile"
              onClick={() => handleViewModeSelect('timeline')}
              title="Chronological Timeline View"
              aria-label="Timeline View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: viewMode === 'timeline' ? 'var(--paper)' : 'transparent',
                color: viewMode === 'timeline' ? 'var(--ink)' : 'var(--ink-soft)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: viewMode === 'timeline' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <List size={12} color={viewMode === 'timeline' ? 'var(--mizu)' : 'currentColor'} />
              <span>Timeline</span>
            </button>

            <button
              className="btn-tactile"
              onClick={() => handleViewModeSelect('compact')}
              title="Compact Agenda List View"
              aria-label="Compact Agenda View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: viewMode === 'compact' ? 'var(--paper)' : 'transparent',
                color: viewMode === 'compact' ? 'var(--ink)' : 'var(--ink-soft)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: viewMode === 'compact' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={12} color={viewMode === 'compact' ? 'var(--mizu)' : 'currentColor'} />
              <span>Compact</span>
            </button>
          </div>

          {/* 1-Click .ICS Download */}
          <button
            className="btn-tactile"
            onClick={handleExportAllIcs}
            title="Download calendar file for Apple Calendar, Outlook, or Google Calendar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              border: '1px solid var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Download size={12} />
            <span>EXPORT .ICS</span>
          </button>
        </div>
      </div>

      {/* 2. Quiet Single-Line Horizontal Ledger Strip with Hairline Dividers */}
      <div
        className="editorial-slate"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '9px 16px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            gap: '0'
          }}
        >
          {/* Metric 1: Total Lecture Slots */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              paddingRight: '16px',
              borderRight: '1px solid var(--border-soft)',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--ink-faint)',
                textTransform: 'uppercase'
              }}
            >
              TOTAL SLOTS
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontFeatureSettings: '"tnum"',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '13.5px',
                fontWeight: 800,
                color: 'var(--ink)'
              }}
            >
              {schedule.length}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontFeatureSettings: '"tnum"',
                fontSize: '11px',
                color: 'var(--ink-muted)'
              }}
            >
              ({schedule.length * 1.5} hrs)
            </span>
          </div>

          {/* Metric 2: Next Upcoming Class */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              padding: '0 16px',
              borderRight: '1px solid var(--border-soft)',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--mizu)',
                textTransform: 'uppercase'
              }}
            >
              NEXT DOCKET
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontFeatureSettings: '"tnum"',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--mizu-text)'
              }}
            >
              {nextSession
                ? `${nextSession.courseCode} · ${(nextSession.startTime || '').slice(0, 5)} (${nextSession.venue || 'MCR'})`
                : 'Schedule Concluded'}
            </span>
          </div>

          {/* Metric 3: Active Filter Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              paddingLeft: '16px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--ink-faint)',
                textTransform: 'uppercase'
              }}
            >
              ACTIVE VIEW
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontFeatureSettings: '"tnum"',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--ink)'
              }}
            >
              {filteredSchedule.length} session{filteredSchedule.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Departure Board Day Ribbon */}
      <div>
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* All Dates Button */}
          <button
            className="btn-tactile"
            onClick={() => handleDateSelect('all')}
            style={{
              padding: '5px 12px',
              borderRadius: '4px',
              border: selectedDate === 'all' ? '1px solid var(--ink)' : '1px solid var(--border)',
              backgroundColor: selectedDate === 'all' ? 'var(--ink)' : 'var(--card)',
              color: selectedDate === 'all' ? 'var(--paper)' : 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.03em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            ALL DATES ({schedule.length})
          </button>

          {/* Individual Day Buttons */}
          {uniqueDates.map((dStr) => {
            const d = new Date(`${dStr}T00:00:00`);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const count = schedule.filter((s) => s.classDate === dStr).length;
            const isSelected = selectedDate === dStr;

            return (
              <button
                key={dStr}
                className="btn-tactile"
                onClick={() => handleDateSelect(dStr)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  border: isSelected ? '1px solid var(--mizu)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--wash-mizu)' : 'var(--card)',
                  color: isSelected ? 'var(--mizu)' : 'var(--ink)',
                  fontSize: '11.5px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.04em'
                  }}
                >
                  {dayName.toUpperCase()}
                </span>
                <span>{monthDay}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontFeatureSettings: '"tnum"',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: isSelected ? 'var(--mizu)' : 'var(--paper)',
                    color: isSelected ? '#FFFFFF' : 'var(--ink-soft)',
                    border: isSelected ? 'none' : '1px solid var(--border-soft)'
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Filter Bar & Course Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2px'
        }}
      >
        <span
          style={{
            fontSize: '12px',
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-mono)',
            fontFeatureSettings: '"tnum"'
          }}
        >
          Showing <strong>{filteredSchedule.length}</strong> session{filteredSchedule.length === 1 ? '' : 's'}
          {selectedDate !== 'all' && ` on ${selectedDate}`}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={12} style={{ color: 'var(--ink-soft)' }} />
          <select
            value={selectedCourseFilter}
            onChange={(e) => {
              playTactileClick(400);
              setSelectedCourseFilter(e.target.value);
            }}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
              cursor: 'pointer'
            }}
          >
            <option value="all">ALL COURSES ({uniqueCourses.length})</option>
            {uniqueCourses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Schedule Content: Timeline Spine vs Compact Agenda */}
      {viewMode === 'timeline' ? (
        /* Timeline Mode: Chronological Day Grouping with Continuous Spine */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(groupedSchedule).map(([dateStr, sessions]) => {
            const d = new Date(`${dateStr}T00:00:00`);
            const fullDate = d.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });
            const totalHours = (sessions.length * 1.5).toFixed(1);
            const isHeavy = sessions.length >= 3;

            return (
              <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Architectural Day Header Banner */}
                <div
                  className="editorial-slate"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    backgroundColor: 'var(--card)',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    borderLeft: '3px solid var(--mizu)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} color="var(--mizu)" />
                    <span
                      style={{
                        fontFamily: 'var(--font-brand)',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: 'var(--ink)'
                      }}
                    >
                      {fullDate}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontFeatureSettings: '"tnum"',
                        fontWeight: 600,
                        color: 'var(--ink-soft)'
                      }}
                    >
                      {sessions.length} Session{sessions.length === 1 ? '' : 's'} · {totalHours}h
                    </span>
                    <span
                      className="hanko-stamp"
                      style={{
                        color: isHeavy ? 'var(--ochre)' : 'var(--moss)',
                        borderColor: isHeavy ? 'rgba(var(--ochre-rgb), 0.45)' : 'rgba(var(--moss-rgb), 0.45)',
                        backgroundColor: isHeavy ? 'var(--wash-ochre)' : 'var(--wash-moss)'
                      }}
                    >
                      {isHeavy ? 'INTENSIVE' : 'STANDARD'}
                    </span>
                  </div>
                </div>

                {/* Day's Lecture Docket Cards with Left Timeline Spine */}
                <div
                  style={{
                    position: 'relative',
                    paddingLeft: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Continuous Vertical Timeline Line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      bottom: '8px',
                      left: '8px',
                      width: '1px',
                      backgroundColor: 'var(--border)'
                    }}
                  />

                  {sessions.map((session, sIdx) => {
                    const course = courseMap[session.courseCode];
                    const isNextUp = session.sessionId === nextSession?.sessionId;
                    const ccolor = COURSE_COLORS[session.courseCode] || { accent: 'var(--mizu)' };

                    return (
                      <div key={session.sessionId || sIdx} style={{ position: 'relative' }}>
                        {/* Timeline Node Dot */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '-18px',
                            top: '18px',
                            width: '9px',
                            height: '9px',
                            borderRadius: '2px',
                            backgroundColor: isNextUp ? 'var(--mizu)' : ccolor.accent,
                            boxShadow: isNextUp ? '0 0 0 2px var(--wash-mizu)' : 'none',
                            border: '1px solid var(--paper)',
                            zIndex: 2
                          }}
                        />

                        <TimetableDocketCard
                          session={session}
                          course={course}
                          isNextUp={isNextUp}
                          onSelectSession={setSelectedDrawerSession}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Agenda Mode: High-Density Docket Stream */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredSchedule.map((session, sIdx) => {
            const course = courseMap[session.courseCode];
            const isNextUp = session.sessionId === nextSession?.sessionId;

            return (
              <TimetableDocketCard
                key={session.sessionId || sIdx}
                session={session}
                course={course}
                isNextUp={isNextUp}
                isCompact={true}
                onSelectSession={setSelectedDrawerSession}
              />
            );
          })}
        </div>
      )}

      {/* 6. Empty State */}
      {filteredSchedule.length === 0 && (
        <div
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--card)',
            borderRadius: '4px',
            border: '1px dashed var(--border)'
          }}
        >
          <Calendar size={28} style={{ color: 'var(--ink-faint)', margin: '0 auto 10px auto' }} />
          <h4
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--ink)',
              margin: '0 0 4px 0'
            }}
          >
            No Lectures Scheduled
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
            No sessions match the active date or course filter.
          </p>
        </div>
      )}

      {/* 7. Class Detail Gesture Drawer */}
      {selectedDrawerSession && (
        <React.Suspense fallback={null}>
          <ClassDetailDrawer
            isOpen={!!selectedDrawerSession}
            onClose={() => setSelectedDrawerSession(null)}
            session={selectedDrawerSession}
            course={selectedDrawerSession ? courseMap[selectedDrawerSession.courseCode] : null}
          />
        </React.Suspense>
      )}
    </div>
  );
}

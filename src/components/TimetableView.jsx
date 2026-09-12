import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  Clock,
  Filter,
  List,
  LayoutGrid,
  Sparkles,
  BookOpen,
  Layers,
  ChevronRight
} from 'lucide-react';
import { downloadIcsFile } from '../services/calendarExport';
import { COURSE_COLORS } from '../data/rosterData';
import TimetableDocketCard from './TimetableDocketCard';
import ClassDetailDrawer from './ClassDetailDrawer';
import { toast } from 'sonner';

/**
 * TimetableView: Architectural Academic Timeline Docket
 * Designed to replace flat, boring lecture cards with an interconnected timeline spine,
 * calendar-aware day grouping, academic safety context, and Plus Jakarta Sans brand typography.
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
    courses.forEach(c => {
      map[c.code] = c;
    });
    return map;
  }, [courses]);

  // Extract unique sorted dates and course codes
  const uniqueDates = Array.from(new Set(schedule.map(s => s.classDate))).sort();
  const uniqueCourses = Array.from(new Set(schedule.map(s => s.courseCode))).sort();

  // Filter & sort schedule chronologically
  const filteredSchedule = schedule.filter(s => {
    const matchesDate = selectedDate === 'all' || s.classDate === selectedDate;
    const matchesCourse = selectedCourseFilter === 'all' || s.courseCode === selectedCourseFilter;
    return matchesDate && matchesCourse;
  }).sort((a, b) => {
    const dtA = new Date(`${a.classDate}T${a.startTime}`);
    const dtB = new Date(`${b.classDate}T${b.startTime}`);
    return dtA - dtB;
  });

  // Identify next upcoming session
  const nextSession = filteredSchedule[0] || null;

  // Group filtered schedule by date
  const groupedSchedule = React.useMemo(() => {
    const groups = {};
    filteredSchedule.forEach(session => {
      if (!groups[session.classDate]) {
        groups[session.classDate] = [];
      }
      groups[session.classDate].push(session);
    });
    return groups;
  }, [filteredSchedule]);

  const handleExportAllIcs = () => {
    downloadIcsFile(schedule, 'xlri_term5_timetable.ics');
    toast.success('Calendar Exported (.ics)', {
      description: 'Import to Google or Apple Calendar with 15-minute advance alarms'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '36px' }}>

      {/* 1. View Header with Mode Toggle & .ICS Download */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mizu)', letterSpacing: '0.06em' }}>
              ACADEMIC FLIGHT SCHEDULE
            </span>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>•</span>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>IST (UTC+05:30)</span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-brand)',
            fontSize: '24px',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: 'var(--ink)',
            margin: 0
          }}>
            Timetable & Schedule
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '2px' }}>
            {schedule.length} lecture slots scheduled for Term-5 • Sec EF.
          </p>
        </div>

        {/* Action Controls: View Switcher & ICS Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View Mode Switcher */}
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '9px',
            padding: '2px'
          }}>
            <button
              onClick={() => setViewMode('timeline')}
              title="Chronological Timeline View with Day Spine"
              aria-label="Timeline View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 9px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: viewMode === 'timeline' ? 'var(--paper)' : 'transparent',
                color: viewMode === 'timeline' ? 'var(--ink)' : 'var(--ink-soft)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: viewMode === 'timeline' ? 'var(--shadow-card)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <List size={12} color={viewMode === 'timeline' ? 'var(--mizu)' : 'currentColor'} />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => setViewMode('compact')}
              title="Compact Agenda List View"
              aria-label="Compact Agenda View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 9px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: viewMode === 'compact' ? 'var(--paper)' : 'transparent',
                color: viewMode === 'compact' ? 'var(--ink)' : 'var(--ink-soft)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: viewMode === 'compact' ? 'var(--shadow-card)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={12} color={viewMode === 'compact' ? 'var(--mizu)' : 'currentColor'} />
              <span>Compact</span>
            </button>
          </div>

          {/* 1-Click .ICS Download */}
          <button
            onClick={handleExportAllIcs}
            title="Download calendar file for Apple Calendar, Outlook, or Google Calendar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '9px',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <Download size={13} />
            <span>Export .ICS</span>
          </button>
        </div>
      </div>

      {/* 2. Overview Metric Deck (Quick Glance) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px'
      }}>
        {/* Metric 1: Total Slots */}
        <div style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '10px', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={10} color="var(--ink-faint)" />
            <span>Total Slots</span>
          </span>
          <div style={{ marginTop: '2px', fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800, color: 'var(--ink)' }}>
            {schedule.length}
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ink-soft)', marginLeft: '3px' }}>
              ({schedule.length * 1.5}h)
            </span>
          </div>
        </div>

        {/* Metric 2: Next Upcoming Class */}
        <div style={{
          backgroundColor: 'var(--wash-mizu)',
          border: '1px solid rgba(var(--mizu-rgb), 0.25)',
          borderRadius: '12px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '10px', color: 'var(--mizu-text)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <Sparkles size={10} color="var(--mizu)" />
            <span>Next Lecture</span>
          </span>
          <div style={{ marginTop: '2px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--mizu-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {nextSession ? `${nextSession.courseCode} • ${nextSession.startTime.slice(0, 5)}` : 'Completed'}
          </div>
        </div>

        {/* Metric 3: Active Filter Status */}
        <div style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '10px', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <BookOpen size={10} color="var(--ink-faint)" />
            <span>Showing</span>
          </span>
          <div style={{ marginTop: '2px', fontFamily: 'var(--font-brand)', fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
            {filteredSchedule.length} Lecture{filteredSchedule.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* 3. Enhanced Calendar-Aware Day Ribbon */}
      <div>
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* All Dates Button */}
          <button
            onClick={() => setSelectedDate('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: selectedDate === 'all' ? '1px solid var(--ink)' : '1px solid var(--border)',
              backgroundColor: selectedDate === 'all' ? 'var(--ink)' : 'var(--card)',
              color: selectedDate === 'all' ? 'var(--paper)' : 'var(--ink)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            All Dates ({schedule.length})
          </button>

          {/* Individual Day Buttons */}
          {uniqueDates.map(dStr => {
            const d = new Date(`${dStr}T00:00:00`);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const count = schedule.filter(s => s.classDate === dStr).length;
            const isSelected = selectedDate === dStr;

            return (
              <button
                key={dStr}
                onClick={() => setSelectedDate(dStr)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: isSelected ? '1px solid var(--mizu)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--wash-mizu)' : 'var(--card)',
                  color: isSelected ? 'var(--mizu)' : 'var(--ink)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em' }}>
                  {dayName.toUpperCase()}
                </span>
                <span>{monthDay}</span>
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'var(--mizu)' : 'var(--paper)',
                  color: isSelected ? '#FFFFFF' : 'var(--ink-soft)'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Filter Bar & Course Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2px'
      }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
          Showing <strong>{filteredSchedule.length}</strong> session{filteredSchedule.length === 1 ? '' : 's'}
          {selectedDate !== 'all' && ` on ${selectedDate}`}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={12} style={{ color: 'var(--ink-soft)' }} />
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'var(--font-brand)',
              padding: '4px 8px',
              borderRadius: '7px',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Courses ({uniqueCourses.length})</option>
            {uniqueCourses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Schedule Content: Timeline Spine vs Compact Agenda */}
      {viewMode === 'timeline' ? (
        /* Timeline Mode: Chronological Day Grouping with Continuous Spine */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              <div key={dateStr} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Architectural Day Header Banner */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  borderLeft: '4px solid var(--mizu)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} color="var(--mizu)" />
                    <span style={{
                      fontFamily: 'var(--font-brand)',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--ink)'
                    }}>
                      {fullDate}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: 'var(--ink-soft)'
                    }}>
                      {sessions.length} Session{sessions.length === 1 ? '' : 's'} • {totalHours}h
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isHeavy ? 'var(--wash-ochre)' : 'var(--wash-moss)',
                      color: isHeavy ? 'var(--ochre-text)' : 'var(--moss-text)'
                    }}>
                      {isHeavy ? 'Intense' : 'Balanced'}
                    </span>
                  </div>
                </div>

                {/* Day's Lecture Docket Cards with Left Timeline Spine */}
                <div style={{
                  position: 'relative',
                  paddingLeft: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {/* Continuous Vertical Timeline Line */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    bottom: '8px',
                    left: '8px',
                    width: '2px',
                    backgroundColor: 'var(--border)'
                  }} />

                  {sessions.map((session, sIdx) => {
                    const course = courseMap[session.courseCode];
                    const isNextUp = session.sessionId === nextSession?.sessionId;
                    const ccolor = COURSE_COLORS[session.courseCode] || { accent: 'var(--mizu)' };

                    return (
                      <div key={session.sessionId || sIdx} style={{ position: 'relative' }}>
                        {/* Timeline Node Dot */}
                        <div style={{
                          position: 'absolute',
                          left: '-20px',
                          top: '20px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: isNextUp ? 'var(--mizu)' : ccolor.accent,
                          boxShadow: isNextUp ? '0 0 8px var(--mizu)' : 'none',
                          border: '2px solid var(--paper)',
                          zIndex: 2
                        }} />

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
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <Calendar size={32} style={{ color: 'var(--ink-soft)', margin: '0 auto 12px auto' }} />
          <h4 style={{
            fontFamily: 'var(--font-brand)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--ink)',
            marginBottom: '4px'
          }}>
            No Lectures Scheduled
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0 }}>
            No classes match the chosen date or course filter. Enjoy your academic breather!
          </p>
        </div>
      )}

      {/* 7. Class Detail Gesture Drawer */}
      <ClassDetailDrawer
        isOpen={!!selectedDrawerSession}
        onClose={() => setSelectedDrawerSession(null)}
        session={selectedDrawerSession}
        course={selectedDrawerSession ? courseMap[selectedDrawerSession.courseCode] : null}
      />
    </div>
  );
}

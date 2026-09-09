import React, { useState, useEffect } from 'react';
import { Calendar, Download, Share2, MapPin, Clock, Copy, Check, ExternalLink, Filter } from 'lucide-react';
import { downloadIcsFile, getGoogleCalendarUrl } from '../services/calendarExport';
import { COURSE_COLORS } from '../data/rosterData';
import ClassDetailDrawer from './ClassDetailDrawer';
import { toast } from 'sonner';

export default function TimetableView({ schedule = [], selectedDateProp = null }) {
  const [copiedSessionId, setCopiedSessionId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [selectedDrawerSession, setSelectedDrawerSession] = useState(null);

  useEffect(() => {
    if (selectedDateProp) {
      setSelectedDate(selectedDateProp);
    }
  }, [selectedDateProp]);

  // Extract unique sorted dates from schedule
  const uniqueDates = Array.from(new Set(schedule.map(s => s.classDate))).sort();
  const uniqueCourses = Array.from(new Set(schedule.map(s => s.courseCode))).sort();

  // Filter schedule
  const filteredSchedule = schedule.filter(s => {
    const matchesDate = selectedDate === 'all' || s.classDate === selectedDate;
    const matchesCourse = selectedCourseFilter === 'all' || s.courseCode === selectedCourseFilter;
    return matchesDate && matchesCourse;
  }).sort((a, b) => {
    const dtA = new Date(`${a.classDate}T${a.startTime}`);
    const dtB = new Date(`${b.classDate}T${b.startTime}`);
    return dtA - dtB;
  });

  const handleCopyVenue = (sessionId, venue, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(venue);
    setCopiedSessionId(sessionId);
    toast.success(`Venue Copied: ${venue}`);
    setTimeout(() => setCopiedSessionId(null), 2000);
  };

  const handleExportAllIcs = () => {
    downloadIcsFile(schedule, 'xlri_term5_timetable.ics');
    toast.success('Calendar Exported (.ics)', {
      description: 'Import to Google or Apple Calendar with 15-minute advance alarms'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
      
      {/* View Header with Calendar Sync Action */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '24px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--ink)'
          }}>
            Timetable & Sync
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '2px' }}>
            {schedule.length} lecture slots scheduled • IST (UTC+05:30)
          </p>
        </div>

        {/* 1-Click .ICS Download */}
        <button
          onClick={handleExportAllIcs}
          title="Download calendar file for Apple Calendar, Outlook, or Google Calendar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '10px',
            backgroundColor: 'var(--ink)',
            color: 'var(--paper)',
            border: 'none',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s'
          }}
        >
          <Download size={14} />
          <span>Export .ICS</span>
        </button>
      </div>

      {/* Date Ribbon Filter */}
      <div>
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch'
        }}>
          <button
            onClick={() => setSelectedDate('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: selectedDate === 'all' ? '1px solid var(--ink)' : '1px solid var(--border)',
              backgroundColor: selectedDate === 'all' ? 'var(--ink)' : 'var(--card)',
              color: selectedDate === 'all' ? 'var(--paper)' : 'var(--ink-soft)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            All Dates ({schedule.length})
          </button>

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
                  padding: '6px 12px',
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
                  gap: '4px'
                }}
              >
                <span>{dayName}, {monthDay}</span>
                <span style={{
                  fontSize: '10px',
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

      {/* Course Filter Dropdown if many courses */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
          Showing {filteredSchedule.length} session{filteredSchedule.length === 1 ? '' : 's'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={13} style={{ color: 'var(--ink-soft)' }} />
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--ink)'
            }}
          >
            <option value="all">All Courses</option>
            {uniqueCourses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule Lecture Cards with Left Course Ribbon */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredSchedule.map((session, idx) => {
          const dateObj = new Date(`${session.classDate}T00:00:00`);
          const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const isCopied = copiedSessionId === session.sessionId;
          const ccolor = COURSE_COLORS[session.courseCode] || COURSE_COLORS.DEFAULT;

          return (
            <div
              key={session.sessionId || idx}
              onClick={() => setSelectedDrawerSession(session)}
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderLeft: `3.5px solid ${ccolor.border}`,
                borderRadius: '14px',
                padding: '16px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {/* Card Top: Timing & Course Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>
                  <Clock size={15} style={{ color: 'var(--mizu)' }} />
                  <span>{session.startTime.slice(0, 5)} - {session.endTime.slice(0, 5)}</span>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ink-soft)' }}>
                    ({formattedDate})
                  </span>
                </div>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '5px',
                  backgroundColor: ccolor.wash,
                  color: ccolor.border
                }}>
                  {session.courseCode} • Sec {session.section}
                </span>
              </div>

              {/* Course Title & Faculty */}
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '17px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: '0 0 4px 0'
                }}>
                  {session.courseName}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: 0 }}>
                  Faculty: {session.faculty}
                </p>
              </div>

              {/* Footer: Venue Pill + Google Calendar Sync */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid var(--border)'
              }}>
                <button
                  onClick={(e) => handleCopyVenue(session.sessionId, session.venue, e)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 10px',
                    borderRadius: '7px',
                    backgroundColor: 'var(--paper)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <MapPin size={13} style={{ color: 'var(--mizu)' }} />
                  <span>📍 {session.venue}</span>
                  {isCopied ? <Check size={12} style={{ color: 'var(--moss)' }} /> : <Copy size={12} style={{ color: 'var(--ink-soft)' }} />}
                  <span style={{ fontSize: '10px', color: isCopied ? 'var(--moss)' : 'var(--ink-soft)' }}>
                    {isCopied ? 'Copied' : ''}
                  </span>
                </button>

                <a
                  href={getGoogleCalendarUrl(session)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: '7px',
                    backgroundColor: 'var(--wash-mizu)',
                    border: '1px solid rgba(0, 169, 184, 0.25)',
                    color: 'var(--mizu)',
                    fontSize: '11px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <Calendar size={13} />
                  <span>Sync GCal</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          );
        })}

        {filteredSchedule.length === 0 && (
          <div style={{
            padding: '36px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--card)',
            borderRadius: '14px',
            border: '1px solid var(--border)'
          }}>
            <Calendar size={28} style={{ color: 'var(--ink-soft)', margin: '0 auto 10px auto' }} />
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', color: 'var(--ink)', marginBottom: '4px' }}>
              No Lectures Found
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
              No classes match the chosen filter. Enjoy your day off!
            </p>
          </div>
        )}
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

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Copy,
  Check,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';
import { COURSE_COLORS } from '../../data/rosterData';
import { downloadIcsFile, getGoogleCalendarUrl } from '../../services/calendarExport';
import { toast } from 'sonner';

// Time range: 08:00 to 20:00 (12 hours)
const START_HOUR = 8;
const END_HOUR = 20;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 68; // pixels per hour

export default function DesktopTimetableGrid({
  schedule = [],
  onSelectSession,
  selectedSessionId
}) {
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'list'
  const [copiedId, setCopiedId] = useState(null);

  // Group schedule dates
  const uniqueDates = useMemo(() => {
    return Array.from(new Set(schedule.map(s => s.classDate))).sort();
  }, [schedule]);

  const uniqueCourses = useMemo(() => {
    return Array.from(new Set(schedule.map(s => s.courseCode))).sort();
  }, [schedule]);

  // Determine current active week based on schedule dates or today
  const todayStr = new Date().toISOString().split('T')[0];
  const initialDate = uniqueDates.includes(todayStr) ? todayStr : (uniqueDates[0] || todayStr);

  const [currentDateIndex, setCurrentDateIndex] = useState(0);

  // Compute 6-day window (Monday through Saturday)
  const daysWindow = useMemo(() => {
    if (uniqueDates.length === 0) return [];
    
    // Find base date
    const baseDateStr = uniqueDates[currentDateIndex] || uniqueDates[0];
    const baseDate = new Date(baseDateStr + 'T00:00:00');
    
    // Find Monday of that week (0 is Sunday, 1 is Monday)
    const dayOfWeek = baseDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(baseDate.getTime() + mondayOffset * 86400000);

    const weekDays = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday.getTime() + i * 86400000);
      const dStr = d.toISOString().split('T')[0];
      weekDays.push({
        dateStr: dStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: dStr === todayStr
      });
    }
    return weekDays;
  }, [uniqueDates, currentDateIndex, todayStr]);

  // Filter days by day tab (ALL or specific day)
  const visibleDaysWindow = useMemo(() => {
    if (selectedDayFilter === 'ALL') return daysWindow;
    return daysWindow.filter(d => d.dayName === selectedDayFilter);
  }, [daysWindow, selectedDayFilter]);

  // Filter schedule by active course and active week dates
  const weekDateStrings = useMemo(() => new Set(daysWindow.map(d => d.dateStr)), [daysWindow]);

  const weekSessions = useMemo(() => {
    return schedule.filter(s => {
      const inWeek = weekDateStrings.has(s.classDate);
      const matchCourse = selectedCourseFilter === 'all' || s.courseCode === selectedCourseFilter;
      return inWeek && matchCourse;
    });
  }, [schedule, weekDateStrings, selectedCourseFilter]);

  // Helper to parse time string "09:00:00" -> hour fraction (e.g. 9.5)
  const parseTimeToFraction = (tStr) => {
    if (!tStr) return 8;
    const [h, m] = tStr.split(':').map(Number);
    return h + (m || 0) / 60;
  };

  const handleCopyVenue = (sessionId, venue, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(venue);
    setCopiedId(sessionId);
    toast.success(`Venue copied: ${venue}`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportAll = () => {
    downloadIcsFile(schedule, 'xlri_term5_timetable.ics');
    toast.success('Term-5 Calendar Exported (.ics)', {
      description: 'Ready to import into Google, Apple, or Outlook Calendar'
    });
  };

  // Live Time Needle calculation
  const now = new Date();
  const currentHourFraction = now.getHours() + now.getMinutes() / 60;
  const showTimeNeedle = currentHourFraction >= START_HOUR && currentHourFraction <= END_HOUR;
  const needleTopPx = (currentHourFraction - START_HOUR) * HOUR_HEIGHT;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      
      {/* 1. Header Controls: Week Nav, Filters, View Mode Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: 'var(--card)',
        padding: '12px 18px',
        borderRadius: '14px',
        border: '1px solid var(--border)'
      }}>
        {/* Week Navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setCurrentDateIndex(prev => Math.max(0, prev - 6))}
              disabled={currentDateIndex <= 0}
              aria-label="Previous 6 days"
              title="Previous 6 days"
              style={{
                background: 'var(--paper)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px 8px',
                color: 'var(--ink)',
                cursor: currentDateIndex <= 0 ? 'not-allowed' : 'pointer',
                opacity: currentDateIndex <= 0 ? 0.4 : 1
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentDateIndex(prev => Math.min(Math.max(0, uniqueDates.length - 1), prev + 6))}
              disabled={currentDateIndex + 6 >= uniqueDates.length}
              aria-label="Next 6 days"
              title="Next 6 days"
              style={{
                background: 'var(--paper)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px 8px',
                color: 'var(--ink)',
                cursor: currentDateIndex + 6 >= uniqueDates.length ? 'not-allowed' : 'pointer',
                opacity: currentDateIndex + 6 >= uniqueDates.length ? 0.4 : 1
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
              {daysWindow[0]?.monthName} {daysWindow[0]?.dayNumber} – {daysWindow[daysWindow.length - 1]?.monthName} {daysWindow[daysWindow.length - 1]?.dayNumber}, 2026
            </span>
            <span style={{
              marginLeft: '8px',
              fontSize: '11px',
              color: 'var(--mizu)',
              fontWeight: 500,
              backgroundColor: 'var(--wash-mizu)',
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              {weekSessions.length} slots this week
            </span>
          </div>
        </div>

        {/* Day Filter Tabs: All, Mon, Tue, Wed, Thu, Fri, Sat */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          backgroundColor: 'var(--paper)',
          padding: '2px',
          borderRadius: '8px',
          border: '1px solid var(--border)'
        }}>
          {['ALL', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => {
            const isSelected = selectedDayFilter === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDayFilter(day)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--mizu)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {day === 'ALL' ? 'All Days' : day}
              </button>
            );
          })}
        </div>

        {/* Course Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
          <button
            onClick={() => setSelectedCourseFilter('all')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: '8px',
              border: selectedCourseFilter === 'all' ? '1px solid var(--ink)' : '1px solid var(--border)',
              backgroundColor: selectedCourseFilter === 'all' ? 'var(--ink)' : 'var(--paper)',
              color: selectedCourseFilter === 'all' ? 'var(--paper)' : 'var(--ink-soft)',
              cursor: 'pointer'
            }}
          >
            All Courses
          </button>
          {uniqueCourses.map(code => {
            const colors = COURSE_COLORS[code] || { accent: 'var(--indigo)', bg: 'var(--card)' };
            const isActive = selectedCourseFilter === code;
            return (
              <button
                key={code}
                onClick={() => setSelectedCourseFilter(code)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: isActive ? `1px solid ${colors.accent}` : '1px solid var(--border)',
                  backgroundColor: isActive ? colors.accent : 'var(--paper)',
                  color: isActive ? '#FFFFFF' : 'var(--ink)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? '#FFF' : colors.accent
                }} />
                {code}
              </button>
            );
          })}
        </div>

        {/* Actions: Export & View Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleExportAll}
            title="Download full term .ics file"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--paper)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--ink)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            <span>.ICS</span>
          </button>
        </div>
      </div>

      {/* 2. 6-Day Weekly Matrix Table */}
      <div style={{
        backgroundColor: 'var(--card)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        position: 'relative'
      }}>
        {/* Days Header Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `64px repeat(${visibleDaysWindow.length}, 1fr)`,
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--card-hover)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          {/* Time column header */}
          <div style={{
            padding: '12px 8px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--ink-soft)',
            textAlign: 'center',
            borderRight: '1px solid var(--border)'
          }}>
            IST
          </div>

          {/* Visible Day Headers */}
          {visibleDaysWindow.map((d) => (
            <div
              key={d.dateStr}
              style={{
                padding: '10px 8px',
                textAlign: 'center',
                borderRight: '1px solid var(--border)',
                backgroundColor: d.isToday ? 'rgba(var(--mizu-rgb), 0.08)' : 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: d.isToday ? 'var(--mizu)' : 'var(--ink-soft)',
                letterSpacing: '0.04em'
              }}>
                {d.dayName}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: d.isToday ? 700 : 500,
                color: d.isToday ? 'var(--mizu)' : 'var(--ink)',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: d.isToday ? 'var(--wash-mizu)' : 'transparent'
              }}>
                {d.dayNumber}
              </span>
            </div>
          ))}
        </div>

        {/* Matrix Body: Time lines + Session blocks */}
        <div style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `64px repeat(${visibleDaysWindow.length}, 1fr)`,
          height: `${TOTAL_HOURS * HOUR_HEIGHT}px`,
          backgroundColor: 'var(--paper)'
        }}>
          {/* Time Labels & Horizontal Grid Lines */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'none'
          }}>
            {Array.from({ length: TOTAL_HOURS }).map((_, idx) => {
              const hour = START_HOUR + idx;
              const formattedHour = `${hour.toString().padStart(2, '0')}:00`;
              return (
                <div
                  key={hour}
                  style={{
                    height: `${HOUR_HEIGHT}px`,
                    borderBottom: '1px solid var(--border-soft)',
                    boxSizing: 'border-box',
                    position: 'relative'
                  }}
                />
              );
            })}
          </div>

          {/* Time Labels Column */}
          <div style={{
            borderRight: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            zIndex: 2,
            position: 'relative'
          }}>
            {Array.from({ length: TOTAL_HOURS }).map((_, idx) => {
              const hour = START_HOUR + idx;
              const formattedHour = `${hour.toString().padStart(2, '0')}:00`;
              return (
                <div
                  key={hour}
                  style={{
                    height: `${HOUR_HEIGHT}px`,
                    paddingRight: '8px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ink-soft)',
                    textAlign: 'right',
                    transform: 'translateY(-7px)'
                  }}
                >
                  {formattedHour}
                </div>
              );
            })}
          </div>

          {/* Visible Day Columns */}
          {visibleDaysWindow.map((day) => {
            const daySessions = weekSessions.filter(s => s.classDate === day.dateStr);

            return (
              <div
                key={day.dateStr}
                style={{
                  position: 'relative',
                  borderRight: '1px solid var(--border)',
                  backgroundColor: day.isToday ? 'rgba(var(--mizu-rgb), 0.03)' : 'transparent',
                  height: '100%'
                }}
              >
                {/* Live Current Time Red Needle if today */}
                {day.isToday && showTimeNeedle && (
                  <div
                    style={{
                      position: 'absolute',
                      top: `${needleTopPx}px`,
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: 'var(--hanko)',
                      zIndex: 8,
                      pointerEvents: 'none'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: '-4px',
                      top: '-4px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--hanko)'
                    }} />
                  </div>
                )}

                {/* Render Classes */}
                {daySessions.map((session, sIdx) => {
                  const startFract = parseTimeToFraction(session.startTime);
                  const endFract = parseTimeToFraction(session.endTime);
                  const duration = Math.max(0.75, endFract - startFract);
                  const topPx = (startFract - START_HOUR) * HOUR_HEIGHT;
                  const heightPx = duration * HOUR_HEIGHT - 6;

                  const colors = COURSE_COLORS[session.courseCode] || {
                    accent: 'var(--indigo)',
                    bg: 'rgba(var(--indigo-rgb), 0.12)'
                  };

                  const isSelected = selectedSessionId === session.sessionId;

                  return (
                    <div
                      key={session.sessionId || sIdx}
                      onClick={() => onSelectSession?.(session)}
                      title={`${session.courseName} (${session.courseCode})\n${session.startTime} - ${session.endTime}\nVenue: ${session.venue} (${session.building})\nFaculty: ${session.faculty}`}
                      style={{
                        position: 'absolute',
                        top: `${topPx}px`,
                        left: '4px',
                        right: '4px',
                        height: `${Math.max(48, heightPx)}px`,
                        backgroundColor: 'var(--card)',
                        borderLeft: `4px solid ${colors.accent}`,
                        borderTop: isSelected ? `2px solid ${colors.accent}` : '1px solid var(--border)',
                        borderRight: isSelected ? `2px solid ${colors.accent}` : '1px solid var(--border)',
                        borderBottom: isSelected ? `2px solid ${colors.accent}` : '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '6px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        zIndex: isSelected ? 6 : 4,
                        boxShadow: isSelected ? '0 4px 16px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.transform = 'none';
                      }}
                    >
                      {/* Top Row: Course Code & Section */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: colors.accent,
                          letterSpacing: '-0.01em'
                        }}>
                          {session.courseCode}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--ink-soft)',
                          backgroundColor: 'var(--paper)',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-soft)'
                        }}>
                          {session.startTime.slice(0, 5)}
                        </span>
                      </div>

                      {/* Course Title */}
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {session.courseName}
                      </div>

                      {/* Bottom Row: Venue badge + Faculty */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginTop: '2px' }}>
                        <span
                          onClick={(e) => handleCopyVenue(session.sessionId, session.venue, e)}
                          title="Click to copy venue"
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--ink)',
                            backgroundColor: 'var(--paper)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '1px 5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <MapPin size={9} color={colors.accent} />
                          {session.venue}
                          {copiedId === session.sessionId ? <Check size={9} color="var(--moss)" /> : null}
                        </span>

                        <span style={{
                          fontSize: '10px',
                          color: 'var(--ink-soft)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '70px'
                        }}>
                          {session.faculty}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Footer Legend & Helper */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: 'var(--card)',
        borderRadius: '10px',
        border: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--ink-soft)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Navigation tip:</span>
          <span>Click any lecture block to inspect faculty details, attendance safety & GCal sync</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--hanko)' }} />
            Current Time Needle
          </span>
          <span>•</span>
          <span>Timezone: Asia/Kolkata (IST)</span>
        </div>
      </div>

    </div>
  );
}

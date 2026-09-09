import React, { useState } from 'react';
import { Calendar, Flame, AlertCircle, Clock, Check, ChevronRight } from 'lucide-react';
import { COURSE_COLORS } from '../data/rosterData';

export default function HorizonHeatmap({ schedule = [], deadlines = [], onSelectDate }) {
  const [viewMode, setViewMode] = useState('load'); // 'load' | 'attendance'
  const [selectedDay, setSelectedDay] = useState(null);

  // Group schedule by date
  const dateMap = {};
  for (const s of schedule) {
    const d = s.classDate;
    if (!dateMap[d]) {
      dateMap[d] = {
        classes: [],
        hasEarly: false,
        hasQuiz: false
      };
    }
    dateMap[d].classes.push(s);
    if (s.startTime && s.startTime.startsWith('08:')) {
      dateMap[d].hasEarly = true;
    }
  }

  // Check quizzes / deadlines
  for (const dl of deadlines) {
    if (dl.dueDate) {
      const d = dl.dueDate.split('T')[0];
      if (dateMap[d]) {
        dateMap[d].hasQuiz = true;
      }
    }
  }

  // Months to display: September 2026 & October 2026
  const months = [
    { year: 2026, month: 8, name: 'September 2026', daysInMonth: 30, firstDayOfWeek: 2 }, // Sep 1, 2026 is Tuesday (2)
    { year: 2026, month: 9, name: 'October 2026', daysInMonth: 31, firstDayOfWeek: 4 }   // Oct 1, 2026 is Thursday (4)
  ];

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Metrics
  const totalClassDays = Object.keys(dateMap).length;
  const earlyStartsCount = Object.values(dateMap).filter(d => d.hasEarly).length;
  const quizDaysCount = Object.values(dateMap).filter(d => d.hasQuiz).length;

  const handleCellClick = (dStr) => {
    setSelectedDay(selectedDay === dStr ? null : dStr);
    if (onSelectDate) onSelectDate(dStr);
  };

  return (
    <div style={{
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      {/* Header & Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            backgroundColor: 'var(--wash-mizu)',
            color: 'var(--mizu)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={15} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
              Term-5 Horizon Map
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: 0 }}>
              Bird's-eye schedule density & early alerts
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '2px'
        }}>
          <button
            onClick={() => setViewMode('load')}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'load' ? 'var(--ink)' : 'transparent',
              color: viewMode === 'load' ? 'var(--paper)' : 'var(--ink-soft)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Load
          </button>
          <button
            onClick={() => setViewMode('attendance')}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'attendance' ? 'var(--ink)' : 'transparent',
              color: viewMode === 'attendance' ? 'var(--paper)' : 'var(--ink-soft)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Attendance
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        <div style={{
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '8px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>Class Days</span>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>{totalClassDays}</div>
        </div>

        <div style={{
          backgroundColor: 'var(--wash-ochre)',
          border: '1px solid rgba(194, 145, 58, 0.25)',
          borderRadius: '8px',
          padding: '8px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '10px', color: 'var(--ochre)', fontWeight: 600 }}>8:30 AM Starts</span>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ochre)' }}>{earlyStartsCount}</div>
        </div>

        <div style={{
          backgroundColor: 'var(--wash-moss)',
          border: '1px solid rgba(110, 140, 99, 0.25)',
          borderRadius: '8px',
          padding: '8px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '10px', color: 'var(--moss)', fontWeight: 600 }}>Clean Streak</span>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--moss)' }}>🔥 8 Days</div>
        </div>
      </div>

      {/* Month Heatmaps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {months.map(m => {
          // Construct calendar grid cells
          // Week starts on Monday (idx 0), Sunday (idx 6)
          // firstDayOfWeek: 0 = Mon, 1 = Tue, ..., 6 = Sun
          // In JS Date.getDay(): 0=Sun, 1=Mon, 2=Tue...
          // We map Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
          const d = new Date(m.year, m.month, 1);
          let jsDay = d.getDay();
          let startOffset = jsDay === 0 ? 6 : jsDay - 1;

          const cells = [];
          for (let i = 0; i < startOffset; i++) {
            cells.push({ empty: true, key: `empty-${i}` });
          }

          for (let day = 1; day <= m.daysInMonth; day++) {
            const mmStr = m.month + 1 < 10 ? '0' + (m.month + 1) : String(m.month + 1);
            const ddStr = day < 10 ? '0' + day : String(day);
            const dStr = `${m.year}-${mmStr}-${ddStr}`;

            const info = dateMap[dStr];
            cells.push({
              empty: false,
              day,
              dateStr: dStr,
              count: info ? info.classes.length : 0,
              hasEarly: info ? info.hasEarly : false,
              hasQuiz: info ? info.hasQuiz : false,
              classes: info ? info.classes : [],
              key: dStr
            });
          }

          return (
            <div key={m.name}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>
                {m.name}
              </div>

              {/* Day of week labels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '3px' }}>
                {daysOfWeek.map((dow, idx) => (
                  <span key={idx} style={{ fontSize: '9px', fontWeight: 600, color: 'var(--ink-soft)' }}>
                    {dow}
                  </span>
                ))}
              </div>

              {/* Grid cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {cells.map(cell => {
                  if (cell.empty) {
                    return <div key={cell.key} style={{ height: '32px', backgroundColor: 'transparent' }} />;
                  }

                  const isSelected = selectedDay === cell.dateStr;
                  const hasClasses = cell.count > 0;

                  // Background coloring based on mode
                  let bg = 'var(--paper)';
                  let textColor = 'var(--ink-soft)';
                  let borderColor = 'var(--border)';

                  if (hasClasses) {
                    if (viewMode === 'load') {
                      if (cell.count === 1) {
                        bg = 'rgba(0, 169, 184, 0.15)';
                        textColor = 'var(--ink)';
                        borderColor = 'rgba(0, 169, 184, 0.3)';
                      } else if (cell.count === 2) {
                        bg = 'rgba(0, 169, 184, 0.32)';
                        textColor = 'var(--ink)';
                        borderColor = 'rgba(0, 169, 184, 0.5)';
                      } else {
                        bg = 'rgba(0, 169, 184, 0.55)';
                        textColor = '#FFFFFF';
                        borderColor = 'var(--mizu)';
                      }
                    } else {
                      // Attendance mode
                      bg = 'var(--wash-moss)';
                      textColor = 'var(--moss)';
                      borderColor = 'rgba(110, 140, 99, 0.4)';
                    }
                  }

                  return (
                    <button
                      key={cell.key}
                      onClick={() => handleCellClick(cell.dateStr)}
                      style={{
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'var(--ink)' : bg,
                        color: isSelected ? 'var(--paper)' : textColor,
                        border: `1px solid ${isSelected ? 'var(--ink)' : borderColor}`,
                        fontSize: '11px',
                        fontWeight: hasClasses ? 700 : 400,
                        cursor: hasClasses ? 'pointer' : 'default',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                        padding: 0
                      }}
                    >
                      {cell.day}

                      {/* 8:30 AM Early start dot (top-right) */}
                      {cell.hasEarly && (
                        <span style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--ochre)',
                          boxShadow: '0 0 0 1px var(--card)'
                        }} />
                      )}

                      {/* Quiz / Deadline dot (bottom-right) */}
                      {cell.hasQuiz && (
                        <span style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--hanko)',
                          boxShadow: '0 0 0 1px var(--card)'
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        fontSize: '10px',
        color: 'var(--ink-soft)',
        paddingTop: '6px',
        borderTop: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--ochre)' }} />
            <span>8:30 AM Early</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--hanko)' }} />
            <span>Quiz / Due</span>
          </div>
        </div>
        <span>Click day to inspect</span>
      </div>

      {/* Selected Day Inspect Panel */}
      {selectedDay && dateMap[selectedDay] && (
        <div style={{
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '12px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
              {selectedDay} • {dateMap[selectedDay].classes.length} Lecture{dateMap[selectedDay].classes.length === 1 ? '' : 's'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>Selected</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {dateMap[selectedDay].classes.map((cls, idx) => {
              const ccolor = COURSE_COLORS[cls.courseCode] || COURSE_COLORS.DEFAULT;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--card)',
                    borderLeft: `3.5px solid ${ccolor.border}`,
                    borderTop: '1px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: ccolor.border }}>
                        {cls.courseCode}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                        {cls.courseName}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                      {cls.startTime.slice(0, 5)} - {cls.endTime.slice(0, 5)} • {cls.faculty}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)' }}>
                    📍 {cls.venue}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

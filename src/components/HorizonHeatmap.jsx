import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Flame,
  AlertCircle,
  Clock,
  Check,
  ChevronRight,
  Sparkles,
  Filter,
  Sun,
  ArrowUpRight,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { COURSE_COLORS } from '../data/courseColors';
import { playTactileClick } from '../services/soundEngine';

/**
 * HorizonHeatmap - Term-5 Workload & Schedule Horizon Suite
 * Visual features:
 * - Weekly workload density sparkline / load distribution curve
 * - Multi-slot course-colored cell stacks inside calendar days
 * - 1-Tap category filters (8:30 AM, Heavy Days, Deadlines, Free Days)
 * - Interactive Day Inspector Card with direct 1-click jump to Timetable
 * - Crisp Alabaster aesthetic with zero sepia/yellow tint
 */
export default function HorizonHeatmap({ schedule = [], deadlines = [], onSelectDate }) {
  const [viewMode, setViewMode] = useState('load'); // 'load' | 'attendance'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'heavy' | 'early' | 'quiz' | 'free'
  const [activeMonthTab, setActiveMonthTab] = useState('both'); // 'sep' | 'oct' | 'both'
  const [selectedDay, setSelectedDay] = useState(null);

  // 1. Group schedule by date & compute comprehensive metrics
  const {
    dateMap,
    totalClassDays,
    earlyStartsCount,
    quizDaysCount,
    heavyDaysCount,
    freeDaysCount,
    weeklyWorkload
  } = useMemo(() => {
    const map = {};
    for (const s of schedule) {
      const d = s.classDate;
      if (!d) continue;
      if (!map[d]) {
        map[d] = {
          classes: [],
          hasEarly: false,
          hasQuiz: false,
          totalMinutes: 0
        };
      }
      map[d].classes.push(s);

      // Check 8:30 AM early starts
      if (s.startTime && (s.startTime.startsWith('08:') || s.startTime.startsWith('8:'))) {
        map[d].hasEarly = true;
      }

      // Calculate approximate session duration
      map[d].totalMinutes += 90; // Standard 1.5h lecture block
    }

    // Correlate quizzes and deadlines
    for (const dl of deadlines) {
      if (dl.dueDate) {
        const d = dl.dueDate.split('T')[0];
        if (map[d]) {
          map[d].hasQuiz = true;
        }
      }
    }

    const totalDays = Object.keys(map).length;
    const early = Object.values(map).filter(d => d.hasEarly).length;
    const quizzes = Object.values(map).filter(d => d.hasQuiz).length;
    const heavy = Object.values(map).filter(d => d.classes.length >= 3).length;

    // Count open/free days between Sep 1 and Oct 31 that have 0 scheduled classes
    let freeCount = 0;
    const start = new Date(2026, 8, 1);
    const end = new Date(2026, 9, 31);
    for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
      const mmStr = cur.getMonth() + 1 < 10 ? '0' + (cur.getMonth() + 1) : String(cur.getMonth() + 1);
      const ddStr = cur.getDate() < 10 ? '0' + cur.getDate() : String(cur.getDate());
      const curStr = `${cur.getFullYear()}-${mmStr}-${ddStr}`;
      const dayOfWeek = cur.getDay(); // 0=Sun, 3=Wed
      if (!map[curStr] && (dayOfWeek === 0 || dayOfWeek === 3 || dayOfWeek === 6)) {
        freeCount++;
      }
    }

    // Weekly workload density curve (Weeks 1 to 8 of Term 5)
    // Starting Monday Aug 31 / Sep 1 to end of Oct
    const weeks = [
      { label: 'W1', start: '2026-08-31', end: '2026-09-06', count: 0, hours: 0 },
      { label: 'W2', start: '2026-09-07', end: '2026-09-13', count: 0, hours: 0 },
      { label: 'W3', start: '2026-09-14', end: '2026-09-20', count: 0, hours: 0 },
      { label: 'W4', start: '2026-09-21', end: '2026-09-27', count: 0, hours: 0 },
      { label: 'W5', start: '2026-09-28', end: '2026-10-04', count: 0, hours: 0 },
      { label: 'W6', start: '2026-10-05', end: '2026-10-11', count: 0, hours: 0 },
      { label: 'W7', start: '2026-10-12', end: '2026-10-18', count: 0, hours: 0 },
      { label: 'W8', start: '2026-10-19', end: '2026-10-25', count: 0, hours: 0 }
    ];

    Object.entries(map).forEach(([dStr, info]) => {
      for (const w of weeks) {
        if (dStr >= w.start && dStr <= w.end) {
          w.count += info.classes.length;
          w.hours += (info.classes.length * 1.5);
          break;
        }
      }
    });

    return {
      dateMap: map,
      totalClassDays: totalDays,
      earlyStartsCount: early,
      quizDaysCount: quizzes,
      heavyDaysCount: heavy,
      freeDaysCount: freeCount,
      weeklyWorkload: weeks
    };
  }, [schedule, deadlines]);

  // Months configuration for Term-5
  const allMonths = useMemo(() => [
    { id: 'sep', year: 2026, month: 8, name: 'September 2026', daysInMonth: 30 },
    { id: 'oct', year: 2026, month: 9, name: 'October 2026', daysInMonth: 31 }
  ], []);

  const displayedMonths = useMemo(() => {
    if (activeMonthTab === 'sep') return allMonths.filter(m => m.id === 'sep');
    if (activeMonthTab === 'oct') return allMonths.filter(m => m.id === 'oct');
    return allMonths;
  }, [activeMonthTab, allMonths]);

  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const handleCellClick = (dStr) => {
    playTactileClick(650);
    setSelectedDay(selectedDay === dStr ? null : dStr);
  };

  // Find maximum weekly load to scale sparkline
  const maxWeeklyHours = useMemo(() => {
    const max = Math.max(...weeklyWorkload.map(w => w.hours), 6);
    return max > 0 ? max : 6;
  }, [weeklyWorkload]);

  return (
    <div style={{
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '18px',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* 1. Header with Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            backgroundColor: 'var(--wash-mizu)',
            border: '1px solid rgba(var(--mizu-rgb), 0.25)',
            color: 'var(--mizu)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(var(--mizu-rgb), 0.15)'
          }}>
            <Calendar size={18} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '17px',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: 0,
                letterSpacing: '-0.02em'
              }}>
                Term-5 Horizon Map
              </h3>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--mizu)',
                backgroundColor: 'var(--wash-mizu)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(var(--mizu-rgb), 0.2)'
              }}>
                SPATIAL RADAR
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: '2px 0 0 0' }}>
              Bird's-eye schedule density, workload waves & early alert radar
            </p>
          </div>
        </div>

        {/* Mode Toggle Buttons: Load vs Attendance */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '2px'
        }}>
          <button
            onClick={() => {
              playTactileClick(600);
              setViewMode('load');
            }}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'load' ? 'var(--ink)' : 'transparent',
              color: viewMode === 'load' ? 'var(--paper)' : 'var(--ink-soft)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Lecture Load
          </button>
          <button
            onClick={() => {
              playTactileClick(600);
              setViewMode('attendance');
            }}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'attendance' ? 'var(--ink)' : 'transparent',
              color: viewMode === 'attendance' ? 'var(--paper)' : 'var(--ink-soft)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Attendance Safety
          </button>
        </div>
      </div>

      {/* 2. Top Tactical KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
        <div style={{
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 600 }}>Class Days</span>
            <BookOpen size={13} color="var(--mizu)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
              {totalClassDays}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--ink-faint)' }}>scheduled</span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--wash-ochre)',
          border: '1px solid rgba(var(--ochre-rgb), 0.25)',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--ochre-text)', fontWeight: 700 }}>8:30 AM Starts</span>
            <Sun size={13} color="var(--ochre)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ochre)', fontFamily: 'var(--font-mono)' }}>
              {earlyStartsCount}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--ochre-text)' }}>early alarms</span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--wash-moss)',
          border: '1px solid rgba(var(--moss-rgb), 0.25)',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--moss-text)', fontWeight: 700 }}>Clean Streak</span>
            <Flame size={13} color="var(--moss)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--moss)', fontFamily: 'var(--font-mono)' }}>
              8 Days
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--moss-text)' }}>100% held</span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--wash-mizu)',
          border: '1px solid rgba(var(--mizu-rgb), 0.25)',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--mizu-text)', fontWeight: 700 }}>Free Windows</span>
            <Sparkles size={13} color="var(--mizu)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mizu)', fontFamily: 'var(--font-mono)' }}>
              {freeDaysCount}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--mizu-text)' }}>Wed/Sun days</span>
          </div>
        </div>
      </div>

      {/* 3. Visual Workload Sparkline Banner (Weekly Density Wave) */}
      <div style={{
        backgroundColor: 'var(--paper)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={14} color="var(--mizu)" />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink)' }}>
              Weekly Workload Intensity Curve
            </span>
          </div>
          <span style={{ fontSize: '10.5px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
            Term-5 Distribution (Hours/Wk)
          </span>
        </div>

        {/* SVG Sparkline / Bar Histogram */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '48px', paddingTop: '4px' }}>
          {weeklyWorkload.map((wk, idx) => {
            const heightPercent = maxWeeklyHours > 0 ? Math.min(100, Math.max(12, (wk.hours / maxWeeklyHours) * 100)) : 12;
            const isPeak = wk.hours >= 9;

            return (
              <div
                key={idx}
                title={`${wk.label}: ${wk.hours} lecture hours (${wk.count} sessions)`}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  height: '100%',
                  justifyContent: 'flex-end',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${heightPercent}%`,
                    borderRadius: '4px 4px 1px 1px',
                    backgroundColor: isPeak ? 'var(--mizu)' : wk.hours > 0 ? 'rgba(var(--mizu-rgb), 0.4)' : 'var(--border)',
                    transition: 'all 0.2s ease',
                    boxShadow: isPeak ? '0 1px 4px rgba(var(--mizu-rgb), 0.25)' : 'none'
                  }}
                />
                <span style={{ fontSize: '9px', fontWeight: 600, color: isPeak ? 'var(--ink)' : 'var(--ink-faint)' }}>
                  {wk.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive 1-Tap Category Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
          <Filter size={12} color="var(--ink-soft)" />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
            Filter:
          </span>
        </div>

        {[
          { id: 'all', label: 'All Days', count: totalClassDays },
          { id: 'heavy', label: '⚡ Heavy (3+ classes)', count: heavyDaysCount },
          { id: 'early', label: '🌅 8:30 AM Starts', count: earlyStartsCount },
          { id: 'quiz', label: '📝 Quizzes & Due', count: quizDaysCount },
          { id: 'free', label: '🌿 Free Days', count: freeDaysCount }
        ].map(filter => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => {
                playTactileClick(500);
                setActiveFilter(filter.id);
              }}
              className="btn-tactile"
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: isActive ? '1px solid var(--ink)' : '1px solid var(--border)',
                backgroundColor: isActive ? 'var(--ink)' : 'var(--card)',
                color: isActive ? 'var(--paper)' : 'var(--ink)',
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <span>{filter.label}</span>
              <span style={{
                fontSize: '9.5px',
                padding: '0 4px',
                borderRadius: '3px',
                backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--paper)',
                color: isActive ? 'var(--paper)' : 'var(--ink-soft)'
              }}>
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 5. Month View Tabs: Sep 2026 | Oct 2026 | Both */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '8px'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => {
              playTactileClick(550);
              setActiveMonthTab('both');
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeMonthTab === 'both' ? 'var(--wash-mizu)' : 'transparent',
              color: activeMonthTab === 'both' ? 'var(--mizu)' : 'var(--ink-soft)',
              fontSize: '11.5px',
              fontWeight: activeMonthTab === 'both' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            Full Term (Sep & Oct)
          </button>
          <button
            onClick={() => {
              playTactileClick(550);
              setActiveMonthTab('sep');
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeMonthTab === 'sep' ? 'var(--wash-mizu)' : 'transparent',
              color: activeMonthTab === 'sep' ? 'var(--mizu)' : 'var(--ink-soft)',
              fontSize: '11.5px',
              fontWeight: activeMonthTab === 'sep' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            September 2026
          </button>
          <button
            onClick={() => {
              playTactileClick(550);
              setActiveMonthTab('oct');
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeMonthTab === 'oct' ? 'var(--wash-mizu)' : 'transparent',
              color: activeMonthTab === 'oct' ? 'var(--mizu)' : 'var(--ink-soft)',
              fontSize: '11.5px',
              fontWeight: activeMonthTab === 'oct' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            October 2026
          </button>
        </div>

        <span style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
          Click date to inspect syllabus
        </span>
      </div>

      {/* 6. Calendar Grids with Multi-Course Visual Stacks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: displayedMonths.length > 1 ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
        gap: '16px'
      }}>
        {displayedMonths.map(m => {
          // Construct calendar grid cells
          // Mon = 0, Sun = 6
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
            const hasClasses = Boolean(info && info.classes.length > 0);
            const dayOfWeek = new Date(m.year, m.month, day).getDay();
            const isWeekendOrFree = dayOfWeek === 0 || dayOfWeek === 3; // Sun or Wed

            // Filter match logic
            let matchesFilter = true;
            if (activeFilter === 'heavy') matchesFilter = info && info.classes.length >= 3;
            else if (activeFilter === 'early') matchesFilter = info && info.hasEarly;
            else if (activeFilter === 'quiz') matchesFilter = info && info.hasQuiz;
            else if (activeFilter === 'free') matchesFilter = !hasClasses && isWeekendOrFree;

            cells.push({
              empty: false,
              day,
              dateStr: dStr,
              count: info ? info.classes.length : 0,
              hasEarly: info ? info.hasEarly : false,
              hasQuiz: info ? info.hasQuiz : false,
              classes: info ? info.classes : [],
              isFreeDay: !hasClasses && isWeekendOrFree,
              matchesFilter,
              key: dStr
            });
          }

          return (
            <div
              key={m.name}
              style={{
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-brand)' }}>
                  {m.name}
                </span>
                <span style={{
                  fontSize: '10.5px',
                  color: 'var(--ink-soft)',
                  backgroundColor: 'var(--card)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)'
                }}>
                  {m.daysInMonth} Days
                </span>
              </div>

              {/* Day of Week Headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
                textAlign: 'center',
                marginBottom: '6px'
              }}>
                {daysOfWeek.map((dow, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      color: idx === 5 || idx === 6 ? 'var(--ink-faint)' : 'var(--ink-soft)',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {dow}
                  </span>
                ))}
              </div>

              {/* Grid Cells with Multi-Course Visual Stacks */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {cells.map(cell => {
                  if (cell.empty) {
                    return <div key={cell.key} style={{ height: '48px', backgroundColor: 'transparent' }} />;
                  }

                  const isSelected = selectedDay === cell.dateStr;
                  const hasClasses = cell.count > 0;
                  const isDimmed = activeFilter !== 'all' && !cell.matchesFilter;

                  // Compute cell background
                  let bg = 'var(--card)';
                  let borderColor = 'var(--border)';

                  if (hasClasses) {
                    if (viewMode === 'load') {
                      if (cell.count === 1) {
                        bg = 'rgba(var(--mizu-rgb), 0.08)';
                        borderColor = 'rgba(var(--mizu-rgb), 0.25)';
                      } else if (cell.count === 2) {
                        bg = 'rgba(var(--mizu-rgb), 0.16)';
                        borderColor = 'rgba(var(--mizu-rgb), 0.4)';
                      } else {
                        bg = 'rgba(var(--mizu-rgb), 0.24)';
                        borderColor = 'var(--mizu)';
                      }
                    } else {
                      // Attendance mode: soft emerald safe wash
                      bg = 'var(--wash-moss)';
                      borderColor = 'rgba(var(--moss-rgb), 0.35)';
                    }
                  } else if (cell.isFreeDay) {
                    bg = 'rgba(var(--moss-rgb), 0.04)';
                    borderColor = 'rgba(var(--moss-rgb), 0.18)';
                  }

                  return (
                    <button
                      key={cell.key}
                      data-date={cell.dateStr}
                      aria-label={`Date ${cell.dateStr}, ${cell.count} classes`}
                      onClick={() => handleCellClick(cell.dateStr)}
                      className="btn-tactile"
                      style={{
                        height: '48px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'var(--ink)' : bg,
                        border: isSelected
                          ? '2px solid var(--ink)'
                          : cell.matchesFilter && activeFilter !== 'all'
                          ? '2px solid var(--mizu)'
                          : `1px solid ${borderColor}`,
                        opacity: isDimmed ? 0.35 : 1,
                        cursor: hasClasses ? 'pointer' : 'default',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '4px 3px 3px 3px',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? 'var(--shadow-md)' : 'none'
                      }}
                    >
                      {/* Top Row: Day number + status alert dot */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '0 2px'
                      }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: hasClasses || isSelected ? 800 : 500,
                          color: isSelected ? 'var(--paper)' : hasClasses ? 'var(--ink)' : 'var(--ink-faint)'
                        }}>
                          {cell.day}
                        </span>

                        {/* Top-Right Alert Dot */}
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                          {cell.hasEarly && (
                            <span
                              title="8:30 AM Early Morning Start"
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--ochre)'
                              }}
                            />
                          )}
                          {cell.hasQuiz && (
                            <span
                              title="Quiz / Submission Deadline"
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--hanko)'
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Bottom Area: Visual Course Accent Stack or Free Day Pill */}
                      {hasClasses ? (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          width: '100%'
                        }}>
                          {cell.classes.slice(0, 2).map((cls, cIdx) => {
                            const ccol = COURSE_COLORS[cls.courseCode] || COURSE_COLORS.DEFAULT;
                            return (
                              <div
                                key={cIdx}
                                style={{
                                  height: '4px',
                                  borderRadius: '2px',
                                  backgroundColor: isSelected ? 'var(--paper)' : ccol.border,
                                  width: '100%'
                                }}
                              />
                            );
                          })}
                          {cell.classes.length > 2 && (
                            <span style={{
                              fontSize: '8px',
                              fontWeight: 700,
                              color: isSelected ? 'var(--paper)' : 'var(--mizu)',
                              lineHeight: 1,
                              textAlign: 'right'
                            }}>
                              +{cell.classes.length - 2}
                            </span>
                          )}
                        </div>
                      ) : cell.isFreeDay ? (
                        <span style={{
                          fontSize: '8.5px',
                          fontWeight: 700,
                          color: 'var(--moss)',
                          letterSpacing: '0.02em'
                        }}>
                          FREE
                        </span>
                      ) : (
                        <div style={{ height: '4px' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 7. Visual Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        fontSize: '11px',
        color: 'var(--ink-soft)',
        paddingTop: '8px',
        borderTop: '1px solid var(--border)',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--ochre)' }} />
            <span>8:30 AM Early Alarm</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--hanko)' }} />
            <span>Quiz / Assignment Due</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--mizu)' }} />
            <span>Course Accent Bar</span>
          </div>
        </div>
        <span style={{ fontWeight: 600, color: 'var(--ink-muted)' }}>
          Click any date to inspect classes
        </span>
      </div>

      {/* 8. Interactive Day Inspector Card with Direct Timetable Navigation */}
      {selectedDay && dateMap[selectedDay] && (
        <div style={{
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '14px',
          animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Day Inspector Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--mizu)'
              }} />
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-brand)' }}>
                {selectedDay} • {dateMap[selectedDay].classes.length} Lecture{dateMap[selectedDay].classes.length === 1 ? '' : 's'}
              </span>
            </div>

            <button
              onClick={() => {
                if (onSelectDate) onSelectDate(selectedDay);
              }}
              className="btn-tactile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--wash-mizu)',
                border: '1px solid rgba(var(--mizu-rgb), 0.3)',
                color: 'var(--mizu)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span>View in Timetable</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          {/* List of Lectures on Selected Day */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {dateMap[selectedDay].classes.map((cls, idx) => {
              const ccolor = COURSE_COLORS[cls.courseCode] || COURSE_COLORS.DEFAULT;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--card)',
                    borderLeft: `4px solid ${ccolor.border}`,
                    borderTop: '1px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: ccolor.border,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {cls.courseCode}
                      </span>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)' }}>
                        {cls.courseName}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <Clock size={11} color="var(--ink-soft)" />
                      <span style={{ fontSize: '11.5px', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                        {cls.startTime.slice(0, 5)} – {cls.endTime.slice(0, 5)}
                      </span>
                      <span style={{ color: 'var(--ink-faint)' }}>•</span>
                      <span style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                        {cls.faculty}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    backgroundColor: 'var(--paper)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap'
                  }}>
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

import React from 'react';
import {
  Search,
  Command,
  HelpCircle,
  Sparkles,
  Calendar,
  Users,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';

export default function DesktopTopBar({
  activeTab,
  onOpenSearch,
  onOpenShortcuts,
  onOpenGroupSynergy,
  student,
  theme,
  onToggleTheme,
  onRefresh,
  isSyncing
}) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'radar': return { title: 'Today Radar', desc: 'Live Academic HUD & Celestial Chronos Continuum' };
      case 'bunkmeter': return { title: 'Bunk-O-Meter', desc: 'Statutory Attendance Debt & Risk Simulation Engine' };
      case 'timetable': return { title: 'Weekly Timetable Matrix', desc: '6-Day Academic Schedule & Conflict Navigator' };
      case 'trips': return { title: 'Getaways & Trips', desc: 'Long Weekend Vacation Optimizer & Attendance Arbitrage' };
      case 'deadlines': return { title: 'Deadlines & Quizzes', desc: 'Academic Deliverables, Midterms & Case Tracker' };
      default: return { title: 'Command Centre', desc: 'Term-5 Academic Operations' };
    }
  };

  const { title } = getTabTitle();

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 20,
      backdropFilter: 'blur(12px)'
    }}>
      {/* Left: Breadcrumbs & View Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ink-soft)' }}>
            <span>XLRI Jamshedpur</span>
            <span>/</span>
            <span>BM 2024-26</span>
            <span>/</span>
            <span style={{ color: 'var(--mizu)', fontWeight: 600 }}>Term-5</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              {title}
            </h1>
            <span style={{
              fontSize: '11px',
              color: 'var(--ink-soft)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              backgroundColor: 'var(--paper)',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              <Calendar size={11} />
              {todayFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Omni-Search Bar Trigger (⌘K) */}
      <div style={{ flex: 1, maxWidth: '420px', margin: '0 24px' }}>
        <button
          onClick={onOpenSearch}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            color: 'var(--ink-soft)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--mizu)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 169, 184, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={14} color="var(--ink-soft)" />
            <span>Search 178 batchmates, courses, professors...</span>
          </div>
          <kbd style={{
            fontSize: '10px',
            padding: '2px 6px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--ink)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <Command size={10} /> K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Group Synergy Matrix Button */}
        <button
          onClick={onOpenGroupSynergy}
          title="Open Group Collaboration & Free Slot Finder"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--ink)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.15s'
          }}
        >
          <Users size={14} color="var(--mizu)" />
          <span>Group Synergy</span>
        </button>

        {/* Shortcuts Helper */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          style={{
            padding: '7px 10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--ink-soft)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px'
          }}
        >
          <HelpCircle size={14} />
          <kbd style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>?</kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title="Toggle Light / Dark Theme (T)"
          style={{
            padding: '7px 10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--ink)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {theme === 'dark' ? <Sun size={14} color="var(--ochre)" /> : <Moon size={14} color="var(--indigo)" />}
        </button>

        {/* Refresh / Sync */}
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          title="Sync ERP Data"
          style={{
            padding: '7px 10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--ink)',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} color="var(--ink-soft)" />
        </button>
      </div>
    </header>
  );
}

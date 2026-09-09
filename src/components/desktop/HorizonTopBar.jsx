import React from 'react';
import {
  Search,
  Command,
  HelpCircle,
  Sparkles,
  Flame,
  Headphones,
  RefreshCw,
  Sun,
  Moon,
  Users,
  LogOut,
  Smartphone,
  Monitor
} from 'lucide-react';
import XlFlowLogo from '../XlFlowLogo';

export default function HorizonTopBar({
  student,
  isDemo,
  theme,
  onToggleTheme,
  onRefresh,
  onLogout,
  isSyncing,
  onOpenSearch,
  onOpenShortcuts,
  onOpenBooklet,
  isAmbientOn,
  onToggleAmbient,
  onOpenAiSettings,
  onToggleLayoutMode,
  isDesktop
}) {
  return (
    <header style={{
      height: '60px',
      backgroundColor: 'var(--card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'relative',
      zIndex: 20,
      userSelect: 'none',
      backdropFilter: 'blur(16px)'
    }}>
      {/* Left: Brand + Student Identity Dossier */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <XlFlowLogo size={32} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                color: 'var(--ink)',
                display: 'inline-flex',
                alignItems: 'baseline'
              }}>
                <span>XL</span>
                <span style={{ color: 'var(--mizu)', opacity: 0.5, margin: '0 0.5px', fontWeight: 600 }}>-</span>
                <span style={{
                  background: 'linear-gradient(135deg, var(--mizu) 0%, #4E6E9C 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800
                }}>Flow</span>
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--moss)',
                backgroundColor: 'var(--wash-moss)',
                padding: '1px 5px',
                borderRadius: '4px'
              }}>
                LIVE
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>
              Horizon Deck • Term-5
            </span>
          </div>
        </div>

        {/* Vertical separator */}
        <div style={{ width: '1px', height: '28px', backgroundColor: 'var(--border)' }} />

        {/* Student Profile Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--paper)',
          padding: '4px 10px',
          borderRadius: '10px',
          border: '1px solid var(--border)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                {student?.name || 'Janmejai Singh'}
              </span>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--mizu)' }}>
                {student?.id || 'B25349'}
              </span>
            </div>
          </div>

          <div
            className="topbar-hide-980"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--wash-ochre)',
              padding: '2px 6px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--ochre-text)'
            }}
          >
            <Flame size={12} color="var(--ochre)" />
            <span>8-Day Streak</span>
          </div>
        </div>
      </div>

      {/* Center: Omni-Search Bar (⌘K) */}
      <div style={{ flex: 1, maxWidth: '440px', margin: '0 24px' }}>
        <button
          onClick={onOpenSearch}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 14px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            color: 'var(--ink-soft)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
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

      {/* Right: Audio Waveform, Theme, Shortcuts, Sync Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        
        {/* 432Hz Focus Soundscape with Live Visualizer Waves */}
        <button
          onClick={onToggleAmbient}
          title={isAmbientOn ? 'Pause 432Hz Soundscape' : 'Play 432Hz Meditative Soundscape'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: isAmbientOn ? 'var(--wash-moss)' : 'var(--paper)',
            border: isAmbientOn ? '1px solid var(--moss)' : '1px solid var(--border)',
            borderRadius: '8px',
            color: isAmbientOn ? 'var(--moss-text)' : 'var(--ink)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Headphones size={13} color={isAmbientOn ? 'var(--moss)' : 'currentColor'} />
          <span className="topbar-hide-1280">432Hz Focus</span>

          {/* Equalizer Waveform Animation */}
          {isAmbientOn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '12px' }}>
              <span className="equalizer-bar" style={{ width: '2px', height: '10px', backgroundColor: 'var(--moss)', borderRadius: '1px' }} />
              <span className="equalizer-bar" style={{ width: '2px', height: '14px', backgroundColor: 'var(--moss)', borderRadius: '1px' }} />
              <span className="equalizer-bar" style={{ width: '2px', height: '8px', backgroundColor: 'var(--moss)', borderRadius: '1px' }} />
            </div>
          )}
        </button>

        {/* Student Manual */}
        <button
          onClick={onOpenBooklet}
          title="Student Instruction Manual"
          className="topbar-hide-1120"
          style={{
            padding: '6px 10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--ink-soft)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600
          }}
        >
          Manual
        </button>

        {/* Free AI Engine & Key Vault Modal Trigger */}
        <button
          onClick={onOpenAiSettings}
          title="Configure Free AI Providers (Gemini, Groq, OpenRouter)"
          style={{
            padding: '6px 10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--mizu)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Sparkles size={12} />
          <span className="topbar-hide-1280">AI Engine</span>
        </button>

        {/* View Mode Switcher (Desktop Horizon vs Mobile Shell) */}
        <button
          onClick={onToggleLayoutMode}
          title="Switch to Mobile Phone View"
          style={{
            padding: '6px 10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--ink)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 600
          }}
        >
          <Smartphone size={13} color="var(--mizu)" />
          <span className="topbar-hide-1120">Mobile Shell</span>
        </button>

        {/* Shortcuts Helper */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          className="topbar-hide-1120"
          style={{
            padding: '6px 10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--ink-soft)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px'
          }}
        >
          <HelpCircle size={13} />
          <kbd style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>?</kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title="Toggle Light / Dark Theme (T)"
          style={{
            padding: '6px 10px',
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

        {/* Refresh ERP */}
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          title="Sync ERP Data"
          style={{
            padding: '6px 10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--ink)',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} color="var(--ink-soft)" />
        </button>

        {/* ERP Live Indicator Pill */}
        <div
          className="topbar-hide-1280"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: 'var(--paper)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink-soft)'
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isSyncing ? 'var(--ochre)' : 'var(--moss)'
          }} />
          <span>xlerp.xlri.ac.in</span>
        </div>

      </div>
    </header>
  );
}

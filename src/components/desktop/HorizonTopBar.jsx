import React, { useState, useEffect } from 'react';
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
  Smartphone,
  BookOpen,
  Cpu,
  Radio,
  Compass
} from 'lucide-react';
import XlFlowLogo from '../XlFlowLogo';
import { playTactileClick } from '../../services/soundEngine';
import { socialApi } from '../../services/socialApi';

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
  isDesktop,
  isInspectorOpen,
  onToggleInspector,
  onOpenBeaconModal,
  onOpenQuickTour
}) {
  const [myBeacon, setMyBeacon] = useState(() => socialApi.getMyStatus());

  useEffect(() => {
    const unsub = socialApi.subscribe((e) => {
      if (e.type === 'STATUS_UPDATED' || e.type === 'STATUS_CLEARED') {
        setMyBeacon(socialApi.getMyStatus());
      }
    });
    return unsub;
  }, []);

  const initials = student?.name
    ? student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'JS';

  return (
    <header style={{
      height: '56px',
      backgroundColor: 'var(--card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'relative',
      zIndex: 20,
      userSelect: 'none',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* 1. Left: Brand + Student Identity Dossier */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        {/* Brand Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <XlFlowLogo size={28} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1 }}>
              <span style={{
                fontFamily: 'var(--font-brand)',
                fontSize: '17px',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                color: 'var(--ink)',
                display: 'inline-flex',
                alignItems: 'baseline'
              }}>
                <span>XL</span>
                <span style={{ color: 'var(--mizu)', opacity: 0.6, margin: '0 0.5px', fontWeight: 600 }}>-</span>
                <span style={{
                  background: 'linear-gradient(135deg, var(--mizu) 0%, #4E6E9C 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800
                }}>Flow</span>
              </span>
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: 'var(--moss)',
                backgroundColor: 'var(--wash-moss)',
                padding: '1px 5px',
                borderRadius: '4px',
                border: '1px solid rgba(110, 140, 99, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--moss)' }} />
                LIVE
              </span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--ink-soft)', marginTop: '2px', fontWeight: 500 }}>
              Term-5 • Horizon Deck
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)' }} />

        {/* Student Profile Capsule */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--paper)',
          padding: '4px 10px',
          borderRadius: '9999px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
        }}>
          {/* Avatar Dot with Initials */}
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'var(--wash-mizu)',
            color: 'var(--mizu)',
            fontSize: '9px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-brand)',
            border: '1px solid rgba(0, 169, 184, 0.25)'
          }}>
            {initials}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
              {student?.name || 'Janmejai Singh'}
            </span>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink-soft)',
              backgroundColor: 'var(--card)',
              padding: '1px 5px',
              borderRadius: '4px',
              border: '1px solid var(--border)'
            }}>
              {student?.id || 'B25349'}
            </span>
          </div>

          <div
            className="topbar-hide-980"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: 'var(--wash-ochre)',
              padding: '2px 7px',
              borderRadius: '9999px',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--ochre-text)',
              border: '1px solid rgba(194, 145, 58, 0.25)'
            }}
          >
            <Flame size={11} color="var(--ochre)" />
            <span>8d Streak</span>
          </div>

          {/* Campus Presence Beacon Trigger */}
          <button
            onClick={() => {
              playTactileClick(700);
              onOpenBeaconModal?.();
            }}
            title="Broadcast or view campus presence beacon"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: myBeacon ? 'var(--wash-moss)' : 'var(--paper)',
              border: myBeacon ? '1px solid var(--moss)' : '1px solid var(--border)',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '10px',
              fontWeight: 700,
              color: myBeacon ? 'var(--moss-text)' : 'var(--ink-soft)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Radio size={10} color={myBeacon ? 'var(--moss)' : 'var(--ochre)'} className={myBeacon ? 'animate-pulse' : ''} />
            <span>{myBeacon ? `${myBeacon.emoji} ${myBeacon.zone}` : 'Beacon'}</span>
          </button>
        </div>
      </div>

      {/* 2. Center: Command Palette / Spotlight Search (⌘K) */}
      <div style={{
        flex: '1 1 auto',
        maxWidth: '420px',
        minWidth: '180px',
        margin: '0 16px'
      }}>
        <button
          onClick={() => {
            playTactileClick(700);
            onOpenSearch?.();
          }}
          title="Search batchmates, courses, faculty, venues (⌘K)"
          aria-label="Search batchmates and courses"
          style={{
            width: '100%',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px 0 12px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '9999px',
            color: 'var(--ink-soft)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            gap: '8px'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
            <Search size={13} color="var(--ink-soft)" style={{ flexShrink: 0 }} />
            <span style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '12px',
              color: 'var(--ink-soft)'
            }}>
              Search batchmates, courses, faculty...
            </span>
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
            gap: '2px',
            flexShrink: 0
          }}>
            <Command size={10} /> K
          </kbd>
        </button>
      </div>

      {/* 3. Right: Clustered Actions (AI, Focus Audio, System Capsule, Sync) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

        {/* Action 1: Astra AI Copilot Trigger */}
        <button
          onClick={() => {
            playTactileClick(850);
            onToggleInspector?.();
          }}
          title="Toggle Astra Copilot & Context Inspector"
          aria-label="Toggle Astra Copilot"
          style={{
            height: '32px',
            padding: '0 12px',
            backgroundColor: isInspectorOpen ? 'var(--ink)' : 'var(--wash-mizu)',
            border: isInspectorOpen ? '1px solid var(--ink)' : '1px solid rgba(0, 169, 184, 0.35)',
            borderRadius: '8px',
            color: isInspectorOpen ? 'var(--paper)' : 'var(--mizu)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            transition: 'all 0.15s ease',
            boxShadow: isInspectorOpen ? '0 2px 8px rgba(0, 169, 184, 0.25)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (!isInspectorOpen) e.currentTarget.style.backgroundColor = 'rgba(0, 169, 184, 0.2)';
          }}
          onMouseLeave={(e) => {
            if (!isInspectorOpen) e.currentTarget.style.backgroundColor = 'var(--wash-mizu)';
          }}
        >
          <Sparkles size={13} color={isInspectorOpen ? 'var(--mizu)' : 'currentColor'} />
          <span>Astra Copilot</span>
          <span style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: isInspectorOpen ? 'var(--mizu)' : 'var(--moss)',
            boxShadow: isInspectorOpen ? '0 0 6px var(--mizu)' : 'none'
          }} />
        </button>

        {/* Action 2: Quick Tour Button */}
        <button
          onClick={() => {
            playTactileClick(700);
            onOpenQuickTour?.();
          }}
          title="Take 30-sec Quick Tour (How XL-Flow Works)"
          aria-label="Take Quick Tour"
          style={{
            height: '32px',
            padding: '0 10px',
            backgroundColor: 'var(--wash-ochre)',
            border: '1px solid rgba(194, 145, 58, 0.35)',
            borderRadius: '8px',
            color: 'var(--ochre-text)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(194, 145, 58, 0.22)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--wash-ochre)';
          }}
        >
          <Sparkles size={12} color="var(--ochre)" />
          <span className="topbar-hide-1280">Quick Tour</span>
        </button>

        {/* Action 3: 432Hz Focus Sound Engine */}
        <button
          onClick={() => {
            playTactileClick(600);
            onToggleAmbient?.();
          }}
          title={isAmbientOn ? 'Pause 432Hz Focus Soundscape (M)' : 'Play 432Hz Meditative Soundscape (M)'}
          aria-label="Toggle 432Hz Focus Soundscape"
          style={{
            height: '32px',
            padding: '0 10px',
            backgroundColor: isAmbientOn ? 'var(--wash-moss)' : 'var(--paper)',
            border: isAmbientOn ? '1px solid var(--moss)' : '1px solid var(--border)',
            borderRadius: '8px',
            color: isAmbientOn ? 'var(--moss-text)' : 'var(--ink)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <Headphones size={13} color={isAmbientOn ? 'var(--moss)' : 'var(--ink-soft)'} />
          <span className="topbar-hide-1280">432Hz</span>
          {isAmbientOn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '12px' }}>
              <span className="equalizer-bar-1" style={{ width: '2px', backgroundColor: 'var(--moss)', borderRadius: '1px' }} />
              <span className="equalizer-bar-2" style={{ width: '2px', backgroundColor: 'var(--moss)', borderRadius: '1px' }} />
              <span className="equalizer-bar-3" style={{ width: '2px', backgroundColor: 'var(--moss)', borderRadius: '1px' }} />
            </div>
          )}
        </button>

        {/* Action 3: Segmented System Toolbar Capsule */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '2px',
          gap: '1px'
        }}>
          {/* AI Vault / Model Key Settings */}
          <button
            onClick={() => {
              playTactileClick(700);
              onOpenAiSettings?.();
            }}
            title="AI Model Vault (Gemini, Groq, OpenRouter)"
            aria-label="AI Model Vault"
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)';
              e.currentTarget.style.color = 'var(--mizu)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--ink-soft)';
            }}
          >
            <Cpu size={14} />
          </button>

          {/* Student Manual / Booklet */}
          <button
            onClick={() => {
              playTactileClick(700);
              onOpenBooklet?.();
            }}
            title="Student Documentation & Guide"
            aria-label="Student Manual"
            className="topbar-hide-1120"
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)';
              e.currentTarget.style.color = 'var(--ink)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--ink-soft)';
            }}
          >
            <BookOpen size={14} />
          </button>

          {/* Keyboard Shortcuts (?) */}
          <button
            onClick={() => {
              playTactileClick(700);
              onOpenShortcuts?.();
            }}
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard Shortcuts"
            className="topbar-hide-1120"
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)';
              e.currentTarget.style.color = 'var(--ink)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--ink-soft)';
            }}
          >
            <HelpCircle size={14} />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => {
              playTactileClick(800);
              onToggleTheme?.();
            }}
            title="Toggle Light / Dark Theme (T)"
            aria-label="Toggle Theme"
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--ink)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {theme === 'dark' ? <Sun size={14} color="var(--ochre)" /> : <Moon size={14} color="var(--indigo)" />}
          </button>
        </div>

        {/* Action 4: Single Dedicated Mobile View Switcher */}
        <button
          onClick={() => {
            playTactileClick(750);
            onToggleLayoutMode?.();
          }}
          title="Switch to Mobile Phone View"
          aria-label="Switch to Mobile View"
          style={{
            height: '32px',
            padding: '0 10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--ink)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 600,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--mizu)';
            e.currentTarget.style.color = 'var(--mizu)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--ink)';
          }}
        >
          <Smartphone size={13} color="var(--mizu)" />
          <span className="topbar-hide-1120">Mobile</span>
        </button>

        {/* Action 5: Live ERP Cloud Sync & Indicator */}
        <button
          onClick={() => {
            playTactileClick(650);
            onRefresh?.();
          }}
          disabled={isSyncing}
          title="Sync Attendance & Timetable from xlerp.xlri.ac.in"
          aria-label="Sync ERP"
          style={{
            height: '32px',
            padding: '0 10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--ink)',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!isSyncing) e.currentTarget.style.borderColor = 'var(--moss)';
          }}
          onMouseLeave={(e) => {
            if (!isSyncing) e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <RefreshCw
            size={12}
            className={isSyncing ? 'animate-spin' : ''}
            color={isSyncing ? 'var(--ochre)' : 'var(--ink-soft)'}
          />
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isSyncing ? 'var(--ochre)' : 'var(--moss)',
            boxShadow: isSyncing ? '0 0 6px var(--ochre)' : '0 0 4px rgba(22, 163, 74, 0.4)'
          }} />
          <span className="topbar-hide-1280" style={{ color: 'var(--ink-soft)' }}>Sync</span>
        </button>

      </div>
    </header>
  );
}

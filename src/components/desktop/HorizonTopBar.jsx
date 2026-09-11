import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  Sparkles,
  Headphones,
  RefreshCw,
  Sun,
  Moon,
  MoreHorizontal,
  Smartphone,
  BookOpen,
  Cpu,
  HelpCircle,
  Radio,
  LogOut
} from 'lucide-react';
import XlFlowLogo from '../XlFlowLogo';
import DynamicAmbientIsland from '../DynamicAmbientIsland';
import { playTactileClick, playSoftClick } from '../../services/soundEngine';
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
  onOpenQuickTour,
  schedule = [],
  courses = [],
  deadlines = [],
  onInspectSession,
  onSelectTab
}) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [myBeacon, setMyBeacon] = useState(() => socialApi.getMyStatus());
  const moreMenuRef = useRef(null);

  // Subscribe to beacon updates
  useEffect(() => {
    const unsub = socialApi.subscribe((e) => {
      if (e.type === 'STATUS_UPDATED' || e.type === 'STATUS_CLEARED') {
        setMyBeacon(socialApi.getMyStatus());
      }
    });
    return unsub;
  }, []);

  // Close more menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isMoreMenuOpen]);

  const initials = student?.name
    ? student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'JS';

  return (
    <header style={{
      height: '52px',
      backgroundColor: 'var(--card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 18px',
      position: 'relative',
      zIndex: 30,
      userSelect: 'none',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* 1. Left: Streamlined Brand & Clean Student Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <XlFlowLogo size={26} />
          <span style={{
            fontFamily: 'var(--font-brand)',
            fontSize: '16px',
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
          <span
            title="Connected to XLRI ERP & Local Cache"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--moss)',
              boxShadow: '0 0 6px rgba(110, 140, 99, 0.7)',
              marginLeft: '2px'
            }}
          />
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border)' }} />

        {/* Student Profile Pill */}
        <div
          title={`Student: ${student?.name || 'Janmejai Singh'} (${student?.id || 'B25349'}) • Term-5`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            backgroundColor: 'var(--paper)',
            padding: '3px 9px',
            borderRadius: '9999px',
            border: '1px solid var(--border)',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{
            width: '18px',
            height: '18px',
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
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
            {student?.name || 'Janmejai Singh'}
          </span>
          <span style={{
            fontSize: '9.5px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink-soft)',
            backgroundColor: 'var(--card)',
            padding: '1px 4px',
            borderRadius: '3px',
            border: '1px solid var(--border)'
          }}>
            {student?.id || 'B25349'}
          </span>
        </div>
      </div>

      {/* 2. Center: Perfectly Centered Dynamic Ambient Island + Sleek Search Trigger */}
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        pointerEvents: 'auto'
      }}>
        <DynamicAmbientIsland
          schedule={schedule}
          courses={courses}
          deadlines={deadlines}
          isAmbientOn={isAmbientOn}
          onToggleAmbient={onToggleAmbient}
          onInspectSession={onInspectSession}
          onSelectTab={onSelectTab}
          isCompact={false}
        />

        {/* Compact Search Trigger */}
        <button
          onClick={() => {
            playTactileClick(700);
            onOpenSearch?.();
          }}
          title="Search 178 batchmates, courses, venues (⌘K)"
          aria-label="Search batchmates and courses"
          style={{
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 10px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '9999px',
            color: 'var(--ink-soft)',
            fontSize: '11.5px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--mizu)';
            e.currentTarget.style.backgroundColor = 'var(--card)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.backgroundColor = 'var(--paper)';
          }}
        >
          <Search size={13} color="var(--ink-soft)" />
          <span className="topbar-search-label" style={{ fontWeight: 500 }}>Search</span>
          <kbd style={{
            fontSize: '9.5px',
            padding: '1px 5px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <Command size={9} /> K
          </kbd>
        </button>
      </div>

      {/* 3. Right: Astra Copilot + Consolidated Minimalist Glass Utility Cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Primary AI Trigger: Astra Copilot */}
        <button
          onClick={() => {
            playTactileClick(850);
            onToggleInspector?.();
          }}
          title="Toggle Astra Copilot & Context Inspector"
          aria-label="Toggle Astra Copilot"
          style={{
            height: '32px',
            padding: '0 11px',
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

        {/* Consolidated Minimalist Utility Capsule */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '2px',
          gap: '1px'
        }}>
          {/* 432Hz Focus Audio Toggle */}
          <button
            onClick={() => {
              playTactileClick(600);
              onToggleAmbient?.();
            }}
            title={isAmbientOn ? 'Pause 432Hz Focus Soundscape (M)' : 'Play 432Hz Meditative Soundscape (M)'}
            aria-label="Toggle 432Hz Audio"
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isAmbientOn ? 'var(--wash-moss)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: isAmbientOn ? 'var(--moss-text)' : 'var(--ink-soft)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              if (!isAmbientOn) e.currentTarget.style.backgroundColor = 'var(--card)';
            }}
            onMouseLeave={(e) => {
              if (!isAmbientOn) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Headphones size={13} color={isAmbientOn ? 'var(--moss)' : 'currentColor'} />
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
            {theme === 'dark' ? <Sun size={13} color="var(--ochre)" /> : <Moon size={13} color="var(--indigo)" />}
          </button>

          {/* ERP Sync Button */}
          <button
            onClick={() => {
              playTactileClick(650);
              onRefresh?.();
            }}
            disabled={isSyncing}
            title="Sync Attendance & Schedule from ERP"
            aria-label="Sync ERP"
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: isSyncing ? 'var(--ochre)' : 'var(--ink-soft)',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              if (!isSyncing) e.currentTarget.style.backgroundColor = 'var(--card)';
            }}
            onMouseLeave={(e) => {
              if (!isSyncing) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <RefreshCw
              size={12}
              className={isSyncing ? 'animate-spin motion-reduce:animate-none' : ''}
              color={isSyncing ? 'var(--ochre)' : 'currentColor'}
            />
          </button>

          {/* More Menu Dropdown Trigger (•••) */}
          <div ref={moreMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                playSoftClick(750);
                setIsMoreMenuOpen(prev => !prev);
              }}
              title="More Options & Tools"
              aria-label="More Options Menu"
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isMoreMenuOpen ? 'var(--card)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: isMoreMenuOpen ? 'var(--mizu)' : 'var(--ink-soft)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                if (!isMoreMenuOpen) e.currentTarget.style.backgroundColor = 'var(--card)';
              }}
              onMouseLeave={(e) => {
                if (!isMoreMenuOpen) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <MoreHorizontal size={14} />
            </button>

            {/* Floating Glassmorphic More Menu */}
            {isMoreMenuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '210px',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '6px',
                boxShadow: 'var(--shadow-lg), 0 12px 28px rgba(0,0,0,0.18)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                animation: 'sectorFadeIn 0.15s ease-out'
              }}>
                {/* 1. Quick Tour */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    playTactileClick(700);
                    onOpenQuickTour?.();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: 'var(--ochre-text)',
                    backgroundColor: 'var(--wash-ochre)',
                    border: '1px solid rgba(194, 145, 58, 0.25)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.12s'
                  }}
                >
                  <Sparkles size={13} color="var(--ochre)" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Feature Tour</span>
                    <span style={{ fontSize: '9.5px', color: 'var(--ochre-text)', opacity: 0.8, fontWeight: 500 }}>
                      30-sec visual overview
                    </span>
                  </div>
                </button>

                {/* 2. Switch to Mobile View */}
                {onToggleLayoutMode && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      playTactileClick(750);
                      onToggleLayoutMode();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background-color 0.12s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--paper)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Smartphone size={13} color="var(--mizu)" />
                    <span>Mobile Phone View</span>
                  </button>
                )}

                {/* 3. AI Model Vault */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    playTactileClick(700);
                    onOpenAiSettings?.();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background-color 0.12s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--paper)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Cpu size={13} color="var(--ink-soft)" />
                  <span>AI Model Vault</span>
                </button>

                {/* 4. Student Handbook */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    playTactileClick(700);
                    onOpenBooklet?.();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background-color 0.12s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--paper)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <BookOpen size={13} color="var(--ink-soft)" />
                  <span>Student Handbook</span>
                </button>

                {/* 5. Keyboard Shortcuts */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    playTactileClick(700);
                    onOpenShortcuts?.();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'background-color 0.12s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--paper)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <HelpCircle size={13} color="var(--ink-soft)" />
                    <span>Shortcuts</span>
                  </div>
                  <kbd style={{
                    fontSize: '9.5px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ink-soft)',
                    backgroundColor: 'var(--paper)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    border: '1px solid var(--border)'
                  }}>?</kbd>
                </button>

                {/* 6. Broadcast Beacon */}
                {onOpenBeaconModal && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      playTactileClick(700);
                      onOpenBeaconModal();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background-color 0.12s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--paper)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Radio size={13} color={myBeacon ? 'var(--moss)' : 'var(--ochre)'} />
                    <span>{myBeacon ? `Beacon: ${myBeacon.zone}` : 'Broadcast Beacon'}</span>
                  </button>
                )}

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '3px 0' }} />

                {/* 7. Logout */}
                {onLogout && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onLogout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: 'var(--hanko)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background-color 0.12s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--wash-hanko)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={13} color="var(--hanko)" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

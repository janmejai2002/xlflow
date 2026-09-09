import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, RefreshCw, LogOut, Sparkles, Search, Share2, Flame, Headphones, Bot, BookOpen, MoreHorizontal, X } from 'lucide-react';
import { fireStreakConfetti } from '../services/confetti';
import { toast } from 'sonner';

export default function Header({
  student,
  isDemo,
  theme,
  onToggleTheme,
  onRefresh,
  onLogout,
  isSyncing,
  onOpenSearch,
  onOpenShareCard,
  isAmbientOn,
  onToggleAmbient,
  onOpenCopilot,
  onOpenBooklet
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isMoreOpen]);
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backgroundColor: 'var(--paper-subtle)',
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(10px)',
      padding: 'max(10px, env(safe-area-inset-top, 10px)) 12px 10px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px'
    }}>
      {/* Left: Brand & Student Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--mizu)',
          flexShrink: 0
        }}>
          <Sparkles size={17} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '17px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              whiteSpace: 'nowrap'
            }}>
              XL-Flow
            </span>
            {isDemo && (
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '1px 5px',
                borderRadius: '9999px',
                backgroundColor: 'var(--wash-ochre)',
                color: 'var(--ochre-text)',
                border: '1px solid rgba(194, 145, 58, 0.25)',
                whiteSpace: 'nowrap'
              }}>
                DEMO
              </span>
            )}
            <button
              onClick={() => {
                fireStreakConfetti();
                toast.success('🔥 8-Day Attendance Streak Active!', {
                  description: 'Zero unexcused absences. Academic momentum is high!'
                });
              }}
              title="Click to celebrate streak!"
              aria-label="Attendance streak: 8 days active"
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: '9999px',
                backgroundColor: 'var(--wash-moss)',
                color: 'var(--moss-text)',
                border: '1px solid rgba(110, 140, 99, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                cursor: 'pointer',
                transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Flame size={11} style={{ fill: 'currentColor' }} />
              <span className="hide-below-380">8d Streak</span>
              <span style={{ display: 'none' }} className="show-below-380">8d</span>
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {student?.term || 'Term-5'} • {student?.campus || 'XLRI Delhi-NCR'}
          </p>
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        {/* Quick Batch Roster Search */}
        <button
          onClick={onOpenSearch}
          title="Search 178 batchmates (Ctrl+K)"
          aria-label="Search batch roster"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0 7px',
            height: '34px',
            minWidth: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            color: 'var(--ink)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600
          }}
        >
          <Search size={14} style={{ color: 'var(--ink-soft)' }} />
          <span className="hide-below-480" style={{
            fontSize: '10px',
            color: 'var(--ink-soft)',
            backgroundColor: 'var(--paper)',
            padding: '1px 4px',
            borderRadius: '4px',
            border: '1px solid var(--border)'
          }}>
            ⌘K
          </span>
        </button>

        {/* Student Manual / Instruction Booklet */}
        <button
          onClick={onOpenBooklet}
          title="Student Guide & Instruction Booklet"
          aria-label="Open student instruction booklet"
          className="hide-below-500"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <BookOpen size={14} style={{ color: 'var(--mizu)' }} />
        </button>

        {/* Share Academic Pass */}
        <button
          onClick={onOpenShareCard}
          title="Generate Social Academic Pass"
          aria-label="Generate shareable student pass"
          className="hide-below-500"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mizu)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Share2 size={14} />
        </button>

        {/* 432Hz Generative Campus Focus Soundscape */}
        <button
          onClick={onToggleAmbient}
          title={isAmbientOn ? "Pause 432Hz Study Soundscape" : "Play 432Hz Meditative Study Soundscape"}
          aria-label="Toggle 432Hz study focus audio"
          className="hide-below-500"
          style={{
            background: isAmbientOn ? 'var(--wash-mizu)' : 'var(--card)',
            border: `1px solid ${isAmbientOn ? 'rgba(0, 169, 184, 0.4)' : 'var(--border)'}`,
            borderRadius: '8px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isAmbientOn ? 'var(--mizu)' : 'var(--ink-soft)',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Headphones size={14} style={{ animation: isAmbientOn ? 'pulse 2s infinite' : 'none' }} />
        </button>

        {/* Astra Neural Co-Pilot Trigger */}
        <button
          onClick={onOpenCopilot}
          title="Open Astra Neural Co-Pilot"
          aria-label="Open Astra Neural Co-Pilot AI"
          style={{
            background: 'var(--ink)',
            border: 'none',
            borderRadius: '8px',
            padding: '0 8px',
            height: '34px',
            minWidth: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            color: 'var(--mizu)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(0, 169, 184, 0.25)',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Sparkles size={13} />
          <span className="hide-below-380" style={{ color: 'var(--paper)' }}>Astra</span>
        </button>

        {/* Refresh Sync */}
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          title="Refresh Schedule"
          aria-label="Refresh timetable and attendance sync"
          className="hide-below-500"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
        </button>

        {/* Toggle Theme */}
        <button
          onClick={onToggleTheme}
          title="Toggle Theme"
          aria-label="Toggle light and dark theme mode"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Switch / Logout */}
        <button
          onClick={onLogout}
          title="Logout / Switch Account"
          aria-label="Logout or switch student profile"
          className="hide-below-500"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--hanko)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <LogOut size={14} />
        </button>

        {/* Mobile "More" Menu Toggle (visible only below 500px) */}
        <div style={{ position: 'relative' }} ref={menuRef} className="hide-above-500">
          <button
            onClick={() => setIsMoreOpen(prev => !prev)}
            aria-label="More actions"
            style={{
              background: isMoreOpen ? 'var(--card-hover)' : 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink)',
              cursor: 'pointer'
            }}
          >
            <MoreHorizontal size={17} />
          </button>

          {/* Floating Dropdown for secondary mobile actions */}
          {isMoreOpen && (
            <div style={{
              position: 'absolute',
              top: '42px',
              right: 0,
              width: '210px',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '6px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              animation: 'fadeIn 0.15s ease-out'
            }}>
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenBooklet();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ink)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--stone)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <BookOpen size={15} style={{ color: 'var(--mizu)' }} />
                <span>Student Booklet</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenShareCard();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ink)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--stone)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Share2 size={15} style={{ color: 'var(--mizu)' }} />
                <span>Share Academic Pass</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onToggleAmbient();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: isAmbientOn ? 'var(--mizu)' : 'var(--ink)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--stone)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Headphones size={15} style={{ color: isAmbientOn ? 'var(--mizu)' : 'var(--ink-soft)' }} />
                <span>{isAmbientOn ? 'Pause 432Hz Sound' : 'Play 432Hz Sound'}</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onRefresh();
                }}
                disabled={isSyncing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ink)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--stone)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <RefreshCw size={15} style={{ color: 'var(--indigo)', animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                <span>Sync with ERP</span>
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '2px 4px' }} />

              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onLogout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--hanko)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--wash-hanko)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={15} />
                <span>Switch / Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

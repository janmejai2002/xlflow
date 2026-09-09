import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, RefreshCw, LogOut, Sparkles, Search, Share2, Flame, Headphones, Bot, BookOpen, MoreHorizontal, X, Monitor } from 'lucide-react';
import { fireStreakConfetti } from '../services/confetti';
import { toast } from 'sonner';
import XlFlowLogo from './XlFlowLogo';

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
  onOpenBooklet,
  onToggleLayoutMode
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
        <XlFlowLogo size={32} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
            <span style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '17px',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
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
            <button
              onClick={() => {
                fireStreakConfetti();
                toast.success('🔥 8-Day Attendance Streak Active!', {
                  description: 'Zero unexcused absences. Academic momentum is high!'
                });
              }}
              title="Click to celebrate streak!"
              aria-label="Attendance streak: 8 days active"
              className="hide-below-520"
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
              <span>8d Streak</span>
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

        {/* Astra Neural Co-Pilot Trigger */}
        <button
          onClick={onOpenCopilot}
          title="Open Astra Neural Co-Pilot"
          aria-label="Open Astra Neural Co-Pilot AI"
          style={{
            background: 'var(--wash-mizu)',
            border: '1px solid rgba(0, 169, 184, 0.35)',
            borderRadius: '8px',
            padding: '0 9px',
            height: '34px',
            minWidth: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            color: 'var(--mizu)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(0, 169, 184, 0.15)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.04)';
            e.currentTarget.style.borderColor = 'rgba(0, 169, 184, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'rgba(0, 169, 184, 0.35)';
          }}
        >
          <Sparkles size={13} color="var(--mizu)" />
          <span className="hide-below-380" style={{ color: 'var(--mizu)', fontWeight: 700 }}>Astra</span>
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

        {/* Mobile "More" Menu Toggle (Always accessible) */}
        <div style={{ position: 'relative' }} ref={menuRef}>
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
                  onToggleLayoutMode?.();
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
                <Monitor size={15} style={{ color: 'var(--mizu)' }} />
                <span>Desktop Panoramic View</span>
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

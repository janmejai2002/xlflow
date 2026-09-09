import React from 'react';
import { Sun, Moon, RefreshCw, LogOut, Sparkles, Search, Share2, Flame, Headphones, Bot, BookOpen } from 'lucide-react';
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
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backgroundColor: 'var(--paper-subtle)',
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(10px)',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Left: Brand & Student Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--mizu)'
        }}>
          <Sparkles size={17} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--ink)'
            }}>
              XL-Flow
            </span>
            {isDemo && (
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: '9999px',
                backgroundColor: 'var(--wash-ochre)',
                color: 'var(--ochre)',
                border: '1px solid rgba(194, 145, 58, 0.25)'
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
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'var(--wash-moss)',
                color: 'var(--moss)',
                border: '1px solid rgba(110, 140, 99, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Flame size={11} style={{ fill: 'currentColor' }} /> 8d Streak
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: 0 }}>
            {student?.term || 'Term-5'} • {student?.campus || 'XLRI Delhi-NCR'}
          </p>
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Quick Batch Roster Search */}
        <button
          onClick={onOpenSearch}
          title="Search 178 batchmates (Ctrl+K)"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0 8px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--ink)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600
          }}
        >
          <Search size={14} style={{ color: 'var(--ink-soft)' }} />
          <span style={{
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
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
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
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
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
          style={{
            background: isAmbientOn ? 'var(--wash-mizu)' : 'var(--card)',
            border: `1px solid ${isAmbientOn ? 'rgba(0, 169, 184, 0.4)' : 'var(--border)'}`,
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isAmbientOn ? 'var(--mizu)' : 'var(--ink-soft)',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Headphones size={15} style={{ animation: isAmbientOn ? 'pulse 2s infinite' : 'none' }} />
        </button>

        {/* Astra Neural Co-Pilot Trigger */}
        <button
          onClick={onOpenCopilot}
          title="Open Astra Neural Co-Pilot"
          style={{
            background: 'var(--ink)',
            border: 'none',
            borderRadius: '8px',
            padding: '0 8px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
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
          <span style={{ color: 'var(--paper)' }}>Astra</span>
        </button>

        {/* Refresh Sync */}
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          title="Refresh Schedule"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
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
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
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
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
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
      </div>
    </header>
  );
}

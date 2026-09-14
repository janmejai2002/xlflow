import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, RefreshCw, LogOut, Search, Share2, BookOpen, MoreHorizontal, X, Monitor, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import XlFlowLogo from './XlFlowLogo';
import DynamicAmbientIsland from './DynamicAmbientIsland';

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
  onOpenBooklet,
  onToggleLayoutMode,
  onOpenQuickTour,
  schedule = [],
  courses = [],
  deadlines = [],
  onSelectTab,
  onInspectSession
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
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
              <span style={{ color: 'var(--ink-faint)', margin: '0 1.5px', fontWeight: 600 }}>·</span>
              <span style={{ color: 'var(--mizu)', fontWeight: 800 }}>Flow</span>
            </span>
            <span
              className="hanko-stamp hide-below-520"
              style={{ color: 'var(--moss)', borderColor: 'rgba(var(--moss-rgb), 0.45)' }}
            >
              {student?.term || 'TERM-V'}
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {student?.term || 'Term-5'} • {student?.campus || 'XLRI Delhi-NCR'}
          </p>
        </div>
      </div>

      {/* Right: Quick Actions + Dynamic Ambient Island */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        {/* Dynamic Ambient Island (Glanceable pill) */}
        <DynamicAmbientIsland
          schedule={schedule}
          courses={courses}
          deadlines={deadlines}
          student={student}
          onInspectSession={onInspectSession}
          onSelectTab={onSelectTab}
          isCompact={true}
        />

        {/* Quick Batch Roster Search */}
        <button
          onClick={onOpenSearch}
          title="Search 178 batchmates (Ctrl+K)"
          aria-label="Search batch roster"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '9px',
            padding: '0 8px',
            height: '44px',
            minWidth: '44px',
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
          <Search size={15} style={{ color: 'var(--ink-soft)' }} />
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

        {/* Toggle Theme */}
        <button
          onClick={onToggleTheme}
          title="Toggle Theme"
          aria-label="Toggle light and dark theme mode"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '9px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Mobile "More" Menu Toggle (Always accessible) */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setIsMoreOpen(prev => !prev)}
            aria-label="More actions"
            style={{
              background: isMoreOpen ? 'var(--card-hover)' : 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '9px',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink)',
              cursor: 'pointer'
            }}
          >
            <MoreHorizontal size={18} />
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
                  onOpenQuickTour?.();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--wash-ochre)',
                  color: 'var(--ochre-text)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(var(--ochre-rgb), 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--wash-ochre)'}
              >
                <Sparkles size={15} style={{ color: 'var(--ochre)' }} />
                <span>30-Sec Quick Tour</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenBooklet?.();
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
                  onOpenShareCard?.();
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
                <span>Share Pass & Timetable</span>
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
                  onRefresh?.();
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
                  onLogout?.();
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

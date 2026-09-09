import React from 'react';
import {
  Compass,
  ShieldCheck,
  Calendar,
  Palmtree,
  CheckSquare,
  Search,
  Users,
  BookOpen,
  Share2,
  Headphones,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  Flame,
  CheckCircle2,
  Command
} from 'lucide-react';
import { fireStreakConfetti } from '../../services/confetti';
import { toast } from 'sonner';

export default function DesktopSidebar({
  activeTab,
  onSelectTab,
  student,
  isDemo,
  theme,
  onToggleTheme,
  onRefresh,
  onLogout,
  isSyncing,
  warningCount = 0,
  pendingDeadlinesCount = 0,
  onOpenSearch,
  onOpenShareCard,
  onOpenBooklet,
  onOpenGroupSynergy,
  isAmbientOn,
  onToggleAmbient
}) {
  const navItems = [
    { id: 'radar', label: 'Today Radar', icon: Compass, keyHint: '1', live: true },
    { id: 'bunkmeter', label: 'Bunk-O-Meter', icon: ShieldCheck, keyHint: '2', badge: warningCount > 0 ? warningCount : null, badgeColor: 'var(--hanko)' },
    { id: 'timetable', label: 'Weekly Matrix', icon: Calendar, keyHint: '3' },
    { id: 'trips', label: 'Getaways & Trips', icon: Palmtree, keyHint: '4' },
    { id: 'deadlines', label: 'Deadlines & Quizzes', icon: CheckSquare, keyHint: '5', badge: pendingDeadlinesCount > 0 ? pendingDeadlinesCount : null, badgeColor: 'var(--ochre)' },
  ];

  return (
    <aside style={{
      width: '240px',
      backgroundColor: 'var(--card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      userSelect: 'none',
      overflowY: 'auto'
    }}>
      {/* 1. Brand & Student Dossier Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--ink)',
              color: 'var(--mizu)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 169, 184, 0.25)'
            }}>
              <Sparkles size={16} />
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
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--wash-ochre)',
                    color: 'var(--ochre-text)',
                    border: '1px solid rgba(194, 145, 58, 0.25)'
                  }}>
                    DEMO
                  </span>
                )}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                {student?.term || 'Term-5'} • {student?.campus || 'XLRI Delhi-NCR'}
              </span>
            </div>
          </div>
        </div>

        {/* Student Profile Identity Chip */}
        <div style={{
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
              {student?.name || 'Janmejai Singh'}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--mizu)', fontWeight: 600 }}>
              {student?.rollNumber || student?.rollNo || 'B25349'}
            </span>
          </div>

          <button
            onClick={() => {
              fireStreakConfetti();
              toast.success('🔥 8-Day Attendance Streak Active!', {
                description: 'Zero unexcused absences. Academic momentum is high!'
              });
            }}
            title="Click to celebrate streak!"
            style={{
              width: '100%',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: 'var(--wash-moss)',
              color: 'var(--moss-text)',
              border: '1px solid rgba(110, 140, 99, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Flame size={12} style={{ fill: 'currentColor' }} />
            <span>8-Day Streak Active</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Module Rails */}
      <div style={{ padding: '12px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--ink-soft)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '4px 8px 6px 8px'
        }}>
          Navigation
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--paper)' : 'transparent',
                color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--stone)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={16} style={{ color: isActive ? 'var(--mizu)' : 'currentColor' }} />
                <span>{item.label}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {item.badge && (
                  <span style={{
                    backgroundColor: item.badgeColor,
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '9999px'
                  }}>
                    {item.badge}
                  </span>
                )}
                {item.live && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--mizu)',
                    boxShadow: '0 0 6px var(--mizu)'
                  }} />
                )}
                <kbd style={{
                  fontSize: '10px',
                  color: 'var(--ink-faint)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {item.keyHint}
                </kbd>
              </div>
            </button>
          );
        })}

        {/* 3. Power Tools Section */}
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--ink-soft)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '16px 8px 6px 8px'
        }}>
          Power Tools
        </div>

        <button
          onClick={onOpenSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--paper)',
            color: 'var(--ink)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--stone)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--paper)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={14} style={{ color: 'var(--ink-soft)' }} />
            <span>Batch Roster (178)</span>
          </div>
          <kbd style={{
            fontSize: '10px',
            color: 'var(--ink-soft)',
            backgroundColor: 'var(--card)',
            padding: '1px 4px',
            borderRadius: '4px',
            border: '1px solid var(--border)'
          }}>
            ⌘K
          </kbd>
        </button>

        <button
          onClick={onOpenGroupSynergy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--ink)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--stone)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Users size={14} style={{ color: 'var(--indigo)' }} />
          <span>Group Free Slot Matrix</span>
        </button>

        <button
          onClick={onOpenBooklet}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--ink)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--stone)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <BookOpen size={14} style={{ color: 'var(--mizu)' }} />
          <span>Student Manual Booklet</span>
        </button>

        <button
          onClick={onOpenShareCard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--ink)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--stone)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Share2 size={14} style={{ color: 'var(--plum)' }} />
          <span>Academic Pass Card</span>
        </button>

        {/* 4. Ambient Focus Soundscape Widget */}
        <div style={{
          marginTop: '12px',
          padding: '10px',
          borderRadius: '10px',
          backgroundColor: isAmbientOn ? 'var(--wash-mizu)' : 'var(--paper)',
          border: `1px solid ${isAmbientOn ? 'rgba(0,169,184,0.3)' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Headphones size={14} style={{ color: isAmbientOn ? 'var(--mizu)' : 'var(--ink-soft)' }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)' }}>
                432Hz Focus Audio
              </div>
              <div style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>
                {isAmbientOn ? 'Playing study drone' : 'Study soundscape'}
              </div>
            </div>
          </div>
          <button
            onClick={onToggleAmbient}
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: isAmbientOn ? 'var(--mizu)' : 'var(--card)',
              color: isAmbientOn ? '#FFFFFF' : 'var(--ink)',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}
          >
            {isAmbientOn ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>

      {/* 5. Footer: Real ERP Handshake & Controls */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--paper)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Live ERP Sync Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--moss)',
              boxShadow: '0 0 6px var(--moss)'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)' }}>
              xlerp.xlri.ac.in
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isSyncing}
            title="Force refresh schedule"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            <RefreshCw size={13} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Theme & Logout Quick Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
          <button
            onClick={onToggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--ink-soft)',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={onLogout}
            title="Switch account"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--hanko)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

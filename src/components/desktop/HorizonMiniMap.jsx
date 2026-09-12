import React from 'react';
import {
  Compass,
  Calendar,
  ShieldCheck,
  Palmtree,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Smartphone
} from 'lucide-react';
import { playTactileClick } from '../../services/soundEngine';

export const SECTORS = [
  { id: 'radar', index: 0, number: '01', name: "Today's Schedule", icon: Compass, width: 1140 },
  { id: 'timetable', index: 1, number: '02', name: 'Timetable', icon: Calendar, width: 1260 },
  { id: 'bunkmeter', index: 2, number: '03', name: 'Attendance', icon: ShieldCheck, width: 1200 },
  { id: 'trips', index: 3, number: '04', name: 'Trip Planner', icon: Palmtree, width: 1120 },
  { id: 'deadlines', index: 4, number: '05', name: 'Deadlines', icon: CheckSquare, width: 1060 }
];

export default function HorizonMiniMap({
  activeSectorIndex = 0,
  onJumpToSector,
  onPrevSector,
  onNextSector,
  scrollProgress = 0,
  onToggleLayoutMode
}) {
  const handleNodeClick = (idx) => {
    playTactileClick(600);
    onJumpToSector?.(idx);
  };

  return (
    <nav aria-label="Horizon Deck navigation" style={{
      height: '56px',
      backgroundColor: 'var(--card)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'relative',
      zIndex: 20,
      userSelect: 'none',
      backdropFilter: 'blur(16px)'
    }}>
      {/* Left: Quick Prev/Next Arrow Buttons & Mobile Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {onToggleLayoutMode && (
          <button
            onClick={() => {
              playTactileClick();
              onToggleLayoutMode();
            }}
            title="Switch back to Mobile View"
            aria-label="Switch to Mobile View"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: 'var(--mizu)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(var(--mizu-rgb), 0.3)'
            }}
          >
            <Smartphone size={13} />
            <span>Mobile</span>
          </button>
        )}
        <button
          onClick={onPrevSector}
          disabled={activeSectorIndex <= 0}
          title="Pan Left (←)"
          aria-label="Previous sector"
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 8px',
            color: 'var(--ink)',
            cursor: activeSectorIndex <= 0 ? 'not-allowed' : 'pointer',
            opacity: activeSectorIndex <= 0 ? 0.3 : 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronLeft size={15} />
        </button>

        <button
          onClick={onNextSector}
          disabled={activeSectorIndex >= SECTORS.length - 1}
          title="Pan Right (→)"
          aria-label="Next sector"
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 8px',
            color: 'var(--ink)',
            cursor: activeSectorIndex >= SECTORS.length - 1 ? 'default' : 'pointer',
            opacity: activeSectorIndex >= SECTORS.length - 1 ? 0.3 : 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronRight size={15} />
        </button>

        <span style={{ fontSize: '11px', color: 'var(--ink-soft)', marginLeft: '6px' }}>
          Sector {activeSectorIndex + 1} of {SECTORS.length}
        </span>
      </div>

      {/* Center: The Horizon Mini-Map Scrubber */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        position: 'relative'
      }}>
        {SECTORS.map((sector, idx) => {
          const Icon = sector.icon;
          const isActive = activeSectorIndex === idx;

          return (
            <button
              key={sector.id}
              onClick={() => handleNodeClick(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '10px',
                border: isActive ? '1px solid var(--mizu)' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--wash-mizu)' : 'transparent',
                color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--paper)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                color: isActive ? 'var(--mizu)' : 'var(--ink-soft)'
              }}>
                {sector.number}
              </span>

              <Icon size={14} color={isActive ? 'var(--mizu)' : 'currentColor'} />

              <span
                className="topbar-hide-980"
                style={{
                  fontSize: '11.5px',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap'
                }}
              >
                {sector.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Interaction Helper */}
      <div
        className="minimap-hide-1120"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ink-soft)' }}
      >
        <span>Switch: <kbd style={{ padding: '2px 5px', backgroundColor: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>1-5</kbd> or <kbd style={{ padding: '2px 5px', backgroundColor: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>← / →</kbd></span>
      </div>
    </nav>
  );
}

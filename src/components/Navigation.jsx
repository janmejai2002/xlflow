import React from 'react';
import { IconRadar, IconBunkMeter, IconTimetable, IconTrips, IconDeadlines } from './icons';

export default function Navigation({ activeTab, onSelectTab, warningCount, pendingDeadlinesCount }) {
  const tabs = [
    { id: 'radar', label: 'Today', icon: IconRadar },
    { id: 'bunkmeter', label: 'Attendance', icon: IconBunkMeter, badge: warningCount > 0 ? warningCount : null, badgeColor: 'var(--hanko)' },
    { id: 'timetable', label: 'Classes', icon: IconTimetable },
    { id: 'trips', label: 'Trips', icon: IconTrips },
    { id: 'deadlines', label: 'Deadlines', icon: IconDeadlines, badge: pendingDeadlinesCount > 0 ? pendingDeadlinesCount : null, badgeColor: 'var(--ochre)' }
  ];

  return (
    <nav
      aria-label="Main Navigation"
      style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '540px',
      backgroundColor: 'var(--paper-subtle)',
      borderTop: '1px solid var(--border)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '6px 8px calc(6px + env(safe-area-inset-bottom, 0px))',
      zIndex: 50,
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)'
    }}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            role="tab"
            aria-selected={isActive}
            className="btn-tactile"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '6px 4px',
              minHeight: '48px',
              minWidth: '44px',
              borderRadius: '6px',
              background: isActive ? 'rgba(var(--mizu-rgb), 0.08)' : 'transparent',
              border: isActive ? '1px solid rgba(var(--mizu-rgb), 0.22)' : '1px solid transparent',
              cursor: 'pointer',
              color: isActive ? 'var(--mizu-text)' : 'var(--ink-soft)',
              transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
              flex: 1,
              maxWidth: '96px'
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={19} strokeWidth={isActive ? 1.9 : 1.5} color={isActive ? 'var(--mizu)' : 'currentColor'} />
              {tab.badge && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  backgroundColor: tab.badgeColor,
                  color: '#FFFFFF',
                  fontSize: '9px',
                  fontWeight: 700,
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}>
                  {tab.badge}
                </span>
              )}
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: isActive ? 600 : 500,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap'
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

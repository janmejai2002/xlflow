import React, { useEffect } from 'react';
import { X, Command, Sparkles } from 'lucide-react';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: '1', action: 'Jump to Radar Live HUD', category: 'Navigation' },
    { key: '2', action: 'Jump to Bunk-O-Meter', category: 'Navigation' },
    { key: '3', action: 'Jump to Weekly Timetable Matrix', category: 'Navigation' },
    { key: '4', action: 'Jump to Getaways & Trips', category: 'Navigation' },
    { key: '5', action: 'Jump to Academic Deadlines', category: 'Navigation' },
    { key: '⌘ + K', action: 'Search 178 Batchmates & Roster', category: 'Omni-Search' },
    { key: '⌘ + \\', action: 'Toggle Astra Neural Co-Pilot Dock', category: 'AI Assistant' },
    { key: 'T', action: 'Toggle Light / wAIbi-sabi Dark Theme', category: 'Appearance' },
    { key: 'M', action: 'Toggle 432Hz Generative Focus Soundscape', category: 'Audio' },
    { key: '?', action: 'Open this Keyboard Shortcuts cheat sheet', category: 'Help' },
    { key: 'Esc', action: 'Close open modal, drawer, or search', category: 'System' },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(21, 24, 29, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 110,
      animation: 'fadeIn 0.15s ease-out'
    }}>
      <div style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--ink)',
              color: 'var(--mizu)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Command size={16} />
            </div>
            <div>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: 0
              }}>
                Keyboard Shortcuts
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: 0 }}>
                Desktop power-user accelerators for instant navigation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--border)',
                borderRadius: '8px'
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 500 }}>
                {sc.action}
              </span>
              <kbd style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                borderRadius: '5px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--mizu)',
                fontFamily: 'var(--font-mono)'
              }}>
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '18px',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--ink-soft)'
        }}>
          Tip: Press <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--paper)', border: '1px solid var(--border)', color: 'var(--ink)' }}>?</kbd> anywhere outside text inputs to toggle this cheatsheet.
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Sparkles, Shield, Compass, ChevronRight, Check } from 'lucide-react';
import XlFlowLogo from './XlFlowLogo';

export default function OnboardingModal({ isOpen, onClose, onConnectErp, onTryDemo, student }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 110,
      backgroundColor: 'rgba(21, 21, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--paper)',
        color: 'var(--ink)',
        width: '100%',
        maxWidth: '460px',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Welcome Emblem */}
        <div style={{ marginBottom: '16px' }}>
          <XlFlowLogo size={52} />
        </div>

        <h2 style={{
          fontSize: '22px',
          fontWeight: 800,
          margin: '0 0 6px 0',
          fontFamily: 'var(--font-brand)',
          letterSpacing: '-0.03em'
        }}>
          Welcome to XL-Flow V1
        </h2>

        <div style={{
          fontSize: '13px',
          color: 'var(--ink-muted)',
          maxWidth: '340px',
          marginBottom: '20px',
          lineHeight: 1.5
        }}>
          Class schedules, attendance tracker, and timetable for XLRI Term-5 students.
        </div>

        {/* 3 Pillar Features */}
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ color: 'var(--moss)', fontWeight: 700 }}>🟢</div>
            <div style={{ fontSize: '12.5px' }}>
              <strong>80% Attendance Tracker:</strong> Track safe leave margins and avoid attendance penalties.
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ color: 'var(--mizu)', fontWeight: 700 }}>📅</div>
            <div style={{ fontSize: '12.5px' }}>
              <strong>28-Day Heatmap:</strong> See your class load and deadlines across the term at a glance.
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ color: 'var(--ochre)', fontWeight: 700 }}>☁️</div>
            <div style={{ fontSize: '12.5px' }}>
              <strong>Cloud & Offline Sync:</strong> Automatic Google Sheets backup and offline access.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => {
              onClose();
              if (onConnectErp) onConnectErp();
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              border: 'none',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
            }}
          >
            <span>Connect Live ERP</span>
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => {
              onClose();
              if (onTryDemo) onTryDemo();
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'transparent',
              color: 'var(--ink-muted)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Open Student Dashboard (Janmejai Singh • Term-5)
          </button>
        </div>

        <div style={{
          marginTop: '16px',
          fontSize: '11px',
          color: 'var(--ink-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Shield size={12} style={{ color: 'var(--moss)' }} />
          <span>100% Free • Open Source • Verified for Term-5</span>
        </div>
      </div>
    </div>
  );
}

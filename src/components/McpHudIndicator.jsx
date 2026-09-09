import React from 'react';
import { Bot, Radio, Sparkles } from 'lucide-react';

export default function McpHudIndicator({ isConnected, activeCommand }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '76px',
      right: '16px',
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
      pointerEvents: 'none'
    }}>
      {/* Active Remote Command Toast from External AI */}
      {activeCommand && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--ink)',
          color: 'var(--paper)',
          border: '1px solid var(--mizu)',
          padding: '8px 14px',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0, 169, 184, 0.25)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <Bot size={16} style={{ color: 'var(--mizu)', animation: 'pulse 1.5s infinite' }} />
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--mizu)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              External AI Controller
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>
              {activeCommand.message}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bridge Connection Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        padding: '4px 10px',
        borderRadius: '9999px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        fontSize: '10px',
        fontWeight: 600,
        color: 'var(--ink)'
      }}>
        <Radio
          size={12}
          style={{
            color: isConnected ? 'var(--moss)' : 'var(--ochre)',
            animation: isConnected ? 'pulse 2s infinite' : 'none'
          }}
        />
        <span>MCP Bridge:</span>
        <span style={{ color: isConnected ? 'var(--moss)' : 'var(--ochre)', fontWeight: 700 }}>
          {isConnected ? 'Live (Port 3100)' : 'Standby'}
        </span>
      </div>
    </div>
  );
}

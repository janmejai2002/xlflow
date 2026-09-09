import React, { useState } from 'react';
import { Clock, RotateCcw, Sun, Moon, Sunset, Sunrise } from 'lucide-react';
import { playTactileClick } from '../services/soundEngine';

export default function TemporalScrubber({
  simulatedHour,
  value,
  onChangeHour,
  onChange,
  onResetLive,
  onToggleLive,
  isLive = true
}) {
  const currentHour = simulatedHour !== undefined ? simulatedHour : (value !== undefined ? value : 10.5);
  const triggerChange = onChangeHour || onChange || (() => {});
  const triggerReset = onResetLive || onToggleLive || (() => {});
  const hours = [8, 10, 12, 14, 16, 18, 20];

  const getMood = (h) => {
    if (h < 11) return { label: 'Morning Light', icon: <Sunrise size={13} />, color: 'var(--ochre)' };
    if (h < 16) return { label: 'Midday Zenith', icon: <Sun size={13} />, color: 'var(--mizu)' };
    if (h < 19) return { label: 'Twilight Amber', icon: <Sunset size={13} />, color: 'var(--plum)' };
    return { label: 'Night Study', icon: <Moon size={13} />, color: 'var(--indigo)' };
  };

  const mood = getMood(currentHour);

  return (
    <div style={{
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '12px 16px',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Header: Label & Live Reset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={15} style={{ color: 'var(--mizu)' }} />
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
            Temporal Scrubber
          </span>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '9999px',
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--border)',
            color: mood.color,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {mood.icon} {mood.label}
          </span>
        </div>

        {!isLive && (
          <button
            onClick={() => {
              playTactileClick(1100);
              triggerReset();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'var(--wash-moss)',
              border: '1px solid rgba(110,140,99,0.3)',
              color: 'var(--moss)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={11} /> Snap to Live
          </button>
        )}
      </div>

      {/* Mechanical Dial Slider */}
      <div style={{ position: 'relative', padding: '6px 4px' }}>
        <input
          type="range"
          min="8"
          max="20"
          step="0.5"
          value={currentHour}
          onChange={(e) => {
            playTactileClick(600 + (parseFloat(e.target.value) - 8) * 40);
            triggerChange(parseFloat(e.target.value));
          }}
          style={{
            width: '100%',
            cursor: 'pointer',
            accentColor: 'var(--mizu)'
          }}
        />

        {/* Hour markers */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '4px',
          fontSize: '10px',
          color: 'var(--ink-soft)',
          fontWeight: 600
        }}>
          {hours.map(h => (
            <span
              key={h}
              style={{
                color: Math.abs(currentHour - h) < 0.6 ? 'var(--mizu)' : 'var(--ink-soft)',
                fontWeight: Math.abs(currentHour - h) < 0.6 ? 700 : 500,
                cursor: 'pointer'
              }}
              onClick={() => {
                playTactileClick();
                triggerChange(h);
              }}
            >
              {h}:00
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

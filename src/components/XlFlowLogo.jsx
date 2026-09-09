import React, { useId } from 'react';

/**
 * XlFlowLogo: Bespoke Geometric Vector Emblem for XL-Flow
 * Interlocking aerodynamic energy ribbons forming "X" and dynamic "Flow" wave
 * Designed for pure visual harmony across both Light and Dark modes.
 */
export default function XlFlowLogo({
  size = 32,
  showBadge = true,
  glow = true,
  className = '',
  style = {}
}) {
  const id = useId().replace(/:/g, '');
  const grad1Id = `xlf-grad-cyan-${id}`;
  const grad2Id = `xlf-grad-indigo-${id}`;

  const svgContent = (
    <svg
      width={showBadge ? size * 0.72 : size}
      height={showBadge ? size * 0.72 : size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        {/* Mizu Cyan Flow Gradient */}
        <linearGradient id={grad1Id} x1="6" y1="30" x2="30" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00A9B8" />
          <stop offset="60%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#38E1F0" />
        </linearGradient>

        {/* Deep Indigo/Plum Counter Gradient */}
        <linearGradient id={grad2Id} x1="6" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C5295" />
          <stop offset="50%" stopColor="#4E6E9C" />
          <stop offset="100%" stopColor="#00A9B8" />
        </linearGradient>
      </defs>

      {/* Aerodynamic Ribbon 2: Counter Wave (Descending from Top-Left) */}
      <path
        d="M9 9 C13 9 15 15 18 18 C21 21 23 27 27 27"
        stroke={`url(#${grad2Id})`}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* Aerodynamic Ribbon 1: Primary Ascending Kinetic Wave (From Bottom-Left to Top-Right) */}
      <path
        d="M9 27 C13 27 15 21 18 18 C21 15 23 9 27 9"
        stroke={`url(#${grad1Id})`}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Momentum Trailing Flairs */}
      <path
        d="M13 18 C15 14 17 11 21 10"
        stroke="#38E1F0"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Central Luminous Focus Node */}
      <circle cx="18" cy="18" r="4.5" fill="rgba(0, 169, 184, 0.25)" />
      <circle cx="18" cy="18" r="2.4" fill="#38E1F0" />
    </svg>
  );

  if (!showBadge) {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: glow ? 'drop-shadow(0 0 6px rgba(0, 169, 184, 0.35))' : 'none',
          ...style
        }}
      >
        {svgContent}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.round(size * 0.26)}px`,
        backgroundColor: 'var(--card)',
        background: 'linear-gradient(135deg, rgba(0, 169, 184, 0.15) 0%, rgba(78, 110, 156, 0.10) 100%)',
        border: '1px solid rgba(0, 169, 184, 0.30)',
        boxShadow: glow ? '0 2px 10px rgba(0, 169, 184, 0.16)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {svgContent}
    </div>
  );
}

/**
 * XlFlowWordmark: Premium Brand Typography for XL-Flow
 * Rendered with Plus Jakarta Sans geometric typography and luminous gradient
 */
export function XlFlowWordmark({
  size = 'md',
  showHyphen = true,
  className = '',
  style = {}
}) {
  const fontSizes = {
    xs: '13px',
    sm: '15px',
    md: '18px',
    lg: '22px',
    xl: '26px'
  };

  return (
    <span
      className={`font-brand ${className}`}
      style={{
        fontFamily: 'var(--font-brand)',
        fontSize: fontSizes[size] || size,
        fontWeight: 800,
        letterSpacing: '-0.035em',
        display: 'inline-flex',
        alignItems: 'baseline',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...style
      }}
    >
      <span style={{ color: 'var(--ink)', fontWeight: 800 }}>XL</span>
      {showHyphen && (
        <span
          style={{
            color: 'var(--mizu)',
            opacity: 0.55,
            margin: '0 0.5px',
            fontWeight: 600
          }}
        >
          -
        </span>
      )}
      <span
        style={{
          background: 'linear-gradient(135deg, var(--mizu) 0%, #4E6E9C 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 800
        }}
      >
        Flow
      </span>
    </span>
  );
}

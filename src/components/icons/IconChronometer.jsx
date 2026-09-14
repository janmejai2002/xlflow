import React from 'react';

/**
 * IconChronometer: Precision chronograph clock
 * Horological chronometer with winding crown, split pushers, and precision index graduations
 */
export function IconChronometer({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.6,
  className = '',
  ...props
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Top winding crown */}
      <rect
        x="11"
        y="1.8"
        width="2"
        height="2.4"
        rx="0.5"
        fill="currentColor"
        fillOpacity={0.2}
      />
      {/* Crown neck */}
      <line x1="12" y1="4.2" x2="12" y2="4.8" />

      {/* Split-second lap pushers */}
      <line x1="6.2" y1="4.8" x2="7.8" y2="6.4" />
      <line x1="17.8" y1="4.8" x2="16.2" y2="6.4" />

      {/* Chronometer case dial */}
      <circle cx="12" cy="13.2" r="8.5" />

      {/* Quadrant index graduations */}
      <line x1="12" y1="6.5" x2="12" y2="8" />
      <line x1="17.2" y1="13.2" x2="18.7" y2="13.2" />
      <line x1="12" y1="18.5" x2="12" y2="20" />
      <line x1="5.3" y1="13.2" x2="6.8" y2="13.2" />

      {/* Precision chronograph hands */}
      <line x1="12" y1="13.2" x2="16.2" y2="9" />
      <line x1="12" y1="13.2" x2="9" y2="11.2" />

      {/* Center jewel pinion */}
      <circle cx="12" cy="13.2" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default IconChronometer;

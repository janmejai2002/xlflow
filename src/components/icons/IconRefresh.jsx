import React from 'react';

/**
 * IconRefresh: Cyclic renewal arrows
 * Japanese ensō cyclic continuity with dual interlocking sweeps and razor-sharp arrow terminals
 */
export function IconRefresh({
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
      {/* Upper clockwise sweep */}
      <path d="M 20.5 11 A 8.5 8.5 0 0 0 5.5 7.5 L 3.5 7.5" />
      {/* Upper arrow terminal */}
      <path d="M 6.8 4.2 L 3.5 7.5 L 6.8 10.8" />

      {/* Lower counter-clockwise sweep */}
      <path d="M 3.5 13 A 8.5 8.5 0 0 0 18.5 16.5 L 20.5 16.5" />
      {/* Lower arrow terminal */}
      <path d="M 17.2 19.8 L 20.5 16.5 L 17.2 13.2" />

      {/* Center equilibrium node */}
      <circle cx="12" cy="12" r="1.2" fill="currentColor" fillOpacity={0.2} />
    </svg>
  );
}

export default IconRefresh;

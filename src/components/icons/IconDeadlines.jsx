import React from 'react';

/**
 * IconDeadlines: Academic calendar ledger / hourglass milestone
 * Academic countdown ledger with suspended precision hourglass and checkpoint notches
 */
export function IconDeadlines({
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
      {/* Outer academic ledger sheet */}
      <rect x="4.5" y="3" width="15" height="18" rx="2" />
      {/* Spine checkpoint binder notches */}
      <line x1="2.5" y1="7" x2="5.5" y2="7" />
      <line x1="2.5" y1="12" x2="5.5" y2="12" />
      <line x1="2.5" y1="17" x2="5.5" y2="17" />

      {/* Accumulated sand milestone in lower bulb */}
      <path
        d="M 10 17.5 L 12 15 L 14 17.5 Z"
        fill="currentColor"
        fillOpacity={0.2}
        stroke="none"
      />

      {/* Hourglass top & bottom plates */}
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="18" x2="16" y2="18" />

      {/* Upper bulb */}
      <path d="M 9 6 L 12 11 L 15 6" />
      {/* Lower bulb */}
      <path d="M 9 18 L 12 13 L 15 18" />

      {/* Time drip filament */}
      <line x1="12" y1="11" x2="12" y2="13" />

      {/* Urgent milestone checkpoint dot on ledger header */}
      <circle cx="16.5" cy="5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default IconDeadlines;

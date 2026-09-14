import React from 'react';

/**
 * IconRadar: Live session horizon scanner / target reticle
 * Academic session locator with sweep beam, cardinal ticks, and active course blip
 */
export function IconRadar({
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
      {/* Radar sweep sector wash */}
      <path
        d="M 12 12 L 18.7 5.3 A 9.5 9.5 0 0 1 21.5 12 Z"
        fill="currentColor"
        fillOpacity={0.14}
        stroke="none"
      />
      {/* Outer reticle perimeter ring */}
      <circle cx="12" cy="12" r="9.5" />
      {/* Inner range ring */}
      <circle cx="12" cy="12" r="5" strokeDasharray="1.5 2" strokeOpacity="0.75" />
      {/* Sweep vector beam */}
      <line x1="12" y1="12" x2="18.7" y2="5.3" />
      {/* Astronomical cardinal reticle ticks */}
      <line x1="12" y1="1.5" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22.5" />
      <line x1="1.5" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22.5" y2="12" />
      {/* Target ping blip (live classroom session) */}
      <circle cx="16.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="8.5" r="3.2" strokeWidth={1} strokeDasharray="1.5 1.5" strokeOpacity="0.6" />
      {/* Center reticle core */}
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default IconRadar;

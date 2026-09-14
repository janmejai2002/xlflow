import React from 'react';

/**
 * IconOffline: Broken signal filament
 * Telemetry broadcast arcs severed by a razor-sharp kintsugi fracture slash
 */
export function IconOffline({
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
      {/* Outer broadcast arc (broken) */}
      <path d="M 4.2 8.2 C 6.5 5.8 9.1 4.5 12 4.5 C 13.6 4.5 15.2 4.9 16.6 5.6" />

      {/* Middle broadcast arc (broken) */}
      <path d="M 7.5 11.5 C 8.8 10.3 10.3 9.5 12 9.5 C 12.8 9.5 13.6 9.7 14.3 10" />

      {/* Transmitter beacon node */}
      <circle cx="12" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.5" r="3.5" strokeOpacity="0.45" strokeDasharray="1.5 2" />

      {/* Razor-sharp diagonal fracture disconnect slash */}
      <line x1="3" y1="3" x2="21" y2="21" />

      {/* Disconnect fracture spark terminals */}
      <line x1="10.5" y1="13.5" x2="13.5" y2="10.5" strokeOpacity="0.5" />
    </svg>
  );
}

export default IconOffline;

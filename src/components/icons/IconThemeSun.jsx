import React from 'react';

/**
 * IconThemeSun: Radial compass sun
 * Astronomical astrolabe sunburst with cardinal compass rays, dashed corona ring, and astrolabe core
 */
export function IconThemeSun({
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
      {/* Central solar core wash tint */}
      <circle
        cx="12"
        cy="12"
        r="4.5"
        fill="currentColor"
        fillOpacity={0.14}
        stroke="none"
      />

      {/* Solar ring */}
      <circle cx="12" cy="12" r="4.5" />

      {/* Astrolabe solar center pivot pin */}
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />

      {/* Corona hairline orbit */}
      <circle
        cx="12"
        cy="12"
        r="7"
        strokeDasharray="1.5 2.5"
        strokeOpacity="0.4"
      />

      {/* Cardinal compass rays */}
      <line x1="12" y1="2" x2="12" y2="4.8" />
      <line x1="12" y1="19.2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.8" y2="12" />
      <line x1="19.2" y1="12" x2="22" y2="12" />

      {/* Ordinal diagonal rays */}
      <line x1="4.9" y1="4.9" x2="6.9" y2="6.9" />
      <line x1="17.1" y1="4.9" x2="19.1" y2="4.9" />
      <line x1="4.9" y1="19.1" x2="6.9" y2="17.1" />
      <line x1="17.1" y1="17.1" x2="19.1" y2="19.1" />
    </svg>
  );
}

export default IconThemeSun;

import React from 'react';

/**
 * IconCopy: Double parchment sheets
 * Overlapping manuscript folios with folded corner registration and ruled text lines
 */
export function IconCopy({
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
      {/* Rear manuscript folio */}
      <path d="M 8.5 4.5 H 18 C 18.8 4.5 19.5 5.2 19.5 6 V 15.5" />

      {/* Front parchment sheet tint */}
      <rect
        x="4.5"
        y="7.5"
        width="11.5"
        height="13"
        rx="1.5"
        fill="currentColor"
        fillOpacity={0.08}
        stroke="none"
      />

      {/* Front parchment sheet outline */}
      <rect x="4.5" y="7.5" width="11.5" height="13" rx="1.5" />

      {/* Ruled manuscript text lines */}
      <line x1="7.2" y1="11.5" x2="13.2" y2="11.5" />
      <line x1="7.2" y1="14.5" x2="12.2" y2="14.5" />
      <line x1="7.2" y1="17.5" x2="10.2" y2="17.5" />
    </svg>
  );
}

export default IconCopy;

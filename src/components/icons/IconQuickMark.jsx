import React from 'react';

/**
 * IconQuickMark: Wax seal / attendance stamp
 * Turnery stamp with handle finial, brass stamping block, and ink attendance impression
 */
export function IconQuickMark({
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
      {/* Turned handle top finial */}
      <path d="M 10 3 C 10 2 11.2 1.8 12 1.8 C 12.8 1.8 14 2 14 3 C 14 4.5 13 5.5 13 7.5 H 11 C 11 5.5 10 4.5 10 3 Z" />

      {/* Stem collar flare */}
      <path d="M 11 7.5 L 8 12.5 H 16 L 13 7.5 Z" />

      {/* Brass stamping head base block */}
      <rect
        x="5.5"
        y="12.5"
        width="13"
        height="3"
        rx="0.8"
        fill="currentColor"
        fillOpacity={0.14}
      />

      {/* Register paper baseline */}
      <line x1="3.5" y1="21.5" x2="20.5" y2="21.5" />

      {/* Stamped ink attendance mark on paper */}
      <path d="M 8.5 18.5 L 11 20 L 15.5 16.5" />
    </svg>
  );
}

export default IconQuickMark;

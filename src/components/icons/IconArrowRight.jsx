import React from 'react';

/**
 * IconArrowRight: Razor-sharp editorial directional
 * Architectural datum arrow with origin stop tick, acute chevron head, and directional nook tint
 */
export function IconArrowRight({
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
      {/* Acute chevron head nook tint */}
      <polygon
        points="14,6.5 19.5,12 14,17.5"
        fill="currentColor"
        fillOpacity={0.12}
        stroke="none"
      />

      {/* Main horizontal datum shaft */}
      <line x1="4.5" y1="12" x2="19.5" y2="12" />

      {/* Acute editorial chevron head */}
      <path d="M 14 6.5 L 19.5 12 L 14 17.5" />

      {/* Origin perpendicular datum stop */}
      <line x1="4.5" y1="9.5" x2="4.5" y2="14.5" />
    </svg>
  );
}

export default IconArrowRight;

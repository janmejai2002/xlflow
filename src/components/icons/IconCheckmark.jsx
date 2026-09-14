import React from 'react';

/**
 * IconCheckmark: Crisp editorial checkmark
 * Razor-sharp Japanese sumi-e angle meets Swiss editorial precision with anchor terminal
 */
export function IconCheckmark({
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
      {/* Secondary hairline echo */}
      <path
        d="M 8 13.5 L 10 15.5 L 16.5 8"
        strokeOpacity="0.25"
      />
      {/* Editorial checkmark primary stroke */}
      <path d="M 4.5 12.8 L 9.8 18 L 19.5 6.5" />
      {/* Anchor serif terminal at start */}
      <line x1="4.5" y1="10.8" x2="4.5" y2="12.8" />
      {/* Precision apex terminal datum pip */}
      <circle cx="19.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default IconCheckmark;

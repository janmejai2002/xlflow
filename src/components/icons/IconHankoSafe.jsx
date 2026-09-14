import React from 'react';

/**
 * IconHankoSafe: Japanese hanko seal mark for >=80% cleared
 * Traditional Japanese vermilion hanko seal mark with geometric harmony character
 */
export function IconHankoSafe({
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
      {/* Traditional hanko cinnabar wash fill */}
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="3.5"
        fill="currentColor"
        fillOpacity={0.12}
        stroke="none"
      />
      {/* Hanko cartouche border */}
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />

      {/* Hanko seal character (Geometric "安" - Safety & Peace) */}
      {/* Upper roof lintel */}
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="12" y1="6" x2="12" y2="8" />

      {/* Vertical equilibrium axis */}
      <line x1="12" y1="10" x2="12" y2="17.5" />

      {/* Harmonious protective sweeping strokes */}
      <path d="M 7.5 13.5 C 9.5 15.5 11 16.5 12 16.5" />
      <path d="M 16.5 13.5 C 14.5 15.5 13 16.5 12 16.5" />

      {/* Central clearance jewel node */}
      <circle cx="12" cy="11.5" r="1.2" fill="currentColor" stroke="none" />

      {/* Hanko carved corner registration marks */}
      <line x1="5.5" y1="5.5" x2="6.8" y2="5.5" strokeOpacity="0.5" />
      <line x1="17.2" y1="18.5" x2="18.5" y2="18.5" strokeOpacity="0.5" />
    </svg>
  );
}

export default IconHankoSafe;

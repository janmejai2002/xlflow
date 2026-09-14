import React from 'react';

/**
 * IconHankoWarning: Octagonal warning seal for tight margin (80-85% attendance)
 * Eight-sided chamfered talisman seal with warning glyph and registration corner marks
 */
export function IconHankoWarning({
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
      {/* Octagonal seal wash tint */}
      <path
        d="M 7.8 3.5 H 16.2 L 20.5 7.8 V 16.2 L 16.2 20.5 H 7.8 L 3.5 16.2 V 7.8 Z"
        fill="currentColor"
        fillOpacity={0.12}
        stroke="none"
      />
      {/* Octagonal talisman perimeter */}
      <path d="M 7.8 3.5 H 16.2 L 20.5 7.8 V 16.2 L 16.2 20.5 H 7.8 L 3.5 16.2 V 7.8 Z" />

      {/* Tapered warning pillar */}
      <path
        d="M 11.2 7.5 H 12.8 L 12.5 13.5 H 11.5 Z"
        fill="currentColor"
        stroke="none"
      />
      {/* Statutory warning node */}
      <circle cx="12" cy="16.5" r="1.2" fill="currentColor" stroke="none" />

      {/* Horological chamfer ticks */}
      <line x1="6.8" y1="6.8" x2="7.8" y2="7.8" strokeOpacity="0.6" />
      <line x1="17.2" y1="6.8" x2="16.2" y2="7.8" strokeOpacity="0.6" />
      <line x1="17.2" y1="17.2" x2="16.2" y2="16.2" strokeOpacity="0.6" />
      <line x1="6.8" y1="17.2" x2="7.8" y2="16.2" strokeOpacity="0.6" />
    </svg>
  );
}

export default IconHankoWarning;

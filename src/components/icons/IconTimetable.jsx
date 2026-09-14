import React from 'react';

/**
 * IconTimetable: Architectural lecture grid with active time tick
 * wAIbi-sabi academic docket with chamfered dossier corner and live slot indicator
 */
export function IconTimetable({
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
      {/* Active lecture block tint */}
      <rect
        x="9.5"
        y="8.5"
        width="5"
        height="5.5"
        rx="1"
        fill="currentColor"
        fillOpacity={0.14}
        stroke="none"
      />
      {/* Dossier frame with architectural chamfered corner */}
      <path d="M 6.5 3 H 19.5 C 20.3 3 21 3.7 21 4.5 V 19.5 C 21 20.3 20.3 21 19.5 21 H 4.5 C 3.7 21 3 20.3 3 19.5 V 6.5 L 6.5 3 Z" />
      {/* Top corner chamfer fold */}
      <path d="M 3 6.5 H 6.5 V 3" />
      {/* Header dividing line */}
      <line x1="3" y1="8.5" x2="21" y2="8.5" />
      {/* Period columns */}
      <line x1="9.5" y1="8.5" x2="9.5" y2="21" />
      <line x1="14.5" y1="8.5" x2="14.5" y2="21" />
      {/* Sub-row division */}
      <line x1="3" y1="14" x2="21" y2="14" strokeDasharray="1.5 2.5" />
      {/* Live active lecture time tick */}
      <line x1="1.5" y1="11.2" x2="4.5" y2="11.2" />
      <circle cx="12" cy="11.2" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default IconTimetable;

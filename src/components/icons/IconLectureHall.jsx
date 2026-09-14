import React from 'react';

/**
 * IconLectureHall: Auditorium / tiered lecture hall
 * Stepped amphitheater case study hall with concentric seating tiers and faculty dais
 */
export function IconLectureHall({
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
      {/* Middle tier subtle wash tint */}
      <path
        d="M 5.5 12 C 7.2 10.2 9.5 9 12 9 C 14.5 9 16.8 10.2 18.5 12 C 16.8 11.2 14.5 10.6 12 10.6 C 9.5 10.6 7.2 11.2 5.5 12 Z"
        fill="currentColor"
        fillOpacity={0.14}
        stroke="none"
      />

      {/* Tier 3 (Upper row arc) */}
      <path d="M 3.5 8 C 5.8 5.6 8.7 4 12 4 C 15.3 4 18.2 5.6 20.5 8" />

      {/* Tier 2 (Middle row arc) */}
      <path d="M 5.5 12 C 7.2 10.2 9.5 9 12 9 C 14.5 9 16.8 10.2 18.5 12" />

      {/* Tier 1 (Front row arc) */}
      <path d="M 8 16 C 9 14.8 10.4 14 12 14 C 13.6 14 15 14.8 16 16" />

      {/* Radial aisle stair cuts */}
      <line x1="8" y1="5.5" x2="10" y2="13" strokeDasharray="1.5 2" strokeOpacity="0.75" />
      <line x1="16" y1="5.5" x2="14" y2="13" strokeDasharray="1.5 2" strokeOpacity="0.75" />

      {/* Faculty lecture dais / stage at bottom */}
      <rect
        x="9.5"
        y="18.5"
        width="5"
        height="2.5"
        rx="0.8"
        fill="currentColor"
        fillOpacity={0.15}
      />
      {/* Lecturer focal node */}
      <circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default IconLectureHall;

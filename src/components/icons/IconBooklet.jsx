import React from 'react';

/**
 * IconBooklet: Leather-bound student handbook
 * Academic vade mecum with ribbed leather spine, ribbon bookmark, and insignia lines
 */
export function IconBooklet({
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
      {/* Ribbon bookmark tint */}
      <polygon
        points="11,3 11,10 13,8.5 15,10 15,3"
        fill="currentColor"
        fillOpacity={0.18}
        stroke="none"
      />

      {/* Book cover perimeter */}
      <path d="M 4.5 4 C 4.5 3.4 5 3 5.6 3 H 18.5 C 19.3 3 20 3.7 20 4.5 V 19.5 C 20 20.3 19.3 21 18.5 21 H 5.6 C 5 21 4.5 20.6 4.5 20 V 4 Z" />

      {/* Leather spine groove */}
      <line x1="7.5" y1="3" x2="7.5" y2="21" />

      {/* Spine rib cords */}
      <line x1="4.5" y1="7" x2="7.5" y2="7" />
      <line x1="4.5" y1="12" x2="7.5" y2="12" />
      <line x1="4.5" y1="17" x2="7.5" y2="17" />

      {/* Ribbon bookmark outline */}
      <path d="M 11 3 V 10 L 13 8.5 L 15 10 V 3" />

      {/* Cover handbook title bars */}
      <line x1="10.5" y1="13.5" x2="17" y2="13.5" />
      <line x1="10.5" y1="16.5" x2="15" y2="16.5" />
    </svg>
  );
}

export default IconBooklet;

import React from 'react';

/**
 * IconThemeMoon: Crescent ink wash
 * Calligraphic Japanese mikazuki crescent moon with celestial 4-point star and ink wash
 */
export function IconThemeMoon({
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
      {/* Crescent inner wash tint */}
      <path
        d="M 19 13.5 C 18.2 17.5 14.5 20.5 10 20.5 C 5.3 20.5 2.5 16.5 2.5 12 C 2.5 7.5 5.8 3.8 10.5 3.5 C 10.9 3.5 11.3 3.5 11.7 3.6 C 8.5 6 7.5 10.8 9.8 14.8 C 11.5 17.5 15.2 18.2 18.2 16.2 C 18.5 15.3 18.8 14.4 19 13.5 Z"
        fill="currentColor"
        fillOpacity={0.14}
        stroke="none"
      />

      {/* Mikazuki crescent outline */}
      <path d="M 19 13.5 C 18.2 17.5 14.5 20.5 10 20.5 C 5.3 20.5 2.5 16.5 2.5 12 C 2.5 7.5 5.8 3.8 10.5 3.5 C 10.9 3.5 11.3 3.5 11.7 3.6 C 8.5 6 7.5 10.8 9.8 14.8 C 11.5 17.5 15.2 18.2 18.2 16.2 C 18.5 15.3 18.8 14.4 19 13.5 Z" />

      {/* Celestial 4-point diamond star */}
      <polygon
        points="17.5,3.5 18.2,5.2 20,6 18.2,6.8 17.5,8.5 16.8,6.8 15,6 16.8,5.2"
        fill="currentColor"
        stroke="none"
      />

      {/* Subtle crater horizon feature */}
      <path d="M 7.5 14 C 8.5 14.5 9 15.5 9 16.5" strokeOpacity="0.4" />
    </svg>
  );
}

export default IconThemeMoon;

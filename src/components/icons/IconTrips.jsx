import React from 'react';

/**
 * IconTrips: Waypoint compass / natural escape path
 * Cartographic trail with compass diamond facet and mountain topography contours
 */
export function IconTrips({
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
      {/* Faceted compass diamond rose (shaded left facet) */}
      <polygon
        points="15,3 12.8,8.5 15,10.5"
        fill="currentColor"
        fillOpacity={0.16}
        stroke="none"
      />
      {/* Compass needle diamond outline */}
      <polygon points="15,3 17.2,8.5 15,10.5 12.8,8.5" />
      {/* Vertical meridian needle spine */}
      <line x1="15" y1="3" x2="15" y2="13" />
      {/* Horizontal compass arm */}
      <line x1="11" y1="8.5" x2="19" y2="8.5" />

      {/* Topographic elevation contours */}
      <path
        d="M 2.5 17.5 C 5.5 16 8.5 16.5 11.5 14.5 C 14.5 12.5 17.5 13.5 21.5 11.5"
        strokeOpacity="0.45"
      />
      <path
        d="M 4 21.5 C 7 19.5 11 19.5 14.5 18 C 17.5 17 19.5 17.5 21.5 18"
        strokeOpacity="0.3"
      />

      {/* Organic winding escape trail */}
      <path
        d="M 3.5 20 C 6.5 20 8 16 11.5 16 C 14.8 16 15 11 18 11 C 19.5 11 20.5 11.8 21.5 12.5"
      />

      {/* Origin waypoint pip */}
      <circle cx="4" cy="20" r="1.6" fill="currentColor" fillOpacity={0.25} />
      <circle cx="4" cy="20" r="0.8" fill="currentColor" stroke="none" />
      {/* Destination escape summit node */}
      <circle cx="15" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default IconTrips;

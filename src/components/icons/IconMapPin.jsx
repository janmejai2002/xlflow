import React from 'react';

/**
 * IconMapPin: Crisp geometric location pip
 * Geodetic survey bench mark with optical sight aperture and ground datum baseline
 */
export function IconMapPin({
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
      {/* Location pip teardrop perimeter */}
      <path d="M 12 2.5 C 8.4 2.5 5.5 5.4 5.5 9 C 5.5 13.8 10.8 19.8 11.5 20.6 C 11.8 20.9 12.2 20.9 12.5 20.6 C 13.2 19.8 18.5 13.8 18.5 9 C 18.5 5.4 15.6 2.5 12 2.5 Z" />

      {/* Optical sight glass aperture fill */}
      <circle
        cx="12"
        cy="9"
        r="2.8"
        fill="currentColor"
        fillOpacity={0.16}
        stroke="none"
      />

      {/* Sight aperture ring */}
      <circle cx="12" cy="9" r="2.8" />

      {/* Geodetic datum center node */}
      <circle cx="12" cy="9" r="1.1" fill="currentColor" stroke="none" />

      {/* Ground survey datum baseline */}
      <line x1="8.5" y1="22" x2="15.5" y2="22" />
    </svg>
  );
}

export default IconMapPin;

import React from 'react';

/**
 * IconSearchRoster: Prism lens / batch search
 * Optical inspection loupe scanning batch student roster lines with knurled handle
 */
export function IconSearchRoster({
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
      {/* Optical lens refraction wash */}
      <circle
        cx="10.5"
        cy="10.5"
        r="6.5"
        fill="currentColor"
        fillOpacity={0.12}
        stroke="none"
      />

      {/* Optical loupe perimeter */}
      <circle cx="10.5" cy="10.5" r="6.5" />

      {/* Roster ledger lines magnified within lens */}
      <line x1="7.2" y1="8.5" x2="13.8" y2="8.5" />
      <line x1="7.2" y1="11" x2="12" y2="11" />
      <line x1="7.2" y1="13.5" x2="10.2" y2="13.5" />

      {/* Prism refraction focal node */}
      <circle cx="14" cy="8.5" r="0.9" fill="currentColor" stroke="none" />

      {/* Tactile loupe handle */}
      <line x1="15.2" y1="15.2" x2="20.5" y2="20.5" />
      {/* Knurled collar ring */}
      <line x1="14.8" y1="17.2" x2="17.2" y2="14.8" strokeOpacity="0.75" />
      {/* Handle pommel */}
      <circle cx="20.8" cy="20.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default IconSearchRoster;

import React from 'react';

/**
 * IconStatutoryShield: Academic integrity seal with geometric crest
 * Faceted heraldic shield with meridian dividing line and statutory honor chevrons
 */
export function IconStatutoryShield({
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
      {/* Right hemisphere subtle fill */}
      <path
        d="M 12 2.5 L 19.5 5.5 V 11.5 C 19.5 16.5 16 20.5 12 22 V 2.5 Z"
        fill="currentColor"
        fillOpacity={0.12}
        stroke="none"
      />
      {/* Faceted heraldic perimeter */}
      <path d="M 12 2.5 L 19.5 5.5 V 11.5 C 19.5 16.5 16 20.5 12 22 C 8 20.5 4.5 16.5 4.5 11.5 V 5.5 Z" />
      {/* Central meridian axis */}
      <line x1="12" y1="2.5" x2="12" y2="22" />
      {/* Statutory tier chevrons */}
      <path d="M 8.5 9.5 L 12 12.5 L 15.5 9.5" />
      <path d="M 8.5 13.5 L 12 16.5 L 15.5 13.5" />
      {/* Academic apex star node */}
      <circle cx="12" cy="6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default IconStatutoryShield;

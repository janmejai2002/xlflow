import React from 'react';

/**
 * IconKeyboardNav: Mechanical keycap glyph
 * High-profile mechanical keycap with dished top dish and tactile navigation return legend
 */
export function IconKeyboardNav({
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
      {/* Outer keycap housing base */}
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />

      {/* Dished top key face tint */}
      <polygon
        points="6.8,6.8 17.2,6.8 16.2,15.2 7.8,15.2"
        fill="currentColor"
        fillOpacity={0.10}
        stroke="none"
      />

      {/* Dished top key face slope outline */}
      <polygon points="6.8,6.8 17.2,6.8 16.2,15.2 7.8,15.2" />

      {/* Tactile return command glyph */}
      <path d="M 13.5 9.5 V 12.2 H 9.5" />
      <path d="M 11.2 10.5 L 9.5 12.2 L 11.2 13.9" />

      {/* Key stem tactile notch at bottom edge */}
      <line x1="10" y1="18.2" x2="14" y2="18.2" strokeOpacity="0.6" />
    </svg>
  );
}

export default IconKeyboardNav;

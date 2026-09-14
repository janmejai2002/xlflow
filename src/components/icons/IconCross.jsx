import React from 'react';

/**
 * IconCross: Hairline cancellation cross
 * Editorial proofreader's stet deletion mark with perpendicular terminal serifs
 */
export function IconCross({
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
      {/* Subtle center diamond aperture fill */}
      <polygon
        points="12,10.2 13.8,12 12,13.8 10.2,12"
        fill="currentColor"
        fillOpacity={0.16}
        stroke="none"
      />

      {/* Main diagonal crossing hairlines */}
      <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
      <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" />

      {/* Proofreader's terminal serif ticks */}
      <line x1="4" y1="7" x2="7" y2="4" />
      <line x1="17" y1="4" x2="20" y2="7" />
      <line x1="20" y1="17" x2="17" y2="20" />
      <line x1="7" y1="20" x2="4" y2="17" />
    </svg>
  );
}

export default IconCross;

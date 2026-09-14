import React from 'react';

/**
 * IconBunkMeter: Precision statutory safety gauge / dial caliper
 * Calibrated statutory 80% attendance margin with mechanical caliper vernier base
 */
export function IconBunkMeter({
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
      {/* Safe attendance statutory zone fill (>=80% arc sector) */}
      <path
        d="M 12 13.5 L 14.2 5.3 A 8.5 8.5 0 0 1 19.8 15.5 L 12 13.5 Z"
        fill="currentColor"
        fillOpacity={0.12}
        stroke="none"
      />
      {/* Precision caliper dial arc */}
      <path d="M 4.2 15.5 A 8.5 8.5 0 1 1 19.8 15.5" />
      {/* Statutory threshold tick marks */}
      <line x1="12" y1="5" x2="12" y2="7" />
      <line x1="14.8" y1="5.6" x2="14.2" y2="7.4" />
      <line x1="4.8" y1="13.5" x2="6.8" y2="13.5" />
      <line x1="17.2" y1="13.5" x2="19.2" y2="13.5" />
      {/* Caliper needle pointing sharply to safe zone */}
      <line x1="12" y1="13.5" x2="16.5" y2="8" />
      {/* Caliper hub */}
      <circle cx="12" cy="13.5" r="2.2" fill="currentColor" fillOpacity={0.18} />
      <circle cx="12" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
      {/* Bottom vernier caliper datum rule */}
      <line x1="5.5" y1="19.5" x2="18.5" y2="19.5" />
      {/* Caliper graduations */}
      <line x1="7.5" y1="19.5" x2="7.5" y2="21.5" />
      <line x1="9.5" y1="19.5" x2="9.5" y2="21" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="14.5" y1="19.5" x2="14.5" y2="21" />
      <line x1="16.5" y1="19.5" x2="16.5" y2="21.5" />
    </svg>
  );
}

export default IconBunkMeter;

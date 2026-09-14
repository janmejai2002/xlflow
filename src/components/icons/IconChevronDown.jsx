import React from 'react';

/**
 * IconChevronDown: Razor-sharp editorial directional
 * Architectural chevron with acute apex, flared wings, and subtle guide notch
 */
export function IconChevronDown({
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
      {/* Acute downward chevron */}
      <path d="M 5.5 9 L 12 15.5 L 18.5 9" />

      {/* Apex datum accent node */}
      <circle
        cx="12"
        cy="13.2"
        r="1"
        fill="currentColor"
        fillOpacity={0.25}
        stroke="none"
      />

      {/* Guide alignment notch */}
      <line x1="12" y1="6.8" x2="12" y2="8.8" strokeOpacity="0.6" />
    </svg>
  );
}

export default IconChevronDown;

import React from 'react';

/**
 * IconDeltaReconcile: Two conflicting records delta / balance scale
 * Precision balance scale with central delta (Δ) pivot showing attendance discrepancy delta
 */
export function IconDeltaReconcile({
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
      {/* Top suspension ring */}
      <circle cx="12" cy="4.5" r="1.5" />

      {/* Central delta (Δ) fulcrum triangle */}
      <polygon
        points="12,8.5 9.5,14 14.5,14"
        fill="currentColor"
        fillOpacity={0.14}
        stroke="none"
      />
      <polygon points="12,8.5 9.5,14 14.5,14" />

      {/* Main scale balance beam */}
      <line x1="4.5" y1="8.5" x2="19.5" y2="8.5" />

      {/* Left pan (Student Record) */}
      <line x1="5" y1="8.5" x2="3.5" y2="13.5" />
      <line x1="5" y1="8.5" x2="7.5" y2="13.5" />
      <path
        d="M 2.5 13.5 C 2.5 15.8 4.5 16.5 5.5 16.5 C 6.5 16.5 8.5 15.8 8.5 13.5 Z"
        fill="currentColor"
        fillOpacity={0.10}
      />

      {/* Right pan (Official ERP Record, tilted representing delta variance) */}
      <line x1="19" y1="8.5" x2="17" y2="15.5" />
      <line x1="19" y1="8.5" x2="21" y2="15.5" />
      <path
        d="M 16 15.5 C 16 17.8 18 18.5 19 18.5 C 20 18.5 22 17.8 22 15.5 Z"
        fill="currentColor"
        fillOpacity={0.10}
      />

      {/* Delta discrepancy indicator tick */}
      <line x1="10.8" y1="17.5" x2="13.2" y2="17.5" strokeOpacity="0.75" />
    </svg>
  );
}

export default IconDeltaReconcile;

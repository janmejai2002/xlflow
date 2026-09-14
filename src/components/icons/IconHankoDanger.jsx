import React from 'react';

/**
 * IconHankoDanger: Urgent statutory debarment flag / seal (<80% attendance)
 * Diamond seal with urgent cancellation slash and statutory debarment warning pillar
 */
export function IconHankoDanger({
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
      {/* Cinnabar danger wash tint */}
      <polygon
        points="12,2.5 21.5,12 12,21.5 2.5,12"
        fill="currentColor"
        fillOpacity={0.12}
        stroke="none"
      />
      {/* Outer diamond cartouche */}
      <polygon points="12,2.5 21.5,12 12,21.5 2.5,12" />

      {/* Urgent cancellation strike slash */}
      <line x1="7" y1="7" x2="17" y2="17" />

      {/* Statutory warning beam */}
      <line x1="12" y1="6.5" x2="12" y2="12.5" />
      {/* Urgent debarment alert node */}
      <circle cx="12" cy="16.5" r="1.2" fill="currentColor" stroke="none" />

      {/* Lateral warning brackets */}
      <line x1="4.5" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="19.5" y2="12" />
    </svg>
  );
}

export default IconHankoDanger;

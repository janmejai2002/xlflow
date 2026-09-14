import React from 'react';

/**
 * IconProfessorPodium: Faculty podium / academic authority
 * Architectural rostrum with slanted lectern deck, syllabus bar, and gooseneck microphone
 */
export function IconProfessorPodium({
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
      {/* Lectern reading deck fill */}
      <polygon
        points="4.5,8 19.5,8 17.5,11 6.5,11"
        fill="currentColor"
        fillOpacity={0.14}
        stroke="none"
      />
      {/* Lectern reading deck outline */}
      <polygon points="4.5,8 19.5,8 17.5,11 6.5,11" />

      {/* Syllabus manuscript resting on deck */}
      <line x1="8" y1="6.8" x2="13.5" y2="6.8" strokeOpacity="0.75" />

      {/* Gooseneck microphone */}
      <path d="M 15.5 8 C 15.5 5.2 17.5 5 17.5 3.5" />
      <circle cx="17.5" cy="3" r="0.9" fill="currentColor" stroke="none" />

      {/* Tapered architectural pedestal column */}
      <line x1="8.5" y1="11" x2="9.5" y2="18.5" />
      <line x1="15.5" y1="11" x2="14.5" y2="18.5" />

      {/* Institution authority crest on podium front */}
      <circle cx="12" cy="14.5" r="1.4" fill="currentColor" fillOpacity={0.2} />

      {/* Stepped architectural base plinth */}
      <rect x="7" y="18.5" width="10" height="2" rx="0.5" />
      <line x1="5" y1="21.5" x2="19" y2="21.5" />
    </svg>
  );
}

export default IconProfessorPodium;

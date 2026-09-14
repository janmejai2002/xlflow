import React from 'react';

/**
 * IconSharePass: Academic credential certificate / hall ticket pass
 * Secure academic pass ticket with bilateral punch notches, validation seal, and perforated stub
 */
export function IconSharePass({
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
      {/* Security pass ticket card with bilateral notches */}
      <path d="M 4 5 C 4 4.4 4.4 4 5 4 H 19 C 19.6 4 20 4.4 20 5 V 9.5 C 18.6 9.5 18.6 11.5 20 11.5 V 19 C 20 19.6 19.6 20 19 20 H 5 C 4.4 20 4 19.6 4 19 V 11.5 C 5.4 11.5 5.4 9.5 4 9.5 Z" />

      {/* Perforated security tear stub */}
      <line x1="14.5" y1="4" x2="14.5" y2="20" strokeDasharray="1.5 2" strokeOpacity="0.75" />

      {/* Validation seal medallion */}
      <circle
        cx="8.5"
        cy="9.5"
        r="2.2"
        fill="currentColor"
        fillOpacity={0.16}
      />
      {/* Star crest inside seal */}
      <line x1="8.5" y1="8.3" x2="8.5" y2="10.7" />
      <line x1="7.3" y1="9.5" x2="9.7" y2="9.5" />

      {/* Student credential ledger lines */}
      <line x1="6.5" y1="14.5" x2="11.5" y2="14.5" />
      <line x1="6.5" y1="17" x2="10" y2="17" />

      {/* Verification stub code hashes */}
      <line x1="17" y1="8" x2="17.5" y2="8" />
      <line x1="17" y1="11" x2="17.5" y2="11" />
      <line x1="17" y1="14" x2="17.5" y2="14" />
      <line x1="17" y1="17" x2="17.5" y2="17" />
    </svg>
  );
}

export default IconSharePass;

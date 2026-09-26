import React from 'react';

/**
 * Genuine Fantasy Football (FPL) Triple Captain Chip Icon
 * Features the official Captain's Armband with bold "3C" monogram
 */
export const TripleCaptainIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Triple Captain (3C)"
  >
    {/* Captain's Armband Band */}
    <rect
      x="2.5"
      y="4.5"
      width="19"
      height="15"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.75"
      fill="currentColor"
      fillOpacity="0.15"
    />
    {/* Armband Side Stripes */}
    <path d="M5.5 5V19M18.5 5V19" stroke="currentColor" strokeWidth="1.25" opacity="0.45" />
    {/* 3C Captaincy Monogram */}
    <text
      x="12"
      y="12.5"
      textAnchor="middle"
      dominantBaseline="central"
      fill="currentColor"
      fontSize="8.5"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      letterSpacing="-0.5px"
    >
      3C
    </text>
  </svg>
);

/**
 * Genuine Fantasy Football (FPL) Bench Boost Chip Icon
 * Features the football stadium substitutes dugout bench with players and upward boost arrow
 */
export const BenchBoostIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Bench Boost (BB)"
  >
    {/* Stadium Dugout Roof / Shelter Canopy */}
    <path
      d="M3 16V8C3 5.79 4.79 4 7 4H17C19.21 4 21 5.79 21 8V16"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    {/* Bench Planks */}
    <path d="M2 15H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 15V19.5M18 15V19.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    {/* Seated Substitute Players on each wing of the bench */}
    <circle cx="6.5" cy="11.5" r="1.6" fill="currentColor" />
    <circle cx="17.5" cy="11.5" r="1.6" fill="currentColor" />
    {/* Central Upward Boost Arrow */}
    <path
      d="M12 5.5L9 8.5M12 5.5L15 8.5M12 5.5V13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Genuine Fantasy Football (FPL) Wildcard Chip Icon
 * Features the official Wildcard playing card with bold "WC" monogram and transfer sparkles
 */
export const WildcardIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Wildcard (WC)"
  >
    {/* Wildcard Card Frame */}
    <rect
      x="3.5"
      y="4"
      width="17"
      height="16"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.75"
      fill="currentColor"
      fillOpacity="0.14"
    />
    {/* Inner Card Border */}
    <rect
      x="5.5"
      y="6"
      width="13"
      height="12"
      rx="1.75"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="2 1.5"
      opacity="0.4"
    />
    {/* Top-Left Sparkle Star */}
    <path
      d="M7 7.5L7.4 8.6L8.5 9L7.4 9.4L7 10.5L6.6 9.4L5.5 9L6.6 8.6L7 7.5Z"
      fill="currentColor"
    />
    {/* Bottom-Right Sparkle Star */}
    <path
      d="M17 13.5L17.4 14.6L18.5 15L17.4 15.4L17 16.5L16.6 15.4L15.5 15L16.6 14.6L17 13.5Z"
      fill="currentColor"
    />
    {/* "WC" Bold Monogram */}
    <text
      x="12"
      y="12.5"
      textAnchor="middle"
      dominantBaseline="central"
      fill="currentColor"
      fontSize="8.5"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      letterSpacing="-0.5px"
    >
      WC
    </text>
  </svg>
);

export const FreeHitIcon = WildcardIcon;

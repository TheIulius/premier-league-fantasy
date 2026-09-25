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
 * Genuine Fantasy Football (FPL) Free Hit Chip Icon
 * Features the official squad cards shuffle with bidirectional transfer arrows and "FH" badge
 */
export const FreeHitIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Free Hit (FH)"
  >
    {/* Back Card */}
    <rect
      x="7.5"
      y="3.5"
      width="11"
      height="14"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.12"
    />
    {/* Front Card */}
    <rect
      x="3.5"
      y="6.5"
      width="11.5"
      height="14"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.75"
      fill="currentColor"
      fillOpacity="0.22"
    />
    {/* Bidirectional Transfer Swap Arrows */}
    <path
      d="M6 11.5H12M12 11.5L10 9.5M12 11.5L10 13.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 16.5H6M6 16.5L8 14.5M6 16.5L8 18.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* "FH" Badge on Back Card */}
    <text
      x="15.5"
      y="8.5"
      textAnchor="middle"
      dominantBaseline="central"
      fill="currentColor"
      fontSize="5.5"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    >
      FH
    </text>
  </svg>
);

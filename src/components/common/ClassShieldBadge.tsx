import React from 'react';
import { CLUBS } from '../../data/clubs';

interface ClassShieldBadgeProps {
  clubId: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const ClassShieldBadge: React.FC<ClassShieldBadgeProps> = ({
  clubId,
  className = '',
  size = 'sm',
  showText = true,
}) => {
  const normId = clubId === 'SCH' ? 'SCH_11_5' : clubId;
  const club = CLUBS[normId] || {
    id: normId,
    name: normId.replace('SCH_', '').replace('_', '/'),
    shortName: normId.replace('SCH_', '').replace('_', '/'),
    primaryColor: '#0284c7',
    secondaryColor: '#ffffff',
    textColor: '#ffffff',
  };

  const short = club.shortName; // e.g. "11/5", "10/2"

  const sizeDimensions = {
    xs: { w: 18, h: 22, font: 7.5 },
    sm: { w: 26, h: 32, font: 9.5 },
    md: { w: 34, h: 42, font: 11.5 },
    lg: { w: 46, h: 56, font: 15 },
  }[size];

  // Unique SVG gradient IDs based on clubId
  const gradId = `shieldGrad_${normId}`;
  const borderGradId = `shieldBorder_${normId}`;

  return (
    <svg
      width={sizeDimensions.w}
      height={sizeDimensions.h}
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transition-transform duration-150 hover:scale-110 flex-shrink-0 ${className}`}
      aria-label={club.name}
    >
      <defs>
        {/* Shield Body Gradient: Primary to Secondary */}
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={club.primaryColor} />
          <stop offset="65%" stopColor={club.primaryColor} />
          <stop offset="100%" stopColor={club.secondaryColor} />
        </linearGradient>

        {/* Shield Metallic Border Gradient */}
        <linearGradient id={borderGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="50%" stopColor={club.secondaryColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Classic European Crest / Shield Geometry */}
      <path
        d="M16 2 L29 6 C29 23 23 34 16 38 C9 34 3 23 3 6 Z"
        fill={`url(#${gradId})`}
        stroke={`url(#${borderGradId})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Interior Accent Strip: Diagonal Slash */}
      <path
        d="M29 6 L19 6 L3 24 L3 29 Z"
        fill={club.secondaryColor}
        fillOpacity="0.25"
      />

      {/* Top Banner Accent Line */}
      <path
        d="M5 8 L27 8"
        stroke="#ffffff"
        strokeWidth="0.8"
        strokeOpacity="0.4"
      />

      {/* Class Monogram (e.g. "11/5") */}
      {showText && (
        <text
          x="16"
          y="23"
          textAnchor="middle"
          dominantBaseline="central"
          fill={club.textColor || '#ffffff'}
          fontSize={sizeDimensions.font}
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5px"
          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))"
        >
          {short}
        </text>
      )}

      {/* Subtle Star at bottom point */}
      <circle cx="16" cy="33" r="1.2" fill="#ffffff" fillOpacity="0.7" />
    </svg>
  );
};

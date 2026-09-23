import React from 'react';
import { CLUBS } from '../../data/clubs';
import { Position } from '../../types/fpl';

interface KitJerseyProps {
  clubId: string;
  position: Position;
  className?: string;
}

export const KitJersey: React.FC<KitJerseyProps> = ({ clubId, position, className = 'w-10 h-10' }) => {
  const isClass11_5 = clubId === 'SCH_11_5' || clubId === 'SCH';
  const club = CLUBS[clubId] || {
    primaryColor: '#37003c',
    secondaryColor: '#ffffff',
    textColor: '#ffffff',
  };

  // Class 11/5 always wear their iconic royal white & gold jersey with crown emblem
  const isGK = position === 'GKP';
  const mainColor = isClass11_5 ? '#FFFFFF' : isGK ? '#ffe600' : club.primaryColor;
  const secondaryColor = isClass11_5 ? '#F59E0B' : isGK ? '#111111' : club.secondaryColor;
  const strokeColor = isClass11_5 ? '#451a03' : '#111111';

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-105`}
    >
      <defs>
        {isClass11_5 && (
          <linearGradient id="goldCrownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        )}
      </defs>

      {/* Jersey Body */}
      <path
        d="M20 12 L12 24 L20 28 L20 54 L44 54 L44 28 L52 24 L44 12 L38 16 C34 19 30 19 26 16 Z"
        fill={mainColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      {/* Sleeves Accent */}
      <path
        d="M20 12 L12 24 L16 26 L22 17 Z"
        fill={secondaryColor}
        stroke={strokeColor}
        strokeWidth="0.8"
      />
      <path
        d="M44 12 L52 24 L48 26 L42 17 Z"
        fill={secondaryColor}
        stroke={strokeColor}
        strokeWidth="0.8"
      />

      {/* Collar & Neck */}
      <path
        d="M26 12 C26 15 38 15 38 12 C36 10 28 10 26 12 Z"
        fill={secondaryColor}
        stroke={strokeColor}
        strokeWidth="0.8"
      />

      {isClass11_5 ? (
        /* Royal 11/5 Visible Crown Emblem */
        <g className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          {/* Crown Base Band */}
          <rect
            x="24.5"
            y="33.5"
            width="15"
            height="3"
            rx="0.8"
            fill="#D97706"
            stroke="#78350F"
            strokeWidth="0.6"
          />
          {/* Base Jewels */}
          <circle cx="27" cy="35" r="0.75" fill="#FFFFFF" />
          <circle cx="32" cy="35" r="0.9" fill="#00FF87" />
          <circle cx="37" cy="35" r="0.75" fill="#FFFFFF" />

          {/* Crown Spikes */}
          <path
            d="M24.5 33.5 L25 25.5 L28.5 29.5 L32 22 L35.5 29.5 L39 25.5 L39.5 33.5 Z"
            fill="url(#goldCrownGrad)"
            stroke="#92400E"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Crown Peak Jewels */}
          <circle cx="25" cy="25.5" r="1.1" fill="#EF4444" stroke="#7F1D1D" strokeWidth="0.4" />
          <circle cx="32" cy="22" r="1.4" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="0.4" />
          <circle cx="39" cy="25.5" r="1.1" fill="#EF4444" stroke="#7F1D1D" strokeWidth="0.4" />

          {/* Class 11/5 Text */}
          <text
            x="32"
            y="43"
            fontSize="5.2"
            fontWeight="900"
            fill="#B45309"
            textAnchor="middle"
            fontFamily="sans-serif"
            letterSpacing="0.2"
          >
            11/5
          </text>
        </g>
      ) : (
        /* Standard Center sponsor / stripe detail */
        <rect
          x="25"
          y="29"
          width="14"
          height="3.5"
          rx="1"
          fill={secondaryColor}
          opacity="0.85"
        />
      )}

      {/* Subtle folds / shading */}
      <line x1="22" y1="28" x2="22" y2="52" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      <line x1="42" y1="28" x2="42" y2="52" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
    </svg>
  );
};

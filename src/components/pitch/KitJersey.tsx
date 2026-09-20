import React from 'react';
import { CLUBS } from '../../data/clubs';
import { Position } from '../../types/fpl';

interface KitJerseyProps {
  clubId: string;
  position: Position;
  className?: string;
}

export const KitJersey: React.FC<KitJerseyProps> = ({ clubId, position, className = 'w-10 h-10' }) => {
  const club = CLUBS[clubId] || {
    primaryColor: '#37003c',
    secondaryColor: '#ffffff',
    textColor: '#ffffff',
  };

  // Goalkeepers traditionally have distinct bright neon/yellow/green shirts
  const isGK = position === 'GKP';
  const mainColor = isGK ? '#ffe600' : club.primaryColor;
  const secondaryColor = isGK ? '#111111' : club.secondaryColor;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-105`}
    >
      {/* Jersey Body */}
      <path
        d="M20 12 L12 24 L20 28 L20 54 L44 54 L44 28 L52 24 L44 12 L38 16 C34 19 30 19 26 16 Z"
        fill={mainColor}
        stroke="#111"
        strokeWidth="1.5"
      />

      {/* Sleeves Accent */}
      <path
        d="M20 12 L12 24 L16 26 L22 17 Z"
        fill={secondaryColor}
        stroke="#111"
        strokeWidth="0.8"
      />
      <path
        d="M44 12 L52 24 L48 26 L42 17 Z"
        fill={secondaryColor}
        stroke="#111"
        strokeWidth="0.8"
      />

      {/* Collar & Neck */}
      <path
        d="M26 12 C26 15 38 15 38 12 C36 10 28 10 26 12 Z"
        fill={secondaryColor}
        stroke="#111"
        strokeWidth="0.8"
      />

      {/* Center sponsor / stripe detail */}
      <rect
        x="25"
        y="29"
        width="14"
        height="3.5"
        rx="1"
        fill={secondaryColor}
        opacity="0.85"
      />

      {/* Subtle folds / shading */}
      <line x1="22" y1="28" x2="22" y2="52" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
      <line x1="42" y1="28" x2="42" y2="52" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
    </svg>
  );
};

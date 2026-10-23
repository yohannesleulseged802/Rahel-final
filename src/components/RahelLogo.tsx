import React from 'react';

interface RahelLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

export const RahelLogo: React.FC<RahelLogoProps> = ({ 
  className = '', 
  size = 38,
  showWordmark = false 
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Emblem: Obsidian rounded shield with Gold Lustre fountain pen nib & RS monogram */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 64 64" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-xs"
      >
        <defs>
          <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#FBBF24" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <radialGradient id="logoObsidian" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1C1917" />
            <stop offset="100%" stopColor="#09090B" />
          </radialGradient>
        </defs>

        {/* Outer Shield with Gold Rim */}
        <rect 
          x="2" 
          y="2" 
          width="60" 
          height="60" 
          rx="14" 
          fill="url(#logoObsidian)" 
          stroke="url(#logoGold)" 
          strokeWidth="2.5" 
        />

        {/* Fine Inner Dotted Frame */}
        <rect 
          x="5.5" 
          y="5.5" 
          width="53" 
          height="53" 
          rx="11" 
          fill="none" 
          stroke="url(#logoGold)" 
          strokeWidth="0.8" 
          strokeOpacity="0.5" 
          strokeDasharray="2 1.5" 
        />

        {/* Fountain Pen Nib & Folded Parchment Symbol */}
        <g transform="translate(32, 31)">
          {/* Parchment Wings */}
          <path 
            d="M-18,6 C-12,0 -4,2 0,6 C4,2 12,0 18,6 L15,10 C10,6 4,7 0,10 C-4,7 -10,6 -15,10 Z" 
            fill="url(#logoGold)" 
            opacity="0.85" 
          />
          {/* Pen Nib Body */}
          <path 
            d="M0,-19 L9,-4 C10,3 7,9 4,11 L0,15 L-4,11 C-7,9 -10,3 -9,-4 Z" 
            fill="url(#logoGold)" 
          />
          {/* Breather Hole and Slit */}
          <circle cx="0" cy="-3" r="2.2" fill="#0A0A0A" />
          <path d="M0,-3 L0,-19" stroke="#0A0A0A" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M0,-1 L0,14" stroke="#0A0A0A" strokeWidth="1" />
        </g>

        {/* Monogram Letters 'R' and 'S' */}
        <text 
          x="13.5" 
          y="47" 
          fontFamily="'Plus Jakarta Sans', serif" 
          fontWeight="800" 
          fontSize="10.5" 
          fill="url(#logoGold)" 
          letterSpacing="0.5"
        >
          R
        </text>
        <text 
          x="43" 
          y="47" 
          fontFamily="'Plus Jakarta Sans', serif" 
          fontWeight="800" 
          fontSize="10.5" 
          fill="url(#logoGold)" 
          letterSpacing="0.5"
        >
          S
        </text>

        {/* Diamond Star Accent */}
        <polygon 
          points="32,8.5 33,11 35.5,11.5 33.5,13 34,15.5 32,14 30,15.5 30.5,13 28.5,11.5 31,11" 
          fill="url(#logoGold)" 
        />
      </svg>

      {showWordmark && (
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight text-neutral-100 flex items-center gap-1.5">
            <span>Rahel Stationary</span>
            <span className="text-amber-400 font-serif italic text-xs font-normal">POS</span>
          </div>
          <div className="text-[10px] text-amber-500/80 font-medium tracking-wider uppercase">
            Stationery &amp; Print Atelier
          </div>
        </div>
      )}
    </div>
  );
};

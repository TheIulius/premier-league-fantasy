import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { getFormationLayout } from '../../engine/formations';
import { PlayerCard } from './PlayerCard';
import { PlayerActionSheet } from './PlayerActionSheet';
import { X, Sparkles } from 'lucide-react';

interface PitchViewProps {
  showPoints?: boolean;
}

export const PitchView: React.FC<PitchViewProps> = ({ showPoints = false }) => {
  const {
    players,
    squad,
    selectedPlayerForSwap,
    setSelectedPlayerForSwap,
    calculationResult,
  } = useFPL();

  const [activeSheetPlayerId, setActiveSheetPlayerId] = useState<string | null>(null);

  const layout = getFormationLayout(squad.players, players);

  return (
    <div className="relative w-full overflow-hidden select-none pb-4">
      {/* Swap Mode Notification Floating Bar */}
      {selectedPlayerForSwap && (
        <div className="sticky top-0 z-30 bg-[#ffe600] text-black px-3 py-2 text-xs font-black flex items-center justify-between shadow-lg animate-bounce">
          <span className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-purple-900" />
            Select another player to swap with {players[selectedPlayerForSwap]?.webName}
          </span>
          <button
            onClick={() => setSelectedPlayerForSwap(null)}
            className="p-1 hover:bg-black/10 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Football Pitch Container */}
      <div className="relative mx-2 my-2 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#125c27] bg-[#14642c]">
        {/* Grass Pattern & Stadium Markings */}
        <div className="absolute inset-0 pitch-stripes pointer-events-none opacity-95" />

        {/* Pitch White Chalk Lines (SVG) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none stroke-white/40 fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Boundary Border */}
          <rect x="10" y="10" width="calc(100% - 20px)" height="calc(100% - 20px)" strokeWidth="1.5" rx="8" />

          {/* Center Circle & Halfway Line */}
          <line x1="10" y1="50%" x2="calc(100% - 10px)" y2="50%" strokeWidth="1.5" />
          <circle cx="50%" cy="50%" r="48" strokeWidth="1.5" />
          <circle cx="50%" cy="50%" r="3" fill="rgba(255,255,255,0.6)" />

          {/* Top Penalty Area (Goalkeeper Box) */}
          <rect x="25%" y="10" width="50%" height="70" strokeWidth="1.5" />
          <rect x="36%" y="10" width="28%" height="30" strokeWidth="1.5" />
          <circle cx="50%" cy="55" r="2.5" fill="rgba(255,255,255,0.6)" />
          <path d="M 40% 80 C 45% 95, 55% 95, 60% 80" strokeWidth="1.5" />

          {/* Bottom Penalty Area */}
          <rect x="25%" y="calc(100% - 80px)" width="50%" height="70" strokeWidth="1.5" />
          <rect x="36%" y="calc(100% - 40px)" width="28%" height="30" strokeWidth="1.5" />
          <circle cx="50%" cy="calc(100% - 55px)" r="2.5" fill="rgba(255,255,255,0.6)" />
          <path d="M 40% calc(100% - 80px) C 45% calc(100% - 95px), 55% calc(100% - 95px), 60% calc(100% - 80px)" strokeWidth="1.5" />
        </svg>

        {/* Formation Header Badge */}
        <div className="relative pt-2.5 px-3 flex items-center justify-between z-10">
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-black/40 text-gray-200 backdrop-blur-xs border border-white/10">
            Formation: {layout.formationString}
          </span>
          {showPoints && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#00ff87] text-[#37003c] shadow-glow-green">
              {calculationResult.totalPoints} PTS
            </span>
          )}
        </div>

        {/* Pitch Rows */}
        <div className="relative z-10 flex flex-col justify-around min-h-[460px] py-3 px-1.5 space-y-3">
          {/* Row 1: Goalkeeper */}
          <div className="flex justify-center items-center">
            {layout.gks.map((sp) => (
              <PlayerCard
                key={sp.playerId}
                playerId={sp.playerId}
                isStarter={sp.isStarter}
                benchOrder={sp.benchOrder}
                isCaptain={sp.isCaptain}
                isViceCaptain={sp.isViceCaptain}
                onCardClick={(id) => setActiveSheetPlayerId(id)}
                showPoints={showPoints}
              />
            ))}
          </div>

          {/* Row 2: Defenders */}
          <div className="flex justify-around items-center px-1">
            {layout.defs.map((sp) => (
              <PlayerCard
                key={sp.playerId}
                playerId={sp.playerId}
                isStarter={sp.isStarter}
                benchOrder={sp.benchOrder}
                isCaptain={sp.isCaptain}
                isViceCaptain={sp.isViceCaptain}
                onCardClick={(id) => setActiveSheetPlayerId(id)}
                showPoints={showPoints}
              />
            ))}
          </div>

          {/* Row 3: Midfielders */}
          <div className="flex justify-around items-center px-1">
            {layout.mids.map((sp) => (
              <PlayerCard
                key={sp.playerId}
                playerId={sp.playerId}
                isStarter={sp.isStarter}
                benchOrder={sp.benchOrder}
                isCaptain={sp.isCaptain}
                isViceCaptain={sp.isViceCaptain}
                onCardClick={(id) => setActiveSheetPlayerId(id)}
                showPoints={showPoints}
              />
            ))}
          </div>

          {/* Row 4: Forwards */}
          <div className="flex justify-around items-center px-2">
            {layout.fwds.map((sp) => (
              <PlayerCard
                key={sp.playerId}
                playerId={sp.playerId}
                isStarter={sp.isStarter}
                benchOrder={sp.benchOrder}
                isCaptain={sp.isCaptain}
                isViceCaptain={sp.isViceCaptain}
                onCardClick={(id) => setActiveSheetPlayerId(id)}
                showPoints={showPoints}
              />
            ))}
          </div>
        </div>

        {/* Bench Dugout Bar */}
        <div className="relative z-10 bg-[#160018]/95 backdrop-blur-md border-t-2 border-[#3c0843] pt-2.5 pb-3 px-2">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-gray-300">
              Substitutes
            </span>
            <span className="text-[9px] font-medium text-gray-400">
              Auto-subs apply in bench priority order (1-3)
            </span>
          </div>

          <div className="flex justify-around items-center">
            {layout.bench.map((sp) => (
              <PlayerCard
                key={sp.playerId}
                playerId={sp.playerId}
                isStarter={sp.isStarter}
                benchOrder={sp.benchOrder}
                isCaptain={sp.isCaptain}
                isViceCaptain={sp.isViceCaptain}
                onCardClick={(id) => setActiveSheetPlayerId(id)}
                showPoints={showPoints}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Player Action Sheet Modal */}
      {activeSheetPlayerId && (
        <PlayerActionSheet
          playerId={activeSheetPlayerId}
          onClose={() => setActiveSheetPlayerId(null)}
        />
      )}
    </div>
  );
};

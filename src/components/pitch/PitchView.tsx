import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { getFormationLayout } from '../../engine/formations';
import { PlayerCard } from './PlayerCard';
import { PlayerActionSheet } from './PlayerActionSheet';
import { X, Sparkles, Shield, UserPlus } from 'lucide-react';

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
    setActiveTab,
  } = useFPL();

  const [activeSheetPlayerId, setActiveSheetPlayerId] = useState<string | null>(null);

  const layout = getFormationLayout(squad.players, players);
  const starters = squad.players.filter((p) => p.isStarter);

  // Bench slots (strictly 3 outfield reserves)
  const benchSlots = [1, 2, 3];

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
            title="Cancel substitution"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Football Pitch Container */}
      <div className="relative mx-2 md:mx-auto my-2 md:my-4 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border-2 border-[#125c27] bg-[#14642c] md:max-w-3xl lg:max-w-4xl">
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
        <div className="relative pt-2.5 md:pt-3.5 px-3 md:px-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] md:text-xs font-black uppercase px-2.5 py-0.5 md:px-3 md:py-1 rounded-full backdrop-blur-xs border flex items-center gap-1.5 shadow-md ${
                layout.isValid
                  ? 'bg-black/50 text-[#00ff87] border-[#00ff87]/30'
                  : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
              }`}
            >
              <Shield className={`w-3 h-3 ${layout.isValid ? 'text-[#00ff87]' : 'text-amber-400'}`} />
              {layout.isValid ? (
                <>Formation: {layout.formationString}</>
              ) : (
                <>Starters: {layout.pitchPositions.length}/6 (Incomplete)</>
              )}
            </span>
            {layout.isValid ? (
              <span className="hidden sm:inline-block text-[9px] font-bold text-gray-300 uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded-full border border-white/10">
                1 GK • {layout.defs.length} DEF • {layout.mids.length} MID • {layout.fwds.length} FWD
              </span>
            ) : (
              <span className="hidden sm:inline-block text-[9px] font-bold text-amber-300 uppercase tracking-wider bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                {layout.gks.length === 0 ? 'Missing Goalkeeper • ' : ''}Needs 1 GK + 5 Outfielders
              </span>
            )}
          </div>

          {showPoints && (
            <span className="text-[10px] md:text-xs font-extrabold px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-[#00ff87] text-[#37003c] shadow-glow-green">
              {calculationResult.totalPoints} PTS
            </span>
          )}
        </div>

        {/* Stadium Pitch Canvas with Dynamic Coordinates */}
        <div className="relative z-10 w-full min-h-[440px] sm:min-h-[480px] md:min-h-[560px] lg:min-h-[620px] my-1">
          {starters.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="p-3 bg-black/40 rounded-full border border-white/20">
                <UserPlus className="w-8 h-8 text-[#00ff87]" />
              </div>
              <div>
                <p className="text-sm md:text-base font-black text-white">Your Starting 6 is Empty</p>
                <p className="text-xs text-gray-300 mt-1 max-w-xs">
                  Go to Transfers to buy 1 GK, 3 Defenders, 3 Midfielders, and 2 Forwards with your £60.0m budget!
                </p>
              </div>
              <button
                onClick={() => setActiveTab('transfers')}
                className="px-4 py-2 bg-[#00ff87] text-[#37003c] font-black text-xs rounded-lg shadow-glow-green hover:bg-[#00dd75] transition-colors"
              >
                Go to Transfers
              </button>
            </div>
          ) : (
            layout.pitchPositions.map((pos) => {
              const sp = squad.players.find((p) => p.playerId === pos.playerId);
              if (!sp) return null;

              return (
                <div
                  key={pos.playerId}
                  className="absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col items-center"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <span className="text-[8px] md:text-[9px] font-black uppercase text-gray-200 bg-black/50 px-1 rounded mb-0.5 tracking-wider border border-white/10 shadow-xs">
                    {pos.roleLabel}
                  </span>
                  <PlayerCard
                    playerId={sp.playerId}
                    isStarter={sp.isStarter}
                    benchOrder={sp.benchOrder}
                    isCaptain={sp.isCaptain}
                    isViceCaptain={sp.isViceCaptain}
                    onCardClick={(id) => setActiveSheetPlayerId(id)}
                    showPoints={showPoints}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Bench Dugout Bar (Strictly 3 Reserves) */}
        <div className="relative z-10 bg-[#160018]/95 backdrop-blur-md border-t-2 border-[#3c0843] pt-2.5 md:pt-3 pb-3 md:pb-4 px-2 md:px-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] md:text-xs uppercase font-black tracking-wider text-gray-200 flex items-center gap-1.5">
              Substitutes ({layout.bench.length}/3 Reserves)
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-gray-400">
              Auto-subs apply in priority order (Sub 1 → Sub 2 → Sub 3)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-sm sm:max-w-md md:max-w-lg mx-auto">
            {benchSlots.map((order) => {
              const sp = layout.bench.find((b) => b.benchOrder === order) || layout.bench[order - 1];
              if (sp) {
                return (
                  <div key={sp.playerId} className="flex justify-center">
                    <PlayerCard
                      playerId={sp.playerId}
                      isStarter={sp.isStarter}
                      benchOrder={order}
                      isCaptain={sp.isCaptain}
                      isViceCaptain={sp.isViceCaptain}
                      onCardClick={(id) => setActiveSheetPlayerId(id)}
                      showPoints={showPoints}
                    />
                  </div>
                );
              }

              // Empty bench placeholder
              return (
                <div
                  key={`empty-bench-${order}`}
                  className="flex flex-col items-center justify-center p-2 rounded-lg border border-dashed border-white/20 bg-black/20 text-gray-500 min-h-[90px]"
                >
                  <span className="text-[10px] font-bold text-gray-400">Sub {order}</span>
                  <span className="text-[8px] text-gray-500 mt-0.5">Empty Slot</span>
                </div>
              );
            })}
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

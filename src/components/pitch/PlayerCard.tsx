import React from 'react';
import { useFPL } from '../../context/FPLContext';
import { KitJersey } from './KitJersey';
import { canSwapPlayers } from '../../engine/formations';
import { ArrowLeftRight, Check } from 'lucide-react';

interface PlayerCardProps {
  playerId: string;
  isStarter: boolean;
  benchOrder: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  onCardClick: (playerId: string) => void;
  showPoints?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  playerId,
  isStarter,
  benchOrder,
  isCaptain,
  isViceCaptain,
  onCardClick,
  showPoints = false,
}) => {
  const {
    players,
    squad,
    selectedPlayerForSwap,
    setSelectedPlayerForSwap,
    substitutePlayers,
    calculationResult,
    currentGW,
  } = useFPL();

  const player = players[playerId];
  if (!player) return null;

  const isSwapSource = selectedPlayerForSwap === playerId;
  const isSwapTargetEligible =
    selectedPlayerForSwap &&
    selectedPlayerForSwap !== playerId &&
    canSwapPlayers(selectedPlayerForSwap, playerId, squad.players, players).canSwap;

  // Breakdown for points
  const breakdown = calculationResult.playerPointsBreakdown[playerId];
  const pts = breakdown ? breakdown.finalPoints : (player.gwStats[currentGW] ? player.gwPoints : 0);
  const isAutoSubIn = breakdown?.isAutoSubIn;
  const isAutoSubOut = breakdown?.isAutoSubOut;
  const isTripleCap = isCaptain && calculationResult.isTripleCaptain;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If currently in substitution mode
    if (selectedPlayerForSwap) {
      if (isSwapSource) {
        // Cancel swap mode
        setSelectedPlayerForSwap(null);
      } else if (isSwapTargetEligible) {
        // Execute swap!
        const result = substitutePlayers(selectedPlayerForSwap, playerId);
        if (!result.success) {
          alert(result.message || 'Cannot make this substitution');
        }
      } else {
        // Pick new source
        setSelectedPlayerForSwap(playerId);
      }
      return;
    }

    // Normal click: open player action sheet
    onCardClick(playerId);
  };

  const isDimmedDuringSwap =
    selectedPlayerForSwap && !isSwapSource && !isSwapTargetEligible;

  return (
    <div
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300 select-none group max-w-[76px] sm:max-w-[85px] md:max-w-[96px] ${
        isSwapSource
          ? 'scale-110 z-30 ring-2 ring-yellow-400 rounded-lg shadow-xl'
          : isSwapTargetEligible
          ? 'scale-105 z-20 ring-2 ring-[#00ff87] rounded-lg animate-pulse-sub shadow-glow-green'
          : isDimmedDuringSwap
          ? 'opacity-40 grayscale-[30%] hover:opacity-70'
          : 'hover:scale-105 active:scale-95'
      }`}
    >
      {/* Swap Status Overlay Pill */}
      {isSwapSource && (
        <div className="absolute -top-3.5 bg-yellow-400 text-black text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-black flex items-center gap-1 z-30 animate-bounce">
          <ArrowLeftRight className="w-2.5 h-2.5 md:w-3 md:h-3" />
          <span>SWAP</span>
        </div>
      )}

      {isSwapTargetEligible && (
        <div className="absolute -top-3.5 bg-[#00ff87] text-[#37003c] text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-[#37003c] flex items-center gap-1 z-30 animate-bounce">
          <Check className="w-2.5 h-2.5 md:w-3 md:h-3" />
          <span>TAP HERE</span>
        </div>
      )}

      {/* Jersey Container with Captain & Vice Captain Badges */}
      <div className="relative flex items-center justify-center my-0.5">
        <KitJersey clubId={player.clubId} position={player.position} className="w-10 h-10 sm:w-11 sm:h-11 md:w-13 md:h-13" />

        {/* Captaincy Badges */}
        {isCaptain && (
          <div
            className={`absolute -top-1 -right-2 text-white font-black text-[9px] md:text-[10px] rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center border shadow-md ${
              isTripleCap ? 'bg-gradient-to-r from-[#ffe600] to-[#ff9900] text-black border-white' : 'bg-[#111] text-white border-white'
            }`}
            title={isTripleCap ? 'Triple Captain' : 'Captain (2x)'}
          >
            {isTripleCap ? 'TC' : 'C'}
          </div>
        )}

        {isViceCaptain && !isCaptain && (
          <div
            className="absolute -top-1 -right-2 bg-gray-300 text-black font-black text-[9px] md:text-[10px] rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center border border-black shadow-md"
            title="Vice Captain"
          >
            V
          </div>
        )}

        {/* Bench Order indicator if on bench (Sub 1, Sub 2, Sub 3) */}
        {!isStarter && (
          <div className="absolute -bottom-1 -left-1 bg-black/90 text-[#00ff87] font-extrabold text-[8px] md:text-[9px] rounded px-1 border border-[#00ff87]/30 shadow-sm">
            Sub {benchOrder}
          </div>
        )}

        {/* Auto-Sub Arrows */}
        {isAutoSubIn && (
          <span className="absolute -top-1 -left-2 bg-green-500 text-white font-bold text-[8px] md:text-[9px] px-1 rounded-full">
            IN
          </span>
        )}
        {isAutoSubOut && (
          <span className="absolute -top-1 -left-2 bg-red-500 text-white font-bold text-[8px] md:text-[9px] px-1 rounded-full">
            OUT
          </span>
        )}
      </div>

      {/* White Nameplate Badge */}
      <div
        className={`w-full text-center px-1 md:px-1.5 py-[1.5px] md:py-1 rounded-t text-[11px] md:text-xs font-bold tracking-tight truncate border-x border-t transition-colors ${
          isSwapSource
            ? 'bg-yellow-400 text-black border-yellow-500'
            : isSwapTargetEligible
            ? 'bg-[#00ff87] text-[#37003c] border-[#00ff87]'
            : 'bg-white text-gray-900 border-white/40'
        }`}
      >
        {player.webName}
      </div>

      {/* Value / Points Plate (Bottom half) */}
      <div
        className={`w-full text-center px-1 md:px-1.5 py-[1px] md:py-0.5 rounded-b text-[10px] md:text-[11px] font-extrabold border-x border-b tracking-tight transition-colors ${
          showPoints
            ? 'bg-slate-950 text-emerald-400 border-slate-700'
            : 'bg-slate-900 text-slate-200 border-slate-800'
        }`}
      >
        {showPoints ? `${pts} pts` : `£${player.cost.toFixed(1)}m`}
      </div>
    </div>
  );
};

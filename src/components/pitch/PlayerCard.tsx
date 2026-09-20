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

  return (
    <div
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none group max-w-[76px] ${
        isSwapSource
          ? 'scale-110 z-30'
          : isSwapTargetEligible
          ? 'scale-105 z-20 animate-pulse-sub'
          : 'hover:scale-105 active:scale-95'
      }`}
    >
      {/* Swap Status Overlay Pill */}
      {isSwapSource && (
        <div className="absolute -top-3.5 bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-black flex items-center gap-1 z-30 animate-bounce">
          <ArrowLeftRight className="w-2.5 h-2.5" />
          <span>SWAP</span>
        </div>
      )}

      {isSwapTargetEligible && (
        <div className="absolute -top-3.5 bg-[#00ff87] text-[#37003c] text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-[#37003c] flex items-center gap-1 z-30">
          <Check className="w-2.5 h-2.5" />
          <span>TAP HERE</span>
        </div>
      )}

      {/* Jersey Container with Captain & Vice Captain Badges */}
      <div className="relative flex items-center justify-center my-0.5">
        <KitJersey clubId={player.clubId} position={player.position} className="w-10 h-10 sm:w-11 sm:h-11" />

        {/* Captaincy Badges */}
        {isCaptain && (
          <div
            className={`absolute -top-1 -right-2 text-white font-black text-[9px] rounded-full w-4 h-4 flex items-center justify-center border shadow-md ${
              isTripleCap ? 'bg-gradient-to-r from-[#ffe600] to-[#ff9900] text-black border-white' : 'bg-[#111] text-white border-white'
            }`}
            title={isTripleCap ? 'Triple Captain' : 'Captain (2x)'}
          >
            {isTripleCap ? 'TC' : 'C'}
          </div>
        )}

        {isViceCaptain && !isCaptain && (
          <div
            className="absolute -top-1 -right-2 bg-gray-300 text-black font-black text-[9px] rounded-full w-4 h-4 flex items-center justify-center border border-black shadow-md"
            title="Vice Captain"
          >
            V
          </div>
        )}

        {/* Bench Order indicator if on bench */}
        {!isStarter && (
          <div className="absolute -bottom-1 -left-1 bg-black/80 text-white font-bold text-[8px] rounded px-1 border border-white/20">
            {benchOrder === 1 ? 'GK' : `${benchOrder - 1}`}
          </div>
        )}

        {/* Auto-Sub Arrows */}
        {isAutoSubIn && (
          <span className="absolute -top-1 -left-2 bg-green-500 text-white font-bold text-[8px] px-1 rounded-full">
            IN
          </span>
        )}
        {isAutoSubOut && (
          <span className="absolute -top-1 -left-2 bg-red-500 text-white font-bold text-[8px] px-1 rounded-full">
            OUT
          </span>
        )}
      </div>

      {/* White Nameplate Badge */}
      <div
        className={`w-full text-center px-1 py-[1.5px] rounded-t text-[11px] font-bold tracking-tight truncate border-x border-t transition-colors ${
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
        className={`w-full text-center px-1 py-[1px] rounded-b text-[10px] font-extrabold border-x border-b tracking-tight transition-colors ${
          showPoints
            ? 'bg-[#37003c] text-[#00ff87] border-[#550c5d]'
            : 'bg-[#1b001d] text-gray-200 border-[#470a4e]'
        }`}
      >
        {showPoints ? `${pts} pts` : `£${player.cost.toFixed(1)}m`}
      </div>
    </div>
  );
};

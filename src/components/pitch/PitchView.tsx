import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { getFormationLayout } from '../../engine/formations';
import { PlayerCard } from './PlayerCard';
import { PlayerActionSheet } from './PlayerActionSheet';
import { X, Sparkles, Shield, UserPlus, Plus } from 'lucide-react';

interface PitchViewProps {
  showPoints?: boolean;
  renderBench?: boolean;
  onCardClick?: (playerId: string) => void;
}

export const PitchView: React.FC<PitchViewProps> = ({
  showPoints = false,
  renderBench = true,
  onCardClick,
}) => {
  const {
    players,
    squad,
    selectedPlayerForSwap,
    setSelectedPlayerForSwap,
    calculationResult,
    setActiveTab,
  } = useFPL();

  const [internalSheetPlayerId, setInternalSheetPlayerId] = useState<string | null>(null);

  const handleCardClick = (id: string) => {
    if (onCardClick) {
      onCardClick(id);
    } else {
      setInternalSheetPlayerId(id);
    }
  };

  const layout = getFormationLayout(squad.players, players);
  const starters = squad.players.filter((p) => p.isStarter);

  // Bench slots (strictly 3 outfield reserves)
  const benchSlots = [1, 2, 3];

  // Dynamic pulsing border style based on active chip
  const chipBorderClass =
    squad.activeChip === 'triple_captain'
      ? 'border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.35)] ring-2 ring-amber-400/20 animate-pulse'
      : squad.activeChip === 'bench_boost'
      ? 'border-2 border-cyan-400 shadow-[0_0_30px_rgba(56,189,248,0.35)] ring-2 ring-cyan-400/20 animate-pulse'
      : squad.activeChip === 'free_hit'
      ? 'border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)] ring-2 ring-emerald-400/20 animate-pulse'
      : 'border-2 border-[#125c27] shadow-2xl';

  // Calculate missing starter placeholder slots if starters < 6
  const getMissingSlots = () => {
    if (starters.length >= 6) return [];
    const slots: { x: number; y: number; role: string }[] = [];

    if (layout.gks.length === 0) {
      slots.push({ x: 50, y: 12, role: 'GK' });
    }

    if (layout.defs.length === 0) {
      slots.push({ x: 30, y: 32, role: 'DEF' });
      slots.push({ x: 70, y: 32, role: 'DEF' });
    } else if (layout.defs.length === 1 && starters.length < 5) {
      slots.push({ x: 72, y: 32, role: 'DEF' });
    }

    if (layout.mids.length === 0) {
      slots.push({ x: 30, y: 54, role: 'MID' });
      slots.push({ x: 70, y: 54, role: 'MID' });
    } else if (layout.mids.length === 1 && starters.length + slots.length < 6) {
      slots.push({ x: 72, y: 54, role: 'MID' });
    }

    if (layout.fwds.length === 0 && starters.length + slots.length < 6) {
      slots.push({ x: 50, y: 77, role: 'FWD' });
    }

    // Default template slots if starters is completely empty
    if (starters.length === 0) {
      return [
        { x: 50, y: 12, role: 'GK' },
        { x: 30, y: 32, role: 'DEF' },
        { x: 70, y: 32, role: 'DEF' },
        { x: 30, y: 54, role: 'MID' },
        { x: 70, y: 54, role: 'MID' },
        { x: 50, y: 77, role: 'FWD' },
      ];
    }

    // Trim or fill up to (6 - starters.length)
    return slots.slice(0, 6 - starters.length);
  };

  const missingSlots = getMissingSlots();

  return (
    <div className="relative w-full overflow-hidden select-none pb-2">
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

      {/* Football Pitch Container with Alternating Mowing Lawn Stripes */}
      <div
        className={`relative mx-1 sm:mx-2 md:mx-auto my-2 rounded-2xl md:rounded-3xl overflow-hidden md:max-w-3xl lg:max-w-4xl transition-all duration-300 ${chipBorderClass}`}
        style={{
          background: 'repeating-linear-gradient(180deg, #115e2a 0px, #115e2a 34px, #0e5023 34px, #0e5023 68px)',
        }}
      >
        {/* Massive Etched Watermark Crest in Center Grass */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <img
            src="/kcl-logo-transparent.png"
            alt="Komarovi Champions League"
            className="w-[260px] sm:w-[310px] md:w-[350px] max-w-[75vw] opacity-[0.14] filter drop-shadow contrast-125 object-contain"
          />
        </div>

        {/* Pitch White Chalk Lines (SVG) with Dash Pattern */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none stroke-white/40 fill-none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 0 1.5px rgba(255,255,255,0.25))' }}
        >
          {/* Outer Boundary Border */}
          <rect x="12" y="12" width="calc(100% - 24px)" height="calc(100% - 24px)" strokeWidth="1.5" strokeDasharray="5 3" rx="10" />

          {/* Center Circle & Halfway Line */}
          <line x1="12" y1="50%" x2="calc(100% - 12px)" y2="50%" strokeWidth="1.5" strokeDasharray="5 3" />
          <circle cx="50%" cy="50%" r="50" strokeWidth="1.5" strokeDasharray="5 3" />
          <circle cx="50%" cy="50%" r="3.5" fill="rgba(255,255,255,0.6)" />

          {/* Top Penalty Area (Goalkeeper Box) */}
          <rect x="24%" y="12" width="52%" height="75" strokeWidth="1.5" strokeDasharray="5 3" />
          <rect x="36%" y="12" width="28%" height="32" strokeWidth="1.5" strokeDasharray="5 3" />
          <circle cx="50%" cy="58" r="2.5" fill="rgba(255,255,255,0.6)" />
          <path d="M 40% 87 C 45% 102, 55% 102, 60% 87" strokeWidth="1.5" strokeDasharray="5 3" />

          {/* Bottom Penalty Area */}
          <rect x="24%" y="calc(100% - 87px)" width="52%" height="75" strokeWidth="1.5" strokeDasharray="5 3" />
          <rect x="36%" y="calc(100% - 44px)" width="28%" height="32" strokeWidth="1.5" strokeDasharray="5 3" />
          <circle cx="50%" cy="calc(100% - 58px)" r="2.5" fill="rgba(255,255,255,0.6)" />
          <path d="M 40% calc(100% - 87px) C 45% calc(100% - 102px), 55% calc(100% - 102px), 60% calc(100% - 87px)" strokeWidth="1.5" strokeDasharray="5 3" />

          {/* Corner Arcs */}
          <path d="M 12 28 A 16 16 0 0 0 28 12" strokeWidth="1.5" strokeDasharray="5 3" />
          <path d="M calc(100% - 28px) 12 A 16 16 0 0 0 calc(100% - 12px) 28" strokeWidth="1.5" strokeDasharray="5 3" />
          <path d="M 12 calc(100% - 28px) A 16 16 0 0 1 28 calc(100% - 12px)" strokeWidth="1.5" strokeDasharray="5 3" />
          <path d="M calc(100% - 28px) calc(100% - 12px) A 16 16 0 0 1 calc(100% - 12px) calc(100% - 28px)" strokeWidth="1.5" strokeDasharray="5 3" />
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
          {/* Active Starters */}
          {layout.pitchPositions.map((pos) => {
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
                  onCardClick={handleCardClick}
                  showPoints={showPoints}
                />
              </div>
            );
          })}

          {/* Missing Starter Target Slots (Luminous Pulsing Dotted Rings) */}
          {missingSlots.map((slot, idx) => (
            <div
              key={`missing-${slot.role}-${idx}`}
              onClick={() => setActiveTab('transfers')}
              className="absolute transition-all duration-300 flex flex-col items-center cursor-pointer group"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="text-[8px] md:text-[9px] font-black uppercase text-emerald-400 bg-black/60 px-1.5 py-0.5 rounded mb-1 tracking-wider border border-emerald-500/30 shadow-xs">
                {slot.role}
              </span>
              <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl border-2 border-dashed border-emerald-400/50 bg-black/30 backdrop-blur-xs flex flex-col items-center justify-center text-emerald-400 group-hover:border-emerald-300 group-hover:bg-emerald-500/10 group-hover:scale-105 transition-all shadow-inner animate-pulse">
                <Plus className="w-5 h-5 mb-0.5" />
                <span className="text-[8px] font-black uppercase tracking-wider">Add</span>
              </div>
            </div>
          ))}

          {/* Prompt banner if zero starters */}
          {starters.length === 0 && (
            <div className="absolute inset-x-4 bottom-6 z-20 flex justify-center pointer-events-none">
              <div className="bg-black/80 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-4 text-center max-w-sm pointer-events-auto shadow-2xl">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-black text-white uppercase tracking-wider">Starting Lineup Empty</p>
                </div>
                <p className="text-[11px] text-gray-300 mb-2.5">
                  Tap any slot or go to Transfers to build your starting 6.
                </p>
                <button
                  onClick={() => setActiveTab('transfers')}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-[#002812] font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95"
                >
                  Open Player Market
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Optional Bench Dugout Bar (rendered when renderBench is true) */}
        {renderBench && (
          <div className="relative z-10 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-700/60 dark:border-slate-800 pt-2 md:pt-2.5 pb-2.5 md:pb-3 px-2 md:px-6">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-slate-200 flex items-center gap-1.5">
                Substitutes ({layout.bench.length}/3)
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                Auto-subs: Sub 1 → 2 → 3
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
                        onCardClick={handleCardClick}
                        showPoints={showPoints}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={`empty-bench-${order}`}
                    onClick={() => setActiveTab('transfers')}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-dashed border-white/20 bg-black/20 text-gray-500 min-h-[90px] cursor-pointer hover:border-emerald-400/50 hover:bg-emerald-500/5 transition-all"
                  >
                    <span className="text-[10px] font-bold text-gray-400">Sub {order}</span>
                    <span className="text-[8px] text-gray-500 mt-0.5">+ Empty</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Internal Player Action Sheet Modal (used when onCardClick is not provided) */}
      {!onCardClick && internalSheetPlayerId && (
        <PlayerActionSheet
          playerId={internalSheetPlayerId}
          onClose={() => setInternalSheetPlayerId(null)}
        />
      )}
    </div>
  );
};

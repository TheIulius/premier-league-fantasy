import React from 'react';
import { useFPL } from '../../context/FPLContext';
import { KitJersey } from './KitJersey';
import { CLUBS } from '../../data/clubs';
import { ArrowLeftRight, Crown, ShieldAlert, ArrowRight, X, Activity } from 'lucide-react';

interface PlayerActionSheetProps {
  playerId: string | null;
  onClose: () => void;
}

export const PlayerActionSheet: React.FC<PlayerActionSheetProps> = ({ playerId, onClose }) => {
  const {
    players,
    squad,
    setSelectedPlayerForSwap,
    setCaptain,
    setViceCaptain,
    setActiveTab,
    currentGW,
    calculationResult,
    setTransferOutPlayerId,
    isSquadLocked,
    reorderBenchPlayer,
  } = useFPL();

  if (!playerId) return null;

  const player = players[playerId];
  if (!player) return null;

  const squadPlayer = squad.players.find((p) => p.playerId === playerId);
  const isStarter = squadPlayer?.isStarter ?? false;
  const isCaptain = squadPlayer?.isCaptain ?? false;
  const isViceCaptain = squadPlayer?.isViceCaptain ?? false;
  const benchOrder = squadPlayer?.benchOrder || 0;

  const club = CLUBS[player.clubId];
  const stats = player.gwStats[currentGW];
  const breakdown = calculationResult.playerPointsBreakdown[playerId];
  const currentPts = breakdown ? breakdown.finalPoints : (stats ? player.gwPoints : 0);

  const handleStartSwap = () => {
    if (isSquadLocked) return;
    setSelectedPlayerForSwap(playerId);
    onClose();
  };

  const handleMakeCaptain = () => {
    if (isSquadLocked) return;
    setCaptain(playerId);
    onClose();
  };

  const handleMakeViceCaptain = () => {
    if (isSquadLocked) return;
    setViceCaptain(playerId);
    onClose();
  };

  const handleTransfer = () => {
    if (isSquadLocked) return;
    setTransferOutPlayerId(playerId);
    setActiveTab('transfers');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in md:p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] md:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl border-t md:border border-x border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-2xl animate-slide-up text-slate-900 dark:text-white safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 md:hidden" />

        {/* Player Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <KitJersey clubId={player.clubId} position={player.position} className="w-12 h-12" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  {player.position}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {club?.name || player.clubId}
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                {player.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>Cost: <strong className="text-slate-900 dark:text-white">£{player.cost.toFixed(1)}m</strong></span>
                <span>•</span>
                <span>Selected: <strong className="text-emerald-600 dark:text-emerald-400">{player.selectedByPercent}%</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match Gameweek Performance Card */}
        <div className="my-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">GW {currentGW} Score</span>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                <span>Mins: <strong className="text-slate-900 dark:text-white">{stats?.minutes || 0}'</strong></span>
                {stats?.goals ? <span>• Goals: <strong className="text-emerald-600 dark:text-emerald-400">{stats.goals}</strong></span> : null}
                {stats?.assists ? <span>• Assists: <strong className="text-sky-500">{stats.assists}</strong></span> : null}
                {stats?.cleanSheet ? <span>• Clean Sheet</span> : null}
                {stats?.bonus ? <span>• Bonus: <strong className="text-amber-500">+{stats.bonus}</strong></span> : null}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{currentPts}</span>
            <span className="text-[10px] text-slate-400 block -mt-1">PTS</span>
          </div>
        </div>

        {/* Lock warning if locked */}
        {isSquadLocked && (
          <div className="my-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
            🔒 Lineups are locked for this Gameweek
          </div>
        )}

        {/* Bench Priority Reordering Section (Only for Substitutes) */}
        {!isStarter && (
          <div className="my-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Bench Substitute Priority
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                benchOrder === 1
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : benchOrder === 2
                  ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}>
                {benchOrder === 1 ? '1st Sub (Priority)' : benchOrder === 2 ? '2nd Sub' : '3rd Sub'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {benchOrder === 1
                ? '★ 1st Priority: Enters the match first if any starting outfield player does not play.'
                : `Sub ${benchOrder}: Enters after Sub ${benchOrder - 1} if another player does not play.`}
            </p>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              <button
                disabled={isSquadLocked || benchOrder === 1}
                onClick={() => {
                  reorderBenchPlayer(playerId, 1);
                  onClose();
                }}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center border transition-all ${
                  benchOrder === 1
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 cursor-default'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 active:scale-95'
                }`}
              >
                <span>1st Sub</span>
              </button>
              <button
                disabled={isSquadLocked || benchOrder === 2}
                onClick={() => {
                  reorderBenchPlayer(playerId, 2);
                  onClose();
                }}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center border transition-all ${
                  benchOrder === 2
                    ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/40 cursor-default'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/10 active:scale-95'
                }`}
              >
                <span>2nd Sub</span>
              </button>
              <button
                disabled={isSquadLocked || benchOrder === 3}
                onClick={() => {
                  reorderBenchPlayer(playerId, 3);
                  onClose();
                }}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center border transition-all ${
                  benchOrder === 3
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 cursor-default'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/10 active:scale-95'
                }`}
              >
                <span>3rd Sub</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Action Grid */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {/* Substitute / Swap Button */}
          <button
            onClick={handleStartSwap}
            disabled={isSquadLocked}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs border transition-colors ${
              isSquadLocked
                ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-400'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-500" />
            <span>Substitute</span>
          </button>

          {/* Transfer Button */}
          <button
            onClick={handleTransfer}
            disabled={isSquadLocked}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs border transition-colors ${
              isSquadLocked
                ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-400'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <ArrowRight className="w-4 h-4 text-sky-500" />
            <span>Transfer Out</span>
          </button>

          {/* Make Captain (Only for Starters) */}
          {isStarter && (
            <button
              onClick={handleMakeCaptain}
              disabled={isCaptain}
              className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs border transition-colors ${
                isCaptain
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 cursor-default'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-500" />
              <span>{isCaptain ? 'Captain (C)' : 'Make Captain'}</span>
            </button>
          )}

          {/* Make Vice Captain (Only for Starters) */}
          {isStarter && (
            <button
              onClick={handleMakeViceCaptain}
              disabled={isViceCaptain || isCaptain}
              className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs border transition-colors ${
                isViceCaptain
                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 cursor-default'
                  : isCaptain
                  ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-400'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-sky-500" />
              <span>{isViceCaptain ? 'Vice Captain (V)' : 'Make Vice C'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

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
  } = useFPL();

  if (!playerId) return null;

  const player = players[playerId];
  if (!player) return null;

  const squadPlayer = squad.players.find((p) => p.playerId === playerId);
  const isStarter = squadPlayer?.isStarter ?? false;
  const isCaptain = squadPlayer?.isCaptain ?? false;
  const isViceCaptain = squadPlayer?.isViceCaptain ?? false;

  const club = CLUBS[player.clubId];
  const stats = player.gwStats[currentGW];
  const breakdown = calculationResult.playerPointsBreakdown[playerId];
  const currentPts = breakdown ? breakdown.finalPoints : (stats ? player.gwPoints : 0);

  const handleStartSwap = () => {
    setSelectedPlayerForSwap(playerId);
    onClose();
  };

  const handleMakeCaptain = () => {
    setCaptain(playerId);
    onClose();
  };

  const handleMakeViceCaptain = () => {
    setViceCaptain(playerId);
    onClose();
  };

  const handleTransfer = () => {
    setActiveTab('transfers');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-xs animate-fade-in md:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] md:max-w-md bg-gradient-to-b from-[#320037] to-[#1e0022] rounded-t-3xl md:rounded-3xl border-t md:border border-x border-[#590c63] p-4 md:p-6 shadow-2xl animate-slide-up select-none safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3 md:hidden" />

        {/* Player Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <KitJersey clubId={player.clubId} position={player.position} className="w-12 h-12" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-200">
                  {player.position}
                </span>
                <span className="text-xs font-medium text-gray-400">
                  {club?.name || player.clubId}
                </span>
              </div>
              <h2 className="text-lg font-black text-white leading-tight mt-0.5">
                {player.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-gray-300 mt-1">
                <span>Cost: <strong className="text-white">£{player.cost.toFixed(1)}m</strong></span>
                <span>•</span>
                <span>Selected: <strong className="text-[#00ff87]">{player.selectedByPercent}%</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white bg-white/5 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match Gameweek Performance Card */}
        <div className="my-3 p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00ff87]" />
            <div>
              <span className="text-[11px] text-gray-400 uppercase font-semibold">GW {currentGW} Score</span>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-300">
                <span>Mins: <strong>{stats?.minutes || 0}'</strong></span>
                {stats?.goals ? <span>• Goals: <strong className="text-[#00ff87]">{stats.goals}</strong></span> : null}
                {stats?.assists ? <span>• Assists: <strong className="text-[#04f5ff]">{stats.assists}</strong></span> : null}
                {stats?.cleanSheet ? <span>• Clean Sheet</span> : null}
                {stats?.bonus ? <span>• Bonus: <strong>+{stats.bonus}</strong></span> : null}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-[#00ff87]">{currentPts}</span>
            <span className="text-[10px] text-gray-400 block -mt-1">PTS</span>
          </div>
        </div>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {/* Substitute / Swap Button */}
          <button
            onClick={handleStartSwap}
            className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 text-yellow-400" />
            <span>Substitute</span>
          </button>

          {/* Transfer Button */}
          <button
            onClick={handleTransfer}
            className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
          >
            <ArrowRight className="w-4 h-4 text-[#04f5ff]" />
            <span>Transfer Out</span>
          </button>

          {/* Make Captain (Only for Starters) */}
          {isStarter && (
            <button
              onClick={handleMakeCaptain}
              disabled={isCaptain}
              className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs border transition-colors ${
                isCaptain
                  ? 'bg-[#00ff87]/20 text-[#00ff87] border-[#00ff87]/40 cursor-default'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <Crown className="w-4 h-4 text-yellow-400" />
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
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 cursor-default'
                  : isCaptain
                  ? 'opacity-40 cursor-not-allowed bg-white/5 border-transparent text-gray-400'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <span>{isViceCaptain ? 'Vice Captain (V)' : 'Make Vice Captain'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

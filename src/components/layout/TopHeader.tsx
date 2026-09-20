import React from 'react';
import { useFPL } from '../../context/FPLContext';
import { Sparkles, Wrench, Users } from 'lucide-react';

export const TopHeader: React.FC = () => {
  const {
    currentGW,
    calculationResult,
    squad,
    setActiveTab,
    activeTab,
    isDevAuthenticated,
    setIsManagerModalOpen,
  } = useFPL();

  // Find user's overall points from league or calculation
  const totalUserPoints = 84 + (calculationResult.totalPoints || 0);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-[#2a002e] via-[#320037] to-[#250029] border-b border-[#4f0c57]/60 shadow-lg select-none">
      {/* Top branding line */}
      <div className="px-3.5 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          {/* Premier League Lion Icon SVG */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00ff87] to-[#04f5ff] p-[2px] shadow-glow-green flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#37003c] flex items-center justify-center font-black text-sm text-[#00ff87]">
              PL
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-extrabold tracking-tight text-white uppercase flex items-center gap-1 font-display">
                Fantasy <span className="text-[#00ff87]">PL</span>
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/30">
                GW {currentGW}
              </span>
            </div>
            <button
              onClick={() => setIsManagerModalOpen(true)}
              className="text-[11px] font-medium text-gray-300 hover:text-[#00ff87] flex items-center gap-1 transition-colors text-left"
            >
              <span className="truncate max-w-[120px]">{squad.teamName}</span>
              <span className="text-[9px] bg-white/10 px-1 py-0.2 rounded text-gray-400">Switch</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch Profile Button */}
          <button
            onClick={() => setIsManagerModalOpen(true)}
            className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white hover:bg-white/20"
            title="Switch / Create Team"
          >
            <Users className="w-3.5 h-3.5" />
          </button>

          {/* Developer Portal shortcut button */}
          <button
            onClick={() => setActiveTab('dev')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
              activeTab === 'dev'
                ? 'bg-[#00ff87] text-[#37003c] border-[#00ff87] shadow-glow-green font-bold'
                : isDevAuthenticated
                ? 'bg-[#e90052]/20 text-[#e90052] border-[#e90052]/40 hover:bg-[#e90052]/30'
                : 'bg-white/10 text-gray-200 border-white/15 hover:bg-white/20'
            }`}
            title="Developer Portal / Match Event Input"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="text-[11px]">Dev Portal</span>
          </button>
        </div>
      </div>

      {/* Gameweek Quick Metric Bar */}
      <div className="grid grid-cols-4 divide-x divide-white/10 bg-[#1f0022]/80 border-t border-white/5 py-1.5 px-1 text-center text-xs">
        <div>
          <span className="block text-[10px] text-gray-400 uppercase font-medium">GW Points</span>
          <span className="text-sm font-black text-[#00ff87]">
            {calculationResult.totalPoints}
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 uppercase font-medium">Total Pts</span>
          <span className="text-sm font-black text-white">
            {totalUserPoints}
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 uppercase font-medium">Overall Rank</span>
          <span className="text-sm font-black text-[#04f5ff]">
            #3
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-gray-400 uppercase font-medium">In Bank</span>
          <span className="text-sm font-bold text-gray-200">
            £{squad.bank.toFixed(1)}m
          </span>
        </div>
      </div>

      {/* Chip active banner if any */}
      {squad.activeChip && (
        <div className="bg-gradient-to-r from-[#e90052] to-[#7a002b] text-white text-[11px] font-bold py-1 px-3 flex items-center justify-between shadow-inner">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#00ff87]" />
            CHIP ACTIVE: {squad.activeChip.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded">GW {currentGW}</span>
        </div>
      )}
    </header>
  );
};

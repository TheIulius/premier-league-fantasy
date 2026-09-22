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
    authUser,
    setIsAuthModalOpen,
    leagues,
    currentManager,
  } = useFPL();

  // Find user's overall points and rank from active leagues or live calculation
  const userLeagueMember = leagues.flatMap((l) => l.members).find(
    (m) => m.id === currentManager?.id || m.id === 'user' || (authUser && m.id === authUser.id)
  );
  const totalUserPoints = userLeagueMember ? userLeagueMember.totalPoints : (calculationResult.totalPoints || 0);
  const overallRank = userLeagueMember ? `#${userLeagueMember.rank}` : '-';

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-[#2a002e] via-[#320037] to-[#250029] border-b border-[#4f0c57]/60 shadow-lg select-none">
      {/* Top branding line */}
      <div className="px-3.5 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          {/* Official KCL Logo */}
          <img
            src="/kcl-logo.png"
            alt="Komarovi Charity League"
            className="w-10 h-10 rounded-xl object-contain shadow-md flex-shrink-0 border border-white/10"
          />
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-white uppercase flex items-center gap-1 font-display">
                Komarovi <span className="text-[#00ff87]">Charity League</span>
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/30">
                GW {currentGW}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-[11px] font-medium text-gray-300 hover:text-[#00ff87] flex items-center gap-1 transition-colors text-left"
              >
                <span className="truncate max-w-[95px]">{squad.teamName}</span>
                <span className="text-[8px] bg-white/10 px-1 py-0.2 rounded text-gray-400">
                  {authUser ? `@${authUser.username}` : 'Login'}
                </span>
              </button>
              <span className="text-[9px] text-gray-400/80 font-normal">
                (Created By TheIulius)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Account Login / Profile Button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 ${
              authUser
                ? 'bg-[#00ff87]/15 border-[#00ff87]/30 text-[#00ff87]'
                : 'bg-white/10 border-white/15 text-gray-200 hover:bg-white/20'
            }`}
            title="Account Login / Registration"
          >
            <Users className="w-3 h-3" />
            <span>{authUser ? authUser.managerName.split(' ')[0] : 'Sign In'}</span>
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
            {overallRank}
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

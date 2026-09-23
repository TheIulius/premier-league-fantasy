import React from 'react';
import { useFPL, TabType } from '../../context/FPLContext';
import { Sparkles, Wrench, Users, Shirt, ArrowLeftRight, Zap, Trophy, Calendar } from 'lucide-react';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DESKTOP_TABS: TabItem[] = [
  { id: 'team', label: 'Pick Team', icon: Shirt },
  { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  { id: 'points', label: 'Points', icon: Zap },
  { id: 'leagues', label: 'Leagues', icon: Trophy },
  { id: 'fixtures', label: 'Fixtures', icon: Calendar },
  { id: 'dev', label: 'Dev Mode', icon: Wrench },
];

export const TopHeader: React.FC = () => {
  const {
    currentGW,
    calculationResult,
    squad,
    setActiveTab,
    activeTab,
    isDevAuthenticated,
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
      <div className="px-3.5 md:px-6 pt-3 pb-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 md:space-x-3.5">
          {/* Official KCL Logo */}
          <img
            src="/kcl-logo.png"
            alt="Komarovi Charity League"
            className="w-10 h-10 md:w-11 md:h-11 rounded-xl object-contain shadow-md flex-shrink-0 border border-white/10"
          />
          <div>
            <div className="flex items-center space-x-1.5 md:space-x-2">
              <h1 className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight text-white uppercase flex items-center gap-1 font-display">
                Komarovi <span className="text-[#00ff87]">Charity League</span>
              </h1>
              <span className="text-[10px] md:text-xs font-bold px-1.5 py-0.2 rounded bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/30">
                GW {currentGW}
              </span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-[11px] md:text-xs font-medium text-gray-300 hover:text-[#00ff87] flex items-center gap-1 transition-colors text-left"
              >
                <span className="truncate max-w-[95px] md:max-w-[200px]">{squad.teamName}</span>
                <span className="text-[8px] md:text-[9px] bg-white/10 px-1 py-0.2 rounded text-gray-400">
                  {authUser ? `@${authUser.username}` : 'Login'}
                </span>
              </button>
              <span className="text-[9px] md:text-[10px] text-gray-400/80 font-normal">
                (Created By Theiulius and Chaga)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2.5">
          {/* Account Login / Profile Button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold border transition-all flex items-center gap-1.5 ${
              authUser
                ? 'bg-[#00ff87]/15 border-[#00ff87]/30 text-[#00ff87]'
                : 'bg-white/10 border-white/15 text-gray-200 hover:bg-white/20'
            }`}
            title="Account Login / Registration"
          >
            <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>{authUser ? authUser.managerName.split(' ')[0] : 'Sign In'}</span>
          </button>

          {/* Developer Portal shortcut button (mobile only since desktop has header tabs) */}
          <button
            onClick={() => setActiveTab('dev')}
            className={`md:hidden flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
              activeTab === 'dev'
                ? 'bg-[#00ff87] text-[#37003c] border-[#00ff87] shadow-glow-green font-bold'
                : isDevAuthenticated
                ? 'bg-[#e90052]/20 text-[#e90052] border-[#e90052]/40 hover:bg-[#e90052]/30'
                : 'bg-white/10 text-gray-200 border-white/15 hover:bg-white/20'
            }`}
            title="Developer Portal / Match Event Input"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="text-[11px]">Dev</span>
          </button>
        </div>
      </div>

      {/* Desktop Navigation Tabs Bar */}
      <nav className="hidden md:flex items-center justify-center gap-2 px-6 py-2 bg-[#200024] border-t border-white/10 select-none">
        {DESKTOP_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDev = tab.id === 'dev';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 border ${
                isActive
                  ? 'bg-[#00ff87]/20 text-[#00ff87] border-[#00ff87]/50 shadow-glow-green font-extrabold'
                  : isDev && isDevAuthenticated
                  ? 'bg-[#e90052]/15 text-[#e90052] border-[#e90052]/30 hover:bg-[#e90052]/25'
                  : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#00ff87]' : ''}`} />
              <span>{tab.label}</span>
              {isDev && isDevAuthenticated && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#e90052]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Gameweek Quick Metric Bar */}
      <div className="grid grid-cols-4 divide-x divide-white/10 bg-[#1f0022]/80 border-t border-white/5 py-1.5 md:py-2.5 px-1 md:px-6 text-center text-xs md:text-sm">
        <div>
          <span className="block text-[10px] md:text-xs text-gray-400 uppercase font-semibold">GW Points</span>
          <span className="text-sm md:text-lg font-black text-[#00ff87]">
            {calculationResult.totalPoints}
          </span>
        </div>
        <div>
          <span className="block text-[10px] md:text-xs text-gray-400 uppercase font-semibold">Total Pts</span>
          <span className="text-sm md:text-lg font-black text-white">
            {totalUserPoints}
          </span>
        </div>
        <div>
          <span className="block text-[10px] md:text-xs text-gray-400 uppercase font-semibold">Overall Rank</span>
          <span className="text-sm md:text-lg font-black text-[#04f5ff]">
            {overallRank}
          </span>
        </div>
        <div>
          <span className="block text-[10px] md:text-xs text-gray-400 uppercase font-semibold">In Bank</span>
          <span className="text-sm md:text-lg font-bold text-gray-200">
            £{squad.bank.toFixed(1)}m
          </span>
        </div>
      </div>

      {/* Chip active banner if any */}
      {squad.activeChip && (
        <div className="bg-gradient-to-r from-[#e90052] to-[#7a002b] text-white text-[11px] md:text-xs font-bold py-1 px-3 md:px-6 flex items-center justify-between shadow-inner">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#00ff87]" />
            CHIP ACTIVE: {squad.activeChip.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-[10px] md:text-xs bg-black/30 px-1.5 py-0.5 rounded">GW {currentGW}</span>
        </div>
      )}
    </header>
  );
};

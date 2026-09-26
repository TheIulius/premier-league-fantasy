import React, { useState, useEffect } from 'react';
import { useFPL, TabType } from '../../context/FPLContext';
import { Sparkles, Wrench, Users, Shirt, ArrowLeftRight, Zap, Trophy, Calendar, Sun, Moon, Clock, Eye, Shield, BookOpen } from 'lucide-react';
import { RulesModal } from '../common/RulesModal';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DESKTOP_TABS: TabItem[] = [
  { id: 'team', label: 'Team', icon: Shirt },
  { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  { id: 'standings', label: 'Standings', icon: Trophy },
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
    isModerator,
    authUser,
    setIsAuthModalOpen,
    leagues,
    currentManager,
    theme,
    toggleTheme,
    deadline,
    isSquadLocked,
    isDemoMode,
    exitDemoMode,
  } = useFPL();

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  useEffect(() => {
    if (!deadline) {
      setTimeLeft('');
      return;
    }
    const updateCountdown = () => {
      const diff = new Date(deadline.deadlineTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Locked');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${mins}m`);
      } else {
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${mins}m ${secs}s`);
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const userLeagueMember = leagues.flatMap((l) => l.members).find(
    (m) => m.id === currentManager?.id || m.id === 'user' || (authUser && m.id === authUser.id)
  );
  const totalUserPoints = userLeagueMember ? userLeagueMember.totalPoints : (calculationResult.totalPoints || 0);
  const overallRank = userLeagueMember ? `#${userLeagueMember.rank}` : '-';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 shadow-xs select-none transition-colors duration-200">
      {/* Demo Mode Sticky Caption Bar */}
      {isDemoMode && (
        <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-3 py-1.5 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Eye className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-[11px] md:text-xs">
              <strong className="text-amber-300 uppercase tracking-wide mr-1 font-black">Demo Mode:</strong>
              Browsing locked sample squad. All mutations disabled.
            </span>
          </div>
          <button
            onClick={exitDemoMode}
            className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white border border-amber-500/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-2"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Top branding line */}
      <div className="w-full max-w-6xl mx-auto px-3.5 md:px-6 pt-2.5 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 md:space-x-3">
          <img
            src="/kcl-logo.png"
            alt="KCL Logo"
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl object-contain shadow-xs flex-shrink-0 border border-slate-200 dark:border-white/10"
          />
          <div>
            <div className="flex items-center space-x-1.5 md:space-x-2">
              <h1 className="text-xs sm:text-sm md:text-base font-extrabold tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-1 font-display">
                Komarovi <span className="text-slate-500 dark:text-slate-300">League</span>
              </h1>
              <span className="text-[10px] md:text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.09]">
                GW {currentGW}
              </span>
              {deadline && (
                <span
                  className={`text-[9px] md:text-xs font-mono font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                    isSquadLocked
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                      : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                  }`}
                  title={`Deadline: ${new Date(deadline.deadlineTime).toLocaleString()}`}
                >
                  <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-400/80" />
                  <span>{isSquadLocked ? 'Locked' : timeLeft}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => (isDemoMode ? exitDemoMode() : setIsAuthModalOpen(true))}
                className="text-[11px] md:text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors text-left"
              >
                <span className="truncate max-w-[120px] md:max-w-[260px] font-semibold text-slate-700 dark:text-slate-300">
                  {authUser?.teamName || squad.teamName}
                </span>
                <span className="text-[9px] bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.2 rounded text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                  {isDemoMode ? 'Demo View' : authUser ? `@${authUser.username}` : 'Sign In'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Rules & Scoring System Modal Button */}
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="p-1.5 md:px-3 md:py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/[0.09] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.09]"
            title="ტურნირის წესები და ქულები / Official Rules & Scoring"
            aria-label="Tournament Rules"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="hidden sm:inline font-bold">წესები</span>
          </button>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 md:p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-700" />
            )}
          </button>

          {/* Account Login / Profile Button - Refined Slate Surface */}
          <button
            onClick={() => (isDemoMode ? exitDemoMode() : setIsAuthModalOpen(true))}
            className="p-1.5 md:px-3 md:py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/[0.09] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.09]"
            title={isDemoMode ? 'Exit Demo Mode' : authUser ? `Logged in as @${authUser.username}` : 'Sign In'}
            aria-label="Account"
          >
            <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden md:inline">{isDemoMode ? 'Demo' : authUser ? authUser.managerName.split(' ')[0] : 'Sign In'}</span>
            {authUser && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          {/* Developer / Moderator Portal shortcut button (mobile only) */}
          <button
            onClick={() => setActiveTab('dev')}
            className={`md:hidden p-1.5 rounded-full transition-all border ${
              activeTab === 'dev'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent font-bold'
                : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.09]'
            }`}
            title={isModerator ? 'Moderator Console' : 'Dev Portal'}
            aria-label={isModerator ? 'Moderator Console' : 'Dev Portal'}
          >
            {isModerator ? <Shield className="w-4 h-4 text-amber-400" /> : <Wrench className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Desktop Navigation Tabs Bar */}
      <nav className="hidden md:flex items-center justify-center bg-slate-50 dark:bg-[#070b12] border-t border-slate-200 dark:border-slate-800/80 select-none">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-center gap-1.5 px-6 py-1.5">
          {DESKTOP_TABS.map((tab) => {
            const Icon = tab.id === 'dev' && isModerator ? Shield : tab.icon;
            const isActive = activeTab === tab.id;
            const isDev = tab.id === 'dev';
            const displayLabel = isDev && isModerator ? 'Mod Console' : tab.label;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-slate-900 dark:bg-white/[0.09] text-white border-slate-900 dark:border-white/[0.14] font-bold shadow-xs'
                    : 'bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-200/60 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? (isDev && isModerator ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-400'}`} />
                <span>{displayLabel}</span>
                {isDev && isDevAuthenticated && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Gameweek Quick Metric Bar - hidden on Transfers tab to eliminate clutter and duplicate Bank */}
      {activeTab !== 'transfers' && (
        <div className="w-full bg-slate-100/70 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800/60 py-1.5 md:py-2 text-center text-xs">
          <div className="max-w-6xl mx-auto grid grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800 px-1 md:px-6">
            <div>
              <span className="block text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">GW</span>
              <span className="text-xs md:text-sm font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {calculationResult.totalPoints}
              </span>
            </div>
            <div>
              <span className="block text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total</span>
              <span className="text-xs md:text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white">
                {totalUserPoints}
              </span>
            </div>
            <div>
              <span className="block text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Rank</span>
              <span className="text-xs md:text-sm font-black font-mono tabular-nums text-sky-600 dark:text-sky-400">
                {overallRank}
              </span>
            </div>
            <div>
              <span className="block text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Bank</span>
              <span className="text-xs md:text-sm font-bold font-mono tabular-nums text-slate-700 dark:text-slate-300">
                £{squad.bank.toFixed(1)}m
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chip active banner if any */}
      {squad.activeChip && (
        <div className="w-full bg-rose-600 text-white text-[11px] font-bold py-1">
          <div className="max-w-6xl mx-auto px-3.5 md:px-6 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              CHIP: {squad.activeChip.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">GW {currentGW}</span>
          </div>
        </div>
      )}

      {/* Official Rules & Scoring Modal */}
      <RulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </header>
  );
};

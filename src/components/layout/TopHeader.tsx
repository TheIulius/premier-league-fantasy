import React, { useState, useEffect } from 'react';
import { useFPL, TabType } from '../../context/FPLContext';
import { Sparkles, Wrench, Users, Shirt, ArrowLeftRight, Zap, Trophy, Calendar, Sun, Moon, Clock } from 'lucide-react';

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
    theme,
    toggleTheme,
    deadline,
    isSquadLocked,
  } = useFPL();

  const [timeLeft, setTimeLeft] = useState<string>('');

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
                Komarovi <span className="text-emerald-600 dark:text-emerald-400">League</span>
              </h1>
              <span className="text-[10px] md:text-xs font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                GW {currentGW}
              </span>
              {deadline && (
                <span
                  className={`text-[9px] md:text-xs font-bold px-1.5 py-0.2 rounded flex items-center gap-1 border ${
                    isSquadLocked
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}
                  title={`Deadline: ${new Date(deadline.deadlineTime).toLocaleString()}`}
                >
                  <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span>{isSquadLocked ? 'Locked' : timeLeft}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-[11px] md:text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors text-left"
              >
                <span className="truncate max-w-[120px] md:max-w-[260px] font-semibold text-slate-700 dark:text-slate-300">{squad.teamName}</span>
                <span className="text-[9px] bg-slate-100 dark:bg-white/10 px-1 py-0.2 rounded text-slate-500 dark:text-slate-400">
                  {authUser ? `@${authUser.username}` : 'Sign In'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
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

          {/* Account Login / Profile Button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold border transition-all flex items-center gap-1.5 ${
              authUser
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
            title="Account"
          >
            <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>{authUser ? authUser.managerName.split(' ')[0] : 'Sign In'}</span>
          </button>

          {/* Developer Portal shortcut button (mobile only) */}
          <button
            onClick={() => setActiveTab('dev')}
            className={`md:hidden flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
              activeTab === 'dev'
                ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold'
                : isDevAuthenticated
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
            }`}
            title="Dev Portal"
          >
            <Wrench className="w-3 h-3" />
            <span className="text-[10px]">Dev</span>
          </button>
        </div>
      </div>

      {/* Desktop Navigation Tabs Bar */}
      <nav className="hidden md:flex items-center justify-center bg-slate-50 dark:bg-[#070b12] border-t border-slate-200 dark:border-slate-800/80 select-none">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-center gap-2 px-6 py-2">
          {DESKTOP_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDev = tab.id === 'dev';

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-extrabold shadow-xs'
                    : isDev && isDevAuthenticated
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                <span>{tab.label}</span>
                {isDev && isDevAuthenticated && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Gameweek Quick Metric Bar - streamlined & compact */}
      <div className="w-full bg-slate-100/70 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800/60 py-1.5 md:py-2 text-center text-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800 px-1 md:px-6">
          <div>
            <span className="block text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">GW</span>
            <span className="text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400">
              {calculationResult.totalPoints}
            </span>
          </div>
          <div>
            <span className="block text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total</span>
            <span className="text-xs md:text-sm font-black text-slate-900 dark:text-white">
              {totalUserPoints}
            </span>
          </div>
          <div>
            <span className="block text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Rank</span>
            <span className="text-xs md:text-sm font-black text-sky-600 dark:text-sky-400">
              {overallRank}
            </span>
          </div>
          <div>
            <span className="block text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Bank</span>
            <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">
              £{squad.bank.toFixed(1)}m
            </span>
          </div>
        </div>
      </div>

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
    </header>
  );
};

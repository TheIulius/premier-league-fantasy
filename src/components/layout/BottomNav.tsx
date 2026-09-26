import React from 'react';
import { useFPL, TabType } from '../../context/FPLContext';
import { Shirt, ArrowLeftRight, Zap, Trophy, Calendar, Wrench, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'team', label: 'Team', icon: Shirt },
  { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  { id: 'standings', label: 'Standings', icon: Trophy },
  { id: 'fixtures', label: 'Fixtures', icon: Calendar },
  { id: 'dev', label: 'Dev', icon: Wrench },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, isDevAuthenticated, isModerator } = useFPL();

  return (
    <nav className="md:hidden fixed bottom-1.5 left-2.5 right-2.5 z-40 max-w-[430px] mx-auto select-none">
      <div className="flex items-center justify-around py-1 px-1 rounded-2xl bg-slate-950/90 dark:bg-[#0a0f1a]/95 backdrop-blur-2xl border border-white/[0.10] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {TABS.map((tab) => {
          const isDev = tab.id === 'dev';
          const Icon = isDev && isModerator ? Shield : tab.icon;
          const isActive = activeTab === tab.id;
          const displayLabel = isDev && isModerator ? 'Mod' : tab.label;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 py-1 px-0.5 flex flex-col items-center justify-center transition-colors group z-10"
            >
              {/* Active Dock Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeDockPill"
                  className="absolute inset-0 rounded-xl bg-white/[0.08] dark:bg-white/[0.07] border border-white/15 shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? (isDev && isModerator ? 'scale-110 text-amber-400' : 'scale-110 text-emerald-400') : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {isDev && isDevAuthenticated && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-950" />
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 tracking-tight truncate max-w-[55px] transition-colors ${
                  isActive ? (isDev && isModerator ? 'font-black text-amber-400' : 'font-black text-emerald-400') : 'font-medium text-slate-400'
                }`}
              >
                {displayLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import React from 'react';
import { useFPL, TabType } from '../../context/FPLContext';
import { Shirt, ArrowLeftRight, Zap, Trophy, Calendar, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'team', label: 'Team', icon: Shirt },
  { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  { id: 'points', label: 'Points', icon: Zap },
  { id: 'leagues', label: 'Leagues', icon: Trophy },
  { id: 'fixtures', label: 'Fixtures', icon: Calendar },
  { id: 'dev', label: 'Dev', icon: Wrench },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, isDevAuthenticated } = useFPL();

  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 max-w-[420px] mx-auto select-none safe-bottom">
      <div className="flex items-center justify-around p-1.5 rounded-2xl bg-slate-950/85 dark:bg-[#0c121e]/90 backdrop-blur-xl border border-white/[0.12] shadow-[0_12px_36px_rgba(0,0,0,0.45)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDev = tab.id === 'dev';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 py-1.5 px-1 flex flex-col items-center justify-center transition-colors group z-10"
            >
              {/* Framer Motion Spring-Animated Sliding Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeDockPill"
                  className="absolute inset-0 rounded-xl bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {isDev && isDevAuthenticated && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 tracking-tight truncate max-w-[55px] transition-colors ${
                  isActive ? 'font-black text-emerald-400' : 'font-medium text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

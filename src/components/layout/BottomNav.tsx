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
    <nav className="md:hidden fixed bottom-1.5 left-2.5 right-2.5 z-40 max-w-[430px] mx-auto select-none">
      <div className="flex items-center justify-around py-1 px-1 rounded-2xl bg-slate-950/90 dark:bg-[#0a0f1a]/95 backdrop-blur-2xl border border-white/[0.10] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDev = tab.id === 'dev';

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

import React from 'react';
import { useFPL, TabType } from '../../context/FPLContext';
import { Shirt, ArrowLeftRight, Zap, Trophy, Calendar, Wrench } from 'lucide-react';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'team', label: 'Pick Team', icon: Shirt },
  { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  { id: 'points', label: 'Points', icon: Zap },
  { id: 'leagues', label: 'Leagues', icon: Trophy },
  { id: 'fixtures', label: 'Fixtures', icon: Calendar },
  { id: 'dev', label: 'Dev Mode', icon: Wrench },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, isDevAuthenticated } = useFPL();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#250029]/95 backdrop-blur-md border-t border-[#4a0951] max-w-[480px] mx-auto select-none safe-bottom">
      <div className="flex items-center justify-around px-1 py-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDev = tab.id === 'dev';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 py-1 px-0.5 flex flex-col items-center justify-center transition-all duration-200 group ${
                isActive
                  ? 'text-[#00ff87]'
                  : isDev && isDevAuthenticated
                  ? 'text-[#e90052]'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {/* Active Tab Neon Indicator Indicator */}
              {isActive && (
                <div className="absolute -top-1.5 w-7 h-1 rounded-full bg-[#00ff87] shadow-glow-green" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,255,135,0.6)]' : 'scale-100'
                  }`}
                />
                {isDev && isDevAuthenticated && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#e90052] ring-2 ring-[#250029]" />
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 font-medium tracking-tight truncate max-w-[65px] ${
                  isActive ? 'font-bold text-[#00ff87]' : 'text-gray-400'
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

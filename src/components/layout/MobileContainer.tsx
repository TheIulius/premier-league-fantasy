import React from 'react';
import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';
import { ManagerModal } from './ManagerModal';
import { AuthModal } from './AuthModal';
import { useFPL } from '../../context/FPLContext';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  const {
    isManagerModalOpen,
    setIsManagerModalOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
  } = useFPL();

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100 select-none transition-colors duration-200">
      {/* Top Header */}
      <TopHeader />

      {/* Main Scrollable View Area */}
      <main className="flex-1 w-full overflow-y-auto overscroll-contain pb-20 md:pb-10">
        <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-6">
          {children}
        </div>

        {/* School branding & creator watermark */}
        <footer className="pt-8 pb-8 text-center select-none space-y-2 border-t border-slate-200 dark:border-white/5 mt-10 max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-3">
            <img src="/kcl-logo.png" alt="KCL Logo" className="h-9 md:h-11 w-auto rounded-lg object-contain shadow-xs border border-slate-200 dark:border-white/10" />
            <img src="/komarovi-logo.png" alt="Komarovi School" className="h-5 md:h-7 w-auto object-contain opacity-75 dark:opacity-80" />
          </div>
          <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
            © Komarovi Charity League (KCL) • Created By Theiulius & Chaga
          </p>
        </footer>
      </main>

      {/* Fixed Bottom Navigation (Mobile Only) */}
      <BottomNav />

      {/* Friend Manager Switcher / Join Modal */}
      <ManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
      />

      {/* Secure User Registration / Password Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

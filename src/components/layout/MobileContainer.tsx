import React from 'react';
import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';
import { ManagerModal } from './ManagerModal';
import { AuthModal } from './AuthModal';
import { useFPL } from '../../context/FPLContext';
import { Wifi, Battery, Signal } from 'lucide-react';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0e0010] py-0 md:py-6 px-0 md:px-4">
      {/* Mobile Smartphone Frame Container */}
      <div className="relative w-full max-w-[440px] min-h-screen md:min-h-[860px] md:max-h-[920px] bg-[#1a001d] md:rounded-[40px] shadow-[0_0_60px_rgba(55,0,60,0.8)] border-0 md:border-[8px] md:border-[#2f0334] overflow-hidden flex flex-col select-none">
        {/* Dynamic Island / Notch on Desktop Preview */}
        <div className="hidden md:flex justify-between items-center px-6 pt-2.5 pb-1 text-[11px] font-semibold text-gray-300 z-50 bg-[#2a002e] border-b border-white/5">
          <span>9:41</span>
          {/* Virtual Camera pill */}
          <div className="w-20 h-4 bg-black/70 rounded-full mx-auto" />
          <div className="flex items-center space-x-1.5 text-gray-300">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Top Header */}
        <TopHeader />

        {/* Main Scrollable View Area */}
        <main className="flex-1 overflow-y-auto overscroll-contain pb-20">
          {children}

          {/* School branding & creator watermark */}
          <footer className="pt-6 pb-4 text-center select-none space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <img src="/komarovi-logo.png" alt="Komarovi School" className="h-5 w-auto object-contain opacity-75" />
            </div>
            <p className="text-[10px] text-gray-400/60 font-medium tracking-wide">
              © Komarovi Charity League • (Created By TheIulius)
            </p>
          </footer>
        </main>

        {/* Fixed Bottom Navigation */}
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
    </div>
  );
};

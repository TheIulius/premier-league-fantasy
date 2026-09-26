import React from 'react';
import { FPLProvider, useFPL } from './context/FPLContext';
import { MobileContainer } from './components/layout/MobileContainer';
import { PickTeamView } from './components/views/PickTeamView';
import { TransfersView } from './components/views/TransfersView';
import { StandingsView } from './components/views/StandingsView';
import { FixturesView } from './components/views/FixturesView';
import { AdminPortal } from './components/admin/AdminPortal';
import { AuthLandingView } from './components/auth/AuthLandingView';
import { PendingApprovalOverlay } from './components/auth/PendingApprovalOverlay';

const AppContent: React.FC = () => {
  const { activeTab, authUser, isDemoMode } = useFPL();

  if (!authUser && !isDemoMode) {
    return <AuthLandingView />;
  }

  const isAccountApproved = isDemoMode || authUser?.isAdmin || Boolean(authUser?.isApproved);

  if (!isAccountApproved) {
    return <PendingApprovalOverlay />;
  }

  return (
    <div className="relative min-h-screen w-full">
      <MobileContainer>
        {activeTab === 'team' && <PickTeamView />}
        {activeTab === 'transfers' && <TransfersView />}
        {(activeTab === 'standings' || (activeTab as any) === 'leagues' || (activeTab as any) === 'points') && (
          <StandingsView />
        )}
        {activeTab === 'fixtures' && <FixturesView />}
        {activeTab === 'dev' && <AdminPortal />}
      </MobileContainer>
    </div>
  );
};

export default function App() {
  return (
    <FPLProvider>
      <AppContent />
    </FPLProvider>
  );
}

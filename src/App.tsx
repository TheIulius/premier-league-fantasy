import React from 'react';
import { FPLProvider, useFPL } from './context/FPLContext';
import { MobileContainer } from './components/layout/MobileContainer';
import { PickTeamView } from './components/views/PickTeamView';
import { TransfersView } from './components/views/TransfersView';
import { StandingsView } from './components/views/StandingsView';
import { FixturesView } from './components/views/FixturesView';
import { AdminPortal } from './components/admin/AdminPortal';

const AppContent: React.FC = () => {
  const { activeTab } = useFPL();

  return (
    <MobileContainer>
      {activeTab === 'team' && <PickTeamView />}
      {activeTab === 'transfers' && <TransfersView />}
      {(activeTab === 'standings' || (activeTab as any) === 'leagues' || (activeTab as any) === 'points') && (
        <StandingsView />
      )}
      {activeTab === 'fixtures' && <FixturesView />}
      {activeTab === 'dev' && <AdminPortal />}
    </MobileContainer>
  );
};

export default function App() {
  return (
    <FPLProvider>
      <AppContent />
    </FPLProvider>
  );
}

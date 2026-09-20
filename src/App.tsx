import React from 'react';
import { FPLProvider, useFPL } from './context/FPLContext';
import { MobileContainer } from './components/layout/MobileContainer';
import { PickTeamView } from './components/views/PickTeamView';
import { TransfersView } from './components/views/TransfersView';
import { PointsView } from './components/views/PointsView';
import { LeaguesView } from './components/views/LeaguesView';
import { FixturesView } from './components/views/FixturesView';
import { AdminPortal } from './components/admin/AdminPortal';

const AppContent: React.FC = () => {
  const { activeTab } = useFPL();

  return (
    <MobileContainer>
      {activeTab === 'team' && <PickTeamView />}
      {activeTab === 'transfers' && <TransfersView />}
      {activeTab === 'points' && <PointsView />}
      {activeTab === 'leagues' && <LeaguesView />}
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

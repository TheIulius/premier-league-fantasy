import React, { useState, useEffect } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Position, Player, PlayerStats, Fixture } from '../../types/fpl';
import { CLUBS } from '../../data/clubs';
import { KitJersey } from '../pitch/KitJersey';
import {
  Wrench,
  Lock,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Zap,
  Check,
  AlertCircle,
  Play,
  ArrowRight,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Activity,
  Layers,
  Key,
  Users as UsersIcon,
  Database,
  Download,
  Upload,
  ExternalLink,
  GitBranch,
  Save,
} from 'lucide-react';
import {
  adminFetchUsersApi,
  adminResetPasswordApi,
  adminExportDbUrl,
  adminImportDbApi,
  adminSyncGithubApi,
  adminGetSyncStatusApi,
  adminSetServerTokenApi,
} from '../../services/api';
import confetti from 'canvas-confetti';

export const AdminPortal: React.FC = () => {
  const {
    isDevAuthenticated,
    devLogin,
    devLogout,
    players,
    clubs,
    fixtures,
    currentGW,
    updatePlayerStats,
    addCustomPlayer,
    editPlayer,
    deletePlayer,
    addFixture,
    updateFixture,
    deleteFixture,
    addClub,
    simulateGameweek,
    finalizeGameweek,
    advanceGameweek,
    resetToDefaults,
  } = useFPL();

  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [adminTab, setAdminTab] = useState<'fixtures' | 'events' | 'players' | 'users' | 'gw'>('fixtures');

  // Users & Password Management State
  const [usersList, setUsersList] = useState<{
    id: string;
    username: string;
    email?: string;
    managerName: string;
    teamName: string;
    createdAt?: string;
  }[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await adminFetchUsersApi();
      if (res.users) {
        setUsersList(res.users);
      }
    } catch {
      showNotification('Failed to fetch registered users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleResetPassword = async (username: string, pass: string) => {
    if (!pass || pass.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }
    setIsResetting(true);
    try {
      const res = await adminResetPasswordApi(username, pass);
      showNotification(res.message || `Password for @${username} was reset successfully!`);
      setNewPasswordInput('');
      setResetTargetUser('');
    } catch (err: any) {
      alert(err?.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  // Database Sync & Persistence State
  const [githubToken, setGithubToken] = useState<string>(() => {
    return localStorage.getItem('fpl_admin_gh_token') || '';
  });
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [lastCommitUrl, setLastCommitUrl] = useState<string | null>(null);
  const [isImportingDb, setIsImportingDb] = useState(false);
  const [serverSyncStatus, setServerSyncStatus] = useState<{
    hasServerToken: boolean;
    owner: string;
    repo: string;
    branch: string;
  } | null>(null);

  useEffect(() => {
    if (isDevAuthenticated) {
      adminGetSyncStatusApi().then(setServerSyncStatus).catch(() => {});
    }
  }, [isDevAuthenticated]);

  const handleSetServerToken = async () => {
    if (!githubToken.trim()) {
      alert('Please enter a GitHub Personal Access Token first.');
      return;
    }
    try {
      await adminSetServerTokenApi(githubToken.trim());
      localStorage.setItem('fpl_admin_gh_token', githubToken.trim());
      const status = await adminGetSyncStatusApi();
      setServerSyncStatus(status);
      showNotification('🟢 Token activated on server! Background auto-sync is now active.');
    } catch (err: any) {
      alert(err.message || 'Failed to activate token on server');
    }
  };

  const handleSyncToGithub = async () => {
    if (!githubToken.trim()) {
      alert('Please enter your GitHub Personal Access Token (classic or fine-grained with Repository Contents write permission).');
      return;
    }
    setIsSyncingGithub(true);
    setLastCommitUrl(null);
    try {
      localStorage.setItem('fpl_admin_gh_token', githubToken.trim());
      const res = await adminSyncGithubApi({
        token: githubToken.trim(),
        message: `Admin update: player prices & game database - GW ${currentGW}`,
      });
      if (res.success) {
        showNotification('Database successfully committed to GitHub repository!');
        setLastCommitUrl(res.commitUrl || null);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00ff87', '#04f5ff'],
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to sync database to GitHub');
    } finally {
      setIsSyncingGithub(false);
    }
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || !parsed.players) {
          alert('Invalid database JSON file format.');
          return;
        }
        setIsImportingDb(true);
        await adminImportDbApi(parsed);
        showNotification('Database imported successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: any) {
        alert(err.message || 'Failed to parse JSON file');
      } finally {
        setIsImportingDb(false);
      }
    };
    reader.readAsText(file);
  };


  // Games & Fixtures Admin State
  const [selectedGWForFix, setSelectedGWForFix] = useState<number>(currentGW);
  const [isAddingFixture, setIsAddingFixture] = useState<boolean>(false);
  const [newFixHome, setNewFixHome] = useState<string>('SCH');
  const [newFixAway, setNewFixAway] = useState<string>('SCH_11_2');
  const [newFixKickoff, setNewFixKickoff] = useState<string>('Fri 15:30');
  const [newFixStatus, setNewFixStatus] = useState<'upcoming' | 'live' | 'finished'>('upcoming');
  const [newFixHomeScore, setNewFixHomeScore] = useState<string>('0');
  const [newFixAwayScore, setNewFixAwayScore] = useState<string>('0');

  // Custom School Team State
  const [isAddingTeam, setIsAddingTeam] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamShort, setNewTeamShort] = useState<string>('');
  const [newTeamPrimaryColor, setNewTeamPrimaryColor] = useState<string>('#37003c');
  const [newTeamSecondaryColor, setNewTeamSecondaryColor] = useState<string>('#00ff87');

  // Live Stat Entry State
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    Object.keys(players)[0] || ''
  );
  const [gwForStats, setGwForStats] = useState<number>(currentGW);

  // New Player Form State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerWebName, setNewPlayerWebName] = useState('');
  const [newPlayerClub, setNewPlayerClub] = useState('SCH');
  const [newPlayerPos, setNewPlayerPos] = useState<Position>('MID');
  const [newPlayerCost, setNewPlayerCost] = useState('8.0');

  // Edit Player State
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState('');

  // Notifications
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 3500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await devLogin(pinInput);
    if (ok) {
      setLoginError(false);
      setPinInput('');
    } else {
      setLoginError(true);
    }
  };

  const selectedPlayer = players[selectedPlayerId];
  const currentStats: PlayerStats = (selectedPlayer && selectedPlayer.gwStats[gwForStats]) || {
    minutes: 0,
    goals: 0,
    assists: 0,
    cleanSheet: false,
    goalsConceded: 0,
    yellowCards: 0,
    redCards: 0,
    saves: 0,
    penaltiesSaved: 0,
    penaltiesMissed: 0,
    ownGoals: 0,
    bonus: 0,
  };

  const adjustStat = (field: keyof PlayerStats, delta: number | boolean) => {
    if (!selectedPlayerId) return;

    if (typeof delta === 'boolean') {
      updatePlayerStats(selectedPlayerId, gwForStats, { [field]: delta });
    } else {
      const currentVal = (currentStats[field] as number) || 0;
      const newVal = Math.max(0, currentVal + delta);
      updatePlayerStats(selectedPlayerId, gwForStats, { [field]: newVal });
    }
    showNotification(`Updated ${field} for ${selectedPlayer?.webName}`);
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const costNum = parseFloat(newPlayerCost) || 5.0;
    const added = addCustomPlayer({
      name: newPlayerName.trim(),
      webName: newPlayerWebName.trim() || newPlayerName.trim().split(' ').slice(-1)[0],
      clubId: newPlayerClub,
      position: newPlayerPos,
      cost: costNum,
    });

    setNewPlayerName('');
    setNewPlayerWebName('');
    showNotification(`Added ${added.webName} to database!`);
    setSelectedPlayerId(added.id);
  };

  const handleSimulate = () => {
    simulateGameweek(currentGW);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#00ff87', '#04f5ff'],
    });
    showNotification(`Simulated Gameweek ${currentGW} match day results!`);
  };

  const handleFinalize = () => {
    finalizeGameweek();
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ff87', '#e90052', '#04f5ff'],
    });
    showNotification(`Finalized Gameweek ${currentGW} & updated league rankings!`);
  };

  const handleCreateFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFixHome || !newFixAway) {
      showNotification('Please select both home and away teams');
      return;
    }
    if (newFixHome === newFixAway) {
      showNotification('Home and Away teams must be different');
      return;
    }

    const homeScore = newFixStatus === 'upcoming' ? null : parseInt(newFixHomeScore, 10) || 0;
    const awayScore = newFixStatus === 'upcoming' ? null : parseInt(newFixAwayScore, 10) || 0;

    await addFixture({
      gameweek: selectedGWForFix,
      homeClubId: newFixHome,
      awayClubId: newFixAway,
      homeScore,
      awayScore,
      isFinished: newFixStatus === 'finished',
      isLive: newFixStatus === 'live',
      kickoffTime: newFixKickoff.trim() || 'TBD',
    });

    const homeClubName = clubs[newFixHome]?.name || newFixHome;
    const awayClubName = clubs[newFixAway]?.name || newFixAway;

    showNotification(`Scheduled ${homeClubName} vs ${awayClubName}!`);
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#00ff87', '#37003c'],
    });
    setIsAddingFixture(false);
  };

  const handleQuickScore = async (fix: Fixture, team: 'home' | 'away', delta: number) => {
    const currentH = fix.homeScore ?? 0;
    const currentA = fix.awayScore ?? 0;
    const newH = team === 'home' ? Math.max(0, currentH + delta) : currentH;
    const newA = team === 'away' ? Math.max(0, currentA + delta) : currentA;

    await updateFixture(fix.id, {
      homeScore: newH,
      awayScore: newA,
      isFinished: fix.isFinished || (!fix.isLive && true),
      isLive: fix.isLive,
    });
  };

  const handleToggleStatus = async (fix: Fixture) => {
    if (!fix.isLive && !fix.isFinished) {
      await updateFixture(fix.id, {
        isLive: true,
        isFinished: false,
        homeScore: fix.homeScore ?? 0,
        awayScore: fix.awayScore ?? 0,
      });
      showNotification('Match marked as LIVE');
    } else if (fix.isLive) {
      await updateFixture(fix.id, {
        isLive: false,
        isFinished: true,
      });
      showNotification('Match marked as Finished (FT)');
    } else {
      await updateFixture(fix.id, {
        isLive: false,
        isFinished: false,
        homeScore: null,
        awayScore: null,
      });
      showNotification('Match reset to Upcoming');
    }
  };

  const handleDeleteFixture = async (fixId: string) => {
    if (confirm('Are you sure you want to delete this game fixture?')) {
      await deleteFixture(fixId);
      showNotification('Game deleted');
    }
  };

  const handleCreateSchoolTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      showNotification('Please enter a team name');
      return;
    }
    const created = await addClub({
      name: newTeamName.trim(),
      shortName: newTeamShort.trim(),
      primaryColor: newTeamPrimaryColor,
      secondaryColor: newTeamSecondaryColor,
    });
    setNewFixHome(created.id);
    setIsAddingTeam(false);
    setNewTeamName('');
    setNewTeamShort('');
    showNotification(`Created school team: ${created.name}`);
  };

  // LOGIN SCREEN
  if (!isDevAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-[70vh] select-none">
        <div className="w-full max-w-sm p-6 rounded-3xl bg-gradient-to-b from-[#2e0033] to-[#1a001d] border border-[#5d0e68] shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00ff87] to-[#04f5ff] p-[2px] mx-auto mb-4 shadow-glow-green flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-[#37003c] flex items-center justify-center">
              <Lock className="w-7 h-7 text-[#00ff87]" />
            </div>
          </div>

          <h2 className="text-lg font-black text-white uppercase tracking-tight">
            Developer Login
          </h2>
          <p className="text-xs text-gray-400 mt-1 mb-5">
            Admin access to enter goals, assists, player stats, and manage fixtures.
          </p>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="relative">
              <input
                type="password"
                placeholder="Enter admin password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setLoginError(false);
                }}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-center text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="text-[11px] font-bold text-[#e90052] flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Incorrect password. Access denied.
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#00ff87] to-[#00cc6a] text-[#37003c] shadow-glow-green hover:opacity-90"
            >
              Sign In to Dev Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD
  return (
    <div className="flex flex-col space-y-3 pb-24 px-2 pt-2 select-none">
      {/* Dev Header */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-[#320037] via-[#43004a] to-[#250029] border border-[#00ff87]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#00ff87]/20 text-[#00ff87]">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black text-white uppercase tracking-tight block">
              Developer Portal
            </span>
            <span className="text-[10px] text-[#00ff87] font-semibold">
              Live Data & Match Admin Active
            </span>
          </div>
        </div>

        <button
          onClick={devLogout}
          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-gray-300"
        >
          Sign Out
        </button>
      </div>

      {/* Notification Toast */}
      {bannerNotice && (
        <div className="p-2 rounded-xl bg-[#00ff87]/20 border border-[#00ff87]/50 text-xs font-bold text-[#00ff87] flex items-center gap-1.5 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* Sub-Panel Switcher */}
      <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-bold">
        <button
          onClick={() => setAdminTab('fixtures')}
          className={`py-1.5 rounded-lg transition-all ${
            adminTab === 'fixtures' ? 'bg-[#00ff87] text-[#37003c]' : 'text-gray-400 hover:text-white'
          }`}
        >
          🏟️ Games
        </button>
        <button
          onClick={() => setAdminTab('events')}
          className={`py-1.5 rounded-lg transition-all ${
            adminTab === 'events' ? 'bg-[#00ff87] text-[#37003c]' : 'text-gray-400 hover:text-white'
          }`}
        >
          ⚽ Stats
        </button>
        <button
          onClick={() => setAdminTab('players')}
          className={`py-1.5 rounded-lg transition-all ${
            adminTab === 'players' ? 'bg-[#00ff87] text-[#37003c]' : 'text-gray-400 hover:text-white'
          }`}
        >
          👤 Squad
        </button>
        <button
          onClick={() => {
            setAdminTab('users');
            loadUsers();
          }}
          className={`py-1.5 rounded-lg transition-all ${
            adminTab === 'users' ? 'bg-[#00ff87] text-[#37003c]' : 'text-gray-400 hover:text-white'
          }`}
        >
          🔑 Users
        </button>
        <button
          onClick={() => setAdminTab('gw')}
          className={`py-1.5 rounded-lg transition-all ${
            adminTab === 'gw' ? 'bg-[#00ff87] text-[#37003c]' : 'text-gray-400 hover:text-white'
          }`}
        >
          ⚙️ Ops
        </button>
      </div>

      {/* PANEL 0: GAMES & FIXTURES ADMIN */}
      {adminTab === 'fixtures' && (
        <div className="space-y-3">
          {/* Top Control Bar: GW Selector + New Game + New Team */}
          <div className="p-3 rounded-2xl bg-[#2a002e] border border-[#520d5a] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setSelectedGWForFix((prev) => Math.max(1, prev - 1))}
                  disabled={selectedGWForFix <= 1}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-white px-2 py-0.5 rounded-lg bg-black/40 border border-white/10">
                  GW {selectedGWForFix} Games
                </span>
                <button
                  onClick={() => setSelectedGWForFix((prev) => prev + 1)}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setIsAddingFixture(!isAddingFixture);
                    setIsAddingTeam(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-black bg-[#00ff87] text-[#37003c] flex items-center gap-1 shadow-glow-green"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isAddingFixture ? 'Close' : 'Add Game'}
                </button>
                <button
                  onClick={() => {
                    setIsAddingTeam(!isAddingTeam);
                    setIsAddingFixture(false);
                  }}
                  className="px-2 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10"
                >
                  + School Team
                </button>
              </div>
            </div>

            {/* Quick Add School Team Drawer */}
            {isAddingTeam && (
              <form onSubmit={handleCreateSchoolTeam} className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 mt-2">
                <span className="text-[11px] font-bold text-[#00ff87] uppercase block">
                  Add New School Class / Team
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Team Name (e.g. Team 10/2)"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                  />
                  <input
                    type="text"
                    placeholder="Short (e.g. 10/2)"
                    value={newTeamShort}
                    onChange={(e) => setNewTeamShort(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>Color:</span>
                    <input
                      type="color"
                      value={newTeamPrimaryColor}
                      onChange={(e) => setNewTeamPrimaryColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                    />
                  </div>
                  <button
                    type="submit"
                    className="ml-auto px-3 py-1.5 rounded-lg bg-[#00ff87] text-[#37003c] font-black text-xs"
                  >
                    Save Team
                  </button>
                </div>
              </form>
            )}

            {/* Quick Add Game Form */}
            {isAddingFixture && (
              <form onSubmit={handleCreateFixture} className="p-3 rounded-xl bg-black/40 border border-[#00ff87]/30 space-y-2.5 mt-2">
                <span className="text-[11px] font-bold text-white uppercase block">
                  Schedule New Game (GW {selectedGWForFix})
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Home Team</label>
                    <select
                      value={newFixHome}
                      onChange={(e) => setNewFixHome(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff87]"
                    >
                      {Object.values(clubs).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Away Team</label>
                    <select
                      value={newFixAway}
                      onChange={(e) => setNewFixAway(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff87]"
                    >
                      {Object.values(clubs).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Kickoff Time / Day</label>
                    <input
                      type="text"
                      placeholder="e.g. Fri 15:30"
                      value={newFixKickoff}
                      onChange={(e) => setNewFixKickoff(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff87]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Match Status</label>
                    <select
                      value={newFixStatus}
                      onChange={(e: any) => setNewFixStatus(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#00ff87]"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="live">LIVE</option>
                      <option value="finished">Finished (FT)</option>
                    </select>
                  </div>
                </div>

                {newFixStatus !== 'upcoming' && (
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Home Score</label>
                      <input
                        type="number"
                        min="0"
                        value={newFixHomeScore}
                        onChange={(e) => setNewFixHomeScore(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Away Score</label>
                      <input
                        type="number"
                        min="0"
                        value={newFixAwayScore}
                        onChange={(e) => setNewFixAwayScore(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white text-center font-bold"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingFixture(false)}
                    className="w-1/3 py-2 rounded-lg text-xs font-bold text-gray-400 bg-white/5 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#00ff87] to-[#00cc6a] text-[#37003c] shadow-glow-green"
                  >
                    Schedule Match
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* List of Scheduled Games for GW */}
          <div className="space-y-2">
            {fixtures.filter((f) => f.gameweek === selectedGWForFix).length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 bg-[#200024] rounded-2xl border border-white/5 space-y-2">
                <Calendar className="w-8 h-8 text-gray-500 mx-auto opacity-50" />
                <p>No games scheduled for Gameweek {selectedGWForFix}.</p>
                <button
                  onClick={() => setIsAddingFixture(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#00ff87] text-[#37003c] font-black text-xs hover:opacity-90 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Schedule First Game
                </button>
              </div>
            ) : (
              fixtures
                .filter((f) => f.gameweek === selectedGWForFix)
                .map((fix) => {
                  const home = clubs[fix.homeClubId] || CLUBS[fix.homeClubId] || { name: fix.homeClubId, primaryColor: '#555' };
                  const away = clubs[fix.awayClubId] || CLUBS[fix.awayClubId] || { name: fix.awayClubId, primaryColor: '#555' };

                  return (
                    <div
                      key={fix.id}
                      className="p-3 rounded-xl bg-[#200024] border border-white/10 space-y-2 shadow-md"
                    >
                      <div className="flex items-center justify-between text-xs">
                        {/* Home Team */}
                        <div className="flex-1 flex items-center justify-end space-x-2 text-right">
                          <span className="font-bold text-white truncate max-w-[95px]">{home.name}</span>
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white/30 flex-shrink-0"
                            style={{ backgroundColor: home.primaryColor }}
                          />
                        </div>

                        {/* Score Controller Center */}
                        <div className="mx-2 flex items-center space-x-1.5">
                          <button
                            onClick={() => handleQuickScore(fix, 'home', -1)}
                            className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="min-w-[42px] px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-center font-black text-sm text-[#00ff87]">
                            {fix.homeScore ?? 0} - {fix.awayScore ?? 0}
                          </span>
                          <button
                            onClick={() => handleQuickScore(fix, 'home', 1)}
                            className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs"
                          >
                            +
                          </button>

                          <span className="text-gray-500 font-bold px-0.5">|</span>

                          <button
                            onClick={() => handleQuickScore(fix, 'away', -1)}
                            className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleQuickScore(fix, 'away', 1)}
                            className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Away Team */}
                        <div className="flex-1 flex items-center justify-start space-x-2 text-left">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white/30 flex-shrink-0"
                            style={{ backgroundColor: away.primaryColor }}
                          />
                          <span className="font-bold text-white truncate max-w-[95px]">{away.name}</span>
                        </div>
                      </div>

                      {/* Bottom row: Status Toggle & Kickoff & Delete */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                        <button
                          onClick={() => handleToggleStatus(fix)}
                          className={`px-2 py-0.5 rounded-full font-bold uppercase transition-all ${
                            fix.isFinished
                              ? 'bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/40'
                              : fix.isLive
                              ? 'bg-[#e90052]/20 text-[#e90052] border border-[#e90052] animate-pulse'
                              : 'bg-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          {fix.isFinished ? '✓ Finished (FT)' : fix.isLive ? '● LIVE' : '🕒 Upcoming'}
                        </button>

                        <span className="text-gray-400 font-medium">{fix.kickoffTime}</span>

                        <button
                          onClick={() => handleDeleteFixture(fix.id)}
                          className="p-1 rounded text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                          title="Delete Game"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* PANEL 1: LIVE MATCH DATA & STAT ENTRY */}
      {adminTab === 'events' && (
        <div className="space-y-3">
          {/* Quick Simulation Bar */}
          <div className="p-3 rounded-2xl bg-[#2a002e] border border-[#520d5a] flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-white block">Auto-Simulate Match Day</span>
              <span className="text-[10px] text-gray-400">
                Randomize realistic goals, assists & clean sheets for GW {currentGW}
              </span>
            </div>
            <button
              onClick={handleSimulate}
              className="px-3 py-1.5 rounded-lg font-black text-xs bg-gradient-to-r from-[#04f5ff] to-[#00ff87] text-[#111] shadow-glow-cyan flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              Simulate
            </button>
          </div>

          {/* Select Player & Gameweek */}
          <div className="p-3 rounded-2xl bg-[#220026] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-300 uppercase">
                Select Footballer for Live Entry
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">GW:</span>
                <select
                  value={gwForStats}
                  onChange={(e) => setGwForStats(parseInt(e.target.value, 10))}
                  className="bg-black/60 border border-white/10 text-white rounded px-1.5 py-0.5 text-xs font-bold focus:outline-none"
                >
                  {[1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>
                      GW {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Player dropdown */}
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#00ff87]"
            >
              {Object.values(players).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.webName}) • {p.position} • {p.clubId} • £{p.cost.toFixed(1)}m
                </option>
              ))}
            </select>

            {/* Selected Player Preview Card */}
            {selectedPlayer && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <KitJersey clubId={selectedPlayer.clubId} position={selectedPlayer.position} className="w-8 h-8" />
                  <div>
                    <div className="text-xs font-black text-white">{selectedPlayer.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {selectedPlayer.position} • {clubs[selectedPlayer.clubId]?.name || CLUBS[selectedPlayer.clubId]?.name || selectedPlayer.clubId}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">GW {gwForStats} Pts</span>
                  <span className="text-base font-black text-[#00ff87]">
                    {selectedPlayer.gwPoints} pts
                  </span>
                </div>
              </div>
            )}

            {/* Stepper Inputs for Match Stats */}
            {selectedPlayer && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                {/* Minutes Played */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">Minutes</span>
                    <span className="text-xs font-black text-white">{currentStats.minutes}'</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustStat('minutes', -15)}
                      className="flex-1 py-1 bg-white/5 hover:bg-white/10 rounded font-bold text-xs"
                    >
                      -15
                    </button>
                    <button
                      onClick={() => updatePlayerStats(selectedPlayerId, gwForStats, { minutes: 90 })}
                      className="flex-1 py-1 bg-[#00ff87]/20 text-[#00ff87] rounded font-bold text-xs"
                    >
                      90'
                    </button>
                    <button
                      onClick={() => adjustStat('minutes', 15)}
                      className="flex-1 py-1 bg-white/5 hover:bg-white/10 rounded font-bold text-xs"
                    >
                      +15
                    </button>
                  </div>
                </div>

                {/* Goals */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">⚽ Goals</span>
                    <span className="text-xs font-black text-[#00ff87]">{currentStats.goals}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustStat('goals', -1)}
                      className="flex-1 py-1 bg-white/5 hover:bg-white/10 rounded font-bold text-xs"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => adjustStat('goals', 1)}
                      className="flex-1 py-1 bg-[#00ff87] text-[#111] rounded font-bold text-xs"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Assists */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">🅰️ Assists</span>
                    <span className="text-xs font-black text-[#04f5ff]">{currentStats.assists}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustStat('assists', -1)}
                      className="flex-1 py-1 bg-white/5 hover:bg-white/10 rounded font-bold text-xs"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => adjustStat('assists', 1)}
                      className="flex-1 py-1 bg-[#04f5ff] text-[#111] rounded font-bold text-xs"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Clean Sheet */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">🧤 Clean Sheet</span>
                    <span className={`text-xs font-black ${currentStats.cleanSheet ? 'text-[#00ff87]' : 'text-gray-500'}`}>
                      {currentStats.cleanSheet ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <button
                    onClick={() => adjustStat('cleanSheet', !currentStats.cleanSheet)}
                    className={`w-full py-1 rounded font-bold text-xs ${
                      currentStats.cleanSheet
                        ? 'bg-[#00ff87] text-[#111]'
                        : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    Toggle Clean Sheet
                  </button>
                </div>

                {/* Bonus Points */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">⭐ Bonus</span>
                    <span className="text-xs font-black text-yellow-400">+{currentStats.bonus}</span>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((b) => (
                      <button
                        key={b}
                        onClick={() => updatePlayerStats(selectedPlayerId, gwForStats, { bonus: b })}
                        className={`flex-1 py-1 rounded font-bold text-xs ${
                          currentStats.bonus === b
                            ? 'bg-yellow-400 text-black'
                            : 'bg-white/5 text-gray-400'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Yellow / Red Cards */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">Cards</span>
                    <span className="text-xs font-bold">
                      🟨 {currentStats.yellowCards} | 🟥 {currentStats.redCards}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustStat('yellowCards', currentStats.yellowCards > 0 ? -1 : 1)}
                      className={`flex-1 py-1 rounded font-bold text-xs ${
                        currentStats.yellowCards > 0 ? 'bg-yellow-400 text-black' : 'bg-white/5 text-gray-300'
                      }`}
                    >
                      🟨
                    </button>
                    <button
                      onClick={() => adjustStat('redCards', currentStats.redCards > 0 ? -1 : 1)}
                      className={`flex-1 py-1 rounded font-bold text-xs ${
                        currentStats.redCards > 0 ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-300'
                      }`}
                    >
                      🟥
                    </button>
                  </div>
                </div>

                {/* Saves (for Goalkeepers) */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">Saves</span>
                    <span className="text-xs font-black text-white">{currentStats.saves}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustStat('saves', -1)}
                      className="flex-1 py-1 bg-white/5 rounded font-bold text-xs"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => adjustStat('saves', 1)}
                      className="flex-1 py-1 bg-white/15 rounded font-bold text-xs text-white"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Goals Conceded */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">Conceded</span>
                    <span className="text-xs font-black text-red-400">{currentStats.goalsConceded}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustStat('goalsConceded', -1)}
                      className="flex-1 py-1 bg-white/5 rounded font-bold text-xs"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => adjustStat('goalsConceded', 1)}
                      className="flex-1 py-1 bg-red-500/30 text-red-300 rounded font-bold text-xs"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PANEL 2: PLAYER MANAGEMENT (ADD/EDIT/DELETE) */}
      {adminTab === 'players' && (
        <div className="space-y-3">
          {/* Add New Player Form */}
          <form
            onSubmit={handleAddPlayer}
            className="p-3 rounded-2xl bg-[#220026] border border-white/10 space-y-2.5"
          >
            <span className="text-xs font-black text-[#00ff87] uppercase flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add New Footballer
            </span>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Full Name (e.g. Cole Palmer)"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                required
              />
              <input
                type="text"
                placeholder="Short Web Name (e.g. Palmer)"
                value={newPlayerWebName}
                onChange={(e) => setNewPlayerWebName(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Club selector */}
              <select
                value={newPlayerClub}
                onChange={(e) => setNewPlayerClub(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                {Object.values(clubs).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortName} - {c.name}
                  </option>
                ))}
              </select>

              {/* Position selector */}
              <select
                value={newPlayerPos}
                onChange={(e: any) => setNewPlayerPos(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="GKP">GKP</option>
                <option value="DEF">DEF</option>
                <option value="MID">MID</option>
                <option value="FWD">FWD</option>
              </select>

              {/* Cost */}
              <input
                type="number"
                step="0.1"
                min="4.0"
                max="16.0"
                placeholder="Cost £m"
                value={newPlayerCost}
                onChange={(e) => setNewPlayerCost(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#00ff87] text-[#37003c] rounded-lg text-xs font-black uppercase tracking-wider shadow-glow-green"
            >
              Add Player to Database
            </button>
          </form>

          {/* Existing Players List */}
          <div className="p-3 rounded-2xl bg-[#220026] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white uppercase">
                Footballers ({Object.keys(players).length})
              </span>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {Object.values(players).map((p) => {
                const isEditing = editingPlayerId === p.id;

                return (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <KitJersey clubId={p.clubId} position={p.position} className="w-6 h-6" />
                      <div>
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-[10px] text-gray-400">
                          {p.position} • {clubs[p.clubId]?.shortName || CLUBS[p.clubId]?.shortName || p.clubId} • £{p.cost.toFixed(1)}m • {p.totalPoints} pts
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={editCost}
                            onChange={(e) => setEditCost(e.target.value)}
                            className="w-14 bg-black border border-[#00ff87] text-white px-1 py-0.5 rounded text-xs"
                          />
                          <button
                            onClick={() => {
                              const num = parseFloat(editCost);
                              if (num > 0) {
                                editPlayer(p.id, { cost: num });
                                const savedToken = localStorage.getItem('fpl_admin_gh_token');
                                if (savedToken) {
                                  showNotification(`Updating ${p.webName} to £${num.toFixed(1)}m & syncing with GitHub...`);
                                  adminSyncGithubApi({
                                    token: savedToken,
                                    message: `Update ${p.webName} price to £${num.toFixed(1)}m`,
                                  }).then(() => {
                                    showNotification(`Updated ${p.webName} to £${num.toFixed(1)}m & saved permanently to GitHub!`);
                                  }).catch(() => {
                                    showNotification(`Updated ${p.webName} to £${num.toFixed(1)}m locally (GitHub sync failed)`);
                                  });
                                } else {
                                  showNotification(`Updated ${p.webName} to £${num.toFixed(1)}m. (Tip: Enter GitHub PAT in ⚙️ Ops to auto-save to GitHub)`);
                                }
                              }
                              setEditingPlayerId(null);
                            }}
                            className="p-1 bg-[#00ff87] text-[#111] rounded text-[10px] font-bold"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPlayerId(p.id);
                            setEditCost(p.cost.toString());
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                          title="Edit price"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => deletePlayer(p.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        title="Delete player"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PANEL 4: USERS & PASSWORD RESET */}
      {adminTab === 'users' && (
        <div className="space-y-3">
          {/* Header & Refresh */}
          <div className="p-3.5 rounded-2xl bg-[#2a002e] border border-[#520d5a] flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-white uppercase block">
                Registered Fantasy Managers
              </span>
              <span className="text-[10px] text-gray-400">
                Live database accounts registered on this website
              </span>
            </div>
            <button
              onClick={loadUsers}
              disabled={isLoadingUsers}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Quick Password Reset Form */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#2c0032] via-[#35003c] to-[#250029] border border-[#00ff87]/30 space-y-2.5">
            <span className="text-xs font-black text-[#00ff87] uppercase flex items-center gap-1.5">
              <Key className="w-4 h-4" />
              Reset A User's Password
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                  Username or Email
                </label>
                <input
                  type="text"
                  placeholder="e.g. jack or apex"
                  value={resetTargetUser}
                  onChange={(e) => setResetTargetUser(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-[#00ff87]"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">
                  New Password
                </label>
                <input
                  type="text"
                  placeholder="Enter new password (min 4 chars)"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-[#00ff87]"
                />
              </div>
            </div>
            <button
              onClick={() => handleResetPassword(resetTargetUser, newPasswordInput)}
              disabled={isResetting || !resetTargetUser || !newPasswordInput}
              className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#00ff87] to-[#00cc6a] text-[#37003c] shadow-glow-green hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#37003c]" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#37003c]" />
                  <span>Reset Password Now</span>
                </>
              )}
            </button>
          </div>

          {/* User List */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-300 block px-1">
              Registered Accounts ({usersList.length})
            </span>

            {isLoadingUsers ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading registered accounts...</div>
            ) : usersList.length === 0 ? (
              <div className="p-6 rounded-2xl bg-black/30 border border-white/10 text-center text-xs text-gray-400">
                No users loaded yet. Click "Refresh" or load users above.
              </div>
            ) : (
              usersList.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">@{u.username}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00ff87]/20 text-[#00ff87] font-bold">
                        {u.managerName}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-2">
                      <span>Team: <strong className="text-gray-200">{u.teamName}</strong></span>
                      {u.email && (
                        <>
                          <span>•</span>
                          <span>{u.email}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setResetTargetUser(u.username);
                      const promptPass = prompt(`Enter new password for @${u.username}:`);
                      if (promptPass) {
                        handleResetPassword(u.username, promptPass);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#00ff87] hover:text-[#37003c] text-xs font-bold text-gray-200 border border-white/10 transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Reset Password</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PANEL 3: GAMEWEEK OPERATIONS & RESET */}
      {adminTab === 'gw' && (
        <div className="space-y-3">
          {/* Finalize GW Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#2c0032] to-[#3a0042] border border-[#5d0e68] space-y-2">
            <span className="text-xs font-black text-white uppercase block">
              Finalize Current Gameweek {currentGW}
            </span>
            <p className="text-[11px] text-gray-300">
              Locks all matches, calculates player points with captain multipliers and auto-substitutions, updates overall league standings, and advances to GW {currentGW + 1}.
            </p>
            <button
              onClick={handleFinalize}
              className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#00ff87] to-[#00cc6a] text-[#37003c] shadow-glow-green hover:opacity-95"
            >
              Finalize GW & Update Leagues
            </button>
          </div>

          {/* Quick Advance GW without finalizing */}
          <div className="p-3 rounded-2xl bg-[#220026] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-white block">Skip / Advance GW</span>
              <span className="text-[10px] text-gray-400">Jump directly to GW {currentGW + 1}</span>
            </div>
            <button
              onClick={advanceGameweek}
              className="px-3 py-1.5 rounded-lg font-bold text-xs bg-white/10 hover:bg-white/20 text-white flex items-center gap-1"
            >
              <span>Advance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* GitHub Database Sync (Permanent Storage across Deploys) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1e0828] to-[#2c0b38] border border-[#00ff87]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-[#00ff87]" />
                GitHub Database Sync (Permanent)
              </span>
              <span className="text-[10px] font-bold text-[#00ff87] bg-[#00ff87]/10 px-2 py-0.5 rounded-full border border-[#00ff87]/30">
                Prevents Price Reset
              </span>
            </div>
            {/* Server Auto-Sync Status Indicator */}
            {serverSyncStatus?.hasServerToken ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00ff87] shadow-glow-green animate-pulse flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <strong className="text-[11px] font-black uppercase tracking-wider text-emerald-200">
                      Automatic GitHub Sync is Active!
                    </strong>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#00ff87] font-bold">
                      Zero Manual Steps
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-200/80 leading-relaxed">
                    Any change to footballer prices, squad rosters, matches, or game state is automatically committed to your repository (<strong className="text-white">{serverSyncStatus.owner}/{serverSyncStatus.repo}</strong>) in the background. Your data will never reset when Render restarts or redeploys!
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black uppercase tracking-wider text-[11px] text-amber-300 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    How to Make Saving 100% Automatic
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    One-Time Setup
                  </span>
                </div>
                <p className="text-[10px] text-amber-200/80 leading-relaxed">
                  To never have to sync manually again, add <code className="text-[#00ff87] bg-black/40 px-1 py-0.5 rounded font-mono font-bold">GITHUB_TOKEN</code> to your Render Dashboard Environment Variables, or enter your token below and click <strong>"Activate Server Auto-Sync"</strong>.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 block">
                GitHub Personal Access Token (PAT)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 bg-black/60 border border-white/15 focus:border-[#00ff87] text-white px-2.5 py-1.5 rounded-xl text-xs outline-none font-mono"
                />
                <button
                  onClick={handleSetServerToken}
                  className="px-3 py-1.5 bg-[#00ff87]/20 hover:bg-[#00ff87]/30 text-[#00ff87] border border-[#00ff87]/40 text-xs font-bold rounded-xl flex items-center gap-1"
                  title="Activate token on server for auto-sync"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Activate Auto-Sync</span>
                </button>
              </div>
              <span className="text-[9px] text-gray-500 block">
                Requires <strong>Contents: read & write</strong> (or repo) permission.
              </span>
            </div>

            <button
              onClick={handleSyncToGithub}
              disabled={isSyncingGithub}
              className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#00ff87] to-[#04f5ff] text-[#111] shadow-glow-green hover:opacity-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              <span>{isSyncingGithub ? 'Committing to GitHub...' : 'Force Manual Commit to GitHub'}</span>
            </button>

            {lastCommitUrl && (
              <a
                href={lastCommitUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#00ff87] hover:underline flex items-center gap-1 justify-center pt-1"
              >
                <span>View committed db.json on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Database Export & Import Backup */}
          <div className="p-3.5 rounded-2xl bg-[#230026] border border-white/10 space-y-2.5">
            <span className="text-xs font-black text-white uppercase flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#04f5ff]" />
              Manual Database Backup & Restore
            </span>
            <p className="text-[11px] text-gray-400">
              Download a complete JSON snapshot of all players, prices, manager squads, and fixtures to your computer, or restore from a previous file anytime.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={adminExportDbUrl}
                download="db.json"
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 text-center"
              >
                <Download className="w-3.5 h-3.5 text-[#00ff87]" />
                <span>Export db.json</span>
              </a>

              <label className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5 text-[#04f5ff]" />
                <span>{isImportingDb ? 'Importing...' : 'Import db.json'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportDatabase}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset All Data to Seed */}
          <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-2">
            <span className="text-xs font-black text-red-300 uppercase block">
              Database Reset
            </span>
            <p className="text-[11px] text-gray-400">
              Clear all changes and restore original pristine Komarovi Charity League school data (footballers, squads, school fixtures, and leagues).
            </p>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all game data to defaults?')) {
                  resetToDefaults();
                  showNotification('Reset database to default seed data');
                }
              }}
              className="w-full py-2 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40"
            >
              Reset to Factory Seed Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

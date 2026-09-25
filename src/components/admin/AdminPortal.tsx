import React, { useState, useEffect, useMemo } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Position, Player, Fixture } from '../../types/fpl';
import { CLUBS, getSortedSchoolClubs } from '../../data/clubs';
import { KitJersey } from '../pitch/KitJersey';
import { ClassShieldBadge } from '../common/ClassShieldBadge';
import { SlideToConfirm } from './SlideToConfirm';
import { CommandPalette } from './CommandPalette';
import { MatchDayAdmin } from './MatchDayAdmin';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Lock,
  Unlock,
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
  Settings,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Shield,
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

export type LifecycleStep = 1 | 2 | 3 | 4;

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
    finalizeGameweek,
    advanceGameweek,
    resetToDefaults,
    deadline,
    setDeadline,
    isSquadLocked,
    setActiveTab,
  } = useFPL();

  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // 4-Step Lifecycle Stepper
  const [activeStep, setActiveStep] = useState<LifecycleStep>(3); // Defaults to Live Matchday Console

  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Step 1: Deadline & Fixtures state
  const [deadlineInput, setDeadlineInput] = useState('');
  const [isAddingFixture, setIsAddingFixture] = useState(false);
  const [newFixHome, setNewFixHome] = useState('SCH_11_5');
  const [newFixAway, setNewFixAway] = useState('SCH_11_2');
  const [newFixKickoff, setNewFixKickoff] = useState('Fri 15:30');
  const [newFixVenue, setNewFixVenue] = useState<'parki' | 'one_price'>('parki');

  // Step 1: Player roster state
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerWebName, setNewPlayerWebName] = useState('');
  const [newPlayerClub, setNewPlayerClub] = useState('SCH_11_5');
  const [newPlayerPos, setNewPlayerPos] = useState<Position>('MID');
  const [newPlayerCost, setNewPlayerCost] = useState('8.0');

  // Step 2: Users & Lineups state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isResettingPass, setIsResettingPass] = useState(false);

  // Settings: Database Sync state
  const [githubToken, setGithubToken] = useState<string>(() => {
    return localStorage.getItem('fpl_admin_gh_token') || '';
  });
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [serverSyncStatus, setServerSyncStatus] = useState<any>(null);
  const [isImportingDb, setIsImportingDb] = useState(false);

  const showNotification = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  useEffect(() => {
    if (isDevAuthenticated) {
      adminGetSyncStatusApi().then(setServerSyncStatus).catch(() => {});
      loadUsers();
    }
  }, [isDevAuthenticated]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await adminFetchUsersApi();
      if (res.users) setUsersList(res.users);
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
    setIsResettingPass(true);
    try {
      const res = await adminResetPasswordApi(username, pass);
      showNotification(res.message || `Password for @${username} was reset!`);
      setNewPasswordInput('');
      setResetTargetUser('');
    } catch (err: any) {
      alert(err?.message || 'Failed to reset password');
    } finally {
      setIsResettingPass(false);
    }
  };

  const handleSetServerToken = async () => {
    if (!githubToken.trim()) {
      alert('Please enter a GitHub Personal Access Token.');
      return;
    }
    try {
      await adminSetServerTokenApi(githubToken.trim());
      localStorage.setItem('fpl_admin_gh_token', githubToken.trim());
      const status = await adminGetSyncStatusApi();
      setServerSyncStatus(status);
      showNotification('🟢 Token activated on server! Auto-sync is active.');
    } catch (err: any) {
      alert(err.message || 'Failed to activate token on server');
    }
  };

  const handleSyncToGithub = async () => {
    if (!githubToken.trim()) {
      alert('Please enter your GitHub Personal Access Token.');
      return;
    }
    setIsSyncingGithub(true);
    try {
      localStorage.setItem('fpl_admin_gh_token', githubToken.trim());
      const res = await adminSyncGithubApi({
        token: githubToken.trim(),
        message: `Matchday Console update: GW ${currentGW}`,
      });
      if (res.success) {
        showNotification('Database successfully committed to GitHub repository!');
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
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
          alert('Invalid database JSON format.');
          return;
        }
        setIsImportingDb(true);
        await adminImportDbApi(parsed);
        showNotification('Database imported! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: any) {
        alert(err.message || 'Failed to parse JSON');
      } finally {
        setIsImportingDb(false);
      }
    };
    reader.readAsText(file);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await devLogin(pinInput);
    if (success) {
      setLoginError(false);
      setPinInput('');
    } else {
      setLoginError(true);
    }
  };

  const handleAddFixtureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFixHome === newFixAway) {
      alert('Home and Away teams must be different.');
      return;
    }
    await addFixture({
      gameweek: currentGW,
      homeClubId: newFixHome,
      awayClubId: newFixAway,
      homeScore: null,
      awayScore: null,
      isFinished: false,
      isLive: false,
      kickoffTime: newFixKickoff,
    });
    setIsAddingFixture(false);
    showNotification('Fixture added successfully');
  };

  const handleAddPlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    addCustomPlayer({
      name: newPlayerName.trim(),
      webName: newPlayerWebName.trim() || newPlayerName.trim().split(' ')[0],
      clubId: newPlayerClub,
      position: newPlayerPos,
      cost: parseFloat(newPlayerCost) || 6.0,
    });
    setNewPlayerName('');
    setNewPlayerWebName('');
    setIsAddingPlayer(false);
    showNotification('Player added successfully');
  };

  const currentGwFixtures = fixtures.filter((f) => f.gameweek === currentGW);
  const finishedFixturesCount = currentGwFixtures.filter((f) => f.isFinished).length;
  const sortedClubs = useMemo(() => getSortedSchoolClubs(clubs), [clubs]);

  // -------------------------------------------------------------
  // PIN LOGIN GATE
  // -------------------------------------------------------------
  if (!isDevAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full space-y-5">
          <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Matchday Command Center</h2>
            <p className="text-xs text-zinc-400 mt-1">Authorized Match Officials & Admin Only</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter Admin PIN"
              maxLength={8}
              autoFocus
              className="w-full text-center tracking-widest text-xl font-mono py-3 px-4 rounded-xl bg-zinc-950 border border-white/10 text-white outline-none focus:border-emerald-500"
            />
            {loginError && (
              <p className="text-rose-400 text-xs font-bold animate-shake">Incorrect Admin PIN. Try again.</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-98"
            >
              Access Console
            </button>
          </form>
          <button
            onClick={() => setActiveTab('team')}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-300 block mx-auto"
          >
            ← Return to Fantasy League
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED MATCHDAY COMMAND CENTER
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen pb-24 text-zinc-100 font-sans select-none">
      {/* 1. DECOUPLED COMMAND CENTER NAVBAR */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Title & Ambient GitHub Sync Status Pill */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setActiveTab('team')}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Return to League"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <h1 className="font-black text-xs sm:text-sm tracking-tight text-white uppercase font-display truncate">
              Command <span className="text-emerald-400">Center</span>
            </h1>
            <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-white/10 text-emerald-400">
              GW {currentGW}
            </span>
          </div>

          {/* Ambient GitHub Sync Status Pill */}
          <div
            onClick={() => setIsSettingsOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 cursor-pointer hover:bg-emerald-500/20 transition-all"
            title="Background GitHub auto-sync active"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Synced with GitHub</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* ⌘K Command Palette Button */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-colors"
            title="Search Players (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Command Palette</span>
            <kbd className="hidden lg:inline px-1 py-0.2 rounded bg-black/40 text-[9px] font-mono text-zinc-400 border border-white/10">
              ⌘K
            </kbd>
          </button>

          {/* System Settings Drawer Toggle */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
            title="System Settings & Database"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            <span className="hidden md:inline">Settings</span>
          </button>

          {/* Dev Logout */}
          <button
            onClick={devLogout}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-zinc-400 hover:text-rose-400 transition-colors"
            title="Lock Dev Console"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Banner Notification */}
      {bannerNotice && (
        <div className="p-2 bg-emerald-500 text-slate-950 font-black text-xs text-center animate-fade-in shadow-md">
          {bannerNotice}
        </div>
      )}

      {/* 2. 4-STEP GAMEWEEK LIFECYCLE STEPPER */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-4 pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-white/10 text-xs select-none">
          {/* Step 1: Setup Deadline */}
          <button
            onClick={() => setActiveStep(1)}
            className={`p-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
              activeStep === 1
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <div className="text-left truncate">
              <span className="block text-[9px] uppercase tracking-wider opacity-75 font-mono">Step 1</span>
              <span className="truncate block">Setup Deadline</span>
            </div>
          </button>

          {/* Step 2: Lock Lineups */}
          <button
            onClick={() => setActiveStep(2)}
            className={`p-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
              activeStep === 2
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {isSquadLocked ? <Lock className="w-4 h-4 flex-shrink-0" /> : <Unlock className="w-4 h-4 flex-shrink-0" />}
            <div className="text-left truncate">
              <span className="block text-[9px] uppercase tracking-wider opacity-75 font-mono">Step 2</span>
              <span className="truncate block">Lock Lineups</span>
            </div>
          </button>

          {/* Step 3: Live Matchday Console */}
          <button
            onClick={() => setActiveStep(3)}
            className={`p-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
              activeStep === 3
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4 flex-shrink-0" />
            <div className="text-left truncate">
              <span className="block text-[9px] uppercase tracking-wider opacity-75 font-mono">Step 3</span>
              <span className="truncate block">Matchday Console</span>
            </div>
          </button>

          {/* Step 4: Finalize & Advance */}
          <button
            onClick={() => setActiveStep(4)}
            className={`p-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
              activeStep === 4
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <div className="text-left truncate">
              <span className="block text-[9px] uppercase tracking-wider opacity-75 font-mono">Step 4</span>
              <span className="truncate block">Finalize & Advance</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. STEP CONTENT CANVAS */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-3 space-y-4">
        {/* ========================================================= */}
        {/* STEP 1: SETUP DEADLINE & FIXTURES & PLAYERS               */}
        {/* ========================================================= */}
        {activeStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            {/* Deadline Configuration Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-black text-sm text-white">Gameweek {currentGW} Kickoff Deadline</h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    deadline
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  {deadline ? `Target: ${new Date(deadline.deadlineTime).toLocaleDateString()}` : 'No Deadline Set'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="datetime-local"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  className="bg-zinc-950 border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none"
                />
                <button
                  onClick={() => {
                    if (!deadlineInput) return;
                    setDeadline({
                      gameweek: currentGW,
                      deadlineTime: new Date(deadlineInput).toISOString(),
                    });
                    showNotification('Kickoff deadline saved!');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors"
                >
                  Set Deadline
                </button>
              </div>
            </div>

            {/* Fixtures Schedule & Generator */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h3 className="font-black text-sm text-white">Scheduled Fixtures (GW {currentGW})</h3>
                  <span className="text-[11px] text-zinc-400">{currentGwFixtures.length} matches set</span>
                </div>
                <button
                  onClick={() => setIsAddingFixture(!isAddingFixture)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Match</span>
                </button>
              </div>

              {/* Add Fixture Modal/Inline Form */}
              {isAddingFixture && (
                <form
                  onSubmit={handleAddFixtureSubmit}
                  className="p-4 rounded-xl bg-zinc-950/70 border border-white/10 space-y-3 animate-fade-in text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Home Class</label>
                      <select
                        value={newFixHome}
                        onChange={(e) => setNewFixHome(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2 text-white outline-none"
                      >
                        {sortedClubs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.shortName} ({c.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Away Class</label>
                      <select
                        value={newFixAway}
                        onChange={(e) => setNewFixAway(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2 text-white outline-none"
                      >
                        {sortedClubs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.shortName} ({c.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Kickoff Time</label>
                      <input
                        type="text"
                        value={newFixKickoff}
                        onChange={(e) => setNewFixKickoff(e.target.value)}
                        placeholder="e.g. Sat 14:00"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Venue</label>
                      <select
                        value={newFixVenue}
                        onChange={(e) => setNewFixVenue(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2 text-white outline-none"
                      >
                        <option value="parki">Stadium Parki (Standard Rules)</option>
                        <option value="one_price">One Price Arena (Points Double!)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingFixture(false)}
                      className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black"
                    >
                      Save Fixture
                    </button>
                  </div>
                </form>
              )}

              {/* List of current fixtures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {currentGwFixtures.map((f) => {
                  const h = CLUBS[f.homeClubId];
                  const a = CLUBS[f.awayClubId];
                  return (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl bg-zinc-950/70 border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <ClassShieldBadge clubId={f.homeClubId} size="xs" />
                        <span className="font-bold text-xs text-white">{h?.shortName}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">vs</span>
                        <ClassShieldBadge clubId={f.awayClubId} size="xs" />
                        <span className="font-bold text-xs text-white">{a?.shortName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 font-mono">{f.kickoffTime}</span>
                        <button
                          onClick={() => deleteFixture(f.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Player Creator */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="font-black text-sm text-white">Player Database Management</h3>
                <button
                  onClick={() => setIsAddingPlayer(!isAddingPlayer)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>New Player</span>
                </button>
              </div>

              {isAddingPlayer && (
                <form
                  onSubmit={handleAddPlayerSubmit}
                  className="p-3.5 rounded-xl bg-zinc-950/70 border border-white/10 space-y-3 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Full Name (e.g. Giorgi Turkia)"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      className="bg-zinc-900 border border-white/10 p-2 rounded-xl text-white outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Nickname / WebName (e.g. Turkia)"
                      value={newPlayerWebName}
                      onChange={(e) => setNewPlayerWebName(e.target.value)}
                      className="bg-zinc-900 border border-white/10 p-2 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={newPlayerClub}
                      onChange={(e) => setNewPlayerClub(e.target.value)}
                      className="bg-zinc-900 border border-white/10 p-2 rounded-xl text-white outline-none"
                    >
                      {sortedClubs.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.shortName}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newPlayerPos}
                      onChange={(e) => setNewPlayerPos(e.target.value as any)}
                      className="bg-zinc-900 border border-white/10 p-2 rounded-xl text-white outline-none"
                    >
                      <option value="GKP">GK (Goalkeeper)</option>
                      <option value="DEF">DEF (Defender)</option>
                      <option value="MID">MID (Midfielder)</option>
                      <option value="FWD">FWD (Forward)</option>
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      value={newPlayerCost}
                      onChange={(e) => setNewPlayerCost(e.target.value)}
                      placeholder="Cost (e.g. 7.5)"
                      className="bg-zinc-900 border border-white/10 p-2 rounded-xl text-white outline-none font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingPlayer(false)}
                      className="px-3 py-1 rounded-lg text-zinc-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black"
                    >
                      Create Player
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: LOCK LINEUPS & REGISTERED MANAGERS                */}
        {/* ========================================================= */}
        {activeStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            {/* Squad Lock Status Hero Card */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center border transition-all">
                {isSquadLocked ? (
                  <Lock className="w-6 h-6 text-rose-400" />
                ) : (
                  <Unlock className="w-6 h-6 text-emerald-400" />
                )}
              </div>

              <div>
                <h3 className="font-black text-lg text-white">
                  {isSquadLocked ? 'LINEUPS LOCKED FOR GW ' + currentGW : 'LINEUPS ARE OPEN FOR TRANSFERS'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  {isSquadLocked
                    ? 'All manager squads and chip selections are frozen. No transfers or substitutions are permitted.'
                    : 'Managers can freely edit starting XI, make transfers, and activate chips until kickoff.'}
                </p>
              </div>

              <div className="max-w-md mx-auto pt-2">
                <SlideToConfirm
                  label={isSquadLocked ? 'Slide to Unlock Lineups' : 'Slide to Lock Lineups for Kickoff'}
                  confirmLabel={isSquadLocked ? 'Lineups Unlocked' : 'Lineups Locked'}
                  variant={isSquadLocked ? 'warning' : 'danger'}
                  onConfirm={async () => {
                    if (isSquadLocked) {
                      await setDeadline({
                        gameweek: currentGW,
                        deadlineTime: new Date(Date.now() + 86400000 * 2).toISOString(),
                      });
                      showNotification('🔓 Lineups unlocked! Transfers are open.');
                    } else {
                      await setDeadline({
                        gameweek: currentGW,
                        deadlineTime: new Date(Date.now() - 1000).toISOString(),
                      });
                      showNotification('🔒 Lineups locked! Lineups are frozen for kickoff.');
                    }
                  }}
                />
              </div>
            </div>

            {/* Registered Users & Squad Inspection */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-black text-sm text-white">Registered Managers ({usersList.length})</h3>
                </div>
                <button
                  onClick={loadUsers}
                  disabled={isLoadingUsers}
                  className="p-1 text-zinc-400 hover:text-white"
                  title="Refresh User List"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Password reset sub-panel */}
              {resetTargetUser && (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-2 text-xs">
                  <span className="font-bold text-amber-400 block">
                    Reset Password for @{resetTargetUser}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="New password (min 4 chars)"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none flex-1 font-mono text-xs"
                    />
                    <button
                      onClick={() => handleResetPassword(resetTargetUser, newPasswordInput)}
                      disabled={isResettingPass}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold"
                    >
                      {isResettingPass ? 'Resetting...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setResetTargetUser('')}
                      className="px-2 py-1 text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* User table */}
              <div className="divide-y divide-white/[0.04] max-h-[360px] overflow-y-auto">
                {usersList.map((u) => (
                  <div key={u.id} className="py-2.5 px-2 flex items-center justify-between hover:bg-white/[0.02]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-white">{u.managerName}</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">@{u.username}</span>
                      </div>
                      <span className="text-[11px] text-zinc-400">{u.teamName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setResetTargetUser(u.username);
                          setNewPasswordInput('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300 hover:text-white"
                      >
                        Reset PW
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: LIVE MATCHDAY CONSOLE                             */}
        {/* ========================================================= */}
        {activeStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            {/* Quick ⌘K Launch Bar */}
            <div
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-3 rounded-2xl bg-zinc-900 border border-white/10 hover:border-emerald-500/40 cursor-pointer flex items-center justify-between text-xs text-zinc-400 transition-colors shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Search any player across all classes to modify live stats...</span>
              </div>
              <kbd className="px-2 py-0.5 rounded bg-black/40 text-[10px] font-mono text-zinc-300 border border-white/10">
                ⌘K / Ctrl+K
              </kbd>
            </div>

            {/* Side-by-Side Match Scoring Dashboard */}
            <MatchDayAdmin />
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: FINALIZE & ADVANCE GAMEWEEK                       */}
        {/* ========================================================= */}
        {activeStep === 4 && (
          <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
            {/* Pre-flight Checks */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-4">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Gameweek {currentGW} Finalization Checklist</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/5 flex items-center justify-between">
                  <span>Fixtures Finished:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {finishedFixturesCount} / {currentGwFixtures.length}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/5 flex items-center justify-between">
                  <span>Lineups Locked Status:</span>
                  <span className={`font-bold ${isSquadLocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isSquadLocked ? 'LOCKED ✓' : 'UNLOCKED (Recommended to Lock)'}
                  </span>
                </div>
              </div>

              {finishedFixturesCount < currentGwFixtures.length && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Warning: {currentGwFixtures.length - finishedFixturesCount} matches are still pending scores!
                  </span>
                </div>
              )}
            </div>

            {/* Destructive Action: Finalize Gameweek */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
              <h4 className="font-black text-sm text-white">Award Gameweek Points</h4>
              <p className="text-xs text-zinc-400">
                Calculates captaincy multipliers, stadium bonuses, and records final standings for all managers.
              </p>
              <SlideToConfirm
                label={`Slide to Finalize GW ${currentGW} Scores`}
                confirmLabel="Gameweek Finalized!"
                variant="emerald"
                onConfirm={async () => {
                  finalizeGameweek();
                  showNotification(`Gameweek ${currentGW} finalized and points awarded!`);
                  confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
                }}
              />
            </div>

            {/* Advance Gameweek */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
              <h4 className="font-black text-sm text-white">Advance to Next Gameweek</h4>
              <p className="text-xs text-zinc-400">
                Increments GW counter to {currentGW + 1}, refreshes free transfers, and opens the next transfer market.
              </p>
              <SlideToConfirm
                label={`Slide to Advance to GW ${currentGW + 1}`}
                confirmLabel={`Advanced to GW ${currentGW + 1}`}
                variant="warning"
                onConfirm={async () => {
                  advanceGameweek();
                  showNotification(`Advanced to Gameweek ${currentGW + 1}!`);
                  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* 4. SLIDE-OVER SETTINGS DRAWER (Technical DB Configuration) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Slide Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="relative w-full max-w-md bg-zinc-900 border-l border-white/10 shadow-2xl h-full flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-black text-sm text-white">System Settings & Database</h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
                {/* GitHub Auto-Sync Engine */}
                <div className="space-y-3 p-4 rounded-xl bg-zinc-950 border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-emerald-400" />
                      <span>GitHub Auto-Sync Engine</span>
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        serverSyncStatus?.hasServerToken
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {serverSyncStatus?.hasServerToken ? 'Active' : 'No Token'}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400">
                    Automatically commits all registrations, squad saves, transfers, and matchday scoring to GitHub
                    within 2.5s to prevent data loss on Render restarts.
                  </p>

                  <div className="space-y-2">
                    <input
                      type="password"
                      placeholder="Enter GitHub PAT (classic/contents write)"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 font-mono text-xs text-white outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSetServerToken}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400"
                      >
                        Activate Server Token
                      </button>
                      <button
                        onClick={handleSyncToGithub}
                        disabled={isSyncingGithub}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                      >
                        {isSyncingGithub ? 'Syncing...' : 'Sync Now'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Database Backup & Restore */}
                <div className="space-y-3 p-4 rounded-xl bg-zinc-950 border border-white/5">
                  <span className="font-black text-white flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-sky-400" />
                    <span>Database Backup (JSON)</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={adminExportDbUrl}
                      download="kcl_fantasy_db.json"
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-center font-bold text-zinc-200 block"
                    >
                      Export db.json
                    </a>

                    <label className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-center font-bold text-zinc-200 block cursor-pointer">
                      {isImportingDb ? 'Importing...' : 'Import db.json'}
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportDatabase}
                        disabled={isImportingDb}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Factory Reset Danger Zone */}
                <div className="space-y-3 p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
                  <span className="font-black text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Danger Zone</span>
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Wipes match scores and reverts squads to baseline sample data.
                  </p>
                  <SlideToConfirm
                    label="Slide to Reset All Data"
                    confirmLabel="Database Reset"
                    variant="danger"
                    onConfirm={() => {
                      resetToDefaults();
                      showNotification('Database reset to defaults.');
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. ⌘K COMMAND PALETTE MODAL */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        players={players}
        currentGW={currentGW}
        onUpdatePlayerStats={async (pId, s) => {
          updatePlayerStats(pId, currentGW, s);
          return true;
        }}
      />
    </div>
  );
};

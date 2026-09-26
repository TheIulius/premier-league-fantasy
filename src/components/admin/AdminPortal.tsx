import React, { useState, useEffect, useMemo } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Position, Player, Fixture, ActivationCode } from '../../types/fpl';
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
  RotateCcw,
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
  Ticket,
  CreditCard,
  Copy,
} from 'lucide-react';
import {
  adminFetchUsersApi,
  adminResetPasswordApi,
  adminExportDbUrl,
  adminImportDbApi,
  adminSyncGithubApi,
  adminGetSyncStatusApi,
  adminSetServerTokenApi,
  adminFetchActivationCodesApi,
  adminGenerateActivationCodesApi,
  adminDeleteActivationCodeApi,
} from '../../services/api';
import confetti from 'canvas-confetti';

export type LifecycleStep = 1 | 2 | 3 | 4;

export const AdminPortal: React.FC = () => {
  const {
    isDevAuthenticated,
    isModerator,
    authUser,
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
    resetCurrentGameweek,
    setGameweekNumber,
    resetToDefaults,
    deadline,
    setDeadline,
    isSquadLocked,
    setActiveTab,
    paymentSettings,
    updatePaymentSettings,
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

  // Step 2 & Settings: Charity Payment & Activation Codes
  const [bogLinkInput, setBogLinkInput] = useState(paymentSettings?.bogLink || '');
  const [tbcLinkInput, setTbcLinkInput] = useState(paymentSettings?.tbcLink || '');
  const [entryFeeInput, setEntryFeeInput] = useState(paymentSettings?.entryFeeGEL || 3);
  const [requireCodeInput, setRequireCodeInput] = useState(Boolean(paymentSettings?.requireActivationCode));
  const [isSavingPaymentSettings, setIsSavingPaymentSettings] = useState(false);
  const [activationCodes, setActivationCodes] = useState<ActivationCode[]>([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [codeFilter, setCodeFilter] = useState<'all' | 'unused' | 'used'>('all');
  const [codeSearch, setCodeSearch] = useState('');

  const showNotification = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  useEffect(() => {
    if (isDevAuthenticated) {
      adminGetSyncStatusApi().then(setServerSyncStatus).catch(() => {});
      loadUsers();
      loadActivationCodes();
    }
  }, [isDevAuthenticated]);

  useEffect(() => {
    if (paymentSettings) {
      setBogLinkInput(paymentSettings.bogLink || '');
      setTbcLinkInput(paymentSettings.tbcLink || '');
      setEntryFeeInput(paymentSettings.entryFeeGEL ?? 3);
      setRequireCodeInput(Boolean(paymentSettings.requireActivationCode));
    }
  }, [paymentSettings]);

  const loadActivationCodes = async () => {
    setIsLoadingCodes(true);
    try {
      const codes = await adminFetchActivationCodesApi();
      setActivationCodes(codes);
    } catch {
      showNotification('Failed to fetch activation codes');
    } finally {
      setIsLoadingCodes(false);
    }
  };

  const handleSavePaymentSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingPaymentSettings(true);
    try {
      await updatePaymentSettings({
        bogLink: bogLinkInput.trim(),
        tbcLink: tbcLinkInput.trim(),
        entryFeeGEL: Number(entryFeeInput) || 3,
        requireActivationCode: Boolean(requireCodeInput),
      });
      showNotification('✅ Payment settings saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save payment settings');
    } finally {
      setIsSavingPaymentSettings(false);
    }
  };

  const handleGenerateCodes = async (count: number = 1) => {
    setIsGeneratingCodes(true);
    try {
      const res = await adminGenerateActivationCodesApi(count);
      if (res && res.allCodes) {
        setActivationCodes(res.allCodes);
      } else {
        await loadActivationCodes();
      }
      showNotification(`✨ Generated ${count} new activation code${count > 1 ? 's' : ''}!`);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    } catch (err: any) {
      alert(err.message || 'Failed to generate codes');
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  const handleDeleteCode = async (code: string) => {
    if (!confirm(`Are you sure you want to revoke code ${code}?`)) return;
    try {
      await adminDeleteActivationCodeApi(code);
      setActivationCodes((prev) => prev.filter((c) => c.code.toUpperCase() !== code.toUpperCase()));
      showNotification(`Revoked code ${code}`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete code');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
          <div className="w-14 h-14 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Matchday Command Center</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Authorized Moderators Only (<strong>@theiulius</strong>, <strong>@chaga</strong>)
            </p>
          </div>

          {authUser ? (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              Signed in as <strong>@{authUser.username}</strong> (Regular Player). This account does not have moderator privileges.
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              Please sign in with a moderator account (<strong>theiulius</strong> or <strong>chaga</strong>) for instant access.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3 pt-2 border-t border-white/5">
            <p className="text-[10px] text-zinc-500 font-semibold">Or enter emergency root PIN:</p>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter Emergency PIN"
              maxLength={64}
              className="w-full text-center tracking-widest text-sm font-mono py-2.5 px-4 rounded-xl bg-zinc-950 border border-white/10 text-white outline-none focus:border-amber-500"
            />
            {loginError && (
              <p className="text-rose-400 text-xs font-bold animate-shake">Incorrect Admin PIN. Try again.</p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Verify PIN
            </button>
          </form>

          <button
            onClick={() => setActiveTab('team')}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-300 block mx-auto pt-2 cursor-pointer"
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

          {/* Moderator Badge */}
          {authUser && isModerator && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-300">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>@{authUser.username}</span>
              <span className="text-[9px] uppercase tracking-wider text-amber-400/80 font-black">Moderator</span>
            </div>
          )}

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

            {/* Charity Entry & Activation Codes Management */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">Charity Entry & 1-Time Activation Codes</h3>
                    <p className="text-[11px] text-zinc-400">Manage BOG & TBC 3 ₾ payment links and issue registration codes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadActivationCodes}
                    disabled={isLoadingCodes}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    title="Refresh Codes"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingCodes ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleGenerateCodes(1)}
                    disabled={isGeneratingCodes}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+1 Code</span>
                  </button>
                  <button
                    onClick={() => handleGenerateCodes(5)}
                    disabled={isGeneratingCodes}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+5 Codes</span>
                  </button>
                </div>
              </div>

              {/* Top Config Grid: Payment Links, Entry Fee & Enforcement */}
              <form onSubmit={handleSavePaymentSettings} className="p-3.5 rounded-xl bg-zinc-950 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    Official Payment Gateways & Rules
                  </span>
                  <button
                    type="submit"
                    disabled={isSavingPaymentSettings}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>{isSavingPaymentSettings ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* BOG Link */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-between mb-1">
                      <span className="text-orange-400">Bank of Georgia Link</span>
                      {bogLinkInput && (
                        <a
                          href={bogLinkInput}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:underline flex items-center gap-0.5 text-[9px]"
                        >
                          Test <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      placeholder="https://pay.bog.ge/..."
                      value={bogLinkInput}
                      onChange={(e) => setBogLinkInput(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-orange-500/50"
                    />
                  </div>

                  {/* TBC Link */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-between mb-1">
                      <span className="text-sky-400">TBC Bank Link</span>
                      {tbcLinkInput && (
                        <a
                          href={tbcLinkInput}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:underline flex items-center gap-0.5 text-[9px]"
                        >
                          Test <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      placeholder="https://tbcpay.ge/..."
                      value={tbcLinkInput}
                      onChange={(e) => setTbcLinkInput(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-sky-500/50"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-zinc-400">Entry Fee (₾):</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={entryFeeInput}
                      onChange={(e) => setEntryFeeInput(Number(e.target.value))}
                      className="w-16 bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1 text-center font-bold text-white text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={requireCodeInput}
                      onChange={(e) => setRequireCodeInput(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-white/20 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-zinc-300">
                      Strict Mode: Require Activation Code on Register
                    </span>
                  </label>
                </div>
              </form>

              {/* Codes List & Filter Bar */}
              <div className="space-y-2.5">
                {/* Filter & Search Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setCodeFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        codeFilter === 'all' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      All ({activationCodes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeFilter('unused')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        codeFilter === 'unused' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Unused ({activationCodes.filter((c) => !c.isUsed).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeFilter('used')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        codeFilter === 'used' ? 'bg-white/15 text-zinc-300' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Redeemed ({activationCodes.filter((c) => c.isUsed).length})
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Filter code or user..."
                      value={codeSearch}
                      onChange={(e) => setCodeSearch(e.target.value)}
                      className="bg-zinc-950 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none w-44 focus:w-56 transition-all"
                    />
                  </div>
                </div>

                {/* Codes Table / Grid */}
                {activationCodes.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-zinc-950/40 border border-dashed border-white/10 text-xs text-zinc-500">
                    No activation codes generated yet. Tap <span className="text-emerald-400 font-bold">+1 Code</span> to generate your first 1-time code.
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04] max-h-[280px] overflow-y-auto rounded-xl bg-zinc-950/40 border border-white/5">
                    {activationCodes
                      .filter((c) => {
                        if (codeFilter === 'unused' && c.isUsed) return false;
                        if (codeFilter === 'used' && !c.isUsed) return false;
                        if (codeSearch) {
                          const q = codeSearch.toLowerCase();
                          return c.code.toLowerCase().includes(q) || (c.usedBy && c.usedBy.toLowerCase().includes(q));
                        }
                        return true;
                      })
                      .map((c) => (
                        <div
                          key={c.code}
                          className="py-2 px-3 flex items-center justify-between hover:bg-white/[0.02] text-xs transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-sm text-white tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10">
                              {c.code}
                            </span>

                            {c.isUsed ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                                  Redeemed
                                </span>
                                <span className="text-[11px] text-zinc-400">
                                  by <strong className="text-emerald-400">@{c.usedBy}</strong>
                                  {c.usedAt && (
                                    <span className="text-[10px] text-zinc-500 ml-1">
                                      ({new Date(c.usedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                                    </span>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Unused • Ready
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyCode(c.code)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                copiedCode === c.code
                                  ? 'bg-emerald-500 text-slate-950 font-black'
                                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                              }`}
                              title="Copy code to clipboard"
                            >
                              {copiedCode === c.code ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-zinc-400" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {!c.isUsed && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCode(c.code)}
                                className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Revoke / Delete Code"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
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

            {/* Active Gameweek Switcher */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-sm text-white">Active Gameweek Selector</h4>
                <p className="text-[11px] text-zinc-400">
                  Switch active matchweek back or forward at any time without losing player or user data.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentGW <= 1}
                  onClick={async () => {
                    const prev = Math.max(1, currentGW - 1);
                    await setGameweekNumber(prev);
                    showNotification(`Switched active Gameweek to GW ${prev}`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 text-xs font-bold text-zinc-300"
                >
                  ← GW {Math.max(1, currentGW - 1)}
                </button>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono font-black text-emerald-400">
                  GW {currentGW}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const next = currentGW + 1;
                    await setGameweekNumber(next);
                    showNotification(`Switched active Gameweek to GW ${next}`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300"
                >
                  GW {currentGW + 1} →
                </button>
              </div>
            </div>

            {/* Award Gameweek Points */}
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
                  await finalizeGameweek();
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
                  const nextGw = currentGW + 1;
                  await advanceGameweek();
                  showNotification(`Advanced to Gameweek ${nextGw}!`);
                  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
                }}
              />
            </div>

            {/* Reset Current Gameweek Stats & Scores */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-rose-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-rose-400 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Current Gameweek (GW {currentGW})</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Keeps Users &amp; Squads Safe
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Resets all match scores and player stats (goals, assists, saves, cards) for GW {currentGW} back to 0 and recalculates league points.
              </p>
              <SlideToConfirm
                label={`Slide to Reset GW ${currentGW} Stats & Scores`}
                confirmLabel={`GW ${currentGW} Reset to 0!`}
                variant="danger"
                onConfirm={async () => {
                  await resetCurrentGameweek(currentGW);
                  showNotification(`Gameweek ${currentGW} stats and scores have been reset to 0!`);
                }}
              />
            </div>

            {/* Reset Entire Season Back to GW 1 */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-rose-500/20 space-y-3">
              <h4 className="font-black text-sm text-rose-300">Reset Season Back to GW 1</h4>
              <p className="text-xs text-zinc-400">
                Resets counter back to GW 1 and clears all gameweek points/stats across the season while preserving all registered accounts and their picked squads.
              </p>
              <SlideToConfirm
                label="Slide to Reset Season to GW 1"
                confirmLabel="Season Reset to GW 1!"
                variant="danger"
                onConfirm={async () => {
                  await resetToDefaults();
                  showNotification('Season reset to Gameweek 1! All user accounts and squads preserved.');
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
                {/* Charity Payment Links & Gateways */}
                <div className="space-y-3 p-4 rounded-xl bg-zinc-950 border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white flex items-center gap-1.5">
                      <Ticket className="w-4 h-4 text-emerald-400" />
                      <span>Charity Payment Gateways</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {entryFeeInput} ₾ Fee
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400">
                    Set the Bank of Georgia and TBC Bank 3.00 ₾ payment links and registration rules.
                  </p>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-orange-400 block mb-0.5">Bank of Georgia (BOG) URL</label>
                      <input
                        type="url"
                        placeholder="https://pay.bog.ge/..."
                        value={bogLinkInput}
                        onChange={(e) => setBogLinkInput(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 font-mono text-xs text-white outline-none focus:border-orange-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-sky-400 block mb-0.5">TBC Bank URL</label>
                      <input
                        type="url"
                        placeholder="https://tbcpay.ge/..."
                        value={tbcLinkInput}
                        onChange={(e) => setTbcLinkInput(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 font-mono text-xs text-white outline-none focus:border-sky-500/50"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={requireCodeInput}
                          onChange={(e) => setRequireCodeInput(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-white/20 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-zinc-300">Require Code</span>
                      </label>

                      <button
                        onClick={() => handleSavePaymentSettings()}
                        disabled={isSavingPaymentSettings}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors"
                      >
                        {isSavingPaymentSettings ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400">
                        {activationCodes.filter((c) => !c.isUsed).length} unused codes ready
                      </span>
                      <button
                        type="button"
                        onClick={() => handleGenerateCodes(1)}
                        disabled={isGeneratingCodes}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-emerald-400" />
                        <span>+1 Code</span>
                      </button>
                    </div>
                  </div>
                </div>

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
        onEditPlayer={editPlayer}
      />
    </div>
  );
};

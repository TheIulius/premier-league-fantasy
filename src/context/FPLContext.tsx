import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Player,
  Squad,
  SquadPlayer,
  Fixture,
  League,
  ChipType,
  Position,
  PlayerStats,
  Club,
  PaymentSettings,
  AuthUser,
} from '../types/fpl';
import { SEED_PLAYERS, DEFAULT_SQUAD_PLAYER_IDS } from '../data/seedPlayers';
import { SEED_FIXTURES, SEED_LEAGUES } from '../data/seedFixtures';
import { CLUBS } from '../data/clubs';
import {
  calculateGameweekSquadPoints,
  calculatePlayerPoints,
  GameweekCalculationResult,
  validateSquadComposition,
} from '../engine/scoring';
import { canSwapPlayers, normalizeSquadLineup, isValidFormation, sanitizeCaptaincy } from '../engine/formations';
import * as api from '../services/api';

export type TabType = 'team' | 'transfers' | 'standings' | 'leagues' | 'fixtures' | 'dev';

export interface ManagerSummary {
  id: string;
  managerName: string;
  teamName: string;
}

interface FPLContextType {
  players: Record<string, Player>;
  clubs: Record<string, Club>;
  addClub: (club: { name: string; shortName?: string; primaryColor?: string; secondaryColor?: string }) => Promise<Club>;
  squad: Squad;
  fixtures: Fixture[];
  leagues: League[];
  currentGW: number;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isDevAuthenticated: boolean;
  isModerator: boolean;
  devLogin: (pass?: string) => Promise<boolean>;
  devLogout: () => void;
  selectedPlayerForSwap: string | null;
  setSelectedPlayerForSwap: (id: string | null) => void;
  substitutePlayers: (playerAId: string, playerBId: string) => { success: boolean; message?: string };
  reorderBenchPlayer: (playerId: string, targetOrder: number) => { success: boolean; message?: string };
  saveSquad: (customPlayers?: SquadPlayer[], validateComplete?: boolean) => Promise<{ success: boolean; message?: string }>;
  buyPlayer: (playerId: string) => { success: boolean; message?: string };
  removePlayer: (playerId: string) => { success: boolean; message?: string };
  setCaptain: (playerId: string) => void;
  setViceCaptain: (playerId: string) => void;
  activateChip: (chip: ChipType) => boolean;
  transferPlayer: (outPlayerId: string, inPlayerId: string) => { success: boolean; message?: string };
  updatePlayerStats: (playerId: string, gw: number, stats: Partial<PlayerStats>) => void;
  addCustomPlayer: (player: {
    name: string;
    webName: string;
    clubId: string;
    position: Position;
    cost: number;
  }) => Player;
  editPlayer: (playerId: string, data: Partial<Player>) => void;
  deletePlayer: (playerId: string) => void;
  addFixture: (fixture: {
    gameweek: number;
    homeClubId: string;
    awayClubId: string;
    homeScore?: number | null;
    awayScore?: number | null;
    isFinished?: boolean;
    isLive?: boolean;
    kickoffTime?: string;
  }) => Promise<void>;
  updateFixture: (fixtureId: string, data: Partial<Fixture>) => Promise<void>;
  deleteFixture: (fixtureId: string) => Promise<void>;
  simulateGameweek: (gw: number) => void;
  finalizeGameweek: () => Promise<void>;
  advanceGameweek: () => Promise<void>;
  resetCurrentGameweek: (gw?: number) => Promise<void>;
  setGameweekNumber: (gw: number) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  createLeague: (name: string) => Promise<string>;
  joinLeague: (code: string) => Promise<boolean>;
  deleteLeague: (leagueId: string) => Promise<void>;
  calculationResult: GameweekCalculationResult;
  teamValue: number;
  freeTransfersRemaining: number;
  currentManager: ManagerSummary | null;
  availableManagers: ManagerSummary[];
  switchManager: (managerId: string) => void;
  registerManager: (managerName: string, teamName: string) => Promise<void>;
  isManagerModalOpen: boolean;
  setIsManagerModalOpen: (open: boolean) => void;
  refreshServerState: () => void;
  authUser: AuthUser | null;
  authToken: string | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginUser: (login: string, pass: string) => Promise<void>;
  registerUser: (data: { username: string; email?: string; password: string; managerName: string; teamName: string; activationCode?: string }) => Promise<void>;
  logoutUser: () => void;
  checkAuthSession: () => Promise<boolean>;
  paymentSettings: PaymentSettings;
  updatePaymentSettings: (settings: Partial<PaymentSettings>) => Promise<{ success: boolean; settings: PaymentSettings }>;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  deadline: { gameweek: number; deadlineTime: string } | null;
  isSquadLocked: boolean;
  setDeadline: (deadline: { gameweek: number; deadlineTime: string } | null) => Promise<void>;
  sellPlayer: (playerId: string) => { success: boolean; message?: string };
  transferOutPlayerId: string | null;
  setTransferOutPlayerId: (id: string | null) => void;
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const STORAGE_KEY_AUTH_TOKEN = 'fpl_auth_token_v1';
const STORAGE_KEY_THEME = 'fpl_theme';
const STORAGE_KEY_AUTH_USER = 'fpl_auth_user_v1';
const STORAGE_KEY_MANAGER_ID = 'fpl_active_manager_id_v1';
const STORAGE_KEY_PLAYERS = 'fpl_players_v1';
const STORAGE_KEY_CLUBS = 'fpl_clubs_v1';
const STORAGE_KEY_SQUAD = 'fpl_squad_v1';
const STORAGE_KEY_FIXTURES = 'fpl_fixtures_v1';
const STORAGE_KEY_LEAGUES = 'fpl_leagues_v1';
const STORAGE_KEY_GW = 'fpl_gw_v1';

const FPLContext = createContext<FPLContextType | undefined>(undefined);

export const FPLProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
  });

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [currentManagerId, setCurrentManagerId] = useState<string>(() => {
    const savedAuthUser = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (savedAuthUser) {
      try {
        const parsed = JSON.parse(savedAuthUser);
        if (parsed?.id) return parsed.id;
      } catch (e) {}
    }
    return localStorage.getItem(STORAGE_KEY_MANAGER_ID) || 'user_1';
  });

  const [currentManager, setCurrentManager] = useState<ManagerSummary | null>({
    id: currentManagerId,
    managerName: 'Apex Manager',
    teamName: 'Apex XI',
  });

  const [availableManagers, setAvailableManagers] = useState<ManagerSummary[]>([
    { id: 'user_1', managerName: 'Apex Manager', teamName: 'Apex XI' },
  ]);

  const [isManagerModalOpen, setIsManagerModalOpen] = useState<boolean>(false);

  // Theme Management (Dark / Light Mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Core Game State
  const [clubs, setClubs] = useState<Record<string, Club>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CLUBS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed === 'object' &&
          !('ARS' in parsed) &&
          !('SCH_10' in parsed) &&
          !('SCH_TCH' in parsed) &&
          ('SCH_9_1' in parsed)
        ) {
          return parsed;
        }
      } catch (e) {}
    }
    return { ...CLUBS };
  });

  const [players, setPlayers] = useState<Record<string, Player>>(() => {
    const map: Record<string, Player> = {};
    SEED_PLAYERS.forEach((p) => { map[p.id] = p; });
    const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...map, ...parsed };
      } catch (e) { /* fallback */ }
    }
    return map;
  });

  const [squad, setSquad] = useState<Squad>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SQUAD);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.players) && parsed.players.length <= 9) {
          if (parsed.usedChips) {
            if ((parsed.usedChips as any).free_hit !== undefined && parsed.usedChips.wildcard === undefined) {
              parsed.usedChips.wildcard = (parsed.usedChips as any).free_hit;
            }
            if (parsed.usedChips.wildcard === undefined) {
              parsed.usedChips.wildcard = false;
            }
          }
          if ((parsed.activeChip as any) === 'free_hit') {
            parsed.activeChip = 'wildcard';
          }
          parsed.players = sanitizeCaptaincy(parsed.players);
          return parsed;
        }
      } catch (e) { /* fallback */ }
    }
    return {
      teamName: 'My Team',
      managerName: 'Manager',
      players: [],
      bank: 60.0,
      freeTransfers: 1,
      transfersMadeThisGW: 0,
      activeChip: null,
      usedChips: {
        triple_captain: false,
        bench_boost: false,
        wildcard: false,
      },
    };
  });

  const [fixtures, setFixtures] = useState<Fixture[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FIXTURES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const plClubCodes = new Set(['ARS', 'AVL', 'BOU', 'BRE', 'BHA', 'CHE', 'CRY', 'EVE', 'FUL', 'IPS', 'LEI', 'LIV', 'MCI', 'MUN', 'NEW', 'NFO', 'SOU', 'TOT', 'WHU', 'WOL']);
        const hasPL = Array.isArray(parsed) && parsed.some((f: any) => plClubCodes.has(f.homeClubId) || plClubCodes.has(f.awayClubId));
        if (!hasPL && Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* fallback */ }
    }
    return [...SEED_FIXTURES];
  });

  const [leagues, setLeagues] = useState<League[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LEAGUES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasDummy = Array.isArray(parsed) && parsed.some((l: League) =>
          l.id === 'league_overall' || l.id === 'league_mini_1' ||
          l.members?.some((m: any) => m.id === 'mem_1' || m.teamName === 'Klopps and Robbers')
        );
        if (!hasDummy) return parsed;
      } catch (e) { /* fallback */ }
    }
    return SEED_LEAGUES;
  });

  const [currentGW, setCurrentGW] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GW);
    return saved ? parseInt(saved, 10) : 1;
  });

  const [activeTab, setActiveTab] = useState<TabType>('team');

  // Moderator / Admin privilege system
  const isModerator = useMemo(() => {
    if (!authUser?.username) return false;
    const clean = authUser.username.trim().toLowerCase();
    return clean === 'theiulius' || clean === 'chaga' || authUser.role === 'admin' || authUser.isAdmin === true;
  }, [authUser]);

  const [devAuthenticatedState, setDevAuthenticatedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fpl_dev_auth') === 'true';
    } catch {
      return false;
    }
  });

  const isDevAuthenticated = isModerator || devAuthenticatedState;
  const [selectedPlayerForSwap, setSelectedPlayerForSwap] = useState<string | null>(null);
  const [transferOutPlayerId, setTransferOutPlayerId] = useState<string | null>(null);

  // Demo Mode (allows non-logged-in users to preview a locked sample squad)
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const enterDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setCurrentManagerId('user_1');
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
  }, []);

  // Deadline / Freeze system
  const [deadline, setDeadlineState] = useState<{ gameweek: number; deadlineTime: string } | null>(null);

  const isSquadLocked = useMemo(() => {
    if (isDemoMode) return true;
    if (!deadline) return false;
    return new Date() >= new Date(deadline.deadlineTime);
  }, [deadline, isDemoMode]);

  const setDeadline = useCallback(async (d: { gameweek: number; deadlineTime: string } | null) => {
    try {
      if (d) {
        await api.adminSetDeadlineApi(d.gameweek, d.deadlineTime);
      } else {
        await api.adminClearDeadlineApi();
      }
      setDeadlineState(d);
    } catch (err) {
      console.error('Failed to set deadline:', err);
    }
  }, []);

  // Payment & Charity Links Settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    bogLink: 'https://egreve.bog.ge/KCL26_charity',
    tbcLink: '',
    entryFeeGEL: 3,
    requireActivationCode: false,
  });

  const updatePaymentSettings = useCallback(async (settings: Partial<PaymentSettings>) => {
    try {
      const res = await api.adminUpdatePaymentSettingsApi(settings);
      if (res && res.settings) {
        setPaymentSettings(res.settings);
        return res;
      }
      const updated = { ...paymentSettings, ...settings };
      setPaymentSettings(updated);
      return { success: true, settings: updated };
    } catch (err: any) {
      console.error('Failed to update payment settings:', err);
      throw err;
    }
  }, [paymentSettings]);


  // Keep currentManagerId in sync with authUser
  useEffect(() => {
    if (authUser?.id && authUser.id !== currentManagerId) {
      setCurrentManagerId(authUser.id);
      localStorage.setItem(STORAGE_KEY_MANAGER_ID, authUser.id);
    }
  }, [authUser, currentManagerId]);

  // Sync state from server API with squad protection
  const refreshServerState = useCallback(async (managerIdOverride?: string) => {
    try {
      const activeId = managerIdOverride || authUser?.id || currentManagerId || 'user_1';
      const data = await api.fetchAppState(activeId);
      if (data) {
        if (data.clubs) setClubs(data.clubs);
        if (data.players) {
          const seedMap: Record<string, Player> = {};
          SEED_PLAYERS.forEach((p) => { seedMap[p.id] = p; });
          setPlayers((prev) => ({ ...seedMap, ...prev, ...data.players }));
        }
        if (data.fixtures) setFixtures(data.fixtures);
        if (data.leagues) setLeagues(data.leagues);
        if (data.currentGW) setCurrentGW(data.currentGW);
        if (data.managers) setAvailableManagers(data.managers);
        if (data.deadline !== undefined) setDeadlineState(data.deadline || null);
        if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
        if (data.activeManager) {
          setCurrentManager({
            id: data.activeManager.id,
            managerName: data.activeManager.managerName,
            teamName: data.activeManager.teamName,
          });
          if (data.activeManager.squad) {
            let activeSq = data.activeManager.squad;
            const allP = data.players || players;

            // CRITICAL SQUAD PROTECTION:
            // Never overwrite an existing populated local squad with an empty/wiped squad from server
            if (
              (!activeSq.players || activeSq.players.length === 0) &&
              squad &&
              Array.isArray(squad.players) &&
              squad.players.length > 0
            ) {
              console.warn('Server returned empty squad while client has a squad. Preserving local squad and syncing to server.');
              api.saveSquadApi(activeId, squad.players, squad.teamName, squad.bank).catch(() => {});
            } else if (activeSq.players && activeSq.players.length > 0) {
              if (allP && Object.keys(allP).length >= 50) {
                const validPlayers = activeSq.players.filter((sp: SquadPlayer) => Boolean(allP[sp.playerId]));
                if (validPlayers.length >= activeSq.players.length) {
                  const normalized = normalizeSquadLineup(validPlayers, allP);
                  activeSq = { ...activeSq, players: normalized };
                } else if (validPlayers.length > 0) {
                  const totalCost = validPlayers.reduce((sum: number, sp: SquadPlayer) => sum + (allP[sp.playerId]?.cost || 0), 0);
                  const bank = Math.max(0, Math.round((60.0 - totalCost) * 10) / 10);
                  const normalized = normalizeSquadLineup(validPlayers, allP);
                  activeSq = { ...activeSq, players: normalized, bank };
                }
              }
              setSquad(activeSq);
              localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(activeSq));
            }
          }
        }

        if (data.currentUserApproved !== undefined && authUser) {
          if (Boolean(authUser.isApproved) !== Boolean(data.currentUserApproved)) {
            const updatedUser = { ...authUser, isApproved: Boolean(data.currentUserApproved) };
            setAuthUser(updatedUser);
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updatedUser));
          }
        }
      }
    } catch (err) {
      // Offline fallback: continue using local state
    }
  }, [authUser, currentManagerId, players, squad]);

  // Verify auth session on mount
  useEffect(() => {
    if (authToken) {
      api.authMe(authToken).then((res) => {
        if (res && res.user) {
          setAuthUser(res.user);
          localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(res.user));
          setCurrentManagerId(res.user.id);
          localStorage.setItem(STORAGE_KEY_MANAGER_ID, res.user.id);
          if (res.squad) {
            let userSq = res.squad;
            // Shield local squad if server squad is empty but local squad has players
            if (
              (!userSq.players || userSq.players.length === 0) &&
              squad &&
              Array.isArray(squad.players) &&
              squad.players.length > 0
            ) {
              console.warn('Session squad empty, syncing existing local squad to user account.');
              api.saveSquadApi(res.user.id, squad.players, squad.teamName, squad.bank).catch(() => {});
            } else if (userSq.players && userSq.players.length > 0) {
              if (players && Object.keys(players).length >= 50) {
                const validPlayers = userSq.players.filter((sp: SquadPlayer) => Boolean(players[sp.playerId]));
                if (validPlayers.length >= userSq.players.length) {
                  const normalized = normalizeSquadLineup(validPlayers, players);
                  userSq = { ...userSq, players: normalized };
                }
              }
              setSquad(userSq);
              localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(userSq));
            }
          }
        }
      }).catch(() => {});
    }
  }, [authToken]);

  // Auto-heal squad whenever players change (e.g. if an admin deleted/edited players)
  useEffect(() => {
    // Only run if database is fully loaded (at least 50 players) to avoid deleting real squad players during loading
    if (players && Object.keys(players).length >= 50 && squad && Array.isArray(squad.players) && squad.players.length > 0) {
      const validPlayers = squad.players.filter((sp: SquadPlayer) => Boolean(players[sp.playerId]));
      const hadGhost = validPlayers.length !== squad.players.length;
      // Safety check: if ALL players appear invalid, this is a database sync error, do not wipe!
      if (hadGhost && validPlayers.length > 0) {
        const totalCost = validPlayers.reduce((sum: number, sp: SquadPlayer) => sum + (players[sp.playerId]?.cost || 0), 0);
        const correctBank = Math.max(0, Math.round((60.0 - totalCost) * 10) / 10);
        const normalized = normalizeSquadLineup(validPlayers, players);
        const updatedSquad: Squad = {
          ...squad,
          players: normalized,
          bank: correctBank,
        };
        setSquad(updatedSquad);
        localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(updatedSquad));
        const activeId = authUser?.id || currentManagerId || 'user_1';
        api.saveSquadApi(activeId, updatedSquad.players, updatedSquad.teamName, updatedSquad.bank).catch(() => {});
      }
    }
  }, [players, authUser, currentManagerId]);

  // Hydrate from server on mount
  useEffect(() => {
    refreshServerState();
    // Poll every 12 seconds so friend live updates sync automatically
    const interval = setInterval(() => refreshServerState(), 12000);
    return () => clearInterval(interval);
  }, [refreshServerState]);

  // Persist local storage as backup
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MANAGER_ID, currentManagerId);
  }, [currentManagerId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CLUBS, JSON.stringify(clubs));
  }, [clubs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(squad));
  }, [squad]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FIXTURES, JSON.stringify(fixtures));
  }, [fixtures]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LEAGUES, JSON.stringify(leagues));
  }, [leagues]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GW, currentGW.toString());
  }, [currentGW]);

  // Calculate points dynamically
  const calculationResult = useMemo(() => {
    return calculateGameweekSquadPoints(
      squad.players,
      players,
      currentGW,
      squad.activeChip,
      squad.transfersMadeThisGW,
      squad.freeTransfers,
      fixtures
    );
  }, [squad, players, currentGW, fixtures]);

  const teamValue = useMemo(() => {
    let cost = 0;
    squad.players.forEach((sp) => {
      const p = players[sp.playerId];
      if (p) cost += p.cost;
    });
    return Math.round(cost * 10) / 10;
  }, [squad.players, players]);

  const freeTransfersRemaining =
    squad.activeChip === 'wildcard'
      ? 999
      : Math.max(0, squad.freeTransfers - squad.transfersMadeThisGW);

  // Switch Manager Profile
  const switchManager = (managerId: string) => {
    setCurrentManagerId(managerId);
  };

  // Register New Friend Manager Profile (Legacy / Quick)
  const registerManager = async (managerName: string, teamName: string) => {
    try {
      const res = await api.loginManagerApi(managerName, teamName);
      if (res.manager) {
        setCurrentManagerId(res.manager.id);
        setCurrentManager({
          id: res.manager.id,
          managerName: res.manager.managerName,
          teamName: res.manager.teamName,
        });
        setSquad(res.manager.squad);
        await refreshServerState();
      }
    } catch (err) {
      const id = 'user_' + Date.now();
      const newM: ManagerSummary = { id, managerName, teamName };
      setAvailableManagers((prev) => [...prev, newM]);
      setCurrentManagerId(id);
      setCurrentManager(newM);
      setSquad({
        teamName,
        managerName,
        players: [],
        bank: 60.0,
        freeTransfers: 1,
        transfersMadeThisGW: 0,
        activeChip: null,
        usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
      });
    }
  };

  // Secure Password-Protected Account Login
  const loginUser = async (login: string, pass: string) => {
    const res = await api.authLogin({ login, password: pass });
    if (res.token && res.user) {
      setIsDemoMode(false);
      setAuthToken(res.token);
      setAuthUser(res.user);
      localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, res.token);
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(res.user));

      setCurrentManagerId(res.user.id);
      setCurrentManager({
        id: res.user.id,
        managerName: res.user.managerName,
        teamName: res.user.teamName,
      });

      if (res.squad && Array.isArray(res.squad.players) && res.squad.players.length > 0) {
        setSquad(res.squad);
      }
      await refreshServerState(res.user.id);
    }
  };

  // Secure Password-Protected Account Registration
  const registerUser = async (data: {
    username: string;
    email?: string;
    password: string;
    managerName: string;
    teamName: string;
    activationCode?: string;
  }) => {
    const res = await api.authRegister(data);
    if (res.token && res.user) {
      setIsDemoMode(false);
      setAuthToken(res.token);
      setAuthUser(res.user);
      localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, res.token);
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(res.user));

      setCurrentManagerId(res.user.id);
      setCurrentManager({
        id: res.user.id,
        managerName: res.user.managerName,
        teamName: res.user.teamName,
      });

      if (res.squad && Array.isArray(res.squad.players) && res.squad.players.length > 0) {
        setSquad(res.squad);
      }
      await refreshServerState(res.user.id);
    }
  };

  // Log Out
  const logoutUser = () => {
    if (authToken) {
      api.authLogout(authToken).catch(() => {});
    }
    setAuthToken(null);
    setAuthUser(null);
    setIsDemoMode(false);
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
  };

  // Re-verify current session & update user approval state
  const checkAuthSession = async (): Promise<boolean> => {
    if (!authToken) return false;
    try {
      const res = await api.authMe(authToken);
      if (res && res.user) {
        setAuthUser(res.user);
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(res.user));
        return Boolean(res.user.isAdmin || res.user.isApproved);
      }
    } catch {
      // offline fallback
    }
    return false;
  };

  // Dev Login (Server-Verified or Instant Moderator Recognition)
  const devLogin = async (pass?: string): Promise<boolean> => {
    if (isModerator) {
      setDevAuthenticatedState(true);
      try { localStorage.setItem('fpl_dev_auth', 'true'); } catch {}
      return true;
    }
    try {
      const res = await api.adminLoginApi(pass);
      if (res.success) {
        setDevAuthenticatedState(true);
        try { localStorage.setItem('fpl_dev_auth', 'true'); } catch {}
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const devLogout = () => {
    setDevAuthenticatedState(false);
    try { localStorage.removeItem('fpl_dev_auth'); } catch {}
  };

  // Explicit Save Squad to Backend Database & LocalStorage
  const saveSquad = async (
    customPlayers?: SquadPlayer[],
    validateComplete: boolean = false
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      if (isSquadLocked) {
        return { success: false, message: 'Lineups are locked. The deadline has passed.' };
      }

      const targetPlayers = customPlayers || squad.players;

      if (validateComplete) {
        const compValidation = validateSquadComposition(targetPlayers, players);
        if (!compValidation.isValid) {
          return {
            success: false,
            message: compValidation.message || 'Cannot finalize squad: You must have 1 GK, 3 Defenders, 3 Midfielders, and 2 Forwards.',
          };
        }
      }

      const totalCost = targetPlayers.reduce((sum, sp) => sum + (players[sp.playerId]?.cost || 0), 0);
      const calculatedBank = Math.max(0, Math.round((60.0 - totalCost) * 10) / 10);

      const updatedSquad: Squad = {
        ...squad,
        players: targetPlayers,
        bank: calculatedBank,
      };

      setSquad(updatedSquad);
      localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(updatedSquad));

      const res = await api.saveSquadApi(
        currentManagerId,
        targetPlayers,
        updatedSquad.teamName,
        calculatedBank,
        validateComplete
      );

      if (res && res.squad) {
        setSquad(res.squad);
        localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(res.squad));
      }

      return { success: true };
    } catch (err: any) {
      console.error('Failed to save squad to database:', err);
      return { success: false, message: err?.message || 'Failed to save squad to database' };
    }
  };

  // Buy a player from market into squad using available £60.0m budget
  const buyPlayer = (playerId: string): { success: boolean; message?: string } => {
    if (isSquadLocked) {
      return { success: false, message: 'Lineups are locked. The deadline has passed.' };
    }

    const p = players[playerId];
    if (!p) return { success: false, message: 'Player not found' };

    // Only count players that actually exist in the game database
    const validSquadPlayers = squad.players.filter((sp) => Boolean(players[sp.playerId]));

    if (validSquadPlayers.some((sp) => sp.playerId === playerId)) {
      return { success: false, message: `${p.webName} is already in your squad!` };
    }

    if (validSquadPlayers.length >= 9) {
      return { success: false, message: 'Squad is full (9/9 players). Remove a player first.' };
    }

    // Position count limits: 1 GK, 3 DEF, 3 MID, 2 FWD
    const currentPosCount = validSquadPlayers.filter(
      (sp) => players[sp.playerId]?.position === p.position
    ).length;

    const limits: Record<Position, number> = { GKP: 1, DEF: 3, MID: 3, FWD: 2 };
    if (currentPosCount >= limits[p.position]) {
      const posLabels: Record<Position, string> = {
        GKP: 'Goalkeepers (max 1)',
        DEF: 'Defenders (max 3)',
        MID: 'Midfielders (max 3)',
        FWD: 'Forwards (max 2)',
      };
      return {
        success: false,
        message: `Position full! You already have the maximum allowed ${posLabels[p.position]}.`,
      };
    }

    // Class limits: max 2 players from the same class / team (e.g. 11/1, 9/2)
    const normalizeClub = (c: string) => (c === 'SCH' ? 'SCH_11_5' : c);
    const targetClub = normalizeClub(p.clubId);
    const currentClubCount = validSquadPlayers.filter((sp) => {
      const spPlayer = players[sp.playerId];
      return spPlayer && normalizeClub(spPlayer.clubId) === targetClub;
    }).length;

    const clubName = CLUBS[p.clubId]?.shortName || CLUBS[targetClub]?.shortName || CLUBS[p.clubId]?.name || p.clubId;
    if (currentClubCount >= 2) {
      return {
        success: false,
        message: `Class limit reached! You cannot choose more than 2 players from the same class (${clubName}).`,
      };
    }

    // Budget check
    if (p.cost > squad.bank) {
      return {
        success: false,
        message: `Insufficient budget! Costs £${p.cost.toFixed(1)}m, but you have £${squad.bank.toFixed(1)}m in bank.`,
      };
    }

    // Determine starter vs bench
    // Exactly 6 starters: 1 GK + 5 outfielders
    let shouldStart = false;
    if (p.position === 'GKP') {
      shouldStart = true;
    } else {
      const currentOutfieldStarters = squad.players.filter(
        (sp) => sp.isStarter && players[sp.playerId]?.position !== 'GKP'
      ).length;
      const currentPosStarters = squad.players.filter(
        (sp) => sp.isStarter && players[sp.playerId]?.position === p.position
      ).length;
      const maxStartersByPos: Record<Position, number> = { GKP: 1, DEF: 3, MID: 3, FWD: 2 };

      if (currentOutfieldStarters < 5 && currentPosStarters < maxStartersByPos[p.position]) {
        shouldStart = true;
      }
    }

    const currentBench = squad.players.filter((sp) => !sp.isStarter);
    const benchOrder = shouldStart ? 0 : currentBench.length + 1;

    const hasCaptain = squad.players.some((sp) => sp.isCaptain);
    const hasVice = squad.players.some((sp) => sp.isViceCaptain);
    const isCaptain = shouldStart && !hasCaptain;
    const isViceCaptain = shouldStart && hasCaptain && !hasVice;

    const newSquadPlayer: SquadPlayer = {
      playerId,
      isStarter: shouldStart,
      benchOrder,
      isCaptain,
      isViceCaptain,
    };

    let newPlayers = [...squad.players, newSquadPlayer];
    const newBank = Math.max(0, Math.round((squad.bank - p.cost) * 10) / 10);

    // If squad reached full 9 players, ensure starters and bench are normalized to a valid formation
    if (newPlayers.length === 9) {
      newPlayers = normalizeSquadLineup(newPlayers, { ...players, [p.id]: p });
    }

    const updatedSquad: Squad = {
      ...squad,
      players: newPlayers,
      bank: newBank,
    };

    setSquad(updatedSquad);
    localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(updatedSquad));
    api.saveSquadApi(currentManagerId, newPlayers, updatedSquad.teamName, newBank).catch((e) => {
      console.warn('Auto-save squad buy player failed:', e);
    });

    return { success: true };
  };

  // Remove/Sell a player from squad and refund 100% of price back to bank
  const removePlayer = (playerId: string): { success: boolean; message?: string } => {
    if (isSquadLocked) {
      return { success: false, message: 'Lineups are locked. The deadline has passed.' };
    }

    const target = squad.players.find((sp) => sp.playerId === playerId);
    if (!target) return { success: false, message: 'Player not in squad' };

    const p = players[playerId];
    const refund = p ? p.cost : 0;

    let remaining = squad.players.filter((sp) => sp.playerId !== playerId);

    // If removed player was Captain or Vice-Captain, reassign
    if (target.isCaptain) {
      const nextStarter = remaining.find((sp) => sp.isStarter);
      if (nextStarter) {
        remaining = remaining.map((sp) =>
          sp.playerId === nextStarter.playerId ? { ...sp, isCaptain: true, isViceCaptain: false } : sp
        );
      }
    } else if (target.isViceCaptain) {
      const nextStarter = remaining.find((sp) => sp.isStarter && !sp.isCaptain);
      if (nextStarter) {
        remaining = remaining.map((sp) =>
          sp.playerId === nextStarter.playerId ? { ...sp, isViceCaptain: true } : sp
        );
      }
    }

    // Re-index bench orders (1, 2, 3)
    let benchIdx = 1;
    remaining = remaining.map((sp) => {
      if (!sp.isStarter) {
        return { ...sp, benchOrder: benchIdx++ };
      }
      return sp;
    });

    const newBank = Math.round((squad.bank + refund) * 10) / 10;
    const cleanRemaining = sanitizeCaptaincy(remaining);
    const updatedSquad: Squad = {
      ...squad,
      players: cleanRemaining,
      bank: newBank,
    };

    setSquad(updatedSquad);
    localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(updatedSquad));
    api.saveSquadApi(currentManagerId, cleanRemaining, updatedSquad.teamName, newBank).catch((e) => {
      console.warn('Auto-save squad remove player failed:', e);
    });

    return { success: true };
  };

  // Substitute / Swap logic
  const substitutePlayers = (playerAId: string, playerBId: string): { success: boolean; message?: string } => {
    if (isSquadLocked) {
      return { success: false, message: 'Lineups are locked. The deadline has passed.' };
    }

    if (playerAId === playerBId) {
      setSelectedPlayerForSwap(null);
      return { success: true };
    }

    const spA = squad.players.find((p) => p.playerId === playerAId);
    const spB = squad.players.find((p) => p.playerId === playerBId);
    if (!spA || !spB) {
      return { success: false, message: 'Player not found in squad' };
    }

    const check = canSwapPlayers(playerAId, playerBId, squad.players, players);
    if (!check.canSwap) {
      return { success: false, message: check.reason };
    }

    let updatedPlayers: SquadPlayer[];

    // CASE 1: Bench <-> Bench swap (Substitute Priority Reordering Sub 1 <-> Sub 2 <-> Sub 3)
    if (!spA.isStarter && !spB.isStarter) {
      const orderA = spA.benchOrder;
      const orderB = spB.benchOrder;

      updatedPlayers = squad.players.map((sp) => {
        if (sp.playerId === playerAId) {
          return { ...sp, benchOrder: orderB, isCaptain: false, isViceCaptain: false };
        }
        if (sp.playerId === playerBId) {
          return { ...sp, benchOrder: orderA, isCaptain: false, isViceCaptain: false };
        }
        return sp;
      });

      // Normalize bench orders cleanly (1, 2, 3) preserving the swapped relative order
      const benchPlayers = updatedPlayers.filter((p) => !p.isStarter);
      benchPlayers.sort((a, b) => (a.benchOrder || 0) - (b.benchOrder || 0));
      const orderMap = new Map<string, number>();
      benchPlayers.forEach((bp, idx) => orderMap.set(bp.playerId, idx + 1));

      updatedPlayers = updatedPlayers.map((sp) => {
        if (!sp.isStarter) {
          return { ...sp, benchOrder: orderMap.get(sp.playerId) || 1, isCaptain: false, isViceCaptain: false };
        }
        return { ...sp, benchOrder: 0 };
      });
    } else {
      // CASE 2: Starter <-> Bench or Starter <-> Starter swap
      updatedPlayers = squad.players.map((sp) => {
        if (sp.playerId === playerAId) {
          return { ...sp, isStarter: spB.isStarter, benchOrder: spB.benchOrder };
        }
        if (sp.playerId === playerBId) {
          return { ...sp, isStarter: spA.isStarter, benchOrder: spA.benchOrder };
        }
        return sp;
      });

      // Preserve captain / vice-captain if starter was swapped with bench
      if (spA.isStarter !== spB.isStarter) {
        const outStarter = spA.isStarter ? spA : spB;
        const inBench = spA.isStarter ? spB : spA;

        if (outStarter.isCaptain) {
          updatedPlayers = updatedPlayers.map((sp) =>
            sp.playerId === inBench.playerId ? { ...sp, isCaptain: true, isViceCaptain: false } :
            sp.playerId === outStarter.playerId ? { ...sp, isCaptain: false } : sp
          );
        } else if (outStarter.isViceCaptain) {
          updatedPlayers = updatedPlayers.map((sp) =>
            sp.playerId === inBench.playerId ? { ...sp, isViceCaptain: true, isCaptain: false } :
            sp.playerId === outStarter.playerId ? { ...sp, isViceCaptain: false } : sp
          );
        }
      }

      // Re-index bench orders (1, 2, 3) preserving existing bench relative priority
      const benchPlayers = updatedPlayers.filter((p) => !p.isStarter);
      benchPlayers.sort((a, b) => (a.benchOrder || 0) - (b.benchOrder || 0));
      const orderMap = new Map<string, number>();
      benchPlayers.forEach((bp, idx) => orderMap.set(bp.playerId, idx + 1));

      updatedPlayers = updatedPlayers.map((sp) => {
        if (!sp.isStarter) {
          return { ...sp, benchOrder: orderMap.get(sp.playerId) || 1, isCaptain: false, isViceCaptain: false };
        }
        return { ...sp, benchOrder: 0 };
      });
    }

    const cleanUpdatedPlayers = sanitizeCaptaincy(updatedPlayers);
    const updatedSquad: Squad = {
      ...squad,
      players: cleanUpdatedPlayers,
    };

    setSquad(updatedSquad);
    localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(updatedSquad));
    const activeId = authUser?.id || currentManagerId || 'user_1';
    api.saveSquadApi(activeId, cleanUpdatedPlayers, updatedSquad.teamName, updatedSquad.bank).catch((err) => {
      console.warn('Auto-save squad substitution failed:', err);
    });
    setSelectedPlayerForSwap(null);
    return { success: true };
  };

  // Reorder substitute priority directly (Sub 1, Sub 2, Sub 3)
  const reorderBenchPlayer = (playerId: string, targetOrder: number): { success: boolean; message?: string } => {
    if (isSquadLocked) {
      return { success: false, message: 'Lineups are locked. The deadline has passed.' };
    }

    const sp = squad.players.find((p) => p.playerId === playerId);
    if (!sp || sp.isStarter) {
      return { success: false, message: 'Player is not on the bench' };
    }

    const clampedOrder = Math.max(1, Math.min(3, targetOrder));
    if (sp.benchOrder === clampedOrder) {
      return { success: true };
    }

    const targetSp = squad.players.find((p) => !p.isStarter && p.benchOrder === clampedOrder);
    if (targetSp) {
      return substitutePlayers(playerId, targetSp.playerId);
    }

    // Direct assignment if target order slot is vacant
    const updated = squad.players.map((p) =>
      p.playerId === playerId ? { ...p, benchOrder: clampedOrder } : p
    );
    const cleanUpdated = sanitizeCaptaincy(updated);
    const updatedSquad: Squad = { ...squad, players: cleanUpdated };
    setSquad(updatedSquad);
    localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(updatedSquad));
    const activeId = authUser?.id || currentManagerId || 'user_1';
    api.saveSquadApi(activeId, cleanUpdated, updatedSquad.teamName, updatedSquad.bank).catch(() => {});
    return { success: true };
  };

  // Set Captain
  const setCaptain = (playerId: string) => {
    if (isSquadLocked) return;
    const target = squad.players.find((p) => p.playerId === playerId);
    if (!target || !target.isStarter) return;

    const updated = sanitizeCaptaincy(
      squad.players.map((sp) => ({
        ...sp,
        isCaptain: sp.playerId === playerId,
        isViceCaptain: sp.playerId === playerId ? false : sp.isViceCaptain,
      }))
    );

    const updatedSquad = { ...squad, players: updated };
    setSquad(updatedSquad);
    localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(updatedSquad));
    api.saveSquadApi(currentManagerId, updated, updatedSquad.teamName, updatedSquad.bank).catch((err) => {
      console.warn('Auto-save captain failed:', err);
    });
  };

  // Set Vice-Captain
  const setViceCaptain = (playerId: string) => {
    if (isSquadLocked) return;
    const target = squad.players.find((p) => p.playerId === playerId);
    if (!target || !target.isStarter || target.isCaptain) return;

    const updated = sanitizeCaptaincy(
      squad.players.map((sp) => ({
        ...sp,
        isViceCaptain: sp.playerId === playerId,
        isCaptain: sp.playerId === playerId ? false : sp.isCaptain,
      }))
    );

    const updatedSquad = { ...squad, players: updated };
    setSquad(updatedSquad);
    localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(updatedSquad));
    api.saveSquadApi(currentManagerId, updated, updatedSquad.teamName, updatedSquad.bank).catch((err) => {
      console.warn('Auto-save vice captain failed:', err);
    });
  };

  // Activate Chip
  const activateChip = (chip: ChipType): boolean => {
    if (isSquadLocked || squad.usedChips[chip]) return false;
    const newActive = squad.activeChip === chip ? null : chip;
    const updatedSquad = { ...squad, activeChip: newActive };
    setSquad(updatedSquad);
    localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(updatedSquad));
    api.activateChipApi(currentManagerId, chip).catch(console.error);
    return true;
  };

  // Transfer Player
  const transferPlayer = (outPlayerId: string, inPlayerId: string) => {
    if (isSquadLocked) {
      return { success: false, message: 'Transfers are locked. The deadline has passed.' };
    }

    const outPlayer = players[outPlayerId];
    const inPlayer = players[inPlayerId];
    if (!outPlayer || !inPlayer) return { success: false, message: 'Invalid player' };

    if (outPlayer.position !== inPlayer.position) {
      return { success: false, message: 'Must replace with a player in the same position' };
    }

    // Class limits: max 2 players from the same class / team (e.g. 11/1, 9/2)
    const normalizeClub = (c: string) => (c === 'SCH' ? 'SCH_11_5' : c);
    const targetClub = normalizeClub(inPlayer.clubId);
    const currentClubCount = squad.players.filter((sp) => {
      if (sp.playerId === outPlayerId) return false;
      const spPlayer = players[sp.playerId];
      return spPlayer && normalizeClub(spPlayer.clubId) === targetClub;
    }).length;

    const clubName = CLUBS[inPlayer.clubId]?.shortName || CLUBS[targetClub]?.shortName || CLUBS[inPlayer.clubId]?.name || inPlayer.clubId;
    if (currentClubCount >= 2) {
      return {
        success: false,
        message: `Class limit reached! You cannot choose more than 2 players from the same class (${clubName}).`,
      };
    }

    const newBank = Math.round((squad.bank + outPlayer.cost - inPlayer.cost) * 10) / 10;
    if (newBank < 0) {
      return {
        success: false,
        message: `Insufficient funds. Needed £${inPlayer.cost.toFixed(1)}m, but bank would be £${newBank.toFixed(1)}m`,
      };
    }

    const updatedPlayers = sanitizeCaptaincy(
      squad.players.map((sp) =>
        sp.playerId === outPlayerId ? { ...sp, playerId: inPlayerId } : sp
      )
    );

    const updatedSquad: Squad = {
      ...squad,
      bank: Math.round(newBank * 10) / 10,
      transfersMadeThisGW: squad.transfersMadeThisGW + 1,
      players: updatedPlayers,
    };

    setSquad(updatedSquad);
    localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(updatedSquad));

    api.transferPlayerApi(currentManagerId, outPlayerId, inPlayerId).catch((e) => {
      console.warn('transferPlayerApi failed, syncing via saveSquadApi:', e);
      api.saveSquadApi(currentManagerId, updatedPlayers, updatedSquad.teamName, updatedSquad.bank).catch(console.error);
    });
    return { success: true };
  };

  // Developer: Update match stats for player in a Gameweek
  const updatePlayerStats = (playerId: string, gw: number, statsUpdate: Partial<PlayerStats>) => {
    setPlayers((prev) => {
      const player = prev[playerId];
      if (!player) return prev;

      const currentStats: PlayerStats = player.gwStats[gw] || {
        minutes: 0,
        goals: 0,
        assists: 0,
        cleanSheet: false,
        yellowCards: 0,
        redCards: 0,
        penaltiesSaved: 0,
        penaltiesMissed: 0,
        ownGoals: 0,
        isMVP: false,
      };

      const updatedStats = { ...currentStats, ...statsUpdate };

      // Check if this fixture was at One Price Stadium
      const normClub = player.clubId === 'SCH' ? 'SCH_11_5' : player.clubId;
      const gwFixture = fixtures.find(
        (f) => f.gameweek === gw && (f.homeClubId === normClub || f.awayClubId === normClub)
      );
      const isOnePrice = gwFixture?.venue === 'one_price';

      const newGWPoints = calculatePlayerPoints(player.position, updatedStats, isOnePrice);

      const updatedGWStats = {
        ...player.gwStats,
        [gw]: updatedStats,
      };

      let sumTotalPoints = 0;
      Object.entries(updatedGWStats).forEach(([gKey, gStats]) => {
        const gNum = parseInt(gKey, 10);
        const gFix = fixtures.find(
          (f) => f.gameweek === gNum && (f.homeClubId === normClub || f.awayClubId === normClub)
        );
        const gOnePrice = gFix?.venue === 'one_price';
        sumTotalPoints += calculatePlayerPoints(player.position, gStats, gOnePrice);
      });

      return {
        ...prev,
        [playerId]: {
          ...player,
          gwStats: updatedGWStats,
          gwPoints: newGWPoints,
          totalPoints: sumTotalPoints,
        },
      };
    });

    api.adminUpdateStatApi(playerId, gw, statsUpdate).catch(() => {});
  };

  // Developer: Add custom player
  const addCustomPlayer = (playerData: {
    name: string;
    webName: string;
    clubId: string;
    position: Position;
    cost: number;
  }): Player => {
    const id = 'p_custom_' + Date.now();
    const finalCost = Math.max(4.0, Math.round(playerData.cost * 10) / 10);
    const newPlayer: Player = {
      id,
      name: playerData.name,
      webName: playerData.webName,
      clubId: playerData.clubId,
      position: playerData.position,
      cost: finalCost,
      totalPoints: 0,
      gwPoints: 0,
      form: 5.0,
      selectedByPercent: 5.0,
      isAvailable: true,
      gwStats: {},
    };

    setPlayers((prev) => ({
      ...prev,
      [id]: newPlayer,
    }));

    api.adminPlayerApi({ action: 'add', player: newPlayer }).catch(() => {});
    return newPlayer;
  };

  // Developer: Edit player
  const editPlayer = (playerId: string, data: Partial<Player>) => {
    const updates = { ...data };
    if (updates.cost !== undefined) {
      updates.cost = Math.max(1.0, Math.round(updates.cost * 10) / 10);
    }
    setPlayers((prev) => {
      const existing = prev[playerId];
      if (!existing) return prev;
      return {
        ...prev,
        [playerId]: { ...existing, ...updates },
      };
    });
    api.adminPlayerApi({ action: 'edit', playerId, updates }).catch(() => {});
  };

  // Developer: Delete player (freely removes player from game and cleans squad)
  const deletePlayer = (playerId: string) => {
    setPlayers((prev) => {
      const copy = { ...prev };
      delete copy[playerId];
      return copy;
    });

    setSquad((prev) => {
      if (prev.players.some((sp) => sp.playerId === playerId)) {
        const filtered = prev.players.filter((sp) => sp.playerId !== playerId);
        const updated = { ...prev, players: filtered };
        localStorage.setItem(STORAGE_KEY_SQUAD, JSON.stringify(updated));
        return updated;
      }
      return prev;
    });

    api.adminPlayerApi({ action: 'delete', playerId }).catch(() => {});
  };

  // Developer: Add game fixture
  const addFixture = async (fixtureData: {
    gameweek: number;
    homeClubId: string;
    awayClubId: string;
    homeScore?: number | null;
    awayScore?: number | null;
    isFinished?: boolean;
    isLive?: boolean;
    kickoffTime?: string;
  }) => {
    try {
      const res = await api.adminAddFixtureApi(fixtureData);
      if (res.fixtures) {
        setFixtures(res.fixtures);
      }
    } catch {
      const id = `fix_gw${fixtureData.gameweek}_${Date.now()}`;
      setFixtures((prev) => [
        ...prev,
        {
          id,
          gameweek: fixtureData.gameweek,
          homeClubId: fixtureData.homeClubId,
          awayClubId: fixtureData.awayClubId,
          homeScore: fixtureData.homeScore ?? null,
          awayScore: fixtureData.awayScore ?? null,
          isFinished: !!fixtureData.isFinished,
          isLive: !!fixtureData.isLive,
          kickoffTime: fixtureData.kickoffTime || 'TBD',
        },
      ]);
    }
  };

  // Developer: Update fixture
  const updateFixture = async (fixtureId: string, data: Partial<Fixture>) => {
    try {
      const res = await api.adminUpdateFixtureApi(fixtureId, data);
      if (res.fixtures) {
        setFixtures(res.fixtures);
      } else {
        setFixtures((prev) =>
          prev.map((f) => (f.id === fixtureId ? { ...f, ...data } : f))
        );
      }
    } catch {
      setFixtures((prev) =>
        prev.map((f) => (f.id === fixtureId ? { ...f, ...data } : f))
      );
    }
  };

  // Developer: Delete fixture
  const deleteFixture = async (fixtureId: string) => {
    try {
      const res = await api.adminDeleteFixtureApi(fixtureId);
      if (res.fixtures) {
        setFixtures(res.fixtures);
      } else {
        setFixtures((prev) => prev.filter((f) => f.id !== fixtureId));
      }
    } catch {
      setFixtures((prev) => prev.filter((f) => f.id !== fixtureId));
    }
  };

  // Developer: Add custom school team/club
  const addClub = async (clubData: {
    name: string;
    shortName?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }) => {
    try {
      const res = await api.adminAddClubApi(clubData);
      if (res.clubs) {
        setClubs(res.clubs);
      }
      return res.club;
    } catch {
      const clubId = `SCH_${clubData.name.trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
      const newClub: Club = {
        id: clubId,
        name: clubData.name.trim(),
        shortName: clubData.shortName?.trim() || clubData.name.trim().slice(0, 4).toUpperCase(),
        primaryColor: clubData.primaryColor || '#37003c',
        secondaryColor: clubData.secondaryColor || '#00ff87',
        textColor: '#ffffff',
      };
      setClubs((prev) => ({ ...prev, [clubId]: newClub }));
      return newClub;
    }
  };

  // Developer: Simulate Gameweek Match Day
  const simulateGameweek = async (gw: number) => {
    try {
      await api.adminSimulateApi(gw);
      await refreshServerState();
    } catch {
      // Local fallback simulation
      setFixtures((prev) =>
        prev.map((f) => {
          if (f.gameweek === gw) {
            return {
              ...f,
              homeScore: Math.floor(Math.random() * 4),
              awayScore: Math.floor(Math.random() * 3),
              isFinished: true,
              isLive: false,
            };
          }
          return f;
        })
      );
    }
  };

  // Developer: Finalize Gameweek
  const finalizeGameweek = async () => {
    try {
      await api.adminFinalizeApi();
      await refreshServerState();
    } catch {
      // Local fallback
    }
  };

  const advanceGameweek = async () => {
    try {
      const res = await api.adminGameweekApi('advance');
      if (res.currentGW) setCurrentGW(res.currentGW);
      await refreshServerState();
    } catch {
      setCurrentGW((prev) => prev + 1);
    }
  };

  const resetCurrentGameweek = async (gw?: number) => {
    try {
      await api.adminGameweekApi('reset_current_gw', gw ?? currentGW);
      await refreshServerState();
    } catch {
      const targetGw = gw ?? currentGW;
      setFixtures((prev) =>
        prev.map((f) =>
          f.gameweek === targetGw
            ? { ...f, homeScore: null, awayScore: null, isFinished: false, isLive: false }
            : f
        )
      );
    }
  };

  const setGameweekNumber = async (gw: number) => {
    const targetGw = Math.max(1, gw);
    try {
      await api.adminGameweekApi('set_gw', targetGw);
      setCurrentGW(targetGw);
      await refreshServerState();
    } catch {
      setCurrentGW(targetGw);
    }
  };

  // Reset to default seed data
  const resetToDefaults = async () => {
    try {
      await api.adminGameweekApi('reset_all_gws');
      await refreshServerState();
    } catch {
      await api.adminResetApi().catch(() => {});
      await refreshServerState();
    }
  };

  // Mini-leagues: Create & Join & Delete
  const createLeague = async (name: string): Promise<string> => {
    try {
      const res = await api.createLeagueApi(currentManagerId, name);
      if (res.league) {
        setLeagues((prev) => [...prev, res.league]);
        return res.league.code;
      }
    } catch {
      // local fallback
    }
    const code = 'KCL-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const currentPts = calculationResult.totalPoints || 0;
    const newLeague: League = {
      id: 'league_' + Date.now(),
      name,
      code,
      isGlobal: false,
      members: [
        {
          id: currentManagerId,
          managerName: squad.managerName,
          teamName: squad.teamName,
          totalPoints: currentPts,
          gwPoints: currentPts,
          rank: 1,
          previousRank: 1,
        },
      ],
    };
    setLeagues((prev) => [...prev, newLeague]);
    return code;
  };

  const joinLeague = async (code: string): Promise<boolean> => {
    try {
      const res = await api.joinLeagueApi(currentManagerId, code);
      if (res.league) {
        await refreshServerState();
        return true;
      }
    } catch {
      // local fallback
    }
    const existing = leagues.find((l) => l.code.toUpperCase() === code.trim().toUpperCase());
    if (!existing) return false;
    return true;
  };

  const deleteLeague = async (leagueId: string): Promise<void> => {
    try {
      await api.deleteLeagueApi(leagueId);
    } catch {
      // local fallback
    }
    setLeagues((prev) => prev.filter((l) => l.id !== leagueId));
  };

  return (
    <FPLContext.Provider
      value={{
        players,
        clubs,
        addClub,
        squad,
        fixtures,
        addFixture,
        updateFixture,
        deleteFixture,
        leagues,
        currentGW,
        activeTab,
        setActiveTab,
        isDevAuthenticated,
        isModerator,
        devLogin,
        devLogout,
        selectedPlayerForSwap,
        setSelectedPlayerForSwap,
        substitutePlayers,
        reorderBenchPlayer,
        saveSquad,
        buyPlayer,
        removePlayer,
        setCaptain,
        setViceCaptain,
        activateChip,
        transferPlayer,
        updatePlayerStats,
        addCustomPlayer,
        editPlayer,
        deletePlayer,
        simulateGameweek,
        finalizeGameweek,
        advanceGameweek,
        resetCurrentGameweek,
        setGameweekNumber,
        resetToDefaults,
        createLeague,
        joinLeague,
        deleteLeague,
        calculationResult,
        teamValue,
        freeTransfersRemaining,
        currentManager,
        availableManagers,
        switchManager,
        registerManager,
        isManagerModalOpen,
        setIsManagerModalOpen,
        refreshServerState,
        authUser,
        authToken,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginUser,
        registerUser,
        logoutUser,
        checkAuthSession,
        paymentSettings,
        updatePaymentSettings,
        theme,
        setTheme,
        toggleTheme,
        deadline,
        isSquadLocked,
        setDeadline,
        sellPlayer: removePlayer,
        transferOutPlayerId,
        setTransferOutPlayerId,
        isDemoMode,
        enterDemoMode,
        exitDemoMode,
      }}
    >
      {children}
    </FPLContext.Provider>
  );
};

export const useFPL = () => {
  const context = useContext(FPLContext);
  if (!context) {
    throw new Error('useFPL must be used within an FPLProvider');
  }
  return context;
};

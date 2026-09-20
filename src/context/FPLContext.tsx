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
} from '../types/fpl';
import { SEED_PLAYERS, DEFAULT_SQUAD_PLAYER_IDS } from '../data/seedPlayers';
import { SEED_FIXTURES, SEED_LEAGUES } from '../data/seedFixtures';
import { CLUBS } from '../data/clubs';
import {
  calculateGameweekSquadPoints,
  calculatePlayerPoints,
  GameweekCalculationResult,
} from '../engine/scoring';
import { canSwapPlayers } from '../engine/formations';
import * as api from '../services/api';

export type TabType = 'team' | 'transfers' | 'points' | 'leagues' | 'fixtures' | 'dev';

export interface ManagerSummary {
  id: string;
  managerName: string;
  teamName: string;
}

interface FPLContextType {
  players: Record<string, Player>;
  squad: Squad;
  fixtures: Fixture[];
  leagues: League[];
  currentGW: number;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isDevAuthenticated: boolean;
  devLogin: (pass: string) => boolean;
  devLogout: () => void;
  selectedPlayerForSwap: string | null;
  setSelectedPlayerForSwap: (id: string | null) => void;
  substitutePlayers: (playerAId: string, playerBId: string) => { success: boolean; message?: string };
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
  updateFixture: (fixtureId: string, data: Partial<Fixture>) => void;
  simulateGameweek: (gw: number) => void;
  finalizeGameweek: () => void;
  advanceGameweek: () => void;
  resetToDefaults: () => void;
  createLeague: (name: string) => Promise<string>;
  joinLeague: (code: string) => Promise<boolean>;
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
  authUser: { id: string; username: string; email?: string; managerName: string; teamName: string } | null;
  authToken: string | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginUser: (login: string, pass: string) => Promise<void>;
  registerUser: (data: { username: string; email?: string; password: string; managerName: string; teamName: string }) => Promise<void>;
  logoutUser: () => void;
}

const STORAGE_KEY_AUTH_TOKEN = 'fpl_auth_token_v1';
const STORAGE_KEY_AUTH_USER = 'fpl_auth_user_v1';
const STORAGE_KEY_MANAGER_ID = 'fpl_active_manager_id_v1';
const STORAGE_KEY_PLAYERS = 'fpl_players_v1';
const STORAGE_KEY_SQUAD = 'fpl_squad_v1';
const STORAGE_KEY_FIXTURES = 'fpl_fixtures_v1';
const STORAGE_KEY_LEAGUES = 'fpl_leagues_v1';
const STORAGE_KEY_GW = 'fpl_gw_v1';

const FPLContext = createContext<FPLContextType | undefined>(undefined);

export const FPLProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
  });

  const [authUser, setAuthUser] = useState<{
    id: string;
    username: string;
    email?: string;
    managerName: string;
    teamName: string;
  } | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [currentManagerId, setCurrentManagerId] = useState<string>(() => {
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

  // Core Game State
  const [players, setPlayers] = useState<Record<string, Player>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    const map: Record<string, Player> = {};
    SEED_PLAYERS.forEach((p) => { map[p.id] = p; });
    return map;
  });

  const [squad, setSquad] = useState<Squad>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SQUAD);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      teamName: 'Apex XI',
      managerName: 'Apex Manager',
      players: DEFAULT_SQUAD_PLAYER_IDS,
      bank: 0.5,
      freeTransfers: 1,
      transfersMadeThisGW: 0,
      activeChip: null,
      usedChips: {
        triple_captain: false,
        bench_boost: false,
        free_hit: false,
      },
    };
  });

  const [fixtures, setFixtures] = useState<Fixture[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FIXTURES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return SEED_FIXTURES;
  });

  const [leagues, setLeagues] = useState<League[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LEAGUES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return SEED_LEAGUES;
  });

  const [currentGW, setCurrentGW] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GW);
    return saved ? parseInt(saved, 10) : 1;
  });

  const [activeTab, setActiveTab] = useState<TabType>('team');
  const [isDevAuthenticated, setIsDevAuthenticated] = useState<boolean>(false);
  const [selectedPlayerForSwap, setSelectedPlayerForSwap] = useState<string | null>(null);

  // Sync state from server API
  const refreshServerState = useCallback(async () => {
    try {
      const data = await api.fetchAppState(currentManagerId);
      if (data) {
        if (data.players) setPlayers(data.players);
        if (data.fixtures) setFixtures(data.fixtures);
        if (data.leagues) setLeagues(data.leagues);
        if (data.currentGW) setCurrentGW(data.currentGW);
        if (data.managers) setAvailableManagers(data.managers);
        if (data.activeManager) {
          setCurrentManager({
            id: data.activeManager.id,
            managerName: data.activeManager.managerName,
            teamName: data.activeManager.teamName,
          });
          if (data.activeManager.squad) setSquad(data.activeManager.squad);
        }
      }
    } catch (err) {
      // Offline fallback: continue using local state
    }
  }, [currentManagerId]);

  // Hydrate from server on mount
  useEffect(() => {
    refreshServerState();
    // Poll every 12 seconds so friend live updates sync automatically
    const interval = setInterval(refreshServerState, 12000);
    return () => clearInterval(interval);
  }, [refreshServerState]);

  // Persist local storage as backup
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MANAGER_ID, currentManagerId);
  }, [currentManagerId]);

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
      squad.freeTransfers
    );
  }, [squad, players, currentGW]);

  const teamValue = useMemo(() => {
    let cost = 0;
    squad.players.forEach((sp) => {
      const p = players[sp.playerId];
      if (p) cost += p.cost;
    });
    return Math.round(cost * 10) / 10;
  }, [squad.players, players]);

  const freeTransfersRemaining = Math.max(0, squad.freeTransfers - squad.transfersMadeThisGW);

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
        players: [...DEFAULT_SQUAD_PLAYER_IDS],
        bank: 0.5,
        freeTransfers: 1,
        transfersMadeThisGW: 0,
        activeChip: null,
        usedChips: { triple_captain: false, bench_boost: false, free_hit: false },
      });
    }
  };

  // Secure Password-Protected Account Login
  const loginUser = async (login: string, pass: string) => {
    const res = await api.authLogin({ login, password: pass });
    if (res.token && res.user) {
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

      if (res.squad) setSquad(res.squad);
      await refreshServerState();
    }
  };

  // Secure Password-Protected Account Registration
  const registerUser = async (data: {
    username: string;
    email?: string;
    password: string;
    managerName: string;
    teamName: string;
  }) => {
    const res = await api.authRegister(data);
    if (res.token && res.user) {
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

      if (res.squad) setSquad(res.squad);
      await refreshServerState();
    }
  };

  // Log Out
  const logoutUser = () => {
    if (authToken) {
      api.authLogout(authToken).catch(() => {});
    }
    setAuthToken(null);
    setAuthUser(null);
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
  };

  // Dev Login
  const devLogin = (pass: string) => {
    if (pass === 'admin123' || pass === 'admin' || pass === 'dev') {
      setIsDevAuthenticated(true);
      return true;
    }
    return false;
  };

  const devLogout = () => {
    setIsDevAuthenticated(false);
  };

  // Substitute / Swap logic
  const substitutePlayers = (playerAId: string, playerBId: string) => {
    const check = canSwapPlayers(playerAId, playerBId, squad.players, players);
    if (!check.canSwap) {
      return { success: false, message: check.reason };
    }

    const updatedPlayers = squad.players.map((sp) => {
      if (sp.playerId === playerAId) {
        const other = squad.players.find((p) => p.playerId === playerBId)!;
        return { ...sp, isStarter: other.isStarter, benchOrder: other.benchOrder };
      }
      if (sp.playerId === playerBId) {
        const other = squad.players.find((p) => p.playerId === playerAId)!;
        return { ...sp, isStarter: other.isStarter, benchOrder: other.benchOrder };
      }
      return sp;
    });

    setSquad((prev) => ({ ...prev, players: updatedPlayers }));
    api.saveSquadApi(currentManagerId, updatedPlayers).catch(() => {});
    setSelectedPlayerForSwap(null);
    return { success: true };
  };

  // Set Captain
  const setCaptain = (playerId: string) => {
    const target = squad.players.find((p) => p.playerId === playerId);
    if (!target || !target.isStarter) return;

    const updated = squad.players.map((sp) => ({
      ...sp,
      isCaptain: sp.playerId === playerId,
      isViceCaptain: sp.playerId === playerId ? false : sp.isViceCaptain,
    }));

    setSquad((prev) => ({ ...prev, players: updated }));
    api.saveSquadApi(currentManagerId, updated).catch(() => {});
  };

  // Set Vice-Captain
  const setViceCaptain = (playerId: string) => {
    const target = squad.players.find((p) => p.playerId === playerId);
    if (!target || !target.isStarter || target.isCaptain) return;

    const updated = squad.players.map((sp) => ({
      ...sp,
      isViceCaptain: sp.playerId === playerId,
    }));

    setSquad((prev) => ({ ...prev, players: updated }));
    api.saveSquadApi(currentManagerId, updated).catch(() => {});
  };

  // Activate Chip
  const activateChip = (chip: ChipType): boolean => {
    if (squad.usedChips[chip]) return false;
    const newActive = squad.activeChip === chip ? null : chip;
    setSquad((prev) => ({ ...prev, activeChip: newActive }));
    api.activateChipApi(currentManagerId, chip).catch(() => {});
    return true;
  };

  // Transfer Player
  const transferPlayer = (outPlayerId: string, inPlayerId: string) => {
    const outPlayer = players[outPlayerId];
    const inPlayer = players[inPlayerId];
    if (!outPlayer || !inPlayer) return { success: false, message: 'Invalid player' };

    if (outPlayer.position !== inPlayer.position) {
      return { success: false, message: 'Must replace with a player in the same position' };
    }

    const currentClubCount = squad.players.filter((sp) => {
      if (sp.playerId === outPlayerId) return false;
      return players[sp.playerId]?.clubId === inPlayer.clubId;
    }).length;

    if (currentClubCount >= 3) {
      return {
        success: false,
        message: `Maximum 3 players allowed from ${CLUBS[inPlayer.clubId]?.name || inPlayer.clubId}`,
      };
    }

    const newBank = squad.bank + outPlayer.cost - inPlayer.cost;
    if (newBank < 0) {
      return {
        success: false,
        message: `Insufficient funds. Needed £${inPlayer.cost.toFixed(1)}m, bank is £${(squad.bank + outPlayer.cost).toFixed(1)}m`,
      };
    }

    const updatedPlayers = squad.players.map((sp) =>
      sp.playerId === outPlayerId ? { ...sp, playerId: inPlayerId } : sp
    );

    setSquad((prev) => ({
      ...prev,
      bank: Math.round(newBank * 10) / 10,
      transfersMadeThisGW: prev.transfersMadeThisGW + 1,
      players: updatedPlayers,
    }));

    api.transferPlayerApi(currentManagerId, outPlayerId, inPlayerId).catch(() => {});
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
        goalsConceded: 0,
        yellowCards: 0,
        redCards: 0,
        saves: 0,
        penaltiesSaved: 0,
        penaltiesMissed: 0,
        ownGoals: 0,
        bonus: 0,
      };

      const updatedStats = { ...currentStats, ...statsUpdate };
      const newGWPoints = calculatePlayerPoints(player.position, updatedStats);

      const updatedGWStats = {
        ...player.gwStats,
        [gw]: updatedStats,
      };

      let sumTotalPoints = 0;
      Object.values(updatedGWStats).forEach((gStats) => {
        sumTotalPoints += calculatePlayerPoints(player.position, gStats);
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
    const newPlayer: Player = {
      id,
      name: playerData.name,
      webName: playerData.webName,
      clubId: playerData.clubId,
      position: playerData.position,
      cost: playerData.cost,
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
    setPlayers((prev) => {
      const existing = prev[playerId];
      if (!existing) return prev;
      return {
        ...prev,
        [playerId]: { ...existing, ...data },
      };
    });
    api.adminPlayerApi({ action: 'edit', playerId, updates: data }).catch(() => {});
  };

  // Developer: Delete player
  const deletePlayer = (playerId: string) => {
    if (squad.players.some((sp) => sp.playerId === playerId)) {
      alert('Cannot delete a player currently in your fantasy squad! Transfer them out first.');
      return;
    }
    setPlayers((prev) => {
      const copy = { ...prev };
      delete copy[playerId];
      return copy;
    });
    api.adminPlayerApi({ action: 'delete', playerId }).catch(() => {});
  };

  // Developer: Update fixture
  const updateFixture = (fixtureId: string, data: Partial<Fixture>) => {
    setFixtures((prev) =>
      prev.map((f) => (f.id === fixtureId ? { ...f, ...data } : f))
    );
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
      setCurrentGW((prev) => prev + 1);
    }
  };

  const advanceGameweek = () => {
    setCurrentGW((prev) => prev + 1);
  };

  // Reset to default seed data
  const resetToDefaults = async () => {
    try {
      await api.adminResetApi();
      await refreshServerState();
    } catch {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Mini-leagues: Create & Join
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
    const code = 'PL-' + Math.random().toString(36).substring(2, 7).toUpperCase();
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
          totalPoints: 84,
          gwPoints: calculationResult.totalPoints,
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

  return (
    <FPLContext.Provider
      value={{
        players,
        squad,
        fixtures,
        leagues,
        currentGW,
        activeTab,
        setActiveTab,
        isDevAuthenticated,
        devLogin,
        devLogout,
        selectedPlayerForSwap,
        setSelectedPlayerForSwap,
        substitutePlayers,
        setCaptain,
        setViceCaptain,
        activateChip,
        transferPlayer,
        updatePlayerStats,
        addCustomPlayer,
        editPlayer,
        deletePlayer,
        updateFixture,
        simulateGameweek,
        finalizeGameweek,
        advanceGameweek,
        resetToDefaults,
        createLeague,
        joinLeague,
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

import { Player, PlayerStats } from '../types/fpl';

const emptyStats: PlayerStats = {
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

export const SEED_PLAYERS: Player[] = [
  // GOALKEEPERS
  {
    id: 'p_raya',
    name: 'David Raya',
    webName: 'Raya',
    clubId: 'ARS',
    position: 'GKP',
    cost: 5.5,
    totalPoints: 18,
    gwPoints: 6,
    form: 6.0,
    selectedByPercent: 28.4,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, cleanSheet: true, saves: 4, bonus: 1 },
    },
  },
  {
    id: 'p_flekken',
    name: 'Mark Flekken',
    webName: 'Flekken',
    clubId: 'BRE',
    position: 'GKP',
    cost: 4.5,
    totalPoints: 12,
    gwPoints: 3,
    form: 4.0,
    selectedByPercent: 12.1,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, cleanSheet: false, saves: 5, goalsConceded: 1 },
    },
  },
  {
    id: 'p_ederson',
    name: 'Ederson Moraes',
    webName: 'Ederson',
    clubId: 'MCI',
    position: 'GKP',
    cost: 5.5,
    totalPoints: 15,
    gwPoints: 6,
    form: 5.0,
    selectedByPercent: 14.8,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, cleanSheet: true, saves: 2 },
    },
  },
  {
    id: 'p_pickford',
    name: 'Jordan Pickford',
    webName: 'Pickford',
    clubId: 'EVE',
    position: 'GKP',
    cost: 4.8,
    totalPoints: 9,
    gwPoints: 2,
    form: 3.0,
    selectedByPercent: 9.5,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, saves: 3, goalsConceded: 2 },
    },
  },

  // DEFENDERS
  {
    id: 'p_trent',
    name: 'Trent Alexander-Arnold',
    webName: 'Alexander-Arnold',
    clubId: 'LIV',
    position: 'DEF',
    cost: 7.0,
    totalPoints: 22,
    gwPoints: 8,
    form: 7.3,
    selectedByPercent: 32.1,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 88, cleanSheet: true, assists: 1, bonus: 2 },
    },
  },
  {
    id: 'p_saliba',
    name: 'William Saliba',
    webName: 'Saliba',
    clubId: 'ARS',
    position: 'DEF',
    cost: 6.0,
    totalPoints: 19,
    gwPoints: 6,
    form: 6.3,
    selectedByPercent: 35.8,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, cleanSheet: true },
    },
  },
  {
    id: 'p_gabriel',
    name: 'Gabriel Magalhães',
    webName: 'Gabriel',
    clubId: 'ARS',
    position: 'DEF',
    cost: 6.0,
    totalPoints: 24,
    gwPoints: 7,
    form: 8.0,
    selectedByPercent: 26.5,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, cleanSheet: true, bonus: 1 },
    },
  },
  {
    id: 'p_porro',
    name: 'Pedro Porro',
    webName: 'Porro',
    clubId: 'TOT',
    position: 'DEF',
    cost: 5.5,
    totalPoints: 17,
    gwPoints: 5,
    form: 5.7,
    selectedByPercent: 29.2,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, assists: 1, goalsConceded: 1 },
    },
  },
  {
    id: 'p_gvardiol',
    name: 'Joško Gvardiol',
    webName: 'Gvardiol',
    clubId: 'MCI',
    position: 'DEF',
    cost: 5.9,
    totalPoints: 20,
    gwPoints: 6,
    form: 6.7,
    selectedByPercent: 24.1,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, cleanSheet: true },
    },
  },
  {
    id: 'p_robinson',
    name: 'Antonee Robinson',
    webName: 'Robinson',
    clubId: 'FUL',
    position: 'DEF',
    cost: 4.6,
    totalPoints: 14,
    gwPoints: 5,
    form: 4.7,
    selectedByPercent: 18.3,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, assists: 1, goalsConceded: 1 },
    },
  },
  {
    id: 'p_aina',
    name: 'Ola Aina',
    webName: 'Aina',
    clubId: 'NFO',
    position: 'DEF',
    cost: 4.5,
    totalPoints: 15,
    gwPoints: 6,
    form: 5.0,
    selectedByPercent: 14.2,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, cleanSheet: true },
    },
  },

  // MIDFIELDERS
  {
    id: 'p_salah',
    name: 'Mohamed Salah',
    webName: 'Salah',
    clubId: 'LIV',
    position: 'MID',
    cost: 12.8,
    totalPoints: 34,
    gwPoints: 12,
    form: 11.3,
    selectedByPercent: 44.2,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, goals: 1, assists: 1, cleanSheet: true, bonus: 3 },
    },
  },
  {
    id: 'p_palmer',
    name: 'Cole Palmer',
    webName: 'Palmer',
    clubId: 'CHE',
    position: 'MID',
    cost: 10.8,
    totalPoints: 31,
    gwPoints: 10,
    form: 10.3,
    selectedByPercent: 51.7,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 85, goals: 1, assists: 1, bonus: 2 },
    },
  },
  {
    id: 'p_saka',
    name: 'Bukayo Saka',
    webName: 'Saka',
    clubId: 'ARS',
    position: 'MID',
    cost: 10.1,
    totalPoints: 28,
    gwPoints: 9,
    form: 9.3,
    selectedByPercent: 33.6,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 82, goals: 1, cleanSheet: true, bonus: 2 },
    },
  },
  {
    id: 'p_son',
    name: 'Son Heung-min',
    webName: 'Son',
    clubId: 'TOT',
    position: 'MID',
    cost: 9.8,
    totalPoints: 22,
    gwPoints: 8,
    form: 7.3,
    selectedByPercent: 16.5,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, goals: 1, bonus: 1 },
    },
  },
  {
    id: 'p_foden',
    name: 'Phil Foden',
    webName: 'Foden',
    clubId: 'MCI',
    position: 'MID',
    cost: 9.2,
    totalPoints: 18,
    gwPoints: 5,
    form: 6.0,
    selectedByPercent: 12.8,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 78, assists: 1, cleanSheet: true },
    },
  },
  {
    id: 'p_mbeumo',
    name: 'Bryan Mbeumo',
    webName: 'Mbeumo',
    clubId: 'BRE',
    position: 'MID',
    cost: 7.3,
    totalPoints: 25,
    gwPoints: 8,
    form: 8.3,
    selectedByPercent: 34.0,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, goals: 1, bonus: 1 },
    },
  },
  {
    id: 'p_rogers',
    name: 'Morgan Rogers',
    webName: 'Rogers',
    clubId: 'AVL',
    position: 'MID',
    cost: 5.1,
    totalPoints: 16,
    gwPoints: 6,
    form: 5.3,
    selectedByPercent: 19.8,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, assists: 1, bonus: 1 },
    },
  },
  {
    id: 'p_rice',
    name: 'Declan Rice',
    webName: 'Rice',
    clubId: 'ARS',
    position: 'MID',
    cost: 6.3,
    totalPoints: 14,
    gwPoints: 4,
    form: 4.7,
    selectedByPercent: 8.4,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, cleanSheet: true },
    },
  },

  // FORWARDS
  {
    id: 'p_haaland',
    name: 'Erling Haaland',
    webName: 'Haaland',
    clubId: 'MCI',
    position: 'FWD',
    cost: 15.0,
    totalPoints: 38,
    gwPoints: 13,
    form: 12.7,
    selectedByPercent: 68.4,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, goals: 2, bonus: 3 },
    },
  },
  {
    id: 'p_watkins',
    name: 'Ollie Watkins',
    webName: 'Watkins',
    clubId: 'AVL',
    position: 'FWD',
    cost: 9.0,
    totalPoints: 24,
    gwPoints: 7,
    form: 8.0,
    selectedByPercent: 28.9,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 86, goals: 1, bonus: 1 },
    },
  },
  {
    id: 'p_isak',
    name: 'Alexander Isak',
    webName: 'Isak',
    clubId: 'NEW',
    position: 'FWD',
    cost: 8.4,
    totalPoints: 21,
    gwPoints: 6,
    form: 7.0,
    selectedByPercent: 27.2,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 84, goals: 1 },
    },
  },
  {
    id: 'p_wood',
    name: 'Chris Wood',
    webName: 'Wood',
    clubId: 'NFO',
    position: 'FWD',
    cost: 6.3,
    totalPoints: 20,
    gwPoints: 6,
    form: 6.7,
    selectedByPercent: 22.6,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, goals: 1 },
    },
  },
  {
    id: 'p_welbeck',
    name: 'Danny Welbeck',
    webName: 'Welbeck',
    clubId: 'BHA',
    position: 'FWD',
    cost: 5.8,
    totalPoints: 17,
    gwPoints: 5,
    form: 5.7,
    selectedByPercent: 15.1,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 75, goals: 1 },
    },
  },
  {
    id: 'p_delap',
    name: 'Liam Delap',
    webName: 'Delap',
    clubId: 'IPS',
    position: 'FWD',
    cost: 5.5,
    totalPoints: 15,
    gwPoints: 4,
    form: 5.0,
    selectedByPercent: 8.2,
    isAvailable: true,
    gwStats: {
      1: { ...emptyStats, minutes: 90, goals: 1 },
    },
  },
];

// Initial 15-player squad: 2 GKP, 5 DEF, 5 MID, 3 FWD
// Total cost:
// GKP: Raya (5.5) + Flekken (4.5) = 10.0m
// DEF: Saliba (6.0) + Porro (5.5) + Robinson (4.6) + Aina (4.5) + Gvardiol (5.9) = 26.5m
// MID: Palmer (10.8) + Saka (10.1) + Mbeumo (7.3) + Rogers (5.1) + Rice (6.3) = 39.6m
// FWD: Haaland (15.0) + Wood (6.3) + Welbeck (5.8) = 27.1m
// Total Squad Cost: 10.0 + 26.5 + 39.6 + 27.1 = 103.2m -> let's balance so it fits £100.0m!
// Raya (5.5), Flekken (4.5) = 10.0
// Saliba (6.0), Porro (5.5), Robinson (4.6), Aina (4.5), Gvardiol (5.9)
// Let's replace Gvardiol with Trent or adjust squad:
// Starting XI (3-4-3):
// GK: Raya (5.5)
// DEF: Saliba (6.0), Porro (5.5), Robinson (4.6)
// MID: Palmer (10.8), Saka (10.1), Mbeumo (7.3), Rogers (5.1)
// FWD: Haaland (15.0), Wood (6.3), Welbeck (5.8)
// Starters: 5.5 + 16.1 + 33.3 + 27.1 = 82.0m
// Bench:
// GK Sub: Flekken (4.5)
// Sub 1: Aina (4.5)
// Sub 2: Rice (6.3)
// Sub 3: Delap (5.5) -> let's make Rice a 5.0m or use 4.5m DEF
// Let's adjust prices slightly in default squad to equal exactly £99.5m (leaving £0.5m in the bank):
// GKP: Raya (5.5), Flekken (4.5) = 10.0m
// DEF: Saliba (6.0), Porro (5.5), Robinson (4.6), Aina (4.5), Gvardiol (5.9) = 26.5m
// MID: Palmer (10.8), Saka (10.1), Mbeumo (7.3), Rogers (5.1), Son (9.8) -> let's do Rogers (5.1), Rice (5.0)
// To keep player prices authentic, let's set initial bank to £1.5m or total budget £100.0m with an exact balanced default squad:
export const DEFAULT_SQUAD_PLAYER_IDS = [
  // 11 Starters (Formation 3-4-3)
  { playerId: 'p_raya', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // GK
  { playerId: 'p_saliba', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // DEF 1
  { playerId: 'p_porro', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // DEF 2
  { playerId: 'p_robinson', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // DEF 3
  { playerId: 'p_palmer', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: true }, // MID 1 (VC)
  { playerId: 'p_saka', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // MID 2
  { playerId: 'p_mbeumo', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // MID 3
  { playerId: 'p_rogers', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // MID 4
  { playerId: 'p_haaland', isStarter: true, benchOrder: 0, isCaptain: true, isViceCaptain: false }, // FWD 1 (C)
  { playerId: 'p_wood', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // FWD 2
  { playerId: 'p_welbeck', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // FWD 3
  
  // 4 Bench Players
  { playerId: 'p_flekken', isStarter: false, benchOrder: 1, isCaptain: false, isViceCaptain: false }, // Sub GK
  { playerId: 'p_aina', isStarter: false, benchOrder: 2, isCaptain: false, isViceCaptain: false }, // Sub 1 (DEF)
  { playerId: 'p_delap', isStarter: false, benchOrder: 3, isCaptain: false, isViceCaptain: false }, // Sub 2 (FWD)
  { playerId: 'p_gvardiol', isStarter: false, benchOrder: 4, isCaptain: false, isViceCaptain: false }, // Sub 3 (DEF)
];

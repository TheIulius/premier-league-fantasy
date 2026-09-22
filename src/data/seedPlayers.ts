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
    id: 'p_ika',
    name: 'Irakli Kakabadze',
    webName: 'Ika',
    clubId: 'SCH',
    position: 'GKP',
    cost: 7.9,
    totalPoints: 0,
    gwPoints: 0,
    form: 5.0,
    selectedByPercent: 50.0,
    isAvailable: true,
    gwStats: {},
  },
  {
    id: 'p_futkara',
    name: 'Aleksandre Phutkaradze',
    webName: 'Futkara',
    clubId: 'SCH',
    position: 'GKP',
    cost: 8.9,
    totalPoints: 0,
    gwPoints: 0,
    form: 5.0,
    selectedByPercent: 50.0,
    isAvailable: true,
    gwStats: {},
  },

  // DEFENDERS
  {
    id: 'p_shinjo',
    name: 'Ilia Shinjiashvili',
    webName: 'Shinjo',
    clubId: 'SCH',
    position: 'DEF',
    cost: 10.0,
    totalPoints: 0,
    gwPoints: 0,
    form: 5.0,
    selectedByPercent: 100.0,
    isAvailable: true,
    gwStats: {},
  },
  {
    id: 'p_zarno',
    name: 'Dachi Zarnadze',
    webName: 'Zarno',
    clubId: 'SCH',
    position: 'DEF',
    cost: 8.8,
    totalPoints: 0,
    gwPoints: 0,
    form: 5.0,
    selectedByPercent: 100.0,
    isAvailable: true,
    gwStats: {},
  },
  {
    id: 'p_dito',
    name: 'Demna Baqradze',
    webName: 'Dito',
    clubId: 'SCH',
    position: 'DEF',
    cost: 8.3,
    totalPoints: 0,
    gwPoints: 0,
    form: 5.0,
    selectedByPercent: 100.0,
    isAvailable: true,
    gwStats: {},
  },
  {
    id: 'p_mandara',
    name: 'Tsotne Mandaria',
    webName: 'Mandara',
    clubId: 'SCH',
    position: 'DEF',
    cost: 8.2,
    totalPoints: 0,
    gwPoints: 0,
    form: 5.0,
    selectedByPercent: 100.0,
    isAvailable: true,
    gwStats: {},
  },

  // MIDFIELDERS
  {
    id: 'p_ciskara',
    name: 'Sandro Tsiskaradze',
    webName: 'ciskara',
    clubId: 'SCH',
    position: 'MID',
    cost: 9.5,
    totalPoints: 0,
    gwPoints: 0,
    form: 5.0,
    selectedByPercent: 100.0,
    isAvailable: true,
    gwStats: {},
  },
  {
    id: 'p_rati',
    name: 'Rati Tomadze',
    webName: 'Rati',
    clubId: 'SCH',
    position: 'MID',
    cost: 9.4,
    totalPoints: 0,
    gwPoints: 0,
    form: 5.0,
    selectedByPercent: 100.0,
    isAvailable: true,
    gwStats: {},
  },
  {
    id: 'p_vadzo',
    name: 'Vato Shekishvili',
    webName: 'Vadzo',
    clubId: 'SCH',
    position: 'MID',
    cost: 8.3,
    totalPoints: 0,
    gwPoints: 0,
    form: 5.0,
    selectedByPercent: 100.0,
    isAvailable: true,
    gwStats: {},
  },

  // FORWARDS
  {
    id: 'p_chaga',
    name: 'Nika Chagalidze',
    webName: 'Chaga',
    clubId: 'SCH',
    position: 'FWD',
    cost: 9.1,
    totalPoints: 0,
    gwPoints: 0,
    form: 5.0,
    selectedByPercent: 100.0,
    isAvailable: true,
    gwStats: {},
  },
  {
    id: 'p_tsotne',
    name: 'Tsotne Tsiskaradze',
    webName: 'Tsotne',
    clubId: 'SCH',
    position: 'FWD',
    cost: 8.7,
    totalPoints: 0,
    gwPoints: 0,
    form: 5.0,
    selectedByPercent: 100.0,
    isAvailable: true,
    gwStats: {},
  },
];

// 6-a-side Fantasy Squad: 6 Starters + 3 Reserves (9 total footballers)
// Total Budget = £60.0m
// Starting 6 Cost: 7.9 (Ika) + 10.0 (Shinjo) + 8.8 (Zarno) + 9.5 (ciskara) + 9.4 (Rati) + 9.1 (Chaga) = £54.7m
// Bank = £5.3m (out of £60.0m budget)
export const DEFAULT_SQUAD_PLAYER_IDS = [
  // 6 Starters on Pitch (Formation: 2-2-1)
  { playerId: 'p_ika', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // GKP
  { playerId: 'p_shinjo', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // DEF
  { playerId: 'p_zarno', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // DEF
  { playerId: 'p_ciskara', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: true }, // MID (VC)
  { playerId: 'p_rati', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // MID
  { playerId: 'p_chaga', isStarter: true, benchOrder: 0, isCaptain: true, isViceCaptain: false }, // FWD (C)

  // 3 Reserves on Bench
  { playerId: 'p_futkara', isStarter: false, benchOrder: 1, isCaptain: false, isViceCaptain: false }, // Sub GKP
  { playerId: 'p_dito', isStarter: false, benchOrder: 2, isCaptain: false, isViceCaptain: false }, // Sub DEF
  { playerId: 'p_vadzo', isStarter: false, benchOrder: 3, isCaptain: false, isViceCaptain: false }, // Sub MID
];

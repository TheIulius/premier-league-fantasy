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

// Initial Squad containing all 11 school footballers
// Total cost: 7.9 + 8.9 + 10.0 + 8.8 + 8.3 + 8.2 + 9.5 + 9.4 + 8.3 + 9.1 + 8.7 = 97.1m
// Bank = £2.9m
export const DEFAULT_SQUAD_PLAYER_IDS = [
  // 10 Starters
  { playerId: 'p_ika', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // GKP
  { playerId: 'p_shinjo', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // DEF
  { playerId: 'p_zarno', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // DEF
  { playerId: 'p_dito', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // DEF
  { playerId: 'p_mandara', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // DEF
  { playerId: 'p_ciskara', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: true }, // MID (VC)
  { playerId: 'p_rati', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // MID
  { playerId: 'p_vadzo', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // MID
  { playerId: 'p_chaga', isStarter: true, benchOrder: 0, isCaptain: true, isViceCaptain: false }, // FWD (C)
  { playerId: 'p_tsotne', isStarter: true, benchOrder: 0, isCaptain: false, isViceCaptain: false }, // FWD

  // 1 Substitute
  { playerId: 'p_futkara', isStarter: false, benchOrder: 1, isCaptain: false, isViceCaptain: false }, // Sub GKP
];

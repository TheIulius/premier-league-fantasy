import { Fixture, League } from '../types/fpl';

export const SEED_FIXTURES: Fixture[] = [
  // Gameweek 1 School Games
  {
    id: 'fix_gw1_1',
    gameweek: 1,
    homeClubId: 'SCH',
    awayClubId: 'SCH_11_2',
    homeScore: null,
    awayScore: null,
    isFinished: false,
    isLive: false,
    kickoffTime: 'Fri 15:30',
  },
  {
    id: 'fix_gw1_2',
    gameweek: 1,
    homeClubId: 'SCH_11_1',
    awayClubId: 'SCH_11_3',
    homeScore: null,
    awayScore: null,
    isFinished: false,
    isLive: false,
    kickoffTime: 'Fri 16:30',
  },
  {
    id: 'fix_gw1_3',
    gameweek: 1,
    homeClubId: 'SCH_11_4',
    awayClubId: 'SCH_11_6',
    homeScore: null,
    awayScore: null,
    isFinished: false,
    isLive: false,
    kickoffTime: 'Sat 14:00',
  },
  {
    id: 'fix_gw1_4',
    gameweek: 1,
    homeClubId: 'SCH_10',
    awayClubId: 'SCH_TCH',
    homeScore: null,
    awayScore: null,
    isFinished: false,
    isLive: false,
    kickoffTime: 'Sat 15:30',
  },

  // Gameweek 2 School Games
  {
    id: 'fix_gw2_1',
    gameweek: 2,
    homeClubId: 'SCH',
    awayClubId: 'SCH_11_1',
    homeScore: null,
    awayScore: null,
    isFinished: false,
    isLive: false,
    kickoffTime: 'Fri 15:30',
  },
  {
    id: 'fix_gw2_2',
    gameweek: 2,
    homeClubId: 'SCH_11_2',
    awayClubId: 'SCH_11_4',
    homeScore: null,
    awayScore: null,
    isFinished: false,
    isLive: false,
    kickoffTime: 'Sat 14:00',
  },
];

export const SEED_LEAGUES: League[] = [];

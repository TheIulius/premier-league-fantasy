export type Position = 'GKP' | 'DEF' | 'MID' | 'FWD';

export interface Club {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}

export interface PlayerStats {
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  goalsConceded: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  penaltiesSaved: number;
  penaltiesMissed: number;
  ownGoals: number;
  bonus: number;
}

export interface Player {
  id: string;
  name: string;
  webName: string;
  clubId: string;
  position: Position;
  cost: number; // in millions, e.g. 15.0
  totalPoints: number;
  gwPoints: number;
  form: number;
  selectedByPercent: number;
  isAvailable: boolean;
  gwStats: Record<number, PlayerStats>; // Gameweek -> Stats
}

export interface SquadPlayer {
  playerId: string;
  isStarter: boolean;
  benchOrder: number; // 0 for starters, 1 for sub GK, 2 for sub 1, 3 for sub 2, 4 for sub 3
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export type ChipType = 'triple_captain' | 'bench_boost' | 'free_hit';

export interface Squad {
  teamName: string;
  managerName: string;
  players: SquadPlayer[];
  bank: number; // e.g. 1.5 = £1.5m
  freeTransfers: number;
  transfersMadeThisGW: number;
  activeChip: ChipType | null;
  usedChips: Record<ChipType, boolean>;
}

export interface Fixture {
  id: string;
  gameweek: number;
  homeClubId: string;
  awayClubId: string;
  homeScore: number | null;
  awayScore: number | null;
  isFinished: boolean;
  isLive: boolean;
  kickoffTime: string;
}

export interface LeagueMember {
  id: string;
  managerName: string;
  teamName: string;
  totalPoints: number;
  gwPoints: number;
  rank: number;
  previousRank: number;
}

export interface League {
  id: string;
  name: string;
  code: string;
  isGlobal: boolean;
  members: LeagueMember[];
}

export interface GameweekInfo {
  currentGW: number;
  deadlineTime: string;
  isLive: boolean;
  isFinished: boolean;
  highestScore: number;
  averageScore: number;
}

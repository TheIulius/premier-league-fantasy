import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Player, Fixture, League, Squad, Club } from '../src/types/fpl';
import { SEED_PLAYERS, DEFAULT_SQUAD_PLAYER_IDS } from '../src/data/seedPlayers';
import { SEED_FIXTURES, SEED_LEAGUES } from '../src/data/seedFixtures';
import { CLUBS } from '../src/data/clubs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  managerName: string;
  teamName: string;
  token?: string;
  createdAt: string;
}

export interface ManagerProfile {
  id: string;
  managerName: string;
  teamName: string;
  squad: Squad;
  joinedAt: string;
}

export interface PaymentSettings {
  bogLink: string;
  tbcLink: string;
  entryFeeGEL: number;
  requireActivationCode: boolean;
}

export interface ActivationCode {
  code: string;
  createdAt: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
}

export interface DatabaseSchema {
  currentGW: number;
  players: Record<string, Player>;
  clubs?: Record<string, Club>;
  fixtures: Fixture[];
  leagues: League[];
  managers: Record<string, ManagerProfile>;
  users: Record<string, UserAccount>; // Keyed by user ID
  paymentSettings?: PaymentSettings;
  activationCodes?: ActivationCode[];
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, s, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: s };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return testHash === hash;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function getDefaultData(): DatabaseSchema {
  const playerMap: Record<string, Player> = {};
  SEED_PLAYERS.forEach((p) => {
    playerMap[p.id] = p;
  });

  const defaultPassword = hashPassword('fantasy123');

  const defaultUser: UserAccount = {
    id: 'user_1',
    username: 'apex',
    email: 'apex@fantasy.pl',
    passwordHash: defaultPassword.hash,
    salt: defaultPassword.salt,
    managerName: 'Apex Manager',
    teamName: 'Apex XI',
    token: 'token_apex_demo',
    createdAt: new Date().toISOString(),
  };

  const defaultManager: ManagerProfile = {
    id: 'user_1',
    managerName: 'Apex Manager',
    teamName: 'Apex XI',
    squad: {
      teamName: 'Apex XI',
      managerName: 'Apex Manager',
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
    },
    joinedAt: new Date().toISOString(),
  };

  return {
    currentGW: 1,
    players: playerMap,
    clubs: { ...CLUBS },
    fixtures: [...SEED_FIXTURES],
    leagues: SEED_LEAGUES,
    managers: {
      user_1: defaultManager,
    },
    users: {
      user_1: defaultUser,
    },
    paymentSettings: {
      bogLink: '',
      tbcLink: '',
      entryFeeGEL: 3,
      requireActivationCode: false,
    },
    activationCodes: [],
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.users) {
          this.data.users = {};
        }
        if (!this.data.paymentSettings) {
          this.data.paymentSettings = {
            bogLink: '',
            tbcLink: '',
            entryFeeGEL: 3,
            requireActivationCode: false,
          };
        }
        if (!Array.isArray(this.data.activationCodes)) {
          this.data.activationCodes = [];
        }
        if (
          !this.data.clubs ||
          Object.keys(this.data.clubs).some((k) => k === 'ARS' || k === 'CHE' || k === 'WOL' || k === 'SCH_10' || k === 'SCH_TCH') ||
          !('SCH_9_1' in this.data.clubs)
        ) {
          this.data.clubs = { ...CLUBS };
          this.save();
        }
        // Cleanse any legacy Premier League fixtures or random teacher/10th grade fixtures
        const legacyClubCodes = new Set(['ARS', 'AVL', 'BOU', 'BRE', 'BHA', 'CHE', 'CRY', 'EVE', 'FUL', 'IPS', 'LEI', 'LIV', 'MCI', 'MUN', 'NEW', 'NFO', 'SOU', 'TOT', 'WHU', 'WOL', 'SCH_10', 'SCH_12', 'SCH_TCH']);
        const hasLegacyFixtures = Array.isArray(this.data.fixtures) && this.data.fixtures.some((f) => legacyClubCodes.has(f.homeClubId) || legacyClubCodes.has(f.awayClubId));
        if (hasLegacyFixtures || !this.data.fixtures || this.data.fixtures.length === 0) {
          this.data.fixtures = [...SEED_FIXTURES];
          this.save();
        }
        // Ensure Rati is always marked as FWD
        if (this.data.players && this.data.players['p_rati'] && this.data.players['p_rati'].position !== 'FWD') {
          this.data.players['p_rati'].position = 'FWD';
          this.save();
        }
        // Auto-merge any newly added SEED_PLAYERS into existing database without overwriting existing player stats
        if (this.data.players) {
          let seedAdded = false;
          SEED_PLAYERS.forEach((sp) => {
            if (!this.data.players[sp.id]) {
              this.data.players[sp.id] = sp;
              seedAdded = true;
            }
          });
          if (seedAdded) {
            this.save();
          }
        }
        // Sanitize manager squads: auto-remove deleted ghost players and enforce strict single-captain integrity
        if (this.data.players && this.data.managers) {
          let squadsChanged = false;
          Object.values(this.data.managers).forEach((m) => {
            if (m.squad && Array.isArray(m.squad.players)) {
              const validPlayers = m.squad.players.filter((sp) => Boolean(this.data.players[sp.playerId]));
              if (validPlayers.length !== m.squad.players.length) {
                const totalCost = validPlayers.reduce((sum, sp) => sum + (this.data.players[sp.playerId]?.cost || 0), 0);
                m.squad.bank = Math.max(0, Math.round((60.0 - totalCost) * 10) / 10);
                m.squad.players = validPlayers;
                squadsChanged = true;
              }

              // Strict single captain & vice-captain integrity
              const starters = m.squad.players.filter((sp: any) => sp.isStarter);
              const captains = starters.filter((sp: any) => sp.isCaptain);
              if (captains.length > 1 || (starters.length > 0 && !captains.length)) {
                const capId = captains[0]?.playerId || starters[0]?.playerId;
                const remaining = starters.filter((sp: any) => sp.playerId !== capId);
                const viceId = remaining.find((sp: any) => sp.isViceCaptain)?.playerId || remaining[0]?.playerId;

                m.squad.players = m.squad.players.map((sp: any) => {
                  if (!sp.isStarter) return { ...sp, isCaptain: false, isViceCaptain: false };
                  return {
                    ...sp,
                    isCaptain: sp.playerId === capId,
                    isViceCaptain: sp.playerId === viceId,
                  };
                });
                squadsChanged = true;
              }
            }
          });
          if (squadsChanged) {
            this.save();
          }
        }
      } catch (err) {
        console.error('Error reading db.json, initializing with default data', err);
        this.data = getDefaultData();
        this.save();
      }
    } else {
      this.data = getDefaultData();
      this.save();
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public setData(newData: DatabaseSchema): void {
    this.data = newData;
    this.save();
  }

  private onSaveCallback?: (reason?: string) => void;

  public setOnSaveCallback(cb: (reason?: string) => void): void {
    this.onSaveCallback = cb;
  }

  public save(reason?: string): void {
    try {
      const tempFile = DB_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
      if (this.onSaveCallback) {
        this.onSaveCallback(reason);
      }
    } catch (err) {
      console.error('Failed to save db.json', err);
    }
  }

  public reset(): void {
    this.data.currentGW = 1;
    if (Array.isArray(this.data.fixtures)) {
      this.data.fixtures.forEach((f) => {
        f.homeScore = null;
        f.awayScore = null;
        f.isFinished = false;
        f.isLive = false;
        f.events = [];
      });
    }
    if (this.data.players) {
      Object.values(this.data.players).forEach((p) => {
        p.totalPoints = 0;
        p.gwPoints = 0;
        p.gwStats = {};
      });
    }
    if (this.data.managers) {
      Object.values(this.data.managers).forEach((m) => {
        if (m.squad) {
          m.squad.transfersMadeThisGW = 0;
          m.squad.freeTransfers = 1;
          m.squad.activeChip = null;
          m.squad.usedChips = {
            triple_captain: false,
            bench_boost: false,
            wildcard: false,
          };
        }
      });
    }
    if (Array.isArray(this.data.leagues)) {
      this.data.leagues.forEach((l) => {
        l.members.forEach((mem, idx) => {
          mem.gwPoints = 0;
          mem.totalPoints = 0;
          mem.rank = idx + 1;
          mem.previousRank = idx + 1;
        });
      });
    }
    this.save();
  }
}

export const db = new Database();

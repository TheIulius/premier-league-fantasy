import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Player, Fixture, League, Squad } from '../src/types/fpl';
import { SEED_PLAYERS, DEFAULT_SQUAD_PLAYER_IDS } from '../src/data/seedPlayers';
import { SEED_FIXTURES, SEED_LEAGUES } from '../src/data/seedFixtures';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface ManagerProfile {
  id: string;
  managerName: string;
  teamName: string;
  squad: Squad;
  joinedAt: string;
}

export interface DatabaseSchema {
  currentGW: number;
  players: Record<string, Player>;
  fixtures: Fixture[];
  leagues: League[];
  managers: Record<string, ManagerProfile>;
}

function getDefaultData(): DatabaseSchema {
  const playerMap: Record<string, Player> = {};
  SEED_PLAYERS.forEach((p) => {
    playerMap[p.id] = p;
  });

  const defaultManager: ManagerProfile = {
    id: 'user_1',
    managerName: 'Apex Manager',
    teamName: 'Apex XI',
    squad: {
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
    },
    joinedAt: new Date().toISOString(),
  };

  return {
    currentGW: 1,
    players: playerMap,
    fixtures: SEED_FIXTURES,
    leagues: SEED_LEAGUES,
    managers: {
      user_1: defaultManager,
    },
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

  public save(): void {
    try {
      const tempFile = DB_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to save db.json', err);
    }
  }

  public reset(): void {
    this.data = getDefaultData();
    this.save();
  }
}

export const db = new Database();

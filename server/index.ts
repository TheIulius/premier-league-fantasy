import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, ManagerProfile, hashPassword, verifyPassword, generateToken, UserAccount } from './db';
import { calculateGameweekSquadPoints, calculatePlayerPoints } from '../src/engine/scoring';
import { DEFAULT_SQUAD_PLAYER_IDS } from '../src/data/seedPlayers';
import { CLUBS } from '../src/data/clubs';
import { Player, PlayerStats } from '../src/types/fpl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Fetch Global State + Specific Manager Squad
app.get('/api/state', (req: Request, res: Response) => {
  const data = db.getData();
  const managerId = (req.query.managerId as string) || Object.keys(data.managers)[0] || 'user_1';
  const manager = data.managers[managerId] || Object.values(data.managers)[0];

  const managersList = Object.values(data.managers).map((m) => ({
    id: m.id,
    managerName: m.managerName,
    teamName: m.teamName,
  }));

  res.json({
    currentGW: data.currentGW,
    players: data.players,
    fixtures: data.fixtures,
    leagues: data.leagues,
    managers: managersList,
    activeManager: manager,
  });
});

// --- AUTHENTICATION & SEPARATE ACCOUNTS ---

// Register Account with Password
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, password, managerName, teamName } = req.body;

  if (!username || !password || !managerName || !teamName) {
    return res.status(400).json({ error: 'Username, password, manager name and team name are required' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const data = db.getData();
  if (!data.users) data.users = {};

  const cleanUser = username.trim().toLowerCase();
  const cleanEmail = (email || `${cleanUser}@fantasy.pl`).trim().toLowerCase();

  // Check username uniqueness
  const existingUser = Object.values(data.users).find(
    (u) => u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanEmail)
  );

  if (existingUser) {
    return res.status(400).json({ error: 'Username or email is already taken' });
  }

  const id = 'user_' + Date.now();
  const pwd = hashPassword(password);
  const token = generateToken();

  const newUser: UserAccount = {
    id,
    username: cleanUser,
    email: cleanEmail,
    passwordHash: pwd.hash,
    salt: pwd.salt,
    managerName: managerName.trim(),
    teamName: teamName.trim(),
    token,
    createdAt: new Date().toISOString(),
  };

  const newManager: ManagerProfile = {
    id,
    managerName: managerName.trim(),
    teamName: teamName.trim(),
    squad: {
      teamName: teamName.trim(),
      managerName: managerName.trim(),
      players: [...DEFAULT_SQUAD_PLAYER_IDS],
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

  data.users[id] = newUser;
  data.managers[id] = newManager;

  // Add to Global League
  const globalLeague = data.leagues.find((l) => l.isGlobal);
  if (globalLeague) {
    globalLeague.members.push({
      id,
      managerName: newManager.managerName,
      teamName: newManager.teamName,
      totalPoints: 84,
      gwPoints: 0,
      rank: globalLeague.members.length + 1,
      previousRank: globalLeague.members.length + 1,
    });
  }

  db.save();

  res.json({
    success: true,
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      managerName: newUser.managerName,
      teamName: newUser.teamName,
    },
    squad: newManager.squad,
  });
});

// Log In with Username/Email & Password
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password are required' });
  }

  const data = db.getData();
  if (!data.users) data.users = {};

  const clean = login.trim().toLowerCase();
  const user = Object.values(data.users).find(
    (u) => u.username.toLowerCase() === clean || (u.email && u.email.toLowerCase() === clean)
  );

  if (!user) {
    return res.status(401).json({ error: 'Account not found. Please register.' });
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  const token = generateToken();
  user.token = token;
  db.save();

  const manager = data.managers[user.id] || Object.values(data.managers)[0];

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      managerName: user.managerName,
      teamName: user.teamName,
    },
    squad: manager ? manager.squad : null,
  });
});

// Check Session / Current Logged In User
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.query.token as string);

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const data = db.getData();
  if (!data.users) data.users = {};

  const user = Object.values(data.users).find((u) => u.token === token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const manager = data.managers[user.id];

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      managerName: user.managerName,
      teamName: user.teamName,
    },
    squad: manager ? manager.squad : null,
  });
});

// Log Out
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.body.token;

  if (token) {
    const data = db.getData();
    if (data.users) {
      const user = Object.values(data.users).find((u) => u.token === token);
      if (user) {
        user.token = undefined;
        db.save();
      }
    }
  }

  res.json({ success: true });
});

// 3. Manager Login / Register (for friends to join)
app.post('/api/manager/login', (req: Request, res: Response) => {
  const { managerName, teamName } = req.body;
  if (!managerName || !teamName) {
    return res.status(400).json({ error: 'Manager name and team name required' });
  }

  const data = db.getData();

  // Look for existing profile matching name
  let existing = Object.values(data.managers).find(
    (m) => m.managerName.toLowerCase() === managerName.trim().toLowerCase()
  );

  if (!existing) {
    const id = 'user_' + Date.now();
    existing = {
      id,
      managerName: managerName.trim(),
      teamName: teamName.trim(),
      squad: {
        teamName: teamName.trim(),
        managerName: managerName.trim(),
        players: [...DEFAULT_SQUAD_PLAYER_IDS],
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

    data.managers[id] = existing;

    // Add to Global League
    const globalLeague = data.leagues.find((l) => l.isGlobal);
    if (globalLeague) {
      globalLeague.members.push({
        id,
        managerName: existing.managerName,
        teamName: existing.teamName,
        totalPoints: 84,
        gwPoints: 0,
        rank: globalLeague.members.length + 1,
        previousRank: globalLeague.members.length + 1,
      });
    }

    db.save();
  }

  res.json({ success: true, manager: existing });
});

// 4. Save Squad Lineup
app.post('/api/squad/save', (req: Request, res: Response) => {
  const { managerId, players, teamName } = req.body;
  const data = db.getData();
  const manager = data.managers[managerId];

  if (!manager) {
    return res.status(404).json({ error: 'Manager not found' });
  }

  if (players) manager.squad.players = players;
  if (teamName) {
    manager.teamName = teamName;
    manager.squad.teamName = teamName;
  }

  db.save();
  res.json({ success: true, squad: manager.squad });
});

// 5. Activate Chip
app.post('/api/squad/chip', (req: Request, res: Response) => {
  const { managerId, chip } = req.body;
  const data = db.getData();
  const manager = data.managers[managerId];

  if (!manager) return res.status(404).json({ error: 'Manager not found' });
  if (chip && manager.squad.usedChips[chip]) {
    return res.status(400).json({ error: 'Chip already used' });
  }

  manager.squad.activeChip = manager.squad.activeChip === chip ? null : chip;
  db.save();

  res.json({ success: true, activeChip: manager.squad.activeChip });
});

// 6. Execute Transfer
app.post('/api/squad/transfer', (req: Request, res: Response) => {
  const { managerId, outPlayerId, inPlayerId } = req.body;
  const data = db.getData();
  const manager = data.managers[managerId];

  if (!manager) return res.status(404).json({ error: 'Manager not found' });

  const outP = data.players[outPlayerId];
  const inP = data.players[inPlayerId];

  if (!outP || !inP) return res.status(400).json({ error: 'Invalid player' });
  if (outP.position !== inP.position) {
    return res.status(400).json({ error: 'Must swap players in the same position' });
  }

  // Club limit check
  const clubCount = manager.squad.players.filter(
    (sp) => sp.playerId !== outPlayerId && data.players[sp.playerId]?.clubId === inP.clubId
  ).length;

  if (clubCount >= 3) {
    return res.status(400).json({ error: `Max 3 players from ${inP.clubId}` });
  }

  const newBank = manager.squad.bank + outP.cost - inP.cost;
  if (newBank < 0) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  manager.squad.bank = Math.round(newBank * 10) / 10;
  manager.squad.transfersMadeThisGW += 1;
  manager.squad.players = manager.squad.players.map((sp) =>
    sp.playerId === outPlayerId ? { ...sp, playerId: inPlayerId } : sp
  );

  db.save();
  res.json({ success: true, squad: manager.squad });
});

// 7. Developer Admin: Update Live Match Stat for Player
app.post('/api/admin/stat', (req: Request, res: Response) => {
  const { playerId, gw, stats } = req.body;
  const data = db.getData();
  const player = data.players[playerId];

  if (!player) return res.status(404).json({ error: 'Player not found' });

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

  const updatedStats = { ...currentStats, ...stats };
  player.gwStats[gw] = updatedStats;
  player.gwPoints = calculatePlayerPoints(player.position, updatedStats);

  // Recalculate total points
  let sum = 0;
  Object.values(player.gwStats).forEach((s) => {
    sum += calculatePlayerPoints(player.position, s);
  });
  player.totalPoints = sum;

  db.save();
  res.json({ success: true, player });
});

// 8. Developer Admin: Simulate Gameweek
app.post('/api/admin/simulate', (req: Request, res: Response) => {
  const { gw } = req.body;
  const data = db.getData();

  data.fixtures = data.fixtures.map((f) => {
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
  });

  Object.values(data.players).forEach((p) => {
    const minutes = Math.random() > 0.15 ? (Math.random() > 0.2 ? 90 : 65) : 0;
    const goals =
      p.position === 'FWD'
        ? Math.random() > 0.4
          ? 1 + (Math.random() > 0.7 ? 1 : 0)
          : 0
        : p.position === 'MID'
        ? Math.random() > 0.6
          ? 1
          : 0
        : p.position === 'DEF'
        ? Math.random() > 0.9
          ? 1
          : 0
        : 0;
    const assists = Math.random() > 0.65 ? 1 : 0;
    const cleanSheet = (p.position === 'GKP' || p.position === 'DEF') && Math.random() > 0.55;
    const yellowCards = Math.random() > 0.8 ? 1 : 0;
    const saves = p.position === 'GKP' ? Math.floor(Math.random() * 6) + 1 : 0;
    const bonus = goals > 0 || cleanSheet ? (Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0) : 0;

    const stats: PlayerStats = {
      minutes,
      goals,
      assists,
      cleanSheet,
      goalsConceded: cleanSheet ? 0 : Math.floor(Math.random() * 2) + 1,
      yellowCards,
      redCards: 0,
      saves,
      penaltiesSaved: 0,
      penaltiesMissed: 0,
      ownGoals: 0,
      bonus,
    };

    p.gwStats[gw] = stats;
    p.gwPoints = calculatePlayerPoints(p.position, stats);

    let sum = 0;
    Object.values(p.gwStats).forEach((s) => {
      sum += calculatePlayerPoints(p.position, s);
    });
    p.totalPoints = sum;
  });

  db.save();
  res.json({ success: true, currentGW: gw });
});

// 9. Developer Admin: Finalize Gameweek across ALL managers
app.post('/api/admin/finalize', (req: Request, res: Response) => {
  const data = db.getData();
  const currentGW = data.currentGW;

  // Process all managers
  Object.values(data.managers).forEach((m) => {
    const calc = calculateGameweekSquadPoints(
      m.squad.players,
      data.players,
      currentGW,
      m.squad.activeChip,
      m.squad.transfersMadeThisGW,
      m.squad.freeTransfers
    );

    if (m.squad.activeChip) {
      m.squad.usedChips[m.squad.activeChip] = true;
      m.squad.activeChip = null;
    }
    m.squad.transfersMadeThisGW = 0;
    m.squad.freeTransfers = Math.min(5, m.squad.freeTransfers + 1);

    // Update manager's league entry
    data.leagues.forEach((l) => {
      const member = l.members.find((mem) => mem.id === m.id);
      if (member) {
        member.gwPoints = calc.totalPoints;
        member.totalPoints += calc.totalPoints;
      }
    });
  });

  // Re-rank leagues
  data.leagues.forEach((l) => {
    l.members.sort((a, b) => b.totalPoints - a.totalPoints);
    l.members.forEach((mem, idx) => {
      mem.previousRank = mem.rank;
      mem.rank = idx + 1;
    });
  });

  data.currentGW += 1;
  db.save();

  res.json({ success: true, nextGW: data.currentGW });
});

// 10. Developer Admin: Add / Edit / Delete Player
app.post('/api/admin/player', (req: Request, res: Response) => {
  const { action, player, playerId, updates } = req.body;
  const data = db.getData();

  if (action === 'add' && player) {
    const id = 'p_custom_' + Date.now();
    const newP: Player = {
      ...player,
      id,
      totalPoints: 0,
      gwPoints: 0,
      form: 5.0,
      selectedByPercent: 5.0,
      isAvailable: true,
      gwStats: {},
    };
    data.players[id] = newP;
    db.save();
    return res.json({ success: true, player: newP });
  }

  if (action === 'edit' && playerId && updates) {
    const p = data.players[playerId];
    if (p) {
      Object.assign(p, updates);
      db.save();
      return res.json({ success: true, player: p });
    }
  }

  if (action === 'delete' && playerId) {
    delete data.players[playerId];
    db.save();
    return res.json({ success: true, deleted: playerId });
  }

  res.status(400).json({ error: 'Invalid player operation' });
});

// 11. Developer Admin: Reset database to factory defaults
app.post('/api/admin/reset', (req: Request, res: Response) => {
  db.reset();
  res.json({ success: true });
});

// 12. Create / Join Mini-League
app.post('/api/league/create', (req: Request, res: Response) => {
  const { name, managerId } = req.body;
  const data = db.getData();
  const manager = data.managers[managerId];

  if (!manager) return res.status(404).json({ error: 'Manager not found' });

  const code = 'PL-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  const newLeague = {
    id: 'league_' + Date.now(),
    name,
    code,
    isGlobal: false,
    members: [
      {
        id: manager.id,
        managerName: manager.managerName,
        teamName: manager.teamName,
        totalPoints: 84,
        gwPoints: 0,
        rank: 1,
        previousRank: 1,
      },
    ],
  };

  data.leagues.push(newLeague);
  db.save();

  res.json({ success: true, league: newLeague });
});

app.post('/api/league/join', (req: Request, res: Response) => {
  const { code, managerId } = req.body;
  const data = db.getData();
  const manager = data.managers[managerId];

  if (!manager) return res.status(404).json({ error: 'Manager not found' });

  const league = data.leagues.find((l) => l.code.toUpperCase() === code.trim().toUpperCase());
  if (!league) return res.status(404).json({ error: 'League code not found' });

  if (!league.members.some((m) => m.id === manager.id)) {
    league.members.push({
      id: manager.id,
      managerName: manager.managerName,
      teamName: manager.teamName,
      totalPoints: 84,
      gwPoints: 0,
      rank: league.members.length + 1,
      previousRank: league.members.length + 1,
    });
    db.save();
  }

  res.json({ success: true, league });
});

// Static assets in production
const clientDist = path.join(__dirname, '../dist');
app.use(express.static(clientDist));

app.use((req: Request, res: Response) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Premier League Fantasy server running on port ${PORT}`);
});

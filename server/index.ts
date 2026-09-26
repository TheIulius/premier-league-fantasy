import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, ManagerProfile, hashPassword, verifyPassword, generateToken, UserAccount, PaymentSettings, ActivationCode } from './db';
import { calculateGameweekSquadPoints, calculatePlayerPoints } from '../src/engine/scoring';
import { DEFAULT_SQUAD_PLAYER_IDS } from '../src/data/seedPlayers';
import { CLUBS } from '../src/data/clubs';
import { Player, PlayerStats, Fixture, Club } from '../src/types/fpl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Moderator / Admin privilege designations
export const ADMIN_USERNAMES = ['theiulius', 'chaga'];

export function isUserAdmin(username?: string): boolean {
  if (!username) return false;
  return ADMIN_USERNAMES.includes(username.trim().toLowerCase());
}

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Fetch Global State + Specific Manager Squad
app.get('/api/state', (req: Request, res: Response) => {
  const data = db.getData();
  const managerId = req.query.managerId as string | undefined;
  let manager: ManagerProfile | null = null;

  if (managerId) {
    if (data.managers[managerId]) {
      manager = data.managers[managerId];
    } else if (data.users?.[managerId]) {
      const user = data.users[managerId];
      manager = {
        id: user.id,
        managerName: user.managerName,
        teamName: user.teamName,
        squad: {
          teamName: user.teamName,
          managerName: user.managerName,
          players: [],
          bank: 60.0,
          freeTransfers: 1,
          transfersMadeThisGW: 0,
          activeChip: null,
          usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
        },
        joinedAt: new Date().toISOString(),
      };
      data.managers[user.id] = manager;
      db.save();
    }
  }

  recalculateAllManagersLeaguePoints(data);

  const managersList = Object.values(data.managers).map((m) => ({
    id: m.id,
    managerName: m.managerName,
    teamName: m.teamName,
  }));

  const queriedUser = managerId ? data.users?.[managerId] : null;
  const isApproved = queriedUser ? (isUserAdmin(queriedUser.username) || Boolean(queriedUser.isApproved)) : false;

  res.json({
    currentGW: data.currentGW,
    players: data.players,
    clubs: data.clubs || CLUBS,
    fixtures: data.fixtures,
    leagues: data.leagues,
    managers: managersList,
    activeManager: manager,
    currentUserApproved: isApproved,
    deadline: data.deadline || null,
    paymentSettings: {
      bogLink: data.paymentSettings?.bogLink || 'https://egreve.bog.ge/KCL26_charity',
      tbcLink: data.paymentSettings?.tbcLink || '',
      entryFeeGEL: data.paymentSettings?.entryFeeGEL || 3,
      requireActivationCode: Boolean(data.paymentSettings?.requireActivationCode),
    },
  });
});

// 2b. Fetch a Specific Manager Profile, Squad, and Live Calculated Points
app.get('/api/manager/:id', (req: Request, res: Response) => {
  const managerId = req.params.id;
  const data = db.getData();

  let manager = data.managers[managerId];
  if (!manager) {
    // Check if it's one of the league members
    const leagueMember = data.leagues.flatMap((l) => l.members).find((m) => m.id === managerId);
    if (leagueMember) {
      manager = {
        id: leagueMember.id,
        managerName: leagueMember.managerName,
        teamName: leagueMember.teamName,
        squad: {
          teamName: leagueMember.teamName,
          managerName: leagueMember.managerName,
          players: [],
          bank: 60.0,
          freeTransfers: 1,
          transfersMadeThisGW: 0,
          activeChip: null,
          usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
        },
        joinedAt: new Date().toISOString(),
      };
    }
  }

  if (!manager) {
    return res.status(404).json({ error: 'Manager not found' });
  }

  const calc = calculateGameweekSquadPoints(
    manager.squad.players,
    data.players,
    data.currentGW,
    manager.squad.activeChip,
    manager.squad.transfersMadeThisGW,
    manager.squad.freeTransfers
  );

  res.json({
    success: true,
    manager,
    calculationResult: calc,
    currentGW: data.currentGW,
  });
});

// --- AUTHENTICATION & SEPARATE ACCOUNTS ---

// Register Account with Password (Supports 3 GEL Charity BOG/TBC Activation Codes)
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, password, managerName, teamName, activationCode } = req.body;

  if (!username || !password || !managerName || !teamName) {
    return res.status(400).json({ error: 'Username, password, manager name and team name are required' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const data = db.getData();
  if (!data.users) data.users = {};

  // Check Activation Code requirement
  const requireActivation = Boolean(data.paymentSettings?.requireActivationCode);
  const cleanCode = (activationCode || '').trim().toUpperCase();
  let matchedCodeObj: any = null;

  if (requireActivation || cleanCode) {
    if (!cleanCode) {
      return res.status(400).json({
        error: `A ${data.paymentSettings?.entryFeeGEL || 3} ₾ entry activation code is required. Please pay via Bank of Georgia or TBC Bank to get your code.`,
      });
    }
    matchedCodeObj = (data.activationCodes || []).find((c: any) => c.code.toUpperCase() === cleanCode);
    if (!matchedCodeObj) {
      return res.status(400).json({
        error: 'Invalid activation code. Please verify the code or contact tournament admins.',
      });
    }
    if (matchedCodeObj.isUsed) {
      return res.status(400).json({
        error: 'This activation code has already been redeemed by another manager.',
      });
    }
  }

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
  const isAdmin = isUserAdmin(cleanUser);
  const isApproved = isAdmin; // Admins are automatically approved; regular users wait for admin approval

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
    role: isAdmin ? 'admin' : 'user',
    isAdmin,
    isApproved,
  };

  const newManager: ManagerProfile = {
    id,
    managerName: managerName.trim(),
    teamName: teamName.trim(),
    squad: {
      teamName: teamName.trim(),
      managerName: managerName.trim(),
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

  data.users[id] = newUser;
  data.managers[id] = newManager;

  // Mark activation code as redeemed
  if (matchedCodeObj) {
    matchedCodeObj.isUsed = true;
    matchedCodeObj.usedBy = cleanUser;
    matchedCodeObj.usedAt = new Date().toISOString();
  }

  // Add to Global League
  const globalLeague = data.leagues.find((l) => l.isGlobal);
  if (globalLeague) {
    globalLeague.members.push({
      id,
      managerName: newManager.managerName,
      teamName: newManager.teamName,
      totalPoints: 0,
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
      role: newUser.role,
      isAdmin: newUser.isAdmin,
      isApproved: newUser.isApproved,
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

  let manager = data.managers[user.id];
  if (!manager) {
    manager = {
      id: user.id,
      managerName: user.managerName,
      teamName: user.teamName,
      squad: {
        teamName: user.teamName,
        managerName: user.managerName,
        players: [],
        bank: 60.0,
        freeTransfers: 1,
        transfersMadeThisGW: 0,
        activeChip: null,
        usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
      },
      joinedAt: new Date().toISOString(),
    };
    data.managers[user.id] = manager;
    db.save();
  }

  const isAdmin = isUserAdmin(user.username) || user.role === 'admin' || Boolean(user.isAdmin);
  const isApproved = isAdmin || Boolean(user.isApproved);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      managerName: user.managerName,
      teamName: user.teamName,
      role: isAdmin ? 'admin' : 'user',
      isAdmin,
      isApproved,
    },
    squad: manager.squad,
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

  let manager = data.managers[user.id];
  if (!manager) {
    manager = {
      id: user.id,
      managerName: user.managerName,
      teamName: user.teamName,
      squad: {
        teamName: user.teamName,
        managerName: user.managerName,
        players: [],
        bank: 60.0,
        freeTransfers: 1,
        transfersMadeThisGW: 0,
        activeChip: null,
        usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
      },
      joinedAt: new Date().toISOString(),
    };
    data.managers[user.id] = manager;
    db.save();
  }

  const isAdmin = isUserAdmin(user.username) || user.role === 'admin' || Boolean(user.isAdmin);
  const isApproved = isAdmin || Boolean(user.isApproved);

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      managerName: user.managerName,
      teamName: user.teamName,
      role: isAdmin ? 'admin' : 'user',
      isAdmin,
      isApproved,
    },
    squad: manager.squad,
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

// Admin Developer Authentication (Server-Side verification)
app.post('/api/admin/login', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.body.token;

  // 1. Direct authorization if user token belongs to a designated moderator
  const data = db.getData();
  if (token && data.users) {
    const user = Object.values(data.users).find((u) => u.token === token);
    if (user && (isUserAdmin(user.username) || user.role === 'admin')) {
      return res.json({
        success: true,
        token,
        user: { username: user.username, role: 'admin', isAdmin: true },
      });
    }
  }

  // 2. Fallback to PIN / Root password
  const password = req.body.password || req.body.pin;
  const expectedPassword = process.env.ADMIN_PASSWORD || 'adminpassword';

  if (password && (password === expectedPassword || password === 'komarovi2025' || password === 'fantasy123')) {
    const adminToken = generateToken();
    return res.json({ success: true, token: adminToken });
  }

  return res.status(401).json({ error: 'Incorrect password or unauthorized moderator account.' });
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

    data.managers[id] = existing;

    // Add to Global League
    const globalLeague = data.leagues.find((l) => l.isGlobal);
    if (globalLeague) {
      globalLeague.members.push({
        id,
        managerName: existing.managerName,
        teamName: existing.teamName,
        totalPoints: 0,
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
  const { managerId, players, teamName, bank } = req.body;
  if (!managerId) {
    return res.status(400).json({ error: 'managerId is required' });
  }

  const data = db.getData();

  // Deadline check
  if (data.deadline && new Date() >= new Date(data.deadline.deadlineTime)) {
    return res.status(403).json({ error: 'Lineups are locked. The deadline has passed.' });
  }

  // Account approval check
  const user = data.users?.[managerId];
  if (user && !isUserAdmin(user.username) && !user.isApproved) {
    return res.status(403).json({ error: 'Your account is pending approval by administrators.' });
  }

  let manager = data.managers[managerId];

  if (!manager) {
    const user = data.users?.[managerId];
    manager = {
      id: managerId,
      managerName: user?.managerName || 'My Team Manager',
      teamName: teamName || user?.teamName || 'My Squad XI',
      squad: {
        teamName: teamName || user?.teamName || 'My Squad XI',
        managerName: user?.managerName || 'My Team Manager',
        players: players || [],
        bank: typeof bank === 'number' ? Math.round(bank * 10) / 10 : 60.0,
        freeTransfers: 1,
        transfersMadeThisGW: 0,
        activeChip: null,
        usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
      },
      joinedAt: new Date().toISOString(),
    };
    data.managers[managerId] = manager;
  }

  if (players && Array.isArray(players)) {
    // Check for duplicate player IDs
    const uniqueIds = new Set(players.map((sp: any) => sp.playerId));
    if (uniqueIds.size !== players.length) {
      return res.status(400).json({ error: 'Duplicate player detected in squad!' });
    }

    const gkCount = players.filter((sp: any) => data.players[sp.playerId]?.position === 'GKP').length;
    const defCount = players.filter((sp: any) => data.players[sp.playerId]?.position === 'DEF').length;
    const midCount = players.filter((sp: any) => data.players[sp.playerId]?.position === 'MID').length;
    const fwdCount = players.filter((sp: any) => data.players[sp.playerId]?.position === 'FWD').length;

    // Check position limits (cannot exceed max allowable counts)
    if (gkCount > 1 || defCount > 3 || midCount > 3 || fwdCount > 2 || players.length > 9) {
      return res.status(400).json({
        error: `Squad limits exceeded! Max allowed: 1 GK, 3 Defenders, 3 Midfielders, 2 Forwards (Total 9). Current: ${gkCount} GK, ${defCount} DEF, ${midCount} MID, ${fwdCount} FWD.`,
      });
    }

    // Check class limits: max 2 players from the same class / club
    const clubCounts: Record<string, number> = {};
    for (const sp of players) {
      const p = data.players[sp.playerId];
      if (p) {
        const clubKey = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
        clubCounts[clubKey] = (clubCounts[clubKey] || 0) + 1;
        if (clubCounts[clubKey] > 2 && req.body.validateComplete) {
          const clubName = data.clubs[p.clubId]?.name || data.clubs[clubKey]?.name || p.clubId;
          return res.status(400).json({
            error: `Class limit exceeded! You cannot choose more than 2 players from the same class (${clubName}).`,
          });
        }
      }
    }

    // If explicit complete squad validation requested (e.g. finalizing match lineup)
    const isComplete = gkCount === 1 && defCount === 3 && midCount === 3 && fwdCount === 2;
    if (req.body.validateComplete && !isComplete) {
      return res.status(400).json({
        error: `Cannot play! Squad must have exactly 1 GK, 3 Defenders (mcveli), 3 Midfielders, and 2 Forwards. (Current: ${gkCount} GK, ${defCount} DEF, ${midCount} MID, ${fwdCount} FWD)`,
      });
    }

    if (isComplete && req.body.validateComplete) {
      const starters = players.filter((sp: any) => sp.isStarter);
      const sGk = starters.filter((sp: any) => data.players[sp.playerId]?.position === 'GKP').length;
      const sDef = starters.filter((sp: any) => data.players[sp.playerId]?.position === 'DEF').length;
      const sMid = starters.filter((sp: any) => data.players[sp.playerId]?.position === 'MID').length;
      const sFwd = starters.filter((sp: any) => data.players[sp.playerId]?.position === 'FWD').length;
      const validFormations = ['1-2-2', '2-1-2', '2-2-1', '1-3-1', '3-1-1'];
      if (starters.length !== 6 || sGk !== 1 || !validFormations.includes(`${sDef}-${sMid}-${sFwd}`)) {
        return res.status(400).json({
          error: `Invalid starting formation (${sDef}-${sMid}-${sFwd}). Must have exactly 6 starters forming 1-2-2, 2-1-2, 2-2-1, 1-3-1, or 3-1-1.`,
        });
      }
    }

    // Ensure strict single-captain integrity
    const starters = players.filter((sp: any) => sp.isStarter);
    let capAssigned = false;
    let viceAssigned = false;
    const sanitizedPlayers = players.map((sp: any) => {
      if (!sp.isStarter) {
        return { ...sp, isCaptain: false, isViceCaptain: false };
      }
      let isCap = false;
      let isVice = false;
      if (sp.isCaptain && !capAssigned) {
        isCap = true;
        capAssigned = true;
      }
      if (sp.isViceCaptain && !isCap && !viceAssigned) {
        isVice = true;
        viceAssigned = true;
      }
      return { ...sp, isCaptain: isCap, isViceCaptain: isVice };
    });

    if (!capAssigned && starters.length > 0) {
      const firstStarter = sanitizedPlayers.find((sp: any) => sp.isStarter);
      if (firstStarter) firstStarter.isCaptain = true;
    }
    if (!viceAssigned && starters.length > 1) {
      const firstNonCap = sanitizedPlayers.find((sp: any) => sp.isStarter && !sp.isCaptain);
      if (firstNonCap) firstNonCap.isViceCaptain = true;
    }

    manager.squad.players = sanitizedPlayers;
    if (typeof bank === 'number') {
      manager.squad.bank = Math.round(bank * 10) / 10;
    } else {
      const totalCost = players.reduce((sum: number, sp: any) => sum + (data.players[sp.playerId]?.cost || 0), 0);
      manager.squad.bank = Math.max(0, Math.round((60.0 - totalCost) * 10) / 10);
    }
  }

  const registeredUser = data.users?.[managerId];
  if (registeredUser?.teamName) {
    manager.teamName = registeredUser.teamName;
    manager.squad.teamName = registeredUser.teamName;
  } else if (teamName) {
    manager.teamName = teamName;
    manager.squad.teamName = teamName;
  }

  // Update Global League member teamName as well
  const globalLeague = data.leagues?.find((l) => l.isGlobal);
  if (globalLeague?.members) {
    const mem = globalLeague.members.find((m) => m.id === managerId);
    if (mem) {
      mem.teamName = manager.teamName;
      mem.managerName = manager.managerName;
    }
  }

  db.save();
  res.json({ success: true, squad: manager.squad, manager });
});

// 5. Activate Chip
app.post('/api/squad/chip', (req: Request, res: Response) => {
  const { managerId, chip } = req.body;
  const data = db.getData();

  // Account approval check
  const user = data.users?.[managerId];
  if (user && !isUserAdmin(user.username) && !user.isApproved) {
    return res.status(403).json({ error: 'Your account is pending approval by administrators.' });
  }

  let manager = data.managers[managerId];

  if (!manager) {
    const user = data.users?.[managerId];
    if (user) {
      manager = {
        id: user.id,
        managerName: user.managerName,
        teamName: user.teamName,
        squad: {
          teamName: user.teamName,
          managerName: user.managerName,
          players: [],
          bank: 60.0,
          freeTransfers: 1,
          transfersMadeThisGW: 0,
          activeChip: null,
          usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
        },
        joinedAt: new Date().toISOString(),
      };
      data.managers[user.id] = manager;
    } else {
      return res.status(404).json({ error: 'Manager not found' });
    }
  }

  const normalizedChip = chip === 'free_hit' ? 'wildcard' : chip;

  if (manager.squad.usedChips) {
    if ((manager.squad.usedChips as any).free_hit !== undefined && (manager.squad.usedChips as any).wildcard === undefined) {
      (manager.squad.usedChips as any).wildcard = (manager.squad.usedChips as any).free_hit;
    }
  }

  if (normalizedChip && manager.squad.usedChips[normalizedChip]) {
    return res.status(400).json({ error: 'Chip already used' });
  }

  manager.squad.activeChip = manager.squad.activeChip === normalizedChip ? null : normalizedChip;
  db.save();

  res.json({ success: true, activeChip: manager.squad.activeChip });
});

// 6. Execute Transfer
app.post('/api/squad/transfer', (req: Request, res: Response) => {
  const { managerId, outPlayerId, inPlayerId } = req.body;
  const data = db.getData();

  // Deadline check
  if (data.deadline && new Date() >= new Date(data.deadline.deadlineTime)) {
    return res.status(403).json({ error: 'Transfers are locked. The deadline has passed.' });
  }

  // Account approval check
  const user = data.users?.[managerId];
  if (user && !isUserAdmin(user.username) && !user.isApproved) {
    return res.status(403).json({ error: 'Your account is pending approval by administrators.' });
  }

  let manager = data.managers[managerId];

  if (!manager) {
    const user = data.users?.[managerId];
    if (user) {
      manager = {
        id: user.id,
        managerName: user.managerName,
        teamName: user.teamName,
        squad: {
          teamName: user.teamName,
          managerName: user.managerName,
          players: [],
          bank: 60.0,
          freeTransfers: 1,
          transfersMadeThisGW: 0,
          activeChip: null,
          usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
        },
        joinedAt: new Date().toISOString(),
      };
      data.managers[user.id] = manager;
    } else {
      return res.status(404).json({ error: 'Manager not found' });
    }
  }

  const outP = data.players[outPlayerId];
  const inP = data.players[inPlayerId];

  if (!outP || !inP) return res.status(400).json({ error: 'Invalid player' });
  if (outP.position !== inP.position) {
    return res.status(400).json({ error: 'Must swap players in the same position' });
  }

  // Class limit check: max 2 players from the same class / club
  const normalizeClub = (c: string) => (c === 'SCH' ? 'SCH_11_5' : c);
  const targetClub = normalizeClub(inP.clubId);
  const clubCount = manager.squad.players.filter((sp) => {
    if (sp.playerId === outPlayerId) return false;
    const p = data.players[sp.playerId];
    return p && normalizeClub(p.clubId) === targetClub;
  }).length;

  if (clubCount >= 2) {
    const clubName = data.clubs[inP.clubId]?.shortName || data.clubs[targetClub]?.shortName || inP.clubId;
    return res.status(400).json({ error: `Class limit reached! You cannot choose more than 2 players from the same class (${clubName}).` });
  }

  const newBank = Math.round((manager.squad.bank + outP.cost - inP.cost) * 10) / 10;
  if (newBank < 0) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  manager.squad.bank = newBank;
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
    yellowCards: 0,
    redCards: 0,
    penaltiesSaved: 0,
    penaltiesMissed: 0,
    ownGoals: 0,
    isMVP: false,
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

function recalculateAllManagersLeaguePoints(data: any) {
  const currentGW = data.currentGW || 1;
  if (!data.managers) data.managers = {};
  if (!data.leagues) data.leagues = [];

  // Ensure every registered user has a manager profile
  Object.values(data.users || {}).forEach((u: any) => {
    if (!data.managers[u.id]) {
      data.managers[u.id] = {
        id: u.id,
        managerName: u.managerName || u.username,
        teamName: u.teamName || `${u.username} XI`,
        squad: {
          teamName: u.teamName || `${u.username} XI`,
          managerName: u.managerName || u.username,
          players: [],
          bank: 60.0,
          freeTransfers: 1,
          transfersMadeThisGW: 0,
          activeChip: null,
          usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
        },
        joinedAt: u.createdAt || new Date().toISOString(),
      };
    }
  });

  // Ensure Global School League exists and contains every manager
  let globalLeague = data.leagues.find((l: any) => l.isGlobal);
  if (!globalLeague) {
    globalLeague = {
      id: 'league_global',
      name: 'Komarovi Overall',
      code: 'GLOBAL',
      isGlobal: true,
      members: [],
    };
    data.leagues.unshift(globalLeague);
  }

  Object.values(data.managers).forEach((m: any) => {
    if (!globalLeague.members.some((mem: any) => mem.id === m.id)) {
      globalLeague.members.push({
        id: m.id,
        managerName: m.managerName,
        teamName: m.teamName,
        totalPoints: 0,
        gwPoints: 0,
        rank: globalLeague.members.length + 1,
        previousRank: globalLeague.members.length + 1,
      });
    }
  });

  Object.values(data.managers).forEach((m: any) => {
    const squadPlayers = Array.isArray(m.squad?.players) ? m.squad.players : [];
    const currentCalc = calculateGameweekSquadPoints(
      squadPlayers,
      data.players,
      currentGW,
      m.squad?.activeChip || null,
      m.squad?.transfersMadeThisGW || 0,
      m.squad?.freeTransfers || 1
    );

    let cumulativeTotal = 0;
    for (let gw = 1; gw <= currentGW; gw++) {
      const gwCalc = calculateGameweekSquadPoints(
        squadPlayers,
        data.players,
        gw,
        gw === currentGW ? m.squad?.activeChip || null : null,
        gw === currentGW ? m.squad?.transfersMadeThisGW || 0 : 0,
        m.squad?.freeTransfers || 1
      );
      cumulativeTotal += gwCalc.totalPoints;
    }

    const lineupSummary = squadPlayers
      .map((sp: any) => {
        const p = data.players?.[sp.playerId];
        if (!p) return null;
        const bd = currentCalc.playerPointsBreakdown?.[sp.playerId];
        return {
          playerId: sp.playerId,
          webName: p.webName,
          clubId: p.clubId,
          position: p.position,
          isStarter: Boolean(sp.isStarter),
          isCaptain: Boolean(sp.isCaptain),
          isViceCaptain: Boolean(sp.isViceCaptain),
          benchOrder: sp.benchOrder || 0,
          points: bd ? bd.finalPoints : 0,
        };
      })
      .filter(Boolean);

    (data.leagues || []).forEach((l: any) => {
      const member = l.members.find((mem: any) => mem.id === m.id);
      if (member) {
        member.managerName = m.managerName;
        member.teamName = m.teamName;
        member.gwPoints = currentCalc.totalPoints;
        member.totalPoints = cumulativeTotal;
        member.activeChip = m.squad?.activeChip || null;
        member.lineup = lineupSummary;
      }
    });
  });

  (data.leagues || []).forEach((l: any) => {
    l.members.sort((a: any, b: any) => b.totalPoints - a.totalPoints || b.gwPoints - a.gwPoints);
    l.members.forEach((mem: any, idx: number) => {
      mem.previousRank = mem.rank || idx + 1;
      mem.rank = idx + 1;
    });
  });
}

// 9. Developer Admin: Finalize Gameweek across ALL managers
app.post('/api/admin/finalize', (req: Request, res: Response) => {
  const data = db.getData();
  const currentGW = data.currentGW;

  recalculateAllManagersLeaguePoints(data);

  db.save();
  scheduleAutoSyncToGitHub(`Finalized GW ${currentGW} standings`);

  res.json({ success: true, currentGW: data.currentGW });
});

// 9b. Developer Admin: Gameweek Controls (Advance, Set GW, Reset Current GW, Reset Season to GW 1)
app.post('/api/admin/gameweek', (req: Request, res: Response) => {
  const { action, gw } = req.body;
  const data = db.getData();

  if (action === 'advance') {
    recalculateAllManagersLeaguePoints(data);
    Object.values(data.managers || {}).forEach((m: any) => {
      if (m.squad.activeChip) {
        m.squad.usedChips[m.squad.activeChip] = true;
        m.squad.activeChip = null;
      }
      m.squad.transfersMadeThisGW = 0;
      m.squad.freeTransfers = Math.min(5, (m.squad.freeTransfers || 1) + 1);
    });
    data.currentGW = (data.currentGW || 1) + 1;
    db.save();
    scheduleAutoSyncToGitHub(`Advanced to GW ${data.currentGW}`);
    return res.json({ success: true, currentGW: data.currentGW });
  }

  if (action === 'set_gw') {
    const targetGw = Math.max(1, Number(gw || 1));
    data.currentGW = targetGw;
    recalculateAllManagersLeaguePoints(data);
    db.save();
    scheduleAutoSyncToGitHub(`Set current Gameweek to GW ${targetGw}`);
    return res.json({ success: true, currentGW: data.currentGW });
  }

  if (action === 'reset_current_gw') {
    const targetGw = Math.max(1, Number(gw || data.currentGW || 1));
    // Reset fixtures for targetGw
    (data.fixtures || []).forEach((f: any) => {
      if (f.gameweek === targetGw) {
        f.homeScore = null;
        f.awayScore = null;
        f.isFinished = false;
        f.isLive = false;
        f.events = [];
      }
    });
    // Reset player stats for targetGw and recalculate totalPoints
    Object.values(data.players || {}).forEach((p: any) => {
      if (p.gwStats && p.gwStats[targetGw]) {
        delete p.gwStats[targetGw];
      }
      if (targetGw === data.currentGW) {
        p.gwPoints = 0;
      }
      let total = 0;
      Object.entries(p.gwStats || {}).forEach(([gKey, st]: [string, any]) => {
        const gNum = Number(gKey);
        const fix = (data.fixtures || []).find(
          (fx: any) => fx.gameweek === gNum && (fx.homeClubId === p.clubId || fx.awayClubId === p.clubId)
        );
        const bd = calculatePlayerPoints(p.position, st, fix?.venue);
        total += bd.total;
      });
      p.totalPoints = total;
    });
    recalculateAllManagersLeaguePoints(data);
    db.save();
    scheduleAutoSyncToGitHub(`Reset GW ${targetGw} scores and stats`);
    return res.json({ success: true, currentGW: data.currentGW });
  }

  if (action === 'reset_all_gws') {
    db.reset();
    scheduleAutoSyncToGitHub('Reset all Gameweeks to GW 1 (preserved squads & users)');
    return res.json({ success: true, currentGW: 1 });
  }

  return res.status(400).json({ error: 'Unknown gameweek action' });
});

// 10. Developer Admin: Add / Edit / Delete Player
app.post('/api/admin/player', (req: Request, res: Response) => {
  const { action, player, playerId, updates } = req.body;
  const data = db.getData();

  if (action === 'add' && player) {
    const id = 'p_custom_' + Date.now();
    const finalCost = Math.max(4.0, Math.round(Number(player.cost || 4.0) * 10) / 10);
    const newP: Player = {
      ...player,
      id,
      cost: finalCost,
      totalPoints: 0,
      gwPoints: 0,
      form: 5.0,
      selectedByPercent: 5.0,
      isAvailable: true,
      gwStats: {},
    };
    data.players[id] = newP;
    db.save();
    scheduleAutoSyncToGitHub(`Added footballer ${newP.webName}`);
    return res.json({ success: true, player: newP });
  }

  if (action === 'edit' && playerId && updates) {
    const p = data.players[playerId];
    if (p) {
      if (updates.cost !== undefined) {
        updates.cost = Math.max(4.0, Math.round(Number(updates.cost) * 10) / 10);
      }
      Object.assign(p, updates);
      db.save();
      const priceMsg = updates.cost !== undefined ? `price £${updates.cost}m` : 'details';
      scheduleAutoSyncToGitHub(`Updated ${p.webName} (${priceMsg})`);
      return res.json({ success: true, player: p });
    }
  }

  if (action === 'delete' && playerId) {
    const pName = data.players[playerId]?.webName || playerId;
    delete data.players[playerId];
    if (data.managers) {
      Object.values(data.managers).forEach((m) => {
        if (m.squad && Array.isArray(m.squad.players)) {
          m.squad.players = m.squad.players.filter((sp: any) => sp.playerId !== playerId);
        }
      });
    }
    db.save();
    scheduleAutoSyncToGitHub(`Deleted footballer ${pName}`);
    return res.json({ success: true, deleted: playerId });
  }

  res.status(400).json({ error: 'Invalid player operation' });
});

// 11. Developer Admin: Reset database to factory defaults
app.post('/api/admin/reset', (req: Request, res: Response) => {
  db.reset();
  scheduleAutoSyncToGitHub('Reset game state to GW 1');
  res.json({ success: true });
});

// 11a. Database Export
app.get('/api/admin/db/export', (req: Request, res: Response) => {
  const data = db.getData();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="db.json"');
  res.send(JSON.stringify(data, null, 2));
});

// 11b. Database Import
app.post('/api/admin/db/import', (req: Request, res: Response) => {
  const { dbData } = req.body;
  if (!dbData || typeof dbData !== 'object' || !dbData.players) {
    return res.status(400).json({ error: 'Invalid database JSON format' });
  }
  db.setData(dbData);
  scheduleAutoSyncToGitHub('Imported database JSON');
  res.json({ success: true, message: 'Database imported and saved successfully!' });
});

// 12. Payment & Charity Links Settings
app.get('/api/payment-settings', (req: Request, res: Response) => {
  const data = db.getData();
  res.json({
    bogLink: data.paymentSettings?.bogLink || 'https://egreve.bog.ge/KCL26_charity',
    tbcLink: data.paymentSettings?.tbcLink || '',
    entryFeeGEL: data.paymentSettings?.entryFeeGEL || 3,
    requireActivationCode: Boolean(data.paymentSettings?.requireActivationCode),
  });
});

app.post('/api/admin/payment-settings', (req: Request, res: Response) => {
  const { bogLink, tbcLink, entryFeeGEL, requireActivationCode } = req.body;
  const data = db.getData();

  data.paymentSettings = {
    bogLink: typeof bogLink === 'string' ? bogLink.trim() : (data.paymentSettings?.bogLink || ''),
    tbcLink: typeof tbcLink === 'string' ? tbcLink.trim() : (data.paymentSettings?.tbcLink || ''),
    entryFeeGEL: typeof entryFeeGEL === 'number' ? entryFeeGEL : (data.paymentSettings?.entryFeeGEL || 3),
    requireActivationCode: typeof requireActivationCode === 'boolean' ? requireActivationCode : Boolean(data.paymentSettings?.requireActivationCode),
  };

  db.save();
  scheduleAutoSyncToGitHub('Updated BOG/TBC payment settings');
  res.json({ success: true, settings: data.paymentSettings });
});

// 13. Activation Codes Management
app.get('/api/admin/activation-codes', (req: Request, res: Response) => {
  const data = db.getData();
  res.json({ codes: data.activationCodes || [] });
});

app.post('/api/admin/activation-codes/generate', (req: Request, res: Response) => {
  const { count } = req.body;
  const numCodes = Math.min(50, Math.max(1, Number(count) || 1));
  const data = db.getData();
  if (!Array.isArray(data.activationCodes)) {
    data.activationCodes = [];
  }

  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const newCodes: ActivationCode[] = [];

  for (let i = 0; i < numCodes; i++) {
    let rand = '';
    for (let c = 0; c < 4; c++) {
      rand += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    const code = `KCL-${rand}`;
    if (!data.activationCodes.some((existing) => existing.code === code)) {
      const codeObj: ActivationCode = {
        code,
        createdAt: new Date().toISOString(),
        isUsed: false,
      };
      data.activationCodes.unshift(codeObj);
      newCodes.push(codeObj);
    }
  }

  db.save();
  scheduleAutoSyncToGitHub(`Generated ${newCodes.length} activation codes`);
  res.json({ success: true, codes: newCodes, allCodes: data.activationCodes });
});

app.delete('/api/admin/activation-codes/:code', (req: Request, res: Response) => {
  const targetCode = req.params.code.toUpperCase();
  const data = db.getData();
  if (!Array.isArray(data.activationCodes)) {
    data.activationCodes = [];
  }

  const initialLen = data.activationCodes.length;
  data.activationCodes = data.activationCodes.filter((c) => c.code.toUpperCase() !== targetCode);

  if (data.activationCodes.length !== initialLen) {
    db.save();
    scheduleAutoSyncToGitHub(`Revoked activation code ${targetCode}`);
  }

  res.json({ success: true });
});

// In-memory runtime GitHub token (can be set via environment variable or admin portal)
let runtimeGithubToken = process.env.GITHUB_TOKEN || '';
let autoSyncTimer: NodeJS.Timeout | null = null;

export async function commitDbToGitHub(message: string, explicitToken?: string) {
  const token = explicitToken || runtimeGithubToken || process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'TheIulius';
  const repo = process.env.GITHUB_REPO || 'premier-league-fantasy';
  const branch = process.env.GITHUB_BRANCH || 'main';
  const filePath = 'data/db.json';

  if (!token) {
    return { success: false, error: 'No GitHub token configured' };
  }

  try {
    const data = db.getData();
    const contentStr = JSON.stringify(data, null, 2);
    const base64Content = Buffer.from(contentStr, 'utf-8').toString('base64');

    // 1. Fetch current file SHA
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Premier-League-Fantasy-App',
      },
    });

    let sha: string | undefined;
    if (getRes.ok) {
      const getJson: any = await getRes.json();
      sha = getJson.sha;
    }

    // 2. Commit file directly to GitHub repo with [skip ci] to avoid build loops
    const commitMsg = message.includes('[skip ci]') ? message : `${message} [skip ci]`;
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Premier-League-Fantasy-App',
      },
      body: JSON.stringify({
        message: commitMsg,
        content: base64Content,
        sha,
        branch,
      }),
    });

    const putJson: any = await putRes.json();
    if (!putRes.ok) {
      console.warn('Auto-commit to GitHub failed:', putJson?.message || putJson);
      return { success: false, error: putJson?.message || 'Failed to commit to GitHub' };
    }

    console.log(`Successfully committed database to GitHub: "${commitMsg}"`);
    return { success: true, commitUrl: putJson.commit?.html_url };
  } catch (err: any) {
    console.warn('GitHub auto-sync error:', err);
    return { success: false, error: err?.message || 'Sync error' };
  }
}

export function scheduleAutoSyncToGitHub(reason: string) {
  const token = runtimeGithubToken || process.env.GITHUB_TOKEN;
  if (!token) return;
  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(async () => {
    try {
      await commitDbToGitHub(`Admin update: ${reason}`);
    } catch (e) {
      console.warn('Background auto-sync failed:', e);
    }
  }, 2500); // 2.5-second debounce for batch actions
}

// Automatically sync all database saves (user registrations, squads, transfers, match events) to GitHub
db.setOnSaveCallback((reason) => {
  scheduleAutoSyncToGitHub(reason || 'Data updated');
});

// Check Server Auto-Sync Status
app.get('/api/admin/db/sync-status', (req: Request, res: Response) => {
  const hasToken = Boolean(runtimeGithubToken || process.env.GITHUB_TOKEN);
  res.json({
    hasServerToken: hasToken,
    owner: process.env.GITHUB_OWNER || 'TheIulius',
    repo: process.env.GITHUB_REPO || 'premier-league-fantasy',
    branch: process.env.GITHUB_BRANCH || 'main',
  });
});

// Set or Update Server Token in Memory
app.post('/api/admin/db/set-token', (req: Request, res: Response) => {
  const { token } = req.body;
  if (token && typeof token === 'string' && token.trim().length > 0) {
    runtimeGithubToken = token.trim();
    return res.json({ success: true, message: 'Server GitHub token activated! Auto-sync is now active.' });
  }
  runtimeGithubToken = '';
  res.json({ success: true, message: 'Server GitHub token cleared.' });
});

// 11c. Sync / Commit Database directly to GitHub
app.post('/api/admin/db/sync-github', async (req: Request, res: Response) => {
  const token = req.body.token || runtimeGithubToken || process.env.GITHUB_TOKEN;
  if (req.body.token && !runtimeGithubToken) {
    runtimeGithubToken = req.body.token;
  }

  if (!token) {
    return res.status(400).json({
      error: 'GitHub Personal Access Token required. Provide token or set GITHUB_TOKEN on server.',
    });
  }

  const result = await commitDbToGitHub(req.body.message || 'Update database from Dev Portal', token);
  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  return res.json({
    success: true,
    message: 'Successfully committed database to GitHub!',
    commitUrl: result.commitUrl,
  });
});

// 11b. Developer Admin: Add Game / Fixture
app.post('/api/admin/fixture/add', (req: Request, res: Response) => {
  const { gameweek, homeClubId, awayClubId, homeScore, awayScore, isFinished, isLive, kickoffTime } = req.body;
  if (!gameweek || !homeClubId || !awayClubId) {
    return res.status(400).json({ error: 'gameweek, homeClubId, and awayClubId are required' });
  }
  const data = db.getData();
  const id = `fix_gw${gameweek}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const newFixture: Fixture = {
    id,
    gameweek: parseInt(gameweek, 10),
    homeClubId,
    awayClubId,
    homeScore: homeScore !== undefined && homeScore !== null && homeScore !== '' ? parseInt(homeScore, 10) : null,
    awayScore: awayScore !== undefined && awayScore !== null && awayScore !== '' ? parseInt(awayScore, 10) : null,
    isFinished: !!isFinished,
    isLive: !!isLive,
    kickoffTime: kickoffTime || 'TBD',
  };
  data.fixtures.push(newFixture);
  db.save();
  scheduleAutoSyncToGitHub(`Added GW ${gameweek} match`);
  res.json({ success: true, fixture: newFixture, fixtures: data.fixtures });
});

// 11c. Developer Admin: Update Game / Fixture
app.post('/api/admin/fixture/update', (req: Request, res: Response) => {
  const { id, updates } = req.body;
  if (!id || !updates) {
    return res.status(400).json({ error: 'id and updates are required' });
  }
  const data = db.getData();
  const fix = data.fixtures.find((f) => f.id === id);
  if (!fix) {
    return res.status(404).json({ error: 'Fixture not found' });
  }
  Object.assign(fix, updates);
  db.save();
  scheduleAutoSyncToGitHub(`Updated match fixture ${id}`);
  res.json({ success: true, fixture: fix, fixtures: data.fixtures });
});

// 11d. Developer Admin: Delete Game / Fixture
app.post('/api/admin/fixture/delete', (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }
  const data = db.getData();
  data.fixtures = data.fixtures.filter((f) => f.id !== id);
  db.save();
  scheduleAutoSyncToGitHub(`Deleted match fixture ${id}`);
  res.json({ success: true, fixtures: data.fixtures });
});

// 11e. Developer Admin: Add School Club / Team
app.post('/api/admin/club/add', (req: Request, res: Response) => {
  const { id, name, shortName, primaryColor, secondaryColor, textColor } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Team name is required' });
  }
  const data = db.getData();
  if (!data.clubs) data.clubs = { ...CLUBS };
  const clubId = id || `SCH_${name.trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
  const newClub: Club = {
    id: clubId,
    name: name.trim(),
    shortName: shortName?.trim() || name.trim().slice(0, 4).toUpperCase(),
    primaryColor: primaryColor || '#37003c',
    secondaryColor: secondaryColor || '#00ff87',
    textColor: textColor || '#ffffff',
  };
  data.clubs[clubId] = newClub;
  db.save();
  scheduleAutoSyncToGitHub(`Added team ${newClub.name}`);
  res.json({ success: true, club: newClub, clubs: data.clubs });
});



// 11d. Developer Admin: List Registered Users
app.get('/api/admin/users', (req: Request, res: Response) => {
  const data = db.getData();
  const usersList = Object.values(data.users || {}).map((u) => {
    const isAdmin = isUserAdmin(u.username) || u.role === 'admin' || Boolean(u.isAdmin);
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      managerName: u.managerName,
      teamName: u.teamName,
      createdAt: u.createdAt,
      role: isAdmin ? 'admin' : 'user',
      isAdmin,
      isApproved: isAdmin || Boolean(u.isApproved),
    };
  });
  res.json({ success: true, users: usersList });
});

// 11e. Developer Admin: Approve / Unapprove User Account
app.post('/api/admin/user/approve', (req: Request, res: Response) => {
  const { userId, username, isApproved } = req.body;
  const data = db.getData();
  if (!data.users) data.users = {};

  const clean = (username || '').trim().toLowerCase();
  const user = Object.values(data.users).find(
    (u) => (userId && u.id === userId) || (clean && u.username.toLowerCase() === clean)
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const newStatus = typeof isApproved === 'boolean' ? isApproved : true;
  user.isApproved = newStatus;
  db.save();

  scheduleAutoSyncToGitHub(`Admin ${newStatus ? 'approved' : 'unapproved'} user @${user.username}`);

  res.json({
    success: true,
    message: `Account @${user.username} (${user.managerName}) is now ${newStatus ? 'Approved' : 'Pending Approval'}.`,
    user: {
      id: user.id,
      username: user.username,
      managerName: user.managerName,
      teamName: user.teamName,
      isApproved: user.isApproved,
    },
  });
});

// 11e. Developer Admin: Reset User Password
app.post('/api/admin/user/reset-password', (req: Request, res: Response) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: 'Username and new password are required' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  const data = db.getData();
  if (!data.users) data.users = {};

  const clean = username.trim().toLowerCase();
  const user = Object.values(data.users).find(
    (u) =>
      u.username.toLowerCase() === clean ||
      (u.email && u.email.toLowerCase() === clean) ||
      u.id === username
  );

  if (!user) {
    return res.status(404).json({ error: `User "${username}" not found in database` });
  }

  const pwd = hashPassword(newPassword);
  user.passwordHash = pwd.hash;
  user.salt = pwd.salt;
  user.token = undefined; // Invalidate previous session token to require fresh login
  db.save();

  res.json({
    success: true,
    message: `Password for @${user.username} (${user.managerName}) was reset successfully!`,
    user: {
      id: user.id,
      username: user.username,
      managerName: user.managerName,
      teamName: user.teamName,
    },
  });
});

// 11f. Developer Admin: Add New User Account
app.post('/api/admin/user/create', (req: Request, res: Response) => {
  const { username, password, managerName, teamName, email, isApproved, role } = req.body;
  if (!username || !password || !managerName || !teamName) {
    return res.status(400).json({ error: 'Username, password, manager name and team name are required.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
  }

  const data = db.getData();
  if (!data.users) data.users = {};
  if (!data.managers) data.managers = {};

  const cleanUser = username.trim().toLowerCase();
  const cleanEmail = (email || `${cleanUser}@fantasy.pl`).trim().toLowerCase();

  const existing = Object.values(data.users).find(
    (u) => u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanEmail)
  );
  if (existing) {
    return res.status(400).json({ error: `Username "${cleanUser}" or email is already taken.` });
  }

  const id = 'user_' + Date.now();
  const pwd = hashPassword(password);
  const isAdm = role === 'admin' || isUserAdmin(cleanUser);
  const approved = isAdm || (typeof isApproved === 'boolean' ? isApproved : true);

  const newUser: UserAccount = {
    id,
    username: cleanUser,
    email: cleanEmail,
    passwordHash: pwd.hash,
    salt: pwd.salt,
    managerName: managerName.trim(),
    teamName: teamName.trim(),
    createdAt: new Date().toISOString(),
    role: isAdm ? 'admin' : 'user',
    isAdmin: isAdm,
    isApproved: approved,
  };

  const newManager: ManagerProfile = {
    id,
    managerName: managerName.trim(),
    teamName: teamName.trim(),
    squad: {
      teamName: teamName.trim(),
      managerName: managerName.trim(),
      players: [],
      bank: 60.0,
      freeTransfers: 1,
      transfersMadeThisGW: 0,
      activeChip: null,
      usedChips: { triple_captain: false, bench_boost: false, wildcard: false },
    },
    joinedAt: new Date().toISOString(),
  };

  data.users[id] = newUser;
  data.managers[id] = newManager;

  // Add to Global League
  const globalLeague = data.leagues?.find((l) => l.isGlobal);
  if (globalLeague) {
    globalLeague.members.push({
      id,
      managerName: newManager.managerName,
      teamName: newManager.teamName,
      totalPoints: 0,
      gwPoints: 0,
      rank: globalLeague.members.length + 1,
      previousRank: globalLeague.members.length + 1,
    });
  }

  db.save();
  scheduleAutoSyncToGitHub(`Admin created user @${cleanUser}`);

  res.json({
    success: true,
    message: `Account for @${cleanUser} (${newManager.managerName}) created successfully!`,
    user: {
      id: newUser.id,
      username: newUser.username,
      managerName: newUser.managerName,
      teamName: newUser.teamName,
      email: newUser.email,
      role: newUser.role,
      isAdmin: newUser.isAdmin,
      isApproved: newUser.isApproved,
    },
  });
});

// 11g. Developer Admin: Remove User Account
app.post('/api/admin/user/delete', (req: Request, res: Response) => {
  const { userId, username } = req.body;
  const data = db.getData();
  if (!data.users) data.users = {};

  const clean = (username || '').trim().toLowerCase();
  const user = Object.values(data.users).find(
    (u) => (userId && u.id === userId) || (clean && u.username.toLowerCase() === clean)
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (isUserAdmin(user.username) || user.username === 'theiulius' || user.username === 'chaga') {
    return res.status(403).json({ error: `Cannot delete protected moderator account @${user.username}.` });
  }

  const targetId = user.id;
  const targetUsername = user.username;

  // 1. Delete user
  delete data.users[targetId];

  // 2. Delete manager
  if (data.managers) {
    delete data.managers[targetId];
  }

  // 3. Remove from all leagues
  if (data.leagues) {
    data.leagues.forEach((l) => {
      if (l.members) {
        l.members = l.members.filter((m) => m.id !== targetId);
      }
    });
  }

  db.save();
  scheduleAutoSyncToGitHub(`Admin deleted user @${targetUsername}`);

  res.json({
    success: true,
    message: `User @${targetUsername} has been permanently deleted.`,
  });
});

// 11h. Developer Admin: Reset User's Everything (Squad, Points, Chips, Transfers)
app.post('/api/admin/user/reset', (req: Request, res: Response) => {
  const { userId, username, newPassword } = req.body;
  const data = db.getData();
  if (!data.users) data.users = {};

  const clean = (username || '').trim().toLowerCase();
  const user = Object.values(data.users).find(
    (u) => (userId && u.id === userId) || (clean && u.username.toLowerCase() === clean)
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const targetId = user.id;

  // 1. Reset Manager profile & squad
  if (data.managers && data.managers[targetId]) {
    const m = data.managers[targetId];
    m.teamName = user.teamName;
    m.managerName = user.managerName;
    m.squad = {
      teamName: user.teamName,
      managerName: user.managerName,
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
  }

  // 2. Reset points and lineup in all leagues
  if (data.leagues) {
    data.leagues.forEach((l) => {
      if (l.members) {
        const mem = l.members.find((m) => m.id === targetId);
        if (mem) {
          mem.totalPoints = 0;
          mem.gwPoints = 0;
          mem.activeChip = null;
          mem.lineup = [];
          mem.teamName = user.teamName;
          mem.managerName = user.managerName;
        }
      }
    });
  }

  // 3. Optional password reset
  if (newPassword && newPassword.length >= 4) {
    const pwd = hashPassword(newPassword);
    user.passwordHash = pwd.hash;
    user.salt = pwd.salt;
  }

  // Invalidate current session
  user.token = undefined;

  db.save();
  scheduleAutoSyncToGitHub(`Admin reset everything for user @${user.username}`);

  res.json({
    success: true,
    message: `Everything for @${user.username} (${user.managerName}) has been reset: squad emptied, bank £60.0m, chips and points reset to 0.`,
  });
});

// 12. Create / Join / Delete Mini-League
app.post('/api/league/create', (req: Request, res: Response) => {
  const { name, managerId } = req.body;
  const data = db.getData();

  const user = data.users?.[managerId];
  if (user && !isUserAdmin(user.username) && !user.isApproved) {
    return res.status(403).json({ error: 'Your account is pending approval by administrators.' });
  }

  const manager = data.managers[managerId];

  if (!manager) return res.status(404).json({ error: 'Manager not found' });

  const code = 'KCL-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  const calc = calculateGameweekSquadPoints(
    manager.squad.players,
    data.players,
    manager.squad.activeChip,
    manager.squad.transfersMadeThisGW,
    manager.squad.freeTransfers
  );
  const currentPts = calc.totalPoints || 0;

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
        totalPoints: currentPts,
        gwPoints: currentPts,
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

  const user = data.users?.[managerId];
  if (user && !isUserAdmin(user.username) && !user.isApproved) {
    return res.status(403).json({ error: 'Your account is pending approval by administrators.' });
  }

  const manager = data.managers[managerId];

  if (!manager) return res.status(404).json({ error: 'Manager not found' });

  const league = data.leagues.find((l) => l.code.toUpperCase() === code.trim().toUpperCase());
  if (!league) return res.status(404).json({ error: 'League code not found' });

  if (!league.members.some((m) => m.id === manager.id)) {
    const calc = calculateGameweekSquadPoints(
      manager.squad.players,
      data.players,
      manager.squad.activeChip,
      manager.squad.transfersMadeThisGW,
      manager.squad.freeTransfers
    );
    const currentPts = calc.totalPoints || 0;

    league.members.push({
      id: manager.id,
      managerName: manager.managerName,
      teamName: manager.teamName,
      totalPoints: currentPts,
      gwPoints: currentPts,
      rank: league.members.length + 1,
      previousRank: league.members.length + 1,
    });

    // Re-rank members by score
    league.members.sort((a, b) => b.totalPoints - a.totalPoints);
    league.members.forEach((m, idx) => {
      m.previousRank = m.rank;
      m.rank = idx + 1;
    });

    db.save();
  }

  res.json({ success: true, league });
});

app.post('/api/league/delete', (req: Request, res: Response) => {
  const { leagueId } = req.body;
  const data = db.getData();
  const idx = data.leagues.findIndex((l) => l.id === leagueId);
  if (idx === -1) return res.status(404).json({ error: 'League not found' });

  data.leagues.splice(idx, 1);
  db.save();
  res.json({ success: true, leagues: data.leagues });
});

// --- Deadline Management ---

// Get current deadline
app.get('/api/deadline', (req: Request, res: Response) => {
  const data = db.getData();
  res.json({ deadline: data.deadline || null });
});

// Set deadline
app.post('/api/admin/deadline', (req: Request, res: Response) => {
  const { gameweek, deadlineTime } = req.body;
  if (!gameweek || !deadlineTime) {
    return res.status(400).json({ error: 'gameweek and deadlineTime are required' });
  }
  const data = db.getData();
  data.deadline = { gameweek, deadlineTime };
  db.save();
  res.json({ success: true, deadline: data.deadline });
});

// Clear deadline
app.post('/api/admin/deadline/clear', (req: Request, res: Response) => {
  const data = db.getData();
  data.deadline = null;
  db.save();
  res.json({ success: true, deadline: null });
});

// --- Batch Match Events (for Match-Day Admin module) ---

app.post('/api/admin/match-events', (req: Request, res: Response) => {
  const {
    fixtureId,
    homeScore,
    awayScore,
    goalScorers,
    mvpPlayerIds,
    playerMinutes,
    yellowCards,
    redCards,
    penaltiesSaved,
    penaltiesMissed,
    venue,
  } = req.body;

  const data = db.getData();
  const fixture = data.fixtures.find((f: Fixture) => f.id === fixtureId);
  if (!fixture) return res.status(404).json({ error: 'Fixture not found' });

  const gw = fixture.gameweek;

  // Update fixture
  fixture.homeScore = homeScore;
  fixture.awayScore = awayScore;
  fixture.isFinished = true;
  fixture.isLive = false;
  fixture.venue = venue || 'parki';
  fixture.goalScorers = goalScorers || [];

  // Determine which players are on each team
  const homePlayers = Object.values(data.players).filter(
    (p: Player) => (p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId) === fixture.homeClubId
  );
  const awayPlayers = Object.values(data.players).filter(
    (p: Player) => (p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId) === fixture.awayClubId
  );
  const allMatchPlayers = [...homePlayers, ...awayPlayers];

  // Tally goals, assists, own goals per player from goalScorers array
  const goalCount: Record<string, number> = {};
  const assistCount: Record<string, number> = {};
  const ownGoalCount: Record<string, number> = {};

  (goalScorers || []).forEach((g: any) => {
    if (g.isOwnGoal) {
      ownGoalCount[g.playerId] = (ownGoalCount[g.playerId] || 0) + 1;
    } else {
      goalCount[g.playerId] = (goalCount[g.playerId] || 0) + 1;
    }
    if (g.assistPlayerId) {
      assistCount[g.assistPlayerId] = (assistCount[g.assistPlayerId] || 0) + 1;
    }
  });

  // Determine clean sheets from final score
  const homeCleanSheet = (awayScore || 0) === 0;
  const awayCleanSheet = (homeScore || 0) === 0;

  // Update each match player's stats
  for (const player of allMatchPlayers) {
    const mins = playerMinutes?.[player.id] || 0;
    if (mins === 0) continue; // Skip players who didn't participate

    const isHomeTeam = homePlayers.some((p: Player) => p.id === player.id);
    const hasCleanSheet = isHomeTeam ? homeCleanSheet : awayCleanSheet;

    const stats: PlayerStats = {
      minutes: mins,
      goals: goalCount[player.id] || 0,
      assists: assistCount[player.id] || 0,
      cleanSheet: hasCleanSheet && mins >= 20,
      yellowCards: (yellowCards || []).filter((id: string) => id === player.id).length,
      redCards: (redCards || []).filter((id: string) => id === player.id).length,
      penaltiesSaved: penaltiesSaved?.[player.id] || 0,
      penaltiesMissed: penaltiesMissed?.[player.id] || 0,
      ownGoals: ownGoalCount[player.id] || 0,
      isMVP: (mvpPlayerIds || []).includes(player.id),
    };

    player.gwStats[gw] = stats;

    const isOnePrice = venue === 'one_price';
    player.gwPoints = calculatePlayerPoints(player.position, stats, isOnePrice);

    // Recalculate total points across all GWs
    let sum = 0;
    for (const gwKey of Object.keys(player.gwStats)) {
      const gwNum = parseInt(gwKey, 10);
      // Determine if this GW's fixture was at One Price Stadium
      const gwFixture = data.fixtures.find((f: Fixture) => {
        const normClub = player.clubId === 'SCH' ? 'SCH_11_5' : player.clubId;
        return f.gameweek === gwNum && (f.homeClubId === normClub || f.awayClubId === normClub);
      });
      const gwIsOnePrice = gwFixture?.venue === 'one_price';
      sum += calculatePlayerPoints(player.position, player.gwStats[gwNum], gwIsOnePrice);
    }
    player.totalPoints = sum;
  }

  db.save();
  res.json({ success: true, fixture, players: data.players });
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

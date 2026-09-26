import { Position, SquadPlayer, Player } from '../types/fpl';

/**
 * The 5 permitted outfield formations (DEF-MID-FWD) for 6-a-side starting lineups.
 * Total outfield starters = 5 (+ 1 GK = 6 starters on pitch).
 */
export const VALID_FORMATIONS = [
  '1-2-2',
  '2-1-2',
  '2-2-1',
  '1-3-1',
  '3-1-1',
] as const;

export type ValidFormation = typeof VALID_FORMATIONS[number];

export function isValidFormation(defs: number, mids: number, fwds: number): boolean {
  const formStr = `${defs}-${mids}-${fwds}`;
  return VALID_FORMATIONS.includes(formStr as ValidFormation);
}

export interface PlayerPitchPosition {
  playerId: string;
  x: number; // Percentage 0 - 100
  y: number; // Percentage 0 - 100
  roleLabel: string;
}

export interface FormationLayout {
  formationString: string;
  isValid: boolean;
  gks: SquadPlayer[];
  defs: SquadPlayer[];
  mids: SquadPlayer[];
  fwds: SquadPlayer[];
  bench: SquadPlayer[];
  pitchPositions: PlayerPitchPosition[];
}

/**
 * Computes exact stadium pitch coordinates (x%, y%) and tactical role labels
 * based on formation structure so player cards smoothly animate to tactical positions.
 */
export function getFormationLayout(
  squadPlayers: SquadPlayer[],
  allPlayers: Record<string, Player>
): FormationLayout {
  const validPlayers = squadPlayers.filter((sp) => Boolean(allPlayers[sp.playerId]));
  const starters = validPlayers.filter((p) => p.isStarter);
  const bench = validPlayers
    .filter((p) => !p.isStarter)
    .sort((a, b) => a.benchOrder - b.benchOrder);

  const gks: SquadPlayer[] = [];
  const defs: SquadPlayer[] = [];
  const mids: SquadPlayer[] = [];
  const fwds: SquadPlayer[] = [];

  starters.forEach((sp) => {
    const player = allPlayers[sp.playerId];
    if (!player) return;
    if (player.position === 'GKP') gks.push(sp);
    else if (player.position === 'DEF') defs.push(sp);
    else if (player.position === 'MID') mids.push(sp);
    else if (player.position === 'FWD') fwds.push(sp);
  });

  const formationString = `${defs.length}-${mids.length}-${fwds.length}`;
  const isValid = gks.length === 1 && starters.length === 6 && isValidFormation(defs.length, mids.length, fwds.length);

  const pitchPositions: PlayerPitchPosition[] = [];

  // 1. Goalkeeper Row (y: 11% - goal line / six yard box)
  gks.forEach((sp, idx) => {
    const xs = gks.length === 1 ? [50] : [35, 65];
    pitchPositions.push({
      playerId: sp.playerId,
      x: xs[idx] ?? 50,
      y: 11,
      roleLabel: 'GK',
    });
  });

  // Helper to space players evenly in a row
  const getRowXs = (count: number): number[] => {
    if (count <= 1) return [50];
    if (count === 2) return [28, 72];
    if (count === 3) return [18, 50, 82];
    if (count === 4) return [14, 38, 62, 86];
    return [50];
  };

  // 2. Defenders Row (y: 32% - defensive third)
  const defXs = getRowXs(defs.length);
  defs.forEach((sp, idx) => {
    let roleLabel = 'DEF';
    if (defs.length === 1) roleLabel = 'CB';
    else if (defs.length === 2) roleLabel = idx === 0 ? 'LB' : 'RB';
    else if (defs.length === 3) roleLabel = idx === 0 ? 'LB' : idx === 1 ? 'CB' : 'RB';

    pitchPositions.push({
      playerId: sp.playerId,
      x: defXs[idx] ?? 50,
      y: 32,
      roleLabel,
    });
  });

  // 3. Midfielders Row (y: 54% - midfield / center circle)
  const midXs = getRowXs(mids.length);
  mids.forEach((sp, idx) => {
    let roleLabel = 'MID';
    if (mids.length === 1) roleLabel = 'CM';
    else if (mids.length === 2) roleLabel = idx === 0 ? 'LM' : 'RM';
    else if (mids.length === 3) roleLabel = idx === 0 ? 'LM' : idx === 1 ? 'CM' : 'RM';

    pitchPositions.push({
      playerId: sp.playerId,
      x: midXs[idx] ?? 50,
      y: 54,
      roleLabel,
    });
  });

  // 4. Forwards Row (y: 77% - attacking penalty arc)
  const fwdXs = fwds.length === 2 ? [30, 70] : getRowXs(fwds.length);
  fwds.forEach((sp, idx) => {
    let roleLabel = 'FWD';
    if (fwds.length === 1) roleLabel = 'ST';
    else if (fwds.length === 2) roleLabel = idx === 0 ? 'LF' : 'RF';

    pitchPositions.push({
      playerId: sp.playerId,
      x: fwdXs[idx] ?? 50,
      y: 77,
      roleLabel,
    });
  });

  return {
    formationString,
    isValid,
    gks,
    defs,
    mids,
    fwds,
    bench,
    pitchPositions,
  };
}

/**
 * Checks if swapping playerA and playerB will leave the starting lineup in one of the
 * 5 valid formations: 1-2-2, 2-1-2, 2-2-1, 1-3-1, 3-1-1.
 */
export function canSwapPlayers(
  playerAId: string,
  playerBId: string,
  squadPlayers: SquadPlayer[],
  allPlayers: Record<string, Player>
): { canSwap: boolean; reason?: string } {
  const spA = squadPlayers.find((p) => p.playerId === playerAId);
  const spB = squadPlayers.find((p) => p.playerId === playerBId);
  const pA = allPlayers[playerAId];
  const pB = allPlayers[playerBId];

  if (!spA || !spB || !pA || !pB) {
    return { canSwap: false, reason: 'Player not found in squad' };
  }

  // Goalkeeper rule: Exactly 1 GK in squad, always starts on pitch
  if (pA.position === 'GKP' || pB.position === 'GKP') {
    return { canSwap: false, reason: 'Goalkeeper must remain in goal' };
  }

  // Swapping two starters or two bench players preserves the exact formation
  if ((spA.isStarter && spB.isStarter) || (!spA.isStarter && !spB.isStarter)) {
    return { canSwap: true };
  }

  // One is a starter, one is on the bench: simulate substitution
  const starter = spA.isStarter ? spA : spB;
  const sub = spA.isStarter ? spB : spA;
  const pStarter = allPlayers[starter.playerId];
  const pSub = allPlayers[sub.playerId];

  if (!pStarter || !pSub) {
    return { canSwap: false, reason: 'Player position unknown' };
  }

  // If same position (e.g. DEF for DEF, MID for MID, FWD for FWD), formation doesn't change
  if (pStarter.position === pSub.position) {
    return { canSwap: true };
  }

  // Calculate current outfield starters
  let defCount = 0;
  let midCount = 0;
  let fwdCount = 0;

  squadPlayers.filter((p) => p.isStarter).forEach((sp) => {
    const pos = allPlayers[sp.playerId]?.position;
    if (pos === 'DEF') defCount++;
    else if (pos === 'MID') midCount++;
    else if (pos === 'FWD') fwdCount++;
  });

  // Apply simulated substitution
  const newDef = defCount - (pStarter.position === 'DEF' ? 1 : 0) + (pSub.position === 'DEF' ? 1 : 0);
  const newMid = midCount - (pStarter.position === 'MID' ? 1 : 0) + (pSub.position === 'MID' ? 1 : 0);
  const newFwd = fwdCount - (pStarter.position === 'FWD' ? 1 : 0) + (pSub.position === 'FWD' ? 1 : 0);

  if (!isValidFormation(newDef, newMid, newFwd)) {
    return {
      canSwap: false,
      reason: `Formation ${newDef}-${newMid}-${newFwd} is invalid. Permitted formations: 1-2-2, 2-1-2, 2-2-1, 1-3-1, 3-1-1`,
    };
  }

  return { canSwap: true };
}

/**
 * Normalizes a 9-player squad (1 GK, 3 DEF, 3 MID, 2 FWD) to guarantee exactly
 * 6 starters in one of the 5 valid formations and exactly 3 bench substitutes (benchOrder 1, 2, 3).
 */
export function normalizeSquadLineup(
  squadPlayers: SquadPlayer[],
  allPlayers: Record<string, Player>
): SquadPlayer[] {
  // Prune any players that no longer exist in the game database
  const validPlayers = squadPlayers.filter((sp) => Boolean(allPlayers[sp.playerId]));
  if (validPlayers.length !== squadPlayers.length) {
    squadPlayers = validPlayers;
  }

  // If squad does not have 9 players, ensure bench players aren't stranded if there are fewer than 6 starters
  if (squadPlayers.length !== 9) {
    const starters = squadPlayers.filter((p) => p.isStarter);
    if (starters.length < 6 && squadPlayers.length > starters.length) {
      let needed = Math.min(6 - starters.length, squadPlayers.length - starters.length);
      let subIdx = 1;
      return squadPlayers.map((sp) => {
        if (!sp.isStarter && needed > 0) {
          needed--;
          return { ...sp, isStarter: true, benchOrder: 0 };
        } else if (!sp.isStarter) {
          return { ...sp, benchOrder: subIdx++ };
        }
        return sp;
      });
    }
    return squadPlayers;
  }

  const starters = squadPlayers.filter((p) => p.isStarter);
  const bench = squadPlayers.filter((p) => !p.isStarter);

  let defCount = 0;
  let midCount = 0;
  let fwdCount = 0;
  let gkCount = 0;

  starters.forEach((sp) => {
    const pos = allPlayers[sp.playerId]?.position;
    if (pos === 'GKP') gkCount++;
    else if (pos === 'DEF') defCount++;
    else if (pos === 'MID') midCount++;
    else if (pos === 'FWD') fwdCount++;
  });

  // If already 6 starters with 1 GK and valid formation, just reindex bench and sanitize captaincy
  if (starters.length === 6 && gkCount === 1 && isValidFormation(defCount, midCount, fwdCount) && bench.length === 3) {
    let bIdx = 1;
    const reindexed = squadPlayers.map((sp) => {
      if (!sp.isStarter) {
        return { ...sp, benchOrder: bIdx++, isCaptain: false, isViceCaptain: false };
      }
      return { ...sp, benchOrder: 0 };
    });
    return sanitizeCaptaincy(reindexed);
  }

  // Otherwise, reset to default valid 2-2-1 lineup:
  // 1 GK, 2 DEF, 2 MID, 1 FWD start; 1 DEF, 1 MID, 1 FWD bench
  const gks = squadPlayers.filter((sp) => allPlayers[sp.playerId]?.position === 'GKP');
  const defs = squadPlayers.filter((sp) => allPlayers[sp.playerId]?.position === 'DEF');
  const mids = squadPlayers.filter((sp) => allPlayers[sp.playerId]?.position === 'MID');
  const fwds = squadPlayers.filter((sp) => allPlayers[sp.playerId]?.position === 'FWD');

  if (gks.length !== 1 || defs.length !== 3 || mids.length !== 3 || fwds.length !== 2) {
    return sanitizeCaptaincy(squadPlayers); // Not a complete 1-3-3-2 squad
  }

  const startingGk = { ...gks[0], isStarter: true, benchOrder: 0 };
  const startingDefs = [
    { ...defs[0], isStarter: true, benchOrder: 0 },
    { ...defs[1], isStarter: true, benchOrder: 0 },
  ];
  const benchDef = { ...defs[2], isStarter: false, benchOrder: 1, isCaptain: false, isViceCaptain: false };

  const startingMids = [
    { ...mids[0], isStarter: true, benchOrder: 0 },
    { ...mids[1], isStarter: true, benchOrder: 0 },
  ];
  const benchMid = { ...mids[2], isStarter: false, benchOrder: 2, isCaptain: false, isViceCaptain: false };

  const startingFwd = { ...fwds[0], isStarter: true, benchOrder: 0 };
  const benchFwd = { ...fwds[1], isStarter: false, benchOrder: 3, isCaptain: false, isViceCaptain: false };

  const fullLineup = [
    startingGk,
    startingDefs[0],
    startingDefs[1],
    startingMids[0],
    startingMids[1],
    startingFwd,
    benchDef,
    benchMid,
    benchFwd,
  ];

  return sanitizeCaptaincy(fullLineup);
}

/**
 * Enforces strict single-captain integrity:
 * - Exactly ONE starter has isCaptain: true
 * - Exactly ONE starter has isViceCaptain: true (and cannot be captain)
 * - Bench players NEVER have isCaptain or isViceCaptain
 */
export function sanitizeCaptaincy(squadPlayers: SquadPlayer[]): SquadPlayer[] {
  if (!squadPlayers || squadPlayers.length === 0) return squadPlayers;

  const starters = squadPlayers.filter((p) => p.isStarter);
  if (starters.length === 0) {
    return squadPlayers.map((p) => ({ ...p, isCaptain: false, isViceCaptain: false }));
  }

  // Find existing captain among starters (only the first one marked isCaptain)
  const existingCap = starters.find((p) => p.isCaptain);
  const capPlayerId = existingCap ? existingCap.playerId : starters[0].playerId;

  // Find existing vice-captain among remaining starters (cannot be captain)
  const remainingStarters = starters.filter((p) => p.playerId !== capPlayerId);
  const existingVice = remainingStarters.find((p) => p.isViceCaptain);
  const vicePlayerId = existingVice ? existingVice.playerId : (remainingStarters[0]?.playerId || '');

  return squadPlayers.map((p) => {
    if (!p.isStarter) {
      return { ...p, isCaptain: false, isViceCaptain: false };
    }
    const isCap = p.playerId === capPlayerId;
    const isVice = !isCap && p.playerId === vicePlayerId;
    return {
      ...p,
      isCaptain: isCap,
      isViceCaptain: isVice,
    };
  });
}

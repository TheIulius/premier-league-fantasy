import { Player, PlayerStats, Position, SquadPlayer, ChipType } from '../types/fpl';

/**
 * Calculates raw points for a player given their position and stats in a match/gameweek.
 * Follows official Premier League Fantasy scoring rules.
 */
export function calculatePlayerPoints(position: Position, stats?: Partial<PlayerStats>): number {
  if (!stats) return 0;

  let points = 0;
  const minutes = stats.minutes || 0;
  const goals = stats.goals || 0;
  const assists = stats.assists || 0;
  const goalsConceded = stats.goalsConceded || 0;
  const saves = stats.saves || 0;

  // 1. Minutes played
  if (minutes > 0 && minutes < 60) {
    points += 1;
  } else if (minutes >= 60) {
    points += 2;
  }

  // 2. Goals scored
  if (goals > 0) {
    if (position === 'GKP' || position === 'DEF') {
      points += goals * 6;
    } else if (position === 'MID') {
      points += goals * 5;
    } else if (position === 'FWD') {
      points += goals * 4;
    }
  }

  // 3. Assists
  points += assists * 3;

  // 4. Clean sheets (must play 60+ minutes)
  if (stats.cleanSheet && minutes >= 60) {
    if (position === 'GKP' || position === 'DEF') {
      points += 4;
    } else if (position === 'MID') {
      points += 1;
    }
  }

  // 5. Goals conceded (GKP & DEF: -1 for every 2 goals conceded)
  if ((position === 'GKP' || position === 'DEF') && goalsConceded >= 2) {
    points -= Math.floor(goalsConceded / 2);
  }

  // 6. Saves (GKP: 1 point for every 3 saves)
  if (position === 'GKP' && saves >= 3) {
    points += Math.floor(saves / 3);
  }

  // 7. Penalties saved / missed
  points += (stats.penaltiesSaved || 0) * 5;
  points -= (stats.penaltiesMissed || 0) * 2;

  // 8. Disciplinary cards
  points -= (stats.yellowCards || 0) * 1;
  points -= (stats.redCards || 0) * 3;

  // 9. Own goals
  points -= (stats.ownGoals || 0) * 2;

  // 10. Bonus points
  points += stats.bonus || 0;

  return points;
}

export interface GameweekCalculationResult {
  totalPoints: number;
  grossPoints: number;
  transferCost: number;
  effectiveCaptainId: string;
  isTripleCaptain: boolean;
  isBenchBoost: boolean;
  isValidSquadComposition: boolean;
  invalidSquadReason?: string;
  autoSubstitutions: {
    outPlayerId: string;
    inPlayerId: string;
  }[];
  playerPointsBreakdown: Record<string, {
    rawPoints: number;
    multiplier: number;
    finalPoints: number;
    isPlayed: boolean;
    isAutoSubIn: boolean;
    isAutoSubOut: boolean;
  }>;
}

export interface SquadCompositionValidation {
  isValid: boolean;
  gkCount: number;
  defCount: number;
  midCount: number;
  fwdCount: number;
  totalCount: number;
  clubCounts?: Record<string, number>;
  exceededClubs?: { clubId: string; count: number }[];
  message?: string;
}

/**
 * Validates that each fantasy team has:
 * - Exactly 1 Goalkeeper (GK)
 * - Exactly 3 Defenders (mcveli)
 * - Exactly 3 Midfielders
 * - Exactly 2 Forwards
 * - Maximum 2 players from the same class (e.g. 11/1, 9/2)
 * (Total: 9 players). A team cannot play without these exact rules.
 */
export function validateSquadComposition(
  squadPlayers: SquadPlayer[],
  allPlayers: Record<string, Player>
): SquadCompositionValidation {
  let gkCount = 0;
  let defCount = 0;
  let midCount = 0;
  let fwdCount = 0;
  const clubCounts: Record<string, number> = {};

  for (const sp of squadPlayers) {
    const p = allPlayers[sp.playerId];
    if (!p) continue;
    if (p.position === 'GKP') gkCount++;
    else if (p.position === 'DEF') defCount++;
    else if (p.position === 'MID') midCount++;
    else if (p.position === 'FWD') fwdCount++;

    const normClub = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
    clubCounts[normClub] = (clubCounts[normClub] || 0) + 1;
  }

  const exceededClubs: { clubId: string; count: number }[] = [];
  for (const [cId, count] of Object.entries(clubCounts)) {
    if (count > 2) {
      exceededClubs.push({ clubId: cId, count });
    }
  }

  const totalCount = gkCount + defCount + midCount + fwdCount;
  const isPosValid = gkCount === 1 && defCount === 3 && midCount === 3 && fwdCount === 2;
  const isClubValid = exceededClubs.length === 0;
  const isValid = isPosValid && isClubValid;

  let message: string | undefined;
  if (!isPosValid) {
    const parts: string[] = [];
    if (gkCount !== 1) parts.push(`${gkCount}/1 GK`);
    if (defCount !== 3) parts.push(`${defCount}/3 Defenders (mcveli)`);
    if (midCount !== 3) parts.push(`${midCount}/3 Midfielders`);
    if (fwdCount !== 2) parts.push(`${fwdCount}/2 Forwards`);
    message = `Required: 1 GK, 3 Defenders (mcveli), 3 Midfielders, 2 Forwards. Current: ${parts.join(', ')}`;
  } else if (!isClubValid) {
    const clubNames = exceededClubs
      .map((ec) => `${ec.clubId.replace('SCH_', '')} (${ec.count}/2)`)
      .join(', ');
    message = `Class limit exceeded: Max 2 players allowed from the same class. Violating: ${clubNames}`;
  }

  return {
    isValid,
    gkCount,
    defCount,
    midCount,
    fwdCount,
    totalCount,
    clubCounts,
    exceededClubs,
    message,
  };
}

/**
 * Validates whether a set of players forms a legitimate 6-a-side starting lineup:
 * Exactly 1 GKP, 1-3 DEF, 1-3 MID, 1-2 FWD (Total 6 starters).
 */
export function isValidStartingXI(positions: (Position | undefined)[]): boolean {
  const cleanPos = positions.filter((p): p is Position => !!p);
  const gkCount = cleanPos.filter((p) => p === 'GKP').length;
  const defCount = cleanPos.filter((p) => p === 'DEF').length;
  const midCount = cleanPos.filter((p) => p === 'MID').length;
  const fwdCount = cleanPos.filter((p) => p === 'FWD').length;

  if (cleanPos.length === 6) {
    if (gkCount !== 1) return false;
    const formStr = `${defCount}-${midCount}-${fwdCount}`;
    return ['1-2-2', '2-1-2', '2-2-1', '1-3-1', '3-1-1'].includes(formStr);
  }

  return false;
}

/**
 * Full gameweek score calculator for a user's squad:
 * - Validates squad has exact 1 GK, 3 DEF, 3 MID, 2 FWD (cannot play otherwise)
 * - Computes raw points for each player
 * - Applies auto-subs for 0-minute starters using bench order
 * - Applies captain (2x / 3x) and vice-captain failover
 * - Applies bench boost if active
 * - Deducts transfer penalty (-4 pts per extra transfer)
 */
export function calculateGameweekSquadPoints(
  squadPlayers: SquadPlayer[],
  allPlayers: Record<string, Player>,
  currentGW: number,
  activeChip: ChipType | null,
  transfersMadeThisGW: number,
  freeTransfers: number
): GameweekCalculationResult {
  const compValidation = validateSquadComposition(squadPlayers, allPlayers);

  // If squad does not meet the exact 1 GK, 3 DEF, 3 MID, 2 FWD requirements, they cannot play (0 points)
  if (!compValidation.isValid) {
    const emptyBreakdown: Record<string, any> = {};
    squadPlayers.forEach((sp) => {
      emptyBreakdown[sp.playerId] = {
        rawPoints: 0,
        multiplier: 0,
        finalPoints: 0,
        isPlayed: false,
        isAutoSubIn: false,
        isAutoSubOut: false,
      };
    });

    return {
      totalPoints: 0,
      grossPoints: 0,
      transferCost: 0,
      effectiveCaptainId: '',
      isTripleCaptain: false,
      isBenchBoost: false,
      isValidSquadComposition: false,
      invalidSquadReason: compValidation.message,
      autoSubstitutions: [],
      playerPointsBreakdown: emptyBreakdown,
    };
  }

  const isTripleCaptain = activeChip === 'triple_captain';
  const isBenchBoost = activeChip === 'bench_boost';
  const isFreeHit = activeChip === 'free_hit';

  // Calculate raw points for all 9 players
  const rawPointsMap: Record<string, number> = {};
  const minutesMap: Record<string, number> = {};

  squadPlayers.forEach((sp) => {
    const player = allPlayers[sp.playerId];
    if (player) {
      const stats = player.gwStats[currentGW];
      rawPointsMap[sp.playerId] = calculatePlayerPoints(player.position, stats);
      minutesMap[sp.playerId] = stats?.minutes || 0;
    } else {
      rawPointsMap[sp.playerId] = 0;
      minutesMap[sp.playerId] = 0;
    }
  });

  // Identify starters and bench
  const starters = squadPlayers.filter((p) => p.isStarter);
  const bench = squadPlayers
    .filter((p) => !p.isStarter)
    .sort((a, b) => a.benchOrder - b.benchOrder);

  // Auto-substitutions
  const autoSubstitutions: { outPlayerId: string; inPlayerId: string }[] = [];
  const currentStartingPlayers = [...starters];
  const usedBenchPlayerIds = new Set<string>();

  // 1. Goalkeeper auto-sub
  const starterGK = currentStartingPlayers.find(
    (sp) => allPlayers[sp.playerId]?.position === 'GKP'
  );
  if (starterGK && minutesMap[starterGK.playerId] === 0) {
    const benchGK = bench.find(
      (bp) => allPlayers[bp.playerId]?.position === 'GKP' && minutesMap[bp.playerId] > 0
    );
    if (benchGK) {
      const idx = currentStartingPlayers.findIndex((p) => p.playerId === starterGK.playerId);
      if (idx !== -1) {
        currentStartingPlayers[idx] = benchGK;
        usedBenchPlayerIds.add(benchGK.playerId);
        autoSubstitutions.push({
          outPlayerId: starterGK.playerId,
          inPlayerId: benchGK.playerId,
        });
      }
    }
  }

  // 2. Outfield auto-subs
  // Iterate through non-GK starters with 0 minutes
  for (let i = 0; i < currentStartingPlayers.length; i++) {
    const sp = currentStartingPlayers[i];
    const player = allPlayers[sp.playerId];
    if (player?.position !== 'GKP' && minutesMap[sp.playerId] === 0) {
      // Find candidate from bench (bench order 2, 3, 4 which are outfield bench 1, 2, 3)
      for (const bp of bench) {
        const benchPlayer = allPlayers[bp.playerId];
        if (
          benchPlayer &&
          benchPlayer.position !== 'GKP' &&
          !usedBenchPlayerIds.has(bp.playerId) &&
          minutesMap[bp.playerId] > 0
        ) {
          // Check if swapping yields a valid starting formation
          const candidateStarting = [...currentStartingPlayers];
          candidateStarting[i] = bp;
          const candidatePositions = candidateStarting.map(
            (p) => allPlayers[p.playerId]?.position
          );

          if (isValidStartingXI(candidatePositions)) {
            currentStartingPlayers[i] = bp;
            usedBenchPlayerIds.add(bp.playerId);
            autoSubstitutions.push({
              outPlayerId: sp.playerId,
              inPlayerId: bp.playerId,
            });
            break;
          }
        }
      }
    }
  }

  // Captaincy logic
  const captain = squadPlayers.find((p) => p.isCaptain);
  const viceCaptain = squadPlayers.find((p) => p.isViceCaptain);

  let effectiveCaptainId = captain ? captain.playerId : '';
  // If Captain played 0 mins, fallback to Vice-Captain
  if (captain && minutesMap[captain.playerId] === 0 && viceCaptain && minutesMap[viceCaptain.playerId] > 0) {
    effectiveCaptainId = viceCaptain.playerId;
  }

  const captainMultiplier = isTripleCaptain ? 3 : 2;

  // Compute final points
  const activePlayingIds = new Set(currentStartingPlayers.map((p) => p.playerId));
  if (isBenchBoost) {
    // With Bench Boost, bench players also score!
    bench.forEach((bp) => activePlayingIds.add(bp.playerId));
  }

  const playerPointsBreakdown: Record<string, any> = {};
  let grossPoints = 0;

  squadPlayers.forEach((sp) => {
    const raw = rawPointsMap[sp.playerId] || 0;
    const isStarter = activePlayingIds.has(sp.playerId);
    const isCap = sp.playerId === effectiveCaptainId;
    const multiplier = isCap ? captainMultiplier : isStarter ? 1 : 0;
    const finalPoints = raw * multiplier;

    if (multiplier > 0) {
      grossPoints += finalPoints;
    }

    const autoSubIn = autoSubstitutions.some((sub) => sub.inPlayerId === sp.playerId);
    const autoSubOut = autoSubstitutions.some((sub) => sub.outPlayerId === sp.playerId);

    playerPointsBreakdown[sp.playerId] = {
      rawPoints: raw,
      multiplier,
      finalPoints,
      isPlayed: minutesMap[sp.playerId] > 0,
      isAutoSubIn: autoSubIn,
      isAutoSubOut: autoSubOut,
    };
  });

  // Transfer cost penalty
  let transferCost = 0;
  if (!isFreeHit && transfersMadeThisGW > freeTransfers) {
    transferCost = (transfersMadeThisGW - freeTransfers) * 4;
  }

  const totalPoints = Math.max(0, grossPoints - transferCost);

  return {
    totalPoints,
    grossPoints,
    transferCost,
    effectiveCaptainId,
    isTripleCaptain,
    isBenchBoost,
    isValidSquadComposition: true,
    autoSubstitutions,
    playerPointsBreakdown,
  };
}

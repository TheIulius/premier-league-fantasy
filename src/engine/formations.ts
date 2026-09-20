import { Position, SquadPlayer, Player } from '../types/fpl';
import { isValidStartingXI } from './scoring';

export interface FormationLayout {
  formationString: string; // e.g. "3-4-3"
  gks: SquadPlayer[];
  defs: SquadPlayer[];
  mids: SquadPlayer[];
  fwds: SquadPlayer[];
  bench: SquadPlayer[];
}

export function getFormationLayout(
  squadPlayers: SquadPlayer[],
  allPlayers: Record<string, Player>
): FormationLayout {
  const starters = squadPlayers.filter((p) => p.isStarter);
  const bench = squadPlayers
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

  return {
    formationString,
    gks,
    defs,
    mids,
    fwds,
    bench,
  };
}

/**
 * Checks if swapping playerA and playerB will leave the starting XI in a valid state.
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
    return { canSwap: false, reason: 'Player not found' };
  }

  // If one is GKP, the other MUST also be GKP
  if ((pA.position === 'GKP' || pB.position === 'GKP') && pA.position !== pB.position) {
    return { canSwap: false, reason: 'Goalkeepers can only be swapped with Goalkeepers' };
  }

  // If both are starters or both are bench, order/positions don't invalidate XI formation
  if ((spA.isStarter && spB.isStarter) || (!spA.isStarter && !spB.isStarter)) {
    return { canSwap: true };
  }

  // One is starter, one is bench: simulate swap
  const starter = spA.isStarter ? spA : spB;
  const sub = spA.isStarter ? spB : spA;

  const currentStarterPositions = squadPlayers
    .filter((p) => p.isStarter)
    .map((p) => (p.playerId === starter.playerId ? allPlayers[sub.playerId]?.position : allPlayers[p.playerId]?.position))
    .filter((pos): pos is Position => !!pos);

  if (!isValidStartingXI(currentStarterPositions)) {
    return {
      canSwap: false,
      reason: 'This substitution violates formation rules (min 3 DEF, 2 MID, 1 FWD)',
    };
  }

  return { canSwap: true };
}

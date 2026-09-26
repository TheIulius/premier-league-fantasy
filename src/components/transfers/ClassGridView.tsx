import React, { useState, useMemo } from 'react';
import { Player, Position, Club, Squad } from '../../types/fpl';
import { CLUBS } from '../../data/clubs';
import { useFPL } from '../../context/FPLContext';
import { KitJersey } from '../pitch/KitJersey';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Check,
  X,
  Clock,
  Activity,
} from 'lucide-react';

export interface ClassGridViewProps {
  players: Record<string, Player>;
  clubs: Record<string, Club>;
  squad: Squad;
  outPlayer: Player | null;
  inPlayerId: string | null;
  onSelectInPlayer: (playerId: string | null) => void;
  onBuyPlayer: (playerId: string) => void;
  isSquadLocked: boolean;
  validSquadCount: number;
  searchQuery?: string;
  positionFilter?: Position | 'ALL';
  affordableOnly?: boolean;
}

export type ClassCalendarViewProps = ClassGridViewProps;

const POSITIONS: Position[] = ['GKP', 'DEF', 'MID', 'FWD'];

export const ClassGridView: React.FC<ClassGridViewProps> = ({
  players,
  clubs,
  squad,
  outPlayer,
  inPlayerId,
  onSelectInPlayer,
  onBuyPlayer,
  isSquadLocked,
  validSquadCount,
  searchQuery = '',
  positionFilter = 'ALL',
}) => {
  const { fixtures, currentGW } = useFPL();

  const [activeGrade, setActiveGrade] = useState<number>(10);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  // Detailed Player Modal State (Last Matches & Upcoming Matches)
  const [detailPlayerId, setDetailPlayerId] = useState<string | null>(null);

  const squadPlayerIds = useMemo(() => new Set(squad.players.map((p) => p.playerId)), [squad.players]);

  // Group players by normalized club ID
  const classPlayersMap = useMemo(() => {
    const map: Record<string, Player[]> = {};
    Object.values(players).forEach((p) => {
      const normClub = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
      if (!map[normClub]) map[normClub] = [];
      map[normClub].push(p);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => b.cost - a.cost));
    return map;
  }, [players]);

  const getGradeClasses = (grade: number): Club[] => {
    return [1, 2, 3, 4, 5, 6, 7]
      .map((classNum) => {
        const id = `SCH_${grade}_${classNum}`;
        return (
          clubs[id] ||
          CLUBS[id] || {
            id,
            name: `Team ${grade}/${classNum}`,
            shortName: `${grade}/${classNum}`,
            primaryColor: '#0284c7',
            secondaryColor: '#ffffff',
            textColor: '#ffffff',
          }
        );
      })
      .filter((c) => (classPlayersMap[c.id]?.length || 0) > 0);
  };

  // Only grades with active teams that have players
  const grades = useMemo(() => {
    return [9, 10, 11, 12].filter((g) => getGradeClasses(g).length > 0);
  }, [classPlayersMap, clubs]);

  // Auto-switch to first active grade if current selected grade has 0 teams
  React.useEffect(() => {
    if (grades.length > 0 && !grades.includes(activeGrade)) {
      setActiveGrade(grades[0]);
    }
  }, [grades, activeGrade]);

  const maxAvailableSpend = outPlayer ? squad.bank + outPlayer.cost : squad.bank;
  const detailPlayer = detailPlayerId ? players[detailPlayerId] : null;

  // Compute last matches and upcoming matches for detailPlayer
  const playerFixturesData = useMemo(() => {
    if (!detailPlayer) return { pastMatches: [], upcomingMatches: [] };
    const normClubId = detailPlayer.clubId === 'SCH' ? 'SCH_11_5' : detailPlayer.clubId;

    const teamFixtures = fixtures.filter(
      (f) => f.homeClubId === normClubId || f.awayClubId === normClubId
    );

    const pastMatches = teamFixtures
      .filter((f) => f.isFinished || f.gameweek < currentGW || Boolean(detailPlayer.gwStats?.[f.gameweek]))
      .sort((a, b) => b.gameweek - a.gameweek);

    const upcomingMatches = teamFixtures
      .filter((f) => !f.isFinished && f.gameweek >= currentGW)
      .sort((a, b) => a.gameweek - b.gameweek);

    return { pastMatches, upcomingMatches };
  }, [detailPlayer, fixtures, currentGW]);

  const getGradeTitle = (g: number) => `${g}TH GRADE`;

  // ============================================================================
  // PLAYER DETAIL MODAL (Last Matches, Upcoming Matches, Season Breakdown)
  // ============================================================================
  const renderPlayerDetailModal = () => {
    if (!detailPlayer) return null;
    const normClubId = detailPlayer.clubId === 'SCH' ? 'SCH_11_5' : detailPlayer.clubId;
    const playerClub = clubs[normClubId] || CLUBS[normClubId];
    const isOwned = squadPlayerIds.has(detailPlayer.id);
    const ownedInClass = squad.players.filter((sp) => {
      if (outPlayer && sp.playerId === outPlayer.id) return false;
      const p = players[sp.playerId];
      return p && (p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId) === normClubId;
    }).length;
    const isClassLimitReached = ownedInClass >= 2;
    const isAffordable = detailPlayer.cost <= maxAvailableSpend;
    const isSelectedInPlayer = inPlayerId === detailPlayer.id;
    const isIllegal = (!isOwned && isClassLimitReached) || !isAffordable;

    let totalGoals = 0;
    let totalAssists = 0;
    let totalCS = 0;
    let totalSaves = 0;
    let totalMVP = 0;
    Object.values(detailPlayer.gwStats || {}).forEach((st) => {
      totalGoals += st.goals || 0;
      totalAssists += st.assists || 0;
      if (st.cleanSheet) totalCS += 1;
      totalSaves += (st.saves || 0) + (st.penaltiesSaved || 0);
      if (st.isMVP) totalMVP += 1;
    });

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={() => setDetailPlayerId(null)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden text-slate-900 dark:text-white"
        >
          {/* Modal Top Header */}
          <div className="relative p-3.5 sm:p-5 bg-slate-100 dark:bg-zinc-950 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KitJersey clubId={detailPlayer.clubId} position={detailPlayer.position} className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {detailPlayer.position}
                  </span>
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                    Class {playerClub?.shortName || normClubId.replace('SCH_', '').replace('_', '/')}
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-black tracking-tight mt-0.5">
                  {detailPlayer.name}
                </h3>
                <div className="flex items-center gap-2.5 text-xs font-mono mt-0.5">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    £{detailPlayer.cost.toFixed(1)}m
                  </span>
                  <span>•</span>
                  <span className="font-bold text-amber-500">
                    {detailPlayer.totalPoints} Pts
                  </span>
                  <span>•</span>
                  <span className="text-slate-400">
                    Form: {detailPlayer.form}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setDetailPlayerId(null)}
              className="p-2 rounded-full bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-3.5 sm:p-5 space-y-3.5 max-h-[65vh] overflow-y-auto">
            {/* Quick Season Totals */}
            <div className="grid grid-cols-5 gap-1.5 text-center">
              <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Goals</span>
                <span className="text-xs sm:text-sm font-mono font-black">{totalGoals}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Assists</span>
                <span className="text-xs sm:text-sm font-mono font-black">{totalAssists}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Clean Sh.</span>
                <span className="text-xs sm:text-sm font-mono font-black">{totalCS}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Saves</span>
                <span className="text-xs sm:text-sm font-mono font-black">{totalSaves}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">MVP</span>
                <span className="text-xs sm:text-sm font-mono font-black text-amber-500">{totalMVP}</span>
              </div>
            </div>

            {/* Last Matches Section */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>Last Matches</span>
              </h4>

              {playerFixturesData.pastMatches.length > 0 || Object.keys(detailPlayer.gwStats || {}).length > 0 ? (
                <div className="space-y-1.5">
                  {Object.entries(detailPlayer.gwStats || {})
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([gwStr, st]) => {
                      const gw = Number(gwStr);
                      const fix = fixtures.find(
                        (f) => f.gameweek === gw && (f.homeClubId === normClubId || f.awayClubId === normClubId)
                      );
                      const isHome = fix ? fix.homeClubId === normClubId : true;
                      const oppId = fix ? (isHome ? fix.awayClubId : fix.homeClubId) : null;
                      const oppClub = oppId ? clubs[oppId] || CLUBS[oppId] : null;

                      return (
                        <div
                          key={`gw-stat-${gw}`}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-mono font-bold text-[10px]">
                              GW {gw}
                            </span>
                            <span className="font-bold">
                              {oppClub ? `vs ${oppClub.shortName} (${isHome ? 'H' : 'A'})` : `GW ${gw}`}
                            </span>
                            {fix && fix.homeScore !== null && fix.awayScore !== null && (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20 text-slate-300">
                                {fix.homeScore} - {fix.awayScore}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 font-mono text-[10px]">
                            {st.goals > 0 && <span className="text-emerald-500 font-bold">⚽{st.goals}</span>}
                            {st.assists > 0 && <span className="text-sky-400 font-bold">🅰️{st.assists}</span>}
                            {st.cleanSheet && <span className="text-teal-400 font-bold">🛡️CS</span>}
                            {st.isMVP && <span className="text-amber-400 font-bold">⭐</span>}
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-black">
                              {detailPlayer.gwPoints}pt
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  {playerFixturesData.pastMatches
                    .filter((f) => !detailPlayer.gwStats?.[f.gameweek])
                    .map((fix) => {
                      const isHome = fix.homeClubId === normClubId;
                      const oppId = isHome ? fix.awayClubId : fix.homeClubId;
                      const oppClub = clubs[oppId] || CLUBS[oppId];
                      return (
                        <div
                          key={fix.id}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-mono font-bold text-[10px]">
                              GW {fix.gameweek}
                            </span>
                            <span className="font-bold">
                              vs {oppClub?.shortName || oppId} ({isHome ? 'H' : 'A'})
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-400">
                            {fix.homeScore ?? 0} - {fix.awayScore ?? 0}
                          </span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 text-center text-[11px] text-slate-400">
                  No past match logs recorded yet for Class {playerClub?.shortName}.
                </div>
              )}
            </div>

            {/* Upcoming Matches Section */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Upcoming Matches</span>
              </h4>

              {playerFixturesData.upcomingMatches.length > 0 ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {playerFixturesData.upcomingMatches.map((fix) => {
                    const isHome = fix.homeClubId === normClubId;
                    const oppId = isHome ? fix.awayClubId : fix.homeClubId;
                    const oppClub = clubs[oppId] || CLUBS[oppId];
                    return (
                      <div
                        key={fix.id}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 font-mono font-bold text-[10px]">
                            GW{fix.gameweek}
                          </span>
                          <span className="font-bold truncate">
                            vs {oppClub?.shortName || oppId}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-white/10 text-slate-400">
                          {isHome ? 'H' : 'A'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 text-center text-[11px] text-slate-400">
                  Upcoming fixtures will appear once scheduled.
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Action */}
          <div className="p-3.5 bg-slate-100 dark:bg-zinc-950 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2.5">
            <button
              onClick={() => setDetailPlayerId(null)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 transition-colors"
            >
              Close
            </button>

            {isOwned ? (
              <span className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> In Squad
              </span>
            ) : outPlayer ? (
              <button
                onClick={() => {
                  if (isIllegal) return;
                  onSelectInPlayer(isSelectedInPlayer ? null : detailPlayer.id);
                  setDetailPlayerId(null);
                }}
                disabled={isIllegal || isSquadLocked}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  isIllegal
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                }`}
              >
                {isSelectedInPlayer ? 'Selected' : `Replace ${outPlayer.webName} (£${detailPlayer.cost.toFixed(1)}m)`}
              </button>
            ) : (
              <button
                onClick={() => {
                  onBuyPlayer(detailPlayer.id);
                  setDetailPlayerId(null);
                }}
                disabled={isIllegal || isSquadLocked || validSquadCount >= 9}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                  validSquadCount >= 9 || isIllegal
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buy (£{detailPlayer.cost.toFixed(1)}m)</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // ============================================================================
  // ZOOMED-IN SINGLE CLASS (e.g. 10/1)
  // 4-column grid style (GKP | DEF | MID | FWD) with full details
  // ============================================================================
  if (activeClassId) {
    const classClub =
      clubs[activeClassId] ||
      CLUBS[activeClassId] || {
        id: activeClassId,
        name: `Team ${activeClassId.replace('SCH_', '').replace('_', '/')}`,
        shortName: activeClassId.replace('SCH_', '').replace('_', '/'),
        primaryColor: '#0284c7',
        secondaryColor: '#ffffff',
        textColor: '#ffffff',
      };

    const allClassPlayers = classPlayersMap[activeClassId] || [];
    const ownedInClass = squad.players.filter((sp) => {
      if (outPlayer && sp.playerId === outPlayer.id) return false;
      const p = players[sp.playerId];
      return p && (p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId) === activeClassId;
    }).length;
    const isClassLimitReached = ownedInClass >= 2;

    return (
      <div className="space-y-2.5 py-1">
        {renderPlayerDetailModal()}

        {/* Compact Class Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-300 dark:border-white/15 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveClassId(null)}
              className="px-2.5 py-1 rounded-xl bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-[11px] font-black flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{activeGrade}th Grade</span>
            </button>

            <div className="flex items-baseline gap-1.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {classClub.shortName}
              </h2>
              <span className="text-[10px] font-mono text-slate-400">
                ({allClassPlayers.length}p)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black border ${
                isClassLimitReached
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
              }`}
            >
              {ownedInClass}/2
            </span>
          </div>
        </div>

        {/* 4-Column Position Grid (GKP | DEF | MID | FWD) with vertical lines */}
        <div className="grid grid-cols-4 divide-x divide-slate-300 dark:divide-white/20">
          {POSITIONS.map((pos) => {
            const posPlayers = allClassPlayers.filter((p) => p.position === pos);

            return (
              <div key={pos} className="px-1 sm:px-2.5 flex flex-col items-center">
                {/* Column Header: GKP | DEF | MID | FWD */}
                <div className="w-full text-center pb-1 mb-2 border-b border-slate-200 dark:border-white/10">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {pos}
                  </span>
                </div>

                {/* Players Stacked Vertically in Column (Squished & Compact) */}
                <div className="w-full flex flex-col items-center gap-1.5 sm:gap-2">
                  {posPlayers.length > 0 ? (
                    posPlayers.map((p) => {
                      const isOwned = squadPlayerIds.has(p.id);
                      const isAffordable = p.cost <= maxAvailableSpend;
                      const isSelectedInPlayer = inPlayerId === p.id;
                      const isIllegal = (!isOwned && isClassLimitReached) || !isAffordable;

                      return (
                        <div
                          key={p.id}
                          onClick={() => setDetailPlayerId(p.id)}
                          className={`w-full p-1 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center group ${
                            isSelectedInPlayer
                              ? 'bg-emerald-500/20 border-emerald-500 shadow-xs'
                              : isOwned
                              ? 'bg-emerald-500/10 border-emerald-500/40'
                              : isIllegal
                              ? 'bg-slate-100/50 dark:bg-white/[0.02] border-transparent opacity-45'
                              : 'bg-white dark:bg-white/[0.04] border-slate-200/80 dark:border-white/10 hover:border-emerald-500'
                          }`}
                        >
                          {/* Jersey */}
                          <div className="relative">
                            <KitJersey
                              clubId={p.clubId}
                              position={p.position}
                              className="w-7 h-7 sm:w-10 sm:h-10 transition-transform group-hover:scale-105"
                            />
                            {isOwned && (
                              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[8px] font-black">
                                ✓
                              </span>
                            )}
                          </div>

                          {/* Player Name */}
                          <span className="text-[9.5px] sm:text-xs font-extrabold text-slate-900 dark:text-white leading-tight truncate w-full mt-0.5">
                            {p.webName}
                          </span>

                          {/* Price & Points */}
                          <div className="flex items-center justify-center gap-1 font-mono text-[8.5px] sm:text-[10px] leading-tight">
                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                              £{p.cost.toFixed(1)}m
                            </span>
                            <span className="text-amber-500 font-bold">
                              {p.totalPoints}p
                            </span>
                          </div>

                          {/* Action Button */}
                          <div className="w-full mt-1" onClick={(e) => e.stopPropagation()}>
                            {isOwned ? (
                              <span className="block py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[8px] font-black uppercase">
                                Owned
                              </span>
                            ) : outPlayer ? (
                              <button
                                onClick={() => {
                                  if (isIllegal) return;
                                  onSelectInPlayer(isSelectedInPlayer ? null : p.id);
                                }}
                                disabled={isIllegal || isSquadLocked}
                                className={`w-full py-0.5 rounded text-[8.5px] sm:text-[10px] font-black uppercase transition-all ${
                                  isSelectedInPlayer
                                    ? 'bg-emerald-500 text-slate-950'
                                    : isIllegal
                                    ? 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                                    : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-slate-950 border border-emerald-500/30'
                                }`}
                              >
                                {isSelectedInPlayer ? 'Pick' : 'Swap'}
                              </button>
                            ) : (
                              <button
                                onClick={() => onBuyPlayer(p.id)}
                                disabled={isIllegal || isSquadLocked || validSquadCount >= 9}
                                className={`w-full py-0.5 rounded text-[8.5px] sm:text-[10px] font-black uppercase transition-all flex items-center justify-center gap-0.5 ${
                                  validSquadCount >= 9 || isIllegal
                                    ? 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                                }`}
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>Buy</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-[9px] text-slate-400 italic py-2">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================================================
  // LEVEL 2 (DEFAULT): GRADE ROSTER CALENDAR (Matches 10TH GRADE Photo 1:1)
  // Squished 2-column grid on mobile (grid-cols-2 sm:grid-cols-3) so all 7 classes
  // fit compactly without long scrolling!
  // ============================================================================
  const gradeClasses = getGradeClasses(activeGrade);

  return (
    <div className="relative space-y-2.5 py-1">
      {renderPlayerDetailModal()}

      {/* Watermark Crest in Top Right */}
      <div className="pointer-events-none absolute top-0 right-1 opacity-[0.06] dark:opacity-[0.08] select-none">
        <img src="/kcl-logo-transparent.png" alt="" className="w-24 h-24 sm:w-36 sm:h-36 object-contain" />
      </div>

      {/* Compact Top Grade Header & Switcher */}
      <div className="relative z-10 flex items-center justify-between flex-wrap gap-2 border-b border-slate-300 dark:border-white/15 pb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            {getGradeTitle(activeGrade)}
          </h1>
        </div>

        <div className="flex items-center gap-1">
          {grades.map((g) => (
            <button
              key={g}
              onClick={() => {
                setActiveGrade(g);
                setActiveClassId(null);
              }}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg text-xs font-black uppercase transition-all ${
                activeGrade === g
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {g}th
            </button>
          ))}
        </div>
      </div>

      {/* Squished 2-Column Mobile / 3-Column Tablet & Desktop Grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        {gradeClasses.map((club) => {
          const classPlayers = classPlayersMap[club.id] || [];
          const ownedInClass = squad.players.filter((sp) => {
            const p = players[sp.playerId];
            return p && (p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId) === club.id;
          }).length;

          return (
            <div
              key={club.id}
              onClick={() => setActiveClassId(club.id)}
              className="group p-2 sm:p-2.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.05] border border-slate-200/70 dark:border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer"
            >
              {/* Class Title Header (e.g. 10/1) */}
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors leading-none">
                  {club.shortName}
                </h3>
                <span className="text-[8.5px] sm:text-[10px] font-mono font-bold text-slate-400 group-hover:text-emerald-400">
                  {ownedInClass > 0 ? `${ownedInClass}/2` : `${classPlayers.length}p`}
                </span>
              </div>

              {/* 4 Columns: GKP | DEF | MID | FWD separated by thin vertical lines */}
              <div className="grid grid-cols-4 divide-x divide-slate-300 dark:divide-white/20">
                {POSITIONS.map((pos) => {
                  const posPlayers = classPlayers.filter((p) => p.position === pos);

                  return (
                    <div key={pos} className="px-0.5 flex flex-col items-center min-h-[76px] sm:min-h-[95px]">
                      {/* Position Column Header */}
                      <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-tighter text-slate-600 dark:text-slate-400 mb-1">
                        {pos}
                      </span>

                      {/* Tight Vertical Stack of Player Jerseys */}
                      <div className="flex flex-col items-center gap-0.5 sm:gap-1 w-full">
                        {posPlayers.map((p) => {
                          const isOwned = squadPlayerIds.has(p.id);
                          const matchesSearch = searchQuery.trim()
                            ? p.webName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                              p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
                            : true;
                          const matchesPos = positionFilter === 'ALL' || p.position === positionFilter;
                          const isDimmed = !matchesSearch || !matchesPos;

                          return (
                            <div
                              key={p.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailPlayerId(p.id);
                              }}
                              title={`${p.name} (${p.position}) - £${p.cost.toFixed(1)}m`}
                              className={`relative flex flex-col items-center transition-transform hover:scale-110 ${
                                isDimmed ? 'opacity-20 grayscale' : ''
                              }`}
                            >
                              <div className="relative">
                                <KitJersey
                                  clubId={p.clubId}
                                  position={p.position}
                                  className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-xs"
                                />
                                {isOwned && (
                                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[6px] font-black">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <span className="text-[7px] sm:text-[8px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[36px] sm:max-w-[46px] leading-none">
                                {p.webName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ClassCalendarView = ClassGridView;
export default ClassGridView;

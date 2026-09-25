import React, { useState, useMemo } from 'react';
import { Player, Position, Club, Squad } from '../../types/fpl';
import { CLUBS } from '../../data/clubs';
import { useFPL } from '../../context/FPLContext';
import { KitJersey } from '../pitch/KitJersey';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Plus,
  Check,
  Calendar,
  X,
  Trophy,
  Clock,
  Activity,
  Sparkles,
  Info,
} from 'lucide-react';

interface ClassCalendarViewProps {
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

export type CalendarZoomLevel = 'years' | 'months' | 'class';

const POSITIONS: Position[] = ['GKP', 'DEF', 'MID', 'FWD'];

export const ClassCalendarView: React.FC<ClassCalendarViewProps> = ({
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
  affordableOnly = false,
}) => {
  const { fixtures, currentGW } = useFPL();

  // Zoom state: 'years' (All Grades 9-12) | 'months' (Grade Roster Calendar like 10TH GRADE) | 'class' (Zoomed-in 10/1)
  const [zoomLevel, setZoomLevel] = useState<CalendarZoomLevel>('months');
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
    // Sort descending by cost within each class
    Object.values(map).forEach((arr) => arr.sort((a, b) => b.cost - a.cost));
    return map;
  }, [players]);

  const grades = [9, 10, 11, 12];

  const getGradeClasses = (grade: number): Club[] => {
    return [1, 2, 3, 4, 5, 6, 7].map((classNum) => {
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
    });
  };

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

  // Helper to get ordinal suffix (9TH, 10TH, 11TH, 12TH)
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

    // Aggregate season totals from gwStats
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
          <div className="relative p-4 sm:p-5 bg-slate-100 dark:bg-zinc-950 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <KitJersey clubId={detailPlayer.clubId} position={detailPlayer.position} className="w-14 h-14 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {detailPlayer.position}
                  </span>
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                    Class {playerClub?.shortName || normClubId.replace('SCH_', '').replace('_', '/')}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                  {detailPlayer.name}
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono mt-0.5">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Price: £{detailPlayer.cost.toFixed(1)}m
                  </span>
                  <span>•</span>
                  <span className="font-bold text-amber-500">
                    {detailPlayer.totalPoints} Total Pts
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
          <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Quick Season Totals */}
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Goals</span>
                <span className="text-sm font-mono font-black">{totalGoals}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Assists</span>
                <span className="text-sm font-mono font-black">{totalAssists}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Clean Sh.</span>
                <span className="text-sm font-mono font-black">{totalCS}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Saves</span>
                <span className="text-sm font-mono font-black">{totalSaves}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">MVP</span>
                <span className="text-sm font-mono font-black text-amber-500">{totalMVP}</span>
              </div>
            </div>

            {/* Last Matches Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>Last Matches & Performance</span>
              </h4>

              {playerFixturesData.pastMatches.length > 0 || Object.keys(detailPlayer.gwStats || {}).length > 0 ? (
                <div className="space-y-1.5">
                  {/* Show GW stats entries */}
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
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-mono font-bold text-[10px]">
                              GW {gw}
                            </span>
                            <span className="font-bold">
                              {oppClub ? `vs ${oppClub.shortName} (${isHome ? 'H' : 'A'})` : `Gameweek ${gw}`}
                            </span>
                            {fix && fix.homeScore !== null && fix.awayScore !== null && (
                              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/20 text-slate-300">
                                {fix.homeScore} - {fix.awayScore}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            {st.goals > 0 && <span className="text-emerald-500 font-bold">⚽ {st.goals}G</span>}
                            {st.assists > 0 && <span className="text-sky-400 font-bold">🅰️ {st.assists}A</span>}
                            {st.cleanSheet && <span className="text-teal-400 font-bold">🛡️ CS</span>}
                            {st.isMVP && <span className="text-amber-400 font-bold">⭐ MVP</span>}
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 font-black">
                              {detailPlayer.gwPoints} pts
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  {/* Also show finished fixtures if not in gwStats */}
                  {playerFixturesData.pastMatches
                    .filter((f) => !detailPlayer.gwStats?.[f.gameweek])
                    .map((fix) => {
                      const isHome = fix.homeClubId === normClubId;
                      const oppId = isHome ? fix.awayClubId : fix.homeClubId;
                      const oppClub = clubs[oppId] || CLUBS[oppId];
                      return (
                        <div
                          key={fix.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-mono font-bold text-[10px]">
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
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
                  No past match logs recorded yet for Class {playerClub?.shortName}.
                </div>
              )}
            </div>

            {/* Upcoming Matches Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Upcoming Matches</span>
              </h4>

              {playerFixturesData.upcomingMatches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {playerFixturesData.upcomingMatches.map((fix) => {
                    const isHome = fix.homeClubId === normClubId;
                    const oppId = isHome ? fix.awayClubId : fix.homeClubId;
                    const oppClub = clubs[oppId] || CLUBS[oppId];
                    return (
                      <div
                        key={fix.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 font-mono font-bold text-[10px]">
                            GW {fix.gameweek}
                          </span>
                          <span className="font-bold">
                            vs {oppClub?.shortName || oppId}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
                          {isHome ? 'HOME' : 'AWAY'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
                  Next scheduled fixtures for Class {playerClub?.shortName} will appear once announced.
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Action */}
          <div className="p-4 bg-slate-100 dark:bg-zinc-950 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
            <button
              onClick={() => setDetailPlayerId(null)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 transition-colors"
            >
              Close
            </button>

            {isOwned ? (
              <span className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Already in Your Squad
              </span>
            ) : outPlayer ? (
              <button
                onClick={() => {
                  if (isIllegal) return;
                  onSelectInPlayer(isSelectedInPlayer ? null : detailPlayer.id);
                  setDetailPlayerId(null);
                }}
                disabled={isIllegal || isSquadLocked}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  isIllegal
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                }`}
              >
                {isSelectedInPlayer ? 'Selected for Transfer' : `Replace ${outPlayer.webName} (£${detailPlayer.cost.toFixed(1)}m)`}
              </button>
            ) : (
              <button
                onClick={() => {
                  onBuyPlayer(detailPlayer.id);
                  setDetailPlayerId(null);
                }}
                disabled={isIllegal || isSquadLocked || validSquadCount >= 9}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  validSquadCount >= 9 || isIllegal
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Buy Player (£{detailPlayer.cost.toFixed(1)}m)</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // ============================================================================
  // LEVEL 1: YEARS VIEW (All 4 Grades: 9TH, 10TH, 11TH, 12TH GRADE)
  // ============================================================================
  if (zoomLevel === 'years') {
    return (
      <div className="space-y-4 py-2">
        {renderPlayerDetailModal()}

        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              ALL GRADES (YEARS 9–12)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any grade to open its class roster calendar
            </p>
          </div>
          <button
            onClick={() => setZoomLevel('months')}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors"
          >
            Back to {getGradeTitle(activeGrade)}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {grades.map((grade) => {
            const classList = getGradeClasses(grade);
            let totalPlayers = 0;
            classList.forEach((c) => {
              totalPlayers += (classPlayersMap[c.id] || []).length;
            });

            return (
              <div
                key={grade}
                onClick={() => {
                  setActiveGrade(grade);
                  setZoomLevel('months');
                }}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-emerald-500 transition-all cursor-pointer group"
              >
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                    {getGradeTitle(grade)}
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {totalPlayers} Players
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {classList.map((c) => {
                    const cPlayers = classPlayersMap[c.id] || [];
                    return (
                      <div
                        key={c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGrade(grade);
                          setActiveClassId(c.id);
                          setZoomLevel('class');
                        }}
                        className="p-1.5 rounded-lg bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:border-emerald-400 text-center transition-all"
                      >
                        <span className="text-xs font-black block text-slate-800 dark:text-white">
                          {c.shortName}
                        </span>
                        <div className="my-1 flex justify-center">
                          <KitJersey clubId={c.id} position="MID" className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 block">
                          {cPlayers.length}p
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
  }

  // ============================================================================
  // LEVEL 3: ZOOMED-IN SINGLE CLASS (e.g. 10/1)
  // Exact same 4-column grid style (GKP | DEF | MID | FWD) as the photo,
  // but zoomed in with full player captions (price, points, stats, buy button)
  // ============================================================================
  if (zoomLevel === 'class' && activeClassId) {
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
      <div className="space-y-4 py-2">
        {renderPlayerDetailModal()}

        {/* Top Navigation & Class Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-300 dark:border-white/15 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveClassId(null);
                setZoomLevel('months');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-xs font-black flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{getGradeTitle(activeGrade)}</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {classClub.shortName}
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  ({allClassPlayers.length} Players)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Click any player to view Last Matches & Upcoming Fixtures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border ${
                isClassLimitReached
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
              }`}
            >
              Owned: {ownedInClass}/2
            </span>
            <button
              onClick={() => {
                setActiveClassId(null);
                setZoomLevel('years');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold flex items-center gap-1 hover:border-emerald-500/40"
            >
              <ZoomOut className="w-3.5 h-3.5" />
              <span>Years</span>
            </button>
          </div>
        </div>

        {/* 4-Column Position Grid (GKP | DEF | MID | FWD) with vertical lines */}
        <div className="grid grid-cols-4 divide-x divide-slate-300 dark:divide-white/20 pt-1">
          {POSITIONS.map((pos) => {
            const posPlayers = allClassPlayers.filter((p) => p.position === pos);

            return (
              <div key={pos} className="px-1.5 sm:px-3 flex flex-col items-center">
                {/* Column Header: GKP | DEF | MID | FWD */}
                <div className="w-full text-center pb-2 mb-3 border-b border-slate-200 dark:border-white/10">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {pos}
                  </span>
                  <span className="block text-[10px] font-mono text-slate-400">
                    ({posPlayers.length})
                  </span>
                </div>

                {/* Players Stacked Vertically in Column */}
                <div className="w-full flex flex-col items-center gap-3">
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
                          className={`w-full p-2 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center group ${
                            isSelectedInPlayer
                              ? 'bg-emerald-500/20 border-emerald-500 shadow-md'
                              : isOwned
                              ? 'bg-emerald-500/10 border-emerald-500/40'
                              : isIllegal
                              ? 'bg-slate-100/50 dark:bg-white/[0.02] border-transparent opacity-50'
                              : 'bg-white dark:bg-white/[0.04] border-slate-200/80 dark:border-white/10 hover:border-emerald-500'
                          }`}
                        >
                          {/* Jersey */}
                          <div className="relative mb-1">
                            <KitJersey
                              clubId={p.clubId}
                              position={p.position}
                              className="w-10 h-10 sm:w-12 sm:h-12 transition-transform group-hover:scale-105"
                            />
                            {isOwned && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-black">
                                ✓
                              </span>
                            )}
                          </div>

                          {/* Player Name */}
                          <span className="text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white leading-tight line-clamp-1 w-full">
                            {p.webName}
                          </span>

                          {/* Price & Points */}
                          <div className="flex items-center justify-center gap-1.5 mt-0.5 font-mono text-[10px]">
                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                              £{p.cost.toFixed(1)}m
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="font-bold text-amber-500">
                              {p.totalPoints}pt
                            </span>
                          </div>

                          {/* Details Link hint */}
                          <span className="text-[9px] text-slate-400 group-hover:text-emerald-400 mt-0.5 flex items-center gap-0.5">
                            <Info className="w-2.5 h-2.5" /> Matches
                          </span>

                          {/* Action Button */}
                          <div className="w-full mt-1.5" onClick={(e) => e.stopPropagation()}>
                            {isOwned ? (
                              <span className="block py-0.5 rounded-lg bg-emerald-500/15 text-emerald-500 text-[9px] font-black uppercase">
                                Owned
                              </span>
                            ) : outPlayer ? (
                              <button
                                onClick={() => {
                                  if (isIllegal) return;
                                  onSelectInPlayer(isSelectedInPlayer ? null : p.id);
                                }}
                                disabled={isIllegal || isSquadLocked}
                                className={`w-full py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all ${
                                  isSelectedInPlayer
                                    ? 'bg-emerald-500 text-slate-950'
                                    : isIllegal
                                    ? 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                                    : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-slate-950 border border-emerald-500/30'
                                }`}
                              >
                                {isSelectedInPlayer ? 'Selected' : 'Replace'}
                              </button>
                            ) : (
                              <button
                                onClick={() => onBuyPlayer(p.id)}
                                disabled={isIllegal || isSquadLocked || validSquadCount >= 9}
                                className={`w-full py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all flex items-center justify-center gap-0.5 ${
                                  validSquadCount >= 9 || isIllegal
                                    ? 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                                }`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>Buy</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-slate-400 italic py-4">—</span>
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
  // Clean grid of classes (10/1 .. 10/7), each with GKP | DEF | MID | FWD columns
  // and vertical stacks of player jerseys!
  // ============================================================================
  const gradeClasses = getGradeClasses(activeGrade);

  return (
    <div className="relative space-y-5 py-2">
      {renderPlayerDetailModal()}

      {/* Watermark Crest in Top Right (like the 10TH GRADE reference image) */}
      <div className="pointer-events-none absolute top-2 right-2 opacity-[0.06] dark:opacity-[0.08] select-none hidden sm:block">
        <img src="/kcl-logo.svg" alt="" className="w-44 h-44 object-contain" />
      </div>

      {/* Top Grade Header & Switcher */}
      <div className="relative z-10 flex items-end justify-between flex-wrap gap-3 border-b border-slate-300 dark:border-white/15 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {grades.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGrade(g)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                  activeGrade === g
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {g}th
              </button>
            ))}
            <button
              onClick={() => setZoomLevel('years')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-emerald-500 flex items-center gap-1 border border-slate-200 dark:border-white/10"
            >
              <ZoomOut className="w-3.5 h-3.5" />
              <span>All Years</span>
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            {getGradeTitle(activeGrade)}
          </h1>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Click any class (e.g. {activeGrade}/1) to zoom in • Click any shirt for player stats
        </p>
      </div>

      {/* Calendar Grid of Classes (10/1, 10/2, 10/3, 10/4, 10/5, 10/6, 10/7) */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pt-1">
        {gradeClasses.map((club) => {
          const classPlayers = classPlayersMap[club.id] || [];
          const ownedInClass = squad.players.filter((sp) => {
            const p = players[sp.playerId];
            return p && (p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId) === club.id;
          }).length;

          return (
            <div
              key={club.id}
              onClick={() => {
                setActiveClassId(club.id);
                setZoomLevel('class');
              }}
              className="group p-3 rounded-2xl hover:bg-slate-100/70 dark:hover:bg-white/[0.03] border border-transparent hover:border-slate-300 dark:hover:border-white/15 transition-all cursor-pointer"
            >
              {/* Class Title Header (e.g. 10/1) */}
              <div className="flex items-baseline justify-between mb-1.5">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                  {club.shortName}
                </h3>
                <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-emerald-400">
                  {ownedInClass > 0 ? `${ownedInClass}/2 owned • ` : ''}Zoom In →
                </span>
              </div>

              {/* 4 Columns: GKP | DEF | MID | FWD separated by thin vertical lines */}
              <div className="grid grid-cols-4 divide-x divide-slate-400/60 dark:divide-white/25">
                {POSITIONS.map((pos) => {
                  const posPlayers = classPlayers.filter((p) => p.position === pos);

                  return (
                    <div key={pos} className="px-1 flex flex-col items-center min-h-[120px]">
                      {/* Position Column Header */}
                      <span className="text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-300 mb-1.5">
                        {pos}
                      </span>

                      {/* Vertical Stack of Player Jerseys */}
                      <div className="flex flex-col items-center gap-1.5 w-full">
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
                              title={`${p.name} (${p.position}) - £${p.cost.toFixed(1)}m - Click for stats`}
                              className={`relative flex flex-col items-center group/shirt transition-transform hover:scale-110 ${
                                isDimmed ? 'opacity-25 grayscale' : ''
                              }`}
                            >
                              <div className="relative">
                                <KitJersey
                                  clubId={p.clubId}
                                  position={p.position}
                                  className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-xs"
                                />
                                {isOwned && (
                                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[8px] font-black">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[52px] leading-tight mt-0.5">
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

import React, { useState, useMemo } from 'react';
import { Player, Position, Club, Squad } from '../../types/fpl';
import { CLUBS } from '../../data/clubs';
import { KitJersey } from '../pitch/KitJersey';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Users,
  Plus,
  Check,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Lock,
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

export type ZoomLevel = 'overview' | 'grade' | 'class';

// Helper to get formatted nickname or initials
function getPlayerDisplayToken(player: Player): { label: string; isInitials: boolean } {
  const nick = (player.webName || '').trim();
  // If short name without dot abbreviation (e.g. "Zarno", "Samada", "Dito")
  if (nick && nick.length <= 7 && !nick.includes('.')) {
    return { label: nick, isInitials: false };
  }
  // If dot abbreviation like "N. Qeldishvili"
  if (nick.includes('.')) {
    const parts = nick.split('.').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const surname = parts[1];
      if (surname.length <= 6) return { label: surname, isInitials: false };
      return { label: `${parts[0]}.${surname.slice(0, 4)}`, isInitials: false };
    }
  }
  // Fallback to name initials
  const nameParts = (player.name || '').trim().split(/\s+/);
  if (nameParts.length >= 2) {
    return { label: `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase(), isInitials: true };
  }
  return { label: nick.slice(0, 6), isInitials: false };
}

function getPositionStyle(pos: Position) {
  switch (pos) {
    case 'GKP':
      return { dot: 'bg-amber-400', label: 'GK', text: 'text-amber-500', bg: 'bg-amber-500/10' };
    case 'DEF':
      return { dot: 'bg-sky-400', label: 'DEF', text: 'text-sky-500', bg: 'bg-sky-500/10' };
    case 'MID':
      return { dot: 'bg-emerald-400', label: 'MID', text: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    case 'FWD':
      return { dot: 'bg-rose-400', label: 'FWD', text: 'text-rose-500', bg: 'bg-rose-500/10' };
  }
}

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
  // Navigation & Zoom state
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('grade');
  const [activeGrade, setActiveGrade] = useState<number>(10);
  const [direction, setDirection] = useState<number>(0);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  const squadPlayerIds = useMemo(() => new Set(squad.players.map((p) => p.playerId)), [squad.players]);

  // Group players by normalized club ID
  const classPlayersMap = useMemo(() => {
    const map: Record<string, Player[]> = {};
    Object.values(players).forEach((p) => {
      const normClub = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
      if (!map[normClub]) map[normClub] = [];
      map[normClub].push(p);
    });
    // Sort descending by cost
    Object.values(map).forEach((arr) => arr.sort((a, b) => b.cost - a.cost));
    return map;
  }, [players]);

  // School Grades: 9, 10, 11, 12
  const grades = [9, 10, 11, 12];

  // Helper to get the 7 classes for a given grade
  const getGradeClasses = (grade: number): Club[] => {
    return [1, 2, 3, 4, 5, 6, 7].map((classNum) => {
      const id = `SCH_${grade}_${classNum}`;
      return clubs[id] || CLUBS[id] || {
        id,
        name: `Team ${grade}/${classNum}`,
        shortName: `${grade}/${classNum}`,
        primaryColor: '#0284c7',
        secondaryColor: '#ffffff',
        textColor: '#ffffff',
      };
    });
  };

  // Grade switch handler with directional animation
  const handleGradeChange = (nextGrade: number) => {
    if (nextGrade === activeGrade) return;
    setDirection(nextGrade > activeGrade ? 1 : -1);
    setActiveGrade(nextGrade);
  };

  // Animation variants for directional calendar shuffle
  const slideVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.22, ease: 'easeOut' },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.98,
      transition: { duration: 0.18, ease: 'easeIn' },
    }),
  };

  // -------------------------------------------------------------
  // VIEW 1: CLASS ROSTER DETAIL (Zoomed in on a single class)
  // -------------------------------------------------------------
  if (zoomLevel === 'class' && activeClassId) {
    const classClub = clubs[activeClassId] || CLUBS[activeClassId] || {
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
    const maxAvailableSpend = outPlayer ? squad.bank + outPlayer.cost : squad.bank;

    // Filter players based on active search/position filters if any
    const filteredPlayers = allClassPlayers.filter((p) => {
      if (outPlayer && p.position !== outPlayer.position) return false;
      if (positionFilter !== 'ALL' && p.position !== positionFilter) return false;
      if (affordableOnly && p.cost > maxAvailableSpend) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return p.webName.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
      }
      return true;
    });

    return (
      <motion.div
        key="class-roster"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="space-y-3 py-1"
      >
        {/* Class Header Banner */}
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveClassId(null);
                setZoomLevel('grade');
              }}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Grade {activeGrade} Calendar</span>
            </button>
            <div className="flex items-center gap-2.5">
              <KitJersey clubId={classClub.id} position="MID" className="w-9 h-9 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: classClub.primaryColor }}
                  />
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {classClub.shortName} <span className="font-normal text-xs text-slate-400">({classClub.name})</span>
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {allClassPlayers.length} total registered players
                </span>
              </div>
            </div>
          </div>

          {/* Squad Quota Badge */}
          <div className="text-right">
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
                isClassLimitReached
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              Owned: {ownedInClass}/2
            </span>
          </div>
        </div>

        {/* Players List */}
        <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((p) => {
              const isOwned = squadPlayerIds.has(p.id);
              const isAffordable = p.cost <= maxAvailableSpend;
              const isSelectedInPlayer = inPlayerId === p.id;
              const isIllegal = (!isOwned && isClassLimitReached) || !isAffordable;
              const posStyle = getPositionStyle(p.position);

              return (
                <div
                  key={p.id}
                  className={`py-2 px-2 flex items-center justify-between rounded-xl transition-all ${
                    isSelectedInPlayer
                      ? 'bg-emerald-500/15 border border-emerald-500/40'
                      : isOwned
                      ? 'bg-emerald-500/5'
                      : isIllegal
                      ? 'opacity-40'
                      : 'hover:bg-slate-100/60 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <KitJersey clubId={p.clubId} position={p.position} className="w-8 h-8 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold truncate ${
                            !isOwned && isClassLimitReached ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {p.webName}
                        </span>
                        <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${posStyle.bg} ${posStyle.text}`}>
                          {posStyle.label}
                        </span>
                        {isOwned && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-500 font-bold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> In Squad
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                          £{p.cost.toFixed(1)}m
                        </span>
                        <span className="text-[10px] font-mono tabular-nums text-slate-400">
                          {p.totalPoints} pts
                        </span>
                        {!isOwned && isClassLimitReached && (
                          <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20">
                            🚫 Max 2
                          </span>
                        )}
                        {!isAffordable && (
                          <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                            💰 Over Budget
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 ml-2">
                    {isOwned ? (
                      <span className="text-[10px] font-bold text-emerald-500 px-2.5 py-1 rounded-lg bg-emerald-500/10">
                        Owned
                      </span>
                    ) : outPlayer ? (
                      <button
                        onClick={() => {
                          if (isIllegal) return;
                          onSelectInPlayer(isSelectedInPlayer ? null : p.id);
                        }}
                        disabled={isIllegal || isSquadLocked}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          isSelectedInPlayer
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : isIllegal
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-slate-950 border border-emerald-500/30'
                        }`}
                      >
                        {isSelectedInPlayer ? 'Selected' : 'Replace'}
                      </button>
                    ) : (
                      <button
                        onClick={() => onBuyPlayer(p.id)}
                        disabled={isIllegal || isSquadLocked || validSquadCount >= 9}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          validSquadCount >= 9 || isIllegal
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-xs'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Buy</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No players found matching your current filter in this class.
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ALL GRADES OVERVIEW (Zoomed out - 9th to 12th Grades)
  // -------------------------------------------------------------
  if (zoomLevel === 'overview') {
    return (
      <motion.div
        key="overview-zoom"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="space-y-3 py-1"
      >
        <div className="flex items-center justify-between pb-1">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>Komarovi Grades Overview (9–12)</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select a grade to open its 7-class calendar view
            </p>
          </div>
          <button
            onClick={() => setZoomLevel('grade')}
            className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Grade {activeGrade}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {grades.map((grade) => {
            const classList = getGradeClasses(grade);
            let totalPlayers = 0;
            let ownedInGrade = 0;

            classList.forEach((c) => {
              const count = (classPlayersMap[c.id] || []).length;
              totalPlayers += count;
              ownedInGrade += squad.players.filter((sp) => {
                const p = players[sp.playerId];
                return p && (p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId) === c.id;
              }).length;
            });

            return (
              <motion.div
                key={grade}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  setActiveGrade(grade);
                  setZoomLevel('grade');
                }}
                className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 shadow-xs cursor-pointer transition-all space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-center border border-emerald-500/30">
                      {grade}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                        Grade {grade} Classes
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        7 Classes ({grade}/1 – {grade}/7)
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-emerald-500 block">
                      {totalPlayers} Players
                    </span>
                    {ownedInGrade > 0 && (
                      <span className="text-[10px] text-slate-400">
                        {ownedInGrade} in squad
                      </span>
                    )}
                  </div>
                </div>

                {/* 7 mini calendar class badges */}
                <div className="grid grid-cols-7 gap-1 pt-1">
                  {classList.map((c) => (
                    <div
                      key={c.id}
                      className="py-1 rounded-lg bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 text-center flex flex-col items-center gap-0.5"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: c.primaryColor }}
                      />
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">
                        {c.shortName.split('/')[1]}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: GRADE CALENDAR VIEW (7 Classes of active grade)
  // -------------------------------------------------------------
  const gradeClasses = getGradeClasses(activeGrade);

  return (
    <div className="space-y-3 py-1">
      {/* Grade Shuffler HUD */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        {/* Shuffle navigation & Segmented tabs */}
        <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-white/[0.04] p-1 rounded-2xl border border-slate-200 dark:border-white/10">
          <button
            onClick={() => handleGradeChange(Math.max(9, activeGrade - 1))}
            disabled={activeGrade <= 9}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous Grade"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {grades.map((grade) => {
              const isActive = grade === activeGrade;
              return (
                <button
                  key={grade}
                  onClick={() => handleGradeChange(grade)}
                  className={`relative px-2.5 sm:px-3 py-1 rounded-xl text-xs font-extrabold transition-colors z-10 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="calendarGradeTabPill"
                      className="absolute inset-0 rounded-xl bg-emerald-500 -z-10 shadow-xs"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span>Grade {grade}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handleGradeChange(Math.min(12, activeGrade + 1))}
            disabled={activeGrade >= 12}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next Grade"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Out Button: All Grades (9–12) */}
        <button
          onClick={() => setZoomLevel('overview')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-500/40 transition-all shadow-xs"
        >
          <ZoomOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Zoom Out:</span> All Grades (4)
        </button>
      </div>

      {/* Animated 7-Class Calendar Grid */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeGrade}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5"
        >
          {gradeClasses.map((club) => {
            const classPlayers = classPlayersMap[club.id] || [];
            const ownedInClass = squad.players.filter((sp) => {
              const p = players[sp.playerId];
              return p && (p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId) === club.id;
            }).length;
            const isMaxed = ownedInClass >= 2;

            // Compute position breakdown
            let gkCount = 0;
            let defCount = 0;
            let midCount = 0;
            let fwdCount = 0;
            classPlayers.forEach((p) => {
              if (p.position === 'GKP') gkCount++;
              else if (p.position === 'DEF') defCount++;
              else if (p.position === 'MID') midCount++;
              else if (p.position === 'FWD') fwdCount++;
            });

            // Display up to 5 player chips with nicknames/initials
            const previewPlayers = classPlayers.slice(0, 5);
            const remainingCount = Math.max(0, classPlayers.length - 5);

            return (
              <motion.div
                key={club.id}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  setActiveClassId(club.id);
                  setZoomLevel('class');
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2.5 shadow-xs ${
                  isMaxed
                    ? 'bg-rose-500/[0.04] border-rose-500/30 hover:border-rose-500/50'
                    : 'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-sm'
                }`}
              >
                {/* Calendar Card Header: Class shortName & Quota */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-black"
                      style={{ backgroundColor: club.primaryColor }}
                    />
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {club.shortName}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                      {club.name}
                    </span>
                  </div>

                  {/* Quota Badge (0/2, 1/2, or 2/2 MAX) */}
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                      isMaxed
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                        : ownedInClass > 0
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'
                    }`}
                  >
                    {isMaxed ? '2/2 MAX' : `${ownedInClass}/2`}
                  </span>
                </div>

                {/* Card Center: Kit Jersey & Player Counts */}
                <div className="flex items-center gap-3 bg-slate-50/80 dark:bg-black/20 p-2 rounded-xl border border-slate-100 dark:border-white/[0.03]">
                  <KitJersey clubId={club.id} position="MID" className="w-9 h-9 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                      {classPlayers.length} Players
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{gkCount} GK</span>
                      <span>•</span>
                      <span>{defCount} DEF</span>
                      <span>•</span>
                      <span>{midCount} MID</span>
                      <span>•</span>
                      <span>{fwdCount} FWD</span>
                    </div>
                  </div>
                </div>

                {/* Nicknames & Initials Mini-Roster */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Key Players</span>
                    <span className="text-emerald-500 font-semibold group-hover:underline">Open Roster →</span>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {previewPlayers.length > 0 ? (
                      previewPlayers.map((p) => {
                        const token = getPlayerDisplayToken(p);
                        const posStyle = getPositionStyle(p.position);
                        const isOwned = squadPlayerIds.has(p.id);

                        return (
                          <div
                            key={p.id}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                              isOwned
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-white/5 border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-300'
                            }`}
                            title={`${p.name} (${p.position}) - £${p.cost}m`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${posStyle.dot}`} />
                            <span className="truncate max-w-[65px]">{token.label}</span>
                            {isOwned && <Check className="w-2.5 h-2.5 text-emerald-500 ml-0.5" />}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No players added yet</span>
                    )}

                    {remainingCount > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 px-1 py-0.5 rounded bg-slate-100 dark:bg-white/5">
                        +{remainingCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

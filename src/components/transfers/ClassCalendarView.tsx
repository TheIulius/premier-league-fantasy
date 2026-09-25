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
  Calendar,
  Layers,
  Sparkles,
  Lock,
  ChevronDown,
  Shield,
  SlidersHorizontal,
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

export type CalendarZoomLevel = 'years' | 'months' | 'field';

function getPositionStyle(pos: Position) {
  switch (pos) {
    case 'GKP':
      return { dot: 'bg-amber-400', label: 'GK', text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' };
    case 'DEF':
      return { dot: 'bg-sky-400', label: 'DEF', text: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30' };
    case 'MID':
      return { dot: 'bg-emerald-400', label: 'MID', text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' };
    case 'FWD':
      return { dot: 'bg-rose-400', label: 'FWD', text: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30' };
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
  // Calendar Hierarchy: Years (Grades) -> Months (Classes) -> Field (Players/Days)
  const [zoomLevel, setZoomLevel] = useState<CalendarZoomLevel>('months');
  const [activeGrade, setActiveGrade] = useState<number>(10);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [fieldPositionFilter, setFieldPositionFilter] = useState<Position | 'ALL'>('ALL');

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

  // School Grades (Years): 9, 10, 11, 12
  const grades = [9, 10, 11, 12];

  // Helper to get the 7 classes (Months) for a given grade
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

  const maxAvailableSpend = outPlayer ? squad.bank + outPlayer.cost : squad.bank;

  // Animation variants
  const zoomTransitionVariants: Variants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.18, ease: 'easeIn' } },
  };

  // --------------------------------------------------------------------------
  // LEVEL 3: IMAGINARY FOOTBALL FIELD (DAYS = PLAYERS IN TACTICAL POSITIONS)
  // Minimalistic, NON-GREEN, crisp field lines and actual goals!
  // --------------------------------------------------------------------------
  if (zoomLevel === 'field' && activeClassId) {
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

    // Filter players based on props & local field filter
    const activePosFilter = fieldPositionFilter !== 'ALL' ? fieldPositionFilter : positionFilter;

    const gkpPlayers = allClassPlayers.filter((p) => p.position === 'GKP');
    const defPlayers = allClassPlayers.filter((p) => p.position === 'DEF');
    const midPlayers = allClassPlayers.filter((p) => p.position === 'MID');
    const fwdPlayers = allClassPlayers.filter((p) => p.position === 'FWD');

    const renderFieldPlayerCard = (p: Player) => {
      const isOwned = squadPlayerIds.has(p.id);
      const isAffordable = p.cost <= maxAvailableSpend;
      const isSelectedInPlayer = inPlayerId === p.id;
      const isIllegal = (!isOwned && isClassLimitReached) || !isAffordable;
      const posStyle = getPositionStyle(p.position);

      const matchesSearch = searchQuery.trim()
        ? p.webName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
        : true;

      const matchesPos = activePosFilter === 'ALL' || p.position === activePosFilter;
      const isDimmed = !matchesSearch || !matchesPos;

      return (
        <motion.div
          key={p.id}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`relative flex flex-col items-center p-2 rounded-2xl border backdrop-blur-md transition-all w-[94px] sm:w-[110px] md:w-[118px] select-none ${
            isDimmed
              ? 'opacity-25 grayscale'
              : isSelectedInPlayer
              ? 'bg-emerald-500/25 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/40'
              : isOwned
              ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20'
              : isIllegal
              ? 'bg-black/50 border-white/5 opacity-50'
              : 'bg-slate-900/90 hover:bg-slate-800/95 border-white/15 hover:border-emerald-400/50 shadow-xl'
          }`}
        >
          {/* Kit Jersey */}
          <div className="relative mb-1">
            <KitJersey clubId={p.clubId} position={p.position} className="w-8 h-8 sm:w-9 sm:h-9" />
            {isOwned && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center font-black text-[9px] shadow-sm">
                ✓
              </span>
            )}
          </div>

          {/* Player Name */}
          <span className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[84px] sm:max-w-[100px] text-center leading-tight">
            {p.webName}
          </span>

          {/* Position & Cost */}
          <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px]">
            <span className={`px-1 py-0.2 rounded font-black text-[9px] ${posStyle.bg} ${posStyle.text}`}>
              {posStyle.label}
            </span>
            <span className="font-bold text-emerald-400">
              £{p.cost.toFixed(1)}m
            </span>
          </div>

          {/* Points */}
          <span className="text-[9px] font-mono text-slate-400 mt-0.5">
            {p.totalPoints} pts
          </span>

          {/* Quick Action Button */}
          <div className="mt-1.5 w-full">
            {isOwned ? (
              <span className="block text-center text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/15 py-1 rounded-lg border border-emerald-500/20">
                In Squad
              </span>
            ) : outPlayer ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isIllegal) return;
                  onSelectInPlayer(isSelectedInPlayer ? null : p.id);
                }}
                disabled={isIllegal || isSquadLocked}
                className={`w-full py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  isSelectedInPlayer
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    : isIllegal
                    ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/30'
                }`}
              >
                {isSelectedInPlayer ? 'Selected' : 'Replace'}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBuyPlayer(p.id);
                }}
                disabled={isIllegal || isSquadLocked || validSquadCount >= 9}
                className={`w-full py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                  validSquadCount >= 9 || isIllegal
                    ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-xs'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>Buy</span>
              </button>
            )}
          </div>
        </motion.div>
      );
    };

    return (
      <motion.div
        key="calendar-field-view"
        variants={zoomTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-3 py-1"
      >
        {/* Navigation Breadcrumb & Pop-Out Controls */}
        <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-2xl bg-slate-900/80 dark:bg-zinc-950/80 border border-white/10 backdrop-blur-md">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => {
                setActiveClassId(null);
                setZoomLevel('years');
              }}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-bold"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Years</span>
            </button>
            <span className="text-slate-500">/</span>
            <button
              onClick={() => {
                setActiveClassId(null);
                setZoomLevel('months');
              }}
              className="text-slate-400 hover:text-white transition-colors font-bold"
            >
              Grade {activeGrade} (Months)
            </button>
            <span className="text-slate-500">/</span>
            <span className="font-extrabold text-emerald-400">
              Class {classClub.shortName} (Tactical Field)
            </span>
          </div>

          {/* Pop Out Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setActiveClassId(null);
                setZoomLevel('months');
              }}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-all flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Pop Out to Months</span>
            </button>
            <button
              onClick={() => {
                setActiveClassId(null);
                setZoomLevel('years');
              }}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-all flex items-center gap-1"
            >
              <ZoomOut className="w-3.5 h-3.5 text-emerald-400" />
              <span>Years</span>
            </button>
          </div>
        </div>

        {/* Class Banner Info & Position Filter */}
        <div className="p-3 rounded-2xl bg-slate-900/90 dark:bg-zinc-950/90 border border-white/10 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <KitJersey clubId={classClub.id} position="MID" className="w-10 h-10 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20"
                  style={{ backgroundColor: classClub.primaryColor }}
                />
                <h3 className="font-black text-base text-white">
                  Class {classClub.shortName}
                </h3>
                <span className="text-xs text-slate-400 font-normal">
                  ({classClub.name})
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {allClassPlayers.length} Players • {gkpPlayers.length} GK, {defPlayers.length} DEF, {midPlayers.length} MID, {fwdPlayers.length} FWD
              </span>
            </div>
          </div>

          {/* Quota & Position Filter Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-mono">
              {(['ALL', 'GKP', 'DEF', 'MID', 'FWD'] as const).map((pos) => {
                const label = pos === 'GKP' ? 'GK' : pos;
                const isSelected = fieldPositionFilter === pos;
                return (
                  <button
                    key={pos}
                    onClick={() => setFieldPositionFilter(pos)}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <span
              className={`text-xs font-black px-2.5 py-1 rounded-xl border font-mono ${
                isClassLimitReached
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}
            >
              Owned: {ownedInClass}/2
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MINIMALISTIC NON-GREEN IMAGINARY FOOTBALL FIELD CANVAS         */}
        {/* Dark neutral aesthetic, white lines, top goal & bottom goal   */}
        {/* ------------------------------------------------------------- */}
        <div className="relative w-full rounded-3xl overflow-hidden bg-slate-950 dark:bg-zinc-950 border border-slate-800 dark:border-white/10 shadow-2xl p-3 sm:p-5 md:p-6 min-h-[620px] flex flex-col justify-between select-none">
          {/* Pitch White Chalk Lines & Football Goals (SVG) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none stroke-white/40 fill-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Subtle dark field grid pattern */}
              <pattern id="minimalFieldGrid" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
              </pattern>
              {/* Goal net mesh pattern */}
              <pattern id="goalNetMesh" width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M 0 0 L 6 6 M 6 0 L 0 6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
              </pattern>
            </defs>

            <rect width="100%" height="100%" fill="url(#minimalFieldGrid)" />

            {/* Pitch Outer Touchline Boundary */}
            <rect x="16" y="24" width="calc(100% - 32px)" height="calc(100% - 48px)" strokeWidth="1.5" rx="8" strokeDasharray="4 2" />

            {/* TOP GOAL (Opponent Goal / Attacking Target) */}
            <rect x="calc(50% - 48px)" y="8" width="96" height="16" fill="url(#goalNetMesh)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
            <line x1="calc(50% - 48px)" y1="8" x2="calc(50% + 48px)" y2="8" stroke="white" strokeWidth="2.5" />
            <circle cx="calc(50% - 48px)" cy="24" r="3" fill="white" />
            <circle cx="calc(50% + 48px)" cy="24" r="3" fill="white" />

            {/* Top Penalty Area */}
            <rect x="calc(50% - 100px)" y="24" width="200" height="72" strokeWidth="1.5" />
            <rect x="calc(50% - 55px)" y="24" width="110" height="28" strokeWidth="1.5" />
            <circle cx="50%" cy="66" r="2.5" fill="white" />
            <path d="M calc(50% - 35px) 96 C calc(50% - 20px) 110, calc(50% + 20px) 110, calc(50% + 35px) 96" strokeWidth="1.5" />

            {/* Halfway Line & Center Circle */}
            <line x1="16" y1="50%" x2="calc(100% - 16px)" y2="50%" strokeWidth="1.5" strokeDasharray="4 2" />
            <circle cx="50%" cy="50%" r="52" strokeWidth="1.5" />
            <circle cx="50%" cy="50%" r="3.5" fill="white" />

            {/* Bottom Penalty Area */}
            <rect x="calc(50% - 100px)" y="calc(100% - 96px)" width="200" height="72" strokeWidth="1.5" />
            <rect x="calc(50% - 55px)" y="calc(100% - 52px)" width="110" height="28" strokeWidth="1.5" />
            <circle cx="50%" cy="calc(100% - 66px)" r="2.5" fill="white" />
            <path d="M calc(50% - 35px) calc(100% - 96px) C calc(50% - 20px) calc(100% - 110px), calc(50% + 20px) calc(100% - 110px), calc(50% + 35px) calc(100% - 96px)" strokeWidth="1.5" />

            {/* BOTTOM GOAL (Home Goal / Goalkeeper Guard) */}
            <rect x="calc(50% - 48px)" y="calc(100% - 24px)" width="96" height="16" fill="url(#goalNetMesh)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
            <line x1="calc(50% - 48px)" y1="calc(100% - 8px)" x2="calc(50% + 48px)" y2="calc(100% - 8px)" stroke="white" strokeWidth="2.5" />
            <circle cx="calc(50% - 48px)" cy="calc(100% - 24px)" r="3" fill="white" />
            <circle cx="calc(50% + 48px)" cy="calc(100% - 24px)" r="3" fill="white" />

            {/* Corner Arcs */}
            <path d="M 16 38 A 14 14 0 0 0 30 24" strokeWidth="1.5" />
            <path d="M calc(100% - 30px) 24 A 14 14 0 0 0 calc(100% - 16px) 38" strokeWidth="1.5" />
            <path d="M 16 calc(100% - 38px) A 14 14 0 0 1 30 calc(100% - 24px)" strokeWidth="1.5" />
            <path d="M calc(100% - 30px) calc(100% - 24px) A 14 14 0 0 1 calc(100% - 16px) calc(100% - 38px)" strokeWidth="1.5" />
          </svg>

          {/* Tactical Field Content: 4 Position Zones */}
          <div className="relative z-10 flex flex-col justify-between gap-6 py-2 flex-1">
            {/* ZONE 1: FORWARDS (Top / Attacking Third) */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-2 px-2.5 py-0.5 rounded-full bg-rose-950/70 border border-rose-500/30 text-[10px] font-mono font-bold tracking-wider text-rose-300">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>FORWARDS ({fwdPlayers.length})</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-3xl mx-auto px-1">
                {fwdPlayers.length > 0 ? (
                  fwdPlayers.map(renderFieldPlayerCard)
                ) : (
                  <span className="text-[10px] text-slate-500 italic py-1">No forwards in this class</span>
                )}
              </div>
            </div>

            {/* ZONE 2: MIDFIELDERS (Center Circle / Midfield) */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-2 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-[10px] font-mono font-bold tracking-wider text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>MIDFIELDERS ({midPlayers.length})</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-3xl mx-auto px-1">
                {midPlayers.length > 0 ? (
                  midPlayers.map(renderFieldPlayerCard)
                ) : (
                  <span className="text-[10px] text-slate-500 italic py-1">No midfielders in this class</span>
                )}
              </div>
            </div>

            {/* ZONE 3: DEFENDERS (Defensive Third) */}
            {/* If more than 3 defenders, flex-wrap creates neat 2-tier tactical defensive spacing */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-2 px-2.5 py-0.5 rounded-full bg-sky-950/70 border border-sky-500/30 text-[10px] font-mono font-bold tracking-wider text-sky-300">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>DEFENDERS ({defPlayers.length})</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-3xl mx-auto px-1">
                {defPlayers.length > 0 ? (
                  defPlayers.map(renderFieldPlayerCard)
                ) : (
                  <span className="text-[10px] text-slate-500 italic py-1">No defenders in this class</span>
                )}
              </div>
            </div>

            {/* ZONE 4: GOALKEEPERS (Bottom / Goal Mouth) */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-2 px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/30 text-[10px] font-mono font-bold tracking-wider text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>GOALKEEPERS ({gkpPlayers.length})</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-3xl mx-auto px-1">
                {gkpPlayers.length > 0 ? (
                  gkpPlayers.map(renderFieldPlayerCard)
                ) : (
                  <span className="text-[10px] text-slate-500 italic py-1">No goalkeepers in this class</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // --------------------------------------------------------------------------
  // LEVEL 1: YEARS OVERVIEW (GRADES 9–12)
  // Apple / Google Calendar Year overview aesthetic!
  // --------------------------------------------------------------------------
  if (zoomLevel === 'years') {
    return (
      <motion.div
        key="calendar-years-view"
        variants={zoomTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-3 py-1"
      >
        {/* Header HUD */}
        <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>Calendar Years (Grades 9–12)</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select a Grade Year to view its 7 Class Months, or pop into a class directly
            </p>
          </div>

          <button
            onClick={() => setZoomLevel('months')}
            className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-xs hover:bg-emerald-400 transition-all flex items-center gap-1"
          >
            <span>Grade {activeGrade} Months</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Large Year Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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

            const isActiveGrade = grade === activeGrade;

            return (
              <motion.div
                key={grade}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className={`p-4 rounded-3xl border transition-all cursor-pointer space-y-3 shadow-md ${
                  isActiveGrade
                    ? 'bg-slate-900/90 dark:bg-zinc-950/90 border-emerald-500/50 ring-1 ring-emerald-500/30'
                    : 'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/10 hover:border-emerald-500/40'
                }`}
                onClick={() => {
                  setActiveGrade(grade);
                  setZoomLevel('months');
                }}
              >
                {/* Year Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black text-base flex items-center justify-center border border-emerald-500/40 shadow-xs">
                      {grade}
                    </span>
                    <div>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Grade {grade}</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          (Year {grade})
                        </span>
                      </h4>
                      <span className="text-xs text-slate-400">
                        7 Classes ({grade}/1 – {grade}/7)
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">
                      {totalPlayers} Players
                    </span>
                    {ownedInGrade > 0 && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {ownedInGrade} in squad
                      </span>
                    )}
                  </div>
                </div>

                {/* 7 Mini-Month Tiles inside the Year */}
                <div className="grid grid-cols-7 gap-1 pt-1">
                  {classList.map((c) => {
                    const count = (classPlayersMap[c.id] || []).length;
                    return (
                      <div
                        key={c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGrade(grade);
                          setActiveClassId(c.id);
                          setZoomLevel('field');
                        }}
                        className="py-1.5 px-1 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200/80 dark:border-white/5 hover:border-emerald-400/60 hover:bg-emerald-500/10 text-center flex flex-col items-center gap-0.5 transition-all group"
                        title={`Pop into Class ${c.shortName} Football Field (${count} players)`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: c.primaryColor }}
                        />
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 group-hover:text-emerald-400">
                          {c.shortName.split('/')[1]}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // --------------------------------------------------------------------------
  // LEVEL 2: MONTHS VIEW (7 CLASSES OF THE ACTIVE GRADE)
  // Real calendar aesthetic! 7 month blocks, days are player tokens
  // --------------------------------------------------------------------------
  const gradeClasses = getGradeClasses(activeGrade);

  return (
    <motion.div
      key="calendar-months-view"
      variants={zoomTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-3 py-1"
    >
      {/* Grade Selector HUD & Pop-Out to Years */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-2 rounded-2xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
        {/* Shuffle Navigation & Segmented Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveGrade(Math.max(9, activeGrade - 1))}
            disabled={activeGrade <= 9}
            className="p-1.5 rounded-xl text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous Grade Year"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {grades.map((grade) => {
              const isActive = grade === activeGrade;
              return (
                <button
                  key={grade}
                  onClick={() => setActiveGrade(grade)}
                  className={`relative px-2.5 sm:px-3.5 py-1 rounded-xl text-xs font-black transition-colors z-10 ${
                    isActive
                      ? 'text-slate-950 font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-white'
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
            onClick={() => setActiveGrade(Math.min(12, activeGrade + 1))}
            disabled={activeGrade >= 12}
            className="p-1.5 rounded-xl text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next Grade Year"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Pop Out to Years Button */}
        <button
          onClick={() => setZoomLevel('years')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-400 hover:border-emerald-500/40 transition-all shadow-xs"
        >
          <ZoomOut className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pop Out to Years</span>
        </button>
      </div>

      {/* Subtitle helper */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>7 Classes (Months) of Grade {activeGrade}</span>
        <span className="font-mono text-[11px]">Click any class to pop into its tactical field</span>
      </div>

      {/* 7 Class Months Calendar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {gradeClasses.map((club) => {
          const classPlayers = classPlayersMap[club.id] || [];
          const ownedInClass = squad.players.filter((sp) => {
            const p = players[sp.playerId];
            return p && (p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId) === club.id;
          }).length;
          const isMaxed = ownedInClass >= 2;

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

          // Days in this month: players as date badges
          const previewPlayers = classPlayers.slice(0, 6);
          const remainingCount = Math.max(0, classPlayers.length - 6);

          return (
            <motion.div
              key={club.id}
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => {
                setActiveClassId(club.id);
                setZoomLevel('field');
              }}
              className={`p-3.5 rounded-3xl border transition-all cursor-pointer space-y-3 shadow-md ${
                isMaxed
                  ? 'bg-rose-500/[0.04] border-rose-500/30 hover:border-rose-500/50'
                  : 'bg-white dark:bg-zinc-950/80 border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-lg'
              }`}
            >
              {/* Month Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full ring-2 ring-white/20"
                    style={{ backgroundColor: club.primaryColor }}
                  />
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      Class {club.shortName}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {club.name}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                    isMaxed
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                      : ownedInClass > 0
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'
                  }`}
                >
                  {isMaxed ? '2/2 MAX' : `${ownedInClass}/2`}
                </span>
              </div>

              {/* Month Roster Breakdown */}
              <div className="flex items-center gap-3 bg-slate-50/80 dark:bg-black/40 p-2 rounded-2xl border border-slate-100 dark:border-white/5">
                <KitJersey clubId={club.id} position="MID" className="w-8 h-8 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 block">
                    {classPlayers.length} Total Players
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

              {/* Calendar Days (Players) Tokens Grid */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Days (Players)</span>
                  <span className="text-emerald-400 font-semibold group-hover:underline">
                    Pop into Field ⤢
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1">
                  {previewPlayers.map((p) => {
                    const isOwned = squadPlayerIds.has(p.id);
                    const posStyle = getPositionStyle(p.position);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between px-1.5 py-1 rounded-xl text-[10px] font-bold border ${
                          isOwned
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-100 dark:bg-white/5 border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${posStyle.dot}`} />
                          <span className="truncate">{p.webName}</span>
                        </div>
                        {isOwned && <Check className="w-2.5 h-2.5 text-emerald-400 ml-0.5 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {remainingCount > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono block text-center pt-0.5">
                    +{remainingCount} more players on field
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

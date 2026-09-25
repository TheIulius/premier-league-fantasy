import React, { useState, useMemo } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Position, Player } from '../../types/fpl';
import { CLUBS, getSortedSchoolClubs } from '../../data/clubs';
import { KitJersey } from '../pitch/KitJersey';
import {
  ArrowLeftRight,
  Search,
  Check,
  AlertCircle,
  ArrowUpRight,
  Shield,
  CheckCircle,
  Plus,
  Trash2,
  ShoppingBag,
  X,
  RotateCcw,
  ArrowUpDown,
  Coins,
  ChevronDown,
  ChevronUp,
  Lock,
  List,
  LayoutGrid,
} from 'lucide-react';
import { validateSquadComposition } from '../../engine/scoring';
import confetti from 'canvas-confetti';

export type SortOption =
  | 'points_desc'
  | 'cost_desc'
  | 'cost_asc'
  | 'form_desc'
  | 'selected_desc'
  | 'name_asc';

export const TransfersView: React.FC = () => {
  const fpl = useFPL();
  const {
    players,
    clubs,
    squad,
    transferPlayer,
    buyPlayer,
    removePlayer,
    freeTransfersRemaining,
  } = fpl;
  const isSquadLocked = (fpl as any).isSquadLocked ?? false;

  const [outPlayerId, setOutPlayerId] = useState<string | null>(null);
  const [inPlayerId, setInPlayerId] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState<Position | 'ALL'>('ALL');
  const [clubFilter, setClubFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('points_desc');
  const [affordableOnly, setAffordableOnly] = useState<boolean>(false);
  const [transferMessage, setTransferMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'classes'>('list');
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const comp = useMemo(() => validateSquadComposition(squad.players, players), [squad.players, players]);
  const [showCompDetails, setShowCompDetails] = useState<boolean>(!comp.isValid && squad.players.length > 0);

  const outPlayer = outPlayerId ? players[outPlayerId] : null;
  const inPlayer = inPlayerId ? players[inPlayerId] : null;

  // Calculate potential bank after transfer
  const potentialBank = useMemo(() => {
    if (!outPlayer || !inPlayer) return squad.bank;
    return Math.round((squad.bank + outPlayer.cost - inPlayer.cost) * 10) / 10;
  }, [outPlayer, inPlayer, squad.bank]);

  const squadPlayerIds = useMemo(() => new Set(squad.players.map((p) => p.playerId)), [squad.players]);

  const sortedClubs = useMemo(() => getSortedSchoolClubs(clubs), [clubs]);

  const classPlayersMap = useMemo(() => {
    const map: Record<string, Player[]> = {};
    Object.values(players).forEach(p => {
      const normClub = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
      if (!map[normClub]) map[normClub] = [];
      map[normClub].push(p);
    });
    // Sort players within each class roughly by price desc
    Object.values(map).forEach(arr => arr.sort((a,b) => b.cost - a.cost));
    return map;
  }, [players]);

  const positionCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: 0, GKP: 0, DEF: 0, MID: 0, FWD: 0 };
    Object.values(players).forEach((p) => {
      if (squadPlayerIds.has(p.id)) return;
      counts.ALL++;
      if (counts[p.position] !== undefined) counts[p.position]++;
    });
    return counts;
  }, [players, squadPlayerIds]);

  const candidatePlayers = useMemo(() => {
    return Object.values(players)
      .filter((p) => !squadPlayerIds.has(p.id))
      .filter((p) => {
        if (outPlayer) return p.position === outPlayer.position;
        if (positionFilter === 'ALL') return true;
        return p.position === positionFilter;
      })
      .filter((p) => {
        if (clubFilter === 'ALL') return true;
        const norm = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
        return norm === clubFilter;
      })
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const pClub = clubs?.[p.clubId] || CLUBS[p.clubId];
        const clubName = pClub?.name.toLowerCase() || '';
        const clubShort = pClub?.shortName.toLowerCase() || '';
        return (
          p.name.toLowerCase().includes(q) ||
          p.webName.toLowerCase().includes(q) ||
          clubName.includes(q) ||
          clubShort.includes(q)
        );
      })
      .filter((p) => {
        if (!affordableOnly) return true;
        const maxSpend = outPlayer ? squad.bank + outPlayer.cost : squad.bank;
        return p.cost <= maxSpend;
      })
      .sort((a, b) => {
        if (sortBy === 'points_desc') return b.totalPoints - a.totalPoints;
        if (sortBy === 'cost_desc') return b.cost - a.cost;
        if (sortBy === 'cost_asc') return a.cost - b.cost;
        if (sortBy === 'form_desc') return b.form - a.form;
        if (sortBy === 'selected_desc') return b.selectedByPercent - a.selectedByPercent;
        if (sortBy === 'name_asc') return a.webName.localeCompare(b.webName);
        return b.cost - a.cost;
      });
  }, [players, squadPlayerIds, outPlayer, positionFilter, clubFilter, searchQuery, affordableOnly, sortBy, clubs]);

  const handleConfirmTransfer = () => {
    if (isSquadLocked) return;
    if (!outPlayerId || !inPlayerId) return;
    const res = transferPlayer(outPlayerId, inPlayerId);
    if (res.success) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#10b981', '#38bdf8'],
      });
      setTransferMessage({
        type: 'success',
        text: `Transferred ${outPlayer?.webName} -> ${inPlayer?.webName}!`,
      });
      setOutPlayerId(null);
      setInPlayerId(null);
      setTimeout(() => setTransferMessage(null), 3000);
    } else {
      setTransferMessage({
        type: 'error',
        text: res.message || 'Transfer failed.',
      });
      setTimeout(() => setTransferMessage(null), 4000);
    }
  };

  const handleBuyPlayer = (playerId: string) => {
    if (isSquadLocked) return;
    const p = players[playerId];
    const res = buyPlayer(playerId);
    if (res.success) {
      setTransferMessage({
        type: 'success',
        text: `Bought ${p?.webName || 'player'} for £${p?.cost.toFixed(1)}m!`,
      });
      setTimeout(() => setTransferMessage(null), 2500);
    } else {
      setTransferMessage({
        type: 'error',
        text: res.message || 'Could not buy player.',
      });
      setTimeout(() => setTransferMessage(null), 3500);
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    if (isSquadLocked) return;
    const p = players[playerId];
    const res = removePlayer(playerId);
    if (res.success) {
      if (outPlayerId === playerId) setOutPlayerId(null);
      setTransferMessage({
        type: 'success',
        text: `Sold ${p?.webName || 'player'} (+£${p?.cost.toFixed(1)}m refunded)`,
      });
      setTimeout(() => setTransferMessage(null), 2500);
    } else {
      setTransferMessage({
        type: 'error',
        text: res.message || 'Could not sell player.',
      });
      setTimeout(() => setTransferMessage(null), 3500);
    }
  };

  const handleMarketPlayerTap = (p: Player, classLimitReached: boolean, affordable: boolean, squadFull: boolean, isOwned: boolean) => {
    if (isSquadLocked || isOwned) return;

    if (outPlayer) {
      if (!classLimitReached && affordable) setInPlayerId(p.id);
    } else {
      if (squadFull) {
        setTransferMessage({ type: 'error', text: 'Tap a player in your squad first' });
        setTimeout(() => setTransferMessage(null), 3500);
      } else if (!classLimitReached && affordable) {
        handleBuyPlayer(p.id);
      }
    }
  };

  const handleResetFilters = () => {
    setPositionFilter('ALL');
    setClubFilter('ALL');
    setSearchQuery('');
    setSortBy('points_desc');
    setAffordableOnly(false);
  };

  const hasActiveFilters =
    positionFilter !== 'ALL' ||
    clubFilter !== 'ALL' ||
    searchQuery.trim() !== '' ||
    sortBy !== 'points_desc' ||
    affordableOnly;

  return (
    <div className="flex flex-col space-y-2.5 pb-24 md:pb-12 px-2 sm:px-4 md:px-6 pt-1 md:pt-3 select-none max-w-5xl lg:max-w-6xl mx-auto w-full transition-colors duration-200">
      
      {isSquadLocked && (
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-2 shadow-sm animate-fade-in">
          <Lock className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">🔒 Lineups are locked</span>
        </div>
      )}

      {/* Transfer Metrics & Quick Status Bar */}
      <div className={`p-2.5 md:p-3 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs space-y-2 ${isSquadLocked ? 'border-slate-300 dark:border-slate-700 opacity-90' : 'border-slate-200 dark:border-slate-800'}`}>
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-3 sm:gap-4 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">£{squad.bank.toFixed(1)}m</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Free Transfers</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{freeTransfersRemaining}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Cost</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {freeTransfersRemaining > 0 ? '0 pts' : '-4 pts'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowCompDetails((prev) => !prev)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              comp.isValid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            {comp.isValid ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Squad Complete</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Need 1 GK, 3 DEF, 3 MID, 2 FWD</span>
              </>
            )}
            {showCompDetails ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>
        </div>

        {showCompDetails && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 animate-fade-in space-y-1.5">
            <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
              <div className={`p-1 rounded-lg border ${comp.gkCount === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-400">GK</span>
                <span className="font-black">{comp.gkCount}/1</span>
              </div>
              <div className={`p-1 rounded-lg border ${comp.defCount === 3 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-400">DEF</span>
                <span className="font-black">{comp.defCount}/3</span>
              </div>
              <div className={`p-1 rounded-lg border ${comp.midCount === 3 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-400">MID</span>
                <span className="font-black">{comp.midCount}/3</span>
              </div>
              <div className={`p-1 rounded-lg border ${comp.fwdCount === 2 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-400">FWD</span>
                <span className="font-black">{comp.fwdCount}/2</span>
              </div>
            </div>
            {comp.exceededClubs && comp.exceededClubs.length > 0 && (
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex gap-1.5 items-center">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> 
                Max 2 players per class exceeded in: {comp.exceededClubs.map((ec) => `${ec.clubId.replace('SCH_', '')}`).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {transferMessage && (
        <div
          className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
            transferMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
          }`}
        >
          {transferMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{transferMessage.text}</span>
        </div>
      )}

      {outPlayer && inPlayer && (
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-sm space-y-2 animate-fade-in">
          <div className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wide">
              <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Preview
            </span>
            <span className={potentialBank >= 0 ? 'text-slate-800 dark:text-slate-200 font-bold' : 'text-rose-600 font-bold'}>
              New Bank: £{potentialBank.toFixed(1)}m
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-rose-500 font-extrabold text-[10px] uppercase bg-rose-500/10 px-1 rounded">OUT</span>
              <span className="font-bold text-slate-800 dark:text-white">{outPlayer.webName}</span>
              <span className="text-slate-400">(£{outPlayer.cost.toFixed(1)}m)</span>
            </div>
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-extrabold text-[10px] uppercase bg-emerald-500/10 px-1 rounded">IN</span>
              <span className="font-bold text-slate-800 dark:text-white">{inPlayer.webName}</span>
              <span className="text-slate-400">(£{inPlayer.cost.toFixed(1)}m)</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setOutPlayerId(null);
                setInPlayerId(null);
              }}
              className="w-1/3 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={potentialBank < 0 || isSquadLocked}
              onClick={handleConfirmTransfer}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                potentialBank >= 0 && !isSquadLocked
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSquadLocked ? 'Locked' : (potentialBank >= 0 ? 'Confirm Transfer' : 'Insufficient Funds')}
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        {/* Step 1: Current Squad (Left 5 Cols on Desktop) */}
        <div className={`md:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs p-3 md:p-3.5 ${isSquadLocked ? 'border-slate-300 dark:border-slate-700 opacity-95' : 'border-slate-200 dark:border-slate-800'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5 tracking-wide">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
              1. My Squad ({squad.players.filter((sp) => Boolean(players[sp.playerId])).length}/9)
            </span>
            {outPlayer && (
              <button
                onClick={() => setOutPlayerId(null)}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
              >
                Clear Selected
              </button>
            )}
          </div>

          {squad.players.length === 0 ? (
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Your squad is empty</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Use your £60.0m budget to buy 9 players from the market.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 md:max-h-[580px] overflow-y-auto pr-1 pb-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-2">
                {squad.players.map((sp) => {
                  const p = players[sp.playerId];
                  if (!p) return null;
                  const isSelected = outPlayerId === p.id;
                  const canSelect = squad.players.filter((item) => Boolean(players[item.playerId])).length === 9 && !isSquadLocked;

                  return (
                    <div
                      key={p.id}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-700 dark:text-rose-300 ring-1 ring-rose-400'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div
                        onClick={() => {
                          if (canSelect) {
                            setOutPlayerId(p.id);
                            setInPlayerId(null);
                          }
                        }}
                        className={`flex items-center gap-2 min-w-0 flex-1 ${canSelect ? 'cursor-pointer hover:opacity-80' : ''}`}
                      >
                        <KitJersey clubId={p.clubId} position={p.position} className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] md:text-xs font-bold truncate text-slate-800 dark:text-slate-100">{p.webName}</div>
                          <div className="text-[9px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">{p.position}</span>
                            <span className="font-bold">£{p.cost.toFixed(1)}m</span>
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={isSquadLocked}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlayer(p.id);
                        }}
                        className={`p-1.5 rounded flex-shrink-0 transition-colors ${
                          isSquadLocked 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                            : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-600'
                        }`}
                        title={isSquadLocked ? 'Locked' : 'Sell player'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {squad.players.filter((sp) => Boolean(players[sp.playerId])).length < 9 && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 text-center pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 font-bold">
                  {9 - squad.players.filter((sp) => Boolean(players[sp.playerId])).length} open slot(s) • £{squad.bank.toFixed(1)}m left
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Transfer In Market (Right 7 Cols on Desktop) */}
        <div className={`md:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs p-3 md:p-3.5 ${isSquadLocked ? 'border-slate-300 dark:border-slate-700 opacity-95' : 'border-slate-200 dark:border-slate-800'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5 tracking-wide">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              2. {outPlayer ? `Replace ${outPlayer.webName} (${outPlayer.position})` : 'Player Market'}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <List className="w-3 h-3" /> List
                </button>
                <button
                  onClick={() => setViewMode('classes')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'classes' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <LayoutGrid className="w-3 h-3" /> Classes
                </button>
              </div>
            </div>
          </div>

          {/* List View Filters */}
          {viewMode === 'list' && (
            <div className="space-y-2 mb-3 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
                  <input
                    type="text"
                    placeholder="Search player or class (e.g. 11/5, Zarno)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="sm:w-auto px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1 text-[10px] font-bold scrollbar-none">
                {(
                  [
                    { id: 'ALL', label: `ALL (${positionCounts.ALL})` },
                    { id: 'GKP', label: `GK (${positionCounts.GKP})` },
                    { id: 'DEF', label: `DEF (${positionCounts.DEF})` },
                    { id: 'MID', label: `MID (${positionCounts.MID})` },
                    { id: 'FWD', label: `FWD (${positionCounts.FWD})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    disabled={!!outPlayer}
                    onClick={() => setPositionFilter(tab.id as Position | 'ALL')}
                    className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                      (outPlayer ? outPlayer.position === tab.id : positionFilter === tab.id)
                        ? 'bg-emerald-500 text-white font-extrabold shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    } ${outPlayer && outPlayer.position !== tab.id ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5">
                  <span className="text-slate-400 font-bold">Team:</span>
                  <select
                    value={clubFilter}
                    onChange={(e) => setClubFilter(e.target.value)}
                    className="bg-transparent text-slate-800 dark:text-slate-200 w-full focus:outline-none font-bold cursor-pointer truncate"
                  >
                    <option value="ALL">All Teams</option>
                    {sortedClubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.shortName} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setAffordableOnly(!affordableOnly)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border font-bold transition-all ${
                    affordableOnly
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Affordable</span>
                  {affordableOnly && <Check className="w-3.5 h-3.5" />}
                </button>

                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5">
                  <ArrowUpDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-transparent text-slate-800 dark:text-slate-200 w-full focus:outline-none font-bold cursor-pointer truncate"
                  >
                    <option value="points_desc">Points: High to Low</option>
                    <option value="cost_desc">Price: High to Low</option>
                    <option value="cost_asc">Price: Low to High</option>
                    <option value="form_desc">Form: High to Low</option>
                    <option value="selected_desc">Ownership: High to Low</option>
                    <option value="name_asc">Name: A to Z</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5 max-h-64 md:max-h-[520px] overflow-y-auto pr-1 pb-2 scroll-smooth">
            {viewMode === 'list' ? (
              candidatePlayers.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">No players found</p>
                  {hasActiveFilters && (
                    <button
                      onClick={handleResetFilters}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors text-white text-xs font-bold shadow-sm"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                candidatePlayers.map((p) => {
                  const isSelected = inPlayerId === p.id;
                  const affordable = outPlayer
                    ? squad.bank + outPlayer.cost >= p.cost
                    : squad.bank >= p.cost;

                  const posLimitReached = !outPlayer && (
                    (p.position === 'GKP' && comp.gkCount >= 1) ||
                    (p.position === 'DEF' && comp.defCount >= 3) ||
                    (p.position === 'MID' && comp.midCount >= 3) ||
                    (p.position === 'FWD' && comp.fwdCount >= 2)
                  );

                  const normClub = (c: string) => (c === 'SCH' ? 'SCH_11_5' : c);
                  const targetClub = normClub(p.clubId);
                  const currentClubCount = squad.players.filter((sp) => {
                    if (outPlayer && sp.playerId === outPlayer.id) return false;
                    const spP = players[sp.playerId];
                    return spP && normClub(spP.clubId) === targetClub;
                  }).length;
                  const classLimitReached = currentClubCount >= 2;
                  const squadFull = squad.players.filter((sp) => Boolean(players[sp.playerId])).length >= 9;

                  let rowClasses = "p-2.5 rounded-xl border flex items-center justify-between transition-all ";
                  let nameClasses = "text-xs md:text-sm font-bold ";
                  let pointerEvents = "cursor-pointer ";

                  if (classLimitReached) {
                    rowClasses += "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 opacity-50 pointer-events-none ";
                    nameClasses += "text-slate-500 line-through ";
                    pointerEvents = "";
                  } else if (!affordable) {
                    rowClasses += "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60 ";
                    nameClasses += "text-slate-900 dark:text-white ";
                  } else if (posLimitReached && !outPlayer) {
                    rowClasses += "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-50 pointer-events-none ";
                    nameClasses += "text-slate-900 dark:text-white ";
                    pointerEvents = "";
                  } else {
                    rowClasses += "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 ";
                    nameClasses += "text-slate-900 dark:text-white ";
                  }

                  if (isSelected) {
                    rowClasses += "ring-1 ring-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm ";
                  }
                  
                  const pClub = clubs?.[p.clubId] || CLUBS[p.clubId];

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleMarketPlayerTap(p, classLimitReached, affordable, squadFull, false)}
                      className={rowClasses + pointerEvents}
                    >
                      <div className="flex items-center space-x-2.5 md:space-x-3">
                        <KitJersey clubId={p.clubId} position={p.position} className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`${nameClasses} truncate`}>{p.webName}</span>
                            {classLimitReached && (
                              <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap">
                                🚫 Class Limit
                              </span>
                            )}
                            <span className="text-[9px] font-bold px-1.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {p.position}
                            </span>
                            <span className="text-[9px] text-slate-400">{pClub?.shortName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {p.totalPoints} pts • {p.selectedByPercent}% sel
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                        {!classLimitReached && !affordable && (
                          <span className="text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded flex items-center gap-0.5 hidden sm:flex">
                            💰 Over Budget
                          </span>
                        )}
                        <span
                          className={`text-xs md:text-sm font-bold block ${
                            affordable ? 'text-slate-800 dark:text-slate-200' : 'text-amber-500'
                          }`}
                        >
                          £{p.cost.toFixed(1)}m
                        </span>

                        {outPlayer ? (
                          isSelected ? (
                            <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">Selected</span>
                          ) : null
                        ) : (
                          <button
                            disabled={isSquadLocked || classLimitReached || (!affordable && !squadFull) || posLimitReached}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarketPlayerTap(p, classLimitReached, affordable, squadFull, false);
                            }}
                            className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[10px] transition-all flex items-center gap-1 ${
                              (!classLimitReached && affordable && !squadFull && !posLimitReached && !isSquadLocked)
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {(!classLimitReached && affordable && !squadFull && !posLimitReached && !isSquadLocked) ? (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Buy</span>
                              </>
                            ) : (
                              <span>{isSquadLocked ? 'Locked' : (classLimitReached ? 'Max' : (squadFull ? 'Buy' : (!affordable ? 'No funds' : 'Pos Full')))}</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-start animate-fade-in">
                {[9, 10, 11, 12].map((grade) => {
                  const gradeClubs = sortedClubs.filter((c) => c.shortName.startsWith(`${grade}/`));
                  if (gradeClubs.length === 0) return null;

                  return (
                    <div key={grade} className="flex flex-col gap-2">
                      <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-1">
                        {grade}th Grade
                      </div>
                      {gradeClubs.map((club) => {
                        const cPlayers = classPlayersMap[club.id] || [];
                        if (outPlayer) {
                          const hasMatch = cPlayers.some(p => p.position === outPlayer.position);
                          if (!hasMatch) return null;
                        }

                        const ownedCount = cPlayers.filter((p) => squadPlayerIds.has(p.id)).length;
                        const maxLimit = ownedCount >= 2;
                        const avgPrice = cPlayers.length > 0
                          ? (cPlayers.reduce((sum, p) => sum + p.cost, 0) / cPlayers.length).toFixed(1)
                          : '0.0';
                        const isExpanded = expandedClass === club.id;

                        return (
                          <div key={club.id} className="flex flex-col">
                            <div
                              onClick={() => setExpandedClass(isExpanded ? null : club.id)}
                              className={`relative p-2.5 rounded-xl border cursor-pointer transition-all shadow-sm ${
                                maxLimit
                                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              } ${isExpanded ? 'ring-1 ring-slate-300 dark:ring-slate-600' : ''}`}
                              style={{ borderLeftWidth: '4px', borderLeftColor: club.primaryColor }}
                            >
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm">{club.shortName}</span>
                                {maxLimit && (
                                  <span className="text-[9px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded shadow-sm">2/2 MAX</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between font-medium">
                                <span>{ownedCount}/{cPlayers.length} owned</span>
                                <span>Avg £{avgPrice}m</span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-2 mb-1 space-y-1.5 animate-fade-in pl-1">
                                {cPlayers.map((p) => {
                                  if (outPlayer && p.position !== outPlayer.position) return null;

                                  const isOwned = squadPlayerIds.has(p.id);
                                  const isSelected = inPlayerId === p.id;
                                  const affordable = outPlayer
                                    ? squad.bank + outPlayer.cost >= p.cost
                                    : squad.bank >= p.cost;

                                  const posLimitReached = !outPlayer && (
                                    (p.position === 'GKP' && comp.gkCount >= 1) ||
                                    (p.position === 'DEF' && comp.defCount >= 3) ||
                                    (p.position === 'MID' && comp.midCount >= 3) ||
                                    (p.position === 'FWD' && comp.fwdCount >= 2)
                                  );

                                  const classLimitReached = maxLimit && !isOwned;
                                  const squadFull = squad.players.filter((sp) => Boolean(players[sp.playerId])).length >= 9;

                                  let badge = null;
                                  let rowClasses = 'flex flex-col p-2 rounded-lg border transition-all ';
                                  let nameClasses = 'text-[11px] font-bold ';

                                  if (isOwned) {
                                    badge = (
                                      <span className="text-[9px] font-bold text-sky-500 bg-sky-50 dark:bg-sky-950 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1.5 w-fit">
                                        📌 Owned
                                      </span>
                                    );
                                    rowClasses += 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70 cursor-not-allowed ';
                                    nameClasses += 'text-slate-800 dark:text-slate-200 ';
                                  } else if (classLimitReached) {
                                    badge = (
                                      <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1.5 w-fit">
                                        🚫 Class Limit
                                      </span>
                                    );
                                    rowClasses += 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 opacity-50 pointer-events-none ';
                                    nameClasses += 'text-slate-500 line-through ';
                                  } else if (!affordable) {
                                    badge = (
                                      <span className="text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1.5 w-fit">
                                        💰 Over Budget
                                      </span>
                                    );
                                    rowClasses += 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60 cursor-pointer ';
                                    nameClasses += 'text-slate-800 dark:text-slate-200 ';
                                  } else if (posLimitReached && !outPlayer) {
                                    badge = (
                                      <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1.5 w-fit">
                                        🚫 Pos Limit
                                      </span>
                                    );
                                    rowClasses += 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-50 pointer-events-none ';
                                    nameClasses += 'text-slate-800 dark:text-slate-200 ';
                                  } else if (squadFull && !outPlayer) {
                                    badge = (
                                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1.5 w-fit">
                                        Squad Full
                                      </span>
                                    );
                                    rowClasses += 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-400 ';
                                    nameClasses += 'text-slate-800 dark:text-slate-200 ';
                                  } else {
                                    badge = (
                                      <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1.5 w-fit">
                                        ✅ Available
                                      </span>
                                    );
                                    rowClasses += 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-500/60 shadow-sm hover:shadow ';
                                    nameClasses += 'text-slate-800 dark:text-slate-200 ';
                                  }

                                  if (isSelected) {
                                    rowClasses += 'ring-1 ring-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 ';
                                  }

                                  return (
                                    <div
                                      key={p.id}
                                      className={rowClasses}
                                      onClick={() => handleMarketPlayerTap(p, classLimitReached, affordable, squadFull, isOwned)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <KitJersey clubId={p.clubId} position={p.position} className="w-6 h-6 flex-shrink-0" />
                                        <div className="flex flex-col min-w-0 flex-1">
                                          <span className={`${nameClasses} truncate`}>{p.webName}</span>
                                          <div className="flex items-center justify-between mt-0.5">
                                            <span className="text-[8px] font-bold px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                              {p.position}
                                            </span>
                                            <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold">£{p.cost.toFixed(1)}m</span>
                                          </div>
                                        </div>
                                      </div>
                                      {badge}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

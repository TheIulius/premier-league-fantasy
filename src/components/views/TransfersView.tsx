import React, { useState, useMemo } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Position, Player } from '../../types/fpl';
import { CLUBS } from '../../data/clubs';
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
  const {
    players,
    clubs,
    squad,
    transferPlayer,
    buyPlayer,
    removePlayer,
    freeTransfersRemaining,
  } = useFPL();

  const [outPlayerId, setOutPlayerId] = useState<string | null>(null);
  const [inPlayerId, setInPlayerId] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState<Position | 'ALL'>('ALL');
  const [clubFilter, setClubFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('points_desc');
  const [affordableOnly, setAffordableOnly] = useState<boolean>(false);
  const [transferMessage, setTransferMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const availableClubs = useMemo(() => {
    const clubIds = new Set<string>();
    Object.values(players).forEach((p) => {
      if (p.clubId) clubIds.add(p.clubId);
    });
    return Array.from(clubIds)
      .map((cid) => ({
        id: cid,
        name: clubs?.[cid]?.name || CLUBS[cid]?.name || cid,
        shortName: clubs?.[cid]?.shortName || CLUBS[cid]?.shortName || cid,
      }))
      .sort((a, b) => a.shortName.localeCompare(b.shortName));
  }, [players, clubs]);

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
        return p.clubId === clubFilter;
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
      {/* Transfer Metrics & Quick Status Bar */}
      <div className="p-2.5 md:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
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

          {/* Squad Status toggle button */}
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

        {/* Collapsible squad requirements breakdown */}
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
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                Max 2 players from the same class exceeded in: {comp.exceededClubs.map((ec) => `${ec.clubId.replace('SCH_', '')}`).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transfer Notification Banner */}
      {transferMessage && (
        <div
          className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
            transferMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
          }`}
        >
          {transferMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{transferMessage.text}</span>
        </div>
      )}

      {/* Active Transfer Comparison Card */}
      {outPlayer && inPlayer && (
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-sm space-y-2">
          <div className="text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
              <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Preview
            </span>
            <span className={potentialBank >= 0 ? 'text-slate-800 dark:text-slate-200 font-bold' : 'text-rose-600 font-bold'}>
              New Bank: £{potentialBank.toFixed(1)}m
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-rose-600 font-extrabold text-[10px] uppercase">OUT</span>
              <span className="font-bold text-slate-800 dark:text-white">{outPlayer.webName}</span>
              <span className="text-slate-400">(£{outPlayer.cost.toFixed(1)}m)</span>
            </div>
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-extrabold text-[10px] uppercase">IN</span>
              <span className="font-bold text-slate-800 dark:text-white">{inPlayer.webName}</span>
              <span className="text-slate-400">(£{inPlayer.cost.toFixed(1)}m)</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setOutPlayerId(null);
                setInPlayerId(null);
              }}
              className="w-1/3 py-2 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              disabled={potentialBank < 0}
              onClick={handleConfirmTransfer}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                potentialBank >= 0
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              {potentialBank >= 0 ? 'Confirm Transfer' : 'Insufficient Funds'}
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        {/* Step 1: Current Squad (Left 5 Cols on Desktop) */}
        <div className="md:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-3 md:p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
              1. My Squad ({squad.players.filter((sp) => Boolean(players[sp.playerId])).length}/9)
            </span>
            {outPlayer && (
              <button
                onClick={() => setOutPlayerId(null)}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {squad.players.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Your squad is empty</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Use your £60.0m budget to buy 9 players from the market.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 md:max-h-[580px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-1.5">
                {squad.players.map((sp) => {
                  const p = players[sp.playerId];
                  if (!p) return null;
                  const isSelected = outPlayerId === p.id;

                  return (
                    <div
                      key={p.id}
                      className={`p-1.5 md:p-2 rounded-xl border text-left flex items-center justify-between gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-700 dark:text-rose-300 ring-1 ring-rose-400'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div
                        onClick={() => {
                          if (squad.players.filter((item) => Boolean(players[item.playerId])).length === 9) {
                            setOutPlayerId(p.id);
                            setInPlayerId(null);
                          }
                        }}
                        className={`flex items-center gap-1.5 min-w-0 flex-1 ${squad.players.filter((item) => Boolean(players[item.playerId])).length === 9 ? 'cursor-pointer hover:opacity-80' : ''}`}
                      >
                        <KitJersey clubId={p.clubId} position={p.position} className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] md:text-xs font-bold truncate text-slate-800 dark:text-slate-100">{p.webName}</div>
                          <div className="text-[9px] text-slate-400 flex items-center gap-1">
                            <span className="px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">{p.position}</span>
                            <span>£{p.cost.toFixed(1)}m</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlayer(p.id);
                        }}
                        className="p-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-600 text-[10px] flex-shrink-0"
                        title="Sell player"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {squad.players.filter((sp) => Boolean(players[sp.playerId])).length < 9 && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 text-center pt-1 border-t border-slate-100 dark:border-slate-800 font-bold">
                  {9 - squad.players.filter((sp) => Boolean(players[sp.playerId])).length} open slot(s) • £{squad.bank.toFixed(1)}m left
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Transfer In Market (Right 7 Cols on Desktop) */}
        <div className="md:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-3 md:p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              2. {outPlayer ? `Replace ${outPlayer.webName} (${outPlayer.position})` : 'Player Market'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-medium">
                {candidatePlayers.length} available
              </span>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Filters, Search & Sorting Controls */}
          <div className="space-y-1.5 mb-2.5 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search player or class (e.g. 11/5, Zarno)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-7 pr-7 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Position Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] font-bold scrollbar-none">
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
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                    (outPlayer ? outPlayer.position === tab.id : positionFilter === tab.id)
                      ? 'bg-emerald-500 text-white font-extrabold shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-Filters: Team, Affordable, Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px]">
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1">
                <span className="text-slate-400 font-medium">Team:</span>
                <select
                  value={clubFilter}
                  onChange={(e) => setClubFilter(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-200 w-full focus:outline-none font-semibold cursor-pointer truncate"
                >
                  <option value="ALL">All Teams</option>
                  {availableClubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortName} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setAffordableOnly(!affordableOnly)}
                className={`flex items-center justify-center gap-1 px-2 py-1 rounded-lg border font-bold transition-all ${
                  affordableOnly
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <Coins className="w-3 h-3 text-emerald-500" />
                <span>Affordable</span>
                {affordableOnly && <Check className="w-3 h-3" />}
              </button>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1">
                <ArrowUpDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-200 w-full focus:outline-none font-semibold cursor-pointer truncate"
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

          {/* Candidate Players List */}
          <div className="space-y-1 max-h-64 md:max-h-[520px] overflow-y-auto pr-1">
            {candidatePlayers.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-1.5">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">No players found</p>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold"
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

                const posLimitReached =
                  (p.position === 'GKP' && comp.gkCount >= 1) ||
                  (p.position === 'DEF' && comp.defCount >= 3) ||
                  (p.position === 'MID' && comp.midCount >= 3) ||
                  (p.position === 'FWD' && comp.fwdCount >= 2);

                const normClub = (c: string) => (c === 'SCH' ? 'SCH_11_5' : c);
                const targetClub = normClub(p.clubId);
                const currentClubCount = squad.players.filter((sp) => {
                  if (outPlayer && sp.playerId === outPlayer.id) return false;
                  const spP = players[sp.playerId];
                  return spP && normClub(spP.clubId) === targetClub;
                }).length;
                const classLimitReached = currentClubCount >= 2;

                const buyBlockReason =
                  posLimitReached
                    ? `${p.position === 'GKP' ? 'GK' : p.position} Full`
                    : classLimitReached
                    ? 'Max 2/Class'
                    : squad.players.filter((sp) => Boolean(players[sp.playerId])).length >= 9
                    ? 'Squad Full'
                    : squad.bank < p.cost
                    ? 'No funds'
                    : null;

                const canBuyDirect = !buyBlockReason;
                const pClub = clubs?.[p.clubId] || CLUBS[p.clubId];

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (outPlayer && !classLimitReached && affordable) setInPlayerId(p.id);
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                      outPlayer ? (classLimitReached || !affordable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-500/50') : ''
                    } ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 md:space-x-2.5">
                      <KitJersey clubId={p.clubId} position={p.position} className="w-6 h-6 md:w-7 md:h-7" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">{p.webName}</span>
                          <span className="text-[9px] font-bold px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {p.position}
                          </span>
                          <span className="text-[9px] text-slate-400">{pClub?.shortName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.totalPoints} pts • {p.selectedByPercent}% sel
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs md:text-sm font-bold block ${
                          affordable ? 'text-slate-800 dark:text-slate-200' : 'text-rose-500'
                        }`}
                      >
                        £{p.cost.toFixed(1)}m
                      </span>

                      {outPlayer ? (
                        isSelected ? (
                          <span className="text-[9px] font-bold text-emerald-600 uppercase">Selected</span>
                        ) : classLimitReached ? (
                          <span className="text-[9px] font-bold text-amber-500 uppercase">Class Max</span>
                        ) : !affordable ? (
                          <span className="text-[9px] font-bold text-rose-500 uppercase">No funds</span>
                        ) : null
                      ) : (
                        <button
                          disabled={!canBuyDirect}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyPlayer(p.id);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[10px] transition-all flex items-center gap-1 ${
                            canBuyDirect
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {canBuyDirect ? (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Buy</span>
                            </>
                          ) : (
                            <span>{buyBlockReason}</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

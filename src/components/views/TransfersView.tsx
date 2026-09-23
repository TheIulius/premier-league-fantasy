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
  ArrowDownRight,
  Shield,
  CheckCircle,
  Plus,
  Trash2,
  ShoppingBag,
  Sparkles,
  X,
  RotateCcw,
  ArrowUpDown,
  Coins,
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

  const outPlayer = outPlayerId ? players[outPlayerId] : null;
  const inPlayer = inPlayerId ? players[inPlayerId] : null;

  // Calculate potential bank after transfer
  const potentialBank = useMemo(() => {
    if (!outPlayer || !inPlayer) return squad.bank;
    return Math.round((squad.bank + outPlayer.cost - inPlayer.cost) * 10) / 10;
  }, [outPlayer, inPlayer, squad.bank]);

  // Filter available players for transfer
  const squadPlayerIds = useMemo(() => new Set(squad.players.map((p) => p.playerId)), [squad.players]);

  // Available clubs that have players in the market
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

  // Position counts in the market
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
      .filter((p) => !squadPlayerIds.has(p.id)) // Not currently in squad
      .filter((p) => {
        // If outPlayer is selected, restrict candidate list to matching position
        if (outPlayer) return p.position === outPlayer.position;
        if (positionFilter !== 'ALL') return p.position === positionFilter;
        return true;
      })
      .filter((p) => (clubFilter === 'ALL' ? true : p.clubId === clubFilter))
      .filter((p) => {
        if (!affordableOnly) return true;
        const maxSpend = outPlayer ? squad.bank + outPlayer.cost : squad.bank;
        return p.cost <= maxSpend;
      })
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = p.name.toLowerCase().includes(q);
        const webNameMatch = p.webName.toLowerCase().includes(q);
        const clubObj = clubs?.[p.clubId] || CLUBS[p.clubId];
        const clubMatch =
          clubObj?.name.toLowerCase().includes(q) || clubObj?.shortName.toLowerCase().includes(q);
        return nameMatch || webNameMatch || !!clubMatch;
      })
      .sort((a, b) => {
        if (sortBy === 'cost_desc') return b.cost - a.cost;
        if (sortBy === 'cost_asc') return a.cost - b.cost;
        if (sortBy === 'form_desc') return (b.form || 0) - (a.form || 0);
        if (sortBy === 'selected_desc') return b.selectedByPercent - a.selectedByPercent;
        if (sortBy === 'name_asc') return a.webName.localeCompare(b.webName);
        // Default: points_desc
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return b.cost - a.cost;
      });
  }, [
    players,
    squadPlayerIds,
    outPlayer,
    positionFilter,
    clubFilter,
    affordableOnly,
    searchQuery,
    sortBy,
    clubs,
    squad.bank,
  ]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    positionFilter !== 'ALL' ||
    clubFilter !== 'ALL' ||
    affordableOnly ||
    sortBy !== 'points_desc';

  const handleResetFilters = () => {
    setSearchQuery('');
    if (!outPlayer) setPositionFilter('ALL');
    setClubFilter('ALL');
    setAffordableOnly(false);
    setSortBy('points_desc');
  };

  const handleConfirmTransfer = () => {
    if (!outPlayerId || !inPlayerId) return;

    const res = transferPlayer(outPlayerId, inPlayerId);
    if (res.success) {
      setTransferMessage({ type: 'success', text: `Transferred ${outPlayer?.webName} for ${inPlayer?.webName} successfully!` });
      setOutPlayerId(null);
      setInPlayerId(null);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#00ff87', '#04f5ff'],
      });
    } else {
      setTransferMessage({ type: 'error', text: res.message || 'Transfer failed' });
    }

    setTimeout(() => setTransferMessage(null), 4000);
  };

  const handleBuyPlayer = (playerId: string) => {
    const p = players[playerId];
    const res = buyPlayer(playerId);
    if (res.success) {
      setTransferMessage({
        type: 'success',
        text: `Bought ${p?.webName || 'player'} for £${p?.cost.toFixed(1)}m!`,
      });
      confetti({
        particleCount: 35,
        spread: 45,
        origin: { y: 0.6 },
        colors: ['#00ff87', '#04f5ff'],
      });
    } else {
      setTransferMessage({ type: 'error', text: res.message || 'Failed to buy player' });
    }
    setTimeout(() => setTransferMessage(null), 4000);
  };

  const handleRemovePlayer = (playerId: string) => {
    const p = players[playerId];
    const res = removePlayer(playerId);
    if (res.success) {
      setTransferMessage({
        type: 'success',
        text: `Sold ${p?.webName || 'player'} (+£${p?.cost.toFixed(1)}m refunded to bank)`,
      });
      if (outPlayerId === playerId) setOutPlayerId(null);
    } else {
      setTransferMessage({ type: 'error', text: res.message || 'Failed to remove player' });
    }
    setTimeout(() => setTransferMessage(null), 4000);
  };

  return (
    <div className="flex flex-col space-y-3 pb-24 md:pb-12 px-2 md:px-6 pt-2 md:pt-4 select-none max-w-5xl lg:max-w-6xl mx-auto w-full">
      {/* Transfer Metrics Bar */}
      <div className="p-2.5 md:p-4 rounded-xl bg-[#2a002e] border border-[#4d0c54] flex flex-col gap-2 text-xs md:text-sm">
        <div className="grid grid-cols-4 gap-1.5 md:gap-4 text-center">
          <div>
            <span className="text-[10px] md:text-xs text-gray-400 uppercase font-bold block">Budget</span>
            <span className="text-sm md:text-base font-black text-white">£60.0m</span>
          </div>
          <div>
            <span className="text-[10px] md:text-xs text-gray-400 uppercase font-bold block">In Bank</span>
            <span className="text-sm md:text-base font-black text-white">£{squad.bank.toFixed(1)}m</span>
          </div>
          <div>
            <span className="text-[10px] md:text-xs text-gray-400 uppercase font-bold block">Free Transf.</span>
            <span className="text-sm md:text-base font-black text-[#00ff87]">{freeTransfersRemaining}</span>
          </div>
          <div>
            <span className="text-[10px] md:text-xs text-gray-400 uppercase font-bold block">Cost Next</span>
            <span className="text-sm md:text-base font-black text-[#e90052]">
              {freeTransfersRemaining > 0 ? '0 pts' : '-4 pts'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px] md:text-xs text-gray-400">
          <span className="font-bold text-[#00ff87]">6 Starters • 3 Bench Reserves • Max 2 per Class</span>
          <span className="text-gray-300">Bank is governed by Starting 6</span>
        </div>
      </div>

      {/* Class Limit Violation Banner if any */}
      {comp.exceededClubs && comp.exceededClubs.length > 0 && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>
            <strong>Class Limit Violation:</strong> Maximum 2 players allowed from the same class. Exceeded in: {comp.exceededClubs.map((ec) => `${ec.clubId.replace('SCH_', '')} (${ec.count}/2)`).join(', ')}. Sell excess players to fix.
          </span>
        </div>
      )}

      {/* Position Requirements Bar */}
      <div className="p-2.5 md:p-4 rounded-xl bg-[#230026] border border-[#520d5a] flex flex-col gap-1.5 text-xs md:text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] md:text-xs font-black uppercase text-gray-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#00ff87]" />
            Squad Composition Requirements
          </span>
          {comp.isValid ? (
            <span className="text-[10px] md:text-xs font-extrabold text-[#00ff87] flex items-center gap-1 bg-[#00ff87]/15 px-2 py-0.5 rounded-full border border-[#00ff87]/30">
              <CheckCircle className="w-3 h-3" /> 100% Complete
            </span>
          ) : (
            <span className="text-[10px] md:text-xs font-extrabold text-[#e90052] flex items-center gap-1 bg-[#e90052]/15 px-2 py-0.5 rounded-full border border-[#e90052]/30">
              <AlertCircle className="w-3 h-3" /> Incomplete
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5 md:gap-3 text-center pt-1 border-t border-white/5">
          <div className={`p-1.5 md:p-2.5 rounded-lg border ${comp.gkCount === 1 ? 'bg-[#00ff87]/10 border-[#00ff87]/40 text-[#00ff87]' : 'bg-red-500/10 border-red-500/40 text-red-400'}`}>
            <span className="text-[9px] md:text-[10px] uppercase font-bold block">1 GK</span>
            <span className="text-xs md:text-sm font-black">{comp.gkCount}/1</span>
          </div>
          <div className={`p-1.5 md:p-2.5 rounded-lg border ${comp.defCount === 3 ? 'bg-[#00ff87]/10 border-[#00ff87]/40 text-[#00ff87]' : 'bg-red-500/10 border-red-500/40 text-red-400'}`}>
            <span className="text-[9px] md:text-[10px] uppercase font-bold block">3 DEF (mcveli)</span>
            <span className="text-xs md:text-sm font-black">{comp.defCount}/3</span>
          </div>
          <div className={`p-1.5 md:p-2.5 rounded-lg border ${comp.midCount === 3 ? 'bg-[#00ff87]/10 border-[#00ff87]/40 text-[#00ff87]' : 'bg-red-500/10 border-red-500/40 text-red-400'}`}>
            <span className="text-[9px] md:text-[10px] uppercase font-bold block">3 MID</span>
            <span className="text-xs md:text-sm font-black">{comp.midCount}/3</span>
          </div>
          <div className={`p-1.5 md:p-2.5 rounded-lg border ${comp.fwdCount === 2 ? 'bg-[#00ff87]/10 border-[#00ff87]/40 text-[#00ff87]' : 'bg-red-500/10 border-red-500/40 text-red-400'}`}>
            <span className="text-[9px] md:text-[10px] uppercase font-bold block">2 FWD</span>
            <span className="text-xs md:text-sm font-black">{comp.fwdCount}/2</span>
          </div>
        </div>

        {!comp.isValid && (
          <div className="p-2 md:p-2.5 rounded-lg bg-[#e90052]/20 border border-[#e90052]/40 text-[#e90052] text-[10px] md:text-xs font-bold flex items-center gap-1.5 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>You can't play! Must have exact counts: 1 GK, 3 Defenders (mcveli), 3 Midfielders, and 2 Forwards bought.</span>
          </div>
        )}
      </div>

      {/* Transfer Notification banner */}
      {transferMessage && (
        <div
          className={`p-2.5 md:p-3.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 ${
            transferMessage.type === 'success'
              ? 'bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/40'
              : 'bg-[#e90052]/20 text-[#e90052] border border-[#e90052]/40'
          }`}
        >
          {transferMessage.type === 'success' ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />}
          <span>{transferMessage.text}</span>
        </div>
      )}

      {/* Comparison / Confirmation Card */}
      {outPlayer && inPlayer && (
        <div className="p-3 md:p-4 rounded-xl bg-gradient-to-r from-[#2c0230] to-[#1e0022] border border-[#00ff87]/40 shadow-xl">
          <div className="text-[11px] md:text-xs font-black uppercase text-gray-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#00ff87]">
              <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Summary
            </span>
            <span className={potentialBank >= 0 ? 'text-white font-bold' : 'text-red-400 font-bold'}>
              New Bank: £{potentialBank.toFixed(1)}m
            </span>
          </div>

          <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-lg text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-bold text-[10px] md:text-xs uppercase">OUT</span>
              <span className="font-bold text-white">{outPlayer.webName}</span>
              <span className="text-gray-400">(£{outPlayer.cost.toFixed(1)}m)</span>
            </div>
            <ArrowLeftRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
            <div className="flex items-center gap-2">
              <span className="text-[#00ff87] font-bold text-[10px] md:text-xs uppercase">IN</span>
              <span className="font-bold text-white">{inPlayer.webName}</span>
              <span className="text-gray-400">(£{inPlayer.cost.toFixed(1)}m)</span>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                setOutPlayerId(null);
                setInPlayerId(null);
              }}
              className="w-1/3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold text-gray-400 bg-white/5 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              disabled={potentialBank < 0}
              onClick={handleConfirmTransfer}
              className={`flex-1 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider transition-all ${
                potentialBank >= 0
                  ? 'bg-gradient-to-r from-[#00ff87] to-[#00cc6a] text-[#37003c] shadow-glow-green'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {potentialBank >= 0 ? 'Confirm Transfer' : 'Insufficient Funds'}
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Responsive Grid for Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-start">
        {/* Step 1: Current Squad & Management (Left 5 Cols on Desktop) */}
        <div className="md:col-span-5 rounded-xl bg-[#230026] border border-white/10 p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm font-black uppercase text-gray-300 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#00ff87]" />
              1. My Squad ({squad.players.filter((sp) => Boolean(players[sp.playerId])).length}/9)
            </span>
            {outPlayer && (
              <button
                onClick={() => setOutPlayerId(null)}
                className="text-[10px] md:text-xs text-gray-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {squad.players.length === 0 ? (
            <div className="p-4 rounded-lg bg-black/30 border border-dashed border-white/15 text-center space-y-1.5">
              <span className="text-xs font-bold text-gray-300 block">Your squad is currently empty!</span>
              <p className="text-[11px] text-gray-400">
                Use your <strong className="text-[#00ff87]">£60.0m budget</strong> to buy 1 GK, 3 Defenders, 3 Midfielders, and 2 Forwards from the market.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 md:max-h-[580px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-1.5 md:gap-2">
                {squad.players.map((sp) => {
                  const p = players[sp.playerId];
                  if (!p) return null;
                  const isSelected = outPlayerId === p.id;

                  return (
                    <div
                      key={p.id}
                      className={`p-1.5 md:p-2 rounded-lg border text-left flex items-center justify-between gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-red-500/20 border-red-500 text-white font-bold ring-1 ring-red-500'
                          : 'bg-white/5 border-white/10 text-gray-300'
                      }`}
                    >
                      <div
                        onClick={() => {
                          if (squad.players.filter((sp) => Boolean(players[sp.playerId])).length === 9) {
                            setOutPlayerId(p.id);
                            setInPlayerId(null);
                          }
                        }}
                        className={`flex items-center gap-1.5 min-w-0 flex-1 ${squad.players.filter((sp) => Boolean(players[sp.playerId])).length === 9 ? 'cursor-pointer hover:opacity-80' : ''}`}
                      >
                        <KitJersey clubId={p.clubId} position={p.position} className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] md:text-xs font-bold truncate">{p.webName}</div>
                          <div className="text-[9px] md:text-[10px] text-gray-400 flex items-center gap-1">
                            <span className="px-1 rounded bg-white/10 text-gray-300 font-bold">{p.position}</span>
                            <span>£{p.cost.toFixed(1)}m</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlayer(p.id);
                        }}
                        className="p-1 md:p-1.5 rounded bg-red-500/10 hover:bg-red-500/30 text-red-400 text-[10px] flex-shrink-0"
                        title="Sell player (refund to bank)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {squad.players.filter((sp) => Boolean(players[sp.playerId])).length < 9 && (
                <div className="text-[10px] md:text-xs text-[#00ff87] text-center pt-1 border-t border-white/5 font-bold">
                  {9 - squad.players.filter((sp) => Boolean(players[sp.playerId])).length} open slot(s) remaining • £{squad.bank.toFixed(1)}m in bank
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Transfer In Replacement Market (Right 7 Cols on Desktop) */}
        <div className="md:col-span-7 rounded-xl bg-[#230026] border border-white/10 p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm font-black uppercase text-gray-200 flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-[#00ff87]" />
              2. Choose Replacement ({outPlayer ? outPlayer.position : 'Market'})
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] md:text-xs text-gray-400 font-bold">
                {candidatePlayers.length} available
              </span>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-[10px] md:text-xs font-bold text-[#00ff87] hover:underline flex items-center gap-1 bg-[#00ff87]/10 px-2 py-0.5 rounded-full border border-[#00ff87]/20 transition-colors"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Filters, Search & Sorting Controls */}
          <div className="space-y-2 mb-3 bg-black/30 p-2.5 rounded-xl border border-white/5">
            {/* Search Bar with Instant Clear Button */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search by player or team name (e.g. 11/1, Futkara)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg pl-8 pr-8 py-1.5 md:py-2 text-xs md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Position Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px] md:text-xs font-bold scrollbar-none">
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
                  className={`px-2.5 py-1 md:py-1.5 rounded-md whitespace-nowrap transition-colors ${
                    (outPlayer ? outPlayer.position === tab.id : positionFilter === tab.id)
                      ? 'bg-[#00ff87] text-[#37003c] font-black shadow-glow-green'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filtration & Sorting Row: Team Dropdown, Affordable Toggle, and Sort By */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 md:gap-2 pt-1 border-t border-white/10 text-[10px] md:text-xs">
              {/* Team Filter */}
              <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1">
                <span className="text-gray-400 font-bold whitespace-nowrap">Team:</span>
                <select
                  value={clubFilter}
                  onChange={(e) => setClubFilter(e.target.value)}
                  className="bg-transparent text-white w-full focus:outline-none font-semibold cursor-pointer truncate"
                >
                  <option value="ALL" className="bg-[#1f0022] text-white">All Teams</option>
                  {availableClubs.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#1f0022] text-white">
                      {c.shortName} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Affordable Only Toggle */}
              <button
                type="button"
                onClick={() => setAffordableOnly(!affordableOnly)}
                className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg border font-bold transition-all ${
                  affordableOnly
                    ? 'bg-[#00ff87]/20 border-[#00ff87] text-[#00ff87] shadow-xs'
                    : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Coins className="w-3 h-3 text-[#00ff87]" />
                <span>Affordable Only</span>
                {affordableOnly && <Check className="w-3 h-3 text-[#00ff87]" />}
              </button>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1">
                <ArrowUpDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent text-white w-full focus:outline-none font-semibold cursor-pointer truncate"
                >
                  <option value="points_desc" className="bg-[#1f0022] text-white">Points: High to Low</option>
                  <option value="cost_desc" className="bg-[#1f0022] text-white">Price: High to Low</option>
                  <option value="cost_asc" className="bg-[#1f0022] text-white">Price: Low to High</option>
                  <option value="form_desc" className="bg-[#1f0022] text-white">Form: High to Low</option>
                  <option value="selected_desc" className="bg-[#1f0022] text-white">Ownership: High to Low</option>
                  <option value="name_asc" className="bg-[#1f0022] text-white">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Candidate Players List */}
          <div className="space-y-1.5 max-h-64 md:max-h-[520px] overflow-y-auto pr-1">
            {candidatePlayers.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl bg-black/20 border border-dashed border-white/10 space-y-2">
                <p className="text-xs md:text-sm text-gray-400 font-bold">No players found matching your filters.</p>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="px-3 py-1.5 rounded-lg bg-[#00ff87] text-[#37003c] text-xs font-black shadow-glow-green hover:opacity-90"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              candidatePlayers.map((p) => {
                const isSelected = inPlayerId === p.id;
                const isStarterOut = outPlayer ? squad.players.find((sp) => sp.playerId === outPlayer.id)?.isStarter : true;
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
                    ? 'Class Limit (2/2)'
                    : squad.players.filter((sp) => Boolean(players[sp.playerId])).length >= 9
                    ? 'Squad Full (9/9)'
                    : squad.bank < p.cost
                    ? 'No funds'
                    : null;

                const canBuyDirect = !buyBlockReason;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (outPlayer && !classLimitReached && affordable) setInPlayerId(p.id);
                    }}
                    className={`p-2 md:p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                      outPlayer ? (classLimitReached || !affordable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#00ff87]/50') : ''
                    } ${
                      isSelected
                        ? 'bg-[#00ff87]/20 border-[#00ff87] ring-1 ring-[#00ff87]'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 md:space-x-3">
                      <KitJersey clubId={p.clubId} position={p.position} className="w-7 h-7 md:w-8 md:h-8" />
                      <div>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <span className="text-xs md:text-sm font-black text-white">{p.webName}</span>
                          <span className="text-[9px] md:text-[10px] font-bold px-1 rounded bg-white/10 text-gray-300">
                            {p.position}
                          </span>
                          <span className="text-[9px] md:text-[10px] text-gray-400">{CLUBS[p.clubId]?.shortName}</span>
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                          {p.totalPoints} pts • {p.selectedByPercent}% sel
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                      <span
                        className={`text-xs md:text-sm font-black block ${
                          affordable ? 'text-white' : 'text-red-400'
                        }`}
                      >
                        £{p.cost.toFixed(1)}m
                      </span>

                      {outPlayer ? (
                        isSelected ? (
                          <span className="text-[9px] md:text-xs font-black text-[#00ff87] uppercase">Selected</span>
                        ) : classLimitReached ? (
                          <span className="text-[9px] md:text-xs font-bold text-yellow-400 uppercase">Max 2 / Class</span>
                        ) : !affordable ? (
                          <span className="text-[9px] md:text-xs font-bold text-red-400 uppercase">No funds</span>
                        ) : null
                      ) : (
                        <button
                          disabled={!canBuyDirect}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyPlayer(p.id);
                          }}
                          className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg font-black uppercase text-[10px] md:text-xs transition-all flex items-center gap-1 ${
                            canBuyDirect
                              ? 'bg-[#00ff87] text-[#37003c] shadow-glow-green hover:opacity-95'
                              : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                          }`}
                        >
                          {canBuyDirect ? (
                            <>
                              <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
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

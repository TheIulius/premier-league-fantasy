import React, { useState, useMemo } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Position, Player } from '../../types/fpl';
import { CLUBS } from '../../data/clubs';
import { KitJersey } from '../pitch/KitJersey';
import { ArrowLeftRight, Search, Check, AlertCircle, ArrowUpRight, ArrowDownRight, Shield, CheckCircle } from 'lucide-react';
import { validateSquadComposition } from '../../engine/scoring';
import confetti from 'canvas-confetti';

export const TransfersView: React.FC = () => {
  const {
    players,
    squad,
    transferPlayer,
    freeTransfersRemaining,
  } = useFPL();

  const [outPlayerId, setOutPlayerId] = useState<string | null>(null);
  const [inPlayerId, setInPlayerId] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState<Position | 'ALL'>('ALL');
  const [clubFilter, setClubFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'cost' | 'points' | 'selected'>('points');
  const [transferMessage, setTransferMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const comp = useMemo(() => validateSquadComposition(squad.players, players), [squad.players, players]);

  const outPlayer = outPlayerId ? players[outPlayerId] : null;
  const inPlayer = inPlayerId ? players[inPlayerId] : null;

  // Calculate potential bank after transfer
  const potentialBank = useMemo(() => {
    if (!outPlayer || !inPlayer) return squad.bank;
    const isStarter = squad.players.find((sp) => sp.playerId === outPlayer.id)?.isStarter;
    if (!isStarter) return squad.bank;
    return Math.round((squad.bank + outPlayer.cost - inPlayer.cost) * 10) / 10;
  }, [outPlayer, inPlayer, squad.bank, squad.players]);

  // Filter available players for transfer
  const squadPlayerIds = useMemo(() => new Set(squad.players.map((p) => p.playerId)), [squad.players]);

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
      .filter((p) =>
        searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.webName.toLowerCase().includes(searchQuery.toLowerCase()) : true
      )
      .sort((a, b) => {
        if (sortBy === 'cost') return b.cost - a.cost;
        if (sortBy === 'selected') return b.selectedByPercent - a.selectedByPercent;
        return b.totalPoints - a.totalPoints;
      });
  }, [players, squadPlayerIds, outPlayer, positionFilter, clubFilter, searchQuery, sortBy]);

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

  return (
    <div className="flex flex-col space-y-3 pb-24 px-2 pt-2 select-none">
      {/* Transfer Metrics Bar */}
      <div className="p-2.5 rounded-xl bg-[#2a002e] border border-[#4d0c54] flex flex-col gap-2 text-xs">
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Budget</span>
            <span className="text-sm font-black text-white">£60.0m</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold block">In Bank</span>
            <span className="text-sm font-black text-white">£{squad.bank.toFixed(1)}m</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Free Transf.</span>
            <span className="text-sm font-black text-[#00ff87]">{freeTransfersRemaining}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Cost Next</span>
            <span className="text-sm font-black text-[#e90052]">
              {freeTransfersRemaining > 0 ? '0 pts' : '-4 pts'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px] text-gray-400">
          <span className="font-bold text-[#00ff87]">6 Starters • 3 Bench Reserves</span>
          <span className="text-gray-300">Bank is governed by Starting 6</span>
        </div>
      </div>

      {/* Position Requirements Bar */}
      <div className="p-2.5 rounded-xl bg-[#230026] border border-[#520d5a] flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-gray-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#00ff87]" />
            Squad Composition Requirements
          </span>
          {comp.isValid ? (
            <span className="text-[10px] font-extrabold text-[#00ff87] flex items-center gap-1 bg-[#00ff87]/15 px-2 py-0.5 rounded-full border border-[#00ff87]/30">
              <CheckCircle className="w-3 h-3" /> 100% Complete
            </span>
          ) : (
            <span className="text-[10px] font-extrabold text-[#e90052] flex items-center gap-1 bg-[#e90052]/15 px-2 py-0.5 rounded-full border border-[#e90052]/30">
              <AlertCircle className="w-3 h-3" /> Incomplete
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-center pt-1 border-t border-white/5">
          <div className={`p-1.5 rounded-lg border ${comp.gkCount === 1 ? 'bg-[#00ff87]/10 border-[#00ff87]/40 text-[#00ff87]' : 'bg-red-500/10 border-red-500/40 text-red-400'}`}>
            <span className="text-[9px] uppercase font-bold block">1 GK</span>
            <span className="text-xs font-black">{comp.gkCount}/1</span>
          </div>
          <div className={`p-1.5 rounded-lg border ${comp.defCount === 3 ? 'bg-[#00ff87]/10 border-[#00ff87]/40 text-[#00ff87]' : 'bg-red-500/10 border-red-500/40 text-red-400'}`}>
            <span className="text-[9px] uppercase font-bold block">3 DEF (mcveli)</span>
            <span className="text-xs font-black">{comp.defCount}/3</span>
          </div>
          <div className={`p-1.5 rounded-lg border ${comp.midCount === 3 ? 'bg-[#00ff87]/10 border-[#00ff87]/40 text-[#00ff87]' : 'bg-red-500/10 border-red-500/40 text-red-400'}`}>
            <span className="text-[9px] uppercase font-bold block">3 MID</span>
            <span className="text-xs font-black">{comp.midCount}/3</span>
          </div>
          <div className={`p-1.5 rounded-lg border ${comp.fwdCount === 2 ? 'bg-[#00ff87]/10 border-[#00ff87]/40 text-[#00ff87]' : 'bg-red-500/10 border-red-500/40 text-red-400'}`}>
            <span className="text-[9px] uppercase font-bold block">2 FWD</span>
            <span className="text-xs font-black">{comp.fwdCount}/2</span>
          </div>
        </div>

        {!comp.isValid && (
          <div className="p-2 rounded-lg bg-[#e90052]/20 border border-[#e90052]/40 text-[#e90052] text-[10px] font-bold flex items-center gap-1.5 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>You can't play! Must have exact counts: 1 GK, 3 Defenders (mcveli), 3 Midfielders, and 2 Forwards bought.</span>
          </div>
        )}
      </div>

      {/* Transfer Notification banner */}
      {transferMessage && (
        <div
          className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
            transferMessage.type === 'success'
              ? 'bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/40'
              : 'bg-[#e90052]/20 text-[#e90052] border border-[#e90052]/40'
          }`}
        >
          {transferMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{transferMessage.text}</span>
        </div>
      )}

      {/* Comparison / Confirmation Card */}
      {outPlayer && inPlayer && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-[#2c0230] to-[#1e0022] border border-[#00ff87]/40 shadow-xl">
          <div className="text-[11px] font-black uppercase text-gray-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#00ff87]">
              <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer Summary
            </span>
            <span className={potentialBank >= 0 ? 'text-white font-bold' : 'text-red-400 font-bold'}>
              New Bank: £{potentialBank.toFixed(1)}m
            </span>
          </div>

          <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-bold text-[10px] uppercase">OUT</span>
              <span className="font-bold text-white">{outPlayer.webName}</span>
              <span className="text-gray-400">(£{outPlayer.cost.toFixed(1)}m)</span>
            </div>
            <ArrowLeftRight className="w-3.5 h-3.5 text-gray-500" />
            <div className="flex items-center gap-2">
              <span className="text-[#00ff87] font-bold text-[10px] uppercase">IN</span>
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
              className="w-1/3 py-2 rounded-lg text-xs font-bold text-gray-400 bg-white/5 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              disabled={potentialBank < 0}
              onClick={handleConfirmTransfer}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
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

      {/* Step 1: Transfer Out Selection */}
      <div className="rounded-xl bg-[#230026] border border-white/10 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase text-gray-300 flex items-center gap-1.5">
            <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
            1. Select Player to Sell
          </span>
          {outPlayer && (
            <button
              onClick={() => setOutPlayerId(null)}
              className="text-[10px] text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Squad players chip grid */}
        <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {squad.players.map((sp) => {
            const p = players[sp.playerId];
            if (!p) return null;
            const isSelected = outPlayerId === p.id;

            return (
              <button
                key={p.id}
                onClick={() => {
                  setOutPlayerId(p.id);
                  setInPlayerId(null); // Reset replacement
                }}
                className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-red-500/20 border-red-500 text-white font-bold ring-1 ring-red-500'
                    : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <KitJersey clubId={p.clubId} position={p.position} className="w-6 h-6 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold truncate">{p.webName}</div>
                  <div className="text-[9px] text-gray-400 flex justify-between">
                    <span>{p.position}</span>
                    <span>£{p.cost.toFixed(1)}m</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Transfer In Replacement Market */}
      <div className="rounded-xl bg-[#230026] border border-white/10 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase text-gray-300 flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#00ff87]" />
            2. Choose Replacement ({outPlayer ? outPlayer.position : 'Market'})
          </span>
          <span className="text-[10px] text-gray-400">{candidatePlayers.length} available</span>
        </div>

        {/* Filters & Search */}
        <div className="space-y-2 mb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search player name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold">
            {(['ALL', 'GKP', 'DEF', 'MID', 'FWD'] as const).map((pos) => (
              <button
                key={pos}
                disabled={!!outPlayer} // Locked to outPlayer position if selected
                onClick={() => setPositionFilter(pos)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  (outPlayer ? outPlayer.position === pos : positionFilter === pos)
                    ? 'bg-[#00ff87] text-[#37003c]'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {pos}
              </button>
            ))}

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="ml-auto bg-black/40 border border-white/10 text-gray-300 rounded-md px-1.5 py-1 text-[10px] focus:outline-none"
            >
              <option value="points">Total Pts</option>
              <option value="cost">Price</option>
              <option value="selected">Ownership</option>
            </select>
          </div>
        </div>

        {/* Candidate Players List */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {candidatePlayers.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500">
              No players found matching current filters.
            </div>
          ) : (
            candidatePlayers.map((p) => {
              const isSelected = inPlayerId === p.id;
              const isStarterOut = outPlayer ? squad.players.find((sp) => sp.playerId === outPlayer.id)?.isStarter : true;
              const affordable = outPlayer
                ? (isStarterOut ? squad.bank + outPlayer.cost >= p.cost : true)
                : squad.bank >= p.cost;

              return (
                <div
                  key={p.id}
                  onClick={() => setInPlayerId(p.id)}
                  className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#00ff87]/20 border-[#00ff87] ring-1 ring-[#00ff87]'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <KitJersey clubId={p.clubId} position={p.position} className="w-7 h-7" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">{p.webName}</span>
                        <span className="text-[9px] font-bold px-1 rounded bg-white/10 text-gray-300">
                          {p.position}
                        </span>
                        <span className="text-[9px] text-gray-400">{CLUBS[p.clubId]?.shortName}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {p.totalPoints} pts • {p.selectedByPercent}% sel
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-black block ${
                        affordable ? 'text-white' : 'text-red-400'
                      }`}
                    >
                      £{p.cost.toFixed(1)}m
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-black text-[#00ff87] uppercase">Selected</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

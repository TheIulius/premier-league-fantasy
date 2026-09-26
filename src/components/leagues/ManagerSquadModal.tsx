import React, { useEffect, useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { fetchManagerSquadApi } from '../../services/api';
import { Squad } from '../../types/fpl';
import { GameweekCalculationResult, calculateGameweekSquadPoints } from '../../engine/scoring';
import { getFormationLayout } from '../../engine/formations';
import { KitJersey } from '../pitch/KitJersey';
import { CLUBS } from '../../data/clubs';
import { ArrowLeft, Award, Activity, Sparkles, X, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface ManagerSquadModalProps {
  managerId: string | null;
  onClose: () => void;
}

export const ManagerSquadModal: React.FC<ManagerSquadModalProps> = ({ managerId, onClose }) => {
  const { players, currentGW } = useFPL();
  const [loading, setLoading] = useState(true);
  const [selectedGW, setSelectedGW] = useState<number>(currentGW);
  const [managerData, setManagerData] = useState<{
    id: string;
    managerName: string;
    teamName: string;
    squad: Squad;
  } | null>(null);
  const [calcResult, setCalcResult] = useState<GameweekCalculationResult | null>(null);
  const [selectedPlayerForSheet, setSelectedPlayerForSheet] = useState<string | null>(null);

  useEffect(() => {
    setSelectedGW(currentGW);
  }, [currentGW, managerId]);

  useEffect(() => {
    if (!managerId) return;
    setLoading(true);
    fetchManagerSquadApi(managerId)
      .then((data) => {
        setManagerData(data.manager);
        setCalcResult(data.calculationResult);
      })
      .catch((err) => {
        console.error('Failed to load manager squad:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [managerId]);

  // Recalculate if user selects a past Gameweek
  useEffect(() => {
    if (managerData && selectedGW) {
      const pastCalc = calculateGameweekSquadPoints(
        managerData.squad.players,
        players,
        selectedGW,
        selectedGW === currentGW ? managerData.squad.activeChip : null,
        selectedGW === currentGW ? managerData.squad.transfersMadeThisGW : 0,
        managerData.squad.freeTransfers
      );
      setCalcResult(pastCalc);
    }
  }, [selectedGW, managerData, players, currentGW]);

  if (!managerId) return null;

  const squadPlayers = managerData?.squad.players || [];
  const layout = getFormationLayout(squadPlayers, players);

  // Top performer
  const squadPointsList = squadPlayers
    .map((sp) => {
      const p = players[sp.playerId];
      const bd = calcResult?.playerPointsBreakdown[sp.playerId];
      return {
        player: p,
        points: bd ? bd.finalPoints : 0,
        isCaptain: sp.isCaptain,
      };
    })
    .filter((item) => !!item.player);

  squadPointsList.sort((a, b) => b.points - a.points);
  const topPerformer = squadPointsList[0];

  const sheetPlayer = selectedPlayerForSheet ? players[selectedPlayerForSheet] : null;
  const sheetStats = sheetPlayer ? sheetPlayer.gwStats[currentGW] : null;
  const sheetBreakdown = selectedPlayerForSheet && calcResult ? calcResult.playerPointsBreakdown[selectedPlayerForSheet] : null;
  const sheetSquadPlayer = squadPlayers.find((sp) => sp.playerId === selectedPlayerForSheet);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-2 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] md:max-w-2xl h-full sm:h-[92vh] sm:max-h-[860px] bg-white dark:bg-slate-900 sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Navigation Header */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-20">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Standings</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl px-2 py-0.5">
            <button
              type="button"
              disabled={selectedGW <= 1}
              onClick={() => setSelectedGW((prev) => Math.max(1, prev - 1))}
              className="p-0.5 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
              GW {selectedGW} {selectedGW === currentGW ? '(Live)' : ''}
            </span>
            <button
              type="button"
              disabled={selectedGW >= currentGW}
              onClick={() => setSelectedGW((prev) => Math.min(currentGW, prev + 1))}
              className="p-0.5 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading squad...</p>
          </div>
        ) : managerData && calcResult ? (
          <div className="flex-1 overflow-y-auto overscroll-contain pb-8">
            {/* Manager Info & GW Points Card */}
            <div className="p-3 mx-2 mt-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    {managerData.teamName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Manager: <strong className="text-slate-800 dark:text-slate-200">{managerData.managerName}</strong>
                  </p>
                </div>

                <div className="text-right border-l border-slate-200 dark:border-slate-800 pl-3">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">
                    GW {selectedGW}
                  </span>
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {calcResult.totalPoints}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">PTS</span>
                  </div>
                </div>
              </div>

              {/* Badges / Chips */}
              <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-1">
                {topPerformer && topPerformer.points > 0 ? (
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Top: <strong className="text-slate-900 dark:text-white">{topPerformer.player.webName}</strong> ({topPerformer.points} pts)
                  </span>
                ) : <span />}

                <div className="flex items-center gap-1.5">
                  {managerData.squad.activeChip && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      {managerData.squad.activeChip.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                  {calcResult.transferCost > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      -{calcResult.transferCost} pts
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Auto Subs Banner */}
            {calcResult.autoSubstitutions.length > 0 && (
              <div className="mx-2 mt-2 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs">
                <span className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  Auto-Substitutions
                </span>
                <div className="space-y-1">
                  {calcResult.autoSubstitutions.map((sub: { outPlayerId: string; inPlayerId: string }, idx: number) => (
                    <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <span className="text-rose-500 line-through">{players[sub.outPlayerId]?.webName} (0m)</span>
                      <span>➔</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{players[sub.inPlayerId]?.webName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Football Pitch */}
            <div className="relative mx-2 my-2 rounded-2xl overflow-hidden shadow-xl border-2 border-emerald-800/60 bg-[#14642c]">
              <div className="absolute inset-0 pitch-stripes pointer-events-none opacity-95" />

              {/* Pitch White Chalk Lines (SVG) */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none stroke-white/40 fill-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="10" y="10" width="calc(100% - 20px)" height="calc(100% - 20px)" strokeWidth="1.5" rx="8" />
                <line x1="10" y1="50%" x2="calc(100% - 10px)" y2="50%" strokeWidth="1.5" />
                <circle cx="50%" cy="50%" r="48" strokeWidth="1.5" />
                <rect x="25%" y="10" width="50%" height="70" strokeWidth="1.5" />
                <rect x="25%" y="calc(100% - 80px)" width="50%" height="70" strokeWidth="1.5" />
              </svg>

              {/* Pitch Formation Header */}
              <div className="relative pt-2 px-3 flex items-center justify-between z-10">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-black/40 text-gray-200 backdrop-blur-xs border border-white/10">
                  {layout.formationString}
                </span>
                <span className="text-[10px] text-gray-300 bg-black/40 px-2 py-0.5 rounded-full">
                  Tap player for stats
                </span>
              </div>

              {/* Pitch Rows */}
              <div className="relative z-10 flex flex-col justify-around min-h-[420px] py-3 px-1.5 space-y-3">
                {/* Row 1: Goalkeeper */}
                <div className="flex justify-center items-center">
                  {layout.gks.map((sp) => {
                    const p = players[sp.playerId];
                    if (!p) return null;
                    const bd = calcResult.playerPointsBreakdown[sp.playerId];
                    const pts = bd ? bd.finalPoints : (p.gwStats[currentGW] ? p.gwPoints : 0);
                    return (
                      <OpponentPlayerCard
                        key={sp.playerId}
                        player={p}
                        points={pts}
                        isCaptain={sp.isCaptain}
                        isViceCaptain={sp.isViceCaptain}
                        isTripleCaptain={sp.isCaptain && calcResult.isTripleCaptain}
                        onClick={() => setSelectedPlayerForSheet(sp.playerId)}
                      />
                    );
                  })}
                </div>

                {/* Row 2: Defenders */}
                <div className="flex justify-around items-center px-1">
                  {layout.defs.map((sp) => {
                    const p = players[sp.playerId];
                    if (!p) return null;
                    const bd = calcResult.playerPointsBreakdown[sp.playerId];
                    const pts = bd ? bd.finalPoints : (p.gwStats[currentGW] ? p.gwPoints : 0);
                    return (
                      <OpponentPlayerCard
                        key={sp.playerId}
                        player={p}
                        points={pts}
                        isCaptain={sp.isCaptain}
                        isViceCaptain={sp.isViceCaptain}
                        isTripleCaptain={sp.isCaptain && calcResult.isTripleCaptain}
                        onClick={() => setSelectedPlayerForSheet(sp.playerId)}
                      />
                    );
                  })}
                </div>

                {/* Row 3: Midfielders */}
                <div className="flex justify-around items-center px-1">
                  {layout.mids.map((sp) => {
                    const p = players[sp.playerId];
                    if (!p) return null;
                    const bd = calcResult.playerPointsBreakdown[sp.playerId];
                    const pts = bd ? bd.finalPoints : (p.gwStats[currentGW] ? p.gwPoints : 0);
                    return (
                      <OpponentPlayerCard
                        key={sp.playerId}
                        player={p}
                        points={pts}
                        isCaptain={sp.isCaptain}
                        isViceCaptain={sp.isViceCaptain}
                        isTripleCaptain={sp.isCaptain && calcResult.isTripleCaptain}
                        onClick={() => setSelectedPlayerForSheet(sp.playerId)}
                      />
                    );
                  })}
                </div>

                {/* Row 4: Forwards */}
                <div className="flex justify-around items-center px-2">
                  {layout.fwds.map((sp) => {
                    const p = players[sp.playerId];
                    if (!p) return null;
                    const bd = calcResult.playerPointsBreakdown[sp.playerId];
                    const pts = bd ? bd.finalPoints : (p.gwStats[currentGW] ? p.gwPoints : 0);
                    return (
                      <OpponentPlayerCard
                        key={sp.playerId}
                        player={p}
                        points={pts}
                        isCaptain={sp.isCaptain}
                        isViceCaptain={sp.isViceCaptain}
                        isTripleCaptain={sp.isCaptain && calcResult.isTripleCaptain}
                        onClick={() => setSelectedPlayerForSheet(sp.playerId)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bench Area */}
            <div className="mx-2 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2 tracking-wide">
                Substitutes
              </span>
              <div className="flex items-center justify-around">
                {layout.bench.map((sp, idx) => {
                  const p = players[sp.playerId];
                  if (!p) return null;
                  const bd = calcResult.playerPointsBreakdown[sp.playerId];
                  const pts = bd ? bd.finalPoints : 0;
                  return (
                    <div key={sp.playerId} className="flex flex-col items-center text-center">
                      <span className="text-[9px] text-slate-400 font-bold mb-0.5">
                        {idx === 0 ? 'GK' : `${idx}`}
                      </span>
                      <OpponentPlayerCard
                        player={p}
                        points={pts}
                        isCaptain={false}
                        isViceCaptain={false}
                        isTripleCaptain={false}
                        onClick={() => setSelectedPlayerForSheet(sp.playerId)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">Could not find manager details.</p>
          </div>
        )}

        {/* Player Match Stats Popup Sheet */}
        {sheetPlayer && (
          <div
            className="fixed inset-0 z-60 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in md:p-4"
            onClick={() => setSelectedPlayerForSheet(null)}
          >
            <div
              className="w-full max-w-[460px] md:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-2xl animate-slide-up select-none safe-bottom text-slate-900 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle (mobile only) */}
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 md:hidden" />

              {/* Player Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <KitJersey clubId={sheetPlayer.clubId} position={sheetPlayer.position} className="w-12 h-12" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        {sheetPlayer.position}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {CLUBS[sheetPlayer.clubId]?.name || sheetPlayer.clubId}
                      </span>
                      {sheetSquadPlayer?.isCaptain && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                          {calcResult?.isTripleCaptain ? 'TRIPLE C (3x)' : 'CAPTAIN (2x)'}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                      {sheetPlayer.name}
                    </h2>
                    <span className="text-xs text-slate-400">£{sheetPlayer.cost.toFixed(1)}m</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlayerForSheet(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Performance Stats */}
              <div className="my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">GW {currentGW} Score</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {sheetBreakdown ? sheetBreakdown.finalPoints : (sheetStats ? sheetPlayer.gwPoints : 0)} PTS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span>Minutes:</span>
                    <strong className="text-slate-900 dark:text-white">{sheetStats?.minutes || 0}'</strong>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span>Goals:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{sheetStats?.goals || 0}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span>Assists:</span>
                    <strong className="text-sky-500">{sheetStats?.assists || 0}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span>Clean Sheet:</span>
                    <strong className="text-slate-900 dark:text-white">{sheetStats?.cleanSheet ? 'Yes (+4)' : 'No'}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span>Bonus:</span>
                    <strong className="text-amber-500">+{sheetStats?.bonus || 0}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span>Multiplier:</span>
                    <strong className="text-slate-900 dark:text-white">{sheetBreakdown?.multiplier || 1}x</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component for individual card on the opponent's pitch
const OpponentPlayerCard: React.FC<{
  player: any;
  points: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isTripleCaptain: boolean;
  onClick: () => void;
}> = ({ player, points, isCaptain, isViceCaptain, isTripleCaptain, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 select-none w-14 sm:w-16"
    >
      {/* Jersey + Badge */}
      <div className="relative">
        <KitJersey clubId={player.clubId} position={player.position} className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-md" />

        {/* Captain badge */}
        {isCaptain && (
          <span
            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] text-white shadow-md border ${
              isTripleCaptain ? 'bg-rose-500 border-white ring-1 ring-amber-400' : 'bg-slate-900 border-amber-400'
            }`}
          >
            C
          </span>
        )}

        {/* Vice-captain badge */}
        {isViceCaptain && !isCaptain && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-800 border border-slate-400 flex items-center justify-center font-black text-[9px] text-white shadow-md">
            V
          </span>
        )}
      </div>

      {/* Name banner */}
      <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-t text-center py-0.5 px-0.5 shadow-xs truncate mt-0.5">
        <span className="text-[10px] font-extrabold text-white block truncate leading-tight">
          {player.webName}
        </span>
      </div>

      {/* Points banner */}
      <div className="w-full bg-slate-800 border-x border-b border-slate-700/80 rounded-b text-center py-0.5 shadow-xs flex items-center justify-center gap-1">
        <span className="text-[10px] font-black text-emerald-400 leading-none">
          {points}
        </span>
        <span className="text-[8px] text-slate-400 leading-none">pts</span>
      </div>
    </div>
  );
};

import React from 'react';
import { useFPL } from '../../context/FPLContext';
import { PitchView } from '../pitch/PitchView';
import { Award, Activity, AlertCircle } from 'lucide-react';

export const PointsView: React.FC = () => {
  const { currentGW, calculationResult, players, squad } = useFPL();

  // Find top performer in user's squad
  const squadPointsList = squad.players
    .map((sp) => {
      const p = players[sp.playerId];
      const bd = calculationResult.playerPointsBreakdown[sp.playerId];
      return {
        player: p,
        points: bd ? bd.finalPoints : 0,
        isCaptain: sp.isCaptain,
      };
    })
    .filter((item) => !!item.player);

  squadPointsList.sort((a, b) => b.points - a.points);
  const topPerformer = squadPointsList[0];

  return (
    <div className="flex flex-col space-y-2.5 pb-24 md:pb-12 px-2 sm:px-4 md:px-6 pt-1 md:pt-3 max-w-4xl lg:max-w-5xl mx-auto w-full select-none transition-colors duration-200">
      {/* Squad Composition Ineligibility Warning */}
      {!calculationResult.isValidSquadComposition && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-900 dark:text-white">Ineligible Lineup</div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
              {calculationResult.invalidSquadReason ||
                'Must have 1 GK, 3 Defenders, 3 Midfielders, and 2 Forwards to score points.'}
            </div>
          </div>
        </div>
      )}

      {/* GW Summary Card */}
      <div className="p-3 md:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs uppercase font-bold text-slate-400 block">
              GW {currentGW} Points
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {calculationResult.totalPoints}
              </span>
              <span className="text-xs font-bold text-slate-400">PTS</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 text-center border-l border-slate-200 dark:border-slate-800 pl-3 sm:pl-6">
            <div>
              <span className="text-[9px] md:text-[10px] uppercase font-semibold text-slate-400 block">Average</span>
              <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">54</span>
            </div>
            <div>
              <span className="text-[9px] md:text-[10px] uppercase font-semibold text-slate-400 block">Highest</span>
              <span className="text-xs md:text-sm font-bold text-sky-600 dark:text-sky-400">98</span>
            </div>
            <div>
              <span className="text-[9px] md:text-[10px] uppercase font-semibold text-slate-400 block">Transfer Cost</span>
              <span className="text-xs md:text-sm font-bold text-rose-500">
                {calculationResult.transferCost > 0 ? `-${calculationResult.transferCost}` : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Scorer Row */}
        {topPerformer && topPerformer.points > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Top Scorer: <strong className="text-slate-900 dark:text-white font-bold">{topPerformer.player.webName}</strong>
              {topPerformer.isCaptain && <span className="text-[9px] bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-800 dark:text-white font-bold">(C)</span>}
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {topPerformer.points} pts
            </span>
          </div>
        )}
      </div>

      {/* Auto Substitutions Banner if any */}
      {calculationResult.autoSubstitutions.length > 0 && (
        <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs">
          <span className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5" />
            Auto Substitutions Applied
          </span>
          <div className="space-y-0.5">
            {calculationResult.autoSubstitutions.map((sub, idx) => (
              <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <span className="text-rose-500 line-through">{players[sub.outPlayerId]?.webName} (0 mins)</span>
                <span>➔</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{players[sub.inPlayerId]?.webName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pitch View in Points Mode */}
      <PitchView showPoints={true} />
    </div>
  );
};

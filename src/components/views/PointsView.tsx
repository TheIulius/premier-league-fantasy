import React from 'react';
import { useFPL } from '../../context/FPLContext';
import { PitchView } from '../pitch/PitchView';
import { Zap, Award, Activity, AlertCircle } from 'lucide-react';

export const PointsView: React.FC = () => {
  const { currentGW, calculationResult, players, squad } = useFPL();

  // Find top performer in user's squad
  const squadPointsList = squad.players.map((sp) => {
    const p = players[sp.playerId];
    const bd = calculationResult.playerPointsBreakdown[sp.playerId];
    return {
      player: p,
      points: bd ? bd.finalPoints : 0,
      isCaptain: sp.isCaptain,
    };
  }).filter((item) => !!item.player);

  squadPointsList.sort((a, b) => b.points - a.points);
  const topPerformer = squadPointsList[0];

  return (
    <div className="flex flex-col space-y-3 pb-24 md:pb-12 px-2 md:px-6 pt-2 md:pt-4 max-w-3xl lg:max-w-4xl mx-auto w-full select-none">
      {/* Squad Composition Ineligibility Warning */}
      {!calculationResult.isValidSquadComposition && (
        <div className="mx-0 mt-2 p-3 md:p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs md:text-sm flex items-start gap-2.5 shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-black text-white text-sm md:text-base">Cannot Play / Ineligible Team</div>
            <div className="text-[11px] md:text-xs text-red-300 mt-0.5">
              {calculationResult.invalidSquadReason ||
                'You must buy exactly 1 GK, 3 Defenders (mcveli), 3 Midfielders, and 2 Forwards to participate and score points.'}
            </div>
          </div>
        </div>
      )}

      {/* GW Summary Bar */}
      <div className="mx-0 mt-2 p-3 md:p-5 rounded-2xl bg-gradient-to-r from-[#2c0032] via-[#3d0046] to-[#250029] border border-[#5d0e68] shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs uppercase font-bold text-gray-400 block">
              Gameweek {currentGW} Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-black text-[#00ff87] tracking-tight">
                {calculationResult.totalPoints}
              </span>
              <span className="text-xs md:text-sm font-bold text-gray-300">PTS</span>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6 text-center border-l border-white/10 pl-4 md:pl-6">
            <div>
              <span className="text-[9px] md:text-[10px] uppercase font-semibold text-gray-400 block">Average</span>
              <span className="text-sm md:text-lg font-black text-gray-200">54</span>
            </div>
            <div>
              <span className="text-[9px] md:text-[10px] uppercase font-semibold text-gray-400 block">Highest</span>
              <span className="text-sm md:text-lg font-black text-[#04f5ff]">98</span>
            </div>
            <div>
              <span className="text-[9px] md:text-[10px] uppercase font-semibold text-gray-400 block">Transfer Cost</span>
              <span className="text-sm md:text-lg font-black text-red-400">
                {calculationResult.transferCost > 0 ? `-${calculationResult.transferCost}` : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Top scorer pill */}
        {topPerformer && topPerformer.points > 0 && (
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs md:text-sm">
            <span className="text-gray-300 flex items-center gap-1.5 text-[11px] md:text-xs">
              <Award className="w-3.5 h-3.5 text-yellow-400" />
              Top Scorer: <strong className="text-white">{topPerformer.player.webName}</strong>
              {topPerformer.isCaptain && <span className="text-[9px] bg-black px-1 rounded text-white">(C)</span>}
            </span>
            <span className="font-black text-[#00ff87] text-[11px] md:text-xs">
              {topPerformer.points} pts
            </span>
          </div>
        )}
      </div>

      {/* Auto Substitutions Banner if any occurred */}
      {calculationResult.autoSubstitutions.length > 0 && (
        <div className="mx-0 p-2.5 md:p-3.5 rounded-xl bg-blue-900/30 border border-blue-500/30 text-xs md:text-sm">
          <span className="font-bold text-blue-300 flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5" />
            Automatic Substitutions Applied
          </span>
          <div className="space-y-1">
            {calculationResult.autoSubstitutions.map((sub, idx) => (
              <div key={idx} className="text-[11px] md:text-xs text-gray-300 flex items-center gap-2">
                <span className="text-red-400 line-through">{players[sub.outPlayerId]?.webName} (0 mins)</span>
                <span>➔</span>
                <span className="text-[#00ff87] font-bold">{players[sub.inPlayerId]?.webName}</span>
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

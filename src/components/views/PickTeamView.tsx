import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { PitchView } from '../pitch/PitchView';
import { ChipType } from '../../types/fpl';
import { Sparkles, Shield, Zap, RefreshCw, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PickTeamView: React.FC = () => {
  const { squad, activateChip, teamValue, freeTransfersRemaining } = useFPL();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const chips: { id: ChipType; label: string; desc: string; icon: any }[] = [
    {
      id: 'triple_captain',
      label: 'Triple Captain',
      desc: 'Captain scores 3x points',
      icon: Sparkles,
    },
    {
      id: 'bench_boost',
      label: 'Bench Boost',
      desc: 'Points from bench count',
      icon: Shield,
    },
    {
      id: 'free_hit',
      label: 'Free Hit',
      desc: 'Unlimited free transfers',
      icon: RefreshCw,
    },
  ];

  const handleSaveTeam = () => {
    setSaveSuccess(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#00ff87', '#37003c', '#04f5ff'],
    });
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col space-y-3 pb-24">
      {/* Team Info Strip */}
      <div className="mx-2 mt-2 p-2.5 rounded-xl bg-[#2a002e] border border-[#4d0c54] flex items-center justify-between text-xs">
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-bold">Team Value</span>
          <span className="text-sm font-black text-white">£{teamValue.toFixed(1)}m</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-bold">Free Transfers</span>
          <span className="text-sm font-black text-[#00ff87]">{freeTransfersRemaining}</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[10px] uppercase font-bold">Bank Balance</span>
          <span className="text-sm font-black text-gray-200">£{squad.bank.toFixed(1)}m</span>
        </div>
      </div>

      {/* Chips Selector Bar */}
      <div className="mx-2 p-2.5 rounded-xl bg-gradient-to-r from-[#2a002e] via-[#35023a] to-[#250029] border border-[#520d5a]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase text-gray-200 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#00ff87]" />
            Chips Available
          </span>
          <span className="text-[10px] text-gray-400">1 chip per gameweek</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {chips.map((chip) => {
            const isUsed = squad.usedChips[chip.id];
            const isActive = squad.activeChip === chip.id;
            const Icon = chip.icon;

            return (
              <button
                key={chip.id}
                disabled={isUsed}
                onClick={() => activateChip(chip.id)}
                className={`py-2 px-1.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                  isActive
                    ? 'bg-[#00ff87] text-[#37003c] border-[#00ff87] shadow-glow-green font-bold'
                    : isUsed
                    ? 'bg-black/40 text-gray-500 border-white/5 opacity-50 cursor-not-allowed'
                    : 'bg-white/5 text-gray-200 border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#37003c]' : isUsed ? 'text-gray-600' : 'text-[#00ff87]'}`} />
                <span className="text-[10px] font-black leading-tight truncate w-full">
                  {chip.label}
                </span>
                <span className="text-[8px] opacity-75 leading-none mt-0.5">
                  {isUsed ? 'USED' : isActive ? 'ACTIVE' : 'PLAY'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Pitch View */}
      <PitchView showPoints={false} />

      {/* Save Squad Button */}
      <div className="px-4">
        <button
          onClick={handleSaveTeam}
          className="w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#00ff87] to-[#00cc6a] text-[#37003c] shadow-glow-green hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          {saveSuccess ? (
            <>
              <CheckCircle className="w-5 h-5 text-[#37003c]" />
              <span>Squad Saved Successfully!</span>
            </>
          ) : (
            <span>Save Team Lineup</span>
          )}
        </button>
      </div>
    </div>
  );
};

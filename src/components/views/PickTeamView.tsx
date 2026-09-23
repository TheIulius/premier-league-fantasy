import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { PitchView } from '../pitch/PitchView';
import { ChipType } from '../../types/fpl';
import { Sparkles, Shield, Zap, RefreshCw, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { validateSquadComposition } from '../../engine/scoring';
import confetti from 'canvas-confetti';

export const PickTeamView: React.FC = () => {
  const { squad, players, activateChip, teamValue, freeTransfersRemaining, saveSquad, setActiveTab } = useFPL();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const comp = validateSquadComposition(squad.players, players);

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

  const handleSaveTeam = async () => {
    if (!comp.isValid) {
      setErrorMessage(comp.message || 'Cannot play: Must have 1 GK, 3 DEF, 3 MID, and 2 FWD!');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await saveSquad(undefined, true);
      if (res.success) {
        setSaveSuccess(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#00ff87', '#37003c', '#04f5ff'],
        });
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        setErrorMessage(res.message || 'Failed to save lineup');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save lineup to database');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col space-y-3 pb-24">
      {/* Empty Squad Builder Callout */}
      {squad.players.length === 0 && (
        <div className="mx-2 mt-2 p-4 rounded-2xl bg-gradient-to-br from-[#2a002e] to-[#3a0042] border-2 border-[#00ff87]/50 shadow-2xl space-y-3 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#00ff87]/20 flex items-center justify-center border border-[#00ff87]/40">
            <Sparkles className="w-6 h-6 text-[#00ff87]" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Create Your Fantasy Squad</h3>
            <p className="text-xs text-gray-300 mt-1 max-w-sm mx-auto">
              You have a budget of <strong className="text-[#00ff87]">£60.0m</strong> to buy 9 footballers: 1 GK, 3 Defenders, 3 Midfielders, and 2 Forwards.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('transfers')}
            className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#00ff87] to-[#04f5ff] text-[#111] shadow-glow-green hover:opacity-95"
          >
            Start Buying Players (£60.0m Budget)
          </button>
        </div>
      )}

      {/* In-Progress Squad Callout */}
      {squad.players.length > 0 && squad.players.length < 9 && (
        <div className="mx-2 mt-2 p-3 rounded-xl bg-[#230026] border border-[#00ff87]/30 flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-white">
              Building Squad ({squad.players.length}/9 Players)
            </div>
            <div className="text-[10px] text-gray-400">
              £{squad.bank.toFixed(1)}m remaining in bank
            </div>
          </div>
          <button
            onClick={() => setActiveTab('transfers')}
            className="px-3 py-1.5 rounded-lg bg-[#00ff87] text-[#111] font-black text-xs hover:opacity-90"
          >
            + Buy More Players
          </button>
        </div>
      )}
      {/* Team Info Strip */}
      <div className="mx-2 mt-2 p-2.5 rounded-xl bg-[#2a002e] border border-[#4d0c54] flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Starting 6</span>
            <span className="text-sm font-black text-white">£{teamValue.toFixed(1)}m</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Budget</span>
            <span className="text-sm font-black text-white">£60.0m</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">In Bank</span>
            <span className="text-sm font-black text-gray-200">£{squad.bank.toFixed(1)}m</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">Free Transfers</span>
            <span className="text-sm font-black text-[#00ff87]">{freeTransfersRemaining}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px] text-gray-400">
          <span className="font-bold text-[#00ff87]">6 Starters • 3 Bench Reserves</span>
          <span className="text-gray-300">Starting 6 budget limit: £60.0m</span>
        </div>
      </div>

      {/* Position Requirements Bar */}
      <div className="mx-2 p-2.5 rounded-xl bg-[#230026] border border-[#520d5a] flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-gray-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#00ff87]" />
            Squad Composition Requirements
          </span>
          {comp.isValid ? (
            <span className="text-[10px] font-extrabold text-[#00ff87] flex items-center gap-1 bg-[#00ff87]/15 px-2 py-0.5 rounded-full border border-[#00ff87]/30">
              <CheckCircle className="w-3 h-3" /> Ready to Play
            </span>
          ) : (
            <span className="text-[10px] font-extrabold text-[#e90052] flex items-center gap-1 bg-[#e90052]/15 px-2 py-0.5 rounded-full border border-[#e90052]/30">
              <AlertCircle className="w-3 h-3" /> Ineligible to Play
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
      <div className="px-4 flex flex-col gap-2">
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-[#e90052]/20 border border-[#e90052]/40 text-[#e90052] text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        <button
          onClick={handleSaveTeam}
          disabled={isSaving || !comp.isValid}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            !comp.isValid
              ? 'bg-red-950/60 border border-red-500/50 text-red-300 opacity-80 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#00ff87] to-[#00cc6a] text-[#37003c] shadow-glow-green hover:opacity-95 active:scale-98 disabled:opacity-75'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 text-[#37003c] animate-spin" />
              <span>Saving Lineup to Database...</span>
            </>
          ) : !comp.isValid ? (
            <>
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span>Cannot Play - Need 1 GK, 3 DEF, 3 MID, 2 FWD</span>
            </>
          ) : saveSuccess ? (
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

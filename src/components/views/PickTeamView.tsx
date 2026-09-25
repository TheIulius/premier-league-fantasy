import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { PitchView } from '../pitch/PitchView';
import { ChipType } from '../../types/fpl';
import { Sparkles, Shield, Zap, RefreshCw, CheckCircle, Loader2, AlertCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { validateSquadComposition } from '../../engine/scoring';
import confetti from 'canvas-confetti';

export const PickTeamView: React.FC = () => {
  const { squad, players, activateChip, teamValue, freeTransfersRemaining, saveSquad, setActiveTab, isSquadLocked } = useFPL();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const comp = validateSquadComposition(squad.players, players);
  // Default expanded only if squad has players but is incomplete
  const [showCompDetails, setShowCompDetails] = useState<boolean>(!comp.isValid && squad.players.length > 0);

  const chips: { id: ChipType; label: string; icon: any }[] = [
    { id: 'triple_captain', label: 'Triple Captain', icon: Sparkles },
    { id: 'bench_boost', label: 'Bench Boost', icon: Shield },
    { id: 'free_hit', label: 'Free Hit', icon: RefreshCw },
  ];

  const handleSaveTeam = async () => {
    if (!comp.isValid) {
      setErrorMessage(comp.message || 'Squad incomplete: Need 1 GK, 3 DEF, 3 MID, 2 FWD!');
      setShowCompDetails(true);
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
          particleCount: 45,
          spread: 55,
          origin: { y: 0.8 },
          colors: ['#10b981', '#38bdf8', '#fbbf24'],
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

  const validCount = squad.players.filter((sp) => Boolean(players[sp.playerId])).length;

  return (
    <div className="flex flex-col space-y-2.5 pb-24 md:pb-12 px-2 sm:px-4 md:px-6 pt-1 md:pt-3 max-w-4xl lg:max-w-5xl mx-auto w-full transition-colors duration-200">
      {/* Lineup Locked Banner */}
      {isSquadLocked && (
        <div className="p-2.5 md:p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>Lineups are locked for this Gameweek. Team changes are prohibited.</span>
          </div>
          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-rose-500 text-white">
            Locked
          </span>
        </div>
      )}

      {/* Empty Squad Callout */}
      {validCount === 0 && (
        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-sm text-center space-y-2.5">
          <div className="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">Build Your Squad</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Budget: <strong className="text-emerald-600 dark:text-emerald-400">£60.0m</strong> • 9 Players: 1 GK, 3 DEF, 3 MID, 2 FWD
            </p>
          </div>
          <button
            onClick={() => setActiveTab('transfers')}
            className="w-full max-w-xs mx-auto py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors"
          >
            Go to Transfers
          </button>
        </div>
      )}

      {/* In-Progress Callout */}
      {validCount > 0 && validCount < 9 && (
        <div className="p-2.5 md:p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 shadow-xs flex items-center justify-between">
          <div className="text-xs text-slate-700 dark:text-slate-300">
            <span className="font-bold text-amber-600 dark:text-amber-400">Building Squad:</span> {validCount}/9 Players
            <span className="text-slate-400 ml-2">(£{squad.bank.toFixed(1)}m left)</span>
          </div>
          <button
            onClick={() => setActiveTab('transfers')}
            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors"
          >
            + Buy Players
          </button>
        </div>
      )}

      {/* Streamlined Team Status & Controls Bar */}
      <div className="p-2.5 md:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Value</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">£{teamValue.toFixed(1)}m</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">£{squad.bank.toFixed(1)}m</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Transfers</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{freeTransfersRemaining}</span>
            </div>
          </div>

          {/* Squad Status Chip with Progressive Disclosure */}
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
                <span>Ready to Play</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Squad Incomplete</span>
              </>
            )}
            {showCompDetails ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>
        </div>

        {/* Collapsible Squad Composition Details */}
        {showCompDetails && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in space-y-2">
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className={`p-1.5 rounded-lg border text-xs ${comp.gkCount === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-500 dark:text-slate-400">GK</span>
                <span className="font-black text-xs">{comp.gkCount}/1</span>
              </div>
              <div className={`p-1.5 rounded-lg border text-xs ${comp.defCount === 3 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-500 dark:text-slate-400">DEF</span>
                <span className="font-black text-xs">{comp.defCount}/3</span>
              </div>
              <div className={`p-1.5 rounded-lg border text-xs ${comp.midCount === 3 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-500 dark:text-slate-400">MID</span>
                <span className="font-black text-xs">{comp.midCount}/3</span>
              </div>
              <div className={`p-1.5 rounded-lg border text-xs ${comp.fwdCount === 2 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-500 dark:text-slate-400">FWD</span>
                <span className="font-black text-xs">{comp.fwdCount}/2</span>
              </div>
            </div>

            {/* Class limit warning */}
            {comp.exceededClubs && comp.exceededClubs.length > 0 && (
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
                <span>Max 2 players per class exceeded in: {comp.exceededClubs.map((ec) => `${ec.clubId.replace('SCH_', '')}`).join(', ')}</span>
                <button
                  onClick={() => setActiveTab('transfers')}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                >
                  Fix
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compact Chips Bar */}
      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-1.5">
        <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1 pl-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Available</span> Chips
        </span>
        <div className="flex items-center gap-1 sm:gap-2">
          {chips.map((chip) => {
            const Icon = chip.icon;
            const isUsed = squad.usedChips[chip.id];
            const isActive = squad.activeChip === chip.id;
            return (
              <button
                key={chip.id}
                disabled={isUsed || isSquadLocked}
                onClick={() => activateChip(chip.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold border transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                    : isUsed || isSquadLocked
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent opacity-50 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{chip.label}</span>
                {isUsed && ' (Used)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Football Pitch View */}
      <PitchView showPoints={false} />

      {/* Save Squad Button */}
      <div className="flex flex-col gap-1.5 pt-1">
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        <button
          onClick={handleSaveTeam}
          disabled={isSaving || !comp.isValid || isSquadLocked}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs ${
            !comp.isValid || isSquadLocked
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 active:scale-99 text-white font-black'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Saving Lineup...</span>
            </>
          ) : isSquadLocked ? (
            <span>🔒 Lineups Locked for GW {squad.players.length > 0 ? '' : ''}</span>
          ) : saveSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 text-white" />
              <span>Squad Saved!</span>
            </>
          ) : (
            <span>Save Team Lineup</span>
          )}
        </button>
      </div>
    </div>
  );
};

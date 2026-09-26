import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { PitchView } from '../pitch/PitchView';
import { PlayerCard } from '../pitch/PlayerCard';
import { PlayerActionSheet } from '../pitch/PlayerActionSheet';
import { getFormationLayout } from '../../engine/formations';
import { ChipType } from '../../types/fpl';
import { Zap, CheckCircle, Loader2, AlertCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { validateSquadComposition } from '../../engine/scoring';
import confetti from 'canvas-confetti';
import { TripleCaptainIcon, BenchBoostIcon, WildcardIcon } from '../icons/ChipIcons';

export const PickTeamView: React.FC = () => {
  const {
    squad,
    players,
    activateChip,
    teamValue,
    freeTransfersRemaining,
    saveSquad,
    setActiveTab,
    isSquadLocked,
    currentGW,
  } = useFPL();

  const [activeSheetPlayerId, setActiveSheetPlayerId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const comp = validateSquadComposition(squad.players, players);
  const [showCompDetails, setShowCompDetails] = useState<boolean>(!comp.isValid && squad.players.length > 0);

  const layout = getFormationLayout(squad.players, players);
  const benchSlots = [1, 2, 3];

  const chips: { id: ChipType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'triple_captain', label: 'Triple Captain', icon: TripleCaptainIcon },
    { id: 'bench_boost', label: 'Bench Boost', icon: BenchBoostIcon },
    { id: 'wildcard', label: 'Wildcard', icon: WildcardIcon },
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
          particleCount: 50,
          spread: 60,
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
    <div className="flex flex-col pb-24 md:pb-12 px-2 sm:px-4 md:px-6 pt-2 md:pt-4 max-w-4xl lg:max-w-5xl mx-auto w-full transition-colors duration-200">
      {/* ======================================================== */}
      {/* SECTION 1: UPPER CANVAS (Tactical Pitch & Quick Metrics) */}
      {/* ======================================================== */}
      <section className="flex flex-col space-y-2.5">
        {/* Tournament Brand Header */}
        <div className="flex flex-col items-center justify-center pt-1 pb-1">
          <img
            src="/kcl-logo.png"
            alt="Komarovi Champions League"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-white/10 shadow-md object-contain"
          />
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] text-slate-200">
              Komarovi Champions League
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/10">
              GW {currentGW}
            </span>
          </div>
        </div>

        {/* Lineup Locked Notification Banner */}
        {isSquadLocked && (
          <div className="p-2.5 md:p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>Lineups are locked for Gameweek {currentGW}. Team changes are prohibited.</span>
            </div>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-rose-500 text-white">
              Locked
            </span>
          </div>
        )}

        {/* Monospace Quick Metrics Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-xl bg-slate-900/80 dark:bg-zinc-950/80 border border-white/10 backdrop-blur-xs">
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">VAL</span>
              <span className="font-bold text-slate-100">£{teamValue.toFixed(1)}m</span>
            </div>
            <div className="h-3 w-[1px] bg-white/15" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">BANK</span>
              <span className="font-bold text-emerald-400">£{squad.bank.toFixed(1)}m</span>
            </div>
            <div className="h-3 w-[1px] bg-white/15" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">FREE FT</span>
              <span className="font-bold text-cyan-400">{freeTransfersRemaining}</span>
            </div>
          </div>

          {/* Squad Status Toggle */}
          <button
            onClick={() => setShowCompDetails((prev) => !prev)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              comp.isValid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {comp.isValid ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lineup Ready</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Squad Incomplete ({validCount}/9)</span>
              </>
            )}
            {showCompDetails ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>
        </div>

        {/* Collapsible Squad Composition Matrix */}
        {showCompDetails && (
          <div className="p-3 rounded-xl bg-slate-900/60 dark:bg-zinc-950/60 border border-white/10 animate-fade-in space-y-2">
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className={`p-1.5 rounded-lg border text-xs ${comp.gkCount === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-400">GK</span>
                <span className="font-mono font-black text-xs">{comp.gkCount}/1</span>
              </div>
              <div className={`p-1.5 rounded-lg border text-xs ${comp.defCount === 3 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-400">DEF</span>
                <span className="font-mono font-black text-xs">{comp.defCount}/3</span>
              </div>
              <div className={`p-1.5 rounded-lg border text-xs ${comp.midCount === 3 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-400">MID</span>
                <span className="font-mono font-black text-xs">{comp.midCount}/3</span>
              </div>
              <div className={`p-1.5 rounded-lg border text-xs ${comp.fwdCount === 2 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-400">FWD</span>
                <span className="font-mono font-black text-xs">{comp.fwdCount}/2</span>
              </div>
            </div>

            {comp.exceededClubs && comp.exceededClubs.length > 0 && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
                <span>Max 2 players per class exceeded: {comp.exceededClubs.map((ec) => ec.clubId.replace('SCH_', '')).join(', ')}</span>
                <button
                  onClick={() => setActiveTab('transfers')}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                >
                  Adjust
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tactical Pitch Surface (Bench decoupled to Section 2) */}
        <PitchView
          showPoints={false}
          renderBench={false}
          onCardClick={(id) => setActiveSheetPlayerId(id)}
        />
      </section>

      {/* Fine Dashed Divider between Sections */}
      <div className="w-full border-b border-dashed border-white/15 my-4" />

      {/* ======================================================== */}
      {/* SECTION 2: BOTTOM RIBBON (Unified Substitutes & Chips Dock) */}
      {/* ======================================================== */}
      <section className="flex flex-col space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-slate-900/90 dark:bg-zinc-950/90 border border-white/10 backdrop-blur-md shadow-xl">
          {/* Left Column: Substitutes (Strictly 3 Reserves) */}
          <div className="md:col-span-7 flex flex-col justify-between md:border-r border-dashed border-white/15 md:pr-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                Substitutes ({layout.bench.length}/3)
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                Order: Sub 1 → 2 → 3
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {benchSlots.map((order) => {
                const sp = layout.bench.find((b) => b.benchOrder === order) || layout.bench[order - 1];
                if (sp) {
                  return (
                    <div key={sp.playerId} className="flex justify-center">
                      <PlayerCard
                        playerId={sp.playerId}
                        isStarter={false}
                        benchOrder={order}
                        isCaptain={sp.isCaptain}
                        isViceCaptain={sp.isViceCaptain}
                        onCardClick={(id) => setActiveSheetPlayerId(id)}
                        showPoints={false}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={`empty-bench-${order}`}
                    onClick={() => setActiveTab('transfers')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-white/20 bg-black/20 text-slate-400 hover:border-emerald-400/50 hover:bg-emerald-500/10 cursor-pointer transition-all min-h-[90px]"
                  >
                    <span className="text-[10px] font-bold text-slate-400">Sub {order}</span>
                    <span className="text-[8px] text-emerald-400 mt-1 font-mono uppercase tracking-wider">+ Empty</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Available Chips with Metallic Shine */}
          <div className="md:col-span-5 flex flex-col justify-between pt-3 md:pt-0 border-t md:border-t-0 border-dashed border-white/15 md:pl-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Available Chips
              </span>
              {squad.activeChip && (
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                  Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 md:grid-cols-1 gap-2 flex-1 items-stretch">
              {chips.map((chip) => {
                const Icon = chip.icon;
                const isUsed = squad.usedChips[chip.id];
                const isActive = squad.activeChip === chip.id;

                return (
                  <button
                    key={chip.id}
                    disabled={isUsed || isSquadLocked}
                    onClick={() => activateChip(chip.id)}
                    className={`group relative overflow-hidden flex flex-col md:flex-row items-center md:justify-between p-2 md:px-3 md:py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                        : isUsed || isSquadLocked
                        ? 'bg-black/30 text-slate-500 border-white/5 opacity-40 cursor-not-allowed'
                        : 'bg-black/40 hover:bg-black/60 text-slate-200 border-white/10 hover:border-emerald-500/40 active:scale-98'
                    }`}
                  >
                    {/* Metallic sweep shine */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none transition-transform" />
                    <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 relative z-10">
                      <div className={`p-1 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] md:text-xs text-center md:text-left leading-tight">{chip.label}</span>
                    </div>
                    <span className="text-[8px] md:text-[10px] font-mono mt-1 md:mt-0 relative z-10 text-slate-400">
                      {isActive ? 'ACTIVE' : isUsed ? 'USED' : 'READY'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error notification if save fails or squad invalid */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tactile Lineup Save Action */}
        <button
          onClick={handleSaveTeam}
          disabled={isSaving || !comp.isValid || isSquadLocked}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
            !comp.isValid || isSquadLocked
              ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-[#002812] shadow-[0_0_20px_rgba(16,185,129,0.35)]'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Lineup...</span>
            </>
          ) : isSquadLocked ? (
            <span>Lineups Locked for GW {currentGW}</span>
          ) : saveSuccess ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Squad Saved Successfully!</span>
            </>
          ) : (
            <span>Save Team Lineup</span>
          )}
        </button>
      </section>

      {/* Modal Action Sheet for Selected Player */}
      {activeSheetPlayerId && (
        <PlayerActionSheet
          playerId={activeSheetPlayerId}
          onClose={() => setActiveSheetPlayerId(null)}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Player, Position } from '../../types/fpl';
import { CLUBS } from '../../data/clubs';
import { KitJersey } from '../pitch/KitJersey';
import { ClassShieldBadge } from '../common/ClassShieldBadge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Plus,
  Minus,
  Shield,
  Zap,
  Award,
  Clock,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface FloatingScore {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  players: Record<string, Player>;
  currentGW: number;
  onUpdatePlayerStats: (playerId: string, stats: any) => Promise<boolean>;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  players,
  currentGW,
  onUpdatePlayerStats,
}) => {
  const [query, setQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);

  // Listen for ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter players by query
  const filteredPlayers = useMemo(() => {
    if (!query.trim()) return Object.values(players).slice(0, 12);
    const q = query.toLowerCase().trim();
    return Object.values(players)
      .filter((p) => {
        const club = CLUBS[p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId];
        return (
          p.webName.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (club?.shortName && club.shortName.toLowerCase().includes(q)) ||
          p.position.toLowerCase().includes(q)
        );
      })
      .slice(0, 20);
  }, [players, query]);

  const selectedPlayer = selectedPlayerId ? players[selectedPlayerId] : null;
  const currentStats = selectedPlayer?.gwStats[currentGW] || {
    minutes: 0,
    goals: 0,
    assists: 0,
    cleanSheet: false,
    yellowCards: 0,
    redCards: 0,
    penaltiesSaved: 0,
    penaltiesMissed: 0,
    ownGoals: 0,
    isMVP: false,
    goalsConceded: 0,
    saves: 0,
    bonus: 0,
  };

  const spawnFloatingScore = (text: string, color: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setFloatingScores((prev) => [
      ...prev,
      { id, text, color, x: rect.left + rect.width / 2, y: rect.top },
    ]);
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((item) => item.id !== id));
    }, 900);
  };

  const handleStatIncrement = async (
    key: string,
    delta: number,
    pointDeltaLabel: string,
    color: string,
    e: React.MouseEvent
  ) => {
    if (!selectedPlayer) return;
    spawnFloatingScore(pointDeltaLabel, color, e);
    const updated = {
      ...currentStats,
      [key]: Math.max(0, ((currentStats as any)[key] || 0) + delta),
    };
    await onUpdatePlayerStats(selectedPlayer.id, updated);
  };

  const handleToggleStat = async (
    key: string,
    pointDeltaLabel: string,
    color: string,
    e: React.MouseEvent
  ) => {
    if (!selectedPlayer) return;
    const currentVal = Boolean((currentStats as any)[key]);
    if (!currentVal) {
      spawnFloatingScore(pointDeltaLabel, color, e);
    }
    const updated = {
      ...currentStats,
      [key]: !currentVal,
    };
    await onUpdatePlayerStats(selectedPlayer.id, updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-3 bg-black/75 backdrop-blur-md animate-fade-in">
      {/* Floating score badges */}
      {floatingScores.map((score) => (
        <motion.div
          key={score.id}
          initial={{ opacity: 1, y: 0, scale: 0.8 }}
          animate={{ opacity: 0, y: -45, scale: 1.25 }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
          style={{ left: score.x, top: score.y }}
          className={`fixed pointer-events-none z-50 -translate-x-1/2 font-black text-sm px-2 py-0.5 rounded-full shadow-lg ${score.color}`}
        >
          {score.text}
        </motion.div>
      ))}

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Command Search Input Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center gap-3 bg-zinc-950/60">
          <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedPlayerId(null);
            }}
            placeholder="Type player nickname, name, or class (e.g. Zarno, 11/5, Gvrit)..."
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area: Player Search List OR Selected Player Live Modifier */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-white/[0.04]">
          {selectedPlayer ? (
            /* Rapid-Action Live Stat Modifier Card */
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <KitJersey clubId={selectedPlayer.clubId} position={selectedPlayer.position} className="w-10 h-10" />
                  <div>
                    <div className="flex items-center gap-2">
                      <ClassShieldBadge clubId={selectedPlayer.clubId} size="xs" />
                      <h3 className="font-black text-base text-white">{selectedPlayer.webName}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-white/10 text-emerald-400">
                        {selectedPlayer.position}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400">{selectedPlayer.name}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlayerId(null)}
                  className="text-xs font-bold text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/10"
                >
                  ← Back to Search
                </button>
              </div>

              {/* Current Match Metrics Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-xl bg-zinc-950/70 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Goals</span>
                  <span className="font-mono text-lg font-black text-emerald-400">{currentStats.goals}</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950/70 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Assists</span>
                  <span className="font-mono text-lg font-black text-sky-400">{currentStats.assists}</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950/70 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Saves</span>
                  <span className="font-mono text-lg font-black text-amber-400">{currentStats.saves || 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950/70 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Minutes</span>
                  <span className="font-mono text-lg font-black text-white">{currentStats.minutes || 0}&apos;</span>
                </div>
              </div>

              {/* Rapid Action Tactile Buttons */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  Tactile Stat Increments
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* Goal Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) =>
                      handleStatIncrement('goals', 1, `+${selectedPlayer.position === 'FWD' ? 6 : selectedPlayer.position === 'MID' ? 6 : 7} Goal`, 'bg-emerald-500 text-slate-950', e)
                    }
                    className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-black text-xs flex items-center justify-between hover:bg-emerald-500/25 transition-colors"
                  >
                    <span>+ Goal</span>
                    <span className="text-[10px] font-mono opacity-80 font-bold">+{selectedPlayer.position === 'FWD' ? 6 : 7}</span>
                  </motion.button>

                  {/* Assist Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleStatIncrement('assists', 1, '+3 Assist', 'bg-sky-500 text-slate-950', e)}
                    className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 font-black text-xs flex items-center justify-between hover:bg-sky-500/25 transition-colors"
                  >
                    <span>+ Assist</span>
                    <span className="text-[10px] font-mono opacity-80 font-bold">+3</span>
                  </motion.button>

                  {/* Clean Sheet Toggle */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleToggleStat('cleanSheet', '+4 Clean Sheet', 'bg-cyan-500 text-slate-950', e)}
                    className={`p-2.5 rounded-xl border font-black text-xs flex items-center justify-between transition-colors ${
                      currentStats.cleanSheet
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25'
                    }`}
                  >
                    <span>{currentStats.cleanSheet ? 'Clean Sheet ✓' : '+ Clean Sheet'}</span>
                    <span className="text-[10px] font-mono font-bold">+4</span>
                  </motion.button>

                  {/* Save Button (GKs) */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleStatIncrement('saves', 1, '+1 Save', 'bg-amber-500 text-slate-950', e)}
                    className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-xs flex items-center justify-between hover:bg-amber-500/25 transition-colors"
                  >
                    <span>+ Save</span>
                    <span className="text-[10px] font-mono opacity-80 font-bold">+1</span>
                  </motion.button>

                  {/* Yellow Card Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleStatIncrement('yellowCards', 1, '-1 Yellow', 'bg-yellow-500 text-slate-950', e)}
                    className="p-2.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-black text-xs flex items-center justify-between hover:bg-yellow-500/25 transition-colors"
                  >
                    <span>+ 🟨 Yellow</span>
                    <span className="text-[10px] font-mono opacity-80 font-bold">-1</span>
                  </motion.button>

                  {/* Red Card Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleStatIncrement('redCards', 1, '-3 Red Card', 'bg-rose-500 text-white', e)}
                    className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-black text-xs flex items-center justify-between hover:bg-rose-500/25 transition-colors"
                  >
                    <span>+ 🟥 Red Card</span>
                    <span className="text-[10px] font-mono opacity-80 font-bold">-3</span>
                  </motion.button>
                </div>
              </div>
            </div>
          ) : filteredPlayers.length > 0 ? (
            filteredPlayers.map((p) => {
              const club = CLUBS[p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId];
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className="p-2.5 rounded-xl hover:bg-white/[0.06] cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <KitJersey clubId={p.clubId} position={p.position} className="w-8 h-8 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition-colors">
                          {p.webName}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                          {p.position}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {club?.shortName || p.clubId}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 block">{p.name}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">
                      £{p.cost.toFixed(1)}m
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {p.totalPoints} pts
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500">
              No players found matching &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 px-4 bg-zinc-950/80 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Tip: Press <strong>ESC</strong> to close or click any player to modify live stats</span>
          <span className="font-mono">Gameweek {currentGW}</span>
        </div>
      </div>
    </div>
  );
};

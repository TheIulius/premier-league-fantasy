import React, { useState, useMemo, useEffect } from 'react';
import { useFPL } from '../../context/FPLContext';
import { KitJersey } from '../pitch/KitJersey';
import { ClassShieldBadge } from '../common/ClassShieldBadge';
import { CLUBS } from '../../data/clubs';
import { MatchGoal, Venue, Player } from '../../types/fpl';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Plus,
  Minus,
  Crown,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Award,
  Zap,
  Clock,
  Shield,
  Trash2,
  Users as UsersIcon,
  Search,
  Play,
  Pause,
  RotateCcw,
  Building,
  MapPin,
  Flame,
} from 'lucide-react';

interface FloatingPointBadge {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
}

export const MatchDayAdmin: React.FC = () => {
  const { fixtures, currentGW, players, updateFixture, updatePlayerStats } = useFPL();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);

  // Match State
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [venue, setVenue] = useState<Venue>('delisi');

  // Match Stopwatch Timer
  const [defaultMinutes, setDefaultMinutes] = useState<number>(40);
  const [matchSeconds, setMatchSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Events State
  const [goals, setGoals] = useState<(MatchGoal & { team: 'home' | 'away' })[]>([]);
  const [mvps, setMvps] = useState<string[]>([]);
  const [playerMinutes, setPlayerMinutes] = useState<Record<string, number>>({});
  const [yellowCards, setYellowCards] = useState<string[]>([]);
  const [redCards, setRedCards] = useState<string[]>([]);
  const [penaltiesSaved, setPenaltiesSaved] = useState<Record<string, number>>({});
  const [penaltiesMissed, setPenaltiesMissed] = useState<Record<string, number>>({});
  const [playerAssists, setPlayerAssists] = useState<Record<string, number>>({});
  const [playerSaves, setPlayerSaves] = useState<Record<string, number>>({});

  // Floating point feedback
  const [floatingPoints, setFloatingPoints] = useState<FloatingPointBadge[]>([]);

  // Active match timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setMatchSeconds((prev) => {
          if (prev >= defaultMinutes * 60) {
            setIsTimerRunning(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, defaultMinutes]);

  const currentMatchMinute = useMemo(() => {
    if (matchSeconds === 0) return 0;
    return Math.min(defaultMinutes, Math.floor(matchSeconds / 60) + (matchSeconds % 60 > 0 ? 1 : 0));
  }, [matchSeconds, defaultMinutes]);

  const formatTimerDisplay = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const fixture = fixtures.find((f) => f.id === selectedFixtureId);
  const currentFixtures = fixtures.filter((f) => f.gameweek === currentGW);

  const homeClub = fixture ? CLUBS[fixture.homeClubId] : null;
  const awayClub = fixture ? CLUBS[fixture.awayClubId] : null;

  const isOnePrice = venue === 'one_price';

  const matchPlayers = useMemo(() => {
    if (!fixture) return { home: [], away: [] };
    const all = Object.values(players);
    return {
      home: all.filter(
        (p) =>
          p.clubId === fixture.homeClubId ||
          (p.clubId === 'SCH' && fixture.homeClubId === 'SCH_11_5') ||
          (p.clubId === 'SCH_11_5' && fixture.homeClubId === 'SCH')
      ),
      away: all.filter(
        (p) =>
          p.clubId === fixture.awayClubId ||
          (p.clubId === 'SCH' && fixture.awayClubId === 'SCH_11_5') ||
          (p.clubId === 'SCH_11_5' && fixture.awayClubId === 'SCH')
      ),
    };
  }, [fixture, players]);

  const spawnFloatingPoint = (text: string, color: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setFloatingPoints((prev) => [
      ...prev,
      { id, text, color, x: rect.left + rect.width / 2, y: rect.top },
    ]);
    setTimeout(() => {
      setFloatingPoints((prev) => prev.filter((item) => item.id !== id));
    }, 850);
  };

  const handleSelectFixture = (fId: string) => {
    const f = fixtures.find((x) => x.id === fId);
    setSelectedFixtureId(fId);
    setHomeScore(f?.homeScore || 0);
    setAwayScore(f?.awayScore || 0);
    setVenue(f?.venue === 'one_price' ? 'one_price' : 'delisi');
    setGoals(
      (f?.goalScorers || []).map((g) => ({
        ...g,
        team: 'home',
      }))
    );
    setMvps([]);
    setPlayerMinutes({});
    setYellowCards([]);
    setRedCards([]);
    setPenaltiesSaved({});
    setPenaltiesMissed({});
    setPlayerAssists({});
    setPlayerSaves({});
    setMatchSeconds(0);
    setIsTimerRunning(false);
    setStep(2);
  };

  // Point values calculation based on venue
  const getGoalPoints = (pos: string) => {
    if (pos === 'GKP') return isOnePrice ? 6 : 7;
    if (pos === 'DEF') return isOnePrice ? 5 : 6;
    if (pos === 'MID') return isOnePrice ? 4 : 5;
    return isOnePrice ? 3 : 4; // FWD
  };

  const getAssistPoints = () => (isOnePrice ? 2 : 3);
  const getMvpPoints = () => (isOnePrice ? 2 : 3);

  // Rapid Tactile Actions on Players
  const handleRapidGoal = (player: Player, team: 'home' | 'away', e: React.MouseEvent) => {
    const pts = getGoalPoints(player.position);
    spawnFloatingPoint(`+${pts} Goal`, 'bg-emerald-500 text-slate-950 font-black', e);

    setGoals((prev) => [
      ...prev,
      {
        playerId: player.id,
        team,
        isOwnGoal: false,
        minute: currentMatchMinute || undefined,
      },
    ]);

    if (team === 'home') setHomeScore((s) => s + 1);
    else setAwayScore((s) => s + 1);

    // Auto mark player minutes if not set
    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleRapidAssist = (player: Player, e: React.MouseEvent) => {
    const pts = getAssistPoints();
    spawnFloatingPoint(`+${pts} Assist`, 'bg-sky-500 text-slate-950 font-black', e);
    setPlayerAssists((prev) => ({ ...prev, [player.id]: (prev[player.id] || 0) + 1 }));

    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleRapidOwnGoal = (player: Player, team: 'home' | 'away', e: React.MouseEvent) => {
    spawnFloatingPoint('-3 Own Goal', 'bg-rose-600 text-white font-black', e);
    setGoals((prev) => [
      ...prev,
      {
        playerId: player.id,
        team,
        isOwnGoal: true,
        minute: currentMatchMinute || undefined,
      },
    ]);

    // An own goal awards a goal to the opposing team
    if (team === 'home') setAwayScore((s) => s + 1);
    else setHomeScore((s) => s + 1);

    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleRapidMissedPen = (player: Player, e: React.MouseEvent) => {
    spawnFloatingPoint('-2 Pen Miss', 'bg-rose-500 text-white font-black', e);
    setPenaltiesMissed((prev) => ({ ...prev, [player.id]: (prev[player.id] || 0) + 1 }));

    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleRapidSavedPen = (player: Player, e: React.MouseEvent) => {
    spawnFloatingPoint('+3 Pen Save', 'bg-emerald-400 text-slate-950 font-black', e);
    setPenaltiesSaved((prev) => ({ ...prev, [player.id]: (prev[player.id] || 0) + 1 }));

    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleRapidSave = (player: Player, e: React.MouseEvent) => {
    spawnFloatingPoint('+1 Save', 'bg-amber-500 text-slate-950 font-black', e);
    setPlayerSaves((prev) => ({ ...prev, [player.id]: (prev[player.id] || 0) + 1 }));

    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleToggleCard = (playerId: string, type: 'yellow' | 'red', e: React.MouseEvent) => {
    if (type === 'yellow') {
      const isAlready = yellowCards.includes(playerId);
      if (!isAlready) spawnFloatingPoint('-1 Yellow', 'bg-yellow-500 text-slate-950 font-black', e);
      setYellowCards((prev) =>
        prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
      );
    } else {
      const isAlready = redCards.includes(playerId);
      if (!isAlready) spawnFloatingPoint('-3 Red', 'bg-rose-500 text-white font-black', e);
      setRedCards((prev) =>
        prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
      );
    }
  };

  const handleToggleMvp = (playerId: string, e: React.MouseEvent) => {
    const isAlready = mvps.includes(playerId);
    const pts = getMvpPoints();
    if (!isAlready) spawnFloatingPoint(`+${pts} MVP`, 'bg-amber-400 text-slate-950 font-black', e);
    setMvps((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  // Custom Minute Adjustment Helpers
  const handleSetPlayerMinutes = (playerId: string, mins: number) => {
    const clamped = Math.max(0, Math.min(120, mins));
    setPlayerMinutes((prev) => ({ ...prev, [playerId]: clamped }));
  };

  const handleStepPlayerMinutes = (playerId: string, delta: number, e?: React.MouseEvent) => {
    const cur = playerMinutes[playerId] || 0;
    const next = Math.max(0, Math.min(120, cur + delta));
    if (e) {
      spawnFloatingPoint(`${next}'`, 'bg-zinc-200 text-slate-900 font-bold', e);
    }
    setPlayerMinutes((prev) => ({ ...prev, [playerId]: next }));
  };

  const setAllMinutes = (mins: number) => {
    const newMins: Record<string, number> = {};
    [...matchPlayers.home, ...matchPlayers.away].forEach((p) => {
      newMins[p.id] = mins;
    });
    setPlayerMinutes(newMins);
  };

  const handleSave = async () => {
    if (!fixture) return;

    // 1. Update Fixture
    await updateFixture(fixture.id, {
      homeScore,
      awayScore,
      isFinished: true,
      venue,
      goalScorers: goals.map((g) => ({
        playerId: g.playerId,
        assistPlayerId: g.assistPlayerId,
        minute: g.minute,
        isOwnGoal: g.isOwnGoal,
      })),
    });

    // 2. Update Player Stats
    const allMatchPlayers = [...matchPlayers.home, ...matchPlayers.away];

    for (const p of allMatchPlayers) {
      const mins = playerMinutes[p.id] || 0;
      if (mins === 0) continue; // Skip players who didn't participate

      const pGoals = goals.filter((g) => g.playerId === p.id && !g.isOwnGoal).length;
      const pOwnGoals = goals.filter((g) => g.playerId === p.id && g.isOwnGoal).length;
      const pAssists = playerAssists[p.id] || 0;
      const pSaves = playerSaves[p.id] || 0;

      // Determine clean sheet & goals conceded
      const isHome = matchPlayers.home.some((hp) => hp.id === p.id);
      const goalsConceded = isHome ? awayScore : homeScore;
      const cleanSheet = goalsConceded === 0;

      const pYellows = yellowCards.includes(p.id) ? 1 : 0;
      const pReds = redCards.includes(p.id) ? 1 : 0;
      const pIsMvp = mvps.includes(p.id);
      const pPenSaved = penaltiesSaved[p.id] || 0;
      const pPenMissed = penaltiesMissed[p.id] || 0;

      updatePlayerStats(p.id, currentGW, {
        minutes: mins,
        goals: pGoals,
        assists: pAssists,
        cleanSheet: cleanSheet && mins >= 20,
        goalsConceded,
        yellowCards: pYellows,
        redCards: pReds,
        penaltiesSaved: pPenSaved,
        penaltiesMissed: pPenMissed,
        ownGoals: pOwnGoals,
        isMVP: pIsMvp,
        saves: pSaves,
      });
    }

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10B981', '#38BDF8', '#FBBF24'],
    });

    setStep(1);
    setSelectedFixtureId(null);
  };

  // Render player row with custom minute controls and tactical actions
  const renderPlayerRow = (p: Player, team: 'home' | 'away') => {
    const pGoalCount = goals.filter((g) => g.playerId === p.id && !g.isOwnGoal).length;
    const pOwnGoalCount = goals.filter((g) => g.playerId === p.id && g.isOwnGoal).length;
    const pAssistCount = playerAssists[p.id] || 0;
    const pSaveCount = playerSaves[p.id] || 0;
    const pPenSavedCount = penaltiesSaved[p.id] || 0;
    const pPenMissedCount = penaltiesMissed[p.id] || 0;
    const pMins = playerMinutes[p.id] || 0;
    const isYellow = yellowCards.includes(p.id);
    const isRed = redCards.includes(p.id);
    const isMvp = mvps.includes(p.id);

    return (
      <div
        key={p.id}
        className="p-2.5 rounded-xl bg-zinc-950/70 border border-white/5 space-y-2 hover:border-white/10 transition-colors"
      >
        {/* Player Identity & Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <KitJersey clubId={p.clubId} position={p.position} className="w-6 h-6 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-xs text-white truncate max-w-[130px] sm:max-w-[170px]">
                  {p.webName}
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded font-black bg-white/10 text-emerald-400">
                  {p.position}
                </span>
                {isMvp && (
                  <span className="text-[9px] px-1 py-0.2 rounded font-black bg-amber-400 text-slate-950 flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" /> MVP
                  </span>
                )}
              </div>
              {/* Event indicators */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mt-0.5 flex-wrap">
                {pGoalCount > 0 && <span className="text-emerald-400 font-bold">⚽ {pGoalCount}</span>}
                {pOwnGoalCount > 0 && <span className="text-rose-400 font-bold">⚽ (OG) {pOwnGoalCount}</span>}
                {pAssistCount > 0 && <span className="text-sky-400 font-bold">👟 {pAssistCount}</span>}
                {pSaveCount > 0 && <span className="text-amber-400 font-bold">🧤 {pSaveCount}</span>}
                {pPenSavedCount > 0 && <span className="text-emerald-400 font-bold">🛡️ {pPenSavedCount}</span>}
                {pPenMissedCount > 0 && <span className="text-rose-400 font-bold">❌ {pPenMissedCount}</span>}
                {isYellow && <span className="text-yellow-400">🟨</span>}
                {isRed && <span className="text-rose-400">🟥</span>}
              </div>
            </div>
          </div>

          {/* Custom Minute Timer Box */}
          <div className="flex items-center gap-1 shrink-0 bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={(e) => handleStepPlayerMinutes(p.id, -5, e)}
              className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white text-[10px] font-bold"
              title="-5 minutes"
            >
              -5
            </button>
            <button
              onClick={(e) => handleStepPlayerMinutes(p.id, -1, e)}
              className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white text-[10px] font-bold"
              title="-1 minute"
            >
              -
            </button>

            <div className="relative flex items-center">
              <input
                type="number"
                min="0"
                max="120"
                value={pMins}
                onChange={(e) => handleSetPlayerMinutes(p.id, parseInt(e.target.value) || 0)}
                className={`w-11 text-center py-0.5 text-xs font-mono font-black rounded-lg border outline-none ${
                  pMins > 0
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-zinc-900 border-white/10 text-zinc-500'
                }`}
              />
              <span className="text-[9px] text-zinc-500 font-mono ml-0.5 mr-1">m</span>
            </div>

            <button
              onClick={(e) => handleStepPlayerMinutes(p.id, 1, e)}
              className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white text-[10px] font-bold"
              title="+1 minute"
            >
              +
            </button>
            <button
              onClick={(e) => handleStepPlayerMinutes(p.id, 5, e)}
              className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white text-[10px] font-bold"
              title="+5 minutes"
            >
              +5
            </button>

            {/* Quick Presets */}
            <div className="flex items-center gap-0.5 border-l border-white/10 pl-1">
              <button
                onClick={() => handleSetPlayerMinutes(p.id, defaultMinutes)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-colors ${
                  pMins === defaultMinutes
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
                title="Full Match"
              >
                Full
              </button>
              <button
                onClick={() => handleSetPlayerMinutes(p.id, Math.round(defaultMinutes / 2))}
                className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-colors ${
                  pMins === Math.round(defaultMinutes / 2)
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
                title="Half Match (20m)"
              >
                Half
              </button>
              <button
                onClick={() => handleSetPlayerMinutes(p.id, 0)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-colors ${
                  pMins === 0 ? 'bg-rose-500 text-white' : 'bg-white/5 text-zinc-500 hover:text-white'
                }`}
                title="Did Not Play (0m)"
              >
                0m
              </button>
              {currentMatchMinute > 0 && (
                <button
                  onClick={() => handleSetPlayerMinutes(p.id, currentMatchMinute)}
                  className="px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-slate-950 transition-colors border border-sky-500/30"
                  title={`Set to current clock (${currentMatchMinute}m)`}
                >
                  ⏱️ {currentMatchMinute}&apos;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rapid Tactile Action Buttons */}
        <div className="flex items-center gap-1 flex-wrap pt-0.5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => handleRapidGoal(p, team, e)}
            className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-black text-[10px] hover:bg-emerald-500 hover:text-slate-950 transition-colors"
          >
            + Goal ({getGoalPoints(p.position)}pt)
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => handleRapidAssist(p, e)}
            className="px-2 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 font-black text-[10px] hover:bg-sky-500 hover:text-slate-950 transition-colors"
          >
            + Assist ({getAssistPoints()}pt)
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => handleRapidOwnGoal(p, team, e)}
            className="px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-black text-[10px] hover:bg-rose-500 hover:text-white transition-colors"
            title="Own Goal (-3 pts)"
          >
            + OG (-3)
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => handleRapidMissedPen(p, e)}
            className="px-1.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[10px] hover:bg-amber-500 hover:text-slate-950 transition-colors"
            title="Missed Penalty (-2 pts)"
          >
            ❌ Miss Pen
          </motion.button>

          {p.position === 'GKP' && (
            <>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleRapidSavedPen(p, e)}
                className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-[10px] hover:bg-emerald-500 hover:text-slate-950 transition-colors"
                title="Saved Penalty (+3 pts for GK only)"
              >
                🧤 Pen Save (+3)
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleRapidSave(p, e)}
                className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-[10px] hover:bg-amber-500 hover:text-slate-950 transition-colors"
              >
                + Save
              </motion.button>
            </>
          )}

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => handleToggleCard(p.id, 'yellow', e)}
            className={`px-1.5 py-1 rounded-lg border text-[10px] font-bold transition-colors ${
              isYellow ? 'bg-yellow-500 text-slate-950 border-yellow-400' : 'bg-white/5 border-white/10 text-zinc-400'
            }`}
            title="Yellow Card (-1 pt)"
          >
            🟨
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => handleToggleCard(p.id, 'red', e)}
            className={`px-1.5 py-1 rounded-lg border text-[10px] font-bold transition-colors ${
              isRed ? 'bg-rose-500 text-white border-rose-400' : 'bg-white/5 border-white/10 text-zinc-400'
            }`}
            title="Red Card (-3 pts)"
          >
            🟥
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => handleToggleMvp(p.id, e)}
            className={`px-2 py-1 rounded-lg border text-[10px] font-black transition-colors ${
              isMvp ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs' : 'bg-white/5 border-white/10 text-zinc-400'
            }`}
          >
            ⭐ MVP (+{getMvpPoints()})
          </motion.button>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // STEP 1: SELECT MATCH
  // -------------------------------------------------------------
  if (step === 1) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>Matchday Command Console</span>
            </h2>
            <p className="text-xs text-zinc-400">Select a fixture to enter stats, minutes, and scores</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white/5 border border-white/10 rounded-xl text-zinc-300">
            GW {currentGW}
          </span>
        </div>

        {currentFixtures.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-900 rounded-2xl border border-white/10">
            No fixtures scheduled for Gameweek {currentGW}. Please schedule games first.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentFixtures.map((f) => {
              const home = CLUBS[f.homeClubId];
              const away = CLUBS[f.awayClubId];
              const isOnePriceVenue = f.venue === 'one_price';

              return (
                <div
                  key={f.id}
                  onClick={() => handleSelectFixture(f.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] hover:border-emerald-500/50 ${
                    f.isFinished
                      ? 'bg-zinc-900/60 border-white/5'
                      : f.isLive
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/20'
                      : 'bg-zinc-900 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 ${
                        isOnePriceVenue
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border border-white/10'
                      }`}
                    >
                      {isOnePriceVenue ? <Building className="w-3 h-3 text-amber-400" /> : <MapPin className="w-3 h-3 text-emerald-400" />}
                      <span>{isOnePriceVenue ? 'One Price Stadium' : 'Delisi Stadium'}</span>
                    </span>

                    {f.isFinished ? (
                      <span className="text-emerald-400 font-black text-[10px] uppercase">Final Result</span>
                    ) : f.isLive ? (
                      <span className="text-rose-400 font-black text-[10px] animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> LIVE
                      </span>
                    ) : (
                      <span className="text-zinc-500 font-mono text-[10px]">{f.kickoffTime}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <ClassShieldBadge clubId={f.homeClubId} size="sm" />
                      <span className="font-extrabold text-sm text-white">{home?.name}</span>
                    </div>

                    <div className="px-3 py-1 bg-zinc-950 rounded-xl border border-white/10 font-mono font-black text-sm text-white shrink-0">
                      {f.homeScore !== null ? `${f.homeScore} - ${f.awayScore}` : 'VS'}
                    </div>

                    <div className="flex items-center justify-end gap-2 flex-1 text-right">
                      <span className="font-extrabold text-sm text-white">{away?.name}</span>
                      <ClassShieldBadge clubId={f.awayClubId} size="sm" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 2: MATCH EVENTS CONSOLE
  // -------------------------------------------------------------
  if (step === 2 && fixture && homeClub && awayClub) {
    return (
      <div className="space-y-4 animate-fade-in relative">
        {/* Floating Feedback Badges */}
        {floatingPoints.map((fp) => (
          <motion.div
            key={fp.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -45, scale: 1.25 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className={`fixed z-50 pointer-events-none px-2.5 py-1 rounded-full text-xs font-black shadow-2xl ${fp.color}`}
            style={{ left: fp.x - 40, top: fp.y - 20 }}
          >
            {fp.text}
          </motion.div>
        ))}

        {/* Top Action Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-white/10">
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Switch Match
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl hover:bg-emerald-400 transition-colors shadow-md"
            >
              <span>Review & Save</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STADIUM SELECTOR & RULES BANNER */}
        <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Select Match Stadium:</span>
            </span>

            {/* Stadium Switcher Buttons */}
            <div className="flex items-center gap-2 p-1 bg-zinc-950 rounded-xl border border-white/10">
              <button
                onClick={() => setVenue('delisi')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  !isOnePrice
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>🏟️ Delisi Stadium</span>
              </button>

              <button
                onClick={() => setVenue('one_price')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  isOnePrice
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>🏢 One Price Stadium</span>
              </button>
            </div>
          </div>

          {/* Active Stadium Rule Notification */}
          <div
            className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-center gap-2 ${
              isOnePrice
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
            }`}
          >
            {isOnePrice ? (
              <>
                <Building className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>One Price Stadium Rule Active:</strong> High-scoring arena. Goals, Assists, and MVP points
                  are each <strong>reduced by 1 point</strong> (GK Goal: 6, DEF Goal: 5, MID Goal: 4, FWD Goal: 3, Assist: 2, MVP: 2).
                </span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Delisi (Parki) Stadium Active:</strong> Standard tournament rules apply (GK Goal: 7, DEF Goal: 6,
                  MID Goal: 5, FWD Goal: 4, Assist: 3, MVP: 3).
                </span>
              </>
            )}
          </div>
        </div>

        {/* TACTICAL SCOREBOARD */}
        <div className="bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-white/10 text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-4 sm:gap-10">
            {/* Home Score */}
            <div className="flex flex-col items-center gap-2 w-1/3">
              <div className="flex items-center gap-2">
                <ClassShieldBadge clubId={homeClub.id} size="sm" />
                <span className="font-black text-sm sm:text-base text-white truncate">{homeClub.shortName}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setHomeScore((s) => Math.max(0, s - 1))}
                  className="p-1.5 rounded-xl bg-white/5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-4xl sm:text-5xl font-mono font-black text-white w-14 text-center">
                  {homeScore}
                </span>
                <button
                  onClick={() => setHomeScore((s) => s + 1)}
                  className="p-1.5 rounded-xl bg-white/5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-zinc-600 font-black text-2xl font-mono">—</div>

            {/* Away Score */}
            <div className="flex flex-col items-center gap-2 w-1/3">
              <div className="flex items-center gap-2">
                <ClassShieldBadge clubId={awayClub.id} size="sm" />
                <span className="font-black text-sm sm:text-base text-white truncate">{awayClub.shortName}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setAwayScore((s) => Math.max(0, s - 1))}
                  className="p-1.5 rounded-xl bg-white/5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-4xl sm:text-5xl font-mono font-black text-white w-14 text-center">
                  {awayScore}
                </span>
                <button
                  onClick={() => setAwayScore((s) => s + 1)}
                  className="p-1.5 rounded-xl bg-white/5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LIVE MATCH STOPWATCH & MINUTE CONTROL CENTER */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Live Stopwatch Clock */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 font-mono">
                <Clock className={`w-4 h-4 ${isTimerRunning ? 'text-emerald-400 animate-spin' : 'text-zinc-400'}`} />
                <span className="text-base sm:text-lg font-black text-white">{formatTimerDisplay(matchSeconds)}</span>
                <span className="text-xs text-emerald-400 font-bold ml-1">
                  ({currentMatchMinute}&apos;)
                </span>
              </div>

              {/* Stopwatch Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    isTimerRunning
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isTimerRunning ? 'Pause' : 'Start Timer'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setMatchSeconds(0);
                  }}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  title="Reset Timer to 00:00"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bulk Minute Tools */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span>Match Length:</span>
                <input
                  type="number"
                  min="20"
                  max="120"
                  value={defaultMinutes}
                  onChange={(e) => setDefaultMinutes(parseInt(e.target.value) || 40)}
                  className="w-12 bg-zinc-950 border border-white/10 rounded-lg px-1.5 py-1 text-center font-mono font-bold text-white text-xs outline-none"
                />
                <span>m</span>
              </div>

              <button
                onClick={() => setAllMinutes(defaultMinutes)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs hover:bg-emerald-500 hover:text-slate-950 transition-all"
              >
                All Full Match ({defaultMinutes}m)
              </button>

              <button
                onClick={() => setAllMinutes(0)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-rose-400 font-bold text-xs transition-colors"
              >
                Clear All (0m)
              </button>
            </div>
          </div>
        </div>

        {/* SIDE-BY-SIDE ROSTER CARDS WITH TACTICAL ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* HOME TEAM ROSTER */}
          <div className="space-y-2 bg-zinc-900/90 p-3 sm:p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ClassShieldBadge clubId={homeClub.id} size="sm" />
                <h3 className="font-black text-sm text-white">{homeClub.name} (Home)</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-zinc-400">
                {matchPlayers.home.length} Players
              </span>
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {matchPlayers.home.map((p) => renderPlayerRow(p, 'home'))}
            </div>
          </div>

          {/* AWAY TEAM ROSTER */}
          <div className="space-y-2 bg-zinc-900/90 p-3 sm:p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ClassShieldBadge clubId={awayClub.id} size="sm" />
                <h3 className="font-black text-sm text-white">{awayClub.name} (Away)</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-zinc-400">
                {matchPlayers.away.length} Players
              </span>
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {matchPlayers.away.map((p) => renderPlayerRow(p, 'away'))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 3: REVIEW & COMMIT MATCH
  // -------------------------------------------------------------
  if (step === 3 && fixture && homeClub && awayClub) {
    const homeCleanSheet = awayScore === 0;
    const awayCleanSheet = homeScore === 0;

    return (
      <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Console
          </button>
          <span className="text-xs font-bold text-emerald-400">Matchday Final Verification</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-4 text-center">
          <h3 className="font-black text-lg text-white">Commit Match Result</h3>

          {/* Stadium Indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-zinc-300">
            {isOnePrice ? (
              <>
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>🏢 One Price Stadium (-1 pt for Goals, Assists, MVP)</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>🏟️ Delisi Stadium (Standard Rules)</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-8 py-2">
            <div className="text-center">
              <ClassShieldBadge clubId={homeClub.id} size="md" />
              <span className="font-extrabold text-sm text-white block mt-1">{homeClub.shortName}</span>
              <span className="text-3xl font-black font-mono text-emerald-400">{homeScore}</span>
              {homeCleanSheet && (
                <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">Clean Sheet (+4 DEF/GK)</span>
              )}
              {awayScore >= 2 && (
                <span className="text-[10px] text-rose-400 font-bold block mt-0.5">
                  Conceded {awayScore} (-{Math.floor(awayScore / 2)} DEF/GK)
                </span>
              )}
            </div>

            <span className="text-2xl font-black text-zinc-600">—</span>

            <div className="text-center">
              <ClassShieldBadge clubId={awayClub.id} size="md" />
              <span className="font-extrabold text-sm text-white block mt-1">{awayClub.shortName}</span>
              <span className="text-3xl font-black font-mono text-emerald-400">{awayScore}</span>
              {awayCleanSheet && (
                <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">Clean Sheet (+4 DEF/GK)</span>
              )}
              {homeScore >= 2 && (
                <span className="text-[10px] text-rose-400 font-bold block mt-0.5">
                  Conceded {homeScore} (-{Math.floor(homeScore / 2)} DEF/GK)
                </span>
              )}
            </div>
          </div>

          {/* Match Log Summary */}
          <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-white/5 text-left text-xs text-zinc-300 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
              <strong>Goals Logged ({goals.length}):</strong>
              <span>
                {goals.filter((g) => !g.isOwnGoal).length} regular, {goals.filter((g) => g.isOwnGoal).length} own goals
              </span>
            </div>

            <div>
              <strong>MVPs:</strong> {mvps.map((id) => players[id]?.webName).join(', ') || 'None selected'}
            </div>

            <div>
              <strong>Disciplinary Cards:</strong> {yellowCards.length} 🟨, {redCards.length} 🟥
            </div>

            <div className="pt-1 text-[11px] text-zinc-400">
              * Points for conceded goals (-1 per 2 conceded for DEF/GK), own goals (-3), missed penalties (-2), and clean sheets (+4) will be calculated and updated immediately.
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg active:scale-98 cursor-pointer"
          >
            Save & Update Fantasy Points
          </button>
        </div>
      </div>
    );
  }

  return null;
};

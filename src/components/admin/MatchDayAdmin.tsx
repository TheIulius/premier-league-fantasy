import React, { useState, useMemo } from 'react';
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
  const [venue, setVenue] = useState<Venue>('parki');

  // Events State
  const [goals, setGoals] = useState<(MatchGoal & { team: 'home' | 'away' })[]>([]);
  const [mvps, setMvps] = useState<string[]>([]);
  const [playerMinutes, setPlayerMinutes] = useState<Record<string, number>>({});
  const [defaultMinutes, setDefaultMinutes] = useState<number>(40);
  const [yellowCards, setYellowCards] = useState<string[]>([]);
  const [redCards, setRedCards] = useState<string[]>([]);
  const [penaltiesSaved, setPenaltiesSaved] = useState<Record<string, number>>({});
  const [penaltiesMissed, setPenaltiesMissed] = useState<Record<string, number>>({});
  const [playerAssists, setPlayerAssists] = useState<Record<string, number>>({});
  const [playerSaves, setPlayerSaves] = useState<Record<string, number>>({});

  // Floating point feedback
  const [floatingPoints, setFloatingPoints] = useState<FloatingPointBadge[]>([]);

  const fixture = fixtures.find((f) => f.id === selectedFixtureId);
  const currentFixtures = fixtures.filter((f) => f.gameweek === currentGW);

  const homeClub = fixture ? CLUBS[fixture.homeClubId] : null;
  const awayClub = fixture ? CLUBS[fixture.awayClubId] : null;

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
    setVenue(f?.venue || 'parki');
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
    setStep(2);
  };

  // Rapid Tactile Actions on Players
  const handleRapidGoal = (player: Player, team: 'home' | 'away', e: React.MouseEvent) => {
    const pts = player.position === 'FWD' ? 6 : player.position === 'MID' ? 6 : 7;
    spawnFloatingPoint(`+${pts} Goal`, 'bg-emerald-500 text-slate-950', e);

    setGoals((prev) => [
      ...prev,
      {
        playerId: player.id,
        team,
        isOwnGoal: false,
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
    spawnFloatingPoint('+3 Assist', 'bg-sky-500 text-slate-950', e);
    setPlayerAssists((prev) => ({ ...prev, [player.id]: (prev[player.id] || 0) + 1 }));

    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleRapidSave = (player: Player, e: React.MouseEvent) => {
    spawnFloatingPoint('+1 Save', 'bg-amber-500 text-slate-950', e);
    setPlayerSaves((prev) => ({ ...prev, [player.id]: (prev[player.id] || 0) + 1 }));

    if (!playerMinutes[player.id]) {
      setPlayerMinutes((prev) => ({ ...prev, [player.id]: defaultMinutes }));
    }
  };

  const handleToggleCard = (playerId: string, type: 'yellow' | 'red', e: React.MouseEvent) => {
    if (type === 'yellow') {
      const isAlready = yellowCards.includes(playerId);
      if (!isAlready) spawnFloatingPoint('-1 Yellow', 'bg-yellow-500 text-slate-950', e);
      setYellowCards((prev) =>
        prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
      );
    } else {
      const isAlready = redCards.includes(playerId);
      if (!isAlready) spawnFloatingPoint('-3 Red', 'bg-rose-500 text-white', e);
      setRedCards((prev) =>
        prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
      );
    }
  };

  const handleToggleMvp = (playerId: string, e: React.MouseEvent) => {
    const isAlready = mvps.includes(playerId);
    if (!isAlready) spawnFloatingPoint('+3 MVP', 'bg-amber-400 text-slate-950 font-black', e);
    setMvps((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const handleSubOut = (playerId: string, currentMins: number, e: React.MouseEvent) => {
    const nextMins = currentMins === defaultMinutes ? Math.round(defaultMinutes / 2) : defaultMinutes;
    spawnFloatingPoint(`${nextMins}'`, 'bg-zinc-200 text-slate-900', e);
    setPlayerMinutes((prev) => ({ ...prev, [playerId]: nextMins }));
  };

  const setAllMinutes = () => {
    const newMins: Record<string, number> = {};
    [...matchPlayers.home, ...matchPlayers.away].forEach((p) => {
      newMins[p.id] = defaultMinutes;
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

      // Determine clean sheet
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
        cleanSheet,
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
  };

  // -------------------------------------------------------------
  // STEP 1: FIXTURE SELECTION
  // -------------------------------------------------------------
  if (step === 1) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span>Select Active Match (GW {currentGW})</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Pick a match to launch the tactile side-by-side scoring dashboard
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-emerald-400">
            {currentFixtures.length} Fixtures
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentFixtures.map((f) => {
            const hClub = CLUBS[f.homeClubId];
            const aClub = CLUBS[f.awayClubId];
            return (
              <motion.div
                key={f.id}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => handleSelectFixture(f.id)}
                className="bg-zinc-900 p-4 rounded-2xl border border-white/10 cursor-pointer hover:border-emerald-500/50 transition-all shadow-sm space-y-3"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold px-2 py-0.5 bg-zinc-950 rounded-md text-zinc-300 border border-white/5 flex items-center gap-1">
                    {f.venue === 'one_price' ? '🏢 One Price' : '🏟️ Parki'}
                  </span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-md ${
                      f.isFinished
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : f.isLive
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                        : 'bg-white/5 text-zinc-400'
                    }`}
                  >
                    {f.isFinished ? '✓ Finished' : f.isLive ? '● LIVE' : 'Scheduled'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  {/* Home Team */}
                  <div className="flex flex-col items-center gap-1.5 w-1/3 text-center">
                    <ClassShieldBadge clubId={f.homeClubId} size="md" />
                    <span className="font-bold text-xs text-white truncate max-w-[100px]">
                      {hClub?.name || f.homeClubId}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="w-1/3 flex flex-col items-center justify-center">
                    <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white">
                      {f.homeScore ?? '-'} : {f.awayScore ?? '-'}
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center gap-1.5 w-1/3 text-center">
                    <ClassShieldBadge clubId={f.awayClubId} size="md" />
                    <span className="font-bold text-xs text-white truncate max-w-[100px]">
                      {aClub?.name || f.awayClubId}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {currentFixtures.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
              No fixtures scheduled for GW {currentGW}. Add fixtures in Step 1.
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 2: MATCH-CENTRIC SIDE-BY-SIDE ROSTER SCORING
  // -------------------------------------------------------------
  if (step === 2 && fixture && homeClub && awayClub) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto animate-fade-in relative pb-12">
        {/* Floating Point Feedback Badges */}
        {floatingPoints.map((pt) => (
          <motion.div
            key={pt.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -45, scale: 1.25 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ left: pt.x, top: pt.y }}
            className={`fixed pointer-events-none z-50 -translate-x-1/2 font-black text-xs px-2 py-0.5 rounded-full shadow-lg ${pt.color}`}
          >
            {pt.text}
          </motion.div>
        ))}

        {/* Top Control Bar */}
        <div className="flex justify-between items-center bg-zinc-900/90 p-2.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Change Match
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVenue(venue === 'parki' ? 'one_price' : 'parki')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white transition-colors"
            >
              {venue === 'one_price' ? '🏢 One Price' : '🏟️ Parki'}
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1 px-4 py-1.5 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl hover:bg-emerald-400 transition-colors shadow-xs"
            >
              <span>Review Match</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tactical Broadcast Scoreboard */}
        <div className="bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-white/10 text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-6 sm:gap-12">
            {/* Home Score */}
            <div className="flex flex-col items-center gap-2 w-1/3">
              <div className="flex items-center gap-2">
                <ClassShieldBadge clubId={homeClub.id} size="sm" />
                <span className="font-black text-sm sm:text-base text-white">{homeClub.shortName}</span>
              </div>
              <div className="flex items-center gap-3">
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

            <div className="text-2xl font-mono font-black text-zinc-600">—</div>

            {/* Away Score */}
            <div className="flex flex-col items-center gap-2 w-1/3">
              <div className="flex items-center gap-2">
                <ClassShieldBadge clubId={awayClub.id} size="sm" />
                <span className="font-black text-sm sm:text-base text-white">{awayClub.shortName}</span>
              </div>
              <div className="flex items-center gap-3">
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

        {/* Minutes Bulk Tool */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs">
          <span className="font-bold text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Match Duration:</span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={defaultMinutes}
              onChange={(e) => setDefaultMinutes(parseInt(e.target.value) || 0)}
              className="w-14 bg-zinc-950 border border-white/10 rounded-lg px-2 py-1 text-center font-mono font-bold text-white text-xs outline-none"
            />
            <button
              onClick={setAllMinutes}
              className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all"
            >
              Set All to {defaultMinutes}m
            </button>
          </div>
        </div>

        {/* SIDE-BY-SIDE ROSTER CARDS WITH RAPID ACTION BUTTONS */}
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

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {matchPlayers.home.map((p) => {
                const pGoalCount = goals.filter((g) => g.playerId === p.id && !g.isOwnGoal).length;
                const pAssistCount = playerAssists[p.id] || 0;
                const pSaveCount = playerSaves[p.id] || 0;
                const pMins = playerMinutes[p.id] || 0;
                const isYellow = yellowCards.includes(p.id);
                const isRed = redCards.includes(p.id);
                const isMvp = mvps.includes(p.id);

                return (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl bg-zinc-950/70 border border-white/5 space-y-1.5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KitJersey clubId={p.clubId} position={p.position} className="w-6 h-6 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-white">{p.webName}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded font-black bg-white/10 text-emerald-400">
                              {p.position}
                            </span>
                            {isMvp && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-black bg-amber-400 text-slate-950 flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5" /> MVP
                              </span>
                            )}
                          </div>
                          {/* Live stats summary tags */}
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mt-0.5">
                            {pGoalCount > 0 && <span className="text-emerald-400 font-bold">⚽ {pGoalCount}</span>}
                            {pAssistCount > 0 && <span className="text-sky-400 font-bold">👟 {pAssistCount}</span>}
                            {pSaveCount > 0 && <span className="text-amber-400 font-bold">🧤 {pSaveCount}</span>}
                            {isYellow && <span className="text-yellow-400">🟨</span>}
                            {isRed && <span className="text-rose-400">🟥</span>}
                            <span>{pMins}&apos;</span>
                          </div>
                        </div>
                      </div>

                      {/* Minutes quick button */}
                      <button
                        onClick={(e) => handleSubOut(p.id, pMins, e)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                          pMins > 0
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-white/5 border-white/10 text-zinc-500'
                        }`}
                        title="Toggle Minutes"
                      >
                        {pMins > 0 ? `${pMins}m` : '0m'}
                      </button>
                    </div>

                    {/* Rapid Tactile Action Buttons */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleRapidGoal(p, 'home', e)}
                        className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-black text-[10px] hover:bg-emerald-500 hover:text-slate-950 transition-colors"
                      >
                        + Goal
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleRapidAssist(p, e)}
                        className="px-2 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 font-black text-[10px] hover:bg-sky-500 hover:text-slate-950 transition-colors"
                      >
                        + Assist
                      </motion.button>

                      {p.position === 'GKP' && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleRapidSave(p, e)}
                          className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-[10px] hover:bg-amber-500 hover:text-slate-950 transition-colors"
                        >
                          + Save
                        </motion.button>
                      )}

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleToggleCard(p.id, 'yellow', e)}
                        className={`px-1.5 py-1 rounded-lg border text-[10px] font-bold transition-colors ${
                          isYellow ? 'bg-yellow-500 text-slate-950 border-yellow-400' : 'bg-white/5 border-white/10 text-zinc-400'
                        }`}
                      >
                        🟨
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleToggleCard(p.id, 'red', e)}
                        className={`px-1.5 py-1 rounded-lg border text-[10px] font-bold transition-colors ${
                          isRed ? 'bg-rose-500 text-white border-rose-400' : 'bg-white/5 border-white/10 text-zinc-400'
                        }`}
                      >
                        🟥
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleToggleMvp(p.id, e)}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-black transition-colors ${
                          isMvp ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-white/5 border-white/10 text-zinc-400'
                        }`}
                      >
                        ⭐ MVP
                      </motion.button>
                    </div>
                  </div>
                );
              })}
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

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {matchPlayers.away.map((p) => {
                const pGoalCount = goals.filter((g) => g.playerId === p.id && !g.isOwnGoal).length;
                const pAssistCount = playerAssists[p.id] || 0;
                const pSaveCount = playerSaves[p.id] || 0;
                const pMins = playerMinutes[p.id] || 0;
                const isYellow = yellowCards.includes(p.id);
                const isRed = redCards.includes(p.id);
                const isMvp = mvps.includes(p.id);

                return (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl bg-zinc-950/70 border border-white/5 space-y-1.5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KitJersey clubId={p.clubId} position={p.position} className="w-6 h-6 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-white">{p.webName}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded font-black bg-white/10 text-emerald-400">
                              {p.position}
                            </span>
                            {isMvp && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-black bg-amber-400 text-slate-950 flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5" /> MVP
                              </span>
                            )}
                          </div>
                          {/* Live stats summary tags */}
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mt-0.5">
                            {pGoalCount > 0 && <span className="text-emerald-400 font-bold">⚽ {pGoalCount}</span>}
                            {pAssistCount > 0 && <span className="text-sky-400 font-bold">👟 {pAssistCount}</span>}
                            {pSaveCount > 0 && <span className="text-amber-400 font-bold">🧤 {pSaveCount}</span>}
                            {isYellow && <span className="text-yellow-400">🟨</span>}
                            {isRed && <span className="text-rose-400">🟥</span>}
                            <span>{pMins}&apos;</span>
                          </div>
                        </div>
                      </div>

                      {/* Minutes quick button */}
                      <button
                        onClick={(e) => handleSubOut(p.id, pMins, e)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                          pMins > 0
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-white/5 border-white/10 text-zinc-500'
                        }`}
                        title="Toggle Minutes"
                      >
                        {pMins > 0 ? `${pMins}m` : '0m'}
                      </button>
                    </div>

                    {/* Rapid Tactile Action Buttons */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleRapidGoal(p, 'away', e)}
                        className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-black text-[10px] hover:bg-emerald-500 hover:text-slate-950 transition-colors"
                      >
                        + Goal
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleRapidAssist(p, e)}
                        className="px-2 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 font-black text-[10px] hover:bg-sky-500 hover:text-slate-950 transition-colors"
                      >
                        + Assist
                      </motion.button>

                      {p.position === 'GKP' && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleRapidSave(p, e)}
                          className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-[10px] hover:bg-amber-500 hover:text-slate-950 transition-colors"
                        >
                          + Save
                        </motion.button>
                      )}

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleToggleCard(p.id, 'yellow', e)}
                        className={`px-1.5 py-1 rounded-lg border text-[10px] font-bold transition-colors ${
                          isYellow ? 'bg-yellow-500 text-slate-950 border-yellow-400' : 'bg-white/5 border-white/10 text-zinc-400'
                        }`}
                      >
                        🟨
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleToggleCard(p.id, 'red', e)}
                        className={`px-1.5 py-1 rounded-lg border text-[10px] font-bold transition-colors ${
                          isRed ? 'bg-rose-500 text-white border-rose-400' : 'bg-white/5 border-white/10 text-zinc-400'
                        }`}
                      >
                        🟥
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleToggleMvp(p.id, e)}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-black transition-colors ${
                          isMvp ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-white/5 border-white/10 text-zinc-400'
                        }`}
                      >
                        ⭐ MVP
                      </motion.button>
                    </div>
                  </div>
                );
              })}
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
          <div className="flex items-center justify-center gap-8 py-2">
            <div className="text-center">
              <ClassShieldBadge clubId={homeClub.id} size="md" />
              <span className="font-extrabold text-sm text-white block mt-1">{homeClub.shortName}</span>
              <span className="text-3xl font-black font-mono text-emerald-400">{homeScore}</span>
            </div>
            <span className="text-2xl font-black text-zinc-600">—</span>
            <div className="text-center">
              <ClassShieldBadge clubId={awayClub.id} size="md" />
              <span className="font-extrabold text-sm text-white block mt-1">{awayClub.shortName}</span>
              <span className="text-3xl font-black font-mono text-emerald-400">{awayScore}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/5 text-left text-xs text-zinc-300 space-y-1">
            <div>
              <strong>Goals Logged:</strong> {goals.length}
            </div>
            <div>
              <strong>MVPs:</strong> {mvps.map((id) => players[id]?.webName).join(', ') || 'None'}
            </div>
            <div>
              <strong>Cards:</strong> {yellowCards.length} 🟨, {redCards.length} 🟥
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg active:scale-98"
          >
            Save & Update Fantasy Points
          </button>
        </div>
      </div>
    );
  }

  return null;
};

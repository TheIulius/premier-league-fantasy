import React, { useState, useMemo } from 'react';
import { useFPL } from '../../context/FPLContext';
import { KitJersey } from '../pitch/KitJersey';
import { CLUBS } from '../../data/clubs';
import { MatchGoal, Venue } from '../../types/fpl';
import confetti from 'canvas-confetti';
import {
  Trophy, Plus, Minus, Crown, AlertCircle, Check, ChevronLeft, ChevronRight,
  Award, Zap, Clock, Shield, Flag, Trash2, Users as UsersIcon
} from 'lucide-react';

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

  // Goal Form State
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTeam, setGoalTeam] = useState<'home' | 'away'>('home');
  const [goalScorer, setGoalScorer] = useState<string>('');
  const [goalAssist, setGoalAssist] = useState<string>('');
  const [goalMinute, setGoalMinute] = useState<string>('');
  const [goalIsOwn, setGoalIsOwn] = useState(false);

  const fixture = fixtures.find(f => f.id === selectedFixtureId);
  const currentFixtures = fixtures.filter(f => f.gameweek === currentGW);

  const homeClub = fixture ? CLUBS[fixture.homeClubId] : null;
  const awayClub = fixture ? CLUBS[fixture.awayClubId] : null;

  const matchPlayers = useMemo(() => {
    if (!fixture) return { home: [], away: [] };
    const all = Object.values(players);
    return {
      home: all.filter(p => p.clubId === fixture.homeClubId || (p.clubId === 'SCH' && fixture.homeClubId === 'SCH_11_5') || (p.clubId === 'SCH_11_5' && fixture.homeClubId === 'SCH')),
      away: all.filter(p => p.clubId === fixture.awayClubId || (p.clubId === 'SCH' && fixture.awayClubId === 'SCH_11_5') || (p.clubId === 'SCH_11_5' && fixture.awayClubId === 'SCH'))
    };
  }, [fixture, players]);

  // Actions
  const handleSelectFixture = (fId: string) => {
    const f = fixtures.find(x => x.id === fId);
    setSelectedFixtureId(fId);
    setHomeScore(f?.homeScore || 0);
    setAwayScore(f?.awayScore || 0);
    setVenue(f?.venue || 'parki');
    setGoals((f?.goalScorers || []).map(g => {
      // Find if scorer is in home or away to determine team, but for own goals it might be tricky.
      // We will assume normal for loaded, but mostly this is for fresh entry anyway.
      return { ...g, team: 'home' }; 
    }));
    setMvps([]);
    setPlayerMinutes({});
    setYellowCards([]);
    setRedCards([]);
    setPenaltiesSaved({});
    setPenaltiesMissed({});
    setStep(2);
  };

  const handleAddGoal = () => {
    if (!goalScorer) return;
    
    setGoals([...goals, {
      playerId: goalScorer,
      assistPlayerId: goalAssist || undefined,
      minute: goalMinute ? parseInt(goalMinute) : undefined,
      isOwnGoal: goalIsOwn,
      team: goalTeam
    }]);

    if (goalTeam === 'home') setHomeScore(s => s + 1);
    else setAwayScore(s => s + 1);

    setShowGoalForm(false);
    setGoalScorer('');
    setGoalAssist('');
    setGoalMinute('');
    setGoalIsOwn(false);
  };

  const toggleMvp = (playerId: string, team: 'home' | 'away') => {
    setMvps(prev => {
      if (prev.includes(playerId)) return prev.filter(id => id !== playerId);
      // Remove any existing MVP from this team
      const teamPlayers = matchPlayers[team].map(p => p.id);
      const filtered = prev.filter(id => !teamPlayers.includes(id));
      return [...filtered, playerId];
    });
  };

  const setAllMinutes = () => {
    const newMins: Record<string, number> = {};
    [...matchPlayers.home, ...matchPlayers.away].forEach(p => {
      newMins[p.id] = defaultMinutes;
    });
    setPlayerMinutes(newMins);
  };

  const toggleCard = (playerId: string, type: 'yellow' | 'red') => {
    if (type === 'yellow') {
      setYellowCards(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]);
    } else {
      setRedCards(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]);
    }
  };

  const adjustPenalty = (playerId: string, type: 'saved' | 'missed', delta: number) => {
    if (type === 'saved') {
      setPenaltiesSaved(prev => ({ ...prev, [playerId]: Math.max(0, (prev[playerId] || 0) + delta) }));
    } else {
      setPenaltiesMissed(prev => ({ ...prev, [playerId]: Math.max(0, (prev[playerId] || 0) + delta) }));
    }
  };

  const handleSave = async () => {
    if (!fixture) return;

    // 1. Update Fixture
    await updateFixture(fixture.id, {
      homeScore,
      awayScore,
      isFinished: true,
      venue,
      goalScorers: goals.map(g => ({
        playerId: g.playerId,
        assistPlayerId: g.assistPlayerId,
        minute: g.minute,
        isOwnGoal: g.isOwnGoal
      }))
    });

    // 2. Update Player Stats
    const allMatchPlayers = [...matchPlayers.home, ...matchPlayers.away];
    
    for (const p of allMatchPlayers) {
      const mins = playerMinutes[p.id] || 0;
      if (mins === 0) continue; // Skip players who didn't play

      // Calculate goals, assists, own goals for this player
      const pGoals = goals.filter(g => g.playerId === p.id && !g.isOwnGoal).length;
      const pOwnGoals = goals.filter(g => g.playerId === p.id && g.isOwnGoal).length;
      const pAssists = goals.filter(g => g.assistPlayerId === p.id).length;
      
      // Determine clean sheet
      const isHome = matchPlayers.home.some(hp => hp.id === p.id);
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
        isMVP: pIsMvp
      });
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#34D399', '#FBBF24']
    });

    setStep(1);
  };

  if (step === 1) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-emerald-500" />
          Select Match
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentFixtures.map(f => {
            const hClub = CLUBS[f.homeClubId];
            const aClub = CLUBS[f.awayClubId];
            return (
              <div 
                key={f.id} 
                onClick={() => handleSelectFixture(f.id)}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-500 transition-colors shadow-sm"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    {f.venue === 'one_price' ? '🏢 One Price' : '🏟️ Parki'}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${f.isFinished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : f.isLive ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {f.isFinished ? '✓ Complete' : f.isLive ? '● In Progress' : 'Not Started'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-sm" style={{ backgroundColor: hClub?.primaryColor, color: hClub?.textColor, border: `2px solid ${hClub?.secondaryColor}` }}>
                      {hClub?.shortName}
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm text-center">{hClub?.name}</span>
                  </div>
                  <div className="w-1/3 flex flex-col items-center justify-center">
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {f.homeScore ?? '-'} : {f.awayScore ?? '-'}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-sm" style={{ backgroundColor: aClub?.primaryColor, color: aClub?.textColor, border: `2px solid ${aClub?.secondaryColor}` }}>
                      {aClub?.shortName}
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm text-center">{aClub?.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {currentFixtures.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No fixtures found for GW {currentGW}.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 2 && fixture && homeClub && awayClub) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <button onClick={() => setStep(3)} className="flex items-center gap-1 px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors">
            Review <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Scoreboard */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <button 
              onClick={() => setVenue(venue === 'parki' ? 'one_price' : 'parki')}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {venue === 'one_price' ? '🏢 One Price' : '🏟️ Parki'}
            </button>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-8">
            {/* Home Score */}
            <div className="flex flex-col items-center gap-4 w-1/3">
              <span className="font-bold text-xl text-slate-900 dark:text-white" style={{ color: homeClub.primaryColor }}>{homeClub.shortName}</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setHomeScore(s => Math.max(0, s - 1))} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-600"><Minus className="w-6 h-6" /></button>
                <span className="text-6xl font-black text-slate-900 dark:text-white w-16 text-center">{homeScore}</span>
                <button onClick={() => setHomeScore(s => s + 1)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-600"><Plus className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="text-3xl font-black text-slate-300 dark:text-slate-700">—</div>

            {/* Away Score */}
            <div className="flex flex-col items-center gap-4 w-1/3">
              <span className="font-bold text-xl text-slate-900 dark:text-white" style={{ color: awayClub.primaryColor }}>{awayClub.shortName}</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setAwayScore(s => Math.max(0, s - 1))} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-600"><Minus className="w-6 h-6" /></button>
                <span className="text-6xl font-black text-slate-900 dark:text-white w-16 text-center">{awayScore}</span>
                <button onClick={() => setAwayScore(s => s + 1)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-600"><Plus className="w-6 h-6" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Log */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" /> Goal Log
            </h3>
            <button 
              onClick={() => setShowGoalForm(!showGoalForm)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-sm"
            >
              <Plus className="w-4 h-4" /> Add Goal
            </button>
          </div>

          {showGoalForm && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 space-y-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => { setGoalTeam('home'); setGoalScorer(''); setGoalAssist(''); }}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm ${goalTeam === 'home' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                >
                  {homeClub.shortName} Scored
                </button>
                <button 
                  onClick={() => { setGoalTeam('away'); setGoalScorer(''); setGoalAssist(''); }}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm ${goalTeam === 'away' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                >
                  {awayClub.shortName} Scored
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Scorer</label>
                  <select 
                    value={goalScorer} 
                    onChange={e => setGoalScorer(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="">Select Scorer...</option>
                    {(goalTeam === 'home' ? matchPlayers.home : matchPlayers.away).map(p => (
                      <option key={p.id} value={p.id}>{p.webName}</option>
                    ))}
                    <optgroup label="Own Goals (Opponent Player)">
                      {(goalTeam === 'home' ? matchPlayers.away : matchPlayers.home).map(p => (
                        <option key={`og_${p.id}`} value={p.id}>{p.webName} (OG)</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Assist (Optional)</label>
                  <select 
                    value={goalAssist} 
                    onChange={e => setGoalAssist(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="">No Assist...</option>
                    {(goalTeam === 'home' ? matchPlayers.home : matchPlayers.away).filter(p => p.id !== goalScorer).map(p => (
                      <option key={p.id} value={p.id}>{p.webName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Minute</label>
                  <input 
                    type="number" 
                    value={goalMinute} 
                    onChange={e => setGoalMinute(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 mt-5 cursor-pointer">
                  <input type="checkbox" checked={goalIsOwn} onChange={e => setGoalIsOwn(e.target.checked)} className="rounded text-emerald-500 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Own Goal</span>
                </label>
                <div className="flex-1 text-right mt-5">
                  <button onClick={handleAddGoal} disabled={!goalScorer} className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    Save Goal
                  </button>
                </div>
              </div>
            </div>
          )}

          {goals.length > 0 ? (
            <div className="space-y-2">
              {goals.map((g, idx) => {
                const scorer = players[g.playerId];
                const assist = g.assistPlayerId ? players[g.assistPlayerId] : null;
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${g.team === 'home' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{scorer?.webName || 'Unknown'}</span>
                        {g.isOwnGoal && <span className="ml-2 text-xs font-semibold text-rose-500 bg-rose-100 dark:bg-rose-900/30 px-1.5 py-0.5 rounded">OG</span>}
                        {assist && <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">ast. {assist.webName}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {g.minute && <span className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {g.minute}'</span>}
                      <button onClick={() => setGoals(goals.filter((_, i) => i !== idx))} className="text-rose-500 hover:text-rose-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-sm">No goals logged yet.</div>
          )}
        </div>

        {/* Player Roster / Minutes / Cards / MVPs */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-emerald-500" /> Match Roster
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Match Length:</label>
                <input type="number" value={defaultMinutes} onChange={e => setDefaultMinutes(parseInt(e.target.value) || 0)} className="w-16 bg-slate-100 dark:bg-slate-800 border-none rounded-md px-2 py-1 text-sm font-bold text-center" />
              </div>
              <button onClick={setAllMinutes} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold rounded-lg text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/50">
                All Played {defaultMinutes}m
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Home Team */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-800" style={{ color: homeClub.primaryColor }}>
                {homeClub.name}
              </h4>
              <div className="space-y-2">
                {matchPlayers.home.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg group">
                    <div className="flex items-center gap-2">
                      <KitJersey clubId={p.clubId} position={p.position} className="w-6 h-6" />
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{p.webName}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleMvp(p.id, 'home')} className={`p-1.5 rounded-md ${mvps.includes(p.id) ? 'bg-amber-100 text-amber-500' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <Crown className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleCard(p.id, 'yellow')} className={`w-5 h-6 rounded ${yellowCards.includes(p.id) ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700 hover:bg-amber-200'}`} />
                      <button onClick={() => toggleCard(p.id, 'red')} className={`w-5 h-6 rounded ${redCards.includes(p.id) ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700 hover:bg-rose-300'}`} />
                      <input 
                        type="number" 
                        value={playerMinutes[p.id] || ''} 
                        onChange={e => setPlayerMinutes({...playerMinutes, [p.id]: parseInt(e.target.value) || 0})}
                        placeholder="0m"
                        className="w-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-1 text-xs text-center font-semibold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Away Team */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-800" style={{ color: awayClub.primaryColor }}>
                {awayClub.name}
              </h4>
              <div className="space-y-2">
                {matchPlayers.away.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg group">
                    <div className="flex items-center gap-2">
                      <KitJersey clubId={p.clubId} position={p.position} className="w-6 h-6" />
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{p.webName}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleMvp(p.id, 'away')} className={`p-1.5 rounded-md ${mvps.includes(p.id) ? 'bg-amber-100 text-amber-500' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <Crown className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleCard(p.id, 'yellow')} className={`w-5 h-6 rounded ${yellowCards.includes(p.id) ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700 hover:bg-amber-200'}`} />
                      <button onClick={() => toggleCard(p.id, 'red')} className={`w-5 h-6 rounded ${redCards.includes(p.id) ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700 hover:bg-rose-300'}`} />
                      <input 
                        type="number" 
                        value={playerMinutes[p.id] || ''} 
                        onChange={e => setPlayerMinutes({...playerMinutes, [p.id]: parseInt(e.target.value) || 0})}
                        placeholder="0m"
                        className="w-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-1 text-xs text-center font-semibold"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3 && fixture && homeClub && awayClub) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setStep(2)} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back to Edit
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Review & Submit</h2>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 bg-slate-50 dark:bg-slate-800/30 text-center border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">Final Score</span>
            <div className="flex justify-center items-center gap-8">
              <div className="text-right flex-1">
                <div className="text-xl font-bold text-slate-900 dark:text-white">{homeClub.name}</div>
              </div>
              <div className="text-5xl font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                {homeScore} - {awayScore}
              </div>
              <div className="text-left flex-1">
                <div className="text-xl font-bold text-slate-900 dark:text-white">{awayClub.name}</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" /> Key Events
              </h4>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                {goals.map((g, i) => {
                  const p = players[g.playerId];
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-16 font-bold">{g.minute ? `${g.minute}'` : ''}</span>
                      <span className="w-4">⚽</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{p?.webName}</span>
                      {g.isOwnGoal && <span className="text-rose-500 text-xs">(OG)</span>}
                    </div>
                  );
                })}
                {yellowCards.map(id => (
                  <div key={`y_${id}`} className="flex items-center gap-2">
                    <span className="w-16"></span>
                    <span className="w-4 h-5 bg-amber-400 rounded-sm"></span>
                    <span className="font-semibold text-slate-900 dark:text-white">{players[id]?.webName}</span>
                  </div>
                ))}
                {redCards.map(id => (
                  <div key={`r_${id}`} className="flex items-center gap-2">
                    <span className="w-16"></span>
                    <span className="w-4 h-5 bg-rose-500 rounded-sm"></span>
                    <span className="font-semibold text-slate-900 dark:text-white">{players[id]?.webName}</span>
                  </div>
                ))}
                {mvps.map(id => (
                  <div key={`mvp_${id}`} className="flex items-center gap-2 mt-2">
                    <span className="w-16 text-amber-500 font-bold text-right pr-2">MVP</span>
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">{players[id]?.webName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" /> Clean Sheets
              </h4>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {awayScore === 0 ? (
                  <div className="flex gap-2 mb-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{homeClub.shortName}:</span>
                    {matchPlayers.home.filter(p => playerMinutes[p.id] > 0).map(p => p.webName).join(', ')}
                  </div>
                ) : null}
                {homeScore === 0 ? (
                  <div className="flex gap-2">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{awayClub.shortName}:</span>
                    {matchPlayers.away.filter(p => playerMinutes[p.id] > 0).map(p => p.webName).join(', ')}
                  </div>
                ) : null}
                {homeScore > 0 && awayScore > 0 && <span>No clean sheets for this match.</span>}
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={handleSave}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Check className="w-6 h-6" /> Save Match Stats
              </button>
              <p className="text-center text-xs text-slate-500 mt-3">
                This will finalize the match and update gameweek stats for all participating players.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

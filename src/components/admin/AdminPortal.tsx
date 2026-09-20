import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Position, Player, PlayerStats } from '../../types/fpl';
import { CLUBS } from '../../data/clubs';
import { KitJersey } from '../pitch/KitJersey';
import {
  Wrench,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Zap,
  Check,
  AlertCircle,
  Play,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AdminPortal: React.FC = () => {
  const {
    isDevAuthenticated,
    devLogin,
    devLogout,
    players,
    currentGW,
    updatePlayerStats,
    addCustomPlayer,
    editPlayer,
    deletePlayer,
    simulateGameweek,
    finalizeGameweek,
    advanceGameweek,
    resetToDefaults,
  } = useFPL();

  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [adminTab, setAdminTab] = useState<'events' | 'players' | 'gw'>('events');

  // Live Stat Entry State
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    Object.keys(players)[0] || ''
  );
  const [gwForStats, setGwForStats] = useState<number>(currentGW);

  // New Player Form State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerWebName, setNewPlayerWebName] = useState('');
  const [newPlayerClub, setNewPlayerClub] = useState('ARS');
  const [newPlayerPos, setNewPlayerPos] = useState<Position>('MID');
  const [newPlayerCost, setNewPlayerCost] = useState('8.0');

  // Edit Player State
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState('');

  // Notifications
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 3500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (devLogin(pinInput)) {
      setLoginError(false);
      setPinInput('');
    } else {
      setLoginError(true);
    }
  };

  const selectedPlayer = players[selectedPlayerId];
  const currentStats: PlayerStats = (selectedPlayer && selectedPlayer.gwStats[gwForStats]) || {
    minutes: 0,
    goals: 0,
    assists: 0,
    cleanSheet: false,
    goalsConceded: 0,
    yellowCards: 0,
    redCards: 0,
    saves: 0,
    penaltiesSaved: 0,
    penaltiesMissed: 0,
    ownGoals: 0,
    bonus: 0,
  };

  const adjustStat = (field: keyof PlayerStats, delta: number | boolean) => {
    if (!selectedPlayerId) return;

    if (typeof delta === 'boolean') {
      updatePlayerStats(selectedPlayerId, gwForStats, { [field]: delta });
    } else {
      const currentVal = (currentStats[field] as number) || 0;
      const newVal = Math.max(0, currentVal + delta);
      updatePlayerStats(selectedPlayerId, gwForStats, { [field]: newVal });
    }
    showNotification(`Updated ${field} for ${selectedPlayer?.webName}`);
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const costNum = parseFloat(newPlayerCost) || 5.0;
    const added = addCustomPlayer({
      name: newPlayerName.trim(),
      webName: newPlayerWebName.trim() || newPlayerName.trim().split(' ').slice(-1)[0],
      clubId: newPlayerClub,
      position: newPlayerPos,
      cost: costNum,
    });

    setNewPlayerName('');
    setNewPlayerWebName('');
    showNotification(`Added ${added.webName} to database!`);
    setSelectedPlayerId(added.id);
  };

  const handleSimulate = () => {
    simulateGameweek(currentGW);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#00ff87', '#04f5ff'],
    });
    showNotification(`Simulated Gameweek ${currentGW} match day results!`);
  };

  const handleFinalize = () => {
    finalizeGameweek();
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ff87', '#e90052', '#04f5ff'],
    });
    showNotification(`Finalized Gameweek ${currentGW} & updated league rankings!`);
  };

  // LOGIN SCREEN
  if (!isDevAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-[70vh] select-none">
        <div className="w-full max-w-sm p-6 rounded-3xl bg-gradient-to-b from-[#2e0033] to-[#1a001d] border border-[#5d0e68] shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00ff87] to-[#04f5ff] p-[2px] mx-auto mb-4 shadow-glow-green flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-[#37003c] flex items-center justify-center">
              <Lock className="w-7 h-7 text-[#00ff87]" />
            </div>
          </div>

          <h2 className="text-lg font-black text-white uppercase tracking-tight">
            Developer Login
          </h2>
          <p className="text-xs text-gray-400 mt-1 mb-5">
            Admin access to enter goals, assists, player stats, and manage fixtures.
          </p>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="relative">
              <input
                type="password"
                placeholder="Enter password (default: adminpassword)"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setLoginError(false);
                }}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-center text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="text-[11px] font-bold text-[#e90052] flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Incorrect password. Use adminpassword
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#00ff87] to-[#00cc6a] text-[#37003c] shadow-glow-green hover:opacity-90"
            >
              Sign In to Dev Portal
            </button>
          </form>

          {/* Quick bypass button for user */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => devLogin('adminpassword')}
              className="text-xs font-bold text-gray-400 hover:text-[#00ff87] flex items-center justify-center gap-1 mx-auto"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>One-Click Quick Dev Access</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD
  return (
    <div className="flex flex-col space-y-3 pb-24 px-2 pt-2 select-none">
      {/* Dev Header */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-[#320037] via-[#43004a] to-[#250029] border border-[#00ff87]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#00ff87]/20 text-[#00ff87]">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black text-white uppercase tracking-tight block">
              Developer Portal
            </span>
            <span className="text-[10px] text-[#00ff87] font-semibold">
              Live Data & Match Admin Active
            </span>
          </div>
        </div>

        <button
          onClick={devLogout}
          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-gray-300"
        >
          Sign Out
        </button>
      </div>

      {/* Notification Toast */}
      {bannerNotice && (
        <div className="p-2 rounded-xl bg-[#00ff87]/20 border border-[#00ff87]/50 text-xs font-bold text-[#00ff87] flex items-center gap-1.5 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* Sub-Panel Switcher */}
      <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-bold">
        <button
          onClick={() => setAdminTab('events')}
          className={`py-1.5 rounded-lg transition-all ${
            adminTab === 'events' ? 'bg-[#00ff87] text-[#37003c]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Live Match Data
        </button>
        <button
          onClick={() => setAdminTab('players')}
          className={`py-1.5 rounded-lg transition-all ${
            adminTab === 'players' ? 'bg-[#00ff87] text-[#37003c]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Players
        </button>
        <button
          onClick={() => setAdminTab('gw')}
          className={`py-1.5 rounded-lg transition-all ${
            adminTab === 'gw' ? 'bg-[#00ff87] text-[#37003c]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Gameweek Ops
        </button>
      </div>

      {/* PANEL 1: LIVE MATCH DATA & STAT ENTRY */}
      {adminTab === 'events' && (
        <div className="space-y-3">
          {/* Quick Simulation Bar */}
          <div className="p-3 rounded-2xl bg-[#2a002e] border border-[#520d5a] flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-white block">Auto-Simulate Match Day</span>
              <span className="text-[10px] text-gray-400">
                Randomize realistic goals, assists & clean sheets for GW {currentGW}
              </span>
            </div>
            <button
              onClick={handleSimulate}
              className="px-3 py-1.5 rounded-lg font-black text-xs bg-gradient-to-r from-[#04f5ff] to-[#00ff87] text-[#111] shadow-glow-cyan flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              Simulate
            </button>
          </div>

          {/* Select Player & Gameweek */}
          <div className="p-3 rounded-2xl bg-[#220026] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-300 uppercase">
                Select Footballer for Live Entry
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">GW:</span>
                <select
                  value={gwForStats}
                  onChange={(e) => setGwForStats(parseInt(e.target.value, 10))}
                  className="bg-black/60 border border-white/10 text-white rounded px-1.5 py-0.5 text-xs font-bold focus:outline-none"
                >
                  {[1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>
                      GW {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Player dropdown */}
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#00ff87]"
            >
              {Object.values(players).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.webName}) • {p.position} • {p.clubId} • £{p.cost.toFixed(1)}m
                </option>
              ))}
            </select>

            {/* Selected Player Preview Card */}
            {selectedPlayer && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <KitJersey clubId={selectedPlayer.clubId} position={selectedPlayer.position} className="w-8 h-8" />
                  <div>
                    <div className="text-xs font-black text-white">{selectedPlayer.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {selectedPlayer.position} • {CLUBS[selectedPlayer.clubId]?.name}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">GW {gwForStats} Pts</span>
                  <span className="text-base font-black text-[#00ff87]">
                    {selectedPlayer.gwPoints} pts
                  </span>
                </div>
              </div>
            )}

            {/* Stepper Inputs for Match Stats */}
            {selectedPlayer && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                {/* Minutes Played */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">Minutes</span>
                    <span className="text-xs font-black text-white">{currentStats.minutes}'</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustStat('minutes', -15)}
                      className="flex-1 py-1 bg-white/5 hover:bg-white/10 rounded font-bold text-xs"
                    >
                      -15
                    </button>
                    <button
                      onClick={() => updatePlayerStats(selectedPlayerId, gwForStats, { minutes: 90 })}
                      className="flex-1 py-1 bg-[#00ff87]/20 text-[#00ff87] rounded font-bold text-xs"
                    >
                      90'
                    </button>
                    <button
                      onClick={() => adjustStat('minutes', 15)}
                      className="flex-1 py-1 bg-white/5 hover:bg-white/10 rounded font-bold text-xs"
                    >
                      +15
                    </button>
                  </div>
                </div>

                {/* Goals */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">⚽ Goals</span>
                    <span className="text-xs font-black text-[#00ff87]">{currentStats.goals}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustStat('goals', -1)}
                      className="flex-1 py-1 bg-white/5 hover:bg-white/10 rounded font-bold text-xs"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => adjustStat('goals', 1)}
                      className="flex-1 py-1 bg-[#00ff87] text-[#111] rounded font-bold text-xs"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Assists */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">🅰️ Assists</span>
                    <span className="text-xs font-black text-[#04f5ff]">{currentStats.assists}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustStat('assists', -1)}
                      className="flex-1 py-1 bg-white/5 hover:bg-white/10 rounded font-bold text-xs"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => adjustStat('assists', 1)}
                      className="flex-1 py-1 bg-[#04f5ff] text-[#111] rounded font-bold text-xs"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Clean Sheet */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">🧤 Clean Sheet</span>
                    <span className={`text-xs font-black ${currentStats.cleanSheet ? 'text-[#00ff87]' : 'text-gray-500'}`}>
                      {currentStats.cleanSheet ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <button
                    onClick={() => adjustStat('cleanSheet', !currentStats.cleanSheet)}
                    className={`w-full py-1 rounded font-bold text-xs ${
                      currentStats.cleanSheet
                        ? 'bg-[#00ff87] text-[#111]'
                        : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    Toggle Clean Sheet
                  </button>
                </div>

                {/* Bonus Points */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">⭐ Bonus</span>
                    <span className="text-xs font-black text-yellow-400">+{currentStats.bonus}</span>
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((b) => (
                      <button
                        key={b}
                        onClick={() => updatePlayerStats(selectedPlayerId, gwForStats, { bonus: b })}
                        className={`flex-1 py-1 rounded font-bold text-xs ${
                          currentStats.bonus === b
                            ? 'bg-yellow-400 text-black'
                            : 'bg-white/5 text-gray-400'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Yellow / Red Cards */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">Cards</span>
                    <span className="text-xs font-bold">
                      🟨 {currentStats.yellowCards} | 🟥 {currentStats.redCards}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustStat('yellowCards', currentStats.yellowCards > 0 ? -1 : 1)}
                      className={`flex-1 py-1 rounded font-bold text-xs ${
                        currentStats.yellowCards > 0 ? 'bg-yellow-400 text-black' : 'bg-white/5 text-gray-300'
                      }`}
                    >
                      🟨
                    </button>
                    <button
                      onClick={() => adjustStat('redCards', currentStats.redCards > 0 ? -1 : 1)}
                      className={`flex-1 py-1 rounded font-bold text-xs ${
                        currentStats.redCards > 0 ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-300'
                      }`}
                    >
                      🟥
                    </button>
                  </div>
                </div>

                {/* Saves (for Goalkeepers) */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">Saves</span>
                    <span className="text-xs font-black text-white">{currentStats.saves}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustStat('saves', -1)}
                      className="flex-1 py-1 bg-white/5 rounded font-bold text-xs"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => adjustStat('saves', 1)}
                      className="flex-1 py-1 bg-white/15 rounded font-bold text-xs text-white"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Goals Conceded */}
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-300">Conceded</span>
                    <span className="text-xs font-black text-red-400">{currentStats.goalsConceded}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustStat('goalsConceded', -1)}
                      className="flex-1 py-1 bg-white/5 rounded font-bold text-xs"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => adjustStat('goalsConceded', 1)}
                      className="flex-1 py-1 bg-red-500/30 text-red-300 rounded font-bold text-xs"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PANEL 2: PLAYER MANAGEMENT (ADD/EDIT/DELETE) */}
      {adminTab === 'players' && (
        <div className="space-y-3">
          {/* Add New Player Form */}
          <form
            onSubmit={handleAddPlayer}
            className="p-3 rounded-2xl bg-[#220026] border border-white/10 space-y-2.5"
          >
            <span className="text-xs font-black text-[#00ff87] uppercase flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add New Footballer
            </span>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Full Name (e.g. Cole Palmer)"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
                required
              />
              <input
                type="text"
                placeholder="Short Web Name (e.g. Palmer)"
                value={newPlayerWebName}
                onChange={(e) => setNewPlayerWebName(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Club selector */}
              <select
                value={newPlayerClub}
                onChange={(e) => setNewPlayerClub(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                {Object.values(CLUBS).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortName} - {c.name}
                  </option>
                ))}
              </select>

              {/* Position selector */}
              <select
                value={newPlayerPos}
                onChange={(e: any) => setNewPlayerPos(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="GKP">GKP</option>
                <option value="DEF">DEF</option>
                <option value="MID">MID</option>
                <option value="FWD">FWD</option>
              </select>

              {/* Cost */}
              <input
                type="number"
                step="0.1"
                min="4.0"
                max="16.0"
                placeholder="Cost £m"
                value={newPlayerCost}
                onChange={(e) => setNewPlayerCost(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#00ff87] text-[#37003c] rounded-lg text-xs font-black uppercase tracking-wider shadow-glow-green"
            >
              Add Player to Database
            </button>
          </form>

          {/* Existing Players List */}
          <div className="p-3 rounded-2xl bg-[#220026] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white uppercase">
                Footballers ({Object.keys(players).length})
              </span>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {Object.values(players).map((p) => {
                const isEditing = editingPlayerId === p.id;

                return (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <KitJersey clubId={p.clubId} position={p.position} className="w-6 h-6" />
                      <div>
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-[10px] text-gray-400">
                          {p.position} • {CLUBS[p.clubId]?.shortName} • £{p.cost.toFixed(1)}m • {p.totalPoints} pts
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={editCost}
                            onChange={(e) => setEditCost(e.target.value)}
                            className="w-14 bg-black border border-[#00ff87] text-white px-1 py-0.5 rounded text-xs"
                          />
                          <button
                            onClick={() => {
                              const num = parseFloat(editCost);
                              if (num > 0) editPlayer(p.id, { cost: num });
                              setEditingPlayerId(null);
                            }}
                            className="p-1 bg-[#00ff87] text-[#111] rounded text-[10px] font-bold"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPlayerId(p.id);
                            setEditCost(p.cost.toString());
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                          title="Edit price"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => deletePlayer(p.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        title="Delete player"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PANEL 3: GAMEWEEK OPERATIONS & RESET */}
      {adminTab === 'gw' && (
        <div className="space-y-3">
          {/* Finalize GW Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#2c0032] to-[#3a0042] border border-[#5d0e68] space-y-2">
            <span className="text-xs font-black text-white uppercase block">
              Finalize Current Gameweek {currentGW}
            </span>
            <p className="text-[11px] text-gray-300">
              Locks all matches, calculates player points with captain multipliers and auto-substitutions, updates overall league standings, and advances to GW {currentGW + 1}.
            </p>
            <button
              onClick={handleFinalize}
              className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#00ff87] to-[#00cc6a] text-[#37003c] shadow-glow-green hover:opacity-95"
            >
              Finalize GW & Update Leagues
            </button>
          </div>

          {/* Quick Advance GW without finalizing */}
          <div className="p-3 rounded-2xl bg-[#220026] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-white block">Skip / Advance GW</span>
              <span className="text-[10px] text-gray-400">Jump directly to GW {currentGW + 1}</span>
            </div>
            <button
              onClick={advanceGameweek}
              className="px-3 py-1.5 rounded-lg font-bold text-xs bg-white/10 hover:bg-white/20 text-white flex items-center gap-1"
            >
              <span>Advance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset All Data to Seed */}
          <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-2">
            <span className="text-xs font-black text-red-300 uppercase block">
              Database Reset
            </span>
            <p className="text-[11px] text-gray-400">
              Clear all localStorage changes and restore original pristine Premier League seed data (players, squads, fixtures, leagues).
            </p>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all game data to defaults?')) {
                  resetToDefaults();
                  showNotification('Reset database to default seed data');
                }
              }}
              className="w-full py-2 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40"
            >
              Reset to Factory Seed Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

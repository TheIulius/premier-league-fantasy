import React, { useState, useEffect } from 'react';
import { useFPL } from '../../context/FPLContext';
import {
  Trophy,
  Plus,
  Key,
  ArrowUp,
  ArrowDown,
  Minus,
  Copy,
  Check,
  ChevronRight,
  Trash2,
  Globe,
  Users,
  Eye,
  Sparkles,
} from 'lucide-react';
import { ManagerSquadModal } from '../leagues/ManagerSquadModal';
import { KitJersey } from '../pitch/KitJersey';

export const LeaguesView: React.FC = () => {
  const { leagues, createLeague, joinLeague, deleteLeague, currentManager, authUser, currentGW } = useFPL();

  const globalLeague = leagues.find((l) => l.isGlobal) || leagues[0];
  const privateLeagues = leagues.filter((l) => !l.isGlobal);

  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(globalLeague?.id || '');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inspectedManagerId, setInspectedManagerId] = useState<string | null>(null);

  useEffect(() => {
    if (!leagues.some((l) => l.id === selectedLeagueId)) {
      setSelectedLeagueId(globalLeague?.id || '');
    }
  }, [leagues, selectedLeagueId, globalLeague]);

  const activeLeague = leagues.find((l) => l.id === selectedLeagueId) || globalLeague;
  const currentUserId = authUser?.id || currentManager?.id || 'user_1';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return;
    const name = newLeagueName.trim();
    const code = await createLeague(name);
    setNewLeagueName('');
    setShowCreateForm(false);
    setFeedbackMsg({ type: 'success', text: `Private League "${name}" created! Invite Code: ${code}` });
    setTimeout(() => setFeedbackMsg(null), 6000);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const ok = await joinLeague(joinCode.trim());
    if (ok) {
      setFeedbackMsg({ type: 'success', text: 'Joined private league successfully!' });
      setJoinCode('');
      setShowJoinForm(false);
    } else {
      setFeedbackMsg({ type: 'error', text: 'Invalid league invite code. Try again.' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDelete = async (leagueId: string, leagueName: string) => {
    if (window.confirm(`Delete private league "${leagueName}"?`)) {
      await deleteLeague(leagueId);
      if (selectedLeagueId === leagueId && globalLeague) {
        setSelectedLeagueId(globalLeague.id);
      }
      setFeedbackMsg({ type: 'success', text: `League "${leagueName}" deleted.` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 pt-3 pb-28 select-none">
      {/* Feedback Notification Toast */}
      {feedbackMsg && (
        <div
          className={`mb-3 p-3 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-sm ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-[10px] underline opacity-75">
            Dismiss
          </button>
        </div>
      )}

      {/* Two-Column Spatial Layout: Main Leaderboard (Left 8 cols) + Private Leagues Side Window (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ================================================================= */}
        {/* MAIN COLUMN (lg:col-span-8): GLOBAL SCHOOL LEADERBOARD & LINEUPS   */}
        {/* ================================================================= */}
        <div className="lg:col-span-8 space-y-3">
          {/* Active League Header Banner */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/[0.08] shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/20 to-emerald-500/20 border border-amber-400/30 flex items-center justify-center">
                {activeLeague?.isGlobal ? (
                  <Globe className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Trophy className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {activeLeague?.name || 'Komarovi Overall'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    GW {currentGW} LIVE
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeLeague?.members.length || 0} Registered Managers • Click any manager to view their full tactical pitch
                </p>
              </div>
            </div>

            {!activeLeague?.isGlobal && globalLeague && (
              <button
                onClick={() => setSelectedLeagueId(globalLeague.id)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-black text-emerald-400 flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>← Back to School Global</span>
              </button>
            )}
          </div>

          {/* Managers Standings + Visible Footballers & Lineups */}
          <div className="space-y-2.5">
            {activeLeague?.members && activeLeague.members.length > 0 ? (
              activeLeague.members.map((member: any, index: number) => {
                const rank = member.rank || index + 1;
                const prevRank = member.previousRank || rank;
                const rankDiff = prevRank - rank;
                const isCurrentUser = member.id === currentUserId;
                const lineup: any[] = Array.isArray(member.lineup) ? member.lineup : [];
                const starters = lineup.filter((p) => p.isStarter);
                const bench = lineup.filter((p) => !p.isStarter);

                const rankBadgeClass =
                  rank === 1
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-md shadow-amber-500/20'
                    : rank === 2
                    ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-950'
                    : rank === 3
                    ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10';

                return (
                  <div
                    key={member.id}
                    onClick={() => setInspectedManagerId(member.id)}
                    className={`group rounded-2xl p-3 sm:p-4 border transition-all cursor-pointer ${
                      isCurrentUser
                        ? 'bg-emerald-500/[0.07] dark:bg-emerald-500/[0.08] border-emerald-500/40 shadow-md'
                        : 'bg-white dark:bg-[#0c1322]/90 hover:bg-slate-50 dark:hover:bg-[#111a2e] border-slate-200 dark:border-white/[0.07] shadow-xs'
                    }`}
                  >
                    {/* Top Row: Rank, Team & Manager Info, Points & Inspect Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        {/* Rank Medal */}
                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-mono font-black text-xs sm:text-sm flex items-center justify-center ${rankBadgeClass}`}
                          >
                            {rank}
                          </div>
                          {rankDiff > 0 ? (
                            <span className="text-[9px] font-black text-emerald-500 flex items-center">
                              <ArrowUp className="w-2.5 h-2.5" />
                              {rankDiff}
                            </span>
                          ) : rankDiff < 0 ? (
                            <span className="text-[9px] font-black text-rose-500 flex items-center">
                              <ArrowDown className="w-2.5 h-2.5" />
                              {Math.abs(rankDiff)}
                            </span>
                          ) : (
                            <Minus className="w-2.5 h-2.5 text-slate-400 opacity-50" />
                          )}
                        </div>

                        {/* Team Name & Manager Name */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors truncate">
                              {member.teamName}
                            </span>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500 text-slate-950">
                                YOU
                              </span>
                            )}
                            {member.activeChip && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                {String(member.activeChip).replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>Manager: <strong className="text-slate-700 dark:text-slate-300">{member.managerName}</strong></span>
                            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold hidden sm:inline-flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                              <Eye className="w-3 h-3" /> View Pitch
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Metrics: GW Points & Total Season Points */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <div className="text-right px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06]">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">GW {currentGW}</span>
                          <span className="font-mono text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                            {member.gwPoints ?? 0}
                          </span>
                        </div>

                        <div className="text-right px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                          <span className="text-[9px] uppercase font-bold text-emerald-500/80 block">Total</span>
                          <span className="font-mono text-base sm:text-lg font-black text-slate-900 dark:text-white">
                            {member.totalPoints ?? 0}
                          </span>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                      </div>
                    </div>

                    {/* Bottom Row: Visible Footballers & Lineup Strip */}
                    {lineup.length > 0 ? (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-white/[0.06]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">
                            Starting VI Lineup ({starters.length}/6)
                          </span>
                          {bench.length > 0 && (
                            <span className="text-[9px] font-bold text-slate-400">
                              Bench: {bench.map((b) => `${b.webName} (${b.points})`).join(', ')}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                          {starters.map((p) => (
                            <div
                              key={p.playerId}
                              className={`relative flex items-center gap-1.5 p-1.5 rounded-xl border text-left ${
                                p.isCaptain
                                  ? 'bg-amber-500/10 border-amber-500/35'
                                  : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200/60 dark:border-white/[0.06]'
                              }`}
                            >
                              <KitJersey clubId={p.clubId} position={p.position} className="w-5 h-5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-0.5">
                                  <span className="text-[10px] font-extrabold text-slate-800 dark:text-white truncate">
                                    {p.webName}
                                  </span>
                                  {p.isCaptain && (
                                    <span className="px-1 rounded text-[8px] font-black bg-amber-400 text-slate-950 flex-shrink-0">
                                      C
                                    </span>
                                  )}
                                  {p.isViceCaptain && (
                                    <span className="px-1 rounded text-[8px] font-black bg-slate-600 text-white flex-shrink-0">
                                      V
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                                  {p.points} pts
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.05] flex items-center justify-between text-[11px] text-slate-400">
                        <span>No footballers selected yet</span>
                        <span className="text-emerald-400 font-bold">Tap to inspect →</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 rounded-3xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
                No managers registered in this league yet.
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* SIDE WINDOW (lg:col-span-4): PRIVATE MINI-LEAGUES HUB             */}
        {/* ================================================================= */}
        <div className="lg:col-span-4 space-y-3 lg:sticky lg:top-16">
          <div className="p-4 rounded-3xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/[0.08] shadow-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Private Mini-Leagues
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setShowJoinForm(!showJoinForm);
                    setShowCreateForm(false);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <Key className="w-3 h-3 text-amber-400" />
                  <span>Join</span>
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(!showCreateForm);
                    setShowJoinForm(false);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create</span>
                </button>
              </div>
            </div>

            {/* Inline Create Private League Form */}
            {showCreateForm && (
              <form
                onSubmit={handleCreate}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-emerald-500/30 space-y-2"
              >
                <label className="text-[10px] font-black uppercase text-emerald-400 block">
                  New Private League Name
                </label>
                <input
                  type="text"
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  placeholder="e.g. 11/5 Class League"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none"
                  required
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-2.5 py-1 rounded-lg text-[11px] text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-black"
                  >
                    Create League
                  </button>
                </div>
              </form>
            )}

            {/* Inline Join Private League Form */}
            {showJoinForm && (
              <form
                onSubmit={handleJoin}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-amber-500/30 space-y-2"
              >
                <label className="text-[10px] font-black uppercase text-amber-400 block">
                  Enter Invite Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. KCL-8F9A"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-mono uppercase text-slate-900 dark:text-white outline-none"
                  required
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowJoinForm(false)}
                    className="px-2.5 py-1 rounded-lg text-[11px] text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black"
                  >
                    Join League
                  </button>
                </div>
              </form>
            )}

            {/* Global League Pinned Card */}
            {globalLeague && (
              <div
                onClick={() => setSelectedLeagueId(globalLeague.id)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  activeLeague?.id === globalLeague.id
                    ? 'bg-emerald-500/15 border-emerald-500/40'
                    : 'bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border-slate-200/70 dark:border-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {globalLeague.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Official School-Wide Standings ({globalLeague.members.length} managers)
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </div>
            )}

            {/* Private Leagues List */}
            <div className="space-y-2 pt-1">
              {privateLeagues.length > 0 ? (
                privateLeagues.map((l) => {
                  const myMember = l.members.find((m) => m.id === currentUserId);
                  const isSelected = activeLeague?.id === l.id;
                  return (
                    <div
                      key={l.id}
                      onClick={() => setSelectedLeagueId(l.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/40'
                          : 'bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border-slate-200/70 dark:border-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-white block">
                            {l.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {l.members.length} members {myMember ? `• Your Rank: #${myMember.rank}` : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyCodeToClipboard(l.code);
                            }}
                            title="Copy invite code"
                            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1"
                          >
                            {copiedCode === l.code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{l.code}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(l.id, l.name);
                            }}
                            title="Delete private league"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-5 px-3 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No Private Leagues Yet</p>
                  <p className="text-[11px] text-slate-400">
                    Tap <strong>+ Create</strong> to make a mini-league for your class or friend group, or <strong>Join</strong> with an invite code.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Tactical Pitch Lineup Modal when clicking any Manager */}
      <ManagerSquadModal
        managerId={inspectedManagerId}
        onClose={() => setInspectedManagerId(null)}
      />
    </div>
  );
};

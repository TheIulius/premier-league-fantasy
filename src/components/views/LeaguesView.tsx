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
} from 'lucide-react';
import { ManagerSquadModal } from '../leagues/ManagerSquadModal';

export const LeaguesView: React.FC = () => {
  const { leagues, createLeague, joinLeague, deleteLeague, currentManager, authUser } = useFPL();
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(leagues[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inspectedManagerId, setInspectedManagerId] = useState<string | null>(null);

  // Sync selected league when leagues list updates
  useEffect(() => {
    if (!leagues.some((l) => l.id === selectedLeagueId)) {
      setSelectedLeagueId(leagues[0]?.id || '');
    }
  }, [leagues, selectedLeagueId]);

  const activeLeague = leagues.find((l) => l.id === selectedLeagueId) || leagues[0];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return;
    const name = newLeagueName.trim();
    const code = await createLeague(name);
    setNewLeagueName('');
    setShowCreateModal(false);
    setFeedbackMsg({ type: 'success', text: `League "${name}" created! Code: ${code}` });
    setTimeout(() => setFeedbackMsg(null), 6000);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const ok = await joinLeague(joinCode.trim());
    if (ok) {
      setFeedbackMsg({ type: 'success', text: 'Joined league successfully!' });
      setJoinCode('');
      setShowJoinModal(false);
    } else {
      setFeedbackMsg({ type: 'error', text: 'Invalid league code. Try again.' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDelete = async (leagueId: string, leagueName: string) => {
    if (window.confirm(`Delete "${leagueName}"?`)) {
      await deleteLeague(leagueId);
      setFeedbackMsg({ type: 'success', text: `League "${leagueName}" deleted.` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col space-y-3 pb-24 md:pb-12 px-2 md:px-6 pt-2 md:pt-4 select-none max-w-4xl lg:max-w-5xl mx-auto w-full">
      {/* Leagues Selector & Actions */}
      <div className="p-3 md:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Leagues
            </h2>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              onClick={() => {
                setShowJoinModal(true);
                setShowCreateModal(false);
              }}
              className="px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg text-[11px] md:text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              Join
            </button>
            <button
              onClick={() => {
                setShowCreateModal(true);
                setShowJoinModal(false);
              }}
              className="px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg text-[11px] md:text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create
            </button>
          </div>
        </div>

        {/* League Pills Bar */}
        {leagues.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {leagues.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLeagueId(l.id)}
                className={`px-3 md:px-3.5 py-1 md:py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeLeague?.id === l.id
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-2.5 rounded-xl text-xs font-bold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Create Modal Form */}
      {showCreateModal && (
        <form
          onSubmit={handleCreate}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              Create League
            </span>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="text-slate-400 text-xs hover:text-slate-600 dark:hover:text-white px-2 py-0.5"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create a private league for your school, class, or friends.
          </p>
          <input
            type="text"
            placeholder="League Name (e.g. 11/5 League)"
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            Create League
          </button>
        </form>
      )}

      {/* Join Modal Form */}
      {showJoinModal && (
        <form
          onSubmit={handleJoin}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-sky-500" />
              Join League
            </span>
            <button
              type="button"
              onClick={() => setShowJoinModal(false)}
              className="text-slate-400 text-xs hover:text-slate-600 dark:hover:text-white px-2 py-0.5"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter the code shared with you (e.g. <code className="text-sky-500 font-semibold">KCL-XXXX</code>).
          </p>
          <input
            type="text"
            placeholder="League Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 uppercase focus:outline-none focus:border-sky-500"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            Join League
          </button>
        </form>
      )}

      {/* Empty State when no leagues exist */}
      {leagues.length === 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No Leagues Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Create a custom league for your class, or enter an invite code to join one.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <button
              onClick={() => {
                setShowCreateModal(true);
                setShowJoinModal(false);
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create League
            </button>
            <button
              onClick={() => {
                setShowJoinModal(true);
                setShowCreateModal(false);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Key className="w-4 h-4" />
              Join Code
            </button>
          </div>
        </div>
      )}

      {/* Active League Info & Code */}
      {activeLeague && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-3.5 md:px-5 py-2.5 md:py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 dark:text-white text-sm md:text-base">{activeLeague.name}</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-500/20">
                {activeLeague.members.length} {activeLeague.members.length === 1 ? 'Manager' : 'Managers'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyCodeToClipboard(activeLeague.code)}
                className="flex items-center gap-1 text-[11px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-500/20 transition-colors"
                title="Click to copy invite code"
              >
                {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{activeLeague.code}</span>
              </button>

              <button
                onClick={() => handleDelete(activeLeague.id, activeLeague.name)}
                className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Delete this league"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Standings Table or Empty State */}
          {activeLeague.members.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                No managers in this league yet.
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Share code <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{activeLeague.code}</span> to compete!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              <div className="grid grid-cols-12 px-3 md:px-5 py-2 md:py-2.5 text-[10px] md:text-xs font-bold uppercase text-slate-400 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 items-center">
                <span className="col-span-2">Rank</span>
                <span className="col-span-6 sm:col-span-5">
                  Manager
                </span>
                <span className="col-span-2 text-center">GW</span>
                <span className="col-span-2 sm:col-span-3 text-right">Total</span>
              </div>

              {activeLeague.members.map((member) => {
                const isUser =
                  member.id === currentManager?.id ||
                  member.id === 'user' ||
                  (authUser && member.id === authUser.id);
                const rankDiff = (member.previousRank || member.rank) - member.rank;

                return (
                  <div
                    key={member.id}
                    onClick={() => setInspectedManagerId(member.id)}
                    title={`View ${member.managerName}'s squad`}
                    className={`grid grid-cols-12 px-3 md:px-5 py-2.5 md:py-3.5 items-center text-xs md:text-sm transition-all cursor-pointer group active:scale-[0.99] ${
                      isUser
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-l-4 border-emerald-500 font-bold text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Rank Column */}
                    <div className="col-span-2 flex items-center gap-1">
                      <span className="font-black text-sm md:text-base text-slate-900 dark:text-slate-100">{member.rank}</span>
                      {rankDiff > 0 ? (
                        <ArrowUp className="w-3 h-3 text-emerald-500" />
                      ) : rankDiff < 0 ? (
                        <ArrowDown className="w-3 h-3 text-rose-500" />
                      ) : (
                        <Minus className="w-2.5 h-2.5 text-slate-400" />
                      )}
                    </div>

                    {/* Team & Manager */}
                    <div className="col-span-6 sm:col-span-5 min-w-0 pr-1">
                      <div className="font-extrabold truncate text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                        <span className="truncate">{member.teamName}</span>
                        {isUser && <span className="text-[8px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded font-bold">YOU</span>}
                      </div>
                      <div className="text-[10px] md:text-xs text-slate-400 truncate">
                        {member.managerName}
                      </div>
                    </div>

                    {/* GW Points */}
                    <div className="col-span-2 text-center font-bold text-slate-600 dark:text-slate-300">
                      {member.gwPoints}
                    </div>

                    {/* Total Points + Chevron */}
                    <div className="col-span-2 sm:col-span-3 flex items-center justify-end gap-1 text-right font-black text-emerald-600 dark:text-emerald-400">
                      <span>{member.totalPoints}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Other Manager Squad & Score Breakdown Modal */}
      <ManagerSquadModal
        managerId={inspectedManagerId}
        onClose={() => setInspectedManagerId(null)}
      />
    </div>
  );
};

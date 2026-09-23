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
    setFeedbackMsg({ type: 'success', text: `League "${name}" created! Share code: ${code}` });
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
      setFeedbackMsg({ type: 'error', text: 'Invalid league code. Please check and try again.' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDelete = async (leagueId: string, leagueName: string) => {
    if (window.confirm(`Are you sure you want to delete "${leagueName}"?`)) {
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
      <div className="p-3 md:p-4 rounded-2xl bg-[#28002d] border border-[#4d0c54] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-sm md:text-base font-black text-white uppercase tracking-tight">
              Leagues & Standings
            </h2>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              onClick={() => {
                setShowJoinModal(true);
                setShowCreateModal(false);
              }}
              className="px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 transition-colors"
            >
              <Key className="w-3 h-3 md:w-3.5 md:h-3.5" />
              Join
            </button>
            <button
              onClick={() => {
                setShowCreateModal(true);
                setShowJoinModal(false);
              }}
              className="px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold bg-[#00ff87] text-[#37003c] flex items-center gap-1 shadow-glow-green hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
              Create
            </button>
          </div>
        </div>

        {/* League Pills Bar (only when leagues exist) */}
        {leagues.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {leagues.map((l) => (
              <button
                key={l.id}
                onClick={() => setSelectedLeagueId(l.id)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                  activeLeague?.id === l.id
                    ? 'bg-[#00ff87] text-[#37003c] shadow-glow-green'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
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
              ? 'bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/40'
              : 'bg-red-500/20 text-red-300 border border-red-500/40'
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Create Modal Form */}
      {showCreateModal && (
        <form
          onSubmit={handleCreate}
          className="p-3.5 rounded-2xl bg-[#230026] border border-[#00ff87]/40 animate-fadeIn space-y-3 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#00ff87] uppercase tracking-wide flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Create New League
            </span>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 text-xs hover:text-white px-2 py-0.5"
            >
              Cancel
            </button>
          </div>
          <p className="text-[11px] text-gray-300">
            Create a custom league for your school, class, or friends.
          </p>
          <input
            type="text"
            placeholder="League Name (e.g. Class 11/5 League)"
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-[#00ff87] text-[#37003c] rounded-xl text-xs font-black uppercase tracking-wider shadow-glow-green"
          >
            Create League
          </button>
        </form>
      )}

      {/* Join Modal Form */}
      {showJoinModal && (
        <form
          onSubmit={handleJoin}
          className="p-3.5 rounded-2xl bg-[#230026] border border-[#04f5ff]/40 animate-fadeIn space-y-3 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#04f5ff] uppercase tracking-wide flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              Join League
            </span>
            <button
              type="button"
              onClick={() => setShowJoinModal(false)}
              className="text-gray-400 text-xs hover:text-white px-2 py-0.5"
            >
              Cancel
            </button>
          </div>
          <p className="text-[11px] text-gray-300">
            Enter the league code shared by your friend (e.g. <code className="text-[#04f5ff]">KCL-XXXX</code>).
          </p>
          <input
            type="text"
            placeholder="League Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 uppercase focus:outline-none focus:border-[#04f5ff]"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-[#04f5ff] text-[#111] rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Join League
          </button>
        </form>
      )}

      {/* Empty State when no leagues exist */}
      {leagues.length === 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#200024] to-[#160018] border border-white/10 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#e90052]/20 to-[#00ff87]/20 border border-white/15 flex items-center justify-center shadow-lg">
            <Trophy className="w-7 h-7 text-yellow-400" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-white">No Leagues Yet</h3>
            <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed">
              Start your own fantasy competition! Create a custom league for your class, or enter an invite code to join one.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <button
              onClick={() => {
                setShowCreateModal(true);
                setShowJoinModal(false);
              }}
              className="px-4 py-2.5 bg-[#00ff87] text-[#37003c] rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-glow-green"
            >
              <Plus className="w-4 h-4" />
              Create Your First League
            </button>
            <button
              onClick={() => {
                setShowJoinModal(true);
                setShowCreateModal(false);
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-white/15"
            >
              <Key className="w-4 h-4" />
              Join With Code
            </button>
          </div>
        </div>
      )}

      {/* Active League Info & Code */}
      {activeLeague && (
        <div className="rounded-2xl bg-[#200024] border border-white/10 overflow-hidden shadow-lg">
          <div className="px-3.5 md:px-5 py-2.5 md:py-3.5 bg-[#2a0030] border-b border-white/5 flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-sm md:text-base">{activeLeague.name}</span>
              <span className="text-[9px] md:text-[10px] bg-[#00ff87]/15 text-[#00ff87] px-1.5 py-0.5 rounded font-bold border border-[#00ff87]/30">
                {activeLeague.members.length} {activeLeague.members.length === 1 ? 'Manager' : 'Managers'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyCodeToClipboard(activeLeague.code)}
                className="flex items-center gap-1 text-[11px] md:text-xs font-bold text-[#00ff87] hover:underline bg-[#00ff87]/10 px-2 py-1 rounded-lg border border-[#00ff87]/20"
                title="Click to copy invite code"
              >
                {copiedCode ? <Check className="w-3 h-3 text-[#00ff87]" /> : <Copy className="w-3 h-3 text-[#00ff87]" />}
                <span>Code: {activeLeague.code}</span>
              </button>

              <button
                onClick={() => handleDelete(activeLeague.id, activeLeague.name)}
                className="text-gray-400 hover:text-red-400 p-1 rounded-lg hover:bg-white/5 transition-colors"
                title="Delete this league"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Standings Table or Empty State */}
          {activeLeague.members.length === 0 ? (
            <div className="p-8 md:p-12 text-center space-y-2">
              <p className="text-xs md:text-sm text-gray-300">
                No managers in this league yet.
              </p>
              <p className="text-[11px] md:text-xs text-[#00ff87]">
                Share code <span className="font-mono font-bold bg-black/40 px-2 py-0.5 rounded">{activeLeague.code}</span> with friends to compete!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              <div className="grid grid-cols-12 px-3 md:px-5 py-2 md:py-2.5 text-[10px] md:text-xs font-black uppercase text-gray-400 bg-black/30 items-center">
                <span className="col-span-2">Rank</span>
                <span className="col-span-5">
                  Team & Manager
                  <span className="hidden sm:inline-block text-[8px] md:text-[9px] text-[#00ff87] font-semibold lowercase ml-1">(tap to view)</span>
                </span>
                <span className="col-span-2 text-center">GW</span>
                <span className="col-span-3 text-right">Total</span>
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
                    title={`View ${member.managerName}'s squad & live points`}
                    className={`grid grid-cols-12 px-3 md:px-5 py-2.5 md:py-3.5 items-center text-xs md:text-sm transition-all cursor-pointer group hover:bg-white/10 active:scale-[0.99] ${
                      isUser
                        ? 'bg-[#37003c]/60 border-l-4 border-[#00ff87] font-bold text-white'
                        : 'text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    {/* Rank Column */}
                    <div className="col-span-2 flex items-center gap-1">
                      <span className="font-black text-sm md:text-base">{member.rank}</span>
                      {rankDiff > 0 ? (
                        <ArrowUp className="w-3 h-3 text-[#00ff87]" />
                      ) : rankDiff < 0 ? (
                        <ArrowDown className="w-3 h-3 text-[#e90052]" />
                      ) : (
                        <Minus className="w-2.5 h-2.5 text-gray-500" />
                      )}
                    </div>

                    {/* Team & Manager */}
                    <div className="col-span-5 min-w-0 pr-1">
                      <div className="font-extrabold truncate text-white group-hover:text-[#00ff87] transition-colors flex items-center gap-1">
                        <span className="truncate">{member.teamName}</span>
                        {isUser && <span className="text-[8px] bg-[#00ff87]/20 text-[#00ff87] px-1 py-0.2 rounded font-bold">YOU</span>}
                      </div>
                      <div className="text-[10px] md:text-xs text-gray-400 truncate">
                        {member.managerName}
                      </div>
                    </div>

                    {/* GW Points */}
                    <div className="col-span-2 text-center font-bold text-gray-300">
                      {member.gwPoints}
                    </div>

                    {/* Total Points + Chevron */}
                    <div className="col-span-3 flex items-center justify-end gap-1 text-right font-black text-[#00ff87]">
                      <span>{member.totalPoints}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#00ff87] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Other Manager Squad & Score Breakdown Modal (Just like real FPL!) */}
      <ManagerSquadModal
        managerId={inspectedManagerId}
        onClose={() => setInspectedManagerId(null)}
      />
    </div>
  );
};

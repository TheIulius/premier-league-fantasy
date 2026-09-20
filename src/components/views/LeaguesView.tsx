import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Trophy, Users, Plus, Key, ArrowUp, ArrowDown, Minus, Copy, Check } from 'lucide-react';

export const LeaguesView: React.FC = () => {
  const { leagues, createLeague, joinLeague } = useFPL();
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(leagues[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeLeague = leagues.find((l) => l.id === selectedLeagueId) || leagues[0];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return;
    const code = await createLeague(newLeagueName.trim());
    setNewLeagueName('');
    setShowCreateModal(false);
    setFeedbackMsg({ type: 'success', text: `League created! Share code: ${code}` });
    setTimeout(() => setFeedbackMsg(null), 5000);
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
      setFeedbackMsg({ type: 'error', text: 'Invalid league code. Please try again.' });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col space-y-3 pb-24 px-2 pt-2 select-none">
      {/* Leagues Selector & Actions */}
      <div className="p-3 rounded-2xl bg-[#28002d] border border-[#4d0c54] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-tight">
              Leagues & Standings
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setShowJoinModal(true);
                setShowCreateModal(false);
              }}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white flex items-center gap-1"
            >
              <Key className="w-3 h-3" />
              Join
            </button>
            <button
              onClick={() => {
                setShowCreateModal(true);
                setShowJoinModal(false);
              }}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#00ff87] text-[#37003c] flex items-center gap-1 shadow-glow-green"
            >
              <Plus className="w-3 h-3" />
              Create
            </button>
          </div>
        </div>

        {/* League Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {leagues.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedLeagueId(l.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeLeague?.id === l.id
                  ? 'bg-[#00ff87] text-[#37003c] shadow-glow-green'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
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
          className="p-3 rounded-xl bg-[#230026] border border-[#00ff87]/40 animate-fadeIn space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#00ff87]">Create New Mini-League</span>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 text-xs"
            >
              Cancel
            </button>
          </div>
          <input
            type="text"
            placeholder="League Name (e.g. Work Colleagues)"
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff87]"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-2 bg-[#00ff87] text-[#37003c] rounded-lg text-xs font-black uppercase tracking-wider"
          >
            Create League
          </button>
        </form>
      )}

      {/* Join Modal Form */}
      {showJoinModal && (
        <form
          onSubmit={handleJoin}
          className="p-3 rounded-xl bg-[#230026] border border-[#04f5ff]/40 animate-fadeIn space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#04f5ff]">Join Existing League</span>
            <button
              type="button"
              onClick={() => setShowJoinModal(false)}
              className="text-gray-400 text-xs"
            >
              Cancel
            </button>
          </div>
          <input
            type="text"
            placeholder="Enter 5-8 digit League Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 uppercase focus:outline-none focus:border-[#04f5ff]"
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-2 bg-[#04f5ff] text-[#111] rounded-lg text-xs font-black uppercase tracking-wider"
          >
            Join League
          </button>
        </form>
      )}

      {/* Active League Info & Code */}
      {activeLeague && (
        <div className="rounded-2xl bg-[#200024] border border-white/10 overflow-hidden">
          <div className="px-3.5 py-2.5 bg-[#2a0030] border-b border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-white">{activeLeague.name}</span>
              {!activeLeague.isGlobal && (
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                  Private
                </span>
              )}
            </div>

            {!activeLeague.isGlobal && (
              <button
                onClick={() => copyCodeToClipboard(activeLeague.code)}
                className="flex items-center gap-1 text-[11px] text-[#00ff87] hover:underline"
              >
                {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>Code: {activeLeague.code}</span>
              </button>
            )}
          </div>

          {/* Standings Table */}
          <div className="divide-y divide-white/5">
            <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] font-black uppercase text-gray-400 bg-black/20">
              <span className="col-span-2">Rank</span>
              <span className="col-span-6">Team & Manager</span>
              <span className="col-span-2 text-center">GW</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            {activeLeague.members.map((member) => {
              const isUser = member.id === 'user';
              const rankDiff = member.previousRank - member.rank;

              return (
                <div
                  key={member.id}
                  className={`grid grid-cols-12 px-3 py-2.5 items-center text-xs transition-colors ${
                    isUser
                      ? 'bg-[#37003c]/60 border-l-4 border-[#00ff87] font-bold text-white'
                      : 'text-gray-200 hover:bg-white/5'
                  }`}
                >
                  {/* Rank Column */}
                  <div className="col-span-2 flex items-center gap-1">
                    <span className="font-black text-sm">{member.rank}</span>
                    {rankDiff > 0 ? (
                      <ArrowUp className="w-3 h-3 text-[#00ff87]" />
                    ) : rankDiff < 0 ? (
                      <ArrowDown className="w-3 h-3 text-[#e90052]" />
                    ) : (
                      <Minus className="w-2.5 h-2.5 text-gray-500" />
                    )}
                  </div>

                  {/* Team & Manager */}
                  <div className="col-span-6 min-w-0 pr-1">
                    <div className="font-extrabold truncate text-white">
                      {member.teamName}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">
                      {member.managerName}
                    </div>
                  </div>

                  {/* GW Points */}
                  <div className="col-span-2 text-center font-bold text-gray-300">
                    {member.gwPoints}
                  </div>

                  {/* Total Points */}
                  <div className="col-span-2 text-right font-black text-[#00ff87]">
                    {member.totalPoints}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

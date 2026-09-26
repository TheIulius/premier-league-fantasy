import React, { useState, useMemo } from 'react';
import { useFPL } from '../../context/FPLContext';
import {
  Trophy,
  Search,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ManagerSquadModal } from '../leagues/ManagerSquadModal';
import { getSortedSchoolClubs } from '../../data/clubs';

export const StandingsView: React.FC = () => {
  const { leagues, currentManager, authUser, currentGW, clubs } = useFPL();

  const globalLeague = leagues.find((l) => l.isGlobal) || leagues[0];
  const members = globalLeague?.members || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [inspectedManagerId, setInspectedManagerId] = useState<string | null>(null);

  const sortedClubs = useMemo(() => getSortedSchoolClubs(clubs), [clubs]);
  const currentUserId = authUser?.id || currentManager?.id || 'user_1';

  // Filter members by search and class
  const filteredMembers = useMemo(() => {
    return members.filter((member: any) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName =
          member.managerName?.toLowerCase().includes(q) ||
          member.teamName?.toLowerCase().includes(q);
        if (!matchesName) return false;
      }

      // 2. Class Filter
      if (classFilter !== 'ALL') {
        const targetClass = classFilter.toLowerCase(); // e.g. '11/5' or 'sch_11_5'
        const cleanTarget = targetClass.replace(/[^0-9]/g, ''); // e.g. '115'

        const matchesTeamText =
          member.teamName?.toLowerCase().includes(targetClass) ||
          member.managerName?.toLowerCase().includes(targetClass);

        const matchesLineupClub =
          Array.isArray(member.lineup) &&
          member.lineup.some((p: any) => {
            const clubIdClean = (p.clubId || '').toLowerCase().replace(/[^0-9]/g, '');
            return clubIdClean.includes(cleanTarget);
          });

        if (!matchesTeamText && !matchesLineupClub) return false;
      }

      return true;
    });
  }, [members, searchQuery, classFilter]);

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-6 pt-3 pb-28 select-none">
      {/* Standings Header & Filters */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/[0.08] shadow-md space-y-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Standings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official School Leaderboard • {members.length} Managers
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.09] text-slate-700 dark:text-slate-200">
            GW {currentGW} Live
          </span>
        </div>

        {/* Search & Class Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
          {/* Search Input */}
          <div className="sm:col-span-7 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manager or team..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Classes Filter Dropdown (All Classes 28) */}
          <div className="sm:col-span-5 relative">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500/50 cursor-pointer transition-colors"
            >
              <option value="ALL">All Classes (28)</option>
              {sortedClubs.map((club) => {
                const classLabel = club.shortName || club.name;
                return (
                  <option key={club.id} value={classLabel}>
                    Class {classLabel}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Table Column Headers */}
      <div className="px-4 py-2 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="w-7 text-center">Rank</span>
          <span>Manager / Team</span>
        </div>
        <div className="flex items-center gap-5 sm:gap-8">
          <span className="w-12 text-right">GW</span>
          <span className="w-14 text-right">Total</span>
          <span className="w-4" />
        </div>
      </div>

      {/* Standings Rows List - Clean & Straightforward (No footballers under rows) */}
      <div className="space-y-1.5">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member: any, index: number) => {
            const rank = member.rank || index + 1;
            const prevRank = member.previousRank || rank;
            const rankDiff = prevRank - rank;
            const isCurrentUser = member.id === currentUserId;

            const rankBadgeClass =
              rank === 1
                ? 'bg-amber-400 text-slate-950 font-black'
                : rank === 2
                ? 'bg-slate-300 text-slate-950 font-black'
                : rank === 3
                ? 'bg-amber-700 text-white font-black'
                : 'text-slate-600 dark:text-slate-400 font-bold';

            return (
              <div
                key={member.id}
                onClick={() => setInspectedManagerId(member.id)}
                className={`p-3 sm:px-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group ${
                  isCurrentUser
                    ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/[0.09] border-emerald-500/40 shadow-xs'
                    : 'bg-white dark:bg-[#0c1322] hover:bg-slate-50 dark:hover:bg-[#10192b] border-slate-200 dark:border-white/[0.06] shadow-xs'
                }`}
              >
                {/* Left: Rank & Manager Info */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  {/* Rank Badge + Movement */}
                  <div className="flex flex-col items-center justify-center flex-shrink-0 w-7">
                    <span className={`text-xs sm:text-sm font-mono ${rankBadgeClass} px-1.5 py-0.5 rounded-md`}>
                      {rank}
                    </span>
                    {rankDiff > 0 ? (
                      <span className="text-[8px] font-black text-emerald-500 flex items-center mt-0.5">
                        <ArrowUp className="w-2.5 h-2.5" />
                        {rankDiff}
                      </span>
                    ) : rankDiff < 0 ? (
                      <span className="text-[8px] font-black text-rose-500 flex items-center mt-0.5">
                        <ArrowDown className="w-2.5 h-2.5" />
                        {Math.abs(rankDiff)}
                      </span>
                    ) : (
                      <Minus className="w-2 h-2 text-slate-400 opacity-40 mt-0.5" />
                    )}
                  </div>

                  {/* Team & Manager Name */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors truncate">
                        {member.teamName}
                      </span>
                      {isCurrentUser && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-emerald-500 text-slate-950">
                          YOU
                        </span>
                      )}
                      {member.activeChip && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center gap-0.5">
                          <Sparkles className="w-2 h-2" />
                          {String(member.activeChip).replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                      {member.managerName}
                    </span>
                  </div>
                </div>

                {/* Right: GW Points & Total Points */}
                <div className="flex items-center gap-5 sm:gap-8 flex-shrink-0">
                  {/* GW Points */}
                  <div className="w-12 text-right">
                    <span className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {member.gwPoints ?? 0}
                    </span>
                  </div>

                  {/* Total Points */}
                  <div className="w-14 text-right">
                    <span className="text-sm sm:text-base font-mono font-black text-slate-900 dark:text-white">
                      {member.totalPoints ?? 0}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 rounded-3xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
            No managers found matching &ldquo;{searchQuery || classFilter}&rdquo;.
          </div>
        )}
      </div>

      {/* Full Squad & Details Modal when tapping any manager */}
      <ManagerSquadModal
        managerId={inspectedManagerId}
        onClose={() => setInspectedManagerId(null)}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { CLUBS } from '../../data/clubs';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export const FixturesView: React.FC = () => {
  const { fixtures, clubs, currentGW, setActiveTab } = useFPL();
  const [selectedGW, setSelectedGW] = useState<number>(currentGW);

  const gwFixtures = fixtures.filter((f) => f.gameweek === selectedGW);

  return (
    <div className="flex flex-col space-y-3 pb-24 md:pb-12 px-2 sm:px-4 md:px-6 pt-1 md:pt-3 select-none max-w-4xl lg:max-w-5xl mx-auto w-full transition-colors duration-200">
      {/* Gameweek Navigator Header */}
      <div className="p-2.5 md:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <button
          onClick={() => setSelectedGW((prev) => Math.max(1, prev - 1))}
          disabled={selectedGW <= 1}
          className="p-1.5 md:p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-25 text-slate-700 dark:text-slate-200 transition-colors"
          title="Previous Gameweek"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm md:text-base font-black text-slate-900 dark:text-white">
              Gameweek {selectedGW}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
              {gwFixtures.length} Games
            </span>
          </div>
        </div>

        <button
          onClick={() => setSelectedGW((prev) => prev + 1)}
          className="p-1.5 md:p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors"
          title="Next Gameweek"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Fixtures List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-2.5">
        {gwFixtures.length === 0 ? (
          <div className="col-span-full p-8 md:p-10 text-center text-xs md:text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            No fixtures scheduled for Gameweek {selectedGW}.
            <div className="mt-3">
              <button
                onClick={() => setActiveTab('dev')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-colors"
              >
                + Add Games in Dev Mode
              </button>
            </div>
          </div>
        ) : (
          gwFixtures.map((fix) => {
            const homeClub = clubs[fix.homeClubId] || CLUBS[fix.homeClubId] || { name: fix.homeClubId, shortName: fix.homeClubId, primaryColor: '#555' };
            const awayClub = clubs[fix.awayClubId] || CLUBS[fix.awayClubId] || { name: fix.awayClubId, shortName: fix.awayClubId, primaryColor: '#555' };

            const homeDisplayName = homeClub.shortName || homeClub.name.replace(/^Team\s+/i, '');
            const awayDisplayName = awayClub.shortName || awayClub.name.replace(/^Team\s+/i, '');

            return (
              <div
                key={fix.id}
                className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col"
              >
                <div className="p-2.5 md:p-3 flex items-center justify-between">
                {/* Home Team */}
                <div className="flex-1 flex items-center justify-end space-x-2 text-right">
                  <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[110px] md:max-w-[140px]">
                    {homeDisplayName}
                  </span>
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20 flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: homeClub.primaryColor }}
                    title={homeClub.name}
                  />
                </div>

                {/* Score / Status Center */}
                <div className="mx-3 min-w-[68px] md:min-w-[80px] text-center flex justify-center">
                  {fix.isFinished ? (
                    <div className="flex flex-col items-center">
                      <div className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-xs md:text-sm text-emerald-600 dark:text-emerald-400">
                        {fix.homeScore} - {fix.awayScore}
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                        FT
                      </span>
                    </div>
                  ) : fix.isLive ? (
                    <div className="flex flex-col items-center">
                      <div className="px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 font-black text-xs md:text-sm text-rose-600 dark:text-rose-400">
                        {fix.homeScore ?? 0} - {fix.awayScore ?? 0}
                      </div>
                      <span className="text-[8px] font-black text-rose-500 mt-0.5 animate-pulse uppercase tracking-wider">
                        LIVE
                      </span>
                    </div>
                  ) : (
                    <div className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs font-bold">
                      vs
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex-1 flex items-center justify-start space-x-2 text-left">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20 flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: awayClub.primaryColor }}
                    title={awayClub.name}
                  />
                  <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[110px] md:max-w-[140px]">
                    {awayDisplayName}
                  </span>
                </div>
              </div>

              {/* Match Details Footer (Venue + Kickoff Time) */}
              <div className="flex items-center justify-between px-2.5 pb-2 -mt-1 text-[10px] text-slate-400">
                <span className="font-mono text-slate-500 dark:text-slate-400">{fix.kickoffTime || 'TBD'}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                    fix.venue === 'one_price'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                  }`}
                >
                  {fix.venue === 'one_price' ? '🏢 One Price Stadium' : '🏟️ Delisi Stadium'}
                </span>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};

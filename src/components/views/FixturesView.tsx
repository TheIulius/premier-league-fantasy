import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { CLUBS } from '../../data/clubs';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export const FixturesView: React.FC = () => {
  const { fixtures, clubs, currentGW, setActiveTab } = useFPL();
  const [selectedGW, setSelectedGW] = useState<number>(currentGW);

  const gwFixtures = fixtures.filter((f) => f.gameweek === selectedGW);

  return (
    <div className="flex flex-col space-y-3 pb-24 md:pb-12 px-2 md:px-6 pt-2 md:pt-4 select-none max-w-4xl lg:max-w-5xl mx-auto w-full">
      {/* Gameweek Navigator Header */}
      <div className="p-3 md:p-4 rounded-2xl bg-[#28002d] border border-[#4d0c54] flex items-center justify-between">
        <button
          onClick={() => setSelectedGW((prev) => Math.max(1, prev - 1))}
          disabled={selectedGW <= 1}
          className="p-1.5 md:p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <div className="text-center">
          <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase block">
            Komarovi Charity League Fixtures
          </span>
          <span className="text-sm md:text-base font-black text-white">Gameweek {selectedGW}</span>
        </div>

        <button
          onClick={() => setSelectedGW((prev) => prev + 1)}
          className="p-1.5 md:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Fixtures List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
        {gwFixtures.length === 0 ? (
          <div className="col-span-full p-8 md:p-12 text-center text-xs md:text-sm text-gray-400 bg-[#200024] rounded-2xl border border-white/5">
            <Calendar className="w-8 h-8 md:w-10 md:h-10 text-gray-500 mx-auto mb-2 opacity-50" />
            No fixtures scheduled for Gameweek {selectedGW} yet.
            <div className="mt-3">
              <button
                onClick={() => setActiveTab('dev')}
                className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-[#00ff87] text-[#37003c] font-black text-xs md:text-sm hover:opacity-90 transition-opacity"
              >
                + Add Games in Dev Portal
              </button>
            </div>
          </div>
        ) : (
          gwFixtures.map((fix) => {
            const homeClub = clubs[fix.homeClubId] || CLUBS[fix.homeClubId] || { name: fix.homeClubId, primaryColor: '#555' };
            const awayClub = clubs[fix.awayClubId] || CLUBS[fix.awayClubId] || { name: fix.awayClubId, primaryColor: '#555' };

            return (
              <div
                key={fix.id}
                className="p-3 md:p-3.5 rounded-xl bg-[#200024] border border-white/10 flex items-center justify-between shadow-md hover:border-white/20 transition-colors"
              >
                {/* Home Team */}
                <div className="flex-1 flex items-center justify-end space-x-2 text-right">
                  <span className="text-xs md:text-sm font-bold text-white truncate max-w-[105px] md:max-w-[140px]">
                    {homeClub.name}
                  </span>
                  <div
                    className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border border-white/30 flex-shrink-0"
                    style={{ backgroundColor: homeClub.primaryColor }}
                  />
                </div>

                {/* Score / Kickoff Center */}
                <div className="mx-3 min-w-[76px] md:min-w-[90px] text-center">
                  {fix.isFinished ? (
                    <div className="flex flex-col items-center">
                      <div className="px-2.5 md:px-3 py-0.5 md:py-1 rounded bg-black/60 border border-white/10 font-black text-sm md:text-base text-[#00ff87]">
                        {fix.homeScore} - {fix.awayScore}
                      </div>
                      <span className="text-[9px] md:text-[10px] font-bold text-gray-400 mt-0.5 uppercase">
                        FT
                      </span>
                    </div>
                  ) : fix.isLive ? (
                    <div className="flex flex-col items-center">
                      <div className="px-2.5 md:px-3 py-0.5 md:py-1 rounded bg-[#e90052]/20 border border-[#e90052] font-black text-sm md:text-base text-[#e90052]">
                        {fix.homeScore ?? 0} - {fix.awayScore ?? 0}
                      </div>
                      <span className="text-[9px] md:text-[10px] font-black text-[#e90052] mt-0.5 animate-pulse uppercase">
                        LIVE
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-xs md:text-sm font-bold text-gray-200">
                        {fix.kickoffTime}
                      </span>
                      <span className="text-[9px] md:text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        Upcoming
                      </span>
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex-1 flex items-center justify-start space-x-2 text-left">
                  <div
                    className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border border-white/30 flex-shrink-0"
                    style={{ backgroundColor: awayClub.primaryColor }}
                  />
                  <span className="text-xs md:text-sm font-bold text-white truncate max-w-[105px] md:max-w-[140px]">
                    {awayClub.name}
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

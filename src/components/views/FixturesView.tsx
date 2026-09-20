import React, { useState } from 'react';
import { useFPL } from '../../context/FPLContext';
import { CLUBS } from '../../data/clubs';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export const FixturesView: React.FC = () => {
  const { fixtures, currentGW } = useFPL();
  const [selectedGW, setSelectedGW] = useState<number>(currentGW);

  const gwFixtures = fixtures.filter((f) => f.gameweek === selectedGW);

  return (
    <div className="flex flex-col space-y-3 pb-24 px-2 pt-2 select-none">
      {/* Gameweek Navigator Header */}
      <div className="p-3 rounded-2xl bg-[#28002d] border border-[#4d0c54] flex items-center justify-between">
        <button
          onClick={() => setSelectedGW((prev) => Math.max(1, prev - 1))}
          disabled={selectedGW <= 1}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">
            Komarovi Charity League Fixtures
          </span>
          <span className="text-sm font-black text-white">Gameweek {selectedGW}</span>
        </div>

        <button
          onClick={() => setSelectedGW((prev) => prev + 1)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Fixtures List */}
      <div className="space-y-2">
        {gwFixtures.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 bg-[#200024] rounded-2xl border border-white/5">
            <Calendar className="w-8 h-8 text-gray-500 mx-auto mb-2 opacity-50" />
            No fixtures scheduled for Gameweek {selectedGW} yet.
            <div className="mt-1 text-[11px] text-gray-500">
              You can add fixtures in the Developer Portal.
            </div>
          </div>
        ) : (
          gwFixtures.map((fix) => {
            const homeClub = CLUBS[fix.homeClubId] || { name: fix.homeClubId, primaryColor: '#555' };
            const awayClub = CLUBS[fix.awayClubId] || { name: fix.awayClubId, primaryColor: '#555' };

            return (
              <div
                key={fix.id}
                className="p-3 rounded-xl bg-[#200024] border border-white/10 flex items-center justify-between shadow-md"
              >
                {/* Home Team */}
                <div className="flex-1 flex items-center justify-end space-x-2 text-right">
                  <span className="text-xs font-bold text-white truncate max-w-[105px]">
                    {homeClub.name}
                  </span>
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/30 flex-shrink-0"
                    style={{ backgroundColor: homeClub.primaryColor }}
                  />
                </div>

                {/* Score / Kickoff Center */}
                <div className="mx-3 min-w-[76px] text-center">
                  {fix.isFinished ? (
                    <div className="flex flex-col items-center">
                      <div className="px-2.5 py-0.5 rounded bg-black/60 border border-white/10 font-black text-sm text-[#00ff87]">
                        {fix.homeScore} - {fix.awayScore}
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase">
                        FT
                      </span>
                    </div>
                  ) : fix.isLive ? (
                    <div className="flex flex-col items-center">
                      <div className="px-2.5 py-0.5 rounded bg-[#e90052]/20 border border-[#e90052] font-black text-sm text-[#e90052]">
                        {fix.homeScore ?? 0} - {fix.awayScore ?? 0}
                      </div>
                      <span className="text-[9px] font-black text-[#e90052] mt-0.5 animate-pulse uppercase">
                        LIVE
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-gray-200">
                        {fix.kickoffTime}
                      </span>
                      <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        Upcoming
                      </span>
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex-1 flex items-center justify-start space-x-2 text-left">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/30 flex-shrink-0"
                    style={{ backgroundColor: awayClub.primaryColor }}
                  />
                  <span className="text-xs font-bold text-white truncate max-w-[105px]">
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

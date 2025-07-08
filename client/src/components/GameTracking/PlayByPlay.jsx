import React, { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/solid';

// Utility functions
import { statDisplayMap } from '../../utils/statDisplayMap';
import { formatTime } from '../../utils/formatTime';

export default function PlayByPlay({ playByPlay, teams, handleDeletePlay }) {
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');

  const getTeamName = (teamId) => {
    return teams?.find(team => team._id.toString() === teamId.toString())?.name || 'Unknown Team';
  };

  const getPeriodOptions = () => {
    const periods = [...new Set(playByPlay.map(entry => entry.period))];
    return ['all', ...periods.sort()];
  };

  const filteredPlays = playByPlay
    .filter(entry => filterTeam === 'all' || entry.team.toString() === filterTeam)
    .filter(entry => filterPeriod === 'all' || entry.period === filterPeriod)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Most recent first

  return (
    <div className="w-full mt-2" role="region" aria-label="Play-by-Play Log">
      <h2 className="text-lg font-bold mb-2">Play-by-Play</h2>
      <div className="flex gap-4 mb-4">
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="px-2 py-1 rounded bg-gray-100"
          aria-label="Filter by team"
        >
          <option value="all">All Teams</option>
          {teams?.map(team => (
            <option key={team._id} value={team._id}>{team.name}</option>
          ))}
        </select>
        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="px-2 py-1 rounded bg-gray-100"
          aria-label="Filter by period"
        >
          {getPeriodOptions().map(period => (
            <option key={period} value={period}>{period === 'all' ? 'All Periods' : period}</option>
          ))}
        </select>
      </div>
      {filteredPlays.length === 0 ? (
        <div className="text-center text-gray-500">No plays recorded</div>
      ) : (
        <div className="space-y-2 py-4">
          {filteredPlays.map((entry, index) => (
            <div
              key={index}
              className="bg-white border border-gray-300 rounded-md shadow-sm p-3 mb-3 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between"
            >
              {/* LEFT SECTION: Details */}
              <div className="flex flex-col w-full sm:grid sm:grid-cols-[40px_1fr_1fr_auto] sm:items-center sm:gap-4">
                {/* Player Image + Name */}
                <div className="flex items-center gap-3 sm:col-span-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                    {entry.playerImage ? (
                      <img
                        src={entry.playerImage}
                        alt={`${entry.playerName} avatar`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 rounded-full" />
                    )}
                  </div>
                  <span className="font-semibold text-blue-900 text-sm truncate">
                    {entry.playerName}
                  </span>
                </div>

                {/* Team Name */}
                <span className="text-xs text-gray-600 sm:truncate sm:overflow-hidden sm:col-span-1 flex items-center">
                  {getTeamName(entry.team)}
                </span>

                {/* Stat + Time + Period all on one line */}
                <span className="text-sm text-gray-700 sm:col-span-2 flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <span className="font-semibold">{statDisplayMap[entry.statType]?.label || entry.statType}</span>
                  <span className="text-gray-400 text-xs">
                    {formatTime(entry.time)} in {entry.period}
                  </span>
                </span>
              </div>

              {/* RIGHT SECTION: Delete Button */}
              <div className="flex sm:justify-center mt-3 sm:mt-0 sm:ml-3">
                <button
                  onClick={() => handleDeletePlay(entry)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors duration-200"
                  aria-label={`Delete play: ${statDisplayMap[entry.statType]?.label || entry.statType} for ${entry.playerName}`}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

          ))}
        </div>
      )}
    </div>
  );
}
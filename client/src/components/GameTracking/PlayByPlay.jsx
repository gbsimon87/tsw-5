import React, { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/solid';
import { statDisplayMap } from '../../utils/statDisplayMap';

export default function PlayByPlay({ playByPlay, teams, handleDeletePlay }) {
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');

  const getTeamName = (teamId) => {
    return teams?.find(team => team._id.toString() === teamId.toString())?.name || 'Unknown Team';
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
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
    <div className="w-full" role="region" aria-label="Play-by-Play Log">
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
        <div className="space-y-2">
          {filteredPlays.map((entry, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded shadow-sm mb-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-1">
                <span className="font-semibold text-blue-900">{entry.playerName}</span>
                <span className="text-sm text-gray-700">
                  {statDisplayMap[entry.statType]?.label || entry.statType}
                </span>
                <span className="inline-block bg-gray-100 text-xs text-gray-600 rounded px-2 py-0.5 ml-0 sm:ml-2">
                  {getTeamName(entry.team)}
                </span>
                <span className="text-xs text-gray-400 ml-0 sm:ml-2">
                  {formatTime(entry.time)} in {entry.period}
                </span>
              </div>
              <button
                onClick={() => handleDeletePlay(entry)}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 ml-2 transition"
                aria-label={`Delete play: ${statDisplayMap[entry.statType]?.label || entry.statType} for ${entry.playerName}`}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
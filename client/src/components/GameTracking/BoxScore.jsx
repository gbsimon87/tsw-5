import { useEffect, useState } from 'react';
import { statDisplayMap } from '../../utils/statDisplayMap';

export default function BoxScore({ game, league, tab, setTab, boxScoreTabLabels, filteredPlayers }) {
  const [errorMessages, setErrorMessages] = useState([]);

  useEffect(() => {
    const errors = [];
    if (!league) errors.push("Missing league data.");
    if (!league?.settings) errors.push("Missing league settings.");
    if (!Array.isArray(league?.settings?.statTypes)) errors.push("Stat types (league.settings.statTypes) must be an array.");
    if (!Array.isArray(game?.teams)) errors.push("Teams (game.teams) must be an array.");
    if (Array.isArray(game?.teams) && game?.teams.length !== 2) errors.push("Teams array must have exactly 2 teams.");
    if (!Array.isArray(filteredPlayers)) errors.push("filteredPlayers must be an array.");
    setErrorMessages(errors);
  }, [league, game, filteredPlayers]);

  if (errorMessages.length > 0) {
    return (
      <div className="p-4 text-red-600">
        <div>Invalid data for BoxScore:</div>
        <ul className="list-disc list-inside mt-2">
          {errorMessages.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      </div>
    );
  }

  const statTypes = league.settings.statTypes;

  return (
    <div className="w-full mt-2">
      <div className="flex justify-center mb-4 flex-wrap gap-2">
        {boxScoreTabLabels.map((label, idx) => (
          <button
            key={label}
            className={`px-4 py-2 rounded-md font-semibold transition-all duration-200
              ${tab === idx
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}
            `}
            onClick={() => setTab(idx)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-md border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th
                className="sticky top-0 left-0 z-30 bg-gray-50 border-b border-gray-200 px-4 py-2 text-left font-semibold"
                style={{ minWidth: 120 }}
                scope="col"
              >
                Name
              </th>
              {statTypes?.map(statKey => (
                <th
                  key={statKey}
                  className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap text-center"
                  scope="col"
                >
                  {statDisplayMap[statKey]?.abbr || statKey}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPlayers.length === 0 ? (
              <tr>
                <td
                  colSpan={1 + statTypes.length}
                  className="text-center py-6 text-gray-400"
                >
                  No player stats available.
                </td>
              </tr>
            ) : (
              filteredPlayers.map((player, idx) => (
                <tr
                  key={player.playerId}
                  className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}
                >
                  <td
                    className="sticky left-0 bg-white border-b border-gray-100 px-4 py-2 font-medium whitespace-normal z-10"
                    style={{ minWidth: 120, maxWidth: 200 }}
                  >
                    {player.playerName}
                  </td>
                  {statTypes?.map(statKey => (
                    <td
                      key={statKey}
                      className="border-b border-gray-100 px-3 py-2 text-center text-sm text-gray-700"
                    >
                      {typeof player.stats?.[statKey] === 'number'
                        ? player.stats[statKey]
                        : 0}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

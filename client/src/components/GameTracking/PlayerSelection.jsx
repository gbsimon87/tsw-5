import React from 'react';
import { toast } from 'react-toastify';

export default function PlayerSelection({
  teams,
  activePlayersTeam1,
  activePlayersTeam2,
  selectedPlayersTeam1,
  selectedPlayersTeam2,
  startersCount,
  handlePlayerClick,
  handleKeyDown,
  hasGameStarted,
  remainingSeconds,
  isSubstitutionMode,
  setSelectedPlayersTeam1,
  setSelectedPlayersTeam2,
}) {
  if (!teams || !Array.isArray(teams) || teams.length !== 2) {
    throw new Error('[PlayerSelection]: Valid teams data is required (expected array of two teams)');
  }

  const handleSelectPlayer = (teamId, playerId) => {
    const isTeam1 = teamId === teams[0]._id;
    const setSelected = isTeam1 ? setSelectedPlayersTeam1 : setSelectedPlayersTeam2;
    const currentSelected = isTeam1 ? selectedPlayersTeam1 : selectedPlayersTeam2;
    const teamName = isTeam1 ? teams[0].name : teams[1].name;

    setSelected(prev => {
      const isChecked = prev.includes(playerId);
      if (isChecked) {
        return prev.filter(id => id !== playerId);
      } else {
        if (prev.length >= startersCount) {
          toast.error(`You can select up to ${startersCount} players for ${teamName}`, {
            toastId: `max-selection-${teamId}`,
          });
          return prev;
        }
        return [...prev, playerId];
      }
    });
  };

  const renderPlayerCard = (player, teamId) => {
    const isTeam1 = teamId === teams[0]._id;
    const isChecked = (isTeam1 ? selectedPlayersTeam1 : selectedPlayersTeam2).includes(player.playerId);

    return (
      <div
        key={player.playerId}
        className={`w-full bg-white border border-gray-200 shadow-md p-3 flex flex-col items-center gap-2 transition
        ${!hasGameStarted || remainingSeconds <= 0 ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      >
        {isSubstitutionMode ? (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => handleSelectPlayer(teamId, player.playerId)}
            className="mt-1"
            aria-label={`Toggle active status for ${player.name || 'Unknown'}`}
            disabled={!hasGameStarted || remainingSeconds <= 0}
          />
        ) : (
          <div className="flex items-center gap-1 flex-shrink-0">
            <img
              src="https://placehold.co/40x40?text=👤"
              alt={`${player.name || 'Unknown'} profile`}
              className="w-10 h-10 rounded-full object-cover bg-gray-200"
            />
            <span className="bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">
              #{player.jerseyNumber || 'N/A'}
            </span>
          </div>
        )}
        <button
          className="flex-1 flex flex-col items-center min-w-0 w-full"
          onClick={() => handlePlayerClick(player)}
          onKeyDown={(e) => handleKeyDown(e, () => handlePlayerClick(player))}
          tabIndex={0}
          aria-label={`Select ${player.name || 'Unknown'} jersey ${player.jerseyNumber || 'N/A'}`}
          disabled={!hasGameStarted || remainingSeconds <= 0 || isSubstitutionMode}
        >
          <div className="mb-1 w-full">
            <span className="font-semibold text-base break-words whitespace-normal block text-center">
              {player.name || 'Unknown'}
            </span>
          </div>
          <div className="flex gap-2 text-xs text-gray-700 justify-center w-full">
            <span>Pos: {player.position || 'N/A'}</span>
          </div>
        </button>
      </div>
    );
  };

  const team1Players = isSubstitutionMode
    ? teams[0].members.filter(member => member.isActive)
    : teams[0].members.filter(member => activePlayersTeam1.includes(member.playerId) && member.isActive).slice(0, startersCount);
  const team2Players = isSubstitutionMode
    ? teams[1].members.filter(member => member.isActive)
    : teams[1].members.filter(member => activePlayersTeam2.includes(member.playerId) && member.isActive).slice(0, startersCount);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 w-full gap-2 sm:gap-6 pt-0">
      <div className="flex flex-col gap-2 w-full">
        <h2 className="text-lg font-bold text-center">
          {isSubstitutionMode && `(${selectedPlayersTeam1.length}/${startersCount})`}
        </h2>
        {team1Players.length > 0 ? (
          team1Players.map(player => renderPlayerCard(player, teams[0]._id))
        ) : (
          <div className="text-center text-gray-500">No active players</div>
        )}
      </div>
      <div className="flex flex-col gap-2 w-full">
        <h2 className="text-lg font-bold text-center">
          {isSubstitutionMode && `(${selectedPlayersTeam2.length}/${startersCount})`}
        </h2>
        {team2Players.length > 0 ? (
          team2Players.map(player => renderPlayerCard(player, teams[1]._id))
        ) : (
          <div className="text-center text-gray-500">No active players</div>
        )}
      </div>
    </div>
  );
}
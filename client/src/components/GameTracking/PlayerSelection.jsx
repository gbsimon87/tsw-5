import { useState } from 'react';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import { getFirstCapitalLetter } from '../../utils/getFirstCapitalLetter';
import { getInitialAndLastName } from '../../utils/getInitialAndLastName';
import { statDisplayMap } from '../../utils/statDisplayMap';

export default function PlayerSelection({
  teams,
  game,
  league,
  activePlayersTeam1,
  activePlayersTeam2,
  selectedPlayersTeam1,
  selectedPlayersTeam2,
  startersCount,
  handlePlayerClick,
  hasGameStarted,
  remainingSeconds,
  isSubstitutionMode,
  setSelectedPlayersTeam1,
  setSelectedPlayersTeam2,
}) {
  if (!teams || !Array.isArray(teams) || teams.length !== 2) {
    throw new Error('[PlayerSelection]: Valid teams data is required (expected array of two teams)');
  }

  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handleSelectPlayer = (teamId, playerId) => {
    const isTeam1 = teamId === teams[0]._id;
    const setSelected = isTeam1 ? setSelectedPlayersTeam1 : setSelectedPlayersTeam2;
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

  const getPlayerStats = (playerId) => {
    const playerStat = game?.playerStats?.find(stat => stat.playerId === playerId);
    const stats = playerStat?.stats || {};
    const points = ((stats.twoPointFGM || 0) * 2) + ((stats.threePointFGM || 0) * 3) + (stats.freeThrowM || 0);
    return {
      personalFoul: stats.personalFoul || 0,
      points: points || 0,
      assist: stats.assist || 0,
    };
  };

  const renderPlayerCard = (player, teamId) => {
    const isTeam1 = teamId === teams[0]._id;
    const isChecked = (isTeam1 ? selectedPlayersTeam1 : selectedPlayersTeam2).includes(player.playerId);
    const { personalFoul, points, assist } = getPlayerStats(player.playerId);

    return (
      <div
        key={player.playerId}
        className={`w-full bg-white border border-gray-200 shadow-md p-1 flex flex-col gap-2 transition
          ${!hasGameStarted || remainingSeconds <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !isSubstitutionMode && hasGameStarted && remainingSeconds > 0 && setSelectedPlayer(player)}
      >
        {/* Top Container: Avatar, Name, Position/Jersey */}
        <div className="flex flex-row items-center gap-3 w-full">
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
            <img
              src="https://placehold.co/40x40?text=👤"
              alt={`${player.name || 'Unknown'} profile`}
              className="w-10 h-10 rounded-full object-cover bg-gray-200 flex-shrink-0"
            />
          )}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-base break-words whitespace-normal block">
              {getInitialAndLastName(player.name) || 'Unknown'}
            </span>
            <span className="text-xs text-gray-700 mt-1">
              {getFirstCapitalLetter(player.position) || 'N/A'}
              <span className="text-gray-400">|</span>
              #{player.jerseyNumber || 'N/A'}
            </span>
          </div>
        </div>
        {/* Bottom Container: Stats preview */}
        <div className="w-full text-xs text-blue-700 text-center py-1 border-t border-gray-100">
          <span>PF: {personalFoul}</span> | <span>PTS: {points}</span> | <span>AST: {assist}</span>
        </div>
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
      {selectedPlayer && !isSubstitutionMode && (
        <Modal
          isOpen={selectedPlayer && !isSubstitutionMode}
          onRequestClose={() => setSelectedPlayer(null)}
          className="bg-white p-4 rounded shadow-lg max-w-md w-full mx-auto my-8"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          aria={{
            labelledby: "stat-modal-title",
            describedby: "stat-modal-description",
          }}
        >
          <h3 id="stat-modal-title" className="text-lg font-bold mb-2">
            Select Stat for {getInitialAndLastName(selectedPlayer?.name) || 'Unknown'}
          </h3>
          <div id="stat-modal-description" className="grid grid-cols-2 gap-2">
            {league?.settings?.statTypes.map(statType => (
              <button
                key={statType}
                onClick={() => {
                  handlePlayerClick(selectedPlayer, statType);
                  setSelectedPlayer(null);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {statDisplayMap[statType]?.label || statType}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedPlayer(null)}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 w-full"
          >
            Cancel
          </button>
        </Modal>
      )}
    </div>
  );
}
import { useState } from 'react';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
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
  const [modalStep, setModalStep] = useState('selectStat'); // 'selectStat', 'followUpRebound', 'followUpAssist', 'followUpShot', 'followUpTurnover', 'followUpSteal', 'followUpFoul', 'followUpBlock'
  const [selectedStatType, setSelectedStatType] = useState(null);
  const [overrideMinutes, setOverrideMinutes] = useState('');
  const [overrideSeconds, setOverrideSeconds] = useState('');
  const [overridePeriod, setOverridePeriod] = useState('');
  const [followUpPlayerId, setFollowUpPlayerId] = useState(null);

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
        onClick={() => !isSubstitutionMode && hasGameStarted && remainingSeconds > 0 && setSelectedPlayer({ ...player, teamId })}
      >
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

  const activePlayers = teams.flatMap(team => {
    const activePlayerIds = team._id === teams[0]._id ? activePlayersTeam1 : activePlayersTeam2;
    return team.members
      .filter(member => member.isActive && activePlayerIds.includes(member.playerId))
      .map(member => ({ ...member, teamId: team._id }));
  });

  const getTeamPlayers = (teamId) => {
    const activePlayerIds = teamId === teams[0]._id ? activePlayersTeam1 : activePlayersTeam2;
    return teams
      .find(team => team._id === teamId)
      ?.members
      .filter(member => member.isActive && activePlayerIds.includes(member.playerId))
      .map(member => ({ ...member, teamId })) || [];
  };

  const getOpposingTeamPlayers = (teamId) => {
    const opposingTeamId = teams.find(team => team._id !== teamId)?._id;
    const activePlayerIds = opposingTeamId === teams[0]._id ? activePlayersTeam1 : activePlayersTeam2;
    return teams
      .find(team => team._id === opposingTeamId)
      ?.members
      .filter(member => member.isActive && activePlayerIds.includes(member.playerId))
      .map(member => ({ ...member, teamId: opposingTeamId })) || [];
  };

  const handleStatSelect = (statType) => {
    setSelectedStatType(statType);
    if (['twoPointFGA', 'threePointFGA', 'freeThrowA'].includes(statType)) {
      setModalStep('followUpRebound');
    } else if (['twoPointFGM', 'threePointFGM', 'freeThrowM'].includes(statType)) {
      setModalStep('followUpAssist');
    } else if (['offensiveRebound', 'defensiveRebound', 'assist'].includes(statType)) {
      setModalStep('followUpShot');
    } else if (statType === 'steal') {
      setModalStep('followUpTurnover');
    } else if (statType === 'turnover') {
      setModalStep('followUpSteal');
    } else if (statType === 'personalFoul') {
      setModalStep('followUpFoul');
    } else if (statType === 'block') {
      setModalStep('followUpBlock');
    } else {
      handlePlayerClick([{
        player: selectedPlayer,
        statType,
        time: overrideMinutes && overrideSeconds ? 
          parseInt(overrideMinutes, 10) * 60 + parseInt(overrideSeconds, 10) : null,
        period: overridePeriod || null,
      }]);
      resetModal();
    }
  };

  const handleFollowUp = (followUpData) => {
    const statsToRecord = [{
      player: selectedPlayer,
      statType: selectedStatType,
      time: overrideMinutes && overrideSeconds ? 
        parseInt(overrideMinutes, 10) * 60 + parseInt(overrideSeconds, 10) : null,
      period: overridePeriod || null,
    }];

    if (followUpData) {
      if (modalStep === 'followUpShot') {
        if (followUpData.playerId && followUpData.shotType) {
          const followUpPlayer = activePlayers.find(p => p.playerId === followUpData.playerId);
          statsToRecord.push({
            player: followUpPlayer,
            statType: followUpData.shotType,
            time: overrideMinutes && overrideSeconds ? 
              parseInt(overrideMinutes, 10) * 60 + parseInt(overrideSeconds, 10) : null,
            period: overridePeriod || null,
          });
        }
      } else if (followUpData.playerId) {
        const followUpPlayer = activePlayers.find(p => p.playerId === followUpData.playerId);
        statsToRecord.push({
          player: followUpPlayer,
          statType: followUpData.statType,
          time: overrideMinutes && overrideSeconds ? 
            parseInt(overrideMinutes, 10) * 60 + parseInt(overrideSeconds, 10) : null,
          period: overridePeriod || null,
        });
      }
    }

    handlePlayerClick(statsToRecord);
    resetModal();
  };

  const resetModal = () => {
    setSelectedPlayer(null);
    setModalStep('selectStat');
    setSelectedStatType(null);
    setFollowUpPlayerId(null);
    setOverrideMinutes('');
    setOverrideSeconds('');
    setOverridePeriod('');
  };

  const getPeriodOptions = () => {
    const periodType = league?.settings?.periodType || 'halves';
    return periodType === 'halves' ? ['H1', 'H2', 'OT1', 'OT2'] :
           periodType === 'quarters' ? ['Q1', 'Q2', 'Q3', 'Q4', 'OT1', 'OT2'] :
           ['P1', 'P2', 'P3', 'OT1', 'OT2'];
  };

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
      <Modal
        isOpen={selectedPlayer && !isSubstitutionMode}
        onRequestClose={resetModal}
        className="bg-white p-4 rounded shadow-lg max-w-md w-full mx-auto my-8"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        aria={{
          labelledby: "stat-modal-title",
          describedby: "stat-modal-description",
        }}
      >
        {modalStep === 'selectStat' ? (
          <>
            <h3 id="stat-modal-title" className="text-lg font-bold mb-2">
              Select Stat for {getInitialAndLastName(selectedPlayer?.name) || 'Unknown'}
            </h3>
            <div id="stat-modal-description" className="grid grid-cols-2 gap-2">
              {league?.settings?.statTypes.map(statType => (
                <button
                  key={statType}
                  onClick={() => handleStatSelect(statType)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {statDisplayMap[statType]?.label || statType}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={overrideMinutes}
                onChange={(e) => setOverrideMinutes(e.target.value.slice(0, 2))}
                className="w-12 text-center bg-gray-100 rounded px-1"
                maxLength={2}
                placeholder="MM"
                aria-label="Override stat minutes"
              />
              <span>:</span>
              <input
                type="text"
                value={overrideSeconds}
                onChange={(e) => setOverrideSeconds(e.target.value.slice(0, 2))}
                className="w-12 text-center bg-gray-100 rounded px-1"
                maxLength={2}
                placeholder="SS"
                aria-label="Override stat seconds"
              />
              <select
                value={overridePeriod}
                onChange={(e) => setOverridePeriod(e.target.value)}
                className="px-2 py-1 rounded bg-gray-100"
                aria-label="Override stat period"
              >
                <option value="">Current Period</option>
                {getPeriodOptions().map(period => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>
            <button
              onClick={resetModal}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 w-full"
            >
              Cancel
            </button>
          </>
        ) : modalStep === 'followUpRebound' ? (
          <>
            <h3 id="stat-modal-title" className="text-lg font-bold mb-2">
              Who got the rebound after {getInitialAndLastName(selectedPlayer?.name)}'s {statDisplayMap[selectedStatType]?.label || selectedStatType}?
            </h3>
            <div id="stat-modal-description" className="grid grid-cols-2 gap-2">
              {activePlayers.map(player => (
                <button
                  key={player.playerId}
                  onClick={() => handleFollowUp({ playerId: player.playerId, statType: player.teamId === selectedPlayer.teamId ? 'offensiveRebound' : 'defensiveRebound' })}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {getInitialAndLastName(player.name) || 'Unknown'}
                </button>
              ))}
              <button
                onClick={() => handleFollowUp(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                No Rebound
              </button>
            </div>
            <button
              onClick={() => setModalStep('selectStat')}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 w-full"
            >
              Back
            </button>
          </>
        ) : modalStep === 'followUpAssist' ? (
          <>
            <h3 id="stat-modal-title" className="text-lg font-bold mb-2">
              Who assisted on {getInitialAndLastName(selectedPlayer?.name)}'s {statDisplayMap[selectedStatType]?.label || selectedStatType}?
            </h3>
            <div id="stat-modal-description" className="grid grid-cols-2 gap-2">
              {getTeamPlayers(selectedPlayer.teamId).filter(p => p.playerId !== selectedPlayer.playerId).map(player => (
                <button
                  key={player.playerId}
                  onClick={() => handleFollowUp({ playerId: player.playerId, statType: 'assist' })}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {getInitialAndLastName(player.name) || 'Unknown'}
                </button>
              ))}
              <button
                onClick={() => handleFollowUp(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                No Assist
              </button>
            </div>
            <button
              onClick={() => setModalStep('selectStat')}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 w-full"
            >
              Back
            </button>
          </>
        ) : modalStep === 'followUpShot' ? (
          <>
            <h3 id="stat-modal-title" className="text-lg font-bold mb-2">
              Who shot the ball for {getInitialAndLastName(selectedPlayer?.name)}'s {statDisplayMap[selectedStatType]?.label || selectedStatType}?
            </h3>
            <div id="stat-modal-description" className="grid grid-cols-2 gap-2">
              {activePlayers.filter(p => p.playerId !== selectedPlayer.playerId).map(player => (
                <button
                  key={player.playerId}
                  onClick={() => setFollowUpPlayerId(player.playerId)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {getInitialAndLastName(player.name) || 'Unknown'}
                </button>
              ))}
              <button
                onClick={() => handleFollowUp(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                No Shot
              </button>
            </div>
            {followUpPlayerId && (
              <div className="mt-2">
                <h4 className="text-sm font-semibold mb-1">Shot Type</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['twoPointFGA', 'threePointFGA', 'freeThrowA'].map(shotType => (
                    <button
                      key={shotType}
                      onClick={() => handleFollowUp({ playerId: followUpPlayerId, shotType })}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      {statDisplayMap[shotType]?.label || shotType}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => {
                setModalStep('selectStat');
                setFollowUpPlayerId(null);
              }}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 w-full"
            >
              Back
            </button>
          </>
        ) : modalStep === 'followUpTurnover' ? (
          <>
            <h3 id="stat-modal-title" className="text-lg font-bold mb-2">
              Who committed the turnover for {getInitialAndLastName(selectedPlayer?.name)}'s steal?
            </h3>
            <div id="stat-modal-description" className="grid grid-cols-2 gap-2">
              {getOpposingTeamPlayers(selectedPlayer.teamId).map(player => (
                <button
                  key={player.playerId}
                  onClick={() => handleFollowUp({ playerId: player.playerId, statType: 'turnover' })}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {getInitialAndLastName(player.name) || 'Unknown'}
                </button>
              ))}
              <button
                onClick={() => handleFollowUp(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                No Turnover
              </button>
            </div>
            <button
              onClick={() => setModalStep('selectStat')}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 w-full"
            >
              Back
            </button>
          </>
        ) : modalStep === 'followUpSteal' ? (
          <>
            <h3 id="stat-modal-title" className="text-lg font-bold mb-2">
              Who stole the ball for {getInitialAndLastName(selectedPlayer?.name)}'s turnover?
            </h3>
            <div id="stat-modal-description" className="grid grid-cols-2 gap-2">
              {getOpposingTeamPlayers(selectedPlayer.teamId).map(player => (
                <button
                  key={player.playerId}
                  onClick={() => handleFollowUp({ playerId: player.playerId, statType: 'steal' })}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {getInitialAndLastName(player.name) || 'Unknown'}
                </button>
              ))}
              <button
                onClick={() => handleFollowUp(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                No Steal
              </button>
            </div>
            <button
              onClick={() => setModalStep('selectStat')}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 w-full"
            >
              Back
            </button>
          </>
        ) : modalStep === 'followUpFoul' ? (
          <>
            <h3 id="stat-modal-title" className="text-lg font-bold mb-2">
              Who drew the foul from {getInitialAndLastName(selectedPlayer?.name)}'s foul?
            </h3>
            <div id="stat-modal-description" className="grid grid-cols-2 gap-2">
              {getOpposingTeamPlayers(selectedPlayer.teamId).map(player => (
                <button
                  key={player.playerId}
                  onClick={() => handleFollowUp({ playerId: player.playerId, statType: 'drawnFoul' })}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {getInitialAndLastName(player.name) || 'Unknown'}
                </button>
              ))}
              <button
                onClick={() => handleFollowUp(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                No Player
              </button>
            </div>
            <button
              onClick={() => setModalStep('selectStat')}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 w-full"
            >
              Back
            </button>
          </>
        ) : modalStep === 'followUpBlock' ? (
          <>
            <h3 id="stat-modal-title" className="text-lg font-bold mb-2">
              Who was blocked by {getInitialAndLastName(selectedPlayer?.name)}'s block?
            </h3>
            <div id="stat-modal-description" className="grid grid-cols-2 gap-2">
              {getOpposingTeamPlayers(selectedPlayer.teamId).map(player => (
                <button
                  key={player.playerId}
                  onClick={() => handleFollowUp({ playerId: player.playerId, statType: 'blockedShotAttempt' })}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {getInitialAndLastName(player.name) || 'Unknown'}
                </button>
              ))}
              <button
                onClick={() => handleFollowUp(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                No Player
              </button>
            </div>
            <button
              onClick={() => setModalStep('selectStat')}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 w-full"
            >
              Back
            </button>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
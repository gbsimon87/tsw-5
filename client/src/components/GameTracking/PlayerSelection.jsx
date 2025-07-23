import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import { getFirstCapitalLetter } from '../../utils/getFirstCapitalLetter';
import { getInitialAndLastName } from '../../utils/getInitialAndLastName';
import { statDisplayMap } from '../../utils/statDisplayMap';
import StatModal from './StatModal';

const AddRingerModal = ({ isOpen, onClose, teams, leagueId, onRingerAdded, userToken, shouldCloseOnOverlayClick, contentLabel }) => {
  const [formData, setFormData] = useState({
    name: '',
    jerseyNumber: '',
    position: '',
    teamId: teams[0]?._id || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Ringer name is required', { toastId: 'ringer-name-error' });
      setLoading(false);
      return;
    }
    if (!formData.teamId || !teams.find(team => team._id === formData.teamId)) {
      toast.error('Invalid team selected', { toastId: 'ringer-team-error' });
      setLoading(false);
      return;
    }
    if (!leagueId) {
      toast.error('Invalid league ID', { toastId: 'ringer-league-error' });
      setLoading(false);
      return;
    }
    if (!userToken) {
      toast.error('Authentication token missing', { toastId: 'ringer-token-error' });
      setLoading(false);
      return;
    }
    setLoading(true);
    const url = `/api/players/${formData.teamId}/players/ringer`;
    const payload = {
      name: formData.name,
      jerseyNumber: formData.jerseyNumber || undefined,
      position: formData.position || undefined,
      leagueId,
    };
    try {
      const response = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      toast.success('Ringer player added successfully', { toastId: 'ringer-added' });
      onRingerAdded(response.data.player);
      setFormData({ name: '', jerseyNumber: '', position: '', teamId: teams[0]?._id || '' });
      onClose();
    } catch (error) {
      console.error('AddRingerModal error:', error);
      toast.error(error.response?.data?.message || 'Failed to add ringer player', { toastId: 'ringer-error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white p-4 rounded shadow-lg max-w-md w-full mx-auto my-8"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      contentLabel={contentLabel}
      aria={{
        labelledby: "add-ringer-modal-title",
        describedby: "add-ringer-modal-description",
      }}
    >
      <h3 id="add-ringer-modal-title" className="text-lg font-bold mb-2">Add Ringer Player</h3>
      <form id="add-ringer-modal-description" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            aria-required="true"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Jersey Number (Optional)</label>
          <input
            type="number"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={formData.jerseyNumber}
            onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Position (Optional)</label>
          <input
            type="text"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Team</label>
          <select
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={formData.teamId}
            onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
            required
            aria-required="true"
          >
            {teams.map(team => (
              <option key={team._id} value={team._id}>{team.name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Ringer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

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
  remainingSeconds,
  isSubstitutionMode,
  setSelectedPlayersTeam1,
  setSelectedPlayersTeam2,
  clockState,
  isLeagueAdmin,
  isRingerModalOpen,
  onOpenRingerModal,
  onCloseRingerModal,
  onRingerAdded,
  userToken,
}) {
  if (!teams || !Array.isArray(teams) || teams.length !== 2) {
    throw new Error('[PlayerSelection]: Valid teams data is required (expected array of two teams)');
  }

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [modalStep, setModalStep] = useState('selectStat');
  const [selectedStatType, setSelectedStatType] = useState(null);
  const [overrideMinutes, setOverrideMinutes] = useState('');
  const [overrideSeconds, setOverrideSeconds] = useState('');
  const [overridePeriod, setOverridePeriod] = useState('');

  const handleSelectPlayer = (teamId, playerId) => {
    const isTeam1 = teamId === teams[0]?._id;
    const setSelected = isTeam1 ? setSelectedPlayersTeam1 : setSelectedPlayersTeam2;
    const teamName = isTeam1 ? teams[0]?.name : teams[1]?.name;

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
    const playerStat = game?.playerStats?.find(stat => stat.playerId === playerId || stat.player === playerId);
    const stats = playerStat?.stats || {};
    const points = ((stats.twoPointFGM || 0) * 2) + ((stats.threePointFGM || 0) * 3) + (stats.freeThrowM || 0);
    const totalFouls = league?.sportType === 'basketball'
      ? (stats.personalFoul || 0) + (stats.technicalFoul || 0) + (stats.flagrantFoul || 0)
      : (stats.personalFoul || 0);
    const foulOutLimit = league?.sportType === 'basketball' ? (league?.settings?.foulOutLimit || 5) : Infinity;
    const hasFouledOut = totalFouls >= foulOutLimit;

    return {
      personalFoul: totalFouls,
      points: points || 0,
      assist: stats.assist || 0,
      hasFouledOut,
    };
  };

  const renderPlayerCard = (player, teamId) => {
    const isTeam1 = teamId === teams[0]?._id;
    const isChecked = (isTeam1 ? selectedPlayersTeam1 : selectedPlayersTeam2)?.includes(player?.playerId);
    const { personalFoul, hasFouledOut } = getPlayerStats(player?.playerId);

    return (
      <div
        key={player.playerId}
        className={`w-full h-[80px] bg-white border ${hasFouledOut ? 'border-red-500' : 'border-gray-200'} shadow-sm hover:shadow-md flex flex-col justify-between transition cursor-pointer rounded-md ${hasFouledOut ? 'opacity-50' : ''}`}
        onClick={() => !isSubstitutionMode && !hasFouledOut && setSelectedPlayer({ ...player, teamId })}
      >
        <div className="flex flex-row items-center gap-3 w-full px-2 p-2">
          {isSubstitutionMode ? (
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleSelectPlayer(teamId, player.playerId)}
              disabled={hasFouledOut}
              className="accent-blue-600 w-4 h-4 mt-1 rounded focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50"
              aria-label={`Toggle active status for ${player.player?.name || player.name || 'Unknown'}`}
            />
          ) : (
            <img
              src="https://placehold.co/40x40?text=👤"
              alt={`${player.player?.name || player.name || 'Unknown'} profile`}
              className="w-10 h-10 rounded-full object-cover bg-gray-200 flex-shrink-0"
            />
          )}

          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-sm text-gray-900 truncate">
              {getInitialAndLastName(player.player?.name || player.name) || 'Unknown'}
              {hasFouledOut && <span className="text-red-500 text-xs ml-2">(Fouled Out)</span>}
            </span>
            <div>
              <span className="text-xs text-gray-400">{getFirstCapitalLetter(player?.position) || 'N/A'}</span>
              <span className='text-gray-400'> | </span>
              <span className="text-xs text-gray-500">
                #{player?.jerseyNumber || 'N/A'}
              </span>
            </div>
            <div>
              <span className={`text-xs ${hasFouledOut ? 'text-red-500' : 'text-gray-500'}`}>
                Fouls: {personalFoul}/{league?.sportType === 'basketball' ? league?.settings?.foulOutLimit || 5 : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const team1Players = isSubstitutionMode
    ? teams?.[0]?.members?.filter(member => member?.isActive) || []
    : teams?.[0]?.members?.filter(member => activePlayersTeam1.includes(member.playerId) && member?.isActive).slice(0, startersCount) || [];
  const team2Players = isSubstitutionMode
    ? teams?.[1]?.members?.filter(member => member?.isActive) || []
    : teams?.[1]?.members?.filter(member => activePlayersTeam2.includes(member.playerId) && member?.isActive).slice(0, startersCount) || [];

  const activePlayers = teams?.flatMap(team => {
    const activePlayerIds = team?._id === teams[0]?._id ? activePlayersTeam1 : activePlayersTeam2;
    return team?.members
      ?.filter(member => member?.isActive && activePlayerIds?.includes(member?.playerId))
      ?.map(member => ({ ...member, teamId: team?._id }));
  });

  const handleStatSelect = (statType) => {
    setSelectedStatType(statType);
    const time = overrideMinutes && overrideSeconds
      ? parseInt(overrideMinutes, 10) * 60 + parseInt(overrideSeconds, 10)
      : remainingSeconds;
    const period = overridePeriod || clockState.period;
    const statsToRecord = [{
      player: selectedPlayer,
      statType,
      time,
      period,
    }];

    // Automatically add corresponding attempt stat for made shots
    if (statType === 'twoPointFGM') {
      statsToRecord.push({
        player: selectedPlayer,
        statType: 'twoPointFGA',
        time,
        period,
      });
    } else if (statType === 'threePointFGM') {
      statsToRecord.push({
        player: selectedPlayer,
        statType: 'threePointFGA',
        time,
        period,
      });
    } else if (statType === 'freeThrowM') {
      statsToRecord.push({
        player: selectedPlayer,
        statType: 'freeThrowA',
        time,
        period,
      });
    }

    if (['twoPointFGA', 'threePointFGA', 'freeThrowA'].includes(statType)) {
      setModalStep('followUpRebound');
    } else if (['twoPointFGM', 'threePointFGM'].includes(statType)) {
      setModalStep('followUpAssist');
    } else if (['offensiveRebound', 'defensiveRebound', 'assist'].includes(statType)) {
      setModalStep('followUpShot');
    } else if (statType === 'steal') {
      setModalStep('followUpTurnover');
    } else if (statType === 'turnover') {
      setModalStep('followUpSteal');
    } else if (['personalFoul', 'drawnFoul'].includes(statType)) {
      setModalStep('followUpFoul');
    } else if (['block', 'blockedShotAttempt'].includes(statType)) {
      setModalStep('followUpBlock');
    } else {
      handlePlayerClick(statsToRecord);
      resetModal();
    }
  };

  const handleFollowUp = (followUpData) => {
    const statsToRecord = [{
      player: selectedPlayer,
      statType: selectedStatType,
      time: overrideMinutes && overrideSeconds
        ? parseInt(overrideMinutes, 10) * 60 + parseInt(overrideSeconds, 10)
        : remainingSeconds,
      period: overridePeriod || clockState.period,
    }];

    // Add attempt stat for made shots
    if (selectedStatType === 'twoPointFGM') {
      statsToRecord.push({
        player: selectedPlayer,
        statType: 'twoPointFGA',
        time: overrideMinutes && overrideSeconds
          ? parseInt(overrideMinutes, 10) * 60 + parseInt(overrideSeconds, 10)
          : remainingSeconds,
        period: overridePeriod || clockState.period,
      });
    } else if (selectedStatType === 'threePointFGM') {
      statsToRecord.push({
        player: selectedPlayer,
        statType: 'threePointFGA',
        time: overrideMinutes && overrideSeconds
          ? parseInt(overrideMinutes, 10) * 60 + parseInt(overrideSeconds, 10)
          : remainingSeconds,
        period: overridePeriod || clockState.period,
      });
    } else if (selectedStatType === 'freeThrowM') {
      statsToRecord.push({
        player: selectedPlayer,
        statType: 'freeThrowA',
        time: overrideMinutes && overrideSeconds
          ? parseInt(overrideMinutes, 10) * 60 + parseInt(overrideSeconds, 10)
          : remainingSeconds,
        period: overridePeriod || clockState.period,
      });
    }

    if (followUpData && followUpData.playerId) {
      const followUpConfig = getFollowUpConfig(selectedStatType, selectedPlayer, activePlayers);
      const followUpPlayer = activePlayers.find(p => p.playerId === followUpData.playerId);
      if (followUpPlayer) {
        let followUpStatType;
        if (followUpConfig?.extra) {
          followUpStatType = followUpConfig.extra;
        } else if (['twoPointFGA', 'threePointFGA', 'freeThrowA'].includes(selectedStatType)) {
          followUpStatType = followUpPlayer.teamId === selectedPlayer.teamId ? 'offensiveRebound' : 'defensiveRebound';
        } else {
          followUpStatType = 'assist';
        }
        statsToRecord.push({
          player: followUpPlayer,
          statType: followUpStatType,
          time: overrideMinutes && overrideSeconds
            ? parseInt(overrideMinutes, 10) * 60 + parseInt(overrideSeconds, 10)
            : remainingSeconds,
          period: overridePeriod || clockState.period,
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

  function getFollowUpConfig(statType, selectedPlayer, activePlayers) {
    if (!selectedPlayer || !activePlayers) {
      console.error('Missing selectedPlayer or activePlayers');
      return null;
    }

    switch (statType) {
      case 'twoPointFGA':
      case 'threePointFGA':
      case 'freeThrowA':
        return {
          question: `Who got the rebound after ${selectedPlayer.name}'s shot attempt?`,
          players: activePlayers,
          allowNone: true,
        };
      case 'twoPointFGM':
      case 'threePointFGM':
        return {
          question: `Who assisted on ${selectedPlayer.name}'s made shot?`,
          players: activePlayers.filter(p => p.teamId === selectedPlayer.teamId && p.playerId !== selectedPlayer.playerId),
          allowNone: true,
        };
      case 'offensiveRebound':
        return {
          question: `Who shot the ball for ${selectedPlayer.name}'s offensive rebound?`,
          players: activePlayers.filter(p => p.teamId === selectedPlayer.teamId && p.playerId !== selectedPlayer.playerId),
          allowNone: false,
          extra: 'twoPointFGA',
        };
      case 'assist':
        return {
          question: `Who shot the ball for ${selectedPlayer.name}'s assist?`,
          players: activePlayers.filter(p => p.teamId === selectedPlayer.teamId && p.playerId !== selectedPlayer.playerId),
          allowNone: false,
          extra: 'twoPointFGM',
        };
      case 'defensiveRebound':
        return {
          question: `Who shot the ball for ${selectedPlayer.name}'s defensive rebound?`,
          players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
          allowNone: false,
          extra: 'twoPointFGA',
        };
      case 'personalFoul':
        return {
          question: `Who was fouled by ${selectedPlayer.name}?`,
          players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
          allowNone: false,
        };
      case 'drawnFoul':
        return {
          question: `Who fouled ${selectedPlayer.name}?`,
          players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
          allowNone: false,
          extra: 'personalFoul', // Award personalFoul to the opposing player
        };
      case 'steal':
        return {
          question: `Who turned over the ball for ${selectedPlayer.name}'s steal?`,
          players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
          allowNone: false,
          extra: 'turnover',
        };
      case 'turnover':
        return {
          question: `Who stole the ball from ${selectedPlayer.name}'s turnover?`,
          players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
          allowNone: false,
          extra: 'steal',
        };
      case 'block':
        return {
          question: `Who was blocked by ${selectedPlayer.name}?`,
          players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
          allowNone: false,
          extra: 'blockedShotAttempt',
        };
      case 'blockedShotAttempt':
        return {
          question: `Who blocked ${selectedPlayer.name}'s shot?`,
          players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
          allowNone: false,
          extra: 'block',
        };
      default:
        return null;
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 w-full gap-2 sm:gap-6 pt-0">
      <div className="flex flex-col gap-2 w-full">
        <h2 className="text-lg font-bold text-center">
          {isSubstitutionMode && `(${selectedPlayersTeam1?.length}/${startersCount})`}
          {isSubstitutionMode && isLeagueAdmin && (
            <button
              onClick={() => {
                onOpenRingerModal();
              }}
              className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              aria-label="Add ringer player to Team 1"
            >
              Add Ringer
            </button>
          )}
        </h2>
        {team1Players?.length > 0 ? (
          team1Players.map(player => renderPlayerCard(player, teams[0]?._id))
        ) : (
          <div className="text-center text-gray-500">No active players</div>
        )}
      </div>
      <div className="flex flex-col gap-2 w-full">
        <h2 className="text-lg font-bold text-center">
          {isSubstitutionMode && `(${selectedPlayersTeam2?.length}/${startersCount})`}
          {isSubstitutionMode && isLeagueAdmin && (
            <button
              onClick={() => {
                onOpenRingerModal();
              }}
              className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              aria-label="Add ringer player to Team 2"
            >
              Add Ringer
            </button>
          )}
        </h2>
        {team2Players?.length > 0 ? (
          team2Players.map(player => renderPlayerCard(player, teams[1]?._id))
        ) : (
          <div className="text-center text-gray-500">No active players</div>
        )}
      </div>
      <StatModal
        isOpen={!!selectedPlayer && !isSubstitutionMode}
        statTypes={league?.settings?.statTypes || []}
        modalStep={modalStep}
        setModalStep={setModalStep}
        selectedPlayer={selectedPlayer}
        selectedStatType={selectedStatType}
        activePlayers={activePlayers}
        handleStatSelect={handleStatSelect}
        handleFollowUp={handleFollowUp}
        resetModal={resetModal}
        statDisplayMap={statDisplayMap}
        getInitialAndLastName={getInitialAndLastName}
        overrideMinutes={overrideMinutes}
        setOverrideMinutes={setOverrideMinutes}
        overrideSeconds={overrideSeconds}
        setOverrideSeconds={setOverrideSeconds}
        overridePeriod={overridePeriod}
        setOverridePeriod={setOverridePeriod}
        getPeriodOptions={getPeriodOptions}
        getFollowUpConfig={getFollowUpConfig}
      />
      <AddRingerModal
        isOpen={isRingerModalOpen}
        onClose={onCloseRingerModal}
        teams={teams}
        leagueId={league?._id}
        onRingerAdded={onRingerAdded}
        userToken={userToken}
        shouldCloseOnOverlayClick={true}
        contentLabel="Add Ringer Player Modal"
      />
    </div>
  );
}
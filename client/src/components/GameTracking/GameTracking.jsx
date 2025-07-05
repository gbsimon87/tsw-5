import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { startingNumberOfPlayersBySport } from '../../utils/startingNumberOfPlayersBySport';
import { toast } from 'react-toastify';
import ScoreBoard from './ScoreBoard';
import BoxScore from './BoxScore';
import PlayerSelection from './PlayerSelection';
import ScreenNavigation from './ScreenNavigation';

export default function GameTracking() {
  const { leagueId, gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [screen, setScreen] = useState('rosters');
  const [step, setStep] = useState('rosters');
  const [league, setLeague] = useState(null);
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [formData, setFormData] = useState({ score: { team1: 0, team2: 0 }, gameMVP: '', playerStats: {} });
  const [lastChange, setLastChange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boxScoreTab, setBoxScoreTab] = useState(1);
  const [activePlayersTeam1, setActivePlayersTeam1] = useState([]);
  const [activePlayersTeam2, setActivePlayersTeam2] = useState([]);
  const [selectedPlayersTeam1, setSelectedPlayersTeam1] = useState([]);
  const [selectedPlayersTeam2, setSelectedPlayersTeam2] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [gameResponse, leagueResponse] = await Promise.all([
          axios.get(`/api/games/${gameId}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`/api/leagues/${leagueId}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        const gameData = gameResponse.data;
        const leagueData = leagueResponse.data;

        if (!gameData || !leagueData) {
          throw new Error('Game or league data not found');
        }

        setGame(gameData);
        setLeague(leagueData);

        const startersCount = startingNumberOfPlayersBySport[leagueData?.sportType] || 5;
        const team1Roster = gameData.teams[0]?.members
          .filter(member => member.isActive)
          .slice(0, startersCount) || [];
        const team2Roster = gameData.teams[1]?.members
          .filter(member => member.isActive)
          .slice(0, startersCount) || [];
        const team1Active = team1Roster.map(r => r.playerId);
        const team2Active = team2Roster.map(r => r.playerId);
        setActivePlayersTeam1(team1Active);
        setActivePlayersTeam2(team2Active);
        setSelectedPlayersTeam1(team1Active);
        setSelectedPlayersTeam2(team2Active);

        setFormData({
          score: gameData.teamScores || { team1: 0, team2: 0 },
          gameMVP: gameData.gameMVP?.playerId || '',
          playerStats: gameData.playerStats?.reduce(
            (acc, stat) => ({
              ...acc,
              [stat.playerId]: stat.stats || {},
            }),
            {}
          ) || {},
        });

        setLoading(false);
      } catch (err) {
        console.error('Fetch data error:', err);
        toast.error(err.message || 'Failed to fetch data', { toastId: 'fetch-error' });
        setLoading(false);
      }
    };
    fetchData();
  }, [gameId, leagueId, user.token]);

  const boxScoreTabLabels = [
    game?.teams[0]?.name || 'Team 1',
    'All',
    game?.teams[1]?.name || 'Team 2',
  ];

  const filteredPlayers = useCallback(() => {
    let players = [];
    if (boxScoreTab === 0) {
      players = game?.playerStats?.filter(p => p.teamId === game?.teams[0]?._id) || [];
    } else if (boxScoreTab === 2) {
      players = game?.playerStats?.filter(p => p.teamId === game?.teams[1]?._id) || [];
    } else {
      players = game?.playerStats || [];
    }
    return players.slice().sort((a, b) => a.playerName.localeCompare(b.playerName));
  }, [game, boxScoreTab]);

  const handleStatIncrement = (statType) => {
    if (!activePlayerId) return;
    const change = { playerId: activePlayerId, statType, value: 1 };
    setLastChange(change);
    setFormData(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        [activePlayerId]: {
          ...prev.playerStats[activePlayerId],
          [statType]: (prev.playerStats[activePlayerId]?.[statType] || 0) + 1,
        },
      },
    }));
  };

  const handleUndo = () => {
    if (lastChange) {
      setFormData(prev => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          [lastChange.playerId]: {
            ...prev.playerStats[lastChange.playerId],
            [lastChange.statType]: Math.max(0, (prev.playerStats[lastChange.playerId]?.[lastChange.statType] || 0) - 1),
          },
        },
      }));
      setLastChange(null);
    }
  };

  const handleSave = async () => {
    try {
      await axios.patch(
        `/api/games/${gameId}`,
        {
          score: formData.score,
          gameMVP: formData.gameMVP || null,
          playerStats: Object.entries(formData.playerStats).map(([playerId, stats]) => ({ playerId, stats })),
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Game data saved successfully', { toastId: 'save-success' });
    } catch (err) {
      toast.error('Failed to update game', { toastId: 'save-error' });
    }
  };

  const handleScreenChange = useCallback((newScreen) => {
    if (screen === 'substitutions' && newScreen === 'rosters') {
      const startersCount = startingNumberOfPlayersBySport[league?.sportType] || 5;
      if (selectedPlayersTeam1.length > startersCount) {
        toast.error(`You can select up to ${startersCount} players for ${game?.teams[0]?.name || 'Team 1'}`, {
          toastId: 'team1-selection-error',
        });
        return;
      }
      if (selectedPlayersTeam2.length > startersCount) {
        toast.error(`You can select up to ${startersCount} players for ${game?.teams[1]?.name || 'Team 2'}`, {
          toastId: 'team2-selection-error',
        });
        return;
      }
      setActivePlayersTeam1(selectedPlayersTeam1);
      setActivePlayersTeam2(selectedPlayersTeam2);
      toast.success('Substitutions confirmed', { toastId: 'substitution-success' });
    }
    setScreen(newScreen);
    if (newScreen === 'rosters') {
      setStep('rosters');
    }
  }, [screen, selectedPlayersTeam1, selectedPlayersTeam2, league, game]);

  const startersCount = startingNumberOfPlayersBySport[league?.sportType] || 5;

  const renderScreenView = useCallback(() => {
    switch (screen) {
      case 'rosters':
      case 'substitutions':
        return (
          <PlayerSelection
            teams={game?.teams}
            activePlayersTeam1={activePlayersTeam1}
            activePlayersTeam2={activePlayersTeam2}
            selectedPlayersTeam1={selectedPlayersTeam1}
            selectedPlayersTeam2={selectedPlayersTeam2}
            startersCount={startersCount}
            handlePlayerClick={player => setActivePlayerId(player.playerId)}
            handleKeyDown={(e, callback) => {
              if (e.key === 'Enter' || e.key === ' ') callback();
            }}
            hasGameStarted={game?.isCompleted !== true}
            remainingSeconds={game?.gameDuration || 0}
            isSubstitutionMode={screen === 'substitutions'}
            setSelectedPlayersTeam1={setSelectedPlayersTeam1}
            setSelectedPlayersTeam2={setSelectedPlayersTeam2}
          />
        );
      case 'boxScore':
        return (
          <BoxScore
            game={game}
            league={league}
            tab={boxScoreTab}
            setTab={setBoxScoreTab}
            boxScoreTabLabels={boxScoreTabLabels}
            filteredPlayers={filteredPlayers()}
          />
        );
      default:
        return null;
    }
  }, [screen, game, league, boxScoreTab, filteredPlayers, startersCount, activePlayersTeam1, activePlayersTeam2, selectedPlayersTeam1, selectedPlayersTeam2]);

  if (loading) return <div>Loading Game Tracking...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <ScoreBoard teamScores={game?.teamScores} />
      <div className="bg-white h-[75vh] overflow-y-auto px-2">{renderScreenView()}</div>
      <ScreenNavigation
        activeScreen={screen}
        onScreenChange={handleScreenChange}
      />
    </div>
  );
}
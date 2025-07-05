import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { startingNumberOfPlayersBySport } from '../../utils/startingNumberOfPlayersBySport';
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
  const [rosters, setRosters] = useState([]);
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [formData, setFormData] = useState({ score: { team1: 0, team2: 0 }, gameMVP: '', playerStats: {} });
  const [lastChange, setLastChange] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boxScoreTab, setBoxScoreTab] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

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

        const rosters = gameData.teams.flatMap(team =>
          team.members.map(member => ({
            playerId: member.playerId,
            name: member.player?.name || 'Unknown',
            jerseyNumber: member.player?.jerseyNumber || null,
            position: member.player?.position || null,
            teamId: team._id,
            teamName: team.name,
          }))
        );
        setRosters(rosters);

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
        setError(err.message || 'Failed to fetch data');
        setLoading(false);
      }
    };
    fetchData();
  }, [gameId, leagueId, user.token]);

  // Tab labels for BoxScore
  const boxScoreTabLabels = [
    game?.teams[0]?.name || 'Team 1',
    'All',
    game?.teams[1]?.name || 'Team 2',
  ];

  // Filter and sort player stats for BoxScore
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
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setError(null);
      setLastChange(null);
    } catch (err) {
      setError('Failed to update game');
    }
  };

  const handleScreenChange = useCallback((newScreen) => {
    setScreen(newScreen);
    if (newScreen === 'rosters') {
      setStep('rosters');
    }
  }, []);

  const startersCount = startingNumberOfPlayersBySport[league?.sportType] || 5;

  const renderScreenView = useCallback(() => {
    switch (screen) {
      case 'rosters':
        return (
          <PlayerSelection
            teams={game?.teams}
            startersCount={startersCount}
            handlePlayerClick={player => setActivePlayerId(player.playerId)}
            handleKeyDown={(e, callback) => {
              if (e.key === 'Enter' || e.key === ' ') callback();
            }}
            hasGameStarted={game?.isCompleted !== true}
            remainingSeconds={game?.gameDuration || 0}
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
            filteredPlayers={filteredPlayers()} // Pass the result of the function
          />
        );
      default:
        return null;
    }
  }, [screen, game, league, boxScoreTab, filteredPlayers, startersCount]);

  if (loading) return <div>Loading Game Tracking...</div>;
  if (error) return <div>{error}</div>;

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
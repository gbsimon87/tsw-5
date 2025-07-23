import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function CompletedGamePage() {
  const { leagueId, gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(1); // 0: Team 1, 1: All, 2: Team 2

  useEffect(() => {
    if (!user?.token) {
      toast.error('Please log in to view game details', { toastId: 'auth-error' });
      navigate('/login');
      return;
    }

    const fetchGame = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/games/${gameId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const gameData = response.data;

        if (!gameData.isCompleted) {
          toast.error('This game is not completed', { toastId: 'game-not-completed' });
          navigate(`/leagues/${leagueId}/games/${gameId}/tracking`);
          return;
        }

        if (gameData.teams.length !== 2) {
          throw new Error('Invalid game data: Exactly two teams required');
        }

        setGame(gameData);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch game data');
        toast.error(err.response?.data?.error || 'Failed to fetch game data', {
          toastId: 'fetch-game-error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId, leagueId, user?.token, navigate]);

  const calculateTeamStats = (teamId) => {
    const teamPlayers = game?.playerStats?.filter(
      (stat) => stat.teamId.toString() === teamId.toString()
    ) || [];
    const stats = {
      points: 0,
      rebounds: 0,
      assists: 0,
      turnovers: 0,
    };

    teamPlayers.forEach((player) => {
      const playerStats = player.stats || {};
      stats.points +=
        (playerStats.twoPointFGM || 0) * 2 +
        (playerStats.threePointFGM || 0) * 3 +
        (playerStats.freeThrowM || 0);
      stats.rebounds +=
        (playerStats.offensiveRebound || 0) + (playerStats.defensiveRebound || 0);
      stats.assists += playerStats.assist || 0;
      stats.turnovers += playerStats.turnover || 0;
    });

    return stats;
  };

  const getFilteredPlayers = () => {
    if (activeTab === 0) {
      return game?.playerStats?.filter(
        (p) => p.teamId.toString() === game?.teams[0]?._id.toString()
      ) || [];
    } else if (activeTab === 2) {
      return game?.playerStats?.filter(
        (p) => p.teamId.toString() === game?.teams[1]?._id.toString()
      ) || [];
    }
    return game?.playerStats || [];
  };

  const team1Stats = game?.teams[0]?._id ? calculateTeamStats(game.teams[0]._id) : {};
  const team2Stats = game?.teams[1]?._id ? calculateTeamStats(game.teams[1]._id) : {};
  const winnerId =
    game?.teamScores[0]?.score > game?.teamScores[1]?.score
      ? game?.teams[0]?._id
      : game?.teamScores[0]?.score < game?.teamScores[1]?.score
      ? game?.teams[1]?._id
      : null;

  if (loading) {
    return <div className="text-center py-10">Loading game details...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (!game) {
    return <div className="text-center py-10">No game data available</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <div className="flex flex-col items-center">
            {game.teams[0].logo ? (
              <img
                src={game.teams[0].logo}
                alt={`${game.teams[0].name} logo`}
                className="w-16 h-16 object-cover rounded-full"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                {game.teams[0].name.charAt(0)}
              </div>
            )}
            <h2 className="text-xl font-bold mt-2">{game.teams[0].name}</h2>
            {/* {winnerId === game.teams[0]._id && (
              <span className="text-sm text-green-600 font-semibold">Winner</span>
            )} */}
          </div>
          <div className="text-2xl font-bold">
            {game.teamScores[0]?.score || 0} - {game.teamScores[1]?.score || 0}
          </div>
          <div className="flex flex-col items-center">
            {game.teams[1].logo ? (
              <img
                src={game.teams[1].logo}
                alt={`${game.teams[1].name} logo`}
                className="w-16 h-16 object-cover rounded-full"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                {game.teams[1].name.charAt(0)}
              </div>
            )}
            <h2 className="text-xl font-bold mt-2">{game.teams[1].name}</h2>
            {/* {winnerId === game.teams[1]._id && (
              <span className="text-sm text-green-600 font-semibold">Winner</span>
            )} */}
          </div>
        </div>
      </div>

      {/* Game Details */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold mb-2">Game Details</h3>
        <p>
          <span className="font-semibold">League:</span> {game.league?.name || 'Unknown'}
        </p>
        <p>
          <span className="font-semibold">Date:</span>{' '}
          {new Date(game.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <p>
          <span className="font-semibold">Time:</span>{' '}
          {new Date(game.date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
        <p>
          <span className="font-semibold">Venue:</span> {game.venue || 'Not specified'}
        </p>
      </div>

      {/* Team Stats Comparison */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold mb-4">Team Stats Comparison</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left"></th>
              <th className="text-center">{game.teams[0].name}</th>
              <th className="text-center">{game.teams[1].name}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 font-semibold">Points</td>
              <td className="text-center">{team1Stats.points || 0}</td>
              <td className="text-center">{team2Stats.points || 0}</td>
            </tr>
            <tr>
              <td className="py-2 font-semibold">Rebounds</td>
              <td className="text-center">{team1Stats.rebounds || 0}</td>
              <td className="text-center">{team2Stats.rebounds || 0}</td>
            </tr>
            <tr>
              <td className="py-2 font-semibold">Assists</td>
              <td className="text-center">{team1Stats.assists || 0}</td>
              <td className="text-center">{team2Stats.assists || 0}</td>
            </tr>
            <tr>
              <td className="py-2 font-semibold">Turnovers</td>
              <td className="text-center">{team1Stats.turnovers || 0}</td>
              <td className="text-center">{team2Stats.turnovers || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Box Score */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold mb-4">Box Score</h3>
        <div className="flex border-b mb-4">
          {['Team 1', 'All', 'Team 2'].map((label, index) => (
            <button
              key={index}
              className={`px-4 py-2 font-semibold ${
                activeTab === index
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
              onClick={() => setActiveTab(index)}
            >
              {index === 0 ? game.teams[0].name : index === 2 ? game.teams[1].name : 'All'}
            </button>
          ))}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2">Player</th>
              <th className="text-center">Points</th>
              <th className="text-center">Rebounds</th>
              <th className="text-center">Assists</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredPlayers().length > 0 ? (
              getFilteredPlayers()
                .sort((a, b) => a.playerName.localeCompare(b.playerName))
                .map((player) => {
                  const stats = player.stats || {};
                  const points =
                    (stats.twoPointFGM || 0) * 2 +
                    (stats.threePointFGM || 0) * 3 +
                    (stats.freeThrowM || 0);
                  const rebounds =
                    (stats.offensiveRebound || 0) + (stats.defensiveRebound || 0);
                  return (
                    <tr key={player.playerId}>
                      <td className="py-2">{player.playerName || 'Unknown'}</td>
                      <td className="text-center">{points}</td>
                      <td className="text-center">{rebounds}</td>
                      <td className="text-center">{stats.assist || 0}</td>
                    </tr>
                  );
                })
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  No player stats available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Game Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-bold mb-2">Game Summary</h3>
        <p className="text-gray-700">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
          nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </div>
    </div>
  );
}
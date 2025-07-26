import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import { toast } from 'react-toastify';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid'
import { useAuth } from '../../context/AuthContext';

export default function CompletedGamePage() {
  const { leagueId, gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const sortedPlayByPlay = game?.playByPlay?.length > 0 ? [...game.playByPlay].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) : [];

  const team1Stats = game?.teams[0]?._id ? calculateTeamStats(game.teams[0]._id) : {};
  const team2Stats = game?.teams[1]?._id ? calculateTeamStats(game.teams[1]._id) : {};

  if (loading) {
    return (
      <div className="flex flex-col gap-4 container mx-auto p-4 pt-6 md:px-6 max-w-5xl text-dark bg-white min-h-[var(--page-height)] py-4 px-4 sm:px-6 lg:px-8" role="status" aria-live="assertive">
        {/* Header Skeleton */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-100 mb-8" role="region" aria-label="Game Header">
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            <div className="flex flex-col items-center">
              <Skeleton circle={true} width={64} height={64} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
              <Skeleton height={24} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mt-2" aria-hidden="true" />
            </div>
            <Skeleton height={32} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
            <div className="flex flex-col items-center">
              <Skeleton circle={true} width={64} height={64} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
              <Skeleton height={24} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mt-2" aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* Game Details Skeleton */}
        <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8" role="region" aria-label="Game Details">
          <Skeleton height={28} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-4" aria-hidden="true" />
          <Skeleton height={16} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
          <Skeleton height={16} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
          <Skeleton height={16} width={180} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
        </section>

        {/* Team Stats Skeleton */}
        <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8" role="region" aria-label="Team Stats Comparison">
          <Skeleton height={28} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-4" aria-hidden="true" />
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b border-gray-200 px-3 py-2">
                  <Skeleton height={16} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                </th>
                <th className="border-b border-gray-200 px-3 py-2">
                  <Skeleton height={16} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                </th>
                <th className="border-b border-gray-200 px-3 py-2">
                  <Skeleton height={16} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...Array(4)].map((_, index) => (
                <tr key={`stats-skeleton-${index}`} className={index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border-b border-gray-100 px-3 py-2">
                    <Skeleton height={16} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2">
                    <Skeleton height={16} width={40} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2">
                    <Skeleton height={16} width={40} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Box Score Skeleton */}
        <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8" role="region" aria-label="Box Score">
          <Skeleton height={28} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-4" aria-hidden="true" />
          <div className="flex border-b mb-4">
            <Skeleton height={32} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mr-4" aria-hidden="true" />
            <Skeleton height={32} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mr-4" aria-hidden="true" />
            <Skeleton height={32} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b border-gray-200 px-3 py-2">
                  <Skeleton height={16} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                </th>
                <th className="border-b border-gray-200 px-3 py-2">
                  <Skeleton height={16} width={60} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                </th>
                <th className="border-b border-gray-200 px-3 py-2">
                  <Skeleton height={16} width={60} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                </th>
                <th className="border-b border-gray-200 px-3 py-2">
                  <Skeleton height={16} width={60} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...Array(3)].map((_, index) => (
                <tr key={`boxscore-skeleton-${index}`} className={index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border-b border-gray-100 px-3 py-2">
                    <Skeleton height={16} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2">
                    <Skeleton height={16} width={40} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2">
                    <Skeleton height={16} width={40} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2">
                    <Skeleton height={16} width={40} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Game Summary Skeleton */}
        <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100" role="region" aria-label="Game Summary">
          <Skeleton height={28} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-4" aria-hidden="true" />
          <Skeleton height={16} width="90%" baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
          <Skeleton height={16} width="80%" baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
        </section>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="max-w-5xl mx-auto mt-4 bg-white rounded-xl p-4" role="alert" aria-live="assertive">
        <p className="text-red-600 text-sm">{error || 'No game data available'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-dark min-h-[var(--page-height)] py-4 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="container mx-auto max-w-5xl mb-8">

        {/* Header Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-100 mb-8" role="region" aria-label="Game Header">
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            <div className="flex flex-1 flex-col items-center">
              {game?.teams?.[0]?.logo ? (
                <img
                  src={game.teams[0].logo}
                  alt={`${game.teams[0].name || 'Unknown Team'} Logo`}
                  className="object-cover w-16 h-16 rounded-full border border-gray-200"
                />
              ) : (
                <div
                  className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 border border-gray-200"
                  aria-hidden="true"
                >
                  {game?.teams?.[0]?.name?.charAt(0) || '?'}
                </div>
              )}
              <h2 className="text-xl md:text-2xl font-bold text-white mt-2 break-words text-center">
                {game?.teams?.[0]?.name || 'Unknown Team'}
              </h2>
            </div>
            <div className="flex-1 text-2xl md:text-3xl font-extrabold text-white text-center">
              {game?.teamScores?.[0]?.score ?? 0} - {game?.teamScores?.[1]?.score ?? 0}
            </div>
            <div className="flex flex-1 flex-col items-center">
              {game?.teams?.[1]?.logo ? (
                <img
                  src={game.teams[1].logo}
                  alt={`${game.teams[1].name || 'Unknown Team'} Logo`}
                  className="object-cover w-16 h-16 rounded-full border border-gray-200"
                />
              ) : (
                <div
                  className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 border border-gray-200"
                  aria-hidden="true"
                >
                  {game?.teams?.[1]?.name?.charAt(0) || '?'}
                </div>
              )}
              <h2 className="text-xl md:text-2xl font-bold text-white mt-2 break-words text-center">
                {game?.teams?.[1]?.name || 'Unknown Team'}
              </h2>
            </div>
          </div>
        </section>
      </div>

      {/* Game Details */}
      <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8" role="region" aria-label="Game Details">
        <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-4 break-words">Game Details</h2>
        <dl className="space-y-2">
          <div className="flex">
            <dt className="font-semibold text-gray-700 w-24">Date:</dt>
            <dd className="text-gray-600">
              {game?.date
                ? new Date(game.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
                : 'Not specified'}
            </dd>
          </div>
          <div className="flex">
            <dt className="font-semibold text-gray-700 w-24">Time:</dt>
            <dd className="text-gray-600">
              {game?.date
                ? new Date(game.date).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })
                : 'Not specified'}
            </dd>
          </div>
          <div className="flex">
            <dt className="font-semibold text-gray-700 w-24">Venue:</dt>
            <dd className="text-gray-600">{game?.venue || 'Not specified'}</dd>
          </div>
        </dl>
      </section>

      {/* Game Summary */}
      <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8" role="region" aria-label="Game Summary">
        <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-4 break-words">Game Summary</h2>
        <p className="text-gray-600">
          A detailed game summary is not available at this time. Please review the play-by-play data for key moments.
        </p>
      </section>

      {/* Team Stats Comparison */}
      <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8" role="region" aria-label="Team Stats Comparison">
        <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-4 break-words">Team Stats Comparison</h2>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold"></th>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">
                {game?.teams?.[0]?.name || 'Team 1'}
              </th>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">
                {game?.teams?.[1]?.name || 'Team 2'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="bg-white">
              <td className="border-b border-gray-100 px-3 py-2 font-semibold text-gray-900">Points</td>
              <td className="border-b border-gray-100 px-3 py-2 text-center text-gray-900">
                {team1Stats?.points ?? 0}
              </td>
              <td className="border-b border-gray-100 px-3 py-2 text-center text-gray-900">
                {team2Stats?.points ?? 0}
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border-b border-gray-100 px-3 py-2 font-semibold text-gray-900">Rebounds</td>
              <td className="border-b border-gray-100 px-3 py-2 text-center text-gray-900">
                {team1Stats?.rebounds ?? 0}
              </td>
              <td className="border-b border-gray-100 px-3 py-2 text-center text-gray-900">
                {team2Stats?.rebounds ?? 0}
              </td>
            </tr>
            <tr className="bg-white">
              <td className="border-b border-gray-100 px-3 py-2 font-semibold text-gray-900">Assists</td>
              <td className="border-b border-gray-100 px-3 py-2 text-center text-gray-900">
                {team1Stats?.assists ?? 0}
              </td>
              <td className="border-b border-gray-100 px-3 py-2 text-center text-gray-900">
                {team2Stats?.assists ?? 0}
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border-b border-gray-100 px-3 py-2 font-semibold text-gray-900">Turnovers</td>
              <td className="border-b border-gray-100 px-3 py-2 text-center text-gray-900">
                {team1Stats?.turnovers ?? 0}
              </td>
              <td className="border-b border-gray-100 px-3 py-2 text-center text-gray-900">
                {team2Stats?.turnovers ?? 0}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Box Score */}
      <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8" role="region" aria-label="Box Score">
        <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-4 break-words">Box Score</h2>
        <div className="flex border-b mb-4 justify-between" role="tablist" aria-label="Box Score Team Filter">
          {[
            game?.teams?.[0]?.name || 'Team 1',
            'All',
            game?.teams?.[1]?.name || 'Team 2',
          ].map((label, index) => (
            <button
              key={index}
              className={`px-4 py-2 font-semibold text-sm sm:text-base ${activeTab === index
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
                } focus:outline-none focus:ring-2 focus:ring-blue-600`}
              onClick={() => setActiveTab(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab(index);
                }
              }}
              role="tab"
              aria-selected={activeTab === index}
              aria-controls="box-score-table"
              tabIndex={activeTab === index ? 0 : -1}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto relative w-full" tabIndex={0} aria-label="Scrollable Box Score Table">
          <table className="min-w-full text-sm" id="box-score-table" role="grid">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold" scope="col">
                  Player
                </th>
                <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold" scope="col">
                  Points
                </th>
                <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold" scope="col">
                  Rebounds
                </th>
                <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold" scope="col">
                  Assists
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {getFilteredPlayers()?.length > 0 ? (
                getFilteredPlayers()
                  .sort((a, b) => (a?.playerName || '').localeCompare(b?.playerName || ''))
                  .map((player, index) => {
                    const stats = player?.stats || {};
                    const points =
                      ((stats?.twoPointFGM || 0) * 2 +
                        (stats?.threePointFGM || 0) * 3 +
                        (stats?.freeThrowM || 0)) ||
                      0;
                    const rebounds =
                      ((stats?.offensiveRebound || 0) + (stats?.defensiveRebound || 0)) || 0;
                    const isGreyRow = index % 2 !== 0;
                    return (
                      <tr
                        key={player?.playerId || `player-${index}`}
                        className={isGreyRow ? 'bg-gray-50' : 'bg-white'}
                      >
                        <td className="border-b border-gray-100 px-3 py-2 text-gray-900">
                          {player?.playerName || 'Unknown'}
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2 text-center text-gray-900">
                          {points}
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2 text-center text-gray-900">
                          {rebounds}
                        </td>
                        <td className="border-b border-gray-100 px-3 py-2 text-center text-gray-900">
                          {stats?.assist || 0}
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-4 text-gray-600"
                    role="alert"
                    aria-live="true"
                  >
                    No player stats available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Play-by-Play */}
      <section
        className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8"
        role="region"
        aria-label="Play-by-Play"
      >
        <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-4 break-words">
          Play-by-Play
        </h2>

        {game?.playByPlay?.length > 0 ? (
          <div>
            {/* ➜ Only addition: this wrapper */}
            <div className="w-full overflow-x-auto">
              <table
                className="overflow-x-auto relative w-full min-w-full text-sm"
                role="grid"
                id="play-by-play-table"
              >
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    {['Period', 'Time', 'Player', 'Action', 'Team'].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="border-b border-gray-300 px-4 py-2 text-left font-semibold uppercase tracking-wide text-xs"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {(isExpanded ? sortedPlayByPlay : sortedPlayByPlay.slice(-3)).map((play, index) => {
                    const team =
                      game?.teams?.find((t) => t?._id?.toString() === play?.team?.toString()) || {
                        name: 'Unknown Team',
                        logo: null,
                      };

                    const formattedTime = play?.time
                      ? `${Math.floor(play.time / 60).toString().padStart(2, '0')}:${(play.time % 60)
                        .toString()
                        .padStart(2, '0')}`
                      : 'N/A';

                    const statDisplay = play?.statType
                      ? play.statType
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase())
                        .replace('Fgm', 'Field Goal Made')
                        .replace('Fga', 'Field Goal Attempt')
                        .replace('M', 'Made')
                        .replace('A', 'Attempt')
                      : 'Unknown Action';

                    const isGreyRow = index % 2 !== 0;

                    return (
                      <tr
                        key={play?.timestamp || `play-${index}`}
                        className={isGreyRow ? 'bg-gray-50' : 'bg-white'}
                      >
                        <td className="px-4 py-2 text-gray-900">{play?.period || 'N/A'}</td>
                        <td className="px-4 py-2 text-center text-gray-900">{formattedTime}</td>
                        <td className="px-4 py-2 text-gray-900">{play?.playerName || 'Unknown'}</td>
                        <td className="px-4 py-2 text-gray-900">{statDisplay}</td>
                        <td className="px-4 py-2 text-gray-900">
                          <div className="flex items-center gap-2">
                            {team.logo ? (
                              <img
                                src={team.logo}
                                alt={`${team.name} Logo`}
                                className="w-6 h-6 rounded-full border border-gray-300 object-cover"
                                onError={(e) => (e.target.src = '/placeholder.png')}
                              />
                            ) : (
                              <div
                                className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 text-xs border border-gray-300"
                                aria-label={`${team.name} Logo`}
                              >
                                {team?.name?.charAt(0) || '?'}
                              </div>
                            )}
                            <span className="truncate max-w-[120px] text-sm">{team.name}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {sortedPlayByPlay?.length > 3 && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  role="button"
                  aria-expanded={isExpanded}
                  aria-controls="play-by-play-table"
                  aria-label={isExpanded ? 'Collapse play-by-play entries' : 'Expand play-by-play entries'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsExpanded(!isExpanded);
                    }
                  }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUpIcon className="w-5 h-5" aria-hidden="true" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
                      Show More
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600 text-left font-medium" role="alert" aria-live="polite">
            No play-by-play data available.
          </p>
        )}
      </section>

    </div>
  );
}
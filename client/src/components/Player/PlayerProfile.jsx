import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend } from 'chart.js';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

// console.log('[PlayerProfile] Chart.js controllers:', Object.keys(ChartJS.registry.controllers));

export default function PlayerProfile() {
  const { user } = useAuth();
  const { playerId, leagueId } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!user?.token || !playerId || !leagueId) {
        toast.error('Missing authentication or parameters', { toastId: 'player-profile-error' });
        setLoading(false);
        return;
      }

      try {
        console.log(`[PlayerProfile] Fetching player ID: ${playerId}, leagueId: ${leagueId}`);
        const response = await axios.get(`/api/players/${playerId}`, {
          params: { leagueId },
          headers: { Authorization: `Bearer ${user.token}` },
        });

        const playerData = response.data;
        if (!playerData) throw new Error('Player not found');

        setPlayer(playerData);
      } catch (error) {
        const errorMsg = error.response?.data?.error || 'Failed to fetch player data';
        toast.error(errorMsg, { toastId: 'fetch-player-error' });
        console.error(`[PlayerProfile] Error: ${errorMsg}`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerId, leagueId, user?.token]);

  // Calculate season stats with memoization
  const calculateSeasonStats = useMemo(() => {
    if (!player?.gameStats || player.gameStats.length === 0) {
      return { total: { points: 0, rebounds: 0, assists: 0 }, average: { points: 0, rebounds: 0, assists: 0 }, gameCount: 0 };
    }

    const stats = player.gameStats.reduce(
      (acc, game) => ({
        points: acc.points + (game.points || 0),
        rebounds: acc.rebounds + (game.rebounds || 0),
        assists: acc.assists + (game.assists || 0),
        gameCount: acc.gameCount + 1,
      }),
      { points: 0, rebounds: 0, assists: 0, gameCount: 0 }
    );

    return {
      total: { points: stats.points, rebounds: stats.rebounds, assists: stats.assists },
      average: {
        points: stats.gameCount ? (stats.points / stats.gameCount).toFixed(1) : 0,
        rebounds: stats.gameCount ? (stats.rebounds / stats.gameCount).toFixed(1) : 0,
        assists: stats.gameCount ? (stats.assists / stats.gameCount).toFixed(1) : 0,
      },
      gameCount: stats.gameCount,
    };
  }, [player?.gameStats]);

  // Sort game log
  const sortedGameStats = useMemo(() => {
    if (!player?.gameStats) return [];
    const sorted = [...player.gameStats];
    sorted.sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      if (sortConfig.key === 'date') {
        return direction * (new Date(a.date) - new Date(b.date));
      }
      if (sortConfig.key === 'result') {
        const aResult = (a.teamScores.find(ts => ts.team === player?.team._id)?.score || 0) > (a.teamScores.find(ts => ts.team !== player?.team._id)?.score || 0) ? 'W' : 'L';
        const bResult = (b.teamScores.find(ts => ts.team === player?.team._id)?.score || 0) > (b.teamScores.find(ts => ts.team !== player?.team._id)?.score || 0) ? 'W' : 'L';
        return direction * aResult.localeCompare(bResult);
      }
      return direction * ((a[sortConfig.key] || 0) - (b[sortConfig.key] || 0));
    });
    return sorted;
  }, [player?.gameStats, sortConfig, player?.team._id]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Chart data and options for points
  const chartData = useMemo(() => {
    if (!player?.gameStats || player.gameStats.length === 0) {
      console.log('[PlayerProfile] No gameStats available for chart');
      return null;
    }
    const labels = sortedGameStats.map(game => {
      const date = new Date(game.date);
      return date instanceof Date && !isNaN(date)
        ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Invalid Date';
    });
    const data = sortedGameStats.map(game => game.points || 0);
    console.log('[PlayerProfile] Chart data:', { labels, data });
    return {
      labels,
      datasets: [{
        label: 'Points per Game',
        data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.4,
      }],
    };
  }, [sortedGameStats]);

  console.log('[PlayerProfile] chartData:', chartData);


  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        type: 'category',
        title: { display: true, text: 'Game Date' },
      },
      y: {
        type: 'linear',
        beginAtZero: true,
        title: { display: true, text: 'Points' },
      },
    },
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4" role="region" aria-label="Player Profile">
        <Skeleton height={40} width={200} className="mb-4" />
        <section className="bg-white border rounded-md shadow-sm p-4 mb-4">
          <Skeleton height={24} width={150} className="mb-2" />
          <Skeleton count={2} height={20} />
        </section>
        <section className="bg-white border rounded-md shadow-sm p-4 mb-4">
          <Skeleton height={24} width={150} className="mb-2" />
          <Skeleton count={3} height={20} />
        </section>
        <div className="flex flex-col lg:flex-row gap-4">
          <section className="bg-white border rounded-md shadow-sm p-4 mb-4 flex-1">
            <Skeleton height={24} width={150} className="mb-2" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton count={3} height={20} />
            </div>
          </section>
          <section className="bg-white border rounded-md shadow-sm p-4 mb-4 flex-1">
            <Skeleton height={24} width={150} className="mb-2" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton count={3} height={20} />
            </div>
          </section>
        </div>
        <section className="bg-white border rounded-md shadow-sm p-4 mb-4">
          <Skeleton height={24} width={150} className="mb-2" />
          <Skeleton height={200} />
        </section>
        <section className="bg-white border rounded-md shadow-sm p-4">
          <Skeleton height={24} width={150} className="mb-2" />
          <div className="overflow-x-auto">
            <Skeleton count={5} height={40} className="min-w-[600px]" />
          </div>
        </section>
      </div>
    );
  }

  if (!player) {
    return <div className="text-center text-red-500" role="alert">Player not found</div>;
  }

  const stats = calculateSeasonStats;
  const team = player.team || { _id: '', name: 'No Team', league: { _id: '', name: 'Unknown League' }, season: 'Unknown Season' };

  return (
    <div className="w-full max-w-4xl mx-auto p-4" role="region" aria-label="Player Profile">
      <section
        className="bg-gradient-to-r from-blue-100 to-gray-100 border rounded-lg shadow-lg p-6 mb-6"
        role="region"
        aria-label="Player Card"
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900">{player.name}</h2>
            <p className="text-lg font-semibold text-gray-700">
              #{player.jerseyNumber ?? 'N/A'} | {player.position ?? 'N/A'}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-gray-700">
              Team:{' '}
              <Link
                to={`/league/${team.league._id}/team/${team._id}`}
                className="text-blue-600 hover:underline"
                aria-label={`View team ${team.name}`}
              >
                {team.name}
              </Link>
            </p>
            <p className="text-gray-700">
              League:{' '}
              <Link
                to={`/leagues/public/${team.league._id}`}
                className="text-blue-600 hover:underline"
                aria-label={`View league ${team.league.name}`}
              >
                {team.league.name}
              </Link>
            </p>
            <p className="text-gray-700">Season: {team.season}</p>
          </div>
        </div>
      </section>
      <section className="bg-white border rounded-md shadow-sm p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2">Team Information</h3>
        <p>
          League:{' '}
          <Link
            to={`/leagues/public/${team.league._id}`}
            className="text-blue-600 hover:underline"
            aria-label={`View league ${team.league.name}`}
          >
            {team.league.name}
          </Link>
        </p>
        <p>
          Team:{' '}
          <Link
            to={`/league/${team.league._id}/team/${team._id}`}
            className="text-blue-600 hover:underline"
            aria-label={`View team ${team.name}`}
          >
            {team.name}
          </Link>
        </p>
        <p>Season: {team.season}</p>
      </section>
      <div className="flex flex-col lg:flex-row gap-4">
        <section className="bg-white border rounded-md shadow-sm p-4 mb-4 flex-1">
          <h3 className="text-lg font-semibold mb-2">Season Totals ({stats.gameCount} Games)</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="font-medium text-gray-700">Points</p>
              <p className="text-gray-900">{stats.total.points}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Rebounds</p>
              <p className="text-gray-900">{stats.total.rebounds}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Assists</p>
              <p className="text-gray-900">{stats.total.assists}</p>
            </div>
          </div>
        </section>
        <section className="bg-white border rounded-md shadow-sm p-4 mb-4 flex-1">
          <h3 className="text-lg font-semibold mb-2">Season Averages ({stats.gameCount} Games)</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="font-medium text-gray-700">Points</p>
              <p className="text-gray-900">{stats.average.points}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Rebounds</p>
              <p className="text-gray-900">{stats.average.rebounds}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Assists</p>
              <p className="text-gray-900">{stats.average.assists}</p>
            </div>
          </div>
        </section>
      </div>
      {chartData && (
        <section className="bg-white border rounded-md shadow-sm p-4 mb-4" aria-label="Points trend chart">
          <h3 className="text-lg font-semibold mb-2">Points Trend</h3>
          <Line data={chartData} options={chartOptions} />
        </section>
      )}
      <section className="bg-white border rounded-md shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-2">Game Log</h3>
        {sortedGameStats.length === 0 ? (
          <p className="text-gray-500">No games played this season.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[600px] text-sm" role="grid" aria-label="Player game log">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="border-b px-3 py-2 text-left font-semibold text-gray-700 cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    scope="col"
                    className="border-b px-3 py-2 text-left font-semibold text-gray-700"
                  >
                    Opponent
                  </th>
                  <th
                    scope="col"
                    className="border-b px-3 py-2 text-center font-semibold text-gray-700 cursor-pointer"
                    onClick={() => handleSort('points')}
                  >
                    Points {sortConfig.key === 'points' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    scope="col"
                    className="border-b px-3 py-2 text-center font-semibold text-gray-700 cursor-pointer"
                    onClick={() => handleSort('rebounds')}
                  >
                    Rebounds {sortConfig.key === 'rebounds' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    scope="col"
                    className="border-b px-3 py-2 text-center font-semibold text-gray-700 cursor-pointer"
                    onClick={() => handleSort('assists')}
                  >
                    Assists {sortConfig.key === 'assists' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    scope="col"
                    className="border-b px-3 py-2 text-center font-semibold text-gray-700 cursor-pointer"
                    onClick={() => handleSort('result')}
                  >
                    Result {sortConfig.key === 'result' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedGameStats.map((game, index) => {
                  const playerTeamScore = game.teamScores.find(ts => ts.team === player.team._id)?.score || 0;
                  const opponentScore = game.teamScores.find(ts => ts.team !== player.team._id)?.score || 0;
                  const result = playerTeamScore > opponentScore ? 'W' : playerTeamScore < opponentScore ? 'L' : 'T';
                  return (
                    <tr key={game.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border-b px-3 py-2 text-gray-900">
                        {new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="border-b px-3 py-2 text-gray-900">{game.opponentName}</td>
                      <td className="border-b px-3 py-2 text-center text-gray-900">{game.points}</td>
                      <td className="border-b px-3 py-2 text-center text-gray-900">{game.rebounds}</td>
                      <td className="border-b px-3 py-2 text-center text-gray-900">{game.assists}</td>
                      <td className="border-b px-3 py-2 text-center text-gray-900">{result}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
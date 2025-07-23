import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function PlayerProfile() {
  const { user } = useAuth();
  const { playerId, leagueId } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!user?.token || !playerId || !leagueId) {
        toast.error('Missing authentication or required parameters', { toastId: 'player-profile-error' });
        setLoading(false);
        return;
      }

      try {
        console.log(`[PlayerProfile] Fetching player with ID: ${playerId}, leagueId: ${leagueId}`);
        const response = await axios.get(`/api/players/${playerId}`, {
          params: { leagueId },
          headers: { Authorization: `Bearer ${user.token}` },
        });

        const playerData = response.data;
        if (!playerData) throw new Error('Player not found');

        // Sort gameStats by date to ensure most recent first
        if (playerData.stats?.gameStats) {
          playerData.stats.gameStats.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        setPlayer(playerData);
      } catch (error) {
        const errorMsg = error.response?.data?.error || 'Failed to fetch player data';
        toast.error(errorMsg, { toastId: 'fetch-player-error' });
        console.error(`[PlayerProfile useEffect] Error: ${errorMsg}`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerId, leagueId, user?.token]);

  // Calculate stats for the last 3 games
  const calculateLastThreeGamesStats = () => {
    if (!player?.stats?.gameStats || player.stats.gameStats.length === 0) {
      return { total: { points: 0, rebounds: 0, assists: 0 }, average: { points: 0, rebounds: 0, assists: 0 }, gameCount: 0 };
    }

    // Take the first 3 games (already sorted by date)
    const lastThreeGames = player.stats.gameStats.slice(0, 3);

    const stats = lastThreeGames.reduce(
      (acc, game) => ({
        totalPoints: acc.totalPoints + (game.points || 0),
        totalRebounds: acc.totalRebounds + (game.rebounds || 0),
        totalAssists: acc.totalAssists + (game.assists || 0),
        gameCount: acc.gameCount + 1,
      }),
      { totalPoints: 0, totalRebounds: 0, totalAssists: 0, gameCount: 0 }
    );

    return {
      total: {
        points: stats.totalPoints,
        rebounds: stats.totalRebounds,
        assists: stats.totalAssists,
      },
      average: {
        points: stats.gameCount ? (stats.totalPoints / stats.gameCount).toFixed(1) : 0,
        rebounds: stats.gameCount ? (stats.totalRebounds / stats.gameCount).toFixed(1) : 0,
        assists: stats.gameCount ? (stats.totalAssists / stats.gameCount).toFixed(1) : 0,
      },
      gameCount: stats.gameCount,
    };
  };

  if (loading) {
    return <div className="text-center text-gray-500">Loading player profile...</div>;
  }

  if (!player) {
    return <div className="text-center text-red-500">Player not found</div>;
  }

  const stats = calculateLastThreeGamesStats();
  const team = player.teams?.[0] || { name: 'No Team Assigned', _id: '', league: { _id: '', name: 'Unknown League' } };
  const season = team.season || 'Unknown Season';

  return (
    <div className="w-full max-w-2xl mx-auto p-4" role="region" aria-label="Player Profile">
      <h2 className="text-2xl font-bold mb-4">{player.name || 'Unknown Player'}</h2>
      <div className="bg-white border border-gray-300 rounded-md shadow-sm p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2">Team Information</h3>
        <p className="text-gray-700">
          League:{' '}
          <Link
            to={`/leagues/public/${team.league._id}`}
            className="text-blue-600 hover:underline"
            aria-label={`View league ${team.league.name}`}
          >
            {team.league.name || 'Unknown League'}
          </Link>
        </p>
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
        <p className="text-gray-700">Season: {season}</p>
      </div>
      <div className="bg-white border border-gray-300 rounded-md shadow-sm p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2">Total Stats (Last {stats.gameCount} Games)</h3>
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
      </div>
      <div className="bg-white border border-gray-300 rounded-md shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-2">Average Stats (Last {stats.gameCount} Games)</h3>
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
      </div>
    </div>
  );
}
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';
import {
  BuildingOfficeIcon,
  TrophyIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  StarIcon,
  SunIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import TeamJoin from './TeamJoin';

export default function MySporty() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [player, setPlayer] = useState(null);
  const [playerIds, setPlayerIds] = useState([]);
  const [nextGame, setNextGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const trendChartRef = useRef(null);
  const trendCanvasRef = useRef(null);
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [selectedStat, setSelectedStat] = useState('points');

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        const response = await axios.get(`/api/players?userId=${user._id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setPlayerIds(response.data.map(p => p._id));
        setPlayer(response.data[0]);
      } catch (err) {
        setError('Failed to fetch player data');
        setLoading(false);
      }
    };

    const fetchTeams = async () => {
      try {
        const response = await axios.get('/api/teams/my-teams?t=' + Date.now(), {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setTeams(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch teams');
        setLoading(false);
      }
    };

    const fetchNextGame = async () => {
      try {
        const response = await axios.get('/api/games/next-game?t=' + Date.now(), {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setNextGame(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch next game');
        setLoading(false);
      }
    };

    Promise.all([fetchPlayerData(), fetchTeams(), fetchNextGame()]);
  }, [user._id, user.token]);

  // Performance stats chart
  useEffect(() => {
    if (player?.stats?.gamePoints && canvasRef.current) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      const ctx = canvasRef.current.getContext('2d');
      const seasons = [...new Set(player.stats.gamePoints.map(gp => gp.season))];
      const datasets = seasons.map(season => ({
        label: `Season ${season}`,
        data: player.stats.gamePoints.filter(gp => gp.season === season).map(gp => gp.points),
        borderColor: season === player.stats.seasonStats[player.stats.seasonStats.length - 1]?.season ? '#2563eb' : '#64748b',
        backgroundColor: season === player.stats.seasonStats[player.stats.seasonStats.length - 1]?.season ? '#2563eb' : '#64748b',
        fill: false,
        tension: 0.3,
      }));

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Array.from({ length: Math.max(...datasets.map(d => d.data.length)) }, (_, i) => `Game ${i + 1}`),
          datasets,
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Points Per Game' },
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Points' } },
            x: { title: { display: true, text: 'Game' } },
          },
        },
      });
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [player]);

  // Performance trend chart
  useEffect(() => {
    if (player?.stats?.gameStats && trendCanvasRef.current) {
      if (trendChartRef.current) {
        trendChartRef.current.destroy();
      }
      const ctx = trendCanvasRef.current.getContext('2d');
      const filteredStats = selectedSeason === 'all'
        ? player.stats.gameStats
        : player.stats.gameStats.filter(gs => gs.season === selectedSeason);

      const datasets = [{
        label: `${selectedStat.charAt(0).toUpperCase() + selectedStat.slice(1)}`,
        data: filteredStats.map(gs => gs[selectedStat] || 0),
        borderColor: '#2563eb',
        backgroundColor: '#2563eb',
        fill: false,
        tension: 0.3,
      }];

      trendChartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: filteredStats.map((_, i) => `Game ${i + 1}`),
          datasets,
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `${selectedStat.charAt(0).toUpperCase() + selectedStat.slice(1)} Trend` },
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: selectedStat.charAt(0).toUpperCase() + selectedStat.slice(1) } },
            x: { title: { display: true, text: 'Game' } },
          },
        },
      });
    }
    return () => {
      if (trendChartRef.current) {
        trendChartRef.current.destroy();
      }
    };
  }, [player, selectedSeason, selectedStat]);

  // Countdown timer for next game
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    if (nextGame?.date) {
      const updateCountdown = () => {
        const now = new Date();
        const gameTime = new Date(nextGame.date);
        const diff = gameTime - now;
        if (diff <= 0) {
          setCountdown('Game started or passed');
          return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      return () => clearInterval(interval);
    }
  }, [nextGame]);

  if (loading) {
    return (
      <div className="h-[var(--page-height)] flex items-center justify-center text-slate-600">
        Loading data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[var(--page-height)] flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (teams.length === 0 && !player && !nextGame) {
    return <TeamJoin />;
  }

  return (
    <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-slate-800 min-h-[var(--page-height)] py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow">My Sporty</h1>
          <p className="mt-2 text-lg text-blue-100">Welcome, {user.name}</p>
        </div>

        {nextGame && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Next Game</h2>
            <div className="bg-gradient-to-br from-blue-50 to-slate-100 shadow-md rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center gap-4 mb-4">
                {nextGame.userTeam?.logo ? (
                  <img
                    src={nextGame.userTeam.logo}
                    alt={`${nextGame.userTeam.name} logo`}
                    className="w-12 h-12 object-cover rounded-full border-2 border-blue-200 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200 shadow-sm">
                    <span className="text-blue-300 text-lg font-bold">?</span>
                  </div>
                )}
                <span className="text-xl font-semibold text-blue-700">vs</span>
                {nextGame.opponentTeam?.logo ? (
                  <img
                    src={nextGame.opponentTeam.logo}
                    alt={`${nextGame.opponentTeam.name} logo`}
                    className="w-12 h-12 object-cover rounded-full border-2 border-blue-200 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200 shadow-sm">
                    <span className="text-blue-300 text-lg font-bold">?</span>
                  </div>
                )}
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <dt>
                    <CalendarIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Date & Time:</dt>
                  <dd className="text-slate-800 font-semibold">
                    {new Date(nextGame.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    , {nextGame.time}
                  </dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <MapPinIcon className="w-6 h-6 text-blue-500" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Location:</dt>
                  <dd className="text-slate-800 font-semibold">{nextGame.location}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <BuildingOfficeIcon className="w-6 h-6 text-green-700" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Venue:</dt>
                  <dd className="text-slate-800 font-semibold">{nextGame.venue}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <TrophyIcon className="w-6 h-6 text-amber-600" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">League:</dt>
                  <dd className="text-slate-800 font-semibold">{nextGame.league}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <UserIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Your Team:</dt>
                  <dd className="text-slate-800 font-semibold">{nextGame.userTeam?.name || 'N/A'}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <UserIcon className="w-6 h-6 text-green-700" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Opponent:</dt>
                  <dd className="text-slate-800 font-semibold">{nextGame.opponentTeam?.name || 'N/A'}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <TrophyIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Match Type:</dt>
                  <dd className="text-slate-800 font-semibold">
                    {nextGame.matchType.charAt(0).toUpperCase() + nextGame.matchType.slice(1)}
                  </dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <TrophyIcon className="w-6 h-6 text-slate-600" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Event Type:</dt>
                  <dd className="text-slate-800 font-semibold">
                    {nextGame.eventType.charAt(0).toUpperCase() + nextGame.eventType.slice(1)}
                  </dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <ChartBarIcon className="w-6 h-6 text-slate-500" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Previous Matchup:</dt>
                  <dd className="text-slate-800 font-semibold">{nextGame.previousMatchupScore}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <SunIcon className="w-6 h-6 text-amber-400" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Weather:</dt>
                  <dd className="text-slate-800 font-semibold">{nextGame.weatherConditions}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <ClockIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Countdown:</dt>
                  <dd className="text-slate-800 font-semibold">{countdown}</dd>
                </div>
              </dl>
            </div>
          </section>
        )}

        {player && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Performance Trend</h2>
            <div className="bg-gradient-to-br from-slate-50 to-blue-100 shadow-md rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center gap-4 mb-4">
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="border border-blue-200 rounded-md p-2 text-blue-800"
                >
                  <option value="all">All Seasons</option>
                  {player.stats?.seasonStats.map(s => (
                    <option key={s.season} value={s.season}>Season {s.season}</option>
                  ))}
                </select>
                <select
                  value={selectedStat}
                  onChange={(e) => setSelectedStat(e.target.value)}
                  className="border border-blue-200 rounded-md p-2 text-blue-800"
                >
                  <option value="points">Points</option>
                  <option value="rebounds">Rebounds</option>
                  <option value="steals">Steals</option>
                </select>
                {player.stats?.hotStreak && (
                  <div className="flex items-center gap-2 text-green-700 font-semibold">
                    <FireIcon className="w-6 h-6" aria-hidden="true" />
                    <span>Hot Streak!</span>
                  </div>
                )}
              </div>
              <canvas ref={trendCanvasRef} className="max-w-full" />
            </div>
          </section>
        )}

        {player && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Your Performance Stats</h2>
            <div className="bg-gradient-to-br from-blue-50 to-slate-100 shadow-md rounded-2xl p-6 border border-blue-200">
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <dt>
                    <StarIcon className="w-6 h-6 text-amber-500" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Total Points:</dt>
                  <dd className="text-slate-800 font-semibold">{player.stats?.totalPoints || 0}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <StarIcon className="w-6 h-6 text-amber-500" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Performance Rating:</dt>
                  <dd className="text-slate-800 font-semibold">{player.performanceRating || 0}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <StarIcon className="w-6 h-6 text-amber-500" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Career Avg Points:</dt>
                  <dd className="text-slate-800 font-semibold">{player.careerAvgPoints || 0}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <StarIcon className="w-6 h-6 text-amber-500" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Career Avg Rebounds:</dt>
                  <dd className="text-slate-800 font-semibold">{player.careerRebounds || 0}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <StarIcon className="w-6 h-6 text-amber-500" aria-hidden="true" />
                  </dt>
                  <dt className="text-slate-500 font-medium min-w-[120px]">Career Avg Steals:</dt>
                  <dd className="text-slate-800 font-semibold">{player.careerSteals || 0}</dd>
                </div>
                {player.stats?.seasonStats?.length > 0 && (
                  <>
                    <div className="flex items-center gap-3">
                      <dt>
                        <StarIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
                      </dt>
                      <dt className="text-slate-500 font-medium min-w-[120px]">Current Season Points:</dt>
                      <dd className="text-slate-800 font-semibold">
                        {player.stats.seasonStats[player.stats.seasonStats.length - 1]?.avgPoints.toFixed(1) || 0}
                        {player.careerAvgPoints > 0 && (
                          <span
                            className={
                              player.stats.seasonStats[player.stats.seasonStats.length - 1]?.avgPoints >
                              player.careerAvgPoints
                                ? 'text-green-600 ml-2'
                                : 'text-red-600 ml-2'
                            }
                          >
                            {player.stats.seasonStats[player.stats.seasonStats.length - 1]?.avgPoints >
                            player.careerAvgPoints
                              ? '↑'
                              : '↓'}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center gap-3">
                      <dt>
                        <StarIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
                      </dt>
                      <dt className="text-slate-500 font-medium min-w-[120px]">Current Season Rebounds:</dt>
                      <dd className="text-slate-800 font-semibold">
                        {player.stats.seasonStats[player.stats.seasonStats.length - 1]?.avgRebounds.toFixed(1) || 0}
                        {player.careerRebounds > 0 && (
                          <span
                            className={
                              player.stats.seasonStats[player.stats.seasonStats.length - 1]?.avgRebounds >
                              player.careerRebounds
                                ? 'text-green-600 ml-2'
                                : 'text-red-600 ml-2'
                            }
                          >
                            {player.stats.seasonStats[player.stats.seasonStats.length - 1]?.avgRebounds >
                            player.careerRebounds
                              ? '↑'
                              : '↓'}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center gap-3">
                      <dt>
                        <StarIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
                      </dt>
                      <dt className="text-slate-500 font-medium min-w-[120px]">Current Season Steals:</dt>
                      <dd className="text-slate-800 font-semibold">
                        {player.stats.seasonStats[player.stats.seasonStats.length - 1]?.avgSteals.toFixed(1) || 0}
                        {player.careerSteals > 0 && (
                          <span
                            className={
                              player.stats.seasonStats[player.stats.seasonStats.length - 1]?.avgSteals >
                              player.careerSteals
                                ? 'text-green-600 ml-2'
                                : 'text-red-600 ml-2'
                            }
                          >
                            {player.stats.seasonStats[player.stats.seasonStats.length - 1]?.avgSteals >
                            player.careerSteals
                              ? '↑'
                              : '↓'}
                          </span>
                        )}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
              <div className="mt-6">
                <canvas ref={canvasRef} className="max-w-full" />
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Your Teams</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const member = team.members.find((m) => playerIds.includes(m.player._id));
              const memberSince = new Date(team.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <article
                  key={team._id}
                  className="relative bg-gradient-to-br from-white to-blue-50 shadow-md rounded-2xl p-6 flex flex-col border border-blue-200 hover:shadow-xl transition-shadow duration-300"
                  aria-label={`Team card for ${team.name}`}
                >
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={`${team.name} logo`}
                      className="absolute top-6 right-6 w-16 h-16 object-cover rounded-full border-2 border-blue-200 shadow-sm hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="absolute top-6 right-6 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200 shadow-sm">
                      <span className="text-blue-300 text-xl font-bold">?</span>
                    </div>
                  )}
                  <header className="mb-4">
                    <h2 className="text-2xl font-bold text-blue-800">{team.name}</h2>
                  </header>
                  <dl className="space-y-4">
                    <div className="flex items-center gap-3">
                      <dt>
                        <BuildingOfficeIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
                      </dt>
                      <dt className="text-slate-500 font-medium min-w-[120px]">League:</dt>
                      <dd className="text-slate-800 font-semibold">{team.league.name}</dd>
                    </div>
                    <div className="flex items-center gap-3">
                      <dt>
                        <ClockIcon className="w-6 h-6 text-slate-600" aria-hidden="true" />
                      </dt>
                      <dt className="text-slate-500 font-medium min-w-[120px]">Season:</dt>
                      <dd className="text-slate-800">{team.season}</dd>
                    </div>
                    <div className="flex items-center gap-3">
                      <dt>
                        <TrophyIcon className="w-6 h-6 text-amber-600" aria-hidden="true" />
                      </dt>
                      <dt className="text-slate-500 font-medium min-w-[120px]">Sport:</dt>
                      <dd className="text-slate-800">{team.league.sportType}</dd>
                    </div>
                    <div className="flex items-center gap-3">
                      <dt>
                        <MapPinIcon className="w-6 h-6 text-blue-500" aria-hidden="true" />
                      </dt>
                      <dt className="text-slate-500 font-medium min-w-[120px]">Location:</dt>
                      <dd className="text-slate-800">{team.league.location || 'N/A'}</dd>
                    </div>
                    <div className="flex items-center gap-3">
                      <dt>
                        <UserIcon className="w-6 h-6 text-green-700" aria-hidden="true" />
                      </dt>
                      <dt className="text-slate-500 font-medium min-w-[120px]">Member Type:</dt>
                      <dd className="text-slate-800">
                        {member ? (member.role.charAt(0).toUpperCase() + member.role.slice(1)) : 'Unknown'}
                      </dd>
                    </div>
                    <div className="flex items-center gap-3">
                      <dt>
                        <CalendarIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
                      </dt>
                      <dt className="text-slate-500 font-medium min-w-[120px]">Member Since:</dt>
                      <dd className="text-slate-800">{memberSince}</dd>
                    </div>
                    <div className="flex items-center gap-3">
                      <dt>
                        <ChartBarIcon className="w-6 h-6 text-slate-600" aria-hidden="true" />
                      </dt>
                      <dt className="text-slate-500 font-medium min-w-[120px]">Record:</dt>
                      <dd className="text-slate-800">
                        {team.record ? `Wins: ${team.record.wins}, Losses: ${team.record.losses}` : 'No games played'}
                      </dd>
                    </div>
                    <div className="flex items-center gap-3">
                      <dt>
                        <TrophyIcon className="w-6 h-6 text-green-700" aria-hidden="true" />
                      </dt>
                      <dt className="text-slate-500 font-medium min-w-[120px]">Ranking:</dt>
                      <dd className="text-slate-800">
                        {team.ranking && team.ranking.rank ? `Rank: ${team.ranking.rank} / ${team.ranking.totalTeams}` : 'Not ranked'}
                      </dd>
                    </div>
                    <div className="flex items-center gap-3">
                      <dt>
                        {team.isActive ? (
                          <CheckCircleIcon className="w-6 h-6 text-green-600" aria-hidden="true" />
                        ) : (
                          <XCircleIcon className="w-6 h-6 text-red-600" aria-hidden="true" />
                        )}
                      </dt>
                      <dt className="text-slate-500 font-medium min-w-[120px]">Team Status:</dt>
                      <dd className={team.isActive ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {team.isActive ? 'Active' : 'Inactive'}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

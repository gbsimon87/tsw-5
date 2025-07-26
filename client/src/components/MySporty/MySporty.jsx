import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Chart from 'chart.js/auto';
import Skeleton from 'react-loading-skeleton';
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
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import TeamJoin from '../TeamJoin';

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        const response = await axios.get(`/api/players?userId=${user?._id}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        if (!response.data) throw new Error('No player data found');
        setPlayerIds(response.data.map(p => p?._id).filter(Boolean));
        setPlayer(response.data[0]);
      } catch (err) {
        setError('Failed to fetch player data');
        setLoading(false);
      }
    };

    const fetchTeams = async () => {
      try {
        const response = await axios.get('/api/teams/my-teams', {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setTeams(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch teams');
        setLoading(false);
      }
    };

    const fetchNextGame = async () => {
      try {
        const response = await axios.get('/api/games/next-game', {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setNextGame(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch next game');
        setLoading(false);
      }
    };

    Promise.all([fetchPlayerData(), fetchTeams(), fetchNextGame()]).catch(() => {
      setLoading(false);
    });
  }, [user?._id, user?.token]);

  // Performance stats chart
  useEffect(() => {
    if (player?.stats?.gamePoints && canvasRef.current) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      const ctx = canvasRef.current.getContext('2d');
      const seasons = [...new Set(player.stats.gamePoints.map(gp => gp.season))];
      const datasets = useMemo(() => seasons.map(season => ({
        label: `Season ${season}`,
        data: player.stats.gamePoints.filter(gp => gp.season === season).map(gp => gp.points),
        borderColor: season === player.stats.seasonStats[player.stats.seasonStats.length - 1]?.season ? '#2563eb' : '#64748b',
        backgroundColor: season === player.stats.seasonStats[player.stats.seasonStats.length - 1]?.season ? '#2563eb' : '#64748b',
        fill: false,
        tension: 0.3,
      })), [player.stats.gamePoints, player.stats.seasonStats]);

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

      const datasets = useMemo(() => [{
        label: `${selectedStat.charAt(0).toUpperCase() + selectedStat.slice(1)}`,
        data: filteredStats.map(gs => gs[selectedStat] || 0),
        borderColor: '#2563eb',
        backgroundColor: '#2563eb',
        fill: false,
        tension: 0.3,
      }], [filteredStats, selectedStat]);

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
          setCountdown('Game started');
          return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      // Redirect 5 seconds after countdown reaches zero
      if (countdown === 'Game started') {
        const redirectTimeout = setTimeout(() => {
          navigate('/game'); // Adjust to `/leagues/:leagueId/game/:gameId` if IDs available
        }, 5000);
        return () => clearTimeout(redirectTimeout);
      }

      return () => clearInterval(interval);
    }
  }, [nextGame, countdown, navigate]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-slate-800 min-h-[var(--page-height)] py-4 px-4 sm:px-6 lg:px-8" role="status" aria-busy="true">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <Skeleton
              height={40}
              width={300}
              baseColor="#334155"
              highlightColor="#475569"
              className="rounded-md"
              aria-hidden="true"
            />
            <Skeleton
              height={24}
              width={200}
              baseColor="#334155"
              highlightColor="#475569"
              className="mt-2 rounded-md"
              aria-hidden="true"
            />
          </div>
          <section className="mb-6">
            <Skeleton
              height={32}
              width={200}
              baseColor="#334155"
              highlightColor="#475569"
              className="mb-4 rounded-md"
              aria-hidden="true"
            />
            <div className="bg-white shadow-md rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-between gap-4 mb-2">
                <Skeleton
                  circle
                  height={40}
                  width={40}
                  baseColor="#e2e8f0"
                  highlightColor="#f1f5f9"
                  aria-hidden="true"
                />
                <Skeleton
                  height={24}
                  width={200}
                  baseColor="#e2e8f0"
                  highlightColor="#f1f5f9"
                  className="rounded-md"
                  aria-hidden="true"
                />
                <Skeleton
                  circle
                  height={40}
                  width={40}
                  baseColor="#e2e8f0"
                  highlightColor="#f1f5f9"
                  aria-hidden="true"
                />
              </div>
              <Skeleton
                height={20}
                width={150}
                baseColor="#e2e8f0"
                highlightColor="#f1f5f9"
                className="mb-2 rounded-md"
                aria-hidden="true"
              />
              <Skeleton
                height={20}
                width={100}
                baseColor="#e2e8f0"
                highlightColor="#f1f5f9"
                className="mb-2 rounded-md"
                aria-hidden="true"
              />
              <Skeleton
                height={20}
                width={120}
                baseColor="#e2e8f0"
                highlightColor="#f1f5f9"
                className="mb-2 rounded-md"
                aria-hidden="true"
              />
              <Skeleton
                height={20}
                width={80}
                baseColor="#e2e8f0"
                highlightColor="#f1f5f9"
                className="rounded-md"
                aria-hidden="true"
              />
            </div>
          </section>
          <section>
            <Skeleton
              height={32}
              width={200}
              baseColor="#334155"
              highlightColor="#475569"
              className="mb-4 rounded-md"
              aria-hidden="true"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white shadow-md rounded-2xl p-6 flex flex-col border border-blue-200"
                >
                  <Skeleton
                    circle
                    height={64}
                    width={64}
                    baseColor="#e2e8f0"
                    highlightColor="#f1f5f9"
                    className="mb-4"
                    aria-hidden="true"
                  />
                  <Skeleton
                    height={32}
                    baseColor="#e2e8f0"
                    highlightColor="#f1f5f9"
                    className="mb-4 rounded-md"
                    aria-hidden="true"
                  />
                  <div className="space-y-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        height={20}
                        baseColor="#e2e8f0"
                        highlightColor="#f1f5f9"
                        className="rounded-md"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[var(--page-height)] flex items-center justify-center text-red-500" role="alert" aria-live="assertive">
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
          <section className="mb-6" role="region" aria-label="Next Game">
            <h2 className="text-2xl font-bold text-white mb-4">Next Game</h2>
            <div className="bg-white shadow-md rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-between gap-4 mb-2">
                {nextGame.userTeam?.logo ? (
                  <img
                    src={nextGame.userTeam.logo}
                    alt={`${nextGame.userTeam.name} logo`}
                    className="w-10 h-10 object-cover rounded-full border border-blue-200"
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                    <span className="text-blue-300 text-sm font-bold">?</span>
                  </div>
                )}
                <p className="text-slate-800 font-semibold">
                  {nextGame.userTeam?.name} vs {nextGame.opponentTeam?.name}
                </p>
                {nextGame.opponentTeam?.logo ? (
                  <img
                    src={nextGame.opponentTeam.logo}
                    alt={`${nextGame.opponentTeam.name} logo`}
                    className="w-10 h-10 object-cover rounded-full border border-blue-200"
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                    <span className="text-blue-300 text-sm font-bold">?</span>
                  </div>
                )}
              </div>
              <p className="text-slate-600">
                {new Date(nextGame.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {nextGame.time}
              </p>
              <p className="text-slate-600">{nextGame.venue} ({nextGame.location})</p>
              <p className="text-slate-600">{nextGame.league}</p>
              <p className="text-slate-600">
                {nextGame.matchType.charAt(0).toUpperCase() + nextGame.matchType.slice(1)} -{' '}
                {nextGame.eventType.charAt(0).toUpperCase() + nextGame.eventType.slice(1)}
              </p>
              <p className="text-blue-600 font-medium" aria-live="polite">{countdown}</p>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Your Teams</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const member = team.members.find((m) => playerIds?.includes(m?.player?._id));
              const memberSince = new Date(team?.createdAt)?.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <article
                  key={team?._id}
                  className="relative bg-gradient-to-br from-white to-blue-50 shadow-md rounded-2xl p-6 flex flex-col border border-blue-200 hover:shadow-xl transition-shadow duration-300"
                  role="article"
                  aria-label={`Team card for ${team?.name}`}
                  onClick={() => navigate(`/leagues/${team?.league?._id}/team/${team?._id}`)}
                >
                  {team?.logo ? (
                    <img
                      src={team?.logo}
                      alt={`${team?.name} logo`}
                      className="w-16 h-16 object-cover rounded-full border-2 border-blue-200 shadow-sm hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200 shadow-sm">
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
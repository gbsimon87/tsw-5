import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import Modal from 'react-modal';
import { useAuth } from '../../context/AuthContext';

export default function Team() {
  const { user } = useAuth();
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState(null);
  const [pointsLeaderboard, setPointsLeaderboard] = useState([]);
  const [assistsLeaderboard, setAssistsLeaderboard] = useState([]);
  const [reboundsLeaderboard, setReboundsLeaderboard] = useState([]);

  const navigate = useNavigate();

  // Function to extract YouTube video ID
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    return match && match[1] ? match[1] : null;
  };

  // Function to get YouTube thumbnail URL
  const getYouTubeThumbnailUrl = (url) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  // Function to transform YouTube URL to embeddable format
  const getYouTubeEmbedUrl = (url) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  // Open video modal
  const openVideoModal = (videoUrl) => {
    const embedUrl = getYouTubeEmbedUrl(videoUrl);
    if (embedUrl) {
      setSelectedVideoUrl(embedUrl);
      setIsVideoModalOpen(true);
    }
  };

  // Close video modal
  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedVideoUrl(null);
  };

  // Replace renderLeaderboard function with updated version
  const renderLeaderboards = () => (
    <div className="mb-8">

      {/* Team Leaders - Points */}
      <h3 className="text-lg font-bold mb-2">Team Leaders - Points</h3>
      {pointsLeaderboard.length === 0 ? (
        <div className="text-gray-400 mb-4">No points stats available.</div>
      ) : (
        <table className="min-w-full text-sm mb-8">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">Player</th>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">Jersey</th>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">Points</th>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">PPG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pointsLeaderboard.map((player, index) => {
              const isGreyRow = index % 2 !== 0;
              // Defensive check for valid data
              if (!player?._id || !team?.league?._id) {
                console.warn('Invalid player data for navigation:', { player, team });
                return (
                  <tr
                    key={player._id || `fallback-${index}`}
                    className={isGreyRow ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="border-b border-gray-100 px-3 py-2 text-gray-900">
                      {player.playerName || 'Unknown'}
                    </td>
                    <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                      {player.jerseyNumber || 'N/A'}
                    </td>
                    <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                      {player.totalPoints || 0}
                    </td>
                    <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                      {player.pointsPerGame ? player.pointsPerGame.toFixed(1) : '0.0'}
                    </td>
                  </tr>
                );
              }
              return (
                <tr
                  key={player._id}
                  className={`${isGreyRow ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'} cursor-pointer`}
                  onClick={() => {
                    if (team?.league?._id && player._id && teamId) {
                      navigate(`/leagues/${team.league._id}/team/${teamId}/players/${player._id}`);
                    } else {
                      console.warn('Invalid navigation data:', { leagueId: team?.league?._id, player, teamId });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Space') {
                      e.preventDefault();
                      if (team?.league?._id && player._id && teamId) {
                        navigate(`/leagues/${team.league._id}/team/${teamId}/players/${player._id}`);
                      } else {
                        console.warn('Invalid navigation data:', { leagueId: team?.league?._id, player, teamId });
                      }
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={`View profile for ${player.playerName || 'Unknown'}`}
                >
                  <td className="border-b border-gray-100 px-3 py-2 text-gray-900">
                    {player.playerName || 'Unknown'}
                  </td>
                  <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                    {player.jerseyNumber || 'N/A'}
                  </td>
                  <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                    {player.totalPoints || 0}
                  </td>
                  <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                    {player.pointsPerGame ? player.pointsPerGame.toFixed(1) : '0.0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Team Leaders - Assists */}
      <h3 className="text-lg font-bold mb-2">Team Leaders - Assists</h3>
      {assistsLeaderboard.length === 0 ? (
        <div className="text-gray-400 mb-4">No assists stats available.</div>
      ) : (
        <table className="min-w-full text-sm mb-8">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">Player</th>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">Jersey</th>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">Assists</th>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">APG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assistsLeaderboard.map((player, index) => {
              const isGreyRow = index % 2 !== 0;
              // Defensive check for valid data
              if (!player?._id || !team?.league?._id) {
                console.warn('Invalid player data for navigation:', { player, team });
                return (
                  <tr
                    key={player._id || `fallback-${index}`}
                    className={isGreyRow ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="border-b border-gray-100 px-3 py-2 text-gray-900">
                      {player.playerName || 'Unknown'}
                    </td>
                    <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                      {player.jerseyNumber || 'N/A'}
                    </td>
                    <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                      {player.totalAssists || 0}
                    </td>
                    <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                      {player.assistsPerGame ? player.assistsPerGame.toFixed(1) : '0.0'}
                    </td>
                  </tr>
                );
              }
              return (
                <tr
                  key={player._id}
                  className={`${isGreyRow ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'} cursor-pointer`}
                  onClick={() => {
                    if (team?.league?._id && player._id && teamId) {
                      navigate(`/leagues/${team.league._id}/team/${teamId}/players/${player._id}`);
                    } else {
                      console.warn('Invalid navigation data:', { leagueId: team?.league?._id, player, teamId });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Space') {
                      e.preventDefault();
                      if (team?.league?._id && player._id && teamId) {
                        navigate(`/leagues/${team.league._id}/team/${teamId}/players/${player._id}`);
                      } else {
                        console.warn('Invalid navigation data:', { leagueId: team?.league?._id, player, teamId });
                      }
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={`View profile for ${player.playerName || 'Unknown'}`}
                >
                  <td className="border-b border-gray-100 px-3 py-2 text-gray-900">
                    {player.playerName || 'Unknown'}
                  </td>
                  <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                    {player.jerseyNumber || 'N/A'}
                  </td>
                  <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                    {player.totalAssists || 0}
                  </td>
                  <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                    {player.assistsPerGame ? player.assistsPerGame.toFixed(1) : '0.0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Team Leaders - Rebounds */}
      <h3 className="text-lg font-bold mb-2">Team Leaders - Rebounds</h3>
      {reboundsLeaderboard.length === 0 ? (
        <div className="text-gray-400">No rebounds stats available.</div>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">Player</th>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">Jersey</th>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">Rebounds</th>
              <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold">RPG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reboundsLeaderboard.map((player, index) => {
              const isGreyRow = index % 2 !== 0;
              // Defensive check for valid data
              if (!player?._id || !team?.league?._id) {
                console.warn('Invalid player data for navigation:', { player, team });
                return (
                  <tr
                    key={player._id || `fallback-${index}`}
                    className={isGreyRow ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="border-b border-gray-100 px-3 py-2 text-gray-900">
                      {player.playerName || 'Unknown'}
                    </td>
                    <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                      {player.jerseyNumber || 'N/A'}
                    </td>
                    <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                      {player.totalRebounds || 0}
                    </td>
                    <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                      {player.reboundsPerGame ? player.reboundsPerGame.toFixed(1) : '0.0'}
                    </td>
                  </tr>
                );
              }
              return (
                <tr
                  key={player._id}
                  className={`${isGreyRow ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'} cursor-pointer`}
                  onClick={() => {
                    if (team?.league?._id && player._id && teamId) {
                      navigate(`/leagues/${team.league._id}/team/${teamId}/players/${player._id}`);
                    } else {
                      console.warn('Invalid navigation data:', { leagueId: team?.league?._id, player, teamId });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Space') {
                      e.preventDefault();
                      if (team?.league?._id && player._id && teamId) {
                        navigate(`/leagues/${team.league._id}/team/${teamId}/players/${player._id}`);
                      } else {
                        console.warn('Invalid navigation data:', { leagueId: team?.league?._id, player, teamId });
                      }
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={`View profile for ${player.playerName || 'Unknown'}`}
                >
                  <td className="border-b border-gray-100 px-3 py-2 text-gray-900">
                    {player.playerName || 'Unknown'}
                  </td>
                  <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                    {player.jerseyNumber || 'N/A'}
                  </td>
                  <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                    {player.totalRebounds || 0}
                  </td>
                  <td className="text-center border-b border-gray-200 px-3 py-2 text-gray-900">
                    {player.reboundsPerGame ? player.reboundsPerGame.toFixed(1) : '0.0'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  useEffect(() => {
    if (!user?.token || !teamId) {
      setLoading(false);
      setTeam(null);
      setError('Missing authentication or team ID');
      return;
    }

    async function fetchTeam() {
      setLoading(true);
      setError(null);
      try {
        const teamResponse = await axios.get(`/api/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const teamData = teamResponse.data || null;
        setTeam(teamData);

        const gamesResponse = await axios.get(`/api/teams/${teamId}/games?season=${teamData?.season}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setUpcomingGames(gamesResponse?.data?.upcomingGames || []);
        setRecentGames(gamesResponse?.data?.previousGames || []);

        // Fetch leaderboard
        const leaderboardResponse = await axios.get(`/api/teams/${teamId}/leaderboard?season=${teamData?.season}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setPointsLeaderboard(leaderboardResponse.data.points || []);
        setAssistsLeaderboard(leaderboardResponse.data.assists || []);
        setReboundsLeaderboard(leaderboardResponse.data.rebounds || []);
      } catch (err) {
        console.error('Fetch team error:', err?.response?.status, err.response?.data, err.message);
        setTeam(null);
        setError(err?.response?.data?.error || 'Failed to fetch team, games, or leaderboard');
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
  }, [user?.token, teamId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 container mx-auto p-4 pt-6 md:px-6 max-w-5xl text-dark bg-white min-h-[var(--page-height)] py-4 px-4 sm:px-6 lg:px-8" role="status" aria-live="assertive">
        {/* Team Info Skeleton */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-100 mb-8" role="region" aria-label="Team Info">
          <div className="flex items-center gap-6 mb-4">
            <Skeleton circle={true} width={64} height={64} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
            <div>
              <Skeleton height={40} width={300} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
              <Skeleton height={24} width={250} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
              <Skeleton height={24} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
              <Skeleton height={24} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
              <Skeleton height={24} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* Roster Skeleton */}
        <div className="mb-8">
          <Skeleton height={20} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky top-0 left-0 z-30 bg-gray-50 border-b border-gray-200 px-2 py-2">
                  <Skeleton height={16} width={20} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                </th>
                <th className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-2 py-2">
                  <Skeleton height={16} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                </th>
                <th className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-3 py-2">
                  <Skeleton height={16} width={60} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                </th>
                <th className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-3 py-2">
                  <Skeleton height={16} width={60} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                </th>
                <th className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-3 py-2">
                  <Skeleton height={16} width={60} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...Array(3)].map((_, index) => (
                <tr key={`roster-skeleton-${index}`} className={index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="sticky left-0 border-b border-gray-100 px-2 py-2">
                    <Skeleton height={16} width={20} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2">
                    <Skeleton height={16} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2">
                    <Skeleton height={16} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2">
                    <Skeleton height={16} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2">
                    <Skeleton height={16} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leaderboards Skeleton */}
        <div className="mb-8">
          {/* Points Leaderboard */}
          <Skeleton height={20} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
          <table className="min-w-full text-sm mb-8">
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
                <tr key={`points-skeleton-${index}`} className={index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}>
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

          {/* Assists Leaderboard */}
          <Skeleton height={20} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
          <table className="min-w-full text-sm mb-8">
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
                <tr key={`assists-skeleton-${index}`} className={index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}>
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

          {/* Rebounds Leaderboard */}
          <Skeleton height={20} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
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
                <tr key={`rebounds-skeleton-${index}`} className={index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}>
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
        </div>

        {/* Games Skeleton */}
        <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8" role="region" aria-label="Games">
          <Skeleton height={28} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-4" aria-hidden="true" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between mb-2">
                <Skeleton height={16} width={120} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                <Skeleton height={16} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
              </div>
              <Skeleton height={16} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
              <Skeleton height={16} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between mb-2">
                <Skeleton height={16} width={120} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                <Skeleton height={16} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
              </div>
              <Skeleton height={16} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
              <Skeleton height={16} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-5xl mx-auto mt-4 bg-white rounded-xl p-4" role="alert" aria-live="assertive">
        <p className="text-red-600 text-sm">{error || 'Team not found or you are not a member'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-dark min-h-[var(--page-height)] py-4 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        {/* TEAM INFO */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-100 mb-8" role="region" aria-label="Team Info">
          <div className="flex items-center gap-6 mb-4">
            {team?.logo ? (
              <img
                src={team.logo}
                alt={`${team?.name || 'Unknown Team'} Logo`}
                className="object-cover w-16 h-16 rounded-full mb-4 border border-gray-200"
              />
            ) : (
              <div
                className="w-16 h-16 bg-gray-300 rounded-full mb-4 border border-gray-200"
                aria-hidden="true"
              />
            )}
            <div>
              <h2 className="text-xl md:text-3xl font-extrabold tracking-tight break-words">{team?.name || 'Unknown Team'}</h2>
              <p className="text-base md:text-lg font-medium mt-2 break-words">
                Record: Wins {team?.record?.wins || 0}, Losses {team?.record?.losses || 0}, Rank {team?.ranking?.rank ? `${team?.ranking?.rank} / ${team?.ranking?.totalTeams}` : 'Unranked'}
              </p>
              <p className="text-base md:text-lg font-medium mt-1 break-words">
                Season: {team?.season || 'Unknown'}
              </p>
              <p className="text-base md:text-lg font-medium mt-1 break-words">
                League:{' '}
                {team?.league?._id ? (
                  <Link
                    to={`/leagues/public/${team?.league?._id}`}
                    className="text-blue-300 hover:text-blue-100 underline focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label={`View league ${team?.league?.name || 'Unknown'}`}
                  >
                    {team?.league?.name || 'Unknown'}
                  </Link>
                ) : (
                  'Unknown'
                )}
              </p>
              <p className="text-base md:text-lg font-medium mt-1 break-words">
                Status: {team?.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </section>

        {/* ROSTER */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-2">Roster</h3>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th
                  className="sticky top-0 left-0 z-30 bg-gray-50 border-b border-gray-200 px-2 py-2 text-left font-semibold"
                  scope="col"
                >
                  #
                </th>
                <th
                  className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-2 py-2 text-left font-semibold"
                  scope="col"
                >
                  Name
                </th>
                <th
                  className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap text-center"
                  scope="col"
                >
                  Position
                </th>
                <th
                  className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap text-center"
                  scope="col"
                >
                  Role
                </th>
                <th
                  className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap text-center"
                  scope="col"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {team?.members?.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-6 text-gray-400"
                  >
                    No team members available.
                  </td>
                </tr>
              ) : (
                team?.members?.map((member, index) => {
                  const isGreyRow = index % 2 !== 0;
                  return (
                    <tr
                      key={member?.player?._id || `member-${index}`}
                      className={`${isGreyRow ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'} cursor-pointer`}
                      onClick={() => {
                        if (member?.player?._id && team?.league?._id) {
                          navigate(`/leagues/${team.league._id}/team/${teamId}/players/${member.player._id}`);
                        } else {
                          console.warn('Invalid navigation data:', { member, team });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Space') {
                          e.preventDefault();
                          if (member?.player?._id && team?.league?._id) {
                            navigate(`/leagues/${team.league._id}/team/${teamId}/players/${member.player._id}`);
                          } else {
                            console.warn('Invalid navigation data:', { member, team });
                          }
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={`View profile for ${member?.player?.user?.name || member?.player?.name || 'Unknown'}`}
                    >
                      <td
                        className="sticky left-0 border-b border-gray-100 px-2 py-2 font-medium whitespace-normal z-10 text-gray-900"
                        style={{ maxWidth: 150 }}
                      >
                        {index + 1}
                      </td>
                      <td
                        className="border-b border-gray-100 px-2 py-2 font-medium text-gray-900"
                      >
                        <span>
                          {member?.player?.user?.name || member?.player?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="border-b border-gray-100 px-3 py-2 text-center text-sm text-gray-700">
                        {member?.player?.position || 'N/A'}
                      </td>
                      <td className="border-b border-gray-100 px-3 py-2 text-center text-sm text-gray-700">
                        {member?.role || 'N/A'}
                      </td>
                      <td
                        className={`border-b border-gray-100 px-3 py-2 text-center text-sm ${member.isActive ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {member?.isActive ? 'Active' : 'Inactive'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* LEADERBOARDS */}
        {renderLeaderboards()}

        {/* GAMES */}
        <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8" role="region" aria-label="Games">
          <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-4 break-words">Games</h2>
          {upcomingGames?.length === 0 && recentGames?.length === 0 ? (
            <p className="text-gray-600 text-left font-medium" role="alert" aria-live="true">
              No games found. Check back later.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                ...upcomingGames.map(game => ({ ...game, isCompleted: false })),
                ...recentGames.map(game => ({ ...game, isCompleted: true }))
              ]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((game) => (
                  <div
                    key={game?._id || game.date}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                    onClick={() => {
                      if (team?.league?._id && game._id) {
                        navigate(`/leagues/${team.league._id}/game/${game._id}`);
                      } else {
                        console.warn('Invalid navigation data:', { team, game });
                      }
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-500">
                        {new Date(game?.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${game.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {game.isCompleted ? 'Completed' : 'Scheduled'}
                      </span>
                    </div>
                    <div className="flex flex-col divide-y divide-gray-200">
                      <div className="flex justify-between py-2">
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[60%]">
                          {team?.name || 'Unknown'}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {game?.teamScore ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[60%]">
                          {game?.opponentName || 'Unknown'}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {game?.opponentScore ?? 0}
                        </span>
                      </div>
                    </div>
                    {game.videoUrl && (
                      <div className="mt-2">
                        <button
                          onClick={() => openVideoModal(game.videoUrl)}
                          className="relative block"
                          aria-label={`Watch video for game on ${new Date(game.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}`}
                        >
                          <img
                            src={getYouTubeThumbnailUrl(game.videoUrl)}
                            alt={`Thumbnail for game video on ${new Date(game.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}`}
                            className="w-32 h-18 object-cover rounded-md hover:opacity-80 transition-opacity"
                            onError={(e) => (e.target.src = '/placeholder.png')}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* VIDEO MODAL */}
        <Modal
          isOpen={isVideoModalOpen}
          onRequestClose={closeVideoModal}
          className="bg-white p-4 rounded shadow-lg max-w-3xl w-full mx-auto my-8"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
          shouldCloseOnOverlayClick={true}
          contentLabel="Game Video Modal"
          aria={{
            labelledby: 'video-modal-title',
            describedby: 'video-modal-description',
          }}
        >
          <h3 id="video-modal-title" className="text-lg font-bold mb-2">Game Video</h3>
          <div id="video-modal-description" className="relative" style={{ paddingBottom: '56.25%' }}>
            {selectedVideoUrl ? (
              <iframe
                src={selectedVideoUrl}
                title="Game Video"
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <p className="text-red-500">Invalid video URL</p>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={closeVideoModal}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

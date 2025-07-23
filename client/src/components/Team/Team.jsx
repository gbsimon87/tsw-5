import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import { useAuth } from '../../context/AuthContext';

export default function Team() {
  const { user } = useAuth();
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [previousGames, setPreviousGames] = useState([]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

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
        // Fetch team data first to get team.season
        const teamResponse = await axios.get(`/api/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const teamData = teamResponse.data || null;
        setTeam(teamData);

        // Fetch games using team.season
        const gamesResponse = await axios.get(`/api/teams/${teamId}/games?season=${teamData?.season}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        setUpcomingGames(gamesResponse?.data?.upcomingGames || []);
        setPreviousGames(gamesResponse?.data?.previousGames || []);

        // Fetch leaderboard
        const leaderboardResponse = await axios.get(`/api/teams/${teamId}/leaderboard?season=${teamData?.season}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setLeaderboard(leaderboardResponse.data || []);
      } catch (err) {
        console.error('Fetch team error:', err?.response?.status, err.response?.data, err.message);
        setTeam(null);
        setError(err?.response?.data?.error || 'Failed to fetch team or games');
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
  }, [user?.token, teamId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto mt-4 bg-white rounded-xl p-4">
        <div className="text-slate-500">Loading team...</div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-5xl mx-auto mt-4 bg-white rounded-xl p-4">
        <div className="text-red-600">{error || 'Team not found or you are not a member'}</div>
      </div>
    );
  }

  // Add leaderboard section before the return statement
  const renderLeaderboard = () => (
    <div className="mb-8">
      <h3 className="text-lg font-bold mb-2">Team Leaders - Points</h3>
      {leaderboard.length === 0 ? (
        <div className="text-gray-400">No player stats available.</div>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold">Player</th>
              <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold">Jersey</th>
              <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leaderboard.map((player, index) => {
              const isGreyRow = index % 2 !== 0;
              return (
                <tr key={player._id} className={isGreyRow ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border-b border-gray-100 px-3 py-2 text-gray-900">{player.playerName || 'Unknown'}</td>
                  <td className="border-b border-gray-100 px-3 py-2 text-gray-900">{player.jerseyNumber || 'N/A'}</td>
                  <td className="border-b border-gray-100 px-3 py-2 text-gray-900">{player.totalPoints}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="text-white bg-gradient-to-br from-blue-900 via-blue-700 to-slate-800 min-h-[var(--page-height)] py-4 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">

        <div className="flex items-center gap-6 mb-4">
          <img
            src={team?.logo || '/team-logo.png'}
            alt={`${team?.name} Logo`}
            className="object-cover w-16 h-16 rounded-full border"
          />
          <div>
            <h2 className="text-xl font-bold">{team?.name}</h2>
            <p>
              Season: {team?.season}
            </p>
            <p>
              League:{' '}
              {team?.league?._id ? (
                <Link
                  to={`/leagues/public/${team?.league?._id}`}
                  className="text-blue-400 hover:text-blue-300 underline"
                  aria-label={`View league ${team?.league?.name || 'Unknown'}`}
                >
                  {team?.league?.name || 'Unknown'}
                </Link>
              ) : (
                'Unknown'
              )}
            </p>
            <div className="font-semibold">
              {team?.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-bold mb-2">Record</h3>
          <div className="flex gap-8">
            <div>
              Wins: <span className="font-semibold">{team?.record?.wins || 0}</span>
            </div>
            <div>
              Losses: <span className="font-semibold">{team?.record?.losses || 0}</span>
            </div>
            <div>
              Rank:{' '}
              <span className="font-semibold">
                {team?.ranking?.rank
                  ? `${team?.ranking?.rank} / ${team?.ranking?.totalTeams}`
                  : 'Unranked'}
              </span>
            </div>
          </div>
        </div>
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
                      key={member?.player?._id}
                      className={isGreyRow ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}
                    >
                      <td
                        className={`sticky left-0 border-b border-gray-100 px-2 py-2 font-medium whitespace-normal z-10 ${isGreyRow ? 'bg-gray-50 text-gray-900' : 'bg-white text-gray-900'}`}
                        style={{ maxWidth: 150 }}
                      >
                        {index + 1}
                      </td>
                      <td
                        className={`border-b border-gray-100 px-2 py-2 font-medium text-gray-900 ${isGreyRow ? 'bg-gray-50' : 'bg-white'}`}
                      >
                        {member?.player?.user?.name || 'Unknown'}
                      </td>
                      <td
                        className="border-b border-gray-100 px-3 py-2 text-center text-sm text-gray-700"
                      >
                        {member?.player?.position || 'N/A'}
                      </td>
                      <td
                        className="border-b border-gray-100 px-3 py-2 text-center text-sm text-gray-700"
                      >
                        {member?.role}
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

        {/* LEADERBOARD */}
        {renderLeaderboard()}

        {/* New sections for games */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-2">Upcoming Games</h3>
          {upcomingGames?.length === 0 ? (
            <div className="text-gray-400">No upcoming games scheduled.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold">Date</th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold">Opponent</th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {upcomingGames?.map((game, index) => {
                  const isGreyRow = index % 2 !== 0;
                  return (
                    <tr key={game?._id} className={isGreyRow ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border-b border-gray-100 px-3 py-2 text-gray-900">
                        {new Date(game?.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="border-b border-gray-100 px-3 py-2 text-gray-900">{game?.opponentName}</td>
                      <td className="border-b border-gray-100 px-3 py-2 text-gray-900">
                        {game?.teamScore === 'TBD' ? 'TBD' : `${game?.teamScore} - ${game?.opponentScore}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {/* RECENT GAMES TABLE */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-2">Recent Games</h3>
          {previousGames?.length === 0 ? (
            <div className="text-gray-400">No recent games played.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold">Date</th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold">Opponent</th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold">Score</th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold">Video</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previousGames?.map((game, index) => {
                  const isGreyRow = index % 2 !== 0;
                  return (
                    <tr key={game?._id} className={isGreyRow ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border-b border-gray-100 px-3 py-2 text-gray-900">
                        {new Date(game?.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="border-b border-gray-100 px-3 py-2 text-gray-900">{game.opponentName}</td>
                      <td className="border-b border-gray-100 px-3 py-2 text-gray-900">
                        {game?.teamScore} - {game?.opponentScore}
                      </td>
                      <td className="border-b border-gray-100 px-3 py-2 text-gray-900">
                        {game.videoUrl ? (
                          <button
                            onClick={() => openVideoModal(game.videoUrl)}
                            className="relative block"
                            aria-label={`Watch video for game on ${new Date(game.date).toLocaleDateString()}`}
                          >
                            <img
                              src={getYouTubeThumbnailUrl(game.videoUrl)}
                              alt={`Thumbnail for game video on ${new Date(game.date).toLocaleDateString()}`}
                              className="w-32 h-18 object-cover rounded-md hover:opacity-80 transition-opacity"
                              onError={(e) => (e.target.src = '/placeholder.png')} // Fallback image
                            />
                          </button>
                        ) : (
                          'No Video'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {/* Video Modal */}
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
          <div id="video-modal-description" className="relative" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
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
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';

const PublicFacingLeaguePage = () => {
  const { leagueId } = useParams();
  const [league, setLeague] = useState(null);
  const [leagueStats, setLeagueStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leagueResponse, statsResponse] = await Promise.all([
          axios.get(`/api/leagues/public/${leagueId}`),
          axios.get(`/api/leagues/public/${leagueId}/stats`),
        ]);
        setLeague(leagueResponse.data);
        setLeagueStats(statsResponse.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load league data');
        setLoading(false);
      }
    };
    fetchData();
  }, [leagueId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 container mx-auto p-4 pt-6 md:px-6 max-w-7xl text-dark bg-white min-h-[var(--page-height)] py-4 px-4 sm:px-6 lg:px-8">
        <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <Skeleton height={40} width={300} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
          <Skeleton height={24} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
          <Skeleton height={20} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
        </section>
        <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <Skeleton height={32} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-4" aria-hidden="true" />
          <Skeleton count={5} height={40} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
        </section>
        <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <Skeleton height={32} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-4" aria-hidden="true" />
          <Skeleton count={3} height={40} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
        </section>
        <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <Skeleton height={32} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-4" aria-hidden="true" />
          <Skeleton count={3} height={40} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 container mx-auto p-4 pt-6 md:px-6 max-w-7xl text-dark bg-white min-h-[var(--page-height)] py-4 px-4 sm:px-6 lg:px-8">
      {/* League Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-100" role="region" aria-label="League Header">
        {error || !league ? (
          <p className="text-white text-left font-medium break-words" role="alert" aria-live="assertive">Unable to load league details</p>
        ) : (
          <>
            {league.logo ? (
              <img
                src={league.logo}
                alt={`${league.name} logo`}
                className="w-16 h-16 object-cover rounded-full mb-4 border border-gray-800"
              />
            ) : (
              <div
                className="w-16 h-16 bg-gray-300 rounded-full mb-4 border border-gray-800"
                aria-hidden="true"
              />
            )}
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight break-words">{league.name || 'Unknown League'}</h1>
            <p className="text-base md:text-lg font-medium mt-2 break-words">
              Sport: {league.sportType ? league.sportType.charAt(0).toUpperCase() + league.sportType.slice(1) : 'Unknown'}
            </p>
            {league.season && <p className="text-base md:text-lg mt-1 break-words">Season: {league.season}</p>}
            {league.location && <p className="text-base md:text-lg mt-1 break-words">Location: {league.location}</p>}
            <Link
              to={`/teams/join`}
              className="mt-4 inline-block bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-white focus:outline-none"
              aria-label="Join this league"
            >
              Join League
            </Link>
          </>
        )}
      </section>

      {/* Team Standings */}
      <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100" role="region" aria-label="Team Standings">
        <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-4 break-words">Team Standings</h2>
        {error || !league || league.standings?.length === 0 ? (
          <p className="text-gray-700 text-left font-medium" role="alert" aria-live="assertive">No standings available. Check back later.</p>
        ) : (
          <div className="overflow-x-auto snap-x">
            <table className="min-w-full divide-y divide-gray-200" aria-label="Team standings table">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider snap-start">Team</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider snap-start">W</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider snap-start">L</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider snap-start">PCT</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {league.standings.map((team) => (
                  <tr key={team._id}>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {team.name || 'Unnamed Team'}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {team.wins || 0}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {team.losses || 0}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {(team.pct ? (team.pct * 100).toFixed(1) : 0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Games */}
      <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100" role="region" aria-label="Games">
        <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-4 break-words">Games</h2>
        {error || !league || league.games?.length === 0 ? (
          <p className="text-gray-600 text-left font-medium" role="alert" aria-live="true">
            No games found. Check back later.
          </p>
        ) : (
          <div className="space-y-4">
            {league.games
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((game) => (
                <div
                  key={game._id || game.date}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-500">
                      {new Date(game.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${game.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {game.isCompleted ? 'Completed' : 'Scheduled'}
                    </span>
                  </div>
                  <div className="flex flex-col divide-y divide-gray-200">
                    {game.teamScores.map((ts, idx) => {
                      const team = game.teams.find((t) => t._id === ts.team);
                      return (
                        <div key={ts.team} className="flex justify-between py-2">
                          <span className="text-sm font-medium text-gray-900 truncate max-w-[60%]">{team?.name || 'Unknown'}</span>
                          <span className="text-sm font-bold text-gray-900">{ts.score || 0}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>


      {/* League Leaders - Points */}
      <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100" role="region" aria-label="League Leaders - Points">
        <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-4 break-words">League Leaders - Points</h2>
        {error || !league || league.leagueLeaders?.length === 0 ? (
          <p className="text-gray-700 text-left font-medium" role="alert" aria-live="assertive">No league leaders available. Check back later.</p>
        ) : (
          <div className="overflow-x-auto snap-x">
            <table className="min-w-full divide-y divide-gray-200" aria-label="League leaders points table">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider snap-start">Player</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider snap-start">Team</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider snap-start">Points</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {league.leagueLeaders.map((leader) => (
                  <tr key={leader._id}>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {leader.name || 'Unknown Player'}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {leader.team || 'Unknown Team'}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {leader.points || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* League Leaders - Assists */}
      <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100" role="region" aria-label="League Leaders - Assists">
        <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-4 break-words">League Leaders - Assists</h2>
        {error || !league || league.leagueAssistLeaders?.length === 0 ? (
          <p className="text-gray-700 text-left font-medium" role="alert" aria-live="assertive">No league leaders available. Check back later.</p>
        ) : (
          <div className="overflow-x-auto snap-x">
            <table className="min-w-full divide-y divide-gray-200" aria-label="League leaders assists table">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider snap-start">Player</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider snap-start">Team</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider snap-start">Assists</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {league.leagueAssistLeaders.map((leader) => (
                  <tr key={leader._id}>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {leader.name || 'Unknown Player'}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {leader.team || 'Unknown Team'}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {leader.assists || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* League Leaders - Rebounds */}
      <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100" role="region" aria-label="League Leaders - Rebounds">
        <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-4 break-words">League Leaders - Rebounds</h2>
        {error || !league || league.leagueReboundLeaders?.length === 0 ? (
          <p className="text-gray-700 text-left font-medium" role="alert" aria-live="assertive">No league leaders available. Check back later.</p>
        ) : (
          <div className="overflow-x-auto snap-x">
            <table className="min-w-full divide-y divide-gray-200" aria-label="League leaders rebounds table">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider snap-start">Player</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider snap-start">Team</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider snap-start">Rebounds</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {league.leagueReboundLeaders.map((leader) => (
                  <tr key={leader._id}>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {leader.name || 'Unknown Player'}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {leader.team || 'Unknown Team'}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-center text-sm text-gray-700">
                      {leader.rebounds || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>


      {/* League Statistics */}
      <section className="bg-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-100" role="region" aria-label="League Statistics">
        <h2 className="text-base md:text-2xl font-bold text-gray-900 mb-4 break-words">League Statistics</h2>
        {error || !league || !leagueStats ? (
          <p className="text-gray-700 text-left font-medium" role="alert" aria-live="assertive">No statistics available. Check back later.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{leagueStats.numberOfTeams || 0}</p>
              <p className="text-sm text-gray-700">Teams</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{leagueStats.numberOfPlayers || 0}</p>
              <p className="text-sm text-gray-700">Players</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{leagueStats.totalGames || 0}</p>
              <p className="text-sm text-gray-700">Games Played</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{leagueStats.stats.totalPoints || 0}</p>
              <p className="text-sm text-gray-700">Total Points</p>
            </div>
            {leagueStats.league.sportType === 'basketball' && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{leagueStats.stats.totalAssists || 0}</p>
                  <p className="text-sm text-gray-700">Total Assists</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{leagueStats.stats.totalRebounds || 0}</p>
                  <p className="text-sm text-gray-700">Total Rebounds</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{leagueStats.stats.totalThreePointFGM || 0}</p>
                  <p className="text-sm text-gray-700">Three-Point FGM</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{leagueStats.stats.totalFreeThrows || 0}</p>
                  <p className="text-sm text-gray-700">Free Throws Made</p>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default PublicFacingLeaguePage;

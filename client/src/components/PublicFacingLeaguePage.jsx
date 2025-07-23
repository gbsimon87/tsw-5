import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const PublicFacingLeaguePage = () => {
  const { leagueId } = useParams();
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const response = await axios.get(`/api/leagues/public/${leagueId}`);
        setLeague(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load league data');
        setLoading(false);
      }
    };
    fetchLeague();
  }, [leagueId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 container mx-auto p-4 pt-6 md:px-6 max-w-7xl text-dark bg-white min-h-[var(--page-height)] py-4 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="text-center text-gray-500 py-10">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 container mx-auto p-4 pt-6 md:px-6 max-w-7xl text-dark bg-white min-h-[var(--page-height)] py-4 px-4 sm:px-6 lg:px-8">
      {/* League Header */}
      <div className="bg-white shadow-md rounded-lg p-4">
        {error || !league ? (
          <div className="text-gray-500 text-left">Unable to load league details</div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-800">{league.name || 'Unknown League'}</h1>
            <p className="text-lg text-gray-600">
              Sport: {league.sportType ? league.sportType.charAt(0).toUpperCase() + league.sportType.slice(1) : 'Unknown'}
            </p>
            {league.season && <p className="text-md text-gray-500">Season: {league.season}</p>}
            {league.location && <p className="text-md text-gray-500">Location: {league.location}</p>}
          </>
        )}
      </div>

      {/* Team Standings */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Team Standings</h2>
        {error || !league || league.standings?.length === 0 ? (
          <div className="text-gray-500 text-left">No standings available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PCT</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {league.standings.map((team) => (
                  <tr key={team._id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {team.name || 'Unnamed Team'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {team.wins || 0}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {team.losses || 0}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {(team.pct ? (team.pct * 100).toFixed(1) : 0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Games */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Games</h2>
        {error || !league || league.games?.length === 0 ? (
          <div className="text-gray-500 text-left">No games found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {league.games
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((game) => (
                    <tr key={game._id || game.date}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {new Date(game.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {game.teamScores
                          .map((ts) => {
                            const team = game.teams.find((t) => t._id === ts.team);
                            return `${team?.name || 'Unknown'}: ${ts.score}`;
                          })
                          .join(' - ')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {game.isCompleted ? 'Completed' : 'Scheduled'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* League Leaders - Points */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">League Leaders - Points</h2>
        {error || !league || league.leagueLeaders?.length === 0 ? (
          <div className="text-gray-500 text-left">No league leaders available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {league.leagueLeaders.map((leader) => (
                  <tr key={leader._id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {leader.name || 'Unknown Player'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {leader.team || 'Unknown Team'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {leader.points || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* League Leaders - Assists */}
      <div className="bg-white shadow-md rounded-lg p-4 mt-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">League Leaders - Assists</h2>
        {error || !league || !league.leagueAssistLeaders || league.leagueAssistLeaders.length === 0 ? (
          <div className="text-gray-500 text-left">No assist leaders available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assists</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {league.leagueAssistLeaders.map((leader) => (
                  <tr key={leader._id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {leader.name || 'Unknown Player'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {leader.team || 'Unknown Team'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {leader.assists || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* League Leaders - Rebounds */}
      <div className="bg-white shadow-md rounded-lg p-4 mt-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">League Leaders - Rebounds</h2>
        {error || !league || !league.leagueReboundLeaders || league.leagueReboundLeaders.length === 0 ? (
          <div className="text-gray-500 text-left">No rebound leaders available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rebounds</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {league.leagueReboundLeaders.map((leader) => (
                  <tr key={leader._id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {leader.name || 'Unknown Player'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {leader.team || 'Unknown Team'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {leader.rebounds || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicFacingLeaguePage;

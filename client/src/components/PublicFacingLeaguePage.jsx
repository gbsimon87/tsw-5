import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const PublicFacingLeaguePage = () => {
  const { leagueId } = useParams();
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <div className="container mx-auto p-4 pt-0 px-0 md:px-6 max-w-7xl">
        <div className="bg-white p-4">
          <div className="text-center text-gray-500 py-10">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pt-0 px-0 md:px-6 max-w-7xl">
      {/* League Header */}
      <div className="bg-white p-4">
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

      {/* Team Rosters */}
      <div className="bg-white p-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Team Rosters</h2>
        {error || !league || league.teams?.length === 0 ? (
          <p className="text-gray-600">No teams found</p>
        ) : (
          <ul className="space-y-4">
            {league.teams.map((team) => (
              <li
                key={team._id}
                className="flex items-center p-4 border hover:bg-gray-100 cursor-pointer"
                onClick={() => console.log('Team ID clicked:', team._id)}
              >
                {team.logo && team.logo !== '' ? (
                  <img
                    src={team.logo}
                    alt={`${team.name || 'Unnamed Team'} logo`}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Ccircle cx="24" cy="24" r="24" fill="%23D1D5DB"/%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
                )}
                <div>
                  <h3 className="text-xl font-medium text-gray-700">
                    {team.name || 'Unnamed Team'}
                  </h3>
                  {team.members.filter((m) => m.isActive).length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {team.members
                        .filter((m) => m.isActive)
                        .map((member) => (
                          <li key={member.player._id} className="text-gray-600 text-sm">
                            {member.player.user?.name || 'Unknown Player'}
                            {member.player.jerseyNumber && ` (#${member.player.jerseyNumber})`}
                            {member.player.position && ` - ${member.player.position}`}
                            {member.role === 'manager' && ' (Manager)'}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 text-sm mt-2">No active members</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Games */}
      <div className="bg-white p-4">
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

      {/* League Leaders */}
      <div className="bg-white p-4">
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
    </div>
  );
};

export default PublicFacingLeaguePage;
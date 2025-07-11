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

  if (loading) return <div className="text-center text-gray-500 py-10">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
  if (!league) return null;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* League Header */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{league.name}</h1>
        <p className="text-lg text-gray-600">
          Sport: {league?.sportType?.charAt(0)?.toUpperCase() + league?.sportType?.slice(1)}
        </p>
        {league?.season && <p className="text-md text-gray-500">Season: {league?.season}</p>}
        {league?.location && <p className="text-md text-gray-500">Location: {league?.location}</p>}
      </div>

      {/* Team Standings */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Team Standings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Losses</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {league?.standings?.map((team) => (
                <tr key={team?._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team?.wins}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team?.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Rosters */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Team Rosters</h2>
        {league?.teams?.map((team) => (
          <div key={team?._id} className="mb-6">
            <h3 className="text-xl font-medium text-gray-700 mb-2">{team?.name}</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {team?.members?.filter((m) => m?.isActive)?.map((member) => (
                <li key={member?.player?._id} className="text-gray-600">
                  {member?.player?.user?.firstName} {member?.player?.user?.lastName}
                  {member?.player?.jerseyNumber && ` (#${member?.player?.jerseyNumber})`}
                  {member?.player?.position && ` - ${member?.player?.position}`}
                  {member?.role === 'manager' && ' (Manager)'}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Games */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Games</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teams</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {league?.games?.sort((a, b) => new Date(b?.date) - new Date(a?.date))?.map((game) => (
                <tr key={game?._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(game?.date)?.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {game?.teams?.map((team) => team?.name)?.join(' vs ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {game?.teamScores?.map((ts) => `${ts?.team?.name}: ${ts?.score}`)?.join(' - ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {game?.isCompleted ? 'Completed' : 'Scheduled'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* League Leaders */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">League Leaders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {league?.leagueLeaders?.map((leader) => (
                <tr key={leader?._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{leader?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leader?.team}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leader?.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PublicFacingLeaguePage;
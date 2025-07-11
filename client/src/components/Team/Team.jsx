import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function Team() {
  const { user } = useAuth();
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.token || !teamId) {
      console.log('Missing user token or teamId:', { userToken: !!user?.token, teamId });
      setLoading(false);
      setTeam(null);
      setError('Missing authentication or team ID');
      return;
    }

    async function fetchTeam() {
      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching team with ID: ${teamId}`);
        const response = await axios.get(`/api/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        console.log('Team response:', response.data);
        setTeam(response.data || null);
      } catch (err) {
        console.error('Fetch team error:', err.response?.status, err.response?.data, err.message);
        setTeam(null);
        setError(err.response?.data?.error || 'Failed to fetch team');
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

  return (
    <div className="text-white bg-gradient-to-br from-blue-900 via-blue-700 to-slate-800 min-h-[var(--page-height)] py-4 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-6 mb-4">
          <img
            src={team.logo || '/team-logo.png'}
            alt={`${team.name} Logo`}
            className="w-16 h-16 rounded-full border"
          />
          <div>
            <h2 className="text-xl font-bold">{team.name}</h2>
            <div>
              Season: {team.season} | League: {team.league?.name || 'Unknown'}
            </div>
            <div
              className="font-semibold"
            >
              {team.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-bold mb-2">Record</h3>
          <div className="flex gap-8">
            <div>
              Wins: <span className="font-semibold">{team.record?.wins || 0}</span>
            </div>
            <div>
              Losses: <span className="font-semibold">{team.record?.losses || 0}</span>
            </div>
            <div>
              Rank:{' '}
              <span className="font-semibold">
                {team.ranking?.rank
                  ? `${team.ranking.rank} / ${team.ranking.totalTeams}`
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
              {team.members.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-6 text-gray-400"
                  >
                    No team members available.
                  </td>
                </tr>
              ) : (
                team.members.map((member, index) => {
                  const isGreyRow = index % 2 !== 0;
                  return (
                    <tr
                      key={member.player._id}
                      className={isGreyRow ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}
                    >
                      <td
                        className={`sticky left-0 border-b border-gray-100 px-2 py-2 font-medium whitespace-normal z-10 ${
                          isGreyRow ? 'bg-gray-50 text-gray-900' : 'bg-white text-gray-900'
                        }`}
                        style={{ maxWidth: 150 }}
                      >
                        {index + 1}
                      </td>
                      <td
                        className={`border-b border-gray-100 px-2 py-2 font-medium text-gray-900 ${
                          isGreyRow ? 'bg-gray-50' : 'bg-white'
                        }`}
                      >
                        {member.player.user?.name || 'Unknown'}
                      </td>
                      <td
                        className="border-b border-gray-100 px-3 py-2 text-center text-sm text-gray-700"
                      >
                        {member.player.position || 'N/A'}
                      </td>
                      <td
                        className="border-b border-gray-100 px-3 py-2 text-center text-sm text-gray-700"
                      >
                        {member.role}
                      </td>
                      <td
                        className={`border-b border-gray-100 px-3 py-2 text-center text-sm ${
                          member.isActive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {member.isActive ? 'Active' : 'Inactive'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
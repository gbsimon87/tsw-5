import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  ArrowLeftIcon,
  ShieldExclamationIcon,
  TrashIcon,
  UserGroupIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

export default function ManageTeams() {
  const { leagueId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [formData, setFormData] = useState({ name: '', logo: '' });
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const response = await axios.get(`/api/leagues/${leagueId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setLeague(response.data);
        const activeSeason = response.data.seasons.find(s => s.isActive)?.name || '';
        setSelectedSeason(activeSeason);
        if (activeSeason) {
          fetchTeams(activeSeason);
        } else {
          setTeams([]);
        }
      } catch (err) {
        setError(
          err.response?.status === 403
            ? 'You are not authorized to manage teams in this league'
            : 'Failed to fetch league'
        );
      }
    };
    fetchLeague();
  }, [leagueId, user.token]);

  const fetchTeams = async (season) => {
    if (!season) {
      setTeams([]);
      return;
    }
    try {
      const response = await axios.get(`/api/teams?leagueId=${leagueId}&season=${season}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setTeams(response.data);
    } catch (err) {
      console.error('Fetch teams error:', err.response || err);
      setError(err.response?.data?.error || 'Failed to fetch teams');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSeasonChange = (e) => {
    const season = e.target.value;
    setSelectedSeason(season);
    fetchTeams(season);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        '/api/teams',
        { ...formData, leagueId, season: selectedSeason },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setTeams([...teams, response.data]);
      setFormData({ name: '', logo: '' });
      setError(null);
    } catch (err) {
      setError(
        err.response?.status === 403
          ? 'You are not authorized to create teams'
          : err.response?.data?.error || 'Failed to create team'
      );
    }
  };

  const copyToClipboard = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDeactivateMember = async (teamId, playerId) => {
    try {
      await axios.patch(
        `/api/teams/${teamId}/members/${playerId}`,
        { isActive: false },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchTeams(selectedSeason);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to deactivate member');
    }
  };

  const handleChangeRole = async (teamId, playerId, newRole) => {
    try {
      // console.log('Updating role:', { teamId, playerId, newRole, leagueId });
      const response = await axios.patch(
        `/api/teams/${teamId}/members/${playerId}`,
        { role: newRole, leagueId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      // console.log('Update role response:', response.data);
      fetchTeams(selectedSeason);
    } catch (err) {
      console.error('Change role error:', err.response || err);
      setError(err.response?.data?.error || 'Failed to change member role');
    }
  };

  const handleDeactivateTeam = async (teamId) => {
    try {
      // console.log('Deactivating team:', { teamId, leagueId });
      const response = await axios.patch(
        `/api/teams/${teamId}`,
        { isActive: false, leagueId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      // console.log('Deactivate team response:', response.data);
      fetchTeams(selectedSeason);
    } catch (err) {
      console.error('Deactivate team error:', err.response || err);
      setError(err.response?.data?.error || 'Failed to deactivate team');
    }
  };

  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;
  if (!league) return <div className="text-center mt-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(`/leagues/${leagueId}`)}
            className="text-gray-600 hover:text-gray-800 transition"
            aria-label="Back to League"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold ml-4">Manage Teams: {league.name}</h1>
        </div>

        {selectedSeason && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">Create New Team</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Team Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Logo URL (optional):</label>
                <input
                  type="url"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                Create Team
              </button>
            </form>
          </div>
        )}
        {!selectedSeason && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-8">
            <p className="text-center text-gray-500">Please select a season to create a team.</p>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Teams</h2>
            <div className="flex items-center">
              <label className="mr-2 text-sm font-medium text-gray-700">Season:</label>
              <select
                value={selectedSeason}
                onChange={handleSeasonChange}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {league.seasons.map((season) => (
                  <option key={season.name} value={season.name}>
                    {season.name} {season.isActive ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {teams.length === 0 ? (
            <p className="text-center text-gray-500">No teams found for this season.</p>
          ) : (
            <div className="space-y-6">
              {teams.map((team) => (
                <div key={team._id} className="border-b border-gray-200 pb-8 mb-12">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-5">
                      {team.logo ? (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-12 h-12 rounded-full shadow border-2 border-gray-200 bg-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center shadow mr-0">
                          <UserGroupIcon className="w-6 h-6 text-gray-400" aria-hidden="true" />
                        </div>
                      )}
                      <h3 className="text-xl font-medium flex items-center gap-2">
                        {team.name}
                        {!team.isActive && (
                          <span className="text-sm text-gray-400 font-normal">(Inactive)</span>
                        )}
                      </h3>
                    </div>
                    {team.isActive && (
                      <button
                        onClick={() => handleDeactivateTeam(team._id)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition focus:ring-2 focus:ring-red-500 focus:outline-none"
                        aria-label={`Deactivate team ${team.name}`}
                        title="Archive/Deactivate"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between items-center space-x-2 mt-1 mt-8">
                    <span className="text-sm text-gray-600 font-mono">
                      Secret Key: {team.secretKey}
                    </span>
                    <button
                      onClick={() => copyToClipboard(team.secretKey)}
                      className="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      aria-label={`Copy secret key for ${team.name}`}
                    >
                      {copiedKey === team.secretKey ? 'Copied!' : 'Copy Key'}
                    </button>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-lg font-medium mb-2">Members</h4>
                    {team.members.length === 0 ? (
                      <p className="text-gray-500">No members in this team.</p>
                    ) : (
                      <ul className="space-y-2">
                        {/* {console.log(team)} */}
                        {team.members.map((member) => (
                          <li key={member.player._id} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-4">
                              {member.player?.user?.picture ? (
                                <img
                                  src={member.player.user.picture}
                                  alt={member.player.user.name || 'Member'}
                                  className="w-10 h-10 rounded-full shadow border-2 border-gray-200 bg-white"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center shadow">
                                  <UserCircleIcon className="w-6 h-6 text-gray-400" aria-hidden="true" />
                                </div>
                              )}
                              <span className={`text-base ${member.isActive ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                                {member.player?.user?.name || 'Unknown'}
                                {!member.isActive && <span className="ml-2">(Inactive)</span>}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={member.role}
                                onChange={(e) => handleChangeRole(team._id, member.player._id, e.target.value)}
                                className="p-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!member.isActive}
                              >
                                <option value="player">Player</option>
                                <option value="manager">Manager</option>
                              </select>
                              {member.isActive && (
                                <button
                                  onClick={() => handleDeactivateMember(team._id, member.player._id)}
                                  className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition focus:ring-2 focus:ring-red-500 focus:outline-none"
                                  aria-label={`Deactivate member ${member.player?.user?.name || 'Unknown'}`}
                                  title="Deactivate Member"
                                >
                                  <ShieldExclamationIcon className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  ArrowLeftIcon,
  ShieldExclamationIcon,
  TrashIcon,
  UserGroupIcon,
  UserCircleIcon,
  PlusIcon,
  ClipboardIcon,
  UsersIcon,
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
  const [activeTab, setActiveTab] = useState('create');

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
      toast.success(`Team "${response.data.name}" created successfully!`, {
        position: "top-right",
        autoClose: 3000,
      });
      setActiveTab('view');
    } catch (err) {
      const errorMessage = err.response?.status === 403
        ? 'You are not authorized to create teams'
        : err.response?.data?.error || 'Failed to create team';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
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
      await axios.patch(
        `/api/teams/${teamId}/members/${playerId}`,
        { role: newRole, leagueId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchTeams(selectedSeason);
    } catch (err) {
      console.error('Change role error:', err.response || err);
      setError(err.response?.data?.error || 'Failed to change member role');
    }
  };

  const handleDeactivateTeam = async (teamId) => {
    try {
      await axios.patch(
        `/api/teams/${teamId}`,
        { isActive: false, leagueId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchTeams(selectedSeason);
    } catch (err) {
      console.error('Deactivate team error:', err.response || err);
      setError(err.response?.data?.error || 'Failed to deactivate team');
    }
  };

  if (error) {
    return (
      <div className="min-h-[var(--page-height)] bg-gray-50 flex items-center justify-center">
        <p className="text-center text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-[var(--page-height)] bg-gray-50 flex items-center justify-center">
        <p className="text-center text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[var(--page-height)] bg-gray-50 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col mb-8 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/leagues/${leagueId}`)}
              className="flex items-center gap-2 bg-white text-blue-700 border border-blue-600 px-4 py-1.5 rounded-lg font-semibold shadow hover:bg-blue-50 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-label="Back to League"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to League
            </button>
            <div>
              <h1 className="text-2xl text-right font-bold text-gray-800">Manage Teams</h1>
              <div className="text-sm text-right text-gray-500 font-normal">
                Predovic, Deckow and Reichert Baseball League
              </div>
            </div>
          </div>
        </header>


        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label="New Game"
          >
            <PlusIcon className="w-4 h-4" />
            New Team
          </button>

          <button
            onClick={() => setActiveTab('view')}
            className={`flex items-center py-2 px-4 rounded-lg font-semibold transition focus:ring-2 focus:ring-blue-500 focus:outline-none ${activeTab === 'view'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-700 border border-blue-600 hover:bg-blue-50'
              }`}
          >
            <UsersIcon className="w-4 h-4" />
            View Teams
          </button>
        </div>

        {/* Create Team Form */}
        {activeTab === 'create' && (
          <section className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <PlusIcon className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-semibold text-gray-800">New Team</h2>
            </div>
            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
            {selectedSeason ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <UserGroupIcon className="w-5 h-5 text-gray-500" />
                    Team Name:
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <UserGroupIcon className="w-5 h-5 text-gray-500" />
                    Logo URL (optional):
                  </label>
                  <input
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Team
                </button>
              </form>
            ) : (
              <p className="text-center text-gray-600">Please select a season to create a team.</p>
            )}
          </section>
        )}

        {/* View All Teams */}
        {activeTab === 'view' && (
          <section className="bg-white shadow-xl rounded-2xl p-4 border border-gray-200">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-semibold text-gray-800">All Teams</h2>
              </div>
              <div className="flex items-center">
                <label className="mr-2 text-sm font-medium text-gray-700">Season:</label>
                <select
                  value={selectedSeason}
                  onChange={handleSeasonChange}
                  className="p-2 border border-gray-200 rounded-md max-w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              <p className="text-center text-gray-600">No teams found for this season.</p>
            ) : (
              <div className="space-y-6">
                {teams.map((team) => (
                  <div key={team._id} className="bg-white p-3 rounded-md border border-gray-200">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-5">
                        {team.logo ? (
                          <img
                            src={team.logo}
                            alt={team.name}
                            className="w-12 h-12 rounded-full shadow border-2 border-gray-200 bg-white"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center shadow">
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
                          className="bg-red-600 hover:bg-red-700 focus:ring-red-500 mt-2 flex items-center gap-2 text-white px-3 py-1 rounded-md transition focus:ring-2 focus:outline-none self-start"
                          aria-label={`Deactivate team ${team.name}`}
                          title="Deactivate Team"
                        // No w-full here!
                        >
                          <TrashIcon className="w-4 h-4" />
                          Deactivate
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-mono">Secret Key:</span>
                        <span className="text-sm text-gray-600 font-mono break-all">{team.secretKey}</span>
                        <button
                          onClick={() => copyToClipboard(team.secretKey)}
                          className="mt-2 flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:outline-none self-start"
                          aria-label={`Copy secret key for ${team.name}`}
                        // No w-full here!
                        >
                          <ClipboardIcon className="w-4 h-4" />
                          {copiedKey === team.secretKey ? 'Copied!' : 'Copy Key'}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-lg font-medium mb-2">Members</h4>
                      {team.members.length === 0 ? (
                        <p className="text-gray-600">No members in this team.</p>
                      ) : (
                        <ul className="space-y-2">
                          {team.members.map((member) => (
                            <li key={member.player._id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-2">
                              <div className="flex items-center gap-4">
                                {member.player?.user?.picture ? (
                                  <img
                                    src={member.player.user.picture}
                                    alt={member.player.user.name || 'Member'}
                                    className="w-10 h-10 rounded-full shadow border-2 border-gray-200 bg-white"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center shadow">
                                    <UserCircleIcon className="w-6 h-6 text-gray-400" aria-hidden="true" />
                                  </div>
                                )}
                                <span className={`text-base ${member.isActive ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                                  {member.player?.user?.name || 'Unknown'}
                                  {!member.isActive && <span className="ml-2">(Inactive)</span>}
                                </span>
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <select
                                  value={member.role}
                                  onChange={(e) => handleChangeRole(team._id, member.player._id, e.target.value)}
                                  className="p-1 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                  disabled={!member.isActive}
                                >
                                  <option value="player">Player</option>
                                  <option value="manager">Manager</option>
                                </select>
                                {member.isActive && (
                                  <button
                                    onClick={() => handleDeactivateMember(team._id, member.player._id)}
                                    className="mt-2 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition focus:ring-2 focus:ring-red-500 focus:outline-none self-start"
                                    aria-label={`Deactivate member ${member.player?.user?.name || 'Unknown'}`}
                                    title="Deactivate Member"
                                  // No w-full here!
                                  >
                                    <ShieldExclamationIcon className="w-4 h-4" />
                                    Deactivate
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
          </section>
        )}
      </div>
    </div>
  );
}
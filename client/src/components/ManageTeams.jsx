import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import axios from 'axios';
import {
  TrashIcon,
  UserGroupIcon,
  UserCircleIcon,
  PlusIcon,
  ClipboardIcon,
  UsersIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import Skeleton from 'react-loading-skeleton';
import Unauthorized from './Unauthorized';
import AdminPanelPageHeader from './AdminPanelPageHeader';
import { useAuth } from '../context/AuthContext';
import { positionOptions } from '../utils/positionOptions';

export default function ManageTeams() {
  const { leagueId } = useParams();
  const { user } = useAuth();
  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [formData, setFormData] = useState({ name: '', logo: '' });
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(true);
  const [openTeamId, setOpenTeamId] = useState(null);

  const tabs = [
    {
      id: 'create',
      label: 'New Team',
      icon: PlusIcon
    },
    {
      id: 'view',
      label: 'View Teams',
      icon: UsersIcon
    }
  ];

  useEffect(() => {
    setLoading(true);
    const fetchLeague = async () => {
      try {
        const response = await axios.get(`/api/leagues/${leagueId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setLeague(response.data);

        const isAdmin = response.data.admins?.some(admin => admin._id === user._id) || false;

        if (!isAdmin) {
          setError('You are not authorized to manage teams for this league');
          setLoading(false);
          return;
        }

        const activeSeason = response.data.seasons.find(s => s.isActive)?.name || '';
        setSelectedSeason(activeSeason);
        if (activeSeason) {
          fetchTeams(activeSeason);
        } else {
          setTeams([]);
        }
        setLoading(false);
      } catch (err) {
        const errorMessage = err.response?.status === 403
          ? 'You are not authorized to manage teams in this league'
          : 'Failed to fetch league';
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'light',
        });
        setLoading(false);
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
      const errorMessage = err.response?.data?.error || 'Failed to fetch teams';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleJerseyNumberChange = debounce(async (teamId, playerId, jerseyNumber) => {
    try {
      await axios.patch(
        `/api/players/${playerId}`,
        { jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : null, leagueId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Jersey number updated successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
      fetchTeams(selectedSeason);
    } catch (err) {
      console.error('Update jersey number error:', err.response || err);
      const errorMessage = err.response?.data?.error || 'Failed to update jersey number';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  }, 500);

  const handlePositionChange = debounce(async (teamId, playerId, position) => {
    try {
      await axios.patch(
        `/api/players/${playerId}`,
        { position: position || null, leagueId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Position updated successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
      fetchTeams(selectedSeason);
    } catch (err) {
      console.error('Update position error:', err.response || err);
      const errorMessage = err.response?.data?.error || 'Failed to update position';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  }, 500);

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
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
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
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    }
  };

  const copyToClipboard = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAllSecretKeys = () => {
    if (teams.length === 0) {
      toast.info('No teams to copy keys from.', { position: 'top-right' });
      return;
    }
    const allKeys = teams.map(team => `${team.name}: ${team.secretKey}`).join('\n');
    navigator.clipboard.writeText(allKeys);
    toast.success('Copied all secret keys to clipboard!', { position: 'top-right', autoClose: 3000 });
  };

  const handleDeactivateMember = async (teamId, playerId) => {
    try {
      await axios.patch(
        `/api/teams/${teamId}/members/${playerId}`,
        { isActive: false },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Member deactivated successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
      fetchTeams(selectedSeason);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to deactivate member';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    }
  };

  const handleChangeRole = async (teamId, playerId, newRole) => {
    try {
      await axios.patch(
        `/api/teams/${teamId}/members/${playerId}`,
        { role: newRole, leagueId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Member role updated successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
      fetchTeams(selectedSeason);
    } catch (err) {
      console.error('Change role error:', err.response || err);
      const errorMessage = err.response?.data?.error || 'Failed to change member role';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    }
  };

  const handleDeactivateTeam = async (teamId) => {
    try {
      await axios.patch(
        `/api/teams/${teamId}`,
        { isActive: false, leagueId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Team deactivated successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
      fetchTeams(selectedSeason);
    } catch (err) {
      console.error('Deactivate team error:', err.response || err);
      const errorMessage = err.response?.data?.error || 'Failed to deactivate team';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    }
  };

  if (error === 'You are not authorized to manage teams for this league') {
    return <Unauthorized />;
  }

  if (error) {
    return (
      <div className="min-h-[var(--page-height)] bg-gray-50 flex items-center justify-center">
        <p className="text-center text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[var(--page-height)] bg-gray-50 py-4 px-4">
      {loading ? (
        <div className="max-w-4xl mx-auto flex flex-col gap-4" role="status" aria-live="assertive">
          {/* Header Skeleton */}
          <div className="mb-4">
            <Skeleton height={36} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
            <Skeleton height={16} width={300} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
            <div className="flex gap-2 mt-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={`tab-${i}`} height={40} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
              ))}
            </div>
          </div>

          {/* Create Team Skeleton */}
          <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8" role="region" aria-label="Create Team">
            <Skeleton height={28} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-4" aria-hidden="true" />
            <div className="space-y-6">
              <div className="flex flex-col">
                <Skeleton height={16} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-1" aria-hidden="true" />
                <Skeleton height={40} width="100%" baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <Skeleton height={16} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-1" aria-hidden="true" />
                <Skeleton height={40} width="100%" baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
              </div>
              <Skeleton height={44} width="100%" baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
            </div>
          </section>

          {/* View Teams Skeleton */}
          <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100" role="region" aria-label="View All Teams">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <Skeleton height={28} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
              <Skeleton height={40} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
            </div>
            <Skeleton height={44} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-4 self-end" aria-hidden="true" />
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={`team-skeleton-${i}`} className="bg-white p-3 rounded-md border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-5">
                      <Skeleton circle height={48} width={48} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                      <Skeleton height={24} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                    </div>
                    <Skeleton height={36} width={120} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </div>
                  <div className="mt-4">
                    <Skeleton height={16} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
                    <Skeleton height={16} width="80%" baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
                    <Skeleton height={36} width={120} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </div>
                  <div className="mt-4">
                    <Skeleton height={20} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
                    {[...Array(2)].map((_, j) => (
                      <div key={`member-skeleton-${j}`} className="py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <Skeleton circle height={40} width={40} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                          <Skeleton height={16} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0">
                          <Skeleton height={36} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                          <Skeleton height={36} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                          <Skeleton height={36} width={120} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <>
          {error === 'Unauthorized' ? (
            <Unauthorized />
          ) : error ? (
            <div
              className="min-h-[var(--page-height)] bg-gray-100 flex items-center justify-center"
              role="alert"
              aria-live="assertive"
            >
              <p className="text-center text-red-600 text-lg py-4 px-6 bg-white rounded-xl shadow-sm">{error}</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <AdminPanelPageHeader
                backButtonLink={`/leagues/${leagueId}`}
                backButtonText="Back to League"
                pageTitle="Manage Teams"
                subHeader={league?.name || 'Loading League...'}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                aria-label="Manage Teams Header"
              />

              {/* Create Team Form */}
              {activeTab === 'create' && (
                <section
                  className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8"
                  role="region"
                  aria-labelledby="create-team"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <PlusIcon className="w-6 h-6 text-gray-700" aria-hidden="true" />
                    <h2 id="create-team" className="text-xl md:text-2xl font-bold text-gray-900">
                      New Team
                    </h2>
                  </div>
                  {selectedSeason ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="flex flex-col">
                        <label
                          htmlFor="team-name"
                          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
                        >
                          <UserGroupIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                          Team Name
                        </label>
                        <input
                          id="team-name"
                          type="text"
                          name="name"
                          value={formData?.name || ''}
                          onChange={handleInputChange}
                          required
                          className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                          aria-required="true"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label
                          htmlFor="team-logo"
                          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"
                        >
                          <UserGroupIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                          Logo URL (optional)
                        </label>
                        <input
                          id="team-logo"
                          type="url"
                          name="logo"
                          value={formData?.logo || ''}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-green-700 transition focus:ring-2 focus:ring-green-600 focus:outline-none w-full"
                        aria-label="Create new team"
                      >
                        <PlusIcon className="w-5 h-5" aria-hidden="true" />
                        Create Team
                      </button>
                    </form>
                  ) : (
                    <p className="text-center text-gray-600" role="alert" aria-live="polite">
                      Please select a season to create a team.
                    </p>
                  )}
                </section>
              )}

              {/* View All Teams */}
              {activeTab === 'view' && (
                <section
                  className="bg-white shadow-lg rounded-xl p-6 border border-gray-100"
                  role="region"
                  aria-labelledby="view-teams"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                    {/* Left: Icon + Text */}
                    <div className="flex items-center gap-3">
                      <UserGroupIcon className="w-6 h-6 text-gray-700" aria-hidden="true" />
                      <h2 id="view-teams" className="text-xl md:text-2xl font-bold text-gray-900">
                        All Teams
                      </h2>
                    </div>

                    {/* Right: Label + Select */}
                    <div className="flex items-center gap-2">
                      <label htmlFor="season-select" className="text-sm font-medium text-gray-700">
                        Season:
                      </label>
                      <select
                        id="season-select"
                        value={selectedSeason || ''}
                        onChange={handleSeasonChange}
                        className="p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none max-w-[200px]"
                        aria-label="Select season"
                      >
                        {league?.seasons?.map((season) => (
                          <option key={season?.name || `season-${Math.random()}`} value={season?.name}>
                            {season?.name} {season?.isActive ? '(Active)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={copyAllSecretKeys}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition focus:ring-2 focus:ring-green-600 focus:outline-none"
                      aria-label="Copy secret keys for all teams"
                    >
                      <ClipboardIcon className="w-5 h-5" aria-hidden="true" />
                      Copy All Secret Keys
                    </button>
                  </div>
                  {teams?.length === 0 ? (
                    <p className="text-center text-gray-600" role="alert" aria-live="polite">
                      No teams found for this season.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {teams.map((team) => (
                        <article
                          key={team?._id || `team-${Math.random()}`}
                          className="bg-white rounded-md shadow-sm"
                          aria-label={`Team card for ${team?.name || 'Unknown'}`}
                        >
                          <header>
                            <button
                              className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-md p-4 transition-colors hover:bg-gray-50"
                              onClick={() => setOpenTeamId(openTeamId === team?._id ? null : team?._id)}
                              aria-label={`Toggle team details for ${team?.name || 'Unknown'}`}
                              aria-expanded={openTeamId === team?._id}
                              aria-controls={`members-${team?._id || `team-${Math.random()}`}`}
                            >
                              <div className="flex items-center gap-5">
                                {team?.logo ? (
                                  <img
                                    src={team.logo}
                                    alt={`${team?.name || 'Unknown'} logo`}
                                    className="w-12 h-12 rounded-full shadow object-cover border-2 border-gray-200 bg-white"
                                    onError={(e) => (e.target.src = '/placeholder.png')}
                                  />
                                ) : (
                                  <div
                                    className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center shadow"
                                    aria-hidden="true"
                                  >
                                    <UserGroupIcon className="w-6 h-6 text-gray-400" aria-hidden="true" />
                                  </div>
                                )}
                                <h3 className="text-xl font-medium flex items-center gap-2">
                                  {team?.name || 'Unknown'}
                                  {!team?.isActive && (
                                    <span className="text-sm text-gray-400 font-normal">(Inactive)</span>
                                  )}
                                </h3>
                              </div>
                              <div className="flex items-center gap-4">
                                <dl className="flex flex-col">
                                  <dt className="text-xs text-gray-500 font-mono sr-only">Secret Key</dt>
                                  <dd className="text-sm text-left text-gray-600 font-mono break-all max-w-[200px] sm:max-w-[300px]">
                                    {team?.secretKey || 'N/A'}
                                  </dd>
                                </dl>
                                <div className="flex items-center gap-2">
                                  {team?.isActive && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeactivateTeam(team?._id);
                                      }}
                                      className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-red-600 transition focus:ring-2 focus:ring-red-600 focus:outline-none rounded-full"
                                      aria-label={`Deactivate team ${team?.name || 'Unknown'}`}
                                      title="Deactivate Team"
                                    >
                                      <TrashIcon className="w-5 h-5" aria-hidden="true" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(team?.secretKey);
                                    }}
                                    className="flex items-center justify-center w-8 h-8 text-gray-600 transition focus:ring-2 focus:outline-none"
                                    aria-label={`Copy secret key for ${team?.name || 'Unknown'}`}
                                  >
                                    <ClipboardIcon className="w-5 h-5" aria-hidden="true" />
                                  </button>
                                </div>
                                <div className="flex items-center justify-end">
                                  {openTeamId === team?._id ? (
                                    <ChevronUpIcon
                                      className="w-5 h-5 text-gray-600 transform transition-transform duration-200"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <ChevronDownIcon
                                      className="w-5 h-5 text-gray-600 transform transition-transform duration-200"
                                      aria-hidden="true"
                                    />
                                  )}
                                </div>
                              </div>
                            </button>
                          </header>
                          <section
                            id={`members-${team?._id || `team-${Math.random()}`}`}
                            className={`p-4 ${openTeamId === team?._id ? '' : 'hidden'}`}
                            aria-hidden={openTeamId !== team?._id}
                            role="region"
                            aria-labelledby={`team-header-${team?._id || `team-${Math.random()}`}`}
                          >
                            <h4 className="text-lg font-medium mb-2">Members</h4>
                            {team?.members?.length === 0 ? (
                              <p className="text-gray-600" role="alert" aria-live="polite">
                                No members in this team.
                              </p>
                            ) : (
                              <ul className="space-y-4" role="list" aria-label="Team members">
                                {team?.members?.map((member, idx) => {
                                  return (
                                    <li
                                      key={member?.player?._id || `member-${idx}`}
                                      className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4 ${idx !== team.members.length - 1 ? 'border-b border-gray-200' : ''
                                        }`}
                                      aria-label={`Member ${member?.player?.user?.name || 'Unknown'}`}
                                    >
                                      <div className="flex items-center gap-4">
                                        {member?.player?.user?.picture ? (
                                          <img
                                            src={member.player.user.picture}
                                            alt={`${member?.player?.user?.name || 'Unknown'} profile`}
                                            className="w-10 h-10 rounded-full shadow border-2 border-gray-200 bg-white"
                                            onError={(e) => (e.target.src = '/placeholder.png')}
                                          />
                                        ) : (
                                          <div
                                            className="w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center shadow"
                                            aria-hidden="true"
                                          >
                                            <UserCircleIcon className="w-6 h-6 text-gray-400" aria-hidden="true" />
                                          </div>
                                        )}
                                        <span
                                          className={`text-base ${member?.isActive ? 'font-bold text-gray-800' : 'text-gray-400 italic'
                                            }`}
                                        >
                                          {member?.player?.user?.name || 'Unknown'}
                                          {!member?.isActive && <span className="ml-2">(Inactive)</span>}
                                        </span>
                                      </div>
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                        <select
                                          value={member?.player?.jerseyNumber ?? ''}
                                          onChange={(e) =>
                                            handleJerseyNumberChange(team?._id, member?.player?._id, e.target.value)
                                          }
                                          className="p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none w-full sm:w-20"
                                          disabled={!member?.isActive}
                                          aria-label={`Jersey number for ${member?.player?.user?.name || 'Unknown'}`}
                                        >
                                          <option value="">No Jersey</option>
                                          {[...Array(100).keys()].map((num) => (
                                            <option key={num} value={num}>{num}</option>
                                          ))}
                                        </select>
                                        <select
                                          value={member?.role || 'player'}
                                          onChange={(e) =>
                                            handleChangeRole(team?._id, member?.player?._id, e.target.value)
                                          }
                                          className="p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none w-full sm:w-auto"
                                          disabled={!member?.isActive}
                                          aria-label={`Role for ${member?.player?.user?.name || 'Unknown'}`}
                                        >
                                          <option value="player">Player</option>
                                          <option value="manager">Manager</option>
                                        </select>
                                        <select
                                          value={member?.player?.position || ''}
                                          onChange={(e) =>
                                            handlePositionChange(team?._id, member?.player?._id, e.target.value)
                                          }
                                          className="p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none w-full sm:w-auto"
                                          disabled={!member?.isActive}
                                          aria-label={`Position for ${member?.player?.user?.name || 'Unknown'}`}
                                        >
                                          <option value="">No Position</option>
                                          {positionOptions[league?.sportType]?.map((pos) => (
                                            <option key={pos.value} value={pos.value}>
                                              {pos.label}
                                            </option>
                                          ))}
                                        </select>
                                        {member?.isActive && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeactivateMember(team?._id, member?.player?._id);
                                            }}
                                            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-red-600 transition focus:ring-2 focus:ring-red-600 focus:outline-none rounded-full"
                                            aria-label={`Deactivate member ${member?.player?.user?.name || 'Unknown'} from team ${team?.name || 'Unknown'}`}
                                            title="Deactivate Member"
                                          >
                                            <TrashIcon className="w-5 h-5" aria-hidden="true" />
                                          </button>
                                        )}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </section>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
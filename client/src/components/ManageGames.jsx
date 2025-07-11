import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  CalendarIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  UsersIcon,
  MapPinIcon,
  ClockIcon,
  FlagIcon,
  FilmIcon,
  DocumentTextIcon,
  UserIcon,
  CloudIcon,
  TrophyIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import AdminPanelPageHeader from './AdminPanelPageHeader';

export default function ManageGames() {
  const { leagueId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [league, setLeague] = useState(null);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('create');
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    teams: ['', ''],
    location: '',
    venue: '',
    venueCapacity: '',
    score: { team1: 0, team2: 0 },
    matchType: 'league',
    eventType: 'regular',
    attendance: '',
    periodType: '',
    periodDuration: '',
    overtimeDuration: '',
    scoringRules: {}
  });
  const [editingGameId, setEditingGameId] = useState(null);

  const tabs = [
    {
      id: 'create',
      label: 'New Game',
      icon: PlusIcon
    },
    {
      id: 'view',
      label: 'Past Games',
      icon: ClockIcon
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leagueResponse = await axios.get(`/api/leagues/${leagueId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const leagueData = leagueResponse.data;
        setLeague(leagueData);
        setFormData(prev => ({
          ...prev,
          periodType: leagueData?.settings?.periodType || '',
          periodDuration: leagueData?.settings?.periodDuration || '',
          overtimeDuration: leagueData?.settings?.overtimeDuration || '',
          scoringRules: leagueData?.settings?.scoringRules || {}
        }));

        const isAdmin = leagueData.admins?.some(admin => admin._id === user._id) || false;
        const isManager = leagueData.managers?.some(manager => manager._id === user._id) || false;
        if (!isAdmin && !isManager) {
          setError('You are not authorized to manage games for this league');
          setLoading(false);
          return;
        }

        const activeSeason = leagueData.seasons.find(s => s.isActive)?.name || 'Season 1';

        const teamsResponse = await axios.get(`/api/teams?leagueId=${leagueId}&season=${activeSeason}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setTeams(teamsResponse.data || []);

        const playersResponse = await axios.get(`/api/players?leagueId=${leagueId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setPlayers(playersResponse.data || []);

        const gamesResponse = await axios.get(`/api/games?leagueId=${leagueId}&season=${activeSeason}&t=${Date.now()}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        setGames(gamesResponse.data || []);

        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err.response?.data || err.message);
        setError(
          err.response?.status === 403
            ? 'You are not authorized to manage games for this league'
            : 'Failed to fetch data'
        );
        setLoading(false);
      }
    };
    fetchData();
  }, [leagueId, user.token, user._id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('score.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, score: { ...prev.score, [field]: parseInt(value) || 0 } }));
    } else if (name.includes('teams[')) {
      const index = parseInt(name.match(/\[(\d+)\]/)[1]);
      const newTeams = [...formData.teams];
      newTeams[index] = value;
      setFormData(prev => ({ ...prev, teams: newTeams }));
    } else if (name.startsWith('scoringRules.')) {
      const rule = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        scoringRules: {
          ...prev.scoringRules,
          [rule]: parseInt(value) || 0,
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    if (formData.teams[0] === formData.teams[1]) {
      setError('Home and Away teams must be different');
      toast.error('Home and Away teams must be different', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      return;
    }

    const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
    const payload = {
      ...formData,
      date: dateTime,
      league: leagueId,
      season: league?.seasons.find(s => s.isActive)?.name || 'Season 1',
      teams: formData.teams.filter(id => id),
      venueCapacity: parseInt(formData.venueCapacity) || 0,
      attendance: parseInt(formData.attendance) || 0,
      isCompleted: formData.eventType === 'final' || formData.score.team1 > 0 || formData.score.team2 > 0,
      periodType: formData.periodType,
      periodDuration: parseInt(formData.periodDuration),
      overtimeDuration: parseInt(formData.overtimeDuration),
      scoringRules: formData.scoringRules,
    };

    if (editingGameId) {
      await axios.patch(`/api/games/${editingGameId}`, payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      toast.success('Game updated successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    } else {
      await axios.post(`/api/games`, payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      toast.success('Game created successfully!', {
        position: "top-right",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    }

    const activeSeason = league?.seasons.find(s => s.isActive)?.name || 'Season 1';
    const gamesResponse = await axios.get(`/api/games?leagueId=${leagueId}&season=${activeSeason}&t=${Date.now()}`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    setGames(gamesResponse.data || []);

    setFormData({
      date: '',
      time: '',
      teams: ['', ''],
      location: '',
      venue: '',
      venueCapacity: '',
      score: { team1: 0, team2: 0 },
      matchType: 'league',
      eventType: 'regular',
      attendance: '',
    });
    setEditingGameId(null);
    setError(null);
    setActiveTab('view');
  } catch (err) {
    console.error('Save game error:', err.response?.data || err.message);
    const errorMessage = err.response?.data?.error || 'Failed to save game';
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

  const handleEditGame = (game) => {
    navigate(`/leagues/${leagueId}/games/${game._id}/tracking`);
  };

const handleDeleteGame = async (gameId) => {
  if (!window.confirm('Are you sure you want to delete this game?')) return;
  try {
    await axios.delete(`/api/games/${gameId}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setGames(games.filter(game => game._id !== gameId));
    setError(null);
    toast.success('Game deleted successfully!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
    });
  } catch (err) {
    console.error('Delete game error:', err.response?.data || err.message);
    const errorMessage = err.response?.data?.error || 'Failed to delete game';
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

  if (loading) {
    return (
      <div className="min-h-[var(--page-height)] bg-gray-50 flex items-center justify-center">
        <p className="text-center text-gray-600 text-lg">Loading...</p>
      </div>
    );
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
      <div className="max-w-4xl mx-auto">

        <AdminPanelPageHeader
          backButtonLink={`/leagues/${leagueId}`}
          backButtonText="Back to League"
          pageTitle="Manage Games"
          subHeader={league?.name || 'Unnamed League'}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Create Game Form */}
        {activeTab === 'create' && (
          <section className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <PlusIcon className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-semibold text-gray-800">
                {editingGameId ? 'Edit Game' : 'Create New Game'}
              </h2>
            </div>
            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <CalendarIcon className="w-5 h-5 text-gray-500" />
                    Date:
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <ClockIcon className="w-5 h-5 text-gray-500" />
                    Time:
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <UsersIcon className="w-5 h-5 text-gray-500" />
                    Home Team:
                  </label>
                  <select
                    name="teams[0]"
                    value={formData.teams[0]}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select Home Team</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <UsersIcon className="w-5 h-5 text-gray-500" />
                    Away Team:
                  </label>
                  <select
                    name="teams[1]"
                    value={formData.teams[1]}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select Away Team</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPinIcon className="w-5 h-5 text-gray-500" />
                    Location (optional):
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPinIcon className="w-5 h-5 text-gray-500" />
                    Venue (optional):
                  </label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <UsersIcon className="w-5 h-5 text-gray-500" />
                    Venue Capacity (optional):
                  </label>
                  <input
                    type="number"
                    name="venueCapacity"
                    value={formData.venueCapacity}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FlagIcon className="w-5 h-5 text-gray-500" />
                    Match Type (optional):
                  </label>
                  <select
                    name="matchType"
                    value={formData.matchType}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="league">League</option>
                    <option value="friendly">Friendly</option>
                    <option value="tournament">Tournament</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FlagIcon className="w-5 h-5 text-gray-500" />
                    Event Type (optional):
                  </label>
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleInputChange}
                    required
                    className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="regular">Regular</option>
                    <option value="playoff">Playoff</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">Period Type</label>
                  <select
                    name="periodType"
                    value={formData.periodType}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-3 border rounded-md"
                  >
                    <option value="halves">Halves</option>
                    <option value="quarters">Quarters</option>
                    <option value="periods">Periods</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">Period Duration (minutes)</label>
                  <input
                    type="number"
                    name="periodDuration"
                    value={formData.periodDuration}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-3 border rounded-md"
                  />
                </div>
                {Object.entries(formData.scoringRules || {}).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')} Points
                    </label>
                    <input
                      type="number"
                      name={`scoringRules.${key}`}
                      value={value}
                      onChange={handleInputChange}
                      className="mt-1 w-full p-3 border rounded-md"
                    />
                  </div>
                ))}

              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center gap-2 justify-center bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <PlusIcon className="w-5 h-5" />
                  {editingGameId ? 'Update Game' : 'Create Game'}
                </button>
                {editingGameId && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        date: '',
                        time: '',
                        teams: ['', ''],
                        location: '',
                        venue: '',
                        venueCapacity: '',
                        score: { team1: 0, team2: 0 },
                        matchType: 'league',
                        eventType: 'regular',
                        attendance: '',
                      });
                      setEditingGameId(null);
                      setActiveTab('create');
                    }}
                    className="flex-1 flex items-center gap-2 justify-center bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-400 transition focus:ring-2 focus:ring-gray-500 focus:outline-none"
                  >
                    <TrashIcon className="w-5 h-5" />
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </section>
        )}

        {/* Current Season Games List */}
        {activeTab === 'view' && (
          <section className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <StarIcon className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-semibold text-gray-800">Current Season Games</h2>
            </div>
            {games.length > 0 ? (
              <div className="space-y-2">
                {games.map(game => {
                  const isValidGame = game && Array.isArray(game.teams) && game.teams.length >= 2 && game.date;
                  if (!isValidGame) {
                    console.warn(`Invalid game data for game ID: ${game?._id}`, game);
                    return (
                      <div
                        key={game?._id || Math.random()}
                        className="bg-white p-4 rounded-md border border-gray-200"
                      >
                        <div className="space-y-2 text-gray-600">
                          <div className="flex items-center gap-2">
                            <TrophyIcon className="w-4 h-4 text-gray-500" />
                            <span>{game?.league?.name || 'Unknown League'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserGroupIcon className="w-4 h-4 text-gray-500" />
                            <span>{game?.teams?.map(t => t.name).join(' vs ') || 'Teams not set'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-gray-500" />
                            <span>{game?.location || 'No location provided'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-gray-500" />
                            <span>{new Date(game?.date).toLocaleDateString() || 'No date'}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => handleDeleteGame(game._id)}
                            className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition focus:ring-2 focus:ring-red-500 focus:outline-none"
                            aria-label="Delete Game"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={game._id} className="flex gap-2 items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                      <div className="space-y-1 text-gray-700">
                        <div className="flex items-center gap-8">
                          <UserGroupIcon className="w-4 h-4 text-gray-500" />
                          <span>{(game.teams[0]?.name || 'TBD')} vs {(game.teams[1]?.name || 'TBD')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-gray-500" />
                          <span>
                            {new Date(game.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ChartBarIcon className="w-4 h-4 text-gray-500" />
                          <span>{game.matchType} ({game.eventType}){game.isCompleted ? ' - Completed' : ''}</span>
                        </div>
                        {game.location && (
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-gray-500" />
                            <span>{game.location}</span>
                          </div>
                        )}
                        {game.score && (
                          <div className="flex items-center gap-2">
                            <ChartBarIcon className="w-4 h-4 text-gray-500" />
                            <span>Score: {game.score.team1} - {game.score.team2}</span>
                          </div>
                        )}
                        {game.gameMVP && (
                          <div className="flex items-center gap-2">
                            <StarIcon className="w-4 h-4 text-yellow-500" />
                            <span>MVP: {game.gameMVP.name || 'Unknown'}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEditGame(game)}
                          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          aria-label="Edit Game"
                        >
                          <PencilIcon className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game._id)}
                          className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition focus:ring-2 focus:ring-red-500 focus:outline-none"
                          aria-label="Delete Game"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600">No games defined for the current season.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
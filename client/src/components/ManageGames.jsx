import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { CalendarIcon, PlusIcon, PencilIcon, TrashIcon, StarIcon, UsersIcon, MapPinIcon, ClockIcon, FlagIcon, FilmIcon, DocumentTextIcon, UserIcon, CloudIcon } from '@heroicons/react/24/outline';

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
    gameDuration: '',
    weatherConditions: '',
    referee: '',
    attendance: '',
    previousMatchupScore: '',
    fanRating: 0,
    highlights: [''],
    matchReport: '',
    mediaLinks: [{ url: '', type: '' }],
    gameMVP: '',
  });
  const [editingGameId, setEditingGameId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leagueResponse = await axios.get(`/api/leagues/${leagueId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const leagueData = leagueResponse.data;
        setLeague(leagueData);

        const isAdmin = leagueData.admins?.some(admin => admin._id === user._id) || false;
        const isManager = leagueData.managers?.some(manager => manager._id === user._id) || false;
        if (!isAdmin && !isManager) {
          setError('You are not authorized to manage games for this league');
          setLoading(false);
          return;
        }

        const teamsResponse = await axios.get(`/api/teams?leagueId=${leagueId}&season=${leagueData.season || 'Season 1'}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setTeams(teamsResponse.data || []);

        const playersResponse = await axios.get(`/api/players?leagueId=${leagueId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setPlayers(playersResponse.data || []);

        const gamesResponse = await axios.get(`/api/games?leagueId=${leagueId}&season=${leagueData.season || 'Season 1'}&t=${Date.now()}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        console.log('Fetched games:', gamesResponse.data);
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
      setFormData({ ...formData, score: { ...formData.score, [field]: parseInt(value) || 0 } });
    } else if (name.includes('highlights[')) {
      const index = parseInt(name.match(/\[(\d+)\]/)[1]);
      const newHighlights = [...formData.highlights];
      newHighlights[index] = value;
      setFormData({ ...formData, highlights: newHighlights });
    } else if (name.includes('mediaLinks[')) {
      const index = parseInt(name.match(/\[(\d+)\]/)[1]);
      const field = name.split('.')[2];
      const newMediaLinks = [...formData.mediaLinks];
      newMediaLinks[index] = { ...newMediaLinks[index], [field]: value };
      setFormData({ ...formData, mediaLinks: newMediaLinks });
    } else if (name.includes('teams[')) {
      const index = parseInt(name.match(/\[(\d+)\]/)[1]);
      const newTeams = [...formData.teams];
      newTeams[index] = value;
      setFormData({ ...formData, teams: newTeams });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addHighlight = () => {
    setFormData({ ...formData, highlights: [...formData.highlights, ''] });
  };

  const removeHighlight = (index) => {
    setFormData({ ...formData, highlights: formData.highlights.filter((_, i) => i !== index) });
  };

  const addMediaLink = () => {
    setFormData({ ...formData, mediaLinks: [...formData.mediaLinks, { url: '', type: '' }] });
  };

  const removeMediaLink = (index) => {
    setFormData({ ...formData, mediaLinks: formData.mediaLinks.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.teams[0] === formData.teams[1]) {
        setError('Home and Away teams must be different');
        return;
      }

      const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
      const payload = {
        ...formData,
        date: dateTime,
        league: leagueId,
        season: league?.season || 'Season 1', // Ensure season is set
        teams: formData.teams.filter(id => id),
        gameDuration: parseInt(formData.gameDuration) || 0,
        venueCapacity: parseInt(formData.venueCapacity) || 0,
        attendance: parseInt(formData.attendance) || 0,
        fanRating: parseInt(formData.fanRating) || 0,
        highlights: formData.highlights.filter(h => h.trim() !== ''),
        mediaLinks: formData.mediaLinks.filter(link => link.url.trim() && link.type.trim()),
        isCompleted: formData.eventType === 'final' || formData.score.team1 > 0 || formData.score.team2 > 0,
      };

      if (!editingGameId) {
        delete payload.gameMVP; // Exclude gameMVP for new games
      }

      console.log('Game creation payload:', payload);

      if (editingGameId) {
        await axios.patch(`/api/games/${editingGameId}`, payload, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      } else {
        await axios.post(`/api/games`, payload, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      }

      const gamesResponse = await axios.get(`/api/games?leagueId=${leagueId}&season=${league?.season || 'Season 1'}&t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      console.log('Refreshed games:', gamesResponse.data);
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
        gameDuration: '',
        weatherConditions: '',
        referee: '',
        attendance: '',
        previousMatchupScore: '',
        fanRating: 0,
        highlights: [''],
        matchReport: '',
        mediaLinks: [{ url: '', type: '' }],
        gameMVP: '',
      });
      setEditingGameId(null);
      setError(null);
    } catch (err) {
      console.error('Save game error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to save game');
    }
  };

  const handleEditGame = (game) => {
    const date = new Date(game.date);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().slice(0, 5);
    setFormData({
      date: dateStr,
      time: timeStr,
      teams: Array.isArray(game.teams) && game.teams.length >= 2 ? game.teams.map(team => team?._id || '') : ['', ''],
      location: game.location || '',
      venue: game.venue || '',
      venueCapacity: game.venueCapacity || '',
      score: game.score || { team1: 0, team2: 0 },
      matchType: game.matchType || 'league',
      eventType: game.eventType || 'regular',
      gameDuration: game.gameDuration || '',
      weatherConditions: game.weatherConditions || '',
      referee: game.referee || '',
      attendance: game.attendance || '',
      previousMatchupScore: game.previousMatchupScore || '',
      fanRating: game.fanRating || 0,
      highlights: game.highlights?.length > 0 ? game.highlights : [''],
      matchReport: game.matchReport || '',
      mediaLinks: game.mediaLinks?.length > 0 ? game.mediaLinks : [{ url: '', type: '' }],
      gameMVP: game.gameMVP?._id || '',
    });
    setEditingGameId(game._id);
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    try {
      await axios.delete(`/api/games/${gameId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setGames(games.filter(game => game._id !== gameId));
      setError(null);
    } catch (err) {
      console.error('Delete game error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to delete game');
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
    <div className="min-h-[var(--page-height)] bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Manage Games: {league?.name || 'League'}</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/leagues/${leagueId}`)}
              className="flex items-center gap-2 bg-white text-blue-700 border border-blue-600 px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-50 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-label="Back to League"
            >
              <UsersIcon className="w-5 h-5" />
              Back to League
            </button>
          </div>
        </header>

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
                  Match Type:
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
                  Event Type:
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
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ClockIcon className="w-5 h-5 text-gray-500" />
                  Game Duration (minutes):
                </label>
                <input
                  type="number"
                  name="gameDuration"
                  value={formData.gameDuration}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <CloudIcon className="w-5 h-5 text-gray-500" />
                  Weather Conditions (optional):
                </label>
                <input
                  type="text"
                  name="weatherConditions"
                  value={formData.weatherConditions}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                  Referee (optional):
                </label>
                <input
                  type="text"
                  name="referee"
                  value={formData.referee}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <UsersIcon className="w-5 h-5 text-gray-500" />
                  Attendance (optional):
                </label>
                <input
                  type="number"
                  name="attendance"
                  value={formData.attendance}
                  onChange={handleInputChange}
                  min="0"
                  className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                  Previous Matchup Score (optional):
                </label>
                <input
                  type="text"
                  name="previousMatchupScore"
                  value={formData.previousMatchupScore}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <StarIcon className="w-5 h-5 text-gray-500" />
                  Fan Rating (optional):
                </label>
                <input
                  type="number"
                  name="fanRating"
                  value={formData.fanRating}
                  onChange={handleInputChange}
                  min="0"
                  max="10"
                  className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              {editingGameId && (
                <div className="flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <UserIcon className="w-5 h-5 text-gray-500" />
                    Game MVP (optional):
                  </label>
                  <select
                    name="gameMVP"
                    value={formData.gameMVP}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select MVP</option>
                    {players.map(player => (
                      <option key={player._id} value={player._id}>{player.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <FilmIcon className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Highlights</h3>
              </div>
              {formData.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    name={`highlights[${index}]`}
                    value={highlight}
                    onChange={handleInputChange}
                    placeholder="Enter highlight"
                    className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeHighlight(index)}
                    className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition focus:ring-2 focus:ring-red-500 focus:outline-none"
                    disabled={formData.highlights.length === 1}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addHighlight}
                className="mt-2 flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <PlusIcon className="w-4 h-4" />
                Add Highlight
              </button>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <FilmIcon className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Media Links</h3>
              </div>
              {formData.mediaLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="url"
                    name={`mediaLinks[${index}].url`}
                    value={link.url}
                    onChange={handleInputChange}
                    placeholder="Enter media URL"
                    className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    name={`mediaLinks[${index}].type`}
                    value={link.type}
                    onChange={handleInputChange}
                    placeholder="Type (e.g., video, article)"
                    className="w-1/3 p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeMediaLink(index)}
                    className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition focus:ring-2 focus:ring-red-500 focus:outline-none"
                    disabled={formData.mediaLinks.length === 1}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addMediaLink}
                className="mt-2 flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <PlusIcon className="w-4 h-4" />
                Add Media Link
              </button>
            </div>
            <div className="flex flex-col">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                Match Report (optional):
              </label>
              <textarea
                name="matchReport"
                value={formData.matchReport}
                onChange={handleInputChange}
                className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows="4"
              />
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
                      gameDuration: '',
                      weatherConditions: '',
                      referee: '',
                      attendance: '',
                      previousMatchupScore: '',
                      fanRating: 0,
                      highlights: [''],
                      matchReport: '',
                      mediaLinks: [{ url: '', type: '' }],
                      gameMVP: '',
                    });
                    setEditingGameId(null);
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

        <section className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <StarIcon className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-semibold text-gray-800">Games</h2>
          </div>
          {games.length > 0 ? (
            <div className="space-y-2">
              {games.map(game => {
                const isValidGame = game && Array.isArray(game.teams) && game.teams.length >= 2 && game.date;
                if (!isValidGame) {
                  console.warn(`Invalid game data for game ID: ${game?._id}`, game);
                  return (
                    <div key={game?._id || Math.random()} className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                        <span className="text-gray-600">Invalid game data</span>
                      </div>
                      <div className="flex gap-2">
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
                  <div key={game._id} className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                      <span>
                        {(game.teams[0]?.name || 'TBD')} vs {(game.teams[1]?.name || 'TBD')} -{' '}
                        {new Date(game.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })} - {game.matchType} ({game.eventType})
                        {game.isCompleted ? ' (Completed)' : ''}
                        {game.location && ` at ${game.location}`}
                        {game.score && ` (${game.score.team1} - ${game.score.team2})`}
                        {game.gameMVP && ` | MVP: ${game.gameMVP.name || 'Unknown'}`}
                      </span>
                    </div>
                    <div className="flex gap-2">
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
            <p className="text-gray-600">No games defined</p>
          )}
        </section>
      </div>
    </div>
  );
}
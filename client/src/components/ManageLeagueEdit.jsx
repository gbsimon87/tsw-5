import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const scoringRulesMap = {
  basketball: { twoPointFGM: 2, threePointFGM: 3, freeThrowM: 1 },
  hockey: { goal: 1 },
  soccer: { goal: 1 },
  baseball: { single: 1, double: 2, triple: 3, homeRun: 4 },
  football: { touchdown: 6, fieldGoal: 3, extraPoint: 1, twoPointConversion: 2, safety: 2 },
};

const semanticScoringRulesMap = {
  basketball: {
    twoPointFGM: 'Two-Point Field Goal Made',
    threePointFGM: 'Three-Point Field Goal Made',
    freeThrowM: 'Free Throw Made',
  },
  hockey: {
    goal: 'Goal',
  },
  soccer: {
    goal: 'Goal',
  },
  baseball: {
    single: 'Single',
    double: 'Double',
    triple: 'Triple',
    homeRun: 'Home Run',
  },
  football: {
    touchdown: 'Touchdown',
    fieldGoal: 'Field Goal',
    extraPoint: 'Extra Point',
    twoPointConversion: 'Two-Point Conversion',
    safety: 'Safety',
  },
};

export default function ManageLeagueEdit() {
  const { leagueId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    sportType: 'basketball',
    visibility: 'public',
    logo: '',
    location: '',
    establishedYear: '',
    isActive: true,
    settings: {
      periodType: 'halves',
      periodDuration: 24,
      overtimeDuration: 5,
      scoringRules: scoringRulesMap['basketball'],
    },
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState(null);
  // Add new state variables in the component
  const [newSeasonData, setNewSeasonData] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });
  const [carryOverTeams, setCarryOverTeams] = useState([]);
  const [previousSeasonTeams, setPreviousSeasonTeams] = useState([]);

  // Add useEffect to fetch previous season teams
  // Modify the existing fetchLeague useEffect to include fetching previous season teams
  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const response = await axios.get(`/api/leagues/${leagueId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
          validateStatus: (status) => status >= 200 && status < 300,
        });
        const leagueData = response.data;

        if (leagueData) {
          setLeague(leagueData);
          setFormData({
            name: leagueData.name,
            sportType: leagueData.sportType,
            visibility: leagueData.visibility,
            logo: leagueData.logo || '',
            location: leagueData.location || '',
            establishedYear: leagueData.establishedYear || '',
            isActive: leagueData.isActive,
            settings: {
              periodType: leagueData.settings.periodType,
              periodDuration: leagueData.settings.periodDuration,
              overtimeDuration: leagueData.settings.overtimeDuration,
              scoringRules: leagueData.settings.scoringRules,
            },
          });
        }

        // Fetch previous season teams if a season is active
        if (leagueData.season) {
          try {
            const teamsResponse = await axios.get(`/api/teams?leagueId=${leagueId}&season=${leagueData.season}`, {
              headers: { Authorization: `Bearer ${user.token}` },
            });
            setPreviousSeasonTeams(teamsResponse.data);
          } catch (err) {
            setError('Failed to fetch previous season teams');
          }
        } else {
          setPreviousSeasonTeams([]);
        }

        setLoading(false);
      } catch (err) {
        setError(
          err.response?.status === 403
            ? 'You are not authorized to edit this league'
            : 'Failed to fetch league'
        );
        setLoading(false);
      }
    };
    fetchLeague();
  }, [leagueId, user.token]);

  // Add new handlers
  const handleSeasonInputChange = (e) => {
    const { name, value } = e.target;
    setNewSeasonData({ ...newSeasonData, [name]: value });
  };

  const handleEndSeason = async () => {
    try {
      const response = await axios.patch(
        `/api/leagues/${leagueId}/end-season`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setLeague(response.data);
      setPreviousSeasonTeams([]); // Clear previous season teams since no season is active
      setCarryOverTeams([]); // Reset selected teams
      setError(null);
    } catch (err) {
      console.error('End season client error:', err.response || err);
      setError(err.response?.data?.error || 'Failed to end season');
    }
  };

  const handleCreateSeason = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `/api/leagues/${leagueId}/seasons`,
        newSeasonData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setLeague(response.data);
      setNewSeasonData({ name: '', startDate: '', endDate: '' });
      setCarryOverTeams([]);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create season');
    }
  };

  const handleCarryOverTeams = async () => {
    try {
      const response = await axios.post(
        `/api/leagues/${leagueId}/teams/carry-over`,
        { teamIds: carryOverTeams, newSeason: league.season },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setPreviousSeasonTeams(response.data);
      setCarryOverTeams([]);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to carry over teams');
    }
  };

  const toggleTeamSelection = (teamId) => {
    setCarryOverTeams(prev =>
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('settings.')) {
      const field = name.split('.')[1];
      if (field === 'scoringRules') {
        const ruleKey = e.target.dataset.rule;
        setFormData({
          ...formData,
          settings: {
            ...formData.settings,
            scoringRules: {
              ...formData.settings.scoringRules,
              [ruleKey]: parseFloat(value),
            },
          },
        });
      } else {
        setFormData({
          ...formData,
          settings: {
            ...formData.settings,
            [field]: type === 'number' ? parseFloat(value) : value,
          },
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/leagues/${leagueId}`, formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      navigate(`/leagues/${leagueId}`);
    } catch (err) {
      setError(
        err.response?.status === 403
          ? 'You are not authorized to edit this league'
          : 'Failed to update league'
      );
    }
  };

  // Update scoringRules when sportType changes
  useEffect(() => {
    if (formData.sportType !== formData.settings.scoringRules.sportType) {
      setFormData({
        ...formData,
        settings: {
          ...formData.settings,
          scoringRules: scoringRulesMap[formData.sportType] || {},
        },
      });
    }
  }, [formData.sportType]);

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  return (
    <div className="flex items-center justify-center">
      <div className="w-full min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">{formData.name}</h1>
            <h2 className="text-2xl font-semibold mb-4">Edit Details</h2>
            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name:</label>
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
                <label className="block text-sm font-medium text-gray-700">Sport Type:</label>
                <select
                  name="sportType"
                  value={formData.sportType}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="basketball">Basketball</option>
                  <option value="soccer">Soccer</option>
                  <option value="baseball">Baseball</option>
                  <option value="hockey">Hockey</option>
                  <option value="football">Football</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Visibility:</label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Location (optional):</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Established Year (optional):</label>
                <input
                  type="number"
                  name="establishedYear"
                  value={formData.establishedYear}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Active:</label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Period Type:</label>
                <select
                  name="settings.periodType"
                  value={formData.settings.periodType}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="halves">Halves</option>
                  <option value="quarters">Quarters</option>
                  <option value="periods">Periods</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Period Duration (minutes):</label>
                <input
                  type="number"
                  name="settings.periodDuration"
                  value={formData.settings.periodDuration}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Overtime Duration (minutes):</label>
                <input
                  type="number"
                  name="settings.overtimeDuration"
                  value={formData.settings.overtimeDuration}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Scoring Rules:</label>
                <div className="space-y-2 ml-4">
                  {Object.keys(formData.settings.scoringRules).map((rule) => (
                    <div key={rule} className="flex items-center">
                      <label className="text-sm text-gray-600">
                        {semanticScoringRulesMap[formData.sportType][rule] || rule}:
                      </label>
                      <input
                        type="number"
                        name="settings.scoringRules"
                        data-rule={rule}
                        value={formData.settings.scoringRules[rule]}
                        onChange={handleInputChange}
                        min="0"
                        className="ml-2 w-24 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  Save League Changes
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/leagues/${leagueId}`)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition focus:ring-2 focus:ring-gray-500 focus:outline-none"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Season Management</h2>
              {league.season && league.seasons.some(s => s.isActive) && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Current Season: {league.season}</h3>
                  <button
                    onClick={handleEndSeason}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition focus:ring-2 focus:ring-red-500 focus:outline-none flex items-center"
                  >
                    <TrashIcon className="w-5 h-5 mr-2" />
                    End Current Season
                  </button>
                </div>
              )}
              <h3 className="text-lg font-medium mb-2">Create New Season</h3>
              <form onSubmit={handleCreateSeason} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Season Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={newSeasonData.name}
                    onChange={handleSeasonInputChange}
                    required
                    className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date:</label>
                  <input
                    type="date"
                    name="startDate"
                    value={newSeasonData.startDate}
                    onChange={handleSeasonInputChange}
                    required
                    className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date:</label>
                  <input
                    type="date"
                    name="endDate"
                    value={newSeasonData.endDate}
                    onChange={handleSeasonInputChange}
                    required
                    className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none flex items-center justify-center"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Season
                </button>
              </form>
              {previousSeasonTeams.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Carry Over Teams from Previous Season</h3>
                  <div className="space-y-2">
                    {previousSeasonTeams.map((team) => (
                      <div key={team._id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={carryOverTeams.includes(team._id)}
                          onChange={() => toggleTeamSelection(team._id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2">{team.name}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleCarryOverTeams}
                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition focus:ring-2 focus:ring-green-500 focus:outline-none flex items-center"
                    disabled={carryOverTeams.length === 0}
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Carry Over Selected Teams
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

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

export default function LeagueEdit() {
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

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const response = await axios.get(`/api/leagues/${leagueId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const league = response.data;
        setFormData({
          name: league.name,
          sportType: league.sportType,
          visibility: league.visibility,
          logo: league.logo || '',
          location: league.location || '',
          establishedYear: league.establishedYear || '',
          isActive: league.isActive,
          settings: {
            periodType: league.settings.periodType,
            periodDuration: league.settings.periodDuration,
            overtimeDuration: league.settings.overtimeDuration,
            scoringRules: league.settings.scoringRules,
          },
        });
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
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 backdrop-blur-md p-8 rounded-xl shadow-lg w-full max-w-4xl border border-white/20">
        <h1 className="text-2xl font-bold mb-6 text-blue-800">Edit League: {formData.name}</h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              Save Changes
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
    </div>
  );
}
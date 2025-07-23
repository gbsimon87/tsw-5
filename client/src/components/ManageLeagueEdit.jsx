import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FlagIcon,
  TrophyIcon,
  EyeIcon,
  MapPinIcon,
  ClockIcon,
  Cog6ToothIcon,
  UsersIcon,
  ListBulletIcon,
  CalendarIcon,
  CalendarDaysIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const scoringRulesMap = {
  basketball: { twoPointFGM: 2, threePointFGM: 3, freeThrowM: 1 },
  hockey: { goal: 1 },
  football: { goal: 1 },
  baseball: { single: 1, double: 2, triple: 3, homeRun: 4 },
  americanFootball: { touchdown: 6, fieldGoal: 3, extraPoint: 1, twoPointConversion: 2, safety: 2 },
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
  football: {
    goal: 'Goal',
  },
  baseball: {
    single: 'Single',
    double: 'Double',
    triple: 'Triple',
    homeRun: 'Home Run',
  },
  americanFootball: {
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

        {/* League Details */}
        <section>
          <header className="flex flex-col mb-8 gap-4">
            <h1 className="text-2xl font-bold text-gray-800">
              {league.name}
            </h1>
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/leagues/${leagueId}`}
                className="flex flex-1 items-center gap-2 px-4 py-1.5 rounded-lg font-semibold transition focus:ring-2 focus:ring-blue-500 focus:outline-none bg-blue-600 text-white"
                aria-label="Edit League"
              >
                <PencilSquareIcon className="w-5 h-5" />
                League
              </Link>
              <Link
                to={`/leagues/${leagueId}/games`}
                className="flex flex-1 items-center gap-2 bg-white text-blue-700 border border-blue-600 px-3 py-1.5 text-sm rounded-lg font-semibold shadow hover:bg-blue-50 transition focus:ring-2 focus:ring-blue-500 focus:outline-none sm:px-5 sm:py-2 sm:text-base"
                aria-label="Manage Games"
              >
                <CalendarDaysIcon className="w-5 h-5" />
                Games
              </Link>
              <Link
                to={`/leagues/${leagueId}/teams`}
                className="flex flex-1 items-center gap-2 bg-white text-blue-700 border border-blue-600 px-3 py-1.5 text-sm rounded-lg font-semibold shadow hover:bg-blue-50 transition focus:ring-2 focus:ring-blue-500 focus:outline-none sm:px-5 sm:py-2 sm:text-base"
                aria-label="Manage Teams"
              >
                <UsersIcon className="w-5 h-5" />
                Teams
              </Link>
            </div>
          </header>

          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <form id="leagueForm" onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <TrophyIcon className="w-5 h-5 text-gray-500" />
                  Name:
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
                  <TrophyIcon className="w-5 h-5 text-gray-500" />
                  Sport Type:
                </label>
                <select
                  name="sportType"
                  value={formData.sportType}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="basketball">Basketball</option>
                  <option value="football">Football</option>
                  <option value="baseball">Baseball</option>
                  <option value="hockey">Hockey</option>
                  <option value="americanFootball">Ame. Football</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <EyeIcon className="w-5 h-5 text-gray-500" />
                  Visibility:
                </label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
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
                  <ClockIcon className="w-5 h-5 text-gray-500" />
                  Established Year (optional):
                </label>
                <input
                  type="number"
                  name="establishedYear"
                  value={formData.establishedYear}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FlagIcon className="w-5 h-5 text-gray-500" />
                  Active:
                </label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Cog6ToothIcon className="w-5 h-5 text-gray-500" />
                  Period Type:
                </label>
                <select
                  name="settings.periodType"
                  value={formData.settings.periodType}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="halves">Halves</option>
                  <option value="quarters">Quarters</option>
                  <option value="periods">Periods</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ClockIcon className="w-5 h-5 text-gray-500" />
                  Period Duration (minutes):
                </label>
                <input
                  type="number"
                  name="settings.periodDuration"
                  value={formData.settings.periodDuration}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ClockIcon className="w-5 h-5 text-gray-500" />
                  Overtime Duration (minutes):
                </label>
                <input
                  type="number"
                  name="settings.overtimeDuration"
                  value={formData.settings.overtimeDuration}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="mt-1 w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <ListBulletIcon className="w-5 h-5 mr-3 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Scoring Rules</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(formData.settings.scoringRules).map((rule) => (
                  <div key={rule} className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                    <ListBulletIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                    <span className="font-medium text-gray-600">
                      {semanticScoringRulesMap[formData.sportType][rule] || rule}:
                    </span>
                    <input
                      type="number"
                      name="settings.scoringRules"
                      data-rule={rule}
                      value={formData.settings.scoringRules[rule]}
                      onChange={handleInputChange}
                      min="0"
                      className="ml-2 w-24 p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </form>
        </section>

        {/* Season Management */}
        <section className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <CalendarIcon className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-semibold text-gray-800">Season Management</h2>
          </div>
          <p className="text-gray-600 text-lg">Coming soon</p>
        </section>

      </div>
    </div>
  );
}
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
import Skeleton from 'react-loading-skeleton';
import Unauthorized from './Unauthorized';
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
        const leagueResponse = await axios.get(`/api/leagues/${leagueId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
          validateStatus: (status) => status >= 200 && status < 300,
        });
        const leagueData = leagueResponse.data;

        const isAdmin = leagueData.admins?.some(admin => admin._id === user._id) || false;
        const isManager = leagueData.managers?.some(manager => manager._id === user._id) || false;
        if (!isAdmin && !isManager) {
          setError('You are not authorised to edit this league');
          setLoading(false);
          return;
        }

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
            ? 'You are not authorised to edit this league'
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
      toast.success('League updated successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
      navigate(`/leagues/${leagueId}`);
    } catch (err) {
      const errorMessage = err.response?.status === 403
        ? 'You are not authorised to edit this league'
        : 'Failed to update league';
      setError(errorMessage);
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
      <div className="min-h-[var(--page-height)] bg-gray-50 py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-4" role="status" aria-live="assertive">
          {/* Header Skeleton */}
          <div className="mb-4">
            <Skeleton height={32} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
            <div className="flex flex-wrap gap-3 mt-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={`link-${i}`} height={40} width={120} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
              ))}
            </div>
          </div>
          {/* League Details Skeleton */}
          <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8" role="region" aria-label="League Details">
            <Skeleton height={28} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-4" aria-hidden="true" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={`form-field-${i}`} className="flex flex-col">
                  <Skeleton height={16} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-1" aria-hidden="true" />
                  <Skeleton height={40} width="100%" baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Skeleton height={20} width={120} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-2" aria-hidden="true" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={`scoring-rule-${i}`} className="flex items-center gap-2">
                    <Skeleton circle height={16} width={16} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                    <Skeleton height={16} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                    <Skeleton height={40} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton height={44} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mt-4" aria-hidden="true" />
          </section>
          {/* Season Management Skeleton */}
          <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100" role="region" aria-label="Season Management">
            <Skeleton height={28} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-4" aria-hidden="true" />
            <Skeleton height={20} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
          </section>
        </div>
      </div>
    );
  }

  if (error === 'You are not authorised to edit this league') {
    return <Unauthorized />;
  }

  if (error) {
    return (
      <div className="min-h-[var(--page-height)] bg-gray-50 flex items-center justify-center" role="alert" aria-live="assertive">
        <p className="text-center text-red-600 text-lg py-4 px-6 bg-white rounded-xl shadow-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[var(--page-height)] bg-gray-50 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* League Details */}
        <section role="region" aria-labelledby="league-details">
          <header className="flex flex-col mb-8 gap-4">
            <h1 id="league-details" className="text-xl md:text-2xl font-bold text-gray-900">
              {league?.name || 'Unnamed League'}
            </h1>
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/leagues/${leagueId}`}
                className="flex flex-1 items-center gap-2 px-4 py-1.5 rounded-lg font-semibold transition focus:ring-2 focus:ring-blue-600 focus:outline-none bg-blue-600 text-white"
                aria-label="View league details"
              >
                <PencilSquareIcon className="w-5 h-5" aria-hidden="true" />
                League
              </Link>
              <Link
                to={`/leagues/${leagueId}/games`}
                className="flex flex-1 items-center gap-2 bg-white text-blue-700 border border-blue-600 px-3 py-1.5 text-sm rounded-lg font-semibold shadow hover:bg-blue-50 transition focus:ring-2 focus:ring-blue-600 focus:outline-none sm:px-5 sm:text-base"
                aria-label="Manage league games"
              >
                <CalendarDaysIcon className="w-5 h-5" aria-hidden="true" />
                Games
              </Link>
              <Link
                to={`/leagues/${leagueId}/teams`}
                className="flex flex-1 items-center gap-2 bg-white text-blue-700 border border-blue-600 px-3 py-1.5 text-sm rounded-lg font-semibold shadow hover:bg-blue-50 transition focus:ring-2 focus:ring-blue-600 focus:outline-none sm:px-5 sm:text-base"
                aria-label="Manage league teams"
              >
                <UsersIcon className="w-5 h-5" aria-hidden="true" />
                Teams
              </Link>
            </div>
          </header>

          {error && (
            <p className="text-red-600 mb-4 text-center" role="alert" aria-live="assertive">
              {error}
            </p>
          )}
          <form
            id="leagueForm"
            onSubmit={handleSubmit}
            className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 mb-8"
            role="form"
            aria-labelledby="league-form-title"
          >
            <h2 id="league-form-title" className="text-xl font-bold text-gray-900 mb-4">
              Edit League
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label htmlFor="league-name" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <TrophyIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  Name
                </label>
                <input
                  id="league-name"
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
                <label htmlFor="league-sport-type" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <TrophyIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  Sport Type
                </label>
                <select
                  id="league-sport-type"
                  name="sportType"
                  value={formData?.sportType || 'basketball'}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  aria-required="true"
                >
                  <option value="basketball">Basketball</option>
                  <option value="football">Football</option>
                  <option value="baseball">Baseball</option>
                  <option value="hockey">Hockey</option>
                  <option value="americanFootball">American Football</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="league-visibility" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <EyeIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  Visibility
                </label>
                <select
                  id="league-visibility"
                  name="visibility"
                  value={formData?.visibility || 'public'}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  aria-required="true"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="league-location" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <MapPinIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  Location (optional)
                </label>
                <input
                  id="league-location"
                  type="text"
                  name="location"
                  value={formData?.location || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="league-established-year" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <ClockIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  Established Year (optional)
                </label>
                <input
                  id="league-established-year"
                  type="number"
                  name="establishedYear"
                  value={formData?.establishedYear || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="league-is-active" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FlagIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  Active
                </label>
                <input
                  id="league-is-active"
                  type="checkbox"
                  name="isActive"
                  checked={formData?.isActive || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-200 rounded focus:ring-2 focus:ring-blue-600"
                  aria-checked={formData?.isActive || false}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="league-period-type" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Cog6ToothIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  Period Type
                </label>
                <select
                  id="league-period-type"
                  name="settings.periodType"
                  value={formData?.settings?.periodType || 'halves'}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  aria-required="true"
                >
                  <option value="halves">Halves</option>
                  <option value="quarters">Quarters</option>
                  <option value="periods">Periods</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="league-period-duration" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <ClockIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  Period Duration (minutes)
                </label>
                <input
                  id="league-period-duration"
                  type="number"
                  name="settings.periodDuration"
                  value={formData?.settings?.periodDuration || ''}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  aria-required="true"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="league-overtime-duration" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <ClockIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  Overtime Duration (minutes)
                </label>
                <input
                  id="league-overtime-duration"
                  type="number"
                  name="settings.overtimeDuration"
                  value={formData?.settings?.overtimeDuration || ''}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  aria-required="true"
                />
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center mb-3">
                <ListBulletIcon className="w-5 h-5 mr-3 text-gray-600" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-gray-900">Scoring Rules</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(formData?.settings?.scoringRules || {}).map((rule) => (
                  <div key={rule} className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                    <ListBulletIcon className="w-4 h-4 mr-2.5 text-gray-600" aria-hidden="true" />
                    <span className="font-medium text-gray-600">
                      {semanticScoringRulesMap[formData?.sportType || 'basketball'][rule] || rule}
                    </span>
                    <input
                      id={`scoring-rule-${rule}`}
                      type="number"
                      name="settings.scoringRules"
                      data-rule={rule}
                      value={formData?.settings?.scoringRules[rule] || 0}
                      onChange={handleInputChange}
                      min="0"
                      className="ml-2 w-24 p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      aria-label={`Points for ${semanticScoringRulesMap[formData?.sportType || 'basketball'][rule] || rule}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                className="flex-1 flex items-center gap-2 justify-center bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-600 focus:outline-none"
                aria-label="Save league changes"
              >
                <PencilSquareIcon className="w-5 h-5" aria-hidden="true" />
                Save Changes
              </button>
            </div>
          </form>
        </section>

        {/* Season Management */}
        <section
          className="bg-white shadow-lg rounded-xl p-6 border border-gray-100"
          role="region"
          aria-labelledby="season-management"
        >
          <div className="flex items-center gap-3 mb-4">
            <CalendarIcon className="w-6 h-6 text-gray-700" aria-hidden="true" />
            <h2 id="season-management" className="text-xl md:text-2xl font-bold text-gray-900">
              Season Management
            </h2>
          </div>
          <p className="text-gray-600 text-base" role="alert" aria-live="polite">
            Coming soon
          </p>
        </section>
      </div>
    </div>
  );
}
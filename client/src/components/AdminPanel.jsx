import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
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

export default function AdminPanel() {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    location: '',
    sportType: 'basketball',
    visibility: 'public',
    settings: {
      periodType: 'halves',
      periodDuration: 12,
      overtimeDuration: 5,
      foulOutLimit: 6,
      scoringRules: scoringRulesMap['basketball'],
    },
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/leagues', {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(response => {
        setLeagues(response.data);
        setLoading(false);
      })
      .catch(err => {
        const errorMessage = err.response?.data?.error || 'Failed to fetch leagues';
        setError(errorMessage);
        setLoading(false);
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'light',
        });
      });
  }, [user.token]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
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
        [name]: value, // Remove trim() to allow spaces
        ...(name === 'sportType' && value !== 'basketball' ? {
          settings: {
            ...formData.settings,
            foulOutLimit: undefined,
            scoringRules: scoringRulesMap[value] || {},
            periodType: value === 'hockey' ? 'periods' : 'halves',
            periodDuration: value === 'hockey' ? 20 : value === 'basketball' ? 24 : 45,
            overtimeDuration: value === 'football' ? 15 : 5,
          }
        } : {}),
        ...(name === 'sportType' && value === 'basketball' ? {
          settings: {
            ...formData.settings,
            foulOutLimit: 6,
            scoringRules: scoringRulesMap['basketball'],
            periodType: 'halves',
            periodDuration: 24,
            overtimeDuration: 5,
          }
        } : {}),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const trimmedFormData = {
        ...formData,
        name: formData.name.trim(), // Trim only on submit
      };
      const response = await axios.post('/api/leagues', trimmedFormData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setLeagues([...leagues, response.data]);
      setFormData({
        name: '',
        logo: '',
        location: '',
        sportType: 'basketball',
        visibility: 'public',
        settings: {
          periodType: 'halves',
          periodDuration: 24,
          overtimeDuration: 5,
          foulOutLimit: 6,
          scoringRules: scoringRulesMap['basketball'],
        },
      });
      setError(null);
      toast.success('League created successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create league';
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

  return (
    <div className="min-h-[var(--page-height)] flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-slate-800 py-10 px-4">
      <div className="w-full max-w-5xl">
        {loading ? (
          <div className="flex flex-col gap-4" role="status" aria-live="assertive">
            {/* Header Skeleton */}
            <div className="text-center mb-10">
              <Skeleton height={36} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mx-auto mb-2" aria-hidden="true" />
              <Skeleton height={16} width={300} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mx-auto" aria-hidden="true" />
            </div>

            {/* Your Leagues Skeleton */}
            <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100" role="region" aria-label="Your Leagues">
              <Skeleton height={28} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-6" aria-hidden="true" />
              <div className="space-y-6">
                {[...Array(3)].map((_, index) => (
                  <div key={`league-skeleton-${index}`} className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton height={20} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                      <Skeleton height={20} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton height={16} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                      <Skeleton height={16} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Create League Skeleton */}
            <section className="bg-white shadow-lg rounded-xl p-6 border border-gray-100" role="region" aria-label="Create New League">
              <Skeleton height={28} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-6" aria-hidden="true" />
              <div className="space-y-6">
                {[...Array(8)].map((_, index) => (
                  <div key={`form-skeleton-${index}`} className="flex items-center gap-3">
                    <Skeleton height={16} width={100} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                    <Skeleton height={40} width="100%" baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </div>
                ))}
                <Skeleton height={44} width="100%" baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
              </div>
            </section>
          </div>
        ) : (
          <>
            {error && (
              <div className="max-w-5xl mx-auto mt-4 bg-white rounded-xl p-4" role="alert" aria-live="assertive">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <header className="mb-10">
              <h1 className="text-3xl font-extrabold mb-2 text-center text-white drop-shadow" id="admin-panel-title">
                Admin Panel
              </h1>
              <p className="text-blue-100 text-center">Manage your leagues and create new ones</p>
            </header>

            <div className="flex flex-col gap-8">
              {/* Your Leagues Card */}
              <section
                className="bg-white shadow-lg rounded-xl p-6 border border-gray-100"
                role="region"
                aria-labelledby="your-leagues"
              >
                <h2 id="your-leagues" className="text-base md:text-2xl font-bold text-gray-900 mb-6 break-words">
                  Your Leagues
                </h2>
                {leagues?.length === 0 ? (
                  <p className="text-gray-600" role="alert" aria-live="polite">
                    You do not manage any leagues.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {leagues.map((league) => (
                      <article
                        key={league?._id || `league-${Math.random()}`}
                        className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col hover:shadow-xl transition"
                        aria-label={`League card for ${league?.name || 'Unknown'}`}
                      >
                        <header className="mb-3 flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-900 break-words">
                            {league?.admins?.includes(user?._id) ? (
                              <Link
                                to={`/leagues/${league?._id}`}
                                className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600"
                                aria-label={`View details for ${league?.name || 'Unknown'} league`}
                              >
                                {league?.name || 'Unknown'}
                              </Link>
                            ) : (
                              league?.name || 'Unknown'
                            )}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${league?.visibility === 'public'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                            aria-label={`Visibility: ${league?.visibility || 'Unknown'}`}
                          >
                            {league?.visibility
                              ? league.visibility.charAt(0).toUpperCase() + league.visibility.slice(1)
                              : 'Unknown'}
                          </span>
                        </header>
                        <dl className="space-y-2" role="definition">
                          <div className="flex gap-3 items-center">
                            <dt className="text-gray-600 font-medium min-w-[100px]">Sport:</dt>
                            <dd className="text-gray-900">{league?.sportType || 'Not specified'}</dd>
                          </div>
                          <div className="flex gap-3 items-center">
                            <dt className="text-gray-600 font-medium min-w-[100px]">Role:</dt>
                            <dd
                              className={
                                league?.admins?.includes(user?._id)
                                  ? 'text-green-700 font-semibold'
                                  : 'text-amber-700 font-semibold'
                              }
                            >
                              {league?.admins?.includes(user?._id) ? 'Admin' : 'Manager'}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* Create League Card */}
              {/* <section
                className="bg-white shadow-lg rounded-xl p-6 border border-gray-100"
                role="region"
                aria-labelledby="create-league"
              >
                <h2 id="create-league" className="text-base md:text-2xl font-bold text-gray-900 mb-6 break-words">
                  Create New League
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData?.name || ''}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label htmlFor="sportType" className="block text-sm font-medium text-gray-700 mb-1">
                      Sport Type
                    </label>
                    <select
                      id="sportType"
                      name="sportType"
                      value={formData?.sportType || 'basketball'}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      aria-required="true"
                    >
                      <option value="basketball">Basketball</option>
                      <option value="football">Football</option>
                      <option value="baseball">Baseball</option>
                      <option value="hockey">Hockey</option>
                      <option value="americanFootball">American Football</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
                      Visibility
                    </label>
                    <select
                      id="visibility"
                      name="visibility"
                      value={formData?.visibility || 'public'}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      aria-required="true"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="periodType" className="block text-sm font-medium text-gray-700 mb-1">
                      Period Type
                    </label>
                    <select
                      id="periodType"
                      name="settings.periodType"
                      value={formData?.settings?.periodType || 'halves'}
                      onChange={handleInputChange}
                      required
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      aria-required="true"
                    >
                      <option value="halves">Halves</option>
                      <option value="quarters">Quarters</option>
                      <option value="periods">Periods</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="periodDuration"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Period Duration (minutes)
                    </label>
                    <input
                      id="periodDuration"
                      type="number"
                      name="settings.periodDuration"
                      value={formData?.settings?.periodDuration || ''}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="overtimeDuration"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Overtime Duration (minutes)
                    </label>
                    <input
                      id="overtimeDuration"
                      type="number"
                      name="settings.overtimeDuration"
                      value={formData?.settings?.overtimeDuration || ''}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      aria-required="true"
                    />
                  </div>
                  {formData?.sportType === 'basketball' && (
                    <div>
                      <label
                        htmlFor="foulOutLimit"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Foul Out Limit
                      </label>
                      <input
                        id="foulOutLimit"
                        type="number"
                        name="settings.foulOutLimit"
                        value={formData?.settings?.foulOutLimit || ''}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                        aria-required="true"
                      />
                    </div>
                  )}
                  <div>
                    <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                      Logo URL (optional)
                    </label>
                    <input
                      id="logo"
                      type="url"
                      name="logo"
                      value={formData?.logo || ''}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Location (optional)
                    </label>
                    <input
                      id="location"
                      type="text"
                      name="location"
                      value={formData?.location || ''}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scoring Rules (optional)
                    </label>
                    <div className="space-y-2">
                      {Object.keys(formData?.settings?.scoringRules || {}).map((rule) => (
                        <div key={rule} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 min-w-[200px]">
                            {semanticScoringRulesMap[formData?.sportType]?.[rule] || rule} (optional):
                          </span>
                          <input
                            id={`scoringRule-${rule}`}
                            type="number"
                            name="settings.scoringRules"
                            data-rule={rule}
                            value={formData?.settings?.scoringRules?.[rule] || ''}
                            onChange={handleInputChange}
                            min="0"
                            className="w-24 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    aria-label="Create new league"
                  >
                    Create League
                  </button>
                </form>
              </section> */}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
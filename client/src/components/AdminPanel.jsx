import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

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
      scoringRules: scoringRulesMap['basketball'],
    },
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/leagues', {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(response => setLeagues(response.data))
      .catch(err => setError('Failed to fetch leagues'));
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
        [name]: name === 'name' ? value.trim() : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/leagues', formData, {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-slate-800 py-10 px-4">
      <div className="w-full max-w-3xl">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold mb-2 text-center text-white drop-shadow">
            Admin Panel
          </h1>
          <p className="text-blue-100 text-center">
            Manage your leagues and create new ones
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {/* Your Leagues Card */}
          <section
            aria-labelledby="your-leagues"
            className="bg-gradient-to-br from-blue-50 to-slate-100 border border-blue-200 shadow-lg rounded-2xl p-8"
          >
            <h2 id="your-leagues" className="text-xl font-semibold mb-6 text-blue-800">
              Your Leagues
            </h2>
            {error && <p className="text-red-500 mb-6 text-center">{error}</p>}
            {leagues.length === 0 ? (
              <p className="text-gray-500">You do not manage any leagues.</p>
            ) : (
              <div className="space-y-6">
                {leagues.map(league => (
                  <article
                    key={league._id}
                    className="bg-gradient-to-br from-white to-blue-50 border border-blue-100 rounded-lg shadow flex flex-col p-6 hover:shadow-xl transition"
                    aria-label={`League card for ${league.name}`}
                  >
                    <header className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-blue-700">
                        {league.admins.includes(user._id) ? (
                          <Link to={`/leagues/${league._id}`} className="hover:underline">
                            {league.name}
                          </Link>
                        ) : (
                          league.name
                        )}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold
                        ${league.visibility === 'public'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-slate-200 text-slate-700 border border-slate-300'}
                      `}>
                        {league.visibility.charAt(0).toUpperCase() + league.visibility.slice(1)}
                      </span>
                    </header>
                    <dl className="space-y-2">
                      <div className="flex gap-3 items-center">
                        <dt className="text-slate-500 font-medium min-w-[100px]">Sport:</dt>
                        <dd className="text-slate-800">{league.sportType}</dd>
                      </div>
                      <div className="flex gap-3 items-center">
                        <dt className="text-slate-500 font-medium min-w-[100px]">Role:</dt>
                        <dd className={league.admins.includes(user._id)
                          ? "text-green-700 font-semibold"
                          : "text-amber-700 font-semibold"}>
                          {league.admins.includes(user._id) ? 'Admin' : 'Manager'}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Create League Card */}
          <section
            aria-labelledby="create-league"
            className="bg-gradient-to-br from-green-50 to-blue-100 border border-green-200 shadow-lg rounded-2xl p-8"
          >
            <h2 id="create-league" className="text-xl font-semibold mb-6 text-green-800">
              Create New League
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sport Type</label>
                <select
                  name="sportType"
                  value={formData.sportType}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="basketball">Basketball</option>
                  <option value="football">Football</option>
                  <option value="baseball">Baseball</option>
                  <option value="hockey">Hockey</option>
                  <option value="americanFootball">Ame. Football</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Visibility</label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Period Type</label>
                <select
                  name="settings.periodType"
                  value={formData.settings.periodType}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="halves">Halves</option>
                  <option value="quarters">Quarters</option>
                  <option value="periods">Periods</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Period Duration (minutes)</label>
                <input
                  type="number"
                  name="settings.periodDuration"
                  value={formData.settings.periodDuration}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Overtime Duration (minutes)</label>
                <input
                  type="number"
                  name="settings.overtimeDuration"
                  value={formData.settings.overtimeDuration}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL (optional)</label>
                <input
                  type="url"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location (optional)</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Scoring Rules (optional)</label>
                <div className="space-y-2">
                  {Object.keys(formData.settings.scoringRules).map((rule) => (
                    <div key={rule} className="flex items-center">
                      <span className="text-sm text-slate-600 min-w-[200px]">
                        {semanticScoringRulesMap[formData.sportType][rule] || rule} (optional):
                      </span>
                      <input
                        type="number"
                        name="settings.scoringRules"
                        data-rule={rule}
                        value={formData.settings.scoringRules[rule]}
                        onChange={handleInputChange}
                        min="0"
                        className="w-24 p-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                Create League
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

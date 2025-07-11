import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function AdminPanel() {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    location: '',
    sportType: 'basketball',
    visibility: 'public'
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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/leagues', formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setLeagues([...leagues, response.data]);
      setFormData({ name: '', logo: '', location: '', sportType: 'basketball', visibility: 'public' });
      setError(null);
    } catch (err) {
      setError('Failed to create league');
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

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function AdminPanel() {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    picture: '',
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
      setFormData({ name: '', picture: '', location: '', sportType: 'basketball', visibility: 'private' });
      setError(null);
    } catch (err) {
      setError('Failed to create league');
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Panel</h1>
        <h2 className="text-lg font-semibold mb-4">Your Leagues</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {leagues.length === 0 ? (
          <p className="text-center">No leagues found.</p>
        ) : (
          <ul className="space-y-2">
            {leagues.map(league => (
              <li key={league._id} className="p-2 bg-gray-50 rounded">
                {league.name} ({league.sportType}, {league.visibility}) - {league.admins.includes(user._id) ? 'Admin' : 'Manager'}
              </li>
            ))}
          </ul>
        )}
        <h2 className="text-lg font-semibold mt-6 mb-4">Create New League</h2>
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
            <label className="block text-sm font-medium text-gray-700">Picture URL (optional):</label>
            <input
              type="url"
              name="picture"
              value={formData.picture}
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
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          >
            Create League
          </button>
        </form>
      </div>
    </div>
  );
}
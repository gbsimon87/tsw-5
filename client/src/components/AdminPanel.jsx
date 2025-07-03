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
    <div className="App">
      <h1>Admin Panel</h1>
      <h2>Your Leagues</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {leagues.length === 0 ? (
        <p>No leagues found.</p>
      ) : (
        <ul>
          {leagues.map(league => (
            <li key={league._id}>
              {league.name} ({league.sportType}, {league.visibility}) - {league.admins.includes(user._id) ? 'Admin' : 'Manager'}
            </li>
          ))}
        </ul>
      )}

      <h2>Create New League</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Picture URL (optional):</label>
          <input
            type="url"
            name="picture"
            value={formData.picture}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Location (optional):</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Sport Type:</label>
          <select
            name="sportType"
            value={formData.sportType}
            onChange={handleInputChange}
            required
          >
            <option value="basketball">Basketball</option>
            <option value="soccer">Soccer</option>
            <option value="baseball">Baseball</option>
            <option value="hockey">Hockey</option>
            <option value="football">Football</option>
          </select>
        </div>
        <div>
          <label>Visibility:</label>
          <select
            name="visibility"
            value={formData.visibility}
            onChange={handleInputChange}
            required
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <button type="submit">Create League</button>
      </form>
      <nav>
        <Link to="/">Home</Link> | <Link to="/about">About</Link> | <Link to="/dashboard">Dashboard</Link> | <Link to="/admin">Admin</Link>
      </nav>
    </div>
  );
}
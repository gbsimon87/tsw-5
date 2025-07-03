import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function TeamJoin() {
  const { user } = useAuth();
  const [joinFormData, setJoinFormData] = useState({ secretKey: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleJoinInputChange = (e) => {
    const { name, value } = e.target;
    setJoinFormData({ ...joinFormData, [name]: value });
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        '/api/teams/join',
        { secretKey: joinFormData.secretKey },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSuccess(`Successfully joined team: ${response.data.name}`);
      setJoinFormData({ secretKey: '' });
      setError(null);
    } catch (err) {
      setError(
        err.response?.status === 400
          ? err.response.data.error
          : 'Failed to join team'
      );
      setSuccess(null);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat bg-gray-800"
      style={{ backgroundImage: "url('/images/sports-bg.jpg')" }}
    >
      <div className="backdrop-blur-lg bg-white/10 p-8 rounded-xl shadow-xl w-full max-w-md border border-white/30">
        <h1 className="text-3xl font-bold mb-6 text-center">Join a Team</h1>
        {error && <p className="text-red-400 mb-4 text-center font-medium">{error}</p>}
        {success && <p className="text-green-400 mb-4 text-center font-medium">{success}</p>}
        <form onSubmit={handleJoinSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white">Team Secret Key:</label>
            <input
              type="text"
              name="secretKey"
              value={joinFormData.secretKey}
              onChange={handleJoinInputChange}
              required
              className="mt-1 w-full p-3 bg-white/20 text-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              placeholder="Enter your team secret key"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
          >
            Join Team
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            Discover Teams feature coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
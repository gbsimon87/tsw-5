import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/auth/login', formData);
      await login(response.data.token, false);
      navigate('/my-sporty');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse.credential, true);
      navigate('/my-sporty');
    } catch (error) {
      setError('Google Login Failed');
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {/* <h2 className="text-lg font-semibold mb-4">Email/Password Login</h2> */}
        {/* <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          >
            Login
          </button>
        </form> */}
        <h2 className="text-lg font-semibold mt-6 mb-4">Google Login</h2>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Login Failed')}
          />
        </div>
        <p className="mt-4 text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-500 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
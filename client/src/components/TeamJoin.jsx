import { useState, useEffect, useRef } from 'react';
import Skeleton from 'react-loading-skeleton';
import { toast } from 'react-toastify';
import axios from 'axios';
import { validateSecretKey } from '../utils/validateSecretKey';
import useAnalytics from '../hooks/useAnalytics';
import { useAuth } from '../context/AuthContext';

export default function TeamJoin() {
  const { trackEvent } = useAnalytics();
  const [joinFormData, setJoinFormData] = useState({ secretKey: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const secretKeyInputRef = useRef(null);
  
  const { user } = useAuth();

  // Focus input on mount
  useEffect(() => {
    if (secretKeyInputRef.current) {
      secretKeyInputRef.current.focus();
    }
  }, []);

  const handleJoinInputChange = (e) => {
    const { name, value } = e.target;
    setJoinFormData({ ...joinFormData, [name]: value });
    setError(null);
    setSuccess(null);
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!user?.token) {
      toast.error('You must be logged in to join a team', { toastId: 'auth-error' });
      return;
    }

    const { secretKey } = joinFormData;
    if (!secretKey.trim()) {
      setError('Secret key is required');
      toast.error('Secret key is required', { toastId: 'secret-key-required' });
      return;
    }

    if (!validateSecretKey(secretKey)) {
      setError('Secret key must be a 32-character hexadecimal string');
      toast.error('Invalid secret key format', { toastId: 'secret-key-format' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        '/api/teams/join',
        { secretKey },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setSuccess(`Successfully joined team: ${response.data.team.name}`);
      toast.success(`Successfully joined team: ${response.data.team.name}`, { toastId: 'join-success' });
      trackEvent('join_team', { method: 'secret_key' });

      setJoinFormData({ secretKey: '' });
      setError(null);
    } catch (err) {
      console.error('Join team error:', err.response || err);
      const errorMessage =
        err.response?.status === 400
          ? err.response.data.error
          : 'Failed to join team';
      setError(errorMessage);
      toast.error(errorMessage, { toastId: 'join-error' });
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setJoinFormData({ secretKey: '' });
    setError(null);
    setSuccess(null);
    if (secretKeyInputRef.current) {
      secretKeyInputRef.current.focus();
    }
  };

  if (!user?.token) {
    return (
      <div className="h-[var(--page-height)] flex items-center justify-center bg-gray-800 text-white" role="alert">
        <p className="text-lg font-medium">Please log in to join a team</p>
      </div>
    );
  }

  return (
    <div
      className="h-[var(--page-height)] flex items-center justify-center bg-cover bg-center bg-no-repeat bg-gray-800"
      style={{
        backgroundImage:
          "url('https://img.freepik.com/free-photo/hands-with-basketball-ball_171337-9220.jpg?t=st=1751592905~exp=1751596505~hmac=bc85776f6b17bf3ea7405e651548b76a64e2d17e0873ea2d6c96cee71ecbf9af&w=996')",
      }}
      role="region"
      aria-label="Team Join Form"
    >
      <div className="w-[90%] max-w-lg mx-auto backdrop-blur-lg bg-white/10 p-8 rounded-xl shadow-xl border border-white/30 animate-fade-in">
        <h1 className="text-3xl font-bold mb-6 text-center text-white" id="team-join-title">
          Join a Team
        </h1>
        {loading ? (
          <div className="space-y-6" role="status" aria-busy="true">
            <div>
              <Skeleton
                height={40}
                baseColor="rgba(255, 255, 255, 0.1)"
                highlightColor="rgba(255, 255, 255, 0.2)"
                className="w-full p-3 rounded-lg"
                aria-hidden="true"
              />
              <Skeleton
                height={16}
                width={200}
                baseColor="rgba(255, 255, 255, 0.1)"
                highlightColor="rgba(255, 255, 255, 0.2)"
                className="mt-1"
                aria-hidden="true"
              />
            </div>
            <div className="flex space-x-4">
              <Skeleton
                height={48}
                baseColor="rgba(255, 255, 255, 0.1)"
                highlightColor="rgba(255, 255, 255, 0.2)"
                className="flex-1 rounded-lg"
                aria-hidden="true"
              />
              <Skeleton
                height={48}
                baseColor="rgba(255, 255, 255, 0.1)"
                highlightColor="rgba(255, 255, 255, 0.2)"
                className="flex-1 rounded-lg"
                aria-hidden="true"
              />
            </div>
          </div>
        ) : (
          <>
            {error && (
              <p className="text-red-400 mb-4 text-center font-medium" role="alert" aria-live="assertive">
                {error}
              </p>
            )}
            {success && (
              <p className="text-green-400 mb-4 text-center font-medium" role="status" aria-live="polite">
                {success}
              </p>
            )}
            <form
              onSubmit={handleJoinSubmit}
              className="space-y-6"
              aria-labelledby="team-join-title"
            >
              <div>
                <label htmlFor="secretKey" className="block text-sm font-medium text-white">
                  Team Secret Key
                </label>
                <input
                  id="secretKey"
                  type="text"
                  name="secretKey"
                  value={joinFormData.secretKey}
                  onChange={handleJoinInputChange}
                  required
                  disabled={loading}
                  className="mt-1 w-full p-3 bg-white/20 text-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 disabled:opacity-50"
                  placeholder="Enter your 32-character team secret key"
                  aria-required="true"
                  aria-describedby="secretKeyHelp"
                  ref={secretKeyInputRef}
                />
                <p id="secretKeyHelp" className="mt-1 text-xs text-gray-300">
                  Enter the 32-character secret key provided by your team administrator.
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold disabled:bg-blue-400"
                  disabled={loading}
                  aria-label="Join team with secret key"
                >
                  {loading ? 'Joining...' : 'Join Team'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 bg-gray-200 text-gray-900 py-3 rounded-lg hover:bg-gray-300 transition focus:ring-2 focus:ring-gray-400 focus:outline-none font-semibold disabled:bg-gray-100"
                  disabled={loading}
                  aria-label="Reset team join form"
                >
                  Reset
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
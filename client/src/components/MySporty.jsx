import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BuildingOfficeIcon,
  TrophyIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import TeamJoin from './TeamJoin';

export default function MySporty() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [playerIds, setPlayerIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayerIds = async () => {
      try {
        const response = await axios.get(`/api/players?userId=${user._id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setPlayerIds(response.data.map(player => player._id));
      } catch (err) {
        console.error('Fetch player IDs error:', err.response || err);
        setError('Failed to fetch player data');
        setLoading(false);
      }
    };

    const fetchTeams = async () => {
      try {
        const response = await axios.get('/api/teams/my-teams?t=' + Date.now(), {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        // console.log('Fetched teams:', response.data);
        setTeams(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch teams error:', err.response || err);
        setError(err.response?.data?.error || 'Failed to fetch teams');
        setLoading(false);
      }
    };

    fetchPlayerIds().then(fetchTeams);
  }, [user._id, user.token]);

  // 🔽 If loading or error, render fallback UI
  if (loading) {
    return (
      <div className="h-[var(--page-height)] flex items-center justify-center text-gray-600">
        Loading teams...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[var(--page-height)] flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  // 🔽 If no teams, show join form
  if (teams.length === 0) {
    return <TeamJoin />;
  }

  return (
    <div className="h-[var(--page-height)] bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="block mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">MySporty</h1>
          <div className="flex items-center space-x-4">
            <p className="text-lg text-gray-600">Welcome, {user.name}</p>
          </div>
        </div>

        {loading && <p className="text-center text-gray-600">Loading teams...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && teams.length === 0 && (
          <p className="text-left text-gray-600">You are not a member of any teams yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-8">
          {teams.map((team) => {
            const member = team.members.find((m) => playerIds.includes(m.player._id));
            const memberSince = new Date(team.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <article
                key={team._id}
                className="relative bg-white shadow-lg rounded-xl p-8 flex flex-col border border-gray-100 hover:shadow-2xl transition"
                aria-label={`Team card for ${team.name}`}
              >
                {team.logo ? (
                  <img
                    src={team.logo}
                    alt={`${team.name} logo`}
                    className="absolute top-6 right-6 w-14 h-14 object-cover rounded-full border-2 border-gray-200 shadow"
                  />
                ) : (
                  <div className="absolute top-6 right-6 w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-200 shadow">
                    <span className="text-gray-400 text-lg font-bold">?</span>
                  </div>
                )}
                <header className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{team.name}</h2>
                </header>
                <dl className="space-y-5">
                  <div className="flex items-center gap-3">
                    <dt>
                      <BuildingOfficeIcon className="w-6 h-6 text-blue-500" aria-hidden="true" />
                    </dt>
                    <dt className="text-gray-500 font-medium min-w-[110px]">League:</dt>
                    <dd className="text-gray-800 font-semibold">{team.league.name}</dd>
                  </div>
                  <div className="flex items-center gap-3">
                    <dt>
                      <TrophyIcon className="w-6 h-6 text-yellow-500" aria-hidden="true" />
                    </dt>
                    <dt className="text-gray-500 font-medium min-w-[110px]">Sport:</dt>
                    <dd className="text-gray-800">{team.league.sportType}</dd>
                  </div>
                  <div className="flex items-center gap-3">
                    <dt>
                      <MapPinIcon className="w-6 h-6 text-pink-500" aria-hidden="true" />
                    </dt>
                    <dt className="text-gray-500 font-medium min-w-[110px]">Location:</dt>
                    <dd className="text-gray-800">{team.league.location || 'N/A'}</dd>
                  </div>
                  <div className="flex items-center gap-3">
                    <dt>
                      <UserIcon className="w-6 h-6 text-teal-500" aria-hidden="true" />
                    </dt>
                    <dt className="text-gray-500 font-medium min-w-[110px]">Member Type:</dt>
                    <dd className="text-gray-800">{member ? (member.role.charAt(0).toUpperCase() + member.role.slice(1)) : 'Unknown'}</dd>
                  </div>
                  <div className="flex items-center gap-3">
                    <dt>
                      <CalendarIcon className="w-6 h-6 text-purple-500" aria-hidden="true" />
                    </dt>
                    <dt className="text-gray-500 font-medium min-w-[110px]">Member Since:</dt>
                    <dd className="text-gray-800">{memberSince}</dd>
                  </div>
                  <div className="flex items-center gap-3">
                    <dt>
                      {team.isActive ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-600" aria-hidden="true" />
                      ) : (
                        <XCircleIcon className="w-6 h-6 text-red-600" aria-hidden="true" />
                      )}
                    </dt>
                    <dt className="text-gray-500 font-medium min-w-[110px]">Team Status:</dt>
                    <dd className={team.isActive ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {team.isActive ? 'Active' : 'Inactive'}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
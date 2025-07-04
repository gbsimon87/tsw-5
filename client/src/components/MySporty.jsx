import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  BuildingOfficeIcon,
  TrophyIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function MySporty() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('/api/teams/my-teams', {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      .then((response) => {
        const data = response.data;
        setTeams(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="h-[var(--page-height)] bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="block mb-8">
          <h1 className="text-3xl font-bold text-gray-800">MySporty</h1>
          <div className="flex items-center space-x-4">
            <p className="text-lg text-gray-600">Welcome, {user.name} ({user.email})</p>
          </div>
        </div>

        {loading && <p className="text-center text-gray-600">Loading teams...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && teams.length === 0 && (
          <p className="text-center text-gray-600">You are not a member of any teams yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-8">
          {teams.map((team) => {
            const member = team.members.find((m) => m.user._id === user._id);
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
                    <dd className="text-gray-800">{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</dd>
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
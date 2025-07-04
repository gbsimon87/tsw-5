import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  TrophyIcon,
  CalendarIcon,
  EyeIcon,
  MapPinIcon,
  ClockIcon,
  StarIcon,
  UserGroupIcon,
  UsersIcon,
  FlagIcon,
  ListBulletIcon,
  PencilIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const semanticScoringRulesMap = {
  basketball: {
    twoPointFGM: 'Two-Point Field Goal Made',
    threePointFGM: 'Three-Point Field Goal Made',
    freeThrowM: 'Free Throw Made',
  },
  hockey: {
    goal: 'Goal',
  },
  soccer: {
    goal: 'Goal',
  },
  baseball: {
    single: 'Single',
    double: 'Double',
    triple: 'Triple',
    homeRun: 'Home Run',
  },
  football: {
    touchdown: 'Touchdown',
    fieldGoal: 'Field Goal',
    extraPoint: 'Extra Point',
    twoPointConversion: 'Two-Point Conversion',
    safety: 'Safety',
  },
};

export default function ManageLeague() {
  const { leagueId } = useParams();
  const { user } = useAuth();
  const [league, setLeague] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const response = await axios.get(`/api/leagues/${leagueId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setLeague(response.data);
      } catch (err) {
        if (err.response && err.response.status === 403) {
          setError('You are not authorized to view this league');
        } else {
          setError('Failed to fetch league');
        }
      }
    };
    fetchLeague();
  }, [leagueId, user.token]);


  if (error) {
    return (
      <div className="min-h-[var(--page-height)] bg-gray-50 flex items-center justify-center">
        <p className="text-center text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-[var(--page-height)] bg-gray-50 flex items-center justify-center">
        <p className="text-center text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[var(--page-height)] bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with actions */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">{league.name}</h1>
          <div className="flex gap-3">
            <Link
              to={`/leagues/${leagueId}/edit`}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-label="Edit League"
            >
              <PencilIcon className="w-5 h-5" />
              Edit League
            </Link>
            <Link
              to={`/leagues/${leagueId}/teams`}
              className="flex items-center gap-2 bg-white text-blue-700 border border-blue-600 px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-50 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-label="Manage Teams"
            >
              <UsersIcon className="w-5 h-5" />
              Manage Teams
            </Link>
            <Link
              to={`/leagues/${leagueId}/games`}
              className="flex items-center gap-2 bg-white text-blue-700 border border-blue-600 px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-50 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-label="Manage Games"
            >
              <CalendarIcon className="w-5 h-5" />
              Manage Games
            </Link>
          </div>
        </header>

        {/* Main details card */}
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
          {/* League Details Header */}
          <section className="mb-8">
            <header className="flex items-center gap-3 mb-4">
              <StarIcon className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-semibold text-gray-800">League Details</h2>
            </header>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex items-center">
                <TrophyIcon className="w-5 h-5 mr-3 text-gray-500" />
                <dt className="font-medium text-gray-600">Sport Type:</dt>
                <dd className="ml-2 text-gray-800">{league.sportType}</dd>
              </div>
              <div className="flex items-center">
                <CalendarIcon className="w-5 h-5 mr-3 text-gray-500" />
                <dt className="font-medium text-gray-600">Season:</dt>
                <dd className="ml-2 text-gray-800">{league.season || 'Not set'}</dd>
              </div>
              <div className="flex items-center">
                <EyeIcon className="w-5 h-5 mr-3 text-gray-500" />
                <dt className="font-medium text-gray-600">Visibility:</dt>
                <dd className="ml-2 text-gray-800">{league.visibility}</dd>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="w-5 h-5 mr-3 text-gray-500" />
                <dt className="font-medium text-gray-600">Location:</dt>
                <dd className="ml-2 text-gray-800">{league.location || 'Not set'}</dd>
              </div>
              <div className="flex items-center">
                <ClockIcon className="w-5 h-5 mr-3 text-gray-500" />
                <dt className="font-medium text-gray-600">Established:</dt>
                <dd className="ml-2 text-gray-800">{league.establishedYear || 'Not set'}</dd>
              </div>
              <div className="flex items-center">
                <FlagIcon className="w-5 h-5 mr-3 text-gray-500" />
                <dt className="font-medium text-gray-600">Active:</dt>
                <dd className="ml-2 text-gray-800">{league.isActive ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </section>

          {/* Settings */}
          <section className="mb-8">
            <div className="flex items-center mb-3">
              <Cog6ToothIcon className="w-5 h-5 mr-3 text-blue-500" />
              <h3 className="font-semibold text-gray-800">Settings</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-2">
              <div className="flex items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                <ClockIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                <span className="font-medium">Period Type:</span>
                <span className="ml-2">{league.settings.periodType}</span>
              </div>
              <div className="flex items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                <ClockIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                <span className="font-medium">Period Duration:</span>
                <span className="ml-2">{league.settings.periodDuration} min</span>
              </div>
              <div className="flex items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                <ClockIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                <span className="font-medium">Overtime Duration:</span>
                <span className="ml-2">{league.settings.overtimeDuration} min</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <ListBulletIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                <span className="font-medium">Scoring Rules:</span>
              </div>
              <div className="space-y-2 ml-6">
                {Object.entries(league.settings.scoringRules).map(([rule, value]) => (
                  <div key={rule} className="flex items-center bg-white p-3 rounded-md border border-gray-200">
                    <ListBulletIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                    <span>
                      {semanticScoringRulesMap[league.sportType][rule] || rule}: {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <ListBulletIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                <span className="font-medium">Stat Types:</span>
              </div>
              <div className="space-y-2 ml-6">
                {league.settings.statTypes && league.settings.statTypes.length > 0 ? (
                  league.settings.statTypes.map((stat, index) => (
                    <div key={index} className="flex items-center bg-white p-3 rounded-md border border-gray-200">
                      <ListBulletIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                      <span>{stat}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center bg-white p-3 rounded-md border border-gray-200">
                    <ListBulletIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                    <span>None</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Seasons */}
          <section className="mb-8">
            <div className="flex items-center mb-2">
              <CalendarIcon className="w-5 h-5 mr-3 text-purple-500" />
              <h3 className="font-semibold text-gray-800">Seasons</h3>
            </div>
            {league.seasons && league.seasons.length > 0 ? (
              <div className="space-y-2 ml-6">
                {league.seasons.map((season) => (
                  <div key={season.name} className="flex items-center bg-white p-3 rounded-md border border-gray-200">
                    <CalendarIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                    <span>
                      {season.name} (Start: {new Date(season.startDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}, End: {new Date(season.endDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })})
                      {season.isActive && <span className="ml-2 text-green-600 font-semibold">(Active)</span>}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ml-6 text-gray-600">No seasons defined</p>
            )}
          </section>

          {/* Admins, Managers, Status */}
          <section className="mb-8">
            <div className="flex items-center mb-2">
              <UserGroupIcon className="w-5 h-5 mr-3 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Admins & Managers</h3>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 ml-2">
              <div className="flex items-center">
                <UserGroupIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                <dt className="font-medium text-gray-600">Admins:</dt>
                <dd className="ml-2 text-gray-800">{league.admins.map(admin => admin.name).join(', ') || 'None'}</dd>
              </div>
              <div className="flex items-center">
                <UsersIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                <dt className="font-medium text-gray-600">Managers:</dt>
                <dd className="ml-2 text-gray-800">{league.managers.map(manager => manager.name).join(', ') || 'None'}</dd>
              </div>
              <div className="flex items-center">
                <FlagIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                <dt className="font-medium text-gray-600">Status:</dt>
                <dd className="ml-2 text-gray-800">{league.status}</dd>
              </div>
            </dl>
          </section>

          {/* Teams */}
          <section>
            <div className="flex items-center mb-2">
              <UsersIcon className="w-5 h-5 mr-3 text-teal-500" />
              <h3 className="font-semibold text-gray-800">Teams</h3>
            </div>
            {league.teams.length > 0 ? (
              <div className="space-y-2 ml-6">
                {league.teams.map((team) => (
                  <div key={team._id} className="flex items-center bg-white p-3 rounded-md border border-gray-200">
                    <UsersIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                    <span>{team.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ml-6 text-gray-600">No teams defined</p>
            )}
          </section>

          <section className="mt-8">
            <div className="flex items-center mb-2">
              <UsersIcon className="w-5 h-5 mr-3 text-teal-500" />
              <h3 className="font-semibold text-gray-800">Teams and Members</h3>
            </div>
            {league.teams.length > 0 ? (
              <div className="space-y-4 ml-6">
                {league.teams.map((team) => (
                  <div key={team._id} className="bg-white p-3 rounded-md border border-gray-200">
                    <div className="flex items-center">
                      <UsersIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                      <span className="font-medium">{team.name}</span>
                    </div>
                    <div className="ml-6 mt-2">
                      {team.members.length > 0 ? (
                        team.members.map((member) => (
                          <div key={member.player._id} className="flex items-center bg-gray-50 p-2 rounded-md border border-gray-200 mt-1">
                            <UserGroupIcon className="w-4 h-4 mr-2.5 text-gray-500" />
                            <span>{member.player.user.name} ({member.role})</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600">No members</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ml-6 text-gray-600">No teams defined</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
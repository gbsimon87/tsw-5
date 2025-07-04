import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

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
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  if (!league) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg w-full max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-800">{league.name}</h1>
          <div className="flex space-x-2">
            <Link
              to={`/leagues/${leagueId}/edit`}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-label="Edit League"
            >
              Edit League
            </Link>
            <Link
              to={`/leagues/${leagueId}/teams`}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-label="Manage Teams"
            >
              Manage Teams
            </Link>
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2">League Details</h2>
        <div className="space-y-2">
          <p><strong>Sport Type:</strong> {league.sportType}</p>
          <p><strong>Season:</strong> {league.season || 'Not set'}</p>
          <p><strong>Visibility:</strong> {league.visibility}</p>
          <p><strong>Location:</strong> {league.location || 'Not set'}</p>
          <p><strong>Established Year:</strong> {league.establishedYear || 'Not set'}</p>
          <p><strong>Active:</strong> {league.isActive ? 'Yes' : 'No'}</p>
          <p><strong>Settings:</strong></p>
          <ul className="list-disc list-inside ml-4">
            <li>Period Type: {league.settings.periodType}</li>
            <li>Period Duration: {league.settings.periodDuration} minutes</li>
            <li>Overtime Duration: {league.settings.overtimeDuration} minutes</li>
            <li>
              Scoring Rules:
              <ul className="list-disc list-inside ml-4">
                {Object.entries(league.settings.scoringRules).map(([rule, value]) => (
                  <li key={rule}>
                    {semanticScoringRulesMap[league.sportType][rule] || rule}: {value}
                  </li>
                ))}
              </ul>
            </li>
            <li>Stat Types: {league.settings.statTypes.join(', ')}</li>
          </ul>
          // Add updated Seasons display with isActive status
          <p><strong>Seasons:</strong></p>
          {league.seasons.length > 0 ? (
            <ul className="list-disc list-inside ml-4">
              {league.seasons.map((season) => (
                <li key={season.name}>
                  {season.name} (Start: {new Date(season.startDate).toLocaleDateString()}, End: {new Date(season.endDate).toLocaleDateString()}) {season.isActive ? '(Active)' : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-4">No seasons defined</p>
          )}
          <p><strong>Admins:</strong> {league.admins.map(admin => admin.name).join(', ')}</p>
          <p><strong>Managers:</strong> {league.managers.map(manager => manager.name).join(', ') || 'None'}</p>
          <p><strong>Status:</strong> {league.status}</p>
          <p><strong>Teams:</strong></p>
          {league.teams.length > 0 ? (
            <ul className="list-disc list-inside ml-4">
              {league.teams.map((team) => (
                <li key={team._id}>{team.name}</li>
              ))}
            </ul>
          ) : (
            <p className="ml-4">No teams defined</p>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function LeagueManagement() {
  const { leagueId } = useParams();
  const { user } = useAuth();
  const [league, setLeague] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const response = await axios.get(`/api/leagues/${leagueId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
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
        <h1 className="text-2xl font-bold mb-4">{league.name}</h1>
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
            <li>Scoring Rules: {JSON.stringify(league.settings.scoringRules)}</li>
            <li>Stat Types: {league.settings.statTypes.join(', ')}</li>
          </ul>
          <p><strong>Seasons:</strong></p>
          {league.seasons.length > 0 ? (
            <ul className="list-disc list-inside ml-4">
              {league.seasons.map((season, idx) => (
                <li key={idx}>
                  {season.name} (Start: {new Date(season.startDate).toLocaleDateString()}, End: {new Date(season.endDate).toLocaleDateString()})
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-4">No seasons defined</p>
          )}
          <p><strong>Admins:</strong> {league.admins.map(admin => admin.name).join(', ')}</p>
          <p><strong>Managers:</strong> {league.managers.map(manager => manager.name).join(', ') || 'None'}</p>
          <p><strong>Status:</strong> {league.status}</p>
        </div>
      </div>
    </div>
  );
}
import { useEffect } from 'react';

const Scoreboard = ({ teamScores }) => {
  useEffect(() => {
    console.log('Scoreboard teamScores:', teamScores);
  }, [teamScores]);

  const isValidArray = Array.isArray(teamScores) && teamScores.length >= 2;
  const team1 = isValidArray && teamScores[0] ? teamScores[0] : null;
  const team2 = isValidArray && teamScores[1] ? teamScores[1] : null;

  if (!isValidArray || !team1 || !team2) {
    console.error('Invalid teamScores data:', teamScores);
    return (
      <div className="w-full flex justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-slate-800 text-white text-center">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow">
          Scoreboard data unavailable.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-2 bg-gradient-to-br from-slate-800 via-blue-700 to-slate-800 text-white text-center">
      <div className="w-full max-w-3xl mx-auto flex justify-between items-stretch space-x-2">
        {/* Team 1 */}
        <div className="flex-1 bg-blue-800 bg-opacity-30 flex flex-col justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            {team1.teamName || 'Team 1'}
          </h2>
          <p className="text-3xl font-bold">
            {typeof team1.score === 'number' ? Math.round(team1.score) : '-'}
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center text-2xl font-bold text-white px-2">
          vs
        </div>

        {/* Team 2 */}
        <div className="flex-1 bg-blue-800 bg-opacity-30 flex flex-col justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            {team2.teamName || 'Team 2'}
          </h2>
          <p className="text-3xl font-bold">
            {typeof team2.score === 'number' ? Math.round(team2.score) : '-'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;

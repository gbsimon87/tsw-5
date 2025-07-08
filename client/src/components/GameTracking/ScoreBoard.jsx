import { useEffect } from "react";

const Scoreboard = ({ teamScores }) => {
  // console.log(teamScores);

  useEffect(() => {
    // console.log('Component mounted');
  }, [teamScores]);
  
  // Defensive checks
  const isValidArray = Array.isArray(teamScores) && teamScores.length >= 2;
  const team1 = isValidArray && teamScores[0] ? teamScores[0] : null;
  const team2 = isValidArray && teamScores[1] ? teamScores[1] : null;

  if (!isValidArray || !team1 || !team2) {
    return (
      <div className="w-full flex justify-center">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          Scoreboard data unavailable.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="flex w-full">
        <div className="p-4 w-full">
          <h2 className="text-lg font-bold">
            {team1.teamName || 'Team 1'}
          </h2>
          <p className="text-xl font-bold">
            {typeof team1?.score === 'number' ? Math.round(team1?.score) : '-'}
          </p>
        </div>
        <div className="p-4 w-full text-right">
          <h2 className="text-lg font-bold">
            {team2.teamName || 'Team 2'}
          </h2>
          <p className="text-xl font-bold">
            {typeof team2?.score === 'number' ? Math.round(team2?.score) : '-'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;

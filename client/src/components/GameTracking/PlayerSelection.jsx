/**
 * PlayerSelection component for displaying on-court players and handling stat recording selection.
 * Renders player cards for both teams with their stats and selection functionality.
 * @param {Object} game - Game object with team names, player stats, and team IDs
 * @param {Function} calculateTeamScore - Function to calculate team score based on teamId
 * @param {Function} handlePlayerClick - Callback to handle player selection for stat recording
 * @param {Function} handleKeyDown - Callback to handle keydown events for accessibility
 * @param {boolean} hasGameStarted - Indicates if the game has started
 * @param {number|null} remainingSeconds - Remaining seconds in the current period
 * @throws {Error} If game data is missing or invalid
 */

// export default function PlayerSelection({ game, calculateTeamScore, handlePlayerClick, handleKeyDown, hasGameStarted, remainingSeconds }) {
//   if (!game) {
//     throw new Error('Game data is required');
//   }

//   /**
//    * Renders a player card with profile image, jersey, name, and stats.
//    * @param {Object} player - Player object with id, name, jersey, points, assists, rebounds, onCourt
//    * @param {string} team - Team identifier ('team1' or 'team2')
//    * @returns {JSX.Element} Player card JSX
//    */
//   function renderPlayerCard(player, team) {
//     const imageUrl = player.profileImage || "https://placehold.co/40x40?text=👤";
//     return (
//       <button
//         key={player.playerId}
//         className={`w-full bg-white hover:bg-blue-100 border border-gray-200 shadow-md p-3 flex items-start gap-2 transition ${!player.onCourt || !hasGameStarted || remainingSeconds <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
//         style={{ minWidth: 0 }}
//         onClick={() => handlePlayerClick(player, team)}
//         onKeyDown={(e) => handleKeyDown(e, () => handlePlayerClick(player, team))}
//         tabIndex={0}
//         aria-label={`Select ${player.name} jersey ${player.jersey}`}
//         disabled={!player.onCourt || !hasGameStarted || remainingSeconds <= 0}
//       >
//         <div className="flex flex-col items-center gap-1 flex-shrink-0">
//           <img
//             src={imageUrl}
//             alt={`${player.name} profile`}
//             className="w-10 h-10 rounded-full object-cover bg-gray-200"
//           />
//           <span className={`bg-${team === "team1" ? "blue" : "purple"}-600 text-white rounded-full px-2 py-0.5 text-xs`}>
//             #{player.jersey}
//           </span>
//         </div>
//         <div className="flex-1 flex flex-col items-start min-w-0">
//           <div className="mb-1">
//             <span className="font-semibold text-base truncate">{player.name}</span>
//           </div>
//           <div className="flex gap-2 text-xs text-gray-700">
//             <span>P: {player.points || 0}</span>
//             <span>A: {player.assists || 0}</span>
//             <span>R: {player.rebounds || 0}</span>
//             <span>F: {player.fouls || 0}</span>
//           </div>
//         </div>
//       </button>
//     );
//   }

//   const team1Players = game.playerStats.filter(p => p.onCourt && p.teamId === game.team1Id._id);
//   const team2Players = game.playerStats.filter(p => p.onCourt && p.teamId === game.team2Id._id);
//   const team1Score = calculateTeamScore("team1");
//   const team2Score = calculateTeamScore("team2");

//   return (
//     <div className="flex flex-row w-full h-full gap-2 sm:gap-6 pt-0 justify-between">
//       <div className="flex-1 flex flex-col items-center max-w-xs">
//         <div className="font-bold text-lg mb-2 text-blue-700">{game.team1Name}</div>
//         <div className="text-xl font-bold text-blue-900 mb-3">{team1Score}</div>
//         <div className="flex flex-col w-full gap-2">
//           {team1Players.map((player) => renderPlayerCard(player, "team1"))}
//         </div>
//       </div>
//       <div className="flex-1 flex flex-col items-center max-w-xs">
//         <div className="font-bold text-lg mb-2 text-purple-700">{game.team2Name}</div>
//         <div className="text-xl font-bold text-purple-900 mb-3">{team2Score}</div>
//         <div className="flex flex-col w-full gap-2">
//           {team2Players.map((player) => renderPlayerCard(player, "team2"))}
//         </div>
//       </div>
//     </div>
//   );
// }

export default function PlayerSelection({ teams, startersCount }) {
  if (!teams || !Array.isArray(teams) || teams.length !== 2) {
    throw new Error('[PlayerSelection]: Valid teams data is required (expected array of two teams)');
  }

  console.log(startersCount);

  // Function to render a player card
const renderPlayerCard = (player) => {
  const imageUrl = "https://placehold.co/40x40?text=👤";
  return (
    <button
      key={player.playerId}
      className={`w-full bg-white hover:bg-blue-100 border border-gray-200 shadow-md p-3 flex items-start gap-2 transition`}
      style={{ minWidth: 0 }}
      tabIndex={0}
      aria-label={`Select ${player.name} jersey ${player.jerseyNumber || 'N/A'}`}
    >
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <img
          src={imageUrl}
          alt={`${player.name} profile`}
          className="w-10 h-10 rounded-full object-cover bg-gray-200"
        />
        <span className="bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs">
          #{player.jerseyNumber || 'N/A'}
        </span>
      </div>
      <div className="flex-1 flex flex-col items-start min-w-0">
        <div className="mb-1 w-full">
          <span className="text-left font-semibold text-base break-words whitespace-normal block">
            {player.name}
          </span>
        </div>
        <div className="flex gap-2 text-xs text-gray-700">
          <span>{player.position || 'N/A'}</span>
        </div>
      </div>
    </button>
  );
};


  // Defensive: Fallback to empty array if members is missing
  const team1Members = Array.isArray(teams[0].members)
    ? teams[0].members.slice(0, startersCount)
    : [];
  const team2Members = Array.isArray(teams[1].members)
    ? teams[1].members.slice(0, startersCount)
    : [];

  return (
    <div className="grid grid-cols-2 w-full h-full gap-2 sm:gap-6 pt-0 justify-between">
      {/* Team 1 Container */}
      <div className="flex-1 flex flex-col gap-2">
        {/* <h2 className="text-lg font-bold text-center">{teams[0].name}</h2> */}
        {team1Members.map(player => renderPlayerCard(player))}
      </div>
      {/* Team 2 Container */}
      <div className="flex-1 flex flex-col gap-2">
        {/* <h2 className="text-lg font-bold text-center">{teams[1].name}</h2> */}
        {team2Members.map(player => renderPlayerCard(player))}
      </div>
    </div>
  );
}

import { STAT_OPTIONS } from '../../utils/statOptions';

/**
 * PlayByPlay component for displaying the play-by-play log of game events.
 * Renders a tabbed interface to filter plays by team or show all plays.
 * @param {Object} game - Game object with team names, player stats, and period type
 * @param {string} selectedPlayByPlayTab - Current tab ('team1', 'team2', or 'all')
 * @param {Function} setSelectedPlayByPlayTab - Callback to update the selected tab
 * @param {Array} statOptions - Array of stat options with key and label
 * @throws {Error} If game data is missing or invalid
 */
export default function PlayByPlay({ game, selectedPlayByPlayTab, setSelectedPlayByPlayTab }) {
  if (!game) {
    throw new Error('Game data is required');
  }

  const allPlays = [];
  game.playerStats.forEach(player => {
    player?.basketballStats?.forEach(stat => {
      const team = player.teamId === game.team1Id._id ? "team1" : "team2";
      const minutes = Math.floor(stat.gameTimeSeconds / 60);
      const seconds = stat.gameTimeSeconds % 60;
      const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      allPlays.push({
        team,
        teamName: team === "team1" ? game.team1Name : game.team2Name,
        playerName: player.name,
        statType: STAT_OPTIONS.find(s => s.key === stat.type)?.label || stat.type,
        timestamp: stat.timestamp,
        period: stat.period,
        timeDisplay,
      });
    });
  });

  const filteredPlays = selectedPlayByPlayTab === "all"
    ? allPlays
    : allPlays.filter(play => play.team === selectedPlayByPlayTab);

  filteredPlays.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="flex flex-col w-full h-full pt-0">
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setSelectedPlayByPlayTab("team1")}
          className={`flex-1 py-2 text-center font-bold text-md ${selectedPlayByPlayTab === "team1" ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-500"}`}
        >
          {game.team1Name}
        </button>
        <button
          onClick={() => setSelectedPlayByPlayTab("all")}
          className={`flex-1 py-2 text-center font-bold text-md ${selectedPlayByPlayTab === "all" ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-500"}`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedPlayByPlayTab("team2")}
          className={`flex-1 py-2 text-center font-bold text-md ${selectedPlayByPlayTab === "team2" ? "text-purple-700 border-b-2 border-purple-700" : "text-gray-500"}`}
        >
          {game.team2Name}
        </button>
      </div>
      <div className="w-full mx-auto overflow-y-auto">
        {filteredPlays.map((play, index) => (
          <div
            key={`${play.team}-${play.playerName}-${play.statType}-${play.timestamp}-${index}`}
            className="w-full bg-white border border-gray-200 shadow-sm p-3 flex items-center text-sm"
          >
            <span className={`font-bold w-1/4 ${play.team === "team1" ? "text-blue-700" : "text-purple-700"} truncate`}>
              {play.teamName}
            </span>
            <span className="font-semibold w-1/4 text-gray-900 truncate">
              {play.playerName}
            </span>
            <span className="italic w-1/4 text-gray-600 truncate">
              {play.statType}
            </span>
            <span className="w-1/4 text-gray-600 text-right">
              {play.timeDisplay} {game.periodType === "quarters" ? `Q${play.period}` : `H${play.period}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
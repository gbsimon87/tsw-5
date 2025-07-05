
/**
 * Substitutions component for managing player substitutions in a game.
 * Renders team tabs and player cards with checkboxes for toggling on-court status.
 * Enforces a maximum of 5 players per team on the court.
 * @param {Object} game - Game object with team names and player stats
 * @param {string} selectedSubTeam - Current team tab ('team1' or 'team2')
 * @param {string[]} onCourtPlayersTeam1 - Array of player IDs on court for team1
 * @param {string[]} onCourtPlayersTeam2 - Array of player IDs on court for team2
 * @param {Function} setSelectedSubTeam - Callback to update selected team tab
 * @param {Function} handleSubstitutionChange - Callback to toggle player on-court status, returns false if failed
 * @throws {Error} If game data is missing or invalid
 */
export default function Substitutions({ game, selectedSubTeam, onCourtPlayersTeam1, onCourtPlayersTeam2, setSelectedSubTeam, handleSubstitutionChange }) {
    if (!game) {
        throw new Error('Game data is required');
    }

    // console.log(onCourtPlayersTeam1);
    // console.log(onCourtPlayersTeam2);

    /**
     * Renders team tabs for switching between team1 and team2.
     * @returns {JSX.Element} Team tabs JSX
     */
    function renderTeamTabs() {
        return (
            <div className="flex border-b border-gray-200 mb-4">
                <button
                    onClick={() => setSelectedSubTeam('team1')}
                    className={`flex-1 py-2 text-center font-bold text-md ${selectedSubTeam === 'team1' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500'}`}
                    aria-label={`Select ${game.team1Name}`}
                >
                    {game.team1Name}
                </button>
                <button
                    onClick={() => setSelectedSubTeam('team2')}
                    className={`flex-1 py-2 text-center font-bold text-md ${selectedSubTeam === 'team2' ? 'text-purple-700 border-b-2 border-purple-700' : 'text-gray-500'}`}
                    aria-label={`Select ${game.team2Name}`}
                >
                    {game.team2Name}
                </button>
            </div>
        );
    }

    /**
     * Renders a player card with profile image, jersey, name, position, fouls, and checkbox.
     * Disables checkbox for players not on court when team has 5 players.
     * @param {Object} player - Player object with id, name, jersey, position, fouls, profileImage, onCourt
     * @param {string} team - Team identifier ('team1' or 'team2')
     * @returns {JSX.Element} Player card JSX
     */
    function renderPlayerCard(player, team) {
        const imageUrl = player.profileImage || 'https://placehold.co/40x40?text=👤';
        const currentOnCourt = team === 'team1' ? onCourtPlayersTeam1 : onCourtPlayersTeam2;
        const isDisabled = !player.onCourt && currentOnCourt.length >= 5;

        return (
            <div
                key={player.playerId}
                className="w-full bg-white border border-gray-200 shadow-sm p-2 flex items-center gap-2 text-sm"
            >
                <img
                    src={imageUrl}
                    alt={`${player.name} profile`}
                    className="w-8 h-8 rounded-full object-cover bg-gray-200 flex-shrink-0"
                />
                <span className={`bg-${team === 'team1' ? 'blue' : 'purple'}-600 text-white rounded-full px-1.5 py-0.5 text-xs flex-shrink-0`}>
                    #{player.jersey}
                </span>
                <span className="font-semibold truncate flex-1">{player.name}</span>
                <span className="w-12 text-gray-700">Pos: {player.position}</span>
                <span className="w-12 text-gray-700">F: {player.fouls}</span>
                <input
                    type="checkbox"
                    checked={currentOnCourt.includes(player.playerId)}
                    disabled={isDisabled}
                    onChange={(e) => handleSubstitutionChange(player.playerId, team, e.target.checked)}
                    className="h-4 w-4 text-blue-600 flex-shrink-0"
                    aria-label={`Toggle ${player.name} on court`}
                />
            </div>
        );
    }

    // Filter players based on selected team
    const teamPlayers = game.playerStats.filter(
        (p) => p.teamId === (selectedSubTeam === 'team1' ? game.team1Id._id : game.team2Id._id)
    );

    return (
        <div className="flex flex-col w-full h-full pt-0">
            {renderTeamTabs()}
            <div className="flex flex-col w-full mx-auto gap-1 overflow-y-auto">
                {teamPlayers.map((player) => renderPlayerCard(player, selectedSubTeam))}
            </div>
        </div>
    );
}
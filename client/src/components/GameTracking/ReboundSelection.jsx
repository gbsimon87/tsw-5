function ReboundSelection({
  currentPlayer,
  sameTeamPlayers,
  opposingTeamPlayers,
  sameTeamName,
  opposingTeamName,
  onBack,
  onReboundSelection,
}) {
  if (!currentPlayer || !sameTeamPlayers || !opposingTeamPlayers) return null;
  return (
    <div className="w-full h-full flex flex-col pt-8">
      <div className="flex flex-row items-center w-full max-w-md mb-2">
        <button
          className="text-blue-700 hover:underline font-medium flex items-center mr-2"
          onClick={onBack}
          aria-label="Back to stat selection"
        >
          <span className="mr-1">←</span> Back
        </button>
        <div className="font-bold text-lg text-center flex-1">
          Select rebound for{' '}
          <span className="text-blue-700">
            {currentPlayer.name} #{currentPlayer.jerseyNumber}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <button
          className="bg-gray-600 hover:bg-gray-800 text-white rounded-xl p-4 text-base font-semibold shadow transition"
          onClick={() => onReboundSelection('nobody')}
          aria-label="No rebound"
        >
          No Rebound
        </button>
        <div>
          <h3 className="font-semibold text-md mb-2 text-blue-700">{sameTeamName}</h3>
          <div className="grid grid-cols-2 gap-4">
            {sameTeamPlayers.map((player) => (
              <button
                key={player.id}
                className="bg-blue-600 hover:bg-blue-800 text-white rounded-xl p-4 text-base font-semibold shadow transition"
                onClick={() => onReboundSelection(player.id)}
                aria-label={`Rebound by ${player.name}`}
              >
                #{player.jerseyNumber} {player.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-md mb-2 text-purple-700">{opposingTeamName}</h3>
          <div className="grid grid-cols-2 gap-4">
            {opposingTeamPlayers.map((player) => (
              <button
                key={player.id}
                className="bg-purple-600 hover:bg-purple-800 text-white rounded-xl p-4 text-base font-semibold shadow transition"
                onClick={() => onReboundSelection(player.id)}
                aria-label={`Rebound by ${player.name}`}
              >
                #{player.jerseyNumber} {player.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReboundSelection;
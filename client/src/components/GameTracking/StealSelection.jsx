function StealSelection({ currentPlayer, opposingPlayers, onBack, onStealSelection }) {
  if (!currentPlayer || !opposingPlayers) return null;
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
          Select player who stole the ball for{' '}
          <span className="text-blue-700">
            {currentPlayer.name} #{currentPlayer.jersey}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          className="bg-gray-600 hover:bg-gray-800 text-white rounded-xl p-4 text-base font-semibold shadow transition"
          onClick={() => onStealSelection('nobody')}
          aria-label="Nobody"
        >
          Nobody
        </button>
        {opposingPlayers.map((player) => (
          <button
            key={player.id}
            className="bg-blue-600 hover:bg-blue-800 text-white rounded-xl p-4 text-base font-semibold shadow transition"
            onClick={() => onStealSelection(player.id)}
            aria-label={`Steal by ${player.name}`}
          >
            #{player.jersey} {player.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StealSelection;
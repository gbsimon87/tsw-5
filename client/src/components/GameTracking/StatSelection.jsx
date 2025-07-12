function StatSelection({ currentPlayer, statOptions, onBack, onStatClick }) {
  return (
    <div className="w-full h-full flex flex-col pt-8">
      <div className="flex flex-row items-center w-full max-w-md mb-2">
        <button
          className="text-blue-700 hover:underline font-medium flex items-center mr-2"
          onClick={onBack}
          aria-label="Back to court selection"
        >
          <span className="mr-1">←</span> Back
        </button>
        <div className="font-bold text-lg text-center flex-1">
          Select stat for{' '}
          <span className="text-blue-700">
            {currentPlayer.name} #{currentPlayer.jerseyNumber}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {statOptions.map((stat) => (
          <button
            key={stat.key}
            className="bg-blue-600 hover:bg-blue-800 text-white rounded-xl p-4 text-base font-semibold shadow transition"
            onClick={() => onStatClick(stat.key)}
            aria-label={stat.label}
          >
            {stat.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StatSelection;
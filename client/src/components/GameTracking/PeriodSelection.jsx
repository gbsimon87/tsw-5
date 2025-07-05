/**
 * PeriodSelection component for selecting the game period (quarter or half).
 * Renders buttons for each period based on game period type.
 * @param {Object} game - Game object with periodType and currentPeriod
 * @param {Function} handlePeriodChange - Callback to update the selected period
 * @throws {Error} If game data is missing or invalid
 */
export default function PeriodSelection({ game, handlePeriodChange }) {
  if (!game) {
    throw new Error('Game data is required');
  }

  const isHalves = game.periodType === "halves";
  const periods = isHalves ? [1, 2] : [1, 2, 3, 4];
  const periodLabel = isHalves ? "H" : "Q";

  return (
    <div className="flex flex-col w-full h-full pt-8 items-center">
      <div className="font-bold text-lg mb-4">
        Select {isHalves ? "Half" : "Quarter"}
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {periods.map(period => (
          <button
            key={period}
            className={`bg-blue-600 hover:bg-blue-800 text-white rounded-xl p-4 text-base font-semibold shadow transition ${game.currentPeriod === period ? "bg-blue-800 scale-105" : ""}`}
            onClick={() => handlePeriodChange(period)}
            aria-label={`Select ${periodLabel}${period}`}
          >
            {periodLabel}{period}
          </button>
        ))}
      </div>
    </div>
  );
}
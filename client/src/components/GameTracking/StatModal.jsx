import Modal from 'react-modal';

function getFollowUpConfig(statType, selectedPlayer, activePlayers) {
  if (!selectedPlayer || !activePlayers) {
    console.error('Missing selectedPlayer or activePlayers');
    return null;
  }

  switch (statType) {
    case 'twoPointFGA':
    case 'threePointFGA':
    case 'freeThrowA':
      return {
        question: `Who got the rebound after ${selectedPlayer.name}'s shot attempt?`,
        players: activePlayers, // Both teams can rebound
        allowNone: true,
      };
    case 'twoPointFGM':
    case 'threePointFGM':
      return {
        question: `Who assisted on ${selectedPlayer.name}'s made shot?`,
        players: activePlayers.filter(p => p.teamId === selectedPlayer.teamId && p.playerId !== selectedPlayer.playerId),
        allowNone: false,
      };
    case 'offensiveRebound':
      return {
        question: `Who shot the ball for ${selectedPlayer.name}'s offensive rebound?`,
        players: activePlayers.filter(p => p.teamId === selectedPlayer.teamId && p.playerId !== selectedPlayer.playerId),
        allowNone: false,
        extra: 'twoPointFGA', // Assume shot attempt
      };
    case 'assist':
      return {
        question: `Who shot the ball for ${selectedPlayer.name}'s assist?`,
        players: activePlayers.filter(p => p.teamId === selectedPlayer.teamId && p.playerId !== selectedPlayer.playerId),
        allowNone: false,
        extra: 'twoPointFGM', // Assume made shot
      };
    case 'defensiveRebound':
      return {
        question: `Who shot the ball for ${selectedPlayer.name}'s defensive rebound?`,
        players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
        allowNone: false,
        extra: 'twoPointFGA', // Assume shot attempt
      };
    case 'personalFoul':
      return {
        question: `Who was fouled by ${selectedPlayer.name}?`,
        players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
        allowNone: false,
      };
    case 'drawnFoul':
      return {
        question: `Who fouled ${selectedPlayer.name}?`,
        players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
        allowNone: false,
      };
    case 'steal':
      return {
        question: `Who turned over the ball for ${selectedPlayer.name}'s steal?`,
        players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
        allowNone: false,
        extra: 'turnover',
      };
    case 'turnover':
      return {
        question: `Who stole the ball from ${selectedPlayer.name}'s turnover?`,
        players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
        allowNone: false,
        extra: 'steal',
      };
    case 'block':
      return {
        question: `Who was blocked by ${selectedPlayer.name}?`,
        players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
        allowNone: false,
        extra: 'blockedShotAttempt',
      };
    case 'blockedShotAttempt':
      return {
        question: `Who blocked ${selectedPlayer.name}'s shot?`,
        players: activePlayers.filter(p => p.teamId !== selectedPlayer.teamId),
        allowNone: false,
        extra: 'block',
      };
    default:
      return null;
  }
}

export default function StatModal({
  isOpen,
  modalStep,
  setModalStep,
  selectedPlayer,
  selectedStatType,
  statTypes,
  activePlayers,
  handleStatSelect,
  handleFollowUp,
  resetModal,
  statDisplayMap,
  getInitialAndLastName,
  overrideMinutes,
  setOverrideMinutes,
  overrideSeconds,
  setOverrideSeconds,
  overridePeriod,
  setOverridePeriod,
  getPeriodOptions,
}) {
  // Get follow-up config if in a follow-up step
  const followUpConfig =
    modalStep !== "selectStat" && selectedStatType
      ? getFollowUpConfig(selectedStatType, selectedPlayer, activePlayers)
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={resetModal}
      className="bg-white p-4 rounded shadow-lg max-w-md w-full mx-auto my-8"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      aria={{
        labelledby: "stat-modal-title",
        describedby: "stat-modal-description",
      }}
    >
      {modalStep === "selectStat" ? (
        <>
          <h3 id="stat-modal-title" className="text-lg font-bold mb-2">
            Select Stat for {getInitialAndLastName(selectedPlayer?.name) || "Unknown"}
          </h3>
          <div id="stat-modal-description" className="grid grid-cols-2 gap-2">
            {statTypes && statTypes.map((statType) => (
              <button
                key={statType}
                onClick={() => handleStatSelect(statType)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {statDisplayMap[statType]?.label || statType}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={overrideMinutes}
              onChange={(e) => setOverrideMinutes(e.target.value.slice(0, 2))}
              className="w-12 text-center bg-gray-100 rounded px-1"
              maxLength={2}
              placeholder="MM"
              aria-label="Override stat minutes"
            />
            <span>:</span>
            <input
              type="text"
              value={overrideSeconds}
              onChange={(e) => setOverrideSeconds(e.target.value.slice(0, 2))}
              className="w-12 text-center bg-gray-100 rounded px-1"
              maxLength={2}
              placeholder="SS"
              aria-label="Override stat seconds"
            />
            <select
              value={overridePeriod}
              onChange={(e) => setOverridePeriod(e.target.value)}
              className="px-2 py-1 rounded bg-gray-100"
              aria-label="Override stat period"
            >
              <option value="">Current Period</option>
              {getPeriodOptions().map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={resetModal}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 w-full"
          >
            Cancel
          </button>
        </>
      ) : followUpConfig ? (
        <>
          <h3 id="stat-modal-title" className="text-lg font-bold mb-2">
            {followUpConfig.question}
          </h3>
          <div id="stat-modal-description" className="grid grid-cols-2 gap-2">
            {followUpConfig.players.map((player) => (
              <button
                key={player.playerId}
                onClick={() =>
                  handleFollowUp({ playerId: player.playerId, statType: followUpConfig.extra || selectedStatType })
                }
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {getInitialAndLastName(player.name) || "Unknown"}
              </button>
            ))}
            {followUpConfig.allowNone && (
              <button
                onClick={() => handleFollowUp(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Nobody
              </button>
            )}
          </div>
          <button
            onClick={() => setModalStep("selectStat")}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 w-full"
          >
            Back
          </button>
        </>
      ) : (
        <div className="text-red-500">Error: Invalid follow-up configuration</div>
      )}
    </Modal>
  );
}
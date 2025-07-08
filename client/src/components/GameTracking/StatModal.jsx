import Modal from 'react-modal';

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
  getFollowUpConfig
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
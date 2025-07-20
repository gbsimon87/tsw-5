function ModalGameFinish({ game, handleFinishGame }) {
    const { closeModal } = useModal();
    const [localSelectedStatus, setLocalSelectedStatus] = useState(game?.status || 'in-progress');

    if (!game) {
      return <div className="text-red-600">Error: Game data not available</div>;
    }

    return (
      <div className="flex flex-col gap-4 p-4">
        <p className="text-gray-700 text-lg">Select the game status:</p>
        <div className="flex flex-col gap-3">
          {['in-progress', 'postponed', 'completed'].map((status) => (
            <label key={status} className="flex items-center gap-2">
              <input
                type="radio"
                name="gameStatus"
                value={status}
                checked={localSelectedStatus === status}
                onChange={(e) => {
                  setLocalSelectedStatus(e.target.value);
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                data-testid={`status-radio-${status}`}
              />
              <span className="text-gray-900 capitalize">{status}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              closeModal();
            }}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-xl hover:bg-gray-300 transition"
            aria-label="Cancel finishing game"
            data-testid="cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              handleFinishGame(localSelectedStatus);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-800 transition"
            aria-label="Confirm game status"
            data-testid="confirm-button"
          >
            Confirm
          </button>
        </div>
      </div>
    );
  }

  export default ModalGameFinish;
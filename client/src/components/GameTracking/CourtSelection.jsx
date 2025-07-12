function CourtSelection({ currentPlayer, onBack, onCourtClick }) {
  if (!currentPlayer) return null;
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-row items-center w-full max-w-lg mb-2 mx-auto">
        <button
          className="text-blue-700 hover:underline font-medium flex items-center mr-2"
          onClick={onBack}
          aria-label="Back to select a player"
        >
          <span className="mr-1">←</span> Back
        </button>
        <div className="font-bold text-lg text-center flex-1">
          Tap the court to record location for{' '}
          <span className="text-blue-700">
            {currentPlayer.name} #{currentPlayer.jerseyNumber}
          </span>
        </div>
      </div>
      <div className="w-full max-w-lg mx-auto">
        <svg
          viewBox="0 0 94 50"
          width="100%"
          height="350"
          style={{ background: '#f5f5f5', padding: '1rem', cursor: 'crosshair' }}
          onClick={onCourtClick}
          aria-label="Basketball court"
          tabIndex={0}
        >
          <rect x="0" y="0" width="94" height="50" fill="#deb887" />
          <rect x="0" y="0" width="94" height="50" fill="none" stroke="#000" strokeWidth="0.5" />
          <circle cx="47" cy="25" r="2" fill="none" stroke="#000" strokeWidth="0.2" />
          <circle cx="47" cy="25" r="6" fill="none" stroke="#000" strokeWidth="0.2" />
          <line x1="47" y1="0" x2="47" y2="50" stroke="#000" strokeWidth="0.2" />
          <circle cx="19" cy="25" r="6" fill="none" stroke="#000" strokeWidth="0.2" />
          <circle cx="75" cy="25" r="6" fill="none" stroke="#000" strokeWidth="0.2" />
          <path
            d="M19,19a6,6 0 0 1 0,12"
            fill="none"
            stroke="#000"
            strokeWidth="0.2"
            strokeDasharray="0.2,0.2"
          />
          <path
            d="M75,19a6,6 0 0 0 0,12"
            fill="none"
            stroke="#000"
            strokeWidth="0.2"
            strokeDasharray="0.2,0.2"
          />
          <rect x="0" y="17" width="19" height="16" fill="none" stroke="#000" strokeWidth="0.2" />
          <rect x="75" y="17" width="19" height="16" fill="none" stroke="#000" strokeWidth="0.2" />
          <path
            d="M0,3.5L14,3.5A22,22 0 0 1 14,46.5L0,46.5"
            fill="none"
            stroke="#000"
            strokeWidth="0.2"
          />
          <path
            d="M94,3.5L80,3.5A22,22 0 0 0 80,46.5L94,46.5"
            fill="none"
            stroke="#000"
            strokeWidth="0.2"
          />
          <rect x="0" y="24.25" width="1.8" height="1.5" fill="none" stroke="#000" strokeWidth="0.1" />
          <rect x="92.2" y="24.25" width="1.8" height="1.5" fill="none" stroke="#000" strokeWidth="0.1" />
          <path
            d="M5.75,21A4,4 0 0 1 5.75,29"
            fill="none"
            stroke="#000"
            strokeWidth="0.2"
          />
          <path
            d="M88.25,21A4,4 0 0 0 88.25,29"
            fill="none"
            stroke="#000"
            strokeWidth="0.2"
          />
          {currentPlayer.courtLocation && (
            <circle
              cx={currentPlayer.courtLocation.x * 94}
              cy={currentPlayer.courtLocation.y * 50}
              r="0.5"
              fill="#38bdf8"
              stroke="#1e40af"
              strokeWidth="0.1"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

export default CourtSelection;
import { PauseIcon, PlayIcon } from '@heroicons/react/24/solid';

function ClockControls({
  periodType,
  currentPeriod,
  editMinutes,
  editSeconds,
  isClockRunning,
  onTimeEdit,
  onPlayPause,
}) {
  return (
    <div className="w-full flex justify-center items-center">
      <div className="bg-white px-6 text-3xl font-mono tracking-widest flex items-center gap-4">
        <span className="text-2xl">
          {periodType === 'quarters' ? `Q${currentPeriod}` : `H${currentPeriod}`}
        </span>
        <input
          type="text"
          value={editMinutes}
          onChange={(e) => onTimeEdit('minutes', e.target.value)}
          className="w-12 text-center bg-gray-100 rounded px-1"
          maxLength={2}
          aria-label="Edit minutes"
        />
        <span>:</span>
        <input
          type="text"
          value={editSeconds}
          onChange={(e) => onTimeEdit('seconds', e.target.value)}
          className="w-12 text-center bg-gray-100 rounded px-1"
          maxLength={2}
          aria-label="Edit seconds"
        />
        <button
          onClick={onPlayPause}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-800 transition"
          aria-label={isClockRunning ? 'Pause clock' : 'Start clock'}
        >
          {isClockRunning ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
        </button>
      </div>
    </div>
  );
}

export default ClockControls;
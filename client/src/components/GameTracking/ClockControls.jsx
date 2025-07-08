import React, { useState, useEffect } from 'react';
import { PauseIcon, PlayIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

export default function ClockControls({
  clockState,
  handleClockToggle,
  handlePeriodChange,
  handleTimeChange,
  periodDuration,
  overtimeDuration,
  game,
}) {
  const [editMinutes, setEditMinutes] = useState('');
  const [editSeconds, setEditSeconds] = useState('');
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);

  const getPeriodOptions = () => {
    const periodType = game?.league?.settings?.periodType || 'halves';
    let regularPeriods = [];
    if (periodType === 'halves') {
      regularPeriods = ['H1', 'H2'];
    } else if (periodType === 'quarters') {
      regularPeriods = ['Q1', 'Q2', 'Q3', 'Q4'];
    } else if (periodType === 'periods') {
      regularPeriods = ['P1', 'P2', 'P3'];
    }

    const maxOvertime = game?.playByPlay?.reduce((max, entry) => {
      if (entry.period.startsWith('OT')) {
        const otNumber = parseInt(entry.period.replace('OT', ''), 10);
        return Math.max(max, otNumber);
      }
      return max;
    }, 0) || 0;

    const overtimePeriods = Array.from({ length: Math.max(maxOvertime, 1) }, (_, i) => `OT${i + 1}`);
    return [...regularPeriods, ...overtimePeriods];
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { minutes, seconds: secs < 10 ? `0${secs}` : secs.toString() };
  };

  useEffect(() => {
    const { minutes, seconds } = formatTime(clockState.seconds);
    setEditMinutes(minutes.toString());
    setEditSeconds(seconds.toString());
  }, [clockState.seconds]);

  const onTimeEdit = (field, value) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) return;

    if (field === 'minutes') {
      setEditMinutes(value.slice(0, 2));
      const newMinutes = Math.min(parsed, 99);
      const newSeconds = parseInt(editSeconds, 10) || 0;
      handleTimeChange(newMinutes * 60 + newSeconds);
      toast.info(`Time updated to ${newMinutes}:${(editSeconds || '00').padStart(2, '0')}`, { toastId: 'time-edit' });
    } else {
      setEditSeconds(value.slice(0, 2));
      const newSeconds = Math.min(parsed, 59);
      const newMinutes = parseInt(editMinutes, 10) || 0;
      handleTimeChange(newMinutes * 60 + newSeconds);
      toast.info(`Time updated to ${newMinutes}:${newSeconds.toString().padStart(2, '0')}`, { toastId: 'time-edit' });
    }
  };

  const onPeriodSelect = (newPeriod) => {
    const duration = newPeriod.startsWith('OT') ? overtimeDuration : periodDuration;
    handleTimeChange(duration);
    handlePeriodChange(newPeriod);
    const { minutes, seconds } = formatTime(duration);
    setEditMinutes(minutes.toString());
    setEditSeconds(seconds.toString());
    toast.info(`Period changed to ${newPeriod} at ${minutes}:${seconds}`, { toastId: 'period-change' });
    setIsPeriodModalOpen(false);
  };

  useEffect(() => {
    if (clockState.seconds <= 0 && clockState.running) {
      handleClockToggle();
      toast.warn('Period ended', { toastId: 'period-end' });
    }
  }, [clockState.seconds, clockState.running, handleClockToggle]);

  return (
    <div className="w-full flex justify-center items-center mb-4" role="region" aria-label="Game Clock Controls">
      <div className="flex items-center gap-4 px-4 py-2 bg-white/90 backdrop-blur border border-gray-200 shadow rounded-lg">
        {/* Period Button */}
        <button
          onClick={() => setIsPeriodModalOpen(true)}
          className="text-lg font-semibold bg-gray-100 rounded px-3 py-1 hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Change game period"
        >
          {clockState.period || getPeriodOptions()[0] || 'H1'}
        </button>

        {/* Time Inputs */}
        <input
          type="text"
          value={editMinutes}
          onChange={(e) => onTimeEdit('minutes', e.target.value)}
          className="w-12 text-center text-lg bg-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          maxLength={2}
          aria-label="Edit minutes"
        />
        <span className="text-xl">:</span>
        <input
          type="text"
          value={editSeconds}
          onChange={(e) => onTimeEdit('seconds', e.target.value)}
          className="w-12 text-center text-lg bg-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          maxLength={2}
          aria-label="Edit seconds"
        />

        {/* Play/Pause Button */}
        <button
          onClick={handleClockToggle}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label={clockState.running ? 'Pause clock' : 'Start clock'}
        >
          {clockState.running ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
        </button>
      </div>

      {/* Period Modal */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-4 text-center">Select Period</h3>
            <div className="grid grid-cols-3 gap-3">
              {getPeriodOptions().map(period => (
                <button
                  key={period}
                  onClick={() => onPeriodSelect(period)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                >
                  {period}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsPeriodModalOpen(false)}
              className="mt-6 w-full py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

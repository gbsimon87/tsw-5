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

  // Generate period options based on periodType
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

    // Add overtime periods based on playByPlay data
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

  // Format seconds to MM:SS for display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { minutes, seconds: secs < 10 ? `0${secs}` : secs.toString() };
  };

  // Update input fields when clockState.seconds changes
  useEffect(() => {
    const { minutes, seconds } = formatTime(clockState.seconds);
    setEditMinutes(minutes.toString());
    setEditSeconds(seconds.toString());
  }, [clockState.seconds]);

  // Handle time edits
  const onTimeEdit = (field, value) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) {
      return; // Ignore invalid inputs
    }

    if (field === 'minutes') {
      setEditMinutes(value.slice(0, 2));
      const newMinutes = Math.min(parsed, 99); // Cap at 99 minutes
      const newSeconds = parseInt(editSeconds, 10) || 0;
      const totalSeconds = newMinutes * 60 + newSeconds;
      handleTimeChange(totalSeconds);
      toast.info(`Time updated to ${newMinutes}:${(editSeconds || '00').padStart(2, '0')}`, { toastId: 'time-edit' });
    } else if (field === 'seconds') {
      setEditSeconds(value.slice(0, 2));
      const newSeconds = Math.min(parsed, 59); // Cap at 59 seconds
      const newMinutes = parseInt(editMinutes, 10) || 0;
      const totalSeconds = newMinutes * 60 + newSeconds;
      handleTimeChange(totalSeconds);
      toast.info(`Time updated to ${newMinutes}:${newSeconds.toString().padStart(2, '0')}`, { toastId: 'time-edit' });
    }
  };

  // Handle period selection from modal
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

  // Stop clock at 0
  useEffect(() => {
    if (clockState.seconds <= 0 && clockState.running) {
      handleClockToggle();
      toast.warn('Period ended', { toastId: 'period-end' });
    }
  }, [clockState.seconds, clockState.running, handleClockToggle]);

  return (
    <div className="w-full flex justify-center items-center mb-4" role="region" aria-label="Game Clock Controls">
      <div className="bg-white px-6 text-3xl font-mono tracking-widest flex items-center gap-4">
        <button
          onClick={() => setIsPeriodModalOpen(true)}
          className="text-2xl bg-gray-100 rounded px-2 py-1 hover:bg-gray-200 transition"
          aria-label="Change game period"
        >
          {clockState.period || getPeriodOptions()[0] || 'H1'}
        </button>
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
          onClick={handleClockToggle}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-800 transition"
          aria-label={clockState.running ? 'Pause clock' : 'Start clock'}
        >
          {clockState.running ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
        </button>
      </div>
      {isPeriodModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Select Period</h3>
            <div className="grid grid-cols-2 gap-2">
              {getPeriodOptions().map(period => (
                <button
                  key={period}
                  onClick={() => onPeriodSelect(period)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {period}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsPeriodModalOpen(false)}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
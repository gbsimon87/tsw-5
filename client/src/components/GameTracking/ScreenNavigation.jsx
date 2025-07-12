import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UsersIcon, ArrowsRightLeftIcon, ChartBarIcon, ListBulletIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Modal from 'react-modal';
import { toast } from 'react-toastify'; // Add toast import
import axios from 'axios';

import { useAuth } from "../../context/AuthContext"; // Add useAuth import

export default function ScreenNavigation({ activeScreen, onScreenChange, setGame, gameId }) {
  const { leagueId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const screens = [
    { id: 'rosters', icon: UsersIcon, label: activeScreen === 'subs' ? 'Confirm' : 'Rosters' },
    { id: 'subs', icon: ArrowsRightLeftIcon, label: 'Subs' },
    { id: 'boxScore', icon: ChartBarIcon, label: 'Box Score' },
    { id: 'playByPlay', icon: ListBulletIcon, label: 'Play By Play' },
  ];

  const handleCancel = () => {
    // Reset selections to current active players
    onScreenChange('rosters');
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleFinishEditing = () => {
    navigate(`/leagues/${leagueId}`);
  };

  const handleMarkGameComplete = async () => {
    try {
      const response = await axios.patch(
        `/api/games/${gameId}`,
        { isCompleted: true },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setGame(prev => ({ ...prev, isCompleted: true }));
      toast.success('Game marked as complete!', { toastId: 'game-complete-success' });
      navigate(`/leagues/${leagueId}`);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to mark game as complete';
      toast.error(errorMessage, { toastId: 'game-complete-error' });
      console.error('[handleMarkGameComplete]', error);
    }
    closeModal();
  };

  return (
    <div className="flex justify-between mt-2 gap-2 p-4 w-full">
      <div className="grid grid-cols-5 gap-2 w-full">
        {screens.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onScreenChange(id)}
            className={`flex flex-col gap-2 items-center justify-center p-2 rounded-xl transition-colors duration-200 w-full ${
              activeScreen === id
                ? 'bg-blue-800 text-white shadow-lg scale-105'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
            aria-label={`Switch to ${label} screen`}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="text-xs text-center">{label}</span>
          </button>
        ))}
        <button
          onClick={openModal}
          className="flex flex-col gap-2 items-center justify-center p-2 rounded-xl bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors duration-200 w-full"
          aria-label="Open options menu"
        >
          <CheckCircleIcon className="h-5 w-5 mb-1" />
          <span className="text-xs text-center">Options</span>
        </button>
        {activeScreen === 'substitutions' && (
          <button
            onClick={handleCancel}
            className="flex flex-col gap-2 items-center justify-center p-2 rounded-xl bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors duration-200 w-full"
            aria-label="Cancel substitutions"
          >
            <span className="text-xs text-center">Cancel</span>
          </button>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="bg-white p-4 rounded shadow-lg max-w-md w-full mx-auto my-8"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        aria={{
          labelledby: "options-modal-title",
          describedby: "options-modal-description",
        }}
      >
        <h3 id="options-modal-title" className="text-lg font-bold mb-2">
          Game Options
        </h3>
        <div id="options-modal-description" className="flex flex-col gap-2">
          <button
            onClick={handleMarkGameComplete}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Mark Game as Complete
          </button>
          <button
            onClick={handleFinishEditing}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Finish Editing
          </button>
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
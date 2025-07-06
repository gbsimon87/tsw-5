import { UsersIcon, ChartBarIcon, ArrowsRightLeftIcon, ListBulletIcon } from '@heroicons/react/24/solid';

export default function ScreenNavigation({ activeScreen, onScreenChange }) {
  const screens = [
    { id: 'rosters', icon: UsersIcon, label: activeScreen === 'substitutions' ? 'Confirm' : 'Rosters' },
    { id: 'substitutions', icon: ArrowsRightLeftIcon, label: 'Substitutions' },
    { id: 'boxScore', icon: ChartBarIcon, label: 'Box Score' },
    { id: 'playByPlay', icon: ListBulletIcon, label: 'Play By Play' },
  ];

  const handleCancel = () => {
    // Reset selections to current active players
    onScreenChange('rosters');
  };

  return (
    <div className="flex justify-between mt-2 gap-2 p-4">
      {screens.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onScreenChange(id)}
          className={`flex flex-1 flex-col gap-2 items-center justify-center p-2 rounded-xl transition-colors duration-200 ${
            activeScreen === id
              ? 'bg-blue-800 text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
          aria-label={`Switch to ${label} screen`}
        >
          <Icon className="h-5 w-5 mb-1" />
          <span className="text-xs">{label}</span>
        </button>
      ))}
      {activeScreen === 'substitutions' && (
        <button
          onClick={handleCancel}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors duration-200"
          aria-label="Cancel substitutions"
        >
          <span className="text-xs">Cancel</span>
        </button>
      )}
    </div>
  );
}
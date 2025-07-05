import {
  ArrowsRightLeftIcon,
  ClockIcon,
  ListBulletIcon,
  TableCellsIcon,
  UserGroupIcon,
} from '@heroicons/react/24/solid';

function ScreenNavigation({
  activeScreen,
  onScreenChange,
}) {
  const screens = [
    { id: 'rosters', icon: UserGroupIcon, label: 'Players' },
    { id: 'playByPlay', icon: ListBulletIcon, label: 'PBP' },
    { id: 'substitutions', icon: ArrowsRightLeftIcon, label: 'Subs' },
    { id: 'boxScore', icon: TableCellsIcon, label: 'Box' },
    { id: 'quarterToggle', icon: ClockIcon, label: 'Qtr' },
  ];

  return (
    <div className="flex justify-around mt-2 gap-2">
      {screens.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onScreenChange(id)}
          className={`flex flex-1 flex-col items-center justify-center p-2 rounded-xl transition-colors duration-200 ${activeScreen === id
              ? 'bg-blue-800 text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          aria-label={`Switch to ${label} screen`}
        >
          <Icon className="h-5 w-5 mb-1" />
          <span className="text-xs">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default ScreenNavigation;
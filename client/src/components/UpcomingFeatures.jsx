import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';

export default function UpcomingFeatures() {
  const features = [
    {
      title: 'Add halves or quarters in league creation screen',
      status: 'done',
    },
    {
      title: 'Allow scorekeepers the option to not record the location on the court where the play was committed',
      status: 'todo',
    },
    {
      title: 'Prevent duplicate team names in a league',
      status: 'in-progress',
    },
    {
      title: 'When deleting a league, we must:',
      status: 'todo',
      subtasks: [
        { title: 'Render all the teams inactive', status: 'todo' },
        { title: 'Render all the players accounts in those teams inactive', status: 'todo' },
      ],
    },
    {
      title: 'Test the heatmaps on the player profile page',
      status: 'todo',
      subtasks: [
        { title: 'Allow the users the capability to have the spots on the court', status: 'todo' },
        { title: 'Include a play by play option so they can see the heatmap develop throughout the game', status: 'todo' },
      ],
    },
    {
      title: 'When creating a game, inform the user with a toast that the game has been created, or if there is an error',
      status: 'todo',
    },
    {
      title: 'Subs screen: show fouls per player, and disable fouled out players',
      status: 'todo',
    },
    {
      title: 'In the league settings, assign amount of fouls for a foul out',
      status: 'todo',
    },
    {
      title: 'In Player Profile page, allow the user to select which stat to display in the chart',
      status: 'todo',
    },
  ];

  const statusStyles = {
    done: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-blue-200 text-blue-900',
    todo: 'bg-blue-50 text-blue-700',
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'done':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />;
      case 'in-progress':
        return <ClockIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />;
      default:
        return <ExclamationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 class="text-2xl font-bold mb-6 text-center">
        <span className="mr-2">🚀</span> Upcoming Features & Fixes</h1>
      <ul className="space-y-4">
        {features.map((feature, idx) => (
          <li
            key={idx}
            className={`p-4 rounded-lg border-l-4 flex flex-col bg-gradient-to-br from-blue-50 to-blue-100/30 backdrop-blur-md shadow-sm
              ${feature.status === 'done'
                ? 'border-blue-500'
                : feature.status === 'in-progress'
                  ? 'border-blue-600'
                  : 'border-blue-400'
              }`}
          >
            <div className="flex items-center mb-2">
              {statusIcon(feature.status)}
              <span className={`ml-3 font-semibold ${feature.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {feature.title}
              </span>
              <span
                className={`ml-auto px-2 py-0.5 rounded text-xs font-semibold ${statusStyles[feature.status]}`}
              >
                {feature.status === 'done'
                  ? 'Done'
                  : feature.status === 'in-progress'
                    ? 'In Progress'
                    : 'To Do'}
              </span>
            </div>
            {feature.subtasks && (
              <ul className="ml-8 mt-2 space-y-2">
                {feature.subtasks.map((sub, subIdx) => (
                  <li key={subIdx} className="flex items-center">
                    <ChevronRightIcon className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0" />
                    {statusIcon(sub.status)}
                    <span className={`ml-3 ${sub.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {sub.title}
                    </span>
                    <span
                      className={`ml-auto px-2 py-0.5 rounded text-xs font-semibold ${statusStyles[sub.status]}`}
                    >
                      {sub.status === 'done'
                        ? 'Done'
                        : sub.status === 'in-progress'
                          ? 'In Progress'
                          : 'To Do'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-gray-500">
        Have suggestions?{' '}
        <a
          href="mailto:support@thesportyway.com"
          className="text-blue-600 hover:text-blue-800"
          aria-label="Contact us"
        >
          Contact us!
        </a>
      </p>
    </div>
  );
}
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';

export default function UpcomingFeatures() {
const features = [
  {
    title: "As a league admnistrator, I want to choose halves or quarters when creating a league so that the game format matches our needs.",
    status: "done",
  },
  {
    title: "As a scorekeeper, I want the option to skip recording the court location for a play so that I can save time when it's not needed.",
    status: "todo",
  },
  {
    title: "As a league admnistrator, I want to prevent duplicate team names so that each team is uniquely identifiable.",
    status: "in-progress",
  },
  {
    title: "As a league admnistrator, I want all related data handled properly when deleting a league so that no active teams or players remain by mistake.",
    status: "todo",
    subtasks: [
      {
        title: "As a league admnistrator, I want all teams in a deleted league to become inactive so that they don't appear in active lists.",
        status: "todo",
      },
      {
        title: "As a league admnistrator, I want all player accounts on those teams to become inactive so that they can't participate in deleted leagues.",
        status: "todo",
      },
    ],
  },
  {
    title: "As a player, I want to see accurate heatmaps on my profile so that I can analyze my performance.",
    status: "todo",
    subtasks: [
      {
        title: "As a player, I want to select spots on the court for the heatmap so that I can track my actions precisely.",
        status: "todo",
      },
      {
        title: "As a player, I want a play-by-play heatmap option so that I can see how my performance changes throughout the game.",
        status: "todo",
      },
    ],
  },
  {
    title: "As a user, I want to receive a confirmation or error toast when creating a game so that I know if it was successful.",
    status: "todo",
  },
  {
    title: "As a coach or scorekeeper, I want to see fouls per player and have fouled out players disabled on the subs screen so that substitutions are accurate.",
    status: "todo",
  },
  {
    title: "As a league admnistrator, I want to set the number of fouls for a foul out in league settings so that rules match our league's requirements.",
    status: "todo",
  },
  {
    title: "As a player, I want to select which stat to display on my profile chart so that I can focus on the stats that matter most to me.",
    status: "todo",
  },
];


  // Sort features: in-progress, todo, done
  const statusOrder = { 'in-progress': 0, 'todo': 1, 'done': 2 };
  const sortedFeatures = [...features].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );

  // Traffic light status styles
  const statusStyles = {
    'in-progress': 'text-yellow-600 border-yellow-400',
    todo: 'text-red-600 border-red-400',
    done: 'text-green-600 border-green-400',
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'done':
        return <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />;
      case 'in-progress':
        return <ClockIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
      default:
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />;
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case 'done':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'To Do';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        <span className="mr-2">🚀</span> Upcoming Features & Fixes
      </h1>
      <ul className="space-y-4">
        {sortedFeatures.map((feature, idx) => (
          <li
            key={idx}
            className={`p-4 rounded-lg border-l-4 flex flex-col shadow-sm border ${statusStyles[feature.status]}`}
            style={{ background: 'none' }}
          >
            <div className="flex items-center mb-1">
              {statusIcon(feature.status)}
              <span className={`ml-3 font-semibold ${feature.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {feature.title}
              </span>
            </div>
            <span
              className={`mt-2 px-2 py-0.5 rounded text-xs font-semibold w-max ${statusStyles[feature.status]}`}
            >
              {statusLabel(feature.status)}
            </span>
            {feature.subtasks && (
              <ul className="ml-8 mt-2 space-y-2">
                {feature.subtasks.map((sub, subIdx) => (
                  <li key={subIdx} className="flex flex-col">
                    <div className="flex items-center">
                      <ChevronRightIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                      {statusIcon(sub.status)}
                      <span className={`ml-3 ${sub.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {sub.title}
                      </span>
                    </div>
                    <span
                      className={`mt-1 ml-8 px-2 py-0.5 rounded text-xs font-semibold w-max ${statusStyles[sub.status]}`}
                    >
                      {statusLabel(sub.status)}
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

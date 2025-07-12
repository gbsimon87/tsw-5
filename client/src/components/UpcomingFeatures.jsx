import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';

export default function UpcomingFeatures() {
  const features = [
    // Difficulty 1: Simple UI changes or notifications
    {
      title: "As a user, I want to receive a confirmation or error toast when creating a game so that I know the answer.",
      status: "done"
    },
    {
      title: "As a user, I want to receive a confirmation or error toast when creating a league so that I know the answer.",
      status: "done"
    },
    {
      title: "As an admin, I need clearer wording to see my scheduled games from the Admin Panel",
      status: "done"
    },

    // Difficulty 2: Basic functionality or simple logic
    {
      title: "As a league administrator, I want to choose halves or quarters when creating a league so that the game format matches our needs.",
      status: "done"
    },
    {
      title: "As a league admin/manager, I want to assign jersey numbers to the players.",
      status: "done"
    },
    {
      title: "As a league administrator, I want to choose halves or quarters when creating a league so that the game format matches our needs.",
      status: "done"
    },
    {
      title: "As a scorekeeper, I want the option to skip recording the court location for a play so that I can save time when it's not needed.",
      status: "todo"
    },
    {
      title: "As a league administrator, I want to prevent duplicate league names that I am the admin of.",
      status: "done"
    },
    {
      title: "As a league administrator, I want to prevent duplicate team names so that each team is uniquely identifiable.",
      status: "done"
    },
    {
      title: "As a league administrator, I want to set the number of fouls for a foul out in league settings so that rules match our league's requirements.",
      status: "done"
    },
    {
      title: "As a user, I should be able to upload a profile picture.",
      status: "todo"
    },
    {
      title: "As an admin, I should be able to upload images for the league logo and team logos.",
      status: "todo"
    },
    {
      title: "As a team manager, I should be able to upload images for the team logos.",
      status: "todo"
    },

    // Difficulty 3: Moderate complexity with logic or data handling
    {
      title: "As an admin or manager, I want to be able to choose a 2PT field goal or a 3PT field goal and choose 'nobody' as the assist.",
      status: "done"
    },
    {
      title: "As a member of a team, I want to have a clear view of which of my teams are active and which are inactive.",
      status: "todo"
    },
    {
      title: "As a coach or scorekeeper, I want to see fouls per player and have fouled out players disabled on the subs screen so that substitutions are accurate.",
      status: "todo"
    },
    {
      title: "As a player, I want to select which stat to display on my profile chart so that I can focus on the stats that matter most to me.",
      status: "todo"
    },
    {
      title: "As an admin, I need the ability to add other administrators.",
      status: "todo"
    },
    {
      title: "As a user, if my authentication token goes invalid, I should be redirected to the login page.",
      status: "todo"
    },
    {
      title: "As a user, I should be able to request to join a league.",
      status: "todo"
    },
    {
      title: "As an admin, I should see a list of requests to join the league, and accept or deny them.",
      status: "todo"
    },
    {
      title: "As a player, I should be informed from MySporty if I don't have any upcoming games.",
      status: "todo"
    },

    // Difficulty 4: Complex features with significant logic or system impact
    {
      title: "As a league administrator, I want all related data handled properly when deleting a league so that no active teams or players remain by mistake.",
      status: "todo",
      subtasks: [
        {
          title: "As a league administrator, I want all teams in a deleted league to become inactive so that they don't appear in active lists.",
          status: "todo"
        },
        {
          title: "As a league administrator, I want all player accounts on those teams to become inactive so that they can't participate in deleted leagues.",
          status: "todo"
        }
      ]
    },
    {
      title: "As an admin, I need to add a a second admin to the league within 90 days or the functionality to edit the league will be cut off.",
      status: "todo"
    },
    {
      title: "As an admin, I want to be able to create a season and carry over teams for the next season.",
      status: "todo"
    },
    {
      title: "As a user who is logged in, I should be able to vote on upcoming features.",
      status: "todo"
    },
    {
      title: "System - Fix refresh token expiration.",
      status: "todo"
    },

    // Difficulty 5: Highly complex features with extensive processing
    {
      title: "As a player, I want to see accurate heatmaps on my profile so that I can analyze my performance.",
      status: "todo",
      subtasks: [
        {
          title: "As a player, I want to select spots on the court for the heatmap so that I can track my actions precisely.",
          status: "todo"
        },
        {
          title: "As a player, I want a play-by-play heatmap option so that I can see how my performance changes throughout the game.",
          status: "todo"
        }
      ]
    },
    {
      title: "As a player, I want to see accurate heatmaps on my profile so that I can analyze my performance.",
      status: "todo",
      subtasks: [
        {
          title: "As a player, I want to select spots on the court for the heatmap so that I can track my actions precisely.",
          status: "todo"
        },
        {
          title: "As a player, I want a play-by-play heatmap option so that I can see how my performance changes throughout the game.",
          status: "todo"
        }
      ]
    }
  ];

  // Sort features: in-progress, todo, done
  const statusOrder = { 'in-progress': 0, 'todo': 1, 'done': 2 };
  const sortedFeatures = [...features].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );

  // Status styles
  const statusStyles = {
    'in-progress': 'border-yellow-500 text-yellow-700 bg-yellow-50',
    todo: 'border-blue-500 text-blue-700 bg-blue-50',
    done: 'border-green-600 text-green-700 bg-green-50',
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'done':
        return <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />;
      case 'in-progress':
        return <ClockIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
      default:
        return <ExclamationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-slate-800 px-4">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-white drop-shadow">
          <span className="mr-2">🚀</span> Upcoming Features & Fixes
        </h1>
        <ul className="space-y-5">
          {sortedFeatures.map((feature, idx) => (
            <li
              key={idx}
              className={`
                bg-gradient-to-br from-white to-slate-100
                border-l-4 rounded-xl shadow flex flex-col border
                p-5 ${statusStyles[feature.status]}
              `}
            >
              <div className="flex items-center mb-1">
                {statusIcon(feature.status)}
                <span className={`ml-3 font-semibold ${feature.status === 'done' ? 'line-through text-gray-400' : 'text-slate-800'}`}>
                  {feature.title}
                </span>
              </div>
              <span
                className={`mt-2 px-2 py-0.5 rounded text-xs font-semibold w-max ${statusStyles[feature.status]}`}
              >
                {statusLabel(feature.status)}
              </span>
              {feature.subtasks && (
                <ul className="ml-8 mt-3 space-y-2 border-l-2 border-slate-200 pl-4">
                  {feature.subtasks.map((sub, subIdx) => (
                    <li key={subIdx} className="flex flex-col">
                      <div className="flex items-center">
                        <ChevronRightIcon className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                        {statusIcon(sub.status)}
                        <span className={`ml-3 ${sub.status === 'done' ? 'line-through text-gray-400' : 'text-slate-700'}`}>
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
        <p className="mt-8 text-sm text-slate-300 text-center">
          Have suggestions?{' '}
          <a
            href="mailto:support@thesportyway.com"
            className="text-blue-300 hover:text-blue-100 underline"
            aria-label="Contact us"
          >
            Contact us!
          </a>
        </p>
      </div>
    </div>
  );
}

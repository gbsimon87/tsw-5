import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  SparklesIcon,
  UsersIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightEndOnRectangleIcon
} from '@heroicons/react/24/outline';

// Admin and Player features (no "(Coming Soon)" in titles)
const adminFeatures = [
  {
    title: "Admin Panel",
    description: "View, manage, and launch new leagues in seconds, all from one powerful dashboard!",
    icon: Cog6ToothIcon,
    link: "/admin",
    linkLabel: "Admin Panel",
    comingSoon: false,
    bg: "from-blue-50 to-blue-100"
  },
  {
    title: "Standings & Rankings",
    description: "View team standings and player leaderboards.",
    icon: TrophyIcon,
    comingSoon: true,
    bg: "from-gray-50 to-gray-100"
  }
];

const playerFeatures = [
  {
    title: "Sporty Leagues",
    description: "Discover Sporty leagues, view teams, and join the action.",
    icon: SparklesIcon,
    link: "/public-leagues",
    linkLabel: "Explore Now",
    comingSoon: false,
    bg: "from-blue-50 to-blue-100"
  },
  {
    title: "Player Stats",
    description: "Track player performance, efficiency, and game stats.",
    icon: UsersIcon,
    comingSoon: true,
    bg: "from-gray-50 to-gray-100"
  }
];

const whyChooseSporty = [
  {
    title: "For Parents & Friends",
    description: "Stay updated on your kids’ games, track their team’s progress, and never miss a moment.",
    iconBg: "from-blue-200 to-blue-300",
    semantic: "audience"
  },
  {
    title: "For League Managers",
    description: "Simplify league management with tools to organize teams and monitor stats.",
    iconBg: "from-blue-200 to-blue-300",
    semantic: "management"
  },
  {
    title: "For Players",
    description: "Monitor your stats, track your development, and shine on the leaderboard.",
    iconBg: "from-blue-200 to-blue-300",
    semantic: "players"
  },
  {
    title: "Accessible for All",
    description: "Designed with accessibility in mind, so everyone can participate and enjoy.",
    iconBg: "from-green-200 to-green-300",
    semantic: "accessibility"
  },
  {
    title: "Mobile Friendly",
    description: "Enjoy a seamless experience on any device, wherever you are.",
    iconBg: "from-yellow-200 to-yellow-300",
    semantic: "mobile"
  },
  {
    title: "Community Driven",
    description: "Built for and by sports lovers - your feedback shapes our future.",
    iconBg: "from-pink-200 to-pink-300",
    semantic: "community"
  },
  {
    title: "Privacy First",
    description: "Your data is secure and never shared without your consent.",
    iconBg: "from-gray-200 to-gray-300",
    semantic: "privacy"
  }
];

// Helper to render feature cards
function renderFeatures(features, isAuthenticated) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <article
            key={feature.title}
            className={`bg-gradient-to-br ${feature.bg} glass rounded-xl shadow p-5 border border-white/20 flex flex-col items-start transition-all hover:shadow-xl ${feature.comingSoon ? 'opacity-75' : ''}`}
          >
            <div className="flex justify-center items-center w-full mb-3">
              <Icon className="w-14 h-14 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{feature.title}</h3>
            <p className="text-gray-600 mb-2">{feature.description}</p>
            {feature.comingSoon ? (
              <span className="text-blue-400 font-semibold mt-auto">Stay Tuned!</span>
            ) : (
              <Link
                to={isAuthenticated ? feature.link : '/login'}
                className="text-blue-600 font-medium hover:underline mt-auto"
                aria-label={isAuthenticated ? feature.linkLabel : 'Login to Start'}
              >
                {isAuthenticated ? feature.linkLabel : 'Login to Start'}
              </Link>
            )}
          </article>
        );
      })}
    </div>
  );
}

/**
 * Homepage landing page highlighting features and user value
 * @component
 * @returns {JSX.Element}
 */
function Home() {
  const { user } = useAuth();
  const isAuthenticated = user !== null;

  return (
    <>
      <style>
        {`
          .glass {
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          @keyframes marquee-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}
      </style>
      {/* Welcome Section */}
      <section
        className="bg-gray-800 text-white py-20 text-center"
        aria-label="Welcome section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 flex items-center justify-center">
            <SparklesIcon className="w-10 h-10 mr-2 text-blue-300" />
            Welcome to The Sporty Way
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Connect, manage, and track your sports leagues with ease.
          </p>
          <div className="flex justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/my-sporty"
                  className="inline-flex items-center bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  aria-label="Go to My Sporty"
                >
                  <UserCircleIcon className="w-6 h-6 mr-2 text-blue-200" aria-hidden="true" />
                  My Sporty
                </Link>
                <Link
                  to="/admin"
                  className="inline-flex items-center bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold shadow-lg border border-blue-500 hover:bg-blue-50 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  aria-label="Go to Admin Panel"
                >
                  <Cog6ToothIcon className="w-6 h-6 mr-2 text-blue-500" aria-hidden="true" />
                  Admin Panel
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label="Login"
              >
                <ArrowRightEndOnRectangleIcon className="w-6 h-6 mr-2 text-blue-200" aria-hidden="true" />
                Login
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Admin Features Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-10 flex items-center justify-center">
            <Cog6ToothIcon className="w-7 h-7 mr-2 text-blue-600" />
            Admin Features
          </h2>
          {renderFeatures(adminFeatures, isAuthenticated)}
        </div>
      </section>

      {/* Player Features Section */}
      <section className="py-12 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-10 flex items-center justify-center">
            <UsersIcon className="w-7 h-7 mr-2 text-blue-600" />
            Player Features
          </h2>
          {renderFeatures(playerFeatures, isAuthenticated)}
        </div>
      </section>

      {/* Why Choose Section (Marquee) */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12 flex items-center justify-center">
            <UsersIcon className="w-8 h-8 mr-2 text-blue-600" />
            Why Choose The Sporty Way?
          </h2>
          <div className="overflow-hidden relative w-full">
            <div
              className="flex w-max"
              style={{
                animation: "marquee-left 45s linear infinite"
              }}
            >
              {[...whyChooseSporty, ...whyChooseSporty].map((reason, idx) => (
                <article
                  key={idx}
                  className="min-w-[220px] max-w-xs mx-3 text-center bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-30 glass rounded-xl shadow p-4 border border-white/20 flex-shrink-0"
                  aria-label={reason.semantic}
                >
                  <div
                    className={`h-16 w-16 bg-gradient-to-br ${reason.iconBg} rounded-full mx-auto mb-3`}
                    aria-hidden="true"
                  />
                  <h3 className="text-base font-semibold text-gray-800 mb-1">{reason.title}</h3>
                  <p className="text-gray-600 text-sm">{reason.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12 flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-8 h-8 mr-2 text-blue-600" />
            What Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <article className="bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-30 glass rounded-xl shadow p-6 border border-white/20">
              <p className="text-gray-600 italic">
                “The Sporty Way makes it so easy to follow my son’s games!”
              </p>
              <p className="mt-4 font-semibold text-gray-800">— Jane, Parent</p>
            </article>
            <article className="bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-30 glass rounded-xl shadow p-6 border border-white/20">
              <p className="text-gray-600 italic">
                “Managing my league has never been simpler. Love the tools!”
              </p>
              <p className="mt-4 font-semibold text-gray-800">— Mike, League Manager</p>
            </article>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-8 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="mb-4 text-lg">Join the sports community today!</p>
          <div className="flex align-center justify-center space-x-6">
            <Link
              to="/public-leagues"
              className="text-white hover:text-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-label="View Sporty Leagues"
            >
              Explore Leagues
            </Link>
            <Link
              to={isAuthenticated ? '/admin' : '/register'}
              className="text-white hover:text-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-label={isAuthenticated ? 'Manage Leagues' : 'Join Now'}
            >
              {isAuthenticated ? 'Manage Leagues' : 'Join Now'}
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Home;

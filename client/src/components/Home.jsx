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

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12 flex items-center justify-center">
            <TrophyIcon className="w-8 h-8 mr-2 text-blue-600" />
            Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <article className="bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-30 glass rounded-xl shadow-lg p-6 border border-white/20 hover:scale-105 transition-transform duration-200">
              <div
                className="h-32 bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg mb-4"
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Sporty Leagues</h3>
              <p className="text-gray-600">
                Discover Sporty leagues, view teams, and join the action.
              </p>
              <Link
                to="/public-leagues"
                className="text-blue-600 hover:text-blue-800 mt-4 inline-block focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label="View Sporty Leagues"
              >
                Explore Now
              </Link>
            </article>
            <article className="bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-30 glass rounded-xl shadow-lg p-6 border border-white/20 hover:scale-105 transition-transform duration-200">
              <div
                className="h-32 bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg mb-4"
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Admin Zone</h3>
              <p className="text-gray-600">
                Create and organize leagues, manage teams effortlessly.
              </p>
              <Link
                to={isAuthenticated ? '/admin' : '/login'}
                className="text-blue-600 hover:text-blue-800 mt-4 inline-block focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label={isAuthenticated ? 'Create a League' : 'Login to Create a League'}
              >
                {isAuthenticated ? 'Create League' : 'Login to Start'}
              </Link>
            </article>
            <article className="bg-gradient-to-br from-gray-50 to-gray-100 bg-opacity-30 glass rounded-xl shadow-lg p-6 border border-white/20 opacity-75">
              <div
                className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-4"
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Player Stats (Coming Soon)</h3>
              <p className="text-gray-600">
                Track player performance, efficiency, and game stats.
              </p>
              <span className="text-gray-500 mt-4 inline-block">Stay Tuned!</span>
            </article>
            <article className="bg-gradient-to-br from-gray-50 to-gray-100 bg-opacity-30 glass rounded-xl shadow-lg p-6 border border-white/20 opacity-75">
              <div
                className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-4"
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Standings & Rankings (Coming Soon)</h3>
              <p className="text-gray-600">
                View team standings and player leaderboards.
              </p>
              <span className="text-gray-500 mt-4 inline-block">Stay Tuned!</span>
            </article>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12 flex items-center justify-center">
            <UsersIcon className="w-8 h-8 mr-2 text-blue-600" />
            Why Choose The Sporty Way?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article className="text-center bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-30 glass rounded-xl shadow-lg p-6 border border-white/20 hover:scale-105 transition-transform duration-200">
              <div
                className="h-24 w-24 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full mx-auto mb-4"
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">For Parents & Friends</h3>
              <p className="text-gray-600">
                Stay updated on your kids’ games, track their team’s progress, and never miss a moment.
              </p>
            </article>
            <article className="text-center bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-30 glass rounded-xl shadow-lg p-6 border border-white/20 hover:scale-105 transition-transform duration-200">
              <div
                className="h-24 w-24 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full mx-auto mb-4"
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">For League Managers</h3>
              <p className="text-gray-600">
                Simplify league management with tools to organize teams and monitor stats.
              </p>
            </article>
            <article className="text-center bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-30 glass rounded-xl shadow-lg p-6 border border-white/20 hover:scale-105 transition-transform duration-200">
              <div
                className="h-24 w-24 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full mx-auto mb-4"
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">For Players</h3>
              <p className="text-gray-600">
                Monitor your stats, track your development, and shine on the leaderboard.
              </p>
            </article>
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
            <article className="bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-30 glass rounded-xl shadow-lg p-6 border border-white/20 hover:scale-105 transition-transform duration-200">
              <p className="text-gray-600 italic">
                “The Sporty Way makes it so easy to follow my son’s games!”
              </p>
              <p className="mt-4 font-semibold text-gray-800">— Jane, Parent</p>
            </article>
            <article className="bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-30 glass rounded-xl shadow-lg p-6 border border-white/20 hover:scale-105 transition-transform duration-200">
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
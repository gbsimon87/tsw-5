import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  SparklesIcon,
  UsersIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightEndOnRectangleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

// Masculine, athletic gradients and icon colors
const adminFeatures = [
  {
    title: 'Admin Panel',
    description: 'View, manage, and launch new leagues in seconds, all from one powerful dashboard!',
    icon: Cog6ToothIcon,
    iconColor: 'text-blue-700',
    link: '/admin',
    linkLabel: 'Admin Panel',
    comingSoon: false,
    bg: 'from-blue-100 to-blue-300',
  },
  {
    title: 'Standings & Rankings',
    description: 'View team standings and player leaderboards.',
    icon: TrophyIcon,
    iconColor: 'text-amber-600',
    comingSoon: true,
    bg: 'from-gray-100 to-gray-300',
  },
  {
    title: 'Manage Team Schedules',
    description: 'Create and organize detailed schedules for all your teams.',
    icon: CalendarDaysIcon,
    iconColor: 'text-purple-700',
    link: '/admin/schedules',
    linkLabel: 'Manage Schedules',
    comingSoon: false,
    bg: 'from-purple-100 to-purple-300',
  },
];

const playerFeatures = [
  {
    title: 'Join Multiple Teams',
    description: 'Join different teams across various sports with one account.',
    icon: UsersIcon,
    iconColor: 'text-green-700',
    link: '/teams/join',
    linkLabel: 'Join Teams',
    comingSoon: false,
    bg: 'from-green-100 to-green-300',
  },
  {
    title: 'Player Stats',
    description: 'Track player performance, efficiency, and game stats.',
    icon: UsersIcon,
    iconColor: 'text-blue-700',
    comingSoon: true,
    bg: 'from-slate-100 to-slate-300',
  },
  {
    title: 'Career Stats per Team',
    description: 'View your full career stats broken down by team.',
    icon: UserCircleIcon,
    iconColor: 'text-sky-700',
    link: '/my-sporty/stats',
    linkLabel: 'View Stats',
    comingSoon: false,
    bg: 'from-sky-100 to-sky-300',
  },
];

const whyChooseSporty = [
  {
    title: 'For Parents & Friends',
    description: 'Stay updated on your kids’ games, track their team’s progress, and never miss a moment.',
    iconBg: 'from-blue-200 to-blue-400',
    semantic: 'audience',
  },
  {
    title: 'For League Managers',
    description: 'Simplify league management with tools to organize teams and monitor stats.',
    iconBg: 'from-green-200 to-green-400',
    semantic: 'management',
  },
  {
    title: 'For Players',
    description: 'Monitor your stats, track your development, and shine on the leaderboard.',
    iconBg: 'from-slate-200 to-slate-400',
    semantic: 'players',
  },
  {
    title: 'Accessible for All',
    description: 'Designed with accessibility in mind, so everyone can participate and enjoy.',
    iconBg: 'from-gray-200 to-gray-400',
    semantic: 'accessibility',
  },
  {
    title: 'Mobile Friendly',
    description: 'Enjoy a seamless experience on any device, wherever you are.',
    iconBg: 'from-blue-100 to-blue-300',
    semantic: 'mobile',
  },
  {
    title: 'Community Driven',
    description: 'Built for and by sports lovers - your feedback shapes our future.',
    iconBg: 'from-green-100 to-green-300',
    semantic: 'community',
  },
  {
    title: 'Privacy First',
    description: 'Your data is secure and never shared without your consent.',
    iconBg: 'from-slate-100 to-slate-300',
    semantic: 'privacy',
  },
];

// Helper to render feature cards
function renderFeatures(features, isAuthenticated) {
  console.log('renderFeatures called with features:', features);
  if (!Array.isArray(features)) {
    console.error('Features is not an array:', features);
    return (
      <div className="text-red-600 text-center">
        Error: Unable to display features. Please try again later.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <article
            key={feature.title}
            className={`
              bg-gradient-to-br ${feature.bg}
              glass rounded-xl shadow p-5 border border-white/20
              flex flex-col items-start transition-all hover:shadow-xl
              ${feature.comingSoon ? 'opacity-70' : ''}
            `}
          >
            <div className="flex justify-center items-center w-full mb-3">
              <Icon className={`w-14 h-14 ${feature.iconColor}`} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{feature.title}</h3>
            <p className="text-gray-700 mb-2">{feature.description}</p>
            {feature.comingSoon ? (
              <span className="text-blue-500 font-semibold mt-auto">Stay Tuned!</span>
            ) : (
              <Link
                to={isAuthenticated ? feature.link : '/login'}
                className="text-blue-700 font-medium hover:underline mt-auto"
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

// Helper to render discover leagues
function DiscoverLeagues({ leagues }) {
  console.log('DiscoverLeagues called with leagues:', leagues);
  if (!Array.isArray(leagues)) {
    console.error('Leagues is not an array:', leagues);
    return (
      <div className="text-red-600 text-center">
        Error: Unable to display leagues. Please try again later.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {leagues.length === 0 ? (
        <p className="text-gray-700 text-center col-span-full">No active leagues found.</p>
      ) : (
        leagues.map((league) => (
          <article
            key={league._id}
            className="bg-gradient-to-br from-blue-100 to-slate-100 glass rounded-xl shadow p-5 border border-white/20 flex flex-col items-center transition-all hover:shadow-xl"
          >
            <img
              src={league.logo || '/league-logo.png'}
              alt={`${league.name} Logo`}
              className="w-16 h-16 rounded-full mb-3 object-cover"
            />
            <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">{league.name}</h3>
            <Link
              to="/login"
              className="text-blue-700 font-medium hover:underline mt-auto"
              aria-label={`Login to join ${league.name}`}
            >
              Join League
            </Link>
          </article>
        ))
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const isAuthenticated = user !== null;
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return; // Only fetch leagues for unauthenticated users

    async function fetchPublicLeagues() {
      setLoading(true);
      try {
        const response = await axios.get('/api/leagues/public-leagues');
        console.log('Public leagues response:', response.data);
        setLeagues(response.data || []);
      } catch (err) {
        console.error('Fetch public leagues error:', err);
        setLeagues([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPublicLeagues();
  }, [isAuthenticated]);

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
        className="bg-gradient-to-br from-blue-900 via-blue-700 to-slate-800 text-white py-20 text-center"
        aria-label="Welcome section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 flex items-center justify-center drop-shadow-lg">
            <SparklesIcon className="w-10 h-10 mr-2 text-blue-300" />
            The Sporty Way
          </h1>
          <p className="text-xl mb-8 text-blue-100 drop-shadow">
            Connect, manage, and track your sports leagues with ease.
          </p>
          <div className="flex justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/my-sporty"
                  className="inline-flex items-center bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-800 transition focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  aria-label="Go to My Sporty"
                >
                  <UserCircleIcon className="w-6 h-6 mr-2 text-blue-200" aria-hidden="true" />
                  My Sporty
                </Link>
                <Link
                  to="/admin"
                  className="inline-flex items-center bg-white text-blue-800 px-8 py-3 rounded-lg font-semibold shadow-lg border border-blue-400 hover:bg-blue-50 transition focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  aria-label="Go to Admin Panel"
                >
                  <Cog6ToothIcon className="w-6 h-6 mr-2 text-blue-400" aria-hidden="true" />
                  Admin Panel
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-800 transition focus:ring-2 focus:ring-blue-400 focus:outline-none"
                aria-label="Login"
              >
                <ArrowRightEndOnRectangleIcon className="w-6 h-6 mr-2 text-blue-200" aria-hidden="true" />
                Pave Your Path
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Conditional Sections */}
      {isAuthenticated ? (
        <>
          {/* Admin Features Section */}
          <section className="py-12 bg-gradient-to-br from-blue-50 to-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-800 text-center mb-10 flex items-center justify-center">
                <Cog6ToothIcon className="w-7 h-7 mr-2 text-blue-700" />
                Admin Features
              </h2>
              {renderFeatures(adminFeatures, isAuthenticated)}
            </div>
          </section>

          {/* Player Features Section */}
          <section className="py-12 bg-gradient-to-br from-green-50 to-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-green-800 text-center mb-10 flex items-center justify-center">
                <UsersIcon className="w-7 h-7 mr-2 text-green-700" />
                Player Features
              </h2>
              {renderFeatures(playerFeatures, isAuthenticated)}
            </div>
          </section>

          {/* Why Choose Section (Marquee) */}
          <section className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-blue-800 text-center mb-12 flex items-center justify-center">
                <UsersIcon className="w-8 h-8 mr-2 text-blue-700" />
                Why Choose The Sporty Way?
              </h2>
              <div className="overflow-hidden relative w-full">
                <div
                  className="flex w-max py-4"
                  style={{
                    animation: 'marquee-left 45s linear infinite',
                  }}
                >
                  {Array.isArray(whyChooseSporty) ? (
                    [...whyChooseSporty, ...whyChooseSporty].map((reason, idx) => (
                      <article
                        key={idx}
                        className="min-w-[220px] max-w-xs mx-3 text-center bg-gradient-to-br bg-opacity-80 glass rounded-xl shadow p-4 border border-white/20 flex-shrink-0"
                        style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
                        aria-label={reason.semantic}
                      >
                        <div
                          className={`h-16 w-16 bg-gradient-to-br ${reason.iconBg} rounded-full mx-auto mb-3`}
                          aria-hidden="true"
                        />
                        <h3 className="text-base font-semibold text-gray-800 mb-1">{reason.title}</h3>
                        <p className="text-gray-700 text-sm">{reason.description}</p>
                      </article>
                    ))
                  ) : (
                    <div className="text-red-600 text-center">
                      Error: Unable to display reasons. Please try again later.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="bg-gradient-to-br from-slate-50 to-gray-100 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-blue-800 text-center mb-12 flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-8 h-8 mr-2 text-amber-600" />
                What Users Say
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <article className="bg-gradient-to-br from-blue-100 to-slate-100 glass rounded-xl shadow p-6 border border-white/20">
                  <p className="text-gray-700 italic">
                    “The Sporty Way makes it so easy to follow my son’s games!”
                  </p>
                  <p className="mt-4 font-semibold text-gray-900">— Jane, Parent</p>
                </article>
                <article className="bg-gradient-to-br from-green-100 to-slate-100 glass rounded-xl shadow p-6 border border-white/20">
                  <p className="text-gray-700 italic">
                    “Managing my league has never been simpler. Love the tools!”
                  </p>
                  <p className="mt-4 font-semibold text-gray-900">— Mike, League Manager</p>
                </article>
              </div>
            </div>
          </section>
        </>
      ) : (
        /* Discover Section */
        <section className="py-12 bg-gradient-to-br from-blue-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-800 text-center mb-10 flex items-center justify-center">
              <SparklesIcon className="w-7 h-7 mr-2 text-blue-700" />
              Discover Leagues
            </h2>
            {loading ? (
              <p className="text-gray-700 text-center">Loading leagues...</p>
            ) : (
              <DiscoverLeagues leagues={leagues} />
            )}
          </div>
        </section>
      )}

      {/* Footer Section */}
      <footer className="bg-gradient-to-br from-blue-800 to-slate-900 text-white py-8 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="mb-4 text-lg">Join the sports community today!</p>
          <div className="flex align-center justify-center space-x-6">
            <Link
              to="/public-leagues"
              className="text-white hover:text-amber-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              aria-label="View Sporty Leagues"
            >
              Explore Leagues
            </Link>
            <Link
              to={isAuthenticated ? '/admin' : '/register'}
              className="text-white hover:text-amber-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
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
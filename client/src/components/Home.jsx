import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  SparklesIcon,
  UsersIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightEndOnRectangleIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  DevicePhoneMobileIcon,
  ChatBubbleBottomCenterTextIcon,
  LockClosedIcon,
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
    link: '/login',
    comingSoon: false,
    bg: 'from-gray-100 to-gray-300',
  },
  {
    title: 'Manage Team Schedules',
    description: 'Create and organize detailed schedules for all your teams.',
    icon: CalendarDaysIcon,
    iconColor: 'text-purple-700',
    link: '/login',
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
    link: '/join',
    linkLabel: 'Join Now',
    comingSoon: false,
    bg: 'from-slate-100 to-slate-300',
  },
  {
    title: 'Career Stats per Team',
    description: 'View your full career stats broken down by team.',
    icon: UserCircleIcon,
    iconColor: 'text-sky-700',
    link: '/login',
    linkLabel: 'Join Now',
    comingSoon: false,
    bg: 'from-sky-100 to-sky-300',
  },
];

const whyChooseSporty = [
  {
    title: 'For Parents & Friends',
    description: 'Stay updated on your kids’ games, track their team’s progress, and never miss a moment.',
    icon: UsersIcon,
    iconColor: 'text-blue-600',
    bg: 'from-blue-200 to-blue-400',
    semantic: 'audience',
  },
  {
    title: 'For League Managers',
    description: 'Simplify league management with tools to organize teams and monitor stats.',
    icon: ClipboardDocumentListIcon,
    iconColor: 'text-green-600',
    bg: 'from-green-200 to-green-400',
    semantic: 'management',
  },
  {
    title: 'For Players',
    description: 'Monitor your stats, track your development, and shine on the leaderboard.',
    icon: ChartBarIcon,
    iconColor: 'text-slate-600',
    bg: 'from-slate-200 to-slate-400',
    semantic: 'players',
  },
  {
    title: 'Accessible for All',
    description: 'Designed with accessibility in mind, so everyone can participate and enjoy.',
    icon: AdjustmentsHorizontalIcon,
    iconColor: 'text-gray-600',
    bg: 'from-gray-200 to-gray-400',
    semantic: 'accessibility',
  },
  {
    title: 'Mobile Friendly',
    description: 'Enjoy a seamless experience on any device, wherever you are.',
    icon: DevicePhoneMobileIcon,
    iconColor: 'text-blue-500',
    bg: 'from-blue-100 to-blue-300',
    semantic: 'mobile',
  },
  {
    title: 'Community Driven',
    description: 'Built for and by sports lovers - your feedback shapes our future.',
    icon: ChatBubbleBottomCenterTextIcon,
    iconColor: 'text-green-500',
    bg: 'from-green-100 to-green-300',
    semantic: 'community',
  },
  {
    title: 'Privacy First',
    description: 'Your data is secure and never shared without your consent.',
    icon: LockClosedIcon,
    iconColor: 'text-slate-500',
    bg: 'from-slate-100 to-slate-300',
    semantic: 'privacy',
  },
];

/* Add this custom hook and animation variants after the whyChooseSporty array */
function useParallax() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '0%']);
  return { ref, y };
}

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, duration: 0.6, ease: 'easeOut' },
  }),
};

// Helper to render feature cards
function renderFeatures(features, isAuthenticated, shouldReduceMotion) {
  if (!Array.isArray(features)) {
    console.error('Features is not an array:', features);
    return (
      <div className="text-red-600 text-center" role="alert" aria-live="assertive">
        Error: Unable to display features. Please try again later.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => {
        const Icon = feature?.icon;
        return (
          <motion.article
            key={feature?.title || `feature-${Math.random()}`}
            className={`
              bg-gradient-to-br ${feature?.bg || 'from-gray-100 to-gray-300'}
              glass rounded-xl shadow-lg p-5 border border-gray-100
              flex flex-col items-start
              ${feature?.comingSoon ? 'opacity-70' : ''}
            `}
            role="article"
            aria-label={feature?.title || 'Feature card'}
            variants={shouldReduceMotion ? {} : cardVariants}
            initial="hidden"
            animate="visible"
            custom={index}
            whileHover={shouldReduceMotion ? {} : { scale: 1.05, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
          >
            <motion.div
              className="flex justify-center items-center w-full mb-3"
              animate={shouldReduceMotion ? {} : { rotate: [0, 5, -5, 0], transition: { repeat: Infinity, duration: 3 } }}
            >
              {Icon ? <Icon className={`w-14 h-14 ${feature?.iconColor || 'text-gray-600'}`} aria-hidden="true" /> : <Skeleton circle height={56} width={56} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />}
            </motion.div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{feature?.title || 'Untitled Feature'}</h3>
            <p className="text-gray-700 mb-2">{feature?.description || 'No description available'}</p>
            {feature?.comingSoon ? (
              <span className="text-blue-600 font-semibold mt-auto" role="status" aria-live="polite">
                Stay Tuned!
              </span>
            ) : (
              <Link
                to={isAuthenticated ? feature?.link || '#' : '/login'}
                className="text-blue-700 font-medium hover:underline mt-auto focus:ring-2 focus:ring-blue-600 focus:outline-none"
                aria-label={isAuthenticated ? `Navigate to ${feature?.linkLabel || 'feature'}` : 'Login to access feature'}
              >
                {isAuthenticated ? feature?.linkLabel || 'Learn More' : 'Login to Start'}
              </Link>
            )}
          </motion.article>
        );
      })}
    </div>
  );
}

// Helper to render discover leagues
function DiscoverLeagues({ leagues, shouldReduceMotion }) {
  const navigate = useNavigate();

  if (!Array.isArray(leagues)) {
    console.error('Leagues is not an array:', leagues);
    return (
      <div className="text-red-600 text-center" role="alert" aria-live="assertive">
        Error: Unable to display leagues. Please try again later.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {leagues.length === 0 ? (
        <p className="text-gray-700 text-center col-span-full" role="alert" aria-live="polite">
          No active leagues found.
        </p>
      ) : (
        leagues.map((league, index) => (
          <motion.article
            key={league?._id || `league-${Math.random()}`}
            className="bg-gradient-to-br from-blue-100 to-slate-100 glass rounded-xl shadow-lg p-5 border border-gray-100 flex flex-col items-center cursor-pointer"
            role="article"
            aria-label={`League: ${league?.name || 'Unknown League'}`}
            variants={shouldReduceMotion ? {} : cardVariants}
            initial="hidden"
            animate="visible"
            custom={index}
            whileHover={shouldReduceMotion ? {} : { scale: 1.05, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            onClick={() => navigate(`/leagues/public/${league?._id || ''}`)}
          >
            {league?.logo ? (
              <motion.img
                src={league.logo}
                alt={`${league?.name || 'Unknown League'} Logo`}
                className="w-16 h-16 rounded-full mb-3 object-cover"
                animate={shouldReduceMotion ? {} : { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 2 } }}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-300 rounded-full mb-3" aria-hidden="true" />
            )}
            <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">{league?.name || 'Unknown League'}</h3>
          </motion.article>
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
  const [error, setError] = useState(null);
  const { ref: parallaxRef, y: parallaxY } = useParallax();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (isAuthenticated) return; // Only fetch leagues for unauthenticated users

    async function fetchPublicLeagues() {
      setLoading(true);
      try {
        const response = await axios.get('/api/leagues/public');
        setLeagues(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Fetch public leagues error:', err);
        setError('Failed to load public leagues. Please try again later.');
        setLeagues([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPublicLeagues();
  }, [isAuthenticated]);

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-[var(--page-height)] bg-gray-50 py-4 px-4" role="status" aria-live="assertive">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
          {/* Welcome Skeleton */}
          <section className="bg-gradient-to-br from-blue-900 via-blue-700 to-slate-800 py-20 text-center" role="region" aria-labelledby="welcome-heading">
            <Skeleton height={48} width={300} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mx-auto mb-4" aria-hidden="true" />
            <Skeleton height={24} width={400} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mx-auto mb-8" aria-hidden="true" />
            <div className="flex justify-center gap-4">
              <Skeleton height={44} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
            </div>
          </section>
          {/* Discover Leagues Skeleton */}
          <section className="py-12 bg-gradient-to-br from-blue-50 to-slate-100" role="region" aria-labelledby="discover-leagues">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Skeleton height={36} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mx-auto mb-10" aria-hidden="true" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={`league-skeleton-${i}`} className="bg-gradient-to-br from-blue-100 to-slate-100 glass rounded-xl shadow-lg p-5 border border-gray-100 flex flex-col items-center">
                    <Skeleton circle height={64} width={64} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mb-3" aria-hidden="true" />
                    <Skeleton height={24} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>
          </section>
          {/* Footer Skeleton */}
          <footer className="bg-gradient-to-br from-blue-800 to-slate-900 py-8 text-center" role="contentinfo">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Skeleton height={24} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mx-auto mb-4" aria-hidden="true" />
              <div className="flex justify-center space-x-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={`footer-link-${i}`} height={20} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                ))}
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-[var(--page-height)] bg-gray-50 py-4 px-4" role="alert" aria-live="assertive">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="bg-gradient-to-br from-blue-900 via-blue-700 to-slate-800 py-20 text-center" role="region" aria-labelledby="welcome-heading">
            <Skeleton height={48} width={300} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mx-auto mb-4" aria-hidden="true" />
            <Skeleton height={24} width={400} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mx-auto mb-8" aria-hidden="true" />
            <div className="flex justify-center gap-4">
              <Skeleton height={44} width={150} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
            </div>
          </section>
          <section className="py-12 bg-gradient-to-br from-blue-50 to-slate-100" role="region" aria-labelledby="discover-leagues">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Skeleton height={36} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mx-auto mb-10" aria-hidden="true" />
              <p className="text-red-600 text-center text-lg py-4 px-6 bg-white rounded-xl shadow-sm">{error}</p>
            </div>
          </section>
          <footer className="bg-gradient-to-br from-blue-800 to-slate-900 py-8 text-center" role="contentinfo">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Skeleton height={24} width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="mx-auto mb-4" aria-hidden="true" />
              <div className="flex justify-center space-x-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={`footer-link-${i}`} height={20} width={80} baseColor="#e5e7eb" highlightColor="#f3f4f6" aria-hidden="true" />
                ))}
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }

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
      {/* Welcome Section with Parallax */}
      <motion.section
        ref={parallaxRef}
        className="relative bg-gradient-to-br from-blue-900 via-blue-700 to-slate-800 text-white py-20 text-center overflow-hidden"
        role="region"
        aria-labelledby="welcome-heading"
        initial={shouldReduceMotion ? {} : { opacity: 0, y: -50 }}
        animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-800 opacity-50"
          style={{ y: shouldReduceMotion ? 0 : parallaxY }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <motion.h1
            id="welcome-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center drop-shadow-lg"
            animate={shouldReduceMotion ? {} : { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 3 } }}
          >
            <SparklesIcon className="w-8 h-8 sm:w-10 mr-2 text-blue-300" aria-hidden="true" />
            The Sporty Way
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl mb-8 text-blue-100 drop-shadow"
            initial={shouldReduceMotion ? {} : { opacity: 0 }}
            animate={shouldReduceMotion ? {} : { opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Connect, manage, and track your sports leagues with ease.
          </motion.p>
          <div className="flex justify-center gap-4">
            {isAuthenticated ? (
              <>
                <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.1 }} whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}>
                  <Link
                    to="/my-sporty"
                    className="inline-flex items-center bg-blue-700 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-800 transition focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    aria-label="Navigate to My Sporty dashboard"
                  >
                    <UserCircleIcon className="w-5 h-5 sm:w-6 mr-2 text-blue-200" aria-hidden="true" />
                    My Sporty
                  </Link>
                </motion.div>
                <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.1 }} whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}>
                  <Link
                    to="/admin"
                    className="inline-flex items-center bg-white text-blue-800 px-6 sm:px-8 py-3 rounded-lg font-semibold shadow-lg border border-blue-400 hover:bg-blue-50 transition focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    aria-label="Navigate to Admin Panel"
                  >
                    <Cog6ToothIcon className="w-5 h-5 sm:w-6 mr-2 text-blue-400" aria-hidden="true" />
                    Admin Panel
                  </Link>
                </motion.div>
              </>
            ) : (
              <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.1 }} whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}>
                <Link
                  to="/login"
                  className="inline-flex items-center bg-blue-700 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-800 transition focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  aria-label="Navigate to Login page"
                >
                  <ArrowRightEndOnRectangleIcon className="w-5 h-5 sm:w-6 mr-2 text-blue-200" aria-hidden="true" />
                  Pave Your Path
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Conditional Sections */}
      <AnimatePresence>
        {isAuthenticated ? (
          <>
            {/* Admin Features Section */}
            <motion.section
              className="py-12 bg-gradient-to-br from-blue-50 to-slate-100"
              role="region"
              aria-labelledby="admin-features"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 50 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? {} : { opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 id="admin-features" className="text-2xl sm:text-3xl font-bold text-blue-800 text-center mb-10 flex items-center justify-center">
                  <Cog6ToothIcon className="w-6 h-6 sm:w-7 mr-2 text-blue-700" aria-hidden="true" />
                  Admin Features
                </h2>
                {renderFeatures(adminFeatures, isAuthenticated, shouldReduceMotion)}
              </div>
            </motion.section>

            {/* Player Features Section */}
            <motion.section
              className="py-12 bg-gradient-to-br from-green-50 to-slate-100"
              role="region"
              aria-labelledby="player-features"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 50 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? {} : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 id="player-features" className="text-2xl sm:text-3xl font-bold text-green-800 text-center mb-10 flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 sm:w-7 mr-2 text-green-700" aria-hidden="true" />
                  Player Features
                </h2>
                {renderFeatures(playerFeatures, isAuthenticated, shouldReduceMotion)}
              </div>
            </motion.section>

            <motion.section
              className="py-16 bg-white"
              role="region"
              aria-labelledby="why-choose"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 50 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? {} : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
              >
                <h2
                  id="why-choose"
                  className="text-2xl sm:text-3xl font-bold text-blue-800 text-center mb-12 flex items-center justify-center"
                >
                  <UsersIcon className="w-7 h-7 sm:w-8 mr-2 text-blue-700" aria-hidden="true" />
                  Why Choose The Sporty Way?
                </h2>

                <div className="overflow-hidden relative w-full" aria-hidden="true">
                  <div
                    className="flex w-max py-4 animate-[scroll-left_45s_linear_infinite]"
                    style={{
                      animation: 'marquee-left 45s linear infinite',
                    }}
                  >
                    {[...whyChooseSporty, ...whyChooseSporty].map((reason, idx) => {
                      const Icon = reason.icon;

                      return (
                        <article
                          key={reason?.title ? `${reason.title}-${idx}` : `reason-${idx}`}
                          className="min-w-[220px] max-w-xs mx-3 text-center bg-gradient-to-br bg-opacity-80 glass rounded-xl shadow-lg p-4 border border-gray-100 flex-shrink-0"
                          style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
                          role="article"
                          aria-label={`Reason: ${reason?.title || 'Unknown'}`}
                        >
                          <div className="h-16 w-16 flex items-center justify-center mx-auto mb-3 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-inner">
                            {Icon && <Icon className={`h-8 w-8 ${reason.iconColor || 'text-gray-700'}`} aria-hidden="true" />}
                          </div>
                          <h3 className="text-base font-semibold text-gray-800 mb-1">{reason?.title || 'Untitled'}</h3>
                          <p className="text-gray-700 text-sm">{reason?.description || 'No description available'}</p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Testimonials Section */}
            <motion.section
              className="bg-gradient-to-br from-slate-50 to-gray-100 py-16"
              role="region"
              aria-labelledby="testimonials"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 50 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? {} : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 id="testimonials" className="text-2xl sm:text-3xl font-bold text-blue-800 text-center mb-12 flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-7 h-7 sm:w-8 mr-2 text-amber-600" aria-hidden="true" />
                  What Users Say
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <motion.article
                    className="bg-gradient-to-br from-blue-100 to-slate-100 glass rounded-xl shadow-lg p-6 border border-gray-100"
                    role="article"
                    aria-label="Testimonial from Jane, Parent"
                    variants={shouldReduceMotion ? {} : cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={0}
                  >
                    <p className="text-gray-700 italic">“The Sporty Way makes it so easy to follow my son’s games!”</p>
                    <p className="mt-4 font-semibold text-gray-900">— Jane, Parent</p>
                  </motion.article>
                  <motion.article
                    className="bg-gradient-to-br from-green-100 to-slate-100 glass rounded-xl shadow-lg p-6 border border-gray-100"
                    role="article"
                    aria-label="Testimonial from Mike, League Manager"
                    variants={shouldReduceMotion ? {} : cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                  >
                    <p className="text-gray-700 italic">“Managing my league has never been simpler. Love the tools!”</p>
                    <p className="mt-4 font-semibold text-gray-900">— Mike, League Manager</p>
                  </motion.article>
                </div>
              </div>
            </motion.section>
          </>
        ) : (
          /* Discover Section */
          <motion.section
            className="py-12 bg-gradient-to-br from-blue-50 to-slate-100"
            role="region"
            aria-labelledby="discover-leagues"
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 50 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? {} : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 id="discover-leagues" className="text-2xl sm:text-3xl font-bold text-blue-800 text-center mb-10 flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 sm:w-7 mr-2 text-blue-700" aria-hidden="true" />
                Discover Leagues
              </h2>
              <DiscoverLeagues leagues={leagues} shouldReduceMotion={shouldReduceMotion} />
            </div>
          </motion.section>
        )}

        {/* Footer Section */}
        <motion.footer
          className="bg-gradient-to-br from-blue-800 to-slate-900 text-white py-8 text-center"
          role="contentinfo"
          aria-labelledby="footer-content"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 50 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p id="footer-content" className="mb-4 text-lg">Join the sports community today!</p>
            <div className="flex align-center justify-center space-x-6">
              <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.1 }} whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}>
                <Link
                  to="/about"
                  className="text-white hover:text-amber-300 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                  aria-label="Navigate to About page"
                >
                  About
                </Link>
              </motion.div>
              <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.1 }} whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}>
                <Link
                  to={isAuthenticated ? '/admin' : '/register'}
                  className="text-white hover:text-amber-300 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                  aria-label={isAuthenticated ? 'Navigate to Manage Leagues' : 'Navigate to Join Now'}
                >
                  {isAuthenticated ? 'Manage Leagues' : 'Join Now'}
                </Link>
              </motion.div>
              <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.1 }} whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}>
                <Link
                  to="/privacy-policy"
                  className="text-white hover:text-amber-300 focus:ring-2 focus:ring-amber-600 focus:outline-none"
                  aria-label="Navigate to Privacy Policy page"
                >
                  Privacy Policy
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.footer>
      </AnimatePresence>
    </>
  );
}
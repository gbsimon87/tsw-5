import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { HeartIcon, GlobeEuropeAfricaIcon, UsersIcon } from '@heroicons/react/24/outline';

/**
 * About page highlighting The Sporty Way's mission, story, and team
 * @component
 * @returns {JSX.Element}
 */
export default function About() {
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
      {/* Hero Section */}
      <section
        className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white py-24 text-center"
        aria-label="About The Sporty Way"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 flex items-center justify-center">
            <GlobeEuropeAfricaIcon className="w-10 h-10 mr-2 text-blue-300" />
            The Sporty Way
          </h1>
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-800 transition focus:ring-2 focus:ring-blue-400 focus:outline-none"
            aria-label={isAuthenticated ? 'Go to Dashboard' : 'Join The Sporty Way'}
          >
            {isAuthenticated ? 'My Dashboard' : 'Join Now'}
          </Link>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-blue-800 mb-6 flex items-center">
            <HeartIcon className="w-8 h-8 mr-2 text-blue-700" />
            Our Story
          </h2>
          <div className="bg-gradient-to-br from-white to-blue-50 glass rounded-xl shadow-lg p-8 border border-blue-100">
            <div className="bg-gradient-to-br from-white to-blue-50 glass rounded-xl">
            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              Since I was a kid, sports were everything. I wasn’t just playing — I was living for it. The rush of a close game, the feeling of pushing your limits, the simple joy of being part of a team — those moments shaped who I am.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              As I grew older, I started to understand just how much sports gave me beyond the game: discipline, resilience, confidence. It became clear that a healthy lifestyle and regular exercise aren’t just good habits — they’re life-shaping forces. And I wanted to find a way to give that same experience to the next generation.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              One day, I found myself sitting with one of my best friends — someone I’ve spent countless nights talking with about life, purpose, and dreams — and we asked each other: What if anyone, not just the pros, could track their sports journey?
            </p>
            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              Not just scores, but memories. Not just stats, but milestones.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              That conversation sparked what would become this app — a place where players, parents, and coaches can track careers, celebrate progress, and relive those unforgettable moments on the field or court.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              This project is more than code. It’s a love letter to sport, to health, to growth — and to the friends who believe in you at 2 AM when the idea still sounds crazy.
            </p>
          </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-br from-blue-800 to-slate-900 text-white py-12 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Get Involved</h2>
          <p className="text-xl text-blue-100 mb-6">
            Join thousands of players, parents, and coaches building stronger sports communities with The Sporty Way.
          </p>
          <div className="flex align-center justify-center space-x-6">
            <Link
              to="/public-leagues"
              className="text-white hover:text-blue-200 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              aria-label="View Sporty Leagues"
            >
              Explore Leagues
            </Link>
            <Link
              to={isAuthenticated ? '/admin' : '/register'}
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-800 transition focus:ring-2 focus:ring-blue-400 focus:outline-none"
              aria-label={isAuthenticated ? 'Manage Leagues' : 'Join Now'}
            >
              {isAuthenticated ? 'Manage Leagues' : 'Join Now'}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
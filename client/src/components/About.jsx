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
                Ever since I was a kid, sports weren’t just something I did. They were everything. I wasn’t just on the field; I lived for it. The adrenaline of a tight match, the challenge of pushing past your limits, the unspoken bond of being part of a team — those moments shaped me more than I ever realized.
              </p>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                As I got older, I began to see how much more sports had given me beyond the wins and losses. Discipline. Resilience. Confidence. It wasn’t just about playing anymore. It was about becoming. I saw how living an active, healthy life doesn’t just make you feel good. It shapes who you are. And I couldn’t shake the feeling that I wanted to pass that on somehow.
              </p>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                One night, I was talking with one of my closest friends, someone who’s been in the trenches with me through dreams, doubts, and all the late-night “what ifs.” And we asked ourselves: What if anyone could track their sports journey, not just the pros?
              </p>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                Not just goals and scores, but the memories. The milestones. The growth.
              </p>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                That conversation lit the spark. What started as a simple idea became this app, a space for players, parents, and coaches to track progress, celebrate moments, and relive the stories that make sport unforgettable.
              </p>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                This isn’t just a product. It’s a piece of my heart. A love letter to sports.  A tribute to the value of health, and the friends who believe in the wildest ideas, even when it’s 2 AM and it all sounds a little insane.
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
              to="/leagues/public-leagues"
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
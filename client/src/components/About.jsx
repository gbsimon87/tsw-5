import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { HeartIcon, GlobeEuropeAfricaIcon, UsersIcon } from '@heroicons/react/24/outline';

/**
 * About page highlighting The Sporty Way's mission, story, and team
 * @component
 * @returns {JSX.Element}
 */
function About() {
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
        className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white py-24 text-center"
        aria-label="About The Sporty Way"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 flex items-center justify-center">
            <GlobeEuropeAfricaIcon className="w-10 h-10 mr-2 text-blue-300" />
            The Sporty Way
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            From the heart of London, we’re a team passionate about sports, building a platform to unite players, coaches, and fans worldwide.
          </p>
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label={isAuthenticated ? 'Go to Dashboard' : 'Join The Sporty Way'}
          >
            {isAuthenticated ? 'My Dashboard' : 'Join Now'}
          </Link>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <HeartIcon className="w-8 h-8 mr-2 text-blue-600" />
            Our Story
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-30 glass rounded-xl shadow-lg p-8 border border-white/20">
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              In a vibrant London park, we met Sarah, a 14-year-old basketball player whose energy and love for the game were infectious. Every weekend, her team—a tight-knit group of friends from Brixton—played with heart, but their parents struggled to keep track of schedules, stats, and highlights using scattered apps and notebooks. Sarah dreamed of a platform where her community could come together, share every dunk and cheer, and celebrate their love for sport.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Inspired by Sarah’s passion, we founded The Sporty Way in London. Our mission was clear: create a platform that makes it easy for players, parents, and coaches to connect, manage leagues, and capture every moment. From grassroots football in Hackney to cricket matches in Regent’s Park, we’re here to bring communities closer through the universal language of sports.
            </p>
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <UsersIcon className="w-8 h-8 mr-2 text-blue-600" />
            Meet Our Team
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 bg-opacity-30 glass rounded-xl shadow-lg p-8 border border-white/20">
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              We’re a diverse crew of Londoners—coders, designers, and sports enthusiasts—who live and breathe the energy of the game. From pickup basketball games in Shoreditch to cheering at local football matches, our team is united by a shared love for sports and a commitment to empowering communities.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Based in the heart of London, we draw inspiration from the city’s dynamic sports culture. Whether it’s building tools to simplify league management or creating features to track every player’s journey, we’re dedicated to making The Sporty Way your go-to platform for sports.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Get Involved</h2>
          <p className="text-xl text-blue-100 mb-6">
            Join thousands of players, parents, and coaches building stronger sports communities with The Sporty Way.
          </p>
          <div className="flex justify-center space-x-6">
            <Link
              to="/public-leagues"
              className="text-white hover:text-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-label="View Sporty Leagues"
            >
              Explore Leagues
            </Link>
            <Link
              to={isAuthenticated ? '/admin' : '/register'}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-600 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

export default About;
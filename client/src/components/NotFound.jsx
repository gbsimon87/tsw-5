import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Not Found page component for unmatched routes
 * @returns {JSX.Element}
 */
function NotFound() {
  const [seconds, setSeconds] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="max-w-md mx-auto mt-10 text-center">
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-4" role="alert">
        Sorry, the page you’re looking for doesn’t exist.
      </p>
      <p className="text-gray-600 mb-4">
        Redirecting to <Link to="/" className="text-blue-600 hover:underline">homepage</Link> in {seconds} seconds...
      </p>
      <Link
        to="/"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200"
      >
        Go Home Now
      </Link>
    </div>
  );
}

export default NotFound;
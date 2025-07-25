import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrophyIcon, ShieldExclamationIcon, FlagIcon } from '@heroicons/react/24/outline';

export default function Unauthorized() {
  const [seconds, setSeconds] = useState(4);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(-1); // Go back to the previous page
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-[var(--page-height)] flex flex-col items-center justify-center bg-red-50 text-center p-4">
      <div className="flex gap-4 mb-4">
        <TrophyIcon className="w-12 h-12 text-red-400" aria-hidden="true" />
        <ShieldExclamationIcon className="w-12 h-12 text-red-400" aria-hidden="true" />
        <FlagIcon className="w-12 h-12 text-red-400" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
      <p className="mt-2 text-lg text-gray-700">
        Looks like you're trying to sub in without a jersey.
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Redirecting you back in {seconds} second{seconds !== 1 ? 's' : ''}...
      </p>
    </div>
  );
}
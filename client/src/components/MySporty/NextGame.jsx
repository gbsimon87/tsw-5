import {
  CalendarIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  UserIcon,
  TrophyIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function NextGame({ nextGame, countdown }) {
  if (!nextGame) return null;

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-4">Next Game</h2>
      <div className="bg-gradient-to-br from-blue-50 to-slate-100 shadow-md rounded-2xl p-6 border border-blue-200">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <dt>
              <CalendarIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Date & Time:</dt>
            <dd className="text-slate-800 font-semibold">
              {new Date(nextGame.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {nextGame.time ? `, ${nextGame.time}` : ''}
            </dd>
          </div>
          {/* Opponent */}
          <div className="flex items-center gap-3">
            <dt>
              <UserIcon className="w-6 h-6 text-green-700" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Opponent:</dt>
            <dd className="text-slate-800 font-semibold">{nextGame.opponentTeam?.name || 'N/A'}</dd>
          </div>
          {/* Location */}
          <div className="flex items-center gap-3">
            <dt>
              <MapPinIcon className="w-6 h-6 text-blue-500" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Location:</dt>
            <dd className="text-slate-800 font-semibold">{nextGame.location}</dd>
          </div>
          {/* Venue */}
          <div className="flex items-center gap-3">
            <dt>
              <BuildingOfficeIcon className="w-6 h-6 text-green-700" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Venue:</dt>
            <dd className="text-slate-800 font-semibold">{nextGame.venue}</dd>
          </div>
          {/* Event Type */}
          <div className="flex items-center gap-3">
            <dt>
              <TrophyIcon className="w-6 h-6 text-slate-600" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Event Type:</dt>
            <dd className="text-slate-800 font-semibold">
              {nextGame.eventType?.charAt(0).toUpperCase() + nextGame.eventType?.slice(1)}
            </dd>
          </div>
          {/* Countdown */}
          <div className="flex items-center gap-3">
            <dt>
              <ClockIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Countdown:</dt>
            <dd className="text-slate-800 font-semibold">{countdown}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
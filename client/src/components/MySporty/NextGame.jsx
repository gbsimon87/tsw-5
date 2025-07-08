import {
  CalendarIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  TrophyIcon,
  UserIcon,
  ChartBarIcon,
  SunIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function NextGame({ nextGame, countdown }) {
  if (!nextGame) return null;

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-4">Next Game</h2>
      <div className="bg-gradient-to-br from-blue-50 to-slate-100 shadow-md rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center gap-4 mb-4">
          {nextGame.userTeam?.logo ? (
            <img
              src={nextGame.userTeam.logo}
              alt={`${nextGame.userTeam.name} logo`}
              className="w-12 h-12 object-cover rounded-full border-2 border-blue-200 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200 shadow-sm">
              <span className="text-blue-300 text-lg font-bold">?</span>
            </div>
          )}
          <span className="text-xl font-semibold text-blue-700">vs</span>
          {nextGame.opponentTeam?.logo ? (
            <img
              src={nextGame.opponentTeam.logo}
              alt={`${nextGame.opponentTeam.name} logo`}
              className="w-12 h-12 object-cover rounded-full border-2 border-blue-200 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200 shadow-sm">
              <span className="text-blue-300 text-lg font-bold">?</span>
            </div>
          )}
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              , {nextGame.time}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <dt>
              <MapPinIcon className="w-6 h-6 text-blue-500" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Location:</dt>
            <dd className="text-slate-800 font-semibold">{nextGame.location}</dd>
          </div>
          <div className="flex items-center gap-3">
            <dt>
              <BuildingOfficeIcon className="w-6 h-6 text-green-700" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Venue:</dt>
            <dd className="text-slate-800 font-semibold">{nextGame.venue}</dd>
          </div>
          <div className="flex items-center gap-3">
            <dt>
              <TrophyIcon className="w-6 h-6 text-amber-600" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">League:</dt>
            <dd className="text-slate-800 font-semibold">{nextGame.league}</dd>
          </div>
          <div className="flex items-center gap-3">
            <dt>
              <UserIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Your Team:</dt>
            <dd className="text-slate-800 font-semibold">{nextGame.userTeam?.name || 'N/A'}</dd>
          </div>
          <div className="flex items-center gap-3">
            <dt>
              <UserIcon className="w-6 h-6 text-green-700" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Opponent:</dt>
            <dd className="text-slate-800 font-semibold">{nextGame.opponentTeam?.name || 'N/A'}</dd>
          </div>
          <div className="flex items-center gap-3">
            <dt>
              <TrophyIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Match Type:</dt>
            <dd className="text-slate-800 font-semibold">
              {nextGame.matchType.charAt(0).toUpperCase() + nextGame.matchType.slice(1)}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <dt>
              <TrophyIcon className="w-6 h-6 text-slate-600" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Event Type:</dt>
            <dd className="text-slate-800 font-semibold">
              {nextGame.eventType.charAt(0).toUpperCase() + nextGame.eventType.slice(1)}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <dt>
              <ChartBarIcon className="w-6 h-6 text-slate-500" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Previous Matchup:</dt>
            <dd className="text-slate-800 font-semibold">{nextGame.previousMatchupScore}</dd>
          </div>
          <div className="flex items-center gap-3">
            <dt>
              <SunIcon className="w-6 h-6 text-amber-400" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Weather:</dt>
            <dd className="text-slate-800 font-semibold">{nextGame.weatherConditions}</dd>
          </div>
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
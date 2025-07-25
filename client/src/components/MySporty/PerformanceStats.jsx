import { StarIcon } from '@heroicons/react/24/outline';
import { forwardRef } from 'react';

const PerformanceStats = forwardRef(({ player, canvasRef }, ref) => {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-4">Your Performance Stats</h2>
      <div className="bg-gradient-to-br from-blue-50 to-slate-100 shadow-md rounded-2xl p-6 border border-blue-200">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <dt>
              <StarIcon className="w-6 h-6 text-amber-500" aria-hidden="true" />
            </dt>
            <dt className="text-slate-500 font-medium min-w-[120px]">Total Points:</dt>
            <dd className="text-slate-800 font-semibold">{player.stats?.totalPoints || 0}</dd>
          </div>
          {player.stats?.seasonStats?.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <dt>
                  <StarIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
                </dt>
                <dt className="text-slate-500 font-medium min-w-[120px]">Current Season Points:</dt>
                <dd className="text-slate-800 font-semibold">
                  {player.stats.seasonStats[player.stats.seasonStats.length - 1]?.avgPoints.toFixed(1) || 0}
                </dd>
              </div>
              <div className="flex items-center gap-3">
                <dt>
                  <StarIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
                </dt>
                <dt className="text-slate-500 font-medium min-w-[120px]">Current Season Rebounds:</dt>
                <dd className="text-slate-800 font-semibold">
                  {player.stats.seasonStats[player.stats.seasonStats.length - 1]?.avgRebounds.toFixed(1) || 0}
                </dd>
              </div>
              <div className="flex items-center gap-3">
                <dt>
                  <StarIcon className="w-6 h-6 text-blue-700" aria-hidden="true" />
                </dt>
                <dt className="text-slate-500 font-medium min-w-[120px]">Current Season Steals:</dt>
                <dd className="text-slate-800 font-semibold">
                  {player.stats.seasonStats[player.stats.seasonStats.length - 1]?.avgSteals.toFixed(1) || 0}
                </dd>
              </div>
            </>
          )}
        </dl>
        <div className="mt-6">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>
      </div>
    </section>
  );
});

export default PerformanceStats;
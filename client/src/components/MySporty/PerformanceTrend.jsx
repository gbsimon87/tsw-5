import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { FireIcon } from '@heroicons/react/24/outline';

export default function PerformanceTrend({
  player,
  selectedSeason,
  setSelectedSeason,
  selectedStat,
  setSelectedStat,
}) {
  const trendChartRef = useRef(null);
  const trendCanvasRef = useRef(null);

  useEffect(() => {
    if (player?.stats?.gameStats && trendCanvasRef.current) {
      if (trendChartRef.current) {
        trendChartRef.current.destroy();
      }
      const ctx = trendCanvasRef.current.getContext('2d');
      const filteredStats =
        selectedSeason === 'all'
          ? player.stats.gameStats
          : player.stats.gameStats.filter((gs) => gs.season === selectedSeason);

      const datasets = [
        {
          label: `${selectedStat.charAt(0).toUpperCase() + selectedStat.slice(1)}`,
          data: filteredStats.map((gs) => gs[selectedStat] || 0),
          borderColor: '#2563eb',
          backgroundColor: '#2563eb',
          fill: false,
          tension: 0.3,
        },
      ];

      trendChartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: filteredStats.map((_, i) => `Game ${i + 1}`),
          datasets,
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: {
              display: true,
              text:
                selectedStat.charAt(0).toUpperCase() +
                selectedStat.slice(1) +
                ' Trend',
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text:
                  selectedStat.charAt(0).toUpperCase() +
                  selectedStat.slice(1),
              },
            },
            x: { title: { display: true, text: 'Game' } },
          },
        },
      });
    }
    return () => {
      if (trendChartRef.current) {
        trendChartRef.current.destroy();
      }
    };
  }, [player, selectedSeason, selectedStat]);

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-4">Performance Trend</h2>
      <div className="bg-gradient-to-br from-slate-50 to-blue-100 shadow-md rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center gap-4 mb-4">
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="border border-blue-200 rounded-md p-2 text-blue-800"
          >
            <option value="all">All Seasons</option>
            {player.stats?.seasonStats.map((s) => (
              <option key={s.season} value={s.season}>
                Season {s.season}
              </option>
            ))}
          </select>
          <select
            value={selectedStat}
            onChange={(e) => setSelectedStat(e.target.value)}
            className="border border-blue-200 rounded-md p-2 text-blue-800"
          >
            <option value="points">Points</option>
            <option value="rebounds">Rebounds</option>
            <option value="steals">Steals</option>
          </select>
          {player.stats?.hotStreak && (
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <FireIcon className="w-6 h-6" aria-hidden="true" />
              <span>Hot Streak!</span>
            </div>
          )}
        </div>
        <canvas ref={trendCanvasRef} className="max-w-full" />
      </div>
    </section>
  );
}
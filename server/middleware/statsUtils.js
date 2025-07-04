const League = require('../models/League');

const initializeStats = async (leagueId) => {
  const league = await League.findById(leagueId);
  if (!league || !league.settings.scoringRules) return {};
  return Object.keys(league.settings.scoringRules).reduce((stats, key) => {
    stats[key] = 0;
    return stats;
  }, {});
};

module.exports = { initializeStats };
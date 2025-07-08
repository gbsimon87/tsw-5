const League = require('../models/League');
const Team = require('../models/Team');
const Game = require('../models/Game');

const checkAdminOrManager = async (req, res, next) => {
  try {
    let leagueId = req.body.leagueId || req.query.leagueId || req.body.league;

    // Try to get leagueId from Game document if gameId is provided
    if (!leagueId && req.params.gameId) {
      const game = await Game.findById(req.params.gameId).select('league');
      if (!game) {
        console.error('checkAdminOrManager: Game not found for gameId:', req.params.gameId);
        return res.status(404).json({ error: 'Game not found' });
      }
      leagueId = game.league;
    }

    // Fallback to teamId if provided
    if (!leagueId && req.params.teamId) {
      const team = await Team.findById(req.params.teamId);
      if (!team) {
        console.error('checkAdminOrManager: Team not found for teamId:', req.params.teamId);
        return res.status(404).json({ error: 'Team not found' });
      }
      leagueId = team.league;
    }

    if (!leagueId) {
      console.error('checkAdminOrManager: No leagueId provided');
      return res.status(400).json({ error: 'League ID is required' });
    }

    const league = await League.findById(leagueId);
    if (!league) {
      console.error('checkAdminOrManager: League not found for leagueId:', leagueId);
      return res.status(404).json({ error: 'League not found' });
    }

    const isAdmin = league.admins.some(admin => admin._id.toString() === req.user._id.toString());
    const isManager = league.managers.some(manager => manager._id.toString() === req.user._id.toString());
    if (!isAdmin && !isManager) {
      console.error('checkAdminOrManager: User not authorized:', req.user._id);
      return res.status(403).json({ error: 'Unauthorized: Admin or manager access required' });
    }

    next();
  } catch (err) {
    console.error('Admin/Manager check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = checkAdminOrManager;
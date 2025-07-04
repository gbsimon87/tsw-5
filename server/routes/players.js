const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const Team = require('../models/Team');
const League = require('../models/League');
const authMiddleware = require('../middleware/authMiddleware');
const checkAdminOrManager = require('../middleware/adminOrManagerMiddleware');
const { initializeStats } = require('../middleware/statsUtils');

// Create a player (admin/manager only)
router.post('/', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { userId, leagueId, position, bio, dateOfBirth, nationality } = req.body;
    if (!userId || !leagueId) {
      return res.status(400).json({ error: 'userId and leagueId are required' });
    }

    const existingPlayer = await Player.findOne({ user: userId, league: leagueId });
    if (existingPlayer) {
      return res.status(400).json({ error: 'Player already exists for this user and league' });
    }

    const stats = await initializeStats(leagueId);
    const player = await Player.create({
      user: userId,
      league: leagueId,
      stats,
      position,
      bio,
      dateOfBirth,
      nationality,
      teams: [],
      gamesPlayed: 0,
      totalGamesWon: 0,
      highestScore: 0,
      careerAvgPoints: 0,
      careerRebounds: 0,
      careerSteals: 0,
      playerRank: 0,
    });

    res.status(201).json(player);
  } catch (err) {
    console.error('Create player error:', err);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// Get players (filter by leagueId)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { leagueId } = req.query;
    const query = leagueId ? { league: leagueId } : {};
    const players = await Player.find(query).populate('user', 'name').populate('teams', 'name');
    res.json(players);
  } catch (err) {
    console.error('Get players error:', err);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Update a player (admin/manager or own profile)
router.patch('/:playerId', authMiddleware, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { position, bio, dateOfBirth, nationality, injuries, playerHistory, recentInjuries } = req.body;

    const player = await Player.findById(playerId).populate('user');
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const isAdmin = await League.findById(player.league)
      .then(league => league?.admins.some(admin => admin._id.toString() === req.user._id.toString()));
    const isManager = await League.findById(player.league)
      .then(league => league?.managers.some(manager => manager._id.toString() === req.user._id.toString()));
    const isOwnProfile = player.user._id.toString() === req.user._id.toString();

    if (!isAdmin && !isManager && !isOwnProfile) {
      return res.status(403).json({ error: 'Unauthorized: Admin, manager, or own profile access required' });
    }

    const updateFields = isAdmin || isManager ? req.body : { position, bio, dateOfBirth, nationality, injuries, playerHistory, recentInjuries };
    Object.assign(player, updateFields);
    await player.save();

    res.json(player);
  } catch (err) {
    console.error('Update player error:', err);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// Delete a player (admin/manager only)
router.delete('/:playerId', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { playerId } = req.params;
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    await Team.updateMany(
      { 'members.player': playerId },
      { $pull: { members: { player: playerId } } }
    );

    await player.deleteOne();
    res.json({ message: 'Player deleted' });
  } catch (err) {
    console.error('Delete player error:', err);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

module.exports = router;
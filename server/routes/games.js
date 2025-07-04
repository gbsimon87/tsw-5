const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Game = require('../models/Game');
const authMiddleware = require('../middleware/authMiddleware');
const checkAdminOrManager = require('../middleware/adminOrManagerMiddleware');

// Get games for a league and season
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { leagueId, season } = req.query;
    if (!leagueId) return res.status(400).json({ error: 'leagueId is required' });
    if (!mongoose.Types.ObjectId.isValid(leagueId)) {
      console.error('Invalid leagueId:', leagueId);
      return res.status(400).json({ error: 'Invalid leagueId' });
    }

    console.log('GET /api/games query:', { leagueId, season });

    const games = await Game.find({ league: leagueId, season })
      .populate('teams', 'name')
      .populate({
        path: 'gameMVP',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name'
        }
      })
      .lean();

    console.log('Fetched games:', JSON.stringify(games, null, 2));

    const populatedGames = games.map(game => ({
      ...game,
      teams: Array.isArray(game.teams) ? game.teams : [],
      gameMVP: game.gameMVP ? { ...game.gameMVP, name: game.gameMVP.user?.name || 'Unknown' } : null,
    }));

    res.set('Cache-Control', 'no-store');
    res.json(populatedGames);
  } catch (err) {
    console.error('Get games error:', err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Create a game (admin/manager only)
router.post('/', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { league, season, date, teams, location, venue, venueCapacity, score, matchType, eventType, gameDuration, weatherConditions, referee, attendance, previousMatchupScore, fanRating, highlights, matchReport, mediaLinks, gameMVP } = req.body;

    // Validate required fields
    if (!league || !date || !teams || teams.length !== 2 || teams[0] === teams[1]) {
      return res.status(400).json({ error: 'Invalid game data: league, date, and two unique teams required' });
    }
    if (!season || typeof season !== 'string' || season.trim() === '') {
      return res.status(400).json({ error: 'Invalid game data: season is required and must be a non-empty string' });
    }

    // Validate league ID
    if (!mongoose.Types.ObjectId.isValid(league)) {
      return res.status(400).json({ error: 'Invalid league ID' });
    }

    // Filter out invalid mediaLinks
    const validMediaLinks = mediaLinks ? mediaLinks.filter(link => link.url.trim() && link.type.trim()) : [];

    // Only include gameMVP if it's a valid ObjectId
    const gameData = {
      league,
      season,
      date,
      teams,
      location,
      venue,
      venueCapacity,
      score,
      matchType,
      eventType,
      gameDuration,
      weatherConditions,
      referee,
      attendance,
      previousMatchupScore,
      fanRating,
      highlights: highlights ? highlights.filter(h => h.trim()) : [],
      matchReport,
      mediaLinks: validMediaLinks,
      isCompleted: eventType === 'final' || (score && (score.team1 > 0 || score.team2 > 0)),
    };

    if (gameMVP && mongoose.Types.ObjectId.isValid(gameMVP)) {
      gameData.gameMVP = gameMVP;
    }

    console.log('Creating game with data:', gameData);

    const game = await Game.create(gameData);

    const populatedGame = await Game.findById(game._id)
      .populate('teams', 'name')
      .populate({
        path: 'gameMVP',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name'
        }
      })
      .lean();

    if (populatedGame.gameMVP) {
      populatedGame.gameMVP.name = populatedGame.gameMVP.user?.name || 'Unknown';
    }

    res.status(201).json(populatedGame);
  } catch (err) {
    console.error('Create game error:', err);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Update a game (admin/manager only)
router.patch('/:gameId', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { teams, date, location, venue, venueCapacity, score, matchType, eventType, gameDuration, weatherConditions, referee, attendance, previousMatchupScore, fanRating, highlights, matchReport, mediaLinks, gameMVP } = req.body;

    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    if (teams && (teams.length !== 2 || teams[0] === teams[1])) {
      return res.status(400).json({ error: 'Exactly two unique teams required' });
    }

    Object.assign(game, {
      teams,
      date,
      location,
      venue,
      venueCapacity,
      score,
      matchType,
      eventType,
      gameDuration,
      weatherConditions,
      referee,
      attendance,
      previousMatchupScore,
      fanRating,
      highlights,
      matchReport,
      mediaLinks,
      gameMVP,
      isCompleted: eventType === 'final' || (score && (score.team1 > 0 || score.team2 > 0)),
    });

    await game.save();

    const populatedGame = await Game.findById(gameId)
      .populate('teams', 'name')
      .populate('gameMVP', 'user')
      .lean();

    populatedGame.gameMVP = populatedGame.gameMVP ? { ...populatedGame.gameMVP, name: populatedGame.gameMVP.user?.name || 'Unknown' } : null;

    res.json(populatedGame);
  } catch (err) {
    console.error('Update game error:', err);
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// Delete a game (admin/manager only)
router.delete('/:gameId', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    await game.deleteOne();
    res.json({ message: 'Game deleted' });
  } catch (err) {
    console.error('Delete game error:', err);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

module.exports = router;
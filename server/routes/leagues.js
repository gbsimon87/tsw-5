const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const League = require('../models/League');
const Player = require('../models/Player');
const Game = require('../models/Game');
const Team = require('../models/Team');
const authMiddleware = require('../middleware/authMiddleware');

// Create a league (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, sportType, location, visibility, establishedYear, settings } = req.body;

    // Trim the name to remove leading/trailing whitespace
    const trimmedName = name?.trim();
    if (!trimmedName) {
      return res.status(400).json({ error: 'League name is required' });
    }

    // Check if a league with the same trimmed name exists for the user (as admin or manager)
    const existingLeague = await League.findOne({
      name: trimmedName,
      $or: [
        { admins: req.user._id },
        { managers: req.user._id }
      ]
    });
    if (existingLeague) {
      return res.status(400).json({ error: 'A league with this name already exists' });
    }

    const league = await League.create({
      name: trimmedName,
      sportType,
      location,
      visibility,
      establishedYear,
      admins: [req.user._id],
      isActive: true,
      settings,
      seasons: [{ name: 'Season 1', startDate: new Date(), endDate: new Date(), isActive: true }],
    });
    res.status(201).json(league);
  } catch (err) {
    console.error('Create league error:', err);
    res.status(500).json({ error: 'Failed to create league' });
  }
});

// End a season
router.patch('/:leagueId/end-season', authMiddleware, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    if (!league.admins.some(admin => admin._id.equals(req.user._id))) {
      return res.status(403).json({ error: 'You are not authorized to end seasons' });
    }

    const activeSeason = league.seasons.find(s => s.isActive);
    if (!activeSeason) {
      return res.status(400).json({ error: 'No active season to end' });
    }

    activeSeason.isActive = false;
    await league.save();
    res.json(league);
  } catch (error) {
    console.error('End season error:', error);
    res.status(400).json({ error: 'Failed to end season' });
  }
});

// Create a new season
router.post('/:leagueId/seasons', authMiddleware, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { name, startDate, endDate } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Season name, start date, and end date are required' });
    }

    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    if (!league.admins.some(admin => admin._id.equals(req.user._id))) {
      return res.status(403).json({ error: 'You are not authorized to create seasons' });
    }

    if (league.seasons.some(s => s.name === name)) {
      return res.status(400).json({ error: 'Season name already exists' });
    }

    league.seasons.forEach(s => (s.isActive = false));
    league.seasons.push({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true,
    });
    league.season = name;
    await league.save();
    res.json(league);
  } catch (error) {
    console.error('Create season error:', error);
    res.status(400).json({ error: 'Failed to create season' });
  }
});

// Carry over teams to a new season
router.post('/:leagueId/teams/carry-over', authMiddleware, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { teamIds, newSeason } = req.body;
    if (!teamIds || !Array.isArray(teamIds) || !newSeason) {
      return res.status(400).json({ error: 'Team IDs and new season are required' });
    }

    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    if (!league.admins.some(admin => admin._id.equals(req.user._id))) {
      return res.status(403).json({ error: 'You are not authorized to carry over teams' });
    }

    if (!league.seasons.some(s => s.name === newSeason && s.isActive)) {
      return res.status(400).json({ error: 'New season is not active' });
    }

    const teams = await Team.find({ _id: { $in: teamIds }, league: leagueId });
    const newTeams = [];
    for (const team of teams) {
      const newTeam = new Team({
        name: team.name,
        league: leagueId,
        season: newSeason,
        logo: team.logo,
        members: team.members,
        createdBy: team.createdBy,
        isActive: true,
      });
      await newTeam.save();
      league.teams.push(newTeam._id);
      newTeams.push(newTeam);
    }

    await league.save();
    res.json(newTeams);
  } catch (error) {
    console.error('Carry over teams error:', error);
    res.status(400).json({ error: 'Failed to carry over teams' });
  }
});

// Get all active public leagues
router.get('/public', async (req, res) => {
  try {
    const leagues = await League.find({ isActive: true, visibility: 'public' })
      .lean();
    res.set('Cache-Control', 'no-store');
    res.json(leagues);
  } catch (error) {
    console.error('Get public leagues error:', error);
    res.status(500).json({ error: 'Failed to fetch public leagues' });
  }
});

// Get a specific public league by ID
router.get('/public/:leagueId', async (req, res) => {
  try {
    const league = await League.findOne({
      _id: req.params.leagueId,
      isActive: true,
      visibility: 'public',
    })
      .populate({
        path: 'teams',
        match: { isActive: true, season: { $eq: '$season' } },
        populate: {
          path: 'members.player',
          model: 'Player',
          match: { isActive: true },
          select: 'user stats jerseyNumber position',
          populate: {
            path: 'user',
            select: 'firstName lastName',
          },
        },
      })
      .lean();

    if (!league) {
      return res.status(404).json({ error: 'League not found or not public' });
    }

    // Fetch games for the league's active season
    const games = await Game.find({
      league: req.params.leagueId,
      season: league.season,
    })
      .populate('teams', 'name logo')
      .populate('playerStats.player', 'user stats')
      .populate('playerStats.team', 'name')
      .lean();

    // Calculate team standings
    const standings = league.teams.map((team) => {
      const teamGames = games.filter((game) =>
        game.teams.some((t) => t._id.toString() === team._id.toString())
      );
      const wins = teamGames.filter((game) => {
        const teamScore = game.teamScores.find(
          (ts) => ts.team._id.toString() === team._id.toString()
        )?.score || 0;
        const opponentScore = game.teamScores.find(
          (ts) => ts.team._id.toString() !== team._id.toString()
        )?.score || 0;
        return teamScore > opponentScore && game.isCompleted;
      }).length;
      const losses = teamGames.filter((game) => {
        const teamScore = game.teamScores.find(
          (ts) => ts.team._id.toString() === team._id.toString()
        )?.score || 0;
        const opponentScore = game.teamScores.find(
          (ts) => ts.team._id.toString() !== team._id.toString()
        )?.score || 0;
        return teamScore < opponentScore && game.isCompleted;
      }).length;
      return { _id: team._id, name: team.name, wins, losses };
    }).sort((a, b) => b.wins - a.wins || a.losses - b.losses);

    // Calculate league leaders (top 5 players by points)
    const players = league.teams.flatMap((team) => team.members.map((m) => m.player));
    const leagueLeaders = await Player.find({ _id: { $in: players } })
      .populate('user', 'firstName lastName')
      .lean()
      .then((players) => {
        return players
          .map((player) => {
            const points = league.settings.scoringRules
              ? Object.entries(league.settings.scoringRules).reduce((total, [statType, value]) => {
                  return total + (player.stats[statType] || 0) * value;
                }, 0)
              : 0;
            return {
              _id: player._id,
              name: `${player.user.firstName} ${player.user.lastName}`,
              team: league.teams.find((t) =>
                t.members.some((m) => m.player._id.toString() === player._id.toString())
              )?.name || 'Unknown',
              points,
            };
          })
          .sort((a, b) => b.points - a.points)
          .slice(0, 5);
      });

    res.set('Cache-Control', 'no-store');
    res.json({
      ...league,
      standings,
      games,
      leagueLeaders,
    });
  } catch (error) {
    console.error('Get public league error:', error);
    res.status(500).json({ error: 'Failed to fetch league data' });
  }
});

// Get user's leagues (admin or manager)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const leagues = await League.find({
      $or: [
        { admins: req.user._id },
        { managers: req.user._id }
      ]
    });
    res.json(leagues);
  } catch (error) {
    console.error('Get leagues error:', error);
    res.status(500).json({ error: 'Failed to fetch leagues' });
  }
});

// Get a single league by ID
router.get('/:leagueId', authMiddleware, async (req, res) => {
  try {
    const { leagueId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(leagueId)) {
      return res.status(400).json({ error: 'Invalid leagueId' });
    }

    const league = await League.findById(leagueId)
      .populate({
        path: 'teams',
        select: 'name logo createdBy isActive members',
        populate: {
          path: 'members.player',
          model: 'Player',
          select: 'name jerseyNumber position user',
          populate: {
            path: 'user',
            model: 'User',
            select: 'name',
          },
        },
      })
      .populate('admins', 'name')
      .populate('managers', 'name')
      .lean();

    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    // Patch settings.statTypes if missing
    if (!league.settings) league.settings = {};
    if (!league.settings.statTypes || league.settings.statTypes.length === 0) {
      // Compute default statTypes based on sportType
      const statTypesDefault = League.schema.path('settings.statTypes').default.call(league);
      league.settings.statTypes = statTypesDefault;
    }

    res.set('Cache-Control', 'no-store');
    res.json(league); // <-- Return the entire populated league object
  } catch (err) {
    console.error('Get league error:', err);
    res.status(500).json({ error: 'Failed to fetch league' });
  }
});

// Update a league (admin only)
router.patch('/:leagueId', authMiddleware, async (req, res) => {
  try {
    const league = await League.findById(req.params.leagueId);
    if (!league) return res.status(404).json({ error: 'League not found' });

    const isAdmin = league.admins.some(admin => admin._id.toString() === req.user._id.toString());
    if (!isAdmin) return res.status(403).json({ error: 'Unauthorized: Admin access required' });

    Object.assign(league, req.body);
    await league.save();
    res.json(league);
  } catch (err) {
    console.error('Update league error:', err);
    res.status(500).json({ error: 'Failed to update league' });
  }
});

// Delete a league (admin only)
router.delete('/:leagueId', authMiddleware, async (req, res) => {
  try {
    const league = await League.findById(req.params.leagueId);
    if (!league) return res.status(404).json({ error: 'League not found' });

    const isAdmin = league.admins.some(admin => admin._id.toString() === req.user._id.toString());
    if (!isAdmin) return res.status(403).json({ error: 'Unauthorized: Admin access required' });

    await league.deleteOne();
    res.json({ message: 'League deleted' });
  } catch (err) {
    console.error('Delete league error:', err);
    res.status(500).json({ error: 'Failed to delete league' });
  }
});

module.exports = router;
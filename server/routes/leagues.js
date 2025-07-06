const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const League = require('../models/League');
const Team = require('../models/Team');
const authMiddleware = require('../middleware/authMiddleware');

// Create a league (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, sportType, location, visibility, establishedYear } = req.body;
    const league = await League.create({
      name,
      sportType,
      location,
      visibility,
      establishedYear,
      admins: [req.user._id],
      isActive: true,
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

    // Validate leagueId
    if (!mongoose.Types.ObjectId.isValid(leagueId)) {
      return res.status(400).json({ error: 'Invalid leagueId' });
    }

    // Fetch league with necessary population
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

    // Structure the response
    const populatedLeague = {
      _id: league._id,
      name: league.name,
      sportType: league.sportType,
      season: league.season,
      visibility: league.visibility,
      logo: league.logo,
      establishedYear: league.establishedYear,
      isActive: league.isActive,
      location: league.location,
      admins: league.admins.map(admin => ({
        _id: admin._id,
        name: admin.name || 'Unknown',
      })),
      managers: league.managers.map(manager => ({
        _id: manager._id,
        name: manager.name || 'Unknown',
      })),
      teams: league.teams.map(team => ({
        _id: team._id,
        name: team.name,
        logo: team.logo,
        createdBy: team.createdBy,
        isActive: team.isActive,
        members: team.members
          .filter(member => member.player) // Filter out members with no player reference
          .map(member => ({
            playerId: member.player?._id || null,
            name: member.player?.user?.name || member.player?.name || 'Unknown', // Fallback to player.name or 'Unknown'
            jerseyNumber: member.player?.jerseyNumber || null,
            position: member.player?.position || null,
            role: member.role,
            isActive: member.isActive,
          })),
      })),
      seasons: league.seasons,
      settings: league.settings,
      status: league.status,
    };

    res.set('Cache-Control', 'no-store');
    res.json(populatedLeague);
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
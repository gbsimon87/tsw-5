const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Player = require('../models/Player');
const League = require('../models/League');
const authMiddleware = require('../middleware/authMiddleware');
const checkAdminOrManager = require('../middleware/adminOrManagerMiddleware');
const { initializeStats } = require('../middleware/statsUtils');

// Get teams by leagueId and season
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { leagueId, season } = req.query;
    if (!leagueId || !season) {
      return res.status(400).json({ error: 'leagueId and season are required' });
    }

    const teams = await Team.find({ league: leagueId, season })
      .populate({
        path: 'members.player',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name'
        }
      });

    // Log the raw teams data for debugging
    console.log('Fetched teams:', JSON.stringify(teams, null, 2));

    // Ensure members is an array and player.user is populated
    const formattedTeams = teams.map(team => ({
      ...team.toObject(),
      members: Array.isArray(team.members) ? team.members.map(member => ({
        ...member.toObject(),
        player: member.player ? {
          ...member.player.toObject(),
          user: member.player.user ? { name: member.player.user.name || 'Unknown' } : { name: 'Unknown' }
        } : { user: { name: 'Unknown' } }
      })) : []
    }));

    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-store');
    res.json(formattedTeams);
  } catch (err) {
    console.error('Get teams error:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Create a team (admin/manager only)
router.post('/', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { name, leagueId, season, logo } = req.body;
    if (!name || !leagueId || !season) {
      return res.status(400).json({ error: 'name, leagueId, and season are required' });
    }

    const team = await Team.create({
      name,
      league: leagueId,
      season,
      logo,
      createdBy: req.user._id,
      isActive: true,
      members: []
    });

    await League.findByIdAndUpdate(leagueId, { $push: { teams: team._id } });

    res.status(201).json(team);
  } catch (err) {
    console.error('Create team error:', err);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Update a team (admin/manager only)
router.patch('/:teamId', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { isActive } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (isActive !== undefined) team.isActive = isActive;
    await team.save();

    res.json(team);
  } catch (err) {
    console.error('Update team error:', err);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Update a team member (admin/manager only)
router.patch('/:teamId/members/:memberId', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const { isActive, role } = req.body;

    const team = await Team.findById(teamId).populate({
      path: 'members.player',
      populate: {
        path: 'user',
        model: 'User',
        select: 'name'
      }
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const member = team.members.find(m => m.player._id.toString() === memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (isActive !== undefined) member.isActive = isActive;
    if (role) member.role = role;

    await team.save();

    res.json(team);
  } catch (err) {
    console.error('Update team member error:', err);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Join a team
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { secretKey } = req.body;
    const userId = req.user._id;

    const team = await Team.findOne({ secretKey })
      .populate('league')
      .populate({
        path: 'members.player',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name'
        }
      });
    if (!team) return res.status(404).json({ error: 'Invalid team key' });

    const isMember = team.members.some(member => member.player.toString() === userId.toString());
    if (isMember) return res.status(400).json({ error: 'User is already a member of this team' });

    let player = await Player.findOne({ user: userId, league: team.league });
    if (!player) {
      const stats = await initializeStats(team.league);
      player = await Player.create({
        user: userId,
        league: team.league,
        teams: [team._id],
        stats,
      });
    } else {
      if (!player.teams.includes(team._id)) {
        player.teams.push(team._id);
        await player.save();
      }
    }

    team.members.push({ player: player._id, role: 'player', isActive: true });
    await team.save();

    // Re-fetch team with populated data to ensure consistency
    const populatedTeam = await Team.findById(team._id)
      .populate('league')
      .populate({
        path: 'members.player',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name'
        }
      });

    res.json({ message: 'Joined team successfully', team: populatedTeam });
  } catch (err) {
    console.error('Join team error:', err);
    res.status(500).json({ error: 'Failed to join team' });
  }
});

// Get user's teams
router.get('/my-teams', authMiddleware, async (req, res) => {
  try {
    // Find Player documents for the user
    const players = await Player.find({ user: req.user._id });
    const playerIds = players.map(player => player._id);
    console.log('User player IDs:', playerIds);

    // Find teams where the user is a member (via Player ID)
    const teams = await Team.find({
      'members.player': { $in: playerIds }
    })
      .populate('league', 'name sportType location')
      .populate({
        path: 'members.player',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name'
        }
      });

    console.log('Fetched user teams:', JSON.stringify(teams, null, 2));

    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-store');
    res.json(teams);
  } catch (error) {
    console.error('Get my teams error:', error);
    res.status(400).json({ error: 'Failed to fetch user teams' });
  }
});

module.exports = router;
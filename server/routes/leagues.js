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

    // Validate foulOutLimit for basketball leagues
    if (settings?.foulOutLimit !== undefined) {
      if (!Number.isInteger(settings.foulOutLimit) || settings.foulOutLimit <= 0) {
        return res.status(400).json({ error: 'foulOutLimit must be a positive integer for basketball leagues' });
      }
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

// GET league details with teams, games, standings, and league leaders
router.get('/public/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;

    // Validate leagueId
    if (!leagueId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid league ID' });
    }

    // Fetch league with populated teams
    const league = await League.findOne({
      _id: leagueId,
      isActive: true,
      visibility: 'public'
    })
      .populate({
        path: 'teams',
        match: { isActive: true },
        populate: {
          path: 'members.player',
          model: 'Player',
          match: { isActive: true },
          select: 'user jerseyNumber position -_id',
          populate: {
            path: 'user',
            select: 'name email -_id'
          }
        }
      })
      .lean();

    if (!league) {
      return res.status(404).json({ error: 'League not found or not public' });
    }

    // Fetch games for the league's active season
    const games = await Game.find({
      league: leagueId,
      season: league.season
    })
      .populate({
        path: 'teams',
        select: 'name logo _id'
      })
      .select('teams date location status teamScores isCompleted playerStats -_id')
      .lean();

    // Calculate team standings
    const standings = league.teams.map((team) => {
      const teamGames = games.filter(
        (game) => game.isCompleted && game.teams.some((t) => t._id.toString() === team._id.toString())
      );
      const wins = teamGames.filter((game) => {
        const teamScore = game.teamScores.find(
          (ts) => ts.team.toString() === team._id.toString()
        )?.score || 0;
        const opponentScore = game.teamScores.find(
          (ts) => ts.team.toString() !== team._id.toString()
        )?.score || 0;
        return teamScore > opponentScore;
      }).length;
      const losses = teamGames.filter((game) => {
        const teamScore = game.teamScores.find(
          (ts) => ts.team.toString() === team._id.toString()
        )?.score || 0;
        const opponentScore = game.teamScores.find(
          (ts) => ts.team.toString() !== team._id.toString()
        )?.score || 0;
        return teamScore < opponentScore;
      }).length;
      const totalGames = wins + losses;
      const pct = totalGames > 0 ? wins / totalGames : 0;
      return {
        _id: team._id,
        name: team.name || 'Unnamed Team',
        wins,
        losses,
        pct
      };
    }).sort((a, b) => b.pct - a.pct || b.wins - a.wins || a.losses - b.losses);

    // Calculate league leaders (top 5 players by points)
    const playerPointsMap = {};
    games
      .filter((game) => game.isCompleted)
      .forEach((game) => {
        game.playerStats.forEach((stat) => {
          const playerId = stat.player.toString();
          const points = Object.entries(stat.stats).reduce((total, [statType, value]) => {
            return total + (league.settings.scoringRules[statType] || 0) * (value || 0);
          }, 0);
          if (!playerPointsMap[playerId]) {
            playerPointsMap[playerId] = {
              player: stat.player,
              teamId: stat.team,
              points: 0
            };
          }
          playerPointsMap[playerId].points += points;
        });
      });

    const leagueLeaders = await Player.find({ _id: { $in: Object.keys(playerPointsMap) } })
      .populate('user', 'name')
      .lean()
      .then((players) =>
        players
          .map((player) => {
            const playerId = player._id.toString();
            const teamId = playerPointsMap[playerId]?.teamId?.toString();
            const team = league.teams.find((t) => t._id.toString() === teamId);
            if (!team) {
              console.warn(`No team found for player ${playerId} with teamId ${teamId}`);
            }
            return {
              _id: player._id,
              name: player.user?.name || 'Unknown Player',
              team: team ? team.name : 'Unknown Team',
              points: playerPointsMap[playerId]?.points || 0
            };
          })
          .filter((leader) => leader.points > 0) // Exclude players with no points
          .sort((a, b) => b.points - a.points)
          .slice(0, 5)
      );

    const playerAssistsMap = {};
    games
      .filter((game) => game.isCompleted)
      .forEach((game) => {
        game.playerStats.forEach((stat) => {
          const playerId = stat.player.toString();
          const assists = stat.stats.assist || 0;
          if (!playerAssistsMap[playerId]) {
            playerAssistsMap[playerId] = {
              player: stat.player,
              teamId: stat.team,
              assists: 0,
            };
          }
          playerAssistsMap[playerId].assists += assists;
        });
      });

    const leagueAssistLeaders = await Player.find({ _id: { $in: Object.keys(playerAssistsMap) } })
      .populate('user', 'name')
      .lean()
      .then((players) =>
        players
          .map((player) => {
            const playerId = player._id.toString();
            const teamId = playerAssistsMap[playerId]?.teamId?.toString();
            const team = league.teams.find((t) => t._id.toString() === teamId);
            if (!team) {
              console.warn(`No team found for player ${playerId} with teamId ${teamId}`);
            }
            return {
              _id: player._id,
              name: player.user?.name || player.name || 'Unknown Player',
              team: team ? team.name : 'Unknown Team',
              assists: playerAssistsMap[playerId]?.assists || 0,
            };
          })
          .filter((leader) => leader.assists > 0)
          .sort((a, b) => b.assists - a.assists)
          .slice(0, 5)
      );


      const playerReboundsMap = {};
games
  .filter((game) => game.isCompleted)
  .forEach((game) => {
    game.playerStats.forEach((stat) => {
      const playerId = stat.player.toString();
      const rebounds = (stat.stats.offensiveRebound || 0) + (stat.stats.defensiveRebound || 0);
      if (!playerReboundsMap[playerId]) {
        playerReboundsMap[playerId] = {
          player: stat.player,
          teamId: stat.team,
          rebounds: 0,
        };
      }
      playerReboundsMap[playerId].rebounds += rebounds;
    });
  });

const leagueReboundLeaders = await Player.find({ _id: { $in: Object.keys(playerReboundsMap) } })
  .populate('user', 'name')
  .lean()
  .then((players) =>
    players
      .map((player) => {
        const playerId = player._id.toString();
        const teamId = playerReboundsMap[playerId]?.teamId?.toString();
        const team = league.teams.find((t) => t._id.toString() === teamId);
        if (!team) {
          console.warn(`No team found for player ${playerId} with teamId ${teamId}`);
        }
        return {
          _id: player._id,
          name: player.user?.name || player.name || 'Unknown Player',
          team: team ? team.name : 'Unknown Team',
          rebounds: playerReboundsMap[playerId]?.rebounds || 0,
        };
      })
      .filter((leader) => leader.rebounds > 0)
      .sort((a, b) => b.rebounds - a.rebounds)
      .slice(0, 5)
  );

    // Combine league data with games, standings, and league leaders
    const response = {
      ...league,
      games,
      standings,
      leagueLeaders,
      leagueAssistLeaders,
      leagueReboundLeaders
    };

    res.set('Cache-Control', 'no-store');
    res.json(response);
  } catch (error) {
    console.error('Error fetching league data:', error);
    res.status(500).json({ error: 'Server error while fetching league data' });
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

    const isAdmin = league.admins.some(admin => admin?._id?.toString() === req.user?._id?.toString());
    if (!isAdmin) return res.status(403).json({ error: 'Unauthorized: Admin access required' });

    // Validate foulOutLimit for basketball leagues
    if (req.body.settings?.foulOutLimit !== undefined) {
      if (!Number.isInteger(req.body.settings.foulOutLimit) || req.body.settings.foulOutLimit <= 0) {
        return res.status(400).json({ error: 'foulOutLimit must be a positive integer for basketball leagues' });
      }
    }

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
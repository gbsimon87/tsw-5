const express = require('express');
const mongoose = require('mongoose');
const { isValidObjectId } = require('mongoose');
const crypto = require('crypto');
const router = express.Router();
const Team = require('../models/Team');
const Player = require('../models/Player');
const League = require('../models/League');
const Game = require('../models/Game');
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

    // Validate required fields
    if (!name || !leagueId || !season) {
      return res.status(400).json({ error: 'name, leagueId, and season are required' });
    }

    // Trim the name to remove leading/trailing whitespace
    const trimmedName = name.trim();
    if (!trimmedName) {
      return res.status(400).json({ error: 'Team name cannot be empty' });
    }

    // Check if a team with the same trimmed name exists in the specified league and season
    const existingTeam = await Team.findOne({
      name: trimmedName,
      league: leagueId,
      season,
    });
    if (existingTeam) {
      return res.status(400).json({ error: 'A team with this name already exists in the specified league and season' });
    }

    const team = await Team.create({
      name: trimmedName,
      league: leagueId,
      season,
      logo,
      createdBy: req.user._id,
      isActive: true,
      members: [],
      secretKey: crypto.randomBytes(16).toString('hex'),
    });

    await League.findByIdAndUpdate(leagueId, { $addToSet: { teams: team._id } });

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
    const players = await Player.find({ user: req.user._id }).select('_id');
    const playerIds = players.map(player => player._id);

    // Find active teams where the user is a member (via Player ID)
    const teams = await Team.find({
      'members.player': { $in: playerIds },
      isActive: true,
    })
      .populate('league', 'name sportType location teams')
      .populate({
        path: 'members.player',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name',
        },
      })
      .lean();

    // Calculate team record and ranking for each team
    for (let team of teams) {
      // Calculate team record (wins/losses) for the current season
      const teamRecord = await Game.aggregate([
        {
          $match: {
            teams: team._id,
            isCompleted: true,
            season: team.season,
          },
        },
        {
          $project: {
            teamScores: 1,
            winner: {
              $cond: {
                if: {
                  $gt: [
                    // Team's score
                    { $arrayElemAt: ["$teamScores.score", { $indexOfArray: ["$teamScores.team", team._id] }] },
                    // Opposing team's score
                    {
                      $arrayElemAt: [
                        "$teamScores.score",
                        {
                          $indexOfArray: [
                            "$teamScores.team",
                            {
                              $arrayElemAt: [
                                "$teams",
                                {
                                  $indexOfArray: [
                                    "$teams",
                                    { $not: { $eq: [team._id, "$teams"] } },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            wins: { $sum: "$winner" },
            losses: { $sum: { $cond: [{ $eq: ["$winner", 0] }, 1, 0] } },
          },
        },
      ]);

      team.record = teamRecord.length ? { wins: teamRecord[0].wins, losses: teamRecord[0].losses } : { wins: 0, losses: 0 };

      // Calculate team ranking in the league for the current season
      const teamScores = await Game.aggregate([
        {
          $match: {
            league: team.league._id,
            season: team.season,
            isCompleted: true,
          },
        },
        { $unwind: "$teamScores" },
        {
          $group: {
            _id: "$teamScores.team",
            totalScore: { $sum: "$teamScores.score" },
          },
        },
        { $sort: { totalScore: -1 } },
      ]);

      const rank = teamScores.findIndex(t => t._id.toString() === team._id.toString()) + 1;
      const totalTeams = team.league.teams.length;
      team.ranking = rank > 0 ? { rank, totalTeams } : { rank: null, totalTeams };
    }

    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-store');
    res.json(teams);
  } catch (error) {
    console.error('Get my teams error:', error);
    res.status(400).json({ error: 'Failed to fetch user teams' });
  }
});

// Get upcoming and previous games for a team
router.get('/:teamId/games', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { season } = req.query;

    // Validate teamId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    // Find the team to get season and league
    const team = await Team.findById(teamId).select('season league');
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Ensure user is a member of the team
    const players = await Player.find({ user: req.user._id }).select('_id');
    const playerIds = players.map(player => player._id);
    if (!(await Team.findOne({ _id: teamId, 'members.player': { $in: playerIds } }))) {
      return res.status(403).json({ error: 'User is not a member of this team' });
    }

    // Use the team's season instead of the league's season
    const querySeason = team.season;

    const query = { teams: teamId, season: querySeason };

    // Fetch upcoming games (isCompleted: false)
    const upcomingGames = await Game.find({ ...query, isCompleted: false })
      .sort({ date: 1 }) // Earliest first
      .populate('teams', 'name')
      .lean();

    // Fetch previously completed games (isCompleted: true)
    const previousGames = await Game.find({ ...query, isCompleted: true })
      .sort({ date: -1 }) // Most recent first
      // .limit(3)
      .populate('teams', 'name')
      .lean();

    // Format games
    const formatGame = (game, teamId) => {
      const opponent = game.teams.find(t => t._id.toString() !== teamId.toString());
      const teamScoreObj = game.teamScores.find(s => s.team.toString() === teamId.toString());
      const opponentScoreObj = game.teamScores.find(s => s.team.toString() !== teamId.toString());
      return {
        _id: game._id,
        date: game.date,
        opponentName: opponent?.name || 'Unknown',
        teamScore: teamScoreObj?.score ?? (game.isCompleted ? 0 : 'TBD'),
        opponentScore: opponentScoreObj?.score ?? (game.isCompleted ? 0 : 'TBD'),
        videoUrl: game.videoUrl || null, // Include videoUrl
      };
    };

    const formattedUpcomingGames = upcomingGames.map(game => formatGame(game, teamId));
    const formattedPreviousGames = previousGames.map(game => formatGame(game, teamId));

    res.set('Cache-Control', 'no-store');
    res.json({ upcomingGames: formattedUpcomingGames, previousGames: formattedPreviousGames });
  } catch (err) {
    console.error('Get team games error:', err);
    res.status(500).json({ error: 'Failed to fetch team games' });
  }
});

// Get team leaderboard
router.get('/:teamId/leaderboard', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { season } = req.query;

    // Validate teamId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    // Find the team to get season and validate user access
    const team = await Team.findById(teamId).select('season league');
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Ensure user is a member of the team
    const players = await Player.find({ user: req.user._id }).select('_id');
    const playerIds = players.map(player => player._id);
    if (!(await Team.findOne({ _id: teamId, 'members.player': { $in: playerIds } }))) {
      return res.status(403).json({ error: 'User is not a member of this team' });
    }

    const querySeason = season || team.season;

    // Aggregate player points, assists, and rebounds
    const leaderboard = await Game.aggregate([
      {
        $match: {
          teams: new mongoose.Types.ObjectId(teamId),
          isCompleted: true,
          season: querySeason,
        },
      },
      { $unwind: '$playerStats' },
      {
        $match: {
          'playerStats.team': new mongoose.Types.ObjectId(teamId),
        },
      },
      {
        $lookup: {
          from: 'players',
          localField: 'playerStats.player',
          foreignField: '_id',
          as: 'playerDetails',
        },
      },
      { $unwind: '$playerDetails' },
      {
        $lookup: {
          from: 'users',
          localField: 'playerDetails.user',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          playerId: '$playerStats.player',
          playerName: '$userDetails.name',
          jerseyNumber: '$playerDetails.jerseyNumber',
          points: {
            $sum: [
              { $multiply: [{ $ifNull: ['$playerStats.stats.twoPointFGM', 0] }, 2] },
              { $multiply: [{ $ifNull: ['$playerStats.stats.threePointFGM', 0] }, 3] },
              { $ifNull: ['$playerStats.stats.freeThrowM', 0] },
            ],
          },
          assists: { $ifNull: ['$playerStats.stats.assist', 0] },
          rebounds: {
            $sum: [
              { $ifNull: ['$playerStats.stats.offensiveRebound', 0] },
              { $ifNull: ['$playerStats.stats.defensiveRebound', 0] },
            ],
          },
          gameId: '$_id',
        },
      },
      {
        $group: {
          _id: '$playerId',
          playerName: { $first: '$playerName' },
          jerseyNumber: { $first: '$jerseyNumber' },
          totalPoints: { $sum: '$points' },
          totalAssists: { $sum: '$assists' },
          totalRebounds: { $sum: '$rebounds' },
          gamesPlayed: { $addToSet: '$gameId' },
        },
      },
      {
        $project: {
          _id: 1,
          playerName: 1,
          jerseyNumber: 1,
          totalPoints: 1,
          totalAssists: 1,
          totalRebounds: 1,
          gamesPlayed: { $size: '$gamesPlayed' },
          pointsPerGame: {
            $cond: {
              if: { $eq: [{ $size: '$gamesPlayed' }, 0] },
              then: 0,
              else: { $divide: ['$totalPoints', { $size: '$gamesPlayed' }] },
            },
          },
          assistsPerGame: {
            $cond: {
              if: { $eq: [{ $size: '$gamesPlayed' }, 0] },
              then: 0,
              else: { $divide: ['$totalAssists', { $size: '$gamesPlayed' }] },
            },
          },
          reboundsPerGame: {
            $cond: {
              if: { $eq: [{ $size: '$gamesPlayed' }, 0] },
              then: 0,
              else: { $divide: ['$totalRebounds', { $size: '$gamesPlayed' }] },
            },
          },
        },
      },
    ]);

    // Split into points, assists, and rebounds leaderboards, each sorted and limited to 5
    const pointsLeaderboard = leaderboard
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 5)
      .map(player => ({
        ...player,
        pointsPerGame: player.gamesPlayed === 0 ? 0 : Math.round(player.pointsPerGame * 10) / 10,
      }));

    const assistsLeaderboard = leaderboard
      .sort((a, b) => b.totalAssists - a.totalAssists)
      .slice(0, 5)
      .map(player => ({
        ...player,
        assistsPerGame: player.gamesPlayed === 0 ? 0 : Math.round(player.assistsPerGame * 10) / 10,
      }));

    const reboundsLeaderboard = leaderboard
      .sort((a, b) => b.totalRebounds - a.totalRebounds)
      .slice(0, 5)
      .map(player => ({
        ...player,
        reboundsPerGame: player.gamesPlayed === 0 ? 0 : Math.round(player.reboundsPerGame * 10) / 10,
      }));

    res.set('Cache-Control', 'no-store');
    res.json({ points: pointsLeaderboard, assists: assistsLeaderboard, rebounds: reboundsLeaderboard });
  } catch (err) {
    console.error('Get team leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Route to get a single team by ID, with user validation and record/ranking
router.get('/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;

    // Validate teamId
    if (!isValidObjectId(teamId)) {
      console.error(`Invalid teamId: ${teamId}`);
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    // Find Player documents for the authenticated user
    const players = await Player.find({ user: req.user._id }).select('_id');
    const playerIds = players.map((player) => player._id);

    // Find the team, ensuring the user is a member and the team is active
    const team = await Team.findOne({
      _id: teamId,
      'members.player': { $in: playerIds },
      isActive: true,
    })
      .populate({
        path: 'members.player',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name',
        },
      })
      .populate('league', 'name sportType location teams')
      .lean();

    if (!team) {
      console.error(`Team not found or user not a member: teamId=${teamId}, playerIds=${playerIds}`);
      return res.status(404).json({ error: 'Team not found or user is not a member' });
    }

    // Calculate team record (wins/losses) for the current season
    const teamRecord = await Game.aggregate([
      {
        $match: {
          teams: team._id,
          isCompleted: true,
          season: team.season,
        },
      },
      {
        $project: {
          teamScores: 1,
          winner: {
            $cond: {
              if: {
                $gt: [
                  // Team's score
                  {
                    $arrayElemAt: [
                      '$teamScores.score',
                      { $indexOfArray: ['$teamScores.team', team._id] },
                    ],
                  },
                  // Opposing team's score
                  {
                    $arrayElemAt: [
                      '$teamScores.score',
                      {
                        $indexOfArray: [
                          '$teamScores.team',
                          {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: '$teams',
                                  as: 'team',
                                  cond: { $ne: ['$$team', team._id] },
                                },
                              },
                              0,
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              then: 1,
              else: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          wins: { $sum: '$winner' },
          losses: { $sum: { $cond: [{ $eq: ['$winner', 0] }, 1, 0] } },
        },
      },
    ]);

    team.record = teamRecord.length
      ? { wins: teamRecord[0].wins, losses: teamRecord[0].losses }
      : { wins: 0, losses: 0 };

    // Calculate team ranking in the league for the current season
    const teamScores = await Game.aggregate([
      {
        $match: {
          league: team.league._id,
          season: team.season,
          isCompleted: true,
        },
      },
      { $unwind: '$teamScores' },
      {
        $group: {
          _id: '$teamScores.team',
          totalScore: { $sum: '$teamScores.score' },
        },
      },
      { $sort: { totalScore: -1 } },
    ]);

    const rank =
      teamScores.findIndex((t) => t._id.toString() === team._id.toString()) + 1;
    const totalTeams = team.league.teams.length;
    team.ranking = rank > 0 ? { rank, totalTeams } : { rank: null, totalTeams };

    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-store');
    res.json(team);
  } catch (err) {
    if (err.name === 'CastError') {
      console.error(`CastError for teamId: ${req.params.teamId}`);
      return res.status(400).json({ error: 'Invalid team ID' });
    }
    console.error('Get team error:', err.message, err.stack);
    res.status(500).json({
      error: 'Failed to fetch team',
      details: err.message,
      teamId: req.params.teamId,
      userId: req.user?._id || 'unknown'
    });
  }
});

module.exports = router;
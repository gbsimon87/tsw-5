const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Player = require('../models/Player');
const Team = require('../models/Team');
const Game = require('../models/Game');
const League = require('../models/League');
const authMiddleware = require('../middleware/authMiddleware');
const checkAdminOrManager = require('../middleware/adminOrManagerMiddleware');
const { initializeStats } = require('../middleware/statsUtils');

// Create a player (admin/manager only)
router.post('/', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { userId, position } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const existingPlayer = await Player.findOne({ user: userId });
    if (existingPlayer) {
      return res.status(400).json({ error: 'Player already exists for this user' });
    }

    const player = await Player.create({
      user: userId,
      stats: {}, // Initialized as empty; populated when joining teams or games
      position,
      teams: [],
    });

    res.status(201).json(player);
  } catch (err) {
    console.error('Create player error:', err);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// Get single player by ID with last 3 games' stats
router.get('/:playerId', authMiddleware, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { leagueId } = req.query;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(playerId) || !mongoose.Types.ObjectId.isValid(leagueId)) {
      // console.log(`[Get player] Invalid playerId: ${playerId} or leagueId: ${leagueId}`);
      return res.status(400).json({ error: 'Invalid playerId or leagueId' });
    }

    // Fetch player data
    const player = await Player.findById(playerId)
      .populate('user', 'name')
      .populate({
        path: 'teams',
        select: 'name league season',
        populate: { path: 'league', select: 'name' },
      })
      .lean();

    if (!player) {
      console.log(`[Get player] Player not found for playerId: ${playerId}`);
      return res.status(404).json({ error: 'Player not found' });
    }

    // Determine player name
    const playerName = player.isRinger ? player.name : player.user?.name || 'Unknown Player';
    console.log(`[Get player] Player name: ${playerName}, isRinger: ${player.isRinger}`);

    // Verify player is in the league
    const team = player.teams.find(t => t.league._id.toString() === leagueId);
    if (!team) {
      console.log(`[Get player] Player ${playerId} not in league ${leagueId}`);
      return res.status(400).json({ error: 'Player is not in the specified league' });
    }

    // Fetch games for the player in the league
    const games = await Game.find({
      league: leagueId,
      season: team.season,
      'playerStats.player': playerId,
      isCompleted: true,
    })
      .populate('teams', 'name')
      .lean();

    // Process game stats
    const gameStats = games.map(game => {
      const playerStat = game.playerStats.find(stat => stat.player.toString() === playerId);
      const opponentTeam = game.teams.find(t => t._id.toString() !== team._id.toString());

      // Calculate stats with fallback values
      const points = ((playerStat?.stats?.twoPointFGM || 0) * 2) +
        ((playerStat?.stats?.threePointFGM || 0) * 3) +
        (playerStat?.stats?.freeThrowM || 0);
      const rebounds = (playerStat?.stats?.offensiveRebound || 0) +
        (playerStat?.stats?.defensiveRebound || 0);
      const assists = playerStat?.stats?.assist || 0;

      return {
        date: game.date,
        opponentName: opponentTeam?.name || 'Unknown Opponent',
        points,
        rebounds,
        assists,
        teamScores: game.teamScores || [],
      };
    });

    // Prepare response
    const response = {
      name: playerName,
      jerseyNumber: player.jerseyNumber || null,
      position: player.position || null,
      team: {
        _id: team._id,
        name: team.name,
        league: team.league,
        season: team.season,
      },
      gameStats: gameStats.length > 0 ? gameStats : [],
    };

    res.json(response);
  } catch (error) {
    console.error(`[Get player] Error for playerId: ${req.params.playerId}`, error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

// // Get players (filter by leagueId)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { leagueId, userId } = req.query;
    const query = leagueId ? { league: leagueId } : { user: userId } || {};
    // Find Player documents for the user
    const players = await Player.find({ user: userId })
      .select('_id')
      .lean();

    // Aggregate stats for each player
    for (let player of players) {
      // Get all games for the player in their teams' leagues
      const playerTeams = await Team.find({ 'members.player': player._id }).select('league season').lean();
      const leagueIds = playerTeams.map(t => t.league);

      // Aggregate total points, season stats, and game-by-game stats
      const statsAggregation = await Game.aggregate([
        {
          $match: {
            league: { $in: leagueIds },
            'playerStats.player': player._id,
            isCompleted: true,
          },
        },
        { $unwind: '$playerStats' },
        {
          $match: {
            'playerStats.player': player._id,
          },
        },
        {
          $lookup: {
            from: 'leagues',
            localField: 'league',
            foreignField: '_id',
            as: 'league',
          },
        },
        { $unwind: '$league' },
        {
          $project: {
            date: 1,
            season: 1,
            stats: '$playerStats.stats',
            leagueSettings: '$league.settings',
          },
        },
        {
          $sort: { date: 1 }, // Sort by date for chronological order
        },
        {
          $group: {
            _id: '$season',
            totalStats: { $mergeObjects: '$stats' },
            gameCount: { $sum: 1 },
            games: {
              $push: {
                date: '$date',
                stats: '$stats',
                leagueSettings: '$leagueSettings',
              },
            },
          },
        },
        {
          $project: {
            season: '$_id',
            totalPoints: {
              $sum: {
                $map: {
                  input: { $objectToArray: '$totalStats' },
                  as: 'stat',
                  in: {
                    $multiply: [
                      '$$stat.v',
                      {
                        $let: {
                          vars: {
                            scoringRules: { $arrayElemAt: ['$games.leagueSettings.scoringRules', 0] },
                          },
                          in: { $ifNull: [{ $toInt: { $getField: { field: '$$stat.k', input: '$$scoringRules' } } }, 0] },
                        },
                      },
                    ],
                  },
                },
              },
            },
            avgStats: {
              $map: {
                input: { $objectToArray: '$totalStats' },
                as: 'stat',
                in: {
                  k: '$$stat.k',
                  v: { $divide: ['$$stat.v', '$gameCount'] },
                },
              },
            },
            gameStats: {
              $map: {
                input: '$games',
                as: 'game',
                in: {
                  date: '$$game.date',
                  points: {
                    $sum: {
                      $map: {
                        input: { $objectToArray: '$$game.stats' },
                        as: 'stat',
                        in: {
                          $multiply: [
                            '$$stat.v',
                            {
                              $let: {
                                vars: { scoringRules: '$$game.leagueSettings.scoringRules' },
                                in: { $ifNull: [{ $toInt: { $getField: { field: '$$stat.k', input: '$$scoringRules' } } }, 0] },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                  rebounds: { $ifNull: ['$$game.stats.defensiveRebound', 0] }, // Adjust based on statTypes
                  steals: { $ifNull: ['$$game.stats.steal', 0] },
                },
              },
            },
          },
        },
        {
          $sort: { season: 1 },
        },
      ]);

      // Calculate hot streak (last 5 games)
      const recentGames = await Game.aggregate([
        {
          $match: {
            league: { $in: leagueIds },
            'playerStats.player': player._id,
            isCompleted: true,
          },
        },
        { $unwind: '$playerStats' },
        {
          $match: {
            'playerStats.player': player._id,
          },
        },
        {
          $lookup: {
            from: 'leagues',
            localField: 'league',
            foreignField: '_id',
            as: 'league',
          },
        },
        { $unwind: '$league' },
        {
          $project: {
            stats: '$playerStats.stats',
            leagueSettings: '$league.settings',
          },
        },
        {
          $sort: { date: -1 }, // Most recent first
        },
        { $limit: 5 }, // Last 5 games
        {
          $group: {
            _id: null,
            totalPoints: {
              $sum: {
                $sum: {
                  $map: {
                    input: { $objectToArray: '$stats' },
                    as: 'stat',
                    in: {
                      $multiply: [
                        '$$stat.v',
                        {
                          $let: {
                            vars: { scoringRules: '$leagueSettings.scoringRules' },
                            in: { $ifNull: [{ $toInt: { $getField: { field: '$$stat.k', input: '$$scoringRules' } } }, 0] },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
            gameCount: { $sum: 1 },
          },
        },
        {
          $project: {
            avgPoints: { $divide: ['$totalPoints', { $max: ['$gameCount', 1] }] },
          },
        },
      ]);

      // Combine stats into player object
      player.stats = {
        totalPoints: statsAggregation.reduce((sum, s) => sum + (s.totalPoints || 0), 0),
        seasonStats: statsAggregation.map(s => ({
          season: s.season,
          avgPoints: s.avgStats.find(stat => stat.k === 'points')?.v || 0,
          avgRebounds: s.avgStats.find(stat => stat.k === 'defensiveRebound')?.v || 0,
          avgSteals: s.avgStats.find(stat => stat.k === 'steal')?.v || 0,
        })),
        gameStats: statsAggregation.flatMap(s => s.gameStats.map(g => ({
          season: s.season,
          date: g.date,
          points: g.points || 0,
          rebounds: g.rebounds || 0,
          steals: g.steals || 0,
        })))
      };
    }
    res.json(players);
  } catch (error) {
    console.error('Get players error:', error);
    res.status(400).json({ error: 'Failed to fetch player data' });
  }
});

// Get players by teamId or leagueId
// router.get('/', authMiddleware, async (req, res) => {
//   try {
//     const { teamId, leagueId } = req.query;

//     const query = {};
//     if (teamId && mongoose.Types.ObjectId.isValid(teamId)) {
//       query.teams = teamId; // Use 'teams' field since Player schema has teams array
//     } else if (leagueId && mongoose.Types.ObjectId.isValid(leagueId)) {
//       query.league = leagueId;
//     } else {
//       return res.status(400).json({ error: 'teamId or leagueId is required' });
//     }

//     const players = await Player.find(query)
//       .populate('user', 'name picture')
//       .select('user teams league')
//       .lean();

//     res.json(players);
//   } catch (err) {
//     console.error('Get players error:', err);
//     res.status(500).json({ error: 'Failed to fetch players' });
//   }
// });

// Update a player (admin/manager or own profile)
router.patch('/:playerId', authMiddleware, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { position, jerseyNumber } = req.body;

    const player = await Player.findById(playerId).populate('user').populate('teams');
    if (!player) return res.status(404).json({ error: 'Player not found' });

    // Check if user is admin or manager of any league the player’s teams belong to
    const isAdminOrManager = await League.find({
      $or: [
        { admins: req.user._id },
        { managers: req.user._id }
      ],
      teams: { $in: player.teams }
    });
    const isOwnProfile = player.user._id.toString() === req.user._id.toString();

    if (!isAdminOrManager.length && !isOwnProfile) {
      return res.status(403).json({ error: 'Unauthorized: Admin, manager, or own profile access required' });
    }

    // Define allowed fields based on role
    const allowedFields = isAdminOrManager.length
      ? { position, jerseyNumber }
      : { position };

    // Validate jerseyNumber if provided
    if (jerseyNumber !== undefined) {
      if (jerseyNumber !== null && (isNaN(jerseyNumber) || jerseyNumber < 0)) {
        return res.status(400).json({ error: 'Jersey number must be a non-negative number or null' });
      }
      allowedFields.jerseyNumber = jerseyNumber !== null ? parseInt(jerseyNumber) : null;
    }

    // Remove undefined fields to prevent overwriting with undefined
    const updateFields = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
    );

    Object.assign(player, updateFields);
    await player.save();

    res.json(player);
  } catch (err) {
    console.error('Update player error:', err);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// Add ringer player to a team
router.post('/:teamId/players/ringer', authMiddleware, checkAdminOrManager, async (req, res) => {
  const { name, jerseyNumber, position, leagueId } = req.body;
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.league.toString() !== leagueId) {
      return res.status(400).json({ message: 'Team does not belong to specified league' });
    }

    // Check for existing ringer with same name and team
    const existingPlayer = await Player.findOne({
      name,
      isRinger: true,
      teams: team._id,
    });
    if (existingPlayer) {
      return res.status(400).json({ message: 'Ringer with this name already exists on the team' });
    }

    // Create ringer player
    const player = new Player({
      isRinger: true,
      name,
      teams: [team._id],
      jerseyNumber,
      position,
      stats: {},
    });
    await player.save();

    // Add to team
    team.members.push({ player: player._id, role: 'player', isActive: true });
    await team.save();

    res.status(201).json({ message: 'Ringer player added successfully', player });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
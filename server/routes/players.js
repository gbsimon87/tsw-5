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
    const { userId, position, bio, dateOfBirth, nationality } = req.body;
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
      injuries: [],
      playerHistory: [],
      recentInjuries: []
    });

    res.status(201).json(player);
  } catch (err) {
    console.error('Create player error:', err);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// // Get players (filter by leagueId)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { leagueId, userId } = req.query;
    const query = leagueId ? { league: leagueId } : { user: userId } || {};
    // Find Player documents for the user
    const players = await Player.find({ user: userId })
      .select('_id careerAvgPoints careerRebounds careerSteals performanceRating')
      .lean();

    // Aggregate stats for each player
    for (let player of players) {
      // Get all games for the player in their teams' leagues
      const playerTeams = await Team.find({ 'members.player': player._id }).select('league season').lean();
      const leagueIds = playerTeams.map(t => t.league);
      const seasons = [...new Set(playerTeams.map(t => t.season))]; // Unique seasons

      // Aggregate total points and stats per season
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
            season: 1,
            stats: '$playerStats.stats',
            leagueSettings: '$league.settings',
          },
        },
        {
          $group: {
            _id: '$season',
            totalStats: { $mergeObjects: '$stats' },
            gameCount: { $sum: 1 },
            games: {
              $push: {
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
            games: {
              $map: {
                input: '$games',
                as: 'game',
                in: {
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
                },
              },
            },
          },
        },
        {
          $sort: { season: 1 },
        },
      ]);

      // Combine stats into player object
      player.stats = {
        totalPoints: statsAggregation.reduce((sum, s) => sum + (s.totalPoints || 0), 0),
        seasonStats: statsAggregation.map(s => ({
          season: s.season,
          avgPoints: s.avgStats.find(stat => stat.k === 'points')?.v || 0,
          avgRebounds: s.avgStats.find(stat => stat.k === 'rebounds')?.v || 0,
          avgSteals: s.avgStats.find(stat => stat.k === 'steals')?.v || 0,
        })),
        gamePoints: statsAggregation.flatMap(s => s.games.map(g => ({ season: s.season, points: g.points || 0 }))),
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
    const { position, bio, dateOfBirth, nationality, injuries, playerHistory, recentInjuries } = req.body;

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

    const updateFields = isAdminOrManager.length ? req.body : { position, bio, dateOfBirth, nationality, injuries, playerHistory, recentInjuries };
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
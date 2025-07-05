const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Game = require('../models/Game');
const authMiddleware = require('../middleware/authMiddleware');
const checkAdminOrManager = require('../middleware/adminOrManagerMiddleware');

// Get a single game by ID
router.get('/:gameId', authMiddleware, async (req, res) => {
  try {
    const { gameId } = req.params;

    // Validate gameId
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ error: 'Invalid gameId' });
    }

    // Fetch game with necessary population
    const game = await Game.findById(gameId)
      .populate({
        path: 'teams',
        select: 'name logo members createdBy isActive',
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
      .populate({
        path: 'playerStats.player',
        select: 'name user',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name',
        },
      })
      .populate({
        path: 'gameMVP',
        select: 'name user',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name',
        },
      })
      .lean();

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Structure the response
    const populatedGame = {
      // Game information
      _id: game._id,
      league: game.league,
      season: game.season,
      date: game.date,
      location: game.location,
      isCompleted: game.isCompleted,
      matchType: game.matchType,
      weatherConditions: game.weatherConditions,
      referee: game.referee,
      gameDuration: game.gameDuration,
      eventType: game.eventType,
      attendance: game.attendance,
      venue: game.venue,
      previousMatchupScore: game.previousMatchupScore,
      fanRating: game.fanRating,
      mediaLinks: game.mediaLinks,
      venueCapacity: game.venueCapacity,

      // Team information
      teams: game.teams.map(team => ({
        _id: team._id,
        name: team.name,
        logo: team.logo,
        createdBy: team.createdBy,
        isActive: team.isActive,
        members: team.members.map(member => ({
          playerId: member.player?._id,
          name: member.player?.user?.name || 'Unknown',
          jerseyNumber: member.player?.jerseyNumber || null,
          position: member.player?.position || null,
          role: member.role,
          isActive: member.isActive,
        })),
      })),

      // Team scores
      teamScores: game.teamScores.map(score => ({
        teamId: score.team,
        teamName: game.teams.find(t => t._id.toString() === score.team.toString())?.name || 'Unknown',
        score: score.score,
      })),

      // Player stats
      playerStats: game.playerStats.map(stat => ({
        playerId: stat.player?._id,
        playerName: stat.player?.user?.name || 'Unknown',
        teamId: stat.team,
        teamName: game.teams.find(t => t._id.toString() === stat.team.toString())?.name || 'Unknown',
        stats: stat.stats,
      })),

      // Game MVP
      gameMVP: game.gameMVP
        ? {
            playerId: game.gameMVP._id,
            name: game.gameMVP.user?.name || 'Unknown',
          }
        : null,
    };

    res.set('Cache-Control', 'no-store');
    res.json(populatedGame);
  } catch (err) {
    console.error('Get game error:', err);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Get games for a league and season
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { leagueId, season } = req.query;
    if (!leagueId) return res.status(400).json({ error: 'leagueId is required' });
    if (!mongoose.Types.ObjectId.isValid(leagueId)) {
      console.error('Invalid leagueId:', leagueId);
      return res.status(400).json({ error: 'Invalid leagueId' });
    }

    const query = { league: leagueId };
    if (season) query.season = season;

    const games = await Game.find(query)
      .populate('teams', 'name')
      .populate({
        path: 'playerStats.player',
        populate: { path: 'user', model: 'User', select: 'name' }
      })
      .populate({
        path: 'gameMVP',
        populate: { path: 'user', model: 'User', select: 'name' }
      })
      .lean();

    const populatedGames = games.map(game => ({
      ...game,
      teams: Array.isArray(game.teams) ? game.teams : [],
      teamScores: Array.isArray(game.teamScores) ? game.teamScores.map(score => ({
        team: game.teams.find(t => t._id.toString() === score.team.toString()) || { name: 'Unknown' },
        score: score.score
      })) : [],
      playerStats: Array.isArray(game.playerStats) ? game.playerStats.map(stat => ({
        ...stat,
        player: stat.player ? { _id: stat.player._id, name: stat.player.user?.name || 'Unknown' } : null,
        team: game.teams.find(t => t._id.toString() === stat.team.toString()) || { name: 'Unknown' }
      })) : [],
      gameMVP: game.gameMVP ? { _id: game.gameMVP._id, name: game.gameMVP.user?.name || 'Unknown' } : null,
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
    const { league, season, date, teams, location, venue, venueCapacity, playerStats, matchType, eventType, gameDuration, weatherConditions, referee, attendance, previousMatchupScore, fanRating, highlights, matchReport, mediaLinks, gameMVP } = req.body;

    // Validate required fields
    if (!league || !date || !teams || teams.length !== 2 || teams[0] === teams[1]) {
      return res.status(400).json({ error: 'Invalid game data: league, date, and two unique teams required' });
    }
    if (!season || typeof season !== 'string' || season.trim() === '') {
      return res.status(400).json({ error: 'Invalid game data: season is required and must be a non-empty string' });
    }
    if (!mongoose.Types.ObjectId.isValid(league) || !teams.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: 'Invalid league or team IDs' });
    }

    // Validate teams belong to the league
    const leagueDoc = await League.findById(league);
    if (!leagueDoc) return res.status(404).json({ error: 'League not found' });
    const leagueTeamIds = leagueDoc.teams.map(id => id.toString());
    if (!teams.every(id => leagueTeamIds.includes(id.toString()))) {
      return res.status(400).json({ error: 'All teams must belong to the specified league' });
    }

    // Validate playerStats
    if (playerStats && Array.isArray(playerStats)) {
      for (const stat of playerStats) {
        if (!mongoose.Types.ObjectId.isValid(stat.player) || !mongoose.Types.ObjectId.isValid(stat.team)) {
          return res.status(400).json({ error: 'Invalid player or team ID in playerStats' });
        }
        if (!teams.includes(stat.team.toString())) {
          return res.status(400).json({ error: 'playerStats team must match one of the game teams' });
        }
        if (!Object.keys(stat.stats).every(key => leagueDoc.settings.statTypes.includes(key))) {
          return res.status(400).json({ error: 'Invalid stat types in playerStats' });
        }
        // Validate player is a member of the team
        const team = await Team.findById(stat.team);
        if (!team.members.some(m => m.player.toString() === stat.player.toString())) {
          return res.status(400).json({ error: 'Player is not a member of the specified team' });
        }
      }
    }

    // Filter out invalid mediaLinks
    const validMediaLinks = mediaLinks ? mediaLinks.filter(link => link.url.trim() && link.type.trim()) : [];

    const gameData = {
      league,
      season,
      date,
      teams,
      teamScores: teams.map(team => ({ team, score: 0 })), // Initial scores, updated by pre-save hook
      location,
      venue,
      venueCapacity,
      playerStats: playerStats || [],
      matchType: matchType || 'league',
      eventType: eventType || 'regular',
      gameDuration,
      weatherConditions,
      referee,
      attendance,
      previousMatchupScore,
      fanRating,
      highlights: highlights ? highlights.filter(h => h.trim()) : [],
      matchReport,
      mediaLinks: validMediaLinks,
      isCompleted: eventType === 'final' || (playerStats && playerStats.length > 0),
    };

    if (gameMVP && mongoose.Types.ObjectId.isValid(gameMVP)) {
      gameData.gameMVP = gameMVP;
    }

    const game = await Game.create(gameData);

    // Update Player.stats for career stats
    if (playerStats && playerStats.length > 0) {
      for (const stat of playerStats) {
        const player = await Player.findById(stat.player);
        if (player) {
          if (!player.stats[leagueDoc.sportType]) {
            player.stats[leagueDoc.sportType] = {};
          }
          Object.entries(stat.stats).forEach(([key, value]) => {
            player.stats[leagueDoc.sportType][key] = (player.stats[leagueDoc.sportType][key] || 0) + (value || 0);
          });
          player.gamesPlayed = (player.gamesPlayed || 0) + 1;
          await player.save();
        }
      }
    }

    const populatedGame = await Game.findById(game._id)
      .populate('teams', 'name')
      .populate({
        path: 'playerStats.player',
        populate: { path: 'user', model: 'User', select: 'name' }
      })
      .populate({
        path: 'gameMVP',
        populate: { path: 'user', model: 'User', select: 'name' }
      })
      .lean();

    populatedGame.teamScores = populatedGame.teamScores.map(score => ({
      team: populatedGame.teams.find(t => t._id.toString() === score.team.toString()) || { name: 'Unknown' },
      score: score.score
    }));
    populatedGame.playerStats = populatedGame.playerStats.map(stat => ({
      ...stat,
      player: stat.player ? { _id: stat.player._id, name: stat.player.user?.name || 'Unknown' } : null,
      team: populatedGame.teams.find(t => t._id.toString() === stat.team.toString()) || { name: 'Unknown' }
    }));
    populatedGame.gameMVP = populatedGame.gameMVP ? { _id: populatedGame.gameMVP._id, name: populatedGame.gameMVP.user?.name || 'Unknown' } : null;

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
    const { teams, date, location, venue, venueCapacity, playerStats, matchType, eventType, gameDuration, weatherConditions, referee, attendance, previousMatchupScore, fanRating, highlights, matchReport, mediaLinks, gameMVP, season } = req.body;

    const game = await Game.findById(gameId).populate('league');
    if (!game) return res.status(404).json({ error: 'Game not found' });

    if (teams && (teams.length !== 2 || teams[0] === teams[1])) {
      return res.status(400).json({ error: 'Exactly two unique teams required' });
    }
    if (season && (typeof season !== 'string' || season.trim() === '')) {
      return res.status(400).json({ error: 'Invalid season: must be a non-empty string' });
    }

    // Validate teams belong to the league
    if (teams) {
      const leagueDoc = await League.findById(game.league);
      if (!leagueDoc) return res.status(404).json({ error: 'League not found' });
      const leagueTeamIds = leagueDoc.teams.map(id => id.toString());
      if (!teams.every(id => leagueTeamIds.includes(id.toString()))) {
        return res.status(400).json({ error: 'All teams must belong to the specified league' });
      }
    }

    // Validate playerStats
    let newPlayerIds = [];
    if (playerStats && Array.isArray(playerStats)) {
      const leagueDoc = await League.findById(game.league);
      for (const stat of playerStats) {
        if (!mongoose.Types.ObjectId.isValid(stat.player) || !mongoose.Types.ObjectId.isValid(stat.team)) {
          return res.status(400).json({ error: 'Invalid player or team ID in playerStats' });
        }
        if (!game.teams.includes(stat.team.toString()) && (!teams || !teams.includes(stat.team.toString()))) {
          return res.status(400).json({ error: 'playerStats team must match one of the game teams' });
        }
        if (!Object.keys(stat.stats).every(key => leagueDoc.settings.statTypes.includes(key))) {
          return res.status(400).json({ error: 'Invalid stat types in playerStats' });
        }
        const team = await Team.findById(stat.team);
        if (!team.members.some(m => m.player.toString() === stat.player.toString())) {
          return res.status(400).json({ error: 'Player is not a member of the specified team' });
        }
        newPlayerIds.push(stat.player.toString());
      }
    }

    const validMediaLinks = mediaLinks ? mediaLinks.filter(link => link.url.trim() && link.type.trim()) : [];

    const updateData = {
      teams: teams || game.teams,
      date: date || game.date,
      season: season || game.season,
      location: location !== undefined ? location : game.location,
      venue: venue !== undefined ? venue : game.venue,
      venueCapacity: venueCapacity !== undefined ? venueCapacity : game.venueCapacity,
      playerStats: playerStats || game.playerStats,
      matchType: matchType || game.matchType,
      eventType: eventType || game.eventType,
      gameDuration: gameDuration !== undefined ? gameDuration : game.gameDuration,
      weatherConditions: weatherConditions !== undefined ? weatherConditions : game.weatherConditions,
      referee: referee !== undefined ? referee : game.referee,
      attendance: attendance !== undefined ? attendance : game.attendance,
      previousMatchupScore: previousMatchupScore !== undefined ? previousMatchupScore : game.previousMatchupScore,
      fanRating: fanRating !== undefined ? fanRating : game.fanRating,
      highlights: highlights ? highlights.filter(h => h.trim()) : game.highlights,
      matchReport: matchReport !== undefined ? matchReport : game.matchReport,
      mediaLinks: validMediaLinks.length > 0 ? validMediaLinks : game.mediaLinks,
      isCompleted: eventType === 'final' || (playerStats && playerStats.length > 0),
    };

    if (gameMVP && mongoose.Types.ObjectId.isValid(gameMVP)) {
      updateData.gameMVP = gameMVP;
    } else if (gameMVP === null || gameMVP === '') {
      updateData.gameMVP = null;
    }

    // If teams are updated, reset teamScores
    if (teams) {
      updateData.teamScores = teams.map(team => ({ team, score: 0 }));
    }

    // Update Player.stats for career stats
    if (playerStats && playerStats.length > 0) {
      const leagueDoc = await League.findById(game.league);
      const oldPlayerIds = game.playerStats.map(stat => stat.player.toString());

      // Subtract old stats
      for (const oldStat of game.playerStats) {
        const player = await Player.findById(oldStat.player);
        if (player && player.stats[leagueDoc.sportType]) {
          Object.entries(oldStat.stats).forEach(([key, value]) => {
            player.stats[leagueDoc.sportType][key] = Math.max(
              (player.stats[leagueDoc.sportType][key] || 0) - (value || 0),
              0
            ); // Prevent negative stats
          });
          // Only decrement gamesPlayed if the player is not in the new playerStats
          if (!newPlayerIds.includes(oldStat.player.toString())) {
            player.gamesPlayed = Math.max((player.gamesPlayed || 0) - 1, 0);
          }
          await player.save();
        }
      }

      // Add new stats
      for (const stat of playerStats) {
        const player = await Player.findById(stat.player);
        if (player) {
          if (!player.stats[leagueDoc.sportType]) {
            player.stats[leagueDoc.sportType] = {};
          }
          Object.entries(stat.stats).forEach(([key, value]) => {
            player.stats[leagueDoc.sportType][key] = (player.stats[leagueDoc.sportType][key] || 0) + (value || 0);
          });
          // Only increment gamesPlayed if the player wasn't in the old playerStats
          if (!oldPlayerIds.includes(stat.player.toString())) {
            player.gamesPlayed = (player.gamesPlayed || 0) + 1;
          }
          await player.save();
        }
      }
    }

    Object.assign(game, updateData);
    await game.save();

    const populatedGame = await Game.findById(gameId)
      .populate('teams', 'name')
      .populate({
        path: 'playerStats.player',
        populate: { path: 'user', model: 'User', select: 'name' }
      })
      .populate({
        path: 'gameMVP',
        populate: { path: 'user', model: 'User', select: 'name' }
      })
      .lean();

    populatedGame.teamScores = populatedGame.teamScores.map(score => ({
      team: populatedGame.teams.find(t => t._id.toString() === score.team.toString()) || { name: 'Unknown' },
      score: score.score
    }));
    populatedGame.playerStats = populatedGame.playerStats.map(stat => ({
      ...stat,
      player: stat.player ? { _id: stat.player._id, name: stat.player.user?.name || 'Unknown' } : null,
      team: populatedGame.teams.find(t => t._id.toString() === stat.team.toString()) || { name: 'Unknown' }
    }));
    populatedGame.gameMVP = populatedGame.gameMVP ? { _id: populatedGame.gameMVP._id, name: populatedGame.gameMVP.user?.name || 'Unknown' } : null;

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
    const game = await Game.findById(gameId).populate('league');
    if (!game) return res.status(404).json({ error: 'Game not found' });

    // Adjust Player.stats and gamesPlayed
    if (game.playerStats && game.playerStats.length > 0) {
      const leagueDoc = game.league;
      for (const stat of game.playerStats) {
        const player = await Player.findById(stat.player);
        if (player) {
          if (player.stats[leagueDoc.sportType]) {
            Object.entries(stat.stats).forEach(([key, value]) => {
              player.stats[leagueDoc.sportType][key] = Math.max(
                (player.stats[leagueDoc.sportType][key] || 0) - (value || 0),
                0
              ); // Prevent negative stats
            });
            player.gamesPlayed = Math.max((player.gamesPlayed || 0) - 1, 0); // Decrement gamesPlayed
            await player.save();
          }
        }
      }
    }

    await game.deleteOne();
    res.json({ message: 'Game deleted and player stats updated' });
  } catch (err) {
    console.error('Delete game error:', err);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

module.exports = router;
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Game = require('../models/Game');
const League = require('../models/League');
const Player = require('../models/Player');
const Team = require('../models/Team');
const authMiddleware = require('../middleware/authMiddleware');
const checkAdminOrManager = require('../middleware/adminOrManagerMiddleware');

router.get('/next-game', authMiddleware, async (req, res) => {
  try {
    // Find Player documents for the user
    const players = await Player.find({ user: req.user._id }).select('_id').lean();
    const playerIds = players.map(player => player._id);

    // Find active teams where the user is a member
    const teams = await Team.find({
      'members.player': { $in: playerIds },
      isActive: true,
    }).select('_id name').lean();
    const teamIds = teams.map(team => team._id);

    // Find the earliest uncompleted game for any of the user's teams
    const nextGame = await Game.findOne({
      teams: { $in: teamIds },
      isCompleted: false,
    })
      .sort({ date: 1 }) // Earliest date first
      .populate('teams', 'name logo')
      .populate('league', 'name')
      .lean();

    if (!nextGame) {
      return res.json(null); // No upcoming game
    }

    // Determine the user's team and opponent
    const userTeamId = teamIds.find(id => nextGame.teams.some(t => t._id.toString() === id.toString()));
    const userTeam = nextGame.teams.find(t => t._id.toString() === userTeamId.toString());
    const opponentTeam = nextGame.teams.find(t => t._id.toString() !== userTeamId.toString());

    // Format the response
    const gameDetails = {
      date: nextGame.date,
      time: new Date(nextGame.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      location: nextGame.location || 'N/A',
      venue: nextGame.venue || 'N/A',
      league: nextGame.league.name,
      userTeam: userTeam ? { name: userTeam.name, logo: userTeam.logo } : null,
      opponentTeam: opponentTeam ? { name: opponentTeam.name, logo: opponentTeam.logo } : null,
      matchType: nextGame.matchType,
      eventType: nextGame.eventType,
      previousMatchupScore: nextGame.previousMatchupScore || 'N/A',
      weatherConditions: nextGame.weatherConditions || 'N/A',
    };

    res.json(gameDetails);
  } catch (error) {
    console.error('Get next game error:', error);
    res.status(400).json({ error: 'Failed to fetch next game' });
  }
});

// Get a single game by ID
router.get('/:gameId', authMiddleware, async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ error: 'Invalid gameId' });
    }

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
        select: 'name jerseyNumber user',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name',
        },
      })
      .populate({
        path: 'gameMVP',
        select: 'name jerseyNumber user',
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

    const getTeamName = (teamId) =>
      game.teams.find((t) => t._id.toString() === teamId.toString())?.name || 'Unknown';

    const populatedGame = {
      // Core
      _id: game._id,
      league: game.league,
      season: game.season,
      date: game.date,
      location: game.location,
      isCompleted: game.isCompleted,
      matchType: game.matchType,
      eventType: game.eventType,
      referee: game.referee,
      weatherConditions: game.weatherConditions,
      attendance: game.attendance,
      venue: game.venue,
      venueCapacity: game.venueCapacity,
      previousMatchupScore: game.previousMatchupScore,
      fanRating: game.fanRating,
      highlights: game.highlights || [],
      matchReport: game.matchReport || '',
      mediaLinks: game.mediaLinks || [],

      // Game Settings
      periodType: game.periodType,
      periodDuration: game.periodDuration,
      overtimeDuration: game.overtimeDuration,
      scoringRules: game.scoringRules,

      // Teams
      teams: game.teams.map((team) => ({
        _id: team._id,
        name: team.name,
        logo: team.logo,
        isActive: team.isActive,
        createdBy: team.createdBy,
        members: team.members.map((member) => ({
          playerId: member.player?._id,
          name: member.player?.user?.name || 'Unknown',
          jerseyNumber: member.player?.jerseyNumber || null,
          position: member.player?.position || null,
          role: member.role,
          isActive: member.isActive,
        })),
      })),

      // Team Scores
      teamScores: game.teamScores.map((score) => ({
        teamId: score.team,
        teamName: getTeamName(score.team),
        score: score.score,
      })),

      // Player Stats
      playerStats: game.playerStats.map((stat) => ({
        playerId: stat.player?._id,
        playerName: stat.player?.user?.name || 'Unknown',
        jerseyNumber: stat.player?.jerseyNumber || null,
        teamId: stat.team,
        teamName: getTeamName(stat.team),
        stats: stat.stats,
      })),

      // Play-by-play
      playByPlay: game.playByPlay.map((entry) => ({
        player: entry.player,
        playerName: entry.playerName,
        team: entry.team,
        statType: entry.statType,
        period: entry.period,
        time: entry.time,
        timestamp: entry.timestamp,
      })),

      // MVP
      gameMVP: game.gameMVP
        ? {
            playerId: game.gameMVP._id,
            name: game.gameMVP.user?.name || 'Unknown',
            jerseyNumber: game.gameMVP.jerseyNumber || null,
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
    const { teams, date, location, venue, venueCapacity, playerStats, playByPlay, matchType, eventType, gameDuration, weatherConditions, referee, attendance, previousMatchupScore, fanRating, highlights, matchReport, mediaLinks, gameMVP, season } = req.body;

    const game = await Game.findById(gameId).populate('league');
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (!game.league) return res.status(400).json({ error: 'Game is missing league reference' });

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

    // Validate playByPlay
    if (playByPlay && Array.isArray(playByPlay)) {
      const leagueDoc = await League.findById(game.league);
      const validTeamIds = (teams || game.teams).map(id => id.toString());
      for (const play of playByPlay) {
        if (!mongoose.Types.ObjectId.isValid(play.player) || !mongoose.Types.ObjectId.isValid(play.team)) {
          return res.status(400).json({ error: 'Invalid player or team ID in playByPlay' });
        }
        if (!validTeamIds.includes(play.team.toString())) {
          return res.status(400).json({ error: 'PlayByPlay team must match one of the game teams' });
        }
        if (!leagueDoc.settings.statTypes.includes(play.statType)) {
          return res.status(400).json({ error: 'Invalid stat type in playByPlay' });
        }
        if (!play.playerName || !play.period || typeof play.time !== 'number' || play.time < 0) {
          return res.status(400).json({ error: 'PlayByPlay requires valid playerName, period, and time' });
        }
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
        if (!(teams || game.teams).map(id => id.toString()).includes(stat.team.toString())) {
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
      playByPlay: playByPlay ? [...game.playByPlay, ...playByPlay] : game.playByPlay,
      matchType: matchType || game.matchType,
      eventType: eventType || game.eventType,
      gameDuration: gameDuration !== undefined ? gameDuration : game.gameDuration,
      weatherConditions: weatherConditions !== undefined ? game.weatherConditions : game.weatherConditions,
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
      score: score.score,
      teamName: populatedGame.teams.find(t => t._id.toString() === score.team.toString())?.name || 'Unknown',
    }));
    populatedGame.playerStats = populatedGame.playerStats.map(stat => ({
      playerId: stat.player?._id.toString() || stat.playerId,
      teamId: stat.team.toString(),
      stats: stat.stats || {},
      playerName: stat.player?.user?.name || stat.playerName || 'Unknown',
      teamName: populatedGame.teams.find(t => t._id.toString() === stat.team.toString())?.name || 'Unknown',
    }));
    populatedGame.gameMVP = populatedGame.gameMVP ? { _id: populatedGame.gameMVP._id, name: populatedGame.gameMVP.user?.name || 'Unknown' } : null;

    res.json(populatedGame);
  } catch (err) {
    console.error('Update game error:', err);
    res.status(500).json({ error: err.message || 'Failed to update game' });
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
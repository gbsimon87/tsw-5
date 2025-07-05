const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  season: { type: String, required: true },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true }],
  teamScores: [{
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    score: { type: Number, default: 0 }
  }],
  date: { type: Date, required: true },
  location: { type: String },
  playerStats: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    stats: { type: mongoose.Schema.Types.Mixed, required: true }
  }],
  playByPlay: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    playerName: { type: String, required: true }, // Added playerName
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    statType: { type: String, required: true },
    period: { type: String, required: true },
    time: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  highlights: [{ type: String }],
  matchReport: { type: String },
  isCompleted: { type: Boolean, default: false },
  matchType: { type: String, enum: ['friendly', 'tournament', 'league'], default: 'league' },
  weatherConditions: { type: String },
  referee: { type: String },
  gameDuration: { type: Number, required: true },
  eventType: { type: String, enum: ['regular', 'playoff', 'final'], default: 'regular' },
  attendance: { type: Number },
  venue: { type: String },
  previousMatchupScore: { type: String },
  fanRating: { type: Number, default: 0 },
  mediaLinks: [{
    url: { type: String },
    type: { type: String }
  }],
  venueCapacity: { type: Number },
  gameMVP: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
}, { timestamps: true });

// Validate teams and playerStats
gameSchema.pre('save', async function (next) {
  try {
    // Ensure exactly two teams
    if (this.teams.length !== 2) {
      return next(new Error('A game must have exactly two teams'));
    }

    // Ensure teams belong to the league
    const league = await mongoose.model('League').findById(this.league);
    if (!league) {
      return next(new Error('Invalid league reference'));
    }
    const teamIds = league.teams.map(id => id.toString());
    if (!this.teams.every(teamId => teamIds.includes(teamId.toString()))) {
      return next(new Error('All teams must belong to the specified league'));
    }

    // Validate playerStats and playByPlay
    const validTeamIds = this.teams.map(id => id.toString());
    const validStatTypes = league.settings.statTypes;

    // Validate playByPlay entries
    for (const play of this.playByPlay) {
      if (!validTeamIds.includes(play.team.toString())) {
        return next(new Error('Play-by-play team must match one of the game teams'));
      }
      if (!validStatTypes.includes(play.statType)) {
        return next(new Error('Play-by-play contains invalid stat type'));
      }
      if (!play.period || typeof play.time !== 'number' || play.time < 0) {
        return next(new Error('Play-by-play requires valid period and time'));
      }
      if (!play.playerName) {
        return next(new Error('Play-by-play requires playerName'));
      }
    }

    // Aggregate playByPlay into playerStats
    const playerStatsMap = {};
    for (const play of this.playByPlay) {
      const playerId = play.player.toString();
      const teamId = play.team.toString();
      if (!playerStatsMap[playerId]) {
        playerStatsMap[playerId] = { player: play.player, team: play.team, stats: {} };
      }
      playerStatsMap[playerId].stats[play.statType] = (playerStatsMap[playerId].stats[play.statType] || 0) + 1;
    }

    // Merge with existing playerStats (if any)
    for (const stat of this.playerStats) {
      const playerId = stat.player.toString();
      if (!playerStatsMap[playerId]) {
        playerStatsMap[playerId] = stat;
      } else {
        playerStatsMap[playerId].stats = { ...stat.stats, ...playerStatsMap[playerId].stats };
      }
      if (!validTeamIds.includes(stat.team.toString())) {
        return next(new Error('Player stats team must match one of the game teams'));
      }
      if (!Object.keys(stat.stats).every(key => validStatTypes.includes(key))) {
        return next(new Error('Player stats contain invalid stat types'));
      }
    }

    this.playerStats = Object.values(playerStatsMap);

    // Calculate team scores
    const scoringRules = league.settings.scoringRules;
    this.teamScores = this.teams.map(teamId => {
      const teamStats = this.playerStats.filter(stat => stat.team.toString() === teamId.toString());
      const score = teamStats.reduce((total, stat) => {
        return total + Object.entries(stat.stats).reduce((sum, [key, value]) => {
          return sum + (scoringRules[key] || 0) * (value || 0);
        }, 0);
      }, 0);
      return { team: teamId, score };
    });

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Game', gameSchema);
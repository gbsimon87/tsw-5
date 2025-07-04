const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  date: { type: Date, required: true },
  location: { type: String },
  score: {
    team1: { type: Number, default: 0 },
    team2: { type: Number, default: 0 },
  },
  playerStats: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    stats: mongoose.Schema.Types.Mixed, // Dynamic stats based on league.settings.scoringRules
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
  mediaLinks: [{ url: String, type: String }],
  venueCapacity: { type: Number },
  gameMVP: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);
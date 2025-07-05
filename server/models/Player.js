const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  stats: { type: mongoose.Schema.Types.Mixed, default: {} }, // Structured by sportType
  jerseyNumber: { type: Number },
  position: { type: String },
  gamesPlayed: { type: Number, default: 0 },
  performanceRating: { type: Number, default: 0 },
  position: { type: String },
  bio: { type: String },
  dateOfBirth: { type: Date },
  nationality: { type: String },
  injuries: [{ type: String }],
  totalGamesWon: { type: Number, default: 0 },
  highestScore: { type: Number, default: 0 },
  careerAvgPoints: { type: Number, default: 0 },
  careerRebounds: { type: Number, default: 0 },
  careerSteals: { type: Number, default: 0 },
  favoriteTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  playerHistory: [{ event: String, description: String, date: Date }],
  isActive: { type: Boolean, default: true },
  playerRank: { type: Number, default: 0 },
  recentInjuries: [{ injuryDate: Date, injuryType: String, recoveryStatus: String }],
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
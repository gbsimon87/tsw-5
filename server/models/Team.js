const mongoose = require('mongoose');
const crypto = require('crypto');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  season: { type: String, required: true },
  secretKey: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(16).toString('hex') },
  logo: { type: String },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['player', 'manager'], default: 'player' },
    isActive: { type: Boolean, default: true },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

// const teamSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
//   players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
//   logo: { type: String },
//   captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
// //   teamStats: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamStats' },
//   isActive: { type: Boolean, default: true },
//   homeGround: { type: String },
//   establishedYear: { type: Number },
//   socialLinks: [{ platform: String, url: String }],
//   teamManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   totalWins: { type: Number, default: 0 }, // Total wins for the team
//   totalLosses: { type: Number, default: 0 }, // Total losses for the team
//   totalDraws: { type: Number, default: 0 }, // Total draws
//   teamRanking: { type: Number, default: 0 }, // Team's ranking within the league
//   sponsorships: [{ sponsor: String, amount: Number, startDate: Date, endDate: Date }], // Sponsorship details
//   playerOfTheMonth: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }, // Team's player of the month
//   matchHistory: [{ game: mongoose.Schema.Types.ObjectId, result: String }], // Match history (win/loss/draw)
//   injuryReports: [{ player: mongoose.Schema.Types.ObjectId, injuryDate: Date, description: String }], // Injury tracking
//   teamTrophies: [{ trophyName: String, year: Number }], // Trophies won by the team
// }, { timestamps: true });

// Index for faster queries
teamSchema.index({ league: 1, name: 1, season: 1 }, { unique: true });
// teamSchema.index({ secretKey: 1 });

module.exports = mongoose.model('Team', teamSchema);

const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  stats: { type: mongoose.Schema.Types.Mixed, default: {} }, // Structured by sportType
  jerseyNumber: { type: Number },
  position: { type: String },
  position: { type: String },
  bio: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
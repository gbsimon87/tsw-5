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
    default: () => crypto.randomBytes(16).toString('hex'),
  },
  logo: { type: String },
  members: [{
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    role: { type: String, enum: ['player', 'manager'], default: 'player' },
    isActive: { type: Boolean, default: true },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
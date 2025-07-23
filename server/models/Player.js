const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for ringers
  isRinger: { type: Boolean, default: false },
  name: { type: String, required: function () { return this.isRinger; } }, // Required for ringers
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  stats: { type: mongoose.Schema.Types.Mixed, default: {} }, // Structured by sportType
  jerseyNumber: { type: Number },
  position: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Validation to ensure data integrity
playerSchema.pre('save', async function (next) {
  if (this.isRinger && !this.name) {
    return next(new Error('Ringer players must have a name'));
  }
  if (!this.isRinger && !this.user) {
    return next(new Error('Non-ringer players must have a user reference'));
  }
  next();
});

// Prevent duplicate ringers per team
playerSchema.index(
  { name: 1, isRinger: 1, teams: 1 },
  { unique: true, partialFilterExpression: { isRinger: true } }
);

module.exports = mongoose.model('Player', playerSchema);
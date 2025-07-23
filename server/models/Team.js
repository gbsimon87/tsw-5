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
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

teamSchema.pre('save', async function (next) {
  try {
    const players = await mongoose.model('Player').find({
      _id: { $in: this.members.map(m => m.player) },
    });
    for (const member of this.members) {
      const player = players.find(p => p._id.toString() === member.player.toString());
      if (!player) {
        return next(new Error('Invalid player reference in team members'));
      }
      if (!player.isRinger && !player.user) {
        return next(new Error('Non-ringer players must have a user reference'));
      }
      if (player.isRinger && !player.teams.includes(this._id)) {
        return next(new Error('Ringer player must be associated with this team'));
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Team', teamSchema);
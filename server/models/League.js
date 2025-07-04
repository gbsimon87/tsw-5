const mongoose = require('mongoose');

const scoringRulesMap = {
  basketball: { twoPointFGM: 2, threePointFGM: 3, freeThrowM: 1 },
  hockey: { goal: 1 },
  soccer: { goal: 1 },
  baseball: { single: 1, double: 2, triple: 3, homeRun: 4 },
  football: { touchdown: 6, fieldGoal: 3, extraPoint: 1, twoPointConversion: 2, safety: 2 }
};

const leagueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sportType: {
    type: String,
    required: true,
    enum: ['basketball', 'soccer', 'baseball', 'hockey', 'football'],
    default: 'basketball',
  },
  season: { type: String, default: '' }, // Current active season
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  logo: { type: String },
  establishedYear: { type: Number },
  isActive: { type: Boolean, default: true },
  location: { type: String },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  seasons: [{
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
  }],
  settings: {
    periodType: {
      type: String,
      enum: ['halves', 'quarters', 'periods'],
      default: function () {
        if (this.sportType === 'basketball') return 'halves';
        if (this.sportType === 'hockey') return 'periods';
        return 'halves';
      },
      required: true,
    },
    periodDuration: {
      type: Number,
      default: function () {
        if (this.sportType === 'basketball') return 24;
        if (this.sportType === 'hockey') return 20;
        return 45;
      },
      required: true,
    },
    overtimeDuration: {
      type: Number,
      default: function () {
        if (this.sportType === 'soccer') return 15;
        return 5;
      },
      required: true,
    },
    scoringRules: {
      type: Object,
      default: function () {
        return scoringRulesMap[this.sportType] || {};
      },
    },
    statTypes: {
      type: [String],
      default: function () {
        return this.sportType === 'basketball'
          ? [
              'twoPointFGM', 'twoPointFGA', 'threePointFGM', 'threePointFGA',
              'freeThrowM', 'freeThrowA', 'offensiveRebound', 'defensiveRebound',
              'assist', 'steal', 'turnover', 'block', 'personalFoul',
              'teamFoul', 'technicalFoul', 'flagrantFoul',
            ]
          : [];
      },
    },
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
  timestamps: true,
});

// Add validation to ensure only one active season
leagueSchema.pre('save', async function (next) {
  if (this.isModified('seasons')) {
    const activeSeasons = this.seasons.filter(s => s.isActive);
    if (activeSeasons.length > 1) {
      return next(new Error('Only one season can be active at a time'));
    }
    this.season = activeSeasons.length === 1 ? activeSeasons[0].name : '';
  }
  next();
});

leagueSchema.index({ admins: 1 });
leagueSchema.index({ managers: 1 });
leagueSchema.index({ visibility: 1 });

module.exports = mongoose.model('League', leagueSchema);
const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sportType: {
    type: String,
    required: true,
    enum: ['basketball', 'football', 'baseball', 'hockey', 'americanFootball'],
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
        if (this.sportType === 'football') return 15;
        return 5;
      },
      required: true,
    },
    foulOutLimit: {
      type: Number,
      default: function () {
        if (this.sportType === 'basketball') return 6;
        return undefined;
      },
      validate: {
        validator: function (value) {
          if (this.sportType === 'basketball') {
            return Number.isInteger(value) && value > 0;
          }
          return value === undefined;
        },
        message: 'foulOutLimit must be a positive integer for basketball leagues or undefined for other sports',
      },
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
        switch (this.sportType) {
          case 'basketball':
            return [
              'twoPointFGM', 'twoPointFGA', 'threePointFGM', 'threePointFGA',
              'freeThrowM', 'freeThrowA', 'offensiveRebound', 'defensiveRebound',
              'assist', 'steal', 'turnover', 'block', 'blockedShotAttempt', 'personalFoul',
              'teamFoul', 'technicalFoul', 'flagrantFoul', 'drawnFoul'
            ];
          case 'americanFootball':
            return [
              'passingYards', 'passingTDs', 'interceptionsThrown',
              'rushingYards', 'rushingTDs', 'fumblesLost',
              'receptions', 'receivingYards', 'receivingTDs',
              'tackles', 'sacks', 'interceptionsCaught',
              'fieldGoalsMade', 'fieldGoalsMissed', 'extraPointsMade',
              'punts', 'puntYards', 'kickReturns', 'kickReturnYards',
              'penalty', 'ejections'
            ];
          case 'football':
            return [
              'goals', 'assists', 'shotsOnTarget', 'shotsOffTarget',
              'passesCompleted', 'passesAttempted', 'tackles',
              'interceptions', 'foulsCommitted', 'yellowCards',
              'redCards', 'saves', 'offsides', 'corners', 'clearances',
              'ejections', 'penalty'
            ];
          case 'hockey':
            return [
              'goals', 'assists', 'shots', 'hits', 'blockedShots',
              'faceoffsWon', 'faceoffsLost', 'penaltyMinutes',
              'plusMinus', 'takeaways', 'giveaways', 'powerPlayGoals',
              'shortHandedGoals', 'gameWinningGoals', 'saves',
              'goalsAgainst', 'savePercentage', 'penalty', 'ejections',
              'penaltyShots'
            ];
          case 'baseball':
            return [
              'atBats', 'hits', 'runs', 'RBIs', 'homeRuns',
              'doubles', 'triples', 'walks', 'strikeouts',
              'stolenBases', 'caughtStealing', 'inningsPitched',
              'earnedRuns', 'pitchesThrown', 'strikesThrown',
              'battersFaced', 'fieldingErrors', 'ejections'
            ];
          default:
            return [];
        }
      }
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
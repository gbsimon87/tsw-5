const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
    name: { type: String, required: true },
    picture: { type: String }, // URL for league logo
    location: { type: String }, // Optional location
    sportType: {
        type: String,
        required: true,
        enum: ['basketball', 'soccer', 'baseball', 'hockey', 'football'] // Add more as needed
    },
    scoringRules: {
        type: Map,
        of: Number,
        default: {} // Sport-specific defaults set on creation
    },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    seasons: [{
        name: String,
        startDate: Date,
        endDate: Date
    }],
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public' // Default to private for security
    }
}, {
    timestamps: true
});

// Indexes for faster queries
leagueSchema.index({ admins: 1 });
leagueSchema.index({ managers: 1 });
leagueSchema.index({ visibility: 1 });

module.exports = mongoose.model('League', leagueSchema);
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true }, // Sparse for non-Google users
  email: { type: String, required: true, unique: true },
  name: { type: String }, // Optional for email/password users
  password: { type: String }, // For email/password users
  givenName: { type: String },
  familyName: { type: String },
  picture: { type: String },
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  refreshToken: { type: String }
});

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  givenName: { type: String }, // First name
  familyName: { type: String }, // Last name
  picture: { type: String }, // Profile picture URL
  locale: { type: String }, // Language preference
  emailVerified: { type: Boolean }, // Email verification status
},
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
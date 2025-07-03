const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const League = require('./models/League');
require('dotenv').config({ path: '.env' });

const app = express();
app.use(express.json());

// Serve static files from the Vite build output
app.use(express.static(path.join(__dirname, '../client/dist')));

// Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware to verify JWT
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Verify Google ID token
app.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, given_name, family_name, picture, locale, email_verified } = payload;

    // Find or create user
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({
        googleId,
        email,
        name,
        givenName: given_name,
        familyName: family_name,
        picture,
        locale,
        emailVerified: email_verified
      });
      await user.save();
    } else {
      // Update existing user with new data
      user.email = email;
      user.name = name;
      user.givenName = given_name;
      user.familyName = family_name;
      user.picture = picture;
      user.locale = locale;
      user.emailVerified = email_verified;
      await user.save();
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return full user data
    res.json({
      token: jwtToken,
      user: {
        email: user.email,
        name: user.name,
        givenName: user.givenName,
        familyName: user.familyName,
        picture: user.picture,
        locale: user.locale,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// Get current user (protected route)
app.get('/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      email: user.email,
      name: user.name,
      givenName: user.givenName,
      familyName: user.familyName,
      picture: user.picture,
      locale: user.locale,
      emailVerified: user.emailVerified
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Helper function for default scoring rules
function getDefaultScoringRules(sportType) {
  switch (sportType) {
    case 'basketball':
      return { freeThrow: 1, twoPoint: 2, threePoint: 3 };
    case 'soccer':
      return { goal: 1, assist: 1 };
    case 'baseball':
      return { single: 1, double: 2, triple: 3, homeRun: 4 };
    case 'hockey':
      return { goal: 1, assist: 1 };
    case 'football':
      return { touchdown: 6, fieldGoal: 3 };
    default:
      return {};
  }
}

// Create a new league
app.post('/api/leagues', authMiddleware, async (req, res) => {
  console.log('Body:', req.body); // Debug: Log form data
  try {
    const { name, picture, location, sportType } = req.body; // Fix: Use req.body
    if (!name || !sportType) {
      return res.status(400).json({ error: 'Name and sportType are required' });
    }

    const scoringRules = getDefaultScoringRules(sportType);

    const league = new League({
      name,
      picture,
      location,
      sportType,
      scoringRules,
      admins: [req.user._id], // Creator is admin
      managers: []
    });

    await league.save();
    res.status(201).json(league);
  } catch (error) {
    console.error('Create league error:', error);
    res.status(400).json({ error: 'Failed to create league' });
  }
});

// Get user's leagues (admin or manager)
app.get('/api/leagues', authMiddleware, async (req, res) => {
  try {
    const leagues = await League.find({
      $or: [
        { admins: req.user._id },
        { managers: req.user._id }
      ]
    });
    res.json(leagues);
  } catch (error) {
    console.error('Get leagues error:', error);
    res.status(500).json({ error: 'Failed to fetch leagues' });
  }
});

// API route (for testing)
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the MERN backend!' });
});

// Handle all other routes for React client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
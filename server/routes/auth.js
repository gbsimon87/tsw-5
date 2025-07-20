const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
require('dotenv').config({ path: '.env' });

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register user with email and password
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (name.trim().length === 0) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      name,
      password: hashedPassword,
      emailVerified: false
    });
    await user.save();

    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      token: jwtToken,
      user: {
        email: user.email,
        name: user.name,
        givenName: user.givenName,
        familyName: user.familyName,
        picture: user.picture,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: 'Failed to register' });
  }
});

// Login with email and password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token: jwtToken,
      user: {
        email: user.email,
        name: user.name,
        givenName: user.givenName,
        familyName: user.familyName,
        picture: user.picture,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: 'Failed to login' });
  }
});

// Verify Google ID token
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, given_name, family_name, picture, email_verified } = payload;

    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({
        googleId,
        email,
        name,
        givenName: given_name,
        familyName: family_name,
        picture,
        emailVerified: email_verified
      });
      await user.save();
    } else {
      user.email = email;
      user.name = name;
      user.givenName = given_name;
      user.familyName = family_name;
      user.picture = picture;
      user.emailVerified = email_verified;
      await user.save();
    }

    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token: jwtToken,
      user: {
        email: user.email,
        name: user.name,
        givenName: user.givenName,
        familyName: user.familyName,
        picture: user.picture,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// Get current user (protected route)
router.get('/me', async (req, res) => {
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
      emailVerified: user.emailVerified
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
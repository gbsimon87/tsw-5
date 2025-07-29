const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { registerLimiter, loginLimiter, googleAuthLimiter, meLimiter, logger } = require('../middleware');

require('dotenv').config({ path: '.env' });

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Validation Middleware
const validateRegister = [
  check('email').isEmail().normalizeEmail().withMessage({ error: 'Invalid email format', code: 'validation_error' }),
  check('name').trim().isLength({ min: 3, max: 50 }).withMessage({ error: 'Name must be 3-50 characters', code: 'validation_error' }),
  check('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage({ error: 'Password must be at least 8 characters with uppercase, lowercase, and number', code: 'validation_error' })
];

const validateLogin = [
  check('email').isEmail().normalizeEmail().withMessage({ error: 'Invalid email format', code: 'validation_error' }),
  check('password').notEmpty().withMessage({ error: 'Password is required', code: 'validation_error' })
];

const validateGoogleAuth = [
  check('token').notEmpty().withMessage({ error: 'Google token is required', code: 'validation_error' })
];

const validateRefresh = [
  check('refreshToken').notEmpty().withMessage({ error: 'Refresh token is required', code: 'validation_error' })
];

// In-memory failed attempts store for login lockout
const failedAttempts = new Map();

// Generate Refresh Token
const generateRefreshToken = () => crypto.randomBytes(32).toString('hex');

// Register user with email and password
router.post('/register', registerLimiter, validateRegister, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0].msg;
      logger.warn('Registration validation failed', { ip: req.ip, errors: errors.array() });
      return res.status(400).json(error);
    }

    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Registration attempt with existing email', { ip: req.ip, email });
      return res.status(400).json({ error: 'Email already in use', code: 'email_exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const refreshToken = generateRefreshToken();
    const user = new User({
      email,
      name,
      password: hashedPassword,
      emailVerified: false,
      refreshToken
    });
    await user.save();

    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    logger.info('User registered successfully', { ip: req.ip, userId: user._id });
    res.status(201).json({
      token: jwtToken,
      refreshToken,
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
    logger.error('Register error', { ip: req.ip, error: error.message });
    res.status(500).json({ error: 'Failed to register', code: 'server_error' });
  }
});

// Login with email and password
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0].msg;
      logger.warn('Login validation failed', { ip: req.ip, errors: errors.array() });
      return res.status(400).json(error);
    }

    const { email, password } = req.body;

    // Check lockout
    const key = `${req.ip}:${email}`;
    const attempts = failedAttempts.get(key) || { count: 0, lockedUntil: 0 };
    if (attempts.lockedUntil > Date.now()) {
      logger.warn('Login lockout', { ip: req.ip, email });
      return res.status(429).json({ error: 'Account temporarily locked, try again later', code: 'locked_out' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      attempts.count += 1;
      if (attempts.count >= 5) {
        attempts.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
      }
      failedAttempts.set(key, attempts);
      logger.warn('Invalid login attempt', { ip: req.ip, email, attempt: attempts.count });
      return res.status(401).json({ error: 'Invalid email or password', code: 'invalid_credentials' });
    }

    // Reset attempts and generate refresh token
    failedAttempts.delete(key);
    const refreshToken = generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();

    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    logger.info('User logged in successfully', { ip: req.ip, userId: user._id });
    res.json({
      token: jwtToken,
      refreshToken,
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
    logger.error('Login error', { ip: req.ip, error: error.message });
    res.status(500).json({ error: 'Failed to login', code: 'server_error' });
  }
});

// Verify Google ID token
router.post('/google', googleAuthLimiter, validateGoogleAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0].msg;
      logger.warn('Google auth validation failed', { ip: req.ip, errors: errors.array() });
      return res.status(400).json(error);
    }

    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, given_name, family_name, picture, email_verified } = payload;

    let user = await User.findOne({ googleId });
    const refreshToken = generateRefreshToken();
    if (!user) {
      user = new User({
        googleId,
        email,
        name,
        givenName: given_name,
        familyName: family_name,
        picture,
        emailVerified: email_verified,
        refreshToken
      });
    } else {
      user.email = email;
      user.name = name;
      user.givenName = given_name;
      user.familyName = family_name;
      user.picture = picture;
      user.emailVerified = email_verified;
      user.refreshToken = refreshToken;
    }
    await user.save();

    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    logger.info('Google auth successful', { ip: req.ip, userId: user._id });
    res.json({
      token: jwtToken,
      refreshToken,
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
    logger.error('Google auth error', { ip: req.ip, error: error.message });
    res.status(401).json({ error: 'Invalid Google token', code: 'invalid_token' });
  }
});

// Refresh access token
router.post('/refresh', validateRefresh, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0].msg;
      logger.warn('Refresh token validation failed', { ip: req.ip, errors: errors.array() });
      return res.status(400).json(error);
    }

    const { refreshToken } = req.body;
    const user = await User.findOne({ refreshToken });
    if (!user) {
      logger.warn('Invalid refresh token', { ip: req.ip });
      return res.status(401).json({ error: 'Invalid refresh token', code: 'invalid_refresh_token' });
    }

    // Generate new access token and rotate refresh token
    const newRefreshToken = generateRefreshToken();
    user.refreshToken = newRefreshToken;
    await user.save();

    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    logger.info('Token refreshed successfully', { ip: req.ip, userId: user._id });
    res.json({
      token: jwtToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    logger.error('Refresh token error', { ip: req.ip, error: error.message });
    res.status(500).json({ error: 'Failed to refresh token', code: 'server_error' });
  }
});

// Get current user (protected route)
router.get('/me', meLimiter, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      logger.warn('No token provided for /me', { ip: req.ip });
      return res.status(401).json({ error: 'No token provided', code: 'no_token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Set req.user for rate limiter
    const user = await User.findById(decoded.userId).select('email name givenName familyName picture emailVerified');
    if (!user) {
      logger.warn('User not found for /me', { ip: req.ip, userId: decoded.userId });
      return res.status(404).json({ error: 'User not found', code: 'user_not_found' });
    }

    logger.info('User data fetched successfully', { ip: req.ip, userId: user._id });
    res.json({
      email: user.email,
      name: user.name,
      givenName: user.givenName,
      familyName: user.familyName,
      picture: user.picture,
      emailVerified: user.emailVerified
    });
  } catch (error) {
    logger.error('Auth me error', { ip: req.ip, error: error.message });
    res.status(401).json({ error: 'Invalid token', code: 'invalid_token' });
  }
});

module.exports = router;
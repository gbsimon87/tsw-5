const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const League = require('./models/League');
const Team = require('./models/Team');
require('dotenv').config({ path: '.env' });

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Authentication routes
// Register user with email and password
app.post('/auth/register', async (req, res) => {
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
        locale: user.locale,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: 'Failed to register' });
  }
});

// Login with email and password
app.post('/auth/login', async (req, res) => {
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
        locale: user.locale,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: 'Failed to login' });
  }
});

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
      user.email = email;
      user.name = name;
      user.givenName = given_name;
      user.familyName = family_name;
      user.picture = picture;
      user.locale = locale;
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

// League routes
// Create a new league without default season
app.post('/api/leagues', authMiddleware, async (req, res) => {
  try {
    const { name, logo, location, sportType, visibility } = req.body;
    if (!name || !sportType) {
      return res.status(400).json({ error: 'Name and sportType are required' });
    }

    const league = new League({
      name,
      logo,
      location,
      sportType,
      visibility,
      admins: [req.user._id],
      managers: [],
      teams: [],
      seasons: [],
      season: '',
    });

    await league.save();
    res.status(201).json(league);
  } catch (error) {
    console.error('Create league error:', error);
    res.status(400).json({ error: 'Failed to create league' });
  }
});

// Add updated PATCH /api/leagues/:leagueId/end-season
app.patch('/api/leagues/:leagueId/end-season', authMiddleware, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    if (!league.admins.some(admin => admin._id.equals(req.user._id))) {
      return res.status(403).json({ error: 'You are not authorized to end seasons' });
    }

    const activeSeason = league.seasons.find(s => s.isActive);
    if (!activeSeason) {
      return res.status(400).json({ error: 'No active season to end' });
    }

    activeSeason.isActive = false;
    await league.save(); // Triggers pre('save') to clear league.season
    res.json(league);
  } catch (error) {
    console.error('End season error:', error);
    res.status(400).json({ error: 'Failed to end season' });
  }
});

app.post('/api/leagues/:leagueId/seasons', authMiddleware, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { name, startDate, endDate } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Season name, start date, and end date are required' });
    }

    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    if (!league.admins.some(admin => admin._id.equals(req.user._id))) {
      return res.status(403).json({ error: 'You are not authorized to create seasons' });
    }

    if (league.seasons.some(s => s.name === name)) {
      return res.status(400).json({ error: 'Season name already exists' });
    }

    league.seasons.forEach(s => (s.isActive = false));
    league.seasons.push({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: true,
    });
    league.season = name;
    await league.save();
    res.json(league);
  } catch (error) {
    console.error('Create season error:', error);
    res.status(400).json({ error: 'Failed to create season' });
  }
});

app.post('/api/leagues/:leagueId/teams/carry-over', authMiddleware, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { teamIds, newSeason } = req.body;
    if (!teamIds || !Array.isArray(teamIds) || !newSeason) {
      return res.status(400).json({ error: 'Team IDs and new season are required' });
    }

    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    if (!league.admins.some(admin => admin._id.equals(req.user._id))) {
      return res.status(403).json({ error: 'You are not authorized to carry over teams' });
    }

    if (!league.seasons.some(s => s.name === newSeason && s.isActive)) {
      return res.status(400).json({ error: 'New season is not active' });
    }

    const teams = await Team.find({ _id: { $in: teamIds }, league: leagueId });
    const newTeams = [];
    for (const team of teams) {
      const newTeam = new Team({
        name: team.name,
        league: leagueId,
        season: newSeason,
        logo: team.logo,
        members: team.members,
        createdBy: team.createdBy,
        isActive: true,
      });
      await newTeam.save();
      league.teams.push(newTeam._id);
      newTeams.push(newTeam);
    }

    await league.save();
    res.json(newTeams);
  } catch (error) {
    console.error('Carry over teams error:', error);
    res.status(400).json({ error: 'Failed to carry over teams' });
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

app.get('/api/leagues/:leagueId', authMiddleware, async (req, res) => {
  try {
    const league = await League.findById(req.params.leagueId)
      .populate('admins', 'name')
      .populate('managers', 'name')
      .populate({
        path: 'teams',
        populate: { path: 'members.user', select: 'name picture' },
      });
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    if (!league.admins.some(admin => admin._id.equals(req.user._id))) {
      return res.status(403).json({ error: 'You are not authorized to view this league' });
    }
    res.set('Cache-Control', 'no-cache'); // Prevent caching
    res.json(league);
  } catch (error) {
    console.error('Get league error:', error);
    res.status(500).json({ error: 'Failed to fetch league' });
  }
});

app.patch('/api/leagues/:leagueId', authMiddleware, async (req, res) => {
  try {
    const league = await League.findById(req.params.leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    if (!league.admins.some(admin => admin._id.equals(req.user._id))) {
      return res.status(403).json({ error: 'You are not authorized to edit this league' });
    }

    const { name, sportType, visibility, logo, location, establishedYear, isActive, settings } = req.body;
    if (!name || !sportType) {
      return res.status(400).json({ error: 'Name and sportType are required' });
    }

    league.name = name;
    if (league.sportType !== sportType) {
      league.sportType = sportType;
      const scoringRulesMap = {
        basketball: { twoPointFGM: 2, threePointFGM: 3, freeThrowM: 1 },
        hockey: { goal: 1 },
        soccer: { goal: 1 },
        baseball: { single: 1, double: 2, triple: 3, homeRun: 4 },
        football: { touchdown: 6, fieldGoal: 3, extraPoint: 1, twoPointConversion: 2, safety: 2 },
      };
      league.settings = {
        periodType: sportType === 'basketball' ? 'halves' : sportType === 'hockey' ? 'periods' : 'halves',
        periodDuration: sportType === 'basketball' ? 24 : sportType === 'hockey' ? 20 : 45,
        overtimeDuration: sportType === 'soccer' ? 15 : 5,
        scoringRules: scoringRulesMap[sportType] || {},
        statTypes: sportType === 'basketball'
          ? [
            'twoPointFGM', 'twoPointFGA', 'threePointFGM', 'threePointFGA',
            'freeThrowM', 'freeThrowA', 'offensiveRebound', 'defensiveRebound',
            'assist', 'steal', 'turnover', 'block', 'personalFoul',
            'teamFoul', 'technicalFoul', 'flagrantFoul',
          ]
          : [],
      };
    }
    league.visibility = visibility;
    league.logo = logo || undefined;
    league.location = location || undefined;
    league.establishedYear = establishedYear || undefined;
    league.isActive = isActive !== undefined ? isActive : league.isActive;

    if (settings) {
      if (settings.periodType) league.settings.periodType = settings.periodType;
      if (settings.periodDuration) league.settings.periodDuration = settings.periodDuration;
      if (settings.overtimeDuration) league.settings.overtimeDuration = settings.overtimeDuration;
      if (settings.scoringRules) league.settings.scoringRules = settings.scoringRules;
    }

    await league.save();
    res.json(league);
  } catch (error) {
    console.error('Update league error:', error);
    res.status(400).json({ error: 'Failed to update league' });
  }
});

// Team routes
// Create a new team
app.post('/api/teams', authMiddleware, async (req, res) => {
  try {
    const { name, logo, leagueId, season } = req.body;
    if (!name || !leagueId || !season) {
      return res.status(400).json({ error: 'Name, leagueId, and season are required' });
    }

    const league = await League.findById(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    if (!league.admins.some(admin => admin._id.equals(req.user._id))) {
      return res.status(403).json({ error: 'You are not authorized to create teams' });
    }
    if (!league.seasons.some(s => s.name === season)) {
      return res.status(400).json({ error: 'Season does not exist in league' });
    }

    const team = new Team({
      name,
      logo,
      league: leagueId,
      season,
      createdBy: req.user._id,
    });

    await team.save();
    league.teams.push(team._id);
    await league.save();
    res.status(201).json(team);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(400).json({ error: 'Failed to create team' });
  }
});

app.post('/api/teams/join', authMiddleware, async (req, res) => {
  try {
    const { secretKey } = req.body;
    if (!secretKey) {
      return res.status(400).json({ error: 'Secret key is required' });
    }

    const team = await Team.findOne({ secretKey }).populate('league');
    if (!team) {
      return res.status(404).json({ error: 'Team not found or invalid secret key' });
    }

    if (team.members.some(member => member.user.equals(req.user._id))) {
      return res.status(400).json({ error: 'You are already a member of this team' });
    }

    team.members.push({
      user: req.user._id,
      role: 'player',
      isActive: true,
    });
    await team.save();

    res.json(team);
  } catch (error) {
    console.error('Join team error:', error);
    res.status(400).json({ error: 'Failed to join team' });
  }
});

app.get('/api/teams', authMiddleware, async (req, res) => {
  try {
    const { leagueId, season } = req.query;
    if (!leagueId) {
      return res.status(400).json({ error: 'leagueId is required' });
    }

    const query = { league: leagueId };
    if (season) {
      query.season = season;
    } else {
      return res.json([]);
    }

    const teams = await Team.find(query)
      .populate('members.user', 'name picture')
      .populate('createdBy', 'name');
    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(400).json({ error: 'Failed to fetch teams' });
  }
});

app.patch('/api/teams/:teamId', authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { isActive } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const league = await League.findById(team.league);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    if (!league.admins.some(admin => admin._id.equals(req.user._id))) {
      return res.status(403).json({ error: 'You are not authorized to modify this team' });
    }

    if (isActive !== undefined) {
      team.isActive = isActive;
    }

    await team.save();
    res.json(team);
  } catch (error) {
    console.error('Update team error:', error);
    res.status(400).json({ error: 'Failed to update team' });
  }
});

app.patch('/api/teams/:teamId/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const { isActive, role } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const league = await League.findById(team.league);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }
    if (!league.admins.some(admin => admin._id.equals(req.user._id))) {
      return res.status(403).json({ error: 'You are not authorized to modify team members' });
    }

    const member = team.members.find(m => m?.user?.equals(memberId));
    if (!member) {
      return res.status(404).json({ error: 'Member not found in team' });
    }

    if (isActive !== undefined) {
      member.isActive = isActive;
    }
    if (role) {
      if (!['player', 'manager'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      member.role = role;
    }

    await team.save();
    res.json(team);
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(400).json({ error: 'Failed to update team member' });
  }
});

// Join a team
app.post('/api/teams/join', authMiddleware, async (req, res) => {
  try {
    const { secretKey } = req.body;
    if (!secretKey) {
      return res.status(400).json({ error: 'Secret key is required' });
    }

    const team = await Team.findOne({ secretKey }).populate('league');
    if (!team) {
      return res.status(404).json({ error: 'Team not found or invalid secret key' });
    }

    if (team.members.includes(req.user._id)) {
      return res.status(400).json({ error: 'You are already a member of this team' });
    }

    team.members.push(req.user._id);
    await team.save();

    res.json(team);
  } catch (error) {
    console.error('Join team error:', error);
    res.status(400).json({ error: 'Failed to join team' });
  }
});

// Root route
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the MERN backend!' });
});

// All routes
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
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const League = require('./models/League');
const Team = require('./models/Team');
const Player = require('./models/Player');
const Game = require('./models/Game');
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

// PLAYER ROUTES
// Middleware to check if user is admin or manager
const checkAdminOrManager = async (req, res, next) => {
  try {
    let leagueId = req.body.leagueId || req.query.leagueId;
    console.log('checkAdminOrManager: leagueId from body/query:', leagueId);

    // If no leagueId is provided, try to get it from the team
    if (!leagueId && req.params.teamId) {
      const team = await Team.findById(req.params.teamId);
      if (!team) {
        console.error('checkAdminOrManager: Team not found for teamId:', req.params.teamId);
        return res.status(404).json({ error: 'Team not found' });
      }
      leagueId = team.league;
      console.log('checkAdminOrManager: leagueId from team.league:', leagueId);
    }

    if (!leagueId) {
      console.error('checkAdminOrManager: No leagueId provided');
      return res.status(400).json({ error: 'League ID is required' });
    }

    const league = await League.findById(leagueId);
    if (!league) {
      console.error('checkAdminOrManager: League not found for leagueId:', leagueId);
      return res.status(404).json({ error: 'League not found' });
    }

    const isAdmin = league.admins.some(admin => admin._id.toString() === req.user._id.toString());
    const isManager = league.managers.some(manager => manager._id.toString() === req.user._id.toString());
    if (!isAdmin && !isManager) {
      console.error('checkAdminOrManager: User not authorized:', req.user._id);
      return res.status(403).json({ error: 'Unauthorized: Admin or manager access required' });
    }

    next();
  } catch (err) {
    console.error('Admin/Manager check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Initialize player stats based on league scoring rules
const initializeStats = async (leagueId) => {
  const league = await League.findById(leagueId);
  if (!league || !league.settings.scoringRules) return {};
  return Object.keys(league.settings.scoringRules).reduce((stats, key) => {
    stats[key] = 0;
    return stats;
  }, {});
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
// Create a league (admin only, simplified for context)
app.post('/api/leagues/', authMiddleware, async (req, res) => {
  try {
    const { name, sportType, location, visibility, establishedYear } = req.body;
    const league = await League.create({
      name,
      sportType,
      location,
      visibility,
      establishedYear,
      admins: [req.user._id],
      isActive: true,
      seasons: [{ name: 'Season 1', startDate: new Date(), endDate: new Date(), isActive: true }],
    });
    res.status(201).json(league);
  } catch (err) {
    console.error('Create league error:', err);
    res.status(500).json({ error: 'Failed to create league' });
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

// Get a single league by ID
app.get('/api/leagues/:leagueId', authMiddleware, async (req, res) => {
  try {
    const league = await League.findById(req.params.leagueId)
      .populate({
        path: 'teams',
        populate: {
          path: 'members.player',
          model: 'Player',
          populate: {
            path: 'user',
            model: 'User',
            select: 'name'
          }
        }
      })
      .populate('admins', 'name')
      .populate('managers', 'name')
      .lean();

    if (!league) return res.status(404).json({ error: 'League not found' });

    // Ensure teams and members are arrays
    league.teams = Array.isArray(league.teams) ? league.teams : [];
    league.teams.forEach(team => {
      team.members = Array.isArray(team.members) ? team.members : [];
      team.members.forEach(member => {
        member.player = member.player || { user: { name: 'Unknown' } };
      });
    });

    res.json(league);
  } catch (err) {
    console.error('Get league error:', err);
    res.status(500).json({ error: 'Failed to fetch league' });
  }
});

// Update a league (admin only, simplified)
app.patch('/api/leagues/:leagueId', authMiddleware, async (req, res) => {
  try {
    const league = await League.findById(req.params.leagueId);
    if (!league) return res.status(404).json({ error: 'League not found' });

    const isAdmin = league.admins.some(admin => admin._id.toString() === req.user._id.toString());
    if (!isAdmin) return res.status(403).json({ error: 'Unauthorized: Admin access required' });

    Object.assign(league, req.body);
    await league.save();
    res.json(league);
  } catch (err) {
    console.error('Update league error:', err);
    res.status(500).json({ error: 'Failed to update league' });
  }
});

// Delete a league (admin only, simplified)
app.delete('/api/leagues/:leagueId', authMiddleware, async (req, res) => {
  try {
    const league = await League.findById(req.params.leagueId);
    if (!league) return res.status(404).json({ error: 'League not found' });

    const isAdmin = league.admins.some(admin => admin._id.toString() === req.user._id.toString());
    if (!isAdmin) return res.status(403).json({ error: 'Unauthorized: Admin access required' });

    await league.deleteOne();
    res.json({ message: 'League deleted' });
  } catch (err) {
    console.error('Delete league error:', err);
    res.status(500).json({ error: 'Failed to delete league' });
  }
});

// Get teams by leagueId and season
app.get('/api/teams/', authMiddleware, async (req, res) => {
  try {
    const { leagueId, season } = req.query;
    if (!leagueId || !season) {
      return res.status(400).json({ error: 'leagueId and season are required' });
    }

    const teams = await Team.find({ league: leagueId, season })
      .populate({
        path: 'members.player',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name'
        }
      });

    // Log the raw teams data for debugging
    console.log('Fetched teams:', JSON.stringify(teams, null, 2));

    // Ensure members is an array and player.user is populated
    const formattedTeams = teams.map(team => ({
      ...team.toObject(),
      members: Array.isArray(team.members) ? team.members.map(member => ({
        ...member.toObject(),
        player: member.player ? {
          ...member.player.toObject(),
          user: member.player.user ? { name: member.player.user.name || 'Unknown' } : { name: 'Unknown' }
        } : { user: { name: 'Unknown' } }
      })) : []
    }));

    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-store');
    res.json(formattedTeams);
  } catch (err) {
    console.error('Get teams error:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.get('/api/teams/my-teams', authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find({
      'members.player': req.user._id
    })
      .populate('league', 'name sportType location')
      .populate('members.player', 'name');
    res.json(teams);
  } catch (error) {
    console.error('Get my teams error:', error);
    res.status(400).json({ error: 'Failed to fetch user teams' });
  }
});

// Create a team (admin/manager only)
app.post('/api/teams/', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { name, leagueId, season, logo } = req.body;
    if (!name || !leagueId || !season) {
      return res.status(400).json({ error: 'name, leagueId, and season are required' });
    }

    const team = await Team.create({
      name,
      league: leagueId,
      season,
      logo,
      createdBy: req.user._id,
      isActive: true,
      members: []
    });

    await League.findByIdAndUpdate(leagueId, { $push: { teams: team._id } });

    res.status(201).json(team);
  } catch (err) {
    console.error('Create team error:', err);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Get teams by leagueId and season
app.get('/teams', authMiddleware, async (req, res) => {
  try {
    const { leagueId, season } = req.query;
    if (!leagueId || !season) {
      return res.status(400).json({ error: 'leagueId and season are required' });
    }

    const teams = await Team.find({ league: leagueId, season })
      .populate({
        path: 'members.player',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name'
        }
      });

    // Log the raw teams data for debugging
    console.log('Fetched teams:', JSON.stringify(teams, null, 2));

    // Ensure members is an array and player.user is populated
    const formattedTeams = teams.map(team => ({
      ...team.toObject(),
      members: Array.isArray(team.members) ? team.members.map(member => ({
        ...member.toObject(),
        player: member.player ? {
          ...member.player.toObject(),
          user: member.player.user ? { name: member.player.user.name || 'Unknown' } : { name: 'Unknown' }
        } : { user: { name: 'Unknown' } }
      })) : []
    }));

    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-store');
    res.json(formattedTeams);
  } catch (err) {
    console.error('Get teams error:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Update a team (admin/manager only)
app.patch('/api/teams/:teamId', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { isActive } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (isActive !== undefined) team.isActive = isActive;
    await team.save();

    res.json(team);
  } catch (err) {
    console.error('Update team error:', err);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Update a team member (admin/manager only)
app.patch('/api/teams/:teamId/members/:memberId', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const { isActive, role } = req.body;

    const team = await Team.findById(teamId).populate({
      path: 'members.player',
      populate: {
        path: 'user',
        model: 'User',
        select: 'name'
      }
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const member = team.members.find(m => m.player._id.toString() === memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (isActive !== undefined) member.isActive = isActive;
    if (role) member.role = role;

    await team.save();

    // Return the updated team with populated data
    res.json(team);
  } catch (err) {
    console.error('Update team member error:', err);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Join a team
app.post('/api/teams/join', authMiddleware, async (req, res) => {
  try {
    const { secretKey } = req.body;
    const userId = req.user._id;

    const team = await Team.findOne({ secretKey }).populate('league');
    if (!team) return res.status(404).json({ error: 'Invalid team key' });

    const isMember = team.members.some(member => member.player.toString() === userId.toString());
    if (isMember) return res.status(400).json({ error: 'User is already a member of this team' });

    let player = await Player.findOne({ user: userId, league: team.league });
    if (!player) {
      const stats = await initializeStats(team.league);
      player = await Player.create({
        user: userId,
        league: team.league,
        teams: [team._id],
        stats,
      });
    } else {
      if (!player.teams.includes(team._id)) {
        player.teams.push(team._id);
        await player.save();
      }
    }

    team.members.push({ player: player._id, role: 'player', isActive: true });
    await team.save();

    res.json({ message: 'Joined team successfully', team });
  } catch (err) {
    console.error('Join team error:', err);
    res.status(500).json({ error: 'Failed to join team' });
  }
});

// Create a player (admin/manager only)
app.post('/api/players', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { userId, leagueId, position, bio, dateOfBirth, nationality } = req.body;
    if (!userId || !leagueId) {
      return res.status(400).json({ error: 'userId and leagueId are required' });
    }

    const existingPlayer = await Player.findOne({ user: userId, league: leagueId });
    if (existingPlayer) {
      return res.status(400).json({ error: 'Player already exists for this user and league' });
    }

    const stats = await initializeStats(leagueId);
    const player = await Player.create({
      user: userId,
      league: leagueId,
      stats,
      position,
      bio,
      dateOfBirth,
      nationality,
      teams: [],
      gamesPlayed: 0,
      totalGamesWon: 0,
      highestScore: 0,
      careerAvgPoints: 0,
      careerRebounds: 0,
      careerSteals: 0,
      playerRank: 0,
    });

    res.status(201).json(player);
  } catch (err) {
    console.error('Create player error:', err);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// Get players (filter by leagueId)
app.get('/api/players', authMiddleware, async (req, res) => {
  try {
    const { leagueId } = req.query;
    const query = leagueId ? { league: leagueId } : {};
    const players = await Player.find(query).populate('user', 'name').populate('teams', 'name');
    res.json(players);
  } catch (err) {
    console.error('Get players error:', err);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Update a player (admin/manager or own profile)
app.patch('/api/players/:playerId', authMiddleware, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { position, bio, dateOfBirth, nationality, injuries, playerHistory, recentInjuries } = req.body;

    const player = await Player.findById(playerId).populate('user');
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const isAdmin = await League.findById(player.league)
      .then(league => league?.admins.some(admin => admin._id.toString() === req.user._id.toString()));
    const isManager = await League.findById(player.league)
      .then(league => league?.managers.some(manager => manager._id.toString() === req.user._id.toString()));
    const isOwnProfile = player.user._id.toString() === req.user._id.toString();

    if (!isAdmin && !isManager && !isOwnProfile) {
      return res.status(403).json({ error: 'Unauthorized: Admin, manager, or own profile access required' });
    }

    // Only admins/managers can update sensitive fields
    const updateFields = isAdmin || isManager ? req.body : { position, bio, dateOfBirth, nationality, injuries, playerHistory, recentInjuries };
    Object.assign(player, updateFields);
    await player.save();

    res.json(player);
  } catch (err) {
    console.error('Update player error:', err);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// Delete a player (admin/manager only)
app.delete('/api/players/:playerId', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { playerId } = req.params;
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    // Remove player from teams
    await Team.updateMany(
      { 'members.player': playerId },
      { $pull: { members: { player: playerId } } }
    );

    await player.deleteOne();
    res.json({ message: 'Player deleted' });
  } catch (err) {
    console.error('Delete player error:', err);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

// GAME ROUTES
// Get games for a league and season
app.get('/api/games', authMiddleware, async (req, res) => {
  try {
    const { leagueId, season } = req.query;
    if (!leagueId) return res.status(400).json({ error: 'leagueId is required' });

    const games = await Game.find({ league: leagueId, season })
      .populate('teams', 'name')
      .populate('gameMVP', 'user')
      .lean();

    // Ensure teams is an array and populate user.name for gameMVP
    const populatedGames = games.map(game => ({
      ...game,
      teams: Array.isArray(game.teams) ? game.teams : [],
      gameMVP: game.gameMVP ? { ...game.gameMVP, name: game.gameMVP.user?.name || 'Unknown' } : null,
    }));

    res.json(populatedGames);
  } catch (err) {
    console.error('Get games error:', err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Create a game (admin/manager only)
app.post('/api/games', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { league, season, date, teams, location, venue, venueCapacity, score, matchType, eventType, gameDuration, weatherConditions, referee, attendance, previousMatchupScore, fanRating, highlights, matchReport, mediaLinks, gameMVP } = req.body;

    if (!league || !date || !teams || teams.length !== 2 || teams[0] === teams[1]) {
      return res.status(400).json({ error: 'Invalid game data: league, date, and two unique teams required' });
    }

    const game = await Game.create({
      league,
      season,
      date,
      teams,
      location,
      venue,
      venueCapacity,
      score,
      matchType,
      eventType,
      gameDuration,
      weatherConditions,
      referee,
      attendance,
      previousMatchupScore,
      fanRating,
      highlights,
      matchReport,
      mediaLinks,
      gameMVP,
      isCompleted: eventType === 'final' || score.team1 > 0 || score.team2 > 0,
    });

    const populatedGame = await Game.findById(game._id)
      .populate('teams', 'name')
      .populate('gameMVP', 'user')
      .lean();

    populatedGame.gameMVP = populatedGame.gameMVP ? { ...populatedGame.gameMVP, name: populatedGame.gameMVP.user?.name || 'Unknown' } : null;

    res.status(201).json(populatedGame);
  } catch (err) {
    console.error('Create game error:', err);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Update a game (admin/manager only)
app.patch('/api/games/:gameId', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { teams, date, location, venue, venueCapacity, score, matchType, eventType, gameDuration, weatherConditions, referee, attendance, previousMatchupScore, fanRating, highlights, matchReport, mediaLinks, gameMVP } = req.body;

    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    if (teams && (teams.length !== 2 || teams[0] === teams[1])) {
      return res.status(400).json({ error: 'Exactly two unique teams required' });
    }

    Object.assign(game, {
      teams,
      date,
      location,
      venue,
      venueCapacity,
      score,
      matchType,
      eventType,
      gameDuration,
      weatherConditions,
      referee,
      attendance,
      previousMatchupScore,
      fanRating,
      highlights,
      matchReport,
      mediaLinks,
      gameMVP,
      isCompleted: eventType === 'final' || (score && (score.team1 > 0 || score.team2 > 0)),
    });

    await game.save();

    const populatedGame = await Game.findById(gameId)
      .populate('teams', 'name')
      .populate('gameMVP', 'user')
      .lean();

    populatedGame.gameMVP = populatedGame.gameMVP ? { ...populatedGame.gameMVP, name: populatedGame.gameMVP.user?.name || 'Unknown' } : null;

    res.json(populatedGame);
  } catch (err) {
    console.error('Update game error:', err);
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// Delete a game (admin/manager only)
app.delete('/api/games/:gameId', authMiddleware, checkAdminOrManager, async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    await game.deleteOne();
    res.json({ message: 'Game deleted' });
  } catch (err) {
    console.error('Delete game error:', err);
    res.status(500).json({ error: 'Failed to delete game' });
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
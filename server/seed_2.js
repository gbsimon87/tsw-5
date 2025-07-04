const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { faker } = require('@faker-js/faker');
const User = require('./models/User');
const League = require('./models/League');
const Team = require('./models/Team');
const Player = require('./models/Player');
require('dotenv').config({ path: '.env' });

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    // console.log('Connected to MongoDB');

    // Clear existing data (excluding Game model as per requirements)
    await User.deleteMany({});
    await League.deleteMany({});
    await Team.deleteMany({});
    await Player.deleteMany({});
    // console.log('Cleared existing users, leagues, teams, and players.');

    // Initialize player stats based on league scoring rules
    const initializeStats = (scoringRules) => {
      return Object.keys(scoringRules).reduce((stats, key) => {
        stats[key] = 0;
        return stats;
      }, {});
    };

    // Create users: 4 admins + 10 specific users + 190 additional users
    // Assumption: 200 total users to ensure enough players for 8 leagues * 5 teams * 10 players/team = 400 player slots
    const users = [];
    const adminUsers = [];
    for (let i = 0; i < 4; i++) {
      const email = `admin${i + 1}@admin${i + 1}.com`;
      const name = faker.person.fullName();
      const [givenName, familyName] = name.split(' ');
      const hashedPassword = await bcrypt.hash('password', 10);
      adminUsers.push({
        email,
        name,
        givenName,
        familyName,
        password: hashedPassword,
        emailVerified: false,
        locale: faker.location.countryCode(),
        createdAt: new Date()
      });
    }

    // Create first 10 users with specific emails
    for (let i = 1; i <= 10; i++) {
      const email = `user${i}@user${i}.com`;
      const name = `User ${i}`;
      const [givenName, familyName] = name.split(' ');
      const hashedPassword = await bcrypt.hash('password', 10);
      users.push({
        email,
        name,
        givenName,
        familyName,
        password: hashedPassword,
        emailVerified: false,
        locale: faker.location.countryCode(),
        createdAt: new Date()
      });
    }

    // Create additional users
    for (let i = 0; i < 190; i++) {
      const name = faker.person.fullName();
      const [givenName, familyName] = name.split(' ');
      const email = faker.internet.email({ provider: 'example.com' });
      const hashedPassword = await bcrypt.hash('password', 10);
      users.push({
        email,
        name,
        givenName,
        familyName,
        password: hashedPassword,
        emailVerified: false,
        locale: faker.location.countryCode(),
        createdAt: new Date()
      });
    }

    // Insert all users
    const insertedUsers = await User.insertMany([...adminUsers, ...users]);
    // console.log(`Created ${insertedUsers.length} users (4 admins + ${users.length} members)`);

    // Separate admins and members
    const admins = insertedUsers.slice(0, 4);
    const memberUsers = insertedUsers.slice(4);

    // Create 8 leagues (2 per admin)
    const leagues = [];
    const sportTypes = ['basketball', 'soccer', 'baseball', 'hockey', 'football'];
    for (let i = 0; i < 4; i++) {
      // Each admin creates 2 leagues
      for (let j = 0; j < 2; j++) {
        const sportType = sportTypes[faker.number.int({ min: 0, max: sportTypes.length - 1 })]; // Random sport
        const league = new League({
          name: `${faker.company.name()} ${sportType.charAt(0).toUpperCase() + sportType.slice(1)} League`,
          sportType,
          location: faker.location.city(),
          visibility: faker.helpers.arrayElement(['public', 'private']),
          admins: [admins[i]._id],
          managers: [],
          teams: [],
          establishedYear: faker.number.int({ min: 2000, max: 2025 }),
          isActive: true,
          logo: faker.image.url({ category: 'sports' }),
          seasons: [
            {
              name: 'Season 1',
              startDate: new Date('2025-07-01'),
              endDate: new Date('2025-12-31'),
              isActive: true
            }
          ],
          status: 'active'
        });
        await league.save();
        leagues.push(league);
        // console.log(`Created league: ${league.name} by admin: ${admins[i].email}`);
      }
    }

    // Create players for each member user
    const players = [];
    for (const user of memberUsers) {
      // Player is initially not tied to a specific league; league field set later if needed
      const stats = {}; // Will be updated based on team assignments
      const player = new Player({
        user: user._id,
        teams: [],
        stats,
        gamesPlayed: 0,
        performanceRating: 0,
        position: faker.helpers.arrayElement(['Guard', 'Forward', 'Center', 'Midfielder', 'Defender', 'Pitcher', 'Goalkeeper']),
        bio: faker.lorem.sentence(),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 40, mode: 'age' }),
        nationality: faker.location.country(),
        isActive: true,
        injuries: [],
        totalGamesWon: 0,
        highestScore: 0,
        careerAvgPoints: 0,
        careerRebounds: 0,
        careerSteals: 0,
        playerHistory: [],
        playerRank: 0,
        recentInjuries: []
      });
      await player.save();
      players.push(player);
      // console.log(`Created player for user: ${user.name}`);
    }

    // Create 5 teams per league and assign players
    for (const league of leagues) {
      const teams = [];
      for (let i = 0; i < 5; i++) {
        const team = new Team({
          name: `${faker.animal.type()} ${faker.color.human()}s`,
          league: league._id,
          season: 'Season 1',
          createdBy: league.admins[0],
          isActive: true,
          members: [],
          logo: faker.image.url({ category: 'sports' }),
          secretKey: crypto.randomBytes(16).toString('hex')
        });
        await team.save();
        teams.push(team._id);
        // console.log(`Created team: ${team.name} for league: ${league.name}`);
      }
      league.teams = teams;
      await league.save();
      // console.log(`Updated league ${league.name} with ${teams.length} teams`);
    }

    // Assign players to at least 2 teams from different leagues
    // Assumption: Each team has 10 players, so 8 leagues * 5 teams * 10 players = 400 slots
    // With 200 players, each joining 2 teams, we fill 400 slots exactly
    const teamAssignments = [];
    for (const player of players) {
      // Select two different leagues randomly
      const leagueIndices = faker.helpers.shuffle([...Array(leagues.length).keys()]);
      const selectedLeagues = [leagues[leagueIndices[0]], leagues[leagueIndices[1]]];

      for (const league of selectedLeagues) {
        // Select a random team from the league
        const team = league.teams[faker.number.int({ min: 0, max: league.teams.length - 1 })];
        teamAssignments.push({ playerId: player._id, teamId: team, leagueId: league._id });
      }
    }

    // Distribute additional assignments if needed to fill teams (ensure ~10 players per team)
    const teams = await Team.find({});
    for (const team of teams) {
      const currentMembers = teamAssignments.filter(ta => ta.teamId.toString() === team._id.toString()).length;
      if (currentMembers < 10) {
        const needed = 10 - currentMembers;
        const availablePlayers = players.filter(p => 
          teamAssignments.filter(ta => ta.playerId.toString() === p._id.toString()).length < 3 &&
          !teamAssignments.some(ta => ta.playerId.toString() === p._id.toString() && ta.teamId.toString() === team._id.toString())
        );
        const selectedPlayers = faker.helpers.shuffle(availablePlayers).slice(0, needed);
        for (const player of selectedPlayers) {
          teamAssignments.push({ playerId: player._id, teamId: team._id, leagueId: team.league });
        }
      }
    }

    // Update teams and players with assignments
    for (const assignment of teamAssignments) {
      const team = teams.find(t => t._id.toString() === assignment.teamId.toString());
      const player = players.find(p => p._id.toString() === assignment.playerId.toString());
      const league = leagues.find(l => l._id.toString() === assignment.leagueId.toString());

      // Add player to team members
      team.members.push({
        player: player._id,
        role: 'player',
        isActive: true
      });

      // Add team to player
      player.teams.push(team._id);

      // Initialize stats for the league's scoring rules if not already set
      if (!player.stats[league.sportType]) {
        player.stats[league.sportType] = initializeStats(league.settings.scoringRules);
      }

      await team.save();
      await player.save();
      // console.log(`Assigned player ${player._id} to team ${team.name} in league ${league.name}`);
    }

    // console.log('Seeding complete');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    // console.log('MongoDB connection closed');
  }
}

// Run the seed function
seedDatabase();
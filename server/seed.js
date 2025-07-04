const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');
const User = require('./models/User');
const League = require('./models/League');
const Team = require('./models/Team');
const Game = require('./models/Game');
const Player = require('./models/Player');
require('dotenv').config({ path: '.env' });

console.log(process.env.MONGODB_URI);

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await League.deleteMany({});
    await Team.deleteMany({});
    await Player.deleteMany({});
    await Game.deleteMany({});
    console.log('Cleared existing users, leagues, teams, players, and games.');

    // Define sport types and their settings
    const sportSettings = {
      basketball: {
        periodType: 'halves',
        periodDuration: 24,
        overtimeDuration: 5,
        scoringRules: { twoPointFGM: 2, threePointFGM: 3, freeThrowM: 1 },
        statTypes: [
          'twoPointFGM', 'twoPointFGA', 'threePointFGM', 'threePointFGA',
          'freeThrowM', 'freeThrowA', 'offensiveRebound', 'defensiveRebound',
          'assist', 'steal', 'turnover', 'block', 'personalFoul',
          'teamFoul', 'technicalFoul', 'flagrantFoul'
        ]
      },
      soccer: {
        periodType: 'halves',
        periodDuration: 45,
        overtimeDuration: 15,
        scoringRules: { goal: 1 },
        statTypes: ['goal', 'assist', 'yellowCard', 'redCard']
      },
      baseball: {
        periodType: 'halves',
        periodDuration: 45,
        overtimeDuration: 5,
        scoringRules: { single: 1, double: 2, triple: 3, homeRun: 4 },
        statTypes: ['hit', 'run', 'rbi', 'strikeout']
      },
      hockey: {
        periodType: 'periods',
        periodDuration: 20,
        overtimeDuration: 5,
        scoringRules: { goal: 1 },
        statTypes: ['goal', 'assist', 'penalty']
      }
    };

    // Initialize player stats based on league scoring rules
    const initializeStats = (scoringRules) => {
      return Object.keys(scoringRules).reduce((stats, key) => {
        stats[key] = 0;
        return stats;
      }, {});
    };

    // Create users (4 admins + 240 members)
    const users = [];
    const adminUsers = [];
    for (let i = 0; i < 4; i++) {
      const email = `admin${i + 1}@league${i + 1}.com`;
      const name = faker.person.fullName();
      const hashedPassword = await bcrypt.hash('password', 10);
      adminUsers.push({
        email,
        name,
        password: hashedPassword,
        emailVerified: false
      });
    }

    for (let i = 0; i < 240; i++) {
      const email = faker.internet.email({ provider: 'example.com' });
      const name = faker.person.fullName();
      const hashedPassword = await bcrypt.hash('password', 10);
      users.push({
        email,
        name,
        password: hashedPassword,
        emailVerified: false
      });
    }

    // Insert all users
    const insertedUsers = await User.insertMany([...adminUsers, ...users]);
    console.log(`Created ${insertedUsers.length} users (4 admins + ${users.length} members)`);

    // Get admin users
    const admins = insertedUsers.slice(0, 4);
    const memberUsers = insertedUsers.slice(4);

    // Create 4 leagues
    const leagues = [];
    const sportTypes = ['basketball', 'soccer', 'baseball', 'hockey'];
    for (let i = 0; i < 4; i++) {
      const sportType = sportTypes[i];
      const league = new League({
        name: `${faker.company.name()} ${sportType.charAt(0).toUpperCase() + sportType.slice(1)} League`,
        location: faker.location.city(),
        sportType,
        visibility: faker.helpers.arrayElement(['public', 'private']),
        admins: [admins[i]._id],
        managers: [],
        teams: [],
        establishedYear: faker.number.int({ min: 2000, max: 2025 }),
        isActive: true,
        seasons: [
          {
            name: 'Season 1',
            startDate: new Date('2025-07-01'),
            endDate: new Date('2025-12-31'),
            isActive: true
          }
        ],
        settings: sportSettings[sportType]
      });
      await league.save();
      leagues.push(league);
      console.log(`Created league: ${league.name}`);
    }

    // Create players for each member user
    const players = [];
    for (let i = 0; i < memberUsers.length; i++) {
      const user = memberUsers[i];
      const league = leagues[i % 4]; // Distribute evenly across 4 leagues
      const stats = initializeStats(sportSettings[league.sportType].scoringRules);
      const player = new Player({
        user: user._id,
        league: league._id,
        teams: [],
        stats,
        gamesPlayed: 0,
        performanceRating: 0,
        position: faker.helpers.arrayElement(['Guard', 'Forward', 'Center', 'Midfielder', 'Defender', 'Pitcher', 'Center']),
        bio: faker.lorem.sentence(),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 40, mode: 'age' }),
        nationality: faker.location.country(),
        isActive: true
      });
      await player.save();
      players.push(player);
      console.log(`Created player ${player._id} for user: ${user.name} in league: ${league.name}`);
    }

    // Create 6 teams per league and assign players
    let playerIndex = 0;
    for (const league of leagues) {
      const teams = [];
      for (let i = 0; i < 6; i++) {
        const team = new Team({
          name: `${faker.animal.type()} ${faker.color.human()}s`,
          league: league._id,
          season: 'Season 1',
          createdBy: league.admins[0],
          isActive: true,
          members: []
        });

        // Assign 10 unique players to each team
        for (let j = 0; j < 10; j++) {
          if (playerIndex >= players.length) {
            console.error(`Error: Not enough players to assign to team ${team.name} (playerIndex: ${playerIndex})`);
            throw new Error('Not enough players to assign to teams');
          }
          const player = players[playerIndex];
          if (!player || !player._id) {
            console.error(`Error: Invalid player at index ${playerIndex}`, player);
            throw new Error('Invalid player data');
          }
          team.members.push({
            player: player._id,
            role: 'player',
            isActive: true
          });
          player.teams.push(team._id);
          await player.save();
          console.log(`Assigned player ${player._id} to team ${team.name}`);
          playerIndex++;
        }

        await team.save();
        teams.push(team._id);
        console.log(`Created team: ${team.name} for league: ${league.name} with 10 players`);
      }

      // Update league with team IDs
      league.teams = teams;
      await league.save();
      console.log(`Updated league ${league.name} with ${teams.length} teams`);
    }

    console.log('Seeding complete');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seed function
seedDatabase();
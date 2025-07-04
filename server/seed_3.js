/*
Users: Created 4 admins (one per league) and 240 members, ensuring unique emails and names. All passwords are 'password', hashed with bcrypt.
Leagues: Generated 4 leagues with unique names, cycled through sport types (basketball, soccer, baseball, hockey), and set appropriate settings based on your schema's defaults.
Teams: Created 6 teams per league (24 total) with animal-color names (e.g., "Lion Blues") for variety and linked them to the league's active season.
Members: Assigned 10 unique members to each team, tracking memberIndex to avoid duplicates. Each member is a player with isActive: true.
*/

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');
const User = require('./models/User');
const League = require('./models/League');
const Team = require('./models/Team');
require('dotenv').config({ path: '.env' });

console.log(process.env.MONGODB_URI);

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Team.deleteMany({});
    await League.deleteMany({});
    console.log('Cleared existing users, teams, and leagues');

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
        statTypes: []
      },
      baseball: {
        periodType: 'halves',
        periodDuration: 45,
        overtimeDuration: 5,
        scoringRules: { single: 1, double: 2, triple: 3, homeRun: 4 },
        statTypes: []
      },
      hockey: {
        periodType: 'periods',
        periodDuration: 20,
        overtimeDuration: 5,
        scoringRules: { goal: 1 },
        statTypes: []
      }
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

    // Create 6 teams per league and assign members
    let memberIndex = 0;
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

        // Assign 10 unique members to each team
        for (let j = 0; j < 10; j++) {
          if (memberIndex >= memberUsers.length) {
            throw new Error('Not enough members to assign to teams');
          }
          team.members.push({
            user: memberUsers[memberIndex]._id,
            role: 'player',
            isActive: true
          });
          memberIndex++;
        }

        await team.save();
        teams.push(team._id);
        console.log(`Created team: ${team.name} for league: ${league.name}`);
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
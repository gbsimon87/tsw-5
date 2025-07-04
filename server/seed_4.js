/*
Seed file that ensures all 240 member users are part of at least two different teams for each of the 4 leagues. The code creates 4 leagues, each with 6 teams, and assigns each member to exactly two teams per league using random selection to ensure variety. The structure first creates all users, leagues, and teams, then assigns members, and finally saves the updated teams.
Key Features
Users: 4 admins (one per league) and 240 members with unique emails and names, all passwords set to 'password' and hashed with bcrypt.
Leagues: 4 leagues with unique names and sport types (basketball, soccer, baseball, hockey), each with specific settings.
Teams: 6 teams per league (24 total), each with a unique animal-color name, linked to the league’s active season.
Member Assignments: Each of the 240 members is assigned to exactly two teams in each league, using random selection to ensure diversity. This results in each member being part of 8 teams total (2 teams × 4 leagues), satisfying the requirement of "at least two different teams for each league."
Notes
Team sizes will average around 80 members per team (240 members × 2 assignments / 6 teams), though this may vary slightly due to random assignment.
The code separates the creation of leagues and teams from member assignment for clarity and ensures all changes are persisted by saving teams after assignments.
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

    // Get admin users and member users
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

    // Create 6 teams per league
    const allTeams = [];
    for (const league of leagues) {
      for (let i = 0; i < 6; i++) {
        const team = new Team({
          name: `${faker.animal.type()} ${faker.color.human()}s`,
          league: league._id,
          season: 'Season 1',
          createdBy: league.admins[0],
          isActive: true,
          members: []
        });
        await team.save();
        allTeams.push(team);
        league.teams.push(team._id);
      }
      await league.save();
      console.log(`Created 6 teams for league: ${league.name}`);
    }

    // Assign each member to exactly two teams per league
    for (const league of leagues) {
      const leagueTeams = allTeams.filter(team => team.league.toString() === league._id.toString());
      for (const member of memberUsers) {
        // Select two distinct teams randomly from the league's teams
        const selectedTeams = faker.helpers.arrayElements(leagueTeams, 2);
        for (const team of selectedTeams) {
          team.members.push({
            user: member._id,
            role: 'player',
            isActive: true
          });
        }
      }
    }

    // Save all teams with updated members
    for (const team of allTeams) {
      await team.save();
    }
    console.log('Assigned members to teams: each member is in exactly two teams per league');

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
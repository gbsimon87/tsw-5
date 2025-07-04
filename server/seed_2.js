/*
The seed file connects to MongoDB, clears existing data, creates 20 users and one admin with the password 'password', establishes a basketball league named 'We-ball' with the admin user, creates two teams ('London Lions' and 'Thames Titans'), assigns 10 users to each team, and links the teams to the league.
*/

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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

    // Create 20 users
    const users = [];
    for (let i = 1; i <= 20; i++) {
      const email = `user${i}@user${i}.com`;
      const name = `User ${i}`;
      const hashedPassword = await bcrypt.hash('password', 10);
      users.push({
        email,
        name,
        password: hashedPassword,
        emailVerified: false
      });
    }

    // Create admin user
    const adminUser = {
      email: 'admin@admin.com',
      name: 'Admin',
      password: await bcrypt.hash('password', 10),
      emailVerified: false
    };

    // Insert users
    const insertedUsers = await User.insertMany([...users, adminUser]);
    console.log('Created 20 users and 1 admin');

    // Find admin user
    const admin = insertedUsers.find(user => user.email === 'admin@admin.com');

    // Create We-ball league
    const league = new League({
      name: 'We-ball',
      location: 'London',
      sportType: 'basketball',
      visibility: 'public',
      admins: [admin._id],
      managers: [],
      teams: [],
      establishedYear: 2025,
      isActive: true,
      seasons: [
        {
          name: 'Season 1',
          startDate: new Date('2025-07-01'),
          endDate: new Date('2025-12-31'),
          isActive: true
        }
      ],
      settings: {
        periodType: 'halves',
        periodDuration: 24,
        overtimeDuration: 5,
        scoringRules: {
          twoPointFGM: 2,
          threePointFGM: 3,
          freeThrowM: 1
        },
        statTypes: [
          'twoPointFGM', 'twoPointFGA', 'threePointFGM', 'threePointFGA',
          'freeThrowM', 'freeThrowA', 'offensiveRebound', 'defensiveRebound',
          'assist', 'steal', 'turnover', 'block', 'personalFoul',
          'teamFoul', 'technicalFoul', 'flagrantFoul'
        ]
      }
    });

    await league.save();
    console.log('Created We-ball league');

    // Create two teams
    const team1 = new Team({
      name: 'London Lions',
      league: league._id,
      season: 'Season 1',
      createdBy: admin._id,
      isActive: true,
      members: []
    });

    const team2 = new Team({
      name: 'Thames Titans',
      league: league._id,
      season: 'Season 1',
      createdBy: admin._id,
      isActive: true,
      members: []
    });

    // Assign users to teams (10 users per team)
    const regularUsers = insertedUsers.filter(user => user.email !== 'admin@admin.com');
    const half = Math.floor(regularUsers.length / 2);

    // Add first half of users to team1
    for (let i = 0; i < half; i++) {
      team1.members.push({
        user: regularUsers[i]._id,
        role: 'player',
        isActive: true
      });
    }

    // Add second half of users to team2
    for (let i = half; i < regularUsers.length; i++) {
      team2.members.push({
        user: regularUsers[i]._id,
        role: 'player',
        isActive: true
      });
    }

    // Save teams
    await team1.save();
    await team2.save();
    console.log('Created two teams: London Lions and Thames Titans');

    // Update league with team IDs
    league.teams = [team1._id, team2._id];
    await league.save();
    console.log('Updated league with teams');

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
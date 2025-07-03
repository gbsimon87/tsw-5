const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const League = require('./models/League');
require('dotenv').config({ path: '.env' });

console.log(process.env.MONGODB_URI);

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (optional, comment out if you want to keep existing data)
    await User.deleteMany({});
    await League.deleteMany({});
    console.log('Cleared existing users and leagues');

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
    await User.insertMany([...users, adminUser]);
    console.log('Created 20 users and 1 admin');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@admin.com' });

    // Default scoring rules for basketball
    const scoringRules = {
      freeThrow: 1,
      twoPoint: 2,
      threePoint: 3
    };

    // Create We-ball league
    const league = new League({
      name: 'We-ball',
      location: 'London',
      sportType: 'basketball',
      scoringRules,
      admins: [admin._id],
      managers: [],
      visibility: 'public',
      seasons: [
        {
          name: 'Season 1',
          startDate: new Date('2025-07-01'),
          endDate: new Date('2025-12-31')
        }
      ]
    });

    await league.save();
    console.log('Created We-ball league');

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
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { faker } = require('@faker-js/faker');
const User = require('./models/User');
const League = require('./models/League');
const Team = require('./models/Team');
const Player = require('./models/Player');
const Game = require('./models/Game');
require('dotenv').config({ path: '.env' });

async function seedDatabase() {
  try {
    // Connect to MongoDB
    connectDB();

    // Clear existing data
    await User.deleteMany({});
    await League.deleteMany({});
    await Team.deleteMany({});
    await Player.deleteMany({});
    await Game.deleteMany({});
    // console.log('Cleared existing users, leagues, teams, players, and games.');

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
    const sportTypes = ['basketball', 'football', 'baseball', 'hockey', 'americanFootball'];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 2; j++) {
        const sportType = sportTypes[faker.number.int({ min: 0, max: sportTypes.length - 1 })];
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
          // logo: faker.image.urlLoremFlickr({ category: 'sports' }),
          logo: `https://picsum.photos/seed/${faker.string.uuid()}/200/200`,
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
      const stats = {};
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

    // Create 5 teams per league
    const teams = [];
    for (const league of leagues) {
      for (let i = 0; i < 5; i++) {
        const team = new Team({
          name: `${faker.animal.type()} ${faker.color.human()}s`,
          league: league._id,
          season: 'Season 1',
          createdBy: league.admins[0],
          isActive: true,
          members: [],
          logo: '',
          // logo: faker.image.urlLoremFlickr({ category: 'sports' }),
          secretKey: crypto.randomBytes(16).toString('hex')
        });
        await team.save();
        teams.push(team);
        league.teams.push(team._id);
        // console.log(`Created team: ${team.name} for league: ${league.name}`);
      }
      await league.save();
      // console.log(`Updated league ${league.name} with ${league.teams.length} teams`);
    }

    // Assign players to at least 2 teams from different leagues
    const teamAssignments = [];
    for (const player of players) {
      const leagueIndices = faker.helpers.shuffle([...Array(leagues.length).keys()]);
      const selectedLeagues = [leagues[leagueIndices[0]], leagues[leagueIndices[1]]];
      for (const league of selectedLeagues) {
        const team = league.teams[faker.number.int({ min: 0, max: league.teams.length - 1 })];
        teamAssignments.push({ playerId: player._id, teamId: team, leagueId: league._id });
      }
    }

    // Ensure ~10 players per team
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

      team.members.push({
        player: player._id,
        role: 'player',
        isActive: true
      });
      player.teams.push(team._id);
      if (!player.stats[league.sportType]) {
        player.stats[league.sportType] = initializeStats(league.settings.scoringRules);
      }

      await team.save();
      await player.save();
      // console.log(`Assigned player ${player._id} to team ${team.name} in league ${league.name}`);
    }

    // Seed games for each league
    // Assumption: Create 2 games per league (8 leagues * 2 games = 16 games) with 5-7 players per team
    const games = [];
    for (const league of leagues) {
      const leagueTeams = teams.filter(t => t.league.toString() === league._id.toString());
      for (let i = 0; i < 2; i++) {
        const teamIndices = faker.helpers.shuffle([...Array(leagueTeams.length).keys()]);
        const team1 = leagueTeams[teamIndices[0]];
        const team2 = leagueTeams[teamIndices[1]];
        if (team1._id.toString() === team2._id.toString()) continue;

        // Select 5-7 random players per team
        const team1Players = faker.helpers.shuffle(team1.members.filter(m => m.isActive)).slice(0, faker.number.int({ min: 5, max: 7 }));
        const team2Players = faker.helpers.shuffle(team2.members.filter(m => m.isActive)).slice(0, faker.number.int({ min: 5, max: 7 }));

        // Generate player stats based on league.settings.statTypes
        const playerStats = [];
        const statTypes = league.settings.statTypes;
        for (const member of [...team1Players, ...team2Players]) {
          const stats = {};
          const scoringKeys = Object.keys(league.settings.scoringRules);
          scoringKeys.forEach(key => {
            if (statTypes.includes(key)) {
              stats[key] = faker.number.int({ min: 0, max: 5 });
            }
          });
          statTypes.filter(key => !scoringKeys.includes(key)).forEach(key => {
            stats[key] = faker.number.int({ min: 0, max: 3 });
          });
          playerStats.push({
            player: member.player,
            team: team1.members.includes(member) ? team1._id : team2._id,
            stats
          });
        }

        const game = new Game({
          league: league._id,
          season: 'Season 1',
          teams: [team1._id, team2._id],
          teamScores: [
            { team: team1._id, score: 0 },
            { team: team2._id, score: 0 }
          ],
          date: faker.date.between({ from: '2025-07-01', to: '2025-12-31' }),
          location: faker.location.city(),
          venue: `${faker.company.name()} Arena`,
          venueCapacity: faker.number.int({ min: 5000, max: 20000 }),
          playerStats,
          matchType: 'league',
          eventType: 'regular',
          gameDuration: league.settings.periodDuration * 2,
          isCompleted: true,
          highlights: [faker.lorem.sentence(), faker.lorem.sentence()],
          matchReport: faker.lorem.paragraph(),
          mediaLinks: [{ url: '', type: '' }],
          attendance: faker.number.int({ min: 1000, max: 15000 }),
          referee: faker.person.fullName(),
          fanRating: faker.number.int({ min: 1, max: 5 })
        });

        await game.save();
        games.push(game);
        // console.log(`Created game ${game._id} for league ${league.name} between ${team1.name} and ${team2.name}`);

        // Update Player.stats and gamesPlayed
        for (const stat of playerStats) {
          const player = players.find(p => p._id.toString() === stat.player.toString());
          if (player) {
            if (!player.stats[league.sportType]) {
              player.stats[league.sportType] = initializeStats(league.settings.scoringRules);
            }
            Object.entries(stat.stats).forEach(([key, value]) => {
              player.stats[league.sportType][key] = (player.stats[league.sportType][key] || 0) + (value || 0);
            });
            player.gamesPlayed = (player.gamesPlayed || 0) + 1;
            await player.save();
          }
        }
      }
    }

    // console.log(`Seeding complete: ${games.length} games created`);
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    // console.log('MongoDB connection closed');
  }
}

// Run the seed function
seedDatabase().then(() => {
  console.log('Closing MongoDB Connection...');
});
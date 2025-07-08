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

const SMALL_MODE = false;
const CLEAR_DATABASE = true;

// Configuration for seeding
const config = {
  numAdmins: SMALL_MODE === true ? 1 : 4,
  numUsers: SMALL_MODE === true ? 10 : 196,
  leaguesPerAdmin: SMALL_MODE === true ? 2 : 4,
  teamsPerLeague: SMALL_MODE === true ? 2 : 5,
  gamesPerLeague: SMALL_MODE === true ? 1 : 2,
  playersPerTeam: SMALL_MODE === true ? 5 : 10,
};

// Scoring rules map and stat types by sport (from your schema)
const scoringRulesMap = {
  basketball: { twoPointFGM: 2, threePointFGM: 3, freeThrowM: 1 },
  hockey: { goal: 1 },
  football: { goal: 1 },
  baseball: { single: 1, double: 2, triple: 3, homeRun: 4 },
  americanFootball: { touchdown: 6, fieldGoal: 3, extraPoint: 1, twoPointConversion: 2, safety: 2 }
};

const defaultLeagueSettings = {
  basketball: {
    periodType: 'halves',
    periodDuration: 24,
    overtimeDuration: 5,
    scoringRules: scoringRulesMap.basketball,
    statTypes: [
      'twoPointFGM', 'twoPointFGA', 'threePointFGM', 'threePointFGA',
      'freeThrowM', 'freeThrowA', 'offensiveRebound', 'defensiveRebound',
      'assist', 'steal', 'turnover', 'block', 'blockedShotAttempt', 'personalFoul',
      'teamFoul', 'technicalFoul', 'flagrantFoul', 'drawnFoul'
    ]
  },
  football: {
    periodType: 'halves',
    periodDuration: 45,
    overtimeDuration: 15,
    scoringRules: scoringRulesMap.football,
    statTypes: [
      'goals', 'assists', 'shotsOnTarget', 'shotsOffTarget',
      'passesCompleted', 'passesAttempted', 'tackles',
      'interceptions', 'foulsCommitted', 'yellowCards',
      'redCards', 'saves', 'offsides', 'corners', 'clearances',
      'ejections', 'penalty'
    ]
  },
  baseball: {
    periodType: 'halves',
    periodDuration: 45,
    overtimeDuration: 5,
    scoringRules: scoringRulesMap.baseball,
    statTypes: [
      'atBats', 'hits', 'runs', 'RBIs', 'homeRuns',
      'doubles', 'triples', 'walks', 'strikeouts',
      'stolenBases', 'caughtStealing', 'inningsPitched',
      'earnedRuns', 'pitchesThrown', 'strikesThrown',
      'battersFaced', 'fieldingErrors', 'ejections'
    ]
  },
  hockey: {
    periodType: 'periods',
    periodDuration: 20,
    overtimeDuration: 5,
    scoringRules: scoringRulesMap.hockey,
    statTypes: [
      'goals', 'assists', 'shots', 'hits', 'blockedShots',
      'faceoffsWon', 'faceoffsLost', 'penaltyMinutes',
      'plusMinus', 'takeaways', 'giveaways', 'powerPlayGoals',
      'shortHandedGoals', 'gameWinningGoals', 'saves',
      'goalsAgainst', 'savePercentage', 'penalty', 'ejections',
      'penaltyShots'
    ]
  },
  americanFootball: {
    periodType: 'halves',
    periodDuration: 45,
    overtimeDuration: 15,
    scoringRules: scoringRulesMap.americanFootball,
    statTypes: [
      'passingYards', 'passingTDs', 'interceptionsThrown',
      'rushingYards', 'rushingTDs', 'fumblesLost',
      'receptions', 'receivingYards', 'receivingTDs',
      'tackles', 'sacks', 'interceptionsCaught',
      'fieldGoalsMade', 'fieldGoalsMissed', 'extraPointsMade',
      'punts', 'puntYards', 'kickReturns', 'kickReturnYards',
      'penalty', 'ejections'
    ]
  }
};

const statRanges = {
  basketball: { points: [0, 30], rebounds: [0, 15], assists: [0, 10] },
  football: { goals: [0, 3], assists: [0, 2], tackles: [0, 5] },
  baseball: { hits: [0, 4], runs: [0, 3], rbis: [0, 4] },
  hockey: { goals: [0, 3], assists: [0, 2], saves: [0, 20] },
  americanFootball: { touchdowns: [0, 3], yards: [0, 100], tackles: [0, 10] },
};

// Helper function to log progress
const logProgress = (message, count, total) => {
  console.log(`${message}: ${count}/${total} (${((count / total) * 100).toFixed(1)}%)`);
};

// Helper to initialize player stats based on scoring rules
const initializeStats = (scoringRules) => {
  return Object.keys(scoringRules).reduce((stats, key) => {
    stats[key] = 0;
    return stats;
  }, {});
};

// Helper to generate unique secret keys
const secretKeys = new Set();
const generateUniqueSecretKey = () => {
  let key;
  do {
    key = crypto.randomBytes(16).toString('hex');
  } while (secretKeys.has(key));
  secretKeys.add(key);
  return key;
};

// Helper to generate unique game dates
const gameDates = new Set();
const generateUniqueDate = (from, to) => {
  let date;
  do {
    date = faker.date.between({ from, to });
  } while (gameDates.has(date.toISOString()));
  gameDates.add(date.toISOString());
  return date;
};

const now = new Date();
const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
const twoMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate());

// Clear database
async function clearDatabase() {
  try {
    await User.deleteMany({});
    await League.deleteMany({});
    await Team.deleteMany({});
    await Player.deleteMany({});
    await Game.deleteMany({});
    console.log('Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
}

// Seed users
async function seedUsers() {
  try {
    const users = [];
    const adminUsers = [];

    // Create admin users
    for (let i = 0; i < config.numAdmins; i++) {
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
        createdAt: new Date(),
      });
    }

    // Create specific users
    for (let i = 1; i <= Math.min(config.numUsers, 10); i++) {
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
        createdAt: new Date(),
      });
    }

    // Create additional users
    for (let i = users.length; i < config.numUsers; i++) {
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
        createdAt: new Date(),
      });
    }

    // Insert users and log progress
    const allUsers = [...adminUsers, ...users];
    const savedUsers = [];
    let userCount = 0;
    for (const user of allUsers) {
      const savedUser = await User.create(user);
      if (!savedUser._id) {
        console.warn(`Failed to save user: ${JSON.stringify(user)}`);
        continue;
      }
      savedUsers.push(savedUser);
      userCount++;
      logProgress('Creating users', userCount, allUsers.length);
    }
    if (savedUsers.length === 0) {
      throw new Error('No users created successfully');
    }
    return savedUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

// Seed leagues (UPDATED)
async function seedLeagues(admins) {
  try {
    const leagues = [];
    const sportTypes = Object.keys(defaultLeagueSettings);
    let leagueCount = 0;

    for (const admin of admins) {
      if (!admin || !admin._id) {
        console.warn(`Skipping league creation for invalid admin: ${JSON.stringify(admin)}`);
        continue;
      }
      for (let j = 0; j < config.leaguesPerAdmin; j++) {
        const sportType = sportTypes[faker.number.int({ min: 0, max: sportTypes.length - 1 })];
        const settings = defaultLeagueSettings[sportType];

        const league = new League({
          name: `${faker.company.name()} ${sportType.charAt(0).toUpperCase() + sportType.slice(1)} League`,
          sportType,
          location: faker.location.city(),
          visibility: faker.helpers.arrayElement(['public', 'private']),
          admins: [admin._id],
          managers: [],
          teams: [],
          establishedYear: faker.number.int({ min: 2000, max: 2025 }),
          isActive: true,
          logo: `https://source.unsplash.com/200x200/?${sportType},logo`,
          seasons: [
            {
              name: 'Season 1',
              startDate: new Date('2025-07-01'),
              endDate: new Date('2025-12-31'),
              isActive: true,
            },
          ],
          settings: {
            periodType: settings.periodType,
            periodDuration: settings.periodDuration,
            overtimeDuration: settings.overtimeDuration,
            scoringRules: settings.scoringRules,
            statTypes: settings.statTypes,
          },
          status: 'active',
        });
        await league.save();
        leagues.push(league);
        leagueCount++;
        logProgress('Creating leagues', leagueCount, admins.length * config.leaguesPerAdmin);
      }
    }
    if (leagues.length === 0) {
      console.warn('No leagues created due to invalid admin data');
    }
    return leagues;
  } catch (error) {
    console.error('Error seeding leagues:', error);
    throw error;
  }
}

// Seed teams
async function seedTeams(leagues) {
  try {
    const teams = [];
    let teamCount = 0;

    for (const league of leagues) {
      if (!league.admins || !league.admins[0]) {
        console.warn(`Skipping team creation for league ${league.name}: no valid admin found`);
        continue;
      }
      for (let i = 0; i < config.teamsPerLeague; i++) {
        const team = new Team({
          name: `${faker.animal.type()} ${faker.color.human()}s`,
          league: league._id,
          season: 'Season 1',
          createdBy: league.admins[0],
          isActive: true,
          members: [],
          logo: `https://source.unsplash.com/200x200/?${league.sportType},logo`,
          secretKey: generateUniqueSecretKey(),
        });
        await team.save();
        teams.push(team);
        league.teams.push(team._id);
        teamCount++;
        logProgress('Creating teams', teamCount, leagues.length * config.teamsPerLeague);
      }
      await league.save();
    }
    if (teams.length === 0) {
      console.warn('No teams created due to invalid league data');
    }
    return teams;
  } catch (error) {
    console.error('Error seeding teams:', error);
    throw error;
  }
}

// Assign players to teams
async function assignPlayersToTeams(players, teams, leagues) {
  try {
    if (teams.length === 0) {
      console.warn('No teams available for player assignments');
      return;
    }
    const teamAssignments = [];
    const teamUpdates = [];
    const playerUpdates = [];

    // Assign each player to teams from available leagues (up to 2, or fewer if limited)
    for (const player of players) {
      const leagueIndices = faker.helpers.shuffle([...Array(leagues.length).keys()]);
      const maxLeagues = Math.min(leagues.length, 2); // Limit to available leagues
      const selectedLeagues = leagueIndices.slice(0, maxLeagues).map(index => leagues[index]);
      for (const league of selectedLeagues) {
        if (!league || !league.teams || league.teams.length === 0) {
          console.warn(`Skipping team assignment for player ${player._id} in league ${league?.name || 'undefined'}: no teams available`);
          continue;
        }
        const team = league.teams[faker.number.int({ min: 0, max: league.teams.length - 1 })];
        teamAssignments.push({ playerId: player._id, teamId: team, leagueId: league._id });
      }
    }

    // Ensure ~playersPerTeam players per team
    for (const team of teams) {
      const currentMembers = teamAssignments.filter(ta => ta.teamId.toString() === team._id.toString()).length;
      if (currentMembers < config.playersPerTeam) {
        const needed = config.playersPerTeam - currentMembers;
        const availablePlayers = players.filter(
          p =>
            teamAssignments.filter(ta => ta.playerId.toString() === p._id.toString()).length < 2 &&
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

      if (!team || !player || !league) {
        console.warn(`Skipping invalid assignment: team=${team?._id}, player=${player?._id}, league=${league?._id}`);
        continue;
      }

      team.members.push({ player: player._id, role: 'player', isActive: true });
      player.teams.push(team._id);
      if (!player.stats[league.sportType]) {
        player.stats[league.sportType] = initializeStats(league.settings.scoringRules);
      }

      teamUpdates.push({ updateOne: { filter: { _id: team._id }, update: { members: team.members } } });
      playerUpdates.push({ updateOne: { filter: { _id: player._id }, update: { teams: player.teams, stats: player.stats } } });
    }

    // Perform bulk updates
    await Team.bulkWrite(teamUpdates);
    await Player.bulkWrite(playerUpdates);
    console.log(`Assigned ${teamAssignments.length} player-team relationships`);
  } catch (error) {
    console.error('Error assigning players to teams:', error);
    throw error;
  }
}

// Seed games
async function seedGames(leagues, teams, players) {
  try {
    const populatedPlayers = await Player.find({ _id: { $in: players.map(p => p._id) } }).populate('user').lean();
    const games = [];
    const usedMatchups = new Set();
    let gameCount = 0;

    for (const league of leagues) {
      const leagueTeams = teams.filter(t => t.league.toString() === league._id.toString());
      if (leagueTeams.length < 2) {
        console.warn(`Skipping game creation for league ${league.name}: insufficient teams (${leagueTeams.length})`);
        continue;
      }
      for (let i = 0; i < config.gamesPerLeague; i++) {
        const teamIndices = faker.helpers.shuffle([...Array(leagueTeams.length).keys()]);
        const team1 = leagueTeams[teamIndices[0]];
        const team2 = leagueTeams[teamIndices[1]];
        const matchupKey = `${team1._id}-${team2._id}`;
        const reverseMatchupKey = `${team2._id}-${team1._id}`;
        if (team1._id.toString() === team2._id.toString() || usedMatchups.has(matchupKey) || usedMatchups.has(reverseMatchupKey)) {
          i--;
          continue;
        }
        usedMatchups.add(matchupKey);

        const team1Players = faker.helpers.shuffle(team1.members.filter(m => m.isActive)).slice(0, faker.number.int({ min: 5, max: 7 }));
        const team2Players = faker.helpers.shuffle(team2.members.filter(m => m.isActive)).slice(0, faker.number.int({ min: 5, max: 7 }));
        const allPlayers = [...team1Players, ...team2Players];

        // Generate playByPlay to ensure all stat categories are populated for each player
        const playByPlay = [];
        const periods = league.settings.periodType === 'quarters' ? ['Q1', 'Q2', 'Q3', 'Q4'] :
                        league.settings.periodType === 'periods' ? ['P1', 'P2', 'P3'] : ['H1', 'H2'];
        const maxTime = league.settings.periodDuration * 60;
        const sportStats = statRanges[league.sportType] || { points: [0, 5] };
        const statTypes = league.settings.statTypes;

        // Ensure each player has at least one play for each stat type
        for (const member of allPlayers) {
          const player = populatedPlayers.find(p => p._id.toString() === member.player.toString());
          if (!player || !player.user || !player.user.name) {
            console.warn(`Skipping playByPlay for invalid player: ${member.player}`);
            continue;
          }
          for (const statType of statTypes) {
            const [min, max] = sportStats[statType] || [1, 5];
            // Generate 1 to max plays for this stat type
            const numPlays = faker.number.int({ min: 1, max: Math.min(max, 5) });
            for (let j = 0; j < numPlays; j++) {
              playByPlay.push({
                player: member.player,
                playerName: player.user.name,
                team: team1.members.includes(member) ? team1._id : team2._id,
                statType,
                period: periods[faker.number.int({ min: 0, max: periods.length - 1 })],
                time: faker.number.int({ min: 0, max: maxTime }),
                timestamp: new Date(),
              });
            }
          }
        }

        // Add additional random plays for realism
        const additionalEvents = faker.number.int({ min: 10, max: 30 });
        for (let i = 0; i < additionalEvents; i++) {
          const randomPlayer = faker.helpers.arrayElement(allPlayers);
          const randomStat = faker.helpers.arrayElement(statTypes);
          const player = populatedPlayers.find(p => p._id.toString() === randomPlayer.player.toString());
          if (!player || !player.user || !player.user.name) continue;
          playByPlay.push({
            player: randomPlayer.player,
            playerName: player.user.name,
            team: team1.members.includes(randomPlayer) ? team1._id : team2._id,
            statType: randomStat,
            period: periods[faker.number.int({ min: 0, max: periods.length - 1 })],
            time: faker.number.int({ min: 0, max: maxTime }),
            timestamp: new Date(),
          });
        }

        // Initialize playerStats with all stat categories
        const playerStatsMap = {};
        for (const member of allPlayers) {
          const playerId = member.player.toString();
          playerStatsMap[playerId] = {
            player: member.player,
            team: team1.members.includes(member) ? team1._id : team2._id,
            stats: statTypes.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
          };
        }

        // Aggregate playByPlay into playerStats
        for (const play of playByPlay) {
          const playerId = play.player.toString();
          if (!playerStatsMap[playerId]) continue;
          playerStatsMap[playerId].stats[play.statType]++;
        }
        const playerStats = Object.values(playerStatsMap);

        const game = new Game({
          league: league._id,
          season: 'Season 1',
          teams: [team1._id, team2._id],
          teamScores: [
            { team: team1._id, score: 0 },
            { team: team2._id, score: 0 },
          ],
          // date: generateUniqueDate('2025-07-01', '2025-12-31'),
          date: generateUniqueDate(tomorrow, twoMonthsAhead),
          location: faker.location.city(),
          venue: `${faker.company.name()} Arena`,
          venueCapacity: faker.number.int({ min: 5000, max: 20000 }),
          playerStats,
          playByPlay,
          highlights: [faker.lorem.sentence(), faker.lorem.sentence()],
          matchReport: faker.lorem.paragraph(),
          isCompleted: false,
          matchType: 'league',
          weatherConditions: faker.helpers.arrayElement(['Clear', 'Rainy', 'Cloudy', 'Windy']),
          referee: faker.person.fullName(),
          gameDuration: league.settings.periodDuration * (league.settings.periodType === 'quarters' ? 4 : league.settings.periodType === 'periods' ? 3 : 2),
          eventType: 'regular',
          attendance: faker.number.int({ min: 1000, max: 15000 }),
          previousMatchupScore: `${faker.number.int({ min: 0, max: 100 })}-${faker.number.int({ min: 0, max: 100 })}`,
          fanRating: faker.number.int({ min: 1, max: 5 }),
          mediaLinks: [{ url: '', type: '' }],
          gameMVP: allPlayers.length > 0 ? faker.helpers.arrayElement(allPlayers).player : null,
        });

        await game.save(); // Pre-save hook updates playerStats and teamScores
        games.push(game);
        gameCount++;
        logProgress('Creating games', gameCount, leagues.length * config.gamesPerLeague);

        // Update player stats and career averages
        const playerUpdates = [];
        for (const stat of game.playerStats) {
          const player = populatedPlayers.find(p => p._id.toString() === stat.player.toString());
          if (!player) continue;
          if (!player.stats[league.sportType]) {
            player.stats[league.sportType] = initializeStats(league.settings.scoringRules);
          }
          Object.entries(stat.stats).forEach(([key, value]) => {
            player.stats[league.sportType][key] = (player.stats[league.sportType][key] || 0) + value;
          });
          player.gamesPlayed = (player.gamesPlayed || 0) + 1;

          // Update career stats
          const careerStats = {};
          statTypes.forEach(statType => {
            const value = stat.stats[statType] || 0;
            if (statType.includes('point') || statType === 'goals' || statType === 'touchdowns') {
              careerStats.careerAvgPoints = ((player.careerAvgPoints * (player.gamesPlayed - 1)) + value) / player.gamesPlayed;
            }
            if (statType.includes('rebound')) {
              careerStats.careerRebounds = ((player.careerRebounds * (player.gamesPlayed - 1)) + value) / player.gamesPlayed;
            }
            if (statType === 'steal' || statType === 'tackles') {
              careerStats.careerSteals = ((player.careerSteals * (player.gamesPlayed - 1)) + value) / player.gamesPlayed;
            }
            if (value > player.highestScore) {
              careerStats.highestScore = value;
            }
          });

          // Update totalGamesWon
          const teamScore = game.teamScores.find(ts => ts.team.toString() === stat.team.toString()).score;
          const opponentScore = game.teamScores.find(ts => ts.team.toString() !== stat.team.toString()).score;
          if (teamScore > opponentScore) {
            careerStats.totalGamesWon = (player.totalGamesWon || 0) + 1;
          }

          playerUpdates.push({
            updateOne: {
              filter: { _id: player._id },
              update: {
                stats: player.stats,
                gamesPlayed: player.gamesPlayed,
                careerAvgPoints: careerStats.careerAvgPoints || player.careerAvgPoints || 0,
                careerRebounds: careerStats.careerRebounds || player.careerRebounds || 0,
                careerSteals: careerStats.careerSteals || player.careerSteals || 0,
                highestScore: careerStats.highestScore || player.highestScore || 0,
                totalGamesWon: careerStats.totalGamesWon || player.totalGamesWon || 0,
              },
            },
          });
        }
        await Player.bulkWrite(playerUpdates);
      }
    }

    if (games.length === 0) {
      console.warn('No games created due to insufficient teams');
    }
    return games;
  } catch (error) {
    console.error('Error seeding games:', error);
    throw error;
  }
}

// Seed players
async function seedPlayers(members) {
  try {
    const players = [];
    let playerCount = 0;

    for (const user of members) {
      if (!user || !user._id) {
        console.warn(`Skipping player creation for invalid user: ${JSON.stringify(user)}`);
        continue;
      }
      const player = new Player({
        user: user._id,
        teams: [],
        stats: {},
        jerseyNumber: faker.number.int({ min: 1, max: 99 }),
        position: faker.helpers.arrayElement(['Guard', 'Forward', 'Center', 'Midfielder', 'Defender', 'Pitcher', 'Goalkeeper']),
        gamesPlayed: 0,
        performanceRating: 0,
        bio: faker.lorem.sentence(),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 40, mode: 'age' }),
        nationality: faker.location.country(),
        injuries: faker.number.int({ min: 0, max: 1 }) === 1 ? [faker.lorem.word()] : [],
        totalGamesWon: 0,
        highestScore: 0,
        careerAvgPoints: 0,
        careerRebounds: 0,
        careerSteals: 0,
        favoriteTeam: null,
        playerHistory: [
          {
            event: 'Joined',
            description: `Joined the platform`,
            date: new Date(),
          }
        ],
        isActive: true,
        playerRank: 0,
        recentInjuries: faker.number.int({ min: 0, max: 1 }) === 1 ? [{
          injuryDate: faker.date.recent({ days: 30 }),
          injuryType: faker.lorem.word(),
          recoveryStatus: faker.helpers.arrayElement(['Recovering', 'Recovered']),
        }] : [],
      });
      await player.save();
      players.push(player);
      playerCount++;
      logProgress('Creating players', playerCount, members.length);
    }
    return players;
  } catch (error) {
    console.error('Error seeding players:', error);
    throw error;
  }
}

// Main seed function
async function seedDatabase() {
  try {
    await connectDB();
    if (CLEAR_DATABASE) {
      await clearDatabase();
    }
    const users = await seedUsers();
    const admins = users.slice(0, config.numAdmins);
    const members = users.slice(config.numAdmins);
    const leagues = await seedLeagues(admins);
    const players = await seedPlayers(members); // Pass members instead of users
    const teams = await seedTeams(leagues);
    await assignPlayersToTeams(players, teams, leagues);
    await seedGames(leagues, teams, players);
    console.log('Seeding complete');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seed function
seedDatabase().then(() => console.log('Seeding process completed'));

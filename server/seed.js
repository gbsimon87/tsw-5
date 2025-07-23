const mongoose = require('mongoose');
const connectDB = require('./config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');
const { faker } = require('@faker-js/faker');
const User = require('./models/User');
const League = require('./models/League');
const Team = require('./models/Team');
const Player = require('./models/Player');
const Game = require('./models/Game');

// Load the correct .env file based on NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

require('dotenv').config({ path: path.resolve(__dirname, envFile) });

const SMALL_MODE = true;
const CLEAR_DATABASE = true;

// Configuration for seeding
const config = {
  numAdmins: SMALL_MODE ? 1 : 3,
  numUsers: SMALL_MODE ? 20 : 60,
  leaguesPerAdmin: 1,
  teamsPerLeague: SMALL_MODE ? 2 : 6,
  gamesPerLeague: SMALL_MODE ? 5 : 15,
  playersPerTeam: SMALL_MODE ? 10 : 30,
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
const generateUniqueDate = (isPast) => {
  const now = new Date('2025-07-23');
  const from = isPast
    ? new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()) // 6 months ago
    : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // Tomorrow
  const to = isPast
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Today
    : new Date(now.getFullYear(), now.getMonth() + 2, now.getDate()); // 2 months ahead
  let date;
  do {
    date = faker.date.between({ from, to });
  } while (gameDates.has(date.toISOString()));
  gameDates.add(date.toISOString());
  return date;
};

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
        password: hashedPassword,
        givenName,
        familyName,
        picture: '',
        emailVerified: false,
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

// Seed leagues
// This function considers all sports
// async function seedLeagues(admins) {
//   try {
//     const leagues = [];
//     const sportTypes = ['basketball', 'football', 'baseball', 'hockey', 'americanFootball'];
//     let leagueCount = 0;

//     for (const admin of admins) {
//       if (!admin || !admin._id) {
//         console.warn(`Skipping league creation for invalid admin: ${JSON.stringify(admin)}`);
//         continue;
//       }
//       for (let j = 0; j < config.leaguesPerAdmin; j++) {
//         const sportType = sportTypes[faker.number.int({ min: 0, max: sportTypes.length - 1 })];

//         const league = new League({
//           name: `${faker.company.name()} ${sportType.charAt(0).toUpperCase() + sportType.slice(1)} League`,
//           // sportType,
//           sportType: 'basketball',
//           season: 'Season 1',
//           visibility: 'public',
//           logo: '',
//           establishedYear: faker.number.int({ min: 2000, max: 2025 }),
//           isActive: true,
//           location: faker.location.city(),
//           admins: [admin._id],
//           managers: [],
//           teams: [],
//           seasons: [
//             {
//               name: 'Season 1',
//               startDate: new Date('2025-07-01'),
//               endDate: new Date('2025-12-31'),
//               isActive: true,
//             },
//           ],
//           settings: {
//             periodType: sportType === 'basketball' ? 'halves' : sportType === 'hockey' ? 'periods' : 'halves',
//             periodDuration: sportType === 'basketball' ? 24 : sportType === 'hockey' ? 20 : 45,
//             overtimeDuration: sportType === 'football' ? 15 : 5,
//             foulOutLimit: sportType === 'basketball' ? 6 : undefined,
//             scoringRules: scoringRulesMap[sportType] || {},
//             statTypes: (() => {
//               switch (sportType) {
//                 case 'basketball':
//                   return [
//                     'twoPointFGM', 'twoPointFGA', 'threePointFGM', 'threePointFGA',
//                     'freeThrowM', 'freeThrowA', 'offensiveRebound', 'defensiveRebound',
//                     'assist', 'steal', 'turnover', 'block', 'blockedShotAttempt', 'personalFoul',
//                     'teamFoul', 'technicalFoul', 'flagrantFoul', 'drawnFoul'
//                   ];
//                 case 'americanFootball':
//                   return [
//                     'passingYards', 'passingTDs', 'interceptionsThrown',
//                     'rushingYards', 'rushingTDs', 'fumblesLost',
//                     'receptions', 'receivingYards', 'receivingTDs',
//                     'tackles', 'sacks', 'interceptionsCaught',
//                     'fieldGoalsMade', 'fieldGoalsMissed', 'extraPointsMade',
//                     'punts', 'puntYards', 'kickReturns', 'kickReturnYards',
//                     'penalty', 'ejections'
//                   ];
//                 case 'football':
//                   return [
//                     'goals', 'assists', 'shotsOnTarget', 'shotsOffTarget',
//                     'passesCompleted', 'passesAttempted', 'tackles',
//                     'interceptions', 'foulsCommitted', 'yellowCards',
//                     'redCards', 'saves', 'offsides', 'corners', 'clearances',
//                     'ejections', 'penalty'
//                   ];
//                 case 'hockey':
//                   return [
//                     'goals', 'assists', 'shots', 'hits', 'blockedShots',
//                     'faceoffsWon', 'faceoffsLost', 'penaltyMinutes',
//                     'plusMinus', 'takeaways', 'giveaways', 'powerPlayGoals',
//                     'shortHandedGoals', 'gameWinningGoals', 'saves',
//                     'goalsAgainst', 'savePercentage', 'penalty', 'ejections',
//                     'penaltyShots'
//                   ];
//                 case 'baseball':
//                   return [
//                     'atBats', 'hits', 'runs', 'RBIs', 'homeRuns',
//                     'doubles', 'triples', 'walks', 'strikeouts',
//                     'stolenBases', 'caughtStealing', 'inningsPitched',
//                     'earnedRuns', 'pitchesThrown', 'strikesThrown',
//                     'battersFaced', 'fieldingErrors', 'ejections'
//                   ];
//                 default:
//                   return [];
//               }
//             })(),
//           },
//           status: 'active',
//         });
//         await league.save();
//         leagues.push(league);
//         leagueCount++;
//         logProgress('Creating leagues', leagueCount, admins.length * config.leaguesPerAdmin);
//       }
//     }
//     if (leagues.length === 0) {
//       console.warn('No leagues created due to invalid admin data');
//     }
//     return leagues;
//   } catch (error) {
//     console.error('Error seeding leagues:', error);
//     throw error;
//   }
// }

// This function considers just basketball
async function seedLeagues(admins) {
  try {
    const leagues = [];
    let leagueCount = 0;

    for (const admin of admins) {
      if (!admin || !admin._id) {
        console.warn(`Skipping league creation for invalid admin: ${JSON.stringify(admin)}`);
        continue;
      }
      for (let j = 0; j < config.leaguesPerAdmin; j++) {
        const league = new League({
          name: `${faker.company.name()} Basketball League`,
          sportType: 'basketball',
          season: 'Season 1',
          visibility: 'public',
          logo: '',
          establishedYear: faker.number.int({ min: 2000, max: 2025 }),
          isActive: true,
          location: faker.location.city(),
          admins: [admin._id],
          managers: [],
          teams: [],
          seasons: [
            {
              name: 'Season 1',
              startDate: new Date('2025-07-01'),
              endDate: new Date('2025-12-31'),
              isActive: true,
            },
          ],
          settings: defaultLeagueSettings.basketball,
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
          secretKey: generateUniqueSecretKey(),
          logo: `https://placehold.co/600x400`,
          createdBy: league.admins[0],
          isActive: true,
          members: [],
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
        if (team1._id.toString() === team2._id.toString()) {
          console.warn(`Same team selected for game ${i + 1} in league ${league.name}, retrying`);
          i--;
          continue;
        }

        const isPastGame = Math.random() < 0.7;
        const isCompleted = isPastGame;
        const gameDate = generateUniqueDate(isPastGame);

        const team1Players = team1.members.filter(m => m.isActive);
        const team2Players = team2.members.filter(m => m.isActive);
        const allPlayers = [...team1Players, ...team2Players];

        let playByPlay = [];
        let playerStats = [];
        let teamScores = [
          { team: team1._id, score: 0 },
          { team: team2._id, score: 0 },
        ];

        if (isCompleted) {
          const periods = league.settings.periodType === 'quarters' ? ['Q1', 'Q2', 'Q3', 'Q4'] : ['H1', 'H2'];
          const maxTime = league.settings.periodDuration * 60;
          const sportStats = statRanges[league.sportType] || { points: [0, 5] };
          const statTypes = league.settings.statTypes;

          for (const member of allPlayers) {
            const player = populatedPlayers.find(p => p._id.toString() === member.player.toString());
            if (!player || !player.user || !player.user.name) {
              console.warn(`Skipping playByPlay for invalid player: ${member.player}`);
              continue;
            }
            for (const statType of statTypes) {
              const [min, max] = sportStats[statType] || [1, 5];
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

          const playerStatsMap = {};
          for (const member of allPlayers) {
            const playerId = member.player.toString();
            const player = populatedPlayers.find(p => p._id.toString() === playerId);
            if (!player || !player.user || !player.user.name) continue;
            playerStatsMap[playerId] = {
              player: member.player,
              team: team1.members.includes(member) ? team1._id : team2._id,
              stats: statTypes.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
            };
          }

          for (const play of playByPlay) {
            const playerId = play.player.toString();
            if (!playerStatsMap[playerId]) continue;
            playerStatsMap[playerId].stats[play.statType] = (playerStatsMap[playerId].stats[play.statType] || 0) + 1;
          }
          playerStats = Object.values(playerStatsMap);

          const scoringRules = league.settings.scoringRules;
          for (const stat of playerStats) {
            const teamIndex = stat.team.toString() === team1._id.toString() ? 0 : 1;
            teamScores[teamIndex].score += Object.entries(stat.stats).reduce((sum, [key, value]) => {
              return sum + (scoringRules[key] || 0) * (value || 0);
            }, 0);
          }
          if (teamScores[0].score === teamScores[1].score) {
            teamScores[1].score += faker.number.int({ min: 1, max: 5 });
          }
        }

        const game = new Game({
          league: league._id,
          season: 'Season 1',
          teams: [team1._id, team2._id],
          teamScores,
          date: gameDate,
          location: faker.location.city(),
          venue: `${faker.company.name()} Arena`,
          periodType: league.settings.periodType,
          periodDuration: league.settings.periodDuration,
          overtimeDuration: league.settings.overtimeDuration,
          scoringRules: league.settings.scoringRules,
          playerStats,
          playByPlay,
          isCompleted,
          matchType: 'league',
          eventType: 'regular',
          gameDuration: league.settings.periodDuration *
            (league.settings.periodType === 'quarters' ? 4 : 2),
        });

        await game.save();
        games.push(game);
        gameCount++;
        logProgress('Creating games', gameCount, leagues.length * config.gamesPerLeague);
        console.log(`Game ${gameCount} created: ${team1.name} vs ${team2.name}, Date: ${gameDate}, Completed: ${isCompleted}`);

        if (isCompleted) {
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
            playerUpdates.push({
              updateOne: {
                filter: { _id: player._id },
                update: { stats: player.stats },
              },
            });
          }
          await Player.bulkWrite(playerUpdates);
        }
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
        isActive: true
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
    
    const players = await seedPlayers(members);

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
import { useState, useEffect, useCallback } from "react";
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from "react-toastify";

// Utility functions
import { useAuth } from "../../context/AuthContext";
import { startingNumberOfPlayersBySport } from "../../utils/startingNumberOfPlayersBySport";
import { statDisplayMap } from '../../utils/statDisplayMap';
import { formatTime } from '../../utils/formatTime';

// Components
import ScoreBoard from './ScoreBoard';
import ClockControls from "./ClockControls";
import PlayerSelection from "./PlayerSelection";
import ScreenNavigation from "./ScreenNavigation";
import PlayByPlay from "./PlayByPlay";
import BoxScore from "./BoxScore";

// Helper: Get active starters
const getActiveStarters = (team, count) =>
  team?.members?.filter(m => m.isActive && m.role === 'player').slice(0, count).map(r => r.playerId) || [];

// Helper: Get period info
const getPeriodInfo = (settings) => {
  const periodType = settings?.periodType || 'halves';
  const periodOptions = periodType === 'halves' ? ['H1', 'H2'] :
    periodType === 'quarters' ? ['Q1', 'Q2', 'Q3', 'Q4'] :
      ['P1', 'P2', 'P3'];
  return {
    defaultPeriod: periodOptions[0] || 'H1',
    duration: (settings?.periodDuration || 24) * 60,
  };
};

export default function GameTracking() {
  const { leagueId, gameId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState(null);
  const [league, setLeague] = useState(null);
  const [startersCount, setStartersCount] = useState(5);
  const [activePlayersTeam1, setActivePlayersTeam1] = useState([]);
  const [activePlayersTeam2, setActivePlayersTeam2] = useState([]);
  const [selectedPlayersTeam1, setSelectedPlayersTeam1] = useState([]);
  const [selectedPlayersTeam2, setSelectedPlayersTeam2] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [formData, setFormData] = useState({
    score: [],
    gameMVP: '',
    playerStats: {},
  });
  const [playByPlay, setPlayByPlay] = useState([]);
  const [clockState, setClockState] = useState({ running: false, seconds: 0, period: 'H1' });
  const [screen, setScreen] = useState('rosters');
  const [step, setStep] = useState('rosters');
  const [boxScoreTab, setBoxScoreTab] = useState(1);

  useEffect(() => {
    if (!user?.token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [gameRes, leagueRes] = await Promise.all([
          axios.get(`/api/games/${gameId}`, { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get(`/api/leagues/${leagueId}`, { headers: { Authorization: `Bearer ${user.token}` } }),
        ]);

        const gameData = gameRes.data;
        const leagueData = leagueRes.data;
        if (!gameData || !leagueData) throw new Error('Game or league data not found');

        setGame(gameData);
        setLeague(leagueData);

        const startersCount = startingNumberOfPlayersBySport[leagueData?.sportType] || 5;
        setStartersCount(startersCount);
        setActivePlayersTeam1(getActiveStarters(gameData.teams[0], startersCount));
        setActivePlayersTeam2(getActiveStarters(gameData.teams[1], startersCount));

        const team1Roster = (gameData.teams[0]?.members || [])
          .filter(member => member.isActive && member.role === 'player')
          .slice(0, startersCount);
        const team2Roster = (gameData.teams[1]?.members || [])
          .filter(member => member.isActive && member.role === 'player')
          .slice(0, startersCount);

        const team1Active = team1Roster?.map(rosterPlayer => rosterPlayer.playerId);
        const team2Active = team2Roster?.map(rosterPlayer => rosterPlayer.playerId);
        setSelectedPlayersTeam1(team1Active);
        setSelectedPlayersTeam2(team2Active);

        // Initialize score with team order preserved
        const initialScore = gameData.teamScores
          ? gameData.teamScores.map(s => ({
            team: (s.team?._id || s?.team)?.toString(),
            score: s.score || 0,
          }))
          : [
            { team: gameData?.teams[0]?._id?.toString(), score: 0 },
            { team: gameData?.teams[1]?._id?.toString(), score: 0 },
          ];

        setFormData({
          score: initialScore,
          gameMVP: gameData?.gameMVP?._id || '',
          playerStats: gameData?.playerStats?.reduce(
            (acc, stat) => ({
              ...acc,
              [stat.playerId]: stat.stats || {},
            }),
            {}
          ) || {},
        });

        setPlayerStats(gameData?.playerStats || []);
        setPlayByPlay(gameData?.playByPlay || []);

        const { defaultPeriod, duration } = getPeriodInfo(leagueData?.settings);
        if (gameData.playByPlay?.length > 0) {
          const latestEntry = gameData.playByPlay.reduce((latest, entry) =>
            new Date(entry.timestamp) > new Date(latest.timestamp) ? entry : latest,
            gameData.playByPlay[0]
          );
          setClockState({
            running: false,
            seconds: latestEntry.time,
            period: latestEntry.period,
          });
        } else {
          setClockState({ running: false, seconds: duration, period: defaultPeriod });
        }
      } catch (error) {
        toast.error(error.message || "Failed to fetch game or league data", { toastId: 'game-fetch-error' });
        console.error('[useEffect]', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId, leagueId, user?.token]);

  useEffect(() => {
    let interval = null;
    if (clockState.running && clockState.seconds > 0) {
      interval = setInterval(() => {
        setClockState(prev => ({ ...prev, seconds: prev.seconds - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [clockState.running, clockState.seconds]);

  const handleClockToggle = () => {
    setClockState(prev => ({ ...prev, running: !prev.running }));
    toast.info(clockState.running ? 'Clock paused' : 'Clock started', { toastId: 'clock-toggle' });
  };

  const handlePeriodChange = (newPeriod) => {
    const periodDuration = (league?.settings?.periodDuration || 24) * 60;
    const overtimeDuration = (league?.settings?.overtimeDuration || 5) * 60;
    setClockState(prev => ({
      ...prev,
      period: newPeriod,
      seconds: newPeriod.includes('OT') ? overtimeDuration : periodDuration,
      running: false,
    }));
  };

  const handleTimeChange = (newSeconds) => {
    setClockState(prev => ({
      ...prev,
      seconds: newSeconds,
      running: false,
    }));
  };

  const handleScreenChange = useCallback((newScreen) => {
    if (screen === 'subs' && newScreen === 'rosters') {
      if (selectedPlayersTeam1.length > startersCount) {
        toast.error(`You can select up to ${startersCount} players for ${game?.teams[0]?.name || 'Team 1'}`, {
          toastId: 'team1-selection-error',
        });
        return;
      }
      if (selectedPlayersTeam2.length > startersCount) {
        toast.error(`You can select up to ${startersCount} players for ${game?.teams[1]?.name || 'Team 2'}`, {
          toastId: 'team2-selection-error',
        });
        return;
      }
      setActivePlayersTeam1(selectedPlayersTeam1);
      setActivePlayersTeam2(selectedPlayersTeam2);
      toast.success('Substitutions confirmed', { toastId: 'substitution-success' });
    }
    setScreen(newScreen);
    if (newScreen === 'rosters') {
      setStep('rosters');
    }
  }, [screen, selectedPlayersTeam1, selectedPlayersTeam2, league, game]);

  const handleStatIncrement = async (stats, clockStatePeriod = clockState.period) => {
    // console.log('Stats input:', stats);
    const pointValues = game?.scoringRules || league?.settings?.scoringRules || {
      twoPointFGM: 2,
      threePointFGM: 3,
      freeThrowM: 1,
    };

    const newEntries = stats?.map(({ player, statType, time, period }) => {
      const teamId = game?.teams.find(team => team.members.some(m => m.playerId === player.playerId))?._id;
      if (!teamId) {
        console.error(`Team not found for player ${player.playerId}`);
        return null;
      }
      return {
        player: player.playerId,
        playerName: player.name || 'Unknown',
        team: teamId,
        statType,
        period: period || clockStatePeriod,
        time: time != null ? time : clockState.seconds,
        timestamp: new Date(),
      };
    }).filter(entry => entry !== null);

    if (newEntries.length === 0) {
      toast.error('No valid stats to record: Invalid player-team association', { toastId: 'invalid-stat' });
      return;
    }

    setPlayByPlay(prev => [...prev, ...newEntries]);

    setFormData(prev => {
      const updatedStats = { ...prev.playerStats };
      const updatedScore = prev.score.map(s => ({ ...s }));

      newEntries.forEach(({ player, statType, team }) => {
        updatedStats[player] = {
          ...updatedStats[player],
          [statType]: (updatedStats[player]?.[statType] || 0) + 1,
        };

        if (pointValues[statType]) {
          const teamIndex = updatedScore.findIndex(s => s?.team?.toString() === team?.toString());
          if (teamIndex !== -1) {
            updatedScore[teamIndex] = {
              ...updatedScore[teamIndex],
              score: updatedScore[teamIndex].score + pointValues[statType],
            };
          } else {
            console.error(`Team ${team} not found in score array:`, updatedScore);
            updatedScore.push({ team, score: pointValues[statType] });
          }
        }
      });

      // console.log('Updated formData.score:', updatedScore);
      return { ...prev, playerStats: updatedStats, score: updatedScore };
    });

    try {
      const playerStatsPayload = Object.entries(formData.playerStats).map(([playerId, stats]) => ({
        player: playerId,
        team: game?.teams.find(team => team.members.some(m => m.playerId === playerId))?._id || null,
        stats,
      })).filter(payload => payload.team !== null);

      if (!game?.league) {
        toast.error('Cannot update stats: League ID is missing', { toastId: 'league-id-missing' });
        return;
      }

      const response = await axios.patch(
        `/api/games/${gameId}`,
        {
          league: game.league,
          playByPlay: [...playByPlay, ...newEntries],
          playerStats: playerStatsPayload,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Merge the response with the existing game state
      setGame(prev => ({
        ...prev,
        teamScores: response.data.teamScores || prev.teamScores,
        playerStats: response.data.playerStats || prev.playerStats,
        playByPlay: response.data.playByPlay || prev.playByPlay,
      }));

      // console.log('Updated game state after PATCH:', response.data);
      // console.log('Current game state:', game);

      setFormData(prev => {
        const updatedScore = response?.data?.teamScores?.map(s => ({
          team: s?.team?._id || s.team,
          score: s?.score || 0,
        })) || prev.score;
        return {
          ...prev,
          score: updatedScore,
          playerStats: response?.data?.playerStats?.reduce(
            (acc, stat) => ({
              ...acc,
              [stat.playerId]: stat.stats || {},
            }),
            {}
          ) || prev.playerStats,
        };
      });
      setPlayByPlay(response?.data?.playByPlay || []);

      // toast.success('Game stats updated successfully', { toastId: `save-stats-${Date.now()}` });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to save game stats';
      toast.error(errorMessage, { toastId: 'save-stats-error' });
      console.error('[handleStatIncrement]', error);
    }

    const toastMessage = newEntries
      .map(entry => `${statDisplayMap[entry.statType]?.label || entry.statType} for ${entry.playerName}`)
      .join(' and ');
    toast.success(`${toastMessage} at ${formatTime(newEntries[0].time)} in ${newEntries[0].period}`, {
      toastId: `stat-${newEntries[0].player}-${Date.now()}`,
    });
  };

  const filteredPlayers = useCallback(() => {
    let players = [];
    if (boxScoreTab === 0) {
      players = game?.playerStats?.filter(p => p.teamId === game?.teams[0]?._id) || [];
    } else if (boxScoreTab === 2) {
      players = game?.playerStats?.filter(p => p.teamId === game?.teams[1]?._id) || [];
    } else {
      players = game?.playerStats || [];
    }
    return players.slice().sort((a, b) => a.playerName.localeCompare(b.playerName));
  }, [game, boxScoreTab]);

  const boxScoreTabLabels = [
    game?.teams[0]?.name || 'Team 1',
    'All',
    game?.teams[1]?.name || 'Team 2',
  ];

  const renderScreenView = useCallback(() => {
    switch (screen) {
      case 'rosters':
      case 'subs':
        return (
          <PlayerSelection
            teams={game?.teams}
            game={game}
            league={league}
            activePlayersTeam1={activePlayersTeam1}
            activePlayersTeam2={activePlayersTeam2}
            selectedPlayersTeam1={selectedPlayersTeam1}
            selectedPlayersTeam2={selectedPlayersTeam2}
            startersCount={startersCount}
            handlePlayerClick={handleStatIncrement}
            isSubstitutionMode={screen === 'subs'}
            setSelectedPlayersTeam1={setSelectedPlayersTeam1}
            setSelectedPlayersTeam2={setSelectedPlayersTeam2}
            clockState={clockState}
            remainingSeconds={clockState.seconds}
          />
        );
      case 'playByPlay':
        return (
          <PlayByPlay
            playByPlay={playByPlay}
            teams={game?.teams}
            handleDeletePlay={() => { console.log('handleDeletePlay') }}
          />
        );
      case 'boxScore':
        return (
          <BoxScore
            game={game}
            league={league}
            tab={boxScoreTab}
            setTab={setBoxScoreTab}
            boxScoreTabLabels={boxScoreTabLabels}
            filteredPlayers={filteredPlayers()}
            playByPlay={playByPlay}
          />
        );
      default:
        return null;
    }
  }, [screen, game, league, boxScoreTab, filteredPlayers, startersCount, activePlayersTeam1, activePlayersTeam2, selectedPlayersTeam1, selectedPlayersTeam2, playByPlay, clockState.seconds]);

  if (loading) return <div>Loading Game Tracking...</div>;

  return (
    <div>
      <ScoreBoard
        teamScores={formData.score.map(s => {
          const team = game?.teams.find(t => t?._id?.toString() === s?.team?.toString());
          return {
            teamName: team?.name || 'Unknown',
            score: s.score || 0,
          };
        })}
      />
      <div className="bg-white h-[70vh] overflow-y-auto px-2">{renderScreenView()}</div>
      <ClockControls
        clockState={clockState}
        handleClockToggle={handleClockToggle}
        handlePeriodChange={handlePeriodChange}
        handleTimeChange={handleTimeChange}
        periodDuration={(league?.settings?.periodDuration || 24) * 60}
        overtimeDuration={(league?.settings?.overtimeDuration || 5) * 60}
        game={game}
      />
      <ScreenNavigation
        activeScreen={screen}
        onScreenChange={handleScreenChange}
      />
    </div>
  );
}
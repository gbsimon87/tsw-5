import { useState, useEffect, useCallback } from "react";
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from "react-toastify"; // Assuming you use react-toastify

// Utilify functions
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

export default function GameTrackingTwo() {
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
  const [formData, setFormData] = useState({ score: { team1: 0, team2: 0 }, gameMVP: '', playerStats: {} });
  const [playByPlay, setPlayByPlay] = useState([]);
  const [clockState, setClockState] = useState({ running: false, seconds: 0, period: 'H1' });
  const [screen, setScreen] = useState('rosters');
  const [step, setStep] = useState('rosters');
  const [boxScoreTab, setBoxScoreTab] = useState(1);

  useEffect(() => {
    if (!user?.token) return; // Prevent fetch if token is missing

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch game and league in parallel
        const [gameRes, leagueRes] = await Promise.all([
          axios.get(`/api/games/${gameId}`, { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get(`/api/leagues/${leagueId}`, { headers: { Authorization: `Bearer ${user.token}` } }),
        ]);

        const gameData = gameRes.data;
        const leagueData = leagueRes.data;
        if (!gameData || !leagueData) throw new Error('Game or league data not found');

        setGame(gameData);
        setLeague(leagueData);

        // Starters
        const startersCount = startingNumberOfPlayersBySport[leagueData?.sportType] || 5;
        setStartersCount(startersCount);
        setActivePlayersTeam1(getActiveStarters(gameData.teams[0], startersCount));
        setActivePlayersTeam2(getActiveStarters(gameData.teams[1], startersCount));

        // Selected players (for substitutions)
        const team1Roster = (gameData.teams[0]?.members || [])
          .filter(member => member.isActive && member.role === 'player')
          .slice(0, startersCount);

        const team2Roster = (gameData.teams[1]?.members || [])
          .filter(member => member.isActive && member.role === 'player')
          .slice(0, startersCount) || [];

        const team1Active = team1Roster?.map(rosterPlayer => rosterPlayer.playerId);
        const team2Active = team2Roster?.map(rosterPlayer => rosterPlayer.playerId);
        setSelectedPlayersTeam1(team1Active);
        setSelectedPlayersTeam2(team2Active);

        setFormData({
          score: gameData.teamScores || { team1: 0, team2: 0 },
          gameMVP: gameData.gameMVP?.playerId || '',
          playerStats: gameData.playerStats?.reduce(
            (acc, stat) => ({
              ...acc,
              [stat.playerId]: stat.stats || {},
            }),
            {}
          ) || {},
        });

        // Player stats
        setPlayerStats(gameData.playerStats);

        // Play by play
        setPlayByPlay(gameData.playByPlay || []);

        // Clock
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
          toast.info(`Clock initialized to ${latestEntry.period} at ${formatTime(latestEntry.time)}`, {
            toastId: 'clock-init',
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

    // Optional: cleanup if you add subscriptions or timers

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

  // Clock functions
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
    if (screen === 'substitutions' && newScreen === 'rosters') {

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

  const handleStatIncrement = (stats) => {
    const newEntries = stats?.map(({ player, statType, time, period }) => {
      const teamId = game?.teams.find(team => team.members.some(m => m.playerId === player.playerId))?._id;
      return {
        player: player.playerId,
        playerName: player.name || 'Unknown',
        team: teamId,
        statType,
        period: period || clockState.period,
        time: time != null ? time : clockState.seconds,
        timestamp: new Date(),
      };
    });

    setPlayByPlay(prev => [...prev, ...newEntries]);

    setFormData(prev => {
      const updatedStats = { ...prev.playerStats };
      newEntries.forEach(({ player, statType }) => {
        updatedStats[player] = {
          ...updatedStats[player],
          [statType]: (updatedStats[player]?.[statType] || 0) + 1,
        };
      });
      return { ...prev, playerStats: updatedStats };
    });

    const toastMessage = newEntries
      ?.map(entry => `${statDisplayMap[entry.statType]?.label || entry.statType} for ${entry.playerName}`)
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
      case 'substitutions':
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
            isSubstitutionMode={screen === 'substitutions'}
            setSelectedPlayersTeam1={setSelectedPlayersTeam1}
            setSelectedPlayersTeam2={setSelectedPlayersTeam2}
          />
        );
      case 'playByPlay':
        return (
          <PlayByPlay
            playByPlay={playByPlay}
            teams={game?.teams}
            // handleDeletePlay={handleDeletePlay}
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
  }, [screen, game, league, boxScoreTab, filteredPlayers, startersCount, activePlayersTeam1, activePlayersTeam2, selectedPlayersTeam1, selectedPlayersTeam2, playByPlay]);

  // Debug log
  console.log({ game, league, activePlayersTeam1, activePlayersTeam2, playerStats });

  if (loading) return <div>Loading Game Tracking...</div>;

  return (
    <div>
      <ScoreBoard teamScores={game?.teamScores} />
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

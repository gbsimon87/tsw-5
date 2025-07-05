import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { startingNumberOfPlayersBySport } from '../../utils/startingNumberOfPlayersBySport';
import { toast } from 'react-toastify';
import ScoreBoard from './ScoreBoard';
import BoxScore from './BoxScore';
import PlayerSelection from './PlayerSelection';
import ScreenNavigation from './ScreenNavigation';
import ClockControls from './ClockControls';

export default function GameTracking() {
  const { leagueId, gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [screen, setScreen] = useState('rosters');
  const [step, setStep] = useState('rosters');
  const [league, setLeague] = useState(null);
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [formData, setFormData] = useState({ score: { team1: 0, team2: 0 }, gameMVP: '', playerStats: {} });
  const [lastChange, setLastChange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boxScoreTab, setBoxScoreTab] = useState(1);
  const [activePlayersTeam1, setActivePlayersTeam1] = useState([]);
  const [activePlayersTeam2, setActivePlayersTeam2] = useState([]);
  const [selectedPlayersTeam1, setSelectedPlayersTeam1] = useState([]);
  const [selectedPlayersTeam2, setSelectedPlayersTeam2] = useState([]);
  const [clockState, setClockState] = useState({ running: false, seconds: 0, period: 'H1' });
  const [playByPlay, setPlayByPlay] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [gameResponse, leagueResponse] = await Promise.all([
          axios.get(`/api/games/${gameId}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`/api/leagues/${leagueId}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        const gameData = gameResponse.data;
        const leagueData = leagueResponse.data;

        if (!gameData || !leagueData) {
          throw new Error('Game or league data not found');
        }

        setGame(gameData);
        setLeague(leagueData);

        const startersCount = startingNumberOfPlayersBySport[leagueData?.sportType] || 5;
        const team1Roster = gameData.teams[0]?.members
          .filter(member => member.isActive)
          .slice(0, startersCount) || [];
        const team2Roster = gameData.teams[1]?.members
          .filter(member => member.isActive)
          .slice(0, startersCount) || [];
        const team1Active = team1Roster.map(r => r.playerId);
        const team2Active = team2Roster.map(r => r.playerId);
        setActivePlayersTeam1(team1Active);
        setActivePlayersTeam2(team2Active);
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

        setPlayByPlay(gameData.playByPlay || []);

        // Initialize clockState based on playByPlay or league settings
        const periodType = leagueData?.settings?.periodType || 'halves';
        const periodOptions = periodType === 'halves' ? ['H1', 'H2'] :
          periodType === 'quarters' ? ['Q1', 'Q2', 'Q3', 'Q4'] :
            ['P1', 'P2', 'P3'];
        const defaultPeriod = periodOptions[0] || 'H1';
        const duration = (leagueData?.settings?.periodDuration || 24) * 60;

        if (gameData.playByPlay?.length > 0) {
          const latestEntry = gameData.playByPlay.reduce((latest, entry) => {
            return new Date(entry.timestamp) > new Date(latest.timestamp) ? entry : latest;
          }, gameData.playByPlay[0]);
          setClockState({
            running: false,
            seconds: latestEntry.time,
            period: latestEntry.period,
          });
          toast.info(`Clock initialized to ${latestEntry.period} at ${formatTime(latestEntry.time)}`, {
            toastId: 'clock-init',
          });
        } else {
          setClockState({
            running: false,
            seconds: duration,
            period: defaultPeriod,
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Fetch data error:', err);
        toast.error(err.message || 'Failed to fetch data', { toastId: 'fetch-error' });
        setLoading(false);
      }
    };
    fetchData();
  }, [gameId, leagueId, user.token]);

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

  const handleStatIncrement = (playerId, teamId, statType) => {
    const newEntry = {
      player: playerId,
      team: teamId,
      statType,
      period: clockState.period,
      time: clockState.seconds,
      timestamp: new Date(),
    };
    setLastChange(newEntry);
    setPlayByPlay(prev => [...prev, newEntry]);
    setFormData(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        [playerId]: {
          ...prev.playerStats[playerId],
          [statType]: (prev.playerStats[playerId]?.[statType] || 0) + 1,
        },
      },
    }));
    const player = game?.teams
      .flatMap(team => team.members)
      .find(p => p.playerId === playerId);
    toast.success(`${statType} recorded for ${player?.name || 'Unknown'} at ${formatTime(clockState.seconds)} in ${clockState.period}`, {
      toastId: `stat-${playerId}-${Date.now()}`,
    });
  };

  const handleUndo = () => {
    if (lastChange) {
      setPlayByPlay(prev => prev.filter(entry => entry !== lastChange));
      setFormData(prev => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          [lastChange.playerId]: {
            ...prev.playerStats[lastChange.playerId],
            [lastChange.statType]: Math.max(0, (prev.playerStats[lastChange.playerId]?.[lastChange.statType] || 0) - 1),
          },
        },
      }));
      setLastChange(null);
      toast.info('Stat entry undone', { toastId: 'undo-stat' });
    }
  };

  const handleSave = async () => {
    try {
      await axios.patch(
        `/api/games/${gameId}`,
        {
          score: formData.score,
          gameMVP: formData.gameMVP || null,
          playerStats: Object.entries(formData.playerStats).map(([playerId, stats]) => ({ playerId, stats })),
          playByPlay,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Game data saved successfully', { toastId: 'save-success' });
    } catch (err) {
      toast.error('Failed to update game', { toastId: 'save-error' });
    }
  };

  const handleScreenChange = useCallback((newScreen) => {
    if (screen === 'substitutions' && newScreen === 'rosters') {
      const startersCount = startingNumberOfPlayersBySport[league?.sportType] || 5;
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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const boxScoreTabLabels = [
    game?.teams[0]?.name || 'Team 1',
    'All',
    game?.teams[1]?.name || 'Team 2',
  ];

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

  const startersCount = startingNumberOfPlayersBySport[league?.sportType] || 5;

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
            handlePlayerClick={(player, statType) => {
              if (statType) {
                const teamId = game?.teams.find(team => team.members.some(m => m.playerId === player.playerId))?._id;
                handleStatIncrement(player.playerId, teamId, statType);
              } else {
                setActivePlayerId(player.playerId);
              }
            }}
            handleKeyDown={(e, callback) => {
              if (e.key === 'Enter' || e.key === ' ') callback();
            }}
            hasGameStarted={game?.isCompleted !== true}
            remainingSeconds={game?.gameDuration || 0}
            isSubstitutionMode={screen === 'substitutions'}
            setSelectedPlayersTeam1={setSelectedPlayersTeam1}
            setSelectedPlayersTeam2={setSelectedPlayersTeam2}
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

  if (loading) return <div>Loading Game Tracking...</div>;

  return (
    // <div className="min-h-screen bg-gray-50">
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
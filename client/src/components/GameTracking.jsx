import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function GameTracking() {
  const { leagueId, gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [league, setLeague] = useState(null);
  const [players, setPlayers] = useState([]);
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [formData, setFormData] = useState({ score: { team1: 0, team2: 0 }, gameMVP: '', playerStats: {} });
  const [lastChange, setLastChange] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log({ league })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gameResponse, leagueResponse] = await Promise.all([
          axios.get(`/api/games/${gameId}`, { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get(`/api/leagues/${leagueId}`, { headers: { Authorization: `Bearer ${user.token}` } }),
        ]);
        const gameData = gameResponse.data;
        const leagueData = leagueResponse.data;
        setGame(gameData);
        setLeague(leagueData);

        const allPlayers = [
          ...(await axios.get(`/api/players?teamId=${gameData.teams[0]._id}`, { headers: { Authorization: `Bearer ${user.token}` } })).data || [],
          ...(await axios.get(`/api/players?teamId=${gameData.teams[1]._id}`, { headers: { Authorization: `Bearer ${user.token}` } })).data || [],
        ];
        setPlayers(allPlayers);
        // setActivePlayerId(allPlayers[0]?._id);
        setFormData({
          score: gameData.score || { team1: 0, team2: 0 },
          gameMVP: gameData.gameMVP?._id || '',
          playerStats: gameData.playerStats?.reduce((acc, stat) => ({ ...acc, [stat.player]: stat.stats || {} }), {}) || {},
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    };
    fetchData();
  }, [gameId, leagueId, user.token]);

  const handleStatIncrement = (statType) => {
    if (!activePlayerId) return;
    const change = { playerId: activePlayerId, statType, value: 1 };
    setLastChange(change);
    setFormData(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        [activePlayerId]: {
          ...prev.playerStats[activePlayerId],
          [statType]: (prev.playerStats[activePlayerId]?.[statType] || 0) + 1,
        },
      },
    }));
  };

  const handleUndo = () => {
    if (lastChange) {
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
    }
  };

  const handleSave = async () => {
    try {
      await axios.patch(`/api/games/${gameId}`, {
        score: formData.score,
        gameMVP: formData.gameMVP || null,
        playerStats: Object.entries(formData.playerStats).map(([player, stats]) => ({ player, stats })),
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      setError(null);
      setLastChange(null); // Clear undo stack on save
    } catch (err) {
      setError('Failed to update game');
    }
  };

  // Map statTypes to display names and abbreviations for UI
  const statDisplayMap = {
    // Basketball
    twoPointFGM: { label: '2PT FG', abbr: '2PT' },
    twoPointFGA: { label: '2PT FG Attempt', abbr: '2PTA' },
    threePointFGM: { label: '3PT FG', abbr: '3PT' },
    threePointFGA: { label: '3PT FG Attempt', abbr: '3PTA' },
    freeThrowM: { label: 'FT Made', abbr: 'FTM' },
    freeThrowA: { label: 'FT Attempt', abbr: 'FTA' },
    offensiveRebound: { label: 'Off Reb', abbr: 'ORB' },
    defensiveRebound: { label: 'Def Reb', abbr: 'DRB' },
    assist: { label: 'Assist', abbr: 'AST' },
    steal: { label: 'Steal', abbr: 'STL' },
    turnover: { label: 'Turnover', abbr: 'TO' },
    block: { label: 'Block', abbr: 'BLK' },
    personalFoul: { label: 'Foul', abbr: 'PF' },
    teamFoul: { label: 'Team Foul', abbr: 'TF' },
    technicalFoul: { label: 'Tech Foul', abbr: 'TF' },
    flagrantFoul: { label: 'Flag Foul', abbr: 'FF' },

    // American Football
    passingYards: { label: 'Pass Yards', abbr: 'PY' },
    passingTDs: { label: 'Pass TDs', abbr: 'PTD' },
    interceptionsThrown: { label: 'INT Thrown', abbr: 'INT' },
    rushingYards: { label: 'Rush Yards', abbr: 'RY' },
    rushingTDs: { label: 'Rush TDs', abbr: 'RTD' },
    fumblesLost: { label: 'Fumbles Lost', abbr: 'FUM' },
    receptions: { label: 'Receptions', abbr: 'REC' },
    receivingYards: { label: 'Recv Yards', abbr: 'RECY' },
    receivingTDs: { label: 'Recv TDs', abbr: 'RECTD' },
    tackles: { label: 'Tackles', abbr: 'TCK' },
    sacks: { label: 'Sacks', abbr: 'SCK' },
    interceptionsCaught: { label: 'INTs Caught', abbr: 'INTC' },
    fieldGoalsMade: { label: 'FG Made', abbr: 'FGM' },
    fieldGoalsMissed: { label: 'FG Missed', abbr: 'FGX' },
    extraPointsMade: { label: 'XP Made', abbr: 'XPM' },
    punts: { label: 'Punts', abbr: 'PNT' },
    puntYards: { label: 'Punt Yards', abbr: 'PTY' },
    kickReturns: { label: 'Kick Returns', abbr: 'KR' },
    kickReturnYards: { label: 'KR Yards', abbr: 'KRY' },

    // Soccer (Football)
    goals: { label: 'Goals', abbr: 'G' },
    assists: { label: 'Assists', abbr: 'A' },
    shotsOnTarget: { label: 'Shots on Target', abbr: 'SOT' },
    shotsOffTarget: { label: 'Shots off Target', abbr: 'SOF' },
    passesCompleted: { label: 'Passes Completed', abbr: 'PC' },
    passesAttempted: { label: 'Passes Attempted', abbr: 'PA' },
    foulsCommitted: { label: 'Fouls', abbr: 'F' },
    yellowCards: { label: 'Yellow Cards', abbr: 'YC' },
    redCards: { label: 'Red Cards', abbr: 'RC' },
    saves: { label: 'Saves', abbr: 'SV' },
    offsides: { label: 'Offsides', abbr: 'OFF' },
    corners: { label: 'Corners', abbr: 'CK' },
    clearances: { label: 'Clearances', abbr: 'CLR' },

    // Hockey
    shots: { label: 'Shots', abbr: 'S' },
    hits: { label: 'Hits', abbr: 'H' },
    blockedShots: { label: 'Blocked Shots', abbr: 'BS' },
    faceoffsWon: { label: 'Faceoffs Won', abbr: 'FOW' },
    faceoffsLost: { label: 'Faceoffs Lost', abbr: 'FOL' },
    penaltyMinutes: { label: 'Penalty Minutes', abbr: 'PIM' },
    plusMinus: { label: '+/-', abbr: '+/-' },
    takeaways: { label: 'Takeaways', abbr: 'TK' },
    giveaways: { label: 'Giveaways', abbr: 'GV' },
    powerPlayGoals: { label: 'PP Goals', abbr: 'PPG' },
    shortHandedGoals: { label: 'SH Goals', abbr: 'SHG' },
    gameWinningGoals: { label: 'GW Goals', abbr: 'GWG' },
    goalsAgainst: { label: 'Goals Against', abbr: 'GA' },
    savePercentage: { label: 'Save %', abbr: 'SV%' },

    // Baseball
    atBats: { label: 'At Bats', abbr: 'AB' },
    runs: { label: 'Runs', abbr: 'R' },
    RBIs: { label: 'RBIs', abbr: 'RBI' },
    homeRuns: { label: 'HRs', abbr: 'HR' },
    doubles: { label: 'Doubles', abbr: '2B' },
    triples: { label: 'Triples', abbr: '3B' },
    walks: { label: 'Walks', abbr: 'BB' },
    strikeouts: { label: 'Strikeouts', abbr: 'K' },
    stolenBases: { label: 'Stolen Bases', abbr: 'SB' },
    caughtStealing: { label: 'Caught Stealing', abbr: 'CS' },
    inningsPitched: { label: 'Innings Pitched', abbr: 'IP' },
    earnedRuns: { label: 'Earned Runs', abbr: 'ER' },
    pitchesThrown: { label: 'Pitches Thrown', abbr: 'PIT' },
    strikesThrown: { label: 'Strikes Thrown', abbr: 'STR' },
    battersFaced: { label: 'Batters Faced', abbr: 'BF' },
    fieldingErrors: { label: 'Fielding Errors', abbr: 'E' },
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Define number of starting players per sport
  const startingPlayersBySport = {
    basketball: 5,
    football: 11,
    americanFootball: 11,
    baseball: 9,
    hockey: 6,
  };

  // Get the number of starters based on the sport
  const startersCount = startingPlayersBySport[league?.sportType] || 5; // fallback to 5 if unknown

  console.log(startersCount);

  const uniquePlayersByTeam = (teamId) => {
    const seen = new Set();
    const filtered = players.filter(player => {
      const isOnTeam = player.teams?.some(team => team._id === teamId);
      const isUnique = !seen.has(player._id);
      if (isOnTeam && isUnique) {
        seen.add(player._id);
        return true;
      }
      return false;
    });
    return filtered.slice(0, startersCount);
  };

  const team1Players = uniquePlayersByTeam(game?.teams?.[0]?._id);
  const team2Players = uniquePlayersByTeam(game?.teams?.[1]?._id);

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <header className="flex justify-between items-center p-2 bg-white shadow mb-2">
        <h1 className="text-lg font-bold">{game.teams[0]?.name} vs {game.teams[1]?.name}</h1>
        <button onClick={() => navigate(`/leagues/${leagueId}/games`)} className="p-1">
          <ArrowLeftIcon className="w-6 h-6 text-blue-600" />
        </button>
      </header>
      <div className="flex justify-between mb-2 gap-2">
        <div className="flex-1 flex flex-col space-y-2 pb-2 mb-2">
          {team1Players.map(player => (
            <button
              key={player._id}
              onClick={() => setActivePlayerId(player._id)}
              className={`flex items-center p-2 bg-white border rounded w-full ${activePlayerId === player._id ? 'border-blue-600' : 'border-gray-200'
                }`}
            >
              <div className="w-6 h-6 mr-1">
                {player.user?.picture ? (
                  <img src={player.user.picture} alt={player.user.name} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center" />
                )}
              </div>
              <span className="text-left text-xs">{player.user?.name}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 flex flex-col space-y-2 pb-2 mb-2">
          {team2Players.map(player => (
            <button
              key={player._id}
              onClick={() => setActivePlayerId(player._id)}
              className={`flex items-center p-2 bg-white border rounded w-full ${activePlayerId === player._id ? 'border-blue-600' : 'border-gray-200'
                }`}
            >
              <div className="w-6 h-6 mr-1">
                {player.user?.picture ? (
                  <img src={player.user.picture} alt={player.user.name} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center" />
                )}
              </div>
              <span className="text-left text-xs">{player.user?.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-2 grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
        {league?.settings?.statTypes?.map(statType => {
          const display = statDisplayMap[statType] || { label: `+1 ${statType}`, abbr: statType };
          return (
            <button
              key={statType}
              onClick={() => handleStatIncrement(statType)}
              className="bg-blue-500 text-white p-2 rounded text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {display.label}
            </button>
          );
        })}
      </div>
      <div className="fixed bottom-2 w-[calc(100%-16px)] flex justify-between p-2">
        <button
          onClick={handleUndo}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-400"
          disabled={!lastChange}
        >
          Undo
        </button>
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded shadow flex items-center gap-1 hover:bg-green-700"
        >
          <CheckIcon className="w-5 h-5" /> Save
        </button>
      </div>
    </div>
  );
}
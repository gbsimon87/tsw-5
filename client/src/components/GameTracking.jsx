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
    goal: { label: 'Goal', abbr: 'G' },
    single: { label: 'Single', abbr: '1B' },
    double: { label: 'Double', abbr: '2B' },
    triple: { label: 'Triple', abbr: '3B' },
    homeRun: { label: 'Home Run', abbr: 'HR' },
    touchdown: { label: 'TD', abbr: 'TD' },
    fieldGoal: { label: 'FG', abbr: 'FG' },
    extraPoint: { label: 'Extra Pt', abbr: 'XP' },
    twoPointConversion: { label: '2PT Conv', abbr: '2PC' },
    safety: { label: 'Safety', abbr: 'S' },
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // console.log(game.teams)
  console.log({players});

  const team1Players = players.filter(player =>
    player.teams?.some(team => team._id === game?.teams?.[0]?._id)
  );
  const team2Players = players.filter(player =>
    player.teams?.some(team => team._id === game?.teams?.[1]?._id)
  );

  console.log({ team1Players, team2Players });

    console.log(game?.teams?.[0])


  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <header className="flex justify-between items-center p-2 bg-white shadow mb-2">
        <h1 className="text-lg font-bold">{game.teams[0]?.name} vs {game.teams[1]?.name}</h1>
        <button onClick={() => navigate(`/leagues/${leagueId}/games`)} className="p-1">
          <ArrowLeftIcon className="w-6 h-6 text-blue-600" />
        </button>
      </header>
      <div className="mb-2">
        <div className="flex overflow-x-auto space-x-2 pb-2 mb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {team1Players.map(player => (
            <button
              key={player._id}
              onClick={() => setActivePlayerId(player._id)}
              className={`flex items-center p-2 bg-white border rounded ${activePlayerId === player._id ? 'border-blue-600' : 'border-gray-200'}`}
            >
              <div className="w-6 h-6 mr-1">
                {player.user?.picture ? (
                  <img src={player.user.picture} alt={player.user.name} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  </div>
                )}
              </div>
              <span className="text-xs">{player.user?.name}</span>
            </button>
          ))}
        </div>
        <div className="flex overflow-x-auto space-x-2 pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {team2Players.map(player => (
            <button
              key={player._id}
              onClick={() => setActivePlayerId(player._id)}
              className={`flex items-center p-2 bg-white border rounded ${activePlayerId === player._id ? 'border-blue-600' : 'border-gray-200'}`}
            >
              <div className="w-6 h-6 mr-1">
                {player.user?.picture ? (
                  <img src={player.user.picture} alt={player.user.name} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  </div>
                )}
              </div>
              <span className="text-xs">{player.user?.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white p-2 grid grid-cols-3 md:grid-cols-4 gap-1 mb-2">
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
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { 
  ClipboardList, 
  BarChart3, 
  Download,
  Loader2 
} from "lucide-react";
import useApi from "../../hooks/useApi";

const ViewAllInputs = () => {
  const api = useApi();
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState("");
  const [roundNumber, setRoundNumber] = useState(1);
  const [inputs, setInputs] = useState([]);
  const [allRoundsData, setAllRoundsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gameData, setGameData] = useState(null);
  const [viewMode, setViewMode] = useState('single');

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      fetchGameDetails(selectedGame);
    } else {
      setGameData(null);
      setInputs([]);
      setAllRoundsData([]);
    }
  }, [selectedGame]);

  const fetchGames = async () => {
    try {
      const response = await api.get("/admin/games");
      setGames(response.data.games);
    } catch (error) {
      toast.error("Failed to load games");
    }
  };

  const fetchGameDetails = async (gameId) => {
    try {
      const response = await api.get("/admin/games");
      const game = response.data.games.find((g) => g._id === gameId);
      setGameData(game);
    } catch (error) {
      toast.error("Failed to load game details");
    }
  };

  const fetchInputs = async () => {
    if (!selectedGame) {
      toast.error("Please select a game first");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(`Loading Round ${roundNumber} inputs...`);

    try {
      const response = await api.get("/admin/round/inputs", {
        params: {
          game_id: selectedGame,
          round_number: roundNumber,
        },
      });

      setInputs(response.data.inputs);
      setViewMode('single');

      if (response.data.inputs.length === 0) {
        toast.update(toastId, {
          render: `No inputs submitted for Round ${roundNumber}`,
          type: "info",
          isLoading: false,
          autoClose: 4000,
        });
      } else {
        toast.update(toastId, {
          render: `${response.data.inputs.length} inputs loaded`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to fetch inputs",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRoundsData = async () => {
    if (!selectedGame) {
      toast.error("Please select a game first");
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Loading all rounds data...');

    try {
      const roundsResponse = await api.get("/admin/rounds", {
        params: { game_id: selectedGame }
      });

      const rounds = roundsResponse.data.rounds;
      const allInputs = [];

      for (const round of rounds) {
        try {
          const response = await api.get("/admin/round/inputs", {
            params: {
              game_id: selectedGame,
              round_number: round.round_number,
            },
          });

          response.data.inputs.forEach(input => {
            allInputs.push({
              ...input,
              round_number: round.round_number,
              round_status: round.status
            });
          });
        } catch (error) {
          console.warn(`No inputs for round ${round.round_number}`);
        }
      }

      setAllRoundsData(allInputs);
      setViewMode('all');
      
      toast.update(toastId, {
        render: `${allInputs.length} inputs across ${rounds.length} rounds loaded`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });
    } catch (error) {
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to fetch all rounds data",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadSingleRoundCSV = () => {
    if (inputs.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const headers = ['Team', 'Supplier_Price_ps', 'Consumer_Price_pc', 'Profit_Margin', 'Submitted_At'];
    const csvRows = [
      headers.join(','),
      ...inputs.map(input => {
        const profit = (input.p_c || 0) - (input.p_s || 0);
        return [
          `"${input.team_id}"`,
          input.p_s?.toFixed(2) || 0,
          input.p_c?.toFixed(2) || 0,
          profit.toFixed(2),
          `"${input.submitted_at ? new Date(input.submitted_at).toISOString() : ''}"`
        ].join(',');
      })
    ].join('\n');

    downloadCSV(csvRows, `game-${selectedGame}-round-${roundNumber}-inputs.csv`);
  };

  const downloadAllRoundsCSV = () => {
    if (allRoundsData.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const headers = ['Round', 'Round_Status', 'Team', 'Supplier_Price_ps', 'Consumer_Price_pc', 'Profit_Margin', 'Submitted_At'];
    const csvRows = [
      headers.join(','),
      ...allRoundsData.map(input => {
        const profit = (input.p_c || 0) - (input.p_s || 0);
        return [
          input.round_number,
          `"${input.round_status}"`,
          `"${input.team_id}"`,
          input.p_s?.toFixed(2) || 0,
          input.p_c?.toFixed(2) || 0,
          profit.toFixed(2),
          `"${input.submitted_at ? new Date(input.submitted_at).toISOString() : ''}"`
        ].join(',');
      })
    ].join('\n');

    downloadCSV(csvRows, `game-${selectedGame}-all-rounds-inputs.csv`);
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Data exported to CSV!');
  };

  const getStatusColor = (input) => {
    if (!input.p_s || !input.p_c) return "gray";
    const profit = input.p_c - input.p_s;
    return profit > 10 ? "emerald" : profit > 0 ? "amber" : "red";
  };

  const currentData = viewMode === 'single' ? inputs : allRoundsData;
  const isAllRoundsView = viewMode === 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 p-6 bg-slate-800/30 rounded-xl border border-slate-600">
          <Loader2 className="w-8 h-8 border-emerald-400/50 border-t-emerald-400 animate-spin" />
          <span className="text-lg font-medium text-slate-300">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3 p-6 bg-slate-800/20 rounded-xl border border-slate-700/50">
        <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <ClipboardList className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">View Team Inputs</h2>
          <p className="text-slate-400 text-sm">Monitor pricing decisions across all teams</p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GAME SELECTOR */}
        <div className="bg-slate-800/20 rounded-xl p-6 border border-slate-700/50">
          <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Competition
          </label>
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-slate-600/50 rounded-xl text-white font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition-all text-sm"
            disabled={loading}
          >
            <option className="bg-slate-800" value="">-- Select Game --</option>
            {games.map((game) => (
              <option className="bg-slate-800" key={game._id} value={game._id}>
                {game.game_name}
              </option>
            ))}
          </select>
        </div>

        {/* GAME INFO */}
        {selectedGame && gameData && (
          <div className="lg:col-span-2 bg-linear-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{gameData.game_name}</h3>
                <p className="text-slate-300 text-sm">Teams: {gameData.number_of_teams} | Rounds: {gameData.number_of_rounds}</p>
              </div>
            </div>
          </div>
        )}

        {/* ROUND SELECTOR + BUTTONS */}
        {selectedGame && (
          <div className="bg-slate-800/20 rounded-xl p-6 border border-slate-700/50">
            <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
              {isAllRoundsView ? 'All Rounds' : 'Round Number'}
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              {!isAllRoundsView && (
                <input
                  type="number"
                  min="1"
                  max={gameData?.number_of_rounds || 20}
                  value={roundNumber}
                  onChange={(e) => setRoundNumber(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-4 py-3 bg-white/10 border border-slate-600/50 rounded-xl text-white font-mono text-center focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition-all text-sm"
                  disabled={loading}
                />
              )}
              
              <div className="flex gap-3 flex-1 sm:flex-none">
                <button
                  onClick={fetchInputs}
                  disabled={!selectedGame || loading}
                  className="flex-1 px-4 py-3 bg-blue-500/90 hover:bg-blue-600 text-white font-semibold rounded-xl border border-blue-400/50 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ClipboardList className="w-4 h-4" />
                      Single Round
                    </>
                  )}
                </button>
                <button
                  onClick={fetchAllRoundsData}
                  disabled={!selectedGame || loading}
                  className="px-4 py-3 bg-emerald-500/90 hover:bg-emerald-600 text-white font-semibold rounded-xl border border-emerald-400/50 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <BarChart3 className="w-4 h-4" />
                  All Rounds
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DATA TABLE */}
      {currentData.length > 0 && (
        <div className="bg-slate-800/20 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="flex items-center justify-between p-6 bg-slate-800/30 border-b border-slate-700">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              {isAllRoundsView ? (
                <>
                  <BarChart3 className="w-5 h-5" />
                  All Rounds Data
                </>
              ) : (
                <>
                  <ClipboardList className="w-5 h-5" />
                  Round {roundNumber} Pricing Decisions
                </>
              )}
              <span className="text-sm text-slate-400 font-medium">({currentData.length} records)</span>
            </h3>
            <button
              onClick={isAllRoundsView ? downloadAllRoundsCSV : downloadSingleRoundCSV}
              className="px-4 py-2 bg-emerald-500/90 hover:bg-emerald-600 text-white font-medium rounded-lg border border-emerald-400/50 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2"
              disabled={loading}
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700">
                  {isAllRoundsView && (
                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Round</th>
                  )}
                  <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Team</th>
                  <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Supplier (p_s)</th>
                  <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Consumer (p_c)</th>
                  <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Profit</th>
                  {isAllRoundsView && (
                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                  )}
                  <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {currentData.map((input) => {
                  const profit = (input.p_c || 0) - (input.p_s || 0);
                  const statusColor = getStatusColor(input);

                  return (
                    <tr key={input._id} className="hover:bg-slate-700/30 transition-colors">
                      {isAllRoundsView && (
                        <td className="py-4 px-4 font-mono text-sm font-semibold text-white">
                          R{input.round_number}
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            input.round_status === 'OPEN' ? 'bg-emerald-500/20 text-emerald-300' :
                            input.round_status === 'LOCKED' ? 'bg-amber-500/20 text-amber-300' :
                            input.round_status === 'COMPUTED' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {input.round_status}
                          </span>
                        </td>
                      )}
                      <td className="py-4 px-4 font-mono text-lg font-semibold text-white">
                        {input.team_id}
                      </td>
                      <td className="py-4 px-4 font-mono text-lg font-semibold text-slate-200">
                        ${input.p_s?.toFixed(2) || "—"}
                      </td>
                      <td className="py-4 px-4 font-mono text-lg font-semibold text-slate-200">
                        ${input.p_c?.toFixed(2) || "—"}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          statusColor === "emerald" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
                          statusColor === "amber" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                          "bg-red-500/20 text-red-300 border border-red-500/40"
                        }`}>
                          ${profit.toFixed(2)}
                        </span>
                      </td>
                      {isAllRoundsView && (
                        <td className="py-4 px-4 text-xs text-slate-400">
                          {input.round_status}
                        </td>
                      )}
                      <td className="py-4 px-4 text-sm text-slate-400">
                        {input.submitted_at ? new Date(input.submitted_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPTY STATES */}
      {selectedGame && currentData.length === 0 && !loading && (
        <div className="text-center py-16 bg-slate-800/20 rounded-xl border border-slate-700/50 p-8">
          <div className="w-20 h-20 bg-linear-to-br from-slate-500 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ClipboardList className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-4">
            {isAllRoundsView ? 'No Data Across All Rounds' : `No Submissions for Round ${roundNumber}`}
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            {isAllRoundsView 
              ? 'No teams have submitted inputs for any round yet.'
              : 'No teams have submitted pricing decisions for this round yet.'
            }
          </p>
        </div>
      )}

      {!selectedGame && (
        <div className="text-center py-16 bg-slate-800/20 rounded-xl border border-slate-700/50 p-8">
          <div className="w-20 h-20 bg-linear-to-br from-slate-500 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-4">Select Competition</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Choose a game above to view team pricing submissions
          </p>
        </div>
      )}
    </div>
  );
};

export default ViewAllInputs;

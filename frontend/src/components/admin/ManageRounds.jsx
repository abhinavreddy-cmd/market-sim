import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { 
  Clock, 
  Gamepad2, 
  Clipboard, 
  PlusCircle, 
  Lock, 
  Play, 
  CheckCircle2,
  AlertTriangle 
} from "lucide-react";
import useApi from "../../hooks/useApi";

const ManageRounds = () => {
  const api = useApi();
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedGameData, setSelectedGameData] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [newRoundNumber, setNewRoundNumber] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      fetchRounds();
      fetchGameDetails(selectedGame);
    } else {
      setSelectedGameData(null);
      setRounds([]);
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
      setSelectedGameData(game);
    } catch (error) {
      toast.error("Failed to load game details");
    }
  };

  const fetchRounds = async () => {
    try {
      const response = await api.get("/admin/rounds", {
        params: { game_id: selectedGame },
      });
      setRounds(response.data.rounds);
    } catch (error) {
      toast.error("Failed to load rounds");
    }
  };

  const openRound = async () => {
    const toastId = toast.loading(`Opening Round ${newRoundNumber}...`);
    try {
      await api.post("/admin/round/open", {
        game_id: selectedGame,
        round_number: newRoundNumber,
      });
      toast.update(toastId, {
        render: `Round ${newRoundNumber} opened successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });
      fetchRounds();
    } catch (error) {
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to open round",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const lockRound = async (roundNumber) => {
    const toastId = toast.loading(`Locking Round ${roundNumber}...`);
    try {
      await api.put("/admin/round/lock", {
        game_id: selectedGame,
        round_number: roundNumber,
      });
      toast.update(toastId, {
        render: `Round ${roundNumber} locked!`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });
      fetchRounds();
    } catch (error) {
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to lock round",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const computeRound = async (roundNumber) => {
    const toastId = toast.loading(`Computing Round ${roundNumber}...`);
    try {
      await api.post("/admin/round/compute", {
        game_id: selectedGame,
        round_number: roundNumber,
      });
      toast.update(toastId, {
        render: `Round ${roundNumber} computed and published!`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });
      fetchRounds();
    } catch (error) {
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to compute round",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const copyGameId = async () => {
    try {
      await navigator.clipboard.writeText(selectedGame);
      toast.success(`Game ID "${selectedGame}" copied! Share with students.`);
    } catch (error) {
      toast.error("Failed to copy Game ID");
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4 p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
        <div className="w-14 h-14 bg-linear-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl">
          <Clock className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow-2xl">
            Manage Rounds
          </h2>
          <p className="text-slate-300 text-lg mt-1">
            Control game flow and round progression
          </p>
        </div>
      </div>

      {/* GAME SELECTOR */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <label className="block text-lg font-semibold text-slate-300 uppercase tracking-wider mb-6">
          Select Competition
        </label>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="
              flex-1 px-6 py-5
              bg-slate-900/70 backdrop-blur-md
              border border-white/20
              rounded-2xl
              text-white
              text-lg font-medium
              focus:ring-4 focus:ring-indigo-500/40
              focus:border-indigo-400
              focus:outline-none
              transition-all duration-300
              shadow-lg hover:shadow-xl
            "
          >
            <option value="" className="bg-slate-900 text-slate-400">
              -- Select Game --
            </option>

            {games.map((game) => (
              <option
                key={game._id}
                value={game._id}
                className="bg-slate-900 text-white"
              >
                {game.game_name} (ID: {game._id.slice(-6)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SELECTED GAME INFO */}
      {selectedGame && selectedGameData && (
        <div className="bg-linear-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl p-8 border-2 border-emerald-500/30 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Gamepad2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white drop-shadow-xl">
                  {selectedGameData.game_name}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-slate-300">
                    Teams: {selectedGameData.number_of_teams}
                  </span>
                  <span className="text-slate-300">
                    Rounds: {selectedGameData.number_of_rounds}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <code className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl font-mono text-lg font-bold text-white border border-white/30 min-w-50 text-center truncate">
                {selectedGame.slice(-8)}
              </code>
              <button
                onClick={copyGameId}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl border border-white/30 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 backdrop-blur-xl text-sm"
              >
                <Clipboard className="w-4 h-4 inline mr-2" />
                Copy ID
              </button>
              <p className="text-sm text-slate-400 italic">
                Share with students
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OPEN NEW ROUND */}
      {selectedGame && (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 drop-shadow-xl">
            Open New Round
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <input
              type="number"
              min="1"
              max="50"
              value={newRoundNumber}
              onChange={(e) => setNewRoundNumber(parseInt(e.target.value) || 1)}
              className="w-full sm:w-32 px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white text-lg font-mono focus:ring-4 focus:ring-orange-500/30 focus:border-orange-500 focus:outline-none transition-all duration-300 shadow-xl"
            />
            <button
              onClick={openRound}
              className="px-12 py-4 bg-linear-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-orange-500/50 whitespace-nowrap text-lg"
              disabled={loading}
            >
              Open Round {newRoundNumber}
            </button>
          </div>
        </div>
      )}

      {/* ROUNDS TABLE */}
      {selectedGame && rounds.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 drop-shadow-xl">
            <Clipboard className="w-7 h-7" />
            Current Rounds
            <span className="text-sm text-slate-400 font-medium">
              ({rounds.length} rounds)
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="py-4 px-6 text-left text-lg font-semibold text-slate-300 uppercase tracking-wider">
                    Round
                  </th>
                  <th className="py-4 px-6 text-left text-lg font-semibold text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-4 px-6 text-left text-lg font-semibold text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {rounds.map((round) => (
                  <tr
                    key={round._id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="py-6 px-6 font-mono text-2xl font-bold text-white">
                      {round.round_number}
                    </td>
                    <td className="py-6 px-6">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg ${
                          round.status === "OPEN"
                            ? "bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/40"
                            : round.status === "LOCKED"
                            ? "bg-orange-500/20 text-orange-300 border-2 border-orange-500/40"
                            : "bg-purple-500/20 text-purple-300 border-2 border-purple-500/40"
                        }`}
                      >
                        {round.status}
                      </span>
                    </td>
                    <td className="py-6 px-6">
                      {round.status === "OPEN" && (
                        <button
                          onClick={() => lockRound(round.round_number)}
                          className="px-6 py-3 bg-linear-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 mr-3 flex items-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          Lock
                        </button>
                      )}
                      {round.status === "LOCKED" && (
                        <button
                          onClick={() => computeRound(round.round_number)}
                          className="px-6 py-3 bg-linear-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Compute
                        </button>
                      )}
                      {round.status === "COMPUTED" && (
                        <span className="px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Published
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPTY STATES */}
      {!selectedGame && (
        <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
          <div className="w-24 h-24 bg-linear-to-br from-slate-500 to-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-xl">
            No Game Selected
          </h3>
          <p className="text-xl text-slate-400 mb-8 max-w-md mx-auto">
            Select a competition from the dropdown above to manage rounds
          </p>
          <p className="text-slate-500">
            First create a game using the "Create Game" tab
          </p>
        </div>
      )}

      {selectedGame && rounds.length === 0 && (
        <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
          <div className="w-24 h-24 bg-linear-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <PlusCircle className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-xl">
            No Rounds Yet
          </h3>
          <p className="text-xl text-slate-400 mb-8 max-w-md mx-auto">
            Open Round 1 above to get started!
          </p>
        </div>
      )}
    </div>
  );
};

export default ManageRounds;

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { 
  BarChart3, 
  Activity, 
  ChevronLeft,
  AlertCircle 
} from "lucide-react";
import useApi from "../../hooks/useApi";
import MonthlyResults from "./MonthlyResults";
import PostGameGraphs from "./PostGameGraphs";

const Analytics = () => {
  const api = useApi();
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedGameData, setSelectedGameData] = useState(null);
  const [activeView, setActiveView] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      fetchGameDetails(selectedGame);
    } else {
      setSelectedGameData(null);
      setActiveView(null);
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

  const handleLoadMonthlyResults = () => {
    if (!selectedGame) {
      toast.error("Please select a game first");
      return;
    }
    setActiveView("monthly");
    toast.success("Loading monthly analytics...");
  };

  const handleLoadGraphs = () => {
    if (!selectedGame) {
      toast.error("Please select a game first");
      return;
    }
    setActiveView("graphs");
    toast.success("Loading post-game graphs...");
  };

  const resetView = () => {
    setActiveView(null);
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4 p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
        <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow-2xl">
            Analytics Dashboard
          </h2>
          <p className="text-slate-300 text-lg mt-1">
            Comprehensive competition insights & performance metrics
          </p>
        </div>
      </div>

      {/* GAME SELECTOR */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <label className="block text-lg font-semibold text-slate-300 uppercase tracking-wider mb-6">
          Select Competition
        </label>
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          <select
            value={selectedGame}
            onChange={(e) => {
              setSelectedGame(e.target.value);
              setActiveView(null);
            }}
            className="
              flex-1 px-6 py-5
              bg-linear-to-r from-violet-500/60 via-indigo-500/60 to-blue-500/60
              backdrop-blur-md
              border border-white/30
              rounded-2xl
              text-white
              text-lg font-medium
              focus:ring-4 focus:ring-purple-400/40
              focus:border-purple-300
              focus:outline-none
              transition-all duration-300
              shadow-lg hover:shadow-xl
            "
          >
            <option value="" className="bg-indigo-900 text-white">
              -- Choose a game to analyze --
            </option>

            {games.map((game) => (
              <option
                key={game._id}
                value={game._id}
                className="bg-indigo-900 text-white"
              >
                {game.game_name} (ID: {game._id.slice(-8)})
              </option>
            ))}
          </select>

          {/* SELECTED GAME INFO */}
          {selectedGameData && (
            <div className="flex items-center gap-4 p-4 bg-linear-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl border-2 border-purple-500/30 shadow-xl min-w-75">
              <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-white text-lg truncate">
                  {selectedGameData.game_name}
                </h4>
                <p className="text-slate-300 text-sm">
                  {selectedGameData.number_of_teams} teams •{" "}
                  {selectedGameData.number_of_rounds} rounds
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ANALYTICS BUTTONS */}
      {selectedGame && !activeView && (
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-2 border border-white/10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-2">
            <button
              onClick={handleLoadMonthlyResults}
              className="group relative flex flex-col items-center p-8 rounded-2xl bg-linear-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 border-2 border-blue-500/30 hover:border-blue-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 hover:bg-blue-500/30 backdrop-blur-xl text-left"
            >
              <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg group-hover:text-blue-100">
                Monthly Results
              </h3>
              <p className="text-slate-300 text-lg leading-relaxed max-w-md text-center">
                Round-by-round performance metrics and team rankings
              </p>
            </button>

            <button
              onClick={handleLoadGraphs}
              className="group relative flex flex-col items-center p-8 rounded-2xl bg-linear-to-br from-emerald-500/20 via-teal-500/20 to-green-500/20 border-2 border-emerald-500/30 hover:border-emerald-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 hover:bg-emerald-500/30 backdrop-blur-xl text-left"
            >
              <div className="w-20 h-20 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg group-hover:text-emerald-100">
                Post-Game Graphs
              </h3>
              <p className="text-slate-300 text-lg leading-relaxed max-w-md text-center">
                Visual analysis of competition trends and outcomes
              </p>
            </button>
          </div>
        </div>
      )}

      {/* RESET BUTTON */}
      {activeView && (
        <div className="flex justify-center">
          <button
            onClick={resetView}
            className="px-8 py-4 bg-slate-600/50 hover:bg-slate-500/70 text-white font-semibold rounded-2xl border border-slate-400/50 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 backdrop-blur-xl text-lg flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Analytics Menu
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {selectedGame && !activeView && (
        <div className="text-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
          <div className="w-28 h-28 bg-linear-to-br from-slate-500 to-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <BarChart3 className="w-16 h-16 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-6 drop-shadow-xl">
            Ready for Analysis
          </h3>
          <p className="text-xl text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
            Choose an analytics view above to dive into your competition data
          </p>
          <p className="text-slate-500 text-lg">
            Monthly results or post-game visualizations available
          </p>
        </div>
      )}

      {!selectedGame && (
        <div className="text-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
          <div className="w-24 h-24 bg-linear-to-br from-slate-400 to-slate-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <AlertCircle className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-xl">
            No Competition Selected
          </h3>
          <p className="text-xl text-slate-400 mb-8 max-w-md mx-auto">
            Select a game above to access analytics and performance insights
          </p>
        </div>
      )}

      {/* RENDER VIEWS */}
      <div className="min-h-100">
        {activeView === "monthly" && selectedGame && (
          <MonthlyResults gameId={selectedGame} />
        )}
        {activeView === "graphs" && selectedGame && (
          <PostGameGraphs gameId={selectedGame} />
        )}
      </div>
    </div>
  );
};

export default Analytics;

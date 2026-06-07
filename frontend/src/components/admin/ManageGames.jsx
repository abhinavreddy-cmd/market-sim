import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Users,
  Eye,
  EyeOff,
  ClipboardList,
  Clipboard,
  RefreshCw,
  Loader2,
  Gamepad2,
  Plus,
  Lock,
  UserPlus,
  Users2,
  PlusCircle,
  Download,
} from "lucide-react";
import useApi from "../../hooks/useApi";

const ManageGames = () => {
  const api = useApi();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [existingTeamsCount, setExistingTeamsCount] = useState(0);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  const [createForm, setCreateForm] = useState({
    team_id: "",
    password: "",
  });
  const [creatingTeam, setCreatingTeam] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (selectedGame?._id) {
      loadGameCredentials();
    } else {
      setCredentials([]);
      setExistingTeamsCount(0);
      setShowCredentials(false);
    }
  }, [selectedGame]);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/games");
      setGames(response.data.games);
    } catch (error) {
      toast.error("Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const loadGameCredentials = async () => {
    if (!selectedGame?._id) return;

    setLoadingCredentials(true);
    try {
      const response = await api.get("/admin/game/teams", {
        params: { game_id: selectedGame._id },
      });

      const creds = response.data.credentials || [];
      setCredentials(creds);
      setExistingTeamsCount(creds.length);

      if (creds.length < selectedGame.number_of_teams) {
        const firstMissing = creds.length + 1;
        toast.info(
          `${creds.length}/${selectedGame.number_of_teams} teams ready. Next: TEAM${firstMissing.toString().padStart(2, "0")}`,
        );
      }
    } catch (error) {
      console.error("Failed to load credentials:", error);
      toast.error("Failed to load team credentials");
      setCredentials([]);
      setExistingTeamsCount(0);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const createTeamCredential = async (e) => {
    e.preventDefault();
    if (!selectedGame?._id || !createForm.team_id || !createForm.password) {
      toast.error("Please fill all fields");
      return;
    }

    setCreatingTeam(true);
    const toastId = toast.loading("Creating team credential...");

    try {
      await api.post("/auth/admin/create-team", {
        game_id: selectedGame._id,
        team_name: createForm.team_id.toUpperCase(),
        password: createForm.password,
      });

      toast.update(toastId, {
        render: `Created ${createForm.team_id} credentials!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setCreateForm({ team_id: "", password: "" });
      await loadGameCredentials();
    } catch (error) {
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to create team",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setCreatingTeam(false);
    }
  };

  const downloadCredentialsCSV = () => {
    if (credentials.length === 0) {
      toast.warning("No credentials available");
      return;
    }

    const csvContent = [
      ["Game Name", "Game ID", "Team ID (Username)", "Password"],
      ...credentials.map((team) => [
        selectedGame.game_name,
        selectedGame._id,
        team.team_id,
        team.password,
      ]),
    ]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `teams-${selectedGame.game_name}-${selectedGame._id.slice(-8)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloaded ${credentials.length} team credentials!`);
  };

  const copySingleCredential = (team) => {
    const credentialText = `${team.team_id}:${team.password}`;
    navigator.clipboard.writeText(credentialText);
    toast.success(`Copied ${team.team_id} credentials`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 p-8 bg-slate-800/30 rounded-2xl border border-slate-600">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-lg font-medium text-slate-300">
            Loading games...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="p-8 bg-linear-to-r from-slate-800/30 to-slate-900/30 rounded-3xl border border-slate-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Gamepad2 className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-white to-slate-200 bg-clip-text text-transparent">
                Manage Games & Teams
              </h1>
              <p className="text-slate-400 mt-1">
                Create and manage persistent team credentials
              </p>
            </div>
          </div>
          <button
            onClick={fetchGames}
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-2xl border border-slate-600 hover:border-slate-500 transition-all text-sm flex items-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Refresh Games
          </button>
        </div>
      </div>

      {/* GAME SELECTOR + CREATE FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GAME SELECTOR */}
        <div className="bg-slate-800/20 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-8 shadow-xl">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
            <Users className="w-5 h-5" />
            Select Game
          </label>
          <select
            value={selectedGame?._id || ""}
            onChange={(e) => {
              const game = games.find((g) => g._id === e.target.value);
              setSelectedGame(game);
            }}
            className="w-full px-6 py-5 bg-white/10 border border-slate-600/50 rounded-2xl text-white font-semibold text-lg focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50"
            disabled={loadingCredentials || creatingTeam}
          >
            <option className="bg-slate-800" value="">— Choose a competition —</option>
            {games.map((game) => (
              <option className="bg-slate-800" key={game._id} value={game._id}>
                {game.game_name} ({game.number_of_teams} teams)
              </option>
            ))}
          </select>
        </div>

        {/* CREATE TEAM FORM */}
        {selectedGame && (
          <div className="bg-slate-800/20 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-emerald-400" />
              Create Team Credential
            </h3>
            <form onSubmit={createTeamCredential} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                  Team ID (Username)
                </label>
                <input
                  type="text"
                  placeholder="TEAM01"
                  value={createForm.team_id}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      team_id: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-5 py-4 bg-white/10 border border-slate-600/50 rounded-2xl text-white font-mono focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-lg hover:shadow-xl"
                  disabled={creatingTeam}
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="text"
                  placeholder="Pass012026"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      password: e.target.value,
                    })
                  }
                  className="w-full px-5 py-4 bg-white/10 border border-slate-600/50 rounded-2xl text-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-lg hover:shadow-xl"
                  disabled={creatingTeam}
                />
              </div>
              <button
                type="submit"
                disabled={!selectedGame?._id || creatingTeam}
                className="w-full px-8 py-4 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center gap-3 justify-center text-lg"
              >
                {creatingTeam ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Creating Team...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-6 h-6" />
                    Create Team {createForm.team_id || ""}
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* GAME INFO */}
      {selectedGame && (
        <div className="bg-linear-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border-2 border-emerald-500/40 rounded-3xl p-10 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <h3 className="text-3xl font-bold text-white flex items-center gap-3 mb-3">
                <Gamepad2 className="w-8 h-8 text-emerald-400" />
                {selectedGame.game_name}
              </h3>
              <p className="text-slate-200 text-lg">
                Total Teams:{" "}
                <span className="font-mono text-emerald-400 text-xl">
                  {selectedGame.number_of_teams}
                </span>{" "}
                | Ready:{" "}
                <span className="font-mono text-emerald-400 text-xl">
                  {existingTeamsCount}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="font-mono text-4xl font-bold text-emerald-400">
                {existingTeamsCount}/{selectedGame.number_of_teams}
              </div>
              <Users2 className="w-12 h-12 text-emerald-400/70" />
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIALS TABLE */}
      {selectedGame && credentials.length > 0 && (
        <div className="bg-slate-800/20 backdrop-blur-sm rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-8 bg-slate-800/50 border-b border-slate-700">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Lock className="w-7 h-7" />
              Team Credentials
            </h3>
            <div className="flex items-center gap-4 mt-4 lg:mt-0">
              <div className="font-mono text-xl text-slate-300">
                {credentials.length}/{selectedGame.number_of_teams} teams
              </div>
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="px-6 py-3 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
              >
                {showCredentials ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {showCredentials ? "Hide Passwords" : "Show Passwords"}
              </button>
              <button
                onClick={downloadCredentialsCSV}
                className="px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/70 border-b-2 border-slate-700">
                  <th className="py-6 px-8 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Team ID
                  </th>
                  <th className="py-6 px-8 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Password
                  </th>
                  <th className="py-6 px-8 text-left text-sm font-bold text-slate-200 uppercase tracking-wider w-52">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {credentials.map((team) => (
                  <tr
                    key={team.team_id}
                    className="hover:bg-slate-700/50 transition-all border-b border-slate-800/50"
                  >
                    {/* ✅ FIXED: Team ID - SAME SIZE & PADDING as Password */}
                    <td className="py-6 px-8">
                      <div className="font-mono font-bold px-6 py-4 rounded-2xl text-base text-white bg-linear-to-r from-slate-700/70 to-slate-800/70 shadow-lg min-w-40">
                        {team.team_id}
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <span
                          className={`font-mono font-bold px-6 py-4 rounded-2xl text-base min-w-40 text-center shadow-lg transition-all ${
                            showCredentials
                              ? "text-emerald-400 bg-linear-to-r from-emerald-500/30 to-teal-500/30 border-2 border-emerald-400/50"
                              : "text-slate-500 bg-slate-700/60 border-2 border-slate-600/50 backdrop-blur-sm"
                          }`}
                        >
                          {showCredentials ? team.password : "••••••••"}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <button
                        onClick={() => copySingleCredential(team)}
                        className="p-3 hover:bg-orange-600/50 bg-violet-800 rounded-2xl transition-all text-slate-400 hover:text-white hover:shadow-lg shadow-md flex items-center gap-2 h-13 shrink-0"
                        title="Copy Team:Password"
                      >
                        <Clipboard className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">Copy</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GAMES GRID */}
      {!selectedGame && games.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-10 flex items-center gap-3">
            <Users2 className="w-8 h-8 text-emerald-400" />
            All Games ({games.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game) => (
              <div
                key={game._id}
                className="group cursor-pointer bg-slate-800/30 hover:bg-slate-800/60 backdrop-blur-sm rounded-3xl border-2 border-slate-700/50 p-10 hover:border-emerald-500/60 hover:shadow-3xl hover:-translate-y-3 transition-all duration-500 shadow-2xl h-full flex flex-col"
                onClick={() => setSelectedGame(game)}
              >
                <div className="flex items-start justify-between mb-6">
                  <h4 className="text-2xl font-bold bg-linear-to-r from-white to-slate-200 bg-clip-text text-transparent group-hover:from-emerald-400 group-hover:to-teal-500 transition-all">
                    {game.game_name}
                  </h4>
                  <div className="p-3 bg-slate-700/50 group-hover:bg-emerald-500/90 rounded-2xl text-white transition-all shadow-lg group-hover:shadow-2xl shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="flex-1 space-y-4 text-slate-300 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                    <span className="font-semibold">Teams Capacity</span>
                    <span className="font-mono text-2xl font-bold text-emerald-400">
                      {game.number_of_teams}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span>Rounds</span>
                    <span className="font-mono text-xl font-bold text-blue-400">
                      {game.number_of_rounds}
                    </span>
                  </div>
                  <div className="font-mono bg-slate-700/70 px-6 py-3 rounded-2xl text-sm font-semibold text-slate-300 truncate border border-slate-600/50">
                    Game ID: {game._id.slice(-8)}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-700/50">
                  <div className="flex items-center gap-3 text-emerald-400 font-semibold text-lg group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    <span>View Teams & Create New</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NO GAMES */}
      {!selectedGame && games.length === 0 && (
        <div className="text-center py-24">
          <Users2 className="w-24 h-24 text-slate-600 mx-auto mb-8" />
          <h3 className="text-2xl font-bold text-white mb-4">No Games Found</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Create your first game to manage teams and generate credentials.
          </p>
          <button
            onClick={fetchGames}
            className="px-8 py-4 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all flex items-center gap-3 mx-auto text-lg"
            disabled={loading}
          >
            <RefreshCw className={`w-6 h-6 ${loading ? "animate-spin" : ""}`} />
            Refresh Games
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageGames;

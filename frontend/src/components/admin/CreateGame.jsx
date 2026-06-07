import { useState } from "react";
import { toast } from "react-toastify";
import { PlusCircle } from "lucide-react";
import useApi from "../../hooks/useApi";

const CreateGame = () => {
  const api = useApi();
  const [formData, setFormData] = useState({
    game_name: "",
    number_of_teams: "",
    number_of_rounds: "",
    constants: {
      cost_per_participant: 10,
      base_suppliers: 10,
      base_consumers: 100,
      magnifier_suppliers: 2,
      magnifier_consumers: 2,
      initial_cum_suppliers: 10,
      initial_cum_consumers: 100,
    },
  });
  const [loading, setLoading] = useState(false);
  const [editConstants, setEditConstants] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const toastId = toast.loading("Creating game...");

    try {
      await api.post("/admin/game/create", {
        game_name: formData.game_name,
        number_of_teams: parseInt(formData.number_of_teams),
        number_of_rounds: parseInt(formData.number_of_rounds),
        constants: formData.constants, // ✅ Send custom constants
      });

      toast.update(toastId, {
        render: "Game created successfully!",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });

      // Reset form
      setFormData({
        game_name: "",
        number_of_teams: "",
        number_of_rounds: "",
        constants: {
          cost_per_participant: 10,
          base_suppliers: 10,
          base_consumers: 100,
          magnifier_suppliers: 2,
          magnifier_consumers: 2,
          initial_cum_suppliers: 10,
          initial_cum_consumers: 100,
        },
      });
      setEditConstants(false);
    } catch (error) {
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to create game",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleConstantsEditor = () => {
    setEditConstants(!editConstants);
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4 p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
        <div className="w-14 h-14 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white drop-shadow-2xl">
            Create New Game
          </h2>
          <p className="text-slate-300 text-lg mt-1">
            Configure competition settings and constants
          </p>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-white/20 shadow-2xl">
        <form onSubmit={handleSubmit} className="grid gap-8">
          {/* BASIC SETTINGS */}
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-slate-300 uppercase tracking-wider mb-4">
                Game Name
              </label>
              <input
                type="text"
                value={formData.game_name}
                onChange={(e) =>
                  setFormData({ ...formData, game_name: e.target.value })
                }
                placeholder="e.g., Supply Chain Competition 2026"
                className="w-full px-6 py-5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-lg font-medium text-white placeholder-slate-400 focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-xl hover:shadow-2xl"
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-semibold text-slate-300 uppercase tracking-wider mb-4">
                  Number of Teams
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.number_of_teams}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      number_of_teams: e.target.value,
                    })
                  }
                  className="w-full px-6 py-5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-lg font-medium text-white placeholder-slate-400 focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-xl hover:shadow-2xl"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-slate-300 uppercase tracking-wider mb-4">
                  Number of Rounds
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.number_of_rounds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      number_of_rounds: e.target.value,
                    })
                  }
                  className="w-full px-6 py-5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-lg font-medium text-white placeholder-slate-400 focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-xl hover:shadow-2xl"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* CONSTANTS EDITOR TOGGLE */}
          <div
            onClick={toggleConstantsEditor}
            className="p-6 bg-linear-to-r from-orange-500/10 to-yellow-500/10 
             border-2 border-orange-400/30 rounded-2xl 
             flex items-center justify-center 
             cursor-pointer select-none
             hover:border-orange-400/60 hover:bg-orange-500/20 
             transition-all"
          >
            <div className="flex items-center gap-3 text-lg font-semibold text-orange-300">
              {editConstants ? "Use Default Constants" : "Customize Constants"}
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  editConstants ? "bg-orange-400 scale-110" : "bg-orange-300"
                }`}
              ></div>
            </div>
          </div>

          {/* EDITABLE CONSTANTS */}
          {editConstants && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white px-6 py-4 bg-white/5 rounded-2xl border border-white/20">
                Game Constants (Advanced)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    key: "cost_per_participant",
                    label: "Cost per Participant",
                    min: 1,
                    max: 100,
                  },
                  {
                    key: "base_suppliers",
                    label: "Base Suppliers",
                    min: 1,
                    max: 50,
                  },
                  {
                    key: "base_consumers",
                    label: "Base Consumers",
                    min: 10,
                    max: 1000,
                  },
                  {
                    key: "magnifier_suppliers",
                    label: "Suppliers Magnifier",
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                  },
                  {
                    key: "magnifier_consumers",
                    label: "Consumers Magnifier",
                    min: 0.1,
                    max: 10,
                    step: 0.1,
                  },
                  {
                    key: "initial_cum_suppliers",
                    label: "Initial Cum. Suppliers",
                    min: 0,
                    max: 100,
                  },
                  {
                    key: "initial_cum_consumers",
                    label: "Initial Cum. Consumers",
                    min: 0,
                    max: 1000,
                  },
                ].map(({ key, label, min, max, step = 1 }) => (
                  <div key={key} className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wide">
                      {label}
                    </label>
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      value={formData.constants[key]}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          constants: {
                            ...formData.constants,
                            [key]: parseFloat(e.target.value) || 0,
                          },
                        });
                      }}
                      className="w-full px-6 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-lg font-mono text-white focus:ring-4 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-xl hover:shadow-2xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CREATE BUTTON */}
          <button
            type="submit"
            className="w-full bg-linear-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white py-6 px-12 rounded-3xl text-xl font-bold shadow-2xl hover:shadow-3xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-xl border border-emerald-500/30"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3 inline-block align-middle" />
                Creating Game...
              </>
            ) : (
              <>
                <PlusCircle className="w-6 h-6 inline-block mr-3 align-middle" />
                Create Competition
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGame;

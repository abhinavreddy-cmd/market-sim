import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  Gamepad2,
  Search,
  Loader2,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  Play,
} from "lucide-react";
import useApi from "../../hooks/useApi";

const SubmitPrices = () => {
  const { user } = useContext(AuthContext);
  const api = useApi();

  const [roundNumber, setRoundNumber] = useState(1);
  const [gameId, setGameId] = useState(user?.game_id || "");
  const [pSupplier, setPSupplier] = useState("");
  const [pConsumer, setPConsumer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (user?.game_id) {
      setGameId(user.game_id);
      checkSubmission();
    }
  }, [user?.game_id, roundNumber]);

  const checkSubmission = async () => {
    if (!gameId.trim()) return;

    setLoading(true);
    try {
      const response = await api.get("/student/my-submission", {
        params: { game_id: gameId.trim(), round_number: roundNumber },
      });

      if (response.data.submitted) {
        setSubmitted(true);
        setPSupplier(response.data.submission.p_s.toString());
        setPConsumer(response.data.submission.p_c.toString());
        toast.success(
          `Already submitted: ₹${response.data.submission.p_s}/₹${response.data.submission.p_c}`,
        );
      } else if (response.data.roundStatus === "NOT_FOUND") {
        toast.error(`Round ${roundNumber} doesn't exist`);
      } else if (response.data.roundStatus !== "OPEN") {
        toast.warning(`Round ${roundNumber} is ${response.data.roundStatus}`);
      } else {
        toast.success(`Round ${roundNumber} is OPEN`);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Status check failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    const supplierPrice = parseFloat(pSupplier);
    const consumerPrice = parseFloat(pConsumer);

    if (
      isNaN(supplierPrice) ||
      isNaN(consumerPrice) ||
      supplierPrice < 0 ||
      consumerPrice < 0
    ) {
      toast.error("Prices must be positive numbers");
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    toast.loading("Submitting...", { toastId: "submit" });

    try {
      await api.post("/student/submit", {
        game_id: gameId.trim(),
        round_number: roundNumber,
        p_s: parseFloat(pSupplier),
        p_c: parseFloat(pConsumer),
        confirmed: true,
      });

      setSubmitted(true);
      setShowConfirmation(false);
      toast.dismiss("submit");
      toast.success(`Submitted for Round ${roundNumber}!`);
    } catch (error) {
      toast.dismiss("submit");
      toast.error(error.response?.data?.message || "Submit failed");
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setShowConfirmation(false);
    setPSupplier("");
    setPConsumer("");
  };

  return (
    <div className="space-y-8">
      {/* FORM CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
        <div>
          <label className="flex text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2 items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            Game ID
          </label>
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 bg-white/10 border border-slate-600/50 rounded-xl text-lg font-mono text-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 transition-all"
            disabled={!!user?.game_id}
            placeholder="Auto-filled"
          />
          {user?.game_id && (
            <p className="text-xs text-emerald-400 mt-1">Auto-filled</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">
            Round
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={roundNumber}
            onChange={(e) => {
              setRoundNumber(parseInt(e.target.value));
              resetForm();
            }}
            className="w-full px-4 py-3 bg-white/10 border border-slate-600/50 rounded-xl text-lg font-mono text-center text-white focus:border-orange-400 focus:ring-2 focus:ring-orange-500/30 transition-all"
            disabled={submitted}
          />
        </div>

        <div className="flex items-center">
          <button
            className="w-full px-6 py-3 bg-emerald-500/90 hover:bg-emerald-600 text-white font-semibold rounded-xl border border-emerald-400/50 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            onClick={checkSubmission}
            disabled={loading || !gameId.trim() || submitted}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                Check Status
              </div>
            )}
          </button>
        </div>
      </div>

      {/* PRICE INPUTS */}
      {!submitted && !showConfirmation && (
        <form
          onSubmit={handlePriceSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="space-y-4">
            <label className="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Supplier Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pSupplier}
              onChange={(e) => setPSupplier(e.target.value)}
              className="w-full px-6 py-6 bg-white/10 border-2 border-slate-600/50 rounded-2xl text-2xl font-mono text-center tracking-wider text-emerald-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/30 transition-all shadow-md hover:shadow-lg"
              placeholder="0.00"
              required
              disabled={loading}
            />
            <p className="text-slate-500 text-sm text-center">
              Any positive number
            </p>
          </div>

          <div className="space-y-4">
            <label className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              Consumer Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pConsumer}
              onChange={(e) => setPConsumer(e.target.value)}
              className="w-full px-6 py-6 bg-white/10 border-2 border-slate-600/50 rounded-2xl text-2xl font-mono text-center tracking-wider text-orange-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/30 transition-all shadow-md hover:shadow-lg"
              placeholder="0.00"
              required
              disabled={loading}
            />
            <p className="text-slate-500 text-sm text-center">
              Any positive number
            </p>
          </div>

          <div className="lg:col-span-2 pt-4">
            <button
              type="submit"
              className="w-full py-4 px-8 bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-emerald-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!gameId.trim() || loading}
            >
              <Play className="w-5 h-5 inline mr-2" />
              Continue to Confirmation
            </button>
          </div>
        </form>
      )}

      {/* CONFIRMATION */}
      {showConfirmation && !submitted && (
        <div className="bg-linear-to-r from-orange-500/10 to-red-500/10 border border-orange-400/30 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-linear-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Confirm Submission
            </h2>
            <p className="text-slate-300">
              Round <strong>{roundNumber}</strong> - Team{" "}
              <strong>{user?.team_id?.toUpperCase()}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 p-6 bg-white/5 rounded-2xl">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-400 mb-2">
                {pSupplier}
              </div>
              <div className="text-slate-400 uppercase tracking-wide font-medium">
                Supplier Price
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-400 mb-2">
                {pConsumer}
              </div>
              <div className="text-slate-400 uppercase tracking-wide font-medium">
                Consumer Price
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              className="flex-1 py-3 px-6 bg-slate-700/50 hover:bg-slate-600/70 text-white font-semibold rounded-xl border border-slate-500/50 transition-all duration-200"
              onClick={() => setShowConfirmation(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-3 px-6 bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              onClick={handleConfirmSubmit}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Confirm & Submit"}
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {submitted && (
        <div className="bg-linear-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-400/30 rounded-2xl p-10 text-center">
          <div className="w-24 h-24 bg-linear-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <CheckCircle2 className="w-14 h-14 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Submission Complete!
          </h2>
          <p className="text-slate-300 mb-8">
            Prices locked for Round {roundNumber}
          </p>
          <button
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl border border-slate-500/50 hover:border-slate-400 transition-all duration-200"
            onClick={resetForm}
          >
            Submit Different Round
          </button>
        </div>
      )}

      {/* SIMPLE RULES */}
      <div className="pt-8 mt-12 border-t border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
          <div>• One submission per round</div>
          <div>• Positive numbers only</div>
          <div>• No edits after confirmation</div>
          <div>• Round must be OPEN</div>
        </div>
      </div>
    </div>
  );
};

export default SubmitPrices;

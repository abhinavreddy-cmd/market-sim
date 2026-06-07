import express from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roleCheck.js";
import { Game, Round, RoundInput, RoundResult, User } from "../models/index.js";
import bcrypt from "bcryptjs";

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get("/game/teams", async (req, res) => {
  try {
    const { game_id } = req.query;
    if (!game_id) {
      return res
        .status(400)
        .json({ success: false, message: "game_id required" });
    }

    console.log("Fetching teams for game:", game_id);

    // ✅ Query by game's _id string (matches frontend)
    const teams = await User.find({
      game_id: game_id, // Exact match with frontend
      role: "STUDENT",
    })
      .select("team_id username plain_password")
      .sort({ team_id: 1 })
      .lean();

    const credentials = teams.map((team) => ({
      team_id: team.team_id || team.username,
      password: team.plain_password || "Password not set",
    }));

    console.log(`✅ Found ${credentials.length} teams for game ${game_id}`);
    res.json({
      success: true,
      credentials,
      count: credentials.length,
    });
  } catch (error) {
    console.error("Fetch teams error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE GAME
router.post("/game/create", async (req, res) => {
  try {
    const { game_name, number_of_teams, number_of_rounds, constants } =
      req.body;

    // Validate required fields
    if (!game_name || !number_of_teams || !number_of_rounds) {
      return res.status(400).json({
        success: false,
        message: "Game name, teams, and rounds are required",
      });
    }

    // Check if game already exists
    const existingGame = await Game.findOne({ game_name });
    if (existingGame) {
      return res.status(400).json({
        success: false,
        message: "Game name already exists",
      });
    }

    // ✅ Use CUSTOM constants (or defaults if not provided)
    const gameConstants = constants || {
      cost_per_participant: 10,
      base_suppliers: 10,
      base_consumers: 100,
      magnifier_suppliers: 2,
      magnifier_consumers: 2,
      initial_cum_suppliers: 10,
      initial_cum_consumers: 100,
    };

    const game = await Game.create({
      game_name,
      number_of_teams: parseInt(number_of_teams),
      number_of_rounds: parseInt(number_of_rounds),
      constants: gameConstants, // ✅ SAVES CUSTOM CONSTANTS
    });

    console.log("✅ Game created with custom constants:", game._id);
    res.status(201).json({
      success: true,
      game: {
        _id: game._id,
        game_name: game.game_name,
        number_of_teams: game.number_of_teams,
        number_of_rounds: game.number_of_rounds,
      },
    });
  } catch (error) {
    console.error("Game creation error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET ALL GAMES
router.get("/games", async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    res.json({ success: true, games });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET SINGLE GAME
router.get("/game/:id", async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }
    res.json({ success: true, game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// OPEN NEW ROUND (LOWERCASE GAME ID)
router.post("/round/open", async (req, res) => {
  try {
    const { game_id, round_number } = req.body;
    const cleanGameId = game_id.trim().toLowerCase();

    const existingRound = await Round.findOne({
      game_id: cleanGameId,
      round_number: parseInt(round_number),
    });

    if (existingRound) {
      return res.status(400).json({
        success: false,
        message: `Round ${round_number} already exists (${existingRound.status})`,
      });
    }

    const round = await Round.create({
      game_id: cleanGameId,
      round_number: parseInt(round_number),
      status: "OPEN",
    });

    console.log("✅ Round opened:", round._id);
    res.status(201).json({ success: true, round });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET ALL ROUNDS FOR GAME
router.get("/rounds", async (req, res) => {
  try {
    const { game_id } = req.query;
    const cleanGameId = game_id?.trim().toLowerCase();

    const rounds = await Round.find({ game_id: cleanGameId }).sort({
      round_number: 1,
    });

    res.json({ success: true, rounds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// LOCK ROUND
router.put("/round/lock", async (req, res) => {
  try {
    const { game_id, round_number } = req.body;
    const cleanGameId = game_id.trim().toLowerCase();

    const round = await Round.findOneAndUpdate(
      {
        game_id: cleanGameId,
        round_number: parseInt(round_number),
        status: "OPEN",
      },
      { status: "LOCKED" },
      { new: true },
    );

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Round not found or not in OPEN status",
      });
    }

    res.json({ success: true, round });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// COMPUTE ROUND
router.post("/round/compute", async (req, res) => {
  try {
    const { game_id, round_number } = req.body;
    const cleanGameId = game_id.trim().toLowerCase();
    const cleanRoundNum = parseInt(round_number);

    const round = await Round.findOne({
      game_id: cleanGameId,
      round_number: cleanRoundNum,
    });

    if (!round || round.status !== "LOCKED") {
      return res.status(400).json({
        success: false,
        message: "Round must be LOCKED to compute",
      });
    }

    const game = await Game.findById(cleanGameId);
    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    const inputs = await RoundInput.find({
      game_id: cleanGameId,
      round_number: cleanRoundNum,
    });

    if (inputs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No inputs found for this round",
      });
    }

    const { constants } = game;
    const cost = constants.cost_per_participant;
    const base_S = constants.base_suppliers;
    const base_C = constants.base_consumers;
    const mag_S = constants.magnifier_suppliers;
    const mag_C = constants.magnifier_consumers;

    // Get previous round cumulative values
    let prevResults = {};
    if (cleanRoundNum > 1) {
      const prevRoundResults = await RoundResult.find({
        game_id: cleanGameId,
        round_number: cleanRoundNum - 1,
      });

      prevRoundResults.forEach((r) => {
        prevResults[r.team_id] = {
          cum_S: r.cum_S,
          cum_C: r.cum_C,
          cum_profit: r.cum_profit,
        };
      });
    }

    // Compute for each team
    const results = [];
    for (const input of inputs) {
      const { team_id, p_s, p_c } = input;

      // Get previous cumulative or use initial
      const prev_cum_S =
        prevResults[team_id]?.cum_S || constants.initial_cum_suppliers;
      const prev_cum_C =
        prevResults[team_id]?.cum_C || constants.initial_cum_consumers;
      const prev_cum_profit = prevResults[team_id]?.cum_profit || 0;

      // Calculate avg prices from OTHER teams
      const otherInputs = inputs.filter((i) => i.team_id !== team_id);
      const avg_p_s_others =
        otherInputs.length > 0
          ? otherInputs.reduce((sum, i) => sum + i.p_s, 0) / otherInputs.length
          : p_s;
      const avg_p_c_others =
        otherInputs.length > 0
          ? otherInputs.reduce((sum, i) => sum + i.p_c, 0) / otherInputs.length
          : p_c;

      // FORMULAS (from PDF - exact implementation)
      // Suppliers attracted = base_S + mag_S * (avg_p_c_others - p_c)^2
      const delta_C = avg_p_c_others - p_c;
      const new_S = base_S + mag_S * Math.pow(delta_C, 2);

      // Consumers attracted = base_C + mag_C * (avg_p_s_others - p_s)^2
      const delta_S = avg_p_s_others - p_s;
      const new_C = base_C + mag_C * Math.pow(delta_S, 2);

      // Cumulative suppliers and consumers
      const cum_S = prev_cum_S + new_S;
      const cum_C = prev_cum_C + new_C;

      // Monthly profit = (p_s * cum_C) + (p_c * cum_S) - cost * (cum_S + cum_C)
      const monthly_profit = p_s * cum_C + p_c * cum_S - cost * (cum_S + cum_C);

      // Cumulative profit
      const cum_profit = prev_cum_profit + monthly_profit;

      const result = await RoundResult.create({
        game_id: cleanGameId,
        round_number: cleanRoundNum,
        team_id,
        p_s,
        p_c,
        new_S,
        new_C,
        cum_S,
        cum_C,
        monthly_profit,
        cum_profit,
      });

      results.push(result);
    }

    // Mark round as COMPUTED
    round.status = "COMPUTED";
    await round.save();

    res.json({ success: true, message: "Round computed", results });
  } catch (error) {
    console.error("Compute error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET ALL INPUTS FOR ROUND
router.get("/round/inputs", async (req, res) => {
  try {
    const { game_id, round_number } = req.query;
    const cleanGameId = game_id?.trim().toLowerCase();

    const inputs = await RoundInput.find({
      game_id: cleanGameId,
      round_number: parseInt(round_number),
    }).sort({ team_id: 1 });

    res.json({ success: true, inputs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// REPLACE the monthly-results endpoint:
router.get("/analytics/monthly-results", async (req, res) => {
  try {
    const { game_id } = req.query;
    const cleanGameId = game_id?.trim().toLowerCase();

    if (!cleanGameId) {
      return res
        .status(400)
        .json({ success: false, message: "game_id required" });
    }

    // Get all COMPUTED rounds
    const computedRounds = await Round.find({
      game_id: cleanGameId,
      status: "COMPUTED",
    }).sort({ round_number: 1 });

    if (computedRounds.length === 0) {
      return res.json({
        success: true,
        results: [],
        message: "No computed rounds yet",
      });
    }

    const roundNumbers = computedRounds.map((r) => r.round_number);

    // Get all results - POPULATE ALL FIELDS
    const results = await RoundResult.find({
      game_id: cleanGameId,
      round_number: { $in: roundNumbers },
    })
      .sort({ round_number: 1, team_id: 1 })
      .lean();

    // Transform data to match frontend expectations (add missing fields)
    const transformedResults = results.map((result) => ({
      ...result,
      // ✅ Ensure ALL required fields exist
      p_s: result.p_s ?? 0,
      p_c: result.p_c ?? 0,
      cum_suppliers: result.cum_suppliers ?? result.cum_S ?? 0,
      cum_consumers: result.cum_consumers ?? result.cum_C ?? 0,
      profit: result.profit ?? result.monthly_profit ?? 0,
      cum_profit: result.cum_profit ?? 0,
    }));

    res.json({ success: true, results: transformedResults });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// FIXED POST GAME GRAPHS DATA (NO NULLS)
router.get("/analytics/post-game-graphs", async (req, res) => {
  try {
    const { game_id } = req.query;
    const cleanGameId = game_id?.trim().toLowerCase();

    if (!cleanGameId) {
      return res
        .status(400)
        .json({ success: false, message: "game_id required" });
    }

    const computedRounds = await Round.find({
      game_id: cleanGameId,
      status: "COMPUTED",
    }).sort({ round_number: 1 });

    if (computedRounds.length === 0) {
      return res.json({
        success: true,
        data: {},
        message: "No computed rounds yet",
      });
    }

    const roundNumbers = computedRounds.map((r) => r.round_number);
    const results = await RoundResult.find({
      game_id: cleanGameId,
      round_number: { $in: roundNumbers },
    })
      .sort({ team_id: 1, round_number: 1 })
      .lean();

    // ✅ GROUP BY TEAM + FILL MISSING DATA
    const teamData = {};
    roundNumbers.forEach((roundNum) => {
      const roundResults = results.filter((r) => r.round_number === roundNum);
      roundResults.forEach((result) => {
        const teamId = result.team_id;
        if (!teamData[teamId]) {
          teamData[teamId] = {
            team_id: teamId,
            rounds: roundNumbers,
            supplier_prices: new Array(roundNumbers.length).fill(0),
            consumer_prices: new Array(roundNumbers.length).fill(0),
            monthly_profits: new Array(roundNumbers.length).fill(0),
            cumulative_profits: new Array(roundNumbers.length).fill(0),
          };
        }

        const roundIndex = roundNumbers.indexOf(roundNum);
        // ✅ USE YOUR ACTUAL FIELD NAMES + DEFAULT TO 0
        teamData[teamId].supplier_prices[roundIndex] =
          result.p_s ?? result.supplier_price ?? 0;
        teamData[teamId].consumer_prices[roundIndex] =
          result.p_c ?? result.consumer_price ?? 0;
        teamData[teamId].monthly_profits[roundIndex] =
          result.profit ?? result.monthly_profit ?? 0;
        teamData[teamId].cumulative_profits[roundIndex] =
          result.cum_profit ?? result.cumulative_profit ?? 0;
      });
    });

    res.json({ success: true, data: teamData, rounds: roundNumbers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

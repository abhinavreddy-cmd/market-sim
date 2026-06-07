import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireStudent } from '../middleware/roleCheck.js';
import { Round, RoundInput, RoundResult } from '../models/index.js';

const router = express.Router();

router.use(authenticate);
router.use(requireStudent);

router.post('/submit', async (req, res) => {
  try {
    const { game_id, round_number, p_s, p_c, confirmed } = req.body;
    const team_id = req.user.teamId;

    console.log('🔵 SUBMIT:', { game_id, round_number, team_id, p_s, p_c, confirmed });

    // Require explicit confirmation
    if (!confirmed) {
      return res.status(400).json({ 
        success: false, 
        message: 'Submission must be confirmed' 
      });
    }

    const cleanGameId = game_id?.trim().toLowerCase();
    const cleanRoundNum = parseInt(round_number);

    const supplierPrice = parseFloat(p_s);
    const consumerPrice = parseFloat(p_c);

    if (isNaN(supplierPrice) || isNaN(consumerPrice) || supplierPrice < 0 || consumerPrice < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Prices must be positive numbers' 
      });
    }

    // Rest of validation remains same...
    const round = await Round.findOne({ 
      game_id: cleanGameId,
      round_number: cleanRoundNum 
    }).lean();

    if (!round) {
      return res.status(404).json({ 
        success: false, 
        message: `Round ${cleanRoundNum} not found for Game ${cleanGameId}` 
      });
    }

    if (round.status !== 'OPEN') {
      return res.status(400).json({ 
        success: false, 
        message: `Round ${cleanRoundNum} must be OPEN (current: ${round.status})` 
      });
    }

    // Check duplicate
    const existing = await RoundInput.findOne({ 
      game_id: cleanGameId,
      round_number: cleanRoundNum, 
      team_id 
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: `Already submitted for Round ${cleanRoundNum}. No edits allowed.` 
      });
    }

    // ✅ SAVE with user's game_id from login
    const input = await RoundInput.create({
      game_id: cleanGameId,
      round_number: cleanRoundNum,
      team_id,
      p_s: supplierPrice,
      p_c: consumerPrice,
      locked: true,
    });

    console.log('✅ SUBMISSION SAVED:', input._id);
    res.status(201).json({ 
      success: true, 
      message: `Prices submitted for Round ${cleanRoundNum}!`,
      submission: input
    });

  } catch (error) {
    console.error('Submit error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});


// CHECK SUBMISSION STATUS (CASE INSENSITIVE)
router.get('/my-submission', async (req, res) => {
  try {
    const { game_id, round_number } = req.query;
    const team_id = req.user.teamId;

    const cleanGameId = game_id?.trim().toLowerCase();
    const cleanRoundNum = parseInt(round_number);

    if (!cleanGameId || !cleanRoundNum || isNaN(cleanRoundNum)) {
      return res.json({ 
        success: true, 
        submitted: false, 
        roundStatus: 'INVALID',
        message: 'Invalid game_id or round_number'
      });
    }

    const round = await Round.findOne({ 
      game_id: cleanGameId,
      round_number: cleanRoundNum 
    }).lean();

    if (!round) {
      return res.json({ 
        success: true, 
        submitted: false,
        roundStatus: 'NOT_FOUND',
        message: `Round ${cleanRoundNum} not found`
      });
    }

    const input = await RoundInput.findOne({ 
      game_id: cleanGameId,
      round_number: cleanRoundNum, 
      team_id 
    });

    if (input) {
      return res.json({ 
        success: true, 
        submitted: true,
        roundStatus: round.status,
        submission: {
          p_s: input.p_s,
          p_c: input.p_c,
          submitted_at: input.submitted_at,
        }
      });
    }

    res.json({ 
      success: true, 
      submitted: false,
      roundStatus: round.status,
      message: round.status === 'OPEN' ? 
        `Round ${cleanRoundNum} is OPEN` : 
        `Round ${cleanRoundNum} is ${round.status}`
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET MY RESULTS (COMPUTED ROUNDS ONLY)
router.get('/my-results', async (req, res) => {
  try {
    const { game_id, round_number } = req.query;
    const team_id = req.user.teamId;

    const cleanGameId = game_id?.trim().toLowerCase();
    const cleanRoundNum = parseInt(round_number);

    const round = await Round.findOne({ 
      game_id: cleanGameId, 
      round_number: cleanRoundNum 
    });

    if (!round || round.status !== 'COMPUTED') {
      return res.status(403).json({ 
        success: false, 
        message: `Results not available for Round ${cleanRoundNum}` 
      });
    }

    const result = await RoundResult.findOne({ 
      game_id: cleanGameId, 
      round_number: cleanRoundNum, 
      team_id 
    });

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET ALL MY RESULTS
router.get('/my-all-results', async (req, res) => {
  try {
    const { game_id } = req.query;
    const team_id = req.user.teamId;
    const cleanGameId = game_id?.trim().toLowerCase();

    const results = await RoundResult.find({ 
      game_id: cleanGameId, 
      team_id 
    }).sort({ round_number: 1 });

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

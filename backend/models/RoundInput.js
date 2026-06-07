import mongoose from 'mongoose';

const roundInputSchema = new mongoose.Schema({
  game_id: {
    type: String,
    required: true,
  },
  round_number: {
    type: Number,
    required: true,
  },
  team_id: {
    type: String,
    required: true,
  },
  p_s: {
    type: Number,
    required: true,
  },
  p_c: {
    type: Number,
    required: true,
  },
  submitted_at: {
    type: Date,
    default: Date.now,
  },
  locked: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Unique constraint: one submission per team per round
roundInputSchema.index(
  { game_id: 1, round_number: 1, team_id: 1 }, 
  { unique: true }
);

export default mongoose.model('RoundInput', roundInputSchema);

import mongoose from 'mongoose';

const roundResultSchema = new mongoose.Schema({
  game_id: { type: String, required: true, lowercase: true },
  round_number: { type: Number, required: true },
  team_id: { type: String, required: true },
  p_s: { type: Number, required: true },
  p_c: { type: Number, required: true },
  new_S: { type: Number, required: true },
  new_C: { type: Number, required: true },
  cum_S: { type: Number, required: true },
  cum_C: { type: Number, required: true },
  monthly_profit: { type: Number, required: true },
  cum_profit: { type: Number, required: true }
}, { timestamps: true });

roundResultSchema.index({ game_id: 1, round_number: 1, team_id: 1 }, { unique: true });

export default mongoose.model('RoundResult', roundResultSchema);

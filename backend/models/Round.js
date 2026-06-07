import mongoose from 'mongoose';

const roundSchema = new mongoose.Schema({
  game_id: {
    type: String,
    required: true,
  },
  round_number: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'OPEN', 'LOCKED', 'COMPUTED'],
    default: 'DRAFT',
  },
}, {
  timestamps: true,
});

// Compound index for game_id + round_number
roundSchema.index({ game_id: 1, round_number: 1 }, { unique: true });

export default mongoose.model('Round', roundSchema);

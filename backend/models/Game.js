import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  game_name: {
    type: String,
    required: true,
    unique: true,
  },
  number_of_teams: {
    type: Number,
    required: true,
  },
  number_of_rounds: {
    type: Number,
    required: true,
  },
  constants: {
    type: Object,
    default: {
      cost_per_participant: 10,
      base_suppliers: 10,
      base_consumers: 100,
      magnifier_suppliers: 2,
      magnifier_consumers: 2,
      initial_cum_suppliers: 10,
      initial_cum_consumers: 100,
    },
  },
  locked: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Game', gameSchema);

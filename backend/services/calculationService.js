import { Game, RoundInput, RoundResult } from '../models/index.js';

export const computeRound = async (game_id, round_number) => {
  try {
    // Get game constants
    const game = await Game.findById(game_id);
    if (!game) throw new Error('Game not found');

    const {
      cost_per_participant,
      base_suppliers,
      base_consumers,
      magnifier_suppliers,
      magnifier_consumers,
      initial_cum_suppliers,
      initial_cum_consumers,
    } = game.constants;

    // Get all inputs for this round
    const inputs = await RoundInput.find({ game_id, round_number });

    if (inputs.length === 0) {
      throw new Error('No inputs found for this round');
    }

    // Calculate averages for current round
    const avg_p_s = inputs.reduce((sum, inp) => sum + inp.p_s, 0) / inputs.length;
    const avg_p_c = inputs.reduce((sum, inp) => sum + inp.p_c, 0) / inputs.length;

    // Get previous round results to calculate cumulative averages
    let avg_cum_suppliers_prev, avg_cum_consumers_prev;

    if (round_number === 1) {
      // Round 1: use initial values
      avg_cum_suppliers_prev = initial_cum_suppliers;
      avg_cum_consumers_prev = initial_cum_consumers;
    } else {
      // Get all team results from previous round
      const prevResults = await RoundResult.find({ 
        game_id, 
        round_number: round_number - 1 
      });

      if (prevResults.length === 0) {
        throw new Error(`Previous round ${round_number - 1} not computed yet`);
      }

      avg_cum_suppliers_prev = 
        prevResults.reduce((sum, r) => sum + r.cum_suppliers, 0) / prevResults.length;
      avg_cum_consumers_prev = 
        prevResults.reduce((sum, r) => sum + r.cum_consumers, 0) / prevResults.length;
    }

    // Compute results for each team
    const results = [];

    for (const input of inputs) {
      const { team_id, p_s, p_c } = input;

      // Get previous cumulative for this team
      let cum_suppliers_prev, cum_consumers_prev, cum_profit_prev;

      if (round_number === 1) {
        cum_suppliers_prev = initial_cum_suppliers;
        cum_consumers_prev = initial_cum_consumers;
        cum_profit_prev = 0;
      } else {
        const prevResult = await RoundResult.findOne({
          game_id,
          round_number: round_number - 1,
          team_id,
        });

        if (!prevResult) {
          throw new Error(`Previous result for team ${team_id} not found`);
        }

        cum_suppliers_prev = prevResult.cum_suppliers;
        cum_consumers_prev = prevResult.cum_consumers;
        cum_profit_prev = prevResult.cum_profit;
      }

      // NEW SUPPLIERS CALCULATION
      const supplier_network_effect = 
        Math.pow((cum_consumers_prev + 1) / (avg_cum_consumers_prev + 1), magnifier_suppliers);
      
      const supplier_price_effect = 
        Math.max(1 - (p_s - avg_p_s) / avg_p_s, 0);
      
      const new_suppliers = 
        base_suppliers * supplier_network_effect * supplier_price_effect;

      // NEW CONSUMERS CALCULATION
      const consumer_network_effect = 
        (cum_suppliers_prev + 1) / (avg_cum_suppliers_prev + 1);
      
      const consumer_price_effect = 
        Math.max(1 - (p_c - avg_p_c) / avg_p_c, 0);
      
      const new_consumers = 
        base_consumers * consumer_network_effect * Math.pow(consumer_price_effect, magnifier_consumers);

      // CUMULATIVE
      const cum_suppliers = cum_suppliers_prev + new_suppliers;
      const cum_consumers = cum_consumers_prev + new_consumers;

      // PROFIT
      const profit = 
        cum_suppliers * (p_s - cost_per_participant) +
        cum_consumers * (p_c - cost_per_participant);

      const cum_profit = cum_profit_prev + profit;

      // Save result
      const result = await RoundResult.create({
        game_id,
        round_number,
        team_id,
        new_suppliers,
        new_consumers,
        cum_suppliers,
        cum_consumers,
        profit,
        cum_profit,
      });

      results.push(result);
    }

    return results;
  } catch (error) {
    throw new Error(`Calculation failed: ${error.message}`);
  }
};

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  BarChart3, 
  RefreshCw, 
  Download, 
  Loader2,
  CheckCircle 
} from 'lucide-react';
import useApi from '../../hooks/useApi';

const MonthlyResults = ({ gameId }) => {
  const api = useApi();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gameId) {
      fetchMonthlyResults();
    }
  }, [gameId]);

  const fetchMonthlyResults = async () => {
    setLoading(true);
    const toastId = toast.loading('Loading monthly results...');

    try {
      const response = await api.get('/admin/analytics/monthly-results', {
        params: { game_id: gameId }
      });

      if (response.data.results.length === 0) {
        toast.update(toastId, {
          render: 'No computed rounds yet. Compute at least one round first.',
          type: 'info',
          isLoading: false,
          autoClose: 5000,
        });
      } else {
        toast.update(toastId, {
          render: `${response.data.results.length} results loaded`,
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
      }
      setResults(response.data.results);
    } catch (error) {
      toast.update(toastId, {
        render: error.response?.data?.message || 'Failed to load results',
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ CSV DOWNLOAD FUNCTION
  const downloadCSV = () => {
    if (results.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const headers = [
      'Round', 'Team', 'Supplier_Price', 'Consumer_Price', 
      'Cum_Suppliers', 'Cum_Consumers', 'Monthly_Profit', 'Total_Profit'
    ];

    const csvRows = [
      headers.join(','),
      ...results.map(result => [
        result.round_number || 0,
        `"${result.team_id || 'N/A'}"`,
        result.p_s ?? 0,
        result.p_c ?? 0,
        result.cum_suppliers ?? result.cum_S ?? 0,
        result.cum_consumers ?? result.cum_C ?? 0,
        result.profit ?? result.monthly_profit ?? 0,
        result.cum_profit ?? 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-${gameId}-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Results exported to CSV!');
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '' || isNaN(value)) {
      return '0';
    }
    return Number(value).toLocaleString();
  };

  const getProfitColor = (profit) => {
    if (profit > 1000) return 'emerald';
    if (profit > 0) return 'amber';
    return 'red';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 p-6 bg-slate-800/50 rounded-xl border border-slate-600">
          <Loader2 className="w-8 h-8 border-purple-400/50 border-t-purple-400 animate-spin" />
          <span className="text-lg font-medium text-slate-300">Loading results...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER WITH DOWNLOAD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Monthly Results</h3>
            <p className="text-slate-400 text-sm">(Updates after round computation)</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={fetchMonthlyResults}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg border border-slate-600 hover:border-slate-500 transition-all duration-200 text-sm flex items-center gap-2 disabled:opacity-50"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-emerald-500/90 hover:bg-emerald-600 text-white font-medium rounded-lg border border-emerald-400/50 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-sm flex items-center gap-2"
            disabled={loading || results.length === 0}
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>

      {/* RESULTS TABLE */}
      {results.length > 0 && (
        <div className="bg-slate-800/20 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700">
                  <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Round</th>
                  <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Team</th>
                  <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Supplier</th>
                  <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Consumer</th>
                  <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Cum. Suppliers</th>
                  <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Cum. Consumers</th>
                  <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Monthly Profit</th>
                  <th className="py-4 px-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">Total Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {results.map((result, idx) => {
                  const roundNum = result.round_number || 0;
                  const teamId = result.team_id || 'N/A';
                  const pSupplier = result.p_s ?? 0;
                  const pConsumer = result.p_c ?? 0;
                  const cumSuppliers = result.cum_suppliers ?? result.cum_S ?? 0;
                  const cumConsumers = result.cum_consumers ?? result.cum_C ?? 0;
                  const monthlyProfit = result.profit ?? result.monthly_profit ?? 0;
                  const cumProfit = result.cum_profit ?? 0;

                  return (
                    <tr key={`${result._id}-${idx}`} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-4 font-mono text-lg font-semibold text-white">
                        R{roundNum}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-linear-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-200">
                          {teamId}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-lg font-semibold text-slate-200">
                        ${formatNumber(pSupplier)}
                      </td>
                      <td className="py-4 px-4 font-mono text-lg font-semibold text-slate-200">
                        ${formatNumber(pConsumer)}
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-slate-300">
                        {formatNumber(cumSuppliers)}
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-slate-300">
                        {formatNumber(cumConsumers)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          getProfitColor(monthlyProfit) === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                          getProfitColor(monthlyProfit) === 'amber' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          'bg-red-500/20 text-red-300 border border-red-500/40'
                        }`}>
                          ${formatNumber(monthlyProfit)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          getProfitColor(cumProfit) === 'emerald' ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/50' :
                          getProfitColor(cumProfit) === 'amber' ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50' :
                          'bg-red-600/30 text-red-200 border border-red-500/50'
                        }`}>
                          ${formatNumber(cumProfit)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {results.length === 0 && !loading && (
        <div className="text-center py-16 bg-slate-800/20 rounded-xl border border-slate-700/50 p-8">
          <div className="w-20 h-20 bg-linear-to-br from-slate-500 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-4">No Results Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Compute rounds in "Manage Rounds" to see team performance data here.
          </p>
        </div>
      )}
    </div>
  );
};

export default MonthlyResults;

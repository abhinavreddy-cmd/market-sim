import { useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';

const ViewResults = () => {
  const { user } = useContext(AuthContext);
  const api = useApi();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllResults();
  }, []);

  const fetchAllResults = async () => {
    setLoading(true);
    try {
      const response = await api.get('/student/my-all-results', {
        params: { game_id: user.game_id },
      });

      setResults(response.data.results);
      if (response.data.results.length === 0) {
        toast.info('No results published yet.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  // ✅ SAFE NUMBER FORMATTER - Handles undefined/null
  const safeFormatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return Number(value).toLocaleString();
  };

  // ✅ FIELD MAPPER - Handles inconsistent API fields
  const getFieldValue = (result, field) => {
    return result[field] ?? result[field.replace('cum_', '')] ?? result[field.replace('_profit', 'profit')] ?? 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-4 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-lg font-semibold text-white drop-shadow-lg">Loading results...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between p-8 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-linear-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-xl">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-xl">My Results</h2>
            <p className="text-slate-400 text-lg mt-1">Team performance across all rounds</p>
          </div>
        </div>
        <button
          onClick={fetchAllResults}
          className="px-6 py-3 bg-linear-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 border border-slate-400/50 flex items-center gap-2 text-lg backdrop-blur-xl"
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* RESULTS TABLE */}
      {results.length > 0 ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-xl overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/20">
                <th className="py-4 px-6 text-left text-lg font-semibold text-slate-300 uppercase tracking-wider">Round</th>
                <th className="py-4 px-6 text-left text-lg font-semibold text-slate-300 uppercase tracking-wider">New Suppliers</th>
                <th className="py-4 px-6 text-left text-lg font-semibold text-slate-300 uppercase tracking-wider">New Consumers</th>
                <th className="py-4 px-6 text-left text-lg font-semibold text-slate-300 uppercase tracking-wider">Cum. Suppliers</th>
                <th className="py-4 px-6 text-left text-lg font-semibold text-slate-300 uppercase tracking-wider">Cum. Consumers</th>
                <th className="py-4 px-6 text-left text-lg font-semibold text-slate-300 uppercase tracking-wider">Round Profit</th>
                <th className="py-4 px-6 text-left text-lg font-semibold text-slate-300 uppercase tracking-wider">Total Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {results.map((result) => (
                <tr key={result._id} className="hover:bg-white/5 transition-colors">
                  <td className="py-5 px-6 font-mono text-xl font-bold text-white">
                    R{result.round_number}
                  </td>
                  <td className="py-5 px-6 font-mono text-lg text-slate-300">
                    {safeFormatNumber(result.new_suppliers ?? result.new_S ?? 0)}
                  </td>
                  <td className="py-5 px-6 font-mono text-lg text-slate-300">
                    {safeFormatNumber(result.new_consumers ?? result.new_C ?? 0)}
                  </td>
                  <td className="py-5 px-6 font-mono text-lg font-semibold text-emerald-400">
                    {safeFormatNumber(result.cum_suppliers ?? result.cum_S ?? 0)}
                  </td>
                  <td className="py-5 px-6 font-mono text-lg font-semibold text-orange-400">
                    {safeFormatNumber(result.cum_consumers ?? result.cum_C ?? 0)}
                  </td>
                  <td className="py-5 px-6">
                    <span className="px-4 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-bold uppercase tracking-wider border-2 border-emerald-500/40">
                      ${safeFormatNumber(getFieldValue(result, 'profit'))}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="px-4 py-1 bg-linear-to-r from-emerald-500/30 to-teal-500/30 text-emerald-200 rounded-full text-sm font-bold uppercase tracking-wider border-2 border-emerald-500/50 shadow-lg">
                      ${safeFormatNumber(result.cum_profit ?? 0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl">
          <div className="w-24 h-24 bg-linear-to-br from-slate-500 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <svg className="w-14 h-14 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-6 drop-shadow-xl">No Results Yet</h3>
          <p className="text-xl text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
            Results appear here after admin computes and publishes each round.
          </p>
          <p className="text-slate-500 text-lg">Check back after round computation!</p>
        </div>
      )}

      {/* INFO */}
      <div className="bg-linear-to-r from-slate-700/50 to-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-500/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-r from-slate-400 to-slate-600 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Results Timeline</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Results update automatically after admin computes each round. Profit badges show round vs cumulative performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewResults;

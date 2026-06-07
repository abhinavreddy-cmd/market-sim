import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Activity, 
  RefreshCw, 
  Download, 
  Loader2,
  CheckCircle 
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PostGameGraphs = ({ gameId }) => {
  const api = useApi();
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ 50 TEAM COLORS (consistent across all charts)
  const TEAM_COLORS = [
    '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#14B8A6',
    '#A855F7', '#FBBF24', '#0EA5E9', '#F87171', '#4ADE80', '#60A5FA', '#FCD34D', '#EC4899', '#10B981', '#3B82F6',
    '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#14B8A6', '#8B5CF6', '#F59E0B', '#10B981', '#3B82F6',
    '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#14B8A6', '#A855F7', '#FBBF24', '#0EA5E9', '#F87171',
    '#4ADE80', '#60A5FA', '#FCD34D', '#EC4899', '#10B981', '#3B82F6', '#EF4444', '#06B6D4', '#84CC16', '#F97316'
  ];

  useEffect(() => {
    if (gameId) {
      fetchGraphData();
    }
  }, [gameId]);

  const fetchGraphData = async () => {
    setLoading(true);
    const toastId = toast.loading('Loading analytics charts...');

    try {
      const response = await api.get('/admin/analytics/post-game-graphs', {
        params: { game_id: gameId }
      });

      if (!response.data.data || Object.keys(response.data.data).length === 0) {
        toast.update(toastId, {
          render: 'No computed rounds yet. Compute rounds first.',
          type: 'info',
          isLoading: false,
          autoClose: 5000,
        });
        setGraphData(null);
      } else {
        toast.update(toastId, {
          render: 'Charts loaded successfully!',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
        setGraphData(response.data);
      }
    } catch (error) {
      toast.update(toastId, {
        render: error.response?.data?.message || 'Failed to load charts',
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ CSV DOWNLOAD - Same format as MonthlyResults
  const downloadChartsCSV = () => {
    if (!graphData?.data || Object.keys(graphData.data).length === 0) {
      toast.warning('No chart data to export');
      return;
    }

    const headers = ['Round', 'Team', 'Supplier_Price', 'Consumer_Price', 'Monthly_Profit', 'Cumulative_Profit'];
    const csvRows = [
      headers.join(','),
      ...graphData.rounds.map((roundNum, roundIdx) => {
        const row = [roundNum];
        Object.values(graphData.data).forEach((team) => {
          row.push(`"${team.team_id}"`);
          row.push(team.supplier_prices[roundIdx] ?? 0);
          row.push(team.consumer_prices[roundIdx] ?? 0);
          row.push(team.monthly_profits[roundIdx] ?? 0);
          row.push(team.cumulative_profits[roundIdx] ?? 0);
        });
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-${gameId}-charts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Charts data exported to CSV!');
  };

  const createChartData = (dataKey, title) => {
    if (!graphData?.data) return null;

    const teams = Object.values(graphData.data);
    const labels = graphData.rounds.map(r => `R${r}`);

    const datasets = teams.map((team, idx) => ({
      label: team.team_id,
      data: team[dataKey].map(value => value ?? 0),
      borderColor: TEAM_COLORS[idx % TEAM_COLORS.length],
      backgroundColor: TEAM_COLORS[idx % TEAM_COLORS.length] + '20',
      borderWidth: 3,
      pointRadius: 5,
      pointHoverRadius: 8,
      tension: 0.3,
      fill: false,
    }));

    return {
      labels,
      datasets,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          title: { 
            display: true, 
            text: title, 
            font: { size: 16, weight: 'bold' }, 
            color: '#F8FAFC', 
            padding: { bottom: 15 } 
          },
          // ✅ LEGENDS REMOVED FROM CHARTS
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#F8FAFC',
            bodyColor: '#CBD5E1',
            borderColor: '#475569',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true
          }
        },
        scales: {
          x: { 
            grid: { color: 'rgba(148, 163, 184, 0.15)', drawBorder: false }, 
            ticks: { color: '#94A3B8', font: { size: 11 } } 
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.15)', drawBorder: false },
            ticks: {
              color: '#94A3B8',
              font: { size: 11 },
              callback: value => '$' + Number(value).toLocaleString()
            }
          }
        },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    };
  };

  const chartConfigs = [
    { key: 'supplier_prices', title: 'Supplier Prices Evolution', icon: '📈' },
    { key: 'consumer_prices', title: 'Consumer Prices Evolution', icon: '🛒' },
    { key: 'monthly_profits', title: 'Monthly Profit Trends', icon: '💰' },
    { key: 'cumulative_profits', title: 'Cumulative Profit Race', icon: '🏆' }
  ];

  // ✅ TEAM LEGEND GENERATOR
  const getTeamLegend = () => {
    if (!graphData?.data) return null;
    const teams = Object.values(graphData.data);
    return teams.map((team, idx) => ({
      id: idx,
      team_id: team.team_id,
      color: TEAM_COLORS[idx % TEAM_COLORS.length]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 p-6 bg-slate-800/30 rounded-xl border border-slate-600">
          <Loader2 className="w-8 h-8 border-emerald-400/50 border-t-emerald-400 animate-spin" />
          <span className="text-lg font-medium text-slate-300">Loading charts...</span>
        </div>
      </div>
    );
  }

  const teamLegend = getTeamLegend();

  return (
    <div className="space-y-6">
      {/* HEADER WITH DOWNLOAD BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-800/20 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-linear-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Post-Game Analytics</h3>
            <p className="text-slate-400 text-sm">Visual competition performance trends</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={fetchGraphData}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg border border-slate-600 hover:border-slate-500 transition-all duration-200 text-sm flex items-center gap-2 disabled:opacity-50"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={downloadChartsCSV}
            className="px-4 py-2 bg-emerald-500/90 hover:bg-emerald-600 text-white font-medium rounded-lg border border-emerald-400/50 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-sm flex items-center gap-2"
            disabled={loading || !graphData?.data || Object.keys(graphData.data).length === 0}
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>

      {/* ✅ TEAM LEGEND - Below Header (ONLY PLACE WITH TEAM NAMES + COLORS) */}
      {teamLegend && teamLegend.length > 0 && (
        <div className="bg-slate-800/20 rounded-xl border border-slate-700/50 p-4">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Team Colors
          </h4>
          <div className="flex flex-wrap gap-3">
            {teamLegend.map((team) => (
              <div key={team.id} className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50 text-sm">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-slate-800 shadow-md"
                  style={{ backgroundColor: team.color }}
                />
                <span className="font-mono text-white font-semibold">{team.team_id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ CHARTS GRID - CLEAN (NO LEGENDS) */}
      {graphData && graphData.data && Object.keys(graphData.data).length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartConfigs.map((config) => {
            const chartDataConfig = createChartData(config.key, config.title);
            return chartDataConfig ? (
              <div key={config.key} className="bg-slate-800/20 rounded-xl border border-slate-700/50 p-6">
                <div className="h-80">
                  <Line data={chartDataConfig} options={chartDataConfig.options} />
                </div>
              </div>
            ) : null;
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-800/20 rounded-xl border border-slate-700/50 p-8">
          <div className="w-20 h-20 bg-linear-to-br from-slate-500 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-4">No Chart Data</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Compute rounds in "Manage Rounds" to generate analytics charts.
          </p>
        </div>
      )}
    </div>
  );
};

export default PostGameGraphs;

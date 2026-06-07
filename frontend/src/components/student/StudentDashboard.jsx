import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  Users, 
  LogOut,
  DollarSign 
} from 'lucide-react';
import SubmitPrices from './SubmitPrices';
// import MyResults from './ViewResults';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('submit');

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        toast.success('Logged out successfully');
        navigate('/login');
      } catch (error) {
        toast.error('Logout failed');
      }
    }
  };

  const TABS = [
    { id: 'submit', label: 'Submit Prices', icon: DollarSign, color: 'bg-emerald-500/90' },
    // { id: 'results', label: 'My Results', icon: BarChart3, color: 'bg-purple-500/90' }
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-950 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-linear-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Competition Dashboard</h1>
              <p className="text-slate-400 text-sm">Team {user?.team_id?.toUpperCase()}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-slate-800/50 hover:bg-slate-700/70 text-white font-medium rounded-xl border border-slate-600/50 hover:border-slate-500 transition-all duration-200 text-sm flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-800/50 rounded-2xl p-1 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl flex-1 font-semibold transition-all duration-200 text-sm ${
                activeTab === tab.id
                  ? `${tab.color} text-white shadow-lg scale-[1.02]`
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="space-y-8">
          {activeTab === 'submit' && <SubmitPrices />}
          {activeTab === 'results' && <MyResults />}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

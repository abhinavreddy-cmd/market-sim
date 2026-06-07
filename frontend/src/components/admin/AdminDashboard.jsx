import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { 
  Gamepad2, 
  PlusCircle, 
  Settings, 
  ClipboardList, 
  BarChart3,
  User
} from "lucide-react";
import CreateGame from "./CreateGame";
import ManageRounds from "./ManageRounds";
import ViewInputs from "./ViewAllInputs";
import Analytics from "./Analytics";
import ManageGames from "./ManageGames";

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("games"); 

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await logout();
        toast.success("Logged out successfully");
        navigate("/login");
      } catch (error) {
        toast.error("Logout failed");
      }
    }
  };

  const TABS = [
    { id: "games", label: "Manage Games", icon: Gamepad2 },     // ✅ NEW FIRST TAB
    { id: "create", label: "Create Game", icon: PlusCircle },
    { id: "manage", label: "Manage Rounds", icon: Settings },
    { id: "inputs", label: "View Inputs", icon: ClipboardList },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold bg-linear-to-r from-white to-slate-200 bg-clip-text text-transparent mb-2">
                Competition Platform
              </h1>
              <p className="text-lg text-slate-400 font-medium">Admin Dashboard</p>
            </div>

            <div className="flex items-center gap-4">
              {/* USER INFO */}
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="w-10 h-10 bg-linear-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Admin</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </div>

              {/* LOGOUT */}
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-slate-800/80 hover:bg-slate-700/90 text-white font-semibold rounded-xl border border-slate-600/50 hover:border-slate-500 transition-all duration-200 text-sm flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-slate-800/30 rounded-2xl p-1 mb-8 border border-slate-700/50">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-1">
            {TABS.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-200 text-md font-semibold ${
                    activeTab === tab.id
                      ? "bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-lg scale-[1.02]"
                      : "text-slate-400 hover:text-white hover:bg-white/10 bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <IconComponent className="w-5 h-5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}
        <div className="space-y-8">
          {activeTab === "games" && <ManageGames />}
          {activeTab === "create" && <CreateGame />}
          {activeTab === "manage" && <ManageRounds />}
          {activeTab === "inputs" && <ViewInputs />}
          {activeTab === "analytics" && <Analytics />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import axios from "axios";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('student');
  const [loading, setLoading] = useState(false);

  // Student form data
  const [studentData, setStudentData] = useState({
    game_id: "",
    team_name: "",
    password: "",
  });

  // Admin form data  
  const [adminData, setAdminData] = useState({
    username: "",
    password: "",
  });

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const toastId = toast.loading("Joining game...");

    try {
      const response = await axios.post("/api/auth/student-login", {
        game_id: studentData.game_id.toUpperCase(),
        team_name: studentData.team_name,
        password: studentData.password,
      });

      await login(response.data.token, response.data.user);
      toast.update(toastId, {
        render: `Welcome Team ${studentData.team_name}!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      toast.update(toastId, {
        render: err.response?.data?.message || "Login failed",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const toastId = toast.loading("Signing in admin...");

    try {
      const response = await axios.post("/api/auth/admin-login", {
        username: adminData.username,
        password: adminData.password,
      });

      await login(response.data.token, response.data.user);
      toast.update(toastId, {
        render: `Welcome ${adminData.username}!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      toast.update(toastId, {
        render: err.response?.data?.message || "Admin login failed",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-r from-emerald-500/5 via-transparent to-orange-500/5" />

      <div className="relative w-full max-w-lg bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Competition Platform</h1>
          <p className="text-base text-slate-300">Academic Competition Dashboard</p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex bg-white/10 rounded-xl p-1 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('student')}
            disabled={loading}
            className={`flex-1 py-3 rounded-lg font-semibold text-base transition-all ${
              activeTab === 'student'
                ? "bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            Student Login
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            disabled={loading}
            className={`flex-1 py-3 rounded-lg font-semibold text-base transition-all ${
              activeTab === 'admin'
                ? "bg-linear-to-r from-orange-500 to-red-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            Admin Login
          </button>
        </div>

        {/* STUDENT LOGIN FORM */}
        {activeTab === 'student' && (
          <form onSubmit={handleStudentLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Game ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={studentData.game_id}
                onChange={(e) => setStudentData({ ...studentData, game_id: e.target.value.toUpperCase() })}
                placeholder="GAME001"
                className="w-full px-4 py-3 rounded-xl bg-white/90 text-slate-900 font-mono tracking-wider focus:outline-none focus:ring-4 focus:ring-emerald-500/40 disabled:opacity-50"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Team Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={studentData.team_name}
                onChange={(e) => setStudentData({ ...studentData, team_name: e.target.value })}
                placeholder="Team Alpha (provided by admin)"
                className="w-full px-4 py-3 rounded-xl bg-white/90 text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/40 disabled:opacity-50"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={studentData.password}
                onChange={(e) => setStudentData({ ...studentData, password: e.target.value })}
                placeholder="Password from admin"
                className="w-full px-4 py-3 rounded-xl bg-white/90 text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/40 disabled:opacity-50"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Joining Game..." : "Join Competition"}
            </button>
          </form>
        )}

        {/* ADMIN LOGIN FORM */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Admin Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={adminData.username}
                onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                placeholder="admin@competition"
                className="w-full px-4 py-3 rounded-xl bg-white/90 text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/40 disabled:opacity-50"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Admin Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={adminData.password}
                onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 rounded-xl bg-white/90 text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/40 disabled:opacity-50"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-linear-to-r from-orange-500 to-red-600 text-white font-semibold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Admin Dashboard"}
            </button>
          </form>
        )}

        <div className="mt-6 p-4 bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50">
          <p className="text-xs text-slate-400 text-center">
            Students: Use Game ID, Team Name & Password from admin | 
            Admin: Use your admin credentials
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

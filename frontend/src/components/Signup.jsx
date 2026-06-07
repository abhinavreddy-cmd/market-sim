import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    team_id: '',
    game_id: '',
  });
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await axios.post('/api/auth/register', {
        username: formData.username,
        password: formData.password,
        team_id: formData.team_id.toUpperCase(),
        role,
        game_id: formData.game_id.toUpperCase(),
      });

      // Auto-login after successful registration
      login(response.data.token, response.data.user);
      
      setMessage('Registration successful! Logging in...');
      
      // Redirect based on role
      setTimeout(() => {
        if (role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="card" style={{ width: '450px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>
          Join Competition
        </h1>

        {message && (
          <div className="alert alert-success">{message}</div>
        )}
        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="team1-admin or team1-player"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Team ID / Group ID</label>
            <input
              type="text"
              value={formData.team_id}
              onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
              placeholder="TEAM1, TEAM2, ADMIN, etc."
              required
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              Your unique team identifier (case-insensitive)
            </small>
          </div>

          <div className="form-group">
            <label>Game ID</label>
            <input
              type="text"
              value={formData.game_id}
              onChange={(e) => setFormData({ ...formData, game_id: e.target.value })}
              placeholder="GAME001 (created by admin)"
              required
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              Game ID from admin (same for all teams)
            </small>
          </div>

          <div className="form-group">
            <label>Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="STUDENT">Student / Team Member</option>
              <option value="ADMIN">Admin / Game Master</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Register & Join
          </button>
        </form>

        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: '#f8f9fa', 
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <small style={{ color: '#666' }}>
            <strong>Workflow:</strong><br />
            1. Admin creates GAME001<br />
            2. Teams register with GAME001 + their TEAMID<br />
            3. Admin opens rounds<br />
            4. Teams submit prices
          </small>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => navigate('/')}
          >
            Have Account? Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;

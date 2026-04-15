import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaseDetail from './pages/CaseDetail';
import EvidenceViewer from './pages/EvidenceViewer';
import Scoreboard from './pages/Scoreboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';
import { Team } from './types';

export default function App() {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedTeam = localStorage.getItem('team');
    const token = localStorage.getItem('token');
    
    if (storedTeam && token) {
      setTeam(JSON.parse(storedTeam));
    }
    setLoading(false);
  }, []);

  const handleLogin = (teamData: Team, token: string) => {
    localStorage.setItem('team', JSON.stringify(teamData));
    localStorage.setItem('token', token);
    setTeam(teamData);
  };

  const handleLogout = () => {
    localStorage.removeItem('team');
    localStorage.removeItem('token');
    setTeam(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-bg flex flex-col items-center justify-center gap-6">
        <div className="p-5 border border-cyber-green/30 neon-border-green boot-enter">
          <div className="w-10 h-10 text-cyber-green animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
          </div>
        </div>
        <div className="font-display text-cyber-green tracking-[0.4em] uppercase text-sm boot-enter flicker-anim">
          Initializing_System...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          team ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        } />
        
        <Route element={
          team ? <Layout team={team} onLogout={handleLogout} /> : <Navigate to="/login" />
        }>
          <Route path="/" element={<Dashboard />} />
          <Route path="/case/:id" element={<CaseDetail />} />
          <Route path="/evidence/:id" element={<EvidenceViewer />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

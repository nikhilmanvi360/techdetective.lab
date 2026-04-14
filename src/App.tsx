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
      <div className="min-h-screen bg-terminal-bg flex items-center justify-center">
        <div className="animate-pulse font-mono text-terminal-green">INITIALIZING_SYSTEM...</div>
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

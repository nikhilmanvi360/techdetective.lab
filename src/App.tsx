import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaseDetail from './pages/CaseDetail';
import EvidenceViewer from './pages/EvidenceViewer';
import Scoreboard from './pages/Scoreboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import BlackMarket from './pages/BlackMarket';
import InvestigationBoard from './pages/InvestigationBoard';
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
      <div className="min-h-screen bg-[#fdfbf2] bg-cover bg-center flex flex-col items-center justify-center gap-6" style={{ backgroundImage: "url('/background.png')" }}>
        <div className="p-5 border-4 border-black bg-white shadow-[8px_8px_0_rgba(0,0,0,1)] transform -rotate-2">
          <div className="w-12 h-12 text-black animate-pulse flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
        <div className="font-display text-black bg-[#fdfbf2] px-4 py-1 border-2 border-black tracking-[0.2em] uppercase text-sm font-bold shadow-sm">
          Sorting Case Files...
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
          <Route path="/black-market" element={<BlackMarket />} />
          <Route path="/board/:caseId" element={<InvestigationBoard />} />
        </Route>
      </Routes>
    </Router>
  );
}

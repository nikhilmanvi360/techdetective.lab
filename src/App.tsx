import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import InvestigationBoard from './pages/InvestigationBoard';
import CaseDetail from './pages/CaseDetail';
import EvidenceViewer from './pages/EvidenceViewer';
import MissionWorkstation from './pages/MissionWorkstation';
import Profile from './pages/Profile';
import BlackMarket from './pages/BlackMarket';
import Layout from './components/Layout';
import { Team } from './types';
import CampaignMap from './pages/CampaignMap';

// Admin sub-pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminTeams from './pages/admin/AdminTeams';
import AdminSubmissions from './pages/admin/AdminSubmissions';
import AdminBuilder from './pages/admin/AdminBuilder';
import AdminSystem from './pages/admin/AdminSystem';
import AdminLayout from './pages/admin/AdminLayout';
import AdminQRManager from './pages/admin/AdminQRManager';
import ScanPage from './pages/ScanPage';

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
        let roleFromToken = 'detective';
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            roleFromToken = payload.role || 'detective';
        } catch (e) { /* ignore */ }
        const teamWithRole = { ...teamData, role: roleFromToken };
        localStorage.setItem('team', JSON.stringify(teamWithRole));
        localStorage.setItem('token', token);
        setTeam(teamWithRole);
    };

    const handleLogout = () => {
        localStorage.removeItem('team');
        localStorage.removeItem('token');
        setTeam(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <div className="w-10 h-10 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
                <div className="font-display text-[#d4a017] tracking-[0.4em] uppercase text-sm">Initializing...</div>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                {/* ── Public Routes ── */}
                <Route path="/start" element={team ? <Navigate to="/" /> : <LandingPage />} />
                <Route path="/login" element={team ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />

                 {/* ── Redirect root to /start if not logged in ── */}
                 <Route path="/" element={team ? (
                     <Layout team={team} onLogout={handleLogout} />
                 ) : (
                     <Navigate to="/start" />
                 )}>
                     <Route index element={<InvestigationBoard />} />
                     <Route path="case/:id" element={<CaseDetail />} />
                     <Route path="mission/:id" element={<MissionWorkstation />} />
                     <Route path="evidence/:id" element={<EvidenceViewer />} />
                     <Route path="profile" element={<Profile />} />
                     <Route path="black-market" element={<BlackMarket />} />
                     <Route path="campaign" element={<CampaignMap />} />
                     <Route path="scan" element={<ScanPage />} />
                 </Route>

                {/* ── Admin Routes (use their own layout) ── */}
                <Route path="/admin" element={team?.role === 'admin' || team?.name === 'CCU_ADMIN'
                    ? <AdminLayout team={team} onLogout={handleLogout} />
                    : <Navigate to="/" />
                }>
                    <Route index element={<AdminOverview />} />
                    <Route path="teams" element={<AdminTeams />} />
                    <Route path="submissions" element={<AdminSubmissions />} />
                    <Route path="builder" element={<AdminBuilder />} />
                    <Route path="system" element={<AdminSystem />} />
                    <Route path="qr" element={<AdminQRManager />} />
                </Route>

                {/* ── Fallback ── */}
                <Route path="*" element={<Navigate to={team ? '/' : '/start'} />} />
            </Routes>
        </Router>
    );
}

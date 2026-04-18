import React, { useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Search, FolderOpen, Shield, User, Lock, LogOut } from 'lucide-react';
import { Team } from '../types';
import { useSound } from '../hooks/useSound';
import { useAdversary } from '../hooks/useAdversary';
import { getRankTitle } from '../utils/ranks';
import LiveTicker from './LiveTicker';

interface LayoutProps {
  team: Team | null;
  onLogout: () => void;
}

export default function Layout({ team, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { playSound } = useSound();
  const { isGlitching } = useAdversary();

  const handleLogout = () => {
    playSound('error');
    onLogout();
    navigate('/login');
  };

  const navItem = (to: string, icon: React.ReactNode, label: string) => (
    <Link
      to={to}
      onClick={() => playSound('click')}
      className={`group flex flex-col items-center gap-1 transition-all ${
        location.pathname === to ? 'opacity-100' : 'opacity-50 hover:opacity-100'
      }`}
    >
      <div className={`p-1 ${location.pathname === to ? 'text-[#d1b88a]' : 'text-gray-400'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-sans font-bold uppercase tracking-widest ${location.pathname === to ? 'text-[#d1b88a]' : 'text-gray-400'}`}>{label}</span>
      <div className={`w-full h-0.5 mt-1 transition-all ${location.pathname === to ? 'bg-[#d1b88a]' : 'bg-transparent'}`} />
    </Link>
  );

  return (
    <div className={`min-h-screen flex flex-col selection:bg-black/20 selection:text-black ${isGlitching ? 'adversary-glitch' : ''}`}>
      {/* Navigation HUD */}
      <header className="bg-[#10141a] border-b border-[#2d3748] sticky top-0 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <nav className="hidden lg:flex items-center gap-10 flex-1">
            {navItem('/search', <Search className="w-5 h-5" />, 'SEARCH')}
            {navItem('/', <FolderOpen className="w-5 h-5" />, 'CASES')}
            {navItem('/scoreboard', <Shield className="w-5 h-5" />, 'RANKINGS')}
            {navItem('/profile', <User className="w-5 h-5" />, 'PROFILE')}
            {team?.name === 'CCU_ADMIN' && navItem('/admin', <Lock className="w-5 h-5" />, 'ADMIN')}
          </nav>

          <Link to="/" onClick={() => playSound('click')} className="flex flex-col items-center flex-[1.5] text-center group">
            <span className="font-display text-2xl tracking-[0.2em] text-[#d1b88a] group-hover:text-white transition-colors">
              TECHDETECTIVE
            </span>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] mt-1">Digital Crime Lab v4.0</span>
          </Link>

          <div className="flex items-center gap-6 flex-1 justify-end">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-[#d1b88a] opacity-80" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-sans font-bold text-gray-200 uppercase">{team?.name || 'GUEST'}</span>
                {team && (
                  <span className="text-[10px] font-display text-gray-500 uppercase tracking-widest stamp !border-none !p-0 !rotate-0 opacity-100">
                    {getRankTitle(team.score).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 opacity-40 hover:opacity-100 transition-all text-red-500"
              title="End Shift"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto relative z-10 py-12 px-6">
        <Outlet />
      </main>

      {team && <LiveTicker />}
    </div>
  );
}

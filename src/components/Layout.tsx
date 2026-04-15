import React, { useEffect, useMemo } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Terminal, LogOut, LayoutDashboard, Trophy, ShieldAlert, User, Shield, Activity, Cpu } from 'lucide-react';
import { Team } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import LiveTicker from './LiveTicker';
import { getRankTitle, getRankColor } from '../utils/ranks';
import { useSound } from '../hooks/useSound';

interface LayoutProps {
  team: Team | null;
  onLogout: () => void;
}

function ParticleField() {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      duration: `${10 + Math.random() * 20}s`,
      delay: `${Math.random() * 15}s`,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            '--x': p.x,
            '--duration': p.duration,
            '--delay': p.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default function Layout({ team, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { playSound } = useSound();

  useEffect(() => {
    playSound('ping');
  }, [location.pathname, playSound]);

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
        location.pathname === to ? 'text-cyber-green' : 'text-gray-500 hover:text-white'
      }`}
    >
      <div className={`p-2 border transition-all ${
        location.pathname === to ? 'border-cyber-green neon-border-green' : 'border-transparent group-hover:border-gray-700'
      }`}>
        {icon}
      </div>
      <span className="text-[10px] font-display uppercase tracking-[0.2em]">{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col bg-cyber-bg relative selection:bg-cyber-green selection:text-black">
      {/* Ambient Particles */}
      <ParticleField />

      {/* Visual Overlays */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="scanline" />
        <div className="absolute inset-0 cyber-grid opacity-10" />
      </div>

      {/* Navigation HUD */}
      <header className="border-b border-cyber-line bg-black/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" onClick={() => playSound('click')} className="flex items-center gap-4 group">
            <div className="p-3 bg-cyber-green/5 border border-cyber-green/40 group-hover:neon-border-green transition-all relative">
              <ShieldAlert className="w-6 h-6 text-cyber-green flicker-anim" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyber-green rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl tracking-widest text-white leading-none glitch-text">
                TECH<span className="text-cyber-green">DETECTIVE</span>
              </span>
              <span className="text-[10px] font-mono text-cyber-green/60 uppercase tracking-[0.3em]">Digital Crime Lab v4.0</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {navItem('/', <LayoutDashboard className="w-5 h-5" />, 'Dashboard')}
            {navItem('/scoreboard', <Trophy className="w-5 h-5" />, 'Rankings')}
            {navItem('/profile', <User className="w-5 h-5" />, 'Profile')}
            {team?.name === 'CCU_ADMIN' && navItem('/admin', <Shield className="w-5 h-5" />, 'Admin')}
          </nav>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end border-r border-cyber-line pr-6">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-3 h-3 text-cyber-blue" />
                <span className="text-[10px] font-display text-cyber-blue uppercase tracking-widest">Active_Node</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-display text-white font-bold">{team?.name || 'GUEST'}</span>
                {team && (
                  <span className={`text-[9px] px-2 py-0.5 border font-bold ${getRankColor(team.score).replace('text-', 'border-').replace('bg-', 'bg-opacity-10 bg-')}`}>
                    {getRankTitle(team.score).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-cyber-green" />
                <span className="text-[10px] font-display text-cyber-green uppercase tracking-widest">Telemetry</span>
              </div>
              <span className="text-lg font-display text-white font-bold tracking-tighter tabular-nums">
                {team?.score?.toLocaleString() || 0} <span className="text-[10px] text-cyber-green/50">PTS</span>
              </span>
            </div>

            <button 
              onClick={handleLogout}
              className="p-3 border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/10 hover:border-cyber-red hover:neon-border-red transition-all group"
              title="Terminate Connection"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
        {/* Gradient accent line */}
        <div className="header-gradient-line" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Interface */}
      <footer className="border-t border-cyber-line py-8 mt-12 mb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 text-[10px] font-display tracking-widest">
            <div className="flex items-center gap-2 text-cyber-green">
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              SYSTEM_LINK: ESTABLISHED
            </div>
            <div className="w-[1px] h-4 bg-cyber-line" />
            <div className="text-gray-600">ENCRYPTION: AES-256_ACTIVE</div>
          </div>
          <p className="text-[10px] font-display text-gray-700 uppercase tracking-widest">
            &copy; 2026 DIGITAL CRIME LAB | K.L.E TECH UNIVERSITY | INTERNAL OPS ONLY
          </p>
        </div>
      </footer>

      {team && <LiveTicker />}
    </div>
  );
}


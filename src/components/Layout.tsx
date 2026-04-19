import React, { useEffect, useMemo } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Terminal, LogOut, LayoutDashboard, Trophy, ShieldAlert, User, Shield, Activity, Cpu, Zap, X, Skull } from 'lucide-react';
import { Team } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import LiveTicker from './LiveTicker';
import GameAdvisor from './GameAdvisor';
import { getRankTitle, getRankColor } from '../utils/ranks';
import { useSound } from '../hooks/useSound';
import { useAdversary } from '../hooks/useAdversary';

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
  const { isGlitching, glitchMessage, guidanceHint, dismissGuidance } = useAdversary();

  // AudioContext warning resolved by removing automatic sounds on navigation.
  // Standard sound effects on click/interaction still work.

  // Play sound on adversary events
  useEffect(() => {
    if (isGlitching) playSound('error');
  }, [isGlitching, playSound]);

  useEffect(() => {
    if (guidanceHint) playSound('ping');
  }, [guidanceHint, playSound]);

  const handleLogout = () => {
    playSound('error');
    onLogout();
    navigate('/login');
  };

  const navItem = (to: string, icon: React.ReactNode, label: string) => (
    <Link
      to={to}
      onClick={() => playSound('click')}
      className={`group flex flex-col items-center gap-1 transition-all ${location.pathname === to ? 'text-cyber-green' : 'text-gray-500 hover:text-white'
        }`}
    >
      <div className={`p-2 border transition-all ${location.pathname === to ? 'border-cyber-green neon-border-green' : 'border-transparent group-hover:border-gray-700'
        }`}>
        {icon}
      </div>
      <span className="text-[10px] font-display uppercase tracking-[0.2em]">{label}</span>
    </Link>
  );

  return (
    <div className={`min-h-screen flex flex-col bg-cyber-bg relative selection:bg-cyber-green selection:text-black transition-all duration-300 ${isGlitching ? 'adversary-glitch' : ''}`}>
      {/* Ambient Particles */}
      <ParticleField />

      {/* Visual Overlays */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="scanline" />
        <div className="absolute inset-0 cyber-grid opacity-10" />
      </div>

      {/* Adversary Signal Interference Overlay */}
      <AnimatePresence>
        {isGlitching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] pointer-events-none"
          >
            <div className="absolute inset-0 bg-cyber-red/5 mix-blend-overlay" />
            <div className="absolute inset-0 animate-pulse" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239,68,68,0.03) 2px, rgba(239,68,68,0.03) 4px)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-black/90 border-2 border-cyber-red/50 px-10 py-6 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-cyber-red animate-pulse" />
                  <span className="text-xs font-display text-cyber-red uppercase tracking-[0.4em] font-bold">Adversary_Detected</span>
                </div>
                <p className="text-sm font-mono text-cyber-red/80">{glitchMessage}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adversary Guidance Hint Banner */}
      <AnimatePresence>
        {guidanceHint && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-0 left-0 right-0 z-[55] bg-gradient-to-r from-cyber-amber/10 via-cyber-amber/5 to-cyber-amber/10 border-b border-cyber-amber/30 backdrop-blur-md"
          >
            <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-cyber-amber/10 border border-cyber-amber/30 animate-pulse">
                  <ShieldAlert className="w-5 h-5 text-cyber-amber" />
                </div>
                <div>
                  <div className="text-[10px] font-display text-cyber-amber uppercase tracking-[0.3em] mb-1">Adversary_Guidance</div>
                  <p className="text-sm font-mono text-cyber-amber/90">{guidanceHint}</p>
                </div>
              </div>
              <button
                onClick={dismissGuidance}
                className="p-2 text-cyber-amber/50 hover:text-cyber-amber transition-colors pointer-events-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            {navItem('/black-market', <Skull className="w-5 h-5 text-cyber-red" />, 'Shadow_Market')}
            {location.pathname.startsWith('/case/') && !location.pathname.includes('/board/') && (
              <Link 
                to={`/board/${location.pathname.split('/').pop()}`}
                onClick={() => playSound('click')}
                className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-display uppercase tracking-widest border border-dashed border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/5 transition-all animate-pulse"
              >
                <Activity className="w-3 h-3" /> Investigative_Board
              </Link>
            )}
            {(team?.role === 'admin' || team?.name === 'CCU_ADMIN') && navItem('/admin', <Shield className="w-5 h-5" />, 'Admin')}
          </nav>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end border-r border-cyber-line pr-6">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className={`w-3 h-3 ${team?.role === 'analyst' ? 'text-cyber-blue' : 'text-cyber-green'}`} />
                <span className={`text-[10px] font-display uppercase tracking-widest ${team?.role === 'analyst' ? 'text-cyber-blue' : 'text-cyber-green'}`}>
                  {team?.role === 'analyst' ? 'Analyst_Console' : (team?.role === 'admin' ? 'Admin_Link' : 'Hacker_Interface')}
                </span>
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
      {team && <GameAdvisor team={team} location={location.pathname} />}
    </div>
  );
}


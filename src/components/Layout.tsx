import React, { useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Team } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import LiveTicker from './LiveTicker';
import GameAdvisor from './GameAdvisor';
import { getRankTitle, getRankColor } from '../utils/ranks';
import { useSound } from '../hooks/useSound';
import { useAdversary } from '../hooks/useAdversary';
import { ShieldAlert, X, Zap } from 'lucide-react';

interface LayoutProps {
  team: Team | null;
  onLogout: () => void;
}

function ParticleField() {
  const particles = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      duration: `${12 + Math.random() * 20}s`,
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

  const rankTitle = team ? getRankTitle(team.score) : '';
  const rankColor = team ? getRankColor(team.score) : '';

  return (
    <div className={`min-h-screen flex flex-col bg-cyber-bg relative selection:bg-cyber-green selection:text-black transition-all duration-300 ${isGlitching ? 'adversary-glitch' : ''}`}>
      <ParticleField />

      {/* Global overlays */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="scanline" />
        <div className="crt-vignette" />
        <div className="absolute inset-0 cyber-grid opacity-5" />
      </div>

      {/* Adversary glitch overlay */}
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
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

      {/* Guidance hint banner */}
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
              <button onClick={dismissGuidance} className="p-2 text-cyber-amber/50 hover:text-cyber-amber transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING HUD BAR (replaces the old sticky top-nav) ── */}
      <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
        {/* Left: Logo identifier */}
        <div className="pointer-events-auto flex items-center gap-3 bg-black/80 border border-cyber-green/20 px-4 py-2 backdrop-blur-md"
          style={{ boxShadow: '0 0 20px rgba(34,197,94,0.06)' }}>
          <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          <span className="font-display text-cyber-green text-xs tracking-[0.3em] uppercase">TECH<span className="text-white">DETECTIVE</span></span>
          <div className="w-[1px] h-3 bg-cyber-line mx-1" />
          <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">CCU v4.0</span>
        </div>

        {/* Right: Player HUD */}
        {team && (
          <div className="pointer-events-auto flex items-center gap-3 bg-black/80 border border-cyber-line px-4 py-2 backdrop-blur-md">
            <div className="flex flex-col items-end">
              <span className={`text-[9px] font-display uppercase tracking-widest ${rankColor}`}>{rankTitle}</span>
              <span className="text-sm font-display text-white font-bold leading-none">{team.name}</span>
            </div>
            <div className="w-[1px] h-8 bg-cyber-line" />
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">XP</span>
              <span className="text-lg font-display text-cyber-green font-bold tabular-nums leading-none"
                style={{ textShadow: '0 0 10px rgba(34,197,94,0.5)' }}>
                {team.score?.toLocaleString() || '0'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 text-[9px] font-display text-cyber-red/50 hover:text-cyber-red uppercase tracking-widest transition-colors border border-transparent hover:border-cyber-red/30 px-2 py-1"
            >
              [DISCONNECT]
            </button>
          </div>
        )}
      </div>

      {/* Main Content — full screen, no max-width container constraints from the old Layout */}
      <main className="flex-1 relative z-10 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {team && <LiveTicker />}
      {team && <GameAdvisor team={team} location={location.pathname} />}
    </div>
  );
}

import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Team } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import LiveTicker from './LiveTicker';
import GameAdvisor from './GameAdvisor';
import { getRankTitle, getRankColor } from '../utils/ranks';
import { useSound } from '../hooks/useSound';
import { useAdversary } from '../hooks/useAdversary';
import { ShieldAlert, X, Zap, Map as MapIcon, Trophy, Users, User, LogOut } from 'lucide-react';
import DetectiveHUD from './DetectiveHUD';
import StateTransition from './StateTransition';

interface LayoutProps {
  team: Team | null;
  onLogout: () => void;
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

  return (
    <div className={`min-h-screen flex flex-col relative transition-all duration-300 ${isGlitching ? 'grayscale sepia contrast-125' : ''}`}>
      {/* Adversary Intercept Overlay */}
      <AnimatePresence>
        {isGlitching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] pointer-events-none"
          >
            <div className="absolute inset-0 bg-[#3a1a1a]/30 mix-blend-overlay" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="parchment-panel p-8"
              >
                <div className="flex items-center gap-3 mb-2 pb-2 border-b border-[#8B6914]/30">
                  <Zap className="w-5 h-5 text-[#8B6914] animate-pulse" />
                  <span className="text-xs font-display text-[#1a0e04] uppercase tracking-[0.4em] font-bold">Classified_Intercept</span>
                </div>
                <p className="text-sm font-mono text-[#2a1c0a] mt-4 font-bold">{glitchMessage}</p>
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
            className="fixed top-0 left-0 right-0 z-[55] bg-[#e2c07c] border-b border-[#a07830] shadow-md"
          >
            <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 border border-[#8B6914] animate-pulse">
                  <ShieldAlert className="w-5 h-5 text-[#8B6914]" />
                </div>
                <div>
                  <div className="text-[10px] font-display text-[#1a0e04] uppercase tracking-[0.3em] font-bold mb-1">Adversary_Guidance</div>
                  <p className="text-sm font-mono text-[#2a1c0a]">{guidanceHint}</p>
                </div>
              </div>
              <button onClick={dismissGuidance} className="p-2 text-[#8B6914] hover:text-[#1a0e04] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* NOIR NAVIGATION BAR */}
      <nav className="relative z-[50] h-16 bg-[#1a1005] border-b-4 border-[#3a2810] shadow-2xl flex items-center px-6 gap-8 overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
        
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 border-2 border-[#d4a017] flex items-center justify-center font-black text-[#d4a017] text-xs">TD</div>
           <span className="text-[#f0d070] uppercase font-black tracking-widest text-sm hidden md:block">Investigation Suite</span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-1 md:gap-4">
           {[
             { path: '/', label: 'Board', icon: MapIcon },
             { path: '/lobby', label: 'Investigations', icon: Users },
             { path: '/scoreboard', label: 'Archives', icon: Trophy },
             { path: '/profile', label: 'Dossier', icon: User },
           ].map((nav) => {
             const active = location.pathname === nav.path;
             return (
               <Link
                 key={nav.path}
                 to={nav.path}
                 onClick={() => playSound('click')}
                 className={`flex items-center gap-2 px-4 py-2 uppercase text-[10px] font-black tracking-widest transition-all ${
                   active 
                     ? 'bg-[#d4a017] text-[#140e06] shadow-[0_0_15px_rgba(212,160,23,0.3)]' 
                     : 'text-[#a07830] hover:text-[#f0d070] hover:bg-white/5'
                 }`}
               >
                 <nav.icon className="w-3.5 h-3.5" />
                 <span className="hidden sm:inline">{nav.label}</span>
               </Link>
             );
           })}
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 border border-[#a07830]/30 text-[#a07830] uppercase text-[10px] font-black tracking-widest hover:bg-[#8B2020] hover:text-[#f0e0a0] transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-hidden">
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

      {/* Real-time Game HUD & Transitions */}
      <DetectiveHUD />
      <StateTransition />

      {team && <LiveTicker />}
      {team && <GameAdvisor team={team} location={location.pathname} />}
    </div>
  );
}

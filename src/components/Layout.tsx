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



      {/* 🕵️ NOIR BUREAU NAVIGATION */}
      <nav className="relative z-[50] h-18 bg-[#1a1005] border-b-[6px] border-[#3a2810] shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex items-center px-8 gap-10 overflow-hidden">
        {/* Wood grain & Shadow depth */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-wood.png")' }} />
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#d4a017]/20 shadow-[0_0_10px_#d4a017]" />
        
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 border-2 border-[#d4a017] shadow-[inset_0_0_10px_rgba(212,160,23,0.3)] flex items-center justify-center font-black text-[#d4a017] text-sm rotate-3">
              CCU
           </div>
           <div className="flex flex-col leading-none">
              <span className="text-[#f0d070] uppercase font-black tracking-[0.2em] text-xs">Bureau Network</span>
              <span className="text-[#a07830] uppercase font-bold tracking-[0.4em] text-[7px] mt-1">Classified Intelligence</span>
           </div>
        </div>

        <div className="flex-1 flex items-center justify-center gap-1 md:gap-2">
           {[
             { path: '/', label: 'Bureau Command', icon: MapIcon },
             { path: '/scoreboard', label: 'Evidence Registry', icon: Trophy },
             { path: '/profile', label: 'Field Badge', icon: User },
           ].map((nav) => {
             const active = location.pathname === nav.path;
             return (
               <Link
                 key={nav.path}
                 to={nav.path}
                 onClick={() => playSound('click')}
                 className={`group flex items-center gap-3 px-6 py-2 uppercase text-[9px] font-black tracking-[0.3em] transition-all relative ${
                   active 
                     ? 'text-[#140e06] bg-[#d4a017] shadow-[0_0_20px_rgba(212,160,23,0.4)]' 
                     : 'text-[#a07830] hover:text-[#f0d070]'
                 }`}
               >
                 {active && <div className="absolute -top-1 -inset-x-0 h-1 bg-[#f0d070]" />}
                 <nav.icon className="w-3.5 h-3.5" />
                 <span className="hidden lg:inline">{nav.label}</span>
               </Link>
             );
           })}
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden xl:flex flex-col items-end leading-none border-r border-[#a07830]/30 pr-6 mr-2">
              <span className="text-[7px] font-black text-[#a07830] uppercase tracking-widest mb-1">Operative Rank</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${getRankColor(team?.score || 0)}`}>{rankTitle}</span>
           </div>
           <button 
             onClick={handleLogout}
             className="flex items-center gap-2 h-10 px-4 border-2 border-[#8B2020]/40 text-[#8B2020] uppercase text-[9px] font-black tracking-widest hover:bg-[#8B2020] hover:text-[#f0e0a0] transition-all"
           >
             <LogOut className="w-3.5 h-3.5" />
             <span className="hidden md:inline">Abort Session</span>
           </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col min-h-0 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 flex flex-col min-h-0"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {team && <GameAdvisor team={team} location={location.pathname} />}
      <StateTransition />
    </div>
  );
}

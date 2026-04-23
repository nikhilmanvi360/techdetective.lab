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
  team: Team;
  onLogout: () => void;
}

export default function Layout({ team, onLogout }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { playSound } = useSound();
  const { notifications, removeNotification } = useAdversary();
  const rankTitle = getRankTitle(team?.score || 0);

  const menuItems = [
    { label: 'Bureau Command', path: '/', icon: MapIcon },
    { label: 'Field Dispatch', path: '/lobby', icon: Users },
    { label: 'Evidence Registry', path: '/scoreboard', icon: Trophy },
    { label: 'Field Badge', path: '/profile', icon: User },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#140e06] text-[#f0e0a0] selection:bg-[#d4a017] selection:text-[#140e06]">
      <DetectiveHUD team={team} />
      <StateTransition />

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
           {menuItems.map((nav) => {
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
             onClick={() => { playSound('click'); onLogout(); }}
             className="w-10 h-10 border-2 border-[#8B2020] bg-[#1a0e04] flex items-center justify-center text-[#8B2020] hover:bg-[#8B2020] hover:text-white transition-all shadow-xl"
           >
              <LogOut className="w-5 h-5" />
           </button>
        </div>
      </nav>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#140e06]">
        <Outlet />
        
        {/* Global Notifications Overlay */}
        <div className="absolute bottom-20 right-8 flex flex-col items-end gap-3 z-[100] pointer-events-none">
           <AnimatePresence>
              {notifications.map((notif) => (
                <motion.div
                   key={notif.id}
                   initial={{ opacity: 0, x: 100, scale: 0.9 }}
                   animate={{ opacity: 1, x: 0, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                   className="pointer-events-auto bg-[#1a1005] border-l-4 border-[#d4a017] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] min-w-[300px] relative overflow-hidden"
                >
                   <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-wood.png")' }} />
                   <div className="flex items-start gap-4">
                      <div className="p-2 bg-[#d4a017]/10 border border-[#d4a017]/30">
                         {notif.type === 'adversary' ? <ShieldAlert className="w-5 h-5 text-[#8B2020]" /> : <Zap className="w-5 h-5 text-[#d4a017]" />}
                      </div>
                      <div className="flex-1">
                         <div className="text-[9px] font-black text-[#d4a017] uppercase tracking-[0.2em] mb-1">Bureau Alert</div>
                         <div className="text-xs font-bold text-[#f0e0a0] leading-snug">{notif.message}</div>
                      </div>
                      <button onClick={() => removeNotification(notif.id)} className="text-[#a07830] hover:text-[#f0e0a0]">
                         <X className="w-4 h-4" />
                      </button>
                   </div>
                   <motion.div 
                      initial={{ width: '100%' }}
                      animate={{ width: 0 }}
                      transition={{ duration: 5, ease: 'linear' }}
                      className="absolute bottom-0 left-0 h-[2px] bg-[#d4a017]"
                   />
                </motion.div>
              ))}
           </AnimatePresence>
        </div>
      </main>

      <LiveTicker />
      <GameAdvisor />
      
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #140e06; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3a2810; border: 2px solid #140e06; }
      `}</style>
    </div>
  );
}

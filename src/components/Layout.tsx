import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Team } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import LiveTicker from './LiveTicker';
import GameAdvisor from './GameAdvisor';
import { useSound } from '../hooks/useSound';
import { useAdversary } from '../hooks/useAdversary';
import { ShieldAlert, X, Zap } from 'lucide-react';
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
  const { activeActions, resolveAction } = useAdversary();
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#140e06] text-[#f0e0a0] selection:bg-[#d4a017] selection:text-[#140e06] relative">
      {/* Global Immersive Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #d4a017, #d4a017 1px, transparent 1px, transparent 4px)' }} />
      <div className="fixed inset-0 pointer-events-none z-[9999] shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
      
      <DetectiveHUD team={team} />
      <StateTransition />

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#140e06]">
        <Outlet context={{ team }} />
        
        {/* Global Notifications Overlay */}
        <div className="absolute bottom-20 right-8 flex flex-col items-end gap-3 z-[100] pointer-events-none">
           <AnimatePresence>
              {(activeActions || []).map((notif: any) => (
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
                         {notif.action_type === 'signal_interference' ? <ShieldAlert className="w-5 h-5 text-[#8B2020]" /> : <Zap className="w-5 h-5 text-[#d4a017]" />}
                      </div>
                      <div className="flex-1">
                         <div className="text-[9px] font-black text-[#d4a017] uppercase tracking-[0.2em] mb-1">Bureau Alert</div>
                         <div className="text-xs font-bold text-[#f0e0a0] leading-snug">
                            {notif.metadata?.message || 'Unauthorized signal trace detected.'}
                         </div>
                      </div>
                      <button onClick={() => resolveAction(notif.id)} className="text-[#a07830] hover:text-[#f0e0a0]">
                         <X className="w-4 h-4" />
                      </button>
                   </div>
                </motion.div>
              ))}
           </AnimatePresence>
        </div>
      </main>

      <LiveTicker />
      <GameAdvisor team={team} location={location.pathname} />
      
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

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ShieldAlert, Award } from 'lucide-react';
import { io } from 'socket.io-client';

export default function DetectiveHUD() {
  const [round, setRound] = useState<string>('LOBBY');
  const [seconds, setSeconds] = useState(0);
  const [isExpiring, setIsExpiring] = useState(false);

  useEffect(() => {
    const socket = io(window.location.origin);

    socket.on('game_state_update', (data) => {
      setRound(data.currentState);
      setSeconds(data.timer);
    });

    socket.on('game_timer_tick', (data) => {
      setSeconds(data.timer);
      if (data.timer < 60) setIsExpiring(true);
      else setIsExpiring(false);
    });

    return () => { socket.disconnect(); };
  }, []);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (round === 'LOBBY' || round === 'COMPLETED') return null;

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[55] flex items-center gap-4 pointer-events-none"
    >
       {/* ROUND LABEL */}
       <div className="bg-[#f0e0a0] border-4 border-[#a07830] px-8 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform -rotate-1 origin-right relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#1a0e04]/5 to-transparent opacity-50" />
          <div className="relative z-10">
             <div className="text-[9px] font-black text-[#a07830] uppercase tracking-[0.4em] leading-none mb-2 opacity-70">Current Operational Phase</div>
             <div className="text-2xl font-black text-[#2a1a0a] uppercase tracking-tighter flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-[#8B2020] animate-pulse" />
                {round.replace('_', ' ')}
             </div>
          </div>
          {/* Subtle metallic shine */}
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
       </div>

       {/* BRASS TIMER */}
       <div className={`relative w-28 h-28 rounded-full border-[10px] border-[#3a2810] shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center overflow-hidden ${isExpiring ? 'animate-pulse' : ''}`} style={{ background: 'radial-gradient(circle at 30% 30%, #f5e6c8 0%, #d4a017 60%, #8b6914 100%)' }}>
          <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
          
          <Clock className="w-5 h-5 text-[#2a1a0a]/30 mb-1" />
          <div className={`text-3xl font-black font-mono tracking-tighter tabular-nums ${isExpiring ? 'text-[#8B2020]' : 'text-[#2a1a0a]'}`}>
             {formatTime(seconds)}
          </div>
          
          {/* Subtle reflection & Glass effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-full bg-black/5 pointer-events-none" />
       </div>
    </motion.div>
  );
}

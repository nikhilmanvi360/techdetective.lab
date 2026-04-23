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
       <div className="bg-[#f0e0a0] border-4 border-[#a07830] px-6 py-2 shadow-xl transform -rotate-1 origin-right">
          <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.3em] leading-none mb-1">Active Phase</div>
          <div className="text-xl font-black text-[#2a1a0a] uppercase tracking-tighter flex items-center gap-2">
             <ShieldAlert className="w-5 h-5 text-[#8B2020]" />
             {round.replace('_', ' ')}
          </div>
       </div>

       {/* BRASS TIMER */}
       <div className={`relative w-24 h-24 rounded-full border-8 border-[#3a2810] shadow-2xl flex flex-col items-center justify-center overflow-hidden ${isExpiring ? 'animate-pulse' : ''}`} style={{ background: 'radial-gradient(circle, #f0d070 0%, #d4a017 100%)' }}>
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
          
          <Clock className="w-4 h-4 text-[#2a1a0a]/40 mb-1" />
          <div className={`text-2xl font-black font-mono tracking-tighter ${isExpiring ? 'text-[#8B2020]' : 'text-[#2a1a0a]'}`}>
             {formatTime(seconds)}
          </div>
          
          {/* Subtle reflection */}
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/20 rotate-45 pointer-events-none" />
       </div>
    </motion.div>
  );
}

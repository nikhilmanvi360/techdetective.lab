import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { useSound } from '../hooks/useSound';

export default function StateTransition() {
  const [show, setShow] = useState(false);
  const [nextRound, setNextRound] = useState('');
  const { playSound } = useSound();

  useEffect(() => {
    const socket = io(window.location.origin);

    socket.on('game_state_update', (data) => {
      setNextRound(data.currentState);
      setShow(true);
      playSound('success'); // Play a heavy stamp/slam sound

      // Auto-hide after 4 seconds
      const timer = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(timer);
    });

    return () => { socket.disconnect(); };
  }, [playSound]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
           <motion.div
              initial={{ scale: 0.5, y: 100, rotate: -5 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 1.5, opacity: 0, rotate: 5 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-[#f0e0a0] border-[16px] border-[#a07830] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative max-w-2xl w-full text-center"
           >
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
              
              <div className="text-[12px] font-black text-[#a07830] uppercase tracking-[0.5em] mb-4">Urgent Dispatch</div>
              
              <h2 className="text-6xl md:text-8xl font-black text-[#2a1a0a] uppercase tracking-tighter mb-6">
                 {nextRound.replace('_', ' ')}
              </h2>

              <div className="h-1 bg-[#8B2020] mb-8 w-1/4 mx-auto" />

              <p className="font-serif italic text-xl text-[#a07830]">
                 "New evidence has come to light. Move quickly, detective."
              </p>

              {/* Red Stamp Overlay */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 border-8 border-[#8B2020]/30 rounded-full flex items-center justify-center text-[#8B2020]/30 font-black text-2xl uppercase rotate-12 select-none">
                 COMMAND
              </div>
           </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

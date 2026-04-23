import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Radio, ShieldAlert, Award, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSound } from '../hooks/useSound';

interface LiveEvent {
 message: string;
 type: 'solve' | 'badge' | 'case';
 timestamp: string;
}

export default function LiveTicker() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const { playSound } = useSound();

  useEffect(() => {
    const socket = io();

    socket.on('live_event', (event: LiveEvent) => {
      playSound('ping');
      const id = Date.now();
      const eventWithId = { ...event, id };
      setEvents(prev => [eventWithId, ...prev].slice(0, 3)); // Keep last 3
      
      // Auto-remove after 6 seconds
      setTimeout(() => {
        setEvents(prev => prev.filter(e => (e as any).id !== id));
      }, 6000);
    });

    return () => {
      socket.disconnect();
    };
  }, [playSound]);

  return (
    <div className="fixed top-14 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-72">
      <AnimatePresence mode="popLayout">
        {events.map((event, index) => (
          <motion.div
            key={(event as any).id}
            initial={{ x: 50, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 20, opacity: 0, scale: 0.9 }}
            className="bg-[#1a0e04]/90 border border-[#a07830] p-3 shadow-2xl backdrop-blur-sm relative overflow-hidden"
            layout
          >
            {/* Scanner line effect */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#a07830]/10 to-transparent pointer-events-none"
            />
            
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {event.type === 'solve' && <CheckCircle className="w-4 h-4 text-[#d4a017]" />}
                {event.type === 'badge' && <Award className="w-4 h-4 text-[#f0a030]" />}
                {event.type === 'case' && <ShieldAlert className="w-4 h-4 text-red-600" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] font-black text-[#d4a017] uppercase tracking-[0.2em]">
                    Live_Comms // {event.type.toUpperCase()}
                  </span>
                  <span className="text-[7px] font-mono text-[#a07830]/60">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-[10px] font-mono leading-relaxed text-[#f0d070] break-words uppercase">
                  {event.message}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

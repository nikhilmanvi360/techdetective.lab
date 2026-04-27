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
    <div className="fixed top-24 right-8 z-[100] flex flex-col gap-4 pointer-events-none w-80">
      <AnimatePresence mode="popLayout">
        {events.map((event, index) => (
          <motion.div
            key={(event as any).id}
            initial={{ x: 100, opacity: 0, filter: 'blur(10px)' }}
            animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ x: 50, opacity: 0, scale: 0.95 }}
            className="bg-[#1a0e04] border-l-4 border-[#d4a017] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl group"
            layout
          >
            {/* Tactical grid background overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d4a017 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="mt-1 shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#d4a017]/10 flex items-center justify-center border border-[#d4a017]/20">
                  {event.type === 'solve' && <CheckCircle className="w-4 h-4 text-[#d4a017]" />}
                  {event.type === 'badge' && <Award className="w-4 h-4 text-[#f0a030]" />}
                  {event.type === 'case' && <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-[#d4a017] uppercase tracking-[0.3em]">
                    COMMS_TRACE // {event.type.toUpperCase()}
                  </span>
                  <span className="text-[8px] font-mono text-[#a07830]/40">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] font-mono leading-relaxed text-[#f0e0a0] break-words uppercase tracking-tight">
                  {event.message}
                </p>
                <div className="mt-2 h-0.5 w-full bg-[#d4a017]/10 relative overflow-hidden">
                   <motion.div 
                     initial={{ x: '-100%' }}
                     animate={{ x: '100%' }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-y-0 w-1/3 bg-[#d4a017]/40"
                   />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

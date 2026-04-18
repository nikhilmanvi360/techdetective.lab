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
    // Connect to the same host that serves the app
    const socket = io();

    socket.on('live_event', (event: LiveEvent) => {
      playSound('ping');
      setEvents(prev => {
        const newEvents = [event, ...prev];
        return newEvents.slice(0, 5); // Keep last 5 events
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [playSound]);

  if (events.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#eadda5] border-t-2 border-black p-2 z-[999] flex items-center gap-4 overflow-hidden shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-2 text-black animate-pulse shrink-0 px-2 py-0.5 border-2 border-black bg-white rounded-none">
        <Radio className="w-4 h-4" />
        <span className="text-[10px] font-display uppercase tracking-[0.2em] font-bold">DISPATCH_WIRE</span>
      </div>
      
      <div className="flex-1 relative h-6 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {events.map((event, index) => (
            <motion.div
              key={event.timestamp + index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center gap-2 text-xs typewriter-text"
              style={{ zIndex: events.length - index }}
            >
              {event.type === 'solve' && <CheckCircle className="w-3 h-3 text-[#15803d]" />}
              {event.type === 'badge' && <Award className="w-3 h-3 text-[rgb(212,175,55)]" />}
              {event.type === 'case' && <ShieldAlert className="w-3 h-3 text-[#8b0000]" />}
              
              <span className={
                event.type === 'solve' ? 'text-[#15803d] font-bold' :
                event.type === 'badge' ? 'text-[rgb(212,175,55)] font-bold' : 'text-[#8b0000] font-bold'
              }>
                {event.message}
              </span>
              <span className="text-gray-500 text-[9px] font-sans uppercase tracking-widest ml-auto px-4 font-bold">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

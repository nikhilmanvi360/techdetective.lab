import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Radio, ShieldAlert, Award, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LiveEvent {
  message: string;
  type: 'solve' | 'badge' | 'case';
  timestamp: string;
}

export default function LiveTicker() {
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    // Connect to the same host that serves the app
    const socket = io();

    socket.on('live_event', (event: LiveEvent) => {
      setEvents(prev => {
        const newEvents = [event, ...prev];
        return newEvents.slice(0, 5); // Keep last 5 events
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (events.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-terminal-line/30 p-2 z-50 flex items-center gap-4 overflow-hidden">
      <div className="flex items-center gap-2 text-terminal-green animate-pulse shrink-0">
        <Radio className="w-4 h-4" />
        <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Live Feed</span>
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
              className="absolute inset-0 flex items-center gap-2 text-xs font-mono"
              style={{ zIndex: events.length - index }}
            >
              {event.type === 'solve' && <CheckCircle className="w-3 h-3 text-terminal-green" />}
              {event.type === 'badge' && <Award className="w-3 h-3 text-yellow-500" />}
              {event.type === 'case' && <ShieldAlert className="w-3 h-3 text-red-500" />}
              
              <span className={
                event.type === 'solve' ? 'text-terminal-green' :
                event.type === 'badge' ? 'text-yellow-500' : 'text-red-500'
              }>
                {event.message}
              </span>
              <span className="text-gray-600 text-[10px]">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

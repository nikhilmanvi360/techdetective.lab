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
 <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 border-t border-[rgba(200,160,80,0.2)] p-2 z-50 flex items-center gap-4 overflow-hidden backdrop-blur-md">
 <div className="flex items-center gap-2 text-[#d4a017] animate-pulse shrink-0 px-2 py-0.5 border border-[#d4a017]/20 rounded-sm">
 <Radio className="w-4 h-4" />
 <span className="text-[10px] font-display uppercase tracking-[0.2em] font-bold">Live_Comms</span>
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
 {event.type === 'solve' && <CheckCircle className="w-3 h-3 text-[#d4a017]" />}
 {event.type === 'badge' && <Award className="w-3 h-3 text-[#f0a030]" />}
 {event.type === 'case' && <ShieldAlert className="w-3 h-3 text-[rgba(200,70,70,0.8)]" />}
 
 <span className={
 event.type === 'solve' ? 'text-[#d4a017]' :
 event.type === 'badge' ? 'text-[#f0a030]' : 'text-[rgba(200,70,70,0.8)]'
 }>
 {event.message}
 </span>
 <span className="text-[#8B6914] text-[9px] font-display uppercase tracking-widest ml-auto px-4">
 {new Date(event.timestamp).toLocaleTimeString()}
 </span>
 </motion.div>
 ))}
 </AnimatePresence>
 </div>
 </div>
 );
}


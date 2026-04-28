import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import OpeningMonologue from '../../components/round3/OpeningMonologue';
import ScanPage from '../ScanPage';
import { Shield, Clock, Search, Zap } from 'lucide-react';

export default function Round1Page() {
  const [phase, setPhase] = useState('ACTIVE');
  const [monologueData, setMonologueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = io();
    
    // Fetch initial state
    fetch('/api/r1/state', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      setPhase(data.subPhase);
      setMonologueData(data.monologueData);
      setLoading(false);
    });

    socket.on('r1_phase_update', (data) => setPhase(data.phase));
    socket.on('r1_monologue_update', (data) => setMonologueData(data));

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#0a0805] text-[#f4e6c4] font-mono">
      <AnimatePresence mode="wait">
        {phase === 'MONOLOGUE' && (
          <motion.div
            key="monologue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black"
          >
            <OpeningMonologue 
                data={{
                    eventName: "TECH DETECTIVE: ROUND 1",
                    round1Action: monologueData?.intro || "The investigation begins now.",
                    round2Action: monologueData?.objective || "Scan every corner. Leave no stone unturned.",
                    suspectAnswer: monologueData?.warning || "The digital footprints are fading.",
                    timestamp: new Date().toLocaleTimeString(),
                    rank: "RECRUIT",
                    points: 0,
                    redHerring: "Unknown Signal Detected",
                    twistReveal: "SYSTEM READY",
                    realQuestion: "Who is the ghost in the machine?",
                    duration: 60,
                    aiName: "CENTRAL_OPS"
                }} 
                onComplete={() => {}} 
            />
          </motion.div>
        )}

        {phase === 'ACTIVE' && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            {/* Round 1 HUD */}
            <div className="fixed top-0 left-0 right-0 z-[50] h-20 bg-gradient-to-b from-black to-transparent flex items-center justify-between px-10 pointer-events-none">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#d4a017]" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-[#d4a017]">Phase: Living Crime Scene</span>
                    </div>
                    <div className="h-4 w-[2px] bg-white/10" />
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#d4a017]" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-[#a07830]">Active Link</span>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-[#a07830] uppercase tracking-widest">Network Integrity</span>
                        <div className="w-32 h-1 bg-white/5 mt-1 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-[#d4a017]"
                                animate={{ width: ['90%', '95%', '92%', '98%'] }}
                                transition={{ duration: 5, repeat: Infinity }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <ScanPage />
          </motion.div>
        )}

        {phase === 'SUMMARY' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-screen p-10 text-center"
          >
             <Zap className="w-20 h-20 text-[#d4a017] mb-8 animate-pulse" />
             <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">Round 1 Concluded</h1>
             <p className="text-[#a07830] max-w-xl uppercase tracking-widest text-sm leading-relaxed mb-12">
                All evidence has been synchronized with Central Command. The field operation is now entering standby. Return to the Bureau for further instructions.
             </p>
             <button 
                onClick={() => window.location.href = '/board'}
                className="px-10 py-4 bg-[#d4a017] text-black font-black uppercase tracking-widest hover:bg-[#f0d070] transition-colors"
             >
                Return to Bureau
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

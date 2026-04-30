import { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import Round3Challenges from '../../components/round3/Round3Challenges';


export default function Round3Page() {
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [isConditionRed, setIsConditionRed] = useState(false);

  useEffect(() => {
    // Initial fetch to sync timer if needed
    const fetchState = async () => {
      try {
        const res = await fetch('/api/r3/state', {
          headers: { 'Authorization': `Bearer ${''}` }
        });
        const data = await res.json();
        const start = data.startTime || Date.now();
        const elapsed = Math.floor((Date.now() - start) / 1000);
        setTimeRemaining(Math.max(0, 3600 - elapsed));
      } catch (e) {}
      setLoading(false);
    };

    fetchState();

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const next = prev > 0 ? prev - 1 : 0;
        if (next <= 300 && next > 0) setIsConditionRed(true);
        else setIsConditionRed(false);
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono text-[#d4a017]">
      <div className="text-xl animate-pulse uppercase tracking-[0.5em]">Establishing Secure Link...</div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#0c0803] text-[#f4e6c4] overflow-hidden transition-all duration-1000 ${isConditionRed ? 'shadow-[inset_0_0_100px_rgba(139,32,32,0.4)]' : ''}`}>
      {/* Condition Red Overlay */}
      <AnimatePresence>
          {isConditionRed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="fixed inset-0 z-50 pointer-events-none bg-red-900/20 mix-blend-overlay"
              />
          )}
      </AnimatePresence>

      <div className="relative z-10 pt-4">
        <Round3Challenges timeRemaining={timeRemaining} />
      </div>

      <style>{`
        body { background-color: #0c0803; }
      `}</style>
    </div>
  );
}


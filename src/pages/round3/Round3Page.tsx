import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, AlertTriangle } from 'lucide-react';
import OpeningMonologue from '../../components/round3/OpeningMonologue';
import MissionBriefing from '../../components/round3/MissionBriefing';
import Round3Challenges from '../../components/round3/Round3Challenges';
import FinalReveal from '../../components/round3/FinalReveal';
import NeuralLinkTerminal from '../../components/round3/NeuralLinkTerminal';

import { Round3SubPhase } from '../../engine/round3Manager';

const socket = io();

export default function Round3Page() {
  const [subPhase, setSubPhase] = useState<Round3SubPhase>('MONOLOGUE');
  const [monologueData, setMonologueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [globalMitigation, setGlobalMitigation] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(4680);
  const [isConditionRed, setIsConditionRed] = useState(false);

  useEffect(() => {
    const fetchState = async () => {
      const res = await fetch('/api/r3/state', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setSubPhase(data.subPhase);
      setMonologueData(data.monologueData);
      setGlobalMitigation(data.globalMitigationPoints || 0);
      
      const start = data.startTime || Date.now();
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setTimeRemaining(Math.max(0, 4680 - elapsed));
      setLoading(false);
    };

    fetchState();

    socket.on('r3_sub_phase_update', ({ subPhase }) => {
      setSubPhase(subPhase);
    });

    socket.on('r3_monologue_data_update', (data) => {
      setMonologueData(data);
    });

    socket.on('r3_global_mitigation_update', (data) => {
      setGlobalMitigation(data.points);
    });

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const next = prev > 0 ? prev - 1 : 0;
        if (next <= 300 && next > 0) setIsConditionRed(true);
        else setIsConditionRed(false);
        return next;
      });
    }, 1000);

    return () => {
      socket.off('r3_sub_phase_update');
      socket.off('r3_monologue_data_update');
      socket.off('r3_global_mitigation_update');
      clearInterval(timer);
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono text-[#d4a017]">
      <div className="text-xl animate-pulse uppercase tracking-[0.5em]">Establishing Secure Link...</div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-black text-[#f4e6c4] overflow-hidden transition-all duration-1000 ${isConditionRed ? 'shadow-[inset_0_0_100px_rgba(139,32,32,0.4)]' : ''}`}>
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

      {/* Global Defense Tracker (Visible during Challenges) */}
      {subPhase === 'CHALLENGE' && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
            <div className={`flex items-center gap-3 transition-colors ${isConditionRed ? 'text-red-500' : 'text-[#d4a017]'}`}>
                {isConditionRed ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Shield className="w-4 h-4" />}
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Global Defense Integrity</span>
            </div>
            <div className="w-96 h-2 bg-white/5 border border-white/10 rounded-full overflow-hidden relative backdrop-blur-sm">
                <motion.div 
                    className={`h-full transition-all duration-1000 ${isConditionRed ? 'bg-red-600' : 'bg-[#d4a017]'}`}
                    animate={{ width: `${Math.min(100, globalMitigation / 10)}%` }}
                />
                {isConditionRed && (
                    <motion.div 
                      className="absolute inset-0 bg-white/20"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                )}
            </div>
            <div className="text-[8px] font-black uppercase tracking-widest opacity-40">
                {globalMitigation} / 1000 STABILITY_THRESHOLD
            </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {subPhase === 'MONOLOGUE' && (
          <motion.div key="monologue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <OpeningMonologue data={monologueData} />
          </motion.div>
        )}
        {subPhase === 'BRIEFING' && (
          <motion.div key="briefing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MissionBriefing />
          </motion.div>
        )}
        {subPhase === 'CHALLENGE' && (
          <motion.div key="challenge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-24">
            <Round3Challenges />
          </motion.div>
        )}
        {subPhase === 'NEURAL_LINK' && (
          <motion.div key="neural" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-12">
            <NeuralLinkTerminal />
          </motion.div>
        )}
        {subPhase === 'REVEAL' && (
          <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FinalReveal data={monologueData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

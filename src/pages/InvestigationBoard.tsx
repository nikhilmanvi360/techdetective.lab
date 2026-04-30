import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Activity, Shield, ChevronLeft, Database, Search, 
  Map as MapIcon, Zap, Target, Lock, AlertCircle
} from 'lucide-react';
import { io } from 'socket.io-client';

interface Case {
  id: string;
  title: string;
  difficulty: string;
  points: number;
  status: string;
  round: string;
  source: 'db' | 'json';
}

export default function InvestigationBoard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const { team } = useOutletContext<{ team: any }>();
  const [view, setView] = useState<'PHASES' | 'CASES'>('PHASES');
  const [round, setRound] = useState<string>('LOBBY');

  useEffect(() => {
    const socket = io(window.location.origin);
    socket.on('game_state_update', (data) => {
      setRound(data.currentState);
    });

    const fetchCases = async () => {
      try {
        const res = await fetch('/api/cases', {
          headers: { 'Authorization': `Bearer ${''}` }
        });
        const data = await res.json();
        setCases(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Board Error:', err);
      } finally {
        setLoading(false);
      }
    };

    const checkRound0 = async () => {
        if (team?.role === 'admin') return;
        const res = await fetch('/api/r0/state', {
            headers: { 'Authorization': `Bearer ${''}` }
        });
        const data = await res.json();
        if (!data.completedAt) navigate('/round0');
    };

    fetchCases();
    checkRound0();
    return () => { socket.disconnect(); };
  }, []);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="relative">
        <Activity className="w-16 h-16 text-[#d4a017] animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 border-2 border-[#d4a017] rounded-full animate-ping opacity-20" />
      </div>
    </div>
  );

  const isFinalPhase = round === 'ROUND_3' || round === 'FINAL';

  return (
    <div className="h-full relative overflow-hidden flex flex-col bg-[#0c0e0b]">
      {/* Immersive Overlays */}
      <div className="absolute inset-0 z-0 bg-[url('/assets/cyber_noir_bg.png')] bg-cover bg-center opacity-5 grayscale pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />
      <div className="scanline" />
      <div className="crt-vignette" />

      <AnimatePresence mode="wait">
        {view === 'PHASES' ? (
          <motion.div 
            key="phases"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-10 flex-1 flex flex-col p-12 overflow-y-auto custom-scrollbar"
          >
            {/* Mission Status Header */}
            <div className="max-w-7xl mx-auto w-full mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-[#d4a017]/10 border border-[#d4a017]/30 rounded-lg">
                  <Target className="w-8 h-8 text-[#d4a017]" />
                </div>
                <div>
                  <h1 className="text-5xl font-black text-[#f5e6c8] uppercase tracking-tighter mb-1">
                    Bureau <span className="text-[#d4a017]">Operations</span>
                  </h1>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse" />
                    <span className="text-[10px] font-mono font-black text-[#a07830] uppercase tracking-[0.4em]">Link_Status: Active_Deployment</span>
                  </div>
                </div>
              </div>

              {isFinalPhase && (
                 <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="p-6 glass-panel border-l-4 border-l-[#d4a017] bg-black/60 flex items-center gap-6"
                 >
                   <AlertCircle className="w-10 h-10 text-[#d4a017] animate-pulse" />
                   <div>
                     <h3 className="text-[#f5e6c8] font-black uppercase tracking-widest text-sm mb-1">High-Stakes Narrative Shift</h3>
                     <p className="text-[#a07830] text-[11px] uppercase tracking-widest font-black italic">"Points are no longer the point. Focus on forensic integrity."</p>
                   </div>
                 </motion.div>
              )}
            </div>

            {/* Phase Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full mb-12">
              <PhaseCard 
                num="00"
                title="Case Dossiers"
                description="Analyze legacy encrypted data and standalone cases."
                icon={<FileText />}
                status="Secondary"
                onClick={() => setView('CASES')}
              />
              <PhaseCard 
                num="01"
                title="Log Analysis"
                description="Cross-reference the Pen-Test Report with raw server logs."
                icon={<Search />}
                status="Primary"
                active={round === 'ROUND_1'}
                onClick={() => navigate('/round1')}
              />
              <PhaseCard 
                num="02"
                title="Tactical Map"
                description="Trace the suspect's physical and digital footprints."
                icon={<MapIcon />}
                status="Deployment"
                active={round === 'ROUND_2'}
                onClick={() => navigate('/campaign')}
              />
              <PhaseCard 
                num="03"
                title="Archive Dive"
                description="Dive into the Compliance Data Lake to locate the simulation."
                icon={<Database />}
                status="Infiltration"
                active={round === 'ROUND_3'}
                onClick={() => navigate('/archive')}
              />
              <PhaseCard 
                num="04"
                title="Final Verdict"
                description="Reconstruct the timeline and trigger the counter-strike."
                icon={<Shield />}
                status="Termination"
                active={round === 'FINAL'}
                locked={team?.role !== 'admin' && team?.name !== 'CCU_ADMIN' && round !== 'FINAL'}
                onClick={() => navigate('/round3')}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="cases"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-10 flex-1 flex flex-col p-12 overflow-y-auto custom-scrollbar"
          >
            <div className="max-w-7xl mx-auto w-full mb-12 border-b border-[#3a2810] pb-8">
              <button 
                onClick={() => setView('PHASES')}
                className="flex items-center gap-2 text-[#a07830] hover:text-[#d4a017] transition-colors uppercase text-[10px] font-black tracking-[0.3em] mb-4"
              >
                <ChevronLeft className="w-4 h-4" /> Return to Command
              </button>
              <h2 className="text-5xl font-black text-[#f5e6c8] uppercase tracking-tighter">Active <span className="text-[#d4a017]">Investigations</span></h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
              {cases.map((c, i) => (
                <CaseCard 
                  key={c.id} 
                  c={c} 
                  i={i} 
                  isFinalPhase={isFinalPhase}
                  onClick={() => navigate(c.source === 'json' ? `/mission/${c.id}` : `/case/${c.id}`)} 
                />
              ))}
              {cases.length === 0 && (
                <div className="col-span-full py-32 text-center detective-panel bg-black/40">
                  <FileText className="w-16 h-16 text-[#a07830] mx-auto opacity-20 mb-4" />
                  <p className="text-[#a07830] font-black uppercase tracking-[0.4em] text-xs">No dossiers available for current clearance level.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PhaseCard({ num, title, description, icon, status, onClick, active, locked }: any) {
  return (
    <motion.div
      whileHover={locked ? {} : { y: -8, scale: 1.02 }}
      onClick={onClick}
      className={`detective-panel p-8 group cursor-pointer transition-all ${active ? 'border-[#d4a017] ring-1 ring-[#d4a017]/30' : ''} ${locked ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      <div className="flex justify-between items-start mb-10">
        <div className={`p-4 bg-black/60 border-2 transition-all ${active ? 'border-[#d4a017] text-[#d4a017]' : 'border-[#3a2810] text-[#a07830] group-hover:border-[#d4a017]/40 group-hover:text-[#f5e6c8]'}`}>
          {React.cloneElement(icon, { className: 'w-8 h-8' })}
        </div>
        <span className="text-4xl font-black text-[#3a2810] group-hover:text-[#d4a017]/20 transition-colors font-mono">{num}</span>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-2xl font-black text-[#f5e6c8] uppercase tracking-tighter group-hover:text-[#d4a017] transition-colors">{title}</h3>
        <p className="text-[#a07830] text-xs leading-relaxed font-black uppercase tracking-widest opacity-60 line-clamp-2">{description}</p>
      </div>

      <div className="mt-8 pt-6 border-t border-[#3a2810] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {locked ? (
            <div className="flex items-center gap-2 text-red-500">
              <Lock className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Locked</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#d4a017]">
              <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#2ecc71] animate-pulse' : 'bg-[#d4a017]'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest">{active ? 'Live Now' : status}</span>
            </div>
          )}
        </div>
        {!locked && <Zap className="w-4 h-4 text-[#d4a017] opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
    </motion.div>
  );
}

import React from 'react';

function CaseCard({ c, _i, onClick, isFinalPhase }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10, scale: 1.02 }}
      onClick={onClick}
      className="detective-panel p-6 group cursor-pointer overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="px-3 py-1 bg-black/60 border border-[#d4a017]/30 text-[#d4a017] text-[8px] font-black uppercase tracking-widest">
          {c.difficulty}
        </div>
        <FileText className="w-5 h-5 text-[#a07830] group-hover:text-[#d4a017] transition-colors" />
      </div>

      <div className="space-y-3 mb-8">
        <div className="text-[7px] font-mono text-[#a07830] uppercase tracking-[0.4em] opacity-40">Ref: {String(c.id).substring(0, 8)}</div>
        <h3 className="text-xl font-black text-[#f5e6c8] uppercase tracking-tighter leading-tight group-hover:text-glow transition-all">{c.title}</h3>
      </div>

      <div className="mt-auto space-y-4 pt-6 border-t border-[#3a2810]">
        <div className="flex justify-between items-center">
          <span className="text-[8px] font-black text-[#a07830] uppercase tracking-widest">Clearance</span>
          <span className={`text-lg font-black tracking-tighter ${isFinalPhase ? 'text-[#a07830] line-through' : 'text-[#d4a017]'}`}>
            {isFinalPhase ? "???" : `${c.points} XP`}
          </span>
        </div>
        <button className="detective-button w-full !py-2 !text-[9px]">
          Examine
        </button>
      </div>
    </motion.div>
  );
}


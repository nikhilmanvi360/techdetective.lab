import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Activity, Users, Plus, 
  Map as MapIcon, Shield, ChevronLeft, Database, Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
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
  const [team] = useState(() => JSON.parse(localStorage.getItem('team') || '{}'));
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
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
        // Admin Bypass for Round 0
        if (team?.role === 'admin' || team?.name === 'CCU_ADMIN') return;

        const res = await fetch('/api/r0/state', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (!data.completedAt) {
            navigate('/round0');
        }
    };

    fetchCases();
    checkRound0();

    return () => { socket.disconnect(); };
  }, []);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#140e06]">
      <Activity className="w-10 h-10 text-[#d4a017] animate-pulse" />
    </div>
  );

  const isFinalPhase = round === 'ROUND_3' || round === 'FINAL';

  return (
    <div className="h-full relative overflow-hidden flex flex-col bg-[#140e06]">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-wood.png")' }} />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none" />
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />

      <AnimatePresence mode="wait">
        {view === 'PHASES' ? (
          <motion.div 
            key="phases"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center p-12 overflow-y-auto custom-scrollbar"
          >
            {isFinalPhase && (
               <motion.div 
                 initial={{ opacity: 0, y: -20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="absolute top-10 text-[#d4a017] font-black uppercase tracking-[0.5em] text-xs border-y-2 border-[#d4a017]/30 py-4 px-12 bg-black/40 backdrop-blur-md z-50"
               >
                 "Points are no longer the point."
               </motion.div>
            )}
            <div className="text-center mb-16 relative">
              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#d4a017]" />
                <span className="text-[#d4a017] font-black uppercase tracking-[0.5em] text-[10px] drop-shadow-lg">Operational Command Center</span>
                <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#d4a017]" />
              </div>
              <h1 className="text-7xl font-black text-[#f0e0a0] uppercase tracking-tighter font-serif italic mb-2 drop-shadow-2xl">
                Bureau <span className="text-[#a07830]">Operations</span>
              </h1>
              <p className="text-[#a07830] font-serif italic mt-6 opacity-80 max-w-xl mx-auto leading-relaxed text-lg">
                "Select a mission sector to begin the engagement. All actions are logged under CCU authority."
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full">
              {/* Phase 1: Dossiers (Legacy) */}
              <PhaseCard 
                num="00"
                title="Case Dossiers"
                description="Analyze legacy encrypted data and standalone cases."
                icon={<FileText className="w-10 h-10" />}
                status="Optional"
                color="#a07830"
                onClick={() => setView('CASES')}
              />

              {/* Phase 1: The Logs */}
              <PhaseCard 
                num="01"
                title="The Logs"
                description="Cross-reference the Pen-Test Report with raw server logs."
                icon={<Search className="w-10 h-10" />}
                status="Active Engagement"
                color="#d4a017"
                onClick={() => navigate('/round1')}
              />

              {/* Phase 2: The Map */}
              <PhaseCard 
                num="02"
                title="The Map"
                description="Trace the suspect's physical and digital footprints across the bank."
                icon={<MapIcon className="w-10 h-10" />}
                status="Operational Ready"
                color="#1a6a8a"
                onClick={() => navigate('/campaign')}
              />

              {/* Phase 3: The Archive */}
              <PhaseCard 
                num="03"
                title="The Archive"
                description="Dive into the Compliance Data Lake to locate the simulation."
                icon={<Database className="w-10 h-10" />}
                status="Operational Ready"
                color="#d4a017"
                onClick={() => navigate('/archive')}
              />

              {/* Phase 4: The Verdict */}
              <PhaseCard 
                num="04"
                title="The Verdict"
                description="Reconstruct the timeline and trigger the final counter-strike."
                icon={<Shield className="w-10 h-10" />}
                status={team?.role === 'admin' || team?.name === 'CCU_ADMIN' ? 'Operational Ready (Bypass)' : 'Locked - Awaiting Clearance'}
                color="#8B2020"
                disabled={team?.role !== 'admin' && team?.name !== 'CCU_ADMIN'}
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
            <div className="flex items-center justify-between mb-12 border-b border-[#a07830]/30 pb-8">
              <div>
                <button 
                  onClick={() => setView('PHASES')}
                  className="flex items-center gap-2 text-[#a07830] hover:text-[#d4a017] transition-colors uppercase text-[10px] font-black tracking-[0.3em] mb-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Phases
                </button>
                <h2 className="text-5xl font-black text-[#f0e0a0] uppercase tracking-tighter">Active <span className="text-[#a07830]">Investigations</span></h2>
              </div>
              <div className="flex flex-col items-end opacity-50">
                <span className="text-[9px] font-mono text-[#a07830] uppercase tracking-widest">Bureau Registry</span>
                <span className="text-[10px] font-mono text-[#f0e0a0]">{cases.length} Folders Found</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-12 justify-center lg:justify-start">
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
                <div className="w-full py-32 text-center">
                  <FileText className="w-16 h-16 text-[#a07830] mx-auto opacity-20 mb-4" />
                  <p className="text-[#a07830] font-serif italic opacity-40">"No active dossiers match your clearance level."</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PhaseCard({ num, title, description, icon, status, color, onClick, disabled }: any) {
  return (
    <motion.div
      whileHover={{ y: -12, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex-1 group relative bg-[#e8d5a0] border-[12px] border-[#a07830] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.4)] transition-all cursor-pointer ${disabled ? 'opacity-40 grayscale pointer-events-none' : 'hover:border-[#f0e0a0] hover:shadow-[0_40px_80px_rgba(212,160,23,0.2)]'}`}
    >
      <div className="absolute top-6 right-6 text-6xl font-black text-[#a07830]/10 font-serif italic select-none">{num}</div>
      <div className="relative z-10">
        <div className={`w-20 h-20 mb-10 flex items-center justify-center border-[6px] border-[#a07830] transition-all group-hover:bg-[#a07830]/5 group-hover:shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]`} style={{ color }}>
          {icon}
        </div>
        <h3 className="text-3xl font-black text-[#2a1a0a] uppercase tracking-tighter mb-4 group-hover:text-black transition-colors">{title}</h3>
        <p className="text-[#2a1a0a] font-serif italic opacity-80 mb-10 leading-relaxed text-lg">{description}</p>
        <div className="flex items-center justify-between mt-auto pt-6 border-t-2 border-[#a07830]/20">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
             <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color }}>{status}</span>
          </div>
          <span className="text-xl font-black text-[#a07830] group-hover:translate-x-3 transition-transform">&rarr;</span>
        </div>
      </div>
      {/* Subtle paper texture overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-paper.png')] opacity-10 pointer-events-none" />
    </motion.div>
  );
}

function CaseCard({ c, i, onClick, isFinalPhase }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: i % 2 === 0 ? -0.5 : 0.5 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ rotate: 0, scale: 1.04, y: -15, zIndex: 50 }}
      onClick={onClick}
      className="w-[300px] h-[400px] bg-[#f5e8b0] p-8 shadow-2xl relative cursor-pointer group border-b-[16px] border-r-[16px] border-[#a07830]/40 transition-shadow hover:shadow-[0_50px_100px_rgba(0,0,0,0.6)]"
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-paper.png')] opacity-20 pointer-events-none" />
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div className="px-3 py-1.5 bg-[#2a1a0a] text-[#f0e0a0] text-[9px] font-black uppercase tracking-widest shadow-md">{c.difficulty}</div>
          <div className="text-[#a07830] opacity-40 group-hover:opacity-100 transition-opacity"><FileText className="w-6 h-6" /></div>
        </div>
        <div className="mb-4">
           <span className="text-[8px] font-black text-[#a07830] uppercase tracking-[0.4em] opacity-60">Case Dossier No. {String(c.id).substring(0, 8)}</span>
           <h3 className="text-2xl font-serif italic font-black text-[#2a1a0a] leading-[1.1] mt-1 group-hover:text-black transition-colors">{c.title}</h3>
        </div>
        <div className="flex-1 border-y border-[#a07830]/20 my-6 py-6 overflow-hidden">
           <p className="text-[11px] font-serif italic text-[#2a1a0a]/60 leading-relaxed">
              "Tactical assessment required. Initial reconnaissance suggests high-level cryptographic patterns linked to the syndicate core..."
           </p>
        </div>
        <div className="mt-auto space-y-4">
          <div className="flex justify-between items-end">
             <span className="text-[9px] font-black uppercase tracking-widest text-[#a07830] opacity-60">Clearance Reward</span>
             <span className="text-xl font-black text-[#8B2020] tracking-tighter">
               {isFinalPhase ? "???" : `${c.points} XP`}
             </span>
          </div>
          <div className="w-full h-12 bg-[#2a1a0a] text-[#f0e0a0] flex items-center justify-center font-black uppercase text-[11px] tracking-[0.3em] group-hover:bg-[#d4a017] group-hover:text-[#2a1a0a] transition-all shadow-lg active:scale-95">
            Examine Folder
          </div>
        </div>
      </div>
      {/* Red confidential stamp on hover */}
      <motion.div 
        initial={{ opacity: 0, scale: 2 }}
        whileHover={{ opacity: 0.1, scale: 1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[12px] border-red-900 rounded-full flex items-center justify-center font-black text-red-900 text-3xl rotate-[-25deg] pointer-events-none"
      >
        CLASSIFIED
      </motion.div>
    </motion.div>
  );
}

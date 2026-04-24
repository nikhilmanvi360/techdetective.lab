import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Activity, Users, Plus, 
  Map as MapIcon, Shield, ChevronLeft 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Case {
  id: string;
  title: string;
  difficulty: string;
  points: number;
  status: string;
  round: string;
}

export default function InvestigationBoard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [team] = useState(() => JSON.parse(localStorage.getItem('team') || '{}'));
  const [view, setView] = useState<'PHASES' | 'CASES'>('PHASES');

  useEffect(() => {
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
    fetchCases();
  }, []);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#140e06]">
      <Activity className="w-10 h-10 text-[#d4a017] animate-pulse" />
    </div>
  );

  return (
    <div className="h-full relative overflow-hidden flex flex-col bg-[#1d1208]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-wood.png")' }}>
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />

      <AnimatePresence mode="wait">
        {view === 'PHASES' ? (
          <motion.div 
            key="phases"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center p-12"
          >
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-[2px] bg-[#d4a017]" />
                <span className="text-[#d4a017] font-black uppercase tracking-[0.4em] text-xs">Operation Tech Detective</span>
                <div className="w-12 h-[2px] bg-[#d4a017]" />
              </div>
              <h1 className="text-6xl font-black text-[#f0e0a0] uppercase tracking-tighter font-serif italic">Operational Phases</h1>
              <p className="text-[#a07830] font-serif italic mt-4 opacity-60">"Select an engagement sector to begin the field operation."</p>
            </div>

            <div className="flex gap-12 max-w-6xl w-full">
              {/* Phase 1: Dossiers */}
              <PhaseCard 
                num="01"
                title="The Dossiers"
                description="Review case files, evidence, and leads in the central bureau database."
                icon={<FileText className="w-8 h-8" />}
                status="Active"
                color="#d4a017"
                onClick={() => setView('CASES')}
              />

              {/* Phase 2: Field Campaign */}
              <PhaseCard 
                num="02"
                title="Field Campaign"
                description="Deploy to the virtual campus. Real-time exploration and site investigation."
                icon={<MapIcon className="w-8 h-8" />}
                status="Operational"
                color="#1a6a8a"
                onClick={() => navigate('/campaign')}
              />

              {/* Phase 3: Finale */}
              <PhaseCard 
                num="03"
                title="The Finale"
                description="Final confrontation. The grand architecture of the syndicate is revealed."
                icon={<Shield className="w-8 h-8" />}
                status="Locked"
                color="#8B2020"
                disabled
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="cases"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="relative z-10 flex-1 flex flex-col"
          >
            <div className="px-12 pt-12 pb-6 flex items-center justify-between">
              <div>
                 <button onClick={() => setView('PHASES')} className="flex items-center gap-2 text-[#d4a017] uppercase font-black text-[10px] mb-4 hover:translate-x-[-4px] transition-transform">
                    <ChevronLeft className="w-4 h-4" /> Back to Phases
                 </button>
                 <h1 className="text-5xl font-black text-[#f0e0a0] uppercase tracking-tighter font-serif italic">Active Dossiers</h1>
              </div>
              
              <div className="bg-[#f0e0a0] p-4 border-2 border-[#a07830] shadow-xl rotate-2 hidden md:block">
                 <div className="text-[10px] text-[#8B2020] font-black uppercase mb-1">Squad Status</div>
                 <button onClick={() => navigate('/lobby')} className="flex items-center gap-2 text-xs font-black text-[#2a1a0a] hover:text-[#8B2020]">
                    <Users className="w-4 h-4" /> RECRUIT TEAM &rarr;
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-12 py-10">
              <div className="flex flex-wrap gap-12 justify-center max-w-7xl mx-auto pb-20">
                {cases.map((c, idx) => (
                  <CaseCard key={c.id} c={c} i={idx} onClick={() => navigate(`/mission/${c.id}`)} />
                ))}
              </div>
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
      whileHover={!disabled ? { y: -10, scale: 1.02 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`flex-1 group relative bg-[#e8d5a0] border-4 border-[#a07830] p-8 shadow-2xl transition-all cursor-pointer ${disabled ? 'opacity-40 grayscale pointer-events-none' : 'hover:border-[#f0e0a0]'}`}
    >
      <div className="absolute top-4 right-4 text-4xl font-black text-[#a07830]/20 font-serif italic">{num}</div>
      <div className={`w-16 h-16 mb-8 flex items-center justify-center border-4 border-[#a07830] transition-colors group-hover:bg-[#a07830]/10`} style={{ color }}>
        {icon}
      </div>
      <h3 className="text-2xl font-black text-[#2a1a0a] uppercase tracking-tighter mb-4">{title}</h3>
      <p className="text-[#2a1a0a] font-serif italic opacity-70 mb-8 leading-relaxed">{description}</p>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#a07830]/20">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{status}</span>
        <span className="text-xs font-black text-[#a07830] group-hover:translate-x-2 transition-transform">&rarr;</span>
      </div>
    </motion.div>
  );
}

function CaseCard({ c, i, onClick }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: i % 2 === 0 ? -1 : 1 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ rotate: 0, scale: 1.05, y: -10 }}
      onClick={onClick}
      className="w-[280px] h-[360px] bg-[#e8d5a0] p-6 shadow-2xl relative cursor-pointer group border-b-[12px] border-r-[12px] border-[#a07830]/30"
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-paper.png')] opacity-10" />
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="px-2 py-1 bg-[#2a1a0a] text-[#f0e0a0] text-[8px] font-black uppercase tracking-widest">{c.difficulty}</div>
          <div className="text-[#a07830]"><FileText className="w-5 h-5" /></div>
        </div>
        <h3 className="text-xl font-serif italic font-bold text-[#2a1a0a] leading-tight mb-4 border-b-2 border-[#a07830]/20 pb-2">{c.title}</h3>
        <div className="mt-auto space-y-3">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#a07830]">
             <span>Reward</span>
             <span className="text-[#8B2020]">{c.points} XP</span>
          </div>
          <div className="w-full h-10 bg-[#2a1a0a] text-[#f0e0a0] flex items-center justify-center font-black uppercase text-[10px] tracking-widest group-hover:bg-[#d4a017] group-hover:text-[#2a1a0a] transition-colors">
            Open Dossier
          </div>
        </div>
      </div>
    </motion.div>
  );
}

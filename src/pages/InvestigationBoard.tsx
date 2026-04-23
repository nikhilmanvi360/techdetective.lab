import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSearch, User, BarChart2, ShoppingBag, Activity,
  ChevronRight, Folder, Plus, Map as MapIcon, Users,
  Lock, Terminal, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Case } from '../types';
import { useSound } from '../hooks/useSound';

/* ─── Helpers ──────────────────────────────────────────────── */
function diffCfg(d: string) {
  if (d === 'Easy')         return { label: 'Low Rank',  color: '#4a7c3f', bg: '#2a4a20' };
  if (d === 'Intermediate') return { label: 'Elevated',  color: '#c8860a', bg: '#5a3a0a' };
  if (d === 'Hard')         return { label: 'Security',  color: '#8B2020', bg: '#4a1010' };
  if (d === 'Expert')       return { label: 'Core Devi', color: '#7a3aaa', bg: '#3a1a5a' };
  return                         { label: 'Crypt M&E',  color: '#1a6a8a', bg: '#0a2a4a' };
}

/* ─── Case Card ─────────────────────────────────────────────── */
interface CaseCardProps {
  key?: string | number;
  c: Case;
  i: number;
  onClick: () => void;
}

function CaseCard({ c, i, activeRound, onClick }: CaseCardProps & { activeRound: string }) {
  const cfg = diffCfg(c.difficulty);
  const isSolved = c.status === 'solved';
  const isLocked = c.round && activeRound && c.round > activeRound && !isSolved;
  const caseRef = `${i + 1}D:${(i * 997 + 6081).toString(16).toUpperCase().slice(0, 4)}`;

  // Random rotation for "scattered folder" look
  const rotation = (i % 3 === 0) ? -1 : (i % 3 === 1) ? 1.5 : -0.5;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: rotation - 5 }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      whileHover={{ scale: isLocked ? 1 : 1.02, rotate: isLocked ? rotation : 0, zIndex: 50, transition: { duration: 0.2 } }}
      onClick={isLocked ? undefined : onClick}
      className={`flex flex-col relative overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.6)] ${isLocked ? 'cursor-not-allowed grayscale-[0.6] brightness-75' : 'cursor-pointer group'}`}
      style={{
        background: isLocked 
          ? 'linear-gradient(165deg, #c0b080 0%, #a09060 40%, #807040 100%)'
          : 'linear-gradient(165deg, #f5e8b0 0%, #e8d488 40%, #d8c070 100%)',
        border: isLocked ? '2px solid #5a4a20' : '1px solid #a07830',
        width: '280px',
        height: '360px',
      }}
    >
      {/* Folder Tab Effect */}
      <div className={`absolute top-0 right-0 w-24 h-8 ${isLocked ? 'bg-[#807040]' : 'bg-[#c8b060]'} -mr-4 -mt-1 rotate-3 border-b border-l border-[#a07830]/30 shadow-sm`} />
      
      {/* Top stripe with case ref & badge */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1.5px solid rgba(100,70,20,0.1)' }}
      >
        <span className="text-[10px] font-mono font-bold text-[#1a0e04]/50 tracking-widest uppercase">REF: {caseRef}</span>
        <div
          className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider"
          style={{
            background: isLocked ? '#2a2a2a' : cfg.bg,
            color: '#f0e0c0',
            border: `1.5px solid ${isLocked ? '#444' : cfg.color}`,
          }}
        >
          {isLocked ? 'SEALED' : cfg.label}
        </div>
      </div>

      {/* Title with "stamped" feel */}
      <div className="flex-1 px-6 pt-8 text-center flex flex-col items-center">
        <div className={`w-12 h-1 ${isLocked ? 'bg-black/20' : 'bg-[#8B2020]/20'} mb-6`} />
        <h3
          className={`font-black uppercase leading-tight text-xl mb-4 italic ${isLocked ? 'text-[#1a0e04]/40' : 'text-[#1a0e04]/90'}`}
          style={{ fontFamily: "'Georgia', serif", letterSpacing: '0.05em' }}
        >
          {c.title}
        </h3>
        <p className="text-[9px] font-mono text-[#1a0e04]/40 uppercase tracking-[0.2em] leading-relaxed max-w-[180px]">
          {isLocked ? 'Operational Clearance Required' : `Bureau Protocol: ${c.difficulty}`}
        </p>
      </div>

      {/* "Brass" Icon & Mystery */}
      <div className="px-6 pb-10 flex flex-col items-center gap-2">
         <div className="w-16 h-16 rounded-full border-4 border-dashed border-[#a07830]/20 flex items-center justify-center opacity-30">
            {isLocked ? <Lock className="w-8 h-8" /> : <Folder className="w-8 h-8" />}
         </div>
      </div>

      {/* Footer / Stamped XP */}
      <div
        className="flex items-center justify-between px-6 py-4 bg-black/5"
        style={{ borderTop: '1.5px solid rgba(100,70,20,0.1)' }}
      >
        <div className="flex flex-col">
           <span className="text-[8px] font-black text-[#1a0e04]/40 uppercase tracking-widest leading-none mb-1">Status</span>
           <span className={`text-sm font-black ${isLocked ? 'text-[#a07830]' : 'text-[#8B2020]'} opacity-80`}>
              {isLocked ? `WAIT FOR ${c.round?.replace('_',' ')}` : `${c.points} XP`}
           </span>
        </div>
        <span className="text-[10px] font-black text-[#1a0e04] opacity-40">
           {isLocked ? 'LOCKED' : 'OPEN DOSSIER \u2192'}
        </span>
      </div>

      {/* CLEARED stamp overlay */}
      {isSolved && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none rotate-[-15deg]">
          <div
            className="flex items-center gap-2 px-6 py-2 border-[6px] border-[#166534]/70 text-[#166534]/70 font-black text-2xl uppercase tracking-[0.2em]"
          >
            RESOLVED
          </div>
        </div>
      )}

      {/* SEALED WAX STAMP overlay for locked cards */}
      {isLocked && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <div className="w-32 h-32 border-8 border-[#8B2020] rounded-full rotate-12 flex items-center justify-center">
               <span className="text-xl font-black text-[#8B2020] uppercase tracking-tighter">SEALED</span>
            </div>
         </div>
      )}
    </motion.div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */
export default function InvestigationBoard() {
  const [cases, setCases]     = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { playSound }         = useSound();
  const navigate              = useNavigate();
  const team                  = (() => { try { return JSON.parse(localStorage.getItem('team') || '{}'); } catch { return {}; } })();
  const xp                    = team?.score || 0;

  useEffect(() => {
    fetch('/api/cases', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCases(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#140e06]">
      <Activity className="w-10 h-10 text-[#d4a017] animate-pulse" />
    </div>
  );

  const activeRound = localStorage.getItem('active_round') || 'ROUND_1'; // Default to start if in room, or use highest if solo

  return (
    <div
      className="h-full relative overflow-hidden flex flex-col select-none"
      style={{ 
        background: '#1d1208',
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-wood.png")'
      }}
    >
      {/* Tactical Desktop Surface Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }}
      />

      {/* Side Dispatch / Multiplayer Note */}
      <div className="absolute top-10 right-10 z-30 transform rotate-2">
         <motion.div 
           whileHover={{ scale: 1.05, rotate: 0 }}
           onClick={() => { playSound('click'); navigate('/lobby'); }}
           className="bg-[#f0e0a0] p-6 w-64 shadow-2xl border-2 border-[#a07830] cursor-pointer"
         >
            <div className="text-[10px] text-[#8B2020] font-black uppercase tracking-widest mb-2 border-b-2 border-dashed border-[#8B2020]/20 pb-1 flex items-center gap-2">
               <Activity className="w-3 h-3" /> Incoming Dispatch
            </div>
            <p className="text-sm font-serif italic text-[#2a1a0a] mb-4">"Detectives are convening at the station. Join the squad for field operation."</p>
            <div className="flex justify-between items-center bg-black/5 p-2">
               <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#a07830]" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Active Squads</span>
               </div>
               <span className="text-xs font-black text-[#d4a017]">Join &rarr;</span>
            </div>
         </motion.div>
      </div>

      {/* Desk Header */}
      <div className="relative z-10 px-12 pt-12 pb-6">
          <div className="flex items-center gap-4 mb-2">
             <div className="w-12 h-[2px] bg-[#d4a017]" />
             <span className="text-[#d4a017] font-black uppercase tracking-[0.3em] text-xs">Bureau Tactical Desk</span>
          </div>
          <h1 className="text-5xl font-black text-[#f0e0a0] uppercase tracking-tighter" style={{ fontFamily: "'Georgia', serif" }}>
            The Active Dossiers
          </h1>
          <p className="text-[#a07830] font-serif italic mt-2 opacity-60">"Every file is a life. Every trace is a lead. Current Phase: {activeRound?.replace('_', ' ')}"</p>
      </div>

      {/* Scattered Case Folders */}
      <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar px-12 py-10">
         <div className="flex flex-wrap gap-16 justify-center max-w-7xl mx-auto pb-40">
            {cases.map((c, idx) => (
              <CaseCard
                key={c.id}
                c={c}
                i={idx}
                activeRound={activeRound}
                onClick={() => { playSound('ping'); navigate(`/mission/${c.id}`); }}
              />
            ))}
            
            {/* "New Case" Ghost folder if admin */}
            {(team.role === 'admin' || team.name === 'CCU_ADMIN') && (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/admin/builder')}
                className="w-[280px] h-[360px] border-4 border-dashed border-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all text-white/10 uppercase font-black tracking-widest"
              >
                 <Plus className="w-12 h-12 mb-4" />
                 Draft Folder
              </motion.div>
            )}
         </div>
      </div>

      {/* Bottom Desk Edge */}
      <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-black/40 to-transparent z-20 pointer-events-none" />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3a2a12; border: 2px solid #140e06; border-radius: 0; }
      `}</style>
    </div>
  );
}

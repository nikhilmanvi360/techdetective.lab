import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSearch, User, BarChart2, ShoppingBag, Activity,
  LogOut, ChevronRight, FileText, Lock, CheckCircle2, FolderOpen, Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Case } from '../types';
import { useSound } from '../hooks/useSound';
import { getRankTitle } from '../utils/ranks';

/* ─── Helpers ──────────────────────────────────────────────── */
function diffCfg(d: string) {
  if (d === 'Easy')         return { label: 'Low Rank',  color: '#4a7c3f', bg: '#2a4a20' };
  if (d === 'Intermediate') return { label: 'Elevated',  color: '#c8860a', bg: '#5a3a0a' };
  if (d === 'Hard')         return { label: 'Security',  color: '#8B2020', bg: '#4a1010' };
  if (d === 'Expert')       return { label: 'Core Devi', color: '#7a3aaa', bg: '#3a1a5a' };
  return                         { label: 'Crypt M&E',  color: '#1a6a8a', bg: '#0a2a4a' };
}

/* ─── Sidebar nav item ──────────────────────────────────────── */
function NavItem({ label, icon: Icon, to, active = false }: any) {
  const navigate = useNavigate();
  const { playSound } = useSound();
  return (
    <motion.button
      whileHover={{ x: 3 }}
      onClick={() => { playSound('click'); navigate(to); }}
      className="w-full flex items-center justify-between px-5 py-3.5 group transition-all"
      style={{
        background: active
          ? 'linear-gradient(to right, rgba(212,160,23,0.15), rgba(212,160,23,0.05))'
          : 'transparent',
        borderLeft: active ? '3px solid #d4a017' : '3px solid transparent',
      }}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${active ? 'text-[#d4a017]' : 'text-[#c8a050]/50 group-hover:text-[#c8a050]/80'} transition-colors`} />
        <span
          className="text-sm font-black uppercase tracking-wider"
          style={{ color: active ? '#f0d070' : 'rgba(240,208,112,0.55)', fontFamily: "'Georgia', serif" }}
        >
          {label}
        </span>
      </div>
      <ChevronRight className={`w-4 h-4 ${active ? 'text-[#d4a017]' : 'text-[#c8a050]/30'}`} />
    </motion.button>
  );
}

/* ─── Case Card ─────────────────────────────────────────────── */
interface CaseCardProps {
  key?: string | number;
  c: Case;
  i: number;
  onClick: () => void;
}

function CaseCard({ c, i, onClick }: CaseCardProps) {
  const cfg = diffCfg(c.difficulty);
  const isSolved = c.status === 'solved';
  const caseRef = `${i + 1}D:${(c.id * 997 + 6081).toString(16).toUpperCase().slice(0, 4)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * i, type: 'spring', stiffness: 80 }}
      whileHover={{ y: -5, transition: { duration: 0.15 } }}
      onClick={onClick}
      className="cursor-pointer flex flex-col relative overflow-hidden group"
      style={{
        background: 'linear-gradient(165deg, #f5e8b0 0%, #e8d488 40%, #d8c070 100%)',
        border: '2px solid #a07830',
        boxShadow: '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.5)',
        minHeight: '260px',
      }}
    >
      {/* Top stripe with case ref & badge */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1.5px solid rgba(100,70,20,0.2)', background: 'rgba(0,0,0,0.04)' }}
      >
        <span className="text-[10px] font-mono font-bold text-[#1a0e04]/40 tracking-widest">{caseRef}</span>
        <div
          className="px-3 py-1 text-[10px] font-black uppercase tracking-wider"
          style={{
            background: cfg.bg,
            color: '#f0e0c0',
            border: `1.5px solid ${cfg.color}`,
          }}
        >
          {cfg.label}
        </div>
      </div>

      {/* Title */}
      <div className="flex-1 px-5 pt-4 pb-3">
        <h3
          className="font-black uppercase text-[#1a0e04] leading-tight text-lg group-hover:text-[#5a1010] transition-colors"
          style={{ fontFamily: "'Georgia', serif", letterSpacing: '-0.01em' }}
        >
          {c.title}
        </h3>
      </div>

      {/* Evidence icon */}
      <div className="px-5 pb-4 flex items-center gap-2">
        <div
          className="w-11 h-11 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.08)', border: '1px solid rgba(100,70,20,0.2)' }}
        >
          <FileText className="w-5 h-5 text-[#8B6914]/70" />
        </div>
        <span className="text-[10px] font-mono text-[#1a0e04]/40 uppercase tracking-widest">Field Evidence</span>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderTop: '1.5px solid rgba(100,70,20,0.2)', background: 'rgba(0,0,0,0.08)' }}
      >
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-[#1a0e04]/40 uppercase tracking-widest">Payout</span>
          <span className="text-sm font-black text-[#1a0e04]">{c.points_on_solve} XP</span>
        </div>
        <div className="flex items-center gap-2 text-[#1a0e04]/50">
          <span className="text-[9px] uppercase tracking-widest font-black">{c.difficulty}</span>
          <span className="text-2xl font-black text-[#1a0e04]">▶</span>
        </div>
      </div>

      {/* Solved stamp */}
      {isSolved && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div
            className="flex items-center gap-2 px-5 py-2 font-black text-xl uppercase tracking-widest rotate-[-18deg] select-none"
            style={{
              border: '5px solid rgba(22,101,52,0.7)',
              color: 'rgba(22,101,52,0.7)',
            }}
          >
            <CheckCircle2 className="w-6 h-6" />
            CLEARED
          </div>
        </div>
      )}

      {/* Locked darken */}
      {c.status === 'locked' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <Lock className="w-10 h-10 text-[#c8a050]/50" />
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

  const activeCases = cases.filter(c => c.status !== 'locked');

  return (
    <div
      className="h-full flex flex-col overflow-hidden select-none"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif", background: '#140e06' }}
    >
      {/* ── MAIN PARCHMENT AREA ── */}
      <motion.div
        layout
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #f0e0a0 0%, #e4d080 50%, #d8c060 100%)' }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-8 py-6"
          style={{ borderBottom: '2px solid rgba(100,70,20,0.25)' }}
        >
          <div>
            <h1
              className="text-3xl font-black uppercase tracking-widest text-[#1a0e04]"
              style={{ textShadow: '0 1px 0 rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}
            >
              Central Command
            </h1>
            <p className="text-[11px] font-mono text-[#1a0e04]/60 uppercase tracking-widest mt-1">
              {activeCases.length} Active Investigation{activeCases.length !== 1 ? 's' : ''} — CCU Bureau Field Network
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div
               className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-black/5 border border-black/10 text-black/40"
             >
               Clearance: Level 4
             </div>
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">Total XP</span>
                <span className="text-xl font-black text-[#8B2020]">{xp}</span>
             </div>
          </div>
        </div>

        {/* Case Grid — scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
          {cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
              <FileSearch className="w-16 h-16 text-[#1a0e04]" />
              <p className="font-black text-[#1a0e04] uppercase tracking-widest text-lg">No Active Cases</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {cases.map((c, i) => (
                <CaseCard
                  key={c.id}
                  c={c}
                  i={i}
                  onClick={() => { playSound('ping'); navigate(`/mission/${c.id}`); }}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a07830;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

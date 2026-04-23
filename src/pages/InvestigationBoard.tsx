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
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('isSidebarOpen');
    return saved === null ? true : saved === 'true';
  });
  
  const { playSound }         = useSound();
  const navigate              = useNavigate();
  const team                  = (() => { try { return JSON.parse(localStorage.getItem('team') || '{}'); } catch { return {}; } })();
  const rankTitle             = getRankTitle(team?.score || 0);
  const xp                    = team?.score || 0;
  const xpPct                 = Math.min(100, Math.round((xp / 500) * 100));

  useEffect(() => {
    fetch('/api/cases', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCases(d); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem('isSidebarOpen', String(isSidebarOpen));
  }, [isSidebarOpen]);

  const handleLogout = () => {
    playSound('click');
    localStorage.clear();
    window.location.href = '/';
  };

  const toggleSidebar = () => {
    playSound('click');
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#1a120a' }}>
      <Activity className="w-10 h-10 text-[#d4a017] animate-pulse" />
    </div>
  );

  /* Dynamic grid: 2 cols small, 3 cols medium, 4 cols xl */
  const activeCases = cases.filter(c => c.status !== 'locked');
  const solvedCount = cases.filter(c => c.status === 'solved').length;

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden select-none"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif", background: '#140e06' }}
    >

      {/* ═══════════ TOP CHROME ═══════════ */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 h-14 z-50"
        style={{
          background: 'linear-gradient(to bottom, #4a3820, #3a2a12)',
          borderBottom: '3px solid #6a5020',
          boxShadow: '0 3px 16px rgba(0,0,0,0.8)',
        }}
      >
        <div className="flex items-center gap-6">
          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center p-2 rounded hover:bg-white/5 transition-colors group"
            title={isSidebarOpen ? "Maximize Field View" : "Open Terminal Menu"}
          >
            {isSidebarOpen ? (
              <FolderOpen className="w-6 h-6 text-[#f0d070] group-hover:scale-110 transition-transform" />
            ) : (
              <Folder className="w-6 h-6 text-[#f0d070] group-hover:scale-110 transition-transform" />
            )}
          </button>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black uppercase" style={{ color: '#f0d070', letterSpacing: '0.12em', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
              TECH DETECTIVE
            </span>
            <span className="text-xs font-mono tracking-widest ml-1.5 self-center" style={{ color: 'rgba(200,160,80,0.6)' }}>
              CCU V4.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Rank & Name */}
          <div className="text-right leading-none">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-0.5" style={{ color: 'rgba(200,160,80,0.55)' }}>{rankTitle}</div>
            <div className="text-sm font-black" style={{ color: '#f0d070' }}>{team?.name || 'Agent'}</div>
          </div>
          {/* XP Bar */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: 'rgba(200,160,80,0.55)' }}>XP  {xp}</span>
            <div className="w-28 h-3 rounded-sm overflow-hidden" style={{ background: '#1a0e04', border: '1px solid #5a4010' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full rounded-sm"
                style={{ background: 'linear-gradient(to right, #a07020, #f0d070)' }}
              />
            </div>
          </div>
          {/* Disconnect */}
          <button
            onClick={handleLogout}
            className="font-black uppercase text-xs px-4 py-2 transition-all hover:brightness-125 active:scale-95"
            style={{
              background: 'linear-gradient(to bottom, #8B1A1A, #6a0e0e)',
              border: '1.5px solid #5a0808',
              color: '#ffd0d0',
              letterSpacing: '0.15em',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* ═══════════ BODY ═══════════ */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── SIDEBAR ── */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 224, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ ease: "easeInOut", duration: 0.3 }}
              className="flex-shrink-0 flex flex-col overflow-hidden whitespace-nowrap"
              style={{
                background: 'linear-gradient(to bottom, #1e1408, #160e06)',
                borderRight: '2px solid #4a3410',
              }}
            >
              {/* Logo Plate */}
              <div
                className="mx-4 mt-5 mb-6 py-3 flex flex-col items-center"
                style={{
                  background: 'linear-gradient(to bottom, #4a3818, #3a2808)',
                  border: '2px solid #8B6914',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.5)',
                }}
              >
                <span className="text-sm font-black text-[#f0d070] uppercase tracking-[0.2em]">TECHDETECTIVE</span>
                <span className="text-[9px] font-mono text-[#c8a050]/50 tracking-widest mt-0.5">CCU V4.0</span>
              </div>

              {/* Nav */}
              <nav className="flex-1 flex flex-col gap-1 px-1 overflow-hidden">
                <NavItem to="/profile"      label="Service Profile"    icon={User}       active />
                <NavItem to="/scoreboard"   label="Active Leaderboard" icon={BarChart2}  />
                <NavItem to="/black-market" label="Shadow Exchange"    icon={ShoppingBag}/>
              </nav>

              {/* Stats summary */}
              <div className="mx-4 mb-4 px-4 py-3 space-y-2 overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(100,70,20,0.2)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#c8a050]/50 uppercase tracking-widest font-black">Cases</span>
                  <span className="text-sm font-black text-[#f0d070]">{cases.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#c8a050]/50 uppercase tracking-widest font-black">Solved</span>
                  <span className="text-sm font-black text-[#5a8a3f]">{solvedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] text-[#c8a050]/50 uppercase tracking-widest font-black">Active</span>
                   <span className="text-sm font-black text-[#c8860a]">{cases.length - solvedCount}</span>
                </div>
              </div>

              {/* End Shift */}
              <div className="p-3 pt-0 overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 font-black uppercase text-sm tracking-widest transition-all hover:brightness-115 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(to bottom, #9B2020, #7a0e0e)',
                    border: '2px solid #5a0808',
                    color: '#ffd0d0',
                    letterSpacing: '0.22em',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.6)',
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  END SHIFT
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MAIN PARCHMENT AREA ── */}
        <motion.div
          layout
          className="flex-1 flex flex-col min-w-0 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #f0e0a0 0%, #e4d080 50%, #d8c060 100%)' }}
        >
          {/* Header */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-8 py-5"
            style={{ borderBottom: '2px solid rgba(100,70,20,0.25)' }}
          >
            <div>
              <h1
                className="text-2xl font-black uppercase tracking-widest text-[#1a0e04]"
                style={{ textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}
              >
                Central Command
              </h1>
              <p className="text-[11px] font-mono text-[#1a0e04]/50 uppercase tracking-widest mt-1">
                {activeCases.length} Active Investigation{activeCases.length !== 1 ? 's' : ''} — CCU Bureau Field Network
              </p>
            </div>
            <div
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest"
              style={{
                background: 'rgba(0,0,0,0.08)',
                border: '1.5px solid rgba(100,70,20,0.3)',
                color: 'rgba(26,14,4,0.5)',
              }}
            >
              Clearance Active
            </div>
          </div>

          {/* Case Grid — scrollable */}
          <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
            {cases.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
                <FileSearch className="w-16 h-16 text-[#1a0e04]" />
                <p className="font-black text-[#1a0e04] uppercase tracking-widest text-lg">No Active Cases</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
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

          {/* Bottom bar */}
          <div
            className="flex-shrink-0 flex items-center justify-center gap-3 px-8 py-3"
            style={{
              background: 'linear-gradient(to top, #2a1c0c, #3a2a12)',
              borderTop: '2px solid #5a4010',
            }}
          >
            {[
              { label: 'Service Profile',    icon: User,        to: '/profile' },
              { label: 'Active Leaderboard', icon: BarChart2,   to: '/scoreboard' },
              { label: 'Shadow Exchange',    icon: ShoppingBag, to: '/black-market' },
            ].map(({ label, icon: Icon, to }) => (
              <button
                key={to}
                onClick={() => { playSound('click'); navigate(to); }}
                className="flex items-center gap-2 px-5 py-2 transition-all hover:brightness-115 active:scale-95"
                style={{
                  background: 'linear-gradient(to bottom, #5a4820, #4a3810)',
                  border: '1.5px solid #8B6914',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                <Icon className="w-4 h-4 text-[#d4a017]" />
                <span className="font-black text-[#f0d070] uppercase tracking-wider text-[11px]">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

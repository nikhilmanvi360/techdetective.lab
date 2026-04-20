import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert, Trophy, User, Shield, Skull,
  ChevronRight, Database, Zap, Lock, Terminal,
  Activity, Target, FileSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Case } from '../types';
import { useSound } from '../hooks/useSound';

// ─── Difficulty color map ────────────────────────────────────────────────────
function diffColor(d: string) {
  if (d === 'Easy') return { border: 'border-cyber-green/50', text: 'text-cyber-green', glow: 'rgba(34,197,94,0.3)', bg: 'bg-cyber-green/5' };
  if (d === 'Intermediate') return { border: 'border-cyber-amber/50', text: 'text-cyber-amber', glow: 'rgba(245,158,11,0.3)', bg: 'bg-cyber-amber/5' };
  if (d === 'Hard') return { border: 'border-cyber-red/50', text: 'text-cyber-red', glow: 'rgba(239,68,68,0.3)', bg: 'bg-cyber-red/5' };
  return { border: 'border-cyber-violet/50', text: 'text-cyber-violet', glow: 'rgba(168,85,247,0.3)', bg: 'bg-cyber-violet/5' };
}

// ─── Navigation Hub Button ───────────────────────────────────────────────────
function HubButton({ to, icon, label, sublabel, color = 'cyber-green', delay = 0 }: {
  to: string; icon: React.ReactNode; label: string; sublabel: string; color?: string; delay?: number;
}) {
  const { playSound } = useSound();
  return (
    <Link to={to} onClick={() => playSound('click')}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.3 }}
        whileHover={{ scale: 1.02, x: 4 }}
        className={`group flex items-center gap-4 bg-black/60 border border-${color}/20 hover:border-${color}/60 px-6 py-4 transition-all cursor-pointer relative overflow-hidden`}
        style={{ boxShadow: `0 0 0 transparent` }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = `inset 0 0 20px rgba(34,197,94,0.04), 0 0 15px rgba(34,197,94,0.05)`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '';
        }}
      >
        <div className={`p-3 border border-${color}/30 bg-${color}/5 text-${color} group-hover:bg-${color}/10 transition-colors`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className={`text-sm font-display font-bold text-white uppercase tracking-widest group-hover:text-${color} transition-colors`}>{label}</div>
          <div className="text-[10px] font-mono text-gray-600 mt-0.5">{sublabel}</div>
        </div>
        <ChevronRight className={`w-4 h-4 text-${color}/30 group-hover:text-${color} group-hover:translate-x-1 transition-all`} />
        {/* Sweep animation */}
        <div className={`absolute inset-0 bg-gradient-to-r from-${color}/0 via-${color}/3 to-${color}/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700`} />
      </motion.div>
    </Link>
  );
}

// ─── Main Dashboard / Command Hub ────────────────────────────────────────────
export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const { playSound } = useSound();
  const navigate = useNavigate();
  const team = JSON.parse(localStorage.getItem('team') || '{}');
  const isAdmin = team?.role === 'admin' || team?.name === 'CCU_ADMIN';

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('/api/cases', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.status === 403 || response.status === 401) {
          localStorage.removeItem('token'); localStorage.removeItem('team');
          window.location.href = '/login'; return;
        }
        const data = await response.json();
        if (Array.isArray(data)) setCases(data);
        else setCases([]);
      } catch {
        setCases([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Target className="w-12 h-12 text-cyber-green animate-pulse" />
      <div className="font-display text-cyber-green tracking-[0.4em] uppercase text-sm">Syncing_Mission_Database...</div>
    </div>
  );

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL: Mission Select ──────────────────────────────── */}
      <div className="flex-1 flex flex-col relative">
        {/* Background Case Art (selected case ambient) */}
        <AnimatePresence>
          {selectedCase && (
            <motion.div
              key={selectedCase.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                background: `radial-gradient(ellipse 80% 60% at 30% 50%, ${diffColor(selectedCase.difficulty).glow.replace(')', ', 0.12)')} 0%, transparent 70%)`
              }}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="pt-24 px-10 pb-6 z-10 relative">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-[2px] bg-cyber-green" />
              <span className="text-[10px] font-display text-cyber-green uppercase tracking-[0.6em]">ACTIVE CASE LIST // CCU-2026</span>
              <div className="w-8 h-[2px] bg-cyber-green" />
            </div>
            <h2 className="text-5xl font-display font-bold text-white uppercase tracking-tight"
              style={{ textShadow: '0 0 30px rgba(34,197,94,0.15)' }}>
              SELECT MISSION
            </h2>
            <p className="text-xs font-mono text-gray-600 max-w-sm">
              {cases.length} active investigations found. Choose your target.
            </p>
          </motion.div>
        </div>

        {/* Cases List — vertical cards */}
        <div className="flex-1 px-10 pb-10 z-10 relative space-y-3 overflow-y-auto custom-scrollbar">
          {cases.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-cyber-line p-12"
            >
              <FileSearch className="w-12 h-12 text-gray-700 mb-4" />
              <p className="font-display text-gray-600 uppercase tracking-widest text-sm">No Active Missions</p>
              <p className="font-mono text-gray-700 text-[10px] mt-2">Admin must deploy cases via the Command Center.</p>
              {isAdmin && (
                <Link to="/admin/builder" className="mt-6 text-[10px] font-display text-cyber-green border border-cyber-green/30 px-4 py-2 hover:bg-cyber-green/5 transition-all uppercase tracking-widest">
                  → Go to Builder
                </Link>
              )}
            </motion.div>
          ) : (
            cases.map((c, i) => {
              const dc = diffColor(c.difficulty);
              const isSelected = selectedCase?.id === c.id;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onMouseEnter={() => { playSound('click'); setSelectedCase(c); }}
                  onMouseLeave={() => setSelectedCase(null)}
                  onClick={() => { playSound('ping'); navigate(`/case/${c.id}`); }}
                  className={`group relative flex items-center gap-6 p-5 border cursor-pointer transition-all duration-200
                    ${isSelected
                      ? `${dc.border} ${dc.bg} scale-[1.01]`
                      : 'border-cyber-line hover:border-white/10 bg-black/40'
                    }`}
                  style={isSelected ? { boxShadow: `0 0 25px ${dc.glow}` } : {}}
                >
                  {/* Number */}
                  <div className={`text-4xl font-display font-bold w-12 text-center tabular-nums ${isSelected ? dc.text : 'text-gray-800'} transition-colors`}>
                    {String(i + 1).padStart(2, '0')}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[9px] font-display font-bold uppercase px-2 py-0.5 border ${dc.border} ${dc.text} ${dc.bg}`}>
                        {c.difficulty}
                      </span>
                      <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">
                        CASE_NODE_{String(c.id).padStart(3, '0')}
                      </span>
                    </div>
                    <h3 className={`text-lg font-display font-bold uppercase tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                      {c.title}
                    </h3>
                    <p className="text-[11px] font-mono text-gray-600 line-clamp-1 mt-1">{c.description}</p>
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-xl font-display font-bold tabular-nums ${isSelected ? dc.text : 'text-gray-700'} transition-colors`}>
                      +{c.points_on_solve || 0}
                    </div>
                    <div className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">XP</div>
                  </div>

                  {/* Active indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="case-selector"
                      className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ background: dc.glow.replace('0.3)', '1)') }}
                    />
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Command Hub / Sub-nav ──────────────────────── */}
      <div className="w-80 border-l border-cyber-line bg-black/60 flex flex-col pt-24 pb-6 px-6 relative"
        style={{ backdropFilter: 'blur(10px)' }}>

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(34,197,94,0.03) 0%, transparent 60%)' }} />

        {/* Selected Case Preview */}
        <AnimatePresence mode="wait">
          {selectedCase ? (
            <motion.div
              key={selectedCase.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 z-10 relative"
            >
              <div className="text-[9px] font-display text-cyber-green/50 uppercase tracking-[0.4em] mb-3">MISSION BRIEF</div>
              <div className={`border ${diffColor(selectedCase.difficulty).border} ${diffColor(selectedCase.difficulty).bg} p-5`}
                style={{ boxShadow: `0 0 20px ${diffColor(selectedCase.difficulty).glow}` }}>
                <h3 className="font-display font-bold text-white uppercase text-base mb-3">{selectedCase.title}</h3>
                <p className="text-[11px] font-mono text-gray-400 leading-relaxed">{selectedCase.description}</p>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className={`text-[10px] font-display uppercase tracking-widest ${diffColor(selectedCase.difficulty).text}`}>
                    {selectedCase.difficulty} CLEARANCE
                  </span>
                  <span className={`text-lg font-display font-bold ${diffColor(selectedCase.difficulty).text}`}>
                    +{selectedCase.points_on_solve} XP
                  </span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { playSound('ping'); navigate(`/case/${selectedCase.id}`); }}
                className="w-full mt-3 py-3 bg-cyber-green text-black font-display font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              >
                [ DEPLOY → ]
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8 border border-dashed border-cyber-line/40 p-8 flex flex-col items-center justify-center text-center z-10 relative"
            >
              <Target className="w-8 h-8 text-gray-700 mb-3" />
              <p className="text-[10px] font-display text-gray-600 uppercase tracking-widest">Hover a case to preview</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Hub */}
        <div className="z-10 relative space-y-2">
          <div className="text-[9px] font-display text-gray-600 uppercase tracking-[0.5em] mb-4">// COMMAND HUB</div>

          <HubButton to="/scoreboard" icon={<Trophy className="w-4 h-4" />} label="Rankings" sublabel="Global leaderboard & intelligence" color="cyber-amber" delay={0.1} />
          <HubButton to="/profile" icon={<User className="w-4 h-4" />} label="Operative File" sublabel="Your stats, badges & history" color="cyber-blue" delay={0.15} />
          <HubButton to="/black-market" icon={<Skull className="w-4 h-4" />} label="Shadow Market" sublabel="Black market hint exchange" color="cyber-red" delay={0.2} />
          {isAdmin && (
            <HubButton to="/admin" icon={<Shield className="w-4 h-4" />} label="Command Center" sublabel="Admin panel & event control" color="cyber-violet" delay={0.25} />
          )}
        </div>

        {/* Bottom system status */}
        <div className="mt-auto pt-6 border-t border-cyber-line z-10 relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
            <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">System Online</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-gray-700" />
            <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">CCU Digital Crime Lab v4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

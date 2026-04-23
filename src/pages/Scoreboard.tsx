import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Crown, Users, Clock, Search, ChevronLeft, Zap, Timer, Activity } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { ScoreEntry, ScoreMultiplier } from '../types';
import { io } from 'socket.io-client';
import { getRankTitle } from '../utils/ranks';
import { useSound } from '../hooks/useSound';

/* ─── Animated number counter ─────────────────────────────────────────────────── */
function AnimatedScore({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.floor((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, isInView]);

  return <span ref={ref} className={className}>{display.toLocaleString()}</span>;
}

const podiumStyle = [
  { color: '#d4a017', bg: '#f0d070', label: '1st Place', icon: <Crown className="w-6 h-6" /> },
  { color: '#7a7a7a', bg: '#d0d0d0', label: '2nd Place', icon: <Medal className="w-5 h-5" /> },
  { color: '#8B6914', bg: '#c8a050', label: '3rd Place', icon: <Medal className="w-5 h-5" /> },
];

export default function Scoreboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeMultipliers, setActiveMultipliers] = useState<ScoreMultiplier[]>([]);
  const { playSound } = useSound();
  const navigate = useNavigate();

  const team = (() => { try { return JSON.parse(localStorage.getItem('team') || '{}'); } catch { return {}; } })();

  const fetchAll = () => {
    fetch('/api/scoreboard')
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setScores(d); })
      .catch(() => { }).finally(() => setLoading(false));

    fetch('/api/multipliers/active')
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d)) setActiveMultipliers(d); })
      .catch(() => { });
  };

  useEffect(() => {
    fetchAll();
    const socket = io({ transports: ['websocket'] });
    socket.on('score_update', () => { playSound('ping'); fetchAll(); });
    return () => { socket.disconnect(); };
  }, [playSound]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filtered = scores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#140e06]">
      <Activity className="w-10 h-10 text-[#d4a017] animate-pulse" />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#1d1208] relative overflow-hidden" 
         style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-wood.png")' }}>
      
      {/* Tactical Overlay */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-[#d4a017] shadow-[0_0_15px_#d4a017] z-20" />
      <div className="absolute inset-0 opacity-10 pointer-events-none z-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />

      {/* 📜 REGISTRY CONTENT AREA 📜 */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-12 relative z-10 items-center">
        
        <div className="w-full max-w-6xl flex flex-col space-y-12 pb-40">
          
          {/* Header Section */}
          <div className="relative group">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-[2px] bg-[#d4a017]" />
                <span className="text-[#d4a017] font-black uppercase tracking-[0.4em] text-[10px]">Division Registry</span>
             </div>
             <h1 className="text-5xl font-black text-[#f0e0a0] uppercase tracking-tighter" style={{ fontFamily: "'Georgia', serif" }}>
               The Field Archives
             </h1>
             <p className="text-[#a07830] font-serif italic mt-3 opacity-60 max-w-2xl">
               "Performance records for all active CCU operatives. Every point is a trace recovered from the syndicate's shadows."
             </p>
             
             {/* Search Note */}
             <div className="absolute top-0 right-0 transform rotate-1">
                <div className="bg-[#f0e0a0] p-4 shadow-xl border-2 border-[#a07830] flex items-center gap-3">
                   <Search className="w-4 h-4 text-[#8B2020]" />
                   <input
                     type="text" value={search} onChange={e => setSearch(e.target.value)}
                     placeholder="Filter Records..."
                     className="bg-transparent outline-none text-[10px] font-black uppercase tracking-[0.2em] text-[#2a1a0a] placeholder-[#2a1a0a]/30 w-48"
                   />
                </div>
             </div>
          </div>

          <AnimatePresence>
            {activeMultipliers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1a0e04] p-4 border-2 border-[#d4a017] shadow-[0_0_20px_rgba(212,160,23,0.2)] flex items-center gap-6"
              >
                <Zap className="w-10 h-10 text-[#d4a017] animate-pulse" />
                <div className="flex-1">
                   <div className="text-xs font-black text-[#f0d070] uppercase tracking-widest">Bureau Multiplier Active</div>
                   <div className="text-[10px] text-[#f0d070]/60 uppercase tracking-[0.3em] font-mono mt-1">
                      Priority signal boost: {activeMultipliers[0].multiplier}x Efficiency
                   </div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] font-black text-[#f0d070] uppercase opacity-40 mb-1">Status</div>
                   <div className="text-sm font-black text-white font-mono uppercase tracking-widest">Active Signal</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Podium - Refined as Dossier Previews */}
          {filtered.length >= 3 && search === '' && (
            <div className="grid grid-cols-3 gap-10 pt-4">
              {[
                { entry: filtered[1], pos: 1 },
                { entry: filtered[0], pos: 0 },
                { entry: filtered[2], pos: 2 },
              ].map(({ entry, pos }) => {
                const ps = podiumStyle[pos];
                return (
                  <motion.div
                    key={pos}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: pos * 0.1 }}
                    className="relative p-6 flex flex-col items-center justify-center min-h-[220px] bg-[#f5e8b0] border-[#a07830] border-2 shadow-2xl"
                    style={{ transform: `rotate(${pos === 0 ? '-1deg' : pos === 1 ? '1deg' : '-0.5deg'})` }}
                  >
                    <div className="absolute top-4 left-4 opacity-20">
                       {ps.icon}
                    </div>
                    <div className="text-[10px] font-black text-[#8B2020] uppercase tracking-widest mb-4 border-b border-[#8B2020]/20 pb-1">
                       {ps.label}
                    </div>
                    <div className="text-2xl font-black text-[#1a0e04] uppercase tracking-tighter mb-1 font-serif">
                       {entry?.name || '---'}
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-4xl font-black text-[#1a0e04] tabular-nums tracking-tighter"><AnimatedScore value={entry?.score ?? 0} /></span>
                       <span className="text-[10px] font-black text-[#1a0e04]/40 uppercase tracking-widest self-end pb-2">XP</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Table - Styled as a physical Ledger */}
          <div className="bg-[#f0e0a0] border-[8px] border-[#3a2a12] shadow-2xl overflow-hidden relative">
             <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
             
             <div className="relative z-10">
                <div className="grid grid-cols-12 px-10 py-5 bg-[#3a2a12] text-[10px] font-black uppercase tracking-[0.4em] text-[#d4a017]">
                  <div className="col-span-1">Ref</div>
                  <div className="col-span-5">Operative Designation</div>
                  <div className="col-span-4">Clearance Level</div>
                  <div className="col-span-2 text-right">Cleared XP</div>
                </div>

                <div className="divide-y divide-[#a07830]/20">
                   <AnimatePresence mode="popLayout">
                     {filtered.map((entry, i) => {
                       return (
                         <motion.div
                           key={entry.name}
                           layout
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0 }}
                           className={`grid grid-cols-12 items-center px-10 py-6 transition-all ${team?.name === entry.name ? 'bg-[#d4a017]/10' : 'hover:bg-black/5'}`}
                         >
                           <div className="col-span-1 text-sm font-black italic text-[#1a0e04]/30">#{i + 1}</div>
                           <div className="col-span-5 flex items-center gap-4">
                              <div className="w-10 h-10 border-2 border-[#1a0e04]/10 bg-white/30 flex items-center justify-center font-black text-[#1a0e04]">
                                 {entry.name.charAt(0)}
                              </div>
                              <span className="font-black uppercase tracking-[0.2em] text-sm text-[#1a0e04]">{entry.name}</span>
                              {team?.name === entry.name && <span className="text-[8px] bg-[#8B2020] text-white px-2 py-0.5 font-black uppercase tracking-widest ml-2">You</span>}
                           </div>
                           <div className="col-span-4">
                              <span className="text-[9px] font-black uppercase tracking-[0.3em] inline-block px-3 py-1 border border-[#a07830]">
                                 {getRankTitle(entry.score)}
                              </span>
                           </div>
                           <div className="col-span-2 text-right">
                              <span className="text-xl font-black text-[#1a0e04] tabular-nums"><AnimatedScore value={entry.score} /></span>
                           </div>
                         </motion.div>
                       );
                     })}
                   </AnimatePresence>

                   {filtered.length === 0 && (
                     <div className="py-24 text-center opacity-30 italic font-serif">
                        No operative records match the current inquiry.
                     </div>
                   )}
                </div>
             </div>
          </div>

          <div className="py-20 flex flex-col items-center gap-3">
             <div className="w-20 h-[3px] bg-[#a07830]/20" />
             <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#a07830]">Bureau Archive Session Active</p>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3a2a12; border: 2px solid #140e06; }
      `}</style>
    </div>
  );
}

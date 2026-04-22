import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Crown, Users, Clock, Search, ChevronLeft, Zap, Timer, Activity } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { ScoreEntry, ScoreMultiplier } from '../types';
import { io } from 'socket.io-client';
import { getRankTitle } from '../utils/ranks';
import { useSound } from '../hooks/useSound';

// ── Animated number counter ───────────────────────────────────────────────────
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
  const rankTitle = getRankTitle(team?.score || 0);
  const xp = team?.score || 0;
  const xpPct = Math.min(100, Math.round((xp / 500) * 100));

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

  const handleLogout = () => {
    playSound('click');
    localStorage.clear();
    window.location.href = '/';
  };

  const filtered = scores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#1a120a]">
      <Activity className="w-10 h-10 text-[#d4a017] animate-pulse" />
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden select-none" style={{ fontFamily: "'Georgia', serif", background: '#140e06' }}>
      
      {/* ═══════════ TOP CHROME (HUD) ═══════════ */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 h-14 z-50"
        style={{
          background: 'linear-gradient(to bottom, #4a3820, #3a2a12)',
          borderBottom: '3px solid #6a5020',
          boxShadow: '0 3px 16px rgba(0,0,0,0.8)',
        }}
      >
        <div className="flex items-center gap-6">
          <button
            onClick={() => { playSound('click'); navigate(-1); }}
            className="flex items-center gap-2 px-3 py-1.5 transition-all hover:bg-white/5 rounded group"
          >
            <ChevronLeft className="w-5 h-5 text-[#f0d070] group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider text-[#f0d070]">Return</span>
          </button>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black uppercase tracking-widest text-[#f0d070]" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
              TECH DETECTIVE
            </span>
            <span className="text-xs font-mono tracking-widest ml-1.5 self-center text-[#c8a050]/60">
              OFFICIAL_RANKINGS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right leading-none">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-0.5 text-[#c8a050]/60">{rankTitle}</div>
            <div className="text-sm font-black text-[#f0d070]">{team?.name || 'Agent'}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#c8a050]/60">XP {xp}</span>
            <div className="w-28 h-3 bg-[#1a0e04] border border-[#5a4010] rounded-sm overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                className="h-full rounded-sm bg-gradient-to-right from-[#a07020] to-[#f0d070]"
                style={{ background: 'linear-gradient(to right, #a07020, #f0d070)' }}
              />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="font-black uppercase text-xs px-4 py-2 transition-all hover:brightness-125 bg-gradient-to-bottom from-[#8B1A1A] to-[#6a0e0e] text-[#ffd0d0] border border-[#5a0808]"
            style={{ letterSpacing: '0.15em', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-8 lg:p-12 items-center" style={{ background: 'linear-gradient(160deg, #f0e0a0 0%, #e4d080 50%, #d8c060 100%)' }}>
        
        <div className="w-full max-w-5xl flex flex-col space-y-10">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b-2 border-[#1a0e04]/20">
            <div>
              <h1 className="text-4xl font-black text-[#1a0e04] uppercase tracking-wide" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
                Field Operative Rankings
              </h1>
              <div className="flex items-center gap-3 mt-2 text-[11px] font-black uppercase tracking-widest text-[#1a0e04]/50">
                <div className="w-2 h-2 rounded-full bg-[#1a0e04]/50 animate-pulse" />
                Live Sync — {scores.length} Active Records
              </div>
            </div>
            
            <div className="text-right">
              <div className="px-5 py-2 inline-flex items-center gap-3 bg-[#e8d8a0] border-2 border-[#a07830] shadow-md">
                 <Search className="w-4 h-4 text-[#1a0e04]/60" />
                 <input
                   type="text" value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="SEARCH OPERATIVE..."
                   className="bg-transparent outline-none text-xs font-black uppercase tracking-widest text-[#1a0e04] placeholder-[#1a0e04]/40 w-48"
                 />
              </div>
            </div>
          </div>

          {/* Active Multiplier Banner */}
          <AnimatePresence>
            {activeMultipliers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-4 p-4 bg-[#1a0e04] border-l-4 border-[#d4a017] shadow-xl text-[#f0d070]">
                  <Zap className="w-8 h-8 flex-shrink-0 animate-pulse" />
                  <div>
                    <div className="text-sm font-black uppercase tracking-wide">
                      {activeMultipliers[0].multiplier}× Score Multiplier Active
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#f0d070]/60 uppercase tracking-widest mt-1">
                      <Timer className="w-3.5 h-3.5" />
                      Expires: {new Date(activeMultipliers[0].ends_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Podium (Top 3) */}
          {filtered.length >= 3 && search === '' && (
            <div className="grid grid-cols-3 gap-6 pt-6">
              {[
                { entry: filtered[1], pos: 1 },
                { entry: filtered[0], pos: 0 },
                { entry: filtered[2], pos: 2 },
              ].map(({ entry, pos }) => {
                const ps = podiumStyle[pos];
                const height = pos === 0 ? 'h-56' : pos === 1 ? 'h-48' : 'h-40';
                return (
                  <motion.div
                    key={pos}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: pos * 0.1 }}
                    className={`flex flex-col items-center justify-end ${height} border-2 relative overflow-hidden`}
                    style={{
                      background: `linear-gradient(to top, ${ps.color}20, #e8d8a0)`,
                      borderColor: ps.color,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                    }}
                  >
                    <div className="absolute top-0 left-0 w-full p-3 flex justify-center bg-black/5 border-b border-black/10 text-[#1a0e04]">
                      {ps.icon}
                    </div>
                    <div className="text-center p-6 space-y-2">
                       <div className="text-sm font-black uppercase tracking-widest text-[#1a0e04]">
                         {entry?.name || '—'}
                       </div>
                       <AnimatedScore
                         value={entry?.score ?? 0}
                         className="block text-4xl font-black tabular-nums text-[#1a0e04]"
                       />
                       <div className="text-[10px] font-black uppercase tracking-widest text-[#1a0e04]/40">Total XP</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Rankings Table */}
          <div className="bg-[#e8d8a0] border-2 border-[#a07830] shadow-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-8 py-4 bg-black/10 border-b-2 border-[#a07830]/30 text-[10px] font-black uppercase tracking-widest text-[#1a0e04]/60">
              <div className="col-span-1">#</div>
              <div className="col-span-6">Operative</div>
              <div className="col-span-3">Assigned Rank</div>
              <div className="col-span-2 text-right">Cleared XP</div>
            </div>

            <div className="overflow-hidden bg-white/30">
               <AnimatePresence mode="popLayout">
                 {filtered.map((entry, i) => {
                   const isGold = i === 0;
                   const medal = i < 3 ? podiumStyle[i] : null;
                   return (
                     <motion.div
                       key={entry.name}
                       layout
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0 }}
                       transition={{ delay: i * 0.03 }}
                       className="grid grid-cols-12 items-center px-8 py-5 border-b border-[#a07830]/20 hover:bg-black/5 transition-colors"
                     >
                       {/* Rank Number */}
                       <div className="col-span-1 text-lg font-black tabular-nums text-[#1a0e04]/40">
                         {String(i + 1).padStart(2, '0')}
                       </div>

                       {/* Operative Info */}
                       <div className="col-span-6 flex items-center gap-4">
                         {medal && (
                           <span style={{ color: medal.color }} className="drop-shadow-md">{medal.icon}</span>
                         )}
                         {!medal && <div className="w-5" />}
                         <div
                           className="w-10 h-10 flex items-center justify-center text-sm font-black border-2 flex-shrink-0 bg-[#e8d8a0]"
                           style={{
                             borderColor: medal ? medal.color : '#a07830',
                             color: '#1a0e04',
                           }}
                         >
                           {entry.name.charAt(0).toUpperCase()}
                         </div>
                         <span className="font-black uppercase tracking-widest text-sm text-[#1a0e04]">
                           {entry.name}
                         </span>
                       </div>

                       {/* Rank Title */}
                       <div className="col-span-3">
                         <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border"
                           style={{
                             color: '#1a0e04',
                             borderColor: '#a07830',
                             background: 'rgba(160,120,48,0.1)',
                           }}>
                           {getRankTitle(entry.score)}
                         </span>
                       </div>

                       {/* Score */}
                       <div className="col-span-2 text-right">
                         <AnimatedScore
                           value={entry.score}
                           className="text-xl font-black tabular-nums text-[#1a0e04]"
                         />
                       </div>
                     </motion.div>
                   );
                 })}
               </AnimatePresence>

               {filtered.length === 0 && (
                 <div className="py-24 text-center">
                   <Users className="w-12 h-12 mx-auto mb-4 text-[#1a0e04]/20" />
                   <p className="font-black uppercase tracking-widest text-sm text-[#1a0e04]/40">
                     No operatives match query.
                   </p>
                 </div>
               )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 opacity-40 pb-6">
            <Clock className="w-4 h-4 text-[#1a0e04]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1a0e04]">
              Data synced via constant tactical uplink
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

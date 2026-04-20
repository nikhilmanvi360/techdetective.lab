import { useState, useEffect, useRef } from 'react';
import { Trophy, Medal, Crown, Users, Clock, Search, ChevronLeft, Zap, Timer } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { ScoreEntry, ScoreMultiplier } from '../types';
import { io } from 'socket.io-client';
import { getRankTitle } from '../utils/ranks';
import { useSound } from '../hooks/useSound';
import { Link } from 'react-router-dom';

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

// Medal colors for top 3
const podiumStyle = [
  { color: '#d4a017', label: '1st Place', icon: <Crown className="w-5 h-5" /> },
  { color: '#9e9e9e', label: '2nd Place', icon: <Medal className="w-4 h-4" /> },
  { color: '#8B6914', label: '3rd Place', icon: <Medal className="w-4 h-4" /> },
];

export default function Scoreboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeMultipliers, setActiveMultipliers] = useState<ScoreMultiplier[]>([]);
  const { playSound } = useSound();

  const fetchAll = () => {
    fetch('/api/scoreboard')
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setScores(d); })
      .catch(() => {}).finally(() => setLoading(false));

    fetch('/api/multipliers/active')
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d)) setActiveMultipliers(d); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAll();
    const socket = io({ transports: ['websocket'] });
    socket.on('score_update', () => { playSound('ping'); fetchAll(); });
    return () => { socket.disconnect(); };
  }, [playSound]);

  const filtered = scores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4"
      style={{ fontFamily: "'Georgia', serif" }}>
      <Trophy className="w-12 h-12 animate-pulse" style={{ color: '#d4a017' }} />
      <p className="uppercase tracking-[0.4em] text-sm" style={{ color: '#c8a050' }}>
        Compiling Rankings...
      </p>
    </div>
  );

  return (
    <div
      className="min-h-screen px-8 py-8 max-w-5xl mx-auto"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      {/* Back nav */}
      <Link to="/" className="inline-flex items-center gap-2 mb-8 text-[11px] uppercase tracking-widest transition-colors"
        style={{ color: 'rgba(200,160,80,0.5)' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#d4a017')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,160,80,0.5)')}
      >
        <ChevronLeft className="w-3 h-3" /> Return to Case Files
      </Link>

      {/* Page header */}
      <div className="mb-10 pb-6 border-b" style={{ borderColor: 'rgba(200,160,80,0.15)' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-6" style={{ background: '#c8a050' }} />
          <span className="text-[10px] uppercase tracking-[0.5em] font-mono" style={{ color: 'rgba(200,160,80,0.55)' }}>
            Official Rankings
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <h1 className="text-4xl font-bold uppercase" style={{ color: '#e8d5a3', letterSpacing: '0.05em' }}>
            Case Leaderboard
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#5a8a3c' }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(200,160,80,0.45)' }}>
              Live — {scores.length} Operatives Active
            </span>
          </div>
        </div>
      </div>

      {/* Active XP Multiplier banner */}
      {activeMultipliers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 px-6 py-4 mb-8 border"
          style={{
            background: 'rgba(212,160,23,0.08)',
            borderColor: 'rgba(212,160,23,0.35)',
          }}
        >
          <Zap className="w-5 h-5 animate-pulse flex-shrink-0" style={{ color: '#d4a017' }} />
          <div className="flex-1">
            <div className="text-sm font-bold uppercase tracking-wide" style={{ color: '#d4a017' }}>
              {activeMultipliers[0].multiplier}× Score Multiplier Active
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono mt-0.5" style={{ color: 'rgba(200,160,80,0.5)' }}>
              <Timer className="w-3 h-3" />
              Expires: {new Date(activeMultipliers[0].ends_at).toLocaleTimeString()}
            </div>
          </div>
        </motion.div>
      )}

      {/* Podium (top 3) */}
      {filtered.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { entry: filtered[1], pos: 1 },
            { entry: filtered[0], pos: 0 },
            { entry: filtered[2], pos: 2 },
          ].map(({ entry, pos }) => {
            const ps = podiumStyle[pos];
            const height = pos === 0 ? 'h-40' : pos === 1 ? 'h-32' : 'h-28';
            return (
              <motion.div
                key={pos}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pos * 0.1 }}
                className={`flex flex-col items-center justify-end ${height} border px-4 py-5 relative`}
                style={{
                  background: `linear-gradient(to top, ${ps.color}15, transparent)`,
                  borderColor: `${ps.color}40`,
                }}
              >
                <div className="absolute top-3 left-1/2 -translate-x-1/2" style={{ color: ps.color }}>
                  {ps.icon}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: ps.color }}>
                  {entry?.name || '—'}
                </div>
                <AnimatedScore
                  value={entry?.score ?? 0}
                  className="text-xl font-bold tabular-nums"
                  // @ts-ignore
                  style={{ color: ps.color }}
                />
                <div className="text-[9px] font-mono uppercase tracking-widest mt-0.5" style={{ color: 'rgba(200,160,80,0.4)' }}>
                  pts
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: 'rgba(200,160,80,0.4)' }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search operative..."
            className="w-full pl-9 py-2 text-sm outline-none font-mono"
            style={{
              background: 'rgba(245,225,185,0.04)',
              border: '1px solid rgba(200,160,80,0.2)',
              color: '#e8d5a3',
              caretColor: '#d4a017',
            }}
          />
        </div>
        <span className="text-[10px] font-mono" style={{ color: 'rgba(200,160,80,0.35)' }}>
          {filtered.length} results
        </span>
      </div>

      {/* Rankings table */}
      <div className="border overflow-hidden" style={{ borderColor: 'rgba(200,160,80,0.15)' }}>
        {/* Table header */}
        <div
          className="grid grid-cols-12 px-6 py-3 border-b"
          style={{
            background: 'rgba(30,16,4,0.9)',
            borderColor: 'rgba(200,160,80,0.15)',
          }}
        >
          <div className="col-span-1 text-[9px] font-mono uppercase tracking-widest" style={{ color: 'rgba(200,160,80,0.45)' }}>#</div>
          <div className="col-span-7 text-[9px] font-mono uppercase tracking-widest" style={{ color: 'rgba(200,160,80,0.45)' }}>Operative</div>
          <div className="col-span-2 text-[9px] font-mono uppercase tracking-widest" style={{ color: 'rgba(200,160,80,0.45)' }}>Rank</div>
          <div className="col-span-2 text-right text-[9px] font-mono uppercase tracking-widest" style={{ color: 'rgba(200,160,80,0.45)' }}>Score</div>
        </div>

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
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-12 items-center px-6 py-4 border-b transition-all"
                style={{
                  borderColor: 'rgba(200,160,80,0.07)',
                  background: isGold ? 'rgba(212,160,23,0.05)' : 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,225,185,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = isGold ? 'rgba(212,160,23,0.05)' : 'transparent')}
              >
                {/* Rank number */}
                <div className="col-span-1 flex items-center gap-2">
                  <span className="text-lg font-bold tabular-nums"
                    style={{ color: medal ? medal.color : 'rgba(200,160,80,0.25)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Name + avatar */}
                <div className="col-span-7 flex items-center gap-3">
                  {medal && (
                    <span style={{ color: medal.color }}>{medal.icon}</span>
                  )}
                  <div
                    className="w-8 h-8 flex items-center justify-center text-sm font-bold border flex-shrink-0"
                    style={{
                      background: isGold ? 'rgba(212,160,23,0.12)' : 'rgba(245,225,185,0.04)',
                      borderColor: medal ? `${medal.color}50` : 'rgba(200,160,80,0.15)',
                      color: medal ? medal.color : 'rgba(200,160,80,0.5)',
                    }}
                  >
                    {entry.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold uppercase tracking-wide text-sm"
                    style={{ color: isGold ? '#f5e6c8' : 'rgba(232,213,163,0.7)' }}>
                    {entry.name}
                  </span>
                </div>

                {/* Rank title */}
                <div className="col-span-2">
                  <span className="text-[9px] font-mono uppercase tracking-wide px-2 py-0.5"
                    style={{
                      color: 'rgba(200,160,80,0.6)',
                      border: '1px solid rgba(200,160,80,0.15)',
                      background: 'rgba(200,160,80,0.05)',
                    }}>
                    {getRankTitle(entry.score)}
                  </span>
                </div>

                {/* Score */}
                <div className="col-span-2 text-right">
                  <AnimatedScore
                    value={entry.score}
                    className="text-lg font-bold tabular-nums"
                    // @ts-ignore
                    style={{ color: medal ? medal.color : 'rgba(200,160,80,0.7)' }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(200,160,80,0.2)' }} />
            <p className="uppercase tracking-widest text-sm" style={{ color: 'rgba(200,160,80,0.35)' }}>
              No operatives found
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center gap-2">
        <Clock className="w-3 h-3" style={{ color: 'rgba(200,160,80,0.3)' }} />
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: 'rgba(200,160,80,0.3)' }}>
          Updates in real-time via secure CCU link
        </span>
      </div>
    </div>
  );
}

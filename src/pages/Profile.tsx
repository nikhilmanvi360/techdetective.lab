import { useState, useEffect } from 'react';
import { User, Trophy, CheckCircle2, History, Clock, ShieldAlert, Award, ChevronLeft, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Team, Puzzle, Submission, ScoreEvent } from '../types';
import { getRankTitle } from '../utils/ranks';
import { useSound } from '../hooks/useSound';
import { Link } from 'react-router-dom';

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="border px-6 py-5"
      style={{
        borderColor: `${accent}30`,
        background: `linear-gradient(135deg, ${accent}08 0%, transparent 100%)`,
      }}
    >
      <div className="text-[9px] font-mono uppercase tracking-[0.4em] mb-2" style={{ color: `${accent}80` }}>{label}</div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: accent, fontFamily: "'Georgia', serif" }}>{value}</div>
    </div>
  );
}

export default function Profile() {
  const [data, setData] = useState<{
    team: Team;
    solvedPuzzles: Puzzle[];
    submissions: Submission[];
  } | null>(null);
  const [timeline, setTimeline] = useState<ScoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { playSound } = useSound();

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    Promise.all([
      fetch('/api/team/profile', { headers }).then(r => r.json()),
      fetch('/api/team/timeline', { headers }).then(r => r.ok ? r.json() : []),
    ]).then(([profile, tl]) => {
      if (profile?.team) setData(profile);
      if (Array.isArray(tl)) setTimeline(tl);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Georgia', serif" }}>
      <User className="w-12 h-12 animate-pulse" style={{ color: '#d4a017' }} />
      <p className="uppercase tracking-[0.4em] text-sm" style={{ color: '#c8a050' }}>Retrieving Operative File...</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-[50vh] flex items-center justify-center" style={{ fontFamily: "'Georgia', serif" }}>
      <p className="uppercase tracking-widest text-sm" style={{ color: '#b84040' }}>Profile Not Found</p>
    </div>
  );

  const { team, solvedPuzzles, submissions } = data;
  const correctSubs = submissions.filter(s => s.status === 'correct').length;
  const rankTitle = getRankTitle(team.score);

  const eventIcon = (type: string) => {
    if (type === 'puzzle_solve') return <CheckCircle2 className="w-4 h-4" style={{ color: '#5a8a3c' }} />;
    if (type === 'case_solve') return <ShieldAlert className="w-4 h-4" style={{ color: '#c8a050' }} />;
    if (type === 'first_blood') return <Trophy className="w-4 h-4" style={{ color: '#d4a017' }} />;
    if (type === 'hint_penalty') return <Clock className="w-4 h-4" style={{ color: '#b84040' }} />;
    return <TrendingUp className="w-4 h-4" style={{ color: 'rgba(200,160,80,0.5)' }} />;
  };

  return (
    <div
      className="min-h-screen px-8 py-8 max-w-5xl mx-auto space-y-10"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      {/* Back nav */}
      <Link to="/" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest transition-colors"
        style={{ color: 'rgba(200,160,80,0.5)' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#d4a017')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,160,80,0.5)')}
      >
        <ChevronLeft className="w-3 h-3" /> Return to Case Files
      </Link>

      {/* ── Operative Header Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center gap-8 border px-8 py-8"
        style={{
          background: 'linear-gradient(135deg, rgba(212,160,23,0.07) 0%, rgba(10,6,2,0.9) 100%)',
          borderColor: 'rgba(200,160,80,0.2)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* Avatar */}
        <div
          className="w-24 h-24 flex items-center justify-center flex-shrink-0 border-2 text-4xl font-bold"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(212,160,23,0.15), transparent)',
            borderColor: 'rgba(200,160,80,0.35)',
            color: '#d4a017',
          }}
        >
          {team.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="text-[9px] font-mono uppercase tracking-[0.5em] mb-1" style={{ color: 'rgba(200,160,80,0.45)' }}>
            Operative File
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-3" style={{ color: '#f5e6c8' }}>
            {team.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
            <span
              className="text-[10px] font-bold uppercase px-3 py-1 tracking-widest"
              style={{ color: '#d4a017', border: '1px solid rgba(212,160,23,0.4)', background: 'rgba(212,160,23,0.08)' }}
            >
              {rankTitle}
            </span>
            {team.created_at && (
              <span className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: 'rgba(200,160,80,0.45)' }}>
                <Clock className="w-3 h-3" />
                Joined {new Date(team.created_at.replace(' ', 'T') + 'Z').toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="text-center">
          <div className="text-[9px] font-mono uppercase tracking-[0.4em] mb-1" style={{ color: 'rgba(200,160,80,0.4)' }}>Total Score</div>
          <div className="text-5xl font-bold tabular-nums" style={{ color: '#d4a017', textShadow: '0 0 30px rgba(212,160,23,0.25)' }}>
            {team.score.toLocaleString()}
          </div>
          <div className="text-[9px] font-mono uppercase tracking-widest mt-1" style={{ color: 'rgba(200,160,80,0.4)' }}>points</div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Puzzles Solved"   value={solvedPuzzles?.length ?? 0} accent="#5a8a3c" />
        <StatCard label="Cases Cracked"    value={correctSubs}                accent="#d4a017" />
        <StatCard label="Reports Filed"    value={submissions?.length ?? 0}   accent="#c8a050" />
        <StatCard label="Rank"             value={rankTitle}                  accent="#b88040" />
      </div>

      {/* ── Badges ── */}
      {team.badges && team.badges.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: 'rgba(200,160,80,0.12)' }}>
            <Award className="w-4 h-4" style={{ color: '#d4a017' }} />
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#e8d5a3' }}>Commendations</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {team.badges.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center justify-center text-center gap-3 p-6 border"
                style={{ borderColor: 'rgba(200,160,80,0.2)', background: 'rgba(212,160,23,0.05)' }}
              >
                <Award className="w-8 h-8" style={{ color: '#d4a017' }} />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide" style={{ color: '#e8d5a3' }}>{b.badge_name}</div>
                  <div className="text-[9px] font-mono mt-1" style={{ color: 'rgba(200,160,80,0.45)' }}>
                    {new Date(b.earned_at.replace(' ', 'T') + 'Z').toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Score Timeline ── */}
      {timeline.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(200,160,80,0.12)' }}>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4" style={{ color: '#c8a050' }} />
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#e8d5a3' }}>Score Timeline</h2>
            </div>
            <span className="text-[9px] font-mono uppercase" style={{ color: 'rgba(200,160,80,0.4)' }}>{timeline.length} events</span>
          </div>
          <div className="border overflow-hidden max-h-80 overflow-y-auto custom-scrollbar"
            style={{ borderColor: 'rgba(200,160,80,0.12)' }}>
            {timeline.slice(0, 20).map((evt, i) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: 'rgba(200,160,80,0.07)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 border" style={{ borderColor: 'rgba(200,160,80,0.15)', background: 'rgba(200,160,80,0.04)' }}>
                    {eventIcon(evt.event_type)}  
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide" style={{ color: '#e8d5a3' }}>
                      {evt.event_type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[9px] font-mono mt-0.5" style={{ color: 'rgba(200,160,80,0.4)' }}>
                      {new Date(evt.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className="text-base font-bold tabular-nums" style={{ color: evt.points >= 0 ? '#5a8a3c' : '#b84040' }}>
                  {evt.points >= 0 ? '+' : ''}{evt.points} pts
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Solved Puzzles & Submissions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Solved Puzzles */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: 'rgba(200,160,80,0.12)' }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: '#5a8a3c' }} />
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#e8d5a3' }}>Cipher Log</h2>
          </div>
          <div className="border overflow-hidden" style={{ borderColor: 'rgba(200,160,80,0.12)' }}>
            {(solvedPuzzles ?? []).length > 0 ? (solvedPuzzles).map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: 'rgba(200,160,80,0.07)' }}>
                <div>
                  <div className="text-xs font-bold uppercase" style={{ color: '#e8d5a3' }}>Cipher #{p.id}</div>
                  <div className="text-[9px] font-mono mt-0.5" style={{ color: 'rgba(200,160,80,0.4)' }}>
                    {p.solved_at ? new Date(p.solved_at.replace(' ', 'T') + 'Z').toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
                <span className="font-bold" style={{ color: '#5a8a3c' }}>+{p.points} pts</span>
              </div>
            )) : (
              <div className="py-10 text-center text-[11px] font-mono uppercase tracking-widest" style={{ color: 'rgba(200,160,80,0.3)' }}>
                No ciphers cracked yet
              </div>
            )}
          </div>
        </section>

        {/* Case Submissions */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: 'rgba(200,160,80,0.12)' }}>
            <History className="w-4 h-4" style={{ color: '#c8a050' }} />
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#e8d5a3' }}>Case Submissions</h2>
          </div>
          <div className="border overflow-hidden" style={{ borderColor: 'rgba(200,160,80,0.12)' }}>
            {(submissions ?? []).length > 0 ? submissions.map(s => (
              <div key={s.id} className="px-5 py-4 border-b space-y-1.5" style={{ borderColor: 'rgba(200,160,80,0.07)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase" style={{ color: '#e8d5a3' }}>{s.case_title}</span>
                  <span
                    className="text-[9px] font-bold uppercase px-2 py-0.5"
                    style={{
                      color: s.status === 'correct' ? '#5a8a3c' : '#b84040',
                      border: `1px solid ${s.status === 'correct' ? '#5a8a3c' : '#b84040'}50`,
                      background: `${s.status === 'correct' ? '#5a8a3c' : '#b84040'}10`,
                    }}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="text-[9px] font-mono" style={{ color: 'rgba(200,160,80,0.4)' }}>
                  Suspect: {s.attacker_name}
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-[11px] font-mono uppercase tracking-widest" style={{ color: 'rgba(200,160,80,0.3)' }}>
                No reports filed yet
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

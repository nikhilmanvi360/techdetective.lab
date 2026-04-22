import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Trophy, CheckCircle2, History, Clock, ShieldAlert,
  Award, ChevronLeft, TrendingUp, Activity, Database
} from 'lucide-react';
import { motion } from 'motion/react';
import { Team, Puzzle, Submission, ScoreEvent } from '../types';
import { getRankTitle } from '../utils/ranks';
import { useSound } from '../hooks/useSound';

/* ─── Stat Card ────────────────────────────────────────────── */
function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div
      className="flex flex-col p-6 h-full"
      style={{
        background: 'linear-gradient(165deg, #f5e8b0 0%, #e8d488 40%, #d8c070 100%)',
        border: '2px solid #a07830',
        boxShadow: '0 6px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
      }}
    >
      <div className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-40 text-[#1a0e04]">{label}</div>
      <div className="text-3xl font-black tabular-nums text-[#1a0e04]" style={{ fontFamily: "'Georgia', serif" }}>{value}</div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */
export default function Profile() {
  const [data, setData] = useState<{
    team: Team;
    solvedPuzzles: Puzzle[];
    submissions: Submission[];
  } | null>(null);
  const [timeline, setTimeline] = useState<ScoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { playSound } = useSound();
  const navigate = useNavigate();

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

  const handleLogout = () => {
    playSound('click');
    localStorage.clear();
    window.location.href = '/';
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#1a120a]">
      <Activity className="w-10 h-10 text-[#d4a017] animate-pulse" />
    </div>
  );

  if (!data) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#1a120a]">
      <div className="text-red-900 font-display font-black uppercase tracking-[0.4em]">CRITICAL_ERROR: PROFILE_NOT_FOUND</div>
    </div>
  );

  const { team, solvedPuzzles, submissions } = data;
  const correctSubs = submissions.filter(s => s.status === 'correct').length;
  const rankTitle = getRankTitle(team.score);
  const xp = team.score || 0;
  const xpPct = Math.min(100, Math.round((xp / 500) * 100));

  const eventIcon = (type: string) => {
    if (type === 'puzzle_solve') return <CheckCircle2 className="w-4 h-4 text-[#4a7c3f]" />;
    if (type === 'case_solve')   return <ShieldAlert className="w-4 h-4 text-[#c8860a]" />;
    if (type === 'first_blood')  return <Trophy className="w-4 h-4 text-[#d4a017]" />;
    if (type === 'hint_penalty') return <Clock className="w-4 h-4 text-red-900" />;
    return <TrendingUp className="w-4 h-4 text-[#1a0e04]/40" />;
  };

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
              OPERATIVE_DOSSIER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right leading-none">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-0.5 text-[#c8a050]/60">{rankTitle}</div>
            <div className="text-sm font-black text-[#f0d070]">{team.name}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#c8a050]/60">XP {xp}</span>
            <div className="w-28 h-3 bg-[#1a0e04] border border-[#5a4010] rounded-sm overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full rounded-sm"
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

      {/* ═══════════ MAIN DOSSIER AREA ═══════════ */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12" style={{ background: 'linear-gradient(160deg, #f0e0a0 0%, #e4d080 50%, #d8c060 100%)' }}>
        
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Operative Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center gap-10 p-10 bg-[#e8d8a0] border-2 border-[#a07830] shadow-2xl relative overflow-hidden"
          >
            {/* Bureau Overlay */}
            <div className="absolute top-4 right-6 text-[10px] font-mono text-[#1a0e04]/20 uppercase tracking-[0.4em] pointer-events-none">
              BUREAU_ID_GEN_0x{team.id.toString(16).toUpperCase()}
            </div>

            {/* Avatar / Portrait */}
            <div
              className="w-32 h-32 flex items-center justify-center flex-shrink-0 border-2 text-5xl font-black bg-black/5"
              style={{ borderColor: '#a07830', color: '#1a0e04', textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
            >
              {team.name.charAt(0).toUpperCase()}
            </div>

            {/* Operative Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-1">
                <div className="text-[11px] font-black text-[#1a0e04]/40 uppercase tracking-[0.3em]">Operative Profile</div>
                <h1 className="text-4xl font-black text-[#1a0e04] uppercase tracking-tight leading-none" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
                  {team.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                <div
                  className="px-4 py-1.5 text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
                  style={{ background: '#3a2a12', color: '#f0d070', border: '1.5px solid #6a5020' }}
                >
                  <ShieldAlert className="w-4 h-4" />
                  {rankTitle}
                </div>
                {team.created_at && (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#1a0e04]/50">
                    <Clock className="w-3.5 h-3.5" />
                    Inducted {new Date(team.created_at.replace(' ', 'T') + 'Z').toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Achievement Badge Summary */}
            <div className="flex items-center gap-4 border-l-2 border-[#a07830]/20 pl-10 hidden lg:flex">
              <div className="text-center">
                 <div className="text-[10px] font-black text-[#1a0e04]/30 uppercase tracking-widest mb-1">Clearance</div>
                 <div className="text-5xl font-black text-[#1a0e04] tabular-nums leading-none">
                    {team.score.toLocaleString()}
                 </div>
                 <div className="text-[10px] font-black text-[#1a0e04]/40 uppercase tracking-widest mt-2">Points Earned</div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Puzzles Solved" value={solvedPuzzles?.length ?? 0} accent="#4a7c3f" />
            <StatCard label="Cases Cracked"  value={correctSubs}                 accent="#c8860a" />
            <StatCard label="Reports Filed"  value={submissions?.length ?? 0}    accent="#8B2020" />
            <StatCard label="Service Rank"   value={rankTitle.split(' ')[0]}     accent="#1a6a8a" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            
            {/* Left: Timeline & Logs */}
            <div className="xl:col-span-8 space-y-10">
              
              {/* Score Timeline */}
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b-2 border-[#1a0e04]/10 pb-3">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-[#1a0e04]/60" />
                    <h2 className="text-xl font-black text-[#1a0e04] uppercase tracking-wider">Field Operative Logs</h2>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#1a0e04]/40 uppercase tracking-widest">{timeline.length} Recorded Events</span>
                </div>

                <div className="bg-[#e8d8a0]/40 border-2 border-[#a07830]/20 overflow-hidden">
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    {timeline.length > 0 ? timeline.map((evt, i) => (
                      <motion.div
                        key={evt.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center justify-between px-8 py-5 border-b border-[#a07830]/10 hover:bg-black/5 transition-colors"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 flex items-center justify-center bg-black/5 border border-[#a07830]/20 rounded-sm">
                            {eventIcon(evt.event_type)}
                          </div>
                          <div>
                            <div className="text-sm font-black text-[#1a0e04] uppercase tracking-tight">
                              {evt.event_type.replace(/_/g, ' ')}
                            </div>
                            <div className="text-[10px] font-mono text-[#1a0e04]/40 uppercase mt-0.5 tracking-tighter">
                              Timestamp: {new Date(evt.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-black tabular-nums" style={{ color: evt.points >= 0 ? '#4a7c3f' : '#8B2020' }}>
                          {evt.points >= 0 ? '+' : ''}{evt.points} XP
                        </div>
                      </motion.div>
                    )) : (
                      <div className="py-20 text-center font-black text-[#1a0e04]/20 uppercase tracking-widest">
                        Archive Empty // No fieldwork detected.
                      </div>
                    )}
                  </div>
                </div>
              </section>

            </div>

            {/* Right: Badges & Rewards */}
            <div className="xl:col-span-4 space-y-10">
              
              {/* Badge Rack */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-[#1a0e04]/10 pb-3">
                  <Award className="w-5 h-5 text-[#1a0e04]/60" />
                  <h2 className="text-xl font-black text-[#1a0e04] uppercase tracking-wider">Commendations</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {team.badges && team.badges.length > 0 ? team.badges.map((b, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-6 p-6 bg-[#e8d8a0] border-2 border-[#a07830] shadow-md group"
                    >
                      <div className="w-14 h-14 flex items-center justify-center bg-[#f0e0a0] border-2 border-[#a07830] rounded-sm group-hover:bg-[#d4a017]/10 transition-colors">
                        <Trophy className="w-7 h-7 text-[#1a0e04]/30 group-hover:text-[#d4a017] transition-colors" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-[#1a0e04] uppercase tracking-widest">{b.badge_name}</div>
                        <div className="text-[10px] font-mono text-[#1a0e04]/40 uppercase mt-1">
                          Conferred: {new Date(b.earned_at.replace(' ', 'T') + 'Z').toLocaleDateString()}
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="p-10 text-center border-2 border-dashed border-[#a07830]/20">
                       <span className="text-[10px] font-black text-[#1a0e04]/20 uppercase tracking-widest italic">No comms yet</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Case Submissions Summary */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-[#1a0e04]/10 pb-3">
                  <Database className="w-5 h-5 text-[#1a0e04]/60" />
                  <h2 className="text-xl font-black text-[#1a0e04] uppercase tracking-wider">Reports Summary</h2>
                </div>
                
                <div className="bg-black/5 p-6 border-2 border-[#a07830]/10 space-y-4">
                   <div className="flex justify-between items-center text-[11px] font-black text-[#1a0e04]/60 uppercase tracking-widest">
                      <span>Accuracy Rating</span>
                      <span className="text-[#4a7c3f]">{submissions.length > 0 ? Math.round((correctSubs / submissions.length) * 100) : 0}%</span>
                   </div>
                   <div className="h-2 bg-[#1a0e04]/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${submissions.length > 0 ? (correctSubs / submissions.length) * 100 : 0}%` }}
                        className="h-full bg-[#4a7c3f]"
                      />
                   </div>
                </div>
              </section>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

import { useState, useEffect } from 'react';
import { User, Trophy, CheckCircle2, History, Clock, ShieldAlert, Terminal, Award, Activity, Zap, Target, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Team, Puzzle, Submission, ScoreEvent } from '../types';
import { getRankTitle, getRankColor } from '../utils/ranks';
import { useSound } from '../hooks/useSound';

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
    const fetchProfile = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
        const [profileRes, timelineRes] = await Promise.all([
          fetch('/api/team/profile', { headers }),
          fetch('/api/team/timeline', { headers })
        ]);
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData && profileData.team) {
            setData(profileData);
          }
        }
        if (timelineRes.ok) {
          const timelineData = await timelineRes.json();
          if (Array.isArray(timelineData)) {
            setTimeline(timelineData);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Activity className="w-12 h-12 text-cyber-green animate-pulse" />
      <div className="font-display text-cyber-green uppercase tracking-[0.4em] flicker-anim text-center">
        Retrieving_Team_Profile...
      </div>
    </div>
  );

  if (!data) return <div className="text-cyber-red font-display tracking-widest text-center mt-20 uppercase">CRITICAL_ERROR: PROFILE_NOT_FOUND</div>;

  const { team, solvedPuzzles, submissions } = data;

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="cyber-panel p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Terminal className="w-40 h-40 text-cyber-green" />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="w-24 h-24 bg-cyber-green/5 border border-cyber-green/40 neon-border-green flex items-center justify-center relative group">
            <User className="w-12 h-12 text-cyber-green flicker-anim" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-cyber-bg border border-cyber-green/50 flex items-center justify-center">
              <Activity className="w-3 h-3 text-cyber-green" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <h1 className="text-4xl font-display font-bold text-white uppercase tracking-tight leading-none">{team.name}</h1>
              <span className={`inline-block text-[10px] px-3 py-1 border font-display font-bold uppercase tracking-widest ${getRankColor(team.score).replace('text-', 'border-').replace('bg-', 'bg-opacity-10 bg-')}`}>
                {getRankTitle(team.score)}
              </span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-8">
              <div className="flex flex-col">
                <span className="text-[8px] font-display text-gray-600 uppercase mb-0.5 tracking-widest">Commissioned</span>
                <div className="flex items-center gap-2 text-gray-400 font-mono text-xs">
                  <Clock className="w-3 h-3 text-cyber-blue" />
                  {team.created_at ? new Date(team.created_at.replace(' ', 'T') + 'Z').toLocaleDateString() : 'UNKNOWN'}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-display text-gray-600 uppercase mb-0.5 tracking-widest">Cumulative XP</span>
                <div className="flex items-center gap-2 text-cyber-green font-mono text-xs">
                  <Trophy className="w-3 h-3 text-cyber-amber" />
                  {team.score.toLocaleString()} PTS
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {team.badges && team.badges.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-cyber-line pb-4">
            <Award className="w-5 h-5 text-cyber-amber" />
            <h2 className="text-xs font-display font-bold text-white uppercase tracking-[0.3em]">Operational Commendations</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(team.badges || []).map((badge, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="cyber-panel p-6 flex flex-col items-center justify-center text-center gap-4 hover:neon-border-amber transition-all duration-300"
              >
                <div className="p-3 bg-cyber-amber/5 border border-cyber-amber/20">
                  <Award className="w-8 h-8 text-cyber-amber flicker-anim" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-display font-bold text-white uppercase tracking-widest block">{badge.badge_name}</span>
                  <span className="text-[9px] font-mono text-gray-600 uppercase">
                    {new Date(badge.earned_at.replace(' ', 'T') + 'Z').toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Score Event Timeline */}
      {timeline.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-cyber-line pb-4">
            <TrendingUp className="w-5 h-5 text-cyber-green" />
            <h2 className="text-xs font-display font-bold text-white uppercase tracking-[0.3em]">Score Event Timeline</h2>
            <span className="ml-auto text-[9px] font-mono text-gray-600 uppercase">{timeline.length} Events</span>
          </div>
          <div className="cyber-panel overflow-hidden border-cyber-line/50">
            <div className="divide-y divide-cyber-line/30 max-h-[400px] overflow-y-auto custom-scrollbar">
              {timeline.slice(0, 20).map((event, idx) => {
                const icon = event.event_type === 'puzzle_solve' ? <CheckCircle2 className="w-4 h-4 text-cyber-green" /> :
                  event.event_type === 'case_solve' ? <ShieldAlert className="w-4 h-4 text-cyber-blue" /> :
                  event.event_type === 'first_blood' ? <Zap className="w-4 h-4 text-cyber-red" /> :
                  event.event_type === 'hint_penalty' ? <Clock className="w-4 h-4 text-cyber-amber" /> :
                  event.event_type === 'adversary_action' ? <Target className="w-4 h-4 text-cyber-violet" /> :
                  <Activity className="w-4 h-4 text-gray-500" />;

                const label = event.event_type.replace(/_/g, ' ').toUpperCase();

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-1.5 border border-cyber-line group-hover:border-cyber-green/30 transition-colors">
                        {icon}
                      </div>
                      <div>
                        <div className="text-xs font-display text-white uppercase tracking-widest">{label}</div>
                        <div className="text-[9px] font-mono text-gray-600 mt-0.5">
                          {new Date(event.created_at).toLocaleString()}
                          {event.metadata?.multiplier && (
                            <span className="ml-2 text-cyber-amber">×{event.metadata.multiplier} BOOST</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-lg font-display font-bold tabular-nums ${event.points >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
                      {event.points >= 0 ? '+' : ''}{event.points} XP
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Solved Puzzles */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-cyber-line pb-4 px-2">
            <CheckCircle2 className="w-5 h-5 text-cyber-green" />
            <h2 className="text-xs font-display font-bold text-white uppercase tracking-[0.3em]">Module History</h2>
          </div>
          <div className="cyber-panel overflow-hidden border-cyber-line/50">
            <div className="divide-y divide-cyber-line/30">
              {(solvedPuzzles || []).length > 0 ? (
                (solvedPuzzles || []).map((p) => (
                  <div key={p.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div className="space-y-1">
                      <p className="text-sm font-display text-white uppercase tracking-widest group-hover:text-cyber-green transition-colors">TASK_UNIT_0x{p.id}</p>
                      <p className="text-[9px] font-mono text-gray-600 uppercase tracking-tighter">
                        Secured on {p.solved_at ? new Date(p.solved_at.replace(' ', 'T') + 'Z').toLocaleDateString() : 'UNKNOWN'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-display font-bold text-cyber-green tabular-nums">+{p.points} XP</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-gray-700 font-display text-[10px] uppercase tracking-[0.4em] italic opacity-50">
                  No investigative modules secured.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Submission History */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-cyber-line pb-4 px-2">
            <History className="w-5 h-5 text-cyber-blue" />
            <h2 className="text-xs font-display font-bold text-white uppercase tracking-[0.3em]">Field Report Registry</h2>
          </div>
          <div className="cyber-panel overflow-hidden border-cyber-line/50">
            <div className="divide-y divide-cyber-line/30">
              {(submissions || []).length > 0 ? (
                (submissions || []).map((s) => (
                  <div key={s.id} className="p-6 space-y-3 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-display font-bold text-white uppercase tracking-widest group-hover:text-cyber-blue transition-colors">{s.case_title.replace(' ', '_')}</h3>
                      <span className={`text-[9px] font-display px-2 py-0.5 border uppercase tracking-widest ${s.status === 'correct'
                          ? 'bg-cyber-green/5 text-cyber-green border-cyber-green/30'
                          : 'bg-cyber-red/5 text-cyber-red border-cyber-red/30'
                        }`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                      <span>Target: {s.attacker_name}</span>
                      <span>{s.submitted_at ? new Date(s.submitted_at.replace(' ', 'T') + 'Z').toLocaleDateString() : 'UNKNOWN'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-gray-700 font-display text-[10px] uppercase tracking-[0.4em] italic opacity-50">
                  No case telemetry submitted.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Security Status Card */}
      <div className="cyber-panel p-8 bg-cyber-green/5 border-cyber-green/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-green/5 -mr-16 -mt-16 rounded-full group-hover:bg-cyber-green/10 transition-colors" />
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="p-4 bg-cyber-green/10 border border-cyber-green/30">
            <ShieldAlert className="w-8 h-8 text-cyber-green flicker-anim" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-sm font-display font-bold text-white uppercase tracking-[0.2em] mb-1">Agent Status: ACTIVE_DUTY</h3>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-relaxed">
              Your digital footprint is being monitored by CCU Central. Maintain operational security through encrypted channels.
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-black/40 border border-cyber-line">
            <Terminal className="w-4 h-4 text-cyber-green animate-pulse" />
            <span className="text-[10px] font-display text-cyber-green uppercase font-bold tracking-[0.2em]">Link Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}


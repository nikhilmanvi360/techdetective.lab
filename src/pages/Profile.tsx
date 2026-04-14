import { useState, useEffect } from 'react';
import { User, Trophy, CheckCircle2, History, Clock, ShieldAlert, Terminal, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { Team, Puzzle, Submission } from '../types';
import { getRankTitle, getRankColor } from '../utils/ranks';

export default function Profile() {
  const [data, setData] = useState<{
    team: Team;
    solvedPuzzles: Puzzle[];
    submissions: Submission[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/team/profile', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        if (response.ok) {
          setData(result);
        }
      } catch (err) {
        console.error('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div className="animate-pulse font-mono text-terminal-green">RETRIEVING_TEAM_PROFILE...</div>;
  if (!data) return <div className="text-red-500 font-mono text-center mt-20">PROFILE_NOT_FOUND</div>;

  const { team, solvedPuzzles, submissions } = data;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="terminal-card p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-full bg-terminal-green/10 border-2 border-terminal-green flex items-center justify-center">
            <User className="w-12 h-12 text-terminal-green" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-tighter">{team.name}</h1>
              <span className={`text-xs px-2 py-1 rounded border border-current ${getRankColor(team.score)}`}>
                {getRankTitle(team.score)}
              </span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-gray-400 font-mono text-sm">
                <Clock className="w-4 h-4" />
                JOINED: {team.created_at ? new Date(team.created_at.replace(' ', 'T') + 'Z').toLocaleDateString() : 'UNKNOWN'}
              </div>
              <div className="flex items-center gap-2 text-terminal-green font-mono text-sm">
                <Trophy className="w-4 h-4" />
                TOTAL_SCORE: {team.score} PTS
              </div>
            </div>
          </div>
        </div>
      </div>

      {team.badges && team.badges.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Award className="w-4 h-4 text-yellow-500" />
            <h2 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Earned Badges</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {team.badges.map((badge, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="terminal-card p-4 flex flex-col items-center justify-center text-center gap-2 border-yellow-500/30 bg-yellow-500/5"
              >
                <Award className="w-8 h-8 text-yellow-500" />
                <span className="text-sm font-mono font-bold text-yellow-500 uppercase">{badge.badge_name}</span>
                <span className="text-[10px] font-mono text-gray-500">
                  {new Date(badge.earned_at.replace(' ', 'T') + 'Z').toLocaleDateString()}
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Solved Puzzles */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <CheckCircle2 className="w-4 h-4 text-terminal-green" />
            <h2 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Solved Puzzles</h2>
          </div>
          <div className="terminal-card overflow-hidden">
            <div className="divide-y divide-terminal-line/30">
              {solvedPuzzles.length > 0 ? (
                solvedPuzzles.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div>
                      <p className="text-sm font-mono text-white uppercase tracking-tight">Puzzle #{p.id}</p>
                      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                        Solved on {p.solved_at ? new Date(p.solved_at.replace(' ', 'T') + 'Z').toLocaleDateString() : 'UNKNOWN'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-terminal-green">+{p.points} PTS</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-600 font-mono text-xs uppercase tracking-widest italic">
                  No puzzles solved yet.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Submission History */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <History className="w-4 h-4 text-terminal-green" />
            <h2 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Submission History</h2>
          </div>
          <div className="terminal-card overflow-hidden">
            <div className="divide-y divide-terminal-line/30">
              {submissions.length > 0 ? (
                submissions.map((s) => (
                  <div key={s.id} className="p-4 space-y-2 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-mono font-bold text-white uppercase tracking-tight">{s.case_title}</h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        s.status === 'correct' 
                          ? 'bg-terminal-green/10 text-terminal-green border-terminal-green/30' 
                          : 'bg-red-500/10 text-red-500 border-red-500/30'
                      }`}>
                        {s.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                      <span>Attacker: {s.attacker_name}</span>
                      <span>{s.submitted_at ? new Date(s.submitted_at.replace(' ', 'T') + 'Z').toLocaleDateString() : 'UNKNOWN'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-600 font-mono text-xs uppercase tracking-widest italic">
                  No case reports submitted yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Security Status Card */}
      <div className="terminal-card p-6 bg-terminal-green/5 border-terminal-green/20">
        <div className="flex items-center gap-4">
          <ShieldAlert className="w-6 h-6 text-terminal-green" />
          <div>
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-tight">Agent Status: Active</h3>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
              Your digital footprint is being monitored by CCU. Maintain operational security.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Terminal className="w-4 h-4 text-terminal-green animate-pulse" />
            <span className="text-[10px] font-mono text-terminal-green uppercase font-bold">Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

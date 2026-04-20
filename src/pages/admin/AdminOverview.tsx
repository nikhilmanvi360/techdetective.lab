import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Users, FileText, Shield, Zap, TrendingUp } from 'lucide-react';

function StatCard({ label, value, sub, color = 'cyber-green', icon, delay = 0 }: {
  label: string; value: string | number; sub?: string; color?: string;
  icon: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-black border border-${color}/20 p-6 relative overflow-hidden group hover:border-${color}/50 transition-all`}
    >
      <div className={`absolute top-0 right-0 p-4 text-${color} opacity-5 group-hover:opacity-15 transition-opacity`}>
        {icon}
      </div>
      <div className={`text-[9px] font-display text-${color}/60 uppercase tracking-[0.4em] mb-2`}>{label}</div>
      <div className={`text-4xl font-display font-bold text-${color} tabular-nums`}
        style={{ textShadow: `0 0 20px var(--color-${color}-glow, rgba(34,197,94,0.3))` }}>
        {value}
      </div>
      {sub && <div className="text-[10px] font-mono text-gray-600 mt-1">{sub}</div>}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-${color}/20 group-hover:bg-${color}/60 transition-all`} />
    </motion.div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState({ teams: 0, submissions: 0, cases: 0, solves: 0 });
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    Promise.all([
      fetch('/api/admin/teams', { headers }).then(r => r.json()).catch(() => []),
      fetch('/api/admin/submissions', { headers }).then(r => r.json()).catch(() => []),
      fetch('/api/admin/events', { headers }).then(r => r.json()).catch(() => []),
    ]).then(([teams, subs, ev]) => {
      setStats({
        teams: Array.isArray(teams) ? teams.length : 0,
        submissions: Array.isArray(subs) ? subs.length : 0,
        cases: 0,
        solves: Array.isArray(subs) ? subs.filter((s: any) => s.status === 'correct').length : 0,
      });
      if (Array.isArray(ev)) setEvents(ev.slice(0, 15));
    });
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <div className="text-[10px] font-display text-cyber-red/60 uppercase tracking-[0.5em] mb-2">// GLOBAL STATUS</div>
        <h1 className="text-4xl font-display font-bold text-white uppercase tracking-tight">Command Overview</h1>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Active Units" value={stats.teams} sub="registered teams" color="cyber-green" icon={<Users className="w-16 h-16" />} delay={0} />
        <StatCard label="Case Reports" value={stats.submissions} sub="total submissions" color="cyber-blue" icon={<FileText className="w-16 h-16" />} delay={0.05} />
        <StatCard label="Verified Solves" value={stats.solves} sub="confirmed correct" color="cyber-amber" icon={<Shield className="w-16 h-16" />} delay={0.1} />
        <StatCard label="Success Rate" value={stats.submissions ? `${Math.round((stats.solves / stats.submissions) * 100)}%` : '0%'} sub="of all reports" color="cyber-violet" icon={<TrendingUp className="w-16 h-16" />} delay={0.15} />
      </div>

      {/* Recent Event Log */}
      <div>
        <div className="flex items-center gap-3 mb-4 border-b border-cyber-line pb-3">
          <Activity className="w-4 h-4 text-cyber-red" />
          <h2 className="text-sm font-display text-white uppercase tracking-widest">Live Event Stream</h2>
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-red animate-pulse ml-auto" />
        </div>
        <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
          {events.length === 0 ? (
            <div className="text-center py-10 text-gray-700 font-mono text-xs">No events recorded yet.</div>
          ) : events.map((ev, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 bg-black/40 border border-cyber-line p-3 font-mono text-xs"
            >
              <Zap className="w-3 h-3 text-cyber-amber flex-shrink-0" />
              <span className="text-gray-500 uppercase tracking-widest text-[9px] flex-shrink-0">{ev.event_type}</span>
              <span className="text-white truncate">{ev.team_name}</span>
              <span className="text-gray-600 ml-auto text-[9px] flex-shrink-0">
                {ev.created_at ? new Date(ev.created_at.replace(' ', 'T') + 'Z').toLocaleTimeString() : '--'}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Users, FileText, Shield, Zap, TrendingUp, Clock, Target } from 'lucide-react';

function StatCard({ label, value, sub, color = '#d4a017', icon, delay = 0 }: {
  label: string; value: string | number; sub?: string; color?: string;
  icon: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-[#140e06] border-2 border-[#3a2810] p-6 relative overflow-hidden group hover:border-[#d4a017]/50 transition-all shadow-xl"
    >
      <div className="absolute top-0 right-0 p-6 text-[#d4a017] opacity-[0.05] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
        {icon}
      </div>
      
      <div className="relative z-10">
        <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.4em] mb-3 flex items-center gap-2">
           <div className="w-1 h-1 bg-[#d4a017]" /> {label}
        </div>
        <div className="text-5xl font-display font-black text-[#f0d070] tabular-nums tracking-tighter drop-shadow-md">
          {value}
        </div>
        {sub && <div className="text-[10px] font-black text-[#a07830]/60 uppercase tracking-widest mt-2 font-mono">{sub}</div>}
      </div>

      {/* Decorative Corner Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#d4a017]/30" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#d4a017]/30" />
      
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#d4a017]/20 to-transparent group-hover:via-[#d4a017]/50 transition-all" />
    </motion.div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState({ teams: 0, submissions: 0, cases: 0, solves: 0 });
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${''}` };
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
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex items-end justify-between border-b-4 border-[#3a2810] pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-[#d4a017]" />
            <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.6em]">// FIELD_OPERATIONS_MONITOR</div>
          </div>
          <h1 className="text-6xl font-display font-black text-[#f4e6c4] uppercase tracking-tighter">
            Command <span className="text-[#d4a017]">Nexus</span>
          </h1>
        </div>
        <div className="text-right hidden md:block">
           <div className="text-[10px] font-black text-[#a07830] uppercase tracking-widest mb-1">Last Update</div>
           <div className="text-sm font-mono text-[#f0d070] font-bold">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Grid - Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          label="Active Units" 
          value={stats.teams} 
          sub="DEPLOYED DETECTIVES" 
          icon={<Users className="w-20 h-20" />} 
          delay={0} 
        />
        <StatCard 
          label="Evidence Reports" 
          value={stats.submissions} 
          sub="TOTAL SUBMISSIONS" 
          icon={<FileText className="w-20 h-20" />} 
          delay={0.1} 
        />
        <StatCard 
          label="Verified Cases" 
          value={stats.solves} 
          sub="CONFIRMED SOLUTIONS" 
          icon={<Target className="w-20 h-20" />} 
          delay={0.2} 
        />
        <StatCard 
          label="Success Rating" 
          value={stats.submissions ? `${Math.round((stats.solves / stats.submissions) * 100)}%` : '0%'} 
          sub="EFFICIENCY METRIC" 
          icon={<TrendingUp className="w-20 h-20" />} 
          delay={0.3} 
        />
      </div>

      {/* Live Intelligence Feed */}
      <div className="bg-[#140e06] border-2 border-[#3a2810] rounded-sm overflow-hidden shadow-2xl">
        <div className="flex items-center gap-4 px-6 py-4 bg-[#0c0803] border-b-2 border-[#3a2810]">
          <Activity className="w-5 h-5 text-[#d4a017] animate-pulse" />
          <h2 className="text-sm font-black text-[#f4e6c4] uppercase tracking-[0.3em]">Live Intelligence Stream</h2>
          <div className="ml-auto flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
             <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Active Link</span>
          </div>
        </div>
        
        <div className="p-2">
          <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar bg-black/20 p-2">
            {events.length === 0 ? (
              <div className="text-center py-20">
                <Clock className="w-8 h-8 text-[#a07830]/20 mx-auto mb-4" />
                <div className="text-[10px] font-black text-[#a07830]/40 uppercase tracking-widest">Waiting for field activity...</div>
              </div>
            ) : events.map((ev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-6 px-5 py-4 border border-[#3a2810]/30 hover:border-[#d4a017]/30 bg-[#0c0803]/40 group transition-all"
              >
                <div className="text-[9px] font-mono text-[#a07830] w-20 flex-shrink-0">
                  {ev.created_at ? new Date(ev.created_at.replace(' ', 'T') + 'Z').toLocaleTimeString([], { hour12: false }) : '--:--:--'}
                </div>
                
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  ev.event_type.includes('correct') ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' :
                  ev.event_type.includes('fail') ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]' :
                  'bg-[#d4a017]'
                }`} />
                
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-[#d4a017] uppercase tracking-widest bg-[#d4a017]/5 px-2 py-0.5 rounded border border-[#d4a017]/10">
                        {ev.event_type}
                      </span>
                      <span className="text-sm font-black text-[#f4e6c4] truncate group-hover:text-[#f0d070] transition-colors uppercase tracking-tight">
                        {ev.team_name}
                      </span>
                   </div>
                </div>

                <div className="hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity">
                   <Zap className="w-3 h-3 text-[#d4a017]" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="px-6 py-3 bg-[#0c0803] border-t-2 border-[#3a2810] flex items-center justify-between">
           <div className="text-[8px] font-black text-[#a07830]/40 uppercase tracking-widest font-mono">
             CCU-Nexus-OS v2.4.0 // END_OF_STREAM
           </div>
           <div className="text-[8px] font-black text-[#a07830]/40 uppercase tracking-widest font-mono">
             {events.length} EVENTS LOGGED
           </div>
        </div>
      </div>
    </div>
  );
}

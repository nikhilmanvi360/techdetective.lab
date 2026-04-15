import { useState, useEffect, useRef } from 'react';
import { Trophy, Medal, Target, Users, Activity, Zap, Cpu, Search, ShieldAlert, Crown } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { ScoreEntry } from '../types';
import { io } from 'socket.io-client';
import { getRankTitle, getRankColor } from '../utils/ranks';
import { useSound } from '../hooks/useSound';

function AnimatedScore({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    
    let start = 0;
    const end = value;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      start = Math.floor(eased * end);
      setDisplayValue(start);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, isInView]);

  return <span ref={ref} className={className}>{displayValue.toLocaleString()}</span>;
}

export default function Scoreboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { playSound } = useSound();

  const fetchScores = async () => {
    try {
      const response = await fetch('/api/scoreboard');
      const data = await response.json();
      setScores(data);
    } catch (err) {
      console.error('Failed to fetch scoreboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
    
    const socket = io();
    socket.on('score_update', () => {
      playSound('ping');
      fetchScores();
    });

    return () => {
      socket.disconnect();
    };
  }, [playSound]);

  const filteredScores = scores.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Activity className="w-12 h-12 text-cyber-green animate-pulse" />
        <div className="font-display text-cyber-green uppercase tracking-[0.4em] flicker-anim text-center">
          Aggregating_Field_Intelligence...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* HUD Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cyber-panel border-cyber-amber/30 p-10 relative overflow-hidden gradient-border"
      >
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Trophy className="w-48 h-48 text-cyber-amber animate-float" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyber-amber fill-cyber-amber" />
              <span className="text-xs font-display text-cyber-amber uppercase tracking-[0.4em]">Tactical Rankings</span>
            </div>
            <h1 className="text-5xl font-display font-bold text-white uppercase tracking-tight glitch-text">Operation_Leaderboard</h1>
            <p className="text-gray-500 font-mono text-sm max-w-xl leading-relaxed italic">
              // Real-time tracking of active investigation units. Rank is determined by cumulative score across all case nodes.
            </p>
          </div>
          
          <div className="w-full md:w-80 space-y-4">
             <div className="flex items-center justify-between text-[10px] font-display text-cyber-blue uppercase tracking-widest px-1">
                <div className="flex items-center gap-2">
                   <Target className="w-3 h-3" />
                   Filter_By_Team
                </div>
                <span>Sec: 0x4A</span>
             </div>
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-cyber-blue transition-colors" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cyber-input w-full pl-12 h-12 border-cyber-line focus:border-cyber-blue"
                  placeholder="SEARCH_TEAM_ID..."
                />
                <div className="absolute bottom-0 left-0 h-[1px] w-0 group-focus-within:w-full bg-cyber-blue transition-all duration-500" />
             </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Rankings Table */}
        <div className="lg:col-span-3">
          <div className="cyber-panel border-cyber-line bg-black/40 gradient-border">
            <div className="bg-black/80 px-8 py-4 border-b border-cyber-line flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-cyber-blue" />
                <span className="text-[10px] font-display text-white uppercase tracking-widest">Active_Units_Stream</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                 <span className="text-[9px] font-display text-cyber-green uppercase tracking-widest">Live_Sync: Active</span>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full font-display border-collapse">
                <thead>
                  <tr className="border-b border-cyber-line bg-black/20">
                    <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">#Rk</th>
                    <th className="px-8 py-6 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Unit_Identifier</th>
                    <th className="px-8 py-6 text-right text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Payload_XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-line/30">
                  <AnimatePresence mode="popLayout">
                    {filteredScores.map((entry, index) => (
                      <motion.tr 
                        key={entry.name}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group hover:bg-white/5 transition-all duration-300 ${index === 0 ? 'bg-cyber-amber/[0.03]' : ''}`}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <span className={`text-xl font-display font-bold tabular-nums ${
                              index === 0 ? 'text-cyber-amber text-shadow-amber' : 
                              index === 1 ? 'text-gray-400' : 
                              index === 2 ? 'text-amber-700' : 'text-gray-700'
                            }`}>
                              {(index + 1).toString().padStart(2, '0')}
                            </span>
                            {index === 0 && (
                              <div className="relative pulse-ring">
                                <Crown className="w-5 h-5 text-cyber-amber fill-cyber-amber/30 flicker-anim" />
                              </div>
                            )}
                            {index === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                            {index === 2 && <Medal className="w-4 h-4 text-amber-700" />}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className={`w-10 h-10 flex items-center justify-center text-md font-bold border transition-all ${
                              index === 0 ? 'bg-cyber-amber/10 border-cyber-amber text-cyber-amber neon-border-amber' : 'bg-black/60 border-cyber-line text-gray-500 group-hover:border-cyber-blue group-hover:text-cyber-blue'
                            }`}>
                              {entry.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-lg font-display font-bold uppercase tracking-tight ${index === 0 ? 'text-white' : 'text-gray-300 group-hover:text-white transition-colors'}`}>
                                {entry.name.replace(' ', '_')}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] font-display px-2 py-0.5 border uppercase tracking-widest ${getRankColor(entry.score).replace('text-', 'border-').replace('bg-', 'bg-opacity-5 bg-')}`}>
                                  {getRankTitle(entry.score)}
                                </span>
                                <div className="w-1 h-1 rounded-full bg-cyber-line" />
                                <span className="text-[8px] font-mono text-gray-600 uppercase">Sector_Verified</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex flex-col items-end">
                            <AnimatedScore 
                              value={entry.score}
                              className={`text-2xl font-display font-bold tabular-nums transition-colors ${index === 0 ? 'text-cyber-amber' : 'text-white group-hover:text-cyber-blue'}`}
                            />
                            <span className="text-[8px] font-display text-gray-600 uppercase tracking-widest mt-1">XP_ACCUMULATED</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  
                  {filteredScores.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-gray-600">
                          <Activity className="w-10 h-10 opacity-20" />
                          <p className="font-display uppercase tracking-[0.3em] text-xs">No_Units_Found_In_Registry</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-8">
           <div className="cyber-panel p-8 border-cyber-blue/20 corner-brackets">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-cyber-blue/10 border border-cyber-blue/30">
                    <Target className="w-4 h-4 text-cyber-blue" />
                 </div>
                 <h4 className="text-[10px] font-display font-bold text-white uppercase tracking-widest">Field_Density</h4>
              </div>
              <div className="space-y-2">
                 <div className="text-4xl font-display font-bold text-white tabular-nums">
                   <AnimatedScore value={scores.length} />
                 </div>
                 <p className="text-[10px] font-display text-gray-500 uppercase tracking-widest">Active_Investigator_Units</p>
              </div>
              <div className="mt-8 pt-8 border-t border-cyber-line">
                 <div className="h-1 w-full bg-cyber-line relative overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-cyber-blue to-cyber-violet" 
                    />
                 </div>
                 <span className="text-[8px] font-display text-gray-600 uppercase tracking-widest mt-2 block">Bandwidth: 65% Capacity</span>
              </div>
           </div>

           <div className="cyber-panel p-8 border-cyber-green/20 corner-brackets">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-cyber-green/10 border border-cyber-green/30">
                    <Cpu className="w-4 h-4 text-cyber-green" />
                 </div>
                 <h4 className="text-[10px] font-display font-bold text-white uppercase tracking-widest">XP_Throughput</h4>
              </div>
              <div className="space-y-2">
                 <div className="text-4xl font-display font-bold text-white tabular-nums">
                   <AnimatedScore value={scores.length > 0 ? Math.round(scores.reduce((acc, s) => acc + s.score, 0) / scores.length) : 0} />
                 </div>
                 <p className="text-[10px] font-display text-gray-500 uppercase tracking-widest">Average_Payload_Per_Unit</p>
              </div>
              <div className="mt-8 pt-8 border-t border-cyber-line">
                 <div className="flex items-center gap-2">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-cyber-green" 
                    />
                    <span className="text-[8px] font-display text-gray-600 uppercase tracking-widest">Processor: Nominal_State</span>
                 </div>
              </div>
           </div>

           <div className="cyber-panel p-6 border-dashed border-cyber-line opacity-40">
              <div className="bg-black/40 p-10 flex items-center justify-center">
                 <ShieldAlert className="w-8 h-8 text-gray-700" />
              </div>
              <p className="text-[8px] font-mono text-gray-700 uppercase p-4 text-center tracking-[0.2em]">Encrypted_Telemetry_Node_09</p>
           </div>
        </div>
      </div>
    </div>
  );
}

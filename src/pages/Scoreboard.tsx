import { useState, useEffect, useRef } from 'react';
import { Search, Activity, User, Target, Zap } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { ScoreEntry, ScoreMultiplier } from '../types';
import { io } from 'socket.io-client';
import { getRankTitle } from '../utils/ranks';
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
      if (progress < 1) requestAnimationFrame(animate);
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
      if (Array.isArray(data)) setScores(data);
      else setScores([]);
    } catch (err) {
      setScores([]);
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
    return () => { socket.disconnect(); };
  }, [playSound]);

  const filteredScores = scores.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Activity className="w-12 h-12 text-[#d1b88a] animate-pulse" />
        <div className="font-display text-[#d1b88a] uppercase tracking-widest typewriter-text text-center">
          Aggregating Intelligence...
        </div>
      </div>
    );
  }

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((acc, s) => acc + s.score, 0) / scores.length) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-16">
      
      {/* Header section matching the analog desk */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 pt-6 pb-2">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#d1b88a] fill-[#d1b88a]" />
            <span className="text-xs font-sans font-bold text-[#d1b88a] uppercase tracking-widest">Tactical Rankings</span>
          </div>
          <h1 className="text-5xl font-display font-bold text-white uppercase tracking-tighter">SUSPECT_WATCHLIST</h1>
          <p className="typewriter-text text-[#888] text-sm max-w-xl">
            // Active investigations and priority targets. Culpability determined by cumulative evidence and criminal activity.
          </p>
        </div>

        <div className="w-full md:w-80 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-sans font-bold text-[#6a8b9f] uppercase tracking-widest px-1">
            <div className="flex items-center gap-2">
               FILTER_BY_TEAM
            </div>
            <span>SEC: 8XAA</span>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 h-12 bg-black/50 border border-[#333] text-[#d1b88a] font-display focus:border-[#d1b88a] focus:outline-none placeholder-[#444]"
              placeholder="SEARCH_TEAM_ID..."
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
        
        {/* Suspect Cards Column */}
        <div className="lg:col-span-2 space-y-6 relative">
          <div className="absolute -top-4 -left-6 w-32 h-10 paper-card -rotate-3 z-10 flex items-center justify-center">
            <span className="font-display font-bold text-sm tracking-widest text-black">Criminal Profile</span>
            <div className="pushpin -top-2 right-2" />
          </div>
          <div className="absolute top-0 bottom-0 left-8 w-1 bg-[#222] z-0 opacity-20" /> {/* String connecting pins */}

          <div className="space-y-6 pt-4 z-10 relative">
            <AnimatePresence>
              {filteredScores.map((entry, index) => (
                <motion.div
                  key={entry.name}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-center"
                >
                  <div className="w-12 text-center font-display font-bold text-2xl text-[#8b0000] -rotate-6 mr-4 opacity-80 z-20">
                    {index < 5 ? `0${index + 1}` : index + 1}
                  </div>
                  <div className="paper-card flex-1 p-5 flex justify-between items-center z-10">
                    <div className="pushpin -left-2 top-1/2 -translate-y-1/2" />
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-[#c4b9a1] border-2 border-white shadow flex flex-col items-center justify-center -rotate-2">
                        <User className="w-10 h-10 text-black opacity-50" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-sans font-bold text-[#8b0000] uppercase tracking-widest mb-1">Alias</span>
                        <h3 className="font-display text-2xl uppercase font-bold text-black leading-none mb-2">
                          {entry.name.replace(' ', '_')}
                        </h3>
                        <div className="flex items-center gap-2">
                           <span className="stamp !text-[9px] !border-[1.5px] !border-black !text-black flex-none">
                             {getRankTitle(entry.score).toUpperCase()}
                           </span>
                           <span className="stamp !text-[9px] !border-[1.5px] !border-black !text-black flex-none">
                             SECTOR_VERIFIED
                           </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center bg-[#fdfaf1] border border-[rgba(0,0,0,0.1)] p-4 shadow-inner mr-4">
                      <div className="text-[9px] font-sans font-bold text-gray-500 uppercase tracking-widest mb-2">CULPABILITY LEVEL</div>
                      <AnimatedScore value={entry.score} className="font-display font-bold text-4xl text-black block" />
                      <div className="text-[10px] font-sans text-gray-600 mt-2">evidence point(s)</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Analog Equipment Column */}
        <div className="space-y-8">
           <div className="crt-enclosure bg-[#bbb] p-8 h-[600px] flex flex-col justify-between items-center sticky top-28 shadow-2xl relative border-t-[8px] border-b-[16px] border-l-[12px] border-r-[12px] border-[#3a3a3a]">
             {/* Textural overlay for the metal chassis */}
             <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none" />
             
             {/* Meter 1: Field Density */}
             <div className="w-full aspect-square bg-[#050505] rounded shadow-[inset_0_0_20px_#000] flex flex-col relative overflow-hidden border-4 border-[#222]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2a2d2a,#000)]" />
                <div className="relative z-10 flex flex-col h-full items-center pt-8">
                  <div className="relative w-48 h-24 overflow-hidden mb-6 border-b border-[#22c55e]/20">
                     {/* Scale markings */}
                     <svg viewBox="0 0 100 50" className="w-full h-full opacity-60">
                        <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="#22c55e" strokeWidth="1" />
                        <path d="M 10 45 L 8 47" stroke="#22c55e" strokeWidth="1" />
                        <path d="M 50 5 L 50 2" stroke="#22c55e" strokeWidth="1" />
                        <path d="M 90 45 L 92 47" stroke="#22c55e" strokeWidth="1" />
                     </svg>
                     {/* Needle */}
                     <motion.div 
                        initial={{ rotate: -70 }}
                        animate={{ rotate: -70 + Math.min(140, (scores.length / 50) * 140) }}
                        transition={{ type: "spring", stiffness: 40 }}
                        className="absolute bottom-[-4px] left-[50%] w-[2px] h-[80px] bg-red-600 origin-bottom rounded-t-full shadow-[0_0_5px_red]"
                        style={{ marginLeft: '-1px' }}
                     />
                     <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#111] border border-[#333] shadow-lg shadow-black" />
                  </div>
                  <AnimatedScore value={scores.length} className="font-display font-bold text-4xl text-[#d1b88a] drop-shadow-[0_0_8px_#d1b88a]" />
                </div>
                <div className="absolute bottom-4 left-0 w-full text-center z-10">
                   <div className="font-sans font-bold text-[10px] text-gray-400 tracking-[0.2em] uppercase">Field Density</div>
                   <div className="text-[8px] font-sans text-gray-500 tracking-widest mt-1">ACTIVE INVESTIGATOR UNITS</div>
                </div>
             </div>

             {/* Meter 2: XP Throughput */}
             <div className="w-full aspect-square bg-[#050505] rounded shadow-[inset_0_0_20px_#000] flex flex-col relative overflow-hidden border-4 border-[#222]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2a2d2a,#000)]" />
                <div className="relative z-10 flex flex-col h-full items-center pt-8">
                  <div className="relative w-48 h-24 overflow-hidden mb-6 border-b border-[#22c55e]/20">
                     <svg viewBox="0 0 100 50" className="w-full h-full opacity-60">
                        <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="#22c55e" strokeWidth="1" />
                        <path d="M 10 45 L 8 47" stroke="#22c55e" strokeWidth="1" />
                        <path d="M 50 5 L 50 2" stroke="#22c55e" strokeWidth="1" />
                        <path d="M 90 45 L 92 47" stroke="#22c55e" strokeWidth="1" />
                     </svg>
                     <motion.div 
                        initial={{ rotate: -70 }}
                        animate={{ rotate: -70 + Math.min(140, (avgScore / 1000) * 140) }}
                        transition={{ type: "spring", stiffness: 40 }}
                        className="absolute bottom-[-4px] left-[50%] w-[2px] h-[80px] bg-red-600 origin-bottom rounded-t-full shadow-[0_0_5px_red]"
                        style={{ marginLeft: '-1px' }}
                     />
                     <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#111] border border-[#333] shadow-lg shadow-black" />
                  </div>
                  <AnimatedScore value={avgScore} className="font-display font-bold text-4xl text-[#d1b88a] drop-shadow-[0_0_8px_#d1b88a]" />
                </div>
                <div className="absolute bottom-4 left-0 w-full text-center z-10">
                   <div className="font-sans font-bold text-[10px] text-gray-400 tracking-[0.2em] uppercase">XP Throughput</div>
                   <div className="text-[8px] font-sans text-gray-500 tracking-widest mt-1">AVERAGE PAYLOAD PER UNIT</div>
                </div>
             </div>
             
             {/* Fake analog switches / vent */}
             <div className="w-full flex justify-between px-4 mt-6">
                <div className="w-8 h-8 rounded-full bg-[#111] shadow-[inset_2px_2px_5px_#000]" />
                <div className="flex gap-2">
                   <div className="w-2 h-12 bg-black rounded" />
                   <div className="w-2 h-12 bg-black rounded" />
                   <div className="w-2 h-12 bg-black rounded" />
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ChevronRight, Clock, Activity, FileSearch, Database, Zap, Cpu, Terminal } from 'lucide-react';
import { motion } from 'motion/react';
import { Case } from '../types';
import { useSound } from '../hooks/useSound';

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const { playSound } = useSound();

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('/api/cases', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.status === 403 || response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('team');
          window.location.href = '/login';
          return;
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setCases(data);
        } else {
          console.error('API Error:', data.error || 'Unknown error');
          setCases([]);
        }
      } catch (err) {
        console.error('Failed to fetch cases');
        setCases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Database className="w-12 h-12 text-cyber-green animate-pulse" />
        <div className="font-display text-cyber-green tracking-[0.3em] flicker-anim uppercase">Syncing_Active_Cases...</div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Tactical Briefing Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="cyber-panel border-cyber-green/30 p-10 relative overflow-hidden gradient-border"
      >
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <ShieldAlert className="w-40 h-40 text-cyber-green animate-float" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-cyber-amber fill-cyber-amber" />
            <span className="text-xs font-display text-cyber-amber uppercase tracking-[0.4em]">Tactical Briefing</span>
          </div>
          <h2 className="text-4xl font-display font-bold text-white mb-4 uppercase tracking-tight glitch-text">Operation: <span className="text-cyber-green underline decoration-cyber-green/30 underline-offset-8 text-shadow-green">Digital_Ghost</span></h2>
          <p className="text-gray-400 max-w-2xl font-mono text-sm mb-10 leading-relaxed border-l-2 border-cyber-green/20 pl-6">
            Cyber Command has detected multiple intrusion vectors. Your objective is to neutralize the threat by analyzing raw telemetry and decoding the adversary's playbook.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
            {[
              { label: 'Analyze', desc: 'Sift through raw case strings', icon: <Terminal className="w-4 h-4" /> },
              { label: 'Solve', desc: 'Decode puzzles to reveal intel', icon: <Cpu className="w-4 h-4" /> },
              { label: 'Identify', desc: 'Pinpoint the primary threat actor', icon: <Activity className="w-4 h-4" /> },
              { label: 'Submit', desc: 'Secure the system and file report', icon: <Zap className="w-4 h-4" /> }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-black/40 border border-cyber-line p-5 relative group hover:border-cyber-green/50 transition-all corner-brackets"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-cyber-green/70">{step.icon}</div>
                  <div className="text-[10px] font-display text-cyber-green uppercase tracking-widest">Protocol 0{i + 1}</div>
                </div>
                <div className="text-white font-display text-sm uppercase mb-1">{step.label}</div>
                <div className="text-gray-500 text-[10px] font-mono leading-tight">{step.desc}</div>
                <div className="absolute top-2 right-2 w-1 h-1 bg-cyber-green/30 group-hover:bg-cyber-green transition-all" />
                {/* Progress indicator */}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full bg-gradient-to-r from-cyber-green/50 to-cyber-blue/50 transition-all duration-700" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Case Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cases.map((c, index) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.12, duration: 0.45 }}
          >
            <Link to={`/case/${c.id}`} onClick={() => playSound('click')} className="block group h-full">
              <div className="cyber-panel h-full hover:neon-border-green transition-all duration-500 flex flex-col group-hover:-translate-y-2 corner-brackets relative overflow-hidden">
                {/* Decorative top gradient bar */}
                <div className={`h-[2px] w-full ${c.difficulty === 'Easy' ? 'bg-gradient-to-r from-transparent via-cyber-green to-transparent' :
                    c.difficulty === 'Intermediate' ? 'bg-gradient-to-r from-transparent via-cyber-amber to-transparent' :
                      'bg-gradient-to-r from-transparent via-cyber-red to-transparent'
                  } opacity-40 group-hover:opacity-100 transition-opacity`} />

                <div className="bg-black/60 px-5 py-3 border-b border-cyber-line flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyber-green rounded-full shadow-[0_0_8px_var(--color-cyber-green)]" />
                    <span className="text-[10px] font-display text-white uppercase tracking-widest">CASE_NODE_{c.id.toString().padStart(3, '0')}</span>
                  </div>
                  <div className={`px-2 py-0.5 border text-[9px] font-display font-bold uppercase ${c.difficulty === 'Easy' ? 'border-cyber-green/30 text-cyber-green bg-cyber-green/5' :
                      c.difficulty === 'Intermediate' ? 'border-cyber-amber/30 text-cyber-amber bg-cyber-amber/5' :
                        'border-cyber-red/30 text-cyber-red bg-cyber-red/5'
                    }`}>
                    {c.difficulty}
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white group-hover:text-cyber-green transition-colors mb-4 uppercase tracking-tight">
                      {c.title.replace(' ', '_')}
                    </h3>
                    <p className="text-gray-500 text-xs font-mono line-clamp-4 mb-8 leading-relaxed italic">
                      // {c.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-cyber-line flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-display text-gray-600 uppercase mb-0.5">Vector</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-display text-cyber-blue">
                          <Activity className="w-3 h-3" />
                          STABLE
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-display text-gray-600 uppercase mb-0.5">Payload</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-display text-cyber-amber tracking-tighter tabular-nums text-shadow-amber">
                          800_PTS
                        </div>
                      </div>
                    </div>
                    <div className="p-2 border border-cyber-green/0 group-hover:border-cyber-green/30 group-hover:bg-cyber-green/5 transition-all rounded-sm">
                      <ChevronRight className="w-6 h-6 text-cyber-green group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Decorative Corner Elements */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyber-green/0 group-hover:border-cyber-green transition-all" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyber-green/0 group-hover:border-cyber-green transition-all" />
              </div>
            </Link>
          </motion.div>
        ))}

        {/* System Expansion Pod */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: cases.length * 0.12 + 0.2 }}
          className="cyber-panel border-dashed border-cyber-line p-8 flex flex-col items-center justify-center text-center group cursor-not-allowed grayscale"
        >
          <div className="p-4 border border-cyber-line mb-6">
            <FileSearch className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-display text-gray-600 uppercase tracking-widest">Awaiting_Sync</h3>
          <p className="text-[9px] font-mono text-gray-700 mt-2 uppercase tracking-[0.2em] animate-pulse">Scanning Secure Channels...</p>
        </motion.div>
      </div>
    </div>
  );
}

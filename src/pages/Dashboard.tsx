import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ChevronRight, Clock, Activity, FileSearch } from 'lucide-react';
import { motion } from 'motion/react';
import { Case } from '../types';

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('/api/cases', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setCases(data);
      } catch (err) {
        console.error('Failed to fetch cases');
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse font-mono text-terminal-green">LOADING_CASES...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="terminal-card bg-terminal-green/5 border-terminal-green/30 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldAlert className="w-32 h-32 text-terminal-green" />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-mono font-bold text-white mb-2 uppercase tracking-tight">Investigation Dashboard</h2>
          <p className="text-gray-400 max-w-2xl font-mono text-sm mb-6">
            Welcome to the Digital Crime Lab. Select an active case to begin your investigation. 
            Analyze evidence, solve puzzles, and identify the attacker to earn points.
          </p>
          
          <div className="bg-black/40 border border-terminal-line p-4 rounded-lg max-w-3xl">
            <h3 className="text-sm font-mono font-bold text-terminal-green uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Standard Operating Procedure (How to Play)
            </h3>
            <ul className="text-xs font-mono text-gray-400 space-y-2 list-disc list-inside">
              <li><strong className="text-gray-300">Analyze Evidence:</strong> Open case files to view raw data (HTML, CSS, Logs, Code, Chat).</li>
              <li><strong className="text-gray-300">Solve Puzzles:</strong> Use the evidence to answer specific questions. Correct answers unlock more evidence.</li>
              <li><strong className="text-gray-300">Use Hints Wisely:</strong> Stuck? Request a hint, but it will cost you 50% of the puzzle's points.</li>
              <li><strong className="text-gray-300">Identify the Attacker:</strong> Once you have enough clues, submit your final report to close the case.</li>
              <li><strong className="text-gray-300">First Blood:</strong> Be the first team to solve a puzzle to earn bonus points!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Case List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((c, index) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={`/case/${c.id}`} className="block group">
              <div className="terminal-card h-full hover:border-terminal-green transition-all duration-300 group-hover:shadow-lg group-hover:shadow-terminal-green/5">
                <div className="terminal-header">
                  <span className="text-[10px] font-mono font-bold text-terminal-green uppercase tracking-widest">Case #{c.id.toString().padStart(3, '0')}</span>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    c.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500' :
                    c.difficulty === 'Intermediate' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {c.difficulty}
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-mono font-bold text-white group-hover:text-terminal-green transition-colors uppercase tracking-tighter">
                    {c.title}
                  </h3>
                  <p className="text-gray-500 text-sm font-mono line-clamp-3">
                    {c.description}
                  </p>
                  
                  <div className="pt-4 border-t border-terminal-line flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500">
                        <Activity className="w-3 h-3" />
                        ACTIVE
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500">
                        <Clock className="w-3 h-3" />
                        24H REMAINING
                      </div>
                    </div>
                    <div data-tooltip="Open Case File">
                      <ChevronRight className="w-5 h-5 text-terminal-green group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {/* Placeholder for more cases */}
        <div className="terminal-card border-dashed border-terminal-line/50 p-6 flex flex-col items-center justify-center text-center opacity-50 grayscale">
          <FileSearch className="w-12 h-12 text-gray-600 mb-4" />
          <h3 className="text-lg font-mono font-bold text-gray-600 uppercase tracking-tighter">New Case Pending</h3>
          <p className="text-gray-700 text-xs font-mono mt-2 uppercase tracking-widest">Awaiting System Dispatch</p>
        </div>
      </div>
    </div>
  );
}

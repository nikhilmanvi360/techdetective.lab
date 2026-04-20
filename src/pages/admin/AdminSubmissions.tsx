import { useState, useEffect } from 'react';
import { FileText, Search, CheckCircle, XCircle, Terminal, Activity, AlertCircle, Database } from 'lucide-react';
import { Submission } from '../../types';
import { useSound } from '../../hooks/useSound';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const { playSound } = useSound();

  useEffect(() => {
    fetch('/api/admin/submissions', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSubmissions(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredSubmissions = submissions.filter(s =>
    s.team_name?.toLowerCase().includes(filter.toLowerCase()) ||
    s.case_title?.toLowerCase().includes(filter.toLowerCase()) ||
    s.attacker_name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="text-cyber-green font-display">Parsing Telemetry...</div>;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-cyber-line pb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-cyber-green" />
            <h2 className="text-sm font-display font-bold text-white uppercase tracking-[0.3em]">Field Reports</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
            <input
              type="text"
              placeholder="SEARCH_LOGS..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-64 pl-9 py-2 bg-black border border-cyber-line text-xs font-mono text-white focus:border-cyber-green"
            />
          </div>
        </div>

        <div className="border border-cyber-green/20 bg-black/60 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left font-display text-xs">
            <thead className="bg-cyber-green/5 border-b border-cyber-line sticky top-0">
              <tr>
                <th className="p-4 text-gray-500">Unit / Case</th>
                <th className="p-4 text-gray-500">Suspect</th>
                <th className="p-4 text-gray-500">Status</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-line/20">
              {filteredSubmissions.map(s => (
                <tr key={s.id} className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedSubmission?.id === s.id ? 'bg-cyber-green/10' : ''}`} onClick={() => setSelectedSubmission(s)}>
                  <td className="p-4">
                    <div className="text-white font-bold">{s.team_name}</div>
                    <div className="text-gray-500 text-[9px]">{s.case_title}</div>
                  </td>
                  <td className="p-4 text-gray-400 uppercase tracking-tighter">{s.attacker_name}</td>
                  <td className="p-4">
                    {s.status === 'correct' 
                      ? <span className="text-cyber-green flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Correct</span>
                      : <span className="text-cyber-red flex items-center gap-1"><XCircle className="w-3 h-3"/> Wrong</span>}
                  </td>
                  <td className="p-4 text-right text-cyber-green text-[10px]">VIEW →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-cyber-line pb-4">
          <Terminal className="w-5 h-5 text-cyber-green" />
          <h2 className="text-sm font-display font-bold text-white uppercase tracking-[0.3em]">Telemetry Deep Dive</h2>
        </div>

        <AnimatePresence mode="wait">
          {selectedSubmission ? (
            <motion.div
              key={selectedSubmission.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-black/80 border border-cyber-green/30 p-8 relative"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Activity className="w-16 h-16 text-cyber-green" />
              </div>
              <div className="space-y-1 mb-6">
                <div className="text-[9px] font-display text-cyber-green uppercase tracking-[0.3em]">Origin: {selectedSubmission.team_name}</div>
                <h3 className="text-xl font-display font-bold text-white uppercase">{selectedSubmission.case_title}</h3>
                <div className="text-[10px] text-gray-500 font-mono">{new Date(selectedSubmission.submitted_at.replace(' ', 'T') + 'Z').toLocaleString()}</div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-display text-gray-500 uppercase tracking-widest">
                    <AlertCircle className="w-3 h-3" /> Target Identifier
                  </div>
                  <div className={`p-3 font-mono text-xs border ${selectedSubmission.status === 'correct' ? 'border-cyber-green text-cyber-green bg-cyber-green/5' : 'border-cyber-red text-cyber-red bg-cyber-red/5'}`}>
                    {selectedSubmission.attacker_name}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-display text-gray-500 uppercase tracking-widest">
                    <Database className="w-3 h-3" /> Attack Methodology Vector
                  </div>
                  <div className="p-4 font-mono text-[11px] text-white bg-black border border-cyber-line whitespace-pre-wrap">
                    {selectedSubmission.attack_method}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-display text-gray-500 uppercase tracking-widest">
                    <Activity className="w-3 h-3" /> Defensive Strategy Proposal
                  </div>
                  <div className="p-4 font-mono text-[11px] text-gray-400 bg-black border border-cyber-line whitespace-pre-wrap">
                    {selectedSubmission.prevention_measures}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="border border-dashed border-cyber-line/50 p-12 text-center text-gray-600 font-display uppercase tracking-widest text-xs h-64 flex items-center justify-center">
              Select a report from the stream to analyze payload
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

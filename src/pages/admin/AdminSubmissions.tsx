import { useState, useEffect } from 'react';
import { FileText, Search, CheckCircle, XCircle, Terminal, Activity, AlertCircle, Database, Zap, Clock, Shield } from 'lucide-react';
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
    fetch('/api/admin/submissions', { headers: { 'Authorization': `Bearer ${''}` } })
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

  if (loading) return <div className="text-[#d4a017] font-mono animate-pulse uppercase tracking-[0.4em]">Intercepting Telemetry...</div>;

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex items-end justify-between border-b-4 border-[#3a2810] pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-[#d4a017]" />
            <div className="text-[10px] font-black text-[#a07830] uppercase tracking-[0.6em]">// FIELD_TELEMETRY_LOGS</div>
          </div>
          <h1 className="text-6xl font-display font-black text-[#f4e6c4] uppercase tracking-tighter">
            Evidence <span className="text-[#d4a017]">Nexus</span>
          </h1>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a07830]" />
          <input
            type="text"
            placeholder="SEARCH_LOGS..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-80 pl-12 pr-4 py-3 bg-[#140e06] border-2 border-[#3a2810] rounded-sm text-[10px] font-mono font-black text-[#f0d070] focus:border-[#d4a017]/50 tracking-widest outline-none uppercase placeholder:text-[#a07830]/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="bg-[#140e06] border-2 border-[#3a2810] rounded-sm overflow-hidden shadow-2xl relative">
             <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-0"
               style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
               
             <div className="overflow-y-auto max-h-[70vh] custom-scrollbar relative z-10">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-[#0c0803] border-b-2 border-[#3a2810] sticky top-0 z-20">
                     <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest">Unit / Case Dossier</th>
                     <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest">Suspect ID</th>
                     <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest">Verdict</th>
                     <th className="p-6 text-[10px] font-black text-[#a07830] uppercase tracking-widest text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#3a2810]/50">
                   {filteredSubmissions.map(s => (
                     <tr key={s.id} 
                       className={`group transition-all hover:bg-[#d4a017]/5 cursor-pointer ${selectedSubmission?.id === s.id ? 'bg-[#d4a017]/10' : ''}`} 
                       onClick={() => { playSound('click'); setSelectedSubmission(s); }}
                     >
                       <td className="p-6">
                         <div className="text-[#f4e6c4] font-black uppercase tracking-tight text-sm group-hover:text-[#f0d070] transition-colors">{s.team_name}</div>
                         <div className="text-[#a07830]/60 text-[9px] font-black uppercase tracking-widest mt-1 italic">{s.case_title}</div>
                       </td>
                       <td className="p-6 text-[#a07830] font-mono text-[11px] font-black tracking-[0.2em] uppercase">{s.attacker_name}</td>
                       <td className="p-6">
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${s.status === 'correct' ? 'bg-[#d4a017] shadow-[0_0_8px_rgba(212,160,23,0.3)]' : 'bg-red-800'}`} />
                           <span className={`text-[10px] font-black uppercase tracking-widest ${s.status === 'correct' ? 'text-[#d4a017]' : 'text-red-800'}`}>
                             {s.status === 'correct' ? 'VERIFIED' : 'REJECTED'}
                           </span>
                         </div>
                       </td>
                       <td className="p-6 text-right">
                          <div className="text-[10px] font-black text-[#d4a017] group-hover:translate-x-1 transition-transform">DECRYPT →</div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             
             <div className="px-6 py-4 bg-[#0c0803] border-t-2 border-[#3a2810] text-[8px] font-black text-[#a07830]/40 uppercase tracking-[0.3em] font-mono">
                Stream Integrity: Active // {filteredSubmissions.length} Packets Logged
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedSubmission ? (
              <motion.div
                key={selectedSubmission.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-[#140e06] border-2 border-[#3a2810] p-10 relative shadow-2xl overflow-hidden"
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-10 text-[#d4a017] opacity-[0.03] pointer-events-none transform rotate-12 scale-150">
                  <Terminal className="w-32 h-32" />
                </div>
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-[#d4a017]/10 to-transparent z-0" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <div className="space-y-1">
                        <div className="text-[10px] font-black text-[#d4a017] uppercase tracking-[0.4em] flex items-center gap-2">
                           <div className="w-1 h-1 bg-[#d4a017]" /> ORIGIN: {selectedSubmission.team_name}
                        </div>
                        <h3 className="text-3xl font-display font-black text-[#f4e6c4] uppercase tracking-tight">{selectedSubmission.case_title}</h3>
                        <div className="text-[9px] text-[#a07830]/60 font-mono font-black uppercase tracking-[0.2em] flex items-center gap-2">
                           <Clock className="w-3 h-3" /> Timestamp: {new Date(selectedSubmission.submitted_at.replace(' ', 'T') + 'Z').toLocaleString([], { hour12: false }).toUpperCase()}
                        </div>
                     </div>
                     
                     <div className={`p-4 border-4 ${selectedSubmission.status === 'correct' ? 'border-[#d4a017]/30 text-[#d4a017]' : 'border-red-900/30 text-red-900'} font-black text-xs uppercase tracking-[0.4em] rotate-12`}>
                        {selectedSubmission.status === 'correct' ? 'SECURED' : 'VOIDED'}
                     </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-[10px] font-black text-[#a07830] uppercase tracking-[0.4em] border-b border-[#3a2810] pb-2">
                        <Shield className="w-3 h-3" /> Target Intelligence
                      </div>
                      <div className={`p-4 font-mono font-black text-xs border-2 ${selectedSubmission.status === 'correct' ? 'border-[#d4a017]/40 text-[#f0d070] bg-[#d4a017]/5' : 'border-red-900/40 text-red-900 bg-red-900/5'} tracking-widest`}>
                        {selectedSubmission.attacker_name}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-[10px] font-black text-[#a07830] uppercase tracking-[0.4em] border-b border-[#3a2810] pb-2">
                        <Database className="w-3 h-3" /> Methodology Vector
                      </div>
                      <div className="p-6 font-mono text-[11px] text-[#f4e6c4] bg-black/40 border-2 border-[#3a2810] whitespace-pre-wrap leading-relaxed shadow-inner">
                        {selectedSubmission.attack_method}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-[10px] font-black text-[#a07830] uppercase tracking-[0.4em] border-b border-[#3a2810] pb-2">
                        <Activity className="w-3 h-3" /> Countermeasure Proposal
                      </div>
                      <div className="p-6 font-mono text-[11px] text-[#a07830] bg-black/40 border-2 border-[#3a2810] whitespace-pre-wrap leading-relaxed italic">
                        {selectedSubmission.prevention_measures}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Brackets */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#d4a017]/20" />
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#d4a017]/20" />
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#d4a017]/20" />
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#d4a017]/20" />
              </motion.div>
            ) : (
              <div className="bg-[#140e06]/50 border-4 border-dashed border-[#3a2810] p-20 text-center h-[500px] flex flex-col items-center justify-center space-y-4">
                <div className="p-6 rounded-full bg-[#140e06] border-2 border-[#3a2810] opacity-20">
                   <Target className="w-12 h-12 text-[#a07830]" />
                </div>
                <div className="text-[11px] font-black text-[#a07830]/40 uppercase tracking-[0.6em] max-w-[200px]">
                  Select a field report from the left column to analyze telemetry payload
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Target({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  );
}

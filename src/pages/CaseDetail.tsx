import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText, Code, Mail, MessageSquare, Terminal,
  ChevronRight, CheckCircle2, AlertCircle, HelpCircle,
  Send, ShieldAlert, History, Lock as LockIcon, Activity, Zap, Cpu, User,
  ChevronLeft, Download, Copy, Check, Link as LinkIcon, Database, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Case, Evidence, Puzzle, CaseTeamState } from '../types';
import { useSound } from '../hooks/useSound';

function HintCooldown({ usedAt, onComplete }: { usedAt: string, onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTime = () => {
      const usedTime = new Date(usedAt.replace(' ', 'T') + 'Z').getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, (usedTime + 5 * 60 * 1000) - now);
      return Math.floor(diff / 1000);
    };
    setTimeLeft(calculateTime());
    const timer = setInterval(() => {
      const remaining = calculateTime();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onComplete();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [usedAt, onComplete]);

  if (timeLeft <= 0) return null;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return (
    <div className="p-4 border border-[rgba(139,0,0,0.2)] bg-[rgba(139,0,0,0.05)] mt-2">
      <p className="text-xs font-sans font-bold text-[#8b0000] uppercase tracking-widest mb-1">Processing Decryption...</p>
      <p className="typewriter-text text-[#8b0000] font-bold text-lg">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </p>
    </div>
  );
}

export default function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState<Case & { evidence: Evidence[], puzzles: Puzzle[], hintsUsedInCase?: number, maxHints?: number } | null>(null);
  const team = JSON.parse(localStorage.getItem('team') || '{}');
  const [loading, setLoading] = useState(true);
  const [puzzleAnswers, setPuzzleAnswers] = useState<Record<number, string>>({});
  const [puzzleFeedback, setPuzzleFeedback] = useState<Record<number, { success: boolean, message: string, firstBloodBonus?: number, points?: number }>>({});
  const [solvingPuzzle, setSolvingPuzzle] = useState<Record<number, boolean>>({});
  const [dynamicState, setDynamicState] = useState<CaseTeamState | null>(null);
  const [engineMessages, setEngineMessages] = useState<string[]>([]);
  const { playSound } = useSound();

  const [submission, setSubmission] = useState({ attackerName: '', attackMethod: '', preventionMeasures: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ success: boolean, message: string, isCorrect?: boolean, pointsAwarded?: number, firstBloodBonus?: number, badgesEarned?: string[] } | null>(null);

  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem(`tech_detective_answers_${id}`);
      if (saved) {
        try { setPuzzleAnswers(JSON.parse(saved)); } catch (e) { }
      } else setPuzzleAnswers({});
    }
  }, [id]);

  useEffect(() => {
    if (id) localStorage.setItem(`tech_detective_answers_${id}`, JSON.stringify(puzzleAnswers));
  }, [id, puzzleAnswers]);

  useEffect(() => { fetchCase(); }, [id]);

  const fetchCase = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const [caseRes, stateRes] = await Promise.all([
        fetch(`/api/cases/${id}`, { headers }),
        fetch(`/api/cases/${id}/state`, { headers })
      ]);
      const data = await caseRes.json();
      if (data && data.id && Array.isArray(data.evidence) && Array.isArray(data.puzzles)) {
        setCaseData(data);
      } else {
        setCaseData(null);
      }
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        setDynamicState(stateData);
      }
    } catch (err) {
      console.error('Failed to fetch case');
    } finally {
      setLoading(false);
    }
  };

  const handleSolvePuzzle = async (puzzleId: number) => {
    const answer = puzzleAnswers[puzzleId];
    if (!answer || solvingPuzzle[puzzleId]) return;
    playSound('click');
    setSolvingPuzzle(prev => ({ ...prev, [puzzleId]: true }));

    try {
      const response = await fetch(`/api/puzzles/${puzzleId}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ answer }),
      });
      const data = await response.json();
      setPuzzleFeedback(prev => ({ ...prev, [puzzleId]: data }));
      if (data.engineMessages && data.engineMessages.length > 0) setEngineMessages(prev => [...data.engineMessages, ...prev].slice(0, 10));
      if (data.dynamicState) setDynamicState(data.dynamicState);

      if (data.success) {
        playSound('success');
        setPuzzleAnswers(prev => { const next = { ...prev }; delete next[puzzleId]; return next; });
        await fetchCase();
      } else playSound('error');
    } catch (err) {
      playSound('error');
      setPuzzleFeedback(prev => ({ ...prev, [puzzleId]: { success: false, message: 'Link Error' } }));
    } finally {
      setSolvingPuzzle(prev => ({ ...prev, [puzzleId]: false }));
    }
  };

  const handleRequestHint = async (puzzleId: number) => {
    if (!window.confirm('WARNING: Hint decryption will deduct 50% points. Proceed?')) return;
    playSound('click');
    try {
      const response = await fetch(`/api/puzzles/${puzzleId}/hint`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) { playSound('ping'); fetchCase(); }
      else playSound('error');
    } catch (err) {
      playSound('error');
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    setSubmitting(true);
    setSubmitFeedback(null);
    try {
      const response = await fetch(`/api/cases/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(submission),
      });
      const data = await response.json();
      setSubmitFeedback(data);
      if (data.isCorrect) { playSound('success'); await fetchCase(); }
      else playSound('error');
    } catch (err) {
      playSound('error');
      setSubmitFeedback({ success: false, message: 'Link Error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Database className="w-12 h-12 text-[#d1b88a] animate-pulse" />
      <div className="typewriter-text text-[#d1b88a] uppercase tracking-widest text-center">
        Retrieving Dossier...
      </div>
    </div>
  );

  if (!caseData || !Array.isArray(caseData.puzzles)) return <div className="text-[#8b0000] font-display tracking-widest text-center mt-20 text-xl font-bold uppercase">MISSING CASE FILE</div>;

  const solvedCount = (caseData.puzzles || []).filter(p => p.solved).length;
  const totalCount = (caseData.puzzles || []).length;

  return (
    <div className="space-y-16 max-w-5xl mx-auto pb-20">
      
      <Link to="/" onClick={() => playSound('click')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 w-fit px-2 py-1 bg-black text-[10px] font-sans font-bold tracking-widest uppercase">
        <ChevronLeft className="w-4 h-4" /> REturn_to_board
      </Link>

      {/* ===== DOSSIER HEADER ===== */}
      <div className="folder p-12 relative w-full mb-12 transform rotate-1">
         <div className="folder-tab">
           <span className="font-sans font-bold text-xs uppercase tracking-widest text-[rgba(0,0,0,0.6)]">CASE_FILE_{caseData.id}</span>
         </div>
         <div className="paper-clip" />
         
         <div className="border-b-2 border-black pb-8 mb-8 flex flex-col md:flex-row justify-between gap-8 md:items-end">
            <div>
               <div className="flex items-center gap-4 mb-4">
                 <span className="stamp !p-1 !text-[10px] !border-black !text-black flex-none">LEVEL: {caseData.difficulty}</span>
                 <span className="font-display text-sm tracking-widest text-[#8b0000] font-bold">OPEN INVESTIGATION</span>
               </div>
               <h1 className="text-5xl font-display font-bold text-black uppercase tracking-tighter leading-none mb-4">
                 {caseData.title.replace(' ', '_')}
               </h1>
               <div className="typewriter-text text-gray-700 text-sm max-w-2xl leading-relaxed">
                 {caseData.description}
               </div>
            </div>
            
            <div className="flex flex-col items-end gap-4 shrink-0 bg-[#fdfbf2] p-4 border border-[rgba(0,0,0,0.1)] shadow-inner">
               <div className="text-right">
                  <div className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest mb-1">Tasks Completed</div>
                  <div className="font-display font-bold text-3xl text-black tabular-nums">{solvedCount} <span className="text-lg text-gray-400">/ {totalCount}</span></div>
               </div>
               <div className="w-full h-1 bg-gray-300">
                  <div className="h-full bg-green-600 transition-all" style={{ width: `${totalCount > 0 ? (solvedCount/totalCount)*100 : 0}%` }} />
               </div>
               <div className="text-right w-full pt-2 border-t border-[rgba(0,0,0,0.1)] mt-2">
                  <div className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest mb-1">Hints Allocated</div>
                  <div className="font-display font-bold text-sm text-[#8b0000] tabular-nums">{caseData.hintsUsedInCase ?? 0} <span className="text-black">/ {caseData.maxHints ?? '∞'}</span></div>
               </div>
            </div>
         </div>
      </div>

      {/* ===== RECOVERED EVIDENCE ===== */}
      <section className="space-y-6">
         <div className="flex items-center gap-3 border-b-2 border-gray-600 pb-2">
            <History className="w-6 h-6 text-[#d1b88a]" />
            <h2 className="text-xl font-display font-bold text-white uppercase tracking-[0.2em]">Attached Evidence Log</h2>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {(caseData.evidence || []).map((ev, idx) => (
            <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="relative h-full">
              {ev.is_locked ? (
                 <div className="h-full bg-[#e8e4d9] border border-gray-400 p-6 opacity-60 grayscale cursor-not-allowed flex flex-col justify-center shadow-md relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10"><LockIcon className="w-24 h-24" /></div>
                    <div className="relative z-10 flex items-start gap-4">
                       <LockIcon className="w-6 h-6 text-gray-600 shrink-0" />
                       <div>
                         <h3 className="text-sm font-display font-bold text-gray-800 uppercase tracking-widest">SEALED EVIDENCE</h3>
                         <div className="typewriter-text text-[#8b0000] text-xs mt-2">Requires: Task 0x{ev.required_puzzle_id}</div>
                       </div>
                    </div>
                 </div>
              ) : (
                <Link to={`/evidence/${ev.id}`} onClick={() => playSound('click')} className="block h-full transform hover:-translate-y-1 hover:rotate-1 transition-all">
                  <div className="h-full paper-card p-6 flex items-start gap-4 shadow-lg group">
                    <div className="pushpin -top-2 left-4 z-20" />
                    <div className="p-2 border-2 border-black/20 bg-white/50 shadow-sm shrink-0 mt-2">
                      {ev.type === 'chat' && <MessageSquare className="w-6 h-6 text-gray-700" />}
                      {ev.type === 'html' && <FileText className="w-6 h-6 text-gray-700" />}
                      {ev.type === 'log' && <Terminal className="w-6 h-6 text-gray-700" />}
                      {ev.type === 'email' && <Mail className="w-6 h-6 text-gray-700" />}
                      {ev.type === 'code' && <Code className="w-6 h-6 text-gray-700" />}
                    </div>
                    <div className="flex-1 mt-2">
                      <h3 className="text-[14px] leading-tight font-display font-bold text-black uppercase mb-2 group-hover:text-blue-900">{ev.title}</h3>
                      <div className="typewriter-text text-gray-600 text-[10px] uppercase">
                         Type: {ev.type} <br/> 
                         Status: Extracted
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
         </div>
      </section>

      {/* ===== INVESTIGATIVE TASKS ===== */}
      <section className="space-y-6 pt-10">
         <div className="flex items-center gap-3 border-b-2 border-gray-600 pb-2">
            <CheckCircle2 className="w-6 h-6 text-[#22c55e]" />
            <h2 className="text-xl font-display font-bold text-white uppercase tracking-[0.2em]">Investigative Tasks</h2>
         </div>

         <div className="grid grid-cols-1 gap-8 pt-4">
           {(caseData.puzzles || []).map((p, idx) => (
              <div key={p.id} className={`paper-card p-0 relative transition-all duration-500 border-l-4 ${p.solved ? 'border-green-600 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-[#8b0000]'}`}>
                 <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between border-b-2 border-[rgba(0,0,0,0.1)] pb-4 mb-6">
                       <div className="flex items-center gap-3">
                         <div className={`p-1.5 border-[2px] ${p.solved ? 'border-green-600 text-green-700' : 'border-gray-500 text-gray-500'}`}>
                           {p.solved ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                         </div>
                         <span className="font-display font-bold text-black text-lg tracking-widest uppercase">TASK_0x{p.id.toString()}</span>
                       </div>
                       <div className="text-right">
                         <span className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest block mb-0.5">Bounty</span>
                         <span className="font-display font-bold text-xl text-black">{p.hint_used ? Math.floor(p.points * 0.5) : p.points} XP</span>
                       </div>
                    </div>

                    <p className="typewriter-text text-sm text-gray-800 mb-8 leading-relaxed whitespace-pre-wrap pl-4 border-l border-dashed border-gray-400">
                      {p.question}
                    </p>

                    {!p.solved ? (
                      <div className="space-y-6">
                        {/* Lockout Timer */}
                        {dynamicState?.lockouts?.[p.id] && new Date(dynamicState.lockouts[p.id]) > new Date() && (
                          <div className="p-4 bg-[rgba(139,0,0,0.05)] border border-[rgba(139,0,0,0.2)] flex items-center gap-3">
                            <Timer className="w-5 h-5 text-[#8b0000] animate-pulse" />
                            <div className="typewriter-text text-[#8b0000] text-sm">
                              FIREWALL ACTIVE. TIME PENALTY UNTIL {new Date(dynamicState!.lockouts[p.id]).toLocaleTimeString()}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4">
                           <input
                             type="text"
                             disabled={solvingPuzzle[p.id]}
                             value={puzzleAnswers[p.id] || ''}
                             onChange={(e) => setPuzzleAnswers(prev => ({ ...prev, [p.id]: e.target.value }))}
                             className="flex-1 bg-transparent border-b-2 border-black font-display text-lg text-black focus:outline-none focus:border-[#8b0000] p-2 typewriter-text placeholder-gray-400"
                             placeholder="INPUT ANSWER..."
                             onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSolvePuzzle(p.id); } }}
                           />
                           <button 
                             type="button"
                             disabled={solvingPuzzle[p.id]}
                             onClick={() => handleSolvePuzzle(p.id)}
                             className="border-[2px] border-black text-black font-display font-bold uppercase tracking-widest px-8 py-3 hover:bg-black hover:text-white transition-colors"
                           >
                             {solvingPuzzle[p.id] ? 'VERIFYING...' : 'SUBMIT'}
                           </button>
                        </div>
                        
                        {puzzleFeedback[p.id] && !puzzleFeedback[p.id].success && (
                           <div className="mt-4 stamp !text-[10px] !p-1 inline-block">REJECTED: {puzzleFeedback[p.id].message}</div>
                        )}

                        {/* Hints */}
                        {p.hint_used ? (
                           <div className="mt-6 p-4 border border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.03)]">
                             <div className="text-[10px] font-sans font-bold text-[#8b0000] uppercase tracking-widest mb-1">DECRYPTED INTEL</div>
                             <div className="typewriter-text text-sm text-black">
                               {p.hint || (p.hint_used_at && <HintCooldown usedAt={p.hint_used_at} onComplete={fetchCase} />)}
                             </div>
                           </div>
                        ) : p.has_hint && (
                           <button
                             type="button"
                             onClick={() => handleRequestHint(p.id)}
                             className="mt-4 text-[10px] font-sans font-bold text-gray-500 hover:text-[#8b0000] uppercase tracking-widest underline decoration-dashed"
                           >
                             REQUEST DECRYPTION (-50% BOUNTY PNT)
                           </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 p-4 border border-green-600 bg-green-50">
                         <div className="p-2 border border-green-600"><CheckCircle2 className="w-5 h-5 text-green-700" /></div>
                         <div>
                            <span className="font-display font-bold text-green-800 text-sm tracking-widest uppercase block">VERIFIED</span>
                            <span className="font-mono text-gray-600 text-[10px] uppercase">Awarded +{p.hint_used ? Math.floor(p.points * 0.5) : p.points} XP on {p.solved_at ? new Date(p.solved_at.replace(' ', 'T') + 'Z').toLocaleString() : ''}</span>
                         </div>
                      </div>
                    )}
                 </div>
              </div>
           ))}
         </div>
      </section>

      {/* ===== CLASSIFIED SUBMISSION ===== */}
      <section className="space-y-6 pt-10">
         <div className="flex items-center gap-3 border-b-2 border-gray-600 pb-2">
            <Send className="w-6 h-6 text-[#f59e0b]" />
            <h2 className="text-xl font-display font-bold text-white uppercase tracking-[0.2em]">Final Submission Record</h2>
         </div>

         {caseData?.isCompleted ? (
           <div className="paper-card p-12 text-center transform -rotate-1">
              <div className="pushpin top-4 left-1/2 -translate-x-1/2" />
              <div className="stamp !scale-125 mb-8 mt-4 mx-auto !text-green-800 !border-green-800">CASE CLOSED</div>
              <p className="typewriter-text text-lg text-black max-w-lg mx-auto">
                Investigation concluded. The suspect has been successfully profiled. All assets have been sealed in the archives.
              </p>
           </div>
         ) : (
           <div className="paper-card p-10 border-t-8 border-[#8b0000]">
              <div className="font-display font-bold text-2xl text-black mb-2 uppercase tracking-tighter">Submit Prime Suspect Details</div>
              <p className="typewriter-text text-sm text-gray-600 mb-8 border-b pb-4 border-[rgba(0,0,0,0.1)]">
                Finalize your investigation. Provide the primary suspect identity to close the file.
              </p>
              
              <form onSubmit={handleFinalSubmit} className="space-y-8">
                 <div>
                    <label className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-widest block mb-2">Subject Name / Alias</label>
                    <input
                      type="text"
                      required
                      value={submission.attackerName}
                      onChange={(e) => setSubmission(prev => ({ ...prev, attackerName: e.target.value }))}
                      className="w-full bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.2)] p-4 font-display text-lg text-black focus:outline-none focus:border-black placeholder-gray-400"
                      placeholder="ENTER IDENTITY..."
                    />
                 </div>
                 
                 {submitFeedback && (
                    <div className={`p-4 border ${submitFeedback.isCorrect ? 'bg-green-50 border-green-600 text-green-800' : 'bg-red-50 border-red-600 text-red-800'}`}>
                       <p className="typewriter-text font-bold text-sm uppercase">{submitFeedback.isCorrect ? 'ACCEPTED.' : 'REJECTED.'}</p>
                       <p className="typewriter-text text-xs mt-1">{submitFeedback.message}</p>
                    </div>
                 )}

                 <button
                   type="submit"
                   disabled={submitting}
                   className="w-full border-[3px] border-black bg-black text-white font-display font-bold uppercase tracking-widest py-4 hover:bg-transparent hover:text-black transition-all"
                 >
                   {submitting ? 'PROCESSING...' : 'FILE REPORT'}
                 </button>
              </form>
           </div>
         )}
      </section>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, Code, Mail, MessageSquare, Terminal, 
  ChevronRight, CheckCircle2, AlertCircle, HelpCircle, 
  Send, ShieldAlert, History, Lock as LockIcon, Activity, Zap, Cpu, User,
  ChevronLeft, Download, Copy, Check, Link as LinkIcon, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Case, Evidence, Puzzle } from '../types';
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
    <div className="p-4 bg-cyber-amber/5 border border-cyber-amber/20">
      <p className="text-sm font-display text-cyber-amber uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
        <Activity className="w-4 h-4 animate-pulse" /> Decrypting_Vector...
      </p>
      <p className="text-xl font-display text-cyber-amber font-bold tabular-nums">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </p>
    </div>
  );
}

export default function CaseDetail() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState<Case & { evidence: Evidence[], puzzles: Puzzle[], hintsUsedInCase?: number, maxHints?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [puzzleAnswers, setPuzzleAnswers] = useState<Record<number, string>>({});
  const [puzzleFeedback, setPuzzleFeedback] = useState<Record<number, { success: boolean, message: string, firstBloodBonus?: number, points?: number }>>({});
  const { playSound } = useSound();
  
  const [submission, setSubmission] = useState({ attackerName: '', attackMethod: '', preventionMeasures: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ success: boolean, message: string, isCorrect?: boolean, pointsAwarded?: number, firstBloodBonus?: number, badgesEarned?: string[] } | null>(null);

  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem(`tech_detective_answers_${id}`);
      if (saved) {
        try { setPuzzleAnswers(JSON.parse(saved)); } catch (e) {}
      } else {
        setPuzzleAnswers({});
      }
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      localStorage.setItem(`tech_detective_answers_${id}`, JSON.stringify(puzzleAnswers));
    }
  }, [id, puzzleAnswers]);

  useEffect(() => {
    fetchCase();
  }, [id]);

  const fetchCase = async () => {
    try {
      const response = await fetch(`/api/cases/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setCaseData(data);
    } catch (err) {
      console.error('Failed to fetch case');
    } finally {
      setLoading(false);
    }
  };

  const handleSolvePuzzle = async (puzzleId: number) => {
    const answer = puzzleAnswers[puzzleId];
    if (!answer) return;
    playSound('click');

    try {
      const response = await fetch(`/api/puzzles/${puzzleId}/solve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ answer }),
      });
      const data = await response.json();
      setPuzzleFeedback(prev => ({ ...prev, [puzzleId]: data }));
      
      if (data.success) {
        playSound('success');
        setPuzzleAnswers(prev => {
          const next = { ...prev };
          delete next[puzzleId];
          return next;
        });
        fetchCase();
      } else {
        playSound('error');
      }
    } catch (err) {
      playSound('error');
      setPuzzleFeedback(prev => ({ ...prev, [puzzleId]: { success: false, message: 'Link Error' } }));
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
      if (data.success) {
        playSound('ping');
        fetchCase();
      } else {
        playSound('error');
      }
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submission),
      });
      const data = await response.json();
      setSubmitFeedback(data);
      if (data.isCorrect) playSound('success');
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
      <Activity className="w-12 h-12 text-cyber-green animate-pulse" />
      <div className="font-display text-cyber-green uppercase tracking-[0.4em] flicker-anim text-center text-base">
        Reconstructing_Evidence_Matrix...
      </div>
    </div>
  );

  if (!caseData) return <div className="text-cyber-red font-display tracking-widest text-center mt-20 text-xl">CRITICAL_ERROR: CASE_NODE_NOT_FOUND</div>;

  const solvedCount = caseData.puzzles.filter(p => p.solved).length;
  const totalCount = caseData.puzzles.length;

  return (
    <div className="space-y-12">
      {/* ===== CASE HERO BANNER ===== */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="cyber-panel border-cyber-green/40 p-10 relative overflow-hidden gradient-border"
      >
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Cpu className="w-40 h-40 text-cyber-green animate-float" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
          <div className="p-5 bg-cyber-green/5 border border-cyber-green/40 neon-border-green flex-shrink-0">
            <ShieldAlert className="w-10 h-10 text-cyber-green flicker-anim" />
          </div>
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-display text-cyber-green border border-cyber-green/30 px-3 py-1 uppercase tracking-widest">Case_Node_{caseData.id}</span>
              <span className={`text-sm font-display border px-3 py-1 uppercase tracking-widest ${
                caseData.difficulty === 'Easy' ? 'border-cyber-green/30 text-cyber-green' : 
                caseData.difficulty === 'Intermediate' ? 'border-cyber-amber/30 text-cyber-amber' : 
                'border-cyber-red/30 text-cyber-red'
              }`}>Level: {caseData.difficulty}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight leading-tight glitch-text">{caseData.title.replace(' ', '_')}</h1>
            <p className="text-gray-300 font-mono text-base leading-relaxed max-w-3xl border-l-2 border-cyber-green/30 pl-6">
              {caseData.description}
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex-shrink-0 flex flex-row md:flex-col gap-4 md:gap-6 md:border-l md:border-cyber-line md:pl-8">
            <div className="flex flex-col items-center">
              <span className="text-xs font-display text-gray-500 uppercase tracking-widest mb-1">Puzzles</span>
              <span className="text-2xl font-display font-bold text-white tabular-nums">{solvedCount}<span className="text-gray-600">/{totalCount}</span></span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-display text-gray-500 uppercase tracking-widest mb-1">Hints</span>
              <span className="text-2xl font-display font-bold text-cyber-amber tabular-nums">{caseData.hintsUsedInCase ?? 0}<span className="text-gray-600">/{caseData.maxHints ?? '∞'}</span></span>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-8 pt-6 border-t border-cyber-line">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-display text-gray-500 uppercase tracking-widest">Investigation Progress</span>
            <span className="text-sm font-display text-cyber-green tabular-nums">{totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0}%</span>
          </div>
          <div className="h-2 bg-cyber-line overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${totalCount > 0 ? (solvedCount / totalCount) * 100 : 0}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-violet" 
            />
          </div>
        </div>
      </motion.div>

      {/* ===== RECOVERED EVIDENCE ===== */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-cyber-line pb-4">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-cyber-blue" />
            <h2 className="text-lg font-display font-bold text-white uppercase tracking-[0.15em]">Recovered Telemetry</h2>
          </div>
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Sector_Analogue: 0x{id}FF</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {caseData.evidence.map((ev, idx) => (
            <motion.div 
              key={ev.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              {ev.is_locked ? (
                <div className="cyber-panel p-6 opacity-40 grayscale border-dashed border-cyber-line/50 cursor-not-allowed group">
                  <div className="flex items-center gap-5">
                    <div className="p-3 bg-black/40 border border-cyber-line group-hover:border-cyber-red/30 transition-colors">
                      <LockIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-display font-bold text-gray-500 uppercase tracking-widest">Locked_Vector</h3>
                      <div className="text-sm font-display text-cyber-red uppercase tracking-widest mt-1">Unlock_Required: Puzzle_{ev.required_puzzle_id}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to={`/evidence/${ev.id}`} onClick={() => playSound('click')} className="block group">
                  <div className="cyber-panel p-6 border-cyber-line hover:neon-border-blue transition-all duration-300 relative corner-brackets">
                    <div className="flex items-center gap-5">
                      <div className="p-3 bg-cyber-blue/5 border border-cyber-blue/30 group-hover:neon-border-blue transition-colors">
                        {ev.type === 'chat' && <MessageSquare className="w-6 h-6 text-cyber-blue" />}
                        {ev.type === 'html' && <FileText className="w-6 h-6 text-cyan-400" />}
                        {ev.type === 'log' && <Terminal className="w-6 h-6 text-cyber-green" />}
                        {ev.type === 'email' && <Mail className="w-6 h-6 text-indigo-400" />}
                        {ev.type === 'code' && <Code className="w-6 h-6 text-cyber-amber" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-display font-bold text-white uppercase tracking-wide group-hover:text-cyber-blue transition-colors">{ev.title.replace(' ', '_')}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-display text-cyber-blue uppercase tracking-widest">{ev.type}_Data</span>
                          <div className="w-1 h-1 rounded-full bg-cyber-line" />
                          <span className="text-xs font-mono text-gray-500">source: remote_host</span>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-cyber-blue group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== OPERATIONAL PUZZLES — FULL WIDTH ===== */}
      <section className="space-y-6 relative">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-cyber-green/5 blur-[100px] pointer-events-none" />

        <div className="flex items-center justify-between border-b border-cyber-line pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-cyber-green/30 bg-cyber-green/10">
              <Terminal className="w-6 h-6 text-cyber-green animate-pulse" />
            </div>
            <h2 className="text-xl font-display font-bold text-white uppercase tracking-[0.2em] glitch-text">Operational Puzzles</h2>
          </div>
          <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
            {/* Puzzle progress dots with tactical design */}
            <div className="hidden md:flex items-center gap-2 bg-black/40 p-2 border border-cyber-line">
              <span className="text-xs font-display text-gray-500 uppercase tracking-widest mr-2">Decryption_Status:</span>
              {caseData.puzzles.map((p) => (
                <div 
                  key={p.id} 
                  className={`w-4 h-4 border flex items-center justify-center transition-all ${
                    p.solved 
                      ? 'bg-cyber-green/20 border-cyber-green text-cyber-green shadow-[0_0_8px_var(--color-cyber-green-glow)]' 
                      : 'bg-black border-gray-700 text-gray-700'
                  }`}
                  title={`Task 0x${p.id}: ${p.solved ? 'Solved' : 'Unsolved'}`}
                >
                  {p.solved && <CheckCircle2 className="w-3 h-3" />}
                </div>
              ))}
            </div>
            {caseData.maxHints !== undefined && (
              <div className="text-sm font-display text-cyber-amber tabular-nums border border-cyber-amber/30 bg-cyber-amber/5 px-4 py-2 hover:bg-cyber-amber/10 transition-colors cursor-default">
                <span className="text-xs uppercase tracking-widest opacity-60 mr-2">Hints_Allocated:</span> 
                {caseData.hintsUsedInCase}/{caseData.maxHints}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
          {caseData.puzzles.map((p, idx) => (
            <motion.div 
              key={p.id} 
              id={`puzzle-${p.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`cyber-panel group transition-all duration-500 overflow-hidden relative ${
                p.solved 
                  ? 'border-cyber-green/50 shadow-[0_0_15px_rgba(0,255,170,0.1)]' 
                  : 'hover:border-cyber-green/40 corner-brackets hover:shadow-[0_0_20px_rgba(0,255,170,0.05)]'
              }`}
            >
              {/* Decorative side line */}
              <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-500 ${p.solved ? 'bg-cyber-green shadow-[0_0_10px_var(--color-cyber-green)]' : 'bg-cyber-line group-hover:bg-cyber-green/50'}`} />

              {/* Puzzle Header */}
              <div className={`px-6 py-4 border-b border-cyber-line flex items-center justify-between transition-colors ${
                p.solved ? 'bg-gradient-to-r from-cyber-green/10 to-transparent' : 'bg-black/60 group-hover:bg-cyber-bg'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`relative flex items-center justify-center w-8 h-8 border ${
                    p.solved ? 'border-cyber-green/50 bg-cyber-green/10' : 'border-gray-600 bg-gray-800'
                  }`}>
                    {p.solved ? (
                      <CheckCircle2 className="w-4 h-4 text-cyber-green" />
                    ) : (
                      <LockIcon className="w-4 h-4 text-gray-400 group-hover:text-cyber-green/70 transition-colors" />
                    )}
                  </div>
                  <span className={`text-base font-display uppercase tracking-widest ${p.solved ? 'text-white' : 'text-gray-300 group-hover:text-cyber-green group-hover:glitch-text transition-all'}`}>
                    TASK_UNIT_0x{p.id.toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-display text-gray-500 uppercase tracking-widest mb-1">Bounty</span>
                  <span className={`text-lg font-display font-bold tabular-nums leading-none ${p.solved ? 'text-cyber-green' : 'text-cyber-blue group-hover:text-cyan-400'}`}>
                    {p.hint_used ? Math.floor(p.points * 0.5) : p.points}_XP
                  </span>
                </div>
              </div>

              {/* Puzzle Body */}
              <div className="p-6 md:p-8 space-y-6 relative">
                {/* Watermark/Background texture */}
                <div className="absolute inset-0 bg-gradient-to-br from-black to-transparent pointer-events-none" />
                
                <div className="relative">
                  <div className="absolute -left-3 md:-left-4 top-0 bottom-0 w-px bg-gradient-to-b from-cyber-green/50 via-cyber-blue/30 to-transparent" />
                  <p className="text-base md:text-lg font-mono text-gray-200 leading-relaxed pl-4">
                    <span className="text-cyber-green opacity-50 mr-2">$&gt;</span>
                    {p.question}
                  </p>
                </div>
                
                {!p.solved ? (
                  <div className="space-y-6">
                    {/* Answer Input */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Terminal className="w-5 h-5 text-gray-500 group-focus-within/input:text-cyber-green transition-colors" />
                        </div>
                        <input 
                          type="text"
                          value={puzzleAnswers[p.id] || ''}
                          onChange={(e) => setPuzzleAnswers(prev => ({ ...prev, [p.id]: e.target.value }))}
                          className="cyber-input w-full h-14 text-base pl-12 pr-4 bg-black/50 border-cyber-line focus:neon-border-green focus:bg-black/80 transition-all font-mono"
                          placeholder="ENTER_DECRYPTION_KEY..."
                          onKeyDown={(e) => e.key === 'Enter' && handleSolvePuzzle(p.id)}
                        />
                        {/* Scanning beam effect on focus */}
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 group-focus-within/input:w-full bg-gradient-to-r from-transparent via-cyber-green to-cyber-blue transition-all duration-700 ease-in-out" />
                      </div>
                      <button 
                        onClick={() => handleSolvePuzzle(p.id)}
                        className="cyber-button w-full sm:w-auto h-14 px-8 bg-cyber-green text-black flex items-center justify-center hover:bg-white transition-all border border-cyber-green flex-shrink-0 group/btn shadow-[0_0_15px_rgba(0,255,170,0.2)]"
                      >
                        <span className="font-display uppercase tracking-widest font-bold sm:hidden mr-2">Execute</span>
                        <ChevronRight className="w-6 h-6 group-hover/btn:translate-x-1 group-hover/btn:scale-110 transition-all" />
                      </button>
                    </div>
                    
                    {/* Feedback */}
                    <AnimatePresence>
                      {puzzleFeedback[p.id] && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, scale: 0.95 }}
                          animate={{ opacity: 1, height: 'auto', scale: 1 }}
                          exit={{ opacity: 0, height: 0, scale: 0.95 }}
                          className={`font-display uppercase p-4 border overflow-hidden ${puzzleFeedback[p.id].success ? 'bg-cyber-green/10 border-cyber-green/30 text-cyber-green neon-border-green' : 'bg-cyber-red/10 border-cyber-red/30 text-cyber-red shadow-[0_0_15px_rgba(255,0,85,0.1)]'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 border ${puzzleFeedback[p.id].success ? 'border-cyber-green/40' : 'border-cyber-red/40'}`}>
                              {puzzleFeedback[p.id].success ? <CheckCircle2 className="w-6 h-6 flicker-anim" /> : <AlertCircle className="w-6 h-6 flicker-anim" />}
                            </div>
                            <div>
                               <div className="font-bold text-base tracking-[0.2em]">{puzzleFeedback[p.id].success ? 'INTEGRITY_VERIFIED' : 'LOGIC_ERROR'}</div>
                               <div className="text-sm opacity-80 mt-1 normal-case tracking-wide font-mono">{puzzleFeedback[p.id].message}</div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Hint Display */}
                    {p.hint_used && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        {p.hint ? (
                          <div className="p-6 bg-cyber-amber/5 border border-cyber-amber/30 relative corner-brackets">
                             <div className="absolute top-0 left-4 px-3 -translate-y-1/2 bg-cyber-bg text-xs font-display text-cyber-amber uppercase tracking-widest font-bold">
                               <span className="flicker-anim inline-block mr-2 text-cyber-red">⚠</span>
                               Decrypted_Hint
                             </div>
                            <p className="text-base font-mono text-cyber-amber leading-relaxed mt-2 relative z-10">
                              $&gt; {p.hint}
                            </p>
                          </div>
                        ) : (
                          p.hint_used_at && <HintCooldown usedAt={p.hint_used_at} onComplete={fetchCase} />
                        )}
                      </motion.div>
                    )}

                    {/* Hint Request Button */}
                    {!p.hint_used && p.hint && (
                      <button 
                        onClick={() => handleRequestHint(p.id)}
                        disabled={caseData.hintsUsedInCase !== undefined && caseData.maxHints !== undefined && caseData.hintsUsedInCase >= caseData.maxHints}
                        className={`text-sm font-display uppercase tracking-[0.15em] flex items-center justify-center sm:justify-start gap-3 transition-all p-4 border border-dashed hover:border-solid w-full sm:w-auto ${
                          caseData.hintsUsedInCase !== undefined && caseData.maxHints !== undefined && caseData.hintsUsedInCase >= caseData.maxHints 
                            ? 'text-gray-700 border-gray-800 cursor-not-allowed bg-black/30' 
                            : 'text-gray-400 hover:text-cyber-amber border-gray-700 hover:border-cyber-amber/50 hover:bg-cyber-amber/5'
                        }`}
                      >
                        <HelpCircle className={`w-5 h-5 ${caseData.hintsUsedInCase !== undefined && caseData.maxHints !== undefined && caseData.hintsUsedInCase >= caseData.maxHints ? '' : 'animate-pulse text-cyber-amber'}`} /> 
                        <span className="mt-0.5">
                          {caseData.hintsUsedInCase !== undefined && caseData.maxHints !== undefined && caseData.hintsUsedInCase >= caseData.maxHints 
                            ? 'Max_Hints_Reached' 
                            : 'Override_Encryption (-50% XP)'}
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col sm:flex-row items-center sm:items-start gap-4 py-6 bg-gradient-to-r from-cyber-green/10 to-transparent border border-cyber-green/20 px-8 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-10 mix-blend-overlay" />
                    <div className="p-3 bg-cyber-green/20 rounded-full shrink-0">
                      <CheckCircle2 className="w-8 h-8 text-cyber-green flicker-anim" />
                    </div>
                    <div className="text-center sm:text-left">
                      <span className="text-xl md:text-2xl font-display font-bold text-cyber-green uppercase tracking-[0.2em] block glitch-text">Module_Secured</span>
                      <span className="text-sm font-mono text-gray-400 mt-2 block bg-black/50 px-3 py-1 border border-gray-800">
                        Bounty Awarded: <span className="text-white">+{p.hint_used ? Math.floor(p.points * 0.5) : p.points} XP</span>
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== FINAL REPORT ===== */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-cyber-line pb-4">
          <Send className="w-6 h-6 text-cyber-amber" />
          <h2 className="text-lg font-display font-bold text-white uppercase tracking-[0.15em]">Consolidated Case Report</h2>
        </div>
        
        <div className="cyber-panel p-10 border-cyber-amber/20 relative gradient-border">
          <div className="absolute top-0 right-10 w-20 h-1 bg-cyber-amber/30" />
          <form onSubmit={handleFinalSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyber-amber" />
                  <label className="text-sm font-display text-cyber-amber uppercase tracking-[0.2em]">Primary_Suspect</label>
                </div>
                <input 
                  type="text"
                  required
                  value={submission.attackerName}
                  onChange={(e) => setSubmission(prev => ({ ...prev, attackerName: e.target.value }))}
                  className="cyber-input w-full text-base h-14 border-cyber-amber/20 focus:border-cyber-amber"
                  placeholder="ENTER_NAME"
                />
              </div>
              <div className="md:col-span-1" />
              
              <div className="md:col-span-2 space-y-3">
                 <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyber-amber" />
                  <label className="text-sm font-display text-cyber-amber uppercase tracking-[0.2em]">Attack_Mod_&_Evidence_Link</label>
                </div>
                <textarea 
                  required
                  rows={4}
                  value={submission.attackMethod}
                  onChange={(e) => setSubmission(prev => ({ ...prev, attackMethod: e.target.value }))}
                  className="cyber-input w-full text-base border-cyber-amber/20 focus:border-cyber-amber"
                  placeholder="Provide technical breakdown..."
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                 <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyber-green" />
                  <label className="text-sm font-display text-cyber-green uppercase tracking-[0.2em]">Recommended_Countermeasures</label>
                </div>
                <textarea 
                  required
                  rows={3}
                  value={submission.preventionMeasures}
                  onChange={(e) => setSubmission(prev => ({ ...prev, preventionMeasures: e.target.value }))}
                  className="cyber-input w-full text-base border-cyber-green/20 focus:border-cyber-green"
                  placeholder="List prevention steps..."
                />
              </div>
            </div>

            <AnimatePresence>
              {submitFeedback && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-8 border-2 ${
                    submitFeedback.isCorrect 
                      ? 'bg-cyber-green/10 text-cyber-green border-cyber-green/50 neon-border-green' 
                      : 'bg-cyber-red/10 text-cyber-red border-cyber-red/50'
                  }`}
                >
                  <div className="flex items-center gap-5 mb-4">
                    {submitFeedback.isCorrect ? <CheckCircle2 className="w-10 h-10 flicker-anim" /> : <ShieldAlert className="w-10 h-10 flicker-anim" />}
                    <h3 className="text-2xl font-display font-bold uppercase tracking-widest leading-none">
                      REPORT_{submitFeedback.isCorrect ? 'VALIDATED' : 'REJECTED_BY_COUNCIL'}
                    </h3>
                  </div>
                  <p className="text-base font-mono leading-relaxed max-w-2xl mb-6">
                    // {submitFeedback.message}
                  </p>
                  {submitFeedback.isCorrect && (
                    <div className="flex flex-wrap gap-6 pt-6 border-t border-current/20">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase font-display opacity-60">Payout</span>
                        <span className="text-2xl font-display font-bold">+{submitFeedback.pointsAwarded}_XP</span>
                      </div>
                      {submitFeedback.firstBloodBonus && submitFeedback.firstBloodBonus > 0 && (
                        <div className="flex flex-col text-cyber-red">
                          <span className="text-xs uppercase font-display opacity-60 animate-pulse">Critical_Bonus</span>
                          <span className="text-2xl font-display font-bold">FIRST_BLOOD_+{submitFeedback.firstBloodBonus}</span>
                        </div>
                      )}
                      {submitFeedback.badgesEarned?.map(badge => (
                        <div key={badge} className="flex flex-col text-cyber-amber">
                          <span className="text-xs uppercase font-display opacity-60">Commendation</span>
                          <span className="text-2xl font-display font-bold">{badge.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={submitting}
              className={`cyber-button w-full h-16 flex items-center justify-center gap-4 transition-all ${
                submitting ? 'bg-white/5 opacity-50' : 'cyber-button-blue'
              }`}
            >
              {submitting ? (
                  <div className="flex items-center gap-3 font-display tracking-[0.3em] flicker-anim text-base">
                    <Cpu className="w-6 h-6 animate-spin" /> ENCRYPTING_TRANSMISSION...
                  </div>
                ) : (
                <>
                  <span className="text-xl font-display">TRANSMIT_FINAL_INTEL</span>
                  <Send className="w-6 h-6 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

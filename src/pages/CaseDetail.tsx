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
    <div className="p-4 bg-red-900/5 border border-red-900/20">
      <p className="text-sm font-display text-red-900 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
        <Activity className="w-4 h-4 animate-pulse" /> Decrypting_Vector...
      </p>
      <p className="text-xl font-display text-red-900 font-bold tabular-nums">
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
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const [caseRes, stateRes] = await Promise.all([
        fetch(`/api/cases/${id}`, { headers }),
        fetch(`/api/cases/${id}/state`, { headers })
      ]);
      const data = await caseRes.json();
      if (data && data.id && Array.isArray(data.evidence) && Array.isArray(data.puzzles)) {
        setCaseData(data);
      } else {
        console.error('Case Detail API Error:', data.error || 'Malformed data');
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ answer }),
      });
      const data = await response.json();
      setPuzzleFeedback(prev => ({ ...prev, [puzzleId]: data }));

      if (data.engineMessages && data.engineMessages.length > 0) {
        setEngineMessages(prev => [...data.engineMessages, ...prev].slice(0, 10));
      }

      if (data.dynamicState) {
        setDynamicState(data.dynamicState);
      }

      if (data.success) {
        playSound('success');
        setPuzzleAnswers(prev => {
          const next = { ...prev };
          delete next[puzzleId];
          return next;
        });
        await fetchCase();
      } else {
        playSound('error');
      }
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
      if (data.isCorrect) {
        playSound('success');
        await fetchCase();
      } else {
        playSound('error');
      }
    } catch (err) {
      playSound('error');
      setSubmitFeedback({ success: false, message: 'Link Error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Activity className="w-12 h-12 text-[#d4a017] animate-pulse" />
      <div className="font-display text-[#d4a017] uppercase tracking-[0.4em] text-center text-base">
        Reconstructing_Evidence_Matrix...
      </div>
    </div>
  );

  if (!caseData || !Array.isArray(caseData.puzzles)) return <div className="text-[#A52A2A] font-display tracking-widest text-center mt-20 text-xl">CRITICAL_ERROR: CASE_NODE_NOT_FOUND</div>;

  const solvedCount = (caseData.puzzles || []).filter(p => p.solved).length;
  const totalCount = (caseData.puzzles || []).length;

  return (
    <div className="min-h-screen px-4 md:px-8 py-12 max-w-6xl mx-auto space-y-12" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      
      {/* ── CINEMATIC CASE FOLDER WRAPPER ── */}
      <div className="detective-panel border-[#8B6914] border-2 shadow-[0_20px_60px_rgba(0,0,0,0.8)] parchment-panel text-[#1a0e04] overflow-hidden relative">
        
        {/* Folder Tab Overlay */}
        <div className="absolute top-0 right-12 w-48 h-8 bg-[#d4ae68] border-b border-[#8B6914] rounded-t-xl translate-y-[-50%] flex items-center justify-center pt-2">
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-[#1a0e04]/40">CASE_FILE_REF_{caseData.id}</span>
        </div>

        <div className="p-6 md:p-12 relative z-10">
          {/* Back nav */}
          <Link to="/" className="inline-flex items-center gap-2 mb-10 text-[11px] uppercase tracking-widest transition-colors font-bold text-[#1a0e04]/40 hover:text-[#1a0e04]"
            onClick={() => playSound('click')}
          >
            <ChevronLeft className="w-3 h-3" /> Return to Command Hub
          </Link>

          {/* ===== CASE HERO HEADER ===== */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className="bg-red-900/10 border border-red-900/20 text-red-900 text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                 Threat: {caseData.difficulty}
              </span>
              <span className="text-[10px] font-mono text-[#1a0e04]/40 font-bold uppercase tracking-widest shrink-0">
                 Intel_Stream_BAU_{caseData.id}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-black text-[#1a0e04] uppercase tracking-tighter leading-none mb-6">
              {caseData.title}
            </h1>
            <p className="text-base md:text-xl text-[#1a0e04]/70 font-display italic max-w-4xl border-l-4 border-red-900/20 pl-6 leading-relaxed">
              {(() => {
                try {
                  const desc = typeof caseData.description === 'string' ? JSON.parse(caseData.description) : caseData.description;
                  return desc.summary || desc.description || caseData.description;
                } catch (e) {
                  return caseData.description;
                }
              })()}
            </p>

            {/* Tactical stats row */}
            <div className="mt-10 flex flex-wrap items-center gap-8 border-t border-[#1a0e04]/5 pt-6">
               <div className="flex flex-col">
                  <span className="text-[9px] font-mono font-black text-[#1a0e04]/30 uppercase tracking-widest">Progress</span>
                  <span className="text-2xl font-display font-black text-[#1a0e04]">
                     {totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0}%
                  </span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[9px] font-mono font-black text-[#1a0e04]/30 uppercase tracking-widest">Task Units</span>
                  <span className="text-2xl font-display font-black text-[#1a0e04]">
                     {solvedCount}/{totalCount}
                  </span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[9px] font-mono font-black text-[#1a0e04]/30 uppercase tracking-widest">Hints Used</span>
                  <span className="text-2xl font-display font-black text-red-900/60">
                     {caseData.hintsUsedInCase ?? 0}
                  </span>
               </div>
            </div>
          </motion.div>

          {/* ===== FIELD EVIDENCE ===== */}
          <section className="space-y-6 mb-16">
            <div className="flex items-center justify-between border-b border-[#1a0e04]/10 pb-4">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-red-900/40" />
                <h2 className="text-lg font-display font-black text-[#1a0e04] uppercase tracking-[0.15em]">Field Telemetry</h2>
              </div>
              <span className="text-xs font-mono text-[#1a0e04]/40 uppercase tracking-widest">Analogue_Node: 0x{id}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(caseData.evidence || []).map((ev, idx) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  {ev.is_locked ? (
                    <div className="bg-black/5 p-6 opacity-40 grayscale border border-dashed border-[#1a0e04]/20 cursor-not-allowed">
                      <div className="flex items-center gap-5">
                        <div className="p-3 bg-white/40 border border-[#1a0e04]/10">
                          <LockIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-display font-black text-gray-500 uppercase tracking-widest">Locked_Asset</h3>
                          <div className="text-[9px] font-mono text-red-900/40 uppercase tracking-widest">Bypass Task {ev.required_puzzle_id}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link to={`/evidence/${ev.id}`} onClick={() => playSound('click')} className="block group">
                      <div className="bg-white/40 p-6 border border-[#8B6914]/20 hover:border-red-900/40 shadow-sm transition-all duration-300 relative">
                        <div className="flex items-center gap-5">
                          <div className="p-3 bg-white/60 border border-[#8B6914]/10 group-hover:border-red-900/20 transition-colors">
                            {ev.type === 'chat' && <MessageSquare className="w-6 h-6 text-red-900/70" />}
                            {ev.type === 'html' && <FileText className="w-6 h-6 text-blue-900/70" />}
                            {ev.type === 'log' && <Terminal className="w-6 h-6 text-gray-900/70" />}
                            {ev.type === 'email' && <Mail className="w-6 h-6 text-indigo-900/70" />}
                            {ev.type === 'code' && <Code className="w-6 h-6 text-amber-900/70" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-display font-black text-[#1a0e04] uppercase tracking-wide group-hover:text-red-900 transition-colors">{ev.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[9px] font-mono text-[#1a0e04]/40 uppercase tracking-widest font-bold font-black">{ev.type}_DECRYPTED</span>
                            </div>
                          </div>
                          <ChevronRight className="w-6 h-6 text-[#1a0e04]/20 group-hover:text-red-900 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </section>

          {/* ===== OPERATIONAL PUZZLES ===== */}
          <section className="space-y-8 mb-16">
            <div className="flex items-center justify-between border-b border-[#1a0e04]/10 pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 border border-[#1a0e04]/20 bg-white/20">
                  <Terminal className="w-6 h-6 text-red-900" />
                </div>
                <h2 className="text-xl font-display font-black text-[#1a0e04] uppercase tracking-[0.2em]">Active Subsystems</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
              {(caseData.puzzles || []).map((p, idx) => (
                <motion.div
                  key={p.id}
                  id={`puzzle-${p.id}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-white/40 border border-[#8B6914]/20 group transition-all duration-500 overflow-hidden relative ${p.solved
                  ? 'border-green-900/20'
                  : 'hover:border-red-900/40 shadow-sm'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-500 ${p.solved ? 'bg-green-800/40' : 'bg-red-900/10 group-hover:bg-red-900/30'}`} />

                  <div className={`px-6 py-5 border-b border-[#1a0e04]/5 flex items-center justify-between transition-colors ${p.solved ? 'bg-green-800/5' : 'bg-white/20 group-hover:bg-white/30'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`relative flex items-center justify-center w-8 h-8 border ${p.solved ? 'border-green-800/20 bg-green-800/10' : 'border-[#1a0e04]/10 bg-white/10'
                      }`}>
                        {p.solved ? (
                          <CheckCircle2 className="w-4 h-4 text-green-800" />
                        ) : (
                          <LockIcon className="w-4 h-4 text-[#1a0e04]/30 group-hover:text-red-900/60 transition-colors" />
                        )}
                      </div>
                      <span className={`text-base font-display font-black uppercase tracking-widest ${p.solved ? 'text-green-900' : 'text-[#1a0e04]/60 group-hover:text-red-900 transition-all'}`}>
                        UNIT_{p.id}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-display text-[#1a0e04]/30 uppercase tracking-widest mb-1">Bounty</span>
                      <span className={`text-lg font-display font-black leading-none ${p.solved ? 'text-green-900' : 'text-red-900'}`}>
                        {p.hint_used ? Math.floor(p.points * 0.5) : p.points} XP
                      </span>
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="relative">
                      <div className="absolute -left-4 top-0 bottom-0 w-px bg-red-900/10" />
                      <p className="text-base md:text-lg font-display font-bold text-[#1a0e04]/80 leading-relaxed pl-4">
                        <span className="text-red-900/30 mr-2">»</span>
                        {p.question}
                      </p>
                    </div>

                    {!p.solved ? (() => {
                      const isFirewallLocked = dynamicState?.lockouts?.[p.id] && new Date(dynamicState.lockouts[p.id]) > new Date();
                      const isDependencyLocked = p.is_locked;
                      const isLocked = isFirewallLocked || isDependencyLocked;
                      const autoHint = dynamicState?.dynamic_hints?.[p.id];

                      return (
                        <div className="space-y-6">
                          {isFirewallLocked && (
                            <div className="p-4 bg-red-900/5 border border-red-900/20 text-red-900 text-xs font-mono uppercase tracking-widest">
                               Firewall Active. Retry available at {new Date(dynamicState!.lockouts[p.id]).toLocaleTimeString()}
                            </div>
                          )}
                          {isDependencyLocked && (
                            <div className="p-4 bg-gray-900/5 border border-[#1a0e04]/20 text-[#1a0e04]/40 text-xs font-mono uppercase tracking-widest">
                               Parent node Task {p.depends_on_puzzle_id} is encrypted.
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="text"
                              disabled={solvingPuzzle[p.id] || isLocked}
                              value={puzzleAnswers[p.id] || ''}
                              onChange={(e) => setPuzzleAnswers(prev => ({ ...prev, [p.id]: e.target.value }))}
                              className={`flex-1 h-14 bg-white/20 border-2 border-[#1a0e04]/10 px-4 focus:border-red-900/30 outline-none font-display font-bold text-[#1a0e04] ${(solvingPuzzle[p.id] || isLocked) ? 'opacity-50' : ''}`}
                              placeholder="DECRYPTION_KEY..."
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSolvePuzzle(p.id); }}
                            />
                            <button
                              type="button"
                              disabled={solvingPuzzle[p.id] || isLocked}
                              onClick={() => handleSolvePuzzle(p.id)}
                              className={`h-14 px-8 bg-red-900 text-white font-display font-black uppercase tracking-widest flex items-center justify-center hover:bg-[#1a0e04] transition-all ${(solvingPuzzle[p.id] || isLocked) ? 'opacity-50' : ''}`}
                            >
                              {solvingPuzzle[p.id] ? <Cpu className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
                            </button>
                          </div>

                          <AnimatePresence>
                            {puzzleFeedback[p.id] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`text-[11px] font-display font-black uppercase p-3 border ${puzzleFeedback[p.id].success ? 'bg-green-800/10 border-green-800/20 text-green-900' : 'bg-red-900/10 border-red-900/20 text-red-900'}`}
                              >
                                {puzzleFeedback[p.id].success ? 'ACCESS_GRANTED' : 'INVALID_CREDENTIALS'} // {puzzleFeedback[p.id].message}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {!p.hint_used && p.has_hint && (
                            <button
                              onClick={() => handleRequestHint(p.id)}
                              className="text-[10px] font-display font-black text-red-900/60 uppercase tracking-[0.2em] flex items-center gap-2 hover:text-red-900 transition-colors"
                            >
                              <HelpCircle className="w-3.5 h-3.5" /> Decode Intel (-50% XP)
                            </button>
                          )}

                          {p.hint_used && p.hint && (
                            <div className="p-4 bg-white/60 border border-[#8B6914]/20 italic text-sm font-display text-[#1a0e04]/80">
                               " {p.hint} "
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <div className="flex items-center gap-3 text-green-900 font-display font-black uppercase tracking-[0.2em]">
                         <CheckCircle2 className="w-5 h-5" /> Subsystem Secured
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ===== FINAL REPORT ===== */}
          <section className="space-y-6 pt-12 border-t border-[#1a0e04]/10">
            <div className="flex items-center gap-3 mb-4">
              <Send className="w-6 h-6 text-red-900/60" />
              <h2 className="text-xl font-display font-black text-[#1a0e04] uppercase tracking-[0.15em]">Submission Portal</h2>
            </div>

            {caseData?.isCompleted ? (
              <div className="bg-green-800/5 border-2 border-green-800/20 p-12 text-center">
                 <CheckCircle2 className="w-20 h-20 text-green-800 mx-auto mb-6" />
                 <h3 className="text-3xl font-display font-black text-green-900 uppercase tracking-widest mb-2">CASE_RESOLVED</h3>
                 <p className="text-green-800/60 font-display font-bold text-sm uppercase tracking-widest">
                    The suspect has been processed. Mission Accomplished.
                 </p>
              </div>
            ) : (
              <div className="bg-white/20 border border-[#1a0e04]/10 p-8 md:p-12">
                <form onSubmit={handleFinalSubmit} className="space-y-8 max-w-xl">
                  <div className="space-y-3">
                    <label className="text-xs font-display font-black text-[#1a0e04]/40 uppercase tracking-[0.3em]">Identity of Perpetrator</label>
                    <input
                      type="text"
                      required
                      value={submission.attackerName}
                      onChange={(e) => setSubmission(prev => ({ ...prev, attackerName: e.target.value }))}
                      className="w-full h-16 bg-white/40 border-2 border-[#1a0e04]/10 px-6 font-display font-black text-xl text-[#1a0e04] outline-none focus:border-red-900/40"
                      placeholder="ENTER NAME"
                    />
                  </div>
                  
                  {submitFeedback && (
                    <div className={`p-6 font-display font-black uppercase text-sm ${submitFeedback.isCorrect ? 'bg-green-800/10 text-green-900' : 'bg-red-900/10 text-red-900'}`}>
                       {submitFeedback.isCorrect ? 'VALID_REPORT' : 'INVALID_REPORT'} // {submitFeedback.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-16 bg-red-900 text-white font-display font-black uppercase tracking-[0.4em] hover:bg-[#1a0e04] transition-all disabled:opacity-50"
                  >
                    {submitting ? 'TRANSMITTING...' : 'PROCESS_CASE_REPORT'}
                  </button>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

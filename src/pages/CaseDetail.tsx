import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, Code, Mail, MessageSquare, Terminal, 
  ChevronRight, CheckCircle2, AlertCircle, HelpCircle, 
  Send, ShieldAlert, History, Lock as LockIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Case, Evidence, Puzzle } from '../types';

function HintCooldown({ usedAt, onComplete }: { usedAt: string, onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTime = () => {
      // SQLite format is YYYY-MM-DD HH:MM:SS (UTC)
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
    <div className="p-2 bg-yellow-500/5 border border-yellow-500/20 rounded">
      <p className="text-[10px] font-mono text-yellow-500/70 uppercase tracking-widest mb-1 flex items-center gap-1">
        <Terminal className="w-3 h-3 animate-pulse" /> Decryption in progress...
      </p>
      <p className="text-sm font-mono text-yellow-500 font-bold">
        {minutes}:{seconds.toString().padStart(2, '0')} REMAINING
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
  
  // Final submission state
  const [submission, setSubmission] = useState({ attackerName: '', attackMethod: '', preventionMeasures: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ success: boolean, message: string, isCorrect?: boolean, pointsAwarded?: number, firstBloodBonus?: number, badgesEarned?: string[] } | null>(null);

  // Load saved answers from localStorage on mount or case change
  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem(`tech_detective_answers_${id}`);
      if (saved) {
        try {
          setPuzzleAnswers(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved answers", e);
        }
      } else {
        setPuzzleAnswers({});
      }
    }
  }, [id]);

  // Auto-save answers to localStorage whenever they change
  useEffect(() => {
    if (id) {
      localStorage.setItem(`tech_detective_answers_${id}`, JSON.stringify(puzzleAnswers));
    }
  }, [id, puzzleAnswers]);

  useEffect(() => {
    fetchCase();
  }, [id]);

  useEffect(() => {
    if (caseData && window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-terminal-green', 'ring-offset-2', 'ring-offset-black');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-terminal-green', 'ring-offset-2', 'ring-offset-black');
          }, 2000);
        }, 100);
      }
    }
  }, [caseData]);

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
        // Clear the saved answer for this puzzle since it's solved
        setPuzzleAnswers(prev => {
          const next = { ...prev };
          delete next[puzzleId];
          return next;
        });
        // Refresh case data to update solved status and score
        fetchCase();
      }
    } catch (err) {
      setPuzzleFeedback(prev => ({ ...prev, [puzzleId]: { success: false, message: 'Connection error' } }));
    }
  };

  const handleRequestHint = async (puzzleId: number) => {
    if (!window.confirm('Requesting a hint will deduct 50% of the points for this puzzle. Proceed?')) return;

    try {
      const response = await fetch(`/api/puzzles/${puzzleId}/hint`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchCase();
      }
    } catch (err) {
      console.error('Failed to request hint');
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err) {
      setSubmitFeedback({ success: false, message: 'Connection error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-pulse font-mono text-terminal-green">ANALYZING_CASE_DATA...</div>;
  if (!caseData) return <div className="text-red-500 font-mono">CASE_NOT_FOUND</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Case Info & Evidence */}
      <div className="lg:col-span-2 space-y-8">
        <div className="terminal-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-terminal-green/10 rounded border border-terminal-green/30">
              <ShieldAlert className="w-8 h-8 text-terminal-green" />
            </div>
            <div>
              <h1 className="text-2xl font-mono font-bold text-white uppercase tracking-tighter">{caseData.title}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">ID: {caseData.id}</span>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">DIFFICULTY: {caseData.difficulty}</span>
              </div>
            </div>
          </div>
          <p className="text-gray-400 font-mono text-sm leading-relaxed">
            {caseData.description}
          </p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <History className="w-4 h-4 text-terminal-green" />
            <h2 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Collected Evidence</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {caseData.evidence.map((ev) => (
              <div key={ev.id} id={`evidence-${ev.id}`} className="relative group">
                {ev.is_locked ? (
                  <div className="terminal-card p-4 opacity-60 cursor-not-allowed border-dashed border-terminal-line/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-terminal-line/10 rounded border border-terminal-line/30">
                        <LockIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-mono font-bold text-gray-500 truncate uppercase tracking-tight">
                          [LOCKED_EVIDENCE]
                        </h3>
                        <p className="text-[10px] font-mono text-terminal-green/50 uppercase tracking-widest mt-0.5">
                          SOLVE_PUZZLE_#{ev.required_puzzle_id}_TO_UNLOCK
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link to={`/evidence/${ev.id}`} className="block">
                    <div className="terminal-card p-4 hover:border-terminal-green transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-terminal-line/30 rounded border border-terminal-line group-hover:border-terminal-green/50 transition-colors">
                          {ev.type === 'chat' && <MessageSquare className="w-5 h-5 text-blue-400" />}
                          {ev.type === 'html' && <FileText className="w-5 h-5 text-orange-400" />}
                          {ev.type === 'log' && <Terminal className="w-5 h-5 text-terminal-green" />}
                          {ev.type === 'email' && <Mail className="w-5 h-5 text-purple-400" />}
                          {ev.type === 'code' && <Code className="w-5 h-5 text-yellow-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-mono font-bold text-white truncate group-hover:text-terminal-green transition-colors uppercase tracking-tight">
                            {ev.title}
                          </h3>
                          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mt-0.5">
                            {ev.type.toUpperCase()} DATA
                          </p>
                        </div>
                        <div data-tooltip="Examine Evidence">
                          <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-terminal-green group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <CheckCircle2 className="w-4 h-4 text-terminal-green" />
            <h2 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Investigation Progress</h2>
            {caseData.maxHints !== undefined && (
              <span className="ml-auto text-[10px] font-mono text-yellow-500">
                HINTS USED: {caseData.hintsUsedInCase} / {caseData.maxHints}
              </span>
            )}
          </div>
          <div className="terminal-card overflow-hidden">
            <div className="terminal-header bg-terminal-green/5">
              <span className="text-[10px] font-mono font-bold text-terminal-green uppercase tracking-widest">Solved Puzzles Log</span>
            </div>
            <div className="divide-y divide-terminal-line/30">
              {caseData.puzzles.filter(p => p.solved).length > 0 ? (
                caseData.puzzles.filter(p => p.solved).map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-terminal-green/10 flex items-center justify-center border border-terminal-green/20">
                        <CheckCircle2 className="w-4 h-4 text-terminal-green" />
                      </div>
                      <div>
                        <p className="text-sm font-mono text-white uppercase tracking-tight">Puzzle #{p.id}</p>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                          {p.hint_used ? 'Hint Decrypted' : 'Direct Resolution'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-terminal-green">
                        +{p.hint_used ? Math.floor(p.points * 0.5) : p.points} PTS
                      </p>
                      <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Awarded</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-600 font-mono text-xs uppercase tracking-widest italic">
                  No puzzles solved yet. Analyze evidence to find clues.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Final Submission Form */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Send className="w-4 h-4 text-terminal-green" />
            <h2 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Final Investigation Report</h2>
          </div>
          <div className="terminal-card p-8">
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider">Identified Attacker</label>
                <input 
                  type="text"
                  required
                  value={submission.attackerName}
                  onChange={(e) => setSubmission(prev => ({ ...prev, attackerName: e.target.value }))}
                  className="terminal-input w-full"
                  placeholder="NAME_OR_ALIAS"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider">Attack Methodology</label>
                <textarea 
                  required
                  rows={3}
                  value={submission.attackMethod}
                  onChange={(e) => setSubmission(prev => ({ ...prev, attackMethod: e.target.value }))}
                  className="terminal-input w-full resize-none"
                  placeholder="Explain how the attack was executed..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider">Prevention Strategy</label>
                <textarea 
                  required
                  rows={3}
                  value={submission.preventionMeasures}
                  onChange={(e) => setSubmission(prev => ({ ...prev, preventionMeasures: e.target.value }))}
                  className="terminal-input w-full resize-none"
                  placeholder="What measures should be taken to prevent this in the future?"
                />
              </div>

              {submitFeedback && (
                <div className={`p-6 font-mono border-2 ${
                  submitFeedback.isCorrect 
                    ? 'bg-terminal-green/10 text-terminal-green border-terminal-green' 
                    : submitFeedback.success 
                      ? 'bg-red-500/10 text-red-500 border-red-500' 
                      : 'bg-red-500/20 text-red-500 border-red-500'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    {submitFeedback.isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                    <h3 className="text-lg font-bold uppercase tracking-tighter">
                      {submitFeedback.isCorrect ? 'INVESTIGATION_SUCCESS' : 'INVESTIGATION_FAILURE'}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {submitFeedback.message}
                  </p>
                  {submitFeedback.isCorrect && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-terminal-green/70">
                        The CCU has officially closed this case. Excellent work, detective.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs font-bold bg-terminal-green/20 px-2 py-1 rounded">
                          +{submitFeedback.pointsAwarded} PTS
                        </span>
                        {submitFeedback.firstBloodBonus && submitFeedback.firstBloodBonus > 0 && (
                          <span className="text-xs font-bold bg-red-500/20 text-red-500 px-2 py-1 rounded animate-pulse">
                            FIRST BLOOD BONUS: +{submitFeedback.firstBloodBonus} PTS
                          </span>
                        )}
                        {submitFeedback.badgesEarned?.map(badge => (
                          <span key={badge} className="text-xs font-bold bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                            BADGE EARNED: {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                type="submit"
                disabled={submitting}
                className="terminal-button w-full py-4 flex items-center justify-center gap-2 group"
              >
                {submitting ? 'TRANSMITTING_DATA...' : (
                  <>
                    SUBMIT_FINAL_REPORT
                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Right Column: Puzzles */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <HelpCircle className="w-4 h-4 text-terminal-green" />
          <h2 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Investigation Puzzles</h2>
          {caseData.maxHints !== undefined && (
            <span className="ml-auto text-[10px] font-mono text-yellow-500">
              HINTS USED: {caseData.hintsUsedInCase} / {caseData.maxHints}
            </span>
          )}
        </div>
        
        <div className="space-y-4">
          {caseData.puzzles.map((p) => (
            <div key={p.id} id={`puzzle-${p.id}`} className={`terminal-card transition-all duration-500 ${p.solved ? 'border-terminal-green/50 bg-terminal-green/5' : ''}`}>
              <div className="terminal-header">
                <div className="flex items-center gap-2">
                  {p.solved ? (
                    <CheckCircle2 className="w-4 h-4 text-terminal-green" />
                  ) : (
                    <HelpCircle className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Puzzle #{p.id}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-terminal-green uppercase">
                  {p.hint_used ? `+${Math.floor(p.points * 0.5)}` : `+${p.points}`} PTS
                </span>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm font-mono text-gray-300 leading-relaxed">
                  {p.question}
                </p>
                
                {!p.solved ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={puzzleAnswers[p.id] || ''}
                        onChange={(e) => setPuzzleAnswers(prev => ({ ...prev, [p.id]: e.target.value }))}
                        className="terminal-input flex-1 text-sm"
                        placeholder="ENTER_ANSWER"
                        onKeyDown={(e) => e.key === 'Enter' && handleSolvePuzzle(p.id)}
                      />
                      <button 
                        onClick={() => handleSolvePuzzle(p.id)}
                        className="p-2 bg-terminal-green text-black hover:bg-white transition-colors"
                        data-tooltip="Submit Answer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {puzzleFeedback[p.id] && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`flex flex-col gap-1 text-[10px] font-mono uppercase ${puzzleFeedback[p.id].success ? 'text-terminal-green' : 'text-red-500'}`}
                      >
                        <div className="flex items-center gap-2">
                          {puzzleFeedback[p.id].success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {puzzleFeedback[p.id].message || (puzzleFeedback[p.id].success ? 'SOLVED' : 'INCORRECT')}
                        </div>
                        {puzzleFeedback[p.id].success && puzzleFeedback[p.id].firstBloodBonus && puzzleFeedback[p.id].firstBloodBonus! > 0 && (
                          <div className="text-red-500 font-bold animate-pulse ml-5">
                            FIRST BLOOD! +{puzzleFeedback[p.id].firstBloodBonus} PTS
                          </div>
                        )}
                      </motion.div>
                    )}

                    {p.hint_used && (
                      <div className="space-y-2">
                        {p.hint ? (
                          <div className="p-2 bg-terminal-green/5 border border-terminal-green/20 rounded">
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Decrypted Hint:</p>
                            <p className="text-[10px] font-mono text-terminal-green italic">
                              {p.hint}
                            </p>
                          </div>
                        ) : (
                          p.hint_used_at && <HintCooldown usedAt={p.hint_used_at} onComplete={() => {}} />
                        )}
                      </div>
                    )}

                    {!p.hint_used && p.hint && (
                      <button 
                        onClick={() => handleRequestHint(p.id)}
                        disabled={caseData.hintsUsedInCase !== undefined && caseData.maxHints !== undefined && caseData.hintsUsedInCase >= caseData.maxHints}
                        className={`text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 transition-colors ${
                          caseData.hintsUsedInCase !== undefined && caseData.maxHints !== undefined && caseData.hintsUsedInCase >= caseData.maxHints 
                            ? 'text-gray-600 cursor-not-allowed opacity-50' 
                            : 'text-gray-600 hover:text-terminal-green'
                        }`}
                      >
                        <HelpCircle className="w-3 h-3" /> 
                        {caseData.hintsUsedInCase !== undefined && caseData.maxHints !== undefined && caseData.hintsUsedInCase >= caseData.maxHints 
                          ? 'HINT_LIMIT_REACHED' 
                          : 'REQUEST_HINT (-50% PTS)'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-terminal-green text-xs font-mono font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" />
                    PUZZLE_RESOLVED
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

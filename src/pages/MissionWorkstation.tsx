import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Send, ChevronLeft, Activity, Eye, EyeOff,
  CheckCircle2, AlertTriangle, Terminal, BookOpen, Zap, RefreshCw
} from 'lucide-react';
import { useSound } from '../hooks/useSound';
import { getRankTitle } from '../utils/ranks';

// ── Types ──────────────────────────────────────────────────────────────────

interface MissionData {
  brief: string;
  evidence: { logs?: string[]; emails?: string[] };
  available_functions: string[];
  expected_output: string;
  starter_code: string;
  hints: string[];
}

interface Mission {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  points_on_solve: number;
  metadata: MissionData;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const DIFFICULTY_CFG: Record<string, { label: string; color: string; border: string }> = {
  Easy:         { label: 'PHASE 1 — RECON',           color: '#4a7c3f', border: '#2a4a20' },
  Intermediate: { label: 'PHASE 2 — EVIDENCE TRAIL',  color: '#c8860a', border: '#5a3a0a' },
  Hard:         { label: 'PHASE 3 — DEEP DIVE',       color: '#8B2020', border: '#4a1010' },
  Expert:       { label: 'PHASE 4 — FINAL PROTOCOL',  color: '#7a3aaa', border: '#3a1a5a' },
};

// ── Main Component ─────────────────────────────────────────────────────────

export default function MissionWorkstation() {
  const { id } = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { playSound } = useSound();

  const [mission, setMission]       = useState<Mission | null>(null);
  const [loading, setLoading]       = useState(true);
  const [code, setCode]             = useState('');
  const [output, setOutput]         = useState('');
  const [runError, setRunError]     = useState<string | null>(null);
  const [isRunning, setIsRunning]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verdict, setVerdict]       = useState<'correct' | 'incorrect' | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [activePanel, setActivePanel] = useState<'evidence' | 'functions'>('evidence');
  const [outputLines, setOutputLines] = useState<string[]>([]);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const team = (() => { try { return JSON.parse(localStorage.getItem('team') || '{}'); } catch { return {}; } })();
  const rankTitle = getRankTitle(team?.score || 0);
  const xp = team?.score || 0;
  const xpPct = Math.min(100, Math.round((xp / 3000) * 100));

  // ── Fetch Mission ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('token');
    fetch(`/api/cases/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.id) {
          setMission(data);
          const starter = data.metadata?.starter_code || `// MISSION: ${data.title}\n// Write your Detective Script here.\n\nconst logs = get_logs();\n\n// YOUR CODE HERE\n`;
          setCode(starter);
          playSound('ping');
        }
      })
      .finally(() => setLoading(false));
  }, [id, playSound]);

  // ── Run Code ─────────────────────────────────────────────────────────────

  const handleRun = useCallback(async () => {
    if (!id || isRunning) return;
    playSound('click');
    setIsRunning(true);
    setOutput('');
    setRunError(null);
    setOutputLines([]);

    try {
      const res = await fetch(`/api/missions/${id}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.error) {
        setRunError(data.error);
        playSound('error');
      } else {
        const lines = (data.output || '').split('\n');
        setOutputLines(lines);
        setOutput(data.output || '');
        playSound('success');
      }
    } catch {
      setRunError('Network error — lost contact with MOLT server.');
      playSound('error');
    } finally {
      setIsRunning(false);
    }
  }, [id, code, isRunning, playSound]);

  // ── Submit Output ────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!id || isSubmitting || !output) return;
    playSound('click');
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/missions/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ code, output }),
      });
      const data = await res.json();

      if (data.isCorrect) {
        setVerdict('correct');
        setPointsAwarded(data.pointsAwarded);
        playSound('success');
        // Update local XP immediately
        const updatedTeam = { ...team, score: (team.score || 0) + data.pointsAwarded };
        localStorage.setItem('team', JSON.stringify(updatedTeam));
      } else {
        setVerdict('incorrect');
        playSound('error');
        setTimeout(() => setVerdict(null), 3000);
      }
    } catch {
      playSound('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, code, output, isSubmitting, playSound, team]);

  // ── Keyboard shortcut: Ctrl+Enter to Run ────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun]);

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#140e06' }}>
      <div className="flex flex-col items-center gap-4">
        <Activity className="w-10 h-10 text-[#d4a017] animate-pulse" />
        <span className="text-[11px] font-black text-[#c8a050]/60 uppercase tracking-[0.4em]">Establishing Link...</span>
      </div>
    </div>
  );

  if (!mission) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#140e06' }}>
      <div className="text-red-900 font-black uppercase tracking-[0.4em]">MISSION_NOT_FOUND</div>
    </div>
  );

  const md = mission.metadata;
  const diffCfg = DIFFICULTY_CFG[mission.difficulty] || DIFFICULTY_CFG.Easy;

  // ── Verdict Screen ────────────────────────────────────────────────────────

  if (verdict === 'correct') return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0a0702' }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center px-8"
      >
        <motion.div
          initial={{ rotate: -10, scale: 0.5 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="text-8xl mb-8"
          style={{ filter: 'drop-shadow(0 0 40px rgba(212,160,23,0.8))' }}
        >
          ✓
        </motion.div>
        <div
          className="text-4xl font-black uppercase tracking-[0.3em] mb-4"
          style={{ color: '#d4a017', fontFamily: "'Georgia', serif", textShadow: '0 0 30px rgba(212,160,23,0.5)' }}
        >
          Mission Cleared
        </div>
        <div className="text-[13px] font-mono text-[#c8a050]/70 uppercase tracking-widest mb-2">
          {mission.title}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-5xl font-black text-[#f0d070] mb-8"
        >
          +{pointsAwarded} XP
        </motion.div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 font-black uppercase tracking-widest text-sm transition-all hover:brightness-125"
            style={{ background: '#a07830', color: '#f0e0a0', border: '2px solid #d4a017' }}
          >
            ← Return to Board
          </button>
        </div>
      </motion.div>
    </div>
  );

  // ── Main Workstation UI ───────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ fontFamily: "'Georgia', serif", background: '#140e06' }}
    >
      {/* ═══ TOP CHROME ═══ */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 h-12 z-50"
        style={{
          background: 'linear-gradient(to bottom, #4a3820, #3a2a12)',
          borderBottom: '3px solid #6a5020',
          boxShadow: '0 3px 16px rgba(0,0,0,0.8)',
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => { playSound('click'); navigate('/'); }}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/5 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 text-[#f0d070] group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#f0d070]">Board</span>
          </button>
          <div className="w-px h-5 bg-[#c8a050]/20" />
          <span className="text-[11px] font-black text-[#f0d070] uppercase tracking-[0.15em]">TECH DETECTIVE</span>
          <span className="text-[10px] font-mono text-[#c8a050]/50 tracking-widest">MISSION WORKSTATION</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right leading-none">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#c8a050]/50">{rankTitle}</div>
            <div className="text-xs font-black text-[#f0d070]">{team?.name || 'Agent'}</div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[8px] font-mono uppercase tracking-widest text-[#c8a050]/50">XP {xp}</span>
            <div className="w-24 h-2.5 bg-[#1a0e04] border border-[#5a4010] overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full" style={{ background: 'linear-gradient(to right, #a07020, #f0d070)' }} />
            </div>
          </div>
          <button
            onClick={() => { playSound('click'); localStorage.clear(); window.location.href = '/'; }}
            className="font-black uppercase text-[10px] px-3 py-1.5 transition-all hover:brightness-125"
            style={{ background: 'linear-gradient(to bottom, #8B1A1A, #6a0e0e)', border: '1.5px solid #5a0808', color: '#ffd0d0', letterSpacing: '0.15em' }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* ═══ MISSION HEADER BAR ═══ */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-2.5"
        style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(160,120,48,0.2)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em]"
            style={{ background: diffCfg.border, color: diffCfg.color, border: `1px solid ${diffCfg.color}` }}
          >
            {diffCfg.label}
          </div>
          <span className="text-sm font-black text-[#f0d070] uppercase tracking-wider">{mission.title}</span>
          <span className="text-[10px] font-mono text-[#c8a050]/40">Mission #{mission.id}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-[#c8a050]/50">Ctrl+Enter to Run</span>
          <div className="px-3 py-1 bg-[#1a0e04] border border-[#a07830]/30">
            <span className="text-[10px] font-black text-[#d4a017] uppercase tracking-widest">{mission.points_on_solve} XP</span>
          </div>
        </div>
      </div>

      {/* ═══ THREE PANEL BODY ═══ */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ── LEFT PANEL: Evidence + Functions ── */}
        <div
          className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ borderRight: '2px solid #3a2810', background: 'linear-gradient(to bottom, #1e1408, #160e06)' }}
        >
          {/* Panel tabs */}
          <div className="flex-shrink-0 flex" style={{ borderBottom: '1px solid #3a2810' }}>
            {(['evidence', 'functions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActivePanel(tab)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all"
                style={{
                  background: activePanel === tab ? 'rgba(160,120,48,0.15)' : 'transparent',
                  borderBottom: activePanel === tab ? '2px solid #a07830' : '2px solid transparent',
                  color: activePanel === tab ? '#f0d070' : 'rgba(200,160,80,0.4)',
                }}
              >
                {tab === 'evidence' ? <BookOpen className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

            {activePanel === 'evidence' ? (
              <>
                {/* Brief */}
                <div>
                  <div className="text-[8px] font-black text-[#c8a050]/40 uppercase tracking-[0.3em] mb-2 pb-1 border-b border-[#a07830]/20">
                    ◆ Mission Brief
                  </div>
                  <p className="text-[11px] text-[#c8a050]/75 leading-relaxed font-mono">
                    {md?.brief}
                  </p>
                </div>

                {/* Logs */}
                {md?.evidence?.logs && md.evidence.logs.length > 0 && (
                  <div>
                    <div className="text-[8px] font-black text-[#c8a050]/40 uppercase tracking-[0.3em] mb-2 pb-1 border-b border-[#a07830]/20">
                      ◆ Server Logs
                    </div>
                    <div className="space-y-0.5">
                      {md.evidence.logs.map((line, i) => (
                        <div
                          key={i}
                          className="text-[10px] font-mono leading-tight px-2 py-0.5"
                          style={{
                            color: line.includes('FAILED') || line.includes('DENIED') ? '#c0503a'
                              : line.includes('SUCCESS') || line.includes('GRANTED') ? '#5a9a4a'
                              : line.includes('ACCESS') || line.includes('ATTACK') ? '#c8860a'
                              : 'rgba(200,160,80,0.7)',
                            background: 'rgba(0,0,0,0.2)',
                            borderLeft: `2px solid ${
                              line.includes('FAILED') ? '#c0503a40'
                              : line.includes('SUCCESS') ? '#5a9a4a40'
                              : '#a0783020'
                            }`,
                          }}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emails */}
                {md?.evidence?.emails && md.evidence.emails.length > 0 && (
                  <div>
                    <div className="text-[8px] font-black text-[#c8a050]/40 uppercase tracking-[0.3em] mb-2 pb-1 border-b border-[#a07830]/20">
                      ◆ Intercepted Emails
                    </div>
                    <div className="space-y-1">
                      {md.evidence.emails.map((line, i) => (
                        <div
                          key={i}
                          className="text-[10px] font-mono leading-tight px-2 py-1"
                          style={{
                            color: line.includes('confidential') || line.includes('credentials') ? '#c8860a' : 'rgba(200,160,80,0.7)',
                            background: 'rgba(0,0,0,0.2)',
                            borderLeft: '2px solid rgba(160,120,48,0.2)',
                          }}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hints */}
                {md?.hints && md.hints.length > 0 && (
                  <div>
                    <div className="text-[8px] font-black text-[#c8a050]/40 uppercase tracking-[0.3em] mb-2 pb-1 border-b border-[#a07830]/20">
                      ◆ MOLT Hints ({hintsRevealed}/{md.hints.length} revealed)
                    </div>
                    {md.hints.slice(0, hintsRevealed).map((hint, i) => (
                      <div key={i} className="mb-2 px-2 py-1.5 text-[10px] font-mono text-[#c8860a]/80 leading-relaxed"
                        style={{ background: 'rgba(200,100,0,0.05)', borderLeft: '2px solid rgba(200,100,0,0.3)' }}>
                        {hint}
                      </div>
                    ))}
                    {hintsRevealed < md.hints.length && (
                      <button
                        onClick={() => { setHintsRevealed(h => h + 1); playSound('click'); }}
                        className="w-full py-2 text-[9px] font-black uppercase tracking-widest transition-all hover:brightness-125"
                        style={{ background: 'rgba(200,100,0,0.1)', border: '1px solid rgba(200,100,0,0.3)', color: '#c8860a' }}
                      >
                        <Eye className="inline w-3 h-3 mr-1" />
                        Reveal Next Hint
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Functions Reference */
              <div>
                <div className="text-[8px] font-black text-[#c8a050]/40 uppercase tracking-[0.3em] mb-3 pb-1 border-b border-[#a07830]/20">
                  ◆ Detective Script API
                </div>
                <div className="space-y-2">
                  {(md?.available_functions || []).map((fn, i) => (
                    <div key={i} className="px-2 py-1.5" style={{ background: 'rgba(0,0,0,0.3)', borderLeft: '2px solid rgba(160,120,48,0.3)' }}>
                      <code className="text-[10px] text-[#7ab87a] font-mono">{fn}</code>
                    </div>
                  ))}
                </div>
                <div className="mt-4 px-2 py-2 text-[9px] font-mono text-[#c8a050]/40 leading-relaxed"
                  style={{ background: 'rgba(0,0,0,0.2)', borderLeft: '2px solid rgba(160,120,48,0.1)' }}>
                  All functions return <span className="text-[#7ab87a]">string[]</span> unless stated.{'\n'}
                  Use <span className="text-[#f0d070]">print(value)</span> to output results.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── CENTER PANEL: Code Editor ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ borderRight: '2px solid #3a2810' }}>

          {/* Editor header */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 py-2"
            style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(160,120,48,0.2)' }}
          >
            <span className="text-[9px] font-black text-[#c8a050]/40 uppercase tracking-[0.3em]">Detective Script</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setCode(md?.starter_code || ''); playSound('click'); }}
                className="flex items-center gap-1 px-2 py-1 text-[8px] font-black uppercase tracking-widest transition-all hover:bg-white/5"
                style={{ color: 'rgba(200,160,80,0.4)', border: '1px solid rgba(160,120,48,0.2)' }}
                title="Reset to starter code"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Reset
              </button>
            </div>
          </div>

          {/* Code textarea */}
          <div className="flex-1 relative overflow-hidden">
            <textarea
              ref={editorRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              className="absolute inset-0 w-full h-full resize-none custom-scrollbar"
              style={{
                background: '#0d0902',
                color: '#e0c878',
                fontFamily: "'Courier New', 'Consolas', monospace",
                fontSize: '13px',
                lineHeight: '1.7',
                padding: '16px 16px 16px 60px',
                border: 'none',
                outline: 'none',
                tabSize: 2,
              }}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  const newCode = code.substring(0, start) + '  ' + code.substring(end);
                  setCode(newCode);
                  setTimeout(() => {
                    if (editorRef.current) {
                      editorRef.current.selectionStart = start + 2;
                      editorRef.current.selectionEnd = start + 2;
                    }
                  }, 0);
                }
              }}
            />
            {/* Line numbers overlay */}
            <div
              className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none overflow-hidden select-none"
              style={{ background: 'rgba(0,0,0,0.3)', borderRight: '1px solid rgba(160,120,48,0.1)', paddingTop: '16px' }}
            >
              {code.split('\n').map((_, i) => (
                <div key={i} className="text-right pr-2 leading-[22.1px]"
                  style={{ fontSize: '11px', color: 'rgba(200,160,80,0.2)', fontFamily: 'monospace' }}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Run button */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 py-2.5"
            style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(160,120,48,0.2)' }}
          >
            <span className="text-[9px] font-mono text-[#c8a050]/30">{code.split('\n').length} lines</span>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-2.5 font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50"
              style={{
                background: isRunning ? '#2a4020' : 'linear-gradient(to bottom, #3a6a20, #2a5010)',
                border: '2px solid #5a9a30',
                color: '#c0f080',
                boxShadow: isRunning ? 'none' : '0 0 20px rgba(90,154,48,0.3)',
              }}
            >
              {isRunning
                ? <><Activity className="w-4 h-4 animate-spin" /> Executing...</>
                : <><Play className="w-4 h-4" /> Run Code</>
              }
            </motion.button>
          </div>
        </div>

        {/* ── RIGHT PANEL: Output Terminal ── */}
        <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden">

          {/* Terminal header */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 py-2"
            style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(160,120,48,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#c8a050]/50" />
              <span className="text-[9px] font-black text-[#c8a050]/40 uppercase tracking-[0.3em]">MOLT Output Terminal</span>
            </div>
            {output && (
              <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
            )}
          </div>

          {/* Output display */}
          <div
            className="flex-1 overflow-y-auto p-4 custom-scrollbar relative"
            style={{ background: '#080504', fontFamily: "'Courier New', monospace" }}
          >
            {!output && !runError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center opacity-20">
                  <Terminal className="w-10 h-10 text-[#c8a050] mx-auto mb-3" />
                  <div className="text-[10px] font-mono text-[#c8a050] uppercase tracking-widest">
                    Run your code to see output
                  </div>
                </div>
              </div>
            )}

            {runError && (
              <div className="text-red-400 text-xs font-mono leading-relaxed p-3"
                style={{ background: 'rgba(200,50,30,0.1)', border: '1px solid rgba(200,50,30,0.3)' }}>
                <div className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-2">RUNTIME ERROR</div>
                {runError}
              </div>
            )}

            {outputLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="text-xs font-mono leading-relaxed mb-0.5"
                style={{ color: '#7ab87a' }}
              >
                <span style={{ color: 'rgba(200,160,80,0.2)', marginRight: '12px', fontSize: '10px' }}>›</span>
                {line || ' '}
              </motion.div>
            ))}
          </div>

          {/* Submit section */}
          <div
            className="flex-shrink-0 p-4 space-y-3"
            style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(160,120,48,0.2)' }}
          >
            {verdict === 'incorrect' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono"
                style={{ background: 'rgba(200,50,30,0.1)', border: '1px solid rgba(200,50,30,0.3)', color: '#c05030' }}
              >
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                Output mismatch. Refine your logic.
              </motion.div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!output || isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 font-black uppercase tracking-[0.2em] text-sm transition-all disabled:opacity-30"
              style={{
                background: output ? 'linear-gradient(to bottom, #5a3820, #3a2810)' : '#1a1208',
                border: `2px solid ${output ? '#a07830' : '#3a2810'}`,
                color: output ? '#f0d070' : '#5a4020',
                boxShadow: output ? '0 0 20px rgba(160,120,48,0.2)' : 'none',
              }}
            >
              {isSubmitting
                ? <><Activity className="w-4 h-4 animate-spin" /> Validating...</>
                : <><Send className="w-4 h-4" /> Submit Output</>
              }
            </motion.button>

            <p className="text-[8px] font-mono text-[#c8a050]/25 uppercase tracking-widest text-center leading-relaxed">
              Run your code first, then submit the output for scoring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

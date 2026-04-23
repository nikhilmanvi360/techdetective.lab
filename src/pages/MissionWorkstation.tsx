import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Send, ChevronLeft, Activity,
  CheckCircle2, AlertTriangle, Terminal as TerminalIcon, BookOpen, 
  Map as MapIcon, Search, FileText, Share2, Compass, Zap, RefreshCw
} from 'lucide-react';
import { useSound } from '../hooks/useSound';
import { getRankTitle } from '../utils/ranks';
import { io, Socket } from 'socket.io-client';

const DIFFICULTY_CFG: Record<string, { label: string; color: string; border: string }> = {
  Easy:         { label: 'PHASE 1 — RECON',           color: '#4a7c3f', border: '#2a4a20' },
  Intermediate: { label: 'PHASE 2 — EVIDENCE trail',  color: '#c8860a', border: '#5a3a0a' },
  Hard:         { label: 'PHASE 3 — DEEP DIVE',       color: '#8B2020', border: '#4a1010' },
  Expert:       { label: 'PHASE 4 — FINAL protocol',  color: '#7a3aaa', border: '#3a1a5a' },
};

export default function MissionWorkstation() {
  const { id } = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { playSound } = useSound();

  const [mission, setMission]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [code, setCode]             = useState('');
  const [output, setOutput]         = useState('');
  const [trace, setTrace]           = useState<any[]>([]);
  const [runError, setRunError]     = useState<string | null>(null);
  const [isRunning, setIsRunning]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verdict, setVerdict]       = useState<'correct' | 'incorrect' | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [activePanel, setActivePanel] = useState<'brief' | 'functions'>('brief');
  const [socket, setSocket]         = useState<Socket | null>(null);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const team = (() => { try { return JSON.parse(localStorage.getItem('team') || '{}'); } catch { return {}; } })();
  const rankTitle = getRankTitle(team?.score || 0);

  useEffect(() => {
    const s = io(window.location.origin);
    setSocket(s);

    s.on('execution_complete', (data) => {
      if (data.teamId === team.id) {
        setTrace(data.result.trace || []);
        setOutput(data.result.output || '');
        setIsRunning(false);
        playSound('ping');
      }
    });

    s.on('execution_failed', (data) => {
      if (data.teamId === team.id) {
        setRunError(data.error);
        setIsRunning(false);
        playSound('error');
      }
    });

    return () => { s.disconnect(); };
  }, [team.id, playSound]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [trace, output]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/cases/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(data => {
        if (data.id) {
          setMission(data);
          const starter = data.metadata?.starter_code || `// INVESTIGATION REPORT\n`;
          setCode(starter);
        }
      })
      .finally(() => setLoading(false));
  }, [id, playSound]);

  const handleRun = useCallback(async () => {
    if (!id || isRunning) return;
    playSound('click');
    setIsRunning(true);
    setOutput('');
    setTrace([]);
    setRunError(null);

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

      if (res.status === 202) {
        setPendingJobId(data.jobId);
        // Result will arrive via socket
      } else if (data.error) {
        setRunError(data.error);
        playSound('error');
        setIsRunning(false);
      }
    } catch {
      setRunError('Connection lost. The investigation has stalled.');
      playSound('error');
      setIsRunning(false);
    }
  }, [id, code, isRunning, playSound]);

  const handleSubmit = useCallback(async () => {
    if (!id || isSubmitting) return;
    playSound('click');
    setIsSubmitting(true);
    setVerdict(null);
    setRunError(null);

    try {
      // 1. Re-run to get fresh output
      const runRes = await fetch(`/api/missions/${id}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ code }),
      });
      const runData = await runRes.json();
      
      if (runData.error) {
        setRunError(runData.error);
        playSound('error');
        setIsSubmitting(false);
        return;
      }
      
      setTrace(runData.trace || []);
      setOutput(runData.output || '');

      // 2. Submit the resulting output
      const res = await fetch(`/api/missions/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ code, output: runData.output || '' }),
      });
      const data = await res.json();

      if (data.isCorrect) {
        setVerdict('correct');
        setPointsAwarded(data.pointsAwarded);
        playSound('success');
        const updatedTeam = { ...team, score: (team.score || 0) + data.pointsAwarded };
        localStorage.setItem('team', JSON.stringify(updatedTeam));
      } else {
        setVerdict('incorrect');
        playSound('error');
        setTimeout(() => setVerdict(null), 3000);
      }
    } catch (err) {
      setRunError('Critical failure: Report transmission failed.');
      playSound('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, code, isSubmitting, playSound, team]);

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-[#140e06] text-[#f0d070]"><Activity className="w-10 h-10 animate-pulse" /></div>;

  if (verdict === 'correct') return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#140e06] z-[999]">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center p-12 bg-[#f0e0a0] border-[12px] border-[#a07830] shadow-2xl">
        <div className="text-[#a07830] text-7xl mb-6">★ ★ ★</div>
        <h1 className="text-5xl font-black uppercase tracking-widest text-[#2a1a0a] mb-4">Case Cleared</h1>
        <p className="text-3xl font-bold text-[#a07830] mb-8">RANK UP: +{pointsAwarded} XP</p>
        <button onClick={() => navigate('/')} className="px-10 py-4 bg-[#2a1a0a] text-[#f0e0a0] uppercase tracking-widest font-black transition-all hover:bg-[#3d2610]">
          Return to Investigation Board
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#140e06] text-[#f0e0a0]" style={{ fontFamily: "'Georgia', serif" }}>
      {/* ═══ WORKSTATION BODY ═══ */}
      <div className="flex-1 flex min-h-0 bg-[#0c0803]">
        
        {/* ── LEFT PANEL: Brief & Editor ── */}
        <div className="flex-1 flex flex-col border-r-4 border-[#3a2810] relative shadow-2xl">
           
           <div className="flex-shrink-0 flex bg-[#1a0e04] border-b border-[#3a2810]">
             <button onClick={() => setActivePanel('brief')} className={`flex-1 py-3 uppercase font-black tracking-[0.2em] text-[10px] ${activePanel === 'brief' ? 'bg-[#f0e0a0]/10 text-[#f0d070] border-b-2 border-[#d4a017]' : 'text-[#a07830]/50'}`}>
               The Evidence
             </button>
             <button onClick={() => setActivePanel('functions')} className={`flex-1 py-3 uppercase font-black tracking-[0.2em] text-[10px] ${activePanel === 'functions' ? 'bg-[#f0e0a0]/10 text-[#f0d070] border-b-2 border-[#d4a017]' : 'text-[#a07830]/50'}`}>
               Specialized Tools
             </button>
           </div>

           <div className="flex-shrink-0 p-6 bg-[#140e06] border-b border-[#3a2810]">
             {activePanel === 'brief' ? (
                <p className="text-[14px] leading-relaxed text-[#c8a050] italic font-serif">
                   "{mission?.metadata?.brief}"
                </p>
             ) : (
                <div className="flex gap-2 flex-wrap">
                   {(mission?.metadata?.available_functions || []).map((fn: string, i: number) => (
                      <code key={i} className="px-2 py-1 bg-[#f0e0a0]/5 border border-[#c8a050]/20 text-[#f0d070] text-[11px] font-mono">{fn}</code>
                   ))}
                </div>
             )}
           </div>

           <div className="flex-1 relative bg-[#f0e0a0]/95 p-8 shadow-2xl">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }} />
             <textarea
                ref={editorRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                placeholder="Transcribe investigative script..."
                className="w-full h-full resize-none bg-transparent text-[#2a1a0a] focus:outline-none font-mono text-[16px] leading-relaxed"
                style={{ tabSize: 2 }}
             />
             <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-multiply" 
                  style={{ background: 'radial-gradient(circle, transparent 70%, #140e06 100%)' }} />
           </div>

           <div className="flex-shrink-0 flex items-center justify-between px-8 py-5 bg-[#1a0e04] border-t-2 border-[#3a2810]">
             <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-[#a07830] tracking-widest uppercase">{code.length} CHARS</span>
                <button onClick={() => setCode(mission?.metadata?.starter_code || '')} className="text-[#a07830] hover:text-[#f0d070] transition-colors"><RefreshCw className="w-4 h-4" /></button>
             </div>
             <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-3 px-10 py-4 bg-gradient-to-b from-[#a07830] to-[#6a4e1a] border-2 border-[#d4a017] text-[#f0d070] uppercase tracking-[0.2em] font-black transition-all hover:brightness-110 disabled:opacity-50 shadow-xl"
             >
                {isRunning ? <><Activity className="w-5 h-5 animate-spin" /> ANALYZING...</> : <><Play className="w-5 h-5" /> RUN ANALYSIS</>}
             </button>
           </div>
        </div>

        {/* ── RIGHT PANEL: Output Log ── */}
        <div className="w-[450px] flex-shrink-0 flex flex-col bg-[#140e06]">
           
           <div className="flex-1 flex flex-col shadow-inner">
              <div className="flex-shrink-0 p-4 bg-[#1a0e04] border-b border-[#3a2810] flex items-center gap-3 text-[11px] font-black uppercase text-[#a07830] tracking-[0.3em]">
                 <TerminalIcon className="w-4 h-4" /> INVESTIGATION LOG
              </div>
              
              <div ref={terminalRef} className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#0c0803] custom-scrollbar">
                 {!trace?.length && !runError && (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                       <FileText className="w-16 h-16 text-[#a07830] mb-4" />
                       <span className="uppercase text-xs font-black tracking-[0.5em]">Telegraph Standby</span>
                    </div>
                 )}

                 {runError && (
                    <div className="p-4 bg-red-900/15 border-l-4 border-red-700 text-red-500 text-[12px] font-mono leading-relaxed">
                       <strong className="block mb-1 font-black uppercase tracking-widest">⚠️ ERROR</strong>
                       {runError}
                    </div>
                 )}

                 {trace?.map((t: any, i: number) => (
                    <div key={i} className="text-[13px] font-mono flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                       <span className="text-[#a07830] opacity-40 shrink-0">[{t.type.substring(0,4).toUpperCase()}]</span>
                       {t.type === 'move' && <span className="text-[#c8a050]">REPOSITION: {t.target}</span>}
                       {t.type === 'scan' && <span className="text-[#d4a017]">SCAN FOUND: {t.data.ports.length} ADDR</span>}
                       {t.type === 'download' && <span className="text-[#f0d070]">ACQUIRED: "{t.message}"</span>}
                       {t.type === 'print' && <span className="text-[#f0e0a0] brightness-125">{t.message}</span>}
                       {t.type === 'error' && <span className="text-red-500 font-bold">{t.message}</span>}
                    </div>
                 ))}

                 {verdict === 'incorrect' && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-700/50 text-red-400 text-[11px] font-black uppercase tracking-widest text-center">
                       MOLT Report Error: Evidence Mismatch
                    </div>
                 )}
              </div>

              <div className="flex-shrink-0 p-8 border-t-4 border-[#3a2810] bg-[#1a0e04] shadow-2xl">
                 <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-4 py-5 bg-[#2a1a0a] border-2 border-[#a07830] text-[#f0d070] uppercase tracking-[0.3em] font-black transition-all hover:bg-[#3d2610] disabled:opacity-30 shadow-lg group"
                 >
                    {isSubmitting ? <><Activity className="w-5 h-5 animate-spin" /> FILING REPORT...</> : <><Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> SUBMIT EVIDENCE</>}
                 </button>
              </div>
           </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0c0803;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3a2810;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a07830;
        }
      `}</style>
    </div>
  );
}

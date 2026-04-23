import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Play, Send, ChevronLeft, Activity,
  CheckCircle2, AlertTriangle, Terminal as TerminalIcon, BookOpen, Server, Database, Router, Check, Zap, Map
} from 'lucide-react';
import { useSound } from '../hooks/useSound';
import { getRankTitle } from '../utils/ranks';

const DIFFICULTY_CFG: Record<string, { label: string; color: string; border: string }> = {
  Easy:         { label: 'PHASE 1 — RECON',           color: '#4a7c3f', border: '#2a4a20' },
  Intermediate: { label: 'PHASE 2 — EVIDENCE',        color: '#c8860a', border: '#5a3a0a' },
  Hard:         { label: 'PHASE 3 — DEEP DIVE',       color: '#8B2020', border: '#4a1010' },
  Expert:       { label: 'PHASE 4 — FINAL',           color: '#7a3aaa', border: '#3a1a5a' },
};

function NodeIcon({ type }: { type: string }) {
  if (type === 'router') return <Router className="w-6 h-6 text-blue-400" />;
  if (type === 'database') return <Database className="w-6 h-6 text-purple-400" />;
  return <Server className="w-6 h-6 text-green-400" />;
}

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
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const team = (() => { try { return JSON.parse(localStorage.getItem('team') || '{}'); } catch { return {}; } })();
  const rankTitle = getRankTitle(team?.score || 0);

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
          const starter = data.metadata?.starter_code || `// YOUR CODE HERE\n`;
          setCode(starter);
          setActiveNodeId(data.metadata?.network_topology?.start_node || null);
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
    setActiveNodeId(mission?.metadata?.network_topology?.start_node || null);

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
        setTrace(data.trace || []);
        setOutput(data.output || '');
        
        // Playback trace for visualizer
        if (data.trace && data.trace.length > 0) {
           let i = 0;
           const interval = setInterval(() => {
              if (i >= data.trace.length) {
                 clearInterval(interval);
                 playSound('ping');
                 return;
              }
              const step = data.trace[i];
              if (step.type === 'move' || step.type === 'start') {
                 setActiveNodeId(step.target);
              } else if (step.type === 'scan') {
                 playSound('click');
              }
              i++;
           }, 300); // 300ms per step animation
        } else {
           playSound('ping');
        }
      }
    } catch {
      setRunError('Network error — lost contact with execution node.');
      playSound('error');
    } finally {
      setIsRunning(false);
    }
  }, [id, code, isRunning, playSound, mission]);

  const handleSubmit = useCallback(async () => {
    if (!id || isSubmitting) return;
    playSound('click');
    setIsSubmitting(true);
    setVerdict(null);
    setRunError(null);

    try {
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
    } catch {
      setRunError('Validation system offline.');
      playSound('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, code, isSubmitting, playSound, team]);

  const md = mission?.metadata;
  const topology = md?.network_topology;

  if (loading) return <div className="fixed inset-0 flex items-center justify-center bg-[#050505]"><Activity className="w-10 h-10 text-green-500 animate-spin" /></div>;

  if (verdict === 'correct') return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#050505] text-green-500">
      <div className="text-center">
        <CheckCircle2 className="w-24 h-24 mx-auto mb-4" />
        <h1 className="text-4xl font-black uppercase tracking-widest mb-4">Node Secured</h1>
        <p className="text-2xl mb-8">+{pointsAwarded} XP</p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-green-900 border border-green-500 text-green-100 uppercase tracking-widest font-black transition-all hover:bg-green-800">
          Return to Hub
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#0a0a0a] text-[#4ade80]" style={{ fontFamily: "'Courier New', monospace" }}>
      {/* ═══ HEADER ═══ */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 h-12 border-b border-green-900/50 bg-[#050505]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 px-2 py-1 hover:bg-green-900/30 transition-colors">
            <ChevronLeft className="w-4 h-4 text-green-500" /> Back
          </button>
          <div className="w-px h-5 bg-green-900/50" />
          <span className="font-black tracking-widest">NETWORK WALKER: Mission #{mission?.id}</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-black tracking-widest">
           <span>{team?.name || 'Agent'}</span>
           <span className="text-green-700">|</span>
           <span>XP: {team?.score || 0}</span>
           <span className="text-green-700">|</span>
           <span className="text-green-400">Reward: {mission?.points_on_solve}</span>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        
        {/* ── LEFT PANEL: Code Editor ── */}
        <div className="flex-1 flex flex-col border-r border-green-900/50 relative">
           
           <div className="flex-shrink-0 flex border-b border-green-900/50 bg-[#050505]">
             <button onClick={() => setActivePanel('brief')} className={\`flex-1 py-2 uppercase font-black tracking-widest text-xs \${activePanel === 'brief' ? 'bg-green-900/30 text-green-300 border-b-2 border-green-500' : 'text-green-800'}\`}>
               Mission Brief
             </button>
             <button onClick={() => setActivePanel('functions')} className={\`flex-1 py-2 uppercase font-black tracking-widest text-xs \${activePanel === 'functions' ? 'bg-green-900/30 text-green-300 border-b-2 border-green-500' : 'text-green-800'}\`}>
               Drone API Docs
             </button>
           </div>

           {activePanel === 'brief' ? (
             <div className="p-4 text-sm leading-relaxed text-green-400/80 bg-[#020202] border-b border-green-900/50 min-h-[100px]">
                <strong className="block mb-2 text-green-300">Objective: {mission?.title}</strong>
                {md?.brief}
             </div>
           ) : (
             <div className="p-4 text-xs bg-[#020202] border-b border-green-900/50 min-h-[100px] flex gap-2 flex-wrap">
                {(md?.available_functions || []).map((fn: string, i: number) => (
                   <span key={i} className="px-2 py-1 bg-green-900/20 border border-green-900 text-green-300 rounded whitespace-nowrap">{fn}</span>
                ))}
             </div>
           )}

           <div className="flex-1 relative">
             <textarea
                ref={editorRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                readOnly={mission?.isCompleted}
                className="absolute inset-0 w-full h-full resize-none p-4 pb-16 bg-[#030303] text-green-400 focus:outline-none"
                style={{ tabSize: 2, textShadow: '0 0 5px rgba(74,222,128,0.2)' }}
             />
             
             {/* Scanlines overlay */}
             <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-10"
                style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.8) 50%)', backgroundSize: '100% 4px' }} />
           </div>

           <div className="flex-shrink-0 flex items-center justify-between p-3 bg-[#050505] border-t border-green-900/50">
             <span className="text-xs text-green-700">{code.split('\\n').length} lines</span>
             <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-2 px-6 py-2 bg-green-900 border-2 border-green-500 text-green-100 uppercase tracking-widest font-black transition-all hover:bg-green-800 disabled:opacity-50"
             >
                {isRunning ? <><Activity className="w-4 h-4 animate-spin" /> EXECUTING</> : <><Play className="w-4 h-4" /> INJECT CODE</>}
             </button>
           </div>
        </div>

        {/* ── RIGHT PANEL: Visualizer & Terminal ── */}
        <div className="w-[500px] flex-shrink-0 flex flex-col bg-[#050505]">
           
           {/* Visualizer Canvas */}
           <div className="h-64 border-b border-green-900/50 relative overflow-hidden flex items-center justify-center p-8 bg-[#020302]">
              <div className="absolute top-2 left-2 flex items-center gap-2 text-[10px] uppercase font-black text-green-700 tracking-widest">
                 <Map className="w-3 h-3" /> Network Topology
              </div>
              
              <div className="flex items-center justify-center gap-12 w-full">
                 {topology?.network?.map((node: any, i: number) => {
                    const isActive = activeNodeId === node.id;
                    return (
                       <div key={node.id} className="relative flex flex-col items-center">
                          {/* Connection Line to next node (simple flat map assumption) */}
                          {i < topology.network.length - 1 && (
                             <div className="absolute top-6 left-12 w-12 h-0.5 bg-green-900" />
                          )}
                          
                          <motion.div 
                             animate={{ 
                               scale: isActive ? 1.1 : 1,
                               borderColor: isActive ? '#4ade80' : '#14532d',
                               boxShadow: isActive ? '0 0 20px rgba(74,222,128,0.4)' : 'none'
                             }}
                             className="w-12 h-12 rounded bg-[#0a0a0a] border-2 flex items-center justify-center z-10 transition-colors"
                          >
                             <NodeIcon type={node.type} />
                          </motion.div>
                          <span className={\`mt-2 text-[10px] font-black \${isActive ? 'text-green-400' : 'text-green-800'}\`}>{node.id}</span>
                          <span className="text-[9px] text-green-900 uppercase">[{node.type}]</span>
                       </div>
                    );
                 })}
              </div>
           </div>

           {/* Terminal */}
           <div className="flex-1 flex flex-col">
              <div className="flex-shrink-0 p-2 bg-[#020202] border-b border-green-900/50 flex items-center gap-2 text-xs font-black uppercase text-green-600 tracking-widest">
                 <TerminalIcon className="w-3.5 h-3.5" /> Drone Telemetry output
              </div>
              
              <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#050505]">
                 {!trace?.length && !runError && (
                    <div className="h-full flex items-center justify-center text-green-900 opacity-50 uppercase text-xs font-black tracking-widest">
                       Standing By
                    </div>
                 )}

                 {runError && (
                    <div className="text-red-500 text-xs p-2 bg-red-900/20 border border-red-900/50">
                       <strong className="block mb-1 font-black">CRITICAL FAILURE:</strong>
                       {runError}
                    </div>
                 )}

                 {trace?.map((t: any, i: number) => (
                    <div key={i} className="text-xs">
                       <span className="text-green-700 mr-2 opacity-50">[{t.type.toUpperCase()}]</span>
                       {t.type === 'move' && <span className="text-blue-400">Jumping to {t.target}...</span>}
                       {t.type === 'scan' && <span className="text-yellow-400">Scanning {t.target} {JSON.stringify(t.data.ports)}</span>}
                       {t.type === 'download' && <span className="text-purple-400">Extracting {t.message} from {t.target}</span>}
                       {t.type === 'print' && <span className="text-green-300">{t.message}</span>}
                       {t.type === 'error' && <span className="text-red-400">{t.message}</span>}
                    </div>
                 ))}
              </div>

              <div className="flex-shrink-0 p-4 border-t border-green-900/50 bg-[#020202]">
                 <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !trace?.length}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-950 border border-green-700 text-green-400 uppercase tracking-[0.2em] font-black transition-all hover:bg-green-900 disabled:opacity-30 disabled:border-green-900"
                 >
                    {isSubmitting ? <><Activity className="w-4 h-4 animate-spin" /> Verifying Payload...</> : <><Send className="w-4 h-4" /> Verify Evidence</>}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

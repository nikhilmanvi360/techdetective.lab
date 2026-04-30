import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { Activity, Trophy, ArrowLeft, Terminal } from 'lucide-react';
import { useSound } from '../hooks/useSound';
import { useMissionFiles } from '../hooks/useMissionFiles';

// Specialized Components
import WorkstationTopBar from '../components/workstation/WorkstationTopBar';
import InstructionsPane from '../components/workstation/InstructionsPane';
import CodeEditorPane from '../components/workstation/CodeEditorPane';
import TerminalPane from '../components/workstation/TerminalPane';

export default function MissionWorkstation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playSound } = useSound();

  const [mission, setMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [output, setOutput] = useState('');
  const [trace, setTrace] = useState<any[]>([]);
  const [runError, setRunError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<'correct' | 'incorrect' | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [activePanel, setActivePanel] = useState<'brief' | 'functions'>('brief');
  const [activeView, setActiveView] = useState<'terminal' | 'preview'>('terminal');
  const [socket, setSocket] = useState<Socket | null>(null);

  const { 
    files, 
    activeFile, 
    activeFileIndex, 
    setActiveFileIndex, 
    updateActiveFileContent, 
    setFiles 
  } = useMissionFiles([]);

  const team = useMemo(() => { 
    try { return JSON.parse(localStorage.getItem('team') || '{}'); } catch { return {}; } 
  }, []);

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
    if (!id) return;
    fetch(`/api/cases/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(data => {
        if (data.id) {
          setMission(data);
          const initialFiles = data.metadata?.files || [
            { name: 'main.py', language: 'python', content: data.metadata?.starter_code || '' }
          ];
          setFiles(initialFiles);
        }
      })
      .finally(() => setLoading(false));
  }, [id, setFiles]);

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
        body: JSON.stringify({ 
          code: activeFile?.content || '',
          fileName: activeFile.name,
          allFiles: files 
        }),
      });
      const data = await res.json();

      if (data.error) {
        setRunError(data.error);
        playSound('error');
        setIsRunning(false);
      }
    } catch {
      setRunError('Connection lost. The investigation has stalled.');
      playSound('error');
      setIsRunning(false);
    }
  }, [id, activeFile, files, isRunning, playSound]);

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
        body: JSON.stringify({ 
          code: activeFile?.content || '',
          fileName: activeFile.name,
          allFiles: files 
        }),
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
        body: JSON.stringify({ 
          code: activeFile?.content || '', 
          output: runData.output || '',
          allFiles: files
        }),
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
  }, [id, activeFile, files, isSubmitting, playSound, team]);

  const previewContent = useMemo(() => {
    const htmlFile = files.find(f => f.language === 'html');
    const cssFile = files.find(f => f.language === 'css');
    if (!htmlFile) return activeFile?.content || '';
    
    return `
      <html>
        <head><style>${cssFile?.content || ''}</style></head>
        <body style="margin:0;padding:20px;font-family:sans-serif;">${htmlFile.content}</body>
      </html>
    `;
  }, [files, activeFile]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0c0e0b] text-[#d4a017]">
      <Activity className="w-12 h-12 animate-pulse" />
    </div>
  );

  if (verdict === 'correct') return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-[999] backdrop-blur-xl">
      <div className="scanline opacity-10" />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="max-w-lg w-full glass-panel p-1 border-2 border-[#d4a017]/30"
      >
        <div className="bg-[#0c0e0b] p-12 border border-[#d4a017]/10 text-center space-y-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#d4a017]/10 border-2 border-[#d4a017] shadow-[0_0_30px_rgba(212,160,23,0.3)]">
            <Trophy className="w-12 h-12 text-[#d4a017]" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-black uppercase tracking-tighter text-glow text-[#f5e6c8]">Case Cleared</h1>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <span className="text-[10px] font-mono font-black text-cyber-green uppercase tracking-[0.4em]">Intel_Verified_Success</span>
            </div>
          </div>

          <div className="py-6 border-y border-[#3a2810]">
            <p className="text-3xl font-black text-[#d4a017] tracking-widest">+{pointsAwarded} XP</p>
            <p className="text-[9px] font-mono text-[#a07830] uppercase tracking-[0.3em] mt-2">Rank Up Sequence Initiated</p>
          </div>

          <button 
            onClick={() => navigate('/')} 
            className="detective-button w-full"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Command Board
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0c0e0b] text-[#f5e6c8]">
      <div className="scanline opacity-5" />
      
      <WorkstationTopBar 
        missionTitle={mission?.title || 'Unknown Case'} 
        navigatePath="/" 
      />

      <div className="flex-1 flex min-h-0 relative z-10">
        <InstructionsPane 
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          missionBrief={mission?.metadata?.brief}
          availableFunctions={mission?.metadata?.available_functions || []}
        />

        <div className="flex-1 flex flex-col min-w-0 border-l border-[#3a2810]">
          <CodeEditorPane 
            files={files}
            activeFileIndex={activeFileIndex}
            setActiveFileIndex={setActiveFileIndex}
            onContentChange={updateActiveFileContent}
            onRun={handleRun}
            onSubmit={handleSubmit}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
            onReset={() => updateActiveFileContent(mission?.metadata?.starter_code || '')}
          />

          <TerminalPane 
            trace={trace}
            runError={runError}
            verdict={verdict}
            activeView={activeView}
            setActiveView={setActiveView}
            htmlContent={previewContent}
          />
        </div>
      </div>
    </div>
  );
}


import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';
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
          // Core Idea: Initialize multi-file structure based on mission type
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
    if (!htmlFile) return activeFile?.content || ''; // fallback
    
    return `
      <html>
        <head><style>${cssFile?.content || ''}</style></head>
        <body>${htmlFile.content}</body>
      </html>
    `;
  }, [files, activeFile]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#140e06] text-[#f0d070]">
      <Activity className="w-10 h-10 animate-pulse" />
    </div>
  );

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

  // Core Idea: Bundle HTML/CSS for live preview

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#140e06] text-[#f0e0a0]" style={{ fontFamily: "'Georgia', serif" }}>
      
      <WorkstationTopBar 
        missionTitle={mission?.title || 'Unknown Case'} 
        navigatePath="/" 
      />

      <div className="flex-1 flex min-h-0 bg-[#0c0803]">
        
        <InstructionsPane 
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          missionBrief={mission?.metadata?.brief}
          availableFunctions={mission?.metadata?.available_functions || []}
        />

        <div className="flex-1 flex flex-col bg-[#140e06] min-w-0">
          
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

function Activity({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}

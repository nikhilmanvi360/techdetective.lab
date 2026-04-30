import { Terminal as TerminalIcon, Monitor, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface TerminalPaneProps {
  trace: any[];
  runError: string | null;
  verdict: 'correct' | 'incorrect' | null;
  activeView: 'terminal' | 'preview';
  setActiveView: (view: 'terminal' | 'preview') => void;
  htmlContent?: string;
}

export default function TerminalPane({
  trace,
  runError,
  verdict,
  activeView,
  setActiveView,
  htmlContent
}: TerminalPaneProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [trace]);

  return (
    <div className="h-[300px] flex-shrink-0 flex flex-col bg-black relative border-t-2 border-[#3a2810]">
      {/* Terminal Header */}
      <div className="flex-shrink-0 px-6 py-2 bg-[#0c0e0b] border-b border-[#3a2810] flex items-center justify-between relative z-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveView('terminal')}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative py-1 ${
              activeView === 'terminal' ? 'text-[#f5e6c8]' : 'text-[#a07830]/40 hover:text-[#a07830]'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" /> Output_Stream
            {activeView === 'terminal' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4a017]" />
            )}
          </button>
          <button 
            onClick={() => setActiveView('preview')}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative py-1 ${
              activeView === 'preview' ? 'text-[#f5e6c8]' : 'text-[#a07830]/40 hover:text-[#a07830]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> Live_Evidence
            {activeView === 'preview' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyber-green" />
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-[8px] font-mono font-black text-cyber-green/60 uppercase tracking-widest">Sys_Status: Online</span>
        </div>
      </div>
      
      {/* Terminal Body */}
      <div className="flex-1 overflow-hidden relative">
        <div className="scanline opacity-10" />
        
        {activeView === 'terminal' ? (
          <div ref={terminalRef} className="h-full overflow-y-auto p-6 space-y-3 font-mono custom-scrollbar bg-black/40">
            {!trace?.length && !runError && (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <TerminalIcon className="w-12 h-12 text-[#a07830] mb-4" />
                <span className="uppercase text-[9px] font-black tracking-[0.5em] text-[#a07830]">Waiting for process execution...</span>
              </div>
            )}

            {runError && (
              <div className="p-4 bg-red-950/20 border border-red-500/30 text-red-500 text-[11px] font-mono leading-relaxed flex gap-4">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <strong className="block mb-1 font-black uppercase tracking-[0.2em]">Execution_Failure</strong>
                  {runError}
                </div>
              </div>
            )}

            {trace?.map((t: any, i: number) => (
              <div key={i} className="text-[12px] flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <ChevronRight className="w-3 h-3 mt-0.5 text-[#d4a017]/40 shrink-0" />
                <div className="flex-1">
                  <span className="text-[#a07830] opacity-50 mr-3">[{t.type.toUpperCase()}]</span>
                  <span className={`
                    ${t.type === 'error' ? 'text-red-500 font-bold' : ''}
                    ${t.type === 'print' ? 'text-[#f5e6c8] brightness-110' : ''}
                    ${t.type === 'move' ? 'text-cyber-green' : ''}
                    ${t.type === 'scan' ? 'text-[#d4a017]' : ''}
                    ${t.type === 'download' ? 'text-blue-400' : ''}
                    ${!['error', 'print', 'move', 'scan', 'download'].includes(t.type) ? 'text-[#a07830]' : ''}
                  `}>
                    {t.message || JSON.stringify(t.data || {})}
                  </span>
                </div>
              </div>
            ))}

            {verdict === 'incorrect' && (
              <div className="p-3 bg-red-950/30 border border-red-500/50 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] text-center mt-4">
                MOLT_REJECTED: EVIDENCE_MISMATCH_DETECTED
              </div>
            )}
            
            {verdict === 'correct' && (
              <div className="p-3 bg-green-950/30 border border-green-500/50 text-cyber-green text-[10px] font-black uppercase tracking-[0.2em] text-center mt-4 flex items-center justify-center gap-3">
                <CheckCircle2 className="w-4 h-4" /> MOLT_ACCEPTED: EVIDENCE_VERIFIED
              </div>
            )}
          </div>
        ) : (
          <div className="h-full bg-[#111] p-2">
            <div className="h-full bg-white rounded overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <iframe 
                srcDoc={htmlContent || '<html><body style="background:#0c0e0b;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#a07830;text-transform:uppercase;font-size:12px;letter-spacing:4px">Waiting for render...</body></html>'}
                className="w-full h-full border-none"
                title="Evidence Preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


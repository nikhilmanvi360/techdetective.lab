import { Terminal as TerminalIcon, FileText, Monitor } from 'lucide-react';
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
    <div className="h-[300px] flex-shrink-0 flex flex-col shadow-inner bg-[#0c0803]">
      <div className="flex-shrink-0 px-4 py-2 bg-[#1a0e04] border-b border-[#3a2810] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveView('terminal')}
            className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${activeView === 'terminal' ? 'text-[#f0d070]' : 'text-[#a07830]/50 hover:text-[#a07830]'}`}
          >
            <TerminalIcon className="w-4 h-4" /> Investigation Log
          </button>
          <button 
            onClick={() => setActiveView('preview')}
            className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${activeView === 'preview' ? 'text-[#f0d070]' : 'text-[#a07830]/50 hover:text-[#a07830]'}`}
          >
            <Monitor className="w-4 h-4" /> Live Evidence
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {activeView === 'terminal' ? (
          <div ref={terminalRef} className="h-full overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {!trace?.length && !runError && (
              <div className="h-full flex flex-col items-center justify-center opacity-10">
                <FileText className="w-12 h-12 text-[#a07830] mb-3" />
                <span className="uppercase text-xs font-black tracking-[0.5em]">Telegraph Standby</span>
              </div>
            )}

            {runError && (
              <div className="p-3 bg-red-900/15 border-l-4 border-red-700 text-red-500 text-[12px] font-mono leading-relaxed">
                <strong className="block mb-1 font-black uppercase tracking-widest">⚠️ ERROR</strong>
                {runError}
              </div>
            )}

            {trace?.map((t: any, i: number) => (
              <div key={i} className="text-[12px] font-mono flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-[#a07830] opacity-40 shrink-0">[{t.type.substring(0,4).toUpperCase()}]</span>
                {t.type === 'move' && <span className="text-[#c8a050]">REPOSITION: {t.target}</span>}
                {t.type === 'scan' && <span className="text-[#d4a017]">SCAN FOUND: {t.data.ports.length} ADDR</span>}
                {t.type === 'download' && <span className="text-[#f0d070]">ACQUIRED: "{t.message}"</span>}
                {t.type === 'print' && <span className="text-[#f0e0a0] brightness-125">{t.message}</span>}
                {t.type === 'error' && <span className="text-red-500 font-bold">{t.message}</span>}
              </div>
            ))}

            {verdict === 'incorrect' && (
              <div className="mt-3 p-2 bg-red-900/20 border border-red-700/50 text-red-400 text-[11px] font-black uppercase tracking-widest text-center">
                MOLT Report Error: Evidence Mismatch
              </div>
            )}
          </div>
        ) : (
          <div className="h-full bg-white">
            <iframe 
              srcDoc={htmlContent || '<html><body style="background:#f0e0a0;display:flex;align-items:center;justify-center;height:100vh;font-family:serif;color:#2a1a0a">No visual evidence available yet.</body></html>'}
              className="w-full h-full border-none"
              title="Evidence Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}

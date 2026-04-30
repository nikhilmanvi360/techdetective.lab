import Editor from '@monaco-editor/react';
import { RefreshCw, Play, Send, Activity, FileCode, Cpu, Terminal } from 'lucide-react';

interface FileData {
  name: string;
  language: string;
  content: string;
}

interface CodeEditorPaneProps {
  files: FileData[];
  activeFileIndex: number;
  setActiveFileIndex: (index: number) => void;
  onContentChange: (content: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
  onReset: () => void;
}

export default function CodeEditorPane({
  files,
  activeFileIndex,
  setActiveFileIndex,
  onContentChange,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  onReset
}: CodeEditorPaneProps) {
  const activeFile = files[activeFileIndex];

  return (
    <div className="flex-1 flex flex-col border-b-2 border-[#3a2810] relative min-h-0 bg-[#0c0e0b]">
      {/* Tab Bar */}
      <div className="flex-shrink-0 h-10 flex items-center bg-black/40 border-b border-[#3a2810] overflow-x-auto custom-scrollbar">
        {files.map((file, idx) => (
          <button
            key={file.name}
            onClick={() => setActiveFileIndex(idx)}
            className={`h-full px-5 flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase transition-all border-r border-[#3a2810] relative overflow-hidden ${
              idx === activeFileIndex 
                ? 'bg-[#0c0e0b] text-[#f5e6c8]' 
                : 'text-[#a07830]/40 hover:bg-white/5 hover:text-[#a07830]'
            }`}
          >
            {idx === activeFileIndex && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-[#d4a017] shadow-[0_0_10px_rgba(212,160,23,0.5)]" />
            )}
            <FileCode className={`w-3.5 h-3.5 ${idx === activeFileIndex ? 'text-[#d4a017]' : 'text-[#a07830]/40'}`} />
            {file.name}
          </button>
        ))}
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-4 px-4 h-full border-l border-[#3a2810]">
          <span className="text-[9px] font-mono font-black text-[#a07830]/60 uppercase tracking-[0.2em]">{activeFile?.content.length || 0} bytes</span>
          <button onClick={onReset} className="text-[#a07830] hover:text-[#d4a017] transition-all hover:rotate-180 duration-500" title="Purge Local Buffer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="flex-1 relative bg-black/20 overflow-hidden flex flex-col">
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1 bg-black/60 border border-[#3a2810] rounded backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-[8px] font-mono font-black text-[#a07830] uppercase tracking-widest">Compiler_Linked</span>
        </div>

        <Editor
          height="100%"
          language={activeFile?.language || 'python'}
          theme="vs-dark"
          value={activeFile?.content || ''}
          onChange={(value) => onContentChange(value || '')}
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 20, bottom: 20 },
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            fontLigatures: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
          }}
        />
        
        {/* Actions Tray */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-[#0c0e0b]/90 border-t border-[#3a2810] relative z-10">
          <div className="flex items-center gap-4 text-[9px] font-mono font-black text-[#a07830] uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Cpu className="w-3 h-3" />
              <span>Mem: 12.4MB</span>
            </div>
            <div className="w-px h-3 bg-[#3a2810]" />
            <div className="flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              <span>PID: 8842</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onRun}
              disabled={isRunning}
              className="detective-button !bg-black/60 !border-[#3a2810] hover:!border-[#d4a017] !px-8 !py-2.5 !text-[10px]"
            >
              {isRunning ? <><Activity className="w-4 h-4 animate-spin" /> EXECUTING...</> : <><Play className="w-3.5 h-3.5" /> RUN_SCRIPT</>}
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="detective-button !px-8 !py-2.5 !text-[10px] shadow-[0_0_20px_rgba(212,160,23,0.15)]"
            >
              {isSubmitting ? <><Activity className="w-4 h-4 animate-spin" /> TRANSMITTING...</> : <><Send className="w-3.5 h-3.5" /> SUBMIT_INTEL</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


import Editor from '@monaco-editor/react';
import { Code, RefreshCw, Play, Send, Activity, FileCode } from 'lucide-react';

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
    <div className="flex-1 flex flex-col border-b-4 border-[#3a2810] relative min-h-0">
      {/* Tab Bar */}
      <div className="flex-shrink-0 flex items-center bg-[#1a0e04] border-b border-[#3a2810] overflow-x-auto custom-scrollbar">
        {files.map((file, idx) => (
          <button
            key={file.name}
            onClick={() => setActiveFileIndex(idx)}
            className={`px-4 py-2 flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase transition-all border-r border-[#3a2810] ${
              idx === activeFileIndex 
                ? 'bg-[#0c0803] text-[#f0d070] border-t-2 border-t-[#d4a017]' 
                : 'text-[#a07830]/50 hover:bg-[#0c0803]/50 hover:text-[#a07830]'
            }`}
          >
            <FileCode className="w-3 h-3" />
            {file.name}
          </button>
        ))}
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-4 px-4">
          <span className="text-[10px] font-mono text-[#a07830] tracking-widest uppercase">{activeFile?.content.length || 0} CHARS</span>
          <button onClick={onReset} className="text-[#a07830] hover:text-[#f0d070] transition-colors" title="Reset Current File">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-[#0c0803] overflow-hidden flex flex-col">
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
            padding: { top: 16, bottom: 16 },
            lineNumbers: 'on',
            renderLineHighlight: 'all',
          }}
        />
        
        <div className="flex-shrink-0 flex justify-end gap-3 p-3 bg-[#1a0e04]/80 border-t border-[#a07830]/30 relative z-10 backdrop-blur-sm">
          <button
            onClick={onRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-2 bg-[#2a1a0a] border border-[#a07830] text-[#f0d070] text-[12px] uppercase tracking-[0.1em] font-black transition-all hover:bg-[#3d2610] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isRunning ? <><Activity className="w-4 h-4 animate-spin" /> ANALYZING</> : <><Play className="w-4 h-4" /> RUN</>}
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-b from-[#a07830] to-[#6a4e1a] border border-[#d4a017] text-[#f0e0a0] text-[12px] uppercase tracking-[0.1em] font-black transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
          >
            {isSubmitting ? <><Activity className="w-4 h-4 animate-spin" /> SUBMITTING</> : <><Send className="w-4 h-4" /> SUBMIT EVIDENCE</>}
          </button>
        </div>
      </div>
    </div>
  );
}

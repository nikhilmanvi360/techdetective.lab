import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal } from 'lucide-react';
import { TileInteraction } from '../../data/campaignData';

interface TerminalPuzzlePanelProps {
  interaction: TileInteraction | null;
  onSuccess: () => void;
  onClose: () => void;
}

export default function TerminalPuzzlePanel({ interaction, onSuccess, onClose }: TerminalPuzzlePanelProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ text: string; isError: boolean }[]>([]);
  const [solved, setSolved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = interaction && interaction.terminalCmd && !solved;

  useEffect(() => {
    if (isActive) {
      setHistory([{ text: interaction.terminalContext || 'SYSTEM TERMINAL v2.4. Awaiting input...', isError: false }]);
      setInput('');
      setSolved(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isActive, interaction]);

  if (!isActive) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim();
    const newHistory = [...history, { text: `> ${cmd}`, isError: false }];

    if (cmd === interaction.terminalCmd) {
      newHistory.push({ text: 'COMMAND ACCEPTED. BYPASS SUCCESSFUL.', isError: false });
      setHistory(newHistory);
      setSolved(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      newHistory.push({ text: 'ERROR: INVALID COMMAND OR SYNTAX.', isError: true });
      setHistory(newHistory);
    }
    setInput('');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <div className="w-full max-w-2xl bg-[#0a0f0a] border-2 border-[#1f4d29] shadow-[0_0_30px_rgba(31,77,41,0.5)] rounded-lg overflow-hidden flex flex-col h-[60vh] font-mono">
          {/* Header */}
          <div className="bg-[#1f4d29] text-[#0a0f0a] px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Terminal className="w-4 h-4" />
              <span>{interaction.speaker || 'TERMINAL INTERFACE'}</span>
            </div>
            <button onClick={onClose} className="hover:text-red-900 transition-colors">
              [X] CLOSE
            </button>
          </div>

          {/* Terminal Area */}
          <div className="flex-1 p-6 overflow-y-auto text-[#4ade80] text-sm flex flex-col">
            {history.map((line, i) => (
              <div key={i} className={`mb-1 ${line.isError ? 'text-red-500' : ''}`}>
                {line.text}
              </div>
            ))}
            
            {!solved && (
              <form onSubmit={handleSubmit} className="mt-2 flex items-center">
                <span className="mr-2">{'>'}</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[#4ade80]"
                  spellCheck={false}
                  autoComplete="off"
                />
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

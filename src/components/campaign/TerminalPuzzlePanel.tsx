import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCampaign } from '../../engine/campaignStore';
import { Terminal } from 'lucide-react';
import { TileInteraction } from '../../data/campaignData';

interface TerminalPuzzlePanelProps {
  interaction: TileInteraction | null;
  onSuccess: () => void;
  onClose: () => void;
}

export default function TerminalPuzzlePanel({ interaction, onSuccess, onClose }: TerminalPuzzlePanelProps) {
  const { dispatch } = useCampaign();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ text: string; isError: boolean }[]>([]);
  const [solved, setSolved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [hintLevel, setHintLevel] = useState(0); // 0: None, 1: Nudge, 2: Clue, 3: Solution
  const [hintTimer, setHintTimer] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = interaction && interaction.terminalCmd && !solved;

  useEffect(() => {
    if (isActive) {
      setHistory([{ text: interaction.terminalContext || 'SYSTEM TERMINAL v2.4. Awaiting input...', isError: false }]);
      setInput('');
      setSolved(false);
      setAttempts(0);
      setLockoutTime(0);
      setHintLevel(0);
      setHintTimer(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isActive, interaction]);

  // Lockout & Hint timer
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => setLockoutTime(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (hintTimer > 0) {
      const timer = setTimeout(() => setHintTimer(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTime, hintTimer]);

  if (!isActive) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || lockoutTime > 0) return;

    const cmd = input.trim();
    const newHistory = [...history, { text: `> ${cmd}`, isError: false }];

    if (cmd === interaction.terminalCmd) {
      newHistory.push({ text: 'COMMAND ACCEPTED. BYPASS SUCCESSFUL.', isError: false });
      dispatch({ type: 'UPDATE_SCORE', delta: 200 });
      setHistory(newHistory);
      setSolved(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      // Check for partials
      const partial = interaction.terminalPartials?.find(p => cmd.toLowerCase().includes(p.trigger.toLowerCase()));
      if (partial) {
        newHistory.push({ text: `PARTIAL MATCH: ${partial.response}`, isError: false });
        dispatch({ type: 'UPDATE_SCORE', delta: 25 });
        setHistory(newHistory);
        setInput('');
        return;
      }

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      dispatch({ type: 'RECORD_FAILURE' });
      if (newAttempts >= 3) {
        newHistory.push({ text: 'SECURITY LOCKOUT INITIATED. TRY AGAIN IN 10 SECONDS.', isError: true });
        setLockoutTime(10);
        setAttempts(0);
      } else {
        newHistory.push({ text: `ERROR: INVALID COMMAND OR SYNTAX. (${3 - newAttempts} attempts remaining)`, isError: true });
      }
      setHistory(newHistory);
    }
    setInput('');
  };

  const handleRequestHint = () => {
    if (hintLevel === 0) {
      setHintLevel(1);
      dispatch({ type: 'RECORD_HINT', level: 1 });
      setHistory([...history, { text: `HINT (Small Nudge): ${interaction.terminalNudge || 'There is evidence nearby that you haven\'t fully examined.'}`, isError: false }]);
      setHintTimer(3); 
    } else if (hintLevel === 1 && hintTimer === 0) {
      setHintLevel(2);
      dispatch({ type: 'RECORD_HINT', level: 2 });
      setHistory([...history, { text: `HINT (Stronger Clue): ${interaction.terminalHint || 'Look closely at your collected evidence.'}`, isError: false }]);
      setHintTimer(7); 
    } else if (hintLevel === 2 && hintTimer === 0) {
      setHintLevel(3);
      dispatch({ type: 'RECORD_HINT', level: 3 });
      setHistory([...history, { text: `HINT (Solution): The exact command is "${interaction.terminalCmd}"`, isError: false }]);
    }
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Terminal className="w-4 h-4" />
                <span>{interaction.speaker || 'TERMINAL INTERFACE'}</span>
              </div>
              {hintLevel < 3 && !solved && (
                <button 
                  onClick={handleRequestHint}
                  disabled={hintTimer > 0}
                  className={`text-[10px] px-2 py-0.5 rounded transition-colors border ${
                    hintTimer > 0 
                    ? 'bg-gray-800 text-gray-500 border-gray-700' 
                    : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                  }`}
                >
                  {hintLevel === 0 ? 'REQUEST NUDGE (-10 pts)' : 
                   hintLevel === 1 ? (hintTimer > 0 ? `DECRYPTING CLUE... ${hintTimer}s` : 'REQUEST CLUE (-40 pts)') :
                   (hintTimer > 0 ? `DECRYPTING SOLUTION... ${hintTimer}s` : 'SHOW SOLUTION (-100 pts)')}
                </button>
              )}
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
              <div className="mt-2">
                {lockoutTime > 0 ? (
                  <div className="text-red-500 animate-pulse">LOCKOUT ACTIVE: {lockoutTime}s</div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex items-center">
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
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from 'motion/react';
import { TileInteraction } from '../../data/campaignData';
import { X, ChevronRight, FileSearch } from 'lucide-react';
import { useCampaign } from '../../engine/campaignStore';
import { useState, useEffect } from 'react';

interface DialoguePanelProps {
  interaction: TileInteraction | null;
  lineIndex: number;
  onNext: () => void;
  onClose: () => void;
}

export default function DialoguePanel({ interaction, lineIndex, onNext, onClose }: DialoguePanelProps) {
  const { state, dispatch } = useCampaign();
  const [presenting, setPresenting] = useState(false);
  const [failMsg, setFailMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [presentedClues, setPresentedClues] = useState<string[]>([]);
  const [branchLines, setBranchLines] = useState<string[] | null>(null);
  const [branchIndex, setBranchIndex] = useState(0);

  useEffect(() => {
    setPresenting(false);
    setFailMsg(null);
    setSuccessMsg(null);
    setPresentedClues([]);
    setBranchLines(null);
    setBranchIndex(0);
  }, [interaction]);

  if (!interaction) return null;
  const isLast = lineIndex >= interaction.lines.length - 1;
  const reqClues = interaction.requiredCluesToUnlock || [];
  const requiresClue = isLast && reqClues.length > 0;

  const handlePresent = (clueStr: string) => {
    // Check if the presented clue matches any of the required clues
    const match = reqClues.find(req => clueStr === req || clueStr.includes(req));
    
    if (match) {
      if (!presentedClues.includes(match)) {
        const newPresented = [...presentedClues, match];
        setPresentedClues(newPresented);
        setFailMsg(null);
        
        if (newPresented.length === reqClues.length) {
          // All clues presented!
          setPresenting(false);
          onClose(); // Success!
        } else {
          // Need more clues
          setSuccessMsg(`Evidence accepted (${newPresented.length}/${reqClues.length}). What else?`);
        }
      } else {
        setSuccessMsg(null);
        setFailMsg("You already presented that evidence.");
      }
    } else {
      setSuccessMsg(null);
      setFailMsg(interaction.clueFailMsg?.[0] || 'That doesn\'t seem relevant to what I asked.');
    }
  };

  const handleOption = (opt: any) => {
    if (opt.nextLines) {
      setBranchLines(opt.nextLines);
      setBranchIndex(0);
    }
    if (opt.reward) dispatch({ type: 'COLLECT_ITEM', item: opt.reward });
    if (opt.clue) dispatch({ type: 'ADD_CLUE', clue: opt.clue });
    if (opt.repDelta) dispatch({ type: 'UPDATE_SCORE', delta: opt.repDelta * 10 }); // Simple score mapping
  };

  const line = failMsg ? failMsg : (successMsg ? successMsg : (branchLines ? branchLines[branchIndex] : interaction.lines[lineIndex]));
  const isBranching = isLast && interaction.options && !branchLines;
  const inBranch = !!branchLines;
  const isBranchLast = inBranch && branchIndex >= branchLines!.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key="dialogue"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-30"
      >
        <div className="relative bg-[#e8d5a0] border-4 border-[#a07830] shadow-2xl p-6"
          style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }}>
          
          {/* Speaker */}
          <div className="absolute -top-4 left-6 bg-[#2a1a0a] border-2 border-[#a07830] px-4 py-1">
            <span className="text-[10px] font-black text-[#d4a017] uppercase tracking-widest">
              {interaction.speaker}
            </span>
          </div>

          <button onClick={onClose} className="absolute top-3 right-3 text-[#a07830] hover:text-[#2a1a0a]">
            <X className="w-4 h-4" />
          </button>

          {/* Dialogue text */}
          <p className="text-sm font-serif text-[#2a1a0a] leading-relaxed mt-1 min-h-[3rem]">
            "{line}"
          </p>

          {/* Controls */}
          {presenting ? (
            <div className="mt-4 border-t border-[#a07830]/30 pt-3">
              <span className="text-[10px] text-[#a07830] uppercase font-black block mb-2">Select Evidence:</span>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                {state.clues.length === 0 && <span className="text-xs text-[#2a1a0a]/50 italic">No clues collected yet.</span>}
                {state.clues.map((c, i) => (
                  <button 
                    key={i} 
                    onClick={() => handlePresent(c)}
                    className="text-left bg-[#d4a017]/10 hover:bg-[#a07830] hover:text-[#e8d5a0] text-[#2a1a0a] text-xs font-serif p-2 border border-[#a07830]/20 transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button onClick={() => setPresenting(false)} className="mt-2 text-[10px] text-red-800 uppercase font-black hover:underline">Cancel</button>
            </div>
          ) : (
            <div className="flex justify-between items-center mt-4">
              <span className="text-[9px] text-[#a07830] uppercase tracking-widest font-black">
                {failMsg ? 'FAIL' : successMsg ? 'EVIDENCE ACCEPTED' : inBranch ? `RESPONSE ${branchIndex + 1} / ${branchLines!.length}` : `${lineIndex + 1} / ${interaction.lines.length}`}
              </span>
              
              {isBranching ? (
                <div className="flex gap-2">
                  {interaction.options!.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleOption(opt)}
                      className="bg-[#2a1a0a] text-[#d4a017] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest hover:bg-[#d4a017] hover:text-[#2a1a0a] transition-colors border-2 border-[#a07830]"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : requiresClue && !failMsg && !successMsg && !inBranch ? (
                <button
                  onClick={() => setPresenting(true)}
                  className="flex items-center gap-2 bg-[#8B2020] text-[#e8d5a0] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-[#a02020] transition-colors border-2 border-[#5a1010]"
                >
                  <FileSearch className="w-3.5 h-3.5" /> Present Evidence
                </button>
              ) : (
                <button
                  onClick={
                    (isLast && !failMsg && !successMsg && !interaction.options) || isBranchLast 
                    ? onClose 
                    : (failMsg || successMsg ? () => { setFailMsg(null); setSuccessMsg(null); setPresenting(true); } 
                    : (inBranch ? () => setBranchIndex(branchIndex + 1) : onNext))
                  }
                  className="flex items-center gap-2 bg-[#2a1a0a] text-[#d4a017] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-[#d4a017] hover:text-[#2a1a0a] transition-colors border-2 border-[#a07830]"
                >
                  {(isLast && !interaction.options) || isBranchLast ? 'Close' : (failMsg || successMsg ? 'Back to Evidence' : 'Continue')} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

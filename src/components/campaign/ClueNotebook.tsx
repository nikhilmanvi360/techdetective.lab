import { motion, AnimatePresence } from 'motion/react';
import { useCampaign } from '../../engine/campaignStore';
import { BookOpen, X, Link as LinkIcon, Check } from 'lucide-react';
import { SYNTHESIS_RECIPES } from '../../data/campaignData';
import { useState, useEffect } from 'react';

interface ClueNotebookProps {
  open: boolean;
  onClose: () => void;
}

export default function ClueNotebook({ open, onClose }: ClueNotebookProps) {
  const { state, dispatch } = useCampaign();
  const [selectedClues, setSelectedClues] = useState<string[]>([]);
  const [synthMsg, setSynthMsg] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedClues([]);
      setSynthMsg(null);
    }
  }, [open]);

  const toggleSelect = (clue: string) => {
    setSelectedClues(prev => 
      prev.includes(clue) ? prev.filter(c => c !== clue) : [...prev, clue]
    );
    setSynthMsg(null);
  };

  const handleSynthesize = () => {
    const interpolate = (str: string) => str.replace(/{dynamicCode}/g, state.dynamicCode);

    const match = SYNTHESIS_RECIPES.find(recipe => {
      const reqs = recipe.requiredClues.map(interpolate);
      return reqs.length === selectedClues.length && reqs.every(req => selectedClues.includes(req));
    });

    if (match) {
      const result = interpolate(match.resultClue);
      if (state.clues.includes(result)) {
        setSynthMsg({ text: 'Already synthesized.', isError: true });
      } else {
        if (match.isRedHerring) {
          dispatch({ type: 'ADD_CLUE', clue: result });
          dispatch({ type: 'UPDATE_SCORE', delta: -100 }); // Penalty
          setSynthMsg({ text: 'FALSE LEAD. -100 PTS.', isError: true });
        } else {
          dispatch({ type: 'ADD_CLUE', clue: result });
          dispatch({ type: 'UPDATE_SCORE', delta: 500 });
          setSynthMsg({ text: 'SYNTHESIS SUCCESSFUL.', isError: false });
        }
        setSelectedClues([]);
      }
    } else {
      setSynthMsg({ text: 'Logic invalid. Evidence does not link.', isError: true });
      dispatch({ type: 'RECORD_FAILURE' }); // Penalty for wrong synthesis
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 22 }}
          className="absolute top-0 right-0 h-full w-72 z-40 shadow-2xl flex flex-col"
          style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")', backgroundColor: '#e8d5a0' }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b-4 border-[#a07830]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#8B2020]" />
              <span className="font-black text-[#2a1a0a] uppercase tracking-wider text-sm">Case Notebook</span>
            </div>
            <button onClick={onClose} className="text-[#a07830] hover:text-[#2a1a0a]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {state.clues.length === 0 ? (
              <p className="text-[#a07830] font-serif italic text-sm">No clues collected yet.</p>
            ) : (
              state.clues.map((clue, i) => {
                const isSynthesis = clue.startsWith('SYNTHESIS:');
                const isSelected = selectedClues.includes(clue);
                return (
                  <div key={i} className={`border border-[#a07830]/30 p-3 transition-colors ${isSelected ? 'bg-[#a07830]/20 border-[#a07830]' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className={`text-[8px] font-black uppercase tracking-widest ${isSynthesis ? 'text-[#d4a017]' : 'text-[#8B2020]'}`}>
                        {isSynthesis ? 'Synthesis' : `Clue #${String(i + 1).padStart(2, '0')}`}
                      </div>
                      {!isSynthesis && (
                        <button onClick={() => toggleSelect(clue)} className="text-[#a07830] hover:text-[#2a1a0a]">
                          {isSelected ? <Check className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                    <p className={`text-xs font-serif leading-relaxed ${isSynthesis ? 'text-[#2a1a0a] font-bold' : 'text-[#2a1a0a]'}`}>{clue}</p>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-5 py-3 border-t-2 border-[#a07830]/40 bg-[#e8d5a0]">
            {selectedClues.length > 0 ? (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleSynthesize}
                  className="w-full bg-[#2a1a0a] text-[#d4a017] text-[10px] font-black uppercase tracking-widest py-2 border-2 border-[#a07830] hover:bg-[#d4a017] hover:text-[#2a1a0a] transition-colors flex items-center justify-center gap-2"
                >
                  <LinkIcon className="w-3 h-3" /> Synthesize Evidence ({selectedClues.length})
                </button>
                {synthMsg && (
                  <div className={`text-[9px] font-black uppercase tracking-widest text-center ${synthMsg.isError ? 'text-red-700' : 'text-green-800'}`}>
                    {synthMsg.text}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[8px] text-[#a07830] font-black uppercase tracking-widest">
                {state.clues.length} Clues Logged
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

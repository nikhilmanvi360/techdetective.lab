import { motion, AnimatePresence } from 'motion/react';
import { useCampaign } from '../../engine/campaignStore';
import { BookOpen, X } from 'lucide-react';

interface ClueNotebookProps {
  open: boolean;
  onClose: () => void;
}

export default function ClueNotebook({ open, onClose }: ClueNotebookProps) {
  const { state } = useCampaign();

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
              state.clues.map((clue, i) => (
                <div key={i} className="border-b border-[#a07830]/30 pb-3">
                  <div className="text-[8px] text-[#8B2020] font-black uppercase tracking-widest mb-1">
                    Clue #{String(i + 1).padStart(2, '0')}
                  </div>
                  <p className="text-xs font-serif text-[#2a1a0a] leading-relaxed">{clue}</p>
                </div>
              ))
            )}
          </div>

          <div className="px-5 py-3 border-t-2 border-[#a07830]/40">
            <div className="text-[8px] text-[#a07830] font-black uppercase tracking-widest">
              {state.clues.length} Clues Logged
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

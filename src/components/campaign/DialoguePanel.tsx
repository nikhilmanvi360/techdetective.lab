import { motion, AnimatePresence } from 'motion/react';
import { TileInteraction } from '../../data/campaignData';
import { X, ChevronRight } from 'lucide-react';

interface DialoguePanelProps {
  interaction: TileInteraction | null;
  lineIndex: number;
  onNext: () => void;
  onClose: () => void;
}

export default function DialoguePanel({ interaction, lineIndex, onNext, onClose }: DialoguePanelProps) {
  if (!interaction) return null;
  const line = interaction.lines[lineIndex];
  const isLast = lineIndex >= interaction.lines.length - 1;

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
          <div className="flex justify-between items-center mt-4">
            <span className="text-[9px] text-[#a07830] uppercase tracking-widest font-black">
              {lineIndex + 1} / {interaction.lines.length}
            </span>
            <button
              onClick={isLast ? onClose : onNext}
              className="flex items-center gap-2 bg-[#2a1a0a] text-[#d4a017] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-[#d4a017] hover:text-[#2a1a0a] transition-colors border-2 border-[#a07830]"
            >
              {isLast ? 'Close' : 'Continue'} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from 'motion/react';
import { ZoneId } from '../../data/campaignData';

const ZONE_NAMES: Record<ZoneId, string> = {
  cafeteria: 'Cafeteria',
  library: 'Library',
  maintenance: 'Maintenance Wing',
  admin_core: 'Admin Core',
};

interface ZoneTransitionOverlayProps {
  zone: ZoneId | null;
}

export default function ZoneTransitionOverlay({ zone }: ZoneTransitionOverlayProps) {
  return (
    <AnimatePresence>
      {zone && (
        <motion.div
          key={zone}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#ded0b1]"
          style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.42), transparent 55%)' }}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center bg-[#f4e6c4]/95 border-4 border-[#a07830] rounded-[1.5rem] px-12 py-10 shadow-[0_24px_60px_rgba(42,26,10,0.2)]"
            style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }}
          >
            <div className="text-[#8a6b44] text-[10px] uppercase tracking-[0.5em] font-black mb-4">
              Entering Zone
            </div>
            <div className="text-6xl font-black text-[#2a1a0a] uppercase tracking-tighter font-serif italic">
              {ZONE_NAMES[zone]}
            </div>
            <div className="mt-6 w-32 h-[2px] bg-[#a07830] mx-auto" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

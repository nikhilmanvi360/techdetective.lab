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
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#0a0702]"
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-[#d4a017] text-[10px] uppercase tracking-[0.5em] font-black mb-4">
              Entering Zone
            </div>
            <div className="text-6xl font-black text-[#f0e0a0] uppercase tracking-tighter font-serif italic">
              {ZONE_NAMES[zone]}
            </div>
            <div className="mt-6 w-32 h-[2px] bg-[#d4a017] mx-auto" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

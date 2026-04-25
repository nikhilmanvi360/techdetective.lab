import { AnimatePresence, motion } from 'motion/react';
import { useCampaign } from '../../engine/campaignStore';
import { ITEMS } from '../../data/campaignData';
import { X } from 'lucide-react';

interface InventoryPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function InventoryPanel({ open, onClose }: InventoryPanelProps) {
  const { state } = useCampaign();
  const inventory = state?.inventory || [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -24, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 240 }}
          className="absolute left-4 bottom-24 z-40 w-[min(24rem,calc(100vw-2rem))] max-h-[min(32rem,calc(100vh-8rem))] overflow-hidden rounded-2xl border border-[#d4a017]/22 bg-[#0b0906]/88 text-[#f4e6c4] shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-[#d4a017]/16 px-4 py-3">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[0.45em] text-[#a07830]">
                Inventory
              </div>
              <div className="mt-1 text-[11px] font-medium text-[#f4e6c4]/80">
                {inventory.length} item{inventory.length === 1 ? '' : 's'} collected
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-[#d4a017]/22 p-2 text-[#d4a017] transition-colors hover:bg-[#d4a017]/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[calc(32rem-4.5rem)] overflow-y-auto px-3 py-3">
            {inventory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d4a017]/16 bg-[#f4e6c4]/5 px-4 py-6 text-center text-[11px] uppercase tracking-[0.25em] text-[#a07830]">
                No evidence in hand yet.
              </div>
            ) : (
              <div className="grid gap-2">
                {inventory.map((itemId) => {
                  const item = ITEMS[itemId];
                  return (
                    <div
                      key={itemId}
                      className="flex items-start gap-3 rounded-xl border border-[#d4a017]/14 bg-[#f4e6c4]/5 px-3 py-3"
                    >
                      <span className="mt-0.5 text-lg">{item?.icon ?? '[ ]'}</span>
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f0e0a0]">
                          {item?.name ?? itemId}
                        </div>
                        <div className="mt-1 text-[11px] leading-snug text-[#f4e6c4]/75">
                          {item?.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

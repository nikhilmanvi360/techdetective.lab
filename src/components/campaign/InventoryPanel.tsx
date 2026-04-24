import { useCampaign } from '../../engine/campaignStore';
import { ITEMS } from '../../data/campaignData';

export default function InventoryPanel() {
  const { state } = useCampaign();

  if (state.inventory.length === 0) return null;

  return (
    <div className="absolute bottom-6 left-4 flex flex-col gap-1 z-20 pointer-events-none">
      <div className="text-[8px] text-[#a07830] uppercase tracking-widest font-black mb-1">Inventory</div>
      {state.inventory.map((itemId) => {
        const item = ITEMS[itemId];
        return (
          <div key={itemId}
            className="flex items-center gap-2 bg-[#1d1208]/90 border border-[#d4a017]/40 px-3 py-1.5 shadow-md w-48"
          >
            <span className="text-base">{item?.icon ?? '📦'}</span>
            <div>
              <div className="text-[9px] font-black text-[#f0e0a0] uppercase tracking-wide leading-none">
                {item?.name ?? itemId}
              </div>
              <div className="text-[8px] text-[#a07830] font-serif italic leading-none mt-0.5">
                {item?.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

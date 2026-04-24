import { ZoneId } from '../../data/campaignData';
import { useCampaign } from '../../engine/campaignStore';
import { BookOpen, Package, MapPin } from 'lucide-react';

const ZONE_LABELS: Record<ZoneId, string> = {
  cafeteria: 'Zone 01 — Cafeteria',
  library: 'Zone 02 — Library',
  maintenance: 'Zone 03 — Maintenance Wing',
  admin_core: 'Zone 04 — Admin Core',
};

export default function CampaignHUD() {
  const { state } = useCampaign();
  const latestObjective = state.objectiveLog[state.objectiveLog.length - 1];
  const progress = state.completedZones.length;

  return (
    <div className="absolute top-4 left-0 right-0 flex items-start justify-between px-4 pointer-events-none z-20">
      {/* Zone Name */}
      <div className="bg-[#1d1208]/90 border border-[#d4a017]/40 px-4 py-2 shadow-lg">
        <div className="text-[9px] text-[#a07830] uppercase tracking-[0.3em] font-black mb-0.5">Current Zone</div>
        <div className="text-sm font-black text-[#f0e0a0] uppercase tracking-tight flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#d4a017]" />
          {ZONE_LABELS[state.currentZone]}
        </div>
      </div>

      {/* Objective */}
      <div className="bg-[#1d1208]/90 border border-[#d4a017]/40 px-4 py-2 max-w-xs shadow-lg">
        <div className="text-[9px] text-[#a07830] uppercase tracking-[0.3em] font-black mb-0.5">Current Objective</div>
        <div className="text-xs text-[#f0e0a0] font-serif italic leading-snug">{latestObjective}</div>
      </div>

      {/* Stats */}
      <div className="flex gap-2">
        <div className="bg-[#1d1208]/90 border border-[#d4a017]/40 px-3 py-2 shadow-lg flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-[#d4a017]" />
          <span className="text-xs font-black text-[#f0e0a0]">{state.inventory.length}</span>
        </div>
        <div className="bg-[#1d1208]/90 border border-[#d4a017]/40 px-3 py-2 shadow-lg flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-[#d4a017]" />
          <span className="text-xs font-black text-[#f0e0a0]">{state.clues.length}</span>
        </div>
        <div className="bg-[#1d1208]/90 border border-[#d4a017]/40 px-3 py-2 shadow-lg flex items-center gap-2">
          <span className="text-[9px] text-[#a07830] font-black uppercase">Zones</span>
          <span className="text-xs font-black text-[#f0e0a0]">{progress}/4</span>
        </div>
      </div>
    </div>
  );
}

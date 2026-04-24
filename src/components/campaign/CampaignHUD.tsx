import { ZoneId } from '../../data/campaignData';
import { useCampaign } from '../../engine/campaignStore';
import { BookOpen, Package, MapPin, Award, Shield, Users } from 'lucide-react';

const ZONE_LABELS: Record<ZoneId, string> = {
  cafeteria: 'Zone 01 — Cafeteria',
  library: 'Zone 02 — Library',
  maintenance: 'Zone 03 — Maintenance Wing',
  admin_core: 'Zone 04 — Admin Core',
};

interface CampaignHUDProps {
  partnerConnected?: boolean;
}

export default function CampaignHUD({ partnerConnected = false }: CampaignHUDProps) {
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
      {/* Stats & Roles */}
      <div className="flex flex-col gap-2 items-end">
        <div className="flex gap-2">
          {state.teamRoles && (
            <div className="bg-[#1d1208]/90 border border-[#d4a017]/40 px-3 py-2 shadow-lg flex flex-col items-end">
              <div className="text-[8px] text-[#a07830] uppercase font-black tracking-widest flex items-center gap-1">
                <Users className="w-2.5 h-2.5" /> Team Roles
              </div>
              <div className="text-[10px] font-serif text-[#f0e0a0] italic">
                {state.teamRoles.p1} & {state.teamRoles.p2}
              </div>
            </div>
          )}
          <div className="bg-[#1d1208]/90 border border-[#d4a017]/40 px-3 py-2 shadow-lg flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-[#d4a017]" />
            <div className="flex flex-col">
              <span className="text-[7px] text-[#a07830] uppercase font-black">Score</span>
              <span className="text-xs font-black text-[#f0e0a0] leading-none">{state.score}</span>
            </div>
          </div>
          <div className="bg-[#1d1208]/90 border border-[#d4a017]/40 px-3 py-2 shadow-lg flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#d4a017]" />
            <div className="flex flex-col">
              <span className="text-[7px] text-[#a07830] uppercase font-black">Reputation</span>
              <span className="text-xs font-black text-[#f0e0a0] leading-none">{state.reputation}%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-1">
          <div className={`bg-[#1d1208]/90 border px-3 py-1.5 shadow-lg flex items-center gap-2 ${partnerConnected ? 'border-[#5a7a4a]' : 'border-[#8B2020]'}`}>
            <div className={`w-2 h-2 rounded-full ${partnerConnected ? 'bg-[#5a7a4a] animate-pulse' : 'bg-[#8B2020]'}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest ${partnerConnected ? 'text-[#5a7a4a]' : 'text-[#8B2020]'}`}>
              {partnerConnected ? 'Partner Linked' : 'Partner Offline'}
            </span>
          </div>
        </div>

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
    </div>
  );
}

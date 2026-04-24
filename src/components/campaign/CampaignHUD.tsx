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
  const objectiveLog = state?.objectiveLog || [];
  const latestObjective = objectiveLog.length > 0 ? objectiveLog[objectiveLog.length - 1] : 'Initializing...';
  const progress = (state?.completedZones || []).length;

  return (
    <div className="absolute top-4 left-0 right-0 flex items-start justify-between px-4 pointer-events-none z-20">
      {/* Zone Name */}
      <div className="bg-[#f4e6c4]/95 border border-[#b58a53] px-4 py-2 shadow-[0_12px_30px_rgba(42,26,10,0.12)] rounded-2xl backdrop-blur-sm">
        <div className="text-[9px] text-[#8a6b44] uppercase tracking-[0.3em] font-black mb-0.5">Current Zone</div>
        <div className="text-sm font-black text-[#2a1a0a] uppercase tracking-tight flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#8c5f22]" />
          {ZONE_LABELS[state?.currentZone || 'cafeteria']}
        </div>
      </div>

      {/* Objective */}
      <div className="bg-[#f4e6c4]/95 border border-[#b58a53] px-4 py-2 max-w-xs shadow-[0_12px_30px_rgba(42,26,10,0.12)] rounded-2xl backdrop-blur-sm">
        <div className="text-[9px] text-[#8a6b44] uppercase tracking-[0.3em] font-black mb-0.5">Current Objective</div>
        <div className="text-xs text-[#2a1a0a] font-serif italic leading-snug">{latestObjective}</div>
      </div>

      {/* Stats */}
      {/* Stats & Roles */}
      <div className="flex flex-col gap-2 items-end">
        <div className="flex gap-2">
          {state.teamRoles && (
            <div className="bg-[#f4e6c4]/95 border border-[#b58a53] px-3 py-2 shadow-[0_12px_30px_rgba(42,26,10,0.12)] flex flex-col items-end rounded-2xl backdrop-blur-sm">
              <div className="text-[8px] text-[#8a6b44] uppercase font-black tracking-widest flex items-center gap-1">
                <Users className="w-2.5 h-2.5" /> Team Roles
              </div>
              <div className="text-[10px] font-serif text-[#2a1a0a] italic">
                {state.teamRoles.p1} & {state.teamRoles.p2}
              </div>
            </div>
          )}
          <div className="bg-[#f4e6c4]/95 border border-[#b58a53] px-3 py-2 shadow-[0_12px_30px_rgba(42,26,10,0.12)] flex items-center gap-2 rounded-2xl backdrop-blur-sm">
            <Award className="w-3.5 h-3.5 text-[#8c5f22]" />
            <div className="flex flex-col">
              <span className="text-[7px] text-[#8a6b44] uppercase font-black">Score</span>
              <span className="text-xs font-black text-[#2a1a0a] leading-none">{state.score}</span>
            </div>
          </div>
          <div className="bg-[#f4e6c4]/95 border border-[#b58a53] px-3 py-2 shadow-[0_12px_30px_rgba(42,26,10,0.12)] flex items-center gap-2 rounded-2xl backdrop-blur-sm">
            <Shield className="w-3.5 h-3.5 text-[#8c5f22]" />
            <div className="flex flex-col">
              <span className="text-[7px] text-[#8a6b44] uppercase font-black">Reputation</span>
              <span className="text-xs font-black text-[#2a1a0a] leading-none">{state.reputation}%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-1">
          <div className={`bg-[#f4e6c4]/95 border px-3 py-1.5 shadow-[0_12px_30px_rgba(42,26,10,0.12)] flex items-center gap-2 rounded-2xl backdrop-blur-sm ${partnerConnected ? 'border-[#67845c]' : 'border-[#8b6b57]'}`}>
            <div className={`w-2 h-2 rounded-full ${partnerConnected ? 'bg-[#67845c] animate-pulse' : 'bg-[#8b6b57]'}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest ${partnerConnected ? 'text-[#67845c]' : 'text-[#8b6b57]'}`}>
              {partnerConnected ? 'Partner Linked' : 'Partner Offline'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="bg-[#f4e6c4]/95 border border-[#b58a53] px-3 py-2 shadow-[0_12px_30px_rgba(42,26,10,0.12)] flex items-center gap-2 rounded-2xl backdrop-blur-sm">
            <Package className="w-3.5 h-3.5 text-[#8c5f22]" />
            <span className="text-xs font-black text-[#2a1a0a]">{(state?.inventory || []).length}</span>
          </div>
          <div className="bg-[#f4e6c4]/95 border border-[#b58a53] px-3 py-2 shadow-[0_12px_30px_rgba(42,26,10,0.12)] flex items-center gap-2 rounded-2xl backdrop-blur-sm">
            <BookOpen className="w-3.5 h-3.5 text-[#8c5f22]" />
            <span className="text-xs font-black text-[#2a1a0a]">{(state?.clues || []).length}</span>
          </div>
          <div className="bg-[#f4e6c4]/95 border border-[#b58a53] px-3 py-2 shadow-[0_12px_30px_rgba(42,26,10,0.12)] flex items-center gap-2 rounded-2xl backdrop-blur-sm">
            <span className="text-[9px] text-[#8a6b44] font-black uppercase">Zones</span>
            <span className="text-xs font-black text-[#2a1a0a]">{progress}/4</span>
          </div>
        </div>
      </div>
    </div>
  );
}

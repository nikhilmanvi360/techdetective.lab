import { TileType, ZoneId } from '../../data/campaignData';
import {
  DoorOpen,
  FileText,
  Package,
  ShieldAlert,
  UserRound,
  Waypoints,
} from 'lucide-react';

interface MapRendererProps {
  grid: TileType[][];
  playerPos: [number, number];
  p2Pos?: [number, number];
  zoneId: ZoneId;
  drones?: [number, number][];
}

const TILE_META: Record<TileType, { label: string; symbol: string; accent: string }> = {
  walkable: { label: 'Floor', symbol: '', accent: 'text-[#8a6b44]' },
  wall: { label: 'Wall', symbol: '', accent: 'text-[#6f5532]' },
  npc: { label: 'Witness', symbol: '👤', accent: 'text-[#8c5f22]' },
  terminal: { label: 'Terminal', symbol: '⌘', accent: 'text-[#7a6540]' },
  item: { label: 'Evidence', symbol: '✦', accent: 'text-[#7a6a45]' },
  gate: { label: 'Door', symbol: '◫', accent: 'text-[#8b6b57]' },
  exit: { label: 'Exit', symbol: '↗', accent: 'text-[#55724a]' },
};

const TILE_BG: Record<TileType, string> = {
  walkable: 'bg-[#f4ead1]',
  wall: 'bg-[#6f5532]',
  npc: 'bg-[#ead6b2]',
  terminal: 'bg-[#e2ccb0]',
  item: 'bg-[#efe1bf]',
  gate: 'bg-[#dbc49d]',
  exit: 'bg-[#ecdcb5]',
};

const ZONE_BORDER: Record<ZoneId, string> = {
  cafeteria: 'border-[#b5874a]',
  library: 'border-[#7a6a45]',
  maintenance: 'border-[#8a6c4d]',
  admin_core: 'border-[#8b6b57]',
};

export default function MapRenderer({ grid, playerPos, p2Pos, zoneId, drones = [] }: MapRendererProps) {
  return (
    <div
      className={`
        inline-block rounded-[1.5rem] border-4 ${ZONE_BORDER[zoneId]} bg-[#e8d8b6] shadow-[0_24px_70px_rgba(57,39,18,0.28)]
        p-3
      `}
      style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-paper.png")' }}
    >
      <div className="flex items-center justify-between gap-4 px-2 pb-3">
        <div>
          <div className="text-[9px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Campaign Board</div>
          <div className="text-sm font-black text-[#2a1a0a] uppercase tracking-tight">Zone View</div>
        </div>
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-black text-[#7a6040]">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#b59360] bg-[#f5ead0] px-2 py-1">
            <span className="w-2 h-2 rounded-full bg-[#b5874a]" /> You
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#8c7a53] bg-[#f5ead0] px-2 py-1">
            <span className="w-2 h-2 rounded-full bg-[#6f8b5b]" /> Partner
          </span>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-[#97754e] bg-[#eadbb8]">
        {(grid || []).map((row, r) => (
          <div key={r} className="flex">
            {row.map((tile, c) => {
              const meta = TILE_META[tile];
              const isPlayer = playerPos[0] === r && playerPos[1] === c;
              const isP2 = p2Pos && p2Pos[0] === r && p2Pos[1] === c;
              const isDrone = drones.some(d => d[0] === r && d[1] === c);
              const showDualMarker = isPlayer && isP2;
              return (
                <div
                  key={c}
                  title={meta.label}
                  className={`
                    w-8 h-8 flex items-center justify-center text-xs relative overflow-hidden
                    ${isDrone ? 'bg-[#b44a3c]' : TILE_BG[tile]}
                    ${tile === 'wall' ? '' : 'border border-[#8f744f]/30'}
                  `}
                >
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, rgba(42,26,10,0.15) 25%, transparent 25%, transparent 50%, rgba(42,26,10,0.15) 50%, rgba(42,26,10,0.15) 75%, transparent 75%, transparent)',
                      backgroundSize: '8px 8px',
                    }}
                  />
                  {!isPlayer && !isP2 && !isDrone && tile !== 'walkable' && tile !== 'wall' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full bg-[#f8edd7]/90 border border-[#b58a53] px-0.5 py-0.5 shadow-sm">
                        <span className={`block text-[10px] leading-none ${meta.accent}`}>{meta.symbol}</span>
                      </div>
                    </div>
                  )}
                  {!isPlayer && !isP2 && !isDrone && tile === 'wall' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldAlert className="w-3 h-3 text-[#f8edd7]/55" />
                    </div>
                  )}
                  {showDualMarker ? (
                    <div className="relative w-full h-full">
                      <span className="absolute left-0.5 top-0.5 text-[9px] text-[#8c5f22] font-black leading-none z-20">1</span>
                      <span className="absolute right-0.5 bottom-0.5 text-[9px] text-[#55724a] font-black leading-none z-20">2</span>
                      <img
                        src="/assets/noir_sprite_mc.png"
                        alt="Player one"
                        className="absolute inset-0 w-full h-full object-contain p-0.5 drop-shadow-[0_2px_2px_rgba(42,26,10,0.35)]"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <img
                        src="/assets/noir_sprite_partner.png"
                        alt="Player two"
                        className="absolute inset-0 w-full h-full object-contain p-0.5 translate-x-[2px] translate-y-[2px] opacity-90 mix-blend-normal"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  ) : isPlayer ? (
                    <img
                      src="/assets/noir_sprite_mc.png"
                      alt="Player"
                      className="w-full h-full object-contain p-0.5 drop-shadow-[0_2px_2px_rgba(42,26,10,0.35)]"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : isP2 ? (
                    <img
                      src="/assets/noir_sprite_partner.png"
                      alt="Teammate"
                      className="w-full h-full object-contain p-0.5 opacity-95"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : isDrone ? (
                    <div className="flex flex-col items-center justify-center leading-none">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#f8edd7]" />
                      <span className="text-[7px] font-black text-[#f8edd7] uppercase">Watch</span>
                    </div>
                  ) : tile === 'walkable' ? (
                    <span className="opacity-0">.</span>
                  ) : (
                    <span className="opacity-0">.</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] uppercase tracking-[0.25em] font-black text-[#7a6040]">
        <div className="flex items-center gap-2 rounded-full border border-[#b58a53] bg-[#f5ead0] px-2 py-1">
          <DoorOpen className="w-3 h-3 text-[#8b6b57]" /> Door
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#b58a53] bg-[#f5ead0] px-2 py-1">
          <FileText className="w-3 h-3 text-[#7a6540]" /> Terminal
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#b58a53] bg-[#f5ead0] px-2 py-1">
          <Package className="w-3 h-3 text-[#7a6a45]" /> Evidence
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#b58a53] bg-[#f5ead0] px-2 py-1">
          <UserRound className="w-3 h-3 text-[#8c5f22]" /> NPC
        </div>
      </div>
    </div>
  );
}

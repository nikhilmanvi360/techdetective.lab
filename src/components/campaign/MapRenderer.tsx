import { TileType, ZoneId } from '../../data/campaignData';

interface MapRendererProps {
  grid: TileType[][];
  playerPos: [number, number];
  p2Pos?: [number, number];
  zoneId: ZoneId;
  drones?: [number, number][];
}

const TILE_ICONS: Record<TileType, string> = {
  walkable: '',
  wall: '',
  npc: '👤',
  terminal: '✦',
  item: '⌁',
  gate: '◇',
  exit: '→',
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
              const isPlayer = playerPos[0] === r && playerPos[1] === c;
              const isP2 = p2Pos && p2Pos[0] === r && p2Pos[1] === c;
              const isDrone = drones.some(d => d[0] === r && d[1] === c);
              const showDualMarker = isPlayer && isP2;
              return (
                <div
                  key={c}
                  className={`
                    w-7 h-7 flex items-center justify-center text-xs relative overflow-hidden
                    ${isDrone ? 'bg-[#b44a3c]' : TILE_BG[tile]}
                    ${tile === 'wall' ? '' : 'border border-[#8f744f]/30'}
                  `}
                >
                  <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, rgba(42,26,10,0.15) 25%, transparent 25%, transparent 50%, rgba(42,26,10,0.15) 50%, rgba(42,26,10,0.15) 75%, transparent 75%, transparent)',
                      backgroundSize: '8px 8px',
                    }}
                  />
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
                    <span className="text-sm animate-pulse z-10">⚑</span>
                  ) : (
                    <span className="opacity-70 text-[#6e5739]">{TILE_ICONS[tile]}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

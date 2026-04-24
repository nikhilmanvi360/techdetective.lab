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
  terminal: '🖥️',
  item: '📦',
  gate: '🚪',
  exit: '➡️',
};

const TILE_BG: Record<TileType, string> = {
  walkable: 'bg-[#1d1208]',
  wall: 'bg-[#0a0702]',
  npc: 'bg-[#2a1c10]',
  terminal: 'bg-[#0f1a10]',
  item: 'bg-[#1a1510]',
  gate: 'bg-[#1a0f0f]',
  exit: 'bg-[#0f1a0f]',
};

const ZONE_BORDER: Record<ZoneId, string> = {
  cafeteria: 'border-[#b5874a]',
  library: 'border-[#5a7a4a]',
  maintenance: 'border-[#7a5a3a]',
  admin_core: 'border-[#8B2020]',
};

export default function MapRenderer({ grid, playerPos, p2Pos, zoneId, drones = [] }: MapRendererProps) {
  return (
    <div className={`inline-block border-2 ${ZONE_BORDER[zoneId]} shadow-2xl`}>
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
                  w-6 h-6 flex items-center justify-center text-xs relative
                  ${isDrone ? 'bg-red-900' : TILE_BG[tile]}
                  ${tile === 'wall' ? '' : 'border border-[#2a1c10]/40'}
                `}
              >
                {showDualMarker ? (
                  <div className="relative w-full h-full">
                    <span className="absolute left-0.5 top-0.5 text-[10px] text-[#d4a017] font-black leading-none z-20">1</span>
                    <span className="absolute right-0.5 bottom-0.5 text-[10px] text-[#5a7a4a] font-black leading-none z-20">2</span>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] animate-pulse z-10">🕵️</span>
                    <span className="absolute inset-0 flex items-center justify-center translate-x-1 translate-y-1 text-[10px] opacity-90">🕵️‍♀️</span>
                  </div>
                ) : isPlayer ? (
                  <span className="text-sm animate-pulse z-20">🕵️</span>
                ) : isP2 ? (
                  <span className="text-sm z-10 opacity-80 text-[#5a7a4a]">🕵️‍♀️</span>
                ) : isDrone ? (
                  <span className="text-sm animate-pulse z-10">🚨</span>
                ) : (
                  <span className="opacity-70">{TILE_ICONS[tile]}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

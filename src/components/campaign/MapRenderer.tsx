import { TileType, ZoneId } from '../../data/campaignData';

interface MapRendererProps {
  grid: TileType[][];
  playerPos: [number, number];
  zoneId: ZoneId;
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

export default function MapRenderer({ grid, playerPos, zoneId }: MapRendererProps) {
  return (
    <div className={`inline-block border-2 ${ZONE_BORDER[zoneId]} shadow-2xl`}>
      {grid.map((row, r) => (
        <div key={r} className="flex">
          {row.map((tile, c) => {
            const isPlayer = playerPos[0] === r && playerPos[1] === c;
            return (
              <div
                key={c}
                className={`
                  w-9 h-9 flex items-center justify-center text-sm relative
                  ${TILE_BG[tile]}
                  ${tile === 'wall' ? '' : 'border border-[#2a1c10]/40'}
                `}
              >
                {isPlayer ? (
                  <span className="text-base animate-pulse z-10">🕵️</span>
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

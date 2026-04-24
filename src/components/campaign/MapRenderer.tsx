import { TileType, ZoneId, MapDecoration } from '../../data/campaignData';
import {
  DoorOpen,
  FileText,
  Package,
  ShieldAlert,
  UserRound,
} from 'lucide-react';

interface MapRendererProps {
  grid: TileType[][];
  playerPos: [number, number];
  p2Pos?: [number, number];
  zoneId: ZoneId;
  drones?: [number, number][];
  decorations?: MapDecoration[];
}

const ASSET_ROOT = '/assets/kenney_retro-textures-fantasy/PNG';
const ROUND2_ROOT = '/assets/round2-topdown';

const ROUND2_SPRITES = {
  player: `${ROUND2_ROOT}/characters/player_back_standing.png`,
  partner: `${ROUND2_ROOT}/characters/npc_idle_b.png`,
  drone: `${ROUND2_ROOT}/characters/enemy_standing_b.png`,
};

const TILE_META: Record<TileType, { label: string; symbol: string; accent: string }> = {
  walkable: { label: 'Floor', symbol: '', accent: 'text-[#8a6b44]' },
  wall: { label: 'Wall', symbol: '', accent: 'text-[#6f5532]' },
  npc: { label: 'Witness', symbol: '👤', accent: 'text-[#8c5f22]' },
  terminal: { label: 'Terminal', symbol: '⌘', accent: 'text-[#7a6540]' },
  item: { label: 'Evidence', symbol: '✦', accent: 'text-[#7a6a45]' },
  gate: { label: 'Door', symbol: '◫', accent: 'text-[#8b6b57]' },
  exit: { label: 'Exit', symbol: '↗', accent: 'text-[#55724a]' },
};

const ZONE_BORDER: Record<ZoneId, string> = {
  cafeteria: 'border-[#b5874a]',
  library: 'border-[#7a6a45]',
  maintenance: 'border-[#8a6c4d]',
  admin_core: 'border-[#8b6b57]',
};

const ZONE_FLOOR: Record<ZoneId, string> = {
  cafeteria: `${ASSET_ROOT}/floor_tiles_sand_large.png`,
  library: `${ASSET_ROOT}/floor_stone_pattern.png`,
  maintenance: `${ASSET_ROOT}/floor_wood_planks.png`,
  admin_core: `${ASSET_ROOT}/floor_stone_pattern_small_depth.png`,
};

const TILE_TEXTURE: Record<Exclude<TileType, 'walkable'>, string> = {
  wall: `${ASSET_ROOT}/wall_stone.png`,
  npc: `${ASSET_ROOT}/floor_tiles_tan_small.png`,
  terminal: `${ASSET_ROOT}/floor_tiles_blue_small.png`,
  item: `${ASSET_ROOT}/floor_tiles_tan_small_damaged.png`,
  gate: `${ASSET_ROOT}/door_wood.png`,
  exit: `${ASSET_ROOT}/door_metal_gate.png`,
};

function getTileTexture(tile: TileType, zoneId: ZoneId): string {
  return tile === 'walkable' ? ZONE_FLOOR[zoneId] : TILE_TEXTURE[tile];
}

function Sprite({
  src,
  alt,
  frameCount = 1,
  animate = false,
  className = '',
  imageClassName = '',
  opacity = 1,
}: {
  src: string;
  alt: string;
  frameCount?: number;
  animate?: boolean;
  className?: string;
  imageClassName?: string;
  opacity?: number;
}) {
  if (frameCount > 1) {
    return (
      <div
        aria-label={alt}
        className={`bg-no-repeat bg-left-top ${animate ? 'animate-pulse' : ''} ${className}`}
        style={{
          backgroundImage: `url("${src}")`,
          backgroundSize: `${frameCount * 100}% 100%`,
          backgroundPosition: '0% 0%',
          imageRendering: 'pixelated',
          opacity,
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain ${imageClassName} ${animate ? 'animate-pulse' : ''} ${className}`}
      style={{ imageRendering: 'pixelated', opacity }}
    />
  );
}

export default function MapRenderer({
  grid,
  playerPos,
  p2Pos,
  zoneId,
  drones = [],
  decorations = [],
}: MapRendererProps) {
  const cellPx = grid.length > 24 ? 28 : 32;
  const boardWidth = (grid[0]?.length || 0) * cellPx;

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
          <div className="text-sm font-black text-[#2a1a0a] uppercase tracking-tight">Expanded Zone View</div>
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

      <div className="relative rounded-2xl overflow-hidden border border-[#97754e] bg-[#eadbb8]" style={{ width: boardWidth }}>
        <div className="relative">
          {(grid || []).map((row, r) => (
            <div key={r} className="flex">
              {row.map((tile, c) => {
                const meta = TILE_META[tile];
                const isPlayer = playerPos[0] === r && playerPos[1] === c;
                const isP2 = p2Pos && p2Pos[0] === r && p2Pos[1] === c;
                const isDrone = drones.some(d => d[0] === r && d[1] === c);
                const showDualMarker = isPlayer && isP2;
                const tileTexture = getTileTexture(tile, zoneId);

                return (
                  <div
                    key={c}
                    title={meta.label}
                    className={`
                      w-8 h-8 flex items-center justify-center text-xs relative overflow-hidden
                      ${isDrone ? 'bg-[#b44a3c]' : 'bg-[#eadbb8]'}
                      ${tile === 'wall' ? '' : 'border border-[#8f744f]/30'}
                    `}
                    style={{
                      width: cellPx,
                      height: cellPx,
                      backgroundImage: [
                        'linear-gradient(180deg, rgba(255,248,231,0.07), rgba(34,20,7,0.12))',
                        `url("${tileTexture}")`,
                      ].join(', '),
                      backgroundSize: 'cover, cover',
                      backgroundPosition: 'center, center',
                      backgroundBlendMode: 'soft-light, normal',
                      filter: isDrone ? 'saturate(0.85) brightness(0.78)' : undefined,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.06]"
                      style={{
                        backgroundImage:
                          'linear-gradient(135deg, rgba(42,26,10,0.15) 25%, transparent 25%, transparent 50%, rgba(42,26,10,0.15) 50%, rgba(42,26,10,0.15) 75%, transparent 75%, transparent)',
                        backgroundSize: '8px 8px',
                      }}
                    />

                    {!isPlayer && !isP2 && !isDrone && tile !== 'wall' && (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(248,237,215,0.14),transparent_65%)]" />
                    )}

                    {!isPlayer && !isP2 && !isDrone && tile !== 'walkable' && tile !== 'wall' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {tile === 'npc' ? (
                          <Sprite
                            src={ROUND2_SPRITES.npc}
                            alt="NPC"
                            frameCount={6}
                            className="w-full h-full"
                            opacity={0.95}
                          />
                        ) : (
                          <div className="rounded-full bg-[#f8edd7]/88 border border-[#b58a53] px-0.5 py-0.5 shadow-sm backdrop-blur-[1px]">
                            <span className={`block text-[10px] leading-none ${meta.accent}`}>{meta.symbol}</span>
                          </div>
                        )}
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
                        <Sprite
                          src={ROUND2_SPRITES.player}
                          alt="Player one"
                          frameCount={6}
                          className="absolute inset-0 w-full h-full drop-shadow-[0_2px_2px_rgba(42,26,10,0.35)]"
                        />
                        <Sprite
                          src={ROUND2_SPRITES.partner}
                          alt="Player two"
                          frameCount={6}
                          className="absolute inset-0 w-full h-full translate-x-[2px] translate-y-[2px] opacity-90"
                        />
                      </div>
                    ) : isPlayer ? (
                      <Sprite
                        src={ROUND2_SPRITES.player}
                        alt="Player"
                        frameCount={6}
                        className="w-full h-full drop-shadow-[0_2px_2px_rgba(42,26,10,0.35)]"
                      />
                    ) : isP2 ? (
                      <Sprite
                        src={ROUND2_SPRITES.partner}
                        alt="Teammate"
                        frameCount={6}
                        className="w-full h-full opacity-95"
                      />
                    ) : isDrone ? (
                      <div className="flex flex-col items-center justify-center leading-none rounded-sm bg-[#7d2d25]/70 border border-[#f1c7aa]/40 p-0.5 shadow-[0_0_0_1px_rgba(42,26,10,0.12)]">
                        <Sprite
                          src={ROUND2_SPRITES.drone}
                          alt="Security drone"
                          frameCount={6}
                          className="w-full h-full"
                        />
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

          <div className="pointer-events-none absolute inset-0">
            {decorations.map((decor) => {
              const [r, c] = decor.pos;
              const [spanR, spanC] = decor.span ?? [1, 1];
              const isAnimated = Boolean(decor.animate || (decor.frameCount && decor.frameCount > 1));
              return (
                <div
                  key={decor.id}
                  className="absolute"
                  style={{
                    left: c * cellPx,
                    top: r * cellPx,
                    width: spanC * cellPx,
                    height: spanR * cellPx,
                    zIndex: decor.zIndex ?? 6,
                    opacity: decor.opacity ?? 1,
                    transform: decor.scale ? `scale(${decor.scale})` : undefined,
                    transformOrigin: 'top left',
                  }}
                >
                  <Sprite
                    src={decor.src}
                    alt={decor.alt}
                    frameCount={decor.frameCount ?? 1}
                    animate={isAnimated}
                    className={`w-full h-full ${isAnimated ? 'drop-shadow-[0_4px_10px_rgba(42,26,10,0.18)]' : ''}`}
                    imageClassName="w-full h-full"
                    opacity={decor.opacity ?? 1}
                  />
                </div>
              );
            })}
          </div>
        </div>
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

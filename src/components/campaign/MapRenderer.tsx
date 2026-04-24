import { useState } from 'react';
import { motion } from 'motion/react';
import { DoorOpen, FileText, Package, ShieldAlert, UserRound } from 'lucide-react';

import { TileType, ZoneId } from '../../data/campaignData';

interface MapRendererProps {
  grid: TileType[][];
  playerPos: [number, number];
  p2Pos?: [number, number];
  zoneId: ZoneId;
  zoneName: string;
  zoneDescription: string;
  objective: string;
  drones?: [number, number][];
}

const ASSET_ROOT = '/assets/kenney_retro-textures-fantasy/PNG';

const TILE_META: Record<TileType, { label: string; symbol: string; accent: string; hint: string }> = {
  walkable: { label: 'Floor', symbol: '', accent: 'text-[#8a6b44]', hint: 'Move through the area' },
  wall: { label: 'Wall', symbol: '', accent: 'text-[#6f5532]', hint: 'Blocked by the structure' },
  npc: { label: 'Witness', symbol: '@', accent: 'text-[#8c5f22]', hint: 'Press E to interview' },
  terminal: { label: 'Terminal', symbol: '#', accent: 'text-[#7a6540]', hint: 'Press E to inspect' },
  item: { label: 'Evidence', symbol: '*', accent: 'text-[#7a6a45]', hint: 'Press E to collect' },
  gate: { label: 'Door', symbol: '>', accent: 'text-[#8b6b57]', hint: 'May require clearance' },
  exit: { label: 'Exit', symbol: '^', accent: 'text-[#55724a]', hint: 'Advances the investigation' },
};

const ZONE_BORDER: Record<ZoneId, string> = {
  cafeteria: 'border-[#b5874a]',
  library: 'border-[#7a6a45]',
  maintenance: 'border-[#8a6c4d]',
  admin_core: 'border-[#8b6b57]',
};

const ZONE_THEME: Record<ZoneId, {
  glow: string;
  stamp: string;
  boardLine: string;
  accent: string;
  textureHint: string;
}> = {
  cafeteria: {
    glow: 'from-[#d39a4a]/20 via-[#f1d0a1]/10 to-transparent',
    stamp: 'CAFE TERRITORY',
    boardLine: 'rgba(181,135,74,0.18)',
    accent: '#b5874a',
    textureHint: 'steam, paper, and spill marks',
  },
  library: {
    glow: 'from-[#6a8c5a]/18 via-[#9bb084]/10 to-transparent',
    stamp: 'ARCHIVE STACK',
    boardLine: 'rgba(122,106,69,0.18)',
    accent: '#7a6a45',
    textureHint: 'catalog lanes and archive dust',
  },
  maintenance: {
    glow: 'from-[#9b7448]/22 via-[#bea07a]/10 to-transparent',
    stamp: 'SERVICE TUNNELS',
    boardLine: 'rgba(138,108,77,0.18)',
    accent: '#8a6c4d',
    textureHint: 'pipes, grease, and hazard tape',
  },
  admin_core: {
    glow: 'from-[#b54a3c]/22 via-[#8b6b57]/10 to-transparent',
    stamp: 'LOCKED CORE',
    boardLine: 'rgba(139,107,87,0.18)',
    accent: '#8b6b57',
    textureHint: 'security glass and firewall grids',
  },
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

function AnimatedSprite({
  src,
  alt,
  className = '',
  imageClassName = '',
  delay = 0,
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  delay?: number;
}) {
  return (
    <motion.div
      animate={{ y: [0, -1.5, 0], rotate: [0, 0.35, 0] }}
      transition={{
        duration: 1.8,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={className}
    >
      <img
        src={src}
        alt={alt}
        className={imageClassName}
        style={{ imageRendering: 'pixelated' }}
      />
    </motion.div>
  );
}

export default function MapRenderer({
  grid,
  playerPos,
  p2Pos,
  zoneId,
  zoneName,
  zoneDescription,
  objective,
  drones = [],
}: MapRendererProps) {
  const [hoveredTile, setHoveredTile] = useState<{ row: number; col: number; tile: TileType } | null>(null);
  const cellPx = grid.length > 24 ? 24 : 32;
  const boardWidth = (grid[0]?.length || 0) * cellPx;
  const hoveredMeta = hoveredTile ? TILE_META[hoveredTile.tile] : null;
  const activeDroneCount = drones.length;
  const theme = ZONE_THEME[zoneId];

  return (
    <div className="relative w-full max-w-[1280px] mx-auto">
      <div
        className={`
          relative overflow-hidden rounded-[2rem] border ${ZONE_BORDER[zoneId]} bg-[#eadbb8]
          shadow-[0_30px_90px_rgba(57,39,18,0.28)] ring-1 ring-[#f8edd7]/60
          p-3 md:p-4
        `}
        style={{
          backgroundImage: [
            'radial-gradient(circle at top, rgba(255,255,255,0.34), transparent 38%)',
            'linear-gradient(180deg, rgba(248,237,215,0.36), rgba(248,237,215,0.04))',
            'url("https://www.transparenttextures.com/patterns/old-paper.png")',
          ].join(', '),
        }}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${theme.glow}`} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(42,26,10,0.05),transparent_58%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/20 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#3c2613]/18 to-transparent" />

        <div className="relative flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-[9px] uppercase tracking-[0.45em] font-black text-[#8a6b44]">Campaign Board</div>
            <div className="mt-1 text-2xl md:text-3xl font-black text-[#2a1a0a] uppercase tracking-tight">
              {zoneName}
            </div>
            <p className="mt-1 max-w-2xl text-xs md:text-sm leading-relaxed text-[#5e4a2f]">
              {zoneDescription}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 xl:min-w-[17rem]">
            <div className="rounded-2xl border border-[#b58a53] bg-[#f5ead0]/95 px-4 py-3 shadow-[0_10px_24px_rgba(42,26,10,0.08)]">
              <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Live Objective</div>
              <div className="mt-1 text-sm font-serif italic text-[#2a1a0a] leading-snug">
                {objective}
              </div>
            </div>
            <div className="rounded-2xl border border-[#8f744f] bg-[#f5ead0]/95 px-4 py-3 shadow-[0_10px_24px_rgba(42,26,10,0.08)]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Signal</div>
                  <div className="mt-1 text-xs font-black uppercase tracking-widest text-[#2a1a0a]">
                    {activeDroneCount > 0 ? 'Hostile movement detected' : 'Area clear'}
                  </div>
                </div>
                <div className={`h-3 w-3 rounded-full ${activeDroneCount > 0 ? 'bg-[#b44a3c] animate-pulse' : 'bg-[#67845c]'}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#b59360] bg-[#f5ead0] px-3 py-1.5 text-[9px] uppercase tracking-[0.3em] font-black text-[#7a6040]">
            <span className="w-2 h-2 rounded-full bg-[#b5874a]" /> You
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#8c7a53] bg-[#f5ead0] px-3 py-1.5 text-[9px] uppercase tracking-[0.3em] font-black text-[#7a6040]">
            <span className="w-2 h-2 rounded-full bg-[#6f8b5b]" /> Partner
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#8b6b57] bg-[#f5ead0] px-3 py-1.5 text-[9px] uppercase tracking-[0.3em] font-black text-[#7a6040]">
            <span className="w-2 h-2 rounded-full bg-[#8b6b57]" /> {activeDroneCount} Drone{activeDroneCount === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#8a6b44] bg-[#f5ead0] px-3 py-1.5 text-[9px] uppercase tracking-[0.3em] font-black text-[#7a6040]">
            Hover tiles for intel
          </span>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-[1.5rem] border border-[#97754e] bg-[#eadbb8]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(42,26,10,0.03)_1px,transparent_1px),linear-gradient(180deg,rgba(42,26,10,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-55" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(248,237,215,0.1),transparent_65%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-3 border-b border-white/20 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)]" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-3 border-r border-white/15 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.18),transparent)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 border-t border-black/10 bg-[linear-gradient(90deg,transparent,rgba(42,26,10,0.18),transparent)]" />
          <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-[rgba(255,255,255,0.28)] bg-[#f5ead0]/85 px-3 py-1 text-[8px] font-black uppercase tracking-[0.35em] text-[#6e5535] shadow-[0_8px_20px_rgba(42,26,10,0.10)]">
            {theme.stamp}
          </div>

          <div className="relative overflow-auto">
            <div style={{ width: boardWidth }}>
              {(grid || []).map((row, r) => (
                <div key={r} className="flex">
                  {row.map((tile, c) => {
                    const meta = TILE_META[tile];
                    const isPlayer = playerPos[0] === r && playerPos[1] === c;
                    const isP2 = p2Pos && p2Pos[0] === r && p2Pos[1] === c;
                    const isDrone = drones.some(d => d[0] === r && d[1] === c);
                    const showDualMarker = isPlayer && isP2;
                    const tileTexture = getTileTexture(tile, zoneId);
                    const isHovered = hoveredTile?.row === r && hoveredTile?.col === c;

                    return (
                      <div
                        key={c}
                        title={meta.label}
                        onMouseEnter={() => setHoveredTile({ row: r, col: c, tile })}
                        onMouseLeave={() => setHoveredTile(null)}
                        className={`
                          group relative flex items-center justify-center overflow-hidden transition-all duration-150
                          ${tile === 'wall' ? '' : 'border border-[#8f744f]/28'}
                          ${isDrone ? 'bg-[#b44a3c]' : 'bg-[#eadbb8]'}
                          ${isHovered ? 'z-10 scale-[1.04] ring-2 ring-[#c79a58] ring-inset' : ''}
                        `}
                        style={{
                          width: cellPx,
                          height: cellPx,
                          backgroundImage: [
                            'linear-gradient(180deg, rgba(255,248,231,0.08), rgba(34,20,7,0.12))',
                            `url("${tileTexture}")`,
                          ].join(', '),
                          backgroundSize: 'cover, cover',
                          backgroundPosition: 'center, center',
                          backgroundBlendMode: 'soft-light, normal',
                          filter: isDrone ? 'saturate(0.85) brightness(0.78)' : undefined,
                          boxShadow: isHovered ? `0 0 0 1px ${theme.accent} inset` : undefined,
                        }}
                      >
                        <div
                          className="absolute inset-0 opacity-[0.07]"
                          style={{
                            backgroundImage:
                              'linear-gradient(135deg, rgba(42,26,10,0.15) 25%, transparent 25%, transparent 50%, rgba(42,26,10,0.15) 50%, rgba(42,26,10,0.15) 75%, transparent 75%, transparent)',
                            backgroundSize: '8px 8px',
                          }}
                        />

                        {!isPlayer && !isP2 && !isDrone && tile !== 'wall' && (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(248,237,215,0.16),transparent_65%)]" />
                        )}

                        {!isPlayer && !isP2 && !isDrone && tile !== 'walkable' && tile !== 'wall' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="rounded-full bg-[#f8edd7]/90 border border-[#b58a53] px-1 py-0.5 shadow-sm backdrop-blur-[1px]">
                              <span className={`block text-[9px] font-black leading-none ${meta.accent}`}>{meta.symbol}</span>
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
                            <AnimatedSprite
                              src="/assets/noir_sprite_mc.png"
                              alt="Player one"
                              delay={0}
                              className="absolute inset-0 w-full h-full"
                              imageClassName="w-full h-full object-contain p-0.5 drop-shadow-[0_2px_2px_rgba(42,26,10,0.35)]"
                            />
                            <AnimatedSprite
                              src="/assets/noir_sprite_partner.png"
                              alt="Player two"
                              delay={0.15}
                              className="absolute inset-0 w-full h-full"
                              imageClassName="w-full h-full object-contain p-0.5 translate-x-[2px] translate-y-[2px] opacity-90 mix-blend-normal"
                            />
                          </div>
                        ) : isPlayer ? (
                          <AnimatedSprite
                            src="/assets/noir_sprite_mc.png"
                            alt="Player"
                            className="w-full h-full"
                            imageClassName="w-full h-full object-contain p-0.5 drop-shadow-[0_2px_2px_rgba(42,26,10,0.35)]"
                          />
                        ) : isP2 ? (
                          <AnimatedSprite
                            src="/assets/noir_sprite_partner.png"
                            alt="Teammate"
                            delay={0.15}
                            className="w-full h-full"
                            imageClassName="w-full h-full object-contain p-0.5 opacity-95"
                          />
                        ) : isDrone ? (
                          <div className="flex flex-col items-center justify-center leading-none rounded-sm bg-[#7d2d25]/70 border border-[#f1c7aa]/40 p-0.5 shadow-[0_0_0_1px_rgba(42,26,10,0.12)]">
                            <ShieldAlert className="w-3.5 h-3.5 text-[#f8edd7]" />
                            <span className="text-[7px] font-black text-[#f8edd7] uppercase">Watch</span>
                          </div>
                        ) : (
                          <span className="opacity-0">.</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: hoveredMeta ? 1 : 0, y: hoveredMeta ? 0 : 6 }}
              className="pointer-events-none absolute right-3 top-3 w-52 rounded-2xl border border-[#b58a53] bg-[#f5ead0]/96 p-3 text-left shadow-[0_16px_36px_rgba(42,26,10,0.16)] backdrop-blur-sm"
            >
              <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Tile Intel</div>
              <div className="mt-1 text-sm font-black uppercase text-[#2a1a0a]">
                {hoveredMeta?.label || 'Hover a tile'}
              </div>
              <div className="mt-1 text-xs leading-snug text-[#5e4a2f]">
                {hoveredMeta?.hint || 'Move your cursor across the board to inspect the zone.'}
              </div>
              {hoveredTile && (
                <div className="mt-2 text-[9px] font-black uppercase tracking-[0.25em] text-[#8a6b44]">
                  Row {hoveredTile.row + 1} / Col {hoveredTile.col + 1}
                </div>
              )}
              <div className="mt-2 text-[9px] uppercase tracking-[0.25em] text-[#7a6040]">
                Zone texture: {theme.textureHint}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] uppercase tracking-[0.25em] font-black text-[#7a6040] md:grid-cols-4">
          <div className="flex items-center gap-2 rounded-full border border-[#b58a53] bg-[#f5ead0] px-3 py-2">
            <DoorOpen className="w-3 h-3 text-[#8b6b57]" /> Door
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#b58a53] bg-[#f5ead0] px-3 py-2">
            <FileText className="w-3 h-3 text-[#7a6540]" /> Terminal
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#b58a53] bg-[#f5ead0] px-3 py-2">
            <Package className="w-3 h-3 text-[#7a6a45]" /> Evidence
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#b58a53] bg-[#f5ead0] px-3 py-2">
            <UserRound className="w-3 h-3 text-[#8c5f22]" /> NPC
          </div>
        </div>
      </div>
    </div>
  );
}

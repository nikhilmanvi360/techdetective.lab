import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TileType, ZoneId } from '../../data/campaignData';

const TILE_SIZE = 48;

const PEOPLE = '/assets/people and map/PNG';
const MAP_WALLS = '/assets/map/Tiles/PNG/Walls';
const MAP_ROOF = '/assets/map/Tiles/PNG/Roof';
const MAP_OBJECTS = '/assets/map/Objects/PNG';

const ASSETS = {
  floor: `${MAP_WALLS}/walls_0002_Layer-3.png`,
  floorAlt: `${MAP_WALLS}/walls_0007_Layer-8.png`,
  wall: `${MAP_WALLS}/walls_0051_Layer-0.png`,
  roof: `${MAP_ROOF}/roof_0036_Layer-0.png`,
  door: `${MAP_WALLS}/walls_0040_Layer-41.png`,
  terminal: `${MAP_OBJECTS}/objects_house_0007_Layer-8.png`,
  evidence: `${MAP_OBJECTS}/objects_house_0017_Layer-18.png`,
  decor: `${PEOPLE}/Decorative_cracks.png`,
  playerIdle: `${PEOPLE}/Citizen1_Idle.png`,
  playerWalk: `${PEOPLE}/Citizen1_Walk.png`,
  partner: `${PEOPLE}/Citizen2_Idle.png`,
  npc1: `${PEOPLE}/Talking_person1.png`,
  npc2: `${PEOPLE}/Talking_person2.png`,
  drone: `${PEOPLE}/Fighter2_Idle.png`,
};

type TileAssetConfig = {
  floor: string;
  object?: string;
  overlay?: string;
  objectScale?: number;
  objectOffsetY?: number;
  glow?: string;
  dark?: boolean;
};

const TILE_CONFIG: Record<TileType, TileAssetConfig> = {
  walkable: {
    floor: ASSETS.floor,
    overlay: ASSETS.decor,
  },
  wall: {
    floor: ASSETS.wall,
    overlay: ASSETS.roof,
    dark: true,
  },
  npc: {
    floor: ASSETS.floorAlt,
    object: ASSETS.npc1,
    objectScale: 0.76,
    objectOffsetY: 3,
    glow: 'rgba(212, 160, 23, 0.32)',
  },
  terminal: {
    floor: ASSETS.floorAlt,
    object: ASSETS.terminal,
    objectScale: 0.72,
    objectOffsetY: 4,
    glow: 'rgba(124, 200, 255, 0.22)',
  },
  item: {
    floor: ASSETS.floorAlt,
    object: ASSETS.evidence,
    objectScale: 0.76,
    objectOffsetY: 4,
    glow: 'rgba(236, 208, 88, 0.32)',
  },
  gate: {
    floor: ASSETS.door,
    objectScale: 0.78,
    objectOffsetY: 0,
    glow: 'rgba(212, 160, 23, 0.24)',
  },
  exit: {
    floor: ASSETS.door,
    objectScale: 0.78,
    objectOffsetY: 0,
    glow: 'rgba(92, 194, 106, 0.30)',
  },
};

interface MapRendererProps {
  grid: TileType[][];
  playerPos: [number, number];
  p2Pos?: [number, number];
  zoneId: ZoneId;
  zoneName: string;
  objective: string;
  drones?: [number, number][];
  canInteract?: boolean;
  playerMoving?: boolean;
}

function useViewportSize() {
  const [viewport, setViewport] = useState(() => ({
    w: typeof window === 'undefined' ? 0 : window.innerWidth,
    h: typeof window === 'undefined' ? 0 : window.innerHeight,
  }));

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return viewport;
}

function coordKey(row: number, col: number) {
  return `${row},${col}`;
}

function accentForZone(zoneId: ZoneId) {
  switch (zoneId) {
    case 'cafeteria':
      return '#b5874a';
    case 'library':
      return '#5a7a4a';
    case 'maintenance':
      return '#7a5a3a';
    case 'admin_core':
      return '#8B2020';
    default:
      return '#d4a017';
  }
}

function TileCell({
  tile,
  row,
  col,
  isPlayer,
  isPlayerMoving,
  isP2,
  isDrone,
  showInteract,
  tick,
}: {
  tile: TileType;
  row: number;
  col: number;
  isPlayer: boolean;
  isPlayerMoving: boolean;
  isP2: boolean;
  isDrone: boolean;
  showInteract: boolean;
  tick: number;
}) {
  const cfg = TILE_CONFIG[tile];
  const playerSprite = isPlayerMoving ? ASSETS.playerWalk : ASSETS.playerIdle;
  const npcSprite = tick % 2 === 0 ? ASSETS.npc1 : ASSETS.npc2;
  const npcBob = tick % 2 === 0 ? 0 : -1;
  const objectScale = cfg.objectScale ?? 0.75;
  const objectOffsetY = cfg.objectOffsetY ?? 0;
  const crackShift = ((row * 13 + col * 17) % 96) / 2;

  return (
    <div
      className="absolute overflow-hidden select-none"
      style={{
        left: col * TILE_SIZE,
        top: row * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
        imageRendering: 'pixelated',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${cfg.floor}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: cfg.dark ? 'brightness(0.66) saturate(0.72)' : 'none',
        }}
      />

      {cfg.overlay && (
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: `url("${cfg.overlay}")`,
            backgroundSize: '96px 96px',
            backgroundRepeat: 'repeat',
            backgroundPosition: `${crackShift}px ${crackShift / 3}px`,
            mixBlendMode: tile === 'wall' ? 'screen' : 'soft-light',
          }}
        />
      )}

      {cfg.glow && (
        <div
          className="absolute inset-0"
          style={{
            boxShadow: `inset 0 0 16px 4px ${cfg.glow}`,
          }}
        />
      )}

      {tile === 'exit' && (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent 12%, rgba(92,194,106,0.08) 100%)',
          }}
        />
      )}

      {!isPlayer && !isP2 && !isDrone && cfg.object && (
        <div
          className="absolute inset-0 flex items-end justify-center"
          style={{ transform: `translateY(${objectOffsetY}px)` }}
        >
          <img
            src={cfg.object}
            alt={tile}
            className="select-none object-contain"
            style={{
              width: `${Math.round(TILE_SIZE * objectScale)}px`,
              height: `${Math.round(TILE_SIZE * objectScale)}px`,
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.78))',
            }}
          />
        </div>
      )}

      {isPlayer && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.img
            src={playerSprite}
            alt="Player"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
            className="select-none object-contain"
            style={{
              width: 40,
              height: 40,
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.9)) drop-shadow(0 0 6px rgba(212,160,23,0.6))',
            }}
          />
        </div>
      )}

      {isP2 && !isPlayer && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.img
            src={ASSETS.partner}
            alt="Partner"
            animate={{ y: [0, -1, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            className="select-none object-contain"
            style={{
              width: 38,
              height: 38,
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.85)) drop-shadow(0 0 5px rgba(92,194,106,0.5))',
            }}
          />
        </div>
      )}

      {isDrone && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.img
            src={ASSETS.drone}
            alt="Drone"
            animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.02, 1] }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
            className="select-none object-contain"
            style={{
              width: 38,
              height: 38,
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 0 8px rgba(220,50,50,0.8)) brightness(0.8) sepia(0.5) hue-rotate(340deg)',
            }}
          />
        </div>
      )}

      {tile === 'npc' && !isPlayer && !isP2 && !isDrone && (
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <motion.img
            src={npcSprite}
            alt="NPC"
            animate={{ y: [0, npcBob, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="select-none object-contain"
            style={{
              width: 36,
              height: 36,
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.8))',
            }}
          />
        </div>
      )}

      {showInteract && (
        <motion.div
          animate={{ y: [-2, 2, -2], opacity: [0.82, 1, 0.82] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        >
          <div
            className="rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-[0.3em] uppercase shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
            style={{
              background: 'rgba(12, 10, 7, 0.86)',
              border: '1px solid rgba(212, 160, 23, 0.82)',
              color: '#f0e0a0',
            }}
          >
            [E]
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function MapRenderer({
  grid,
  playerPos,
  p2Pos,
  zoneId,
  zoneName,
  objective,
  drones = [],
  canInteract = false,
  playerMoving = false,
}: MapRendererProps) {
  const viewport = useViewportSize();
  const [pulseTick, setPulseTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setPulseTick(t => t + 1), 550);
    return () => window.clearInterval(interval);
  }, []);

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const mapWidth = cols * TILE_SIZE;
  const mapHeight = rows * TILE_SIZE;
  const camX = Math.round(playerPos[1] * TILE_SIZE + TILE_SIZE / 2 - viewport.w / 2);
  const camY = Math.round(playerPos[0] * TILE_SIZE + TILE_SIZE / 2 - viewport.h / 2);
  const maxCamX = Math.max(0, mapWidth - viewport.w);
  const maxCamY = Math.max(0, mapHeight - viewport.h);
  const clampedCamX = Math.max(0, Math.min(camX, maxCamX));
  const clampedCamY = Math.max(0, Math.min(camY, maxCamY));

  const startCol = Math.max(0, Math.floor(clampedCamX / TILE_SIZE) - 2);
  const endCol = Math.min(cols, Math.ceil((clampedCamX + viewport.w) / TILE_SIZE) + 2);
  const startRow = Math.max(0, Math.floor(clampedCamY / TILE_SIZE) - 2);
  const endRow = Math.min(rows, Math.ceil((clampedCamY + viewport.h) / TILE_SIZE) + 2);

  const droneSet = new Set(drones.map(([row, col]) => coordKey(row, col)));
  const interactionTargets = new Set<string>();

  if (canInteract) {
    const [pr, pc] = playerPos;
    for (let row = Math.max(0, pr - 1); row <= Math.min(rows - 1, pr + 1); row += 1) {
      for (let col = Math.max(0, pc - 1); col <= Math.min(cols - 1, pc + 1); col += 1) {
        if (row === pr && col === pc) continue;
        const tile = grid[row]?.[col];
        if (tile && ['npc', 'terminal', 'item', 'gate', 'exit'].includes(tile)) {
          interactionTargets.add(coordKey(row, col));
        }
      }
    }
    const currentTile = grid[pr]?.[pc];
    if (currentTile && ['npc', 'terminal', 'item', 'gate', 'exit'].includes(currentTile)) {
      interactionTargets.add(coordKey(pr, pc));
    }
  }

  const accent = accentForZone(zoneId);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black text-[#f4e6c4]"
      style={{
        background: [
          'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 46%)',
          'radial-gradient(ellipse at center, rgba(0,0,0,0) 20%, rgba(5,3,2,0.92) 100%)',
          'linear-gradient(180deg, #1b130b 0%, #0c0906 100%)',
        ].join(', '),
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, transparent 34%, rgba(5, 3, 2, 0.92) 100%)`,
        }}
      />

      <motion.div
        className="absolute"
        animate={{ x: -clampedCamX, y: -clampedCamY }}
        transition={{ type: 'tween', duration: 0.08, ease: 'linear' }}
        style={{
          width: mapWidth,
          height: mapHeight,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, rgba(181,135,74,0.06), rgba(139,32,32,0.03))`,
          }}
        />

        {grid.slice(startRow, endRow).map((row, rowOffset) => {
          const rowIndex = startRow + rowOffset;
          return row.slice(startCol, endCol).map((tile, colOffset) => {
            const colIndex = startCol + colOffset;
            const isPlayer = playerPos[0] === rowIndex && playerPos[1] === colIndex;
            const isP2 = !!p2Pos && p2Pos[0] === rowIndex && p2Pos[1] === colIndex;
            const isDrone = droneSet.has(coordKey(rowIndex, colIndex));
            const showInteract = interactionTargets.has(coordKey(rowIndex, colIndex));

            return (
              <div key={coordKey(rowIndex, colIndex)}>
                <TileCell
                  tile={tile}
                  row={rowIndex}
                  col={colIndex}
                isPlayer={isPlayer}
                isPlayerMoving={playerMoving}
                isP2={isP2}
                isDrone={isDrone}
                showInteract={showInteract}
                tick={pulseTick}
              />
              </div>
            );
          });
        })}

        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: playerPos[1] * TILE_SIZE + TILE_SIZE / 2 - 140,
            top: playerPos[0] * TILE_SIZE + TILE_SIZE / 2 - 140,
            width: 280,
            height: 280,
            background: `radial-gradient(circle, rgba(212,160,23,0.15) 0%, rgba(212,160,23,0.06) 34%, transparent 72%)`,
          }}
        />
      </motion.div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.48), inset 0 0 160px rgba(0,0,0,0.68)`,
        }}
      />

      <div className="absolute top-4 left-4 z-30 pointer-events-none">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md"
          style={{
            background: 'rgba(12, 10, 7, 0.62)',
            border: `1px solid ${accent}55`,
          }}
        >
          <span className="text-[9px] font-black tracking-[0.45em] uppercase" style={{ color: accent }}>
            ◆
          </span>
          <span className="text-[11px] font-black tracking-[0.3em] uppercase text-[#f4e6c4]">
            {zoneName}
          </span>
        </div>
      </div>

      <motion.div
        key={objective}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[min(860px,calc(100vw-4rem))]"
      >
        <div
          className="overflow-hidden rounded-full backdrop-blur-md"
          style={{
            background: 'rgba(10, 8, 5, 0.55)',
            border: '1px solid rgba(212,160,23,0.2)',
          }}
        >
          <div
            className="h-0.5"
            style={{
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            }}
          />
          <div className="flex items-center gap-3 px-4 py-2">
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-[#a07830]">
              Objective
            </span>
            <span className="text-[11px] font-medium leading-snug text-[#f4e6c4] truncate">
              {objective}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[min(1040px,calc(100vw-2rem))]">
        <div
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl px-5 py-3 backdrop-blur-md"
          style={{
            background: 'rgba(10, 8, 5, 0.74)',
            border: '1px solid rgba(212,160,23,0.18)',
          }}
        >
          {[
            { key: 'WASD / Arrows', label: 'Move' },
            { key: 'E', label: 'Interact' },
            { key: 'I', label: 'Inventory' },
            { key: 'N', label: 'Notebook' },
            { key: 'ESC', label: 'Close' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <kbd
                className="rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.35em]"
                style={{
                  color: accent,
                  background: 'rgba(212,160,23,0.08)',
                  border: '1px solid rgba(212,160,23,0.32)',
                }}
              >
                {key}
              </kbd>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#7a6040]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-screen"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 52%, rgba(0,0,0,0.75) 100%)',
        }}
      />
    </div>
  );
}

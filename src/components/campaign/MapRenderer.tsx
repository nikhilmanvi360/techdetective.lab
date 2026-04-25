import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { TileType, ZoneId } from '../../data/campaignData';

const TILE_SIZE = 56;
const FRAME_W = 96;
const FRAME_H = 32;

type Facing = 0 | 1 | 2 | 3;

type SpriteSheet = {
  src: string;
  cols: number;
  rows: number;
};

const SPRITES = {
  playerIdle: { src: '/assets/people and map/PNG/Citizen1_Idle.png', cols: 4, rows: 4 } satisfies SpriteSheet,
  playerWalk: { src: '/assets/people and map/PNG/Citizen1_Walk.png', cols: 2, rows: 4 } satisfies SpriteSheet,
  partnerIdle: { src: '/assets/people and map/PNG/Citizen2_Idle.png', cols: 4, rows: 4 } satisfies SpriteSheet,
  partnerWalk: { src: '/assets/people and map/PNG/Citizen2_Walk.png', cols: 2, rows: 4 } satisfies SpriteSheet,
  npcA: { src: '/assets/people and map/PNG/Talking_person1.png', cols: 4, rows: 1 } satisfies SpriteSheet,
  npcB: { src: '/assets/people and map/PNG/Talking_person2.png', cols: 4, rows: 1 } satisfies SpriteSheet,
  droneIdle: { src: '/assets/people and map/PNG/Fighter2_Idle.png', cols: 4, rows: 4 } satisfies SpriteSheet,
  droneWalk: { src: '/assets/people and map/PNG/Fighter2_Walk.png', cols: 4, rows: 4 } satisfies SpriteSheet,
  evidence: '/assets/people and map/PNG/Attacked_Manequin1_with_shadow.png',
  cracks: '/assets/people and map/PNG/Decorative_cracks.png',
  terminal: '/assets/people and map/PNG/Interior_objects.png',
  floor: '/assets/map/Tiles/PNG/Walls/walls_0002_Layer-3.png',
  floorAlt: '/assets/map/Tiles/PNG/Walls/walls_0007_Layer-8.png',
  wall: '/assets/map/Tiles/PNG/Walls/walls_0051_Layer-0.png',
  roof: '/assets/map/Tiles/PNG/Roof/roof_0036_Layer-0.png',
  door: '/assets/map/Tiles/PNG/Walls/walls_0040_Layer-41.png',
};

type TileAssetConfig = {
  floor: string;
  overlay?: string;
  object?: string;
  objectScale?: number;
  objectOffsetY?: number;
  glow?: string;
  dark?: boolean;
};

const TILE_CONFIG: Record<TileType, TileAssetConfig> = {
  walkable: {
    floor: SPRITES.floor,
    overlay: SPRITES.cracks,
  },
  wall: {
    floor: SPRITES.wall,
    overlay: SPRITES.roof,
    dark: true,
  },
  npc: {
    floor: SPRITES.floorAlt,
    object: SPRITES.terminal,
    objectScale: 0.66,
    objectOffsetY: 2,
    glow: 'rgba(212, 160, 23, 0.24)',
  },
  terminal: {
    floor: SPRITES.floorAlt,
    object: SPRITES.terminal,
    objectScale: 0.68,
    objectOffsetY: 4,
    glow: 'rgba(124, 200, 255, 0.22)',
  },
  item: {
    floor: SPRITES.floorAlt,
    object: SPRITES.evidence,
    objectScale: 0.66,
    objectOffsetY: 3,
    glow: 'rgba(236, 208, 88, 0.32)',
  },
  gate: {
    floor: SPRITES.door,
    objectScale: 0.78,
    glow: 'rgba(212, 160, 23, 0.26)',
  },
  exit: {
    floor: SPRITES.door,
    objectScale: 0.78,
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

function useTicker(interval: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), interval);
    return () => window.clearInterval(id);
  }, [interval]);
  return tick;
}

function key(row: number, col: number) {
  return `${row},${col}`;
}

function directionFromDelta(dr: number, dc: number): Facing | null {
  if (dr === 0 && dc === 0) return null;
  if (Math.abs(dr) >= Math.abs(dc)) {
    return dr > 0 ? 0 : 3;
  }
  return dc < 0 ? 1 : 2;
}

function zoneAccent(zoneId: ZoneId) {
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

function SheetSprite({
  sheet,
  frameCol,
  frameRow,
  width = FRAME_W,
  height = FRAME_H,
  scale = 1,
  filter,
  glow,
  bob,
}: {
  sheet: SpriteSheet;
  frameCol: number;
  frameRow: number;
  width?: number;
  height?: number;
  scale?: number;
  filter?: string;
  glow?: string;
  bob?: boolean;
}) {
  const sheetWidth = sheet.cols * FRAME_W;
  const sheetHeight = sheet.rows * FRAME_H;
  const spriteWidth = width * scale;
  const spriteHeight = height * scale;

  const sprite = (
    <div
      style={{
        width: spriteWidth,
        height: spriteHeight,
        backgroundImage: `url("${sheet.src}")`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${sheetWidth}px ${sheetHeight}px`,
        backgroundPosition: `-${frameCol * FRAME_W}px -${frameRow * FRAME_H}px`,
        imageRendering: 'pixelated',
        filter: filter ?? 'drop-shadow(0 4px 8px rgba(0,0,0,0.9))',
      }}
    />
  );

  return (
    <div style={{ position: 'relative' }}>
      {glow && (
        <div
          className="absolute inset-0"
          style={{
            transform: 'translateY(6px)',
            width: spriteWidth,
            height: spriteHeight,
            filter: `blur(8px)`,
            background: glow,
            opacity: 0.35,
          }}
        />
      )}
      {bob ? (
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut' }}
        >
          {sprite}
        </motion.div>
      ) : (
        sprite
      )}
    </div>
  );
}

function TileCell({
  tile,
  row,
  col,
  isPlayer,
  isPlayerWalking,
  playerFacing,
  isP2,
  p2Walking,
  p2Facing,
  isDrone,
  showInteract,
  idleTick,
  fastTick,
}: {
  tile: TileType;
  row: number;
  col: number;
  isPlayer: boolean;
  isPlayerWalking: boolean;
  playerFacing: Facing;
  isP2: boolean;
  p2Walking: boolean;
  p2Facing: Facing;
  isDrone: boolean;
  showInteract: boolean;
  idleTick: number;
  fastTick: number;
}) {
  const cfg = TILE_CONFIG[tile];
  const npcVariant = (row + col) % 2 === 0 ? SPRITES.npcA : SPRITES.npcB;
  const background = tile === 'wall'
    ? 'linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.15))'
    : undefined;

  const npcFrame = idleTick % npcVariant.cols;
  const playerSheet = isPlayerWalking ? SPRITES.playerWalk : SPRITES.playerIdle;
  const playerFrame = isPlayerWalking ? fastTick % playerSheet.cols : idleTick % playerSheet.cols;
  const p2Sheet = p2Walking ? SPRITES.partnerWalk : SPRITES.partnerIdle;
  const p2Frame = p2Walking ? fastTick % p2Sheet.cols : idleTick % p2Sheet.cols;
  const droneSheet = isDrone ? (fastTick % 2 === 0 ? SPRITES.droneIdle : SPRITES.droneWalk) : SPRITES.droneIdle;
  const droneFrame = fastTick % droneSheet.cols;

  return (
    <div
      className="absolute select-none overflow-hidden"
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
          filter: cfg.dark ? 'brightness(0.65) saturate(0.72)' : 'none',
        }}
      />

      {cfg.overlay && (
        <div
          className="absolute inset-0 opacity-75"
          style={{
            backgroundImage: `url("${cfg.overlay}")`,
            backgroundSize: '96px 96px',
            backgroundRepeat: 'repeat',
            backgroundPosition: `${((row * 11) + (col * 7)) % 96}px ${((row * 5) + (col * 13)) % 96}px`,
            mixBlendMode: tile === 'wall' ? 'screen' : 'soft-light',
          }}
        />
      )}

      {background && <div className="absolute inset-0" style={{ background }} />}

      {cfg.glow && (
        <div
          className="absolute inset-0"
          style={{ boxShadow: `inset 0 0 16px 4px ${cfg.glow}` }}
        />
      )}

      {tile === 'exit' && (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent 10%, rgba(92,194,106,0.08) 100%)',
          }}
        />
      )}

      {!isPlayer && !isP2 && !isDrone && cfg.object && (
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          {tile === 'npc' ? (
          <SheetSprite
            sheet={npcVariant}
            frameCol={npcFrame}
            frameRow={0}
            width={FRAME_W}
            height={FRAME_H}
            scale={1.45}
            bob
            glow="rgba(212,160,23,0.18)"
          />
        ) : (
            <img
              src={cfg.object}
              alt={tile}
              style={{
                width: Math.round(TILE_SIZE * (cfg.objectScale ?? 0.68)),
                height: Math.round(TILE_SIZE * (cfg.objectScale ?? 0.68)),
                transform: `translateY(${cfg.objectOffsetY ?? 0}px)`,
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.85))',
              }}
            />
          )}
        </div>
      )}

      {isPlayer && (
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <SheetSprite
            sheet={playerSheet}
            frameCol={playerFrame}
            frameRow={playerFacing}
            width={FRAME_W}
            height={FRAME_H}
            scale={1.55}
            bob={!isPlayerWalking}
            glow="rgba(212,160,23,0.22)"
            filter="drop-shadow(0 5px 10px rgba(0,0,0,0.92)) drop-shadow(0 0 8px rgba(212,160,23,0.55))"
          />
        </div>
      )}

      {isP2 && !isPlayer && (
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <SheetSprite
            sheet={p2Sheet}
            frameCol={p2Frame}
            frameRow={p2Facing}
            width={FRAME_W}
            height={FRAME_H}
            scale={1.55}
            bob={!p2Walking}
            glow="rgba(92,194,106,0.18)"
            filter="drop-shadow(0 5px 10px rgba(0,0,0,0.9)) drop-shadow(0 0 7px rgba(92,194,106,0.45))"
          />
        </div>
      )}

      {isDrone && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ opacity: [0.75, 1, 0.75], scale: [1, 1.05, 1], rotate: [-1, 1, -1] }}
            transition={{ duration: 0.72, repeat: Infinity, ease: 'easeInOut' }}
          >
            <SheetSprite
              sheet={droneSheet}
              frameCol={droneFrame}
              frameRow={0}
              width={FRAME_W}
              height={FRAME_H}
              scale={1.5}
              glow="rgba(220,50,50,0.22)"
              filter="drop-shadow(0 0 10px rgba(220,40,40,0.88)) brightness(0.78) sepia(0.5) hue-rotate(335deg)"
            />
          </motion.div>
        </div>
      )}

      {showInteract && (
        <motion.div
          animate={{ y: [-2, 2, -2], opacity: [0.82, 1, 0.82] }}
          transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        >
          <div
            className="rounded-full px-2 py-0.5 text-[9px] font-black tracking-[0.3em] uppercase"
            style={{
              background: 'rgba(10,8,5,0.88)',
              border: '1px solid rgba(212,160,23,0.85)',
              color: '#f0e0a0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
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
  const idleTick = useTicker(220);
  const fastTick = useTicker(100);

  const prevPlayerPosRef = useRef(playerPos);
  const facingRef = useRef<Facing>(0);
  const prevP2PosRef = useRef(p2Pos);
  const p2FacingRef = useRef<Facing>(0);
  const [p2Moving, setP2Moving] = useState(false);
  const p2MoveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevPlayerPosRef.current;
    const dr = playerPos[0] - prev[0];
    const dc = playerPos[1] - prev[1];
    const nextFacing = directionFromDelta(dr, dc);
    if (nextFacing !== null) {
      facingRef.current = nextFacing;
    }
    prevPlayerPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    if (!p2Pos) return;
    const prev = prevP2PosRef.current;
    if (!prev) {
      prevP2PosRef.current = p2Pos;
      return;
    }
    const dr = p2Pos[0] - prev[0];
    const dc = p2Pos[1] - prev[1];
    const nextFacing = directionFromDelta(dr, dc);
    if (nextFacing !== null) {
      p2FacingRef.current = nextFacing;
      setP2Moving(true);
      if (p2MoveTimerRef.current !== null) {
        window.clearTimeout(p2MoveTimerRef.current);
      }
      p2MoveTimerRef.current = window.setTimeout(() => setP2Moving(false), 300);
    }
    prevP2PosRef.current = p2Pos;
  }, [p2Pos]);

  useEffect(() => {
    return () => {
      if (p2MoveTimerRef.current !== null) {
        window.clearTimeout(p2MoveTimerRef.current);
      }
    };
  }, []);

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const mapWidth = cols * TILE_SIZE;
  const mapHeight = rows * TILE_SIZE;

  const camera = useMemo(() => {
    const camX = Math.round(playerPos[1] * TILE_SIZE + TILE_SIZE / 2 - viewport.w / 2);
    const camY = Math.round(playerPos[0] * TILE_SIZE + TILE_SIZE / 2 - viewport.h / 2);
    return {
      x: Math.max(0, Math.min(camX, Math.max(0, mapWidth - viewport.w))),
      y: Math.max(0, Math.min(camY, Math.max(0, mapHeight - viewport.h))),
    };
  }, [mapWidth, mapHeight, playerPos, viewport.h, viewport.w]);

  const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
  const endCol = Math.min(cols, Math.ceil((camera.x + viewport.w) / TILE_SIZE) + 1);
  const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
  const endRow = Math.min(rows, Math.ceil((camera.y + viewport.h) / TILE_SIZE) + 1);

  const droneSet = new Set(drones.map(([row, col]) => key(row, col)));
  const interactSet = new Set<string>();

  if (canInteract) {
    const [pr, pc] = playerPos;
    for (let row = Math.max(0, pr - 1); row <= Math.min(rows - 1, pr + 1); row += 1) {
      for (let col = Math.max(0, pc - 1); col <= Math.min(cols - 1, pc + 1); col += 1) {
        if (row === pr && col === pc) continue;
        const tile = grid[row]?.[col];
        if (tile && ['npc', 'terminal', 'item', 'gate', 'exit'].includes(tile)) {
          interactSet.add(key(row, col));
        }
      }
    }
    const currentTile = grid[pr]?.[pc];
    if (currentTile && ['npc', 'terminal', 'item', 'gate', 'exit'].includes(currentTile)) {
      interactSet.add(key(pr, pc));
    }
  }

  const accent = zoneAccent(zoneId);

  return (
    <div
      className="fixed inset-0 overflow-hidden text-[#f4e6c4]"
      style={{
        background: [
          'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 46%)',
          'radial-gradient(ellipse at center, rgba(0,0,0,0) 20%, rgba(5,3,2,0.92) 100%)',
          'linear-gradient(180deg, #1b130b 0%, #0c0906 100%)',
        ].join(', '),
      }}
    >
      <motion.div
        className="absolute"
        animate={{ x: -camera.x, y: -camera.y }}
        transition={{ type: 'tween', duration: 0.08, ease: 'linear' }}
        style={{ width: mapWidth, height: mapHeight }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, rgba(181,135,74,0.06) 0%, rgba(139,32,32,0.03) 60%, transparent 100%)',
          }}
        />

        {grid.slice(startRow, endRow).map((row, rowOffset) => {
          const rowIndex = startRow + rowOffset;
          return row.slice(startCol, endCol).map((tile, colOffset) => {
            const colIndex = startCol + colOffset;
            const isPlayer = playerPos[0] === rowIndex && playerPos[1] === colIndex;
            const isP2 = !!p2Pos && p2Pos[0] === rowIndex && p2Pos[1] === colIndex;
            const isDrone = droneSet.has(key(rowIndex, colIndex));
            const showInteract = interactSet.has(key(rowIndex, colIndex));

            return (
              <div key={key(rowIndex, colIndex)}>
                <TileCell
                  tile={tile}
                  row={rowIndex}
                  col={colIndex}
                  isPlayer={isPlayer}
                  isPlayerWalking={playerMoving}
                  playerFacing={facingRef.current}
                  isP2={isP2}
                  p2Walking={p2Moving}
                  p2Facing={p2FacingRef.current}
                  isDrone={isDrone}
                  showInteract={showInteract}
                  idleTick={idleTick}
                  fastTick={fastTick}
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
            background: 'radial-gradient(circle, rgba(212,160,23,0.16) 0%, rgba(212,160,23,0.06) 34%, transparent 72%)',
          }}
        />
      </motion.div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.48), inset 0 0 160px rgba(0,0,0,0.68)',
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
          ].map(({ key: shortcut, label }) => (
            <div key={shortcut} className="flex items-center gap-2">
              <kbd
                className="rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.35em]"
                style={{
                  color: accent,
                  background: 'rgba(212,160,23,0.08)',
                  border: '1px solid rgba(212,160,23,0.32)',
                }}
              >
                {shortcut}
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

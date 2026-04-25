import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { TileType, ZoneId } from '../../data/campaignData';

const TILE = 48; // Updated TILE size to 48 or 56 depending on how the map scales, let's stick to 48 as base

// ── Asset Definitions ──────────────────────────────────────────────────────────
// We define sprite sheet objects for characters, which have rows/cols
type SpriteSheet = {
  src: string;
  cols: number;
  rows: number;
};

const SP = {
  playerIdle: { src: '/assets/people and map/PNG/Citizen1_Idle.png',   cols: 4, rows: 4 },
  playerWalk: { src: '/assets/people and map/PNG/Citizen1_Walk.png',   cols: 9, rows: 4 },
  partner:    { src: '/assets/people and map/PNG/Citizen2_Idle.png',   cols: 4, rows: 4 },
  npc1:       { src: '/assets/people and map/PNG/Talking_person1.png', cols: 4, rows: 1 },
  npc2:       { src: '/assets/people and map/PNG/Talking_person2.png', cols: 4, rows: 1 },
  fighter:    { src: '/assets/people and map/PNG/Fighter2_Idle.png',   cols: 9, rows: 4 },
};

const OBJ = {
  evidence: '/assets/map/Objects/PNG/objects_house_0017_Layer-18.png',
};

// ── Theme Definitions ──────────────────────────────────────────────────────────
type ZoneTheme = {
  floor: string;
  floorAlt: string;
  wall: string;
  wallTop: string;
  ambient: string;
  accent: string;
};

const ZONE_THEME: Record<ZoneId, ZoneTheme> = {
  cafeteria: {
    floor: '#2c2520', floorAlt: '#26201b',
    wall: '#1f1b16', wallTop: '#352d24',
    ambient: 'rgba(212,160,23,0.08)',
    accent: '#d4a017',
  },
  library: {
    floor: '#1e261f', floorAlt: '#1a201b',
    wall: '#141a15', wallTop: '#243026',
    ambient: 'rgba(90,122,74,0.08)',
    accent: '#5a7a4a',
  },
  maintenance: {
    floor: '#252525', floorAlt: '#222222',
    wall: '#1a1a1a', wallTop: '#2e2e2e',
    ambient: 'rgba(122,90,58,0.1)',
    accent: '#7a5a3a',
  },
  admin_core: {
    floor: '#261b1b', floorAlt: '#201616',
    wall: '#1a1212', wallTop: '#362222',
    ambient: 'rgba(139,32,32,0.12)',
    accent: '#8b2020',
  },
};

// ─── Sprite Component ────────────────────────────────────────────────────────
const CHAR_W = 32;
const CHAR_H = 48;

function Sprite({
  sheet, frameCol, frameRow, filter, bounce
}: {
  sheet: SpriteSheet; frameCol: number; frameRow: number;
  filter?: string; bounce?: boolean;
}) {
  const [bgSize, setBgSize] = useState('auto');
  
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = (img.naturalWidth / sheet.cols) * (CHAR_H / (img.naturalHeight / sheet.rows));
    setBgSize(`${w * sheet.cols}px auto`);
  };

  const xPos = (frameCol / (sheet.cols - 1 || 1)) * 100;
  const yPos = (frameRow / (sheet.rows - 1 || 1)) * 100;

  return (
    <div style={{ width: CHAR_W, height: CHAR_H, position: 'relative' }}>
      <img src={sheet.src} onLoad={handleLoad} style={{ display: 'none' }} alt="" />
      <motion.div
        animate={bounce ? { y: [0, -2, 0] } : { y: 0 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: '100%', height: '100%',
          backgroundImage: `url('${sheet.src}')`,
          backgroundSize: bgSize,
          backgroundPosition: `${xPos}% ${yPos}%`,
          imageRendering: 'pixelated',
          filter,
        }}
      />
    </div>
  );
}

// ─── TileCell ────────────────────────────────────────────────────────────────
function TileCell({
  tile, row, col,
  theme, isPlayer, isPlayerWalking, isP2, isDrone, isNpc, showInteract, tick,
  fastTick, playerFacingRow = 0,
}: {
  tile: TileType; row: number; col: number;
  theme: ZoneTheme;
  isPlayer: boolean; isPlayerWalking: boolean;
  isP2: boolean; isDrone: boolean; isNpc: boolean;
  showInteract: boolean; tick: number;
  fastTick: number; playerFacingRow?: number;
}) {
  const isWall = tile === 'wall';
  const isAlt  = (row + col) % 2 === 0;

  const bgColor = isWall
    ? theme.wall
    : tile === 'gate' || tile === 'exit'
    ? (tile === 'exit' ? '#1a3020' : '#2a2010')
    : isAlt ? theme.floor : theme.floorAlt;

  const glowColor =
    tile === 'terminal' ? 'rgba(80,160,255,0.35)' :
    tile === 'item'     ? 'rgba(240,200,60,0.40)' :
    tile === 'gate'     ? 'rgba(200,140,20,0.30)' :
    tile === 'exit'     ? 'rgba(60,200,100,0.35)' :
    tile === 'npc'      ? 'rgba(212,160,23,0.28)' : null;

  return (
    <div className="absolute select-none" style={{ left: col * TILE, top: row * TILE, width: TILE, height: TILE }}>
      {/* Base tile */}
      <div className="absolute inset-0"
        style={{
          backgroundColor: bgColor,
          borderTop: isWall ? `3px solid ${theme.wallTop}` : undefined,
          boxShadow: !isWall ? 'inset 0 0 0 0.5px rgba(0,0,0,0.18)' : `inset 0 0 0 1px rgba(0,0,0,0.5)`,
        }}
      />

      {/* Glow overlay */}
      {glowColor && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 80%)` }} />
      )}
      {tile === 'exit' && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg,transparent 20%,rgba(60,200,100,0.15) 100%)' }} />
      )}

      {/* ── Objects ── */}
      {!isPlayer && !isP2 && !isDrone && !isNpc && (
        <>
          {tile === 'terminal' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div style={{ position: 'relative', width: 32, height: 26 }}>
                <div style={{
                  width: 32, height: 22,
                  background: 'linear-gradient(160deg,#1a2a3a 0%,#0a1520 100%)',
                  border: '2px solid #304060', borderRadius: 3,
                  boxShadow: '0 0 8px rgba(80,160,255,0.55), inset 0 0 6px rgba(40,120,220,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                  <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(80,180,255,0.07) 2px,rgba(80,180,255,0.07) 3px)' }}/>
                  <div style={{ width: 14, height: 2, background: 'rgba(100,200,255,0.9)', borderRadius: 1, boxShadow: '0 0 4px rgba(80,180,255,0.9)', position:'relative', zIndex:1 }}/>
                </div>
                <div style={{ width: 8, height: 4, background: '#1c2c3c', margin: '0 auto', borderRadius: '0 0 2px 2px', borderTop: '1px solid #304060' }}/>
              </div>
            </div>
          )}
          {tile === 'item' && (
             <div className="absolute inset-0 flex items-center justify-center">
               <img src={OBJ.evidence} alt="item" style={{ width: 36, height: 36, imageRendering: 'pixelated', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.9))' }} />
             </div>
          )}
          {tile === 'gate' && <div className="absolute inset-0 flex items-center justify-center text-2xl" style={{ fontSize: 26 }}>🚪</div>}
          {tile === 'exit' && <div className="absolute inset-0 flex items-center justify-center text-2xl" style={{ fontSize: 22 }}>⬆️</div>}
        </>
      )}

      {/* ── Characters ── */}
      {isNpc && !isPlayer && !isP2 && !isDrone && (
        <div className="absolute inset-0 flex items-end justify-center" style={{ paddingBottom: 2 }}>
          <Sprite sheet={tick % 2 === 0 ? SP.npc1 : SP.npc2} frameCol={0} frameRow={0} bounce />
        </div>
      )}

      {isPlayer && (
        <div className="absolute inset-0 flex items-end justify-center" style={{ paddingBottom: 2 }}>
          <Sprite
            sheet={isPlayerWalking ? SP.playerWalk : SP.playerIdle}
            frameCol={isPlayerWalking ? (fastTick % SP.playerWalk.cols) : 0}
            frameRow={playerFacingRow}
            filter="drop-shadow(0 4px 8px rgba(0,0,0,0.95)) drop-shadow(0 0 8px rgba(212,160,23,0.7))"
            bounce={!isPlayerWalking}
          />
        </div>
      )}

      {isP2 && !isPlayer && (
        <div className="absolute inset-0 flex items-end justify-center" style={{ paddingBottom: 2 }}>
          <Sprite sheet={SP.partner} frameCol={0} frameRow={0} filter="drop-shadow(0 4px 8px rgba(0,0,0,0.95)) drop-shadow(0 0 6px rgba(92,194,106,0.6))" bounce />
        </div>
      )}

      {isDrone && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div animate={{ opacity: [0.75, 1, 0.75], scale: [1, 1.06, 1] }} transition={{ duration: 0.65, repeat: Infinity }}>
            <Sprite
              sheet={SP.fighter}
              frameCol={fastTick % SP.fighter.cols}
              frameRow={0}
              filter="drop-shadow(0 0 10px rgba(220,40,40,0.9)) brightness(0.7) sepia(0.6) hue-rotate(330deg)"
            />
          </motion.div>
        </div>
      )}

      {/* Interact Prompt Indicator */}
      {showInteract && (
        <motion.div initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, repeat: Infinity }} className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="rounded-full px-2 py-0.5 text-[9px] font-black tracking-[0.3em] uppercase" style={{ background: 'rgba(10,8,5,0.88)', border: '1px solid rgba(212,160,23,0.85)', color: '#f0e0a0', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>[E]</div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
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

function useViewport() {
  const [vp, setVp] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 800, h: typeof window !== 'undefined' ? window.innerHeight : 600 });
  useEffect(() => {
    const fn = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return vp;
}

function key(r: number, c: number) { return `${r},${c}`; }

export default function MapRenderer({
  grid, playerPos, p2Pos, zoneId, zoneName, objective,
  drones = [], canInteract = false, playerMoving = false,
}: MapRendererProps) {
  const vp    = useViewport();
  const theme = ZONE_THEME[zoneId];
  const [tick, setTick] = useState(0);
  const [fastTick, setFastTick] = useState(0);
  const [playerFacingRow, setPlayerFacingRow] = useState(0);
  const prevPosRef = useRef(playerPos);
  const tickRef = useRef(0);
  const fastTickRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => { tickRef.current += 1; setTick(tickRef.current); }, 500);
    const idFast = setInterval(() => { fastTickRef.current += 1; setFastTick(fastTickRef.current); }, 100);
    return () => { clearInterval(id); clearInterval(idFast); };
  }, []);

  useEffect(() => {
    const [pr, pc] = prevPosRef.current;
    const [nr, nc] = playerPos;
    if (nr > pr) setPlayerFacingRow(0);
    else if (nr < pr) setPlayerFacingRow(3);
    else if (nc < pc) setPlayerFacingRow(1);
    else if (nc > pc) setPlayerFacingRow(2);
    prevPosRef.current = playerPos;
  }, [playerPos]);

  const rows    = grid.length;
  const cols    = grid[0]?.length ?? 0;
  const mapW    = cols * TILE;
  const mapH    = rows * TILE;

  // Center camera on player
  const targetX = playerPos[1] * TILE + TILE / 2 - vp.w / 2;
  const targetY = playerPos[0] * TILE + TILE / 2 - vp.h / 2;
  const camX    = Math.max(0, Math.min(targetX, mapW - vp.w));
  const camY    = Math.max(0, Math.min(targetY, mapH - vp.h));

  // Viewport culling
  const c0 = Math.max(0, Math.floor(camX / TILE) - 1);
  const c1 = Math.min(cols, Math.ceil((camX + vp.w) / TILE) + 1);
  const r0 = Math.max(0, Math.floor(camY / TILE) - 1);
  const r1 = Math.min(rows, Math.ceil((camY + vp.h) / TILE) + 1);

  const droneSet = new Set(drones.map(([r, c]) => key(r, c)));

  const interactSet = new Set<string>();
  if (canInteract) {
    const [pr, pc] = playerPos;
    for (let r = pr - 1; r <= pr + 1; r++) for (let c = pc - 1; c <= pc + 1; c++) {
      if (r === pr && c === pc) continue;
      const t = grid[r]?.[c];
      if (t && ['npc','terminal','item','gate','exit'].includes(t)) interactSet.add(key(r, c));
    }
    const cur = grid[pr]?.[pc];
    if (cur && ['npc','terminal','item','gate','exit'].includes(cur)) interactSet.add(key(pr, pc));
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0a0806' }}>
      <motion.div className="absolute" animate={{ x: -camX, y: -camY }} transition={{ type: 'tween', duration: 0.07, ease: 'linear' }} style={{ width: mapW, height: mapH }}>
        {/* Ambient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 40%, ${theme.ambient} 0%, transparent 70%)` }} />

        {/* Grid Cells */}
        {grid.slice(r0, r1).map((row, rOff) => {
          const ri = r0 + rOff;
          return row.slice(c0, c1).map((tile, cOff) => {
            const ci = c0 + cOff;
            const k  = key(ri, ci);
            return (
              <TileCell
                key={k} tile={tile} row={ri} col={ci} theme={theme}
                isPlayer={playerPos[0] === ri && playerPos[1] === ci}
                isPlayerWalking={playerMoving}
                isP2={!!p2Pos && p2Pos[0] === ri && p2Pos[1] === ci}
                isDrone={droneSet.has(k)}
                isNpc={tile === 'npc'}
                showInteract={interactSet.has(k)}
                tick={tick} fastTick={fastTick} playerFacingRow={playerFacingRow}
              />
            );
          });
        })}

        {/* Player Light Halo */}
        <div className="absolute pointer-events-none rounded-full" style={{ left: playerPos[1] * TILE + TILE / 2 - 120, top: playerPos[0] * TILE + TILE / 2 - 120, width: 240, height: 240, background: `radial-gradient(circle, rgba(212,160,23,0.18) 0%, rgba(212,160,23,0.06) 40%, transparent 70%)` }} />
      </motion.div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, transparent 45%, rgba(0,0,0,0.82) 100%)' }} />

      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.6) 0px,rgba(255,255,255,0.6) 1px,transparent 1px,transparent 3px)' }} />

      {/* Zone badge */}
      <div className="absolute top-4 left-4 z-30 pointer-events-none">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md" style={{ background: 'rgba(10,8,5,0.65)', border: `1px solid ${theme.accent}55` }}>
          <span className="text-[9px] font-black tracking-[0.45em] uppercase" style={{ color: theme.accent }}>◆</span>
          <span className="text-[11px] font-black tracking-[0.28em] uppercase text-[#f4e6c4]">{zoneName}</span>
        </div>
      </div>

      {/* Objective */}
      <motion.div key={objective} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[min(800px,calc(100vw-8rem))]">
        <div className="rounded-full backdrop-blur-md overflow-hidden" style={{ background: 'rgba(10,8,5,0.6)', border: `1px solid ${theme.accent}33` }}>
          <div className="h-px" style={{ background: `linear-gradient(90deg,transparent,${theme.accent},transparent)` }} />
          <div className="flex items-center gap-3 px-5 py-2">
            <span className="text-[8px] font-black uppercase tracking-[0.5em] shrink-0" style={{ color: theme.accent }}>Objective</span>
            <span className="text-[11px] font-medium text-[#f4e6c4] truncate">{objective}</span>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="flex items-center gap-5 px-5 py-2.5 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(10,8,5,0.75)', border: `1px solid ${theme.accent}22` }}>
          {[
            { k: 'WASD', l: 'Move' }, { k: 'E', l: 'Interact' }, { k: 'I', l: 'Inventory' }, { k: 'N', l: 'Notebook' }, { k: 'ESC', l: 'Close' },
          ].map(({ k: kb, l }) => (
            <div key={kb} className="flex items-center gap-1.5">
              <kbd className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest" style={{ color: theme.accent, background: `${theme.accent}14`, border: `1px solid ${theme.accent}44` }}>{kb}</kbd>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#6a5030]">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

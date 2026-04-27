import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { TileType, ZoneId } from '../../data/campaignData';
import { directionRow } from '../../utils/animation';

const TILE = 48; // Updated TILE size to 48 or 56 depending on how the map scales, let's stick to 48 as base

// ── Asset Definitions ──────────────────────────────────────────────────────────
// We define sprite sheet objects for characters, which have rows/cols
type SpriteSheet = {
  src: string;
  cols: number;
  rows: number;
};

const SP = {
  playerIdle: { src: '/assets/people and map/PNG/Citizen1_Idle_without_shadow.png',   cols: 4, rows: 4 },
  playerWalk: { src: '/assets/people and map/PNG/Citizen1_Walk_without_shadow.png',   cols: 6, rows: 4 },
  partnerIdle: { src: '/assets/people and map/PNG/Citizen2_Idle_without_shadow.png',   cols: 4, rows: 4 },
  partnerWalk: { src: '/assets/people and map/PNG/Citizen2_Walk_without_shadow.png',   cols: 6, rows: 4 },
  npc1:       { src: '/assets/people and map/PNG/Talking_person1_without_shadow.png', cols: 4, rows: 1 },
  npc2:       { src: '/assets/people and map/PNG/Talking_person2_without_shadow.png', cols: 4, rows: 1 },
  fighterIdle: { src: '/assets/people and map/PNG/Fighter2_Idle_without_shadow.png',   cols: 9, rows: 4 },
  fighterWalk: { src: '/assets/people and map/PNG/Fighter2_Walk_without_shadow.png',   cols: 6, rows: 4 },
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
  sheet, frame, row, filter, bounce, isWalking
}: {
  sheet: SpriteSheet; frame: number; row: number;
  filter?: string; bounce?: boolean; isWalking?: boolean;
}) {
  const [bgSize, setBgSize] = useState('auto');
  
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const scale = CHAR_H / (img.naturalHeight / sheet.rows);
    const w = (img.naturalWidth / sheet.cols) * scale;
    setBgSize(`${w * sheet.cols}px auto`);
  };

  // Adjust frame based on sheet cols and state
  const fps = isWalking ? 10 : 4;
  const actualFrame = Math.floor((frame * fps) / 12) % sheet.cols;
  const sx = actualFrame * CHAR_W;
  const sy = row * CHAR_H;

  return (
    <div style={{ width: CHAR_W, height: CHAR_H, position: 'relative', overflow: 'hidden' }}>
      <img src={sheet.src} onLoad={handleLoad} style={{ display: 'none' }} alt="" />
      <motion.div
        animate={bounce ? { y: [0, -1.5, 0] } : { y: 0 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: '100%', height: '100%',
          backgroundImage: `url('${sheet.src}')`,
          backgroundSize: bgSize,
          backgroundPosition: `-${sx}px -${sy}px`,
          imageRendering: 'pixelated',
          filter: filter || 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))',
        }}
      />
    </div>
  );
}

// ─── TileCell ────────────────────────────────────────────────────────────────
function TileCell({
  tile, row, col,
  theme, isPlayer, isPlayerWalking, isP2, isP2Walking, isDrone, isDroneWalking, isNpc, showInteract,
  animFrame, facingRow = 0,
}: {
  key?: string;
  tile: TileType; row: number; col: number;
  theme: ZoneTheme;
  isPlayer: boolean; isPlayerWalking: boolean;
  isP2: boolean; isP2Walking: boolean;
  isDrone: boolean; isDroneWalking: boolean;
  isNpc: boolean;
  showInteract: boolean;
  animFrame: number; facingRow?: number;
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
          <Sprite 
            sheet={Math.floor(animFrame / 40) % 2 === 0 ? SP.npc1 : SP.npc2} 
            frame={animFrame} 
            row={0} 
            bounce={Math.floor(animFrame / 20) % 2 === 0} 
            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.7))"
          />
        </div>
      )}

      {isPlayer && (
        <div className="absolute inset-0 flex items-end justify-center" style={{ paddingBottom: 2 }}>
          <Sprite
            sheet={isPlayerWalking ? SP.playerWalk : SP.playerIdle}
            frame={animFrame}
            row={facingRow}
            isWalking={isPlayerWalking}
            filter="drop-shadow(0 4px 8px rgba(0,0,0,0.8)) drop-shadow(0 0 12px rgba(212,160,23,0.4))"
            bounce={!isPlayerWalking}
          />
        </div>
      )}

      {isP2 && !isPlayer && (
        <div className="absolute inset-0 flex items-end justify-center" style={{ paddingBottom: 2 }}>
          <Sprite 
            sheet={isP2Walking ? SP.partnerWalk : SP.partnerIdle} 
            frame={animFrame} 
            row={facingRow} 
            isWalking={isP2Walking}
            filter="drop-shadow(0 4px 8px rgba(0,0,0,0.8)) drop-shadow(0 0 10px rgba(92,194,106,0.4))" 
            bounce={!isP2Walking}
          />
        </div>
      )}

      {isDrone && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div animate={{ opacity: [0.85, 1, 0.85], scale: [1, 1.05, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
            <Sprite
              sheet={isDroneWalking ? SP.fighterWalk : SP.fighterIdle}
              frame={animFrame}
              row={facingRow}
              isWalking={isDroneWalking}
              filter="drop-shadow(0 0 12px rgba(220,40,40,0.8)) brightness(0.8) sepia(0.4) hue-rotate(320deg)"
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
  const [animFrame, setAnimFrame] = useState(0);
  const [playerFacingRow, setPlayerFacingRow] = useState(0);
  const [p2FacingRow, setP2FacingRow] = useState(0);
  const [p2Moving, setP2Moving] = useState(false);
  const [droneFacingRows, setDroneFacingRows] = useState<Record<string, number>>({});
  const [movingDrones, setMovingDrones] = useState<Set<string>>(new Set());
  
  const prevPosRef = useRef(playerPos);
  const prevP2PosRef = useRef(p2Pos);
  const prevDronesRef = useRef<[number, number][]>(drones);
  const p2MoveTimeoutRef = useRef<number | null>(null);
  const droneMoveTimeoutRef = useRef<number | null>(null);
  
  const lastTimeRef = useRef(performance.now());
  const accumulatorRef = useRef(0);
  const frameRef = useRef(0);

  const update = useCallback((time: number) => {
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    accumulatorRef.current += dt;
    const step = 1 / 12; // 12 FPS target

    while (accumulatorRef.current >= step) {
      accumulatorRef.current -= step;
      frameRef.current += 1;
      setAnimFrame(frameRef.current);
    }

    requestAnimationFrame(update);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  }, [update]);

  useEffect(() => {
    const [pr, pc] = prevPosRef.current;
    const [nr, nc] = playerPos;
    if (nr > pr) setPlayerFacingRow(0); // Down
    else if (nr < pr) setPlayerFacingRow(3); // Up
    else if (nc < pc) setPlayerFacingRow(1); // Left
    else if (nc > pc) setPlayerFacingRow(2); // Right
    prevPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    if (!p2Pos) return;
    const prev = prevP2PosRef.current;
    if (!prev) {
      prevP2PosRef.current = p2Pos;
      return;
    }
    const [pr, pc] = prev;
    const [nr, nc] = p2Pos;
    if (nr !== pr || nc !== pc) {
      if (nr > pr) setP2FacingRow(0);
      else if (nr < pr) setP2FacingRow(3);
      else if (nc < pc) setP2FacingRow(1);
      else if (nc > pc) setP2FacingRow(2);
      setP2Moving(true);
      if (p2MoveTimeoutRef.current) window.clearTimeout(p2MoveTimeoutRef.current);
      p2MoveTimeoutRef.current = window.setTimeout(() => setP2Moving(false), 300);
    }
    prevP2PosRef.current = p2Pos;
  }, [p2Pos]);

  useEffect(() => {
    const newFacings = { ...droneFacingRows };
    const newMoving = new Set<string>();
    let changed = false;
    
    drones.forEach((pos, i) => {
      const prev = prevDronesRef.current[i];
      if (!prev) return;
      const [pr, pc] = prev;
      const [nr, nc] = pos;
      const key = `${nr},${nc}`;
      
      if (nr !== pr || nc !== pc) {
        newMoving.add(key);
        let row = newFacings[key] ?? 0;
        if (nr > pr) row = 0;
        else if (nr < pr) row = 3;
        else if (nc < pc) row = 1;
        else if (nc > pc) row = 2;
        
        if (newFacings[key] !== row) {
          newFacings[key] = row;
          changed = true;
        }
      }
    });
    
    if (changed || newMoving.size !== movingDrones.size) {
      setDroneFacingRows(newFacings);
      setMovingDrones(newMoving);
    }
    prevDronesRef.current = drones;
  }, [drones, movingDrones.size]);

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
            const isDroneMatch = droneSet.has(k);
            const isP2Match = !!p2Pos && p2Pos[0] === ri && p2Pos[1] === ci;
            const isPlayerMatch = playerPos[0] === ri && playerPos[1] === ci;

            return (
              <TileCell
                key={k} tile={tile} row={ri} col={ci} theme={theme}
                isPlayer={isPlayerMatch}
                isPlayerWalking={playerMoving}
                isP2={isP2Match}
                isP2Walking={p2Moving}
                isDrone={isDroneMatch}
                isDroneWalking={movingDrones.has(k)}
                isNpc={tile === 'npc'}
                showInteract={interactSet.has(k)}
                animFrame={animFrame}
                facingRow={
                  isPlayerMatch ? playerFacingRow :
                  isP2Match ? p2FacingRow :
                  isDroneMatch ? (droneFacingRows[k] ?? 0) : 0
                }
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

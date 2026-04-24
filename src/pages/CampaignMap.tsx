import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronLeft } from 'lucide-react';

import { CampaignProvider, useCampaign } from '../engine/campaignStore';
import { CAMPAIGN_ZONES, ZoneId } from '../data/campaignData';
import { getNextPos, getInteraction, getTile } from '../engine/mapEngine';
import { Direction } from '../engine/mapEngine';
import { TileInteraction } from '../data/campaignData';

import MapRenderer from '../components/campaign/MapRenderer';
import CampaignHUD from '../components/campaign/CampaignHUD';
import DialoguePanel from '../components/campaign/DialoguePanel';
import TerminalPuzzlePanel from '../components/campaign/TerminalPuzzlePanel';
import InventoryPanel from '../components/campaign/InventoryPanel';
import ClueNotebook from '../components/campaign/ClueNotebook';
import ZoneTransitionOverlay from '../components/campaign/ZoneTransitionOverlay';
import InteractionPrompt from '../components/campaign/InteractionPrompt';
import CaseResolution from '../components/campaign/CaseResolution';

// ── Inner component (needs CampaignProvider context) ──────────────────────────
function CampaignMapInner() {
  const { state, dispatch, isLoaded } = useCampaign();
  const navigate = useNavigate();

  const [activeInteraction, setActiveInteraction] = useState<TileInteraction | null>(null);
  const [terminalSolved, setTerminalSolved] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [transitionZone, setTransitionZone] = useState<ZoneId | null>(null);
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  const [canInteract, setCanInteract] = useState(false);
  const [droneTick, setDroneTick] = useState(0);

  const currentZoneConfig = CAMPAIGN_ZONES.find(z => z.id === state.currentZone)!;

  // Drone logic
  useEffect(() => {
    if (!currentZoneConfig.drones || currentZoneConfig.drones.length === 0) return;
    if (activeInteraction || transitionZone) return;

    const interval = setInterval(() => {
      setDroneTick(t => t + 1);
    }, 1000); // Drones move every 1 second
    return () => clearInterval(interval);
  }, [currentZoneConfig, activeInteraction, transitionZone]);

  const activeDrones = (currentZoneConfig.drones || []).map(d => {
    const totalSteps = d.path.length;
    const currentStep = d.path[droneTick % totalSteps];
    return { id: d.id, pos: currentStep };
  });

  // Collision check
  useEffect(() => {
    for (const drone of activeDrones) {
      const [dr, dc] = drone.pos;
      const [pr, pc] = state.playerPos;
      // Caught if on same tile or adjacent
      if (Math.abs(dr - pr) <= 1 && Math.abs(dc - pc) <= 1) {
        setLockedMsg('CAUGHT BY SECURITY DRONE! Resetting...');
        setTimeout(() => {
          dispatch({ type: 'SET_POS', pos: currentZoneConfig.playerStart });
          setLockedMsg(null);
        }, 1500);
        break;
      }
    }
  }, [droneTick, state.playerPos, currentZoneConfig.playerStart, dispatch, activeDrones]);

  // Check if adjacent tile is interactable
  useEffect(() => {
    const grid = currentZoneConfig.grid;
    const [r, c] = state.playerPos;
    const neighbors: [number, number][] = [
      [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
    ];
    const hasInteractable = neighbors.some(([nr, nc]) => {
      const tile = grid[nr]?.[nc];
      return tile && ['npc', 'terminal', 'item', 'gate', 'exit'].includes(tile);
    });
    // Also check current tile for items/terminals
    const curTile = getTile(state.playerPos, grid);
    setCanInteract(hasInteractable || ['npc', 'terminal', 'item', 'gate', 'exit'].includes(curTile));
  }, [state.playerPos, currentZoneConfig]);

  const triggerInteraction = useCallback(() => {
    if (activeInteraction) return; // already open
    const interaction = getInteraction(state.playerPos, currentZoneConfig);
    if (!interaction) {
      // Check neighbors
      const grid = currentZoneConfig.grid;
      const [r, c] = state.playerPos;
      const dirs: [number, number][] = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
      for (const [nr, nc] of dirs) {
        const pos: [number, number] = [nr, nc];
        const ix = getInteraction(pos, currentZoneConfig);
        if (ix) { openInteraction(ix); return; }
      }
      return;
    }
    openInteraction(interaction);
  }, [state.playerPos, currentZoneConfig, activeInteraction]);

  function openInteraction(ix: TileInteraction) {
    // Gate check
    if (ix.type === 'gate' && ix.requiresItems) {
      const missing = ix.requiresItems.filter(item => !state.inventory.includes(item));
      if (missing.length > 0) {
        setLockedMsg(ix.lines[0]);
        setTimeout(() => setLockedMsg(null), 3000);
        return;
      }
    }
    setActiveInteraction(ix);
    setTerminalSolved(false);
    setLineIndex(0);
  }

  function handleNextLine() {
    if (!activeInteraction) return;
    const next = lineIndex + 1;
    if (next < activeInteraction.lines.length) {
      setLineIndex(next);
    } else {
      closeInteraction();
    }
  }

  function closeInteraction() {
    if (!activeInteraction) return;
    // Apply rewards after dialogue finishes
    if (activeInteraction.reward) {
      dispatch({ type: 'COLLECT_ITEM', item: activeInteraction.reward });
      dispatch({ type: 'ADD_OBJECTIVE', text: `Item collected: ${activeInteraction.reward}. Proceed to the next zone.` });
    }
    if (activeInteraction.clue) {
      dispatch({ type: 'ADD_CLUE', clue: activeInteraction.clue });
    }
    if (activeInteraction.type === 'gate' && activeInteraction.unlocksZone) {
      enterZone(activeInteraction.unlocksZone);
    }
    if (activeInteraction.type === 'final') {
      dispatch({ type: 'COMPLETE_ZONE', zone: state.currentZone });
      dispatch({ type: 'COMPLETE_GAME' });
    }
    setActiveInteraction(null);
  }

  function enterZone(zoneId: ZoneId) {
    dispatch({ type: 'COMPLETE_ZONE', zone: state.currentZone });
    dispatch({ type: 'UNLOCK_ZONE', zone: zoneId });
    const zoneConfig = CAMPAIGN_ZONES.find(z => z.id === zoneId)!;
    setTransitionZone(zoneId);
    setTimeout(() => {
      dispatch({ type: 'ENTER_ZONE', zone: zoneId, pos: zoneConfig.playerStart });
      setTransitionZone(null);
      dispatch({ type: 'ADD_OBJECTIVE', text: `Entered ${zoneConfig.name}. ${zoneConfig.description}` });
    }, 2000);
  }

  // Keyboard handler
  useEffect(() => {
    if (activeInteraction || transitionZone) return;

    const KEY_DIR: Record<string, Direction> = {
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
    };

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') { triggerInteraction(); return; }
      const dir = KEY_DIR[e.key];
      if (!dir) return;
      e.preventDefault();
      const next = getNextPos(state.playerPos, dir, currentZoneConfig.grid);
      if (next) dispatch({ type: 'SET_POS', pos: next });
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.playerPos, currentZoneConfig, activeInteraction, transitionZone, triggerInteraction, dispatch]);

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1d1208] text-[#d4a017] uppercase tracking-widest text-xs font-black">
        Loading Campaign Data...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1d1208] relative overflow-hidden"
      style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-wood.png")' }}>
      
      {/* ── HUD ── */}
      <CampaignHUD />

      {/* ── Back + Notebook controls ── */}
      <div className="absolute top-20 left-4 flex gap-2 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 bg-[#1d1208]/90 border border-[#d4a017]/40 px-3 py-1.5 text-[9px] font-black text-[#d4a017] uppercase tracking-widest hover:bg-[#d4a017]/10 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" /> Bureau
        </button>
        <button
          onClick={() => setNotebookOpen(o => !o)}
          className="flex items-center gap-1 bg-[#1d1208]/90 border border-[#d4a017]/40 px-3 py-1.5 text-[9px] font-black text-[#d4a017] uppercase tracking-widest hover:bg-[#d4a017]/10 transition-colors"
        >
          <BookOpen className="w-3 h-3" /> Notebook ({state.clues.length})
        </button>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 flex items-center justify-center pt-16">
        <motion.div
          key={state.currentZone}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <MapRenderer
            grid={currentZoneConfig.grid}
            playerPos={state.playerPos}
            zoneId={state.currentZone}
            drones={activeDrones.map(d => d.pos)}
          />
        </motion.div>
      </div>

      {/* ── Controls hint ── */}
      <div className="absolute bottom-4 right-4 flex gap-3 z-20 pointer-events-none">
        {(['W','A','S','D'] as const).map(k => (
          <div key={k} className="w-7 h-7 border border-[#d4a017]/40 flex items-center justify-center bg-[#1d1208]/80">
            <span className="text-[10px] font-black text-[#a07830]">{k}</span>
          </div>
        ))}
        <div className="w-7 h-7 border border-[#d4a017]/60 flex items-center justify-center bg-[#d4a017]/10">
          <span className="text-[10px] font-black text-[#d4a017]">E</span>
        </div>
      </div>

      {/* ── Locked message ── */}
      {lockedMsg && (
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#8B2020] border border-[#8B2020]/60 px-5 py-2 text-xs font-black text-white uppercase tracking-widest z-30 max-w-sm text-center"
        >
          🔒 {lockedMsg}
        </motion.div>
      )}

      {/* ── Interaction prompt ── */}
      <InteractionPrompt visible={canInteract && !activeInteraction} />

      {/* ── Inventory ── */}
      <InventoryPanel />

      {/* ── Terminal Puzzle ── */}
      <TerminalPuzzlePanel
        interaction={activeInteraction}
        onSuccess={() => setTerminalSolved(true)}
        onClose={closeInteraction}
      />

      {/* ── Dialogue ── */}
      {(!activeInteraction?.terminalCmd || terminalSolved) && (
        <DialoguePanel
          interaction={activeInteraction}
          lineIndex={lineIndex}
          onNext={handleNextLine}
          onClose={closeInteraction}
        />
      )}

      {/* ── Clue Notebook ── */}
      <ClueNotebook open={notebookOpen} onClose={() => setNotebookOpen(false)} />

      {/* ── Zone transition ── */}
      <ZoneTransitionOverlay zone={transitionZone} />

      {/* ── Case resolution ── */}
      {state.gameComplete && <CaseResolution />}
    </div>
  );
}

// ── Exported page with provider wrapper ───────────────────────────────────────
export default function CampaignMap() {
  return (
    <CampaignProvider>
      <CampaignMapInner />
    </CampaignProvider>
  );
}

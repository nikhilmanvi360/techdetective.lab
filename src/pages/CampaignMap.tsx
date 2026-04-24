import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import RoleSelectionOverlay from '../components/campaign/RoleSelectionOverlay';
import SessionLobby from '../components/campaign/SessionLobby';
import { useSession } from '../engine/useSession';
import { CampaignAction } from '../engine/campaignStore';

// ── Inner component (needs CampaignProvider context) ──────────────────────────
function CampaignMapInner() {
  const { state, dispatch, isLoaded } = useCampaign();
  const navigate = useNavigate();

  const {
    sessionCode,
    isHost,
    partnerConnected,
    createSession,
    joinSession,
    broadcastAction,
    leaveSession
  } = useSession(state, dispatch);

  // Wrap dispatch to broadcast actions
  const dispatchSync = useCallback((action: CampaignAction) => {
    dispatch(action);
    // Movement is handled via Presence tracking for performance, don't broadcast SET_POS
    if (action.type !== 'SET_POS') {
      broadcastAction(action);
    }
  }, [dispatch, broadcastAction]);

  const [activeInteraction, setActiveInteraction] = useState<TileInteraction | null>(null);
  const [terminalSolved, setTerminalSolved] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [transitionZone, setTransitionZone] = useState<ZoneId | null>(null);
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  const [canInteract, setCanInteract] = useState(false);
  const [droneTick, setDroneTick] = useState(0);
  const [securityTimer, setSecurityTimer] = useState<number | null>(null);

  const currentZoneConfig = CAMPAIGN_ZONES.find(z => z.id === state.currentZone);

  // Security Timer (Zone 4)
  useEffect(() => {
    if (state.currentZone === 'admin_core') {
      if (securityTimer === null) setSecurityTimer(300); // 5 minutes
      const interval = setInterval(() => {
        setSecurityTimer(t => (t !== null && t > 0) ? t - 1 : t);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setSecurityTimer(null);
    }
  }, [state.currentZone, securityTimer]);

  useEffect(() => {
    if (securityTimer === 0 && currentZoneConfig) {
      setLockedMsg('SECURITY LOCKDOWN! Time expired. Resetting core...');
      setTimeout(() => {
        dispatchSync({ type: 'SET_POS', pos: currentZoneConfig.playerStart });
        setSecurityTimer(300);
        setLockedMsg(null);
      }, 2000);
    }
  }, [securityTimer, currentZoneConfig?.playerStart, dispatchSync]);

  // Drone logic
  useEffect(() => {
    if (!currentZoneConfig || !currentZoneConfig.drones || currentZoneConfig.drones.length === 0) return;
    if (activeInteraction || transitionZone) return;

    const interval = setInterval(() => {
      setDroneTick(t => t + 1);
    }, 1000); // Drones move every 1 second
    return () => clearInterval(interval);
  }, [currentZoneConfig, activeInteraction, transitionZone]);

  const activeDrones = (currentZoneConfig?.drones || []).map(d => {
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
          if (currentZoneConfig) {
            dispatchSync({ type: 'SET_POS', pos: currentZoneConfig.playerStart });
          }
          setLockedMsg(null);
        }, 1500);
        break;
      }
    }
  }, [droneTick, state.playerPos, currentZoneConfig?.playerStart, dispatchSync, activeDrones]);

  // Check if adjacent tile is interactable
  useEffect(() => {
    if (!currentZoneConfig) return;
    const grid = currentZoneConfig.grid;
    const [r, c] = state.playerPos;
    const neighbors: [number, number][] = [
      [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
    ];
    const hasInteractable = neighbors.some(([nr, nc]) => {
      const tile = grid[nr]?.[nc];
      return tile && ['N', 'T', 'I', 'G', 'E'].includes(tile);
    });
    // Also check current tile
    const curTile = getTile(state.playerPos, grid);
    setCanInteract(hasInteractable || ['N', 'T', 'I', 'G', 'E'].includes(curTile));
  }, [state.playerPos, currentZoneConfig]);

  const triggerInteraction = useCallback(() => {
    if (activeInteraction || !currentZoneConfig) return; // already open
    const interaction = getInteraction(state.playerPos, currentZoneConfig);
    if (!interaction) {
      // Check neighbors
      const grid = currentZoneConfig.grid;
      const [r, c] = state.playerPos;
      const dirs: [number, number][] = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
      for (const [nr, nc] of dirs) {
        const pos: [number, number] = [nr, nc];
        const ix = getInteraction(pos, currentZoneConfig);
        if (ix) { openInteraction(ix, pos); return; }
      }
      return;
    }
    openInteraction(interaction, state.playerPos);
  }, [state.playerPos, currentZoneConfig, activeInteraction]);

  function openInteraction(ix: TileInteraction, targetPos: [number, number]) {
    // Gate check
    if (ix.type === 'gate' && ix.requiresItems) {
      const missing = ix.requiresItems.filter(item => !state.inventory.includes(item));
      if (missing.length > 0) {
        setLockedMsg(ix.lines[0]);
        setTimeout(() => setLockedMsg(null), 3000);
        return;
      }
    }
    if (ix.type === 'dialogue') {
      dispatch({ type: 'RECORD_NPC_VISIT', npcId: `${state.currentZone}_${targetPos[0]}_${targetPos[1]}` });
    }
    // Interpolate dynamic code
    const interpolate = (str: string) => str.replace(/{dynamicCode}/g, state.dynamicCode);
    
    const processedIx: TileInteraction = {
      ...ix,
      lines: ix.lines.map(interpolate),
      clue: ix.clue ? interpolate(ix.clue) : undefined,
      terminalCmd: ix.terminalCmd ? interpolate(ix.terminalCmd) : undefined,
      terminalContext: ix.terminalContext ? interpolate(ix.terminalContext) : undefined,
      terminalNudge: ix.terminalNudge ? interpolate(ix.terminalNudge) : undefined,
      terminalHint: ix.terminalHint ? interpolate(ix.terminalHint) : undefined,
      terminalSuccess: ix.terminalSuccess ? ix.terminalSuccess.map(interpolate) : undefined,
      terminalPartials: ix.terminalPartials ? ix.terminalPartials.map(p => ({ trigger: interpolate(p.trigger), response: interpolate(p.response) })) : undefined,
      options: ix.options ? ix.options.map(o => ({
        ...o,
        label: interpolate(o.label),
        nextLines: o.nextLines.map(interpolate),
        clue: o.clue ? interpolate(o.clue) : undefined
      })) : undefined
    };

    setActiveInteraction(processedIx);
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
      dispatchSync({ type: 'COLLECT_ITEM', item: activeInteraction.reward });
      dispatchSync({ type: 'ADD_OBJECTIVE', text: `Item collected: ${activeInteraction.reward}. Proceed to the next zone.` });
    }
    if (activeInteraction.clue) {
      dispatchSync({ type: 'ADD_CLUE', clue: activeInteraction.clue });
    }
    if (activeInteraction.type === 'gate' && activeInteraction.unlocksZone) {
      enterZone(activeInteraction.unlocksZone);
    }
    if (activeInteraction.type === 'final') {
      dispatchSync({ type: 'COMPLETE_ZONE', zone: state.currentZone });
      dispatchSync({ type: 'COMPLETE_GAME' });
    }
    setActiveInteraction(null);
  }

  function enterZone(zoneId: ZoneId) {
    dispatchSync({ type: 'COMPLETE_ZONE', zone: state.currentZone });
    dispatchSync({ type: 'UNLOCK_ZONE', zone: zoneId });
    const zoneConfig = CAMPAIGN_ZONES.find(z => z.id === zoneId)!;
    setTransitionZone(zoneId);
    setTimeout(() => {
      dispatchSync({ type: 'ENTER_ZONE', zone: zoneId, pos: zoneConfig.playerStart });
      setTransitionZone(null);
      dispatchSync({ type: 'ADD_OBJECTIVE', text: `Entered ${zoneConfig.name}. ${zoneConfig.description}` });
    }, 2000);
  }

  // Keyboard handler
  useEffect(() => {
    if (activeInteraction || transitionZone || !state.teamRoles) return;

    const KEY_DIR: Record<string, Direction> = {
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
    };

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') { triggerInteraction(); return; }
      const dir = KEY_DIR[e.key];
      if (!dir || !currentZoneConfig) return;
      e.preventDefault();
      const next = getNextPos(state.playerPos, dir, currentZoneConfig.grid);
      if (next) dispatchSync({ type: 'SET_POS', pos: next });
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.playerPos, currentZoneConfig, activeInteraction, transitionZone, state.teamRoles, triggerInteraction, dispatchSync]);

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1d1208] text-[#d4a017] uppercase tracking-widest text-xs font-black">
        Loading Campaign Data...
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col bg-[#ded0b1] relative overflow-hidden"
      style={{
        backgroundImage: [
          'radial-gradient(circle at top, rgba(255,255,255,0.35), transparent 38%)',
          'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0))',
          'url("https://www.transparenttextures.com/patterns/old-paper.png")'
        ].join(', ')
      }}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(42,26,10,0.08),transparent_58%)]" />
      
      {/* ── HUD ── */}
      <CampaignHUD partnerConnected={partnerConnected} />

      {/* ── Role Selection / Session Lobby ── */}
      <SessionLobby 
        sessionCode={sessionCode}
        isHost={isHost}
        partnerConnected={partnerConnected}
        onCreate={createSession}
        onJoin={joinSession}
        onStart={() => dispatchSync({ type: 'SET_ROLES', roles: { p1: 'Lead Investigator', p2: 'Forensic Tech' } })}
      />

      {/* ── Back + Notebook controls ── */}
      <div className="absolute top-20 left-4 flex gap-2 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 rounded-full bg-[#f4e6c4]/95 border border-[#b58a53] px-3 py-1.5 text-[9px] font-black text-[#2a1a0a] uppercase tracking-widest hover:bg-[#f8edd7] transition-colors pointer-events-auto shadow-[0_8px_20px_rgba(42,26,10,0.12)]"
        >
          <ChevronLeft className="w-3 h-3" /> Bureau
        </button>
        <button
          onClick={() => setNotebookOpen(o => !o)}
          className="flex items-center gap-1 rounded-full bg-[#f4e6c4]/95 border border-[#b58a53] px-3 py-1.5 text-[9px] font-black text-[#2a1a0a] uppercase tracking-widest hover:bg-[#f8edd7] transition-colors pointer-events-auto shadow-[0_8px_20px_rgba(42,26,10,0.12)]"
        >
          <BookOpen className="w-3 h-3" /> Notebook ({(state.clues || []).length})
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
          {currentZoneConfig && (
            <MapRenderer
              grid={currentZoneConfig.grid}
              playerPos={state.playerPos}
              p2Pos={state.p2Pos || undefined}
              zoneId={state.currentZone}
              drones={activeDrones.map(d => d.pos)}
            />
          )}
        </motion.div>
      </div>

      {/* ── Security Timer Overlay ── */}
      {securityTimer !== null && (
        <div className="absolute top-20 right-6 z-20 flex flex-col items-end">
          <div className="bg-red-900/80 border-2 border-red-500 px-4 py-2 rounded shadow-lg animate-pulse">
            <span className="text-[10px] font-black text-red-200 uppercase tracking-widest block">Security Lockdown In:</span>
            <span className="text-2xl font-mono text-white">
              {Math.floor(securityTimer / 60)}:{String(securityTimer % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {/* ── Interaction Indicator ── */}
      <div className="absolute bottom-4 right-4 flex gap-3 z-20 pointer-events-none">
        {(['W','A','S','D'] as const).map(k => (
          <div key={k} className="w-7 h-7 border border-[#b58a53] flex items-center justify-center bg-[#f4e6c4]/90 rounded-md shadow-[0_8px_18px_rgba(42,26,10,0.08)]">
            <span className="text-[10px] font-black text-[#8a6b44]">{k}</span>
          </div>
        ))}
        <div className="w-7 h-7 border border-[#b58a53] flex items-center justify-center bg-[#f8edd7] rounded-md shadow-[0_8px_18px_rgba(42,26,10,0.08)]">
          <span className="text-[10px] font-black text-[#8c5f22]">E</span>
        </div>
      </div>

      {/* ── Locked message ── */}
      {lockedMsg && (
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#6a4a31] border border-[#8a6b44] px-5 py-2 text-xs font-black text-[#f8edd7] uppercase tracking-widest z-30 max-w-sm text-center rounded-full shadow-[0_12px_30px_rgba(42,26,10,0.18)]"
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

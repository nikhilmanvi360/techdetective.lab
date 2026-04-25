import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import { CampaignProvider, useCampaign } from '../engine/campaignStore';
import { CAMPAIGN_ZONES, ZoneId } from '../data/campaignData';
import { getNextPos, getInteraction, getTile } from '../engine/mapEngine';
import { Direction } from '../engine/mapEngine';
import { TileInteraction } from '../data/campaignData';

import MapRenderer from '../components/campaign/MapRenderer';
import DialoguePanel from '../components/campaign/DialoguePanel';
import TerminalPuzzlePanel from '../components/campaign/TerminalPuzzlePanel';
import InventoryPanel from '../components/campaign/InventoryPanel';
import ClueNotebook from '../components/campaign/ClueNotebook';
import ZoneTransitionOverlay from '../components/campaign/ZoneTransitionOverlay';
import CaseResolution from '../components/campaign/CaseResolution';
import SessionLobby from '../components/campaign/SessionLobby';
import { useSession } from '../engine/useSession';
import { CampaignAction } from '../engine/campaignStore';

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
  } = useSession(state, dispatch);

  const dispatchSync = useCallback((action: CampaignAction) => {
    dispatch(action);
    if (action.type !== 'SET_POS') {
      broadcastAction(action);
    }
  }, [dispatch, broadcastAction]);

  const [activeInteraction, setActiveInteraction] = useState<TileInteraction | null>(null);
  const [terminalSolved, setTerminalSolved] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [transitionZone, setTransitionZone] = useState<ZoneId | null>(null);
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  const [canInteract, setCanInteract] = useState(false);
  const [playerMoving, setPlayerMoving] = useState(false);
  const [droneTick, setDroneTick] = useState(0);
  const [securityTimer, setSecurityTimer] = useState<number | null>(null);
  const movementResetRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (movementResetRef.current !== null) {
        window.clearTimeout(movementResetRef.current);
      }
    };
  }, []);

  const currentZoneConfig = CAMPAIGN_ZONES.find(z => z.id === state.currentZone);
  const latestObjective = state.objectiveLog?.length
    ? state.objectiveLog[state.objectiveLog.length - 1]
    : 'Initializing field board...';

  useEffect(() => {
    if (state.currentZone === 'admin_core') {
      if (securityTimer === null) setSecurityTimer(300);
      const interval = setInterval(() => {
        setSecurityTimer(t => (t !== null && t > 0) ? t - 1 : t);
      }, 1000);
      return () => clearInterval(interval);
    }
    setSecurityTimer(null);
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

  useEffect(() => {
    if (!currentZoneConfig || !currentZoneConfig.drones || currentZoneConfig.drones.length === 0) return;
    if (activeInteraction || transitionZone) return;

    const interval = setInterval(() => {
      setDroneTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentZoneConfig, activeInteraction, transitionZone]);

  const activeDrones = (currentZoneConfig?.drones || []).map(d => {
    const totalSteps = d.path.length;
    const currentStep = d.path[droneTick % totalSteps];
    return { id: d.id, pos: currentStep };
  });

  useEffect(() => {
    for (const drone of activeDrones) {
      const [dr, dc] = drone.pos;
      const [pr, pc] = state.playerPos;
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

  useEffect(() => {
    if (!currentZoneConfig) return;
    const grid = currentZoneConfig.grid;
    const [r, c] = state.playerPos;
    const neighbors: [number, number][] = [
      [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
    ];
    const hasInteractable = neighbors.some(([nr, nc]) => {
      const tile = grid[nr]?.[nc];
      return tile && ['N', 'T', 'I', 'G', 'E'].includes(tile);
    });
    const curTile = getTile(state.playerPos, grid);
    setCanInteract(hasInteractable || ['N', 'T', 'I', 'G', 'E'].includes(curTile));
  }, [state.playerPos, currentZoneConfig]);

  const triggerInteraction = useCallback(() => {
    if (activeInteraction || !currentZoneConfig) return;
    const interaction = getInteraction(state.playerPos, currentZoneConfig);
    if (!interaction) {
      const [r, c] = state.playerPos;
      const dirs: [number, number][] = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
      for (const [nr, nc] of dirs) {
        const pos: [number, number] = [nr, nc];
        const ix = getInteraction(pos, currentZoneConfig);
        if (ix) {
          openInteraction(ix, pos);
          return;
        }
      }
      return;
    }
    openInteraction(interaction, state.playerPos);
  }, [state.playerPos, currentZoneConfig, activeInteraction]);

  function openInteraction(ix: TileInteraction, targetPos: [number, number]) {
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
      terminalPartials: ix.terminalPartials ? ix.terminalPartials.map(p => ({
        trigger: interpolate(p.trigger),
        response: interpolate(p.response),
      })) : undefined,
      options: ix.options ? ix.options.map(o => ({
        ...o,
        label: interpolate(o.label),
        nextLines: o.nextLines.map(interpolate),
        clue: o.clue ? interpolate(o.clue) : undefined,
      })) : undefined,
    };

    // ── ROUND 1 HEAVY ADVANTAGE LOGIC ──
    // Check if team has specific evidence from Round 1 to auto-solve or buff this interaction
    const hasR1Code = (code: string) => state.r1Evidence.some(e => e.code === code);
    const hasR1Category = (cat: string) => state.r1Evidence.some(e => e.category === cat);

    // 1. Laptop Password (EC-G7H8)
    if (ix.speaker === 'Left-Behind Laptop' && hasR1Code('EC-G7H8')) {
      processedIx.lines = [
        'PRE-AUTH DETECTED: You retrieved the password "sys_ghost / R@z@2024!" from the sticky note in Round 1.',
        'The system bypasses the terminal login. Data successfully extracted.'
      ];
      processedIx.terminalCmd = undefined; 
      processedIx.reward = 'kitchen_key';
    }

    // 2. Archived Terminal (EC-C3D4 mentions LB-2241)
    if (ix.speaker === 'Archived Terminal' && hasR1Code('EC-C3D4')) {
        processedIx.lines = [
            'Staff ID LB-2241 detected in Round 1 evidence (Crumpled Receipt).',
            'The terminal recognizes your authority and reveals the redacted document immediately.'
        ];
        processedIx.terminalCmd = undefined;
    }

    // 3. Node Gamma (EC-Y5Z6 mentions Node Gamma)
    if (ix.speaker === 'Node Gamma' && hasR1Code('EC-Y5Z6')) {
        processedIx.lines = [
            'ARGUS Protocol Intercept (EC-Y5Z6) utilized.',
            'The Node Gamma security layer is bypassed. Sync complete.'
        ];
        processedIx.terminalCmd = undefined;
    }

    // 4. VIP Clearance (VIP-ACCESS-01) - Special Item or Global Skip
    if (hasR1Code('VIP-ACCESS-01') && !state.inventory.includes('master_keycard')) {
        // Automatically give a master keycard if they have the VIP code
        dispatchSync({ type: 'COLLECT_ITEM', item: 'master_keycard' });
        dispatchSync({ type: 'ADD_OBJECTIVE', text: 'VIP CLEARANCE DETECTED: Master Keycard granted from Round 1.' });
    }

    // 5. Generic "Witness" Advantage - Richer dialogue for NPCs
    if (ix.type === 'dialogue' && hasR1Category('witness') && ix.lines.length > 2) {
        processedIx.lines = [
            '...I see you’ve been doing your homework in the field. Since you already spoke to the witnesses...',
            ...ix.lines,
            'Also, keep an eye on the vents. I heard them rattling earlier.'
        ];
    }

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

  useEffect(() => {
    const KEY_DIR: Record<string, Direction> = {
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
    };

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeInteraction) {
          closeInteraction();
          return;
        }
        if (notebookOpen) {
          setNotebookOpen(false);
          return;
        }
        if (inventoryOpen) {
          setInventoryOpen(false);
          return;
        }
        return;
      }

      if (e.key === 'i' || e.key === 'I') {
        if (activeInteraction || transitionZone) return;
        setInventoryOpen(v => !v);
        setNotebookOpen(false);
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        if (activeInteraction || transitionZone) return;
        setNotebookOpen(o => !o);
        setInventoryOpen(false);
        return;
      }

      if (activeInteraction || transitionZone || notebookOpen || inventoryOpen || !state.teamRoles) return;

      if (e.key === 'e' || e.key === 'E') {
        triggerInteraction();
        return;
      }

      const dir = KEY_DIR[e.key];
      if (!dir || !currentZoneConfig) return;
      e.preventDefault();
      const next = getNextPos(state.playerPos, dir, currentZoneConfig.grid);
      if (next) {
        dispatchSync({ type: 'SET_POS', pos: next });
        setPlayerMoving(true);
        if (movementResetRef.current !== null) {
          window.clearTimeout(movementResetRef.current);
        }
        movementResetRef.current = window.setTimeout(() => setPlayerMoving(false), 220);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    state.playerPos,
    currentZoneConfig,
    activeInteraction,
    transitionZone,
    notebookOpen,
    inventoryOpen,
    state.teamRoles,
    triggerInteraction,
    dispatchSync,
  ]);

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1d1208] text-[#d4a017] uppercase tracking-widest text-xs font-black">
        Loading Campaign Data...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0a0805] text-[#f4e6c4]">
      <SessionLobby
        sessionCode={sessionCode}
        isHost={isHost}
        partnerConnected={partnerConnected}
        onCreate={createSession}
        onJoin={joinSession}
        onStart={() => dispatchSync({ type: 'SET_ROLES', roles: { p1: 'Lead Investigator', p2: 'Forensic Tech' } })}
      />

      {currentZoneConfig && (
        <MapRenderer
          grid={currentZoneConfig.grid}
          playerPos={state.playerPos}
          p2Pos={state.p2Pos || undefined}
          zoneId={state.currentZone}
          zoneName={currentZoneConfig.name}
          objective={latestObjective}
          drones={activeDrones.map(d => d.pos)}
          canInteract={canInteract && !activeInteraction}
          playerMoving={playerMoving}
        />
      )}

      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[9px] font-black text-[#d4a017] uppercase tracking-widest transition-all"
          style={{ background: 'rgba(10,8,5,0.80)', border: '1px solid rgba(212,160,23,0.25)', backdropFilter: 'blur(6px)' }}
        >
          <ChevronLeft className="w-3 h-3" /> Bureau
        </button>
      </div>

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

      {lockedMsg && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#6a4a31] border border-[#8a6b44] px-5 py-2 text-xs font-black text-[#f8edd7] uppercase tracking-widest z-30 max-w-sm text-center rounded-full shadow-[0_12px_30px_rgba(42,26,10,0.18)]"
        >
          {lockedMsg}
        </motion.div>
      )}

      <InventoryPanel open={inventoryOpen} onClose={() => setInventoryOpen(false)} />

      <TerminalPuzzlePanel
        interaction={activeInteraction}
        onSuccess={() => setTerminalSolved(true)}
        onClose={closeInteraction}
      />

      {(!activeInteraction?.terminalCmd || terminalSolved) && (
        <DialoguePanel
          interaction={activeInteraction}
          lineIndex={lineIndex}
          onNext={handleNextLine}
          onClose={closeInteraction}
        />
      )}

      <ClueNotebook open={notebookOpen} onClose={() => setNotebookOpen(false)} />

      <ZoneTransitionOverlay zone={transitionZone} />

      {state.gameComplete && <CaseResolution />}
    </div>
  );
}

export default function CampaignMap() {
  return (
    <CampaignProvider>
      <CampaignMapInner />
    </CampaignProvider>
  );
}

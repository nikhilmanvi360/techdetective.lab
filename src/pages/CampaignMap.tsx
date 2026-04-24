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
import RoleSelectionOverlay from '../components/campaign/RoleSelectionOverlay';
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
    leaveSession,
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
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [transitionZone, setTransitionZone] = useState<ZoneId | null>(null);
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  const [canInteract, setCanInteract] = useState(false);
  const [droneTick, setDroneTick] = useState(0);
  const [securityTimer, setSecurityTimer] = useState<number | null>(null);

  const currentZoneConfig = CAMPAIGN_ZONES.find(z => z.id === state.currentZone);
  const latestObjective = state.objectiveLog?.length
    ? state.objectiveLog[state.objectiveLog.length - 1]
    : 'Initializing field board...';
  const completedZones = state.completedZones?.length || 0;
  const activeThreatLabel = securityTimer !== null
    ? 'Security lockdown active'
    : (currentZoneConfig?.drones?.length ? 'Drone patrols moving' : 'No active threats');

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
      const grid = currentZoneConfig.grid;
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
    if (activeInteraction || transitionZone || !state.teamRoles) return;

    const KEY_DIR: Record<string, Direction> = {
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
    };

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        triggerInteraction();
        return;
      }
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
      className="h-full flex flex-col relative overflow-hidden bg-[#180f08] text-[#f4e6c4]"
      style={{
        backgroundImage: [
          'radial-gradient(circle at top, rgba(179,135,74,0.20), transparent 34%)',
          'radial-gradient(circle at 20% 15%, rgba(103,132,92,0.12), transparent 26%)',
          'linear-gradient(180deg, rgba(24,15,8,0.98), rgba(42,27,14,0.92))',
          'url("https://www.transparenttextures.com/patterns/old-paper.png")',
        ].join(', '),
      }}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(248,237,215,0.10),transparent_58%)]" />
      <div className="absolute inset-x-0 top-0 h-24 pointer-events-none bg-gradient-to-b from-[#d4a017]/10 to-transparent" />

      <CampaignHUD partnerConnected={partnerConnected} />

      <SessionLobby
        sessionCode={sessionCode}
        isHost={isHost}
        partnerConnected={partnerConnected}
        onCreate={createSession}
        onJoin={joinSession}
        onStart={() => dispatchSync({ type: 'SET_ROLES', roles: { p1: 'Lead Investigator', p2: 'Forensic Tech' } })}
      />

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

      <div className="relative z-10 flex-1 min-h-0 px-3 pb-4 pt-24 lg:px-5 xl:px-6">
        <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_18rem]">
          <aside className="hidden min-h-0 flex-col gap-4 xl:flex">
            <div className="rounded-[1.75rem] border border-[#b58a53]/70 bg-[#f4e6c4]/92 p-4 shadow-[0_18px_42px_rgba(42,26,10,0.16)] backdrop-blur-sm">
              <div className="text-[9px] uppercase tracking-[0.4em] font-black text-[#8a6b44]">Zone Brief</div>
              <div className="mt-2 text-xl font-black uppercase tracking-tight text-[#2a1a0a]">
                {currentZoneConfig?.name || 'Unknown Zone'}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#5e4a2f]">
                {currentZoneConfig?.description}
              </p>
              <div className="mt-4 grid gap-2">
                <div className="rounded-2xl border border-[#b58a53] bg-[#fff6df] px-3 py-2">
                  <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Threat Level</div>
                  <div className="mt-1 text-sm font-black uppercase tracking-widest text-[#2a1a0a]">
                    {activeThreatLabel}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#b58a53] bg-[#fff6df] px-3 py-2">
                  <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Progress</div>
                  <div className="mt-1 text-sm font-black uppercase tracking-widest text-[#2a1a0a]">
                    {completedZones}/4 Zones Cleared
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[#b58a53]/70 bg-[#f4e6c4]/92 p-4 shadow-[0_18px_42px_rgba(42,26,10,0.16)] backdrop-blur-sm">
              <div className="text-[9px] uppercase tracking-[0.4em] font-black text-[#8a6b44]">Operator Notes</div>
              <div className="mt-2 space-y-3 text-sm text-[#2a1a0a]">
                <div className="rounded-2xl border border-[#d6b57b] bg-[#fff6df] px-3 py-2">
                  <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Latest Brief</div>
                  <div className="mt-1 font-serif italic leading-snug">{latestObjective}</div>
                </div>
                <div className="rounded-2xl border border-[#d6b57b] bg-[#fff6df] px-3 py-2">
                  <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Controls</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-[#5e4a2f]">
                    Move with WASD or arrow keys. Press E to interact. Hover tiles to inspect the board.
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex min-h-0 flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-3 xl:hidden">
              <div className="rounded-2xl border border-[#b58a53]/70 bg-[#f4e6c4]/92 px-3 py-2 shadow-[0_18px_42px_rgba(42,26,10,0.16)]">
                <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Zone</div>
                <div className="mt-1 text-sm font-black uppercase text-[#2a1a0a]">{currentZoneConfig?.name}</div>
              </div>
              <div className="rounded-2xl border border-[#b58a53]/70 bg-[#f4e6c4]/92 px-3 py-2 shadow-[0_18px_42px_rgba(42,26,10,0.16)]">
                <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Objective</div>
                <div className="mt-1 text-sm font-serif italic text-[#2a1a0a]">{latestObjective}</div>
              </div>
              <div className="rounded-2xl border border-[#b58a53]/70 bg-[#f4e6c4]/92 px-3 py-2 shadow-[0_18px_42px_rgba(42,26,10,0.16)]">
                <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Threat</div>
                <div className="mt-1 text-sm font-black uppercase text-[#2a1a0a]">{activeThreatLabel}</div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden rounded-[2rem] border border-[#b58a53]/50 bg-[#f4e6c4]/28 p-2 shadow-[0_20px_50px_rgba(42,26,10,0.16)] backdrop-blur-[2px]">
              <div className="h-full w-full overflow-auto flex items-start justify-center lg:items-center">
                <motion.div
                  key={state.currentZone}
                  initial={{ opacity: 0, scale: 0.95, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="w-full flex items-start justify-center"
                >
                  {currentZoneConfig && (
                    <MapRenderer
                      grid={currentZoneConfig.grid}
                      playerPos={state.playerPos}
                      p2Pos={state.p2Pos || undefined}
                      zoneId={state.currentZone}
                      zoneName={currentZoneConfig.name}
                      zoneDescription={currentZoneConfig.description}
                      objective={latestObjective}
                      drones={activeDrones.map(d => d.pos)}
                    />
                  )}
                </motion.div>
              </div>
            </div>
          </div>

          <aside className="hidden min-h-0 flex-col gap-4 xl:flex">
            <div className="rounded-[1.75rem] border border-[#b58a53]/70 bg-[#f4e6c4]/92 p-4 shadow-[0_18px_42px_rgba(42,26,10,0.16)] backdrop-blur-sm">
              <div className="text-[9px] uppercase tracking-[0.4em] font-black text-[#8a6b44]">Team Status</div>
              <div className="mt-2 rounded-2xl border border-[#d6b57b] bg-[#fff6df] px-3 py-2">
                <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Roles</div>
                <div className="mt-1 text-sm italic text-[#2a1a0a]">
                  {state.teamRoles ? `${state.teamRoles.p1} and ${state.teamRoles.p2}` : 'Awaiting assignment'}
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                <div className="rounded-2xl border border-[#d6b57b] bg-[#fff6df] px-3 py-2">
                  <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Inventory</div>
                  <div className="mt-1 text-sm font-black uppercase text-[#2a1a0a]">{(state.inventory || []).length} Items</div>
                </div>
                <div className="rounded-2xl border border-[#d6b57b] bg-[#fff6df] px-3 py-2">
                  <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Clues</div>
                  <div className="mt-1 text-sm font-black uppercase text-[#2a1a0a]">{(state.clues || []).length} Notes</div>
                </div>
                <div className="rounded-2xl border border-[#d6b57b] bg-[#fff6df] px-3 py-2">
                  <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Reputation</div>
                  <div className="mt-1 text-sm font-black uppercase text-[#2a1a0a]">{state.reputation}%</div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[#b58a53]/70 bg-[#f4e6c4]/92 p-4 shadow-[0_18px_42px_rgba(42,26,10,0.16)] backdrop-blur-sm">
              <div className="text-[9px] uppercase tracking-[0.4em] font-black text-[#8a6b44]">Field Rules</div>
              <div className="mt-2 space-y-2 text-sm text-[#2a1a0a]">
                <div className="rounded-2xl border border-[#d6b57b] bg-[#fff6df] px-3 py-2">
                  <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Keyboard</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-[#5e4a2f]">
                    Arrow keys or WASD move the operator. E opens nearby interactions.
                  </div>
                </div>
                <div className="rounded-2xl border border-[#d6b57b] bg-[#fff6df] px-3 py-2">
                  <div className="text-[8px] uppercase tracking-[0.35em] font-black text-[#8a6b44]">Board State</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-[#5e4a2f]">
                    Drones, terminals, and evidence pulse inside the map when they become relevant.
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
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

      <div className="absolute bottom-4 right-4 flex gap-3 z-20 pointer-events-none">
        {(['W', 'A', 'S', 'D'] as const).map(k => (
          <div key={k} className="w-7 h-7 border border-[#b58a53] flex items-center justify-center bg-[#f4e6c4]/90 rounded-md shadow-[0_8px_18px_rgba(42,26,10,0.08)]">
            <span className="text-[10px] font-black text-[#8a6b44]">{k}</span>
          </div>
        ))}
        <div className="w-7 h-7 border border-[#b58a53] flex items-center justify-center bg-[#f8edd7] rounded-md shadow-[0_8px_18px_rgba(42,26,10,0.08)]">
          <span className="text-[10px] font-black text-[#8c5f22]">E</span>
        </div>
      </div>

      {lockedMsg && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#6a4a31] border border-[#8a6b44] px-5 py-2 text-xs font-black text-[#f8edd7] uppercase tracking-widest z-30 max-w-sm text-center rounded-full shadow-[0_12px_30px_rgba(42,26,10,0.18)]"
        >
          {lockedMsg}
        </motion.div>
      )}

      <InteractionPrompt visible={canInteract && !activeInteraction} />

      <InventoryPanel />

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

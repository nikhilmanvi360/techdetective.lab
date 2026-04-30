import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ZoneId } from '../data/campaignData';

export interface CampaignState {
  inventory: string[];
  clues: string[];
  activatedNodes: string[];
  currentZone: ZoneId;
  unlockedZones: ZoneId[];
  objectiveLog: string[];
  completedZones: ZoneId[];
  gameComplete: boolean;
  playerPos: [number, number];
  // Phase 1 Advanced State
  score: number;
  reputation: number;
  hintsUsed: number;
  failedAttempts: number;
  spokenNPCs: string[];
  teamRoles: { p1: string; p2: string } | null;
  dynamicCode: string; // Randomized per session
  p2Pos: [number, number] | null; // Other player's position
  r1Evidence: any[]; // Evidence scavenged in Round 1
}

export type CampaignAction =
  | { type: 'COLLECT_ITEM'; item: string }
  | { type: 'ADD_CLUE'; clue: string }
  | { type: 'ACTIVATE_NODE'; node: string }
  | { type: 'UNLOCK_ZONE'; zone: ZoneId }
  | { type: 'ENTER_ZONE'; zone: ZoneId; pos: [number, number] }
  | { type: 'COMPLETE_ZONE'; zone: ZoneId }
  | { type: 'SET_POS'; pos: [number, number] }
  | { type: 'COMPLETE_GAME' }
  | { type: 'ADD_OBJECTIVE'; text: string }
  | { type: 'INITIALIZE_STATE'; state: CampaignState }
  | { type: 'UPDATE_SCORE'; delta: number }
  | { type: 'RECORD_HINT'; level: 1 | 2 | 3 }
  | { type: 'RECORD_FAILURE' }
  | { type: 'RECORD_NPC_VISIT'; npcId: string }
  | { type: 'SET_ROLES'; roles: { p1: string; p2: string } }
  | { type: 'SET_P2_POS'; pos: [number, number] | null }
  | { type: 'UPDATE_REPUTATION'; delta: number }
  | { type: 'SET_R1_EVIDENCE'; evidence: any[] };

function createInitialState(): CampaignState {
  return {
    inventory: [],
    clues: [],
    activatedNodes: [],
    currentZone: 'lobby',
    unlockedZones: ['lobby'],
    objectiveLog: ["Trace Sehgal's steps. Start with the Bank Lobby logs."],
    completedZones: [],
    gameComplete: false,
    playerPos: [20, 2],
    score: 1000,
    reputation: 50,
    hintsUsed: 0,
    failedAttempts: 0,
    spokenNPCs: [],
    teamRoles: null,
    dynamicCode: Math.floor(1000 + Math.random() * 9000).toString(),
    p2Pos: null,
    r1Evidence: [],
  };
}

function asArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? value as T[] : fallback;
}

export function normalizeCampaignState(state: Partial<CampaignState> | null | undefined): CampaignState {
  const base = createInitialState();
  if (!state || typeof state !== 'object') return base;

  const rawRoles = state.teamRoles;
  const roles =
    rawRoles && typeof rawRoles === 'object' && typeof rawRoles.p1 === 'string' && typeof rawRoles.p2 === 'string'
      ? { p1: rawRoles.p1, p2: rawRoles.p2 }
      : null;

  const rawP2 = state.p2Pos;
  const p2Pos =
    Array.isArray(rawP2) && rawP2.length === 2 && rawP2.every(v => typeof v === 'number')
      ? [rawP2[0], rawP2[1]] as [number, number]
      : null;

  return {
    ...base,
    ...state,
    inventory: asArray(state.inventory, base.inventory),
    clues: asArray(state.clues, base.clues),
    activatedNodes: asArray(state.activatedNodes, base.activatedNodes),
    currentZone: (state.currentZone ?? base.currentZone) as ZoneId,
    unlockedZones: asArray(state.unlockedZones, base.unlockedZones) as ZoneId[],
    objectiveLog: asArray(state.objectiveLog, base.objectiveLog),
    completedZones: asArray(state.completedZones, base.completedZones) as ZoneId[],
    gameComplete: typeof state.gameComplete === 'boolean' ? state.gameComplete : base.gameComplete,
    playerPos:
      Array.isArray(state.playerPos) && state.playerPos.length === 2 && state.playerPos.every(v => typeof v === 'number')
        ? [state.playerPos[0], state.playerPos[1]] as [number, number]
        : base.playerPos,
    score: typeof state.score === 'number' ? state.score : base.score,
    reputation: typeof state.reputation === 'number' ? state.reputation : base.reputation,
    hintsUsed: typeof state.hintsUsed === 'number' ? state.hintsUsed : base.hintsUsed,
    failedAttempts: typeof state.failedAttempts === 'number' ? state.failedAttempts : base.failedAttempts,
    spokenNPCs: asArray(state.spokenNPCs, base.spokenNPCs),
    teamRoles: roles,
    dynamicCode: typeof state.dynamicCode === 'string' && state.dynamicCode.length > 0 ? state.dynamicCode : base.dynamicCode,
    p2Pos,
    r1Evidence: asArray(state.r1Evidence, base.r1Evidence),
  };
}

function reducer(state: CampaignState, action: CampaignAction): CampaignState {
  switch (action.type) {
    case 'COLLECT_ITEM':
      if (state.inventory.includes(action.item)) return state;
      return { 
        ...state, 
        inventory: [...state.inventory, action.item],
        score: state.score + 50,
        reputation: Math.min(100, state.reputation + 2)
      };
    case 'ADD_CLUE':
      if (state.clues.includes(action.clue)) return state;
      return { 
        ...state, 
        clues: [...state.clues, action.clue],
        score: state.score + 100,
        reputation: Math.min(100, state.reputation + 5)
      };
    case 'ACTIVATE_NODE':
      if (state.activatedNodes.includes(action.node)) return state;
      return { ...state, activatedNodes: [...state.activatedNodes, action.node] };
    case 'UNLOCK_ZONE':
      if (state.unlockedZones.includes(action.zone)) return state;
      return { ...state, unlockedZones: [...state.unlockedZones, action.zone] };
    case 'ENTER_ZONE':
      return { ...state, currentZone: action.zone, playerPos: action.pos };
    case 'COMPLETE_ZONE':
      if (state.completedZones.includes(action.zone)) return state;
      return { ...state, completedZones: [...state.completedZones, action.zone] };
    case 'SET_POS':
      return { ...state, playerPos: action.pos };
    case 'COMPLETE_GAME':
      return { ...state, gameComplete: true };
    case 'ADD_OBJECTIVE':
      return { ...state, objectiveLog: [...state.objectiveLog, action.text] };
    case 'INITIALIZE_STATE':
      return normalizeCampaignState({ ...state, ...action.state, p2Pos: null });
    case 'UPDATE_SCORE':
      return { ...state, score: Math.max(0, state.score + action.delta) };
    case 'UPDATE_REPUTATION':
      return { ...state, reputation: Math.min(100, Math.max(0, state.reputation + action.delta)) };
    case 'RECORD_HINT':
      const penalties = {
        1: { score: 10, rep: 1 },
        2: { score: 40, rep: 2 },
        3: { score: 100, rep: 5 }
      }[action.level];
      return { 
        ...state, 
        hintsUsed: state.hintsUsed + 1,
        score: Math.max(0, state.score - penalties.score),
        reputation: Math.max(0, state.reputation - penalties.rep)
      };
    case 'RECORD_FAILURE':
      return { 
        ...state, 
        failedAttempts: state.failedAttempts + 1,
        score: Math.max(0, state.score - 100),
        reputation: Math.max(0, state.reputation - 5)
      };
    case 'RECORD_NPC_VISIT':
      if (state.spokenNPCs.includes(action.npcId)) return state;
      return { 
        ...state, 
        spokenNPCs: [...state.spokenNPCs, action.npcId],
        reputation: Math.min(100, state.reputation + 1)
      };
    case 'SET_ROLES':
      return { ...state, teamRoles: action.roles };
    case 'SET_P2_POS':
      return { ...state, p2Pos: action.pos };
    case 'SET_R1_EVIDENCE':
      return { ...state, r1Evidence: action.evidence };
    default:
      return state;
  }
}

const CampaignContext = createContext<{
  state: CampaignState;
  dispatch: React.Dispatch<CampaignAction>;
  isLoaded: boolean;
} | undefined>(undefined);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load initial state
  React.useEffect(() => {
    const token = '';
    if (!token) {
        setIsLoaded(true);
        return;
    }

    Promise.all([
        fetch('/api/campaign/state', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
        fetch('/api/r1/my-evidence', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json())
    ])
    .then(([campaignData, r1Data]) => {
        const normalized = normalizeCampaignState(campaignData);
        dispatch({ type: 'INITIALIZE_STATE', state: { ...normalized, r1Evidence: Array.isArray(r1Data) ? r1Data : [] } });
        setIsLoaded(true);
    })
    .catch(err => {
        console.error('Failed to load campaign state', err);
        setIsLoaded(true);
    });
  }, []);

  // Save state on critical changes
  React.useEffect(() => {
    if (!isLoaded) return;

    const stateToSave = {
      inventory: state.inventory,
      clues: state.clues,
      activatedNodes: state.activatedNodes,
      currentZone: state.currentZone,
      unlockedZones: state.unlockedZones,
      objectiveLog: state.objectiveLog,
      completedZones: state.completedZones,
      gameComplete: state.gameComplete,
      score: state.score,
      reputation: state.reputation,
      hintsUsed: state.hintsUsed,
      failedAttempts: state.failedAttempts,
      spokenNPCs: state.spokenNPCs,
      teamRoles: state.teamRoles,
      dynamicCode: state.dynamicCode,
    };
    
    fetch('/api/campaign/state', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ state: stateToSave })
    }).catch(err => console.error('Failed to save campaign state', err));
  }, [
    isLoaded,
    state.inventory,
    state.clues,
    state.activatedNodes,
    state.currentZone,
    state.unlockedZones,
    state.objectiveLog,
    state.completedZones,
    state.gameComplete,
    state.score,
    state.reputation,
    state.hintsUsed,
    state.failedAttempts,
    state.spokenNPCs,
    state.teamRoles,
    state.dynamicCode,
  ]);

  return (
    React.createElement(CampaignContext.Provider, { value: { state, dispatch, isLoaded } }, children)
  );
}

export function useCampaign() {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaign must be used inside CampaignProvider');
  return ctx;
}

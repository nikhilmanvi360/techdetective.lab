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
}

type Action =
  | { type: 'COLLECT_ITEM'; item: string }
  | { type: 'ADD_CLUE'; clue: string }
  | { type: 'ACTIVATE_NODE'; node: string }
  | { type: 'UNLOCK_ZONE'; zone: ZoneId }
  | { type: 'ENTER_ZONE'; zone: ZoneId; pos: [number, number] }
  | { type: 'COMPLETE_ZONE'; zone: ZoneId }
  | { type: 'SET_POS'; pos: [number, number] }
  | { type: 'COMPLETE_GAME' }
  | { type: 'ADD_OBJECTIVE'; text: string };

const initialState: CampaignState = {
  inventory: [],
  clues: [],
  activatedNodes: [],
  currentZone: 'cafeteria',
  unlockedZones: ['cafeteria'],
  objectiveLog: ['Investigate the Cafeteria. Find clues about the 14th.'],
  completedZones: [],
  gameComplete: false,
  playerPos: [1, 1],
};

function reducer(state: CampaignState, action: Action): CampaignState {
  switch (action.type) {
    case 'COLLECT_ITEM':
      if (state.inventory.includes(action.item)) return state;
      return { ...state, inventory: [...state.inventory, action.item] };
    case 'ADD_CLUE':
      if (state.clues.includes(action.clue)) return state;
      return { ...state, clues: [...state.clues, action.clue] };
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
    default:
      return state;
  }
}

const CampaignContext = createContext<{
  state: CampaignState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    React.createElement(CampaignContext.Provider, { value: { state, dispatch } }, children)
  );
}

export function useCampaign() {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaign must be used inside CampaignProvider');
  return ctx;
}

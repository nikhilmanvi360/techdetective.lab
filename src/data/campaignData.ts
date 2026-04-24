export type TileType = 'walkable' | 'wall' | 'npc' | 'terminal' | 'item' | 'gate' | 'exit';
export type ZoneId = 'cafeteria' | 'library' | 'maintenance' | 'admin_core';

export interface TileInteraction {
  type: 'dialogue' | 'item' | 'gate' | 'clue' | 'final';
  speaker?: string;
  lines: string[];
  reward?: string;       // item id
  clue?: string;         // clue text
  requiresItems?: string[];
  unlocksZone?: ZoneId;
  
  // NEW MECHANICS
  terminalCmd?: string;        // Command required to solve terminal puzzle
  terminalContext?: string;    // Hint shown in terminal
  terminalNudge?: string;      // Level 1: Small nudge
  terminalHint?: string;       // Level 2: Stronger clue
  terminalSuccess?: string[];  // Lines shown after correct command
  terminalPartials?: { trigger: string; response: string }[]; // "Almost Right" hints
  
  options?: { label: string; nextLines: string[]; reward?: string; clue?: string; repDelta?: number }[]; // Dialogue options
  
  requiredCluesToUnlock?: string[]; // Array of Clue IDs/Text player must present in any order
  clueFailMsg?: string[];        // What NPC says if wrong clue or no clue is presented
}

export interface DroneConfig {
  id: string;
  path: [number, number][]; // Sequence of coordinates to patrol
}

export interface MapDecoration {
  id: string;
  pos: [number, number];
  src: string;
  alt: string;
  span?: [number, number];
  frameCount?: number;
  opacity?: number;
  scale?: number;
  zIndex?: number;
  animate?: boolean;
}

export interface ZoneConfig {
  id: ZoneId;
  name: string;
  description: string;
  color: string;          // CSS color for zone tint
  requiredItems: string[];
  grid: TileType[][];
  interactions: Record<string, TileInteraction>; // "row,col" → interaction
  drones?: DroneConfig[]; // Hazards that reset player
  playerStart: [number, number];
  decorations?: MapDecoration[];
}

const W: TileType = 'walkable';
const X: TileType = 'wall';
const N: TileType = 'npc';
const T: TileType = 'terminal';
const I: TileType = 'item';
const G: TileType = 'gate';
const E: TileType = 'exit';

function createGrid(size: number, filler: (r: number, c: number) => TileType): TileType[][] {
  return Array(size).fill(null).map((_, r) => Array(size).fill(null).map((_, c) => {
    if (r === 0 || r === size - 1 || c === 0 || c === size - 1) return X;
    return filler(r, c);
  }));
}

const MAP_SIZE = 28;

const ROUND2_ROOT = '/assets/round2-topdown';
const ROUND2_SPRITES = {
  player: `${ROUND2_ROOT}/characters/player_back_standing.png`,
  npc: `${ROUND2_ROOT}/characters/npc_idle_b.png`,
  drone: `${ROUND2_ROOT}/characters/enemy_standing_b.png`,
  house1: `${ROUND2_ROOT}/environment/house_1.png`,
  house2: `${ROUND2_ROOT}/environment/house_2.png`,
  pine: `${ROUND2_ROOT}/environment/pine_tree.png`,
  birch: `${ROUND2_ROOT}/environment/birch_tree.png`,
  stone: `${ROUND2_ROOT}/environment/stone.png`,
  campfire: `${ROUND2_ROOT}/effects/campfire.png`,
  torch: `${ROUND2_ROOT}/effects/torch.png`,
  road: `${ROUND2_ROOT}/environment/road.png`,
};

// ==========================================
// CAFETERIA (Zone 1)
// ==========================================
const cafeteriaGrid = createGrid(MAP_SIZE, (r, c) => {
  if (r >= 2 && r <= 7 && c >= 12 && c <= 18) {
    if (r === 7 && c !== 15) return X; 
    if (c === 12 && r !== 7) return X;
    return W;
  }
  if (r % 3 === 0 && c > 2 && c < 10) return X;
  if (c >= 20 && r > 1 && r < 26) {
    if (c === 22 || c === 25) return X;
    return W;
  }
  return W;
});
cafeteriaGrid[7][15] = G; // Gate to kitchen
cafeteriaGrid[3][16] = T; // Kitchen terminal
cafeteriaGrid[4][14] = I; // HR Printout
cafeteriaGrid[12][5] = N; // Witness
cafeteriaGrid[14][8] = I; // Bulletin Board
cafeteriaGrid[17][2] = T; // Left-Behind Laptop
cafeteriaGrid[2][2] = I;  // Lost USB (Side Quest)
cafeteriaGrid[5][5] = N;  // Stressed Professor
cafeteriaGrid[18][18] = E; // Exit to library

// ==========================================
// LIBRARY (Zone 2)
// ==========================================
const libraryGrid = createGrid(MAP_SIZE, (r, c) => {
  if (c % 4 === 0 && r > 2 && r < 17) return X;
  if (r === 10 && c % 4 !== 0 && c < 16) return X; 
  if (c >= 20 && r > 3 && r < 24) {
    if (r === 12 || c === 23) return X;
    return W;
  }
  return W;
});
libraryGrid[10][2] = W;
libraryGrid[10][10] = W;
libraryGrid[2][2] = N; // Librarian
libraryGrid[5][15] = T; // Redacted Terminal
libraryGrid[15][18] = I; // Python Snippet
libraryGrid[18][2] = I; // Bookcase 3
libraryGrid[5][5] = I; // Decoy Note
libraryGrid[8][6] = N; // Student
libraryGrid[18][18] = E; // Exit

// ==========================================
// MAINTENANCE (Zone 3)
// ==========================================
const maintenanceGrid = createGrid(MAP_SIZE, (r, c) => {
  if (r === 5 || r === 12) {
    if (c !== 4 && c !== 15) return X; 
  }
  if (c === 10 && r > 2 && r < 18) return X; 
  if (r >= 20 && c > 2 && c < 26) {
    if (r === 23 || c === 14) return X;
    return W;
  }
  return W;
});
maintenanceGrid[2][2] = N; // Caretaker
maintenanceGrid[4][8] = T; // Node Alpha (Java Error)
maintenanceGrid[2][16] = I; // Whiteboard
maintenanceGrid[11][12] = T; // Node Beta
maintenanceGrid[17][5] = T; // Node Gamma
maintenanceGrid[18][12] = I; // Security Cabinet
maintenanceGrid[18][18] = G; // Exit

// ==========================================
// ADMIN CORE (Zone 4)
// ==========================================
const adminGrid = createGrid(MAP_SIZE, (r, c) => {
  if (r === 8 && c > 5 && c < 15) return X;
  if (r === 14 && c > 5 && c < 15) return X;
  if ((c === 5 || c === 15) && r > 8 && r < 14) return X;
  if (r >= 20 || c >= 20) {
    if (r === 20 || c === 20) return X;
    if (r === 23 && c > 20 && c < 26) return X;
    return W;
  }
  return W;
});
adminGrid[14][10] = G; // Firewall gate
adminGrid[11][10] = T; // CORE TERMINAL
adminGrid[4][4] = N; // Security Director
adminGrid[10][5] = T; // Core Node 1
adminGrid[10][10] = T; // Core Node 2
adminGrid[11][10] = T; // Final Core Node
adminGrid[5][15] = I; // Admin Deskwall Control (Inside)
adminGrid[6][10] = I; // Desk item

export interface SynthesisRecipe {
  requiredClues: string[];
  resultClue: string;
  isRedHerring?: boolean;
}

export const SYNTHESIS_RECIPES: SynthesisRecipe[] = [
  {
    requiredClues: [
      'Raza Malik was born in {dynamicCode}.',
      'Terminal log: sys_ghost active at 11:05 PM.',
      'Redacted Doc: Librarian authorized sys_ghost access.'
    ],
    resultClue: 'SYNTHESIS: Raza Malik ({dynamicCode}) used Librarian access to breach the system at 11:05 PM.'
  },
  {
    requiredClues: [
      'Decoy: 2022 warning about VBA macros.',
      'Terminal log: sys_ghost active at 11:05 PM.'
    ],
    resultClue: 'FALSE LEAD: The 2022 VBA warning is completely unrelated to the current breach.',
    isRedHerring: true
  }
];

export const CAMPAIGN_ZONES: ZoneConfig[] = [
  {
    id: 'cafeteria',
    name: 'Cafeteria & Kitchen',
    description: 'The campus canteen. The lights are flickering. Gather clues to piece together what happened at 11 PM.',
    color: '#b5874a',
    requiredItems: [],
    playerStart: [2, 2],
    grid: cafeteriaGrid,
    decorations: [
      { id: 'cafeteria-annex', pos: [3, 21], span: [4, 5], src: ROUND2_SPRITES.house1, alt: 'Cafeteria annex' },
      { id: 'cafeteria-pine-a', pos: [6, 24], span: [4, 3], src: ROUND2_SPRITES.pine, alt: 'Pine tree' },
      { id: 'cafeteria-pine-b', pos: [10, 22], span: [4, 3], src: ROUND2_SPRITES.pine, alt: 'Pine tree' },
      { id: 'cafeteria-birch', pos: [19, 21], span: [3, 2], src: ROUND2_SPRITES.birch, alt: 'Birch tree' },
      { id: 'cafeteria-campfire', pos: [22, 8], span: [2, 2], src: ROUND2_SPRITES.campfire, alt: 'Campfire', frameCount: 8, animate: true, opacity: 0.95 },
      { id: 'cafeteria-torch', pos: [20, 13], span: [2, 1], src: ROUND2_SPRITES.torch, alt: 'Torch', frameCount: 8 },
      { id: 'cafeteria-stone', pos: [23, 18], span: [2, 2], src: ROUND2_SPRITES.stone, alt: 'Stone outcrop' },
    ],
    interactions: {
      '14,8': { 
        type: 'clue', 
        speaker: 'Bulletin Board', 
        lines: ['A mock-up for the new student portal is pinned here.', 'Looking closely, there is a handwritten note: "<!-- TODO: remove testing portal link /dev-admin -->"'], 
        clue: 'HTML Comment: Hidden admin portal at /dev-admin' 
      },
      '4,14': { 
        type: 'clue', 
        speaker: 'Discarded HR Printout', 
        lines: ['You find an employee data sheet. It belongs to a "Raza Malik".', 'Birth Year: {dynamicCode}.'], 
        clue: 'Raza Malik was born in {dynamicCode}.' 
      },
      '17,2': { 
        type: 'item', 
        speaker: 'Left-Behind Laptop', 
        lines: ['Authentication successful.', 'You downloaded the Kitchen Passcode from the hard drive.'], 
        reward: 'kitchen_key',
        terminalCmd: 'login --pass Raza{dynamicCode}',
        terminalContext: 'AUTHENTICATION REQUIRED. Password hint: Name + Birth Year.',
        terminalNudge: 'Did you check the HR Printout on the desk near the entrance?',
        terminalHint: 'Combine the Suspect First Name and Birth Year from the HR Printout.',
        terminalPartials: [
          { trigger: 'Raza', response: 'Name recognized. Missing the birth year passcode extension.' },
          { trigger: '{dynamicCode}', response: 'Passcode recognized. Missing the suspect name prefix.' }
        ]
      },
      '7,15': { type: 'gate', speaker: 'Kitchen Door', lines: ['The kitchen is locked. You need the Kitchen Passcode.'], requiresItems: ['kitchen_key'] },
      '3,16': { 
        type: 'clue', 
        speaker: 'Kitchen Terminal', 
        lines: ['System Log Accessed.', 'Log entry shows an active session under user sys_ghost at 11:05 PM.'], 
        clue: 'Terminal log: sys_ghost active at 11:05 PM.',
        terminalHint: 'Examine the terminal logs for unusual activity.'
      },
      '12,5': { 
        type: 'dialogue', 
        speaker: 'Student Witness', 
        lines: ['The power went out at 11:00 PM exactly. No one was in the kitchen after that, I swear!'],
        options: [
          { 
            label: 'Trust Witness', 
            nextLines: ['Thank you for believing me! Check the terminal logs to verify.'],
            repDelta: 1
          },
          { 
            label: 'Press for Details', 
            nextLines: ['I mean... maybe someone with admin access could bypass the power lock. Check the logs.'],
            clue: 'Student suspicion: Admin bypassed power lock.',
            repDelta: -1
          }
        ],
        requiredCluesToUnlock: ['Terminal log: sys_ghost active at 11:05 PM.'],
        clueFailMsg: ['I already told you, the power was out!'],
        reward: 'key_A'
      },
      '2,2': {
        type: 'clue',
        speaker: 'Under a Table',
        lines: ['You found a small, encrypted USB drive.', 'It has a label: "Prof. H. - Final Exams".'],
        clue: 'Lost USB Drive (Prof. H)'
      },
      '5,5': {
        type: 'dialogue',
        speaker: 'Stressed Professor',
        lines: ['I dropped my USB drive somewhere in here! My entire curriculum is on it!'],
        requiredCluesToUnlock: ['Lost USB Drive (Prof. H)'],
        clueFailMsg: ['That is not my USB drive. Please keep looking!'],
        options: [
          {
            label: 'Hand over USB',
            nextLines: ['Oh thank you! Thank you! Take this admin override code, I won\'t need it anymore.'],
            reward: 'admin_override_code',
            repDelta: 5
          }
        ]
      },
      '18,18': { type: 'gate', speaker: 'Zone Exit', lines: ['The corridor to the Library. You need Key A to pass.'], requiresItems: ['key_A'], unlocksZone: 'library' },
    },
  },
  {
    id: 'library',
    name: 'Campus Library',
    description: 'A labyrinth of information. Trace the digital footprints.',
    color: '#5a7a4a',
    requiredItems: ['key_A'],
    playerStart: [2, 2],
    grid: libraryGrid,
    decorations: [
      { id: 'library-annex', pos: [3, 21], span: [4, 5], src: ROUND2_SPRITES.house2, alt: 'Archive annex' },
      { id: 'library-birch-a', pos: [7, 24], span: [4, 2], src: ROUND2_SPRITES.birch, alt: 'Birch tree' },
      { id: 'library-birch-b', pos: [18, 22], span: [3, 2], src: ROUND2_SPRITES.birch, alt: 'Birch tree' },
      { id: 'library-forest', pos: [21, 6], span: [4, 3], src: ROUND2_SPRITES.pine, alt: 'Pine tree' },
      { id: 'library-stone', pos: [22, 17], span: [2, 2], src: ROUND2_SPRITES.stone, alt: 'Stone pile' },
      { id: 'library-torch', pos: [12, 21], span: [2, 1], src: ROUND2_SPRITES.torch, alt: 'Torch', frameCount: 8 },
    ],
    interactions: {
      '5,15': { 
        type: 'clue', 
        speaker: 'Archived Terminal', 
        lines: ['CSS Override removed.', 'The document reveals the Librarian authorized access for sys_ghost.'], 
        clue: 'Redacted Doc: Librarian authorized sys_ghost access.',
        terminalCmd: 'set display block',
        terminalContext: 'DOCUMENT ENCRYPTED. CSS property "display" is currently set to "none".',
        terminalNudge: 'Check the note on the library desk about CSS properties.',
        terminalHint: 'You need to change the CSS property from "none" to "block" to see the content.',
        terminalPartials: [
          { trigger: 'block', response: 'Property "block" detected, but syntax is missing the "set display" command.' }
        ]
      },
      '15,18': { 
        type: 'clue', 
        speaker: 'Dropped Note', 
        lines: ['A scribbled Python script:', '"for i in range(1, 5):"', '"  if i == 3: break"'], 
        clue: 'Python snippet stops at index 3.' 
      },
      '5,5': { 
        type: 'clue', 
        speaker: 'Old Memo', 
        lines: ['Memo to Staff: "Beware of the malicious VBA macros in the accounting spreadsheets."', 'It seems like a general warning from 2022.'], 
        clue: 'Decoy: 2022 warning about VBA macros.' 
      },
      '18,2': { 
        type: 'item', 
        speaker: 'Bookcase 3', 
        lines: ['You check the third bookcase based on the Python logic.', 'Hidden behind a book is the Master Badge (KEY_B).'], 
        reward: 'key_B'
      },
      '2,2': { 
        type: 'dialogue', 
        speaker: 'Librarian', 
        lines: ['I don\'t know anything about a sys_ghost. My logs are clean.'],
        requiredCluesToUnlock: ['Redacted Doc: Librarian authorized sys_ghost access.'],
        clueFailMsg: ['You have no proof of that. Please leave the library.']
      },
      '18,18': { type: 'gate', speaker: 'Maintenance Corridor', lines: ['Maintenance Wing entrance. Requires Key B.'], requiresItems: ['key_B'], unlocksZone: 'maintenance' },
    },
  },
  {
    id: 'maintenance',
    name: 'Maintenance Wing',
    description: 'Industrial corridors. Beware the security drones. Repair the power nodes.',
    color: '#7a5a3a',
    requiredItems: ['key_A', 'key_B'],
    playerStart: [2, 2],
    grid: maintenanceGrid,
    decorations: [
      { id: 'maintenance-shack', pos: [2, 21], span: [4, 4], src: ROUND2_SPRITES.house1, alt: 'Maintenance shack' },
      { id: 'maintenance-road', pos: [20, 4], span: [4, 6], src: ROUND2_SPRITES.road, alt: 'Road strip' },
      { id: 'maintenance-stone', pos: [22, 16], span: [2, 2], src: ROUND2_SPRITES.stone, alt: 'Stone pile' },
      { id: 'maintenance-campfire', pos: [23, 7], span: [2, 2], src: ROUND2_SPRITES.campfire, alt: 'Campfire', frameCount: 8, animate: true, opacity: 0.9 },
      { id: 'maintenance-pine', pos: [6, 24], span: [4, 3], src: ROUND2_SPRITES.pine, alt: 'Pine tree' },
      { id: 'maintenance-torch', pos: [14, 22], span: [2, 1], src: ROUND2_SPRITES.torch, alt: 'Torch', frameCount: 8 },
    ],
    interactions: {
      '2,2': { type: 'dialogue', speaker: 'Caretaker', lines: ['The system script crashed. I saw a Python error on Node Alpha: "IndexError: list index out of range".', 'It seems it was trying to access a system that doesn\'t exist. You need to point it to the correct core system.'] },
      '2,16': { 
        type: 'clue', 
        speaker: 'Whiteboard', 
        lines: ['A list of core systems is written here:', 'systems = ["Cooling", "Lighting", "Security", "Grid_Control"]', 'The error says it tried to access index 4.'], 
        clue: 'Python IndexError: Index 4 is out of range for a list of size 4.' 
      },
      '4,8': { 
        type: 'item', 
        speaker: 'Node Alpha', 
        lines: ['Python script corrected. System pointing to index 3 (Grid_Control).', 'Node Alpha is back online.'], 
        reward: 'sync_alpha',
        terminalCmd: 'fix_index 3',
        terminalContext: 'SYSTEM ERROR. IndexError: list index out of range. Current access: systems[4]. Enter the highest valid index for the list [Cooling, Lighting, Security, Grid_Control].',
        terminalNudge: 'The error says index 4 is too high. How many items are in that list?',
        terminalHint: 'Lists are 0-indexed. If there are 4 items, the indices are 0, 1, 2, and 3.'
      },
      '11,12': { 
        type: 'item', 
        speaker: 'Node Beta', 
        lines: ['Node Beta synced successfully.'], 
        requiresItems: ['sync_alpha'],
        reward: 'sync_beta',
        terminalCmd: 'sync node_beta',
        terminalContext: 'Awaiting sync command for Node Beta. Requires Node Alpha to be online first.',
        terminalHint: 'Type "sync node_beta" to proceed.'
      },
      '17,5': { 
        type: 'item', 
        speaker: 'Node Gamma', 
        lines: ['Node Gamma synced successfully. The grid is stable.'], 
        requiresItems: ['sync_beta'],
        reward: 'sync_gamma',
        terminalCmd: 'sync node_gamma',
        terminalContext: 'Awaiting sync command for Node Gamma. Requires Node Beta to be online first.',
        terminalHint: 'Type "sync node_gamma" to proceed.'
      },
      '18,12': { 
        type: 'item', 
        speaker: 'Security Cabinet', 
        lines: ['With the nodes online, the cabinet unlocks.', 'You collect the OVERRIDE_TOKEN.'], 
        requiresItems: ['sync_gamma'],
        reward: 'override_token'
      },
      '18,18': { type: 'gate', speaker: 'Admin Core Entrance', lines: ['Admin Core requires the Override Token.'], requiresItems: ['override_token'], unlocksZone: 'admin_core' },
    },
    drones: [
      { id: 'drone1', path: [[10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [10, 8], [10, 9], [10, 8], [10, 7], [10, 6], [10, 5], [10, 4], [10, 3]] },
      { id: 'drone2', path: [[16, 2], [16, 3], [16, 4], [16, 5], [16, 6], [16, 7], [16, 8], [16, 9], [16, 8], [16, 7], [16, 6], [16, 5], [16, 4], [16, 3]] }
    ]
  },
  {
    id: 'admin_core',
    name: 'Admin Core',
    description: 'The final firewall. Bring all your evidence to bear.',
    color: '#8B2020',
    requiredItems: ['key_A', 'key_B', 'override_token'],
    playerStart: [2, 2],
    grid: adminGrid,
    decorations: [
      { id: 'admin-shack', pos: [2, 21], span: [4, 4], src: ROUND2_SPRITES.house2, alt: 'Admin bunker' },
      { id: 'admin-stone-a', pos: [20, 21], span: [2, 2], src: ROUND2_SPRITES.stone, alt: 'Stone pile' },
      { id: 'admin-stone-b', pos: [22, 4], span: [2, 2], src: ROUND2_SPRITES.stone, alt: 'Stone pile' },
      { id: 'admin-torch-a', pos: [7, 21], span: [2, 1], src: ROUND2_SPRITES.torch, alt: 'Torch', frameCount: 8 },
      { id: 'admin-torch-b', pos: [17, 22], span: [2, 1], src: ROUND2_SPRITES.torch, alt: 'Torch', frameCount: 8 },
      { id: 'admin-campfire', pos: [15, 8], span: [2, 2], src: ROUND2_SPRITES.campfire, alt: 'Campfire', frameCount: 8, animate: true, opacity: 0.92 },
    ],
    interactions: {
      '4,4': { 
        type: 'dialogue', 
        speaker: 'Security Director', 
        lines: ['This breach is severe. I need to see exactly how sys_ghost infiltrated the system.'],
        requiredCluesToUnlock: [
          'Raza Malik was born in 1998.',
          'Terminal log: sys_ghost active at 11:05 PM.',
          'Redacted Doc: Librarian authorized sys_ghost access.'
        ],
        clueFailMsg: ['That doesn\'t give me the full picture. I need proof of the suspect\'s identity, their timeline, AND how they bypassed the archive. Dig deeper.']
      },
      '11,10': { 
        type: 'final', 
        speaker: 'Mainframe Core', 
        lines: ['CRITICAL OVERRIDE DETECTED.', 'System is shutting down...', 'The ARGUS protocol has been terminated.', 'Tech Detective Raza Malik has been apprehended.'],
        requiresItems: ['core_decrypted'],
        terminalCmd: 'initiate_shutdown -f -u sys_ghost',
        terminalContext: 'FINAL SHUTDOWN AUTHORIZATION REQUIRED. Use force flag (-f) and target user (-u sys_ghost).',
        terminalHint: 'Run the command exactly as described in the context.'
      },
      '10,5': { 
        type: 'item', 
        speaker: 'Core Node 1', 
        lines: ['System logs overridden.'], 
        reward: 'core_overridden',
        terminalCmd: 'override -sys log',
        terminalContext: 'Node 1: Awaiting system log override.',
        terminalHint: 'Type "override -sys log" to proceed.'
      },
      '10,10': { 
        type: 'item', 
        speaker: 'Core Node 2', 
        lines: ['ARGUS decryption complete.'], 
        requiresItems: ['core_overridden'],
        reward: 'core_decrypted',
        terminalCmd: 'decrypt -v argus',
        terminalContext: 'Node 2: Awaiting protocol decryption.',
        terminalHint: 'Type "decrypt -v argus" to proceed.'
      },
    },
    drones: [
      { id: 'drone3', path: [[12, 6], [12, 7], [12, 8], [12, 9], [12, 10], [12, 11], [12, 12], [12, 13], [12, 14], [12, 13], [12, 12], [12, 11], [12, 10], [12, 9], [12, 8], [12, 7]] }
    ]
  },
];

export const ITEMS: Record<string, { name: string; description: string; icon: string }> = {
  key_A: { name: 'Library Key Card', description: 'Grants access to the Library wing.', icon: '🗝️' },
  key_B: { name: 'Master Badge', description: 'Found in the library. Unlocks restricted areas.', icon: '🪪' },
  kitchen_key: { name: 'Kitchen Passcode', description: 'Downloaded from the laptop. Opens the kitchen.', icon: '🔑' },
  override_token: { name: 'Override Token', description: 'Level-4 admin override. For the Admin Core entrance.', icon: '📋' },
  firewall_bypass: { name: 'Firewall Bypass', description: 'Digital key to open the inner core.', icon: '💻' },
};

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
}

const W: TileType = 'walkable';
const X: TileType = 'wall';
const N: TileType = 'npc';
const T: TileType = 'terminal';
const I: TileType = 'item';
const G: TileType = 'gate';
const E: TileType = 'exit';

// Utility to create a blank grid filled with walkable area and a border of walls
function createBlankGrid(size: number): TileType[][] {
  return Array(size).fill(null).map((_, r) => 
    Array(size).fill(null).map((_, c) => {
      if (r === 0 || r === size - 1 || c === 0 || c === size - 1) return X;
      return W;
    })
  );
}

// Draw a line of tiles (horizontal or vertical)
function drawLine(grid: TileType[][], r1: number, c1: number, r2: number, c2: number, type: TileType) {
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
      grid[r][c] = type;
    }
  }
}

// Draw a filled rectangle of tiles
function fillRect(grid: TileType[][], r: number, c: number, h: number, w: number, type: TileType) {
  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      grid[r + i][c + j] = type;
    }
  }
}

const MAP_SIZE = 24;

// ==========================================
// CAFETERIA (Zone 1)
// ==========================================
const cafeteriaGrid = createBlankGrid(MAP_SIZE);
// Kitchen Walls (top-right)
fillRect(cafeteriaGrid, 2, 14, 8, 8, X);
fillRect(cafeteriaGrid, 3, 15, 6, 6, W);
// Dining tables implied by short wall segments
drawLine(cafeteriaGrid, 6, 4, 6, 6, X);
drawLine(cafeteriaGrid, 10, 4, 10, 6, X);
drawLine(cafeteriaGrid, 14, 4, 14, 6, X);
drawLine(cafeteriaGrid, 6, 10, 6, 12, X);
drawLine(cafeteriaGrid, 10, 10, 10, 12, X);
// Entrance/Exit corridor walls
drawLine(cafeteriaGrid, 18, 1, 18, 15, X);
drawLine(cafeteriaGrid, 18, 17, 22, 17, X);

// Interactables
cafeteriaGrid[9][14] = G; // Gate to kitchen
cafeteriaGrid[4][18] = T; // Kitchen terminal
cafeteriaGrid[2][4]  = I; // HR Printout
cafeteriaGrid[12][7] = N; // Witness
cafeteriaGrid[16][12] = I; // Bulletin Board
cafeteriaGrid[15][3] = T; // Left-Behind Laptop
cafeteriaGrid[2][2]  = I; // Lost USB (Side Quest)
cafeteriaGrid[7][8]  = N; // Stressed Professor
cafeteriaGrid[22][20] = E; // Exit to library

// ==========================================
// LIBRARY (Zone 2)
// ==========================================
const libraryGrid = createBlankGrid(MAP_SIZE);
// Bookshelf columns
for (let c = 4; c <= 16; c += 4) {
  drawLine(libraryGrid, 4, c, 18, c, X);
}
// Reception Desk
drawLine(libraryGrid, 8, 1, 8, 2, X);
drawLine(libraryGrid, 2, 8, 2, 12, X);
// Gaps in bookshelves
libraryGrid[10][4] = W;
libraryGrid[14][8] = W;
libraryGrid[8][12] = W;
libraryGrid[16][16] = W;

// Interactables
libraryGrid[3][10] = N; // Librarian
libraryGrid[6][18] = T; // Redacted Terminal
libraryGrid[15][19] = I; // Python Snippet
libraryGrid[20][3] = I; // Bookcase 3
libraryGrid[12][6] = I; // Decoy Note
libraryGrid[18][10] = N; // Student
libraryGrid[20][22] = E; // Exit

// ==========================================
// MAINTENANCE (Zone 3)
// ==========================================
const maintenanceGrid = createBlankGrid(MAP_SIZE);
// H-shaped corridor structure
fillRect(maintenanceGrid, 2, 2, 20, 20, X); // Fill entirely first
// Main horizontal corridor
fillRect(maintenanceGrid, 10, 2, 4, 20, W);
// Left vertical corridor
fillRect(maintenanceGrid, 2, 4, 20, 4, W);
// Right vertical corridor
fillRect(maintenanceGrid, 2, 16, 20, 4, W);
// Node rooms
fillRect(maintenanceGrid, 3, 9, 5, 5, W);
fillRect(maintenanceGrid, 16, 9, 5, 5, W);
// Add paths to node rooms
fillRect(maintenanceGrid, 5, 8, 2, 2, W);
fillRect(maintenanceGrid, 5, 14, 2, 2, W);
fillRect(maintenanceGrid, 17, 8, 2, 2, W);

// Interactables
maintenanceGrid[3][5]  = N; // Caretaker
maintenanceGrid[4][11] = T; // Node Alpha (Java Error)
maintenanceGrid[3][18] = I; // Whiteboard
maintenanceGrid[18][11] = T; // Node Beta
maintenanceGrid[11][18] = T; // Node Gamma
maintenanceGrid[21][5]  = I; // Security Cabinet
maintenanceGrid[21][17] = G; // Exit

// ==========================================
// ADMIN CORE (Zone 4)
// ==========================================
const adminGrid = createBlankGrid(MAP_SIZE);
// Outer ring
fillRect(adminGrid, 4, 4, 16, 16, X);
fillRect(adminGrid, 6, 6, 12, 12, W);
// Inner Core Room
fillRect(adminGrid, 9, 9, 6, 6, X);
fillRect(adminGrid, 10, 10, 4, 4, W);

// Interactables
adminGrid[14][11] = G; // Firewall gate
adminGrid[11][11] = T; // CORE TERMINAL
adminGrid[2][12]  = N; // Security Director
adminGrid[7][7]   = T; // Core Node 1
adminGrid[7][16]  = T; // Core Node 2
adminGrid[12][11] = T; // Final Core Node
adminGrid[17][6]  = I; // Admin Deskwall Control (Inside)
adminGrid[17][17] = I; // Desk item

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
    playerStart: [20, 2], // Starting bottom left in new layout
    grid: cafeteriaGrid,
    interactions: {
      '16,12': { 
        type: 'clue', 
        speaker: 'Bulletin Board', 
        lines: ['A mock-up for the new student portal is pinned here.', 'Looking closely, there is a handwritten note: "<!-- TODO: remove testing portal link /dev-admin -->"'], 
        clue: 'HTML Comment: Hidden admin portal at /dev-admin' 
      },
      '2,4': { 
        type: 'clue', 
        speaker: 'Discarded HR Printout', 
        lines: ['You find an employee data sheet. It belongs to a "Raza Malik".', 'Birth Year: {dynamicCode}.'], 
        clue: 'Raza Malik was born in {dynamicCode}.' 
      },
      '15,3': { 
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
      '9,14': { type: 'gate', speaker: 'Kitchen Door', lines: ['The kitchen is locked. You need the Kitchen Passcode.'], requiresItems: ['kitchen_key'] },
      '4,18': { 
        type: 'clue', 
        speaker: 'Kitchen Terminal', 
        lines: ['System Log Accessed.', 'Log entry shows an active session under user sys_ghost at 11:05 PM.'], 
        clue: 'Terminal log: sys_ghost active at 11:05 PM.',
        terminalHint: 'Examine the terminal logs for unusual activity.'
      },
      '12,7': { 
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
      '7,8': {
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
      '22,20': { type: 'gate', speaker: 'Zone Exit', lines: ['The corridor to the Library. You need Key A to pass.'], requiresItems: ['key_A'], unlocksZone: 'library' },
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
    interactions: {
      '6,18': { 
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
      '15,19': { 
        type: 'clue', 
        speaker: 'Dropped Note', 
        lines: ['A scribbled Python script:', '"for i in range(1, 5):"', '"  if i == 3: break"'], 
        clue: 'Python snippet stops at index 3.' 
      },
      '12,6': { 
        type: 'clue', 
        speaker: 'Old Memo', 
        lines: ['Memo to Staff: "Beware of the malicious VBA macros in the accounting spreadsheets."', 'It seems like a general warning from 2022.'], 
        clue: 'Decoy: 2022 warning about VBA macros.' 
      },
      '20,3': { 
        type: 'item', 
        speaker: 'Bookcase 3', 
        lines: ['You check the third bookcase based on the Python logic.', 'Hidden behind a book is the Master Badge (KEY_B).'], 
        reward: 'key_B'
      },
      '3,10': { 
        type: 'dialogue', 
        speaker: 'Librarian', 
        lines: ['I don\'t know anything about a sys_ghost. My logs are clean.'],
        requiredCluesToUnlock: ['Redacted Doc: Librarian authorized sys_ghost access.'],
        clueFailMsg: ['You have no proof of that. Please leave the library.']
      },
      '20,22': { type: 'gate', speaker: 'Maintenance Corridor', lines: ['Maintenance Wing entrance. Requires Key B.'], requiresItems: ['key_B'], unlocksZone: 'maintenance' },
    },
  },
  {
    id: 'maintenance',
    name: 'Maintenance Wing',
    description: 'Industrial corridors. Beware the security drones. Repair the power nodes.',
    color: '#7a5a3a',
    requiredItems: ['key_A', 'key_B'],
    playerStart: [2, 5],
    grid: maintenanceGrid,
    interactions: {
      '3,5': { type: 'dialogue', speaker: 'Caretaker', lines: ['The system script crashed. I saw a Python error on Node Alpha: "IndexError: list index out of range".', 'It seems it was trying to access a system that doesn\'t exist. You need to point it to the correct core system.'] },
      '3,18': { 
        type: 'clue', 
        speaker: 'Whiteboard', 
        lines: ['A list of core systems is written here:', 'systems = ["Cooling", "Lighting", "Security", "Grid_Control"]', 'The error says it tried to access index 4.'], 
        clue: 'Python IndexError: Index 4 is out of range for a list of size 4.' 
      },
      '4,11': { 
        type: 'item', 
        speaker: 'Node Alpha', 
        lines: ['Python script corrected. System pointing to index 3 (Grid_Control).', 'Node Alpha is back online.'], 
        reward: 'sync_alpha',
        terminalCmd: 'fix_index 3',
        terminalContext: 'SYSTEM ERROR. IndexError: list index out of range. Current access: systems[4]. Enter the highest valid index for the list [Cooling, Lighting, Security, Grid_Control].',
        terminalNudge: 'The error says index 4 is too high. How many items are in that list?',
        terminalHint: 'Lists are 0-indexed. If there are 4 items, the indices are 0, 1, 2, and 3.'
      },
      '18,11': { 
        type: 'item', 
        speaker: 'Node Beta', 
        lines: ['Node Beta synced successfully.'], 
        requiresItems: ['sync_alpha'],
        reward: 'sync_beta',
        terminalCmd: 'sync node_beta',
        terminalContext: 'Awaiting sync command for Node Beta. Requires Node Alpha to be online first.',
        terminalHint: 'Type "sync node_beta" to proceed.'
      },
      '11,18': { 
        type: 'item', 
        speaker: 'Node Gamma', 
        lines: ['Node Gamma synced successfully. The grid is stable.'], 
        requiresItems: ['sync_beta'],
        reward: 'sync_gamma',
        terminalCmd: 'sync node_gamma',
        terminalContext: 'Awaiting sync command for Node Gamma. Requires Node Beta to be online first.',
        terminalHint: 'Type "sync node_gamma" to proceed.'
      },
      '21,5': { 
        type: 'item', 
        speaker: 'Security Cabinet', 
        lines: ['With the nodes online, the cabinet unlocks.', 'You collect the OVERRIDE_TOKEN.'], 
        requiresItems: ['sync_gamma'],
        reward: 'override_token'
      },
      '21,17': { type: 'gate', speaker: 'Admin Core Entrance', lines: ['Admin Core requires the Override Token.'], requiresItems: ['override_token'], unlocksZone: 'admin_core' },
    },
    drones: [
      { id: 'drone1', path: [[11, 4], [11, 5], [11, 6], [11, 7], [11, 8], [11, 9], [11, 10], [11, 11], [11, 10], [11, 9], [11, 8], [11, 7], [11, 6], [11, 5]] },
      { id: 'drone2', path: [[12, 12], [12, 13], [12, 14], [12, 15], [12, 16], [12, 17], [12, 18], [12, 19], [12, 18], [12, 17], [12, 16], [12, 15], [12, 14], [12, 13]] }
    ]
  },
  {
    id: 'admin_core',
    name: 'Admin Core',
    description: 'The final firewall. Bring all your evidence to bear.',
    color: '#8B2020',
    requiredItems: ['key_A', 'key_B', 'override_token'],
    playerStart: [2, 11],
    grid: adminGrid,
    interactions: {
      '2,12': { 
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
      '11,11': { 
        type: 'final', 
        speaker: 'Mainframe Core', 
        lines: ['CRITICAL OVERRIDE DETECTED.', 'System is shutting down...', 'The ARGUS protocol has been terminated.', 'Tech Detective Raza Malik has been apprehended.'],
        requiresItems: ['core_decrypted'],
        terminalCmd: 'initiate_shutdown -f -u sys_ghost',
        terminalContext: 'FINAL SHUTDOWN AUTHORIZATION REQUIRED. Use force flag (-f) and target user (-u sys_ghost).',
        terminalHint: 'Run the command exactly as described in the context.'
      },
      '7,7': { 
        type: 'item', 
        speaker: 'Core Node 1', 
        lines: ['System logs overridden.'], 
        reward: 'core_overridden',
        terminalCmd: 'override -sys log',
        terminalContext: 'Node 1: Awaiting system log override.',
        terminalHint: 'Type "override -sys log" to proceed.'
      },
      '7,16': { 
        type: 'item', 
        speaker: 'Core Node 2', 
        lines: ['ARGUS decryption complete.'], 
        requiresItems: ['core_overridden'],
        reward: 'core_decrypted',
        terminalCmd: 'decrypt -v argus',
        terminalContext: 'Node 2: Awaiting protocol decryption.',
        terminalHint: 'Type "decrypt -v argus" to proceed.'
      },
      '12,11': {
         type: 'item',
         speaker: 'Final Core Node',
         lines: ['Final Node processing.'],
         reward: 'none',
         terminalCmd: 'none',
      }
    },
    drones: [
      { id: 'drone3', path: [[7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [15, 6], [16, 6], [16, 7], [16, 8], [16, 9], [16, 10], [16, 11], [16, 12], [16, 13], [16, 14], [16, 15], [16, 16], [15, 16], [14, 16], [13, 16], [12, 16], [11, 16], [10, 16], [9, 16], [8, 16], [7, 16], [7, 15], [7, 14], [7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8], [7, 7]] }
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

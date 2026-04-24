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
  terminalSuccess?: string[];  // Lines shown after correct command
  
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

function createGrid(filler: (r: number, c: number) => TileType): TileType[][] {
  return Array(20).fill(null).map((_, r) => Array(20).fill(null).map((_, c) => {
    if (r === 0 || r === 19 || c === 0 || c === 19) return X;
    return filler(r, c);
  }));
}

// ==========================================
// CAFETERIA (Zone 1)
// ==========================================
const cafeteriaGrid = createGrid((r, c) => {
  if (r >= 2 && r <= 7 && c >= 12 && c <= 18) {
    if (r === 7 && c !== 15) return X; 
    if (c === 12 && r !== 7) return X;
    return W;
  }
  if (r % 3 === 0 && c > 2 && c < 10) return X;
  return W;
});
cafeteriaGrid[7][15] = G; // Gate to kitchen
cafeteriaGrid[3][16] = T; // Kitchen terminal
cafeteriaGrid[4][14] = I; // HR Printout
cafeteriaGrid[12][5] = N; // Witness
cafeteriaGrid[14][8] = I; // Bulletin Board
cafeteriaGrid[17][2] = T; // Left-Behind Laptop
cafeteriaGrid[18][18] = E; // Exit to library

// ==========================================
// LIBRARY (Zone 2)
// ==========================================
const libraryGrid = createGrid((r, c) => {
  if (c % 4 === 0 && r > 2 && r < 17) return X;
  if (r === 10 && c % 4 !== 0 && c < 16) return X; 
  return W;
});
libraryGrid[10][2] = W;
libraryGrid[10][10] = W;
libraryGrid[2][2] = N; // Librarian
libraryGrid[5][15] = T; // Redacted Terminal
libraryGrid[15][18] = I; // Python Snippet
libraryGrid[18][2] = I; // Bookcase 3
libraryGrid[8][6] = N; // Student
libraryGrid[18][18] = E; // Exit

// ==========================================
// MAINTENANCE (Zone 3)
// ==========================================
const maintenanceGrid = createGrid((r, c) => {
  if (r === 5 || r === 12) {
    if (c !== 4 && c !== 15) return X; 
  }
  if (c === 10 && r > 2 && r < 18) return X; 
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
const adminGrid = createGrid((r, c) => {
  if (r === 8 && c > 5 && c < 15) return X;
  if (r === 14 && c > 5 && c < 15) return X;
  if ((c === 5 || c === 15) && r > 8 && r < 14) return X;
  return W;
});
adminGrid[14][10] = G; // Firewall gate
adminGrid[11][10] = T; // CORE TERMINAL
adminGrid[4][4] = N; // Security Director
adminGrid[4][16] = T; // Firewall Terminal
adminGrid[16][10] = T; // Firewall Control (Inside)
adminGrid[6][10] = I; // Desk item

export const CAMPAIGN_ZONES: ZoneConfig[] = [
  {
    id: 'cafeteria',
    name: 'Cafeteria & Kitchen',
    description: 'The campus canteen. The lights are flickering. Gather clues to piece together what happened at 11 PM.',
    color: '#b5874a',
    requiredItems: [],
    playerStart: [2, 2],
    grid: cafeteriaGrid,
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
        lines: ['You find an employee data sheet. It belongs to a "Raza Malik".', 'Birth Year: 1998.'], 
        clue: 'Raza Malik was born in 1998.' 
      },
      '17,2': { 
        type: 'item', 
        speaker: 'Left-Behind Laptop', 
        lines: ['Authentication successful.', 'You downloaded the Kitchen Passcode from the hard drive.'], 
        reward: 'kitchen_key',
        terminalCmd: 'login --pass Raza1998',
        terminalContext: 'AUTHENTICATION REQUIRED. Password hint: Name + Birth Year.'
      },
      '7,15': { type: 'gate', speaker: 'Kitchen Door', lines: ['The kitchen is locked. You need the Kitchen Passcode.'], requiresItems: ['kitchen_key'] },
      '3,16': { 
        type: 'clue', 
        speaker: 'Kitchen Terminal', 
        lines: ['System Log Accessed.', 'Log entry shows an active session under user sys_ghost at 11:05 PM.'], 
        clue: 'Terminal log: sys_ghost active at 11:05 PM.',
      },
      '12,5': { 
        type: 'dialogue', 
        speaker: 'Student Witness', 
        lines: ['The power went out at 11:00 PM exactly. No one was in the kitchen after that, I swear!'],
        requiredCluesToUnlock: ['Terminal log: sys_ghost active at 11:05 PM.'],
        clueFailMsg: ['I already told you, the power was out!'],
        reward: 'key_A'
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
    interactions: {
      '5,15': { 
        type: 'clue', 
        speaker: 'Archived Terminal', 
        lines: ['CSS Override removed.', 'The document reveals the Librarian authorized access for sys_ghost.'], 
        clue: 'Decrypted Doc: Librarian authorized sys_ghost access.',
        terminalCmd: 'set display block',
        terminalContext: 'DOCUMENT REDACTED. A CSS snippet on the desk reads ".redacted { display: none; }".'
      },
      '15,18': { 
        type: 'clue', 
        speaker: 'Dropped Note', 
        lines: ['A scribbled Python script:', '"for i in range(1, 5):"', '"  if i == 3: break"'], 
        clue: 'Python snippet stops at index 3.' 
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
        requiredCluesToUnlock: ['Decrypted Doc: Librarian authorized sys_ghost access.'],
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
        terminalContext: 'SYSTEM ERROR. IndexError: list index out of range. Current access: systems[4]. Enter the highest valid index for the list [Cooling, Lighting, Security, Grid_Control].'
      },
      '11,12': { 
        type: 'item', 
        speaker: 'Node Beta', 
        lines: ['Node Beta synced successfully.'], 
        requiresItems: ['sync_alpha'],
        reward: 'sync_beta',
        terminalCmd: 'sync node_beta',
        terminalContext: 'Awaiting sync command for Node Beta. Requires Node Alpha to be online first.'
      },
      '17,5': { 
        type: 'item', 
        speaker: 'Node Gamma', 
        lines: ['Node Gamma synced successfully. The grid is stable.'], 
        requiresItems: ['sync_beta'],
        reward: 'sync_gamma',
        terminalCmd: 'sync node_gamma',
        terminalContext: 'Awaiting sync command for Node Gamma. Requires Node Beta to be online first.'
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
    interactions: {
      '4,16': { 
        type: 'item', 
        speaker: 'Firewall Terminal', 
        lines: ['Firewall bypassed using evidence keys.', 'You have the Firewall Bypass key.'], 
        reward: 'firewall_bypass',
        terminalCmd: 'bypass -a "11:05 PM" -b "display block"',
        terminalContext: 'FIREWALL. Enter flags: -a [Cafeteria Login Time] -b [Library CSS Property]'
      },
      '14,10': { type: 'gate', speaker: 'Firewall Gate', lines: ['The inner core is protected by a firewall.', 'You need the Firewall Bypass.'], requiresItems: ['firewall_bypass'] },
      '4,4': { 
        type: 'dialogue', 
        speaker: 'Security Director', 
        lines: ['This breach is severe. I need to see exactly how sys_ghost infiltrated the system.'],
        requiredCluesToUnlock: [
          'Raza Malik was born in 1998.',
          'Terminal log: sys_ghost active at 11:05 PM.',
          'Decrypted Doc: Librarian authorized sys_ghost access.'
        ],
        clueFailMsg: ['That doesn\'t give me the full picture. I need proof of the suspect\'s identity, their timeline, AND how they bypassed the archive. Dig deeper.']
      },
      '11,10': { 
        type: 'final', 
        speaker: 'Core Terminal', 
        lines: ['ARGUS protocol terminated.', 'Conclusion: Raza Malik (sys_ghost) orchestrated the breach.', 'Case closed. Excellent work, Detective.'],
        terminalCmd: 'initiate_shutdown -f -u sys_ghost',
        terminalContext: 'ARGUS CORE. Enter shutdown command with flags: force (-f) and target user (-u).'
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

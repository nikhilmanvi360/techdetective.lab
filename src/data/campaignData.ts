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
}

export interface ZoneConfig {
  id: ZoneId;
  name: string;
  description: string;
  color: string;          // CSS color for zone tint
  requiredItems: string[];
  grid: TileType[][];
  interactions: Record<string, TileInteraction>; // "row,col" → interaction
  playerStart: [number, number];
}

const W: TileType = 'walkable';
const X: TileType = 'wall';
const N: TileType = 'npc';
const T: TileType = 'terminal';
const I: TileType = 'item';
const G: TileType = 'gate';
const E: TileType = 'exit';

// Utility to create 20x20 walls by default
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
  // Kitchen area (top right)
  if (r >= 2 && r <= 7 && c >= 12 && c <= 18) {
    if (r === 7 && c !== 15) return X; // wall with a door
    if (c === 12 && r !== 7) return X;
    return W;
  }
  // Tables
  if (r % 3 === 0 && c > 2 && c < 10) return X;
  return W;
});
cafeteriaGrid[7][15] = G; // Gate to kitchen
cafeteriaGrid[3][16] = T; // Kitchen terminal
cafeteriaGrid[4][14] = I; // Item in kitchen
cafeteriaGrid[12][5] = N; // Witness
cafeteriaGrid[14][8] = N; // Staff
cafeteriaGrid[17][2] = I; // Hidden key
cafeteriaGrid[18][18] = E; // Exit to library

// ==========================================
// LIBRARY (Zone 2)
// ==========================================
const libraryGrid = createGrid((r, c) => {
  // Bookshelf maze
  if (c % 4 === 0 && r > 2 && r < 17) return X;
  if (r === 10 && c % 4 !== 0 && c < 16) return X; 
  return W;
});
libraryGrid[10][2] = W; // gap in maze
libraryGrid[10][10] = W;
libraryGrid[2][2] = N; // Librarian
libraryGrid[5][15] = T; // Terminal
libraryGrid[15][18] = I; // Hidden clue
libraryGrid[18][2] = I; // Locker
libraryGrid[8][6] = N; // Student
libraryGrid[18][18] = E; // Exit

// ==========================================
// MAINTENANCE (Zone 3)
// ==========================================
const maintenanceGrid = createGrid((r, c) => {
  if (r === 5 || r === 12) {
    if (c !== 4 && c !== 15) return X; // walls with gaps
  }
  if (c === 10 && r > 2 && r < 18) return X; // central pillar
  return W;
});
maintenanceGrid[2][2] = N; // Janitor
maintenanceGrid[4][8] = T; // Node 1
maintenanceGrid[11][12] = T; // Node 2
maintenanceGrid[17][5] = T; // Node 3
maintenanceGrid[18][12] = G; // Locked cabinet
maintenanceGrid[18][18] = E; // Exit

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
adminGrid[4][4] = N; // Admin
adminGrid[4][16] = N; // Security
adminGrid[16][10] = T; // Firewall control
adminGrid[6][10] = I; // Desk item

export const CAMPAIGN_ZONES: ZoneConfig[] = [
  {
    id: 'cafeteria',
    name: 'Cafeteria & Kitchen',
    description: 'The campus canteen. Explore the seating area and find a way into the staff kitchen.',
    color: '#b5874a',
    requiredItems: [],
    playerStart: [2, 2],
    grid: cafeteriaGrid,
    interactions: {
      '12,5': { type: 'dialogue', speaker: 'Student Witness', lines: ['I saw someone run into the kitchen right after the power cut.', 'The kitchen door auto-locked behind them. The staff member over there might have the key.'] },
      '14,8': { type: 'dialogue', speaker: 'Canteen Staff', lines: ['You need to get into the kitchen?', 'I dropped my spare kitchen key near the vending machines in the south-west corner. If you find it, you can use it.'] },
      '17,2': { type: 'item', speaker: 'Vending Machine', lines: ['You look under the vending machine.', 'You found the Kitchen Key!'], reward: 'kitchen_key' },
      '7,15': { type: 'gate', speaker: 'Kitchen Door', lines: ['The kitchen is locked. You need the Kitchen Key to enter.'], requiresItems: ['kitchen_key'] },
      '3,16': { type: 'clue', speaker: 'Kitchen Terminal', lines: ['Delivery Log: "Midnight rations picked up by sys_ghost."', 'Clue logged: sys_ghost was in the kitchen at midnight.'], clue: 'sys_ghost was in the kitchen at midnight.' },
      '4,14': { type: 'item', speaker: 'Locker', lines: ['Inside the staff locker, you find a Library Access Card.', 'You collect KEY_A.'], reward: 'key_A' },
      '18,18': { type: 'gate', speaker: 'Zone Exit', lines: ['The corridor to the Library. You need Key A to pass.'], requiresItems: ['key_A'], unlocksZone: 'library' },
    },
  },
  {
    id: 'library',
    name: 'Campus Library',
    description: 'A maze of bookshelves. The archivist is hiding something.',
    color: '#5a7a4a',
    requiredItems: ['key_A'],
    playerStart: [2, 2],
    grid: libraryGrid,
    interactions: {
      '2,2': { type: 'dialogue', speaker: 'Librarian', lines: ['Someone broke the archive seal last night. They scrambled the book locations.', 'The terminal might tell you where the archive override is.'] },
      '8,6': { type: 'dialogue', speaker: 'Research Student', lines: ['I was studying when the lights flickered.', 'I heard someone messing with the locker in the south-west corner. They dropped a torn page in the east wing.'] },
      '5,15': { type: 'clue', speaker: 'Catalog Terminal', lines: ['Search query: "ARGUS_PROTOCOL". Results deleted.', 'Clue logged: ARGUS protocol reference.'], clue: 'ARGUS protocol reference found in library.' },
      '15,18': { type: 'clue', speaker: 'Torn Page', lines: ['You find a torn page on the floor: "Locker code is 8-4-2-1".', 'Clue logged: Locker code.'], clue: 'Library locker code: 8-4-2-1' },
      '18,2': { type: 'item', speaker: 'Locked Locker', lines: ['You enter the code 8-4-2-1. It opens!', 'Inside is the Master Badge (KEY_B).'], reward: 'key_B' },
      '18,18': { type: 'gate', speaker: 'Maintenance Corridor', lines: ['Maintenance Wing entrance. Requires Key B.'], requiresItems: ['key_B'], unlocksZone: 'maintenance' },
    },
  },
  {
    id: 'maintenance',
    name: 'Maintenance Wing',
    description: 'Dark corridors and heavy machinery. Reboot the power nodes.',
    color: '#7a5a3a',
    requiredItems: ['key_A', 'key_B'],
    playerStart: [2, 2],
    grid: maintenanceGrid,
    interactions: {
      '2,2': { type: 'dialogue', speaker: 'Janitor', lines: ['The power nodes are acting up. Someone locked the security cabinet.', 'You need to check Node 1, Node 2, and Node 3.'] },
      '4,8': { type: 'clue', speaker: 'Node 1', lines: ['Node 1 log: Rebooted at 23:51 by sys_ghost.', 'Clue logged.'], clue: 'Node 1 rebooted by sys_ghost.' },
      '11,12': { type: 'clue', speaker: 'Node 2', lines: ['Node 2 log: Encryption bypassed.', 'Clue logged.'], clue: 'Node 2 encryption bypassed.' },
      '17,5': { type: 'clue', speaker: 'Node 3', lines: ['Node 3 log: Cabinet code reset to 0000.', 'Clue logged.'], clue: 'Cabinet code reset to 0000.' },
      '18,12': { type: 'item', speaker: 'Security Cabinet', lines: ['You enter 0000. It unlocks.', 'You collect the OVERRIDE_TOKEN.'], reward: 'override_token' },
      '18,18': { type: 'gate', speaker: 'Admin Core Entrance', lines: ['Admin Core requires the Override Token.'], requiresItems: ['override_token'], unlocksZone: 'admin_core' },
    },
  },
  {
    id: 'admin_core',
    name: 'Admin Core',
    description: 'The nerve centre. ARGUS is here. End this.',
    color: '#8B2020',
    requiredItems: ['key_A', 'key_B', 'override_token'],
    playerStart: [2, 2],
    grid: adminGrid,
    interactions: {
      '4,4': { type: 'dialogue', speaker: 'System Admin', lines: ['You made it. The hacker is using ARGUS.', 'Find the firewall control terminal in the south to lower the barrier.'] },
      '4,16': { type: 'dialogue', speaker: 'Security Director', lines: ['We need the admin passcode to drop the firewall.', 'Check the desk in the north area.'] },
      '6,10': { type: 'item', speaker: 'Desk', lines: ['You find a sticky note: "Admin Pass: HUNTER2".', 'You collect the Admin Passcode.'], reward: 'admin_passcode' },
      '16,10': { type: 'item', speaker: 'Firewall Control', lines: ['You enter the Admin Passcode. The firewall is disabled!', 'You collect the Firewall Bypass key.'], requiresItems: ['admin_passcode'], reward: 'firewall_bypass' },
      '14,10': { type: 'gate', speaker: 'Firewall', lines: ['The inner core is protected by a firewall.', 'You need the Firewall Bypass.'], requiresItems: ['firewall_bypass'] },
      '11,10': { type: 'final', speaker: 'Core Terminal', lines: ['Evidence summary: sys_ghost traces, ARGUS protocol.', 'Conclusion: Raza Malik (sys_ghost) orchestrated the breach using ARGUS.', 'Case closed. Initiating shutdown of ARGUS. Bureau notified.'] },
    },
  },
];

export const ITEMS: Record<string, { name: string; description: string; icon: string }> = {
  key_A: { name: 'Library Key Card', description: 'Grants access to the Library wing.', icon: '🗝️' },
  key_B: { name: 'Master Badge', description: 'Found in the library locker. Unlocks restricted areas.', icon: '🪪' },
  kitchen_key: { name: 'Kitchen Key', description: 'Opens the cafeteria kitchen.', icon: '🔑' },
  override_token: { name: 'Override Token', description: 'Level-4 admin override. For the Admin Core entrance.', icon: '📋' },
  admin_passcode: { name: 'Admin Passcode', description: 'Passcode to disable the firewall.', icon: '📝' },
  firewall_bypass: { name: 'Firewall Bypass', description: 'Digital key to open the inner core.', icon: '💻' },
};

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

// 12×12 grid per zone (smaller = more playable in browser)
const W: TileType = 'walkable';
const X: TileType = 'wall';
const N: TileType = 'npc';
const T: TileType = 'terminal';
const I: TileType = 'item';
const G: TileType = 'gate';
const E: TileType = 'exit';

export const CAMPAIGN_ZONES: ZoneConfig[] = [
  {
    id: 'cafeteria',
    name: 'Cafeteria',
    description: 'The campus canteen. Something happened here on the night of the 14th.',
    color: '#b5874a',
    requiredItems: [],
    playerStart: [1, 1],
    grid: [
      [X, X, X, X, X, X, X, X, X, X, X, X],
      [X, W, W, W, W, N, W, W, W, W, W, X],
      [X, W, X, X, W, W, W, X, X, W, W, X],
      [X, W, X, W, W, W, W, W, X, W, W, X],
      [X, W, W, W, T, W, W, W, W, I, W, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, X, X, W, N, W, X, X, W, W, X],
      [X, W, W, W, W, W, W, W, W, W, I, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, X, W, W, W, W, W, X, W, W, X],
      [X, W, W, W, W, W, W, W, W, W, E, X],
      [X, X, X, X, X, X, X, X, X, X, X, X],
    ],
    interactions: {
      '1,5': { type: 'dialogue', speaker: 'Canteen Staff', lines: ['The power cut at 11 PM. I saw someone in a grey hoodie near the notice board.', 'They dropped something before running off.'] },
      '6,5': { type: 'dialogue', speaker: 'Student Witness', lines: ['I was studying late. I heard the alarm go off in the library around midnight.', 'The librarian looked really nervous the next morning.'] },
      '4,4': { type: 'clue', speaker: 'Login Terminal', lines: ['Access log shows: user "r_malik" authenticated at 23:04 from this terminal.', 'Clue logged: Login anomaly — A-17.'], clue: 'Login anomaly — A-17: user r_malik, 23:04' },
      '4,9': { type: 'item', speaker: 'Dropped Item', lines: ['A laminated key card. Badge reads: LIBRARY ACCESS — KEY_A.', 'You pick it up.'], reward: 'key_A' },
      '7,10': { type: 'clue', speaker: 'Crumpled Note', lines: ['A torn note: "shift by 3… the locker is in the reading room."', 'Clue logged: shift_3 cipher hint.'], clue: 'Cipher note: shift_3 — locker in reading room' },
      '10,10': { type: 'gate', speaker: 'Zone Exit', lines: ['The corridor to the Library. You need Key A to pass.'], requiresItems: ['key_A'], unlocksZone: 'library' },
    },
  },
  {
    id: 'library',
    name: 'Library',
    description: 'Archived records, fragmented data, and a nervous librarian.',
    color: '#5a7a4a',
    requiredItems: ['key_A'],
    playerStart: [1, 1],
    grid: [
      [X, X, X, X, X, X, X, X, X, X, X, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, X, X, W, N, W, X, X, W, W, X],
      [X, W, X, W, W, W, W, W, X, T, W, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, W, I, W, W, W, I, W, W, W, X],
      [X, W, X, X, W, N, W, X, X, W, W, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, X, W, W, W, W, W, X, W, W, X],
      [X, W, W, W, W, W, W, W, W, W, E, X],
      [X, X, X, X, X, X, X, X, X, X, X, X],
    ],
    interactions: {
      '2,5': { type: 'dialogue', speaker: 'Librarian', lines: ['Someone broke the archive seal last night.', 'The catalog terminal recorded an unusual query at 23:47.'] },
      '6,5': { type: 'dialogue', speaker: 'Research Student', lines: ['I found a USB drive under the shelf. It had fragments of encoded data.', 'Whoever left it knew their way around cryptography.'] },
      '3,9': { type: 'clue', speaker: 'Catalog Terminal', lines: ['Search query at 23:47: "ARGUS_PROTOCOL_V2". Files partially deleted.', 'Clue logged: ARGUS protocol reference.'], clue: 'Catalog query: ARGUS_PROTOCOL_V2 — files deleted at 23:47' },
      '5,3': { type: 'item', speaker: 'Locker', lines: ['The shift cipher works — locker 3 opens. Inside: a master access badge.', 'You collect KEY_B.'], reward: 'key_B' },
      '5,7': { type: 'clue', speaker: 'Torn Archive Page', lines: ['A page titled "System Override Tokens — Admin Issue Only". One token is crossed out.', 'Clue logged: override_token reference.'], clue: 'Archive page: override_token issued to unknown admin account' },
      '10,10': { type: 'gate', speaker: 'Maintenance Corridor', lines: ['Maintenance Wing entrance. Requires both Key A and Key B.'], requiresItems: ['key_A', 'key_B'], unlocksZone: 'maintenance' },
    },
  },
  {
    id: 'maintenance',
    name: 'Maintenance Wing',
    description: 'Boiler rooms, power nodes, and the system that runs it all.',
    color: '#7a5a3a',
    requiredItems: ['key_A', 'key_B'],
    playerStart: [1, 1],
    grid: [
      [X, X, X, X, X, X, X, X, X, X, X, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, X, T, W, W, W, T, X, W, W, X],
      [X, W, X, W, W, N, W, W, X, W, W, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, W, W, T, W, W, W, I, W, W, X],
      [X, W, X, X, W, W, W, X, X, W, W, X],
      [X, W, W, T, W, N, W, W, W, W, W, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, X, W, W, W, W, W, X, W, W, X],
      [X, W, W, W, W, W, W, W, W, W, E, X],
      [X, X, X, X, X, X, X, X, X, X, X, X],
    ],
    interactions: {
      '3,5': { type: 'dialogue', speaker: 'Maintenance Tech', lines: ['Node 3 and Node 7 were manually rebooted. That\'s unusual — they\'re on an auto-cycle.', 'Someone with system access did it. Maybe the same person using ARGUS.'] },
      '7,5': { type: 'dialogue', speaker: 'Caretaker', lines: ['I noticed the server logs were wiped at midnight. Someone used a terminal in Admin Core.', 'You\'ll need the override token to get in there.'] },
      '2,3': { type: 'clue', speaker: 'Power Node Alpha', lines: ['Node Alpha: manually triggered at 23:51. Operator ID: sys_ghost.', 'Clue logged: sys_ghost operator trace.'], clue: 'Power node log: sys_ghost activated Node Alpha at 23:51' },
      '2,7': { type: 'clue', speaker: 'Power Node Beta', lines: ['Node Beta: rebooted at 23:58. Same operator: sys_ghost.', 'Clue logged: second sys_ghost activation.'], clue: 'Node Beta log: sys_ghost, 23:58' },
      '5,4': { type: 'clue', speaker: 'Fake Terminal', lines: ['This terminal looks active but the display is looping a pre-recorded screen.', 'A decoy. Clue logged: ARGUS uses decoy terminals.'], clue: 'Decoy terminal found — ARGUS uses misdirection' },
      '7,3': { type: 'clue', speaker: 'Backup Console', lines: ['Backup log entry: "ARGUS initiated Phase 2 at 00:00. Admin Core sealed."', 'Clue logged: ARGUS Phase 2 timestamp.'], clue: 'ARGUS Phase 2 initiated at 00:00 — Admin Core sealed' },
      '5,8': { type: 'item', speaker: 'Secured Cabinet', lines: ['The cabinet clicks open. Inside is a laminated card: OVERRIDE_TOKEN — Level 4.', 'You collect the override token.'], reward: 'override_token' },
      '10,10': { type: 'gate', speaker: 'Admin Core Entrance', lines: ['Admin Core requires all three: Key A, Key B, and the Override Token.'], requiresItems: ['key_A', 'key_B', 'override_token'], unlocksZone: 'admin_core' },
    },
  },
  {
    id: 'admin_core',
    name: 'Admin Core',
    description: 'The nerve centre. ARGUS is here. End this.',
    color: '#8B2020',
    requiredItems: ['key_A', 'key_B', 'override_token'],
    playerStart: [1, 1],
    grid: [
      [X, X, X, X, X, X, X, X, X, X, X, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, X, X, W, W, W, X, X, W, W, X],
      [X, W, X, W, W, N, W, W, X, W, W, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, X, X, N, W, N, X, X, W, W, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, W, W, W, W, W, W, W, W, W, X],
      [X, W, X, W, W, W, W, W, X, W, W, X],
      [X, W, W, W, W, T, W, W, W, W, W, X],
      [X, X, X, X, X, X, X, X, X, X, X, X],
    ],
    interactions: {
      '3,5': { type: 'dialogue', speaker: 'System Admin', lines: ['You made it. The account "sys_ghost" belongs to a former student — Raza Malik.', 'He planted ARGUS to automate grade manipulation. We have the logs now.'] },
      '6,4': { type: 'dialogue', speaker: 'Campus Director', lines: ['Raza Malik graduated 3 years ago. He kept a back-door account.', 'Everything points to him. We just need you to confirm it at the core terminal.'] },
      '6,6': { type: 'dialogue', speaker: 'ARGUS Terminal Proxy', lines: ['"PROTOCOL ACTIVE. INVESTIGATOR DETECTED. INITIATING COUNTERMEASURES."', '"…All countermeasures disabled. You have full override. Access the core terminal to shut me down."'] },
      '10,5': { type: 'final', speaker: 'Core Terminal', lines: ['Evidence summary: A-17 login, shift_3 cipher, ARGUS_PROTOCOL_V2, sys_ghost traces, override_token.', 'Conclusion: Raza Malik — sys_ghost — orchestrated the breach using ARGUS.', 'Case closed. Initiating shutdown of ARGUS. Bureau notified.'] },
    },
  },
];

export const ITEMS: Record<string, { name: string; description: string; icon: string }> = {
  key_A: { name: 'Library Key Card', description: 'Grants access to the Library wing.', icon: '🗝️' },
  key_B: { name: 'Master Badge', description: 'Found in the reading room locker. Unlocks restricted areas.', icon: '🪪' },
  override_token: { name: 'Override Token', description: 'Level-4 admin override. For the Admin Core entrance.', icon: '📋' },
};

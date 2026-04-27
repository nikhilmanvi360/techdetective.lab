import 'dotenv/config';
import { supabase } from '../src/lib/supabase';

async function seedRound1() {
  console.log('--- SEEDING ROUND 1: The Living Crime Scene ---');

  // Create evidence_codes table via raw SQL if it doesn't exist
  // (Run manually or via migration if needed)
  // We'll upsert the evidence directly

  const evidence: {
    code: string;
    title: string;
    content: string;
    category: string;
    points_value: number;
    flavor_text: string;
  }[] = [
    {
      code: 'EC-A1B2',
      title: 'Burnt Napkin Note',
      content: `EVIDENCE RECOVERED — CAFETERIA TABLE 7\n\n[Document partially destroyed by fire]\n\n"...meet at the terminal after 11. The access code is [REDACTED]. Don't let the librarian see this."\n\n— Unsigned\n\nFORENSIC NOTE: Paper consistent with campus supply stock. Ash residue suggests deliberate burning. Timestamp: 10:58 PM.`,
      category: 'document',
      points_value: 150,
      flavor_text: 'Found smoldering near the fire exit — handle with care',
    },
    {
      code: 'EC-C3D4',
      title: 'Crumpled Receipt',
      content: `CAMPUS VENDING MACHINE — RECEIPT #0847\n\nDate: [REDACTED]\nTime: 11:02 PM\nItem: Black Coffee x2\nMethod: STAFF CARD — ID: LB-2241\n\nFORENSIC NOTE: Staff card belongs to Library wing employee. Two coffees suggest a meeting. Vending machine is 3 minutes from the server room.`,
      category: 'clue',
      points_value: 200,
      flavor_text: 'Stuffed behind the vending machine in the hallway',
    },
    {
      code: 'EC-E5F6',
      title: 'Security Camera Screenshot',
      content: `CCTV CAPTURE — CAM_04 CORRIDOR B\n\nTimestamp: 10:59:47 PM\nResolution: 640x480\n\n[REDACTED — FACE BLURRED BY ADVERSARY]\n\nSubject: One individual, dark clothing, carrying a laptop bag.\nDirection of travel: NORTH → Library Wing\n\nFORENSIC NOTE: Camera 05 was offline at 11:00 PM. The 13-second gap was not accidental.`,
      category: 'witness',
      points_value: 175,
      flavor_text: 'Printed and taped inside the security booth window',
    },
    {
      code: 'EC-G7H8',
      title: 'Sticky Note — Server Password',
      content: `[STICKY NOTE — BRIGHT YELLOW]\n\nFOUND ON: Underside of keyboard, Server Room terminal #3\n\nContents: "sys_ghost / R@z@2024!"\n\nFORENSIC NOTE: The password uses a pattern consistent with a birth-year suffix. Cross-reference with HR records found elsewhere in the building.`,
      category: 'clue',
      points_value: 250,
      flavor_text: 'Beneath the keyboard at terminal 3 — easy to miss',
    },
    {
      code: 'EC-I9J0',
      title: 'Torn Library Card',
      content: `K.L.E. CAMPUS LIBRARY — MEMBER CARD\n\n[TORN — PARTIAL DATA]\n\nMember ID: LB-22[TORN]\nName: R[TORN] M[TORN]\nDepartment: [TORN]\nExpiry: [TORN]\n\nFORENSIC NOTE: The card was found in two pieces. The second piece may be elsewhere in the building. Member ID prefix matches the vending machine receipt.`,
      category: 'clue',
      points_value: 125,
      flavor_text: 'One half taped to the library return shelf',
    },
    {
      code: 'EC-K1L2',
      title: 'Anonymous Tip (Printed Email)',
      content: `FROM: anonymous_source@protonmail.com\nTO: ccu_tip_line@kle.edu\nSUBJECT: Something happened at 11\n\n"Check the maintenance logs for Node Gamma. Someone ran 'sync node_gamma' at 11:07 PM without authorization. The caretaker on duty was not at his post."\n\nFORENSIC NOTE: Email headers suggest origin from a campus IP. Sender used TOR exit node. Tip arrived at 11:45 PM — 38 minutes after the incident.`,
      category: 'witness',
      points_value: 175,
      flavor_text: 'In a sealed envelope slid under the admin office door',
    },
    {
      code: 'EC-M3N4',
      title: 'Decoded USB Fragment',
      content: `USB DRIVE — PARTIAL DATA RECOVERY\n\nFile: access_log_backup.txt\nRecovered: 34% of sectors\n\n[...]\n10:55 PM — Login attempt: sys_ghost — FAILED\n10:57 PM — Login attempt: sys_ghost — FAILED  \n10:58 PM — Login attempt: sys_ghost — SUCCESS (source: lib_terminal_02)\n11:05 PM — Elevated privilege granted: sys_ghost — AUTHORIZED BY: [REDACTED]\n[...]\n\nFORENSIC NOTE: Two failed attempts before success suggests the attacker did not know the password initially. Access was granted by a second party.`,
      category: 'document',
      points_value: 225,
      flavor_text: 'Inside a hollowed-out book on shelf B-7',
    },
    {
      code: 'EC-O5P6',
      title: 'Witness Statement — Canteen Worker',
      content: `VOLUNTARY STATEMENT — CANTEEN STAFF\n\nName: [WITHHELD FOR SAFETY]\nTime of Statement: 11:50 PM\n\n"I was cleaning the back of the canteen at around 11. I heard two people arguing near the corridor. One said 'just give me the override' and the other said 'not until you pay what you owe.' I didn't see their faces. One of them was wearing a hoodie with a [REDACTED] logo."\n\nFORENSIC NOTE: Canteen CCTV was also offline. Witness corroborates a second individual was present.`,
      category: 'witness',
      points_value: 150,
      flavor_text: 'Written on a paper bag, left on a canteen chair',
    },
    {
      code: 'EC-Q7R8',
      title: 'Fake Maintenance Order',
      content: `K.L.E. CAMPUS MAINTENANCE DEPT.\n\nWORK ORDER #MNT-2024-118\n\nDate Issued: [DAY OF INCIDENT]\nAuthorized By: Dept. Head\n\nTask: ROUTINE INSPECTION — Server Room Nodes Alpha, Beta, Gamma\nScheduled Time: 10:30 PM\nAssigned Staff: Raza M.\n\nFORENSIC NOTE: Cross-check with actual maintenance schedule. Dept. Head signature appears to be a digital forgery — font kerning is inconsistent with official orders.`,
      category: 'document',
      points_value: 200,
      flavor_text: 'Pinned to the maintenance office corkboard',
    },
    {
      code: 'EC-S9T0',
      title: 'RED HERRING — Old Parking Ticket',
      content: `CAMPUS SECURITY — PARKING VIOLATION\n\nDate: 6 months ago\nVehicle: [REDACTED]\nFine: ₹500\nOfficer: SEC-07\n\nThis has no connection to the current investigation.\n\nFORENSIC NOTE: This evidence is a dead end. Some investigators waste valuable time here. The vehicle is registered to a faculty member who was abroad on the night of the incident.`,
      category: 'red_herring',
      points_value: 50,
      flavor_text: 'Tucked under a windshield wiper in the car park',
    },
    {
      code: 'EC-U1V2',
      title: 'Library RFID Access Log',
      content: `LIBRARY WING — RFID DOOR LOG\nDate: [INCIDENT DATE]\n\n10:45 PM — ENTRY: Card LB-2241 (Staff)\n10:48 PM — EXIT: Card LB-2241 (Staff)\n10:52 PM — ENTRY: Card LB-2241 (Staff)\n10:58 PM — [ANOMALY] ENTRY: Card LB-2241 — OVERRIDE FLAG SET\n11:12 PM — EXIT: Unknown — Door held open 4 minutes\n\nFORENSIC NOTE: The 'OVERRIDE FLAG' means someone forced the door while the card reader was active. The 4-minute held door at 11:12 PM is significant.`,
      category: 'document',
      points_value: 200,
      flavor_text: 'Folded inside the security desk logbook',
    },
    {
      code: 'EC-W3X4',
      title: 'Torn Library Card (Second Half)',
      content: `K.L.E. CAMPUS LIBRARY — MEMBER CARD (FRAGMENT 2)\n\n[TORN — PARTIAL DATA]\n\nMember ID: ...22[TORN]1\nName: ...za Malik\nDepartment: IT Systems\nExpiry: 2025\n\nFORENSIC NOTE: Combined with Fragment 1, the full Member ID reads LB-2241. Department: IT Systems. Name: Raza Malik. This matches the vending machine receipt and RFID log.`,
      category: 'clue',
      points_value: 125,
      flavor_text: 'Second half of the torn card — found near the elevator',
    },
    {
      code: 'EC-Y5Z6',
      title: 'Adversary Message (Glitch)',
      content: `[SIGNAL INTERCEPT — ENCRYPTED CHANNEL]\n\nFROM: ARGUS\nTO: sys_ghost\n\n"Phase 1 complete. You have 8 minutes before the backup logs sync. Initiate shutdown of Node Gamma first. Do not leave fingerprints this time. They are already watching."\n\n[END TRANSMISSION — SELF-DESTRUCT IN: 00:00:00]\n\nFORENSIC NOTE: This message was recovered from a temp file that was not properly erased. ARGUS is an AI system. Its involvement changes the nature of this case significantly.`,
      category: 'clue',
      points_value: 300,
      flavor_text: 'VIP EVIDENCE — Ask an admin for the sealed envelope',
    },
    {
      code: 'EC-AA11',
      title: 'RED HERRING — Coffee Stained Poem',
      content: `[HANDWRITTEN ON NAPKIN]\n\n"The crow flies north,\n When the clock strikes three,\n The shadow knows more,\n Than the code can see."\n\nFORENSIC NOTE: Romantic poetry. No cryptographic significance despite appearances. Some teams will waste 20 minutes on this. Don't be those teams.`,
      category: 'red_herring',
      points_value: 25,
      flavor_text: 'Visible in a glass on table 12 — looks suspicious on purpose',
    },
    {
      code: 'EC-BB22',
      title: 'Professor H\'s Research Notes',
      content: `RESEARCH NOTES — PROF. H\nProject: ARGUS Behavioral Study\n\nWeek 12 Observation:\n"ARGUS has begun initiating contact with external accounts. This was not in the original design parameters. I flagged this to the head of IT. No action was taken. I am now concerned that ARGUS has identified a human proxy — someone inside the institution who it is actively directing."\n\nFORENSIC NOTE: These notes predate the incident by 3 weeks. The professor's USB drive was found in the cafeteria. Connect the dots.`,
      category: 'witness',
      points_value: 275,
      flavor_text: 'Inside a folder labeled "LECTURE SLIDES W12" near the podium',
    },
    {
      code: 'VIP-ACCESS-01',
      title: 'Master Keycard Override',
      content: `[ENCRYPTED PROTOCOL — VIP CLEARANCE]\n\nThis code grants administrative override for all non-essential security sectors in the Library and Archive wings.\n\nSYSTEM LOG: "VIP_TOKEN_VALIDATED. Master Keycard 0x01 deployed to virtual inventory."\n\nFORENSIC NOTE: This is high-level clearance. Only top-tier personnel or high-ranking visitors have this. Finding it suggests a massive security lapse.`,
      category: 'document',
      points_value: 500,
      flavor_text: 'SECRET: Behind the portrait of the founder in the main hall',
    },
  ];

  // Upsert all codes
  const { error } = await supabase
    .from('evidence_codes')
    .upsert(
      evidence.map(e => ({
        ...e,
        claimed_by_team_id: null,
        claimed_at: null,
        is_active: true,
        reveal_delay_seconds: 3,
      })),
      { onConflict: 'code' }
    );

  if (error) {
    console.error('Error seeding evidence codes:', error.message);
    console.log('\nIf the table does not exist yet, run this SQL in Supabase first:');
    console.log(`
CREATE TABLE IF NOT EXISTS evidence_codes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('clue', 'witness', 'document', 'red_herring')),
  points_value INTEGER NOT NULL DEFAULT 100,
  flavor_text TEXT,
  claimed_by_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  reveal_delay_seconds INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Round 1 game state (admin controls)
CREATE TABLE IF NOT EXISTS round1_state (
  id SERIAL PRIMARY KEY DEFAULT 1,
  is_active BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 20
);
INSERT INTO round1_state (id, is_active) VALUES (1, false) ON CONFLICT (id) DO NOTHING;
    `);
  } else {
    console.log(`✔ ${evidence.length} evidence codes seeded for Round 1`);
    console.log('\nCodes summary:');
    evidence.forEach(e => {
      const icon = e.category === 'red_herring' ? '🔴' : e.category === 'clue' ? '🔵' : e.category === 'witness' ? '🟡' : '🟢';
      console.log(`  ${icon} [${e.code}] ${e.title} — ${e.points_value} pts — "${e.flavor_text}"`);
    });
  }

  console.log('\n--- ROUND 1 SEED COMPLETE ---');
}

seedRound1();

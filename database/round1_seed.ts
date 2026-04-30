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
      title: 'AUDIT Discrepancy Flag',
      content: `AUDIT :: BACKUP INTEGRITY LOG\n\nDiscrepancy detected between submitted_report_v_final.pdf and raw_simulation_archive_batch_001-to-089.\n\nSubmitted report references: 12 vulnerability tests\nRaw archive contains: 4,247 simulation runs\n\nNote: consultant was not informed of redundant backup system. Standard protocol since 2019. This discrepancy has never occurred before.\n\n— AUDIT`,
      category: 'document',
      points_value: 150,
      flavor_text: 'The initial trigger for the investigation',
    },
    {
      code: 'EC-C3D4',
      title: 'Simulation Category Breakdown',
      content: `AUDIT RAW ARCHIVE — SIMULATION BREAKDOWN\n\nGuard rotation timing — shift gaps: 847\nVault access window — minimum staff: 1,203\nCamera coverage — blind spot geometry: 634\nCash volume by time of day: 412\nExternal exit route — alarm response: 891\nOther (matches report): 260\n\nTotal runs: 4,247\n\nFORENSIC NOTE: 94% of the runs do not map to the vulnerabilities submitted in the final report.`,
      category: 'clue',
      points_value: 200,
      flavor_text: 'Found during the initial log review (EV-01)',
    },
    {
      code: 'EC-E5F6',
      title: 'Badge Entry Log',
      content: `MERIDIAN BANK — LOBBY ACCESS LOG\n\nDate: [REDACTED]\nTime: 03:00 AM\nName: Karan Sehgal\nRole: Consultant (Security Audit)\n\nFORENSIC NOTE: Entry occurred outside normal business hours. Corroborates creation time of the anomalous simulation batch.`,
      category: 'witness',
      points_value: 175,
      flavor_text: 'Recovered from the Lobby security desk',
    },
    {
      code: 'EC-G7H8',
      title: 'LIVE_RUN_PARAMS File Header',
      content: `SIMULATION: LIVE_RUN_PARAMS\nCreated: [6 weeks ago, 3:04 AM]\nAuthor session: k.sehgal@meridian-consult\n\nFORENSIC NOTE: This file header uses a completely different naming convention from the 4,246 other runs (which are tagged TEST_CONFIG). Found in batch 087, run 31. (EV-02)`,
      category: 'clue',
      points_value: 250,
      flavor_text: 'The needle in the haystack of 89 batch folders',
    },
    {
      code: 'EC-I9J0',
      title: 'Cash Vault Estimate',
      content: `LIVE_RUN_PARAMS :: PARAMETER EXTRACT\n\nVariable: Target_Asset_Value\nValue: ₹4,20,00,000\nCondition: Tuesday, end-of-day estimate\n\nFORENSIC NOTE: This is not abstract testing data. It is a highly accurate prediction of the vault's physical contents for a specific day of the week.`,
      category: 'clue',
      points_value: 125,
      flavor_text: 'Extracted from the anomalous simulation file',
    },
    {
      code: 'EC-K1L2',
      title: 'Camera Blind Spot Confirmation',
      content: `LIVE_RUN_PARAMS :: PARAMETER EXTRACT\n\nVariable: Camera_Blind_Window\nValue: 02:14–02:18 AM\nNotes: Confirmed across 634 iterations. Coverage gap achieved.\n\nFORENSIC NOTE: Relates directly to the 634 simulations run for 'blind spot geometry'.`,
      category: 'witness',
      points_value: 175,
      flavor_text: 'A critical vulnerability that was NOT in the final report',
    },
    {
      code: 'EC-M3N4',
      title: 'Guard Shift Change Log',
      content: `MERIDIAN BANK — SECURITY ROSTER\n\n02:00 AM — Shift B ends\n02:15 AM — Shift C begins\n\nFORENSIC NOTE: There is an 11-minute overlap gap where coverage is minimal. This perfectly aligns with the simulation parameters targeting a 02:14 AM blind window.`,
      category: 'document',
      points_value: 225,
      flavor_text: 'Cross-referenced with the bank\'s HR system',
    },
    {
      code: 'EC-O5P6',
      title: 'Consultant Credential Log',
      content: `MERIDIAN BANK — IT ACCESS PROVISIONING\n\nUser: k.sehgal\nAccess Window: 6 weeks\nAuthorised Systems: AUDIT simulation environment\nClearance Level: L4\n\nFORENSIC NOTE: The bank authorized this access. Sehgal was operating with legitimate credentials during the entire 6-week period.`,
      category: 'witness',
      points_value: 150,
      flavor_text: 'The authorization that made this possible',
    },
    {
      code: 'EC-Q7R8',
      title: 'Exit Route Timing',
      content: `LIVE_RUN_PARAMS :: PARAMETER EXTRACT\n\nVariable: Exit_Route\nValue: East loading bay\nTime: 4 min 12 sec to perimeter\n\nFORENSIC NOTE: The simulation optimized the exit route to ensure the subjects could leave the premises before the 4-minute camera blind spot closed.`,
      category: 'document',
      points_value: 200,
      flavor_text: 'Extracted from the anomalous simulation file',
    },
    {
      code: 'EC-S9T0',
      title: 'RED HERRING — AUDIT Maintenance Report v2.1',
      content: `MERIDIAN BANK — AUDIT SYSTEM STATUS\n\nStatus: Normal\nUptime: 99.98%\nKnown Issues: Occasional lag in parsing complex queries.\n\nFORENSIC NOTE: A routine system health check. Has absolutely nothing to do with the discrepancy flag.`,
      category: 'red_herring',
      points_value: 50,
      flavor_text: 'Looks official, means nothing',
    },
    {
      code: 'EC-U1V2',
      title: 'Execution Date Parameter',
      content: `LIVE_RUN_PARAMS :: PARAMETER EXTRACT\n\nVariable: Execution_Date\nValue: [3 weeks from tonight]\n\nFORENSIC NOTE: This simulation was not a historical test. It was planning a future event.`,
      category: 'document',
      points_value: 200,
      flavor_text: 'The most alarming piece of evidence',
    },
    {
      code: 'EC-W3X4',
      title: 'Staff Roster Fragment',
      content: `LIVE_RUN_PARAMS :: PARAMETER EXTRACT\n\nVariable: Staff_On_Duty\nValue: [Real names from Meridian's current roster]\n\nFORENSIC NOTE: Standard penetration tests use anonymized or synthetic data. This simulation used real employee names assigned to the target date.`,
      category: 'clue',
      points_value: 125,
      flavor_text: 'Found within the simulation parameters',
    },
    {
      code: 'EC-Y5Z6',
      title: '91.4% Success Probability Output',
      content: `LIVE_RUN_PARAMS :: FINAL OUTPUT\n\nSimulation outcome: SUCCESS PROBABILITY 91.4%\n\nFORENSIC NOTE: A consultant testing a system wants to find vulnerabilities to patch them. This metric evaluates the likelihood of successfully executing the simulated parameters (the robbery).`,
      category: 'clue',
      points_value: 300,
      flavor_text: 'VIP EVIDENCE — The smoking gun',
    },
    {
      code: 'EC-AA11',
      title: 'RED HERRING — Board Sign-off Document',
      content: `MERIDIAN BANK — BOARD RESOLUTION\n\n"The Board acknowledges receipt of the Penetration Assessment Report by MeridianConsult. All 12 identified vulnerabilities have been successfully patched. Systems are secure."\n\nFORENSIC NOTE: The board was fooled by the clean report. This document proves nothing other than their ignorance of the raw logs.`,
      category: 'red_herring',
      points_value: 25,
      flavor_text: 'A clean bill of health that was a lie',
    },
    {
      code: 'EC-BB22',
      title: 'Junior Analyst Statement',
      content: `VOLUNTARY STATEMENT — COMPLIANCE ARCHIVE\n\n"I indexed the batch folders last month. Most files are tagged TEST_CONFIG. It's routine. I did see one tagged differently... Batch 087, I think. I didn't think much of it at the time, just thought it was a typo."\n\nFORENSIC NOTE: Corroborates the location of the anomalous file.`,
      category: 'witness',
      points_value: 275,
      flavor_text: 'Taken from the archivist in the Compliance Wing',
    },
    {
      code: 'VIP-ACCESS-01',
      title: 'Sehgal\'s Final Report',
      content: `PENETRATION ASSESSMENT REPORT\n\nConsultant: Karan Sehgal\nDuration: 6 weeks\nVulnerabilities Found: 12\nStatus: All patched. Board signed off.\n\nFORENSIC NOTE: The report is clean. It's too clean. It only accounts for 260 of the 4,247 simulations run. It is a carefully crafted cover story.`,
      category: 'document',
      points_value: 500,
      flavor_text: 'SECRET: The document that started it all',
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

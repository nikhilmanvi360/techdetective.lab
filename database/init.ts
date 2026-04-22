import { supabase } from '../src/lib/supabase';
import bcrypt from 'bcryptjs';

const INITIAL_TEAMS = [
  {
    name: 'CCU_ADMIN',
    password: 'password123',
    role: 'admin',
    score: 0,
  }
];

async function seed() {
  console.log('--- SEEDING SUPABASE DATABASE (EXPANSION PACK 1) ---');

  // 1. Seed default team (admin/admin)
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  const { error: teamError } = await supabase
    .from('teams')
    .upsert({ name: 'CCU_ADMIN', password: hashedPassword }, { onConflict: 'name' });
  
  if (teamError) console.error('Error seeding teams:', teamError.message);
  else console.log('✔ Teams seeded');

  // 2. Seed cases (1-7)
  const cases = [
    { id: 1, title: 'The Phantom Leak', description: 'A sensitive user database from a fintech startup was leaked on a dark web forum. Trace the digital breadcrumbs and find the culprit.', difficulty: 'Intermediate', correct_attacker: 'Shadow', points_on_solve: 150, status: 'active' },
    { id: 2, title: 'The Exam Portal Breach', description: 'The KLE Exam Portal was hacked and papers leaked online. Identify the attacker among Neha, Rahul, and Arjun.', difficulty: 'Hard', correct_attacker: 'Neha', points_on_solve: 250, status: 'active' },
    { id: 3, title: 'Operation Phantom Proxy', description: 'The attendance system has been compromised. Digital signatures suggest a frame job.', difficulty: 'Hard', correct_attacker: 'Priya', points_on_solve: 300, status: 'active' },
    { id: 4, title: 'The Junior Dev Blunder', description: 'Debug files leaked tokens. Find the hidden data Manoj left behind.', difficulty: 'Easy', correct_attacker: 'Junior_Dev_Manoj', points_on_solve: 100, status: 'active' },
    { id: 5, title: 'The Zero-Day Syndicate', description: 'Expert level ransom attack. Collaborate to find the inside man in the Fortune 500 hospital.', difficulty: 'Expert', correct_attacker: 'Dr. Jonathan Crane', points_on_solve: 500, status: 'active' },
    { id: 6, title: 'The Ghost in the Exchange', description: 'Micro-pennies are vanishing from the Central City Exchange. Trace the financial ghost and the disgraced analyst behind the algorithm.', difficulty: 'Expert', correct_attacker: 'Silver_Fox', points_on_solve: 450, status: 'active' },
    { id: 7, title: 'Operation Shadow Canvas', description: 'A multi-million dollar NFT was stolen from a private gallery. Find the rival curator who exploited the smart contract logic.', difficulty: 'Intermediate', correct_attacker: 'The_Curator', points_on_solve: 200, status: 'active' }
  ];

  const { error: casesError } = await supabase.from('cases').upsert(cases);
  if (casesError) console.error('Error seeding cases:', casesError.message);
  else console.log('✔ Cases seeded (7 total)');

  // 3. Seed puzzles
  const puzzles = [
    // Case 1
    { id: 1, case_id: 1, question: 'What is the IP address of the attacker?', answer: '192.168.1.45', points: 20 },
    { id: 2, case_id: 1, question: 'What is the admin password hidden in the source code?', answer: 'p@ssw0rd123', points: 30 },
    { id: 3, case_id: 1, question: 'What username did the attacker use?', answer: 'dev_admin', points: 20 },
    // Case 2
    { id: 4, case_id: 2, question: 'What is the hidden CSRF token in the admin source?', answer: 'admin_bypass_99', points: 20 },
    { id: 5, case_id: 2, question: 'What is the Daily PIN (calculate from keygen.c)?', answer: '100', points: 40 },
    { id: 6, case_id: 2, question: 'Who was physically present in the lab at 21:41?', answer: 'Neha', points: 60 },
    // Case 3
    { id: 13, case_id: 3, question: 'What hidden API endpoint was used for override?', answer: '/api/v1/attendance_override', points: 20 },
    { id: 14, case_id: 3, question: 'What HTTP Header was used to spoof the IP?', answer: 'X-Forwarded-For', points: 40 },
    // Case 4
    { id: 20, case_id: 4, question: 'What is the internal dev code?', answer: 'DEV_HTM_2026', points: 50 },
    // Case 5
    { id: 24, case_id: 5, question: 'Which destination port was targeted at 03:14 AM?', answer: '445', points: 50 },
    { id: 25, case_id: 5, question: 'What was the XOR key found in init_c2_comms?', answer: '0xDEADBEEF', points: 150, depends_on_puzzle_id: 24 },
    // Case 6 - FINANCIAL GHOST
    { id: 30, case_id: 6, question: 'What is the abnormal HFT order port identified in the Exchange Logs?', answer: '8888', points: 50, hint: 'Check the "Exchange Traffic Log" for high-volume frequency on an unusual port.' },
    { id: 31, case_id: 6, question: 'Decode the obfuscated trade volume found in "ghost_alg.py". (Hex to Dec)', answer: '4096', points: 100, hint: 'The variable "v_buf" is 0x1000 in hex.', depends_on_puzzle_id: 30 },
    { id: 32, case_id: 6, question: 'Find the "Silver_Fox" employee ID in the HR records matching the origin IP 10.5.5.9.', answer: 'EMP-9822', points: 150, hint: 'Cross-reference the "Terminal Access List" with the "Staff Directory".', depends_on_puzzle_id: 31 },
    // Case 7 - SHADOW CANVAS
    { id: 33, case_id: 7, question: 'Identify the "Exploiter Address" from the "Gallery Transaction Log".', answer: '0x71C...a9E1', points: 40, hint: 'Look for the contract call with status "VULN_SUCCESS".' },
    { id: 34, case_id: 7, question: 'What is the hidden EXIF metadata value "Curator_Note" in the stolen art file?', answer: 'Final_Bidding_War', points: 60, hint: 'Use "strings" or "exiftool" logic on the Art Metadata file.' },
    { id: 35, case_id: 7, question: 'The stolen NFT was sent to a wallet named after a constellation. Which one?', answer: 'Orion', points: 80, hint: 'Read the "Intercepted DM" between the Curator and the buyer.' }
  ];

  const { error: puzzlesError } = await supabase.from('puzzles').upsert(puzzles);
  if (puzzlesError) console.error('Error seeding puzzles:', puzzlesError.message);
  else console.log('✔ Puzzles seeded');

  // 4. Seed evidence
  const evidence = [
    // Case 6 - THE GHOST IN THE EXCHANGE
    { id: 27, case_id: 6, type: 'log', title: 'Exchange Traffic Log', content: '[HFT-CORE] ALERT: High frequency burst detected.\n[HFT-CORE] PORT: 8888\n[HFT-CORE] SRC: 10.5.5.9 [Internal Terminal]\n[HFT-CORE] VOL: 0x1000 shares/ms\n[HFT-CORE] STATUS: LOGGING_DISABLED', metadata: { server: 'CC-EXCH-01', region: 'Central' }, required_puzzle_id: null },
    { id: 28, case_id: 6, type: 'code', title: 'Decompiled Algorithm (ghost_alg.py)', content: '# Fragment of suspicious siphoning script\ndef execute_trade(vol):\n    v_buf = 0x1000\n    if vol >= v_buf:\n        siphon_micros(vol - v_buf)\n\n# Trace shows origin terminal: 10.5.5.9', metadata: { language: 'python', owner: 'unknown' }, required_puzzle_id: 30 },
    { id: 29, case_id: 6, type: 'log', title: 'Staff Terminal Directory', content: '10.5.5.1  Reception\n10.5.5.9  Quant_Lab_Terminal_03 [ID: EMP-9822]\n10.5.5.12 Server_Admin', metadata: { source: 'HR-Security' }, required_puzzle_id: 31 },
    // Case 7 - OPERATION SHADOW CANVAS
    { id: 30, case_id: 7, type: 'log', title: 'Gallery Transaction Log', content: '[TX-998] MINT NFT #221 -> Success\n[TX-999] CALL CONTRACT "GalleryCore" from 0x71C...a9E1 -> VULN_SUCCESS\n[TX-1000] TRANSFER NFT #221 to 0x71C...a9E1', metadata: { contract: '0xGallery', chain: 'Ethereum' }, required_puzzle_id: null },
    { id: 31, case_id: 7, type: 'log', title: 'Art Object Metadata (EXIF)', content: 'Filename: The_Eternal_Void.webp\nDimensions: 4096x4096\nArtist: Neural_Zen\nCurator_Note: Final_Bidding_War\nHash: 0x98f9...2', metadata: { filetype: 'webp' }, required_puzzle_id: 33 },
    { id: 32, case_id: 7, type: 'chat', title: 'Intercepted DM', content: 'The_Curator: The contract is live. Use the "Orion" wallet for the final transfer.\nBuyer: Are you sure they won\'t trace it?\nThe_Curator: Their security is a joke. They still use the v1 bidding logic.', metadata: { source: 'Signal' }, required_puzzle_id: 34 }
  ];

  const { error: evidenceError } = await supabase.from('evidence').upsert(evidence);
  if (evidenceError) console.error('Error seeding evidence:', evidenceError.message);
  else console.log('✔ Evidence seeded');

  // 5. Seed adversary config
  await supabase.from('adversary_config').upsert({ is_active: false, intensity: 'low', lead_threshold: 200, actions_enabled: ['signal_interference', 'guidance_hint'] });
  
  console.log('--- SEEDING COMPLETE ---');
}

seed();

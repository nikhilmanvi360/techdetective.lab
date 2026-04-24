import { supabase } from '../src/lib/supabase';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('--- SEEDING: TECH DETECTIVE — NETWORK WALKER EDITION ---');

  // 1. Admin account
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  const { error: teamError } = await supabase
    .from('teams')
    .upsert({ name: 'CCU_ADMIN', password: hashedPassword }, { onConflict: 'name' });
  if (teamError) console.error('Error seeding teams:', teamError.message);
  else console.log('✔ Admin account ready');

  // 2. Wipe old cases/puzzles/evidence
  await supabase.from('evidence').delete().neq('id', 0);
  await supabase.from('puzzles').delete().neq('id', 0);
  await supabase.from('cases').delete().neq('id', 0);
  console.log('✔ Old cases cleared');

  // =====================================================================
  // 3. SECURE SPATIAL MISSIONS
  // =====================================================================

  const missions = [
    {
      id: 1,
      title: 'The Midnight Informant',
      difficulty: 'Easy',
      correct_attacker: '8080',
      points_on_solve: 125,
      status: 'active',
      description: JSON.stringify({
        summary: 'A contact at the docks has left a secure drop. Decrypt the port number.',
        brief: "We received an encrypted telegram. A contact at the docks has left a secure drop for us. Write a Python script to decode the base64 string to find the correct port number.",
        network_topology: null,
        available_functions: ['import base64', 'base64.b64decode()', 'print()'],
        expected_output: 'Decoded Port: 8080',
        starter_code: `# MISSION 1: The Midnight Informant
import base64

encrypted_message = "ODA4MA=="

# Step 1: Decode the base64 message
# Hint: use base64.b64decode()

# Step 2: Print the decoded port
# Example: print(f"Decoded Port: {port}")
`,
        hints: [
          'You need to decode the string using base64.b64decode()',
          'Make sure you decode it to a UTF-8 string before printing.',
          'The expected output format is EXACTLY: Decoded Port: 8080'
        ],
        piston_language: 'python'
      })
    },
    {
      id: 2,
      title: 'The Speakeasy Ledger',
      difficulty: 'Easy',
      correct_attacker: '1700',
      points_on_solve: 150,
      status: 'active',
      description: JSON.stringify({
        summary: 'A hidden server at the Speakeasy holds a ledger of illicit transactions. Calculate the total sum.',
        brief: "A raid on the 'Blind Tiger' speakeasy yielded a partial ledger of illicit transactions mixed with corrupted data. Write a Python script to extract and sum the valid transaction amounts.",
        network_topology: null,
        available_functions: ['for loops', 'isinstance()', 'type()', 'print()'],
        expected_output: 'Total illicit transactions: 1700',
        starter_code: `# MISSION 2: The Speakeasy Ledger
ledger_entries = [1050, "garbage_data", 200, None, 450]
total = 0

# Step 1: Loop through the entries and sum the numbers
# Hint: check if the type of the entry is int

# Step 2: Print the total
# Example: print(f"Total illicit transactions: {total}")
`,
        hints: [
          'Use a for loop to iterate over ledger_entries.',
          'Use isinstance(entry, int) to ignore strings and None.',
          'The expected output format is EXACTLY: Total illicit transactions: 1700'
        ],
        piston_language: 'python'
      })
    },
    {
      id: 3,
      title: 'The Syndicate\'s Vault',
      difficulty: 'Intermediate',
      correct_attacker: 'ARCHITECT-KEY-99',
      points_on_solve: 200,
      status: 'active',
      description: JSON.stringify({
        summary: 'The crime boss "The Architect" has hidden the master key in a list. Find the key.',
        brief: "The crime boss 'The Architect' has a secured database storing the master key. We intercepted a data dump containing possible keys. The real key starts with 'ARCHITECT'. Write a Python script to find and print it.",
        network_topology: null,
        available_functions: ['for loops', 'startswith()', 'print()'],
        expected_output: 'Master Key: ARCHITECT-KEY-99',
        starter_code: `# MISSION 3: The Syndicate's Vault
data_dump = [
    "DECOY-KEY-01",
    "FAKE-KEY-88",
    "ARCHITECT-KEY-99",
    "INVALID-KEY-44"
]

# Step 1: Find the key that starts with 'ARCHITECT'

# Step 2: Print the master key
# Example: print(f"Master Key: {found_key}")
`,
        hints: [
          'Use a for loop to check each key in data_dump.',
          'Use the string method .startswith("ARCHITECT") to identify the real key.',
          'The expected output format is EXACTLY: Master Key: ARCHITECT-KEY-99'
        ],
        piston_language: 'python'
      })
    }
  ];

  const { error: missionsError } = await supabase.from('cases').upsert(missions);
  if (missionsError) console.error('Error seeding missions:', missionsError.message);
  else console.log(`✔ ${missions.length} missions seeded`);

  // Adversary config
  await supabase
    .from('adversary_config')
    .upsert({ is_active: false, intensity: 'low', lead_threshold: 200, actions_enabled: ['signal_interference', 'guidance_hint'] });

  console.log('--- SEEDING COMPLETE — Tech Detective: Network Walker ---');
}

seed();

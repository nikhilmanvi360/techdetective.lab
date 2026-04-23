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
      title: 'The Gateway',
      difficulty: 'Easy',
      correct_attacker: '22,80,666',
      points_on_solve: 125,
      status: 'active',
      description: JSON.stringify({
        summary: 'We suspect the main router has a compromised port. Scan the node and find the open ports.',
        brief: "The main router (192.168.1.1) is acting suspiciously. We need to know what ports are open. Connect to it, scan it, and print the open ports.",
        network_topology: {
          start_node: '192.168.1.1',
          network: [
            { id: '192.168.1.1', type: 'router', ports: [22, 80, 666], files: {}, connections: [] }
          ]
        },
        available_functions: ['get_current_node()', 'scan_target()', 'print(value)'],
        expected_output: 'Open ports are: 22,80,666',
        starter_code: `// MISSION 1: The Gateway
// Scan the current node and print the open ports.

let ip = get_current_node();
print("Scanning: " + ip);

// Step 1: Scan the target
let result = scan_target();

// Step 2: Print the ports correctly
print("Open ports are: " + result.ports);
`,
        hints: [
          'Use scan_target() and save it to a variable.',
          'Access the ports using .ports on the result.',
          'Print the exact string expected.'
        ]
      })
    },
    {
      id: 2,
      title: 'The Malicious Payload',
      difficulty: 'Easy',
      correct_attacker: 'echo "hacked"',
      points_on_solve: 150,
      status: 'active',
      description: JSON.stringify({
        summary: 'The web server (10.0.0.5) is hosting a malicious payload file. Find it and extract it.',
        brief: "A web server connected to our router has been compromised. Connect to it, find the malicious payload file, download it, and print its content.",
        network_topology: {
          start_node: '192.168.1.1',
          network: [
            { id: '192.168.1.1', type: 'router', ports: [22], files: {}, connections: ['10.0.0.5'] },
            { id: '10.0.0.5', type: 'server', ports: [80, 443], files: { 'payload.sh': 'echo "hacked"' }, connections: ['192.168.1.1'] }
          ]
        },
        available_functions: ['get_connected_nodes()', 'connect_to(ip)', 'scan_target()', 'download_file(filename)', 'print(value)'],
        expected_output: 'Payload Content: echo "hacked"',
        starter_code: `// MISSION 2: The Malicious Payload
// Connect to the web server, find the file, and download it.

// Check where we can go
let ips = get_connected_nodes();
print("Connected IPs: " + ips);

// Step 1: Connect to the server
connect_to('10.0.0.5');

// Step 2: Scan to see what files are there
let scan_result = scan_target();
print("Files found: " + scan_result.files);

// Step 3: Download and print the payload
let payload_content = download_file("payload.sh");
print("Payload Content: " + payload_content);
`,
        hints: [
          'Make sure you connect to the server first.',
          'Check the filename exactly as it appears in the scan results.',
        ]
      })
    },
    {
      id: 3,
      title: 'Database Breach',
      difficulty: 'Intermediate',
      correct_attacker: 'admin123',
      points_on_solve: 200,
      status: 'active',
      description: JSON.stringify({
        summary: 'Hop through the network to the database and retrieve the stolen password.',
        brief: "The attacker left a backdoor in the database server (10.0.0.99), but it's only accessible from the Web Server (10.0.0.5). Hop to the Web Server, then to the Database, and print the content of 'password.txt'.",
        network_topology: {
          start_node: '192.168.1.1',
          network: [
            { id: '192.168.1.1', type: 'router', ports: [22], files: {}, connections: ['10.0.0.5'] },
            { id: '10.0.0.5', type: 'server', ports: [80], files: {}, connections: ['192.168.1.1', '10.0.0.99'] },
            { id: '10.0.0.99', type: 'database', ports: [5432], files: { 'password.txt': 'admin123' }, connections: ['10.0.0.5'] }
          ]
        },
        available_functions: ['connect_to(ip)', 'download_file(filename)', 'print(value)'],
        expected_output: 'Target Password: admin123',
        starter_code: `// MISSION 3: Database Breach
// Navigate: Router -> Web Server -> Database

// Step 1: Hop to Web Server
connect_to('10.0.0.5');

// Step 2: Hop to Database
connect_to('10.0.0.99');

// Step 3: Download password.txt and print
let pass = download_file("password.txt");
print("Target Password: " + pass);
`,
        hints: [
          'You cannot jump straight to 10.0.0.99 from the start. You must go to 10.0.0.5 first.'
        ]
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

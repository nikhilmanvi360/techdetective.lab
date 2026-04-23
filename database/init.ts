import { supabase } from '../src/lib/supabase';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('--- SEEDING: TECH DETECTIVE — CODING AUTOMATION GAME ---');

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
  // 3. MISSIONS — 15 total, designed for a 4-hour competitive event.
  //
  // Each case's `metadata` field stores the full mission payload:
  //   - brief:             Narrative intro
  //   - evidence:          { logs: string[], emails: string[] }
  //   - available_functions: string[]
  //   - expected_output:   string (exact stdout to match)
  //   - starter_code:      string (pre-filled template)
  //   - hints:             string[]
  // =====================================================================

  const missions = [

    // ── PHASE 1: RECON ─────────────────────────────────────────────

    {
      id: 1,
      title: 'Midnight Breach',
      difficulty: 'Easy',
      correct_attacker: '192.168.1.45',
      points_on_solve: 125,
      status: 'active',
      description: JSON.stringify({
        summary: 'An unauthorized entity accessed the Central Auth Server in the dead of night. Filter the noise. Find the ghost.',
        brief: "At 00:00 UTC, the Central Auth Server logged a series of brute-force attempts followed by a silent, successful intrusion. The access window was 4 minutes. MOLT Intelligence has flagged this as an advanced persistent threat (APT). Your mission: isolate the attacker's IP from the noise.",
        evidence: {
          logs: [
            '192.168.1.10 - 23:58 - LOGIN SUCCESS - user: arjun',
            '192.168.1.45 - 00:01 - LOGIN FAILED - user: admin',
            '192.168.1.45 - 00:02 - LOGIN FAILED - user: admin',
            '192.168.1.45 - 00:05 - LOGIN SUCCESS - user: admin',
            '10.0.0.2 - 01:10 - LOGIN FAILED - user: guest',
            '172.16.0.8 - 00:03 - LOGIN FAILED - user: root',
            '192.168.1.22 - 00:07 - LOGIN SUCCESS - user: backup_svc',
          ]
        },
        available_functions: ['get_logs()', 'filter_time(data, "HH:")', 'find_failed(data)', 'find_success(data)', 'extract_ips(data)', 'print(value)'],
        expected_output: '192.168.1.45 - 00:05 - LOGIN SUCCESS - user: admin',
        starter_code: `// MISSION 1: Midnight Breach
// Find the IP that succeeded AFTER multiple failures at midnight.

const logs = get_logs();

// Step 1: Filter logs near midnight
const midnight = filter_time(logs, "00:");

// Step 2: YOUR CODE HERE
`,
        hints: [
          'Focus on repeated failures before success — that is the attacker\'s pattern.',
          'filter_time narrows the logs. find_failed and find_success then split them.',
          'Loop through success IPs and check if they also appear in the failed list.',
        ]
      })
    },

    {
      id: 2,
      title: 'Insider Email Leak',
      difficulty: 'Easy',
      correct_attacker: 'ravi@corp.com',
      points_on_solve: 125,
      status: 'active',
      description: JSON.stringify({
        summary: 'Confidential project data has surfaced on an external forum. The leak came from inside. Find the sender.',
        brief: "A zip archive containing the company's Q3 roadmap was posted anonymously on an external forum. MOLT forensics traced the upload window to a corporate email client. One of our own sent it. Identify the internal employee who transmitted the sensitive file.",
        evidence: {
          emails: [
            'from: ravi@corp.com | subject: meeting notes | to: team@corp.com',
            'from: priya@corp.com | subject: project update | to: mgmt@corp.com',
            'from: admin@corp.com | subject: credentials reset | to: it@corp.com',
            'from: unknown@external.com | subject: data request | to: ravi@corp.com',
            'from: ravi@corp.com | subject: confidential_data.zip | to: unknown@external.com',
            'from: neha@corp.com | subject: lunch tomorrow | to: team@corp.com',
          ]
        },
        available_functions: ['get_emails()', 'filter_keyword(data, "keyword")', 'extract_users(data)', 'print(value)'],
        expected_output: 'ravi@corp.com',
        starter_code: `// MISSION 2: Insider Email Leak
// Identify the internal employee who sent the confidential file.

const emails = get_emails();

// Step 1: Filter for suspicious keywords
const suspicious = filter_keyword(emails, "confidential");

// Step 2: YOUR CODE HERE
`,
        hints: [
          'Look for keywords that indicate a sensitive file being transmitted.',
          'extract_users pulls sender addresses from filtered results.',
          'The answer is a single email address — the internal sender.',
        ]
      })
    },

    {
      id: 3,
      title: 'The Ghost Session',
      difficulty: 'Easy',
      correct_attacker: '10.0.0.55',
      points_on_solve: 150,
      status: 'active',
      description: JSON.stringify({
        summary: 'Someone logged into the backup server without being on the approved access list. Extract the ghost.',
        brief: "The backup server BKUP-07 runs a 6-hour maintenance window with only two approved IPs permitted. During the last window, a third connection was established and a SUCCESS event logged. Find the unapproved ghost IP.",
        evidence: {
          logs: [
            '10.0.0.10 - 02:00 - LOGIN SUCCESS - user: backup_svc',
            '10.0.0.22 - 02:15 - LOGIN SUCCESS - user: sysadmin',
            '10.0.0.55 - 02:31 - LOGIN SUCCESS - user: ???',
            '192.168.5.1 - 02:45 - LOGIN FAILED - user: admin',
            '10.0.0.55 - 03:10 - FILE ACCESS: /backup/db_dump.sql',
            '10.0.0.10 - 04:00 - LOGOUT - user: backup_svc',
          ]
        },
        available_functions: ['get_logs()', 'find_success(data)', 'extract_ips(data)', 'filter_keyword(data, "keyword")', 'print(value)'],
        expected_output: '10.0.0.55',
        starter_code: `// MISSION 3: The Ghost Session
// Find the unapproved IP that got a SUCCESS login.
// Approved IPs are: 10.0.0.10 and 10.0.0.22

const logs = get_logs();
const APPROVED = ['10.0.0.10', '10.0.0.22'];

// Step 1: YOUR CODE HERE
`,
        hints: [
          'Get all successful logins first, then extract their IPs.',
          'Filter out every IP that is in the APPROVED list — what remains is the ghost.',
          'The ghost also accessed a file — look for FILE ACCESS entries to confirm.',
        ]
      })
    },

    {
      id: 4,
      title: 'Phantom User',
      difficulty: 'Easy',
      correct_attacker: 'ghost_user',
      points_on_solve: 175,
      status: 'active',
      description: JSON.stringify({
        summary: 'A user account shows repeated failed logins from one location and then disappears from the logs entirely.',
        brief: "HR flagged a username 'ghost_user' that appears 3 times in the server logs with failed attempts — then vanishes. No such user exists in the employee directory. Trace the phantom.",
        evidence: {
          logs: [
            '172.16.1.5 - 08:00 - LOGIN FAILED - user: ghost_user',
            '172.16.1.5 - 08:01 - LOGIN FAILED - user: ghost_user',
            '172.16.1.5 - 08:03 - LOGIN FAILED - user: ghost_user',
            '10.0.1.1  - 08:10 - LOGIN SUCCESS - user: alice',
            '10.0.1.2  - 08:12 - LOGIN SUCCESS - user: bob',
            '172.16.1.5 - 09:00 - SCAN DETECTED - user: ghost_user',
          ]
        },
        available_functions: ['get_logs()', 'find_failed(data)', 'filter_keyword(data, "keyword")', 'extract_users(data)', 'print(value)'],
        expected_output: 'ghost_user',
        starter_code: `// MISSION 4: Phantom User
// Extract the username that only appears in FAILED events.

const logs = get_logs();

// Step 1: Find all failed attempts
const failed = find_failed(logs);

// Step 2: YOUR CODE HERE
`,
        hints: [
          'extract_users works on any filtered data array.',
          'The phantom user only appears in failed attempts — never in success.',
          'You can also use filter_keyword on the username itself to isolate its logs.',
        ]
      })
    },

    // ── PHASE 2: EVIDENCE TRAIL ─────────────────────────────────────

    {
      id: 5,
      title: 'Multi-Stage Attack',
      difficulty: 'Intermediate',
      correct_attacker: '192.168.1.45',
      points_on_solve: 200,
      status: 'active',
      description: JSON.stringify({
        summary: 'An attacker moved through three distinct phases: probe, breach, exfiltrate. Trace the full kill chain.',
        brief: "MOLT has detected a full kill-chain sequence on the internal network. One IP conducted a probing phase (failed logins), established a foothold (success), and then accessed restricted files. Your task: confirm the attacker IP by tracing all three stages.",
        evidence: {
          logs: [
            '192.168.1.45 - 00:01 - LOGIN FAILED - user: admin',
            '192.168.1.45 - 00:03 - LOGIN SUCCESS - user: admin',
            '192.168.1.45 - 00:05 - FILE ACCESS: confidential.txt',
            '10.0.0.8     - 00:02 - LOGIN FAILED - user: root',
            '10.0.0.9     - 00:10 - LOGIN SUCCESS - user: svc_backup',
            '10.0.0.8     - 00:15 - LOGIN FAILED - user: root',
          ]
        },
        available_functions: ['get_logs()', 'find_failed(data)', 'find_success(data)', 'extract_ips(data)', 'filter_keyword(data, "keyword")', 'print(value)'],
        expected_output: '192.168.1.45',
        starter_code: `// MISSION 5: Multi-Stage Attack
// Find the IP that: FAILED → then SUCCEEDED → then accessed a FILE.

const logs = get_logs();

const failed  = find_failed(logs);
const success = find_success(logs);

const ips_failed  = extract_ips(failed);
const ips_success = extract_ips(success);

// Step 3: Cross-reference — find IPs in BOTH lists
for (const ip of ips_success) {
  if (ips_failed.includes(ip)) {
    // YOUR CODE HERE — confirm file access too
  }
}
`,
        hints: [
          'The attacker must appear in all three phases: failure, success, and file access.',
          'Use filter_keyword(logs, "FILE ACCESS") to get the access events.',
          'Only print the IP that matches across all three filtered sets.',
        ]
      })
    },

    {
      id: 6,
      title: 'The Mole',
      difficulty: 'Intermediate',
      correct_attacker: 'dev_sharma@corp.com',
      points_on_solve: 225,
      status: 'active',
      description: JSON.stringify({
        summary: 'An internal employee is leaking access credentials to an external contact. Cross-reference email and server logs.',
        brief: "MOLT intercepted a suspicious email exchange where login credentials were forwarded to an external domain. To confirm the mole's identity, you need to match the email sender against the server login logs using their IP address.",
        evidence: {
          logs: [
            '192.168.10.5  - 14:00 - LOGIN SUCCESS - user: alice',
            '192.168.10.88 - 14:05 - LOGIN SUCCESS - user: sharma',
            '192.168.10.88 - 14:07 - FILE ACCESS: /etc/shadow',
            '192.168.10.22 - 14:10 - LOGIN SUCCESS - user: bob',
          ],
          emails: [
            'from: alice@corp.com | ip: 192.168.10.5 | subject: standup notes',
            'from: dev_sharma@corp.com | ip: 192.168.10.88 | subject: fwd: server credentials',
            'from: bob@corp.com | ip: 192.168.10.22 | subject: team lunch',
          ]
        },
        available_functions: ['get_logs()', 'get_emails()', 'filter_keyword(data, "keyword")', 'extract_ips(data)', 'extract_users(data)', 'print(value)'],
        expected_output: 'dev_sharma@corp.com',
        starter_code: `// MISSION 6: The Mole
// Find the employee email that matches the IP that accessed /etc/shadow.

const logs   = get_logs();
const emails = get_emails();

// Step 1: Find the suspicious file access in logs
const shadow_access = filter_keyword(logs, "/etc/shadow");
const suspect_ips   = extract_ips(shadow_access);

// Step 2: YOUR CODE HERE — find the email whose IP matches
`,
        hints: [
          'The /etc/shadow file contains password hashes — accessing it is always suspicious.',
          'Each email entry contains an ip: field. Use filter_keyword to match the suspect IP.',
          'extract_users on the filtered email list will give you the sender address.',
        ]
      })
    },

    {
      id: 7,
      title: 'Privilege Escalation',
      difficulty: 'Intermediate',
      correct_attacker: '10.10.0.33',
      points_on_solve: 250,
      status: 'active',
      description: JSON.stringify({
        summary: 'An account went from standard user to root without an authorized elevation event. Spot the gap.',
        brief: "The security scanner detected that an IP performed a standard user login, then immediately accessed a root-only resource without going through the approved sudo/privilege escalation channel (tagged as SUDO_GRANTED). Find the IP that skipped the authorization step.",
        evidence: {
          logs: [
            '10.10.0.11 - 09:00 - LOGIN SUCCESS - user: alice - level: user',
            '10.10.0.11 - 09:01 - SUDO_GRANTED - user: alice',
            '10.10.0.11 - 09:02 - ROOT ACCESS: /etc/crontab',
            '10.10.0.33 - 09:05 - LOGIN SUCCESS - user: marcus - level: user',
            '10.10.0.33 - 09:06 - ROOT ACCESS: /etc/passwd',
            '10.10.0.22 - 09:10 - LOGIN SUCCESS - user: svc_bot - level: service',
          ]
        },
        available_functions: ['get_logs()', 'filter_keyword(data, "keyword")', 'extract_ips(data)', 'find_success(data)', 'print(value)'],
        expected_output: '10.10.0.33',
        starter_code: `// MISSION 7: Privilege Escalation
// Find the IP that accessed ROOT resources WITHOUT a SUDO_GRANTED event.

const logs = get_logs();

const sudo_events  = filter_keyword(logs, "SUDO_GRANTED");
const root_access  = filter_keyword(logs, "ROOT ACCESS");

const authorized_ips = extract_ips(sudo_events);
const root_ips       = extract_ips(root_access);

// Step 3: YOUR CODE HERE — find root_ips NOT in authorized_ips
`,
        hints: [
          'Authorized users have a SUDO_GRANTED line before ROOT ACCESS.',
          'The attacker jumped directly to ROOT ACCESS — no SUDO step.',
          'Filter root_ips to find the one that does NOT appear in authorized_ips.',
        ]
      })
    },

    {
      id: 8,
      title: 'Silent Exfiltration',
      difficulty: 'Intermediate',
      correct_attacker: '172.20.0.99',
      points_on_solve: 275,
      status: 'active',
      description: JSON.stringify({
        summary: 'Data is leaving the network in small batches during off-hours. Find the silent drain.',
        brief: "Network traffic analysis shows repeated small file transfers from a single internal IP between 03:00 and 05:00 — a window when no staff are on shift. Someone is slowly exfiltrating data to avoid threshold alerts. Identify the source IP.",
        evidence: {
          logs: [
            '10.0.0.1    - 08:00 - FILE TRANSFER: 2MB report.pdf',
            '172.20.0.99 - 03:11 - FILE TRANSFER: 0.5MB chunk_001.dat',
            '172.20.0.99 - 03:45 - FILE TRANSFER: 0.5MB chunk_002.dat',
            '172.20.0.99 - 04:22 - FILE TRANSFER: 0.5MB chunk_003.dat',
            '172.20.0.99 - 04:58 - FILE TRANSFER: 0.5MB chunk_004.dat',
            '10.0.0.5    - 09:30 - FILE TRANSFER: 5MB quarterly.xlsx',
          ]
        },
        available_functions: ['get_logs()', 'filter_time(data, "HH:")', 'filter_keyword(data, "keyword")', 'extract_ips(data)', 'print(value)'],
        expected_output: '172.20.0.99',
        starter_code: `// MISSION 8: Silent Exfiltration
// Find the IP transferring files repeatedly during the off-hours window (03:00–05:00).

const logs = get_logs();

// Step 1: Isolate off-hours transfers
const offhours_03 = filter_time(logs, "03:");
const offhours_04 = filter_time(logs, "04:");
const offhours    = [...offhours_03, ...offhours_04];

// Step 2: YOUR CODE HERE
`,
        hints: [
          'Combine the 03: and 04: time filters using the spread operator.',
          'Extract IPs from the combined off-hours window.',
          'The attacker IP will appear multiple times — the suspicious pattern is repetition.',
        ]
      })
    },

    // ── PHASE 3: DEEP DIVE ──────────────────────────────────────────

    {
      id: 9,
      title: 'Coordinated Strike',
      difficulty: 'Hard',
      correct_attacker: '10.50.0.7',
      points_on_solve: 300,
      status: 'active',
      description: JSON.stringify({
        summary: 'Multiple IPs moved in sync — a distributed attack with a single coordinator profile.',
        brief: "MOLT has detected a coordinated, multi-vector attack where three different IPs hit three different services simultaneously. However, one central IP authenticated to the management console seconds before the attack launched — a classic C2 (command-and-control) pattern. Find the coordinator.",
        evidence: {
          logs: [
            '10.50.0.7  - 01:59 - LOGIN SUCCESS - user: admin - service: MGMT_CONSOLE',
            '10.50.0.21 - 02:00 - ATTACK DETECTED - service: WEB_SERVER',
            '10.50.0.33 - 02:00 - ATTACK DETECTED - service: MAIL_SERVER',
            '10.50.0.45 - 02:00 - ATTACK DETECTED - service: DB_SERVER',
            '10.50.0.7  - 02:01 - CONFIG_CHANGE - user: admin - service: MGMT_CONSOLE',
            '192.168.1.1 - 03:00 - LOGIN SUCCESS - user: sysadmin',
          ]
        },
        available_functions: ['get_logs()', 'filter_keyword(data, "keyword")', 'filter_time(data, "HH:")', 'extract_ips(data)', 'find_success(data)', 'print(value)'],
        expected_output: '10.50.0.7',
        starter_code: `// MISSION 9: Coordinated Strike
// Find the C2 coordinator — the IP that accessed MGMT_CONSOLE just before the attack.

const logs = get_logs();

// Step 1: Find the attack window
const attack_window = filter_time(logs, "02:");

// Step 2: YOUR CODE HERE — isolate MGMT_CONSOLE access just before 02:00
`,
        hints: [
          'The C2 coordinator logs in to the management console BEFORE the attack begins.',
          'Use filter_keyword to isolate MGMT_CONSOLE events.',
          'The coordinator appears at 01:59 — just one minute before the distributed strike.',
        ]
      })
    },

    {
      id: 10,
      title: 'The Frame Job',
      difficulty: 'Hard',
      correct_attacker: '192.168.77.3',
      points_on_solve: 325,
      status: 'active',
      description: JSON.stringify({
        summary: 'The obvious suspect is too obvious. Someone planted evidence. Find the real attacker behind the decoy.',
        brief: "MOLT analysis suggests that the primary suspect IP has been deliberately planted as a decoy. The real attacker used a spoofed header to make requests appear to come from the decoy. The genuine origin IP appears in the ORIGIN field — not the FROM field. Ignore the decoy. Find the real source.",
        evidence: {
          logs: [
            'FROM: 192.168.1.45 - ORIGIN: 192.168.77.3 - 00:05 - LOGIN SUCCESS - user: admin',
            'FROM: 192.168.1.45 - ORIGIN: 192.168.77.3 - 00:06 - FILE ACCESS: /data/keys',
            'FROM: 10.0.0.5    - ORIGIN: 10.0.0.5    - 00:10 - LOGIN SUCCESS - user: alice',
            'FROM: 192.168.1.45 - ORIGIN: 192.168.77.3 - 00:11 - FILE DELETE: /logs/auth.log',
          ]
        },
        available_functions: ['get_logs()', 'filter_keyword(data, "keyword")', 'find_success(data)', 'print(value)'],
        expected_output: '192.168.77.3',
        starter_code: `// MISSION 10: The Frame Job
// The FROM field is a decoy. The REAL attacker is in the ORIGIN field.
// Find the ORIGIN IP behind the successful login.

const logs = get_logs();

// Step 1: Find successful logins
const success_logs = find_success(logs);

// Step 2: YOUR CODE HERE — extract the ORIGIN IP, not the FROM IP
`,
        hints: [
          'Do NOT use extract_ips — it will return both FROM and ORIGIN IPs.',
          'Use filter_keyword to isolate lines where FROM and ORIGIN differ.',
          'Parse the ORIGIN field manually using JavaScript string methods like split().',
        ]
      })
    },

    {
      id: 11,
      title: 'Dormant Threat',
      difficulty: 'Hard',
      correct_attacker: '172.31.0.200',
      points_on_solve: 350,
      status: 'active',
      description: JSON.stringify({
        summary: 'An IP was benign for weeks. Then it woke up and exfiltrated everything in under 3 minutes.',
        brief: "A long-standing service account performed routine backups for 30 days. Then, at 23:57 UTC on Day 31, it began accessing files outside its scope at an uncharacteristic rate — 6 access events in under 3 minutes. This is a classic sleeper implant activation. Identify the rogue IP.",
        evidence: {
          logs: [
            '172.31.0.100 - 23:50 - FILE ACCESS: /backup/db.bak - user: svc_backup',
            '172.31.0.200 - 23:57 - FILE ACCESS: /corporate/strategy_2026.pdf',
            '172.31.0.200 - 23:57 - FILE ACCESS: /hr/payroll.xlsx',
            '172.31.0.200 - 23:58 - FILE ACCESS: /legal/contracts.zip',
            '172.31.0.200 - 23:58 - FILE ACCESS: /finance/Q4_report.pdf',
            '172.31.0.200 - 23:59 - FILE ACCESS: /exec/board_minutes.docx',
            '172.31.0.200 - 23:59 - FILE ACCESS: /it/admin_credentials.txt',
            '10.0.0.1    - 00:10 - LOGIN SUCCESS - user: sysadmin',
          ]
        },
        available_functions: ['get_logs()', 'filter_time(data, "HH:")', 'filter_keyword(data, "keyword")', 'extract_ips(data)', 'print(value)'],
        expected_output: '172.31.0.200',
        starter_code: `// MISSION 11: Dormant Threat
// Find the IP with abnormally HIGH activity in a very short time window.

const logs = get_logs();

// Step 1: Focus on the activation window
const window = filter_time(logs, "23:");

// Step 2: Count FILE ACCESS events per IP
const access_events = filter_keyword(window, "FILE ACCESS");
const ip_counts = {};

for (const line of access_events) {
  // YOUR CODE HERE — count how many times each IP appears
}

// Step 3: Print the IP with the highest count
`,
        hints: [
          'Use an object as a counter: ip_counts[ip] = (ip_counts[ip] || 0) + 1',
          'The rogue IP will have 6 accesses — far more than any other IP in the window.',
          'Loop through ip_counts to find the key with the maximum value.',
        ]
      })
    },

    {
      id: 12,
      title: 'Lateral Movement',
      difficulty: 'Hard',
      correct_attacker: '10.1.3.50',
      points_on_solve: 375,
      status: 'active',
      description: JSON.stringify({
        summary: 'The attacker hopped through three internal systems. Trace the full chain from entry point to target.',
        brief: "Network segmentation logs show an attacker that entered through the DMZ, pivoted to the internal dev server, and finally reached the core database. Each hop spawned from the previous compromised machine. The final target IP is the database — find it.",
        evidence: {
          logs: [
            '203.0.113.1 - 10:00 - LOGIN SUCCESS - service: DMZ_GATEWAY - SPAWNED: 10.1.1.10',
            '10.1.1.10   - 10:02 - PIVOT SUCCESS - service: DEV_SERVER  - SPAWNED: 10.1.2.30',
            '10.1.2.30   - 10:05 - PIVOT SUCCESS - service: STAGING      - SPAWNED: 10.1.3.50',
            '10.1.3.50   - 10:07 - DB_QUERY: SELECT * FROM users        - service: CORE_DB',
            '10.0.0.1    - 10:30 - LOGIN SUCCESS - user: sysadmin',
          ]
        },
        available_functions: ['get_logs()', 'filter_keyword(data, "keyword")', 'print(value)'],
        expected_output: '10.1.3.50',
        starter_code: `// MISSION 12: Lateral Movement
// Trace the chain: each SPAWNED IP becomes the next attacker.
// Find the FINAL IP that reached the CORE_DB.

const logs = get_logs();

// Step 1: Find the database access event
const db_events = filter_keyword(logs, "CORE_DB");

// Step 2: YOUR CODE HERE — extract the source IP from the DB event
`,
        hints: [
          'The attack chain ends at CORE_DB — that is the target you need to report.',
          'Each log line with CORE_DB shows the IP that performed the final query.',
          'Use split() on the DB event line to extract the IP at the start.',
        ]
      })
    },

    // ── PHASE 4: THE FINAL PROTOCOL ─────────────────────────────────

    {
      id: 13,
      title: 'Operation Zero Day',
      difficulty: 'Expert',
      correct_attacker: 'kovacs@blackhat-forum.onion',
      points_on_solve: 400,
      status: 'active',
      description: JSON.stringify({
        summary: 'A zero-day was used to breach three departments simultaneously. Log + email correlation required.',
        brief: "An unknown zero-day exploit was used against the CCU network. MOLT intercepted an email from an external threat actor who taunted the security team and confirmed the attack vector. Cross-reference the exploit signature in the server logs with the email thread to identify the actor.",
        evidence: {
          logs: [
            '10.0.0.5  - 03:00 - EXPLOIT DETECTED - sig: CVE-2024-9922 - service: PORTAL',
            '10.0.0.5  - 03:01 - SHELL SPAWNED - pid: 1337 - service: PORTAL',
            '10.0.0.5  - 03:05 - DATA EXPORTED: /var/db/users.db',
            '10.0.0.10 - 04:00 - LOGIN SUCCESS - user: sysadmin',
          ],
          emails: [
            'from: security@ccu.ac.in | subject: ALERT - Intrusion Detected | body: CVE-2024-9922 triggered',
            'from: kovacs@blackhat-forum.onion | subject: your data is mine | body: CVE-2024-9922 was childs play. check your /var/db/',
            'from: noreply@github.com | subject: security advisory CVE-2024-9922 | body: patched in v2.1.1',
          ]
        },
        available_functions: ['get_logs()', 'get_emails()', 'filter_keyword(data, "keyword")', 'extract_users(data)', 'print(value)'],
        expected_output: 'kovacs@blackhat-forum.onion',
        starter_code: `// MISSION 13: Operation Zero Day
// Cross-reference the CVE signature across logs AND emails to find the threat actor.

const logs   = get_logs();
const emails = get_emails();

// Step 1: Confirm the CVE is in the logs
const exploit_logs = filter_keyword(logs, "CVE-2024-9922");
print("Exploit confirmed in logs: " + (exploit_logs.length > 0));

// Step 2: YOUR CODE HERE — find who taunted the team about this CVE via email
`,
        hints: [
          'The threat actor confirmed the attack in an email by naming the CVE and the stolen file path.',
          'Filter emails for the CVE number, then also filter for the stolen path /var/db/',
          'extract_users on the final filtered email list gives the sender.',
        ]
      })
    },

    {
      id: 14,
      title: 'The Insider Network',
      difficulty: 'Expert',
      correct_attacker: 'director_raj@corp.com',
      points_on_solve: 425,
      status: 'active',
      description: JSON.stringify({
        summary: 'Three employees. Three IPs. One coordinated insider leak. Identify the ringleader.',
        brief: "MOLT has evidence of a three-person insider ring leaking board-level documents to a competitor. Two members are known participants. Your task is to identify the ringleader — the person who accessed the source files AND coordinated the distribution via email.",
        evidence: {
          logs: [
            '10.10.1.5  - 11:00 - FILE ACCESS: /board/acquisition_plan.pdf - user: priya',
            '10.10.1.8  - 11:05 - FILE ACCESS: /board/acquisition_plan.pdf - user: director_raj',
            '10.10.1.12 - 11:10 - FILE ACCESS: /board/acquisition_plan.pdf - user: suresh',
            '10.10.1.8  - 11:15 - FILE COPY: /board/acquisition_plan.pdf -> /tmp/share/',
          ],
          emails: [
            'from: priya@corp.com | subject: got the file | to: director_raj@corp.com',
            'from: director_raj@corp.com | subject: distribution list | to: competitor@rival.com | body: acquisition_plan attached',
            'from: suresh@corp.com | subject: confirm receipt | to: director_raj@corp.com',
          ]
        },
        available_functions: ['get_logs()', 'get_emails()', 'filter_keyword(data, "keyword")', 'extract_users(data)', 'find_success(data)', 'print(value)'],
        expected_output: 'director_raj@corp.com',
        starter_code: `// MISSION 14: The Insider Network
// Find the ringleader: the person who BOTH copied the file AND emailed it externally.

const logs   = get_logs();
const emails = get_emails();

// Step 1: Find who performed the FILE COPY (not just access)
const copy_events = filter_keyword(logs, "FILE COPY");
const copier_ips  = extract_users(copy_events);

// Step 2: Find who emailed the file to an EXTERNAL domain
const external_emails = filter_keyword(emails, "rival.com");
const senders         = extract_users(external_emails);

// Step 3: YOUR CODE HERE — find the overlap
`,
        hints: [
          'The ringleader is the only one who both copied the file AND sent it externally.',
          'extract_users on copy_events gives usernames, extract_users on external_emails gives email addresses.',
          'Convert usernames to emails for comparison: username@corp.com',
        ]
      })
    },

    {
      id: 15,
      title: '⚡ THE FINAL PROTOCOL',
      difficulty: 'Expert',
      correct_attacker: 'PHANTOM_ZERO',
      points_on_solve: 500,
      status: 'active',
      description: JSON.stringify({
        summary: 'MOLT EYES ONLY. All skills. One chance. The architect of every attack this session is the same person.',
        brief: "MOLT has traced a common signature across every attack in this session. One operator — codenamed PHANTOM_ZERO — has been coordinating all incidents from a single encrypted relay node. The relay node's username is embedded across three evidence sources. Triangulate and extract the codename.",
        evidence: {
          logs: [
            '10.99.0.1 - 00:00 - LOGIN SUCCESS - user: PH_relay_node - service: RELAY',
            '10.99.0.1 - 00:01 - BROADCAST: targets_assigned - user: PH_relay_node',
            '10.99.0.1 - 23:59 - SESSION END - user: PH_relay_node - codename: PHANTOM_ZERO',
          ],
          emails: [
            'from: relay@darknet.zero | subject: operation complete | body: PHANTOM_ZERO signing off. All objectives met.',
            'from: security@ccu.ac.in | subject: trace complete | body: relay node user is PH_relay_node — codename still unknown.',
          ]
        },
        available_functions: ['get_logs()', 'get_emails()', 'filter_keyword(data, "keyword")', 'extract_users(data)', 'print(value)'],
        expected_output: 'PHANTOM_ZERO',
        starter_code: `// THE FINAL PROTOCOL
// Extract the codename of the architect behind all attacks.
// It appears at the END of the session log and in the external email.

const logs   = get_logs();
const emails = get_emails();

// Hint: Look for "codename" in the logs and "signing off" in the emails.
// The answer is a single word. Extract it precisely.

// YOUR CODE HERE
`,
        hints: [
          'Use filter_keyword(logs, "codename") to find the relevant log line.',
          'The codename is at the end of the line after "codename: "',
          'Use split(":")[1].trim() to extract is cleanly from the log entry.',
        ]
      })
    },
  ];

  const { error: missionsError } = await supabase.from('cases').upsert(missions);
  if (missionsError) console.error('Error seeding missions:', missionsError.message);
  else console.log(`✔ ${missions.length} missions seeded`);

  // Adversary config
  await supabase
    .from('adversary_config')
    .upsert({ is_active: false, intensity: 'low', lead_threshold: 200, actions_enabled: ['signal_interference', 'guidance_hint'] });

  console.log('--- SEEDING COMPLETE — Tech Detective: Coding Automation Game ---');
}

seed();

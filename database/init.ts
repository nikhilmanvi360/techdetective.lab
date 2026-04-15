import { DatabaseSync as Database } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'lab.db');
const db = new Database(dbPath);
db.exec('PRAGMA journal_mode = WAL;');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    is_disabled INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS team_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    badge_name TEXT NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    correct_attacker TEXT,
    points_on_solve INTEGER DEFAULT 100
  );

  CREATE TABLE IF NOT EXISTS evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'chat', 'html', 'log', 'email', 'code'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT, -- JSON string for extra info like IP, timestamp
    required_puzzle_id INTEGER,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (required_puzzle_id) REFERENCES puzzles(id)
  );

  CREATE TABLE IF NOT EXISTS puzzles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    points INTEGER DEFAULT 10,
    hint TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    case_id INTEGER NOT NULL,
    attacker_name TEXT NOT NULL,
    attack_method TEXT NOT NULL,
    prevention_measures TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'correct', 'incorrect'
    feedback TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (case_id) REFERENCES cases(id)
  );

  CREATE TABLE IF NOT EXISTS solved_puzzles (
    team_id INTEGER NOT NULL,
    puzzle_id INTEGER NOT NULL,
    solved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, puzzle_id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id)
  );

  CREATE TABLE IF NOT EXISTS used_hints (
    team_id INTEGER NOT NULL,
    puzzle_id INTEGER NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, puzzle_id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id)
  );

  CREATE TABLE IF NOT EXISTS puzzle_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    puzzle_id INTEGER NOT NULL,
    is_correct INTEGER NOT NULL,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id)
  );
`);

// Seed default team (admin/admin)
const hashedPassword = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT OR IGNORE INTO teams (name, password) VALUES (?, ?)').run('CCU_ADMIN', hashedPassword);

// Seed cases
const caseStmt = db.prepare('INSERT OR IGNORE INTO cases (id, title, description, difficulty, correct_attacker, points_on_solve) VALUES (?, ?, ?, ?, ?, ?)');
caseStmt.run(1, 'The Phantom Leak', 'A sensitive user database from a fintech startup was leaked on a dark web forum. The CEO suspects a targeted attack or a disgruntled employee. Your task is to trace the digital breadcrumbs, identify the vulnerability exploited, and find the culprit.', 'Intermediate', 'Shadow', 150);
caseStmt.run(2, 'The Exam Portal Breach (CCU-2026-017)', 'The KLE College Examination Portal was hacked and the BCA semester exam paper was leaked online 24 hours before the exam. The administration suspects an insider attack. Identify the attacker among the three primary suspects: Rahul, Neha, and Arjun.', 'Hard', 'Neha', 250);
caseStmt.run(3, 'Operation Phantom Proxy', 'The college\'s Automated Attendance System (AAS) has been compromised. Over the last month, a specific group of students has maintained 100% attendance, despite professors noting their physical absence in class. The administration suspects someone has found a backdoor into the web portal to inject fake attendance records. You have three main suspects: Vikram, Rohan, and Priya (Database TA).', 'Hard', 'Priya', 300);
caseStmt.run(4, 'The Junior Developer\'s Blunder', 'A junior developer at "TechCorp" accidentally pushed some raw debug files to the production server. These files contain sensitive tokens and internal notes. Your task is to examine these files and find the hidden data.', 'Easy', 'Junior_Dev_Manoj', 100);

// Seed puzzles
const puzzleStmt = db.prepare('INSERT OR IGNORE INTO puzzles (id, case_id, question, answer, points, hint) VALUES (?, ?, ?, ?, ?, ?)');

// Case 1 Puzzles
puzzleStmt.run(1, 1, 'What is the IP address of the attacker?', '192.168.1.45', 20, 'Check the "Encrypted Chat Log" or "Auth Server Logs".');
puzzleStmt.run(2, 1, 'What is the admin password hidden in the source code? (Decode the base64)', 'p@ssw0rd123', 30, 'Look for a base64 string in the HTML comments of index.html.');
puzzleStmt.run(3, 1, 'What username did the attacker use to log in?', 'dev_admin', 20, 'The server logs show a successful login.');

// Case 2 Puzzles
puzzleStmt.run(4, 2, 'Inspect the "Admin Login Source". What is the value of the hidden CSRF token?', 'admin_bypass_99', 10, 'Look for an <input> tag with type="hidden".');
puzzleStmt.run(5, 2, 'What is the hidden backup directory mentioned in the HTML comments?', '/admin_backup_v2', 10, 'Read the green comment text in the HTML file.');
puzzleStmt.run(6, 2, 'Look at the "Portal Stylesheet". What is the hidden API route used to export the PDF?', '/api/v2/export_pdf', 20, 'Find the CSS class that has "display: none".');
puzzleStmt.run(7, 2, 'The login requires a daily PIN generated by a C program. Read "keygen.c" and calculate the PIN.', '100', 30, 'x << y means bitwise left shift. 15 shifted left by 3 is 15 * (2^3). Then subtract 20.');
puzzleStmt.run(8, 2, 'Decode the secret note in the C program to find the exact filename of the stolen exam.', 'secret_exam_file_2026.pdf', 30, 'The string ends with ==, which means it is Base64 encoded.');
puzzleStmt.run(9, 2, 'Check the "Portal Access Log". Which IP address successfully logged in using the correct PIN?', '192.168.0.15', 20, 'Look for the "LOGIN SUCCESS" line.');
puzzleStmt.run(10, 2, 'Cross-reference the IP with the "Lab IP Mapping". Which physical computer was used?', 'Lab Computer 4', 20, 'Match the IP from the access log to the mapping list.');
puzzleStmt.run(11, 2, 'A Python script ("frame_job.py") was found on that computer. Who is the script designed to frame?', 'Arjun', 30, 'Read the comments and the target variable in the Python code.');
puzzleStmt.run(12, 2, 'The attacker tried to frame Arjun, but the CCTV logs don\'t lie. Who was the only person physically present in the lab at the time of the successful login (21:41)?', 'Neha', 50, 'Compare the timestamp of the successful login with the Lab Entry Log.');

// Case 3 Puzzles
puzzleStmt.run(13, 3, 'The attacker didn\'t use the standard login form. What hidden API endpoint did they use to bypass the system?', '/api/v1/attendance_override', 20, 'Inspect the HTML source code carefully. Developers often leave comments behind.');
puzzleStmt.run(14, 3, 'To use the hidden API, the attacker needed a specific Dev Auth Key. Decode the key found in the HTML source.', 'admin_backdoor', 30, 'The string ends with an equals sign (=), which is a massive giveaway that it is Base64 encoded.');
puzzleStmt.run(15, 3, 'Look at the Auth Server Logs. What IP address appears to be making the late-night requests to the override API?', '192.168.5.101', 20, 'Find the exact timestamp when the /api/v1/attendance_override was accessed and look at the end of that log line.');
puzzleStmt.run(16, 3, 'Vikram claims to have hacked the system. Decode his "ultimate bypass code" from the chat logs to see what his actual method is.', 'Hey, it\'s just a fake medical certificate lol', 30, 'Like the Dev Key, this is Base64 encoded. Vikram isn\'t a hacker; he\'s just a liar.');
puzzleStmt.run(17, 3, 'The IP address in the server logs belongs to Rohan (192.168.5.101). However, look at the Python script. What specific HTTP Header did the real attacker use to spoof the IP and frame Rohan?', 'X-Forwarded-For', 40, 'Read the comments in the Python code. It explicitly states which line overrides the origin IP.');
puzzleStmt.run(18, 3, 'Since Rohan was framed, we need to find the actual machine that ran the Python script. What is the real origin IP address?', '10.0.0.55', 30, 'Look at the variables defined at the top of the Python script.');
puzzleStmt.run(19, 3, 'We know the attack came from 10.0.0.55. Read the IT Internal Email to find out where that machine is located. Then, check the CSS file. Whose initials are left in the code, proving they built the hidden debug panel?', 'P.S.', 50, 'The email points to the TA lab. Look for a CSS comment inside the .debug-panel class. Who matches those initials?');

// Case 4 Puzzles
puzzleStmt.run(20, 4, 'What is the hidden developer code found in the HTML comments?', 'DEV_HTM_2026', 20, 'Look for green text in the source code or use "Inspect Element".');
puzzleStmt.run(21, 4, 'What is the Hex color code of the ".alert-msg" class in the stylesheet?', '#E74C3C', 20, 'Open the "Debug Stylesheet" and look for the color property.');
puzzleStmt.run(22, 4, 'What is the value of the "internal_key" variable in the Python script?', 'PY_KEY_44', 30, 'Read the "Cleanup Script" carefully.');
puzzleStmt.run(23, 4, 'Read "math_check.c". What value does the program print? (Calculate: 5 + 5 * 2)', '15', 30, 'Remember operator precedence: Multiply before Add.');

// Seed evidence
const evidenceStmt = db.prepare('INSERT OR IGNORE INTO evidence (id, case_id, type, title, content, metadata, required_puzzle_id) VALUES (?, ?, ?, ?, ?, ?, ?)');

// Case 1
evidenceStmt.run(1, 1, 'chat', 'Encrypted Chat Log', 'Shadow: Did you get the dump?\nGhost: Yeah, it was too easy. They left the debug mode on.\nShadow: Good. Send it to the usual IP: 192.168.1.45\nGhost: Wait, I think I saw someone else in the logs. "dev_admin"?\nShadow: Ignore it. Just get the data out.', JSON.stringify({ source: 'Internal Messenger', timestamp: '2026-04-10 23:00', protocol: 'XMPP-SEC' }), null);
evidenceStmt.run(2, 1, 'html', 'Portal Source Code', '<!DOCTYPE html>\n<html>\n<!-- DEBUG INFO: Admin bypass enabled for testing -->\n<!-- TODO: Remove this before prod: btoa("admin:p@ssw0rd123") -->\n<script>\n  function checkDebug() {\n    if(window.location.hash === "#debug") console.log("Debug mode active");\n  }\n</script>\n<body>...</body>\n</html>', JSON.stringify({ file: 'index.html', version: 'v2.1.0', server: 'Nginx/1.18.0' }), 1);
evidenceStmt.run(3, 1, 'log', 'Auth Server Logs', '2026-04-10 22:15:01 - 192.168.1.45 - LOGIN_SUCCESS - user: dev_admin\n2026-04-10 22:16:05 - 192.168.1.45 - EXPORT_REQUEST - resource: user_db_final.csv\n2026-04-10 22:18:10 - 192.168.1.45 - LOGOUT - user: dev_admin', JSON.stringify({ server: 'Auth-Node-01', log_level: 'INFO' }), 2);
evidenceStmt.run(4, 1, 'code', 'Recovery Script', 'import base64\n\ndef recover_key(cipher):\n    # The key is hidden in the XOR\n    return "".join(chr(ord(c) ^ 0x42) for c in cipher)\n\n# Found string: "6\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b\x0b"', JSON.stringify({ language: 'python', location: '/tmp/recovery.py', owner: 'root' }), 3);

// Case 2
evidenceStmt.run(5, 2, 'html', 'Admin Login Source', '<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="portal_style.css">\n</head>\n<body>\n  <h2>KLE Exam Portal</h2>\n  <form action="/login" method="post">\n    <input type="hidden" name="csrf_token" value="admin_bypass_99">\n    Username: <input type="text" name="username">\n    Password: <input type="password" name="password">\n    <input type="submit" value="Login">\n  </form>\n  <!-- TODO: Migrate to /admin_backup_v2 -->\n  <!-- Note: Daily PIN is generated by keygen.c -->\n</body>\n</html>', JSON.stringify({ file: 'admin_login.html', encoding: 'UTF-8' }), null);
evidenceStmt.run(6, 2, 'html', 'Portal Stylesheet (CSS)', 'body {\n  background-color: #f0f0f0;\n}\n.login-box {\n  border: 1px solid #ccc;\n}\n.hidden-route {\n  display: none;\n  /* Route: /api/v2/export_pdf */\n}', JSON.stringify({ file: 'portal_style.css', type: 'text/css' }), 4);
evidenceStmt.run(7, 2, 'code', 'Key Generator (keygen.c)', '#include <stdio.h>\n#include <string.h>\n\nint main() {\n    int x = 15;\n    int y = 3;\n    // Calculate PIN using bitwise shift\n    int pin = (x << y) - 20;\n    printf("Daily PIN: %d\\n", pin);\n\n    // Secret note: "c2VjcmV0X2V4YW1fZmlsZV8yMDI2LnBkZg=="\n    return 0;\n}', JSON.stringify({ language: 'c', compiler: 'gcc 9.4.0' }), 5);
evidenceStmt.run(8, 2, 'log', 'Portal Access Log', '21:39:05 FAILED LOGIN admin 192.168.0.15\n21:41:10 LOGIN SUCCESS admin 192.168.0.15 (PIN: 100)\n21:41:40 POST /api/v2/export_pdf\n21:42:05 LOGOUT admin', JSON.stringify({ server: 'KLE-Portal-SRV', uptime: '142 days' }), 7);
evidenceStmt.run(9, 2, 'log', 'Lab IP Mapping', '192.168.0.12  Lab Computer 1\n192.168.0.13  Lab Computer 2\n192.168.0.14  Lab Computer 3\n192.168.0.15  Lab Computer 4', JSON.stringify({ location: 'Computer Lab 1', subnet: '255.255.255.0' }), 9);
evidenceStmt.run(10, 2, 'code', 'Suspicious Script (frame_job.py)', '# Script left on Lab Computer 4 to mislead investigators\ndef encode(text):\n    return "".join(chr(ord(c) + 1) for c in text)\n\n# Target to frame:\ntarget = "Arjun"\n\n# Output generated: "Bskvo"\nprint("Framing complete. Logs wiped.")', JSON.stringify({ language: 'python', permissions: 'rwx------' }), 10);
evidenceStmt.run(11, 2, 'log', 'CCTV & Entry Log', '21:30 Lab Entry Log:\nRahul - Left campus at 18:00\nNeha - Working in lab (21:00 - 22:30)\nArjun - Not present (Attending Tech Club Meeting in Block B)', JSON.stringify({ source: 'Security Office', camera: 'CAM-04' }), 11);
evidenceStmt.run(12, 2, 'chat', 'Intercepted Chat', '[11:24 PM]\nUser_X: Did you get the file?\nShadowRoot: yes\nUser_X: from the server?\nShadowRoot: admin login was easier than expected\nUser_X: send it before morning', JSON.stringify({ source: 'Encrypted App', user: 'ShadowRoot', channel: '#leaks' }), null);

// Case 3
evidenceStmt.run(13, 3, 'html', 'Portal Login Source', '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <title>AAS - Faculty Login</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <div class="login-container">\n        <h2>Attendance Portal</h2>\n        <form action="/login" method="POST">\n            <input type="text" name="username" placeholder="Faculty ID">\n            <input type="password" name="password" placeholder="Password">\n            <button type="submit">Login</button>\n        </form>\n    </div>\n    <!-- DEBUG: The old v1 API is deprecated but still active for emergency DB rollbacks. -->\n    <!-- TODO: Remove /api/v1/attendance_override before final deployment. -->\n    <!-- Dev Auth Key: YWRtaW5fYmFja2Rvb3I= -->\n</body>\n</html>', JSON.stringify({ file: 'index.html', server: 'Apache/2.4.41' }), null);
evidenceStmt.run(14, 3, 'html', 'Portal Stylesheet (CSS)', 'body {\n    background-color: #f4f4f9;\n    font-family: "Courier New", Courier, monospace;\n}\n\n.login-container {\n    width: 300px;\n    margin: 100px auto;\n    padding: 20px;\n    border: 1px solid #ccc;\n}\n\n/* Hidden elements */\n.error-log {\n    visibility: hidden;\n}\n\n.debug-panel {\n    display: none; /* Custom override panel - property of P.S. Do not delete! */\n    position: absolute;\n    top: 0;\n}', JSON.stringify({ file: 'style.css', type: 'text/css' }), null);
evidenceStmt.run(15, 3, 'log', 'Auth Server Logs', '[2026-04-12 08:30:12] INFO: Successful login - FacultyID: F-402\n[2026-04-12 09:15:44] WARN: Failed login attempt - IP: 192.168.1.50\n[2026-04-12 23:45:01] INFO: POST /api/v1/attendance_override - Status: 200 OK - IP: 192.168.5.101\n[2026-04-12 23:45:05] INFO: POST /api/v1/attendance_override - Status: 200 OK - IP: 192.168.5.101\n[2026-04-13 23:50:12] INFO: POST /api/v1/attendance_override - Status: 200 OK - IP: 192.168.5.101\n[2026-04-14 08:00:00] INFO: Daily attendance report generated.', JSON.stringify({ server: 'AAS-Prod-Server', log_level: 'INFO/WARN' }), 13);
evidenceStmt.run(16, 3, 'chat', 'Intercepted Campus Chat', '[Campus_General_Channel]\nVikram: Bro, I don\'t even need to wake up for the 8 AM classes anymore. 100% attendance baby!\nRahul: Wait, how? Did you hack the AAS?\nVikram: I\'m basically a master hacker now. I got the ultimate bypass code.\nRahul: Prove it.\nVikram: SGV5LCBpdCdzIGp1c3QgYSBmYWtlIG1lZGljYWwgY2VydGlmaWNhdGUgbG9s\nVikram: Decode that if you can, script kiddie.', JSON.stringify({ source: 'Campus Discord', channel: '#general' }), null);
evidenceStmt.run(17, 3, 'code', 'Suspicious Script', 'import requests\nimport time\n\n# Target the legacy endpoint\nurl = "http://aas.college.edu/api/v1/attendance_override"\n\n# The real machine running this script\norigin_ip = "10.0.0.55"\n\n# The target we want the server logs to see (Tech Club President\'s IP)\nframed_ip = "192.168.5.101"\n\nheaders = {\n    "Authorization": "Bearer admin_backdoor",\n    "X-Forwarded-For": framed_ip, # This overrides the origin IP in poorly configured servers\n    "User-Agent": "Mozilla/5.0"\n}\n\npayload = {\n    "student_id": "BCA-2024-089",\n    "status": "PRESENT"\n}\n\nprint("Injecting attendance record...")\nresponse = requests.post(url, headers=headers, json=payload)\nprint(f"Status: {response.status_code}")', JSON.stringify({ language: 'python', location: 'Shared Drive /Temp' }), 15);
evidenceStmt.run(18, 3, 'email', 'IT Dept Internal Email', 'From: sysadmin@college.edu\nTo: teaching_assistants@college.edu\nSubject: URGENT: Lab Computers Left On\n\nDear TAs,\n\nPlease ensure you are shutting down the computers in the Database Lab (Subnet 10.0.0.x) before leaving. \n\nLast night, our network monitor detected outbound traffic coming from Machine #5 (IP: 10.0.0.55) at nearly midnight. If you are running long database queries overnight, please notify IT beforehand.\n\nRegards,\nIT Admin', JSON.stringify({ mail_server: 'Exchange', priority: 'High' }), 18);

// Case 4
evidenceStmt.run(19, 4, 'html', 'Junior Landing Page', '<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="theme.css">\n</head>\n<body>\n  <h1 class="alert-msg">System Maintenance</h1>\n  <p>Please wait while we update the portal.</p>\n  <!-- INTERNAL DEBUG CODE: DEV_HTM_2026 -->\n</body>\n</html>', JSON.stringify({ file: 'landing.html', status: 'staging' }), null);
evidenceStmt.run(20, 4, 'html', 'Debug Stylesheet (CSS)', '.alert-msg {\n  color: #E74C3C;\n  font-weight: bold;\n  text-align: center;\n}\n\n.hidden-panel {\n  display: none;\n  /* Use local_admin for access */\n}', JSON.stringify({ file: 'theme.css', author: 'Manoj' }), 20);
evidenceStmt.run(21, 4, 'code', 'Cleanup Script (Python)', '#!/usr/bin/python3\nimport os\n\ninternal_key = "PY_KEY_44"\n\ndef cleanup():\n    print("Cleaning up temporary files...")\n    # os.remove("/tmp/debug_logs.txt")\n\nif __name__ == "__main__":\n    cleanup()', JSON.stringify({ language: 'python', version: '3.10' }), 21);
evidenceStmt.run(22, 4, 'code', 'Math Verification (C)', '#include <stdio.h>\n\nint main() {\n    int a = 5;\n    int b = 5;\n    int c = 2;\n    // Verify the system logic\n    printf("Verification Code: %d\\n", a + b * c);\n    return 0;\n}', JSON.stringify({ language: 'c', compiler: 'gcc' }), 22);

console.log('Database initialized and seeded with hashed passwords.');
db.close();

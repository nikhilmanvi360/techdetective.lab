import { DatabaseSync as Database } from 'node:sqlite';
import path from 'path';
const dbPath = path.join(process.cwd(), 'database', 'lab.db');
const db = new Database(dbPath);
try {
  db.prepare(`
    INSERT INTO submissions (team_id, case_id, attacker_name, attack_method, prevention_measures, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(1, '1', 'test_attacker', 'test_method', 'test_prevention', 'correct');
  console.log("Success");
} catch(e) {
  console.error(e);
}

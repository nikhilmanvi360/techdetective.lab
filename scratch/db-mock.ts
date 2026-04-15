import { DatabaseSync as Database } from 'node:sqlite';
import path from 'path';

const ROOT_DIR = process.cwd();
const db = new Database(path.join(ROOT_DIR, 'database', 'lab.db'));

try {
  // Simulate the exact query
  const teamId = 1;
  const paramsId = '1'; // Express req.params are strings!
  const attackerName = 'Test';
  const attackMethod = 'Test';
  const preventionMeasures = 'Test';
  const status = 'incorrect';

  // 1. Check previous correct
  const previousCorrect = db.prepare(`SELECT 1 FROM submissions WHERE team_id = ? AND case_id = ? AND status = 'correct'`).get(teamId, paramsId);
  console.log("Previous correct:", previousCorrect);

  // 2. Insert
  db.prepare(`
    INSERT INTO submissions (team_id, case_id, attacker_name, attack_method, prevention_measures, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(teamId, paramsId, attackerName, attackMethod, preventionMeasures, status);

  console.log("Insert successful!");

  // 3. Select max hints
  const firstSolveRow = db.prepare(`
          SELECT MIN(solved_at) as start_time FROM solved_puzzles sp
          JOIN puzzles p ON sp.puzzle_id = p.id
          WHERE sp.team_id = ? AND p.case_id = ?
        `).get(teamId, paramsId) as any;
  console.log("firstSolveRow:", firstSolveRow);

} catch (e) {
  console.error("CAUGHT ERROR:", e);
}

import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'lab.db');
const db = new DatabaseSync(dbPath);

console.log('--- EVENT DATA ANALYSIS ---');

// 1. Team Summary
const teamsCount = db.prepare('SELECT COUNT(*) as count FROM teams').get();
console.log(`Total Teams Registered: ${teamsCount.count}`);

const teamsWithScore = db.prepare('SELECT COUNT(*) as count FROM teams WHERE score > 0').get();
console.log(`Active Teams (Score > 0): ${teamsWithScore.count}`);

// 2. Puzzle Difficulty Analysis (Most Failed Puzzles)
console.log('\n--- TOP 5 HARDEST PUZZLES (By Failed Attempts) ---');
const puzzleStats = db.prepare(`
  SELECT 
    p.id as puzzle_id, 
    p.question,
    COUNT(pa.id) as total_attempts,
    SUM(CASE WHEN pa.is_correct = 0 THEN 1 ELSE 0 END) as failed_attempts,
    SUM(CASE WHEN pa.is_correct = 1 THEN 1 ELSE 0 END) as successful_solves
  FROM puzzles p
  LEFT JOIN puzzle_attempts pa ON p.id = pa.puzzle_id
  GROUP BY p.id
  HAVING total_attempts > 0
  ORDER BY failed_attempts DESC
  LIMIT 5
`).all();

puzzleStats.forEach(p => {
  const failureRate = p.total_attempts > 0 ? ((Number(p.failed_attempts) / Number(p.total_attempts)) * 100).toFixed(1) : 0;
  console.log(`Puzzle #${p.puzzle_id}: "${p.question.substring(0, 50)}..."`);
  console.log(`   Failed: ${p.failed_attempts} | Success: ${p.successful_solves} | Failure Rate: ${failureRate}%`);
});

// 3. Hints Used
const hintsUsed = db.prepare('SELECT COUNT(*) as count FROM used_hints').get();
console.log(`\nTotal Hints Requested: ${hintsUsed.count}`);

// 4. Problematic Submissions (Incorrect Case Solves)
console.log('\n--- INCORRECT CASE SUBMISSIONS (Student Struggles) ---');
const incorrectSubmissions = db.prepare(`
  SELECT s.attacker_name, s.attack_method, s.prevention_measures, t.name as team_name, c.title as case_title
  FROM submissions s
  JOIN teams t ON s.team_id = t.id
  JOIN cases c ON s.case_id = c.id
  WHERE s.status = 'incorrect'
  ORDER BY s.submitted_at DESC
  LIMIT 10
`).all();

if (incorrectSubmissions.length === 0) {
  console.log('No incorrect case submissions found.');
} else {
  incorrectSubmissions.forEach(s => {
    console.log(`Team: ${s.team_name} | Case: ${s.case_title}`);
    console.log(`   Attempted Attacker: ${s.attacker_name}`);
    console.log(`   Method provided: ${s.attack_method.substring(0, 100)}...`);
  });
}

// 5. Successful Submissions Feedback (Qualitative data)
console.log('\n--- STUDENT EXPLANATIONS (Success Patterns) ---');
const successfulSubmissions = db.prepare(`
  SELECT attack_method, prevention_measures, t.name as team_name
  FROM submissions
  JOIN teams t ON submissions.team_id = t.id
  WHERE status = 'correct'
  LIMIT 3
`).all();

successfulSubmissions.forEach(s => {
  console.log(`Team: ${s.team_name}`);
  console.log(`   Method: ${s.attack_method}`);
  console.log(`   Prevention: ${s.prevention_measures}`);
});

db.close();

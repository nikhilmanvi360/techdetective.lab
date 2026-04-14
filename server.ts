import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync as Database } from 'node:sqlite';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const ROOT_DIR = process.cwd();

const JWT_SECRET = process.env.JWT_SECRET || 'tech-detective-secret-key';
const db = new Database(path.join(ROOT_DIR, 'database', 'lab.db'));

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, { cors: { origin: '*' } });
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(cors());
  app.use(express.json());

  // Socket.io connection
  io.on('connection', (socket) => {
    console.log('Client connected to live feed');
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Helper to emit live events
  const emitLiveEvent = (message: string, type: 'solve' | 'badge' | 'case' = 'solve') => {
    io.emit('live_event', { message, type, timestamp: new Date().toISOString() });
    io.emit('score_update'); // Tell clients to refresh scoreboard
  };

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Auth
  app.post('/api/auth/login', (req, res) => {
    const { teamName, password } = req.body;
    
    let team = db.prepare('SELECT * FROM teams WHERE name = ?').get(teamName) as any;
    
    if (!team) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const info = db.prepare('INSERT INTO teams (name, password) VALUES (?, ?)').run(teamName, hashedPassword);
      // Convert BigInt to Number to prevent JSON serialization errors
      team = { id: Number(info.lastInsertRowid), name: teamName, score: 0, is_disabled: 0 };
      emitLiveEvent(`New team registered: ${teamName}`, 'badge');
    } else {
      if (team.is_disabled) {
        return res.status(403).json({ error: 'Account disabled by administrator' });
      }
      const validPassword = bcrypt.compareSync(password, team.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    const token = jwt.sign({ id: team.id, name: team.name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, team: { id: team.id, name: team.name, score: team.score, is_disabled: !!team.is_disabled } });
  });

  // Team Profile
  app.get('/api/team/profile', authenticateToken, (req: any, res: any) => {
    const team = db.prepare('SELECT id, name, score, created_at, is_disabled FROM teams WHERE id = ?').get(req.user.id) as any;
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.is_disabled) return res.status(403).json({ error: 'Account disabled' });

    const solvedPuzzles = db.prepare(`
      SELECT p.id, p.question, p.points, sp.solved_at
      FROM puzzles p
      JOIN solved_puzzles sp ON p.id = sp.puzzle_id
      WHERE sp.team_id = ?
    `).all(req.user.id);

    const submissions = db.prepare(`
      SELECT s.*, c.title as case_title
      FROM submissions s
      JOIN cases c ON s.case_id = c.id
      WHERE s.team_id = ?
      ORDER BY s.submitted_at DESC
    `).all(req.user.id);

    const badges = db.prepare('SELECT badge_name, earned_at FROM team_badges WHERE team_id = ? ORDER BY earned_at DESC').all(req.user.id);

    res.json({ team, solvedPuzzles, submissions, badges });
  });

  // Dashboard / Cases
  app.get('/api/cases', authenticateToken, (req: any, res: any) => {
    const cases = db.prepare("SELECT * FROM cases WHERE status = 'active'").all();
    res.json(cases);
  });

  app.get('/api/cases/:id', authenticateToken, (req: any, res: any) => {
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id) as any;
    if (!caseData) return res.status(404).json({ error: 'Case not found' });
    
    const evidence = db.prepare(`
      SELECT e.id, e.type, e.title, e.metadata, e.required_puzzle_id,
             CASE 
               WHEN e.required_puzzle_id IS NULL THEN 0
               WHEN sp.puzzle_id IS NOT NULL THEN 0
               ELSE 1
             END as is_locked
      FROM evidence e
      LEFT JOIN solved_puzzles sp ON e.required_puzzle_id = sp.puzzle_id AND sp.team_id = ?
      WHERE e.case_id = ?
    `).all(req.user.id, req.params.id);

    const puzzles = db.prepare(`
      SELECT p.id, p.question, p.points, 
             uh.used_at as hint_used_at,
             CASE 
               WHEN uh.used_at IS NOT NULL AND datetime(uh.used_at, '+5 minutes') <= datetime('now') THEN p.hint 
               ELSE NULL 
             END as hint,
             CASE WHEN sp.puzzle_id IS NOT NULL THEN 1 ELSE 0 END as solved,
             CASE WHEN uh.puzzle_id IS NOT NULL THEN 1 ELSE 0 END as hint_used
      FROM puzzles p
      LEFT JOIN solved_puzzles sp ON p.id = sp.puzzle_id AND sp.team_id = ?
      LEFT JOIN used_hints uh ON p.id = uh.puzzle_id AND uh.team_id = ?
      WHERE p.case_id = ?
    `).all(req.user.id, req.user.id, req.params.id);

    const hintsUsedInCaseRow = db.prepare(`
      SELECT COUNT(*) as count FROM used_hints uh
      JOIN puzzles p ON uh.puzzle_id = p.id
      WHERE uh.team_id = ? AND p.case_id = ?
    `).get(req.user.id, req.params.id) as any;
    
    const hintsUsedInCase = hintsUsedInCaseRow ? hintsUsedInCaseRow.count : 0;
    const maxHints = 2;

    res.json({ ...caseData, evidence, puzzles, hintsUsedInCase, maxHints });
  });

  // Evidence Detail
  app.get('/api/evidence/:id', authenticateToken, (req: any, res: any) => {
    const item = db.prepare(`
      SELECT e.*, 
             CASE 
               WHEN e.required_puzzle_id IS NULL THEN 0
               WHEN sp.puzzle_id IS NOT NULL THEN 0
               ELSE 1
             END as is_locked
      FROM evidence e
      LEFT JOIN solved_puzzles sp ON e.required_puzzle_id = sp.puzzle_id AND sp.team_id = ?
      WHERE e.id = ?
    `).get(req.user.id, req.params.id) as any;

    if (!item) return res.status(404).json({ error: 'Evidence not found' });
    if (item.is_locked) return res.status(403).json({ error: 'Evidence is locked. Solve the required puzzle first.' });

    res.json(item);
  });

  // Puzzle Solve
  app.post('/api/puzzles/:id/solve', authenticateToken, (req: any, res: any) => {
    const { answer } = req.body;
    const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get(req.params.id) as any;
    
    if (!puzzle) return res.status(404).json({ error: 'Puzzle not found' });

    const isCorrect = puzzle.answer.toLowerCase().trim() === answer.toLowerCase().trim();
    
    // Log the attempt
    db.prepare('INSERT INTO puzzle_attempts (team_id, puzzle_id, is_correct) VALUES (?, ?, ?)').run(req.user.id, puzzle.id, isCorrect ? 1 : 0);

    if (isCorrect) {
      try {
        const hintUsed = db.prepare('SELECT 1 FROM used_hints WHERE team_id = ? AND puzzle_id = ?').get(req.user.id, puzzle.id);
        
        // First Blood Check
        const solveCountRow = db.prepare('SELECT COUNT(*) as count FROM solved_puzzles WHERE puzzle_id = ?').get(puzzle.id) as any;
        const solveCount = solveCountRow ? solveCountRow.count : 0;
        
        let firstBloodBonus = 0;
        if (solveCount === 0) firstBloodBonus = 50;
        else if (solveCount === 1) firstBloodBonus = 25;
        else if (solveCount === 2) firstBloodBonus = 10;

        const basePoints = hintUsed ? Math.floor(puzzle.points * 0.5) : puzzle.points;
        const totalPoints = basePoints + firstBloodBonus;

        db.prepare('INSERT INTO solved_puzzles (team_id, puzzle_id) VALUES (?, ?)').run(req.user.id, puzzle.id);
        db.prepare('UPDATE teams SET score = score + ? WHERE id = ?').run(totalPoints, req.user.id);
        
        // Emit live event
        const teamName = req.user.name;
        if (firstBloodBonus > 0) {
           emitLiveEvent(`${teamName} got FIRST BLOOD on Puzzle #${puzzle.id}! (+${firstBloodBonus} pts)`, 'solve');
        } else {
           emitLiveEvent(`${teamName} cracked Puzzle #${puzzle.id}!`, 'solve');
        }

        res.json({ success: true, points: totalPoints, basePoints, firstBloodBonus, hintUsed: !!hintUsed });
      } catch (e) {
        res.json({ success: false, message: 'Already solved' });
      }
    } else {
      res.json({ success: false, message: 'Incorrect answer' });
    }
  });

  // Request Hint
  app.post('/api/puzzles/:id/hint', authenticateToken, (req: any, res: any) => {
    const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get(req.params.id) as any;
    if (!puzzle) return res.status(404).json({ error: 'Puzzle not found' });

    const MAX_HINTS_PER_CASE = 2;
    const hintsUsedInCaseRow = db.prepare(`
      SELECT COUNT(*) as count FROM used_hints uh
      JOIN puzzles p ON uh.puzzle_id = p.id
      WHERE uh.team_id = ? AND p.case_id = ?
    `).get(req.user.id, puzzle.case_id) as any;
    
    const hintsUsedInCase = hintsUsedInCaseRow ? hintsUsedInCaseRow.count : 0;

    if (hintsUsedInCase >= MAX_HINTS_PER_CASE) {
      return res.status(403).json({ error: `Hint limit reached. You can only use ${MAX_HINTS_PER_CASE} hints per case.` });
    }

    try {
      db.prepare('INSERT INTO used_hints (team_id, puzzle_id) VALUES (?, ?)').run(req.user.id, puzzle.id);
      res.json({ success: true, message: 'Decryption initiated. Access granted in 5 minutes.' });
    } catch (e) {
      res.json({ success: true, message: 'Decryption already in progress or completed.' });
    }
  });

  // Final Submission
  app.post('/api/cases/:id/submit', authenticateToken, (req: any, res: any) => {
    const { attackerName, attackMethod, preventionMeasures } = req.body;
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id) as any;
    
    if (!caseData) return res.status(404).json({ error: 'Case not found' });

    const isCorrect = caseData.correct_attacker && caseData.correct_attacker.toLowerCase().trim() === attackerName.toLowerCase().trim();
    const status = isCorrect ? 'correct' : 'incorrect';
    const outcome = isCorrect ? 'CASE_SOLVED: The hacker has been apprehended.' : 'HACKER_ESCAPED: Your investigation led to the wrong suspect.';

    try {
      // Check if already submitted correctly
      const previousCorrect = db.prepare(`SELECT 1 FROM submissions WHERE team_id = ? AND case_id = ? AND status = 'correct'`).get(req.user.id, req.params.id);
      if (previousCorrect) {
        return res.status(400).json({ error: 'Case already solved' });
      }

      db.prepare(`
        INSERT INTO submissions (team_id, case_id, attacker_name, attack_method, prevention_measures, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.user.id, req.params.id, attackerName, attackMethod, preventionMeasures, status);

      let pointsAwarded = 0;
      let firstBloodBonus = 0;
      let badgesEarned: string[] = [];

      if (isCorrect) {
        // First Blood Check for Cases
        const solveCountRow = db.prepare(`SELECT COUNT(*) as count FROM submissions WHERE case_id = ? AND status = 'correct'`).get(req.params.id) as any;
        const solveCount = solveCountRow ? solveCountRow.count - 1 : 0; // -1 because we just inserted it
        
        if (solveCount === 0) firstBloodBonus = 100;
        else if (solveCount === 1) firstBloodBonus = 50;
        else if (solveCount === 2) firstBloodBonus = 25;

        pointsAwarded = caseData.points_on_solve + firstBloodBonus;
        db.prepare('UPDATE teams SET score = score + ? WHERE id = ?').run(pointsAwarded, req.user.id);

        // Check for "Lone Wolf" Badge (No hints used in this case)
        const hintsUsedRow = db.prepare(`
          SELECT COUNT(*) as count FROM used_hints uh
          JOIN puzzles p ON uh.puzzle_id = p.id
          WHERE uh.team_id = ? AND p.case_id = ?
        `).get(req.user.id, req.params.id) as any;
        
        if (hintsUsedRow && hintsUsedRow.count === 0) {
          try {
            db.prepare('INSERT INTO team_badges (team_id, badge_name) VALUES (?, ?)').run(req.user.id, 'Lone Wolf');
            badgesEarned.push('Lone Wolf');
            emitLiveEvent(`${req.user.name} earned the LONE WOLF badge!`, 'badge');
          } catch(e) {} // Ignore if already has badge
        }

        // Check for "Speed Demon" Badge (< 10 mins from first puzzle solve)
        const firstSolveRow = db.prepare(`
          SELECT MIN(solved_at) as start_time FROM solved_puzzles sp
          JOIN puzzles p ON sp.puzzle_id = p.id
          WHERE sp.team_id = ? AND p.case_id = ?
        `).get(req.user.id, req.params.id) as any;

        if (firstSolveRow && firstSolveRow.start_time) {
          const startTime = new Date(firstSolveRow.start_time.replace(' ', 'T') + 'Z').getTime();
          const now = Date.now();
          if ((now - startTime) < 10 * 60 * 1000) { // 10 minutes
            try {
              db.prepare('INSERT INTO team_badges (team_id, badge_name) VALUES (?, ?)').run(req.user.id, 'Speed Demon');
              badgesEarned.push('Speed Demon');
              emitLiveEvent(`${req.user.name} earned the SPEED DEMON badge!`, 'badge');
            } catch(e) {}
          }
        }

        emitLiveEvent(`${req.user.name} solved Case #${req.params.id}!`, 'case');
      }

      res.json({ 
        success: true, 
        message: outcome,
        isCorrect,
        pointsAwarded,
        firstBloodBonus,
        badgesEarned
      });
    } catch (e) {
      console.error('Submit Error:', e);
      res.status(500).json({ error: 'Failed to submit report' });
    }
  });

  // Scoreboard
  app.get('/api/scoreboard', (req, res) => {
    try {
      const scores = db.prepare('SELECT name, score FROM teams ORDER BY score DESC LIMIT 10').all();
      res.json(scores);
    } catch (error) {
      console.error('Scoreboard API Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Admin: All Submissions
  app.get('/api/admin/submissions', authenticateToken, (req: any, res: any) => {
    // Simple admin check: team name must be CCU_ADMIN
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const submissions = db.prepare(`
      SELECT s.*, t.name as team_name, c.title as case_title
      FROM submissions s
      JOIN teams t ON s.team_id = t.id
      JOIN cases c ON s.case_id = c.id
      ORDER BY s.submitted_at DESC
    `).all();
    res.json(submissions);
  });

  // Admin: Master Answer Key
  app.get('/api/admin/master-key', authenticateToken, (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const cases = db.prepare('SELECT id, title, correct_attacker, points_on_solve FROM cases').all();
    const puzzles = db.prepare('SELECT id, case_id, question, answer, points, hint FROM puzzles').all();

    const masterKey = cases.map((c: any) => ({
      ...c,
      puzzles: puzzles.filter((p: any) => p.case_id === c.id)
    }));

    res.json(masterKey);
  });

  // Admin: Manage Teams
  app.get('/api/admin/teams', authenticateToken, (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const teams = db.prepare('SELECT id, name, score, created_at, is_disabled FROM teams ORDER BY score DESC').all();
    res.json(teams);
  });

  app.put('/api/admin/teams/:id', authenticateToken, (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const { name, score, is_disabled } = req.body;
    
    try {
      db.prepare(`
        UPDATE teams 
        SET name = ?, score = ?, is_disabled = ? 
        WHERE id = ?
      `).run(name, score, is_disabled ? 1 : 0, req.params.id);
      
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update team' });
    }
  });

  // Admin: Case Builder Endpoints
  app.post('/api/admin/cases', authenticateToken, (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { title, description, difficulty, correct_attacker, points_on_solve } = req.body;
    try {
      const info = db.prepare('INSERT INTO cases (title, description, difficulty, correct_attacker, points_on_solve) VALUES (?, ?, ?, ?, ?)').run(title, description, difficulty, correct_attacker, points_on_solve);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (e) {
      res.status(500).json({ error: 'Failed to create case' });
    }
  });

  app.post('/api/admin/evidence', authenticateToken, (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { case_id, type, title, content, metadata, required_puzzle_id } = req.body;
    try {
      const info = db.prepare('INSERT INTO evidence (case_id, type, title, content, metadata, required_puzzle_id) VALUES (?, ?, ?, ?, ?, ?)').run(case_id, type, title, content, metadata, required_puzzle_id || null);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (e) {
      res.status(500).json({ error: 'Failed to create evidence' });
    }
  });

  app.post('/api/admin/puzzles', authenticateToken, (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { case_id, question, answer, points, hint } = req.body;
    try {
      const info = db.prepare('INSERT INTO puzzles (case_id, question, answer, points, hint) VALUES (?, ?, ?, ?, ?)').run(case_id, question, answer, points, hint);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (e) {
      res.status(500).json({ error: 'Failed to create puzzle' });
    }
  });

  // Admin: Analytics
  app.get('/api/admin/analytics', authenticateToken, (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
      const stats = db.prepare(`
        SELECT 
          p.id as puzzle_id, 
          p.question,
          COUNT(pa.id) as total_attempts,
          SUM(CASE WHEN pa.is_correct = 0 THEN 1 ELSE 0 END) as failed_attempts
        FROM puzzles p
        LEFT JOIN puzzle_attempts pa ON p.id = pa.puzzle_id
        GROUP BY p.id
        HAVING total_attempts > 0
        ORDER BY failed_attempts DESC
      `).all();
      res.json(stats);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });


  // --- Vite / Static Serving ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Tech Detective Server running at http://localhost:${PORT}`);
  });
}

startServer();

import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { supabase } from './src/lib/supabase';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';
import { isFuzzyMatch } from './src/utils/fuzzyMatch';

// Handle global crashes
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Engine imports
import * as eventStore from './src/engine/eventStore';
import * as caseEngine from './src/engine/caseEngine';
import * as adversary from './src/engine/adversary';
import * as shopEngine from './src/engine/shopEngine';
import { codeExecutionQueue } from './src/lib/queue';
import { GameStateManager, GameState } from './src/engine/gameStateManager';
import { CaseLoader } from './src/engine/caseLoader';
import { round0Manager } from './src/engine/round0Manager';
import { Round3Manager } from './src/engine/round3Manager';

const ROOT_DIR = process.cwd();
const JWT_SECRET = process.env.JWT_SECRET || 'tech-detective-secret-key';
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'tech-detective-secret-key') {
  console.error('[FATAL] JWT_SECRET must be set in production!');
  process.exit(1);
}
const isTest = process.env.NODE_ENV === 'test';

// =========================================================
// Rate limiters
// =========================================================
const loginLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: isTest ? 100 : 10,
  message: { error: 'Security lockout active. Please wait 5 seconds before retrying.' },
  validate: false
});

const submissionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isTest ? 20 : 10,
  keyGenerator: (req: any) => {
    // Custom key gen: use user ID if authenticated, else IP
    return req.user?.id ? `user_${req.user.id}` : req.ip;
  },
  message: { error: 'Submission rate limit exceeded. Slow down, detective.' },
  validate: false
});

// =========================================================
// Global Memory State for Admin Overrides
// =========================================================
export const teamTokenVersions = new Map<number, number>();
// In-memory fallback for investigation rooms if DB table is missing
const memoryRooms = new Map<string, any>();
const campaignStateMemory = new Map<number, any>();

// =========================================================
// App & Socket.IO setup
// =========================================================
export const app = express();
const server = http.createServer(app);
export const io = new SocketIOServer(server, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling'], // polling fallback for Render
});
GameStateManager.setIo(io);

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[EXPRESS ERROR]', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// =========================================================
// Helpers
// =========================================================
const emitLiveEvent = (message: string, type: 'solve' | 'badge' | 'case' = 'solve') => {
  io.emit('live_event', { message, type, timestamp: new Date().toISOString() });
  io.emit('score_update');
};

// =========================================================
// Auth Middleware
// =========================================================
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      const status = err.name === 'TokenExpiredError' ? 401 : 403;
      const message = err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Forbidden';
      return res.status(status).json({ error: message });
    }
    // Kill Switch: verify token version is still valid
    const min_version = teamTokenVersions.get(user.id) || 1;
    if ((user.tokenVersion || 1) < min_version) {
      return res.status(401).json({ error: 'Session invalidated by administrator. Please log in again.' });
    }

    req.user = user;
    next();
  });
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// =========================================================
// Main Server Bootstrap
// =========================================================
async function startServer() {
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // Load token versions for Kill Switch (#6)
  const { data: teams } = await supabase.from('teams').select('id, token_version');
  if (teams) {
    teams.forEach(t => teamTokenVersions.set(t.id, t.token_version || 1));
  }

  // -------------------------------------------------------
  // SOCKET.IO: Multi-Room Management
  // -------------------------------------------------------
  io.on('connection', (socket) => {
    // Other socket connections if any
  });

  // =========================================================
  // PUBLIC ROUTER — No authentication required
  // =========================================================
  const publicRouter = express.Router();

  publicRouter.get('/health', (req, res) => res.json({ status: 'UP', timestamp: new Date().toISOString() }));



  publicRouter.get('/cases', async (req, res) => {
    try {
      const { data: dbCases } = await supabase.from('cases').select('*').eq('status', 'active');
      const jsonCases = await CaseLoader.listAllCases();
      const allCases = [
        ...(dbCases || []).map(c => ({
          id: c.id,
          title: c.title,
          difficulty: c.difficulty,
          points: c.points_on_solve,
          round: c.round || 'ROUND_1',
          source: 'db'
        })),
        ...jsonCases.map(c => ({
          id: c.id,
          title: c.title,
          difficulty: 'Dynamic',
          points: c.points,
          round: c.round,
          source: 'json'
        }))
      ];
      res.json(allCases);
    } catch (err) {
      res.status(500).json({ error: 'Failed to load investigations.' });
    }
  });

  publicRouter.get('/cases/:id', async (req, res) => {
    const { id } = req.params;
    try {
      // 1. Try JSON Case Loader
      if (id.startsWith('mission-')) {
        const jsonCase = await CaseLoader.getCaseById(id);
        if (jsonCase) return res.json({
          ...jsonCase,
          evidence: [],
          puzzles: []
        });
      }

      // 2. Fallback to Supabase
      const { data: dbCase, error } = await supabase.from('cases').select('*').eq('id', id).single();
      if (error || !dbCase) return res.status(404).json({ error: 'Investigation dossier not found.' });

      // Fetch associated evidence and puzzles
      const { data: evidence } = await supabase.from('evidence').select('*').eq('case_id', id);
      const { data: puzzles } = await supabase.from('puzzles').select('*').eq('case_id', id);

      res.json({
        ...dbCase,
        evidence: evidence || [],
        puzzles: puzzles || []
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve mission dossier.' });
    }
  });


  publicRouter.post('/auth/login', loginLimiter, async (req: any, res: any) => {
    const { teamName, password } = req.body;
    if (!teamName || !password) return res.status(400).json({ error: 'Team name and password are required' });
    let assignedRole = 'detective';
    if (teamName === 'CCU_ADMIN') assignedRole = 'admin';
    else if (teamName.toUpperCase().endsWith('_ANALYST')) assignedRole = 'analyst';
    else if (teamName.toUpperCase().endsWith('_HACKER')) assignedRole = 'hacker';

    try {
      const { data: team, error: fetchError } = await supabase
        .from('teams').select('*').eq('name', teamName).single();

      if (fetchError || !team) {
        // Auto-register new team
        const hashedPassword = bcrypt.hashSync(password, 10);
        const { data: newTeam, error: insertError } = await supabase
          .from('teams').insert([{ name: teamName, password: hashedPassword, token_version: 1 }]).select().single();
        if (insertError) return res.status(500).json({ error: 'Failed to create team. Check DB connection.' });
        emitLiveEvent(`New team registered: ${teamName}`, 'badge');
        const token = jwt.sign({ id: newTeam.id, name: newTeam.name, role: assignedRole, tokenVersion: 1 }, JWT_SECRET, { expiresIn: '48h' });
        return res.json({ token, team: { id: newTeam.id, name: newTeam.name, score: newTeam.score || 0, role: assignedRole } });
      }

      if (team.is_disabled) return res.status(403).json({ error: 'Account disabled by administrator' });
      if (!bcrypt.compareSync(password, team.password)) return res.status(401).json({ error: 'Invalid password' });

      // Load correct token version
      const currentTokenVersion = team.token_version || 1;
      teamTokenVersions.set(team.id, currentTokenVersion);

      const token = jwt.sign({ id: team.id, name: team.name, role: assignedRole, tokenVersion: currentTokenVersion }, JWT_SECRET, { expiresIn: '48h' });
      res.json({ token, team: { id: team.id, name: team.name, score: team.score || 0, is_disabled: !!team.is_disabled, role: assignedRole } });
    } catch (err: any) {
      console.error('[AUTH] Login error:', err.message);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  app.use('/api', publicRouter);

  // =========================================================
  // PROTECTED ROUTER — Requires valid JWT
  // =========================================================
  const protectedRouter = express.Router();
  protectedRouter.use(authenticateToken);
  protectedRouter.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.path}`);
    next();
  });

  // --- Coding Sandbox (NEW) ---
  protectedRouter.post('/missions/:id/run', async (req: any, res: any) => {
    const { code } = req.body;
    const { id } = req.params;
    console.log(`[SANDBOX] Run requested for mission ${id}`);

    try {
      let missionData: any = null;

      // Handle Dynamic JSON Cases
      if (id.startsWith('mission-')) {
        missionData = await CaseLoader.getCaseById(id);
      } else {
        const { data, error } = await supabase.from('cases').select('*').eq('id', id).single();
        if (!error) missionData = data;
      }

      if (!missionData) return res.status(404).json({ error: 'Mission dossier not found.' });

      // 1. ADD JOB TO BULLMQ QUEUE
      const job = await codeExecutionQueue.add(`run-${id}-${req.user.id}`, {
        code: code || '',
        missionId: id,
        teamId: req.user.id,
        language: missionData.check?.piston_language || 'javascript',
      });

      console.log(`[QUEUE] Enqueued Job #${job.id} for Mission ${id}`);

      // 2. Return 202 Accepted with Job ID
      res.status(202).json({
        message: 'Analysis enqueued',
        jobId: job.id,
      });

      // 3. LISTEN FOR COMPLETION (In a real high-scale app, we'd use a separate listener or Redis Pub/Sub)
      // For this implementation, we monitor the job and emit via Socket.io when done.
      const waitForResult = async () => {
        try {
          const result = await job.waitUntilFinished(undefined, 30000); // 30s timeout
          io.emit('execution_complete', {
            teamId: req.user.id,
            jobId: job.id,
            result,
          });
        } catch (err: any) {
          io.emit('execution_failed', {
            teamId: req.user.id,
            jobId: job.id,
            error: err.message,
          });
        }
      };

      waitForResult().catch(e => console.error('[QUEUE] Async Wait Error:', e.message));
    } catch (err: any) {
      console.error(`[SANDBOX] Queue error:`, err.message);
      res.status(500).json({ error: 'Failed to enqueue analysis.' });
    }
  });

  protectedRouter.post('/missions/:id/submit', async (req: any, res: any) => {
    const { code, output } = req.body;
    const { id } = req.params;

    try {
      let isDb = false;
      let missionData: any = null;

      if (id.startsWith('mission-')) {
        missionData = await CaseLoader.getCaseById(id);
      } else {
        const { data, error } = await supabase.from('cases').select('*').eq('id', id).single();
        if (!error && data) {
          missionData = data;
          isDb = true;
        }
      }

      if (!missionData) return res.status(404).json({ error: 'Mission not found' });

      // Check if already cleared
      let previousCorrect = null;
      if (isDb) {
        const { data } = await supabase.from('submissions').select('1')
          .eq('team_id', req.user.id).eq('case_id', id).eq('status', 'correct').single();
        previousCorrect = data;
      } else {
        const { data } = await supabase.from('score_events').select('1')
          .eq('team_id', req.user.id).eq('event_type', 'case_solve').filter('metadata->>case_id', 'eq', id).single();
        previousCorrect = data;
      }
      if (previousCorrect) return res.status(400).json({ error: 'Mission already cleared' });

      const { validateOutput } = await import('./src/engine/sandboxEngine');

      let expectedOutput = '';
      if (isDb) {
        try {
          const desc = typeof missionData.description === 'string' ? JSON.parse(missionData.description) : missionData.description;
          expectedOutput = desc?.expected_output || '';
        } catch (e) { }
      } else {
        expectedOutput = missionData.check?.expected_output || '';
      }

      const isCorrect = validateOutput(output || '', expectedOutput);

      if (isDb) {
        await supabase.from('submissions').insert([{
          team_id: req.user.id, case_id: parseInt(id),
          attacker_name: (output || '').slice(0, 200),
          attack_method: 'detective_script',
          prevention_measures: code ? code.slice(0, 500) : '',
          status: isCorrect ? 'correct' : 'incorrect',
        }]);
      }

      let pointsAwarded = 0;
      if (isCorrect) {
        const solveResult = await eventStore.appendEvent({
          teamId: req.user.id, eventType: 'case_solve',
          basePoints: isDb ? missionData.points_on_solve : missionData.points,
          metadata: { case_id: id }
        });
        pointsAwarded = solveResult.finalPoints;
        emitLiveEvent(`${req.user.name} cracked Mission #${id}: ${missionData.title}!`, 'case');
      }

      res.json({
        success: true,
        isCorrect,
        pointsAwarded,
        message: isCorrect
          ? `MISSION CLEARED — ${pointsAwarded} XP awarded.`
          : 'OUTPUT MISMATCH — Refine your logic and try again.',
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Submission failed' });
    }
  });

  // --- Cases ---
  protectedRouter.get('/cases', async (req: any, res: any) => {
    try {
      // 1. Load DB cases
      const { data: dbCases, error: casesError } = await supabase.from('cases').select('*').order('id', { ascending: true });
      if (casesError) return res.status(500).json({ error: 'Failed to fetch cases' });

      // 2. Load JSON missions
      const jsonCases = await CaseLoader.listAllCases();

      // 3. Check solve status
      const { data: solvedSubmissions } = await supabase.from('submissions')
        .select('case_id')
        .eq('team_id', req.user.id)
        .eq('status', 'correct');
      const solvedIds = new Set(solvedSubmissions?.map(s => s.case_id.toString()) || []);

      // Also check score_events for JSON missions
      const { data: solvedEvents } = await supabase.from('score_events')
        .select('metadata')
        .eq('team_id', req.user.id)
        .eq('event_type', 'case_solve');
      solvedEvents?.forEach(e => {
        if (e.metadata && e.metadata.case_id) solvedIds.add(e.metadata.case_id.toString());
      });

      // 4. Merge
      const allCases = [
        ...(dbCases || []).map(c => ({
          ...c,
          points: c.points_on_solve,
          round: c.round || 'ROUND_1',
          source: 'db',
          status: solvedIds.has(c.id.toString()) ? 'solved' : c.status || 'active'
        })),
        ...jsonCases.map(c => ({
          id: c.id,
          title: c.title,
          difficulty: 'Dynamic',
          points: c.points,
          round: c.round,
          source: 'json',
          status: solvedIds.has(c.id.toString()) ? 'solved' : 'active'
        }))
      ];

      res.json(allCases);
    } catch (err) {
      res.status(500).json({ error: 'Failed to load investigations' });
    }
  });

  protectedRouter.get('/cases/:id/state', async (req: any, res: any) => {
    const state = await caseEngine.getCaseState(parseInt(req.params.id), req.user.id);
    res.json(state);
  });

  protectedRouter.get('/cases/:id', async (req: any, res: any) => {
    const { data: caseData, error: caseError } = await supabase
      .from('cases').select('*').eq('id', req.params.id).single();
    if (caseError || !caseData) return res.status(404).json({ error: 'Case not found' });

    try {
      caseData.metadata = JSON.parse(caseData.description) || {};
    } catch (e) {
      caseData.metadata = {};
    }

    const { data: completion } = await supabase.from('submissions').select('1')
      .eq('team_id', req.user.id).eq('case_id', req.params.id).eq('status', 'correct').single();
    const isCompleted = !!completion;

    let evidenceQuery = supabase.from('evidence')
      .select('id, type, title, metadata, required_puzzle_id, unlock_at').eq('case_id', req.params.id);

    if (req.user.role !== 'admin') {
      if (req.user.role === 'hacker') evidenceQuery = evidenceQuery.in('type', ['log', 'html', 'code']);
      else if (req.user.role === 'analyst') evidenceQuery = evidenceQuery.in('type', ['chat', 'email']);
    }

    const { data: evidence } = await evidenceQuery;
    const purchasedEvidenceIds = await shopEngine.getPurchasedEvidence(req.user.id, parseInt(req.params.id));
    const { data: solvedPuzzles } = await supabase.from('solved_puzzles').select('puzzle_id').eq('team_id', req.user.id);
    const solvedPuzzleIds = new Set(solvedPuzzles?.map(p => p.puzzle_id));
    const { data: puzzles } = await supabase.from('puzzles').select('*').eq('case_id', req.params.id);
    const { data: hintsUsed } = await supabase.from('used_hints').select('puzzle_id, used_at').eq('team_id', req.user.id);
    const usedHintsMap = new Map(hintsUsed?.map(h => [h.puzzle_id, h.used_at]));
    const purchasedHintPuzzleIds = await shopEngine.getPurchasedHints(req.user.id, parseInt(req.params.id));
    const dynamicState = await caseEngine.getCaseState(parseInt(req.params.id), req.user.id);
    const encryptedIds = new Set(dynamicState.encrypted_evidence || []);

    const now = new Date().getTime();

    const evidenceWithStatus = evidence?.map((e: any) => {
      let timeLocked = false;
      if (e.unlock_at) {
        const unlockTime = new Date(e.unlock_at).getTime();
        if (unlockTime > now) timeLocked = true;
      }
      return {
        ...e,
        is_locked: ((e.required_puzzle_id && !solvedPuzzleIds.has(e.required_puzzle_id)) || timeLocked) && !purchasedEvidenceIds.includes(e.id) && req.user.role !== 'admin' && req.user.name !== 'CCU_ADMIN',
        is_encrypted: encryptedIds.has(e.id),
        time_locked: timeLocked && req.user.role !== 'admin' && req.user.name !== 'CCU_ADMIN',
        unlock_at: e.unlock_at
      }
    });

    const puzzlesWithStatus = puzzles?.map((p: any) => {
      const hintUsedAt = usedHintsMap.get(p.id);
      const isSolved = solvedPuzzleIds.has(p.id);
      const isPurchased = purchasedHintPuzzleIds.includes(p.id);
      const isHintAvailable = isPurchased || (hintUsedAt && (new Date(hintUsedAt).getTime() + 5 * 60 * 1000) <= Date.now());
      const isLockedByDependency = p.depends_on_puzzle_id ? !solvedPuzzleIds.has(p.depends_on_puzzle_id) : false;

      return {
        id: p.id, question: p.question, points: p.points, has_hint: !!p.hint,
        hint: isHintAvailable ? p.hint : null, solved: isSolved ? 1 : 0,
        hint_used: (hintUsedAt || isPurchased) ? 1 : 0, hint_used_at: hintUsedAt,
        is_purchased_hint: isPurchased,
        is_locked: isLockedByDependency && req.user.role !== 'admin' && req.user.name !== 'CCU_ADMIN',
        depends_on_puzzle_id: p.depends_on_puzzle_id
      };
    });

    const hintsUsedInCase = hintsUsed?.filter(h => puzzles?.some(p => p.id === h.puzzle_id)).length || 0;
    res.json({ ...caseData, evidence: evidenceWithStatus, puzzles: puzzlesWithStatus, hintsUsedInCase, maxHints: 2, isCompleted, dynamicState });
  });

  protectedRouter.post('/cases/:id/submit', submissionLimiter, async (req: any, res: any) => {
    const { attackerName, attackMethod, preventionMeasures } = req.body;
    const { data: caseData, error: caseError } = await supabase.from('cases').select('*').eq('id', req.params.id).single();
    if (caseError || !caseData) return res.status(404).json({ error: 'Case not found' });

    // Role Specialization Engine (#1)
    const { data: caseEvidence } = await supabase.from('evidence').select('type, required_puzzle_id').eq('case_id', req.params.id).not('required_puzzle_id', 'is', null);
    const { data: solvedPuzzles } = await supabase.from('solved_puzzles').select('puzzle_id').eq('team_id', req.user.id);
    if (caseEvidence && solvedPuzzles) {
      const solvedIds = new Set(solvedPuzzles.map(sp => sp.puzzle_id));
      const hackerEv = caseEvidence.filter((e: any) => ['log', 'html', 'code'].includes(e.type));
      const analystEv = caseEvidence.filter((e: any) => ['chat', 'email'].includes(e.type));

      const hasHackerEvSolved = hackerEv.length === 0 || hackerEv.some((e: any) => solvedIds.has(e.required_puzzle_id));
      const hasAnalystEvSolved = analystEv.length === 0 || analystEv.some((e: any) => solvedIds.has(e.required_puzzle_id));

      if (!hasHackerEvSolved || !hasAnalystEvSolved) {
        return res.status(403).json({ error: 'Team Collaboration Required: Your team must investigate both the Technical (Hacker) and Communication (Analyst) evidence trails before submitting.' });
      }
    }

    // Fuzzy Match Validation (#2)
    const isCorrect = isFuzzyMatch(attackerName || '', caseData.correct_attacker || '');
    const status = isCorrect ? 'correct' : 'incorrect';

    try {
      const { data: previousCorrect } = await supabase.from('submissions').select('1')
        .eq('team_id', req.user.id).eq('case_id', req.params.id).eq('status', 'correct').single();
      if (previousCorrect) return res.status(400).json({ error: 'Case already solved' });

      await supabase.from('submissions').insert([{
        team_id: req.user.id, case_id: req.params.id,
        attacker_name: attackerName, attack_method: attackMethod,
        prevention_measures: preventionMeasures, status
      }]);

      let pointsAwarded = 0, firstBloodBonus = 0, multiplierApplied = null;
      const badgesEarned: string[] = [];

      if (isCorrect) {
        const { count: solveCount } = await supabase.from('submissions').select('*', { count: 'exact', head: true })
          .eq('case_id', req.params.id).eq('status', 'correct');
        const count = (solveCount || 0) - 1;
        const fbBonus = count === 0 ? 50 : count === 1 ? 25 : count === 2 ? 10 : 0;

        const solveResult = await eventStore.appendEvent({
          teamId: req.user.id, eventType: 'case_solve',
          basePoints: caseData.points_on_solve, metadata: { case_id: req.params.id }
        });
        pointsAwarded = solveResult.finalPoints;
        multiplierApplied = solveResult.multiplierApplied;

        if (fbBonus > 0) {
          const fbResult = await eventStore.appendEvent({
            teamId: req.user.id, eventType: 'first_blood',
            basePoints: fbBonus, metadata: { case_id: req.params.id, position: count + 1 }
          });
          firstBloodBonus = fbResult.finalPoints;
          pointsAwarded += firstBloodBonus;
        }

        const { count: hintsUsed } = await supabase.from('used_hints')
          .select('*, puzzles!inner(*)', { count: 'exact', head: true })
          .eq('team_id', req.user.id).eq('puzzles.case_id', req.params.id);
        if (hintsUsed === 0) {
          const { error: badgeError } = await supabase.from('team_badges').insert([{ team_id: req.user.id, badge_name: 'Lone Wolf' }]);
          if (!badgeError) {
            badgesEarned.push('Lone Wolf');
            emitLiveEvent(`${req.user.name} earned the LONE WOLF badge!`, 'badge');
          }
        }

        emitLiveEvent(`${req.user.name} solved Case #${req.params.id}!`, 'case');
        adversary.evaluateAdversary(io).catch(e => console.error('Adversary eval error:', e));
      }

      const outcome = isCorrect ? 'CASE_SOLVED: The hacker has been apprehended.' : 'HACKER_ESCAPED: Wrong suspect.';
      res.json({ success: true, message: outcome, isCorrect, pointsAwarded, firstBloodBonus, badgesEarned, multiplierApplied });
    } catch (e) {
      console.error('Submit Error:', e);
      res.status(500).json({ error: 'Failed to submit report' });
    }
  });

  protectedRouter.get('/r3/state', (req: any, res: any) => {
    res.json(Round3Manager.getState());
  });

  protectedRouter.get('/r3/neural/fragment', (req: any, res: any) => {
    // Deterministic assignment based on teamId
    const teamId = req.user.id;
    const index = ((teamId * 2) % 32); 
    const fragment = Round3Manager.assignNeuralFragment(teamId, index);
    res.json(fragment);
  });

  protectedRouter.post('/r3/neural/submit', (req: any, res: any) => {
    const { segment } = req.body;
    const result = Round3Manager.submitNeuralSegment(req.user.id, segment);
    if (result.success) res.json(result);
    else res.status(400).json(result);
  });

  // --- Campaign Map State (Round 2) ---
  protectedRouter.get('/campaign/state', async (req: any, res: any) => {
    try {
      const { data, error } = await supabase
        .from('case_team_state')
        .select('state')
        .eq('case_id', 999)
        .eq('team_id', req.user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Campaign state fetch error:', error);
        return res.json(campaignStateMemory.get(req.user.id) || null);
      }

      const state = data?.state || campaignStateMemory.get(req.user.id) || null;
      res.json(state);
    } catch (e) {
      console.error('Campaign state fetch error:', e);
      res.json(campaignStateMemory.get(req.user.id) || null);
    }
  });

  protectedRouter.post('/campaign/state', async (req: any, res: any) => {
    try {
      const { state } = req.body;
      campaignStateMemory.set(req.user.id, state);
      const { error } = await supabase
        .from('case_team_state')
        .upsert({
          case_id: 999,
          team_id: req.user.id,
          state: state
        }, { onConflict: 'case_id,team_id' });
        
      if (error) {
        console.error('Campaign state save error:', error);
        return res.json({ success: true, fallback: true });
      }
      res.json({ success: true });
    } catch (e) {
      console.error('Campaign state save error:', e);
      res.json({ success: true, fallback: true });
    }
  });

  // --- Evidence ---
  protectedRouter.get('/evidence/:id', async (req: any, res: any) => {
    const { data: item, error } = await supabase.from('evidence').select('*').eq('id', req.params.id).single();
    if (error || !item) return res.status(404).json({ error: 'Evidence not found' });

    if (item.required_puzzle_id) {
      const { data: solve } = await supabase.from('solved_puzzles').select('1')
        .eq('team_id', req.user.id).eq('puzzle_id', item.required_puzzle_id).single();
      if (!solve) return res.status(403).json({ error: 'Evidence is locked. Solve the required puzzle first.' });
    }

    if (item.unlock_at && new Date(item.unlock_at).getTime() > new Date().getTime()) {
      return res.status(403).json({ error: 'Evidence is time-locked by the administrator.' });
    }

    const state = await caseEngine.getCaseState(item.case_id, req.user.id);
    if (state.encrypted_evidence?.includes(item.id)) {
      return res.status(403).json({
        error: 'EVALUATION_ERROR: Byte-stream corrupted by Adversary action.',
        is_encrypted: true
      });
    }
    res.json(item);
  });

  // --- Puzzles ---
  protectedRouter.post('/puzzles/:id/solve', submissionLimiter, async (req: any, res: any) => {
    const { answer } = req.body;
    const { data: puzzle, error: puzzleError } = await supabase.from('puzzles').select('*').eq('id', req.params.id).single();
    if (puzzleError || !puzzle) return res.status(404).json({ error: 'Puzzle not found' });

    if (puzzle.depends_on_puzzle_id) {
      const { data: solve } = await supabase.from('solved_puzzles').select('1')
        .eq('team_id', req.user.id).eq('puzzle_id', puzzle.depends_on_puzzle_id).single();
      if (!solve && req.user.role !== 'admin' && req.user.name !== 'CCU_ADMIN') return res.status(403).json({ success: false, message: 'Dependency locked. Solve the required puzzle first.' });
    }

    const caseState = await caseEngine.getCaseState(puzzle.case_id, req.user.id);
    if (caseState.lockouts[puzzle.id] && new Date(caseState.lockouts[puzzle.id]) > new Date()) {
      return res.status(429).json({
        success: false,
        message: `FIREWALL ACTIVE: Task locked until ${new Date(caseState.lockouts[puzzle.id]).toLocaleTimeString()}`,
        lockout_until: caseState.lockouts[puzzle.id]
      });
    }

    // Fuzzy Match Validation (#2)
    const isCorrect = isFuzzyMatch(answer || '', puzzle.answer || '');
    await supabase.from('puzzle_attempts').insert([{ team_id: req.user.id, puzzle_id: puzzle.id, is_correct: isCorrect }]);

    const engineResult = await caseEngine.evaluatePostAttempt(puzzle.case_id, req.user.id, puzzle.id, isCorrect);
    for (const msg of engineResult.messages) {
      io.emit('live_event', { message: msg, type: 'case', timestamp: new Date().toISOString() });
    }

    if (isCorrect) {
      try {
        const { data: hintUsed } = await supabase.from('used_hints').select('1')
          .eq('team_id', req.user.id).eq('puzzle_id', puzzle.id).single();
        const { count: solveCount } = await supabase.from('solved_puzzles').select('*', { count: 'exact', head: true }).eq('puzzle_id', puzzle.id);
        const basePoints = hintUsed ? Math.floor(puzzle.points * 0.5) : puzzle.points;
        const firstBloodBonus = (solveCount || 0) === 0 ? 50 : solveCount === 1 ? 25 : solveCount === 2 ? 10 : 0;

        const { error: solveError } = await supabase.from('solved_puzzles').insert([{ team_id: req.user.id, puzzle_id: puzzle.id }]);
        if (solveError) return res.json({ success: false, message: 'Already solved' });

        const solveResult = await eventStore.appendEvent({
          teamId: req.user.id, eventType: 'puzzle_solve', basePoints,
          metadata: { puzzle_id: puzzle.id, case_id: puzzle.case_id, hint_used: !!hintUsed }
        });

        let fbResult = { finalPoints: 0, multiplierApplied: null as number | null };
        if (firstBloodBonus > 0) {
          fbResult = await eventStore.appendEvent({
            teamId: req.user.id, eventType: 'first_blood', basePoints: firstBloodBonus,
            metadata: { puzzle_id: puzzle.id, position: (solveCount || 0) + 1 }
          });
        }

        const totalPoints = solveResult.finalPoints + fbResult.finalPoints;
        emitLiveEvent(firstBloodBonus > 0
          ? `${req.user.name} got FIRST BLOOD on Puzzle #${puzzle.id}! (+${fbResult.finalPoints} pts)`
          : `${req.user.name} cracked Puzzle #${puzzle.id}!`
        );
        adversary.evaluateAdversary(io).catch(e => console.error('Adversary eval error:', e));

        res.json({
          success: true, points: totalPoints,
          basePoints: solveResult.finalPoints, firstBloodBonus: fbResult.finalPoints,
          hintUsed: !!hintUsed, multiplierApplied: solveResult.multiplierApplied,
          engineMessages: engineResult.messages,
          message: `Received ${totalPoints} XP`
        });
      } catch (e) {
        res.json({ success: false, message: 'Already solved' });
      }
    } else {
      res.json({
        success: false, message: 'Incorrect answer',
        engineMessages: engineResult.messages,
        dynamicState: engineResult.stateChanged ? await caseEngine.getCaseState(puzzle.case_id, req.user.id) : undefined
      });
    }
  });

  protectedRouter.post('/puzzles/:id/hint', async (req: any, res: any) => {
    const { data: puzzle, error: puzzleError } = await supabase.from('puzzles').select('*').eq('id', req.params.id).single();
    if (puzzleError || !puzzle) return res.status(404).json({ error: 'Puzzle not found' });
    const { data: puzzlesInCase } = await supabase.from('puzzles').select('id').eq('case_id', puzzle.case_id);
    const puzzleIds = puzzlesInCase?.map(p => p.id) || [];
    const { count: hintsUsedInCase } = await supabase.from('used_hints').select('*', { count: 'exact', head: true })
      .eq('team_id', req.user.id).in('puzzle_id', puzzleIds);
    if ((hintsUsedInCase || 0) >= 2) return res.status(403).json({ error: 'Hint limit reached (2 per case).' });
    const { error: hintError } = await supabase.from('used_hints').insert([{ team_id: req.user.id, puzzle_id: puzzle.id }]);
    if (hintError) return res.json({ success: true, message: 'Decryption already in progress.' });
    res.json({ success: true, message: 'Decryption initiated. Access granted in 5 minutes.' });
  });

  // --- Team ---
  protectedRouter.get('/team/profile', async (req: any, res: any) => {
    const { data: team, error: teamError } = await supabase.from('teams')
      .select('id, name, score, created_at, is_disabled').eq('id', req.user.id).single();
    if (teamError || !team) return res.status(404).json({ error: 'Team not found' });
    if (team.is_disabled) return res.status(403).json({ error: 'Account disabled' });
    const { data: solvedPuzzles } = await supabase.from('solved_puzzles').select('puzzles (id, question, points), solved_at').eq('team_id', req.user.id);
    const { data: submissions } = await supabase.from('submissions').select('*, cases (title)').eq('team_id', req.user.id).order('submitted_at', { ascending: false });
    const { data: badges } = await supabase.from('team_badges').select('badge_name, earned_at').eq('team_id', req.user.id).order('earned_at', { ascending: false });
    res.json({
      team,
      solvedPuzzles: solvedPuzzles?.map((p: any) => ({ ...p.puzzles, solved_at: p.solved_at })),
      submissions: submissions?.map((s: any) => ({ ...s, case_title: s.cases?.title })),
      badges
    });
  });

  protectedRouter.get('/team/timeline', async (req: any, res: any) => {
    const events = await eventStore.getTeamTimeline(req.user.id);
    res.json(events);
  });

  protectedRouter.get('/team/adversary-status', async (req: any, res: any) => {
    const actions = await adversary.getTeamActions(req.user.id);
    res.json(actions);
  });

  protectedRouter.post('/team/resolve-action/:id', async (req: any, res: any) => {
    const result = await adversary.resolveAction(parseInt(req.params.id), req.user.id);
    if (result.success && result.cost > 0) {
      await eventStore.appendEvent({
        teamId: req.user.id, eventType: 'adversary_action',
        basePoints: -result.cost, metadata: { action_id: req.params.id, type: 'de-ice' }
      });
    }
    res.json(result);
  });

  // --- Round 0: The UI Weaver (NEW) ---
  protectedRouter.get('/r0/state', (req: any, res: any) => {
    res.json(round0Manager.getTeamState(req.user.id));
  });

  protectedRouter.post('/r0/submit', (req: any, res: any) => {
    const { task, answer } = req.body;
    let success = false;
    
    // Simple validation for prototype
    if (task === 'HTML' && answer.includes('<table') && answer.includes('</table>')) success = true;
    if (task === 'CSS' && answer.includes('filter: none') || answer.includes('opacity: 1')) success = true;
    if (task === 'PYTHON' && (answer.includes('.replace') && answer.includes('ALIVE'))) success = true;

    if (success) {
      const state = round0Manager.completeTask(req.user.id, task);
      return res.json({ success: true, state });
    }
    res.status(400).json({ success: false, message: 'Code validation failed.' });
  });
  protectedRouter.get('/shop/items', (req: any, res: any) => res.json(shopEngine.SHOP_ITEMS));

  protectedRouter.get('/shop/targets', async (req: any, res: any) => {
    const { data: teams } = await supabase.from('teams').select('id, name, score')
      .neq('id', req.user.id).neq('name', 'CCU_ADMIN').eq('is_disabled', false).order('score', { ascending: false });
    res.json(teams || []);
  });

  protectedRouter.post('/shop/buy', async (req: any, res: any) => {
    const { itemId, metadata } = req.body;
    const result = await shopEngine.processPurchase(io, req.user.id, itemId, metadata);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  });


  // --- Round 1: The Living Crime Scene ---
  protectedRouter.get('/r1/status', async (req: any, res: any) => {
    try {
      const { data: state } = await supabase.from('round1_state').select('*').eq('id', 1).single();
      const { data: codes } = await supabase.from('evidence_codes').select('id, claimed_by_team_id');
      const total = codes?.length || 0;
      const claimed = codes?.filter(c => c.claimed_by_team_id !== null).length || 0;
      res.json({ is_active: state?.is_active || false, total, claimed, remaining: total - claimed });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  });

  protectedRouter.post('/r1/claim', submissionLimiter, async (req: any, res: any) => {
    const { code } = req.body;
    try {
      const { data: state } = await supabase.from('round1_state').select('is_active').eq('id', 1).single();
      if (!state?.is_active && req.user.role !== 'admin' && req.user.name !== 'CCU_ADMIN') return res.status(403).json({ status: 'not_started' });
      const { data: evCode, error } = await supabase.from('evidence_codes').select('*, teams(name)').eq('code', code.trim().toUpperCase()).single();
      if (error || !evCode) return res.status(404).json({ status: 'invalid' });
      if (evCode.claimed_by_team_id) {
        if (evCode.claimed_by_team_id === req.user.id) return res.json({ status: 'claimed_by_you', evidence: evCode });
        return res.status(409).json({ status: 'already_taken', claimer: (evCode.teams as any)?.name });
      }
      const { data: updateData } = await supabase.from('evidence_codes').update({ claimed_by_team_id: req.user.id, claimed_at: new Date().toISOString() }).eq('code', code.trim().toUpperCase()).is('claimed_by_team_id', null).select().single();
      if (!updateData) return res.status(409).json({ status: 'already_taken' });
      await eventStore.appendEvent({ teamId: req.user.id, eventType: 'r1_claim', basePoints: evCode.points_value, metadata: { code: evCode.code, title: evCode.title } });
      emitLiveEvent(`${req.user.name} secured Round 1 Evidence: ${evCode.title}!`, 'badge');
      res.json({ status: 'claimed_by_you', evidence: updateData });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
  });

  protectedRouter.get('/r1/my-evidence', async (req: any, res: any) => {
    const { data, error } = await supabase.from('evidence_codes').select('*').eq('claimed_by_team_id', req.user.id);
    if (error) return res.status(500).json({ error: 'Failed' });
    res.json(data);
  });

  // --- Round 3: The Verdict ---
  protectedRouter.get('/r3/state', async (req: any, res: any) => {
    const { Round3Manager } = await import('./src/engine/round3Manager');
    const r3State = Round3Manager.getState();
    res.json({
      subPhase: r3State.currentSubPhase,
      monologueData: r3State.monologueData,
      mySubmission: r3State.phaseBSubmissions.get(req.user.id),
      myMitigation: r3State.phaseCMitigations.get(req.user.id),
    });
  });

  protectedRouter.post('/r3/phase-a/submit', submissionLimiter, async (req: any, res: any) => {
    const { code } = req.body;
    // Basic validation for the "fix"
    const isCorrect = code.includes(':') && code.includes(',');
    if (isCorrect) {
      await eventStore.appendEvent({
        teamId: req.user.id, eventType: 'r3_phase_a_fix',
        basePoints: 150, metadata: { status: 'fixed' }
      });
      emitLiveEvent(`${req.user.name} stabilized the corrupted artifact!`, 'badge');
    }
    res.json({ success: isCorrect });
  });

  protectedRouter.post('/r3/phase-b/submit', submissionLimiter, async (req: any, res: any) => {
    const { Round3Manager } = await import('./src/engine/round3Manager');
    const result = Round3Manager.submitPhaseB(req.user.id, req.body);
    await eventStore.appendEvent({
      teamId: req.user.id, eventType: 'r3_phase_b_submission',
      basePoints: 0, metadata: req.body
    });
    res.json(result);
  });

  protectedRouter.post('/r3/phase-c/mitigate', submissionLimiter, async (req: any, res: any) => {
    const { Round3Manager } = await import('./src/engine/round3Manager');
    const { success } = req.body;
    const result = Round3Manager.submitPhaseC(req.user.id, success);
    if (success) {
      await eventStore.appendEvent({
        teamId: req.user.id, eventType: 'r3_phase_c_mitigation',
        basePoints: 250, metadata: { status: 'threat_neutralized' }
      });
      emitLiveEvent(`${req.user.name} NEUTRALIZED the threat!`, 'case');
    }
    res.json(result);
  });

  app.use('/api', protectedRouter);

  // =========================================================
  // ADMIN ROUTER — Requires valid JWT + admin role
  // =========================================================
  const adminRouter = express.Router();
  adminRouter.use(authenticateToken, requireAdmin);

  // Teams
  adminRouter.get('/teams', async (req: any, res: any) => {
    const { data: teams } = await supabase.from('teams').select('id, name, score, created_at, is_disabled').neq('name', 'CCU_ADMIN').order('score', { ascending: false });
    res.json(teams || []);
  });

  adminRouter.put('/teams/:id', async (req: any, res: any) => {
    const { name, score, is_disabled } = req.body;
    const { error } = await supabase.from('teams').update({ name, score, is_disabled: !!is_disabled }).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: 'Failed to update team' });
    res.json({ success: true });
  });

  // Submissions
  adminRouter.get('/submissions', async (req: any, res: any) => {
    const { data: submissions } = await supabase.from('submissions')
      .select('*, teams(name), cases(title)').order('submitted_at', { ascending: false });
    res.json(submissions?.map((s: any) => ({ ...s, team_name: s.teams?.name, case_title: s.cases?.title })) || []);
  });

  // Master Key (full view of all cases, puzzles, evidence)
  adminRouter.get('/master-key', async (req: any, res: any) => {
    const { data: cases } = await supabase.from('cases').select('*').order('id', { ascending: true });
    const { data: puzzles } = await supabase.from('puzzles').select('*');
    const { data: evidence } = await supabase.from('evidence').select('*');
    res.json(cases?.map((c: any) => ({
      ...c,
      puzzles: puzzles?.filter((p: any) => p.case_id === c.id) || [],
      evidence: evidence?.filter((e: any) => e.case_id === c.id) || []
    })) || []);
  });

  // Analytics
  adminRouter.get('/analytics', async (req: any, res: any) => {
    const { data: puzzles } = await supabase.from('puzzles').select('id, question');
    const { data: attempts } = await supabase.from('puzzle_attempts').select('puzzle_id, is_correct');
    const stats = puzzles?.map((p: any) => {
      const pAttempts = attempts?.filter(a => a.puzzle_id === p.id) || [];
      return {
        puzzle_id: p.id, question: p.question,
        total_attempts: pAttempts.length,
        failed_attempts: pAttempts.filter(a => !a.is_correct).length
      };
    }).filter(s => s.total_attempts > 0).sort((a, b) => b.failed_attempts - a.failed_attempts);
    res.json(stats || []);
  });

  // Events
  adminRouter.get('/events', async (req: any, res: any) => {
    const teamId = req.query.team_id ? parseInt(req.query.team_id as string) : undefined;
    const events = teamId ? await eventStore.getTeamTimeline(teamId, 100) : await eventStore.getGlobalTimeline(100);
    res.json(events);
  });

  // Multipliers
  adminRouter.get('/multipliers', async (req: any, res: any) => {
    const multipliers = await eventStore.getMultipliers();
    res.json(multipliers);
  });

  adminRouter.post('/multipliers', async (req: any, res: any) => {
    const { multiplier = 2, durationMinutes = 10, eventTypes } = req.body;
    try {
      const result = await eventStore.activateMultiplier(multiplier, durationMinutes, eventTypes);
      emitLiveEvent(`⚡ ${multiplier}x XP MULTIPLIER ACTIVATED for ${durationMinutes} minutes!`, 'badge');
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'Failed to activate multiplier' });
    }
  });

  adminRouter.post('/recompute-scores', async (req: any, res: any) => {
    const result = await eventStore.recomputeAllScores();
    res.json(result);
  });

  // Session Kill Switch (#6)
  adminRouter.post('/teams/:id/invalidate', async (req: any, res: any) => {
    const teamId = parseInt(req.params.id);
    const { data: team } = await supabase.from('teams').select('token_version').eq('id', teamId).single();
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const newVersion = (team.token_version || 1) + 1;
    await supabase.from('teams').update({ token_version: newVersion }).eq('id', teamId);
    teamTokenVersions.set(teamId, newVersion);
    res.json({ success: true, newVersion });
  });

  // Recompute & Snapshots (#4, #5)
  adminRouter.post('/snapshots', async (req: any, res: any) => {
    try {
      const snapshot = await eventStore.createGlobalSnapshot();
      res.json(snapshot);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create snapshot' });
    }
  });

  adminRouter.get('/snapshots', async (req: any, res: any) => {
    const snaps = await eventStore.getSnapshots();
    res.json(snaps);
  });

  // Case Builder
  adminRouter.post('/cases', async (req: any, res: any) => {
    const { title, description, difficulty, correct_attacker, points_on_solve } = req.body;
    if (!title || !correct_attacker) return res.status(400).json({ error: 'Title and correct_attacker are required' });
    const { data, error } = await supabase.from('cases')
      .insert([{ title, description, difficulty: difficulty || 'Intermediate', correct_attacker, points_on_solve: points_on_solve || 100 }])
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  adminRouter.delete('/cases/:id', async (req: any, res: any) => {
    const { error } = await supabase.from('cases').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  adminRouter.put('/cases/:id/behavior', async (req: any, res: any) => {
    const { behavior } = req.body;
    const { error } = await supabase.from('cases').update({ behavior }).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: 'Failed to update behavior' });
    res.json({ success: true });
  });

  adminRouter.post('/puzzles', async (req: any, res: any) => {
    const { case_id, question, answer, points, hint } = req.body;
    if (!case_id || !question || !answer) return res.status(400).json({ error: 'case_id, question, answer required' });
    const { data, error } = await supabase.from('puzzles')
      .insert([{ case_id: parseInt(case_id), question, answer, points: points || 50, hint }])
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  adminRouter.delete('/puzzles/:id', async (req: any, res: any) => {
    const { error } = await supabase.from('puzzles').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  adminRouter.post('/evidence', async (req: any, res: any) => {
    const { case_id, type, title, content, metadata, required_puzzle_id } = req.body;
    if (!case_id || !title || !content) return res.status(400).json({ error: 'case_id, title, content required' });
    const { data, error } = await supabase.from('evidence')
      .insert([{ case_id: parseInt(case_id), type: type || 'log', title, content, metadata, required_puzzle_id: required_puzzle_id || null }])
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  adminRouter.delete('/evidence/:id', async (req: any, res: any) => {
    const { error } = await supabase.from('evidence').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // Adversary
  adminRouter.get('/adversary', async (req: any, res: any) => {
    const config = await adversary.getConfig();
    res.json(config);
  });

  adminRouter.put('/adversary', async (req: any, res: any) => {
    await adversary.updateConfig(req.body);
    res.json({ success: true });
  });

  adminRouter.post('/adversary/trigger', async (req: any, res: any) => {
    const { targetTeamId, actionType, message } = req.body;
    await adversary.manualTrigger(io, targetTeamId, actionType, message);
    res.json({ success: true });
  });

  adminRouter.get('/adversary/log', async (req: any, res: any) => {
    const log = await adversary.getActionLog();
    res.json(log);
  });

  // --- Round 3 Command ---
  adminRouter.post('/r3/transition', async (req: any, res: any) => {
    const { phase } = req.body;
    Round3Manager.transition(phase);
    res.json({ success: true, phase });
  });

  adminRouter.post('/r3/monologue', async (req: any, res: any) => {
    Round3Manager.setMonologueData(req.body);
    res.json({ success: true });
  });

  adminRouter.get('/r3/submissions', async (req: any, res: any) => {
    const { data } = await supabase
      .from('round3_submissions')
      .select('*, teams(name)')
      .order('created_at', { ascending: false });
    res.json(data || []);
  });

  adminRouter.get('/r3/majority', async (req: any, res: any) => {
    const { correctSuspect } = req.query;
    res.json(Round3Manager.getMajoritySuspect(String(correctSuspect || 'SYNDICATE_AI')));
  });

  // --- Round 0 Admin ---
  adminRouter.post('/r0/bypass/:teamId', (req: any, res: any) => {
    const state = round0Manager.bypass(parseInt(req.params.teamId));
    res.json({ success: true, state });
  });

  app.use('/api/admin', adminRouter);

  // =========================================================
  // STATIC / VITE — MUST come LAST
  // =========================================================
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

  if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🔍 Tech Detective Server running at http://localhost:${PORT}`);
      console.log(`📋 Admin: login as CCU_ADMIN`);
      console.log(`🗄️  DB: ${process.env.SUPABASE_URL ? 'Supabase Connected' : 'WARNING: SUPABASE_URL not set!'}\n`);
    });
  }
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});

import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './src/lib/supabase';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';

// Engine imports
import * as eventStore from './src/engine/eventStore';
import * as caseEngine from './src/engine/caseEngine';
import * as adversary from './src/engine/adversary';
import * as shopEngine from './src/engine/shopEngine';
import * as boardEngine from './src/engine/boardEngine';

const ROOT_DIR = process.cwd();

const JWT_SECRET = process.env.JWT_SECRET || 'tech-detective-secret-key';
const isTest = process.env.NODE_ENV === 'test';
// export const db = ... (SQLite removed)

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: isTest ? 100 : 10, 
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

const submissionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: isTest ? 20 : 5, 
  message: { error: 'Submission rate limit exceeded. Slow down, detective.' }
});

export const app = express();
const server = http.createServer(app);
export const io = new SocketIOServer(server, { cors: { origin: '*' } });
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {

  app.use(cors());
  app.use(express.json());

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

  // Request Logger for debugging route shadowing
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API_DEBUG] ${req.method} ${req.url}`);
    }
    next();
  });

  // --- TOP PRIORITY API ROUTES ---
  app.get('/api/health', (req, res) => res.json({ status: 'UP', timestamp: new Date().toISOString() }));

  app.get('/api/board/:caseId', authenticateToken, async (req: any, res: any) => {
    try {
      const state = await boardEngine.getBoardState(req.user.id, parseInt(req.params.caseId));
      res.json(state);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch board state' });
    }
  });

  app.post('/api/board/nodes', authenticateToken, async (req: any, res: any) => {
    try {
      const { caseId, type, content, x, y } = req.body;
      const node = await boardEngine.addNode(req.user.id, parseInt(caseId), type, content, x, y);
      io.emit('board_update', { teamId: req.user.id, type: 'node_added', node });
      res.json(node);
    } catch (err) {
      console.error('Board Engine Add Error:', err);
      res.status(500).json({ error: 'Failed to add node' });
    }
  });

  app.patch('/api/board/nodes/:id', authenticateToken, async (req: any, res: any) => {
    try {
      const { x, y } = req.body;
      await boardEngine.updateNodePosition(req.user.id, parseInt(req.params.id), x, y);
      io.emit('board_update', { teamId: req.user.id, type: 'node_moved', nodeId: parseInt(req.params.id), x, y });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to move node' });
    }
  });

  app.delete('/api/board/nodes/:id', authenticateToken, async (req: any, res: any) => {
    try {
      await boardEngine.deleteNode(req.user.id, parseInt(req.params.id));
      io.emit('board_update', { teamId: req.user.id, type: 'node_deleted', nodeId: parseInt(req.params.id) });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete node' });
    }
  });

  app.post('/api/board/links', authenticateToken, async (req: any, res: any) => {
    try {
      const { sourceId, targetId } = req.body;
      const link = await boardEngine.createLink(req.user.id, sourceId, targetId);
      io.emit('board_update', { teamId: req.user.id, type: 'link_added', link });
      res.json(link);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create link' });
    }
  });

  app.delete('/api/board/links/:id', authenticateToken, async (req: any, res: any) => {
    try {
      await boardEngine.deleteLink(req.user.id, parseInt(req.params.id));
      io.emit('board_update', { teamId: req.user.id, type: 'link_deleted', linkId: parseInt(req.params.id) });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete link' });
    }
  });

  // Socket.io connection
  io.on('connection', (socket) => {
    console.log('Client connected to live feed');
    socket.on('node_dragging', (data) => {
      // Broadcast ephemeral position to everyone EXCEPT the sender
      socket.broadcast.emit('board_update', { 
        teamId: data.teamId, 
        type: 'node_moved', 
        nodeId: data.nodeId, 
        x: data.x, 
        y: data.y 
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Auth
  app.post('/api/auth/login', loginLimiter, async (req, res) => {
    const { teamName, password, role } = req.body;
    let assignedRole = role || 'hacker';
    if (teamName === 'CCU_ADMIN') assignedRole = 'admin';
    
    // Supabase query
    const { data: team, error: fetchError } = await supabase
      .from('teams')
      .select('*')
      .eq('name', teamName)
      .single();
    
    if (fetchError || !team) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const { data: newTeam, error: insertError } = await supabase
        .from('teams')
        .insert([{ name: teamName, password: hashedPassword }])
        .select()
        .single();

      if (insertError) return res.status(500).json({ error: 'Failed to create team' });
      
      emitLiveEvent(`New team registered: ${teamName}`, 'badge');
      const token = jwt.sign({ id: newTeam.id, name: newTeam.name, role: assignedRole }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, team: { id: newTeam.id, name: newTeam.name, score: newTeam.score, is_disabled: !!newTeam.is_disabled, role: assignedRole } });
    } else {
      if (team.is_disabled) {
        return res.status(403).json({ error: 'Account disabled by administrator' });
      }
      const validPassword = bcrypt.compareSync(password, team.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    const token = jwt.sign({ id: team.id, name: team.name, role: assignedRole }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, team: { id: team.id, name: team.name, score: team.score, is_disabled: !!team.is_disabled, role: assignedRole } });
  });

  // Team Profile section starts below board routes moved to line 49

  // Team Profile
  app.get('/api/team/profile', authenticateToken, async (req: any, res: any) => {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, score, created_at, is_disabled')
      .eq('id', req.user.id)
      .single();

    if (teamError || !team) return res.status(404).json({ error: 'Team not found' });
    if (team.is_disabled) return res.status(403).json({ error: 'Account disabled' });

    const { data: solvedPuzzles } = await supabase
      .from('solved_puzzles')
      .select('puzzles (id, question, points), solved_at')
      .eq('team_id', req.user.id);

    const { data: submissions } = await supabase
      .from('submissions')
      .select('*, cases (title)')
      .eq('team_id', req.user.id)
      .order('submitted_at', { ascending: false });

    const { data: badges } = await supabase
      .from('team_badges')
      .select('badge_name, earned_at')
      .eq('team_id', req.user.id)
      .order('earned_at', { ascending: false });

    res.json({ 
      team, 
      solvedPuzzles: solvedPuzzles?.map((p: any) => ({ ...p.puzzles, solved_at: p.solved_at })), 
      submissions: submissions?.map((s: any) => ({ ...s, case_title: s.cases?.title })), 
      badges 
    });
  });

  // Dashboard / Cases
  app.get('/api/cases', authenticateToken, async (req: any, res: any) => {
    const { data: cases, error } = await supabase
      .from('cases')
      .select('*');
    
    if (error) return res.status(500).json({ error: 'Failed to fetch cases' });
    res.json(cases);
  });

  app.get('/api/cases/:id', authenticateToken, async (req: any, res: any) => {
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (caseError || !caseData) return res.status(404).json({ error: 'Case not found' });
    
    // Check if the case is already completed by this team
    const { data: completion } = await supabase
      .from('submissions')
      .select('1')
      .eq('team_id', req.user.id)
      .eq('case_id', req.params.id)
      .eq('status', 'correct')
      .single();
    
    const isCompleted = !!completion;

    let evidenceQuery = supabase
      .from('evidence')
      .select('id, type, title, metadata, required_puzzle_id')
      .eq('case_id', req.params.id);

    if (req.user.name !== 'CCU_ADMIN') {
      if (req.user.role === 'hacker') {
        evidenceQuery = evidenceQuery.in('type', ['log', 'html', 'code']);
      } else if (req.user.role === 'analyst') {
        evidenceQuery = evidenceQuery.in('type', ['chat', 'email']);
      }
    }

    const { data: evidence } = await evidenceQuery;

    // Check for shop-purchased evidence
    const purchasedEvidenceIds = await shopEngine.getPurchasedEvidence(req.user.id, parseInt(req.params.id));

    // Join solved_puzzles for locking logic
    const { data: solvedPuzzles } = await supabase
      .from('solved_puzzles')
      .select('puzzle_id')
      .eq('team_id', req.user.id);

    const solvedPuzzleIds = new Set(solvedPuzzles?.map(p => p.puzzle_id));

    const evidenceWithLock = evidence?.map((e: any) => ({
      ...e,
      is_locked: (e.required_puzzle_id && !solvedPuzzleIds.has(e.required_puzzle_id)) && !purchasedEvidenceIds.includes(e.id)
    }));

    const { data: puzzles } = await supabase
      .from('puzzles')
      .select('*')
      .eq('case_id', req.params.id);

    const { data: hintsUsed } = await supabase
      .from('used_hints')
      .select('puzzle_id, used_at')
      .eq('team_id', req.user.id);

    const usedHintsMap = new Map(hintsUsed?.map(h => [h.puzzle_id, h.used_at]));

    // Check for shop-purchased hints
    const purchasedHintPuzzleIds = await shopEngine.getPurchasedHints(req.user.id, parseInt(req.params.id));

    const puzzlesWithStatus = puzzles?.map((p: any) => {
      const hintUsedAt = usedHintsMap.get(p.id);
      const isSolved = solvedPuzzleIds.has(p.id);
      const isPurchased = purchasedHintPuzzleIds.includes(p.id);
      const isHintAvailable = isPurchased || (hintUsedAt && (new Date(hintUsedAt).getTime() + 5 * 60 * 1000) <= Date.now());
      
      return {
        id: p.id,
        question: p.question,
        points: p.points,
        has_hint: !!p.hint,
        hint: isHintAvailable ? p.hint : null,
        solved: isSolved ? 1 : 0,
        hint_used: (hintUsedAt || isPurchased) ? 1 : 0,
        hint_used_at: hintUsedAt,
        is_purchased_hint: isPurchased
      };
    });

    const hintsUsedInCase = hintsUsed?.filter(h => puzzles?.some(p => p.id === h.puzzle_id)).length || 0;
    const maxHints = 2;

    res.json({ ...caseData, evidence: evidenceWithLock, puzzles: puzzlesWithStatus, hintsUsedInCase, maxHints, isCompleted });
  });

  // --- Black Market Shop ---
  app.get('/api/shop/items', authenticateToken, (req, res) => {
    res.json(shopEngine.SHOP_ITEMS);
  });

  app.get('/api/shop/targets', authenticateToken, async (req: any, res: any) => {
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name, score')
      .neq('id', req.user.id)
      .neq('name', 'CCU_ADMIN')
      .eq('is_disabled', false)
      .order('score', { ascending: false });
    
    res.json(teams || []);
  });

  app.post('/api/shop/buy', authenticateToken, async (req: any, res: any) => {
    const { itemId, metadata } = req.body;
    const result = await shopEngine.processPurchase(io, req.user.id, itemId, metadata);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  });

  // Evidence Detail
  app.get('/api/evidence/:id', authenticateToken, async (req: any, res: any) => {
    const { data: item, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !item) return res.status(404).json({ error: 'Evidence not found' });

    if (item.required_puzzle_id) {
       const { data: solve } = await supabase
         .from('solved_puzzles')
         .select('1')
         .eq('team_id', req.user.id)
         .eq('puzzle_id', item.required_puzzle_id)
         .single();
       
       if (!solve) return res.status(403).json({ error: 'Evidence is locked. Solve the required puzzle first.' });
    }

    res.json(item);
  });

  // Puzzle Solve (with Event Sourcing + Case Engine integration)
  app.post('/api/puzzles/:id/solve', authenticateToken, submissionLimiter, async (req: any, res: any) => {
    const { answer } = req.body;
    const { data: puzzle, error: puzzleError } = await supabase
      .from('puzzles')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (puzzleError || !puzzle) return res.status(404).json({ error: 'Puzzle not found' });

    // Check for active lockout from Case Engine
    const caseState = await caseEngine.getCaseState(puzzle.case_id, req.user.id);
    if (caseState.lockouts[puzzle.id] && new Date(caseState.lockouts[puzzle.id]) > new Date()) {
      return res.status(429).json({ 
        success: false, 
        message: `FIREWALL ACTIVE: Task locked until ${new Date(caseState.lockouts[puzzle.id]).toLocaleTimeString()}`,
        lockout_until: caseState.lockouts[puzzle.id]
      });
    }

    const isCorrect = puzzle.answer.toLowerCase().trim() === answer.toLowerCase().trim();
    
    // Log the attempt
    await supabase.from('puzzle_attempts').insert([{ team_id: req.user.id, puzzle_id: puzzle.id, is_correct: isCorrect }]);

    // Run Case Engine rules after every attempt
    const engineResult = await caseEngine.evaluatePostAttempt(puzzle.case_id, req.user.id, puzzle.id, isCorrect);
    
    // Emit engine messages via Socket.IO
    if (engineResult.messages.length > 0) {
      for (const msg of engineResult.messages) {
        io.emit('live_event', { message: msg, type: 'case', timestamp: new Date().toISOString() });
      }
    }

    if (isCorrect) {
      try {
        const { data: hintUsed } = await supabase
          .from('used_hints')
          .select('1')
          .eq('team_id', req.user.id)
          .eq('puzzle_id', puzzle.id)
          .single();
        
        // First Blood Check
        const { count: solveCount } = await supabase
          .from('solved_puzzles')
          .select('*', { count: 'exact', head: true })
          .eq('puzzle_id', puzzle.id);
        
        const basePoints = hintUsed ? Math.floor(puzzle.points * 0.5) : puzzle.points;
        let firstBloodBonus = 0;
        if ((solveCount || 0) === 0) firstBloodBonus = Math.floor(puzzle.points * 0.5);
        else if (solveCount === 1) firstBloodBonus = Math.floor(puzzle.points * 0.25);
        else if (solveCount === 2) firstBloodBonus = Math.floor(puzzle.points * 0.1);

        const { error: solveError } = await supabase
          .from('solved_puzzles')
          .insert([{ team_id: req.user.id, puzzle_id: puzzle.id }]);

        if (solveError) return res.json({ success: false, message: 'Already solved' });

        // Event Sourcing: append events instead of increment_score
        const solveResult = await eventStore.appendEvent({
          teamId: req.user.id,
          eventType: 'puzzle_solve',
          basePoints,
          metadata: { puzzle_id: puzzle.id, case_id: puzzle.case_id, hint_used: !!hintUsed }
        });

        let fbResult = { finalPoints: 0, multiplierApplied: null as number | null };
        if (firstBloodBonus > 0) {
          fbResult = await eventStore.appendEvent({
            teamId: req.user.id,
            eventType: 'first_blood',
            basePoints: firstBloodBonus,
            metadata: { puzzle_id: puzzle.id, position: (solveCount || 0) + 1 }
          });
        }

        const totalPoints = solveResult.finalPoints + fbResult.finalPoints;
        
        // Emit live event
        const teamName = req.user.name;
        if (firstBloodBonus > 0) {
           emitLiveEvent(`${teamName} got FIRST BLOOD on Puzzle #${puzzle.id}! (+${fbResult.finalPoints} pts)`, 'solve');
        } else {
           emitLiveEvent(`${teamName} cracked Puzzle #${puzzle.id}!`, 'solve');
        }

        // Evaluate Adversary AI after score change
        adversary.evaluateAdversary(io).catch(e => console.error('Adversary eval error:', e));

        res.json({ 
          success: true, 
          points: totalPoints, 
          basePoints: solveResult.finalPoints, 
          firstBloodBonus: fbResult.finalPoints, 
          hintUsed: !!hintUsed,
          multiplierApplied: solveResult.multiplierApplied,
          engineMessages: engineResult.messages,
          message: `Received ${totalPoints} XP (${solveResult.finalPoints} Base${fbResult.finalPoints > 0 ? ` + ${fbResult.finalPoints} Bonus` : ''}${solveResult.multiplierApplied ? ` × ${solveResult.multiplierApplied}x Multiplier` : ''})`
        });
      } catch (e) {
        res.json({ success: false, message: 'Already solved' });
      }
    } else {
      // Return engine messages (like lockouts, auto-hints) even on wrong answers
      res.json({ 
        success: false, 
        message: 'Incorrect answer',
        engineMessages: engineResult.messages,
        dynamicState: engineResult.stateChanged ? await caseEngine.getCaseState(puzzle.case_id, req.user.id) : undefined
      });
    }
  });

  // Request Hint
  app.post('/api/puzzles/:id/hint', authenticateToken, async (req: any, res: any) => {
    const { data: puzzle, error: puzzleError } = await supabase
      .from('puzzles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (puzzleError || !puzzle) return res.status(404).json({ error: 'Puzzle not found' });

    const MAX_HINTS_PER_CASE = 2;
    
    // This part is tricky with Supabase without joins, but we can do it
    const { data: puzzlesInCase } = await supabase
      .from('puzzles')
      .select('id')
      .eq('case_id', puzzle.case_id);
    
    const puzzleIds = puzzlesInCase?.map(p => p.id) || [];

    const { count: hintsUsedInCase } = await supabase
      .from('used_hints')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', req.user.id)
      .in('puzzle_id', puzzleIds);

    if ((hintsUsedInCase || 0) >= MAX_HINTS_PER_CASE) {
      return res.status(403).json({ error: `Hint limit reached. You can only use ${MAX_HINTS_PER_CASE} hints per case.` });
    }

    const { error: hintError } = await supabase
      .from('used_hints')
      .insert([{ team_id: req.user.id, puzzle_id: puzzle.id }]);

    if (hintError) {
      return res.json({ success: true, message: 'Decryption already in progress or completed.' });
    }
    
    res.json({ success: true, message: 'Decryption initiated. Access granted in 5 minutes.' });
  });

  // Final Submission (with Event Sourcing)
  app.post('/api/cases/:id/submit', authenticateToken, submissionLimiter, async (req: any, res: any) => {
    const { attackerName, attackMethod, preventionMeasures } = req.body;
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (caseError || !caseData) return res.status(404).json({ error: 'Case not found' });

    const isCorrect = caseData.correct_attacker && caseData.correct_attacker.toLowerCase().trim() === attackerName.toLowerCase().trim();
    const status = isCorrect ? 'correct' : 'incorrect';
    const outcome = isCorrect ? 'CASE_SOLVED: The hacker has been apprehended.' : 'HACKER_ESCAPED: Your investigation led to the wrong suspect.';

    try {
      // Check if already submitted correctly
      const { data: previousCorrect } = await supabase
        .from('submissions')
        .select('1')
        .eq('team_id', req.user.id)
        .eq('case_id', req.params.id)
        .eq('status', 'correct')
        .single();

      if (previousCorrect) {
        return res.status(400).json({ error: 'Case already solved' });
      }

      await supabase
        .from('submissions')
        .insert([{
          team_id: req.user.id,
          case_id: req.params.id,
          attacker_name: attackerName,
          attack_method: attackMethod,
          prevention_measures: preventionMeasures,
          status
        }]);

      let pointsAwarded = 0;
      let firstBloodBonus = 0;
      let badgesEarned: string[] = [];
      let multiplierApplied: number | null = null;

      if (isCorrect) {
        // First Blood Check
        const { count: solveCount } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('case_id', req.params.id)
          .eq('status', 'correct');
        
        const count = (solveCount || 0) - 1;
        
        let fbBonus = 0;
        if (count === 0) fbBonus = 100;
        else if (count === 1) fbBonus = 50;
        else if (count === 2) fbBonus = 25;

        // Event Sourcing: case solve event
        const solveResult = await eventStore.appendEvent({
          teamId: req.user.id,
          eventType: 'case_solve',
          basePoints: caseData.points_on_solve,
          metadata: { case_id: req.params.id }
        });
        pointsAwarded = solveResult.finalPoints;
        multiplierApplied = solveResult.multiplierApplied;

        // First blood event
        if (fbBonus > 0) {
          const fbResult = await eventStore.appendEvent({
            teamId: req.user.id,
            eventType: 'first_blood',
            basePoints: fbBonus,
            metadata: { case_id: req.params.id, position: count + 1 }
          });
          firstBloodBonus = fbResult.finalPoints;
          pointsAwarded += firstBloodBonus;
        }

        // Badges check
        const { count: hintsUsed } = await supabase
          .from('used_hints')
          .select('*, puzzles!inner(*)', { count: 'exact', head: true })
          .eq('team_id', req.user.id)
          .eq('puzzles.case_id', req.params.id);
        
        if (hintsUsed === 0) {
          const { error: badgeError } = await supabase.from('team_badges').insert([{ team_id: req.user.id, badge_name: 'Lone Wolf' }]);
          if (!badgeError) {
             badgesEarned.push('Lone Wolf');
             emitLiveEvent(`${req.user.name} earned the LONE WOLF badge!`, 'badge');
          }
        }

        emitLiveEvent(`${req.user.name} solved Case #${req.params.id}!`, 'case');

        // Evaluate Adversary AI
        adversary.evaluateAdversary(io).catch(e => console.error('Adversary eval error:', e));
      }

      res.json({ success: true, message: outcome, isCorrect, pointsAwarded, firstBloodBonus, badgesEarned, multiplierApplied });
    } catch (e) {
      console.error('Submit Error:', e);
      res.status(500).json({ error: 'Failed to submit report' });
    }
  });

  // Scoreboard
  app.get('/api/scoreboard', async (req, res) => {
    const { data: scores, error } = await supabase
      .from('teams')
      .select('name, score')
      .order('score', { ascending: false })
      .limit(10);
    
    if (error) return res.status(500).json({ error: 'Internal Server Error' });
    res.json(scores);
  });

  // Admin Routes
  app.get('/api/admin/submissions', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*, teams(name), cases(title)')
      .order('submitted_at', { ascending: false });
    
    res.json(submissions?.map((s: any) => ({ ...s, team_name: s.teams?.name, case_title: s.cases?.title })));
  });

  app.get('/api/admin/master-key', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { data: cases } = await supabase.from('cases').select('id, title, correct_attacker, points_on_solve');
    const { data: puzzles } = await supabase.from('puzzles').select('id, case_id, question, answer, points, hint');
    
    const masterKey = cases?.map((c: any) => ({
      ...c,
      puzzles: puzzles?.filter((p: any) => p.case_id === c.id)
    }));
    res.json(masterKey);
  });

  app.get('/api/admin/teams', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { data: teams } = await supabase.from('teams').select('id, name, score, created_at, is_disabled').order('score', { ascending: false });
    res.json(teams);
  });

  app.put('/api/admin/teams/:id', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { name, score, is_disabled } = req.body;
    const { error } = await supabase.from('teams').update({ name, score, is_disabled: !!is_disabled }).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: 'Failed' });
    res.json({ success: true });
  });

  app.get('/api/admin/analytics', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    // Complex query: For simplicity, we'll fetch puzzles and attempts separately
    const { data: puzzles } = await supabase.from('puzzles').select('id, question');
    const { data: attempts } = await supabase.from('puzzle_attempts').select('puzzle_id, is_correct');
    
    const stats = puzzles?.map((p: any) => {
      const pAttempts = attempts?.filter(a => a.puzzle_id === p.id) || [];
      return {
        puzzle_id: p.id,
        question: p.question,
        total_attempts: pAttempts.length,
        failed_attempts: pAttempts.filter(a => !a.is_correct).length
      };
    }).filter(s => s.total_attempts > 0).sort((a, b) => b.failed_attempts - a.failed_attempts);

    res.json(stats);
  });


  // === EVENT SOURCING ENDPOINTS ===

  // Team event timeline (for Profile page)
  app.get('/api/team/timeline', authenticateToken, async (req: any, res: any) => {
    const events = await eventStore.getTeamTimeline(req.user.id);
    res.json(events);
  });

  // Active multipliers (public — shown on scoreboard)
  app.get('/api/multipliers/active', async (req, res) => {
    const active = await eventStore.getActiveMultipliers();
    res.json(active);
  });

  // Admin: global event timeline
  app.get('/api/admin/events', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const teamId = req.query.team_id ? parseInt(req.query.team_id as string) : undefined;
    if (teamId) {
      const events = await eventStore.getTeamTimeline(teamId, 100);
      res.json(events);
    } else {
      const events = await eventStore.getGlobalTimeline(100);
      res.json(events);
    }
  });

  // Admin: activate multiplier
  app.post('/api/admin/multipliers', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { multiplier = 2, durationMinutes = 10, eventTypes } = req.body;
    try {
      const result = await eventStore.activateMultiplier(multiplier, durationMinutes, eventTypes);
      emitLiveEvent(`⚡ ${multiplier}x XP MULTIPLIER ACTIVATED for ${durationMinutes} minutes!`, 'badge');
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'Failed to activate multiplier' });
    }
  });

  // Admin: get all multipliers
  app.get('/api/admin/multipliers', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const multipliers = await eventStore.getMultipliers();
    res.json(multipliers);
  });

  // Admin: recompute all scores
  app.post('/api/admin/recompute-scores', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const result = await eventStore.recomputeAllScores();
    res.json(result);
  });

  // === ADVERSARY AI ENDPOINTS ===

  // Team: get my active adversary actions
  app.get('/api/team/adversary-status', authenticateToken, async (req: any, res: any) => {
    const actions = await adversary.getTeamActions(req.user.id);
    res.json(actions);
  });

  // Team: resolve an adversary action
  app.post('/api/team/resolve-action/:id', authenticateToken, async (req: any, res: any) => {
    const result = await adversary.resolveAction(parseInt(req.params.id), req.user.id);
    if (result.success && result.cost > 0) {
      await eventStore.appendEvent({
        teamId: req.user.id,
        eventType: 'adversary_action',
        basePoints: -result.cost,
        metadata: { action_id: req.params.id, type: 'de-ice' }
      });
    }
    res.json(result);
  });

  // Admin: get adversary config
  app.get('/api/admin/adversary', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const config = await adversary.getConfig();
    res.json(config);
  });

  // Admin: update adversary config
  app.put('/api/admin/adversary', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    await adversary.updateConfig(req.body);
    res.json({ success: true });
  });

  // Admin: manually trigger adversary action
  app.post('/api/admin/adversary/trigger', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { targetTeamId, actionType, message } = req.body;
    await adversary.manualTrigger(io, targetTeamId, actionType, message);
    res.json({ success: true });
  });

  // Admin: adversary action log
  app.get('/api/admin/adversary/log', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const log = await adversary.getActionLog();
    res.json(log);
  });

  // === CASE ENGINE ENDPOINTS ===

  // Get dynamic case state for a team
  app.get('/api/cases/:id/state', authenticateToken, async (req: any, res: any) => {
    const state = await caseEngine.getCaseState(parseInt(req.params.id), req.user.id);
    res.json(state);
  });

  // Admin: update case behavior rules
  app.put('/api/admin/cases/:id/behavior', authenticateToken, async (req: any, res: any) => {
    if (req.user.name !== 'CCU_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { behavior } = req.body;
    const { error } = await supabase.from('cases').update({ behavior }).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: 'Failed to update behavior' });
    res.json({ success: true });
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

  if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Tech Detective Server running at http://localhost:${PORT}`);
    });
  }
}

// Ensure Vite middleware is applied synchronously by avoiding await here 
// since tests don't need Vite.
if (process.env.NODE_ENV !== 'test') {
  startServer();
} else {
  // Just setup the API routes for testing without vite setup
  startServer(); 
}

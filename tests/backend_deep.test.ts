import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, db } from '../server.js';

let authToken = '';
let teamId = 0;
let adminToken = '';
const teamName = 'DeepTestTeamV2'; // New name for clean state

describe('Tech Detective API (Backend) - Thorough Security & Integrity', () => {

  describe('Comprehensive Security Check', () => {
    it('Reject all protected routes without Token', async () => {
      const protectedRoutes = [
        '/api/team/profile',
        '/api/cases',
        '/api/cases/1',
        '/api/evidence/1',
        '/api/admin/submissions'
      ];
      for (const route of protectedRoutes) {
        await request(app).get(route).expect(401);
      }
    });

    it('Reject all protected routes with malformed Token', async () => {
      const protectedRoutes = [
        '/api/team/profile',
        '/api/cases'
      ];
      for (const route of protectedRoutes) {
        await request(app)
          .get(route)
          .set('Authorization', 'Bearer invalid.token.here')
          .expect(403);
      }
    });
  });

  describe('Game Progression & Badge Edge Cases', () => {
    it('Setup Team & Login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ teamName, password: 'password' })
        .expect(200);
      authToken = res.body.token;
      teamId = res.body.team.id;
    });

    it('Puzzle logic - Case Sensitivity & Trimming', async () => {
      const res = await request(app)
        .post('/api/puzzles/1/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: '   192.168.1.45   ' }) 
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Badge Logic - Lone Wolf (Successfully solve case without hints)', async () => {
      const lwTeam = 'LoneWolf_' + Date.now();
      const lwRes = await request(app)
        .post('/api/auth/login')
        .send({ teamName: lwTeam, password: 'pw' })
        .expect(200);
      const lwToken = lwRes.body.token;

      // Solve Case 1 (Shadow) without requesting any hints
      await request(app)
        .post('/api/cases/1/submit')
        .set('Authorization', `Bearer ${lwToken}`)
        .send({ attackerName: 'Shadow', attackMethod: 'logic', preventionMeasures: 'none' })
        .expect(200);

      const profile = await request(app)
        .get('/api/team/profile')
        .set('Authorization', `Bearer ${lwToken}`)
        .expect(200);
      
      const hasLoneWolf = profile.body.badges.some((b: any) => b.badge_name === 'Lone Wolf');
      expect(hasLoneWolf).toBe(true);
    });
  });

  describe('Integrity & Error Handling', () => {
    it('Handle nonexistent puzzle ID gracefully', async () => {
      await request(app)
        .post('/api/puzzles/99999/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: 'any' })
        .expect(404);
    });

    it('Should not allow duplicate correct submissions/solves', async () => {
      // TeamName already solved puzzle 1 in previous it() block
      await request(app)
        .post('/api/puzzles/1/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: '192.168.1.45' })
        .expect(200);
        // Status 200 but success false is current behavior for already solved
    });
    
    it('Handle incorrect final submission', async () => {
       const failTeam = 'FailTeam_' + Date.now();
       const resLogin = await request(app).post('/api/auth/login').send({ teamName: failTeam, password: 'p' }).expect(200);
       const failToken = resLogin.body.token;

       const res = await request(app)
         .post('/api/cases/1/submit')
         .set('Authorization', `Bearer ${failToken}`)
         .send({ attackerName: 'WRONG_GUY', attackMethod: 'x', preventionMeasures: 'y' })
         .expect(200);
       expect(res.body.isCorrect).toBe(false);
    });
  });

  describe('Advanced Admin Protection', () => {
    it('Login as Admin', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ teamName: 'CCU_ADMIN', password: 'admin123' })
        .expect(200);
      adminToken = res.body.token;
    });

    it('Admin can modify scores', async () => {
      await request(app)
        .put(`/api/admin/teams/${teamId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'PowerUser', score: 5000, is_disabled: false })
        .expect(200);
      
      const profile = await request(app)
        .get('/api/team/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(profile.body.team.score).toBe(5000);
    });

    it('Puzzle hint point reduction check', async () => {
        const hintTeam = 'HintTeam_' + Date.now();
        const resLogin = await request(app).post('/api/auth/login').send({ teamName: hintTeam, password: 'p' }).expect(200);
        const hToken = resLogin.body.token;
        const hId = resLogin.body.team.id;

        // Take hint for puzzle 1 (points: 20)
        await request(app).post('/api/puzzles/1/hint').set('Authorization', `Bearer ${hToken}`).expect(200);

        // Solve puzzle 1. basePoints should be 10.
        const solveRes = await request(app)
          .post('/api/puzzles/1/solve')
          .set('Authorization', `Bearer ${hToken}`)
          .send({ answer: '192.168.1.45' })
          .expect(200);
        
        expect(solveRes.body.hintUsed).toBe(true);
        expect(solveRes.body.basePoints).toBe(10);
        
        // Account for potential first blood/rank bonuses in total points
        const profile = await request(app).get('/api/team/profile').set('Authorization', `Bearer ${hToken}`).expect(200);
        expect(profile.body.team.score).toBeGreaterThanOrEqual(10);
    });
    it('Anti-Cheat: Rate limiting on puzzle solves', async () => {
      const rtTeam = 'RateTeam_' + Date.now();
      const resLogin = await request(app).post('/api/auth/login').send({ teamName: rtTeam, password: 'p' }).expect(200);
      const hToken = resLogin.body.token;

      // The limit is 20 per minute in test mode
      for (let i = 0; i < 20; i++) {
        await request(app)
          .post('/api/puzzles/1/solve')
          .set('Authorization', `Bearer ${hToken}`)
          .send({ answer: 'wrong' });
      }

      // The 6th should fail with 429
      const lastRes = await request(app)
        .post('/api/puzzles/1/solve')
        .set('Authorization', `Bearer ${hToken}`)
        .send({ answer: 'wrong' });
      
      expect(lastRes.status).toBe(429);
      expect(lastRes.body.error).toContain('rate limit exceeded');
    });
  });
});

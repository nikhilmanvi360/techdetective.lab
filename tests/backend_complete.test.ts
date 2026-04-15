import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, db } from '../server.ts';

let authToken = '';
let adminToken = '';
let teamId = 0;
const TEAM_NAME = 'CompleteTestTeam_' + Date.now();
const ADMIN_NAME = 'CCU_ADMIN';

describe('Tech Detective Complete API Suite', () => {

  describe('Authentication & Security', () => {
    it('Should block protected routes without JWT', async () => {
      await request(app).get('/api/team/profile').expect(401);
    });

    it('Should create a team and login successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ teamName: TEAM_NAME, password: 'password' })
        .expect(200);
      
      expect(res.body.token).toBeDefined();
      authToken = res.body.token;
      teamId = res.body.team.id;
    });

    it('Should login as admin', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ teamName: ADMIN_NAME, password: 'admin123' })
        .expect(200);
      adminToken = res.body.token;
    });
  });

  describe('Case Logic & Puzzles', () => {
    it('Should list cases for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('Should check locked evidence (Case 1, Evidence 2 requires Puzzle 1)', async () => {
      const res = await request(app)
        .get('/api/evidence/2')
        .set('Authorization', `Bearer ${authToken}`);
      
      // If it's 200, it means Puzzle 1 was already solved (state leak). 
      // We expect 403 because this is a new team.
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('locked');
    });

    it('Should request a hint and check point reduction', async () => {
      // Request hint for Puzzle 1 (base 20 pts)
      await request(app)
        .post('/api/puzzles/1/hint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Solve Puzzle 1
      const res = await request(app)
        .post('/api/puzzles/1/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: '192.168.1.45' })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.hintUsed).toBe(true);
      expect(res.body.basePoints).toBe(10); // 20 / 2
    });

    it('Should unlock evidence after puzzle is solved', async () => {
      await request(app)
        .get('/api/evidence/2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('Should handle case submission (Success)', async () => {
      const res = await request(app)
        .post('/api/cases/1/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          attackerName: 'Shadow', 
          attackMethod: 'Brute force on auth server', 
          preventionMeasures: 'Implement rate limiting and stronger password policies'
        })
        .expect(200);
      
      expect(res.body.isCorrect).toBe(true);
    });

    it('Should earn "Lone Wolf" badge if another case is solved without hints', async () => {
      // Solve Case 2 (Neha) without hints
      // Puzzles for Case 2 are 4 through 12. 
      // We'll just submit the final case answer (it counts as solve)
      const res = await request(app)
        .post('/api/cases/2/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ attackerName: 'Neha', attackMethod: 'x', preventionMeasures: 'y' })
        .expect(200);
      
      expect(res.body.isCorrect).toBe(true);
      // Wait, badges are awarded on correct submission if NO hints used in THAT case.
      // We used hints in Case 1, but not Case 2.
    });

    it('Should verify badges in profile', async () => {
      const res = await request(app)
        .get('/api/team/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Should have Lone Wolf now (from Case 2)
      const hasLoneWolf = res.body.badges.some((b: any) => b.badge_name === 'Lone Wolf');
      expect(hasLoneWolf).toBe(true);
    });
  });

  describe('Admin Operations', () => {
    it('Should allow admin to update team data', async () => {
      const newName = 'UpdatedTeam_' + Date.now();
      const res = await request(app)
        .put(`/api/admin/teams/${teamId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: newName, score: 9999, is_disabled: false })
        .expect(200);
      
      expect(res.body.success).toBe(true);
    });

    it('Should allow admin to fetch master key', async () => {
      const res = await request(app)
        .get('/api/admin/master-key')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Anti-Cheat & Hardening', () => {
    it('Should enforce rate limiting on puzzle solves', async () => {
      const rtTeam = 'RateTeam_' + Date.now();
      const login = await request(app).post('/api/auth/login').send({ teamName: rtTeam, password: 'p' }).expect(200);
      const token = login.body.token;

      // Limit is 20 in test mode
      for(let i=0; i<20; i++) {
        await request(app).post('/api/puzzles/1/solve').set('Authorization', `Bearer ${token}`).send({ answer: 'wrong' });
      }

      const res = await request(app).post('/api/puzzles/1/solve').set('Authorization', `Bearer ${token}`).send({ answer: 'wrong' });
      expect(res.status).toBe(429);
    });
  });
});

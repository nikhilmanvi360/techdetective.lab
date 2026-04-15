import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, db } from '../server.js';

let authToken = '';
let adminToken = '';
const testTeamName = 'StandardUserTeam';

describe('Tech Detective API (Backend) - Deep Tests', () => {

  // 1. Auth Tests
  describe('Authentication flow', () => {
    it('POST /api/auth/login - create team and login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ teamName: testTeamName, password: 'password123' })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.team.name).toBe(testTeamName);
      authToken = response.body.token;
    });

    it('POST /api/auth/login - fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ teamName: testTeamName, password: 'wrongpassword' })
        .expect(401);
      
      expect(response.body.error).toBe('Invalid password');
    });

    it('POST /api/auth/login - get Admin Token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ teamName: 'CCU_ADMIN', password: 'admin123' })
        .expect(200);
      
      expect(response.body).toHaveProperty('token');
      adminToken = response.body.token;
    });

    it('POST /api/auth/login - fail on disabled team', async () => {
      // First manually disable a team in DB
      db.prepare('UPDATE teams SET is_disabled = 1 WHERE name = ?').run(testTeamName);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ teamName: testTeamName, password: 'password123' })
        .expect(403);
        
      expect(response.body.error).toContain('disabled');
      
      // Re-enable for the rest of the tests
      db.prepare('UPDATE teams SET is_disabled = 0 WHERE name = ?').run(testTeamName);
    });
  });

  // 2. Cases and Gameplay
  describe('Cases and Game Mechanics', () => {
    it('GET /api/cases - list active cases', async () => {
      const response = await request(app)
        .get('/api/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('status', 'active');
    });

    it('GET /api/cases/:id - get specific case data', async () => {
      const response = await request(app)
        .get('/api/cases/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('evidence');
      expect(response.body).toHaveProperty('puzzles');
    });

    it('GET /api/evidence/:id - strict locked evidence test', async () => {
      // Find an evidence that requires a puzzle. From init.ts, Evidence ID 2 (Portal Source Code) requires puzzle 1.
      const response = await request(app)
        .get('/api/evidence/2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
      expect(response.body.error).toContain('locked');
    });
    
    it('POST /api/puzzles/:id/hint - enforce 2 hints per case limit', async () => {
      // Case 1 has puzzles 1, 2, 3
      // Hint 1 should succeed
      const hint1 = await request(app)
        .post('/api/puzzles/1/hint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(hint1.body.success).toBe(true);

      // Hint 2 should succeed
      const hint2 = await request(app)
        .post('/api/puzzles/2/hint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(hint2.body.success).toBe(true);

      // Hint 3 on same case should fail
      const hint3 = await request(app)
        .post('/api/puzzles/3/hint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
      expect(hint3.body.error).toContain('Hint limit reached');
    });

    it('POST /api/puzzles/:id/solve - process solving with reduced points for using hint', async () => {
      // Puzzle 1 had a hint used. Its normal points are 20 (from init.ts). We should get 10 points base.
      const solve = await request(app)
        .post('/api/puzzles/1/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ answer: '192.168.1.45' })
        .expect(200);

      expect(solve.body.success).toBe(true);
      expect(solve.body.hintUsed).toBe(true);
      expect(solve.body.basePoints).toBe(10); 
    });

    it('GET /api/evidence/:id - should allow access after puzzle solved', async () => {
      const response = await request(app)
        .get('/api/evidence/2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(response.body).toHaveProperty('content');
    });

    it('POST /api/cases/:id/submit - process correct resolution', async () => {
      const response = await request(app)
        .post('/api/cases/1/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          attackerName: 'Shadow',
          attackMethod: 'Tested deep APIs',
          preventionMeasures: 'Nothing'
        })
        .expect(200);
      
      expect(response.body.isCorrect).toBe(true);
      expect(response.body).toHaveProperty('pointsAwarded');
    });
  });

  // 3. User profiles and metadata
  describe('Profile & Scoreboard APIs', () => {
    it('GET /api/team/profile - fetch team metadata', async () => {
      const response = await request(app)
        .get('/api/team/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.team.name).toBe(testTeamName);
      expect(response.body.solvedPuzzles.length).toBe(1);
      expect(response.body.submissions.length).toBe(1);
      // Since we used hints, Lone Wolf badge shouldn't be awarded. 
    });

    it('GET /api/scoreboard - verify ranking lists', async () => {
      const response = await request(app)
        .get('/api/scoreboard')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      // Ensure it's sorted by score descending implicitly
      if (response.body.length > 1) {
        expect(response.body[0].score).toBeGreaterThanOrEqual(response.body[1].score);
      }
    });
  });

  // 4. Admin Guard Tests
  describe('Admin Guard Security', () => {
    it('Reject Standard User from /api/admin/submissions', async () => {
      await request(app)
        .get('/api/admin/submissions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('Reject Standard User from /api/admin/master-key', async () => {
      await request(app)
        .get('/api/admin/master-key')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('Accept CCU_ADMIN for /api/admin/submissions', async () => {
      const response = await request(app)
        .get('/api/admin/submissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('Accept CCU_ADMIN for /api/admin/analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('Accept CCU_ADMIN for PUT /api/admin/teams/:id', async () => {
      // Find the ID of the test team
      const testTeam = db.prepare('SELECT id FROM teams WHERE name = ?').get(testTeamName) as any;
      const response = await request(app)
        .put(`/api/admin/teams/${testTeam.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'ChangedUserTeam', score: 9999, is_disabled: false })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
});

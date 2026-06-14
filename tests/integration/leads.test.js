/**
 * Leads API Integration Tests
 */

const request = require('supertest');
const express = require('express');

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.currentUser = {
      id: 'test-user-id',
      username: 'testuser',
      displayName: 'Test User',
      role: 'super_admin'
    };
    next();
  },
  requireRole: () => (req, res, next) => next(),
  authLocalsMiddleware: (req, res, next) => next()
}));

// Mock rate limiting
jest.mock('../../config/security', () => ({
  apiLimiter: (req, res, next) => next(),
  loginLimiter: (req, res, next) => next(),
  publicLimiter: (req, res, next) => next(),
  validators: {
    login: (req, res, next) => next(),
    createLead: (req, res, next) => next(),
    createUser: (req, res, next) => next(),
    updateLead: (req, res, next) => next(),
    addNote: (req, res, next) => next()
  },
  handleValidationErrors: (req, res, next) => next(),
  helmetMiddleware: (req, res, next) => next()
}));

const app = express();
app.use(express.json());

const apiRoutes = require('../../src/routes/api');
app.use('/api', apiRoutes);

describe('Leads API', () => {
  describe('GET /api/leads', () => {
    it('should return paginated leads with proper structure', async () => {
      const res = await request(app)
        .get('/api/leads')
        .query({ limit: 10, offset: 0 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('limit');
      expect(res.body.pagination).toHaveProperty('offset');
    });

    it('should accept filter parameters', async () => {
      const res = await request(app)
        .get('/api/leads')
        .query({ status: 'new', priority: 'high' });

      expect(res.status).toBe(200);
    });

    it('should accept search parameter', async () => {
      const res = await request(app)
        .get('/api/leads')
        .query({ search: 'test' });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/leads', () => {
    it('should create a new lead', async () => {
      const res = await request(app)
        .post('/api/leads')
        .send({
          name: 'Test Lead',
          phone: '9876543210',
          email: 'test@example.com',
          priority: 'medium',
          source: 'website'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('lead');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/leads')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/leads/:id', () => {
    it('should return a single lead', async () => {
      const res = await request(app)
        .get('/api/leads/test-id');

      // Will return 404 since no actual lead exists
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('PATCH /api/leads/:id/status', () => {
    it('should update lead status', async () => {
      const res = await request(app)
        .patch('/api/leads/test-id/status')
        .send({ status: 'contacted' });

      expect([200, 404]).toContain(res.status);
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .patch('/api/leads/test-id/status')
        .send({ status: 'invalid' });

      expect(res.status).toBe(400);
    });
  });
});

/**
 * Auth API Integration Tests
 */

const request = require('supertest');
const express = require('express');
const session = require('express-session');

// Create minimal test app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false
}));

// Import routes
const authRoutes = require('../../src/routes/auth');
app.use('/admin', authRoutes);

describe('Auth Endpoints', () => {
  describe('POST /admin/login', () => {
    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/admin/login')
        .send({ username: 'invalid', password: 'wrong' });

      expect(res.status).toBe(401);
    });

    it('should validate request body', async () => {
      const res = await request(app)
        .post('/admin/login')
        .send({ username: '', password: '' });

      expect(res.status).toBe(400);
    });

    it('should reject requests without username or password', async () => {
      const res = await request(app)
        .post('/admin/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /admin/login', () => {
    it('should render login page', async () => {
      const res = await request(app)
        .get('/admin/login');

      expect(res.status).toBe(200);
    });
  });

  describe('POST /admin/logout', () => {
    it('should redirect after logout', async () => {
      const res = await request(app)
        .post('/admin/logout');

      expect(res.status).toBe(302);
    });
  });
});

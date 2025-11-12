'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = 'test';

// Mock Redis client to avoid real connection
const fakeRedisStore = new Map();
const fakeRedis = {
  isOpen: true,
  async get(key) {
    return fakeRedisStore.get(key) || null;
  },
  async setEx(key, _ttl, value) {
    fakeRedisStore.set(key, value);
    return 'OK';
  },
  async setex(key, ttl, value) {
    return this.setEx(key, ttl, value);
  },
  async del(key) {
    fakeRedisStore.delete(key);
    return 1;
  },
  async incr(key) {
    const current = Number(fakeRedisStore.get(key) || 0);
    const next = current + 1;
    fakeRedisStore.set(key, String(next));
    return next;
  },
  async expire(_key, _ttl) {
    return 1;
  },
};
jest.mock('../../src/config/redis.config', () => ({
  initRedis: jest.fn(async () => fakeRedis),
  getRedisClient: jest.fn(() => fakeRedis),
}));

// Mock User model (Sequelize)
const mockUser = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  scope(name) {
    // for withSensitive or allStatuses just return same mock
    return this;
  },
};
jest.mock('../../src/models/user.model', () => mockUser);

// Build app after mocks are set up
const request = require('supertest');
const app = require('../../src/app');

describe('Auth API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fakeRedisStore.clear();
  });

  describe('POST /api/v1/auth/signup', () => {
    test('returns 201 with token and verification token on success', async () => {
      mockUser.findByEmail.mockResolvedValueOnce(null);
      mockUser.create.mockResolvedValueOnce({
        user_id: 'uuid-123',
        email: 'user@example.com',
        name: 'Name',
        role: 'farmer',
        email_verified: false,
      });

      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'user@example.com', password: 'Password1', name: 'Name' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('verification.token');
      const stored = await fakeRedis.get(`email-verify:${res.body.data.verification.token}`);
      expect(stored).toBe('uuid-123');
    });

    test('returns 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'bad', password: 'Password1', name: 'Name' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 409 when email already exists', async () => {
      mockUser.findByEmail.mockResolvedValueOnce({ user_id: 'existing' });

      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'user@example.com', password: 'Password1', name: 'Name' })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('returns 401 when user not found', async () => {
      mockUser.findByEmail.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nouser@example.com', password: 'Password1' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('returns 200 and token on successful login', async () => {
      // Use a bcrypt hash that will match 'Password1'
      const bcrypt = require('bcrypt');
      const password_hash = await bcrypt.hash('Password1', 10);

      const userObj = {
        user_id: 'uuid-abc',
        email: 'user@example.com',
        name: 'User',
        role: 'farmer',
        email_verified: true,
        password_hash,
        update: jest.fn(),
      };

      mockUser.findByEmail.mockResolvedValueOnce(userObj);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'user@example.com', password: 'Password1' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(userObj.update).toHaveBeenCalled(); // last_login updated
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    test('blacklists token and returns 200', async () => {
      // First sign up to get a token quickly
      mockUser.findByEmail.mockResolvedValueOnce(null);
      mockUser.create.mockResolvedValueOnce({
        user_id: 'uuid-logout',
        email: 'logout@example.com',
        name: 'User',
        role: 'farmer',
        email_verified: false,
      });

      const signup = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'logout@example.com', password: 'Password1', name: 'User' })
        .expect(201);

      const token = signup.body.data.token;

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      // Expect a blacklist entry to exist (value '1')
      // Note: cannot decode expiry easily, but existence check suffices
      const entry = await fakeRedis.get(`blacklist:${token}`);
      expect(entry).toBe('1');
    });
  });
});
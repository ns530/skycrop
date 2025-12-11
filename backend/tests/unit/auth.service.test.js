process.env.JWTSECRET = process.env.JWTSECRET || 'test-secret';

// Mock Redis config to avoid real connection
const fakeRedisStore = new Map();
const fakeRedis = {
  isOpen: true,
  async get(key) {
    return fakeRedisStore.get(key) || null;
  },
  async setEx(key, ttl, value) {
    // ignore ttl for unit tests
    fakeRedisStore.set(key, value);
    return 'OK';
  },
  async setex(key, ttl, value) {
    // compatibility alias
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
  async expire(key, ttl) {
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
  scope: function scope(name) {
    if (name === 'withSensitive') {
      return this;
    }
    if (name === 'allStatuses') {
      return this;
    }
    return this;
  },
};
jest.mock('../../src/models/user.model', () => mockUser);

const { AuthService } = require('../../src/services/auth.service');

describe('AuthService - signup/login', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    fakeRedisStore.clear();
    service = new AuthService();
  });

  test('signup rejects invalid email', async () => {
    await expect(service.signup('not-an-email', 'Password1', 'Name')).rejects.toMatchObject({
      code: 'VALIDATIONERROR',
    });
  });

  test('signup rejects weak password', async () => {
    await expect(service.signup('user@example.com', 'weak', 'Name')).rejects.toMatchObject({
      code: 'VALIDATIONERROR',
    });
  });

  test('signup rejects missing name', async () => {
    await expect(service.signup('user@example.com', 'Password1', '')).rejects.toMatchObject({
      code: 'VALIDATIONERROR',
    });
  });

  test('signup rejects duplicate email', async () => {
    mockUser.findByEmail.mockResolvedValueOnce({ user_id: 'u1' });
    await expect(service.signup('user@example.com', 'Password1', 'Name')).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });

  test('signup success issues jwt and verification token', async () => {
    mockUser.findByEmail.mockResolvedValueOnce(null);
    mockUser.create.mockResolvedValueOnce({
      user_id: 'uuid-123',
      email: 'user@example.com',
      name: 'Name',
      role: 'farmer',
      emailverified: false,
    });

    const result = await service.signup('user@example.com', 'Password1', 'Name');

    expect(mockUser.create).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('verification.token');
    const stored = await fakeRedis.get(`email-verify:${result.verification.token}`);
    expect(stored).toBe('uuid-123');
  });

  test('login fails with invalid credentials', async () => {
    mockUser.findByEmail.mockResolvedValueOnce(null); // user not found
    await expect(service.login('nouser@example.com', 'Password1')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  test('login locks after 5 failed attempts', async () => {
    // Provide a user with a password hash that won't match
    mockUser.findByEmail.mockResolvedValue({
      user_id: 'uuid-abc',
      email: 'user@example.com',
      name: 'User',
      role: 'farmer',
      emailverified: true,
      passwordhash: '$2b$10$invalid-hash-will-not-match',
      update: jest.fn(),
    });

    for (let i = 0; i < 5; i += 1) {
      await expect(service.login('user@example.com', 'WrongPass1')).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    }

    // 6th attempt should be locked immediately
    await expect(service.login('user@example.com', 'WrongPass1')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });

    expect(await fakeRedis.get('account-lock:uuid-abc')).toBe('locked');
  });
});

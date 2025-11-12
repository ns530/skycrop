'use strict';

process.env.NODE_ENV = 'test';

// In-memory fake Redis for unit tests
const store = new Map();
const fakeRedis = {
  isOpen: true,
  async get(key) {
    return store.has(key) ? store.get(key) : null;
  },
  async setEx(key, _ttl, value) {
    store.set(key, value);
    return 'OK';
  },
  async setex(key, ttl, value) {
    return this.setEx(key, ttl, value);
  },
  async del(keys) {
    if (Array.isArray(keys)) {
      let count = 0;
      for (const k of keys) {
        if (store.delete(k)) count += 1;
      }
      return count;
    }
    return store.delete(keys) ? 1 : 0;
  },
  async incr(key) {
    const cur = Number(store.get(key) || 0);
    const next = cur + 1;
    store.set(key, String(next));
    return next;
  },
  async expire(_key, _ttl) {
    return 1;
  },
  async scan(_cursor, opts = {}) {
    const { MATCH } = opts || {};
    const keys = Array.from(store.keys()).filter((k) => (!MATCH ? true : new RegExp(String(MATCH)).test(k)));
    return ['0', keys];
  },
};

// Mock Redis config to use in-memory client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedis,
  getRedisClient: () => fakeRedis,
}));

const crypto = require('crypto');
const { SatelliteService } = require('../../src/services/satellite.service');

describe('SatelliteService unit', () => {
  let svc;

  beforeEach(() => {
    store.clear();
    svc = new SatelliteService();
  });

  test('tileToBBox z=0, x=0, y=0 gives world extent (approx Web Mercator bounds)', () => {
    const bbox = svc.tileToBBox(0, 0, 0);
    // Web mercator latitude clamp ≈ 85.05112878
    expect(bbox[0]).toBeCloseTo(-180, 5);
    expect(bbox[2]).toBeCloseTo(180, 5);
    expect(bbox[1]).toBeCloseTo(-85.0511, 3);
    expect(bbox[3]).toBeCloseTo(85.0511, 3);
  });

  test('tileToBBox z=1, x=1, y=1 returns quadrant bbox', () => {
    const bbox = svc.tileToBBox(1, 1, 1);
    // Right-lower quadrant
    expect(bbox[0]).toBeCloseTo(0, 5);
    expect(bbox[2]).toBeCloseTo(180, 5);
    expect(bbox[1]).toBeLessThan(0);
    expect(bbox[3]).toBeCloseTo(0, 1);
  });

  test('tileToBBox validates invalid ranges', () => {
    expect(() => svc.tileToBBox(-1, 0, 0)).toThrow();
    expect(() => svc.tileToBBox(2, -1, 0)).toThrow();
    expect(() => svc.tileToBBox(2, 0, 4)).toThrow();
  });

  test('cache key generation stable', () => {
    const key = svc._tileKey(12, 3567, 2150, '2025-10-10', 'RGB,NIR', 20);
    expect(key).toBe('satellite:tile:12:3567:2150:2025-10-10:RGB,NIR:20');
  });

  test('ETag generation via SHA1 of bytes', () => {
    const etag = svc._sha1(Buffer.from('hello-world'));
    const expected = crypto.createHash('sha1').update(Buffer.from('hello-world')).digest('hex');
    expect(etag).toBe(expected);
  });

  test('Idempotency hashing stable for same payload', () => {
    const a = svc._stableHash({ a: 1, b: 2 });
    const b = svc._stableHash({ b: 2, a: 1 }); // different order, same content
    expect(a).toBe(b);
  });
});
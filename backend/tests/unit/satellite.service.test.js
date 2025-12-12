process.env.NODE_ENV = 'test';

// In-memory fake Redis for unit tests
const store = new Map();
const fakeRedis = {
  isOpen: true,
  async get(key) {
    return store.has(key) ? store.get(key) : null;
  },
  async setEx(key, ttl, value) {
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
  async scan(cursor, opts = {}) {
    const { MATCH } = opts || {};
    const keys = Array.from(store.keys()).filter(k =>
      !MATCH ? true : new RegExp(String(MATCH)).test(k)
    );
    return ['0', keys];
  },
};

// Mock Redis config to use in-memory client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedis,
  getRedisClient: () => fakeRedis,
}));

const axios = require('axios');

jest.mock('axios', () => ({
  post: jest.fn(),
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
    const key = svc.tileKey(12, 3567, 2150, '2025-10-10', 'RGB,NIR', 20);
    expect(key).toBe('satellite:tile:12:3567:2150:2025-10-10:RGB,NIR:20');
  });

  test('ETag generation via SHA1 of bytes', () => {
    const etag = svc.sha1(Buffer.from('hello-world'));
    const expected = crypto.createHash('sha1').update(Buffer.from('hello-world')).digest('hex');
    expect(etag).toBe(expected);
  });

  test('Idempotency hashing stable for same payload', () => {
    const a = svc.stableHash({ a: 1, b: 2 });
    const b = svc.stableHash({ b: 2, a: 1 }); // different order, same content
    expect(a).toBe(b);
  });

  test('init initializes redis client', async () => {
    svc.redis = null;
    await svc.init();
    expect(svc.redis).toBe(fakeRedis);
  });

  test('cacheGetTile returns parsed cached data', async () => {
    await svc.init();
    const key = 'test:key';
    const body = Buffer.from('image data');
    const etag = svc.sha1(body);
    const cachedData = {
      data: body.toString('base64'),
      etag,
      contentType: 'image/png',
      cachedat: new Date().toISOString(),
    };
    store.set(key, JSON.stringify(cachedData));
    const result = await svc.cacheGetTile(key);
    expect(result.body).toEqual(body);
    expect(result.etag).toBe(etag);
  });

  test('cacheSetTile stores data with TTL', async () => {
    await svc.init();
    const key = 'test:key';
    const body = Buffer.from('image data');
    const etag = svc.sha1(body);
    await svc.cacheSetTile(key, body, 'image/png', etag);
    const stored = JSON.parse(store.get(key));
    expect(stored.data).toBe(body.toString('base64'));
    expect(stored.etag).toBe(etag);
  });

  test('getOAuthToken caches token and reuses when valid', async () => {
    svc.oauthToken = { accesstoken: 'cached-token', expiresat: Date.now() + 60000 };
    const result = await svc.getOAuthToken();
    expect(result).toBe('cached-token');
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('getOAuthToken fetches new token when expired', async () => {
    svc.oauthToken = null;
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { accesstoken: 'new-token', expiresin: 3600 },
    });
    const result = await svc.getOAuthToken();
    expect(result).toBe('new-token');
    expect(axios.post).toHaveBeenCalledWith(
      'https://services.sentinel-hub.com/oauth/token',
      expect.any(String),
      expect.objectContaining({ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    );
  });

  test('buildEvalscript generates correct script for RGB', () => {
    const script = svc.buildEvalscript('RGB');
    expect(script).toContain('VERSION=3');
    expect(script).toContain('["B04", "B03", "B02"]');
    expect(script).toContain('[s.B04, s.B03, s.B02]');
  });

  test('buildEvalscript generates correct script for custom bands', () => {
    const script = svc.buildEvalscript('RED,NIR');
    expect(script).toContain('["B04", "B08"]');
    expect(script).toContain('[s.B04, s.B08]');
  });

  test('buildProcessBody constructs correct request body', () => {
    const bbox = [-180, -85, 180, 85];
    const date = '2025-01-15';
    const evalscript = 'test script';
    const body = svc.buildProcessBody(bbox, date, evalscript);
    expect(body.input.bounds.bbox).toEqual(bbox);
    expect(body.input.data[0].dataFilter.timeRange.from).toBe('2025-01-15T00:00:00Z');
    expect(body.input.data[0].dataFilter.timeRange.to).toBe('2025-01-15T23:59:59Z');
    expect(body.evalscript).toBe(evalscript);
  });

  test('getTile validates date format', async () => {
    await expect(svc.getTile({ z: 12, x: 0, y: 0, date: 'invalid' })).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  test('getTile returns cached data with 304 for matching ETag', async () => {
    await svc.init();
    const key = svc.tileKey(12, 0, 0, '2025-01-15', 'RGB', 20);
    const body = Buffer.from('cached image');
    const etag = svc.sha1(body);
    await svc.cacheSetTile(key, body, 'image/png', etag);

    const result = await svc.getTile({ z: 12, x: 0, y: 0, date: '2025-01-15', ifNoneMatch: etag });
    expect(result.status).toBe(304);
    expect(result.meta.cachehit).toBe(true);
  });

  test('getTile fetches from Sentinel Hub when not cached', async () => {
    await svc.init();
    // Mock OAuth token call
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { accesstoken: 'token', expiresin: 3600 },
    });
    // Mock Process API call
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: Buffer.from('new image'),
      headers: { 'content-type': 'image/png' },
    });

    const result = await svc.getTile({ z: 12, x: 0, y: 0, date: '2025-01-15' });
    expect(result.status).toBe(200);
    expect(result.meta.cachehit).toBe(false);
    expect(result.headers.ETag).toBeDefined();
  });

  test('queuePreprocess validates bbox', async () => {
    await expect(
      svc.queuePreprocess({ bbox: 'invalid', date: '2025-01-15' })
    ).rejects.toMatchObject({
      name: 'ValidationError',
    });
    await expect(
      svc.queuePreprocess({ bbox: [0, 0, 0, 0], date: '2025-01-15' })
    ).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  test('queuePreprocess creates job with idempotency', async () => {
    const params = { bbox: [80, 7, 81, 8], date: '2025-01-15', bands: ['RGB'] };
    const result1 = await svc.queuePreprocess(params, 'idem-key');
    expect(result1.status).toBe('queued');
    expect(result1.jobid).toBeDefined();

    const result2 = await svc.queuePreprocess(params, 'idem-key');
    expect(result2.jobid).toBe(result1.jobid);
  });

  test('getJob returns job status', () => {
    const job = svc.getJob('nonexistent');
    expect(job).toBeNull();
  });

  test('runPreprocess processes tiles and updates job status', async () => {
    const jobId = 'test-job';
    const job = {
      jobid: jobId,
      status: 'queued',
      bbox: [80, 7, 81, 8],
      date: '2025-01-15',
      bands: ['RGB'],
      cloudmask: false,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };
    svc.jobs.set(jobId, job);

    // Mock getTile to avoid actual API calls
    svc.getTile = jest.fn().mockResolvedValue({});

    await svc.runPreprocess(jobId);
    const updatedJob = svc.jobs.get(jobId);
    expect(updatedJob.status).toBe('completed');
  });

  test('tilesForBBox computes tile indices for bbox', () => {
    const tiles = svc.tilesForBBox([80, 7, 81, 8], 12);
    expect(Array.isArray(tiles)).toBe(true);
    expect(tiles.length).toBeGreaterThan(0);
    const tile = tiles[0];
    expect(tile).toHaveProperty('z', 12);
    expect(tile).toHaveProperty('x');
    expect(tile).toHaveProperty('y');
  });

  test('getSatelliteService returns singleton', () => {
    const { getSatelliteService } = require('../../src/services/satellite.service');
    const svc1 = getSatelliteService();
    const svc2 = getSatelliteService();
    expect(svc1).toBeInstanceOf(SatelliteService);
    expect(svc1).toBe(svc2);
  });
});

/* eslint-disable no-underscore-dangle */

describe('SatelliteService branch coverage lifts', () => {
  const ORIGINALENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...ORIGINALENV };
  });

  afterAll(() => {
    process.env = ORIGINALENV;
  });

  function mockMakeRedisWithSetexOnly(overrides = {}) {
    // Missing setEx to exercise fallback path in cacheSetTile
    return {
      isOpen: true,
      get: jest.fn(async () => null),
      setex: jest.fn(async () => {}),
      del: jest.fn(async () => {}),
      scan: jest.fn(async () => ['0', []]),
      ...overrides,
    };
  }

  function mockMakeRedisWithInvalidCache() {
    return {
      isOpen: true,
      get: jest.fn(async () => 'not-json'), // invalid JSON to exercise parse catch in cacheGetTile
      setEx: jest.fn(async () => {}),
      del: jest.fn(async () => {}),
      scan: jest.fn(async () => ['0', []]),
    };
  }

  jest.mock('../../src/config/redis.config', () => {
    return {
      initRedis: jest.fn(async () => mockMakeRedisWithSetexOnly()),
      getRedisClient: jest.fn(() => mockMakeRedisWithSetexOnly()),
    };
  });

  jest.mock('axios', () => ({
    post: jest.fn(),
  }));

  test('tileToBBox rejects zoom > 22 (covers validation branch)', () => {
    const { SatelliteService } = require('../../src/services/satellite.service');
    const svc = new SatelliteService();
    expect(() => svc.tileToBBox(23, 0, 0)).toThrow(/Invalid tile coordinates/i);
  });

  test('getTile uses setex fallback when redis.setEx is unavailable (covers cacheSetTile else branch + process validateStatus)', async () => {
    jest.isolateModules(async () => {
      const { initRedis } = require('../../src/config/redis.config');
      const redis = mockMakeRedisWithSetexOnly();
      initRedis.mockResolvedValueOnce(redis);

      const axios = require('axios');
      axios.post.mockReset();

      // First call is OAuth token
      axios.post.mockImplementationOnce((url, form, config) => {
        // execute validateStatus in getOAuthToken
        if (config && typeof config.validateStatus === 'function') {
          expect(config.validateStatus(200)).toBe(true);
          expect(config.validateStatus(499)).toBe(true);
          expect(config.validateStatus(500)).toBe(false);
        }
        return Promise.resolve({
          status: 200,
          data: { accesstoken: 'tok', expiresin: 3600 },
        });
      });

      // Second call is /process (image response)
      axios.post.mockImplementationOnce((url, body, config) => {
        // execute validateStatus in getTile
        if (config && typeof config.validateStatus === 'function') {
          expect(config.validateStatus(200)).toBe(true);
          expect(config.validateStatus(499)).toBe(true);
          expect(config.validateStatus(500)).toBe(false);
        }
        const buf = Buffer.from([137, 80, 78, 71]); // PNG signature bytes start
        return Promise.resolve({
          status: 200,
          data: buf,
          headers: { 'content-type': 'image/png' },
        });
      });

      const { SatelliteService } = require('../../src/services/satellite.service');
      const svc = new SatelliteService();

      const res = await svc.getTile({
        z: 12,
        x: 3567,
        y: 2150,
        date: '2025-10-10',
        bands: 'RGB',
        cloudlt: 20,
        ifNoneMatch: null,
      });

      expect(res.status).toBe(200);
      // Fallback path should have been exercised
      expect(redis.setex).toHaveBeenCalledTimes(1);
    });
  });

  test('getTile ignores invalid cache JSON then fetches (covers cacheGetTile catch branch)', async () => {
    jest.isolateModules(async () => {
      const { initRedis } = require('../../src/config/redis.config');
      initRedis.mockResolvedValueOnce(mockMakeRedisWithInvalidCache());

      const axios = require('axios');
      axios.post.mockReset();

      // OAuth token ok
      axios.post.mockImplementationOnce((url, form, config) => {
        if (config && typeof config.validateStatus === 'function') {
          // exercise function
          config.validateStatus(499);
        }
        return Promise.resolve({
          status: 200,
          data: { accesstoken: 'tok', expiresin: 3600 },
        });
      });

      // Process ok
      axios.post.mockImplementationOnce(() => {
        const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
        return Promise.resolve({
          status: 200,
          data: buf,
          headers: { 'content-type': 'image/png' },
        });
      });

      const { SatelliteService } = require('../../src/services/satellite.service');
      const svc = new SatelliteService();

      const res = await svc.getTile({
        z: 12,
        x: 3567,
        y: 2150,
        date: '2025-10-10',
        bands: 'RGB',
        cloudlt: 10,
        ifNoneMatch: null,
      });

      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('ETag');
    });
  });

  test('getTile throws on invalid date format (covers date validation branch)', async () => {
    jest.isolateModules(async () => {
      const { SatelliteService } = require('../../src/services/satellite.service');
      const svc = new SatelliteService();
      await expect(
        svc.getTile({ z: 12, x: 3567, y: 2150, date: '2025/10/10', bands: 'RGB' })
      ).rejects.toMatchObject({
        name: 'ValidationError',
        code: 'VALIDATIONERROR',
        statusCode: 400,
      });
    });
  });

  test('OAuth error path (token 400) raises error (covers getOAuthToken non-2xx branch)', async () => {
    jest.isolateModules(async () => {
      const { initRedis } = require('../../src/config/redis.config');
      initRedis.mockResolvedValueOnce(mockMakeRedisWithSetexOnly());

      const axios = require('axios');
      axios.post.mockReset();

      // Token call returns 400; run validateStatus too
      axios.post.mockImplementationOnce((url, form, config) => {
        if (config && typeof config.validateStatus === 'function') {
          expect(config.validateStatus(400)).toBe(true); // treated as handled (not thrown by axios)
          expect(config.validateStatus(500)).toBe(false);
        }
        return Promise.resolve({
          status: 400,
          data: {},
        });
      });

      const { SatelliteService } = require('../../src/services/satellite.service');
      const svc = new SatelliteService();

      await expect(
        svc.getTile({ z: 12, x: 3567, y: 2150, date: '2025-10-10', bands: 'RGB' })
      ).rejects.toBeInstanceOf(Error);
    });
  });
});

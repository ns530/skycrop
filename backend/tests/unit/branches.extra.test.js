'use strict';

const axios = require('axios');

// In-memory fake Redis (shared)
const store = new Map();
function matchPattern(key, pattern) {
  const re = new RegExp('^' + String(pattern).replace(/[.+^${}()|[\\]\\\\]/g, '\\$&').replace(/\\\*/g, '.*') + '$');
  return re.test(key);
}
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
    const keys = Array.from(store.keys()).filter((k) => (!MATCH ? true : matchPattern(k, MATCH)));
    return ['0', keys];
  },
};

// Mock Redis for services
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedis,
  getRedisClient: () => fakeRedis,
}));

const { sequelize } = require('../../src/config/database.config');
const { FieldService } = require('../../src/services/field.service');
const { SatelliteService } = require('../../src/services/satellite.service');
const { MLGatewayService } = require('../../src/services/mlGateway.service');
const { ValidationError, AppError } = require('../../src/errors/custom-errors');

describe('Branch coverage extras', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.clear();
  });

  describe('FieldService.list additional branches', () => {
    let service;
    let querySpy;

    beforeEach(() => {
      service = new FieldService();
      querySpy = jest.spyOn(sequelize, 'query').mockImplementation(async (sql, { replacements } = {}) => {
        // Return a minimal windowed row
        return [
          {
            field_id: 'f1',
            user_id: replacements?.userId || 'user-1',
            name: 'A',
            boundary: { type: 'MultiPolygon', coordinates: [[[80.1, 7.2]]] },
            area_sqm: 12000,
            center: { type: 'Point', coordinates: [80.11, 7.21] },
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_count: 1,
          },
        ];
      });
    });

    afterEach(() => {
      if (querySpy) querySpy.mockRestore();
    });

    test('intersects "field:{id}" path builds subselect for boundary', async () => {
      await service.list('user-1', { intersects: 'field:xyz-123' });
      const sql = sequelize.query.mock.calls[0][0];
      expect(sql).toMatch(/SELECT[\s\S]*FROM\s+fields\s+f[\s\S]*WHERE/i);
      expect(sql).toMatch(/SELECT boundary FROM fields f2 WHERE f2\.field_id = :intersectsFieldId AND f2\.user_id = :userId/i);
    });

    test('invalid intersects string (neither field: nor GeoJSON) throws ValidationError', async () => {
      await expect(service.list('user-1', { intersects: 'not-json-and-not-field' })).rejects.toBeInstanceOf(ValidationError);
      expect(sequelize.query).toHaveBeenCalledTimes(0);
    });

    test('near with invalid radius (0) throws ValidationError', async () => {
      await expect(service.list('user-1', { near: '7.2,80.1,0' })).rejects.toBeInstanceOf(ValidationError);
      expect(sequelize.query).toHaveBeenCalledTimes(0);
    });
  });

  describe('SatelliteService negative/error branches', () => {
    let svc;

    beforeEach(() => {
      process.env.SENTINELHUB_BASE_URL = 'https://services.sentinel-hub.com';
      process.env.SENTINELHUB_TOKEN_URL = 'https://services.sentinel-hub.com/oauth/token';
      process.env.SENTINELHUB_CLIENT_ID = 'test-client';
      process.env.SENTINELHUB_CLIENT_SECRET = 'test-secret';
      svc = new SatelliteService();
    });

    test('getTile invalid date format -> ValidationError', async () => {
      await expect(
        svc.getTile({ z: 12, x: 3567, y: 2150, date: '20251010', bands: 'RGB', cloud_lt: 20, ifNoneMatch: null })
      ).rejects.toBeInstanceOf(ValidationError);
    });

    test('getTile downstream 5xx maps to 502 (AppError-like)', async () => {
      const spy = jest.spyOn(axios, 'post').mockImplementation(async (url, data, config) => {
        if (String(url).includes('/oauth/token')) {
          return { status: 200, data: { access_token: 'access', expires_in: 3600 } };
        }
        if (String(url).includes('/api/v1/process')) {
          return { status: 500, data: {} };
        }
        return { status: 500, data: {} };
      });

      await expect(
        svc.getTile({ z: 12, x: 3567, y: 2150, date: '2025-10-10', bands: 'RGB', cloud_lt: 20, ifNoneMatch: null })
      ).rejects.toMatchObject({ statusCode: 502 });

      spy.mockRestore();
    });

    test('queuePreprocess invalid bbox extents (min>=max) -> ValidationError', async () => {
      await expect(
        svc.queuePreprocess({ bbox: [80.2, 7.2, 80.1, 7.3], date: '2025-10-10', bands: ['RGB'], cloud_mask: false }, null)
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('MLGatewayService downstream default error mappings', () => {
    let svc;
    beforeEach(() => {
      svc = new MLGatewayService();
    });

    function mkResp(status, body) {
      return { status, data: body || {} };
    }

    test('404 without code -> MODEL_NOT_FOUND 404', () => {
      const e = svc._mapDownstreamError(mkResp(404, {}));
      expect(e).toBeInstanceOf(AppError);
      expect(e.code).toBe('MODEL_NOT_FOUND');
      expect(e.statusCode).toBe(404);
    });

    test('504/408 without code -> TIMEOUT 504', () => {
      const e1 = svc._mapDownstreamError(mkResp(504, {}));
      expect(e1.code).toBe('TIMEOUT');
      expect(e1.statusCode).toBe(504);
      const e2 = svc._mapDownstreamError(mkResp(408, {}));
      expect(e2.code).toBe('TIMEOUT');
      expect(e2.statusCode).toBe(504);
    });

    test('generic 4xx without code -> INVALID_INPUT 400', () => {
      const e = svc._mapDownstreamError(mkResp(422, {}));
      expect(e.code).toBe('INVALID_INPUT');
      expect(e.statusCode).toBe(400);
    });
  });
});

// ---- Additional branch coverage lifts ----

describe('SatelliteService additional branches', () => {
  let svc;
  beforeEach(() => {
    process.env.SENTINELHUB_BASE_URL = 'https://services.sentinel-hub.com';
    process.env.SENTINELHUB_TOKEN_URL = 'https://services.sentinel-hub.com/oauth/token';
    process.env.SENTINELHUB_CLIENT_ID = 'test-client';
    process.env.SENTINELHUB_CLIENT_SECRET = 'test-secret';
    svc = new (require('../../src/services/satellite.service').SatelliteService)();
    // ensure internal redis client is available for cache helpers
    svc.redis = fakeRedis;
  });

  test('_buildEvalscript non-RGB bands path is exercised', () => {
    const script = svc._buildEvalscript('RED,NIR');
    expect(script).toMatch(/"B04"/);
    expect(script).toMatch(/"B08"/);
    expect(script).toMatch(/output:\s*{\s*bands:\s*2/i);
  });

  test('_cacheSetTile uses setex fallback when setEx not present; _cacheGetTile invalid JSON returns null', async () => {
    // Use an isolated minimal redis that only exposes setex/get so code path falls back to setex
    const localStore = new Map();
    const minimalRedis = {
      async get(k) {
        return localStore.has(k) ? localStore.get(k) : null;
      },
      async setex(k, ttl, v) {
        localStore.set(k, v);
        return 'OK';
      },
    };
    // swap redis on service to the minimal one
    svc.redis = minimalRedis;

    const key = 'satellite:tile:12:1:1:2025-01-01:RGB:20';
    const body = Buffer.from('abc');
    await svc._cacheSetTile(key, body, 'image/png', 'etag-1');

    // Force invalid JSON to exercise parse failure branch in _cacheGetTile
    localStore.set(key, '{not-json}');
    const got = await svc._cacheGetTile(key);
    expect(got).toBeNull();
  });

  test('_getOAuthToken failure path throws with statusCode', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 400, data: {} });
    await expect(svc._getOAuthToken()).rejects.toMatchObject({ statusCode: 400 });
    postSpy.mockRestore();
  });
});

describe('MLGatewayService network error branch', () => {
  test('axios.post throws -> AppError UPSTREAM_ERROR 502', async () => {
    const { MLGatewayService } = require('../../src/services/mlGateway.service');
    const svc = new MLGatewayService();
    const spy = jest.spyOn(axios, 'post').mockRejectedValue(new Error('network failure'));

    await expect(
      svc.predict({ bbox: [80.1, 7.2, 80.2, 7.3], date: '2025-10-10', return: 'mask_url' }, 'corr-net-1')
    ).rejects.toMatchObject({ code: 'UPSTREAM_ERROR', statusCode: 502 });

    spy.mockRestore();
  });
});

describe('WeatherService additional branches', () => {
  let svc;
  beforeEach(() => {
    process.env.OPENWEATHER_API_KEY = 'test-key';
    svc = new (require('../../src/services/weather.service').WeatherService)();
  });

  test('_fieldCenterToLatLon invalid center triggers ValidationError early', async () => {
    const Field = require('../../src/models/field.model');
    jest.spyOn(Field, 'findOne').mockResolvedValue({
      field_id: 'fid-x',
      user_id: 'user-1',
      status: 'active',
      center: null, // invalid
    });
    await expect(svc.getCurrentByField('user-1', 'fid-x')).rejects.toBeInstanceOf(ValidationError);
  });

  test('provider failure falls back to cached value when available', async () => {
    const Field = require('../../src/models/field.model');
    jest.spyOn(Field, 'findOne').mockResolvedValue({
      field_id: 'fid-y',
      user_id: 'user-1',
      status: 'active',
      center: { type: 'Point', coordinates: [80.11, 7.21] },
    });

    const cacheKey = 'weather:current:fid-y';
    const cached = {
      field_id: 'fid-y',
      coord: { lat: 7.21, lon: 80.11 },
      current: { temp: 26 },
      source: 'openweathermap_onecall',
      fetched_at: new Date().toISOString(),
    };
    if (typeof fakeRedis.setEx === 'function') {
      await fakeRedis.setEx(cacheKey, 21600, JSON.stringify(cached));
    } else {
      await fakeRedis.setex(cacheKey, 21600, JSON.stringify(cached));
    }

    // Simulate provider 5xx so _requestWithRetry will ultimately throw,
    // but getCurrentByField should return cached fallback.
    jest.spyOn(axios, 'get').mockResolvedValue({ status: 500, data: {} });

    const out = await svc.getCurrentByField('user-1', 'fid-y');
    expect(out.meta.source).toBe('cache');
    expect(out.meta.cache).toBe('hit');
    expect(out.data.current.temp).toBe(26);
  });
});
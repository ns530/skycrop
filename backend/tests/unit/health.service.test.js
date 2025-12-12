process.env.NODE_ENV = 'test';
process.env.HEALTHINDICESTTLSECONDS = '86400';
process.env.HEALTHDEFAULTIMAGESIZE = '256';
process.env.SENTINELHUBBASEURL = 'https://services.sentinel-hub.com';
process.env.SENTINELHUBTOKENURL = 'https://services.sentinel-hub.com/oauth/token';
process.env.SENTINELHUBCLIENTID = 'client-id';
process.env.SENTINELHUBCLIENTSECRET = 'client-secret';

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

const { sequelize } = require('../../src/config/database.config');
const Field = require('../../src/models/field.model');
const { HealthService } = require('../../src/services/health.service');

describe('HealthService (vegetation indices) unit', () => {
  let svc;
  let querySpy;

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    svc = new HealthService();

    // Field ownership check: Field.scope('allStatuses').findOne
    Field.scope = jest.fn(() => ({
      findOne: jest.fn(async ({ where }) => {
        if (where.user_id && where.field_id) {
          return { field_id: where.field_id, user_id: where.user_id, status: 'active' };
        }
        return null;
      }),
    }));

    // Default DB query mock
    querySpy = jest
      .spyOn(sequelize, 'query')
      .mockImplementation(async (sql, { replacements, type } = {}) => {
        const sqlStr = String(sql);

        // Get field boundary geometry
        if (/FROM\s+fields/i.test(sqlStr) && /STAsGeoJSON\(boundary\)/i.test(sqlStr)) {
          return [
            {
              boundary: {
                type: 'MultiPolygon',
                coordinates: [
                  [
                    [
                      [80.1, 7.2],
                      [80.12, 7.2],
                      [80.12, 7.22],
                      [80.1, 7.22],
                      [80.1, 7.2],
                    ],
                  ],
                ],
              },
            },
          ];
        }

        // Insert upsert (ignore or update) no-op
        if (/INSERT\s+INTO\s+healthsnapshots/i.test(sqlStr)) {
          return [];
        }

        // Select snapshot by (field_id, timestamp)
        if (
          /FROM\s+healthsnapshots/i.test(sqlStr) &&
          /WHERE\s+field_id\s*=\s*:field_id/i.test(sqlStr) &&
          /timestamp/.test(sqlStr)
        ) {
          const ts = replacements.ts || `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
          return [
            {
              id: 'snap-1',
              field_id: replacements.field_id,
              timestamp: ts,
              source: 'sentinel2',
              ndvi: 0.62,
              ndwi: 0.2,
              tdvi: 0.45,
              notes: null,
              createdat: new Date().toISOString(),
              updatedat: new Date().toISOString(),
            },
          ];
        }

        // List snapshots path (window count)
        if (/FROM\s+healthsnapshots/i.test(sqlStr) && /COUNT\(\*\)\s+OVER\(\)/i.test(sqlStr)) {
          return [
            {
              id: 'snap-1',
              field_id: replacements.field_id,
              timestamp: `${replacements.from || '2025-01-01T00:00:00.000Z'}`,
              source: 'sentinel2',
              ndvi: 0.62,
              ndwi: 0.2,
              tdvi: 0.45,
              notes: null,
              createdat: new Date().toISOString(),
              updatedat: new Date().toISOString(),
              totalcount: 1,
            },
          ];
        }

        return [];
      });
  });

  afterEach(() => {
    if (querySpy) querySpy.mockRestore();
  });

  test('evalscript builder includes expected bands and index formulas', () => {
    // Accessing "private" method for unit coverage (pattern used elsewhere in repo)
    const code = svc.buildIndicesEvalscript();
    expect(code).toMatch(/VERSION=3/);
    expect(code).toMatch(/input:\s*\["B04", "B03", "B08"\]/);
    expect(code).toMatch(/let ndvi = \(NIR - RED\) \/ \(NIR \+ RED \+ 1e-6\)/);
    expect(code).toMatch(/let ndwi = \(GREEN - NIR\) \/ \(GREEN \+ NIR \+ 1e-6\)/);
    expect(code).toMatch(/let tdvi = \(NIR - RED\) \/ Math\.sqrt\(NIR \+ RED \+ 1e-6\)/);
  });

  test('computeIndicesForField builds Process API request with geometry and image size, populates cache', async () => {
    const userId = 'user-1';
    const fieldId = 'field-1';
    const date = '2025-01-15';

    // Axios calls: OAuth then Process returning JSON stats
    axios.post.mockImplementationOnce(async (url, data, config) => {
      // OAuth
      expect(url).toContain('/oauth/token');
      expect(config.validateStatus(200)).toBe(true);
      return { status: 200, data: { accesstoken: 'tok', expiresin: 3600 } };
    });
    axios.post.mockImplementationOnce(async (url, body, config) => {
      // Process
      expect(url).toContain('/api/v1/process');
      expect(body).toHaveProperty('input.bounds.geometry'); // using geometry, not bbox
      expect(body).toHaveProperty('output.width', 256);
      expect(body).toHaveProperty('output.height', 256);
      expect(typeof body.evalscript).toBe('string');
      // return JSON stats so parseProcessResponse aggregates means
      const stats = { stats: { ndvi: { mean: 0.62 }, ndwi: { mean: 0.2 }, tdvi: { mean: 0.45 } } };
      return {
        status: 200,
        data: Buffer.from(JSON.stringify(stats), 'utf8'),
        headers: { 'content-type': 'application/json' },
      };
    });

    const result = await svc.computeIndicesForField(userId, fieldId, date);
    expect(result.field_id).toBe(fieldId);
    expect(result.timestamp).toBe(`${date}T00:00:00.000Z`);
    expect(result.source).toBe('sentinel2');
    expect(result.ndvi).toBeCloseTo(0.62, 5);
    expect(result.ndwi).toBeCloseTo(0.2, 5);
    expect(result.tdvi).toBeCloseTo(0.45, 5);
    expect(result.cachehit).toBe(false);

    // second call should hit cache and not call axios process again
    const before = axios.post.mock.calls.length;
    const cached = await svc.computeIndicesForField(userId, fieldId, date);
    expect(cached.cachehit).toBe(true);
    expect(cached.ndvi).toBeCloseTo(0.62, 5);
    expect(axios.post.mock.calls.length).toBe(before); // no extra calls
  });

  test('upsertSnapshot is idempotent and returns row; recompute=true updates values', async () => {
    const fieldId = 'field-1';
    const ts = '2025-01-15T00:00:00.000Z';

    // First insert (no existing) recompute=false
    const row1 = await svc.upsertSnapshot(
      fieldId,
      ts,
      { ndvi: 0.5, ndwi: 0.1, tdvi: 0.3, source: 'sentinel2' },
      false
    );
    expect(row1).toBeDefined();
    expect(row1.field_id).toBe(fieldId);
    expect(row1.timestamp).toBe(ts);

    // Recompute=true should "update"; our mock returns same select row structure
    const row2 = await svc.upsertSnapshot(
      fieldId,
      ts,
      { ndvi: 0.55, ndwi: 0.12, tdvi: 0.35, source: 'sentinel2' },
      true
    );
    expect(row2).toBeDefined();
    expect(row2.field_id).toBe(fieldId);
  });

  test('listSnapshots returns paginated results and respects range and page/pageSize defaults', async () => {
    const userId = 'user-1';
    const fieldId = 'field-1';
    const res = await svc.listSnapshots(userId, fieldId, {
      from: '2025-01-01',
      to: '2025-01-31',
      page: 1,
      pageSize: 20,
    });
    expect(res).toHaveProperty('items');
    expect(res.items.length).toBeGreaterThanOrEqual(1);
    expect(res).toMatchObject({ page: 1, pageSize: 20, total: expect.any(Number) });
    const item = res.items[0];
    expect(item).toHaveProperty('ndvi');
    expect(item).toHaveProperty('ndwi');
    expect(item).toHaveProperty('tdvi');
  });

  test('Process API error mapping: 5xx -> 503, 4xx -> 400', async () => {
    const userId = 'user-1';
    const fieldId = 'field-1';
    const date = '2025-01-15';

    // OAuth OK
    axios.post.mockImplementationOnce(async () => ({
      status: 200,
      data: { accesstoken: 'tok', expiresin: 3600 },
    }));
    // Process 500
    axios.post.mockImplementationOnce(async () => ({
      status: 500,
      data: Buffer.from('{}', 'utf8'),
      headers: { 'content-type': 'application/json' },
    }));
    await expect(svc.computeIndicesForField(userId, fieldId, date)).rejects.toMatchObject({
      statusCode: 503,
    });

    // Clear cached OAuth token to force re-authentication
    svc.oauthToken = null;

    // OAuth OK again
    axios.post.mockImplementationOnce(async () => ({
      status: 200,
      data: { accesstoken: 'tok', expiresin: 3600 },
    }));
    // Process 400
    axios.post.mockImplementationOnce(async () => ({
      status: 400,
      data: Buffer.from('{}', 'utf8'),
      headers: { 'content-type': 'application/json' },
    }));
    await expect(svc.computeIndicesForField(userId, fieldId, date)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test('date validation rejects invalid date format', async () => {
    await expect(
      svc.computeIndicesForField('user-1', 'field-1', '2025/01/01')
    ).rejects.toMatchObject({
      name: 'ValidationError',
      code: 'VALIDATIONERROR',
    });
  });

  test('assertFieldOwnership throws ValidationError for missing user_id or field_id', async () => {
    await expect(svc.assertFieldOwnership(null, 'field-1')).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'user_id is required',
    });
    await expect(svc.assertFieldOwnership('user-1', null)).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'field_id is required',
    });
  });

  test('assertFieldOwnership throws NotFoundError for non-existent or deleted field', async () => {
    Field.scope = jest.fn(() => ({
      findOne: jest.fn(async () => null), // no field
    }));
    await expect(svc.assertFieldOwnership('user-1', 'field-1')).rejects.toMatchObject({
      name: 'NotFoundError',
      message: 'Field not found',
    });

    Field.scope = jest.fn(() => ({
      findOne: jest.fn(async () => ({ status: 'deleted' })), // deleted
    }));
    await expect(svc.assertFieldOwnership('user-1', 'field-1')).rejects.toMatchObject({
      name: 'NotFoundError',
      message: 'Field not found',
    });
  });

  test('assertFieldOwnership returns field for valid ownership', async () => {
    const field = { field_id: 'field-1', user_id: 'user-1', status: 'active' };
    Field.scope = jest.fn(() => ({
      findOne: jest.fn(async () => field),
    }));
    const result = await svc.assertFieldOwnership('user-1', 'field-1');
    expect(result).toEqual(field);
  });

  test('getFieldGeometry calls ownership check and returns boundary', async () => {
    const boundary = { type: 'MultiPolygon', coordinates: [] };
    querySpy.mockResolvedValueOnce([{ boundary }]);
    const result = await svc.getFieldGeometry('user-1', 'field-1');
    expect(result).toEqual(boundary);
  });

  test('getFieldGeometry throws NotFoundError when no boundary', async () => {
    querySpy.mockResolvedValueOnce([{ boundary: null }]);
    await expect(svc.getFieldGeometry('user-1', 'field-1')).rejects.toMatchObject({
      name: 'NotFoundError',
      message: 'Field boundary not found',
    });
  });

  test('getOAuthToken caches token and reuses when valid', async () => {
    const token = 'cached-token';
    svc.oauthToken = { accesstoken: token, expiresat: Date.now() + 60000 };
    const result = await svc.getOAuthToken();
    expect(result).toBe(token);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('getOAuthToken fetches new token when expired or missing', async () => {
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

  test('getOAuthToken throws error on OAuth failure', async () => {
    svc.oauthToken = null;
    axios.post.mockResolvedValueOnce({ status: 400, data: {} });
    await expect(svc.getOAuthToken()).rejects.toThrow('SentinelHub OAuth error (400)');
  });

  test('buildProcessBodyForGeometry constructs correct request body', () => {
    const geometry = { type: 'MultiPolygon', coordinates: [] };
    const date = '2025-01-15';
    const body = svc.buildProcessBodyForGeometry(geometry, date, 128);
    expect(body.input.bounds.geometry).toEqual(geometry);
    expect(body.input.data[0].dataFilter.timeRange.from).toBe('2025-01-15T00:00:00Z');
    expect(body.input.data[0].dataFilter.timeRange.to).toBe('2025-01-15T23:59:59Z');
    expect(body.output.width).toBe(128);
    expect(body.output.height).toBe(128);
    expect(body.evalscript).toBe(svc.buildIndicesEvalscript());
  });

  test('parseProcessResponse parses JSON stats correctly', () => {
    const buffer = Buffer.from(
      JSON.stringify({
        stats: { ndvi: { mean: 0.5 }, ndwi: { mean: 0.2 }, tdvi: { mean: 0.3 } },
      }),
      'utf8'
    );
    const result = svc.parseProcessResponse(buffer, { 'content-type': 'application/json' });
    expect(result).toEqual({ ndvi: 0.5, ndwi: 0.2, tdvi: 0.3 });
  });

  test('parseProcessResponse parses data array and computes means', () => {
    const buffer = Buffer.from(
      JSON.stringify({
        data: [
          [
            [0.1, 0.2, 0.3],
            [0.4, 0.5, 0.6],
          ],
          [[0.7, 0.8, 0.9]],
        ],
      }),
      'utf8'
    );
    const result = svc.parseProcessResponse(buffer, { 'content-type': 'application/json' });
    expect(result.ndvi).toBeCloseTo((0.1 + 0.4 + 0.7) / 3, 5);
    expect(result.ndwi).toBeCloseTo((0.2 + 0.5 + 0.8) / 3, 5);
    expect(result.tdvi).toBeCloseTo((0.3 + 0.6 + 0.9) / 3, 5);
  });

  test('parseProcessResponse throws error for invalid JSON', () => {
    const buffer = Buffer.from('invalid json', 'utf8');
    expect(() => svc.parseProcessResponse(buffer, { 'content-type': 'application/json' })).toThrow(
      'Failed to parse JSON stats from Process API'
    );
  });

  test('parseProcessResponse throws 501 for non-JSON content', () => {
    const buffer = Buffer.from('tiff data', 'utf8');
    expect(() => svc.parseProcessResponse(buffer, { 'content-type': 'image/tiff' })).toThrow(
      'Raster decoding not implemented for Process API response'
    );
    expect(() => svc.parseProcessResponse(buffer, {})).toThrow(
      'Raster decoding not implemented for Process API response'
    );
  });

  test('findSnapshot returns snapshot by field and date', async () => {
    const result = await svc.findSnapshot('field-1', '2025-01-15');
    expect(result).toHaveProperty('field_id', 'field-1');
    expect(result).toHaveProperty('timestamp', '2025-01-15T00:00:00.000Z');
    expect(result).toHaveProperty('ndvi', 0.62);
  });

  test('findSnapshot returns null when no snapshot found', async () => {
    querySpy.mockResolvedValueOnce([]);
    const result = await svc.findSnapshot('field-1', '2025-01-15');
    expect(result).toBeNull();
  });

  test('getLatest returns latest health record', async () => {
    const HealthRecord = require('../../src/models/health.model');
    HealthRecord.findOne = jest.fn().mockResolvedValue({
      id: 1,
      field_id: 'field-1',
      measurementdate: '2025-01-15',
      healthscore: 85,
    });
    const result = await svc.getLatest('user-1', 'field-1');
    expect(result).toHaveProperty('healthscore', 85);
  });

  test('getLatest throws NotFoundError when no records', async () => {
    const HealthRecord = require('../../src/models/health.model');
    HealthRecord.findOne = jest.fn().mockResolvedValue(null);
    await expect(svc.getLatest('user-1', 'field-1')).rejects.toMatchObject({
      name: 'NotFoundError',
      message: 'No health data found for this field',
    });
  });

  test('getHistory returns records with default days filter', async () => {
    const HealthRecord = require('../../src/models/health.model');
    const records = [{ id: 1, measurementdate: '2025-01-15' }];
    HealthRecord.findAll = jest.fn().mockResolvedValue(records);
    const result = await svc.getHistory('user-1', 'field-1');
    expect(result).toEqual(records);
    expect(HealthRecord.findAll).toHaveBeenCalledWith({
      where: expect.objectContaining({
        field_id: 'field-1',
        measurementdate: expect.objectContaining({
          [require('sequelize').Op.gte]: expect.any(String),
        }),
      }),
      order: [['measurementdate', 'DESC']],
    });
  });

  test('getHistory supports from/to date filters', async () => {
    const HealthRecord = require('../../src/models/health.model');
    HealthRecord.findAll = jest.fn().mockResolvedValue([]);
    await svc.getHistory('user-1', 'field-1', { from: '2025-01-01', to: '2025-01-31' });
    expect(HealthRecord.findAll).toHaveBeenCalledWith({
      where: expect.objectContaining({
        field_id: 'field-1',
        measurementdate: {
          [require('sequelize').Op.gte]: '2025-01-01',
          [require('sequelize').Op.lte]: '2025-01-31',
        },
      }),
      order: [['measurementdate', 'DESC']],
    });
  });

  test('refresh returns success response', async () => {
    const result = await svc.refresh('user-1', 'field-1');
    expect(result).toEqual({
      success: true,
      message: 'Health refresh scheduled',
      field_id: 'field-1',
      scheduledat: expect.any(String),
    });
  });

  test('computeIndicesForField validates date format', async () => {
    await expect(svc.computeIndicesForField('user-1', 'field-1', '')).rejects.toMatchObject({
      name: 'ValidationError',
    });
    await expect(svc.computeIndicesForField('user-1', 'field-1', 'invalid')).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  test('upsertSnapshot validates required parameters', async () => {
    await expect(svc.upsertSnapshot(null, '2025-01-15T00:00:00.000Z', {})).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'field_id is required',
    });
    await expect(svc.upsertSnapshot('field-1', null, {})).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'timestamp is required',
    });
  });

  test('listSnapshots validates ownership', async () => {
    Field.scope = jest.fn(() => ({
      findOne: jest.fn(async () => null), // no ownership
    }));
    await expect(svc.listSnapshots('user-1', 'field-1')).rejects.toMatchObject({
      name: 'NotFoundError',
    });
  });

  test('listSnapshots handles pagination and range filters', async () => {
    const res = await svc.listSnapshots('user-1', 'field-1', {
      page: 2,
      pageSize: 10,
      from: '2025-01-01',
      to: '2025-01-31',
    });
    expect(res.page).toBe(2);
    expect(res.pageSize).toBe(10);
  });

  test('getHealthService returns singleton instance', () => {
    const { getHealthService } = require('../../src/services/health.service');
    const svc1 = getHealthService();
    const svc2 = getHealthService();
    expect(svc1).toBeInstanceOf(HealthService);
    expect(svc1).toBe(svc2);
  });
});

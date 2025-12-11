process.env.NODE_ENV = 'test';
process.env.JWTSECRET = process.env.JWTSECRET || 'test-secret';
process.env.FIELDCACHETTLSECLIST = '300';
process.env.FIELDCACHETTLSECDETAIL = '600';

// In-memory fake Redis
const store = new Map();
function matchPattern(key, pattern) {
  const re = new RegExp(
    `^${String(pattern)
      .replace(/[.+^${}()|[\\]\\\\]/g, '\\$&')
      .replace(/\\\*/g, '.*')}$`
  );
  return re.test(key);
}
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
  async expire(key, ttl) {
    return 1;
  },
  async scan(cursor, opts = {}) {
    const { MATCH } = opts || {};
    const keys = Array.from(store.keys()).filter(k => (!MATCH ? true : matchPattern(k, MATCH)));
    return ['0', keys];
  },
};

// Mock Redis client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: jest.fn(async () => fakeRedis),
  getRedisClient: jest.fn(() => fakeRedis),
}));

const { sequelize } = require('../../src/config/database.config');
const Field = require('../../src/models/field.model');
const { FieldService } = require('../../src/services/field.service');
const { ValidationError, ConflictError } = require('../../src/errors/custom-errors');

describe('FieldService unit', () => {
  let service;
  let querySpy;

  beforeEach(() => {
    jest.clearAllMocks();
    store.clear();
    service = new FieldService();

    // Default: no duplicate names
    jest.spyOn(Field, 'findOne').mockImplementation(async () => null);

    // Default create mock
    jest.spyOn(Field, 'create').mockImplementation(async payload => ({
      field_id: 'f-123',
      user_id: payload.user_id,
      name: payload.name,
      status: payload.status || 'active',
    }));

    // scope('allStatuses').findOne mock for update/delete
    Field.scope = jest.fn(() => ({
      findOne: jest.fn(async ({ where }) => {
        if (where.user_id && where.field_id) {
          return {
            field_id: where.field_id,
            user_id: where.user_id,
            name: 'Before',
            status: 'active',
            save: jest.fn(async function save() {
              return this;
            }),
          };
        }
        return null;
      }),
    }));

    // sequelize.query default stub
    querySpy = jest
      .spyOn(sequelize, 'query')
      .mockImplementation(async (sql, { replacements } = {}) => {
        // getById path (SELECT ... WHERE f.field_id = :field_id AND f.user_id = :user_id)
        if (
          /FROM\s+fields\s+f/i.test(sql) &&
          /WHERE\s+f\.field_id/i.test(sql) &&
          replacements?.field_id
        ) {
          return [
            {
              field_id: replacements.field_id,
              user_id: replacements.user_id,
              name: 'North plot',
              boundary: { type: 'MultiPolygon', coordinates: [[[80.1, 7.2]]] },
              areasqm: 22149.56,
              center: { type: 'Point', coordinates: [80.105, 7.205] },
              status: 'active',
              createdat: new Date().toISOString(),
              updatedat: new Date().toISOString(),
            },
          ];
        }

        // list path with window count
        if (/FROM\s+fields\s+f/i.test(sql) && /ORDER BY/i.test(sql)) {
          return [
            {
              field_id: 'f1',
              user_id: replacements.user_id,
              name: 'A',
              boundary: { type: 'MultiPolygon', coordinates: [[[80.1, 7.2]]] },
              areasqm: 12000,
              center: { type: 'Point', coordinates: [80.11, 7.21] },
              status: 'active',
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

  test('createWithBoundary normalizes Polygon -> MultiPolygon and computes via DB trigger (areasqm on reload)', async () => {
    const result = await service.createWithBoundary('user-1', 'North plot', {
      type: 'Polygon',
      coordinates: [
        [
          [80.1, 7.2],
          [80.12, 7.2],
          [80.12, 7.22],
          [80.1, 7.22],
          [80.1, 7.2],
        ],
      ],
    });

    expect(Field.create).toHaveBeenCalledTimes(1);
    const createArg = Field.create.mock.calls[0][0];
    expect(createArg.boundary.type).toBe('MultiPolygon'); // normalized
    expect(result).toHaveProperty('areasqm');
    expect(result).toHaveProperty('center');
  });

  test('createWithBoundary rejects invalid geometry type', async () => {
    await expect(
      service.createWithBoundary('user-1', 'Bad', {
        type: 'LineString',
        coordinates: [
          [1, 2],
          [3, 4],
        ],
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('createWithBoundary rejects duplicate name', async () => {
    Field.findOne.mockResolvedValueOnce({ field_id: 'dup' });
    await expect(
      service.createWithBoundary('user-1', 'Dup', {
        type: 'Polygon',
        coordinates: [
          [
            [80.1, 7.2],
            [80.12, 7.2],
            [80.12, 7.22],
            [80.1, 7.22],
            [80.1, 7.2],
          ],
        ],
      })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test('list with bbox builds STMakeEnvelope and caches results', async () => {
    const res1 = await service.list('user-1', {
      bbox: '80.10,7.20,80.50,7.80',
      page: 1,
      pagesize: 10,
    });
    expect(res1).toHaveProperty('items');
    expect(res1.cacheHit).toBe(false);
    expect(sequelize.query).toHaveBeenCalledTimes(1);
    const sqlFirst = sequelize.query.mock.calls[0][0];
    expect(sqlFirst).toMatch(/STMakeEnvelope\(/i);
    expect(sqlFirst).toMatch(/STIntersects/i);

    const res2 = await service.list('user-1', {
      bbox: '80.10,7.20,80.50,7.80',
      page: 1,
      pagesize: 10,
    });
    expect(res2.cacheHit).toBe(true);
    // still one SQL call due to cache
    expect(sequelize.query).toHaveBeenCalledTimes(1);
  });

  test('list with near builds STDWithin(center::geography, STPoint...)', async () => {
    await service.list('user-1', { near: '7.21,80.15,5000' });
    const sql = sequelize.query.mock.calls[0][0];
    expect(sql).toMatch(/STDWithin\(f\.center::geography/i);
    expect(sql).toMatch(/STPoint\(/i);
  });

  test('list with intersects GeoJSON builds STGeomFromGeoJSON', async () => {
    const geom = JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [80.1, 7.2],
          [80.2, 7.2],
          [80.2, 7.3],
          [80.1, 7.3],
          [80.1, 7.2],
        ],
      ],
    });
    await service.list('user-1', { intersects: geom });
    const sql = sequelize.query.mock.calls[0][0];
    expect(sql).toMatch(/STGeomFromGeoJSON\(/i);
    expect(sql).toMatch(/STIntersects/i);
  });

  test('getById caches detail and returns from cache on second call', async () => {
    const fid = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const r1 = await service.getById('user-1', fid);
    expect(r1.field_id).toBe(fid);
    expect(sequelize.query).toHaveBeenCalledTimes(1);

    const r2 = await service.getById('user-1', fid);
    expect(r2.field_id).toBe(fid);
    // still 1 SQL call due to cache
    expect(sequelize.query).toHaveBeenCalledTimes(1);
  });

  test('update changes name and invalidates cache', async () => {
    const result = await service.update('user-1', 'f-123', { name: 'New Name' });
    expect(result.name).toBe('New Name');
    expect(Field.prototype.save).toHaveBeenCalled();
  });

  test('update rejects duplicate name', async () => {
    Field.findOne.mockResolvedValueOnce({ field_id: 'other' });
    await expect(
      service.update('user-1', 'f-123', { name: 'Existing Name' })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test('update changes status', async () => {
    const result = await service.update('user-1', 'f-123', { status: 'archived' });
    expect(result.status).toBe('archived');
  });

  test('update rejects invalid status', async () => {
    await expect(service.update('user-1', 'f-123', { status: 'invalid' })).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  test('delete sets status to deleted and invalidates cache', async () => {
    const result = await service.delete('user-1', 'f-123');
    expect(result.success).toBe(true);
    expect(Field.prototype.save).toHaveBeenCalled();
  });
});

describe('Additional branch coverage lifts', () => {
  const ORIGINALENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...ORIGINALENV };
  });

  afterAll(() => {
    process.env = ORIGINALENV;
  });

  test('WeatherService getCurrentByField cache hit (covers cached branch)', async () => {
    await jest.isolateModules(async () => {
      jest.doMock('../../src/config/redis.config', () => {
        const payload = {
          field_id: 'F',
          coord: { lat: 7, lon: 80 },
          current: { temp: 30 },
          source: 'openweathermaponecall',
          fetchedat: new Date().toISOString(),
        };
        return {
          initRedis: jest.fn(async () => ({
            isOpen: true,
            get: jest.fn(async () => JSON.stringify(payload)),
            setEx: jest.fn(),
          })),
        };
      });
      jest.doMock('../../src/models/field.model', () => ({
        findOne: jest.fn(async () => ({
          field_id: 'F',
          user_id: 'U',
          status: 'active',
          center: { type: 'Point', coordinates: [80, 7] },
        })),
      }));
      const { WeatherService } = require('../../src/services/weather.service');
      const svc = new WeatherService();
      process.env.OPENWEATHER_API_KEY = 'k';
      const res = await svc.getCurrentByField('U', 'F');
      expect(res.meta).toEqual(expect.objectContaining({ cache: 'hit', source: 'cache' }));
      expect(res.data).toEqual(expect.objectContaining({ field_id: 'F' }));
    });
  });

  test('SatelliteService cached tile with non-matching If-None-Match returns 200 with cached body', async () => {
    await jest.isolateModules(async () => {
      const tileCached = {
        data: Buffer.from([0, 1, 2]).toString('base64'),
        etag: 'etag-1',
        contentType: 'image/png',
        cachedat: new Date().toISOString(),
      };
      jest.doMock('../../src/config/redis.config', () => ({
        initRedis: jest.fn(async () => ({
          isOpen: true,
          get: jest.fn(async () => JSON.stringify(tileCached)),
          setEx: jest.fn(),
          setex: jest.fn(),
        })),
        getRedisClient: jest.fn(() => ({})),
      }));
      const { SatelliteService } = require('../../src/services/satellite.service');
      const svc = new SatelliteService();
      const res = await svc.getTile({
        z: 12,
        x: 0,
        y: 0,
        date: '2025-10-10',
        bands: 'RGB',
        cloudlt: 20,
        ifNoneMatch: 'etag-0',
      });
      expect(res.status).toBe(200);
      expect(res.headers).toEqual(expect.objectContaining({ ETag: 'etag-1' }));
      expect(res.body).toBeInstanceOf(Buffer);
    });
  });

  test('SatelliteService tileToBBox throws for x/y out of range', () => {
    const { SatelliteService } = require('../../src/services/satellite.service');
    const svc = new SatelliteService();
    expect(() => svc.tileToBBox(2, -1, 0)).toThrow(/out of range/i);
    expect(() => svc.tileToBBox(2, 5, 0)).toThrow(/out of range/i);
  });

  test('MLGatewayService mapDownstreamError AUTHREQUIRED and UNAUTHORIZEDINTERNAL branches', () => {
    const { MLGatewayService } = require('../../src/services/mlGateway.service');
    const svc = new MLGatewayService();
    let e = svc.mapDownstreamError({
      status: 401,
      data: { error: { code: 'AUTHREQUIRED', message: 'auth' } },
    });
    expect(e && e.name).toBe('AppError');
    expect(e.code).toBe('UNAUTHORIZED');
    expect(e.statusCode).toBe(401);
    e = svc.mapDownstreamError({
      status: 403,
      data: { error: { code: 'UNAUTHORIZEDINTERNAL', message: 'no' } },
    });
    expect(e.code).toBe('FORBIDDEN');
    expect(e.statusCode).toBe(403);
  });

  test('MLGatewayService modelVersion fallback: header missing uses data.model.version; setEx path executed', async () => {
    await jest.isolateModules(async () => {
      jest.doMock('../../src/config/redis.config', () => ({
        initRedis: jest.fn(async () => ({
          isOpen: true,
          get: jest.fn(async () => null),
          setEx: jest.fn(async () => {}),
        })),
      }));
      jest.doMock('axios', () => ({
        post: jest.fn(async (_url, _body) => ({
          status: 200,
          headers: {},
          data: {
            requestid: 'r1',
            model: { name: 'unet', version: '9.9.9' },
            maskurl: 'https://example.com/m.tif',
            maskformat: 'tiff',
            metrics: {},
            warnings: [],
          },
        })),
      }));
      const { MLGatewayService } = require('../../src/services/mlGateway.service');
      const svc = new MLGatewayService();
      const out = await svc.predict(
        { bbox: [0, 0, 1, 1], return: 'maskurl', modelversion: 'fallback' },
        'corr-x'
      );
      expect(out.modelVersion).toBe('9.9.9');
      expect(out.cacheHit).toBe(false);
    });
  });
});

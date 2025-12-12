const axios = require('axios');

// In-memory fake Redis
const redisStore = new Map();
let _lastSetExTTL = null;
const fakeRedisClient = {
  isOpen: true,
  async get(key) {
    return redisStore.has(key) ? redisStore.get(key) : null;
  },
  async setEx(key, ttl, value) {
    _lastSetExTTL = ttl;
    redisStore.set(key, value);
    return 'OK';
  },
  async setex(key, ttl, value) {
    // compatibility fallback
    _lastSetExTTL = ttl;
    redisStore.set(key, value);
    return 'OK';
  },
};

// Mock Redis config to use in-memory client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedisClient,
  getRedisClient: () => fakeRedisClient,
}));

// Import after mocks
const { MLGatewayService } = require('../../src/services/mlGateway.service');

describe('MLGatewayService.detectBoundaries Unit', () => {
  const ORIGINALENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    redisStore.clear();
    _lastSetExTTL = null;

    process.env = {
      ...ORIGINALENV,
      NODE_ENV: 'test',
      // New ML-Service envs
      MLSERVICEURL: 'http://ml-service.local:80',
      MLSERVICETOKEN: 'unet-token',
      MODELUNETVERSION: '1.0.0',
      // Existing gateway envs (fallbacks still supported)
      MLBASEURL: 'http://ml-service.local:80',
      MLINTERNALTOKEN: 'test-internal-token',
      MLPREDICTCACHETTLSECONDS: '86400',
      MLREQUESTTIMEOUTMS: '60000',
    };
  });

  afterAll(() => {
    process.env = ORIGINALENV;
    jest.restoreAllMocks();
  });

  test('happy path: returns normalized structure (maskUrl) and propagates Authorization + X-Model-Version header from options', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockImplementation(async (url, body, config) => {
      // URL formation
      expect(url).toMatch(/\/v1\/segmentation\/predict$/);
      // Header propagation
      expect(config && config.headers).toBeTruthy();
      expect(config.headers.Authorization).toBe('Bearer unet-token');
      expect(config.headers['X-Model-Version']).toBe('2.0.0');

      // Body composition
      expect(body).toMatchObject({
        bbox: [80.1, 7.2, 80.12, 7.22],
        modelversion: '2.0.0',
      });

      return {
        status: 200,
        headers: { 'x-model-version': 'unet-2.0.0' },
        data: {
          requestid: 'req-abc',
          model: { name: 'unet', version: '2.0.0' },
          maskurl: 'http://ml.local/masks/req-abc.geojson',
          maskformat: 'geojson',
          metrics: { latencyms: 42 },
          warnings: [],
        },
      };
    });

    const svc = new MLGatewayService();
    const out = await svc.detectBoundaries([80.1, 7.2, 80.12, 7.22], {
      modelVersion: '2.0.0',
      returnFormat: 'url',
    });

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(out).toEqual(
      expect.objectContaining({
        requestId: 'req-abc',
        model: { name: 'unet', version: '2.0.0' },
        maskUrl: expect.stringContaining('http://ml.local/masks/req-abc.geojson'),
        maskBase64: null,
        metadata: expect.objectContaining({ metrics: { latencyms: 42 } }),
      })
    );
  });

  test('header propagation: uses env MODELUNETVERSION when options.modelVersion not provided', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockImplementation(async (url, body, config) => {
      expect(config.headers['X-Model-Version']).toBe('1.0.0'); // from env fallback
      return {
        status: 200,
        headers: { 'x-model-version': 'unet-1.0.0' },
        data: {
          requestid: 'req-env',
          model: { name: 'unet', version: '1.0.0' },
          maskurl: 'http://ml.local/masks/req-env.geojson',
          maskformat: 'geojson',
          metrics: { latencyms: 10 },
          warnings: [],
        },
      };
    });

    const svc = new MLGatewayService();
    const out = await svc.detectBoundaries([80, 7, 80.1, 7.1], {});

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(out.model.version).toBe('1.0.0');
    expect(out.maskUrl).toContain('req-env.geojson');
  });

  test('error mapping: downstream 404 MODELNOTFOUND is normalized and thrown', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 404,
      headers: {},
      data: {
        error: {
          code: 'MODELNOTFOUND',
          message: 'not available',
          details: { requested: '9.9.9' },
        },
      },
    });

    const svc = new MLGatewayService();
    await expect(
      svc.detectBoundaries([80, 7, 80.1, 7.1], { modelVersion: '9.9.9' })
    ).rejects.toMatchObject({
      code: 'MODELNOTFOUND',
      statusCode: 404,
    });
  });

  test('input validation: bad bbox arrays reject fast and do not call downstream', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValue({ status: 500, data: {} });

    const svc = new MLGatewayService();

    // wrong length
    await expect(svc.detectBoundaries([80, 7, 80.1], {})).rejects.toMatchObject({
      code: 'INVALIDINPUT',
      statusCode: 400,
    });

    // non-finite
    await expect(svc.detectBoundaries([NaN, 7, 80.1, 7.1], {})).rejects.toMatchObject({
      code: 'INVALIDINPUT',
      statusCode: 400,
    });

    // min >= max
    await expect(svc.detectBoundaries([80.2, 7.2, 80.1, 7.1], {})).rejects.toMatchObject({
      code: 'INVALIDINPUT',
      statusCode: 400,
    });

    // out of range
    await expect(svc.detectBoundaries([-181, 7, -180, 7.1], {})).rejects.toMatchObject({
      code: 'INVALIDINPUT',
      statusCode: 400,
    });

    expect(postSpy).not.toHaveBeenCalled();
  });

  test('inline return: returns maskBase64 and preserves model/version', async () => {
    jest.spyOn(axios, 'post').mockImplementation(async () => ({
      status: 200,
      headers: { 'x-model-version': 'unet-1.0.0' },
      data: {
        requestid: 'req-inline',
        model: { name: 'unet', version: '1.0.0' },
        maskbase64: Buffer.from(
          JSON.stringify({ type: 'FeatureCollection', features: [] })
        ).toString('base64'),
        maskformat: 'geojson',
        metrics: { latencyms: 80 },
        warnings: [],
      },
    }));

    const svc = new MLGatewayService();
    const out = await svc.detectBoundaries([80, 7, 80.1, 7.1], { returnFormat: 'inline' });

    expect(out.maskBase64).toEqual(expect.any(String));
    expect(out.maskUrl).toBeNull();
    expect(out.model.version).toBe('1.0.0');
  });
});

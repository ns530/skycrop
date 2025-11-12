/* eslint-disable no-underscore-dangle */
'use strict';

describe('MLGatewayService branch coverage lifts', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function mockMakeRedisSetexOnly() {
    // Provide only setex to exercise cacheSet() fallback branch
    return {
      isOpen: true,
      get: jest.fn(async () => null),
      setex: jest.fn(async () => {}),
      del: jest.fn(async () => {}),
      scan: jest.fn(async () => ['0', []]),
    };
  }

  // Shared instance to avoid out-of-scope mock factory problems and to assert call counts
  const mockRedisInstance = mockMakeRedisSetexOnly();

  jest.mock('../../src/config/redis.config.js', () => {
    return {
      initRedis: jest.fn(async () => mockRedisInstance),
    };
  });

  jest.mock('axios', () => ({
    post: jest.fn(),
  }));

  const { AppError } = require('../../src/errors/custom-errors.js');

  test('predict caches via setex fallback when return=mask_url and mask_url present; covers validateStatus in _callML', async () => {
    const axios = require('axios');
    axios.post.mockReset();

    // Set up a successful ML response
    axios.post.mockImplementationOnce((url, body, config) => {
      // Exercise validateStatus function branch
      if (config && typeof config.validateStatus === 'function') {
        expect(config.validateStatus(200)).toBe(true);
        expect(config.validateStatus(599)).toBe(true);
        expect(config.validateStatus(600)).toBe(false);
      }
      return Promise.resolve({
        status: 200,
        headers: { 'x-model-version': 'unet-2.0.0' },
        data: {
          request_id: 'req-123',
          model: { name: 'unet', version: 'unet-2.0.0' },
          mask_url: 'https://example.com/mask.tif',
          mask_format: 'tiff',
          metrics: { iou: 0.8 },
          warnings: [],
        },
      });
    });

    const { MLGatewayService } = require('../../src/services/mlGateway.service.js');
    const svc = new MLGatewayService();

    const input = {
      bbox: [80.0, 7.0, 80.1, 7.1],
      date: '2025-10-10',
      model_version: 'unet-2.0.0',
      return: 'mask_url',
    };

    const res = await svc.predict(input, 'corr-abc');

    expect(res.result.success).toBe(true);
    expect(res.cacheHit).toBe(false);
    expect(res.modelVersion).toBe('unet-2.0.0');

    // Ensure cache fallback branch (setex) executed on the shared redis instance
    expect(mockRedisInstance.setex).toHaveBeenCalledTimes(1);
  });

  test('_mapDownstreamError handles explicit UPSTREAM_ERROR code (covers code-specific branch)', () => {
    const { MLGatewayService } = require('../../src/services/mlGateway.service.js');
    const svc = new MLGatewayService();

    const e = svc._mapDownstreamError({
      status: 502,
      data: { error: { code: 'UPSTREAM_ERROR', message: 'proxy failed', details: { foo: 'bar' } } },
    });

    expect(e && e.name).toBe('AppError');
    expect(e.code).toBe('UPSTREAM_ERROR');
    expect(e.statusCode).toBe(502);
  });

  test('_mapDownstreamError default mapping branches: 404/501/504(408)/4xx generic', () => {
    const { MLGatewayService } = require('../../src/services/mlGateway.service.js');
    const svc = new MLGatewayService();

    // 404 default (no code)
    let e = svc._mapDownstreamError({ status: 404, data: {} });
    expect(e && e.name).toBe('AppError');
    expect(e.code).toBe('MODEL_NOT_FOUND');
    expect(e.statusCode).toBe(404);

    // 501 default
    e = svc._mapDownstreamError({ status: 501, data: {} });
    expect(e.code).toBe('NOT_IMPLEMENTED');
    expect(e.statusCode).toBe(501);

    // 504/408 timeout default
    e = svc._mapDownstreamError({ status: 504, data: {} });
    expect(e.code).toBe('TIMEOUT');
    expect(e.statusCode).toBe(504);

    e = svc._mapDownstreamError({ status: 408, data: {} });
    expect(e.code).toBe('TIMEOUT');
    expect(e.statusCode).toBe(504);

    // 4xx generic -> INVALID_INPUT
    e = svc._mapDownstreamError({ status: 422, data: {} });
    expect(e.code).toBe('INVALID_INPUT');
    expect(e.statusCode).toBe(400);
  });

  test('_callML network error path -> AppError UPSTREAM_ERROR 502; validateStatus branch executed', async () => {
    const axios = require('axios');
    axios.post.mockReset();

    axios.post.mockImplementationOnce((url, body, config) => {
      if (config && typeof config.validateStatus === 'function') {
        // Touch validateStatus to mark covered
        expect(config.validateStatus(200)).toBe(true);
      }
      return Promise.reject(new Error('network down'));
    });

    const { MLGatewayService } = require('../../src/services/mlGateway.service.js');
    const svc = new MLGatewayService();

    await expect(svc.predict({ bbox: [0, 0, 1, 1], return: 'mask_url' }, 'corr-net'))
      .rejects.toEqual(
        expect.objectContaining({
          code: 'UPSTREAM_ERROR',
          statusCode: 502,
        }),
      );
  });

  test('normalizePayload defaults branches (tiling defaults and return normalization)', () => {
    const { MLGatewayService } = require('../../src/services/mlGateway.service.js');
    const svc = new MLGatewayService();

    const out = svc.normalizePayload({
      bbox: ['80', '7', '81', '8'], // strings to Number()
      // no tiling provided -> default 512/64
      // no return -> default mask_url
    });

    expect(out.bbox).toEqual([80, 7, 81, 8]);
    expect(out.tiling).toEqual({ size: 512, overlap: 64 });
    expect(out.return).toBe('mask_url');

    const out2 = svc.normalizePayload({
      tiling: { size: 256 }, // partial -> overlap defaults
      return: 'inline',
    });
    expect(out2.tiling).toEqual({ size: 256, overlap: 64 });
    expect(out2.return).toBe('inline');
  });
});
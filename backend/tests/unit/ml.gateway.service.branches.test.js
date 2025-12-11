/* eslint-disable no-underscore-dangle */

'use strict';

describe('MLGatewayService branch coverage lifts', () => {
  const ORIGINALENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...ORIGINALENV };
  });

  afterAll(() => {
    process.env = ORIGINALENV;
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

  jest.mock('../../src/config/redis.config', () => {
    return {
      initRedis: jest.fn(async () => mockRedisInstance),
    };
  });

  jest.mock('axios', () => ({
    post: jest.fn(),
  }));

  const { AppError } = require('../../src/errors/custom-errors');

  test('predict caches via setex fallback when return=maskurl and maskurl present; covers validateStatus in callML', async () => {
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
          requestid: 'req-123',
          model: { name: 'unet', version: 'unet-2.0.0' },
          maskurl: 'https://example.com/mask.tif',
          maskformat: 'tiff',
          metrics: { iou: 0.8 },
          warnings: [],
        },
      });
    });

    const { MLGatewayService } = require('../../src/services/mlGateway.service');
    const svc = new MLGatewayService();

    const input = {
      bbox: [80.0, 7.0, 80.1, 7.1],
      date: '2025-10-10',
      modelversion: 'unet-2.0.0',
      return: 'maskurl',
    };

    const res = await svc.predict(input, 'corr-abc');

    expect(res.result.success).toBe(true);
    expect(res.cacheHit).toBe(false);
    expect(res.modelVersion).toBe('unet-2.0.0');

    // Ensure cache fallback branch (setex) executed on the shared redis instance
    expect(mockRedisInstance.setex).toHaveBeenCalledTimes(1);
  });

  test('mapDownstreamError handles explicit UPSTREAMERROR code (covers code-specific branch)', () => {
    const { MLGatewayService } = require('../../src/services/mlGateway.service');
    const svc = new MLGatewayService();

    const e = svc.mapDownstreamError({
      status: 502,
      data: { error: { code: 'UPSTREAMERROR', message: 'proxy failed', details: { foo: 'bar' } } },
    });

    expect(e && e.name).toBe('AppError');
    expect(e.code).toBe('UPSTREAMERROR');
    expect(e.statusCode).toBe(502);
  });

  test('mapDownstreamError default mapping branches: 404/501/504(408)/4xx generic', () => {
    const { MLGatewayService } = require('../../src/services/mlGateway.service');
    const svc = new MLGatewayService();

    // 404 default (no code)
    let e = svc.mapDownstreamError({ status: 404, data: {} });
    expect(e && e.name).toBe('AppError');
    expect(e.code).toBe('MODELNOTFOUND');
    expect(e.statusCode).toBe(404);

    // 501 default
    e = svc.mapDownstreamError({ status: 501, data: {} });
    expect(e.code).toBe('NOTIMPLEMENTED');
    expect(e.statusCode).toBe(501);

    // 504/408 timeout default
    e = svc.mapDownstreamError({ status: 504, data: {} });
    expect(e.code).toBe('TIMEOUT');
    expect(e.statusCode).toBe(504);

    e = svc.mapDownstreamError({ status: 408, data: {} });
    expect(e.code).toBe('TIMEOUT');
    expect(e.statusCode).toBe(504);

    // 4xx generic -> INVALIDINPUT
    e = svc.mapDownstreamError({ status: 422, data: {} });
    expect(e.code).toBe('INVALIDINPUT');
    expect(e.statusCode).toBe(400);
  });

  test('callML network error path -> AppError UPSTREAMERROR 502; validateStatus branch executed', async () => {
    const axios = require('axios');
    axios.post.mockReset();

    axios.post.mockImplementationOnce((url, body, config) => {
      if (config && typeof config.validateStatus === 'function') {
        // Touch validateStatus to mark covered
        expect(config.validateStatus(200)).toBe(true);
      }
      return Promise.reject(new Error('network down'));
    });

    const { MLGatewayService } = require('../../src/services/mlGateway.service');
    const svc = new MLGatewayService();

    await expect(
      svc.predict({ bbox: [0, 0, 1, 1], return: 'maskurl' }, 'corr-net')
    ).rejects.toEqual(
      expect.objectContaining({
        code: 'UPSTREAMERROR',
        statusCode: 502,
      })
    );
  });

  test('normalizePayload defaults branches (tiling defaults and return normalization)', () => {
    const { MLGatewayService } = require('../../src/services/mlGateway.service');
    const svc = new MLGatewayService();

    const out = svc.normalizePayload({
      bbox: ['80', '7', '81', '8'], // strings to Number()
      // no tiling provided -> default 512/64
      // no return -> default maskurl
    });

    expect(out.bbox).toEqual([80, 7, 81, 8]);
    expect(out.tiling).toEqual({ size: 512, overlap: 64 });
    expect(out.return).toBe('maskurl');

    const out2 = svc.normalizePayload({
      tiling: { size: 256 }, // partial -> overlap defaults
      return: 'inline',
    });
    expect(out2.tiling).toEqual({ size: 256, overlap: 64 });
    expect(out2.return).toBe('inline');
  });
});

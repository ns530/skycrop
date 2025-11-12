'use strict';

const { ValidationError, NotFoundError, AppError } = require('../../src/errors/custom-errors');

// Service singletons are mocked to inject per-test doubles
let mockFieldSvc;
jest.mock('../../src/services/field.service', () => ({
  getFieldService: () => mockFieldSvc,
}));

let mockSatSvc;
jest.mock('../../src/services/satellite.service', () => ({
  getSatelliteService: () => mockSatSvc,
}));

let mockMlSvc;
jest.mock('../../src/services/mlGateway.service', () => ({
  getMLGatewayService: () => mockMlSvc,
}));

let mockWeatherSvc;
jest.mock('../../src/services/weather.service', () => ({
  getWeatherService: () => mockWeatherSvc,
}));

// Controllers are required AFTER we set the mock singletons (done in beforeEach)
let fieldController;
let satelliteController;
let mlController;
let weatherController;

function makeRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    set(h) {
      if (h) this.headers = { ...this.headers, ...h };
      return this;
    },
    json(obj) {
      this.body = obj;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
  return res;
}

describe('Controllers branch coverage (error and alt paths)', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockFieldSvc = {
      list: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20, cacheHit: false }),
      createWithBoundary: jest.fn().mockResolvedValue({ field_id: 'f1' }),
      getById: jest.fn().mockResolvedValue({ field_id: 'f1', status: 'active' }),
      update: jest.fn().mockResolvedValue({ field_id: 'f1', name: 'N' }),
      delete: jest.fn().mockResolvedValue({ success: true }),
    };

    mockSatSvc = {
      getTile: jest.fn().mockResolvedValue({
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=10', ETag: 'etag-1', 'Content-Type': 'image/png' },
        body: Buffer.from('00', 'hex'),
        meta: { cache_hit: false },
      }),
      queuePreprocess: jest.fn().mockResolvedValue({ job_id: 'job-1', status: 'queued' }),
      getJob: jest.fn().mockReturnValue({ job_id: 'job-1', status: 'completed' }),
    };

    mockMlSvc = {
      predict: jest.fn().mockResolvedValue({
        result: { success: true, data: { mask_url: 'http://mask' } },
        cacheHit: false,
        downstreamStatus: 200,
        modelVersion: 'unet-1.0.0',
        latency_ms: 5,
      }),
    };

    mockWeatherSvc = {
      getCurrentByField: jest.fn().mockResolvedValue({ data: { ok: true }, meta: { cache: 'miss', source: 'provider' } }),
      getForecastByField: jest.fn().mockResolvedValue({ data: { daily: [] }, meta: { cache: 'miss', source: 'provider' } }),
    };

    // Now require controllers so they bind to our mock singletons
    fieldController = require('../../src/api/controllers/field.controller.js');
    satelliteController = require('../../src/api/controllers/satellite.controller.js');
    mlController = require('../../src/api/controllers/ml.controller.js');
    weatherController = require('../../src/api/controllers/weather.controller.js');
  });

  // Field Controller
  test('FieldController.list -> next(err) on service ValidationError', async () => {
    const req = { user: { userId: 'user-1' }, query: {}, headers: {} };
    const res = makeRes();
    const next = jest.fn();
    mockFieldSvc.list.mockRejectedValueOnce(new ValidationError('bad query'));
    await fieldController.list(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(null);
  });

  test('FieldController.getById -> next(err) on NotFoundError', async () => {
    const req = { user: { userId: 'user-1' }, params: { id: 'missing' }, headers: {} };
    const res = makeRes();
    const next = jest.fn();
    mockFieldSvc.getById.mockRejectedValueOnce(new NotFoundError('not found'));
    await fieldController.getById(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(null);
  });

  // ML Controller
  test('MLController.predict -> next(err) on AppError INVALID_INPUT', async () => {
    const req = { body: { return: 'mask_url' }, headers: { 'x-request-id': 'cid-1' } };
    const res = makeRes();
    const next = jest.fn();
    mockMlSvc.predict.mockRejectedValueOnce(new AppError('INVALID_INPUT', 'invalid', 400, {}));
    await mlController.predict(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(null);
  });

  // Satellite Controller
  test('SatelliteController.getTile -> 304 Not Modified path', async () => {
    const req = {
      params: { z: '12', x: '3567', y: '2150' },
      query: { date: '2025-10-10', bands: 'RGB', cloud_lt: '20' },
      headers: { 'if-none-match': 'etag-xyz' },
      originalUrl: '/api/v1/satellite/tiles/12/3567/2150',
    };
    const res = makeRes();
    const next = jest.fn();

    mockSatSvc.getTile.mockResolvedValueOnce({
      status: 304,
      headers: { 'Cache-Control': 'public, max-age=10', ETag: 'etag-xyz', 'Content-Type': 'image/png' },
      body: null,
      meta: { cache_hit: true },
    });

    await satelliteController.getTile(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(304);
    expect(res.headers.ETag).toBe('etag-xyz');
    expect(res.body).toBeUndefined(); // express send() with no body
  });

  test('SatelliteController.getTile -> next(err) on ValidationError', async () => {
    const req = {
      params: { z: '-1', x: '0', y: '0' },
      query: { date: 'bad', bands: 'RGB', cloud_lt: '20' },
      headers: {},
      originalUrl: '/api/v1/satellite/tiles/-1/0/0',
    };
    const res = makeRes();
    const next = jest.fn();

    mockSatSvc.getTile.mockRejectedValueOnce(new ValidationError('invalid tile'));
    await satelliteController.getTile(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  // Weather Controller
  test('WeatherController.current -> next(err) when field_id missing', async () => {
    const req = { user: { userId: 'user-1' }, query: {}, headers: {} };
    const res = makeRes();
    const next = jest.fn();
    await weatherController.current(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(null);
  });

  test('WeatherController.forecast -> success 200 and payload', async () => {
    const req = { user: { userId: 'user-1' }, query: { field_id: 'fid-1' }, headers: {} };
    const res = makeRes();
    const next = jest.fn();
    await weatherController.forecast(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { daily: [] } });
  });
});
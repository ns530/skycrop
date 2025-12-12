describe('Routes middleware branch coverage lifts (ML and Satellite)', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function makeResCapture() {
    const res = {};
    res.statusCode = null;
    responseBody = null;
    res.headers = {};
    res.status = code => {
      res.statusCode = code;
      return res;
    };
    response = body => {
      responseBody = body;
      return res;
    };
    res.set = h => {
      res.headers = { ...res.headers, ...h };
      return res;
    };
    res.send = body => {
      res.body = body;
      return res;
    };
    return res;
  }

  test('ML routes error handler maps entity.too.large and 413 status to standardized 413 error', () => {
    const router = require('../../src/api/routes/ml.routes');

    // Find error-handling middleware (function with 4 args)
    const errLayers = router.stack.filter(
      l => typeof l.handle === 'function' && l.handle.length === 4
    );
    expect(errLayers.length).toBeGreaterThan(0);
    const errorMw = errLayers[0].handle;

    // Case 1: err.type = 'entity.too.large'
    const err1 = { type: 'entity.too.large' };
    let nextArg = null;
    errorMw(err1, {}, {}, e => {
      nextArg = e;
    });
    expect(nextArg).toMatchObject({
      statusCode: 413,
      code: 'PAYLOADTOOLARGE',
      message: expect.stringMatching(/too large/i),
    });

    // Case 2: err.status = 413
    const err2 = { status: 413 };
    nextArg = null;
    errorMw(err2, {}, {}, e => {
      nextArg = e;
    });
    expect(nextArg).toMatchObject({
      statusCode: 413,
      code: 'PAYLOADTOOLARGE',
      message: expect.stringMatching(/too large/i),
    });

    // Case 3: passthrough when not too large
    const err3 = { status: 400, message: 'Bad input' };
    nextArg = null;
    errorMw(err3, {}, {}, e => {
      nextArg = e;
    });
    expect(nextArg).toBe(err3);
  });

  test('Satellite preprocess enforceMaxBodySize: Content-Length header branch returns 413 JSON', () => {
    const router = require('../../src/api/routes/satellite.routes');

    // Locate POST /preprocess route middlewares (first one is enforceMaxBodySize)
    const preprocessLayer = router.stack.find(
      l => l.route && l.route.path === '/preprocess' && l.route.methods && l.route.methods.post
    );
    expect(preprocessLayer).toBeTruthy();
    const mwList = preprocessLayer.route.stack.map(s => s.handle);
    expect(mwList.length).toBeGreaterThan(0);
    const enforceMw = mwList[0]; // enforceMaxBodySize(maxBytes)

    const req = {
      headers: { 'content-length': String(10 * 1024 * 1024 + 1) },
      body: { bbox: [0, 0, 1, 1] },
    };
    const res = makeResCapture();

    let calledNext = false;
    enforceMw(req, res, () => {
      calledNext = true;
    });

    expect(calledNext).toBe(false);
    expect(res.statusCode).toBe(413);
    expect(responseBody).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'PAYLOADTOOLARGE',
        }),
      })
    );
  });

  test('Satellite preprocess enforceMaxBodySize: fallback approx branch when no content-length (Buffer.byteLength mocked)', () => {
    const router = require('../../src/api/routes/satellite.routes');
    const preprocessLayer = router.stack.find(
      l => l.route && l.route.path === '/preprocess' && l.route.methods && l.route.methods.post
    );
    const enforceMw = preprocessLayer.route.stack[0].handle;

    const req = {
      headers: {}, // no content-length
      body: { a: 'small' },
    };
    const res = makeResCapture();

    const spy = jest.spyOn(Buffer, 'byteLength').mockReturnValue(10 * 1024 * 1024 + 100); // force over limit
    try {
      let calledNext = false;
      enforceMw(req, res, () => {
        calledNext = true;
      });

      expect(calledNext).toBe(false);
      expect(res.statusCode).toBe(413);
      expect(responseBody).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'PAYLOADTOOLARGE' }),
        })
      );
    } finally {
      spy.mockRestore();
    }
  });

  test('Satellite preprocess enforceMaxBodySize: pass-through when below threshold', () => {
    const router = require('../../src/api/routes/satellite.routes');
    const preprocessLayer = router.stack.find(
      l => l.route && l.route.path === '/preprocess' && l.route.methods && l.route.methods.post
    );
    const enforceMw = preprocessLayer.route.stack[0].handle;

    const req = {
      headers: { 'content-length': String(1024) }, // 1KB
      body: { ok: true },
    };
    const res = makeResCapture();

    let nextCalled = false;
    enforceMw(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBe(null);
    expect(responseBody).toBe(null);
  });

  test('Satellite preprocess enforceMaxBodySize: catch branch when JSON.stringify throws', () => {
    const router = require('../../src/api/routes/satellite.routes');
    const preprocessLayer = router.stack.find(
      l => l.route && l.route.path === '/preprocess' && l.route.methods && l.route.methods.post
    );
    const enforceMw = preprocessLayer.route.stack[0].handle;

    // Create circular structure to make JSON.stringify throw
    const circ = {};
    circ.self = circ;

    const req = { headers: {}, body: circ };
    const res = makeResCapture();

    let nextCalled = false;
    enforceMw(req, res, () => {
      nextCalled = true;
    });

    // Should swallow and call next() with no 413 since error is caught
    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBe(null);
    expect(responseBody).toBe(null);
  });
});

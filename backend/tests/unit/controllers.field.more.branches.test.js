'use strict';

describe('Field Controller additional branches', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function makeResCapture() {
    const res = {};
    res.statusCode = null;
    res.jsonBody = null;
    res.headers = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (body) => {
      res.jsonBody = body;
      return res;
    };
    res.set = (h) => {
      res.headers = { ...res.headers, ...h };
      return res;
    };
    return res;
  }

  test('updateBoundary success path returns 200 and payload', async () => {
    await jest.isolateModules(async () => {
      const mockSvc = {
        updateBoundary: jest.fn(async (_userId, _id, _boundary) => ({ ok: true, id: _id })),
      };
      jest.doMock('../../src/services/field.service.js', () => ({
        getFieldService: () => mockSvc,
      }));

      const controller = require('../../src/api/controllers/field.controller.js');
      const req = {
        user: { userId: 'user-1' },
        params: { id: 'field-1' },
        body: { boundary: { type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] } },
      };
      const res = makeResCapture();
      const next = jest.fn();

      await controller.updateBoundary(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.jsonBody).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ ok: true, id: 'field-1' }),
        })
      );
      expect(mockSvc.updateBoundary).toHaveBeenCalledWith('user-1', 'field-1', expect.any(Object));
    });
  });

  test('archive error branch calls next(err)', async () => {
    await jest.isolateModules(async () => {
      const boom = new Error('fail-archive');
      const mockSvc = {
        archive: jest.fn(async () => { throw boom; }),
      };
      jest.doMock('../../src/services/field.service.js', () => ({
        getFieldService: () => mockSvc,
      }));

      const controller = require('../../src/api/controllers/field.controller.js');
      const req = { user: { userId: 'u' }, params: { id: 'f' } };
      const res = makeResCapture();
      const next = jest.fn();

      await controller.archive(req, res, next);

      expect(next).toHaveBeenCalledWith(boom);
      expect(res.statusCode).toBe(null);
    });
  });

  test('restore success path returns 200', async () => {
    await jest.isolateModules(async () => {
      const mockSvc = {
        restore: jest.fn(async (_userId, _id) => ({ id: _id, status: 'active' })),
      };
      jest.doMock('../../src/services/field.service.js', () => ({
        getFieldService: () => mockSvc,
      }));

      const controller = require('../../src/api/controllers/field.controller.js');
      const req = { user: { userId: 'u2' }, params: { id: 'f2' } };
      const res = makeResCapture();
      const next = jest.fn();

      await controller.restore(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.jsonBody).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: 'f2', status: 'active' }),
        })
      );
    });
  });

  test('remove/delete error branch calls next(err)', async () => {
    await jest.isolateModules(async () => {
      const err = new Error('delete failed');
      const mockSvc = {
        delete: jest.fn(async () => { throw err; }),
      };
      jest.doMock('../../src/services/field.service.js', () => ({
        getFieldService: () => mockSvc,
      }));

      const controller = require('../../src/api/controllers/field.controller.js');
      const req = { user: { userId: 'u3' }, params: { id: 'f3' }, headers: { 'x-request-id': 't-1' } };
      const res = makeResCapture();
      const next = jest.fn();

      await controller.remove(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(res.statusCode).toBe(null);
    });
  });
});

describe('custom-errors constructors branch hits', () => {
  test('instantiate all custom errors and assert properties', () => {
    const {
      AppError,
      ValidationError,
      NotFoundError,
      UnauthorizedError,
      ForbiddenError,
      ConflictError,
      BusinessError,
    } = require('../../src/errors/custom-errors.js');

    const e1 = new AppError('X', 'msg', 418, { a: 1 });
    expect(e1).toMatchObject({ code: 'X', statusCode: 418, details: { a: 1 }, name: 'AppError' });

    const e2 = new ValidationError('bad', { f: 'x' });
    expect(e2).toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400, name: 'ValidationError' });

    const e3 = new NotFoundError('nf', { k: 1 });
    expect(e3).toMatchObject({ code: 'NOT_FOUND', statusCode: 404, name: 'NotFoundError' });

    const e4 = new UnauthorizedError('u', {});
    expect(e4).toMatchObject({ code: 'UNAUTHORIZED', statusCode: 401, name: 'UnauthorizedError' });

    const e5 = new ForbiddenError('f', {});
    expect(e5).toMatchObject({ code: 'FORBIDDEN', statusCode: 403, name: 'ForbiddenError' });

    const e6 = new ConflictError('c', {});
    expect(e6).toMatchObject({ code: 'CONFLICT', statusCode: 409, name: 'ConflictError' });

    const e7 = new BusinessError('B_CODE', 'b msg', { z: 1 });
    expect(e7).toMatchObject({ code: 'B_CODE', statusCode: 422, name: 'BusinessError' });
  });
});
test('custom-errors default constructors cover default branches', () => {
  const {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    BusinessError,
  } = require('../../src/errors/custom-errors.js');

  const a = new AppError('C', 'msg');
  expect(a.statusCode).toBe(500);
  expect(a.details).toEqual({});

  const v = new ValidationError();
  expect(v).toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400, name: 'ValidationError' });

  const n = new NotFoundError();
  expect(n).toMatchObject({ code: 'NOT_FOUND', statusCode: 404, name: 'NotFoundError' });

  const u = new UnauthorizedError();
  expect(u).toMatchObject({ code: 'UNAUTHORIZED', statusCode: 401, name: 'UnauthorizedError' });

  const f = new ForbiddenError();
  expect(f).toMatchObject({ code: 'FORBIDDEN', statusCode: 403, name: 'ForbiddenError' });

  const c = new ConflictError();
  expect(c).toMatchObject({ code: 'CONFLICT', statusCode: 409, name: 'ConflictError' });

  const b = new BusinessError();
  expect(b).toMatchObject({ statusCode: 422, name: 'BusinessError' });
});
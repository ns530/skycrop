// Mock the field service and logger
jest.mock('../../src/services/field.service', () => ({
  getFieldService: jest.fn(),
}));
jest.mock('../../src/utils/logger');

const { logger } = require('../../src/utils/logger');

describe('Field Controller', () => {
  let fieldController;
  let mockFieldService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock service
    mockFieldService = {
      list: jest.fn(),
      createWithBoundary: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      updateBoundary: jest.fn(),
      archive: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
    };

    // Mock the service getter
    const { getFieldService } = require('../../src/services/field.service');
    getFieldService.mockReturnValue(mockFieldService);

    // Require controller after mock is set up
    fieldController = require('../../src/api/controllers/field.controller');

    // Setup mock request/response
    mockReq = {
      user: { user_id: 'test-user-id' },
      params: {},
      query: {},
      body: {},
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('list', () => {
    test('should return fields list successfully', async () => {
      await jest.isolateModules(async () => {
        const { getFieldService } = require('../../src/services/field.service');
        getFieldService.mockReturnValue(mockFieldService);

        const fieldController = require('../../src/api/controllers/field.controller');

        const mockResult = {
          items: [{ id: 'field1', name: 'Field 1' }],
          total: 1,
          page: 1,
          pageSize: 20,
          cacheHit: false,
        };
        mockFieldService.list.mockResolvedValue(mockResult);
        mockReq.headers['x-request-id'] = 'test-correlation-id';

        await fieldController.list(mockReq, mockRes, mockNext);

        expect(mockFieldService.list).toHaveBeenCalledWith('test-user-id', {});
        expect(logger.info).toHaveBeenCalledWith(
          'fields.list',
          expect.objectContaining({
            route: '/api/v1/fields',
            method: 'GET',
            user_id: 'test-user-id',
            correlationid: 'test-correlation-id',
            cachehit: false,
          })
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          data: [{ id: 'field1', name: 'Field 1' }],
          pagination: { page: 1, pagesize: 20, total: 1 },
          meta: expect.objectContaining({
            correlationid: 'test-correlation-id',
            cachehit: false,
          }),
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    test('should handle service error', async () => {
      const error = new Error('Service error');
      mockFieldService.list.mockRejectedValue(error);

      await fieldController.list(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should handle missing correlation id', async () => {
      mockFieldService.list.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        cacheHit: true,
      });

      await fieldController.list(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({
            correlationid: null,
            cachehit: true,
          }),
        })
      );
    });
  });

  describe('create', () => {
    test('should create field successfully', async () => {
      const mockData = { id: 'new-field', name: 'New Field' };
      mockFieldService.createWithBoundary.mockResolvedValue(mockData);
      mockReq.body = { name: 'New Field', boundary: { type: 'Polygon', coordinates: [] } };
      mockReq.headers['x-request-id'] = 'create-correlation-id';

      await fieldController.create(mockReq, mockRes, mockNext);

      expect(mockFieldService.createWithBoundary).toHaveBeenCalledWith(
        'test-user-id',
        'New Field',
        { type: 'Polygon', coordinates: [] }
      );
      expect(logger.info).toHaveBeenCalledWith(
        'fields.create',
        expect.objectContaining({
          route: '/api/v1/fields',
          method: 'POST',
          user_id: 'test-user-id',
          correlationid: 'create-correlation-id',
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
        meta: expect.objectContaining({
          correlationid: 'create-correlation-id',
        }),
      });
    });

    test('should handle create error', async () => {
      const error = new Error('Create failed');
      mockFieldService.createWithBoundary.mockRejectedValue(error);
      mockReq.body = { name: 'Bad Field' };

      await fieldController.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    test('should get field by id successfully', async () => {
      const mockData = { id: 'field123', name: 'Test Field' };
      mockFieldService.getById.mockResolvedValue(mockData);
      mockReq.params.id = 'field123';
      mockReq.headers['x-request-id'] = 'get-correlation-id';

      await fieldController.getById(mockReq, mockRes, mockNext);

      expect(mockFieldService.getById).toHaveBeenCalledWith('test-user-id', 'field123');
      expect(logger.info).toHaveBeenCalledWith(
        'fields.getById',
        expect.objectContaining({
          route: '/api/v1/fields/{id}',
          method: 'GET',
          user_id: 'test-user-id',
          field_id: 'field123',
          correlationid: 'get-correlation-id',
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
        meta: expect.objectContaining({
          correlationid: 'get-correlation-id',
        }),
      });
    });

    test('should handle getById error', async () => {
      const error = new Error('Field not found');
      mockFieldService.getById.mockRejectedValue(error);
      mockReq.params.id = 'nonexistent';

      await fieldController.getById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    test('should update field successfully', async () => {
      const mockData = { id: 'field123', name: 'Updated Field', status: 'active' };
      mockFieldService.update.mockResolvedValue(mockData);
      mockReq.params.id = 'field123';
      mockReq.body = { name: 'Updated Field', status: 'active' };
      mockReq.headers['x-request-id'] = 'update-correlation-id';

      await fieldController.update(mockReq, mockRes, mockNext);

      expect(mockFieldService.update).toHaveBeenCalledWith('test-user-id', 'field123', {
        name: 'Updated Field',
        status: 'active',
      });
      expect(logger.info).toHaveBeenCalledWith(
        'fields.update',
        expect.objectContaining({
          route: '/api/v1/fields/{id}',
          method: 'PATCH',
          user_id: 'test-user-id',
          field_id: 'field123',
          correlationid: 'update-correlation-id',
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
        meta: expect.objectContaining({
          correlationid: 'update-correlation-id',
        }),
      });
    });

    test('should handle update error', async () => {
      const error = new Error('Update failed');
      mockFieldService.update.mockRejectedValue(error);
      mockReq.params.id = 'field123';
      mockReq.body = { name: 'Bad Update' };

      await fieldController.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateBoundary', () => {
    test('should update boundary successfully', async () => {
      const mockData = { id: 'field123', boundary: { type: 'Polygon', coordinates: [] } };
      mockFieldService.updateBoundary.mockResolvedValue(mockData);
      mockReq.params.id = 'field123';
      mockReq.body = { boundary: { type: 'Polygon', coordinates: [] } };

      await fieldController.updateBoundary(mockReq, mockRes, mockNext);

      expect(mockFieldService.updateBoundary).toHaveBeenCalledWith('test-user-id', 'field123', {
        type: 'Polygon',
        coordinates: [],
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
    });

    test('should handle updateBoundary error', async () => {
      const error = new Error('Boundary update failed');
      mockFieldService.updateBoundary.mockRejectedValue(error);
      mockReq.params.id = 'field123';
      mockReq.body = { boundary: {} };

      await fieldController.updateBoundary(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('archive', () => {
    test('should archive field successfully', async () => {
      const mockData = { id: 'field123', status: 'archived' };
      mockFieldService.archive.mockResolvedValue(mockData);
      mockReq.params.id = 'field123';

      await fieldController.archive(mockReq, mockRes, mockNext);

      expect(mockFieldService.archive).toHaveBeenCalledWith('test-user-id', 'field123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
    });

    test('should handle archive error', async () => {
      const error = new Error('Archive failed');
      mockFieldService.archive.mockRejectedValue(error);
      mockReq.params.id = 'field123';

      await fieldController.archive(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('remove', () => {
    test('should delete field successfully', async () => {
      const mockData = { id: 'field123', deleted: true };
      mockFieldService.delete.mockResolvedValue(mockData);
      mockReq.params.id = 'field123';
      mockReq.headers['x-request-id'] = 'delete-correlation-id';

      await fieldController.remove(mockReq, mockRes, mockNext);

      expect(mockFieldService.delete).toHaveBeenCalledWith('test-user-id', 'field123');
      expect(logger.info).toHaveBeenCalledWith(
        'fields.delete',
        expect.objectContaining({
          route: '/api/v1/fields/{id}',
          method: 'DELETE',
          user_id: 'test-user-id',
          field_id: 'field123',
          correlationid: 'delete-correlation-id',
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
        meta: expect.objectContaining({
          correlationid: 'delete-correlation-id',
        }),
      });
    });

    test('should handle delete error', async () => {
      const error = new Error('Delete failed');
      mockFieldService.delete.mockRejectedValue(error);
      mockReq.params.id = 'field123';

      await fieldController.remove(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('restore', () => {
    test('should restore field successfully', async () => {
      const mockData = { id: 'field123', status: 'active' };
      mockFieldService.restore.mockResolvedValue(mockData);
      mockReq.params.id = 'field123';

      await fieldController.restore(mockReq, mockRes, mockNext);

      expect(mockFieldService.restore).toHaveBeenCalledWith('test-user-id', 'field123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
    });

    test('should handle restore error', async () => {
      const error = new Error('Restore failed');
      mockFieldService.restore.mockRejectedValue(error);
      mockReq.params.id = 'field123';

      await fieldController.restore(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

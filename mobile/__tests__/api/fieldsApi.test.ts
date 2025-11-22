/**
 * Unit Tests for Fields API Client
 */

import { fieldsApi } from '../../src/api/fieldsApi';
import { apiClient } from '../../src/api/client';

// Mock axios instance
jest.mock('../../src/api/client');

describe('Fields API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listFields', () => {
    it('should fetch fields list successfully', async () => {
      const mockResponse = {
        data: {
          data: [{ field_id: '1', name: 'Test Field' }],
          pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fieldsApi.listFields();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/fields', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass query parameters', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: { page: 2, limit: 5, total: 0, total_pages: 0 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const params = { page: 2, limit: 5, status: 'active' as const };
      await fieldsApi.listFields(params);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/fields', { params });
    });
  });

  describe('getFieldById', () => {
    it('should fetch field by ID successfully', async () => {
      const mockField = {
        field_id: '1',
        name: 'Test Field',
        area_ha: 5.5,
      };

      const mockResponse = { data: mockField };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fieldsApi.getFieldById('1');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/fields/1');
      expect(result).toEqual(mockField);
    });
  });

  describe('createField', () => {
    it('should create field successfully', async () => {
      const newField = {
        name: 'New Field',
        boundary: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [74.3587, 31.5204],
              [74.3687, 31.5204],
              [74.3687, 31.5304],
              [74.3587, 31.5304],
              [74.3587, 31.5204],
            ],
          ],
        },
      };

      const mockCreatedField = {
        field_id: '3',
        ...newField,
        area_ha: 5.5,
      };

      const mockResponse = { data: mockCreatedField };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fieldsApi.createField(newField);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/fields', newField);
      expect(result).toEqual(mockCreatedField);
    });
  });

  describe('updateField', () => {
    it('should update field successfully', async () => {
      const updates = { name: 'Updated Field Name' };
      const mockUpdatedField = {
        field_id: '1',
        name: 'Updated Field Name',
        area_ha: 5.5,
      };

      const mockResponse = { data: mockUpdatedField };
      (apiClient.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fieldsApi.updateField('1', updates);

      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/fields/1', updates);
      expect(result).toEqual(mockUpdatedField);
    });
  });

  describe('deleteField', () => {
    it('should delete field successfully', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await fieldsApi.deleteField('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/fields/1');
    });
  });

  describe('getFieldHealthSummary', () => {
    it('should fetch field health summary', async () => {
      const mockHealth = {
        current: { health_score: 85, ndvi_mean: 0.75 },
        history: [],
        trends: { health_score_trend: 'improving' },
      };

      const mockResponse = { data: mockHealth };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fieldsApi.getFieldHealthSummary('1');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/fields/1/health/summary');
      expect(result).toEqual(mockHealth);
    });
  });

  describe('getFieldRecommendations', () => {
    it('should fetch field recommendations', async () => {
      const mockRecommendations = [
        { id: 1, title: 'Irrigate field', priority: 'high' },
      ];

      const mockResponse = { data: mockRecommendations };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fieldsApi.getFieldRecommendations('1');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/fields/1/recommendations');
      expect(result).toEqual(mockRecommendations);
    });
  });
});


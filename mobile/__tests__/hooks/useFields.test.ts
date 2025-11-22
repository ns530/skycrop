/**
 * Unit Tests for useFields Hook
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFields, useFieldDetail, useCreateField, useDeleteField } from '../../src/hooks/useFields';
import { fieldsApi } from '../../src/api/fieldsApi';

// Mock the API
jest.mock('../../src/api/fieldsApi');

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useFields Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useFields - Fetch Fields List', () => {
    it('should fetch fields successfully', async () => {
      const mockFields = {
        data: [
          {
            field_id: '1',
            name: 'Test Field 1',
            area_ha: 5.5,
            health_score: 85,
            health_status: 'good' as const,
            center: { type: 'Point' as const, coordinates: [74.3587, 31.5204] },
          },
          {
            field_id: '2',
            name: 'Test Field 2',
            area_ha: 3.2,
            health_score: 92,
            health_status: 'excellent' as const,
            center: { type: 'Point' as const, coordinates: [74.3687, 31.5304] },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          total_pages: 1,
        },
      };

      (fieldsApi.listFields as jest.Mock).mockResolvedValue(mockFields);

      const { result } = renderHook(() => useFields(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockFields);
      expect(result.current.data?.data).toHaveLength(2);
      expect(result.current.data?.data[0].name).toBe('Test Field 1');
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Network error');
      (fieldsApi.listFields as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useFields(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBeUndefined();
    });

    it('should pass pagination parameters', async () => {
      const mockFields = {
        data: [],
        pagination: { page: 2, limit: 5, total: 0, total_pages: 0 },
      };

      (fieldsApi.listFields as jest.Mock).mockResolvedValue(mockFields);

      const params = { page: 2, limit: 5, status: 'active' as const };
      renderHook(() => useFields(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(fieldsApi.listFields).toHaveBeenCalledWith(params);
      });
    });
  });

  describe('useFieldDetail - Fetch Single Field', () => {
    it('should fetch field detail successfully', async () => {
      const mockField = {
        field_id: '1',
        user_id: 'user-123',
        name: 'Test Field',
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
        area_sqm: 55000,
        area_ha: 5.5,
        center: { type: 'Point' as const, coordinates: [74.3637, 31.5254] },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        status: 'active' as const,
      };

      (fieldsApi.getFieldById as jest.Mock).mockResolvedValue(mockField);

      const { result } = renderHook(() => useFieldDetail('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockField);
      expect(result.current.data?.name).toBe('Test Field');
    });

    it('should not fetch if fieldId is empty', () => {
      const { result } = renderHook(() => useFieldDetail(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(fieldsApi.getFieldById).not.toHaveBeenCalled();
    });
  });

  describe('useCreateField - Create New Field', () => {
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
        user_id: 'user-123',
        ...newField,
        area_sqm: 55000,
        area_ha: 5.5,
        center: { type: 'Point' as const, coordinates: [74.3637, 31.5254] },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        status: 'active' as const,
      };

      (fieldsApi.createField as jest.Mock).mockResolvedValue(mockCreatedField);

      const { result } = renderHook(() => useCreateField(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newField);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCreatedField);
      expect(fieldsApi.createField).toHaveBeenCalledWith(newField);
    });

    it('should handle creation error', async () => {
      const mockError = new Error('Invalid boundary');
      (fieldsApi.createField as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateField(), {
        wrapper: createWrapper(),
      });

      const newField = {
        name: 'Invalid Field',
        boundary: {
          type: 'Polygon' as const,
          coordinates: [[[0, 0]]],
        },
      };

      result.current.mutate(newField);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useDeleteField - Delete Field', () => {
    it('should delete field successfully', async () => {
      (fieldsApi.deleteField as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteField(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fieldsApi.deleteField).toHaveBeenCalledWith('1');
    });

    it('should handle deletion error', async () => {
      const mockError = new Error('Field not found');
      (fieldsApi.deleteField as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDeleteField(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('999');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(mockError);
    });
  });
});


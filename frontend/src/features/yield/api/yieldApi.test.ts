/**
 * Tests for yield API functions
 */

import { httpClient } from "../../../shared/api/httpClient";

import {
  getActualYieldRecords,
  submitActualYield,
  deleteYieldRecord,
} from "./yieldApi";

// Mock httpClient to prevent network requests
jest.mock("../../../shared/api/httpClient", () => {
  const mockHttpClient = {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  };
  return {
    httpClient: mockHttpClient,
    normalizeApiError: jest.fn((error) => error),
  };
});

describe("yieldApi", () => {
  const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("getActualYieldRecords", () => {
    it("returns empty array when no records exist", async () => {
      mockHttpClient.get.mockResolvedValue({
        data: {
          success: true,
          data: [],
          pagination: {
            page: 1,
            page_size: 100,
            total: 0,
            total_pages: 0,
          },
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });

      const records = await getActualYieldRecords("field-123");
      expect(records).toEqual([]);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        "/fields/field-123/yield",
        expect.objectContaining({
          params: expect.objectContaining({
            page: 1,
            page_size: 100,
          }),
        }),
      );
    });

    it("returns records for specific field", async () => {
      // Backend should return only records for the requested field
      const backendData = [
        {
          yield_id: "yield-1",
          field_id: "field-123",
          harvest_date: "2024-05-15",
          actual_yield_per_ha: 4500,
          total_yield_kg: 11250,
          created_at: "2024-05-15T10:00:00Z",
          updated_at: "2024-05-15T10:00:00Z",
        },
      ];

      mockHttpClient.get.mockResolvedValue({
        data: {
          success: true,
          data: backendData,
          pagination: {
            page: 1,
            page_size: 100,
            total: 1,
            total_pages: 1,
          },
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });

      const records = await getActualYieldRecords("field-123");

      expect(records).toHaveLength(1);
      expect(records[0].id).toBe("yield-1");
      expect(records[0].fieldId).toBe("field-123");
    });

    it("sorts records by harvest date descending", async () => {
      // Backend should return data sorted by harvest_date desc (most recent first)
      const backendData = [
        {
          yield_id: "yield-2",
          field_id: "field-123",
          harvest_date: "2024-05-20",
          actual_yield_per_ha: 4800,
          total_yield_kg: 12000,
          created_at: "2024-05-20T10:00:00Z",
          updated_at: "2024-05-20T10:00:00Z",
        },
        {
          yield_id: "yield-1",
          field_id: "field-123",
          harvest_date: "2024-03-15",
          actual_yield_per_ha: 4500,
          total_yield_kg: 11250,
          created_at: "2024-03-15T10:00:00Z",
          updated_at: "2024-03-15T10:00:00Z",
        },
        {
          yield_id: "yield-3",
          field_id: "field-123",
          harvest_date: "2024-01-10",
          actual_yield_per_ha: 4200,
          total_yield_kg: 10500,
          created_at: "2024-01-10T10:00:00Z",
          updated_at: "2024-01-10T10:00:00Z",
        },
      ];

      mockHttpClient.get.mockResolvedValue({
        data: {
          success: true,
          data: backendData,
          pagination: {
            page: 1,
            page_size: 100,
            total: 3,
            total_pages: 1,
          },
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });

      const records = await getActualYieldRecords("field-123");

      expect(records).toHaveLength(3);
      // Backend should return sorted by harvest_date desc
      expect(records[0].harvestDate).toBe("2024-05-20"); // Most recent first
      expect(records[1].harvestDate).toBe("2024-03-15");
      expect(records[2].harvestDate).toBe("2024-01-10");
    });
  });

  describe("submitActualYield", () => {
    it("creates a new yield record", async () => {
      const payload = {
        fieldId: "field-123",
        harvestDate: "2024-05-15",
        actualYieldKgPerHa: 4500,
        totalYieldKg: 11250,
        notes: "Good harvest",
      };

      const backendResponse = {
        yield_id: "yield-new-1",
        field_id: "field-123",
        harvest_date: "2024-05-15",
        actual_yield_per_ha: 4500,
        total_yield_kg: 11250,
        predicted_yield_per_ha: 4500,
        accuracy_mape: 0,
        notes: "Good harvest",
        created_at: "2024-05-15T10:00:00Z",
        updated_at: "2024-05-15T10:00:00Z",
      };

      mockHttpClient.post.mockResolvedValue({
        data: {
          success: true,
          data: backendResponse,
        },
        status: 201,
        statusText: "Created",
        headers: {},
        config: {} as any,
      });

      const record = await submitActualYield(payload);

      expect(record.id).toBe("yield-new-1");
      expect(record.fieldId).toBe("field-123");
      expect(record.harvestDate).toBe("2024-05-15");
      expect(record.actualYieldKgPerHa).toBe(4500);
      expect(record.totalYieldKg).toBe(11250);
      expect(record.notes).toBe("Good harvest");
      expect(record.predictedYieldKgPerHa).toBe(4500);
      expect(record.accuracy).toBe(0);
      expect(record.createdAt).toBe("2024-05-15T10:00:00Z");
    });

    it("submits yield data to backend", async () => {
      const payload = {
        fieldId: "field-123",
        harvestDate: "2024-05-15",
        actualYieldKgPerHa: 4500,
      };

      const backendResponse = {
        yield_id: "yield-new-1",
        field_id: "field-123",
        harvest_date: "2024-05-15",
        actual_yield_per_ha: 4500,
        total_yield_kg: 0,
        created_at: "2024-05-15T10:00:00Z",
        updated_at: "2024-05-15T10:00:00Z",
      };

      mockHttpClient.post.mockResolvedValue({
        data: {
          success: true,
          data: backendResponse,
        },
        status: 201,
        statusText: "Created",
        headers: {},
        config: {} as any,
      });

      await submitActualYield(payload);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "/fields/field-123/yield",
        expect.objectContaining({
          actual_yield_per_ha: 4500,
          total_yield_kg: 0,
          harvest_date: "2024-05-15",
        }),
      );
    });

    it("handles multiple submissions", async () => {
      const payload1 = {
        fieldId: "field-123",
        harvestDate: "2024-03-15",
        actualYieldKgPerHa: 4200,
      };

      const payload2 = {
        fieldId: "field-123",
        harvestDate: "2024-05-20",
        actualYieldKgPerHa: 4800,
      };

      mockHttpClient.post
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              yield_id: "yield-1",
              field_id: "field-123",
              harvest_date: "2024-03-15",
              actual_yield_per_ha: 4200,
              total_yield_kg: 0,
              created_at: "2024-03-15T10:00:00Z",
              updated_at: "2024-03-15T10:00:00Z",
            },
          },
          status: 201,
          statusText: "Created",
          headers: {},
          config: {} as any,
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              yield_id: "yield-2",
              field_id: "field-123",
              harvest_date: "2024-05-20",
              actual_yield_per_ha: 4800,
              total_yield_kg: 0,
              created_at: "2024-05-20T10:00:00Z",
              updated_at: "2024-05-20T10:00:00Z",
            },
          },
          status: 201,
          statusText: "Created",
          headers: {},
          config: {} as any,
        });

      await submitActualYield(payload1);
      await submitActualYield(payload2);

      expect(mockHttpClient.post).toHaveBeenCalledTimes(2);
    });

    it("calculates accuracy correctly when predicted yield is provided", async () => {
      const payload = {
        fieldId: "field-123",
        harvestDate: "2024-05-15",
        actualYieldKgPerHa: 4500,
        predictedYieldKgPerHa: 4500,
      };

      const backendResponse = {
        yield_id: "yield-new-1",
        field_id: "field-123",
        harvest_date: "2024-05-15",
        actual_yield_per_ha: 4500,
        total_yield_kg: 0,
        predicted_yield_per_ha: 4500,
        accuracy_mape: 0,
        created_at: "2024-05-15T10:00:00Z",
        updated_at: "2024-05-15T10:00:00Z",
      };

      mockHttpClient.post.mockResolvedValue({
        data: {
          success: true,
          data: backendResponse,
        },
        status: 201,
        statusText: "Created",
        headers: {},
        config: {} as any,
      });

      const record = await submitActualYield(payload);

      expect(record.accuracy).toBe(0); // 0% error when actual matches predicted
    });
  });

  describe("deleteYieldRecord", () => {
    it("deletes specific record", async () => {
      mockHttpClient.delete.mockResolvedValue({
        data: {},
        status: 204,
        statusText: "No Content",
        headers: {},
        config: {} as any,
      });

      await deleteYieldRecord("yield-1");

      expect(mockHttpClient.delete).toHaveBeenCalledWith("/yield/yield-1");
    });

    it("handles deletion of non-existent record gracefully", async () => {
      mockHttpClient.delete.mockResolvedValue({
        data: {},
        status: 204,
        statusText: "No Content",
        headers: {},
        config: {} as any,
      });

      await expect(deleteYieldRecord("non-existent-id")).resolves.not.toThrow();
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        "/yield/non-existent-id",
      );
    });

    it("calls delete endpoint with correct record ID", async () => {
      mockHttpClient.delete.mockResolvedValue({
        data: {},
        status: 204,
        statusText: "No Content",
        headers: {},
        config: {} as any,
      });

      await deleteYieldRecord("yield-123");

      expect(mockHttpClient.delete).toHaveBeenCalledTimes(1);
      expect(mockHttpClient.delete).toHaveBeenCalledWith("/yield/yield-123");
    });
  });
});

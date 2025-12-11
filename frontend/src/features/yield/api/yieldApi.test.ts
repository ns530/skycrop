/**
 * Tests for yield API functions
 */

import {
  getActualYieldRecords,
  submitActualYield,
  deleteYieldRecord,
} from "./yieldApi";

describe("yieldApi", () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getActualYieldRecords", () => {
    it("returns empty array when no records exist", async () => {
      const records = await getActualYieldRecords("field-123");
      expect(records).toEqual([]);
    });

    it("returns records for specific field", async () => {
      // Add some test data
      const testData = [
        {
          id: "yield-1",
          fieldId: "field-123",
          harvestDate: "2024-05-15",
          actualYieldKgPerHa: 4500,
          createdAt: "2024-05-15T10:00:00Z",
        },
        {
          id: "yield-2",
          fieldId: "field-456",
          harvestDate: "2024-05-20",
          actualYieldKgPerHa: 4800,
          createdAt: "2024-05-20T10:00:00Z",
        },
      ];
      localStorage.setItem("skycrop_yield_records", JSON.stringify(testData));

      const records = await getActualYieldRecords("field-123");

      expect(records).toHaveLength(1);
      expect(records[0].id).toBe("yield-1");
      expect(records[0].fieldId).toBe("field-123");
    });

    it("sorts records by harvest date descending", async () => {
      const testData = [
        {
          id: "yield-1",
          fieldId: "field-123",
          harvestDate: "2024-03-15",
          actualYieldKgPerHa: 4500,
          createdAt: "2024-03-15T10:00:00Z",
        },
        {
          id: "yield-2",
          fieldId: "field-123",
          harvestDate: "2024-05-20",
          actualYieldKgPerHa: 4800,
          createdAt: "2024-05-20T10:00:00Z",
        },
        {
          id: "yield-3",
          fieldId: "field-123",
          harvestDate: "2024-01-10",
          actualYieldKgPerHa: 4200,
          createdAt: "2024-01-10T10:00:00Z",
        },
      ];
      localStorage.setItem("skycrop_yield_records", JSON.stringify(testData));

      const records = await getActualYieldRecords("field-123");

      expect(records).toHaveLength(3);
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

      const record = await submitActualYield(payload);

      expect(record.id).toBeDefined();
      expect(record.fieldId).toBe("field-123");
      expect(record.harvestDate).toBe("2024-05-15");
      expect(record.actualYieldKgPerHa).toBe(4500);
      expect(record.totalYieldKg).toBe(11250);
      expect(record.notes).toBe("Good harvest");
      expect(record.predictedYieldKgPerHa).toBeDefined();
      expect(record.accuracy).toBeDefined();
      expect(record.createdAt).toBeDefined();
    });

    it("saves record to localStorage", async () => {
      const payload = {
        fieldId: "field-123",
        harvestDate: "2024-05-15",
        actualYieldKgPerHa: 4500,
      };

      await submitActualYield(payload);

      const stored = localStorage.getItem("skycrop_yield_records");
      expect(stored).toBeDefined();

      const records = JSON.parse(stored!);
      expect(records).toHaveLength(1);
      expect(records[0].fieldId).toBe("field-123");
    });

    it("appends to existing records", async () => {
      // Add initial record
      await submitActualYield({
        fieldId: "field-123",
        harvestDate: "2024-03-15",
        actualYieldKgPerHa: 4200,
      });

      // Add second record
      await submitActualYield({
        fieldId: "field-123",
        harvestDate: "2024-05-20",
        actualYieldKgPerHa: 4800,
      });

      const records = await getActualYieldRecords("field-123");
      expect(records).toHaveLength(2);
    });

    it("calculates accuracy correctly", async () => {
      const payload = {
        fieldId: "field-123",
        harvestDate: "2024-05-15",
        actualYieldKgPerHa: 4500, // Predicted is 4500 (mock)
      };

      const record = await submitActualYield(payload);

      expect(record.accuracy).toBe(0); // 0% error when actual matches predicted
    });
  });

  describe("deleteYieldRecord", () => {
    it("deletes specific record", async () => {
      // Add test records
      const record1 = await submitActualYield({
        fieldId: "field-123",
        harvestDate: "2024-03-15",
        actualYieldKgPerHa: 4200,
      });

      const record2 = await submitActualYield({
        fieldId: "field-123",
        harvestDate: "2024-05-20",
        actualYieldKgPerHa: 4800,
      });

      // Delete first record
      await deleteYieldRecord(record1.id);

      const records = await getActualYieldRecords("field-123");
      expect(records).toHaveLength(1);
      expect(records[0].id).toBe(record2.id);
    });

    it("handles deletion of non-existent record gracefully", async () => {
      await expect(deleteYieldRecord("non-existent-id")).resolves.not.toThrow();
    });

    it("removes record from localStorage", async () => {
      const record = await submitActualYield({
        fieldId: "field-123",
        harvestDate: "2024-05-15",
        actualYieldKgPerHa: 4500,
      });

      await deleteYieldRecord(record.id);

      const stored = localStorage.getItem("skycrop_yield_records");
      const records = JSON.parse(stored || "[]");
      expect(records).toHaveLength(0);
    });
  });
});

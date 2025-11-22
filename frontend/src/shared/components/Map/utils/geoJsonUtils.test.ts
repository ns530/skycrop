/**
 * Tests for GeoJSON utility functions
 */

import {
  calculatePolygonCenter,
  calculateBounds,
  normalizeGeoJson,
  isValidPolygon,
  calculatePolygonArea,
} from './geoJsonUtils';
import type { FieldBoundary } from '../types/map.types';

describe('geoJsonUtils', () => {
  // Sample polygon representing a small field in Sri Lanka
  const samplePolygon: FieldBoundary = {
    type: 'Polygon',
    coordinates: [
      [
        [80.0, 7.0],
        [80.1, 7.0],
        [80.1, 7.1],
        [80.0, 7.1],
        [80.0, 7.0], // Close polygon
      ],
    ],
  };

  const sampleMultiPolygon: FieldBoundary = {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [80.0, 7.0],
          [80.05, 7.0],
          [80.05, 7.05],
          [80.0, 7.05],
          [80.0, 7.0],
        ],
      ],
    ],
  };

  describe('calculatePolygonCenter', () => {
    it('calculates correct center point for Polygon', () => {
      const center = calculatePolygonCenter(samplePolygon);

      expect(center.lat).toBeCloseTo(7.05, 1);
      expect(center.lng).toBeCloseTo(80.05, 1);
    });

    it('calculates correct center point for MultiPolygon', () => {
      const center = calculatePolygonCenter(sampleMultiPolygon);

      expect(center.lat).toBeCloseTo(7.025, 2);
      expect(center.lng).toBeCloseTo(80.025, 2);
    });

    it('returns default Sri Lanka center for empty polygon', () => {
      const emptyPolygon: FieldBoundary = {
        type: 'Polygon',
        coordinates: [[]],
      };

      const center = calculatePolygonCenter(emptyPolygon);

      expect(center.lat).toBe(7.9403);
      expect(center.lng).toBe(81.0188);
    });
  });

  describe('calculateBounds', () => {
    it('calculates correct bounding box for Polygon', () => {
      const bounds = calculateBounds(samplePolygon);

      expect(bounds.northEast).toEqual({ lat: 7.1, lng: 80.1 });
      expect(bounds.southWest).toEqual({ lat: 7.0, lng: 80.0 });
    });

    it('calculates correct bounding box for MultiPolygon', () => {
      const bounds = calculateBounds(sampleMultiPolygon);

      expect(bounds.northEast).toEqual({ lat: 7.05, lng: 80.05 });
      expect(bounds.southWest).toEqual({ lat: 7.0, lng: 80.0 });
    });

    it('returns default bounds for empty polygon', () => {
      const emptyPolygon: FieldBoundary = {
        type: 'Polygon',
        coordinates: [[]],
      };

      const bounds = calculateBounds(emptyPolygon);

      expect(bounds.northEast).toEqual({ lat: 9.8, lng: 82.0 });
      expect(bounds.southWest).toEqual({ lat: 6.0, lng: 79.5 });
    });
  });

  describe('normalizeGeoJson', () => {
    it('returns Polygon as-is when already normalized', () => {
      const result = normalizeGeoJson(samplePolygon);

      expect(result).toEqual(samplePolygon);
    });

    it('returns MultiPolygon as-is when already normalized', () => {
      const result = normalizeGeoJson(sampleMultiPolygon);

      expect(result).toEqual(sampleMultiPolygon);
    });

    it('extracts geometry from Feature wrapper', () => {
      const feature = {
        type: 'Feature',
        properties: {},
        geometry: samplePolygon,
      };

      const result = normalizeGeoJson(feature);

      expect(result).toEqual(samplePolygon);
    });

    it('throws error for null input', () => {
      expect(() => normalizeGeoJson(null)).toThrow('GeoJSON cannot be null or undefined');
    });

    it('throws error for invalid format', () => {
      const invalid = {
        type: 'LineString',
        coordinates: [[80.0, 7.0], [80.1, 7.1]],
      };

      expect(() => normalizeGeoJson(invalid)).toThrow('Invalid GeoJSON format');
    });
  });

  describe('isValidPolygon', () => {
    it('returns true for valid Polygon', () => {
      expect(isValidPolygon(samplePolygon)).toBe(true);
    });

    it('returns true for valid MultiPolygon', () => {
      expect(isValidPolygon(sampleMultiPolygon)).toBe(true);
    });

    it('returns false for polygon with too few points', () => {
      const invalidPolygon: FieldBoundary = {
        type: 'Polygon',
        coordinates: [
          [
            [80.0, 7.0],
            [80.1, 7.0],
            [80.0, 7.0], // Only 3 points (not enough)
          ],
        ],
      };

      expect(isValidPolygon(invalidPolygon)).toBe(false);
    });

    it('returns false for unclosed polygon', () => {
      const unclosedPolygon: FieldBoundary = {
        type: 'Polygon',
        coordinates: [
          [
            [80.0, 7.0],
            [80.1, 7.0],
            [80.1, 7.1],
            [80.0, 7.1],
            // Missing closing point
          ],
        ],
      };

      expect(isValidPolygon(unclosedPolygon)).toBe(false);
    });

    it('returns false for empty coordinates', () => {
      const emptyPolygon: FieldBoundary = {
        type: 'Polygon',
        coordinates: [],
      };

      expect(isValidPolygon(emptyPolygon)).toBe(false);
    });
  });

  describe('calculatePolygonArea', () => {
    it('calculates approximate area in hectares for Polygon', () => {
      const area = calculatePolygonArea(samplePolygon);

      // Expected area: 0.01 degree² (0.1 × 0.1) × 111.32² km²/degree² × cos(7°) × 100 ha/km²
      // ≈ 0.01 × 12,392 × 0.993 × 100 ≈ 12,300 hectares
      expect(area).toBeGreaterThan(10000);
      expect(area).toBeLessThan(15000);
    });

    it('calculates approximate area for MultiPolygon', () => {
      const area = calculatePolygonArea(sampleMultiPolygon);

      // Smaller area (0.05 × 0.05 degrees = 0.0025 degree²)
      // ≈ 0.0025 × 12,392 × 0.993 × 100 ≈ 3,075 hectares
      expect(area).toBeGreaterThan(2500);
      expect(area).toBeLessThan(4000);
    });

    it('returns 0 for polygon with too few points', () => {
      const invalidPolygon: FieldBoundary = {
        type: 'Polygon',
        coordinates: [
          [
            [80.0, 7.0],
            [80.1, 7.0],
          ],
        ],
      };

      const area = calculatePolygonArea(invalidPolygon);
      expect(area).toBe(0);
    });

    it('returns 0 for empty polygon', () => {
      const emptyPolygon: FieldBoundary = {
        type: 'Polygon',
        coordinates: [[]],
      };

      const area = calculatePolygonArea(emptyPolygon);
      expect(area).toBe(0);
    });
  });
});


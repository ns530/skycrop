/**
 * GeoJSON utility functions for map operations
 */

import type { FieldBoundary, MapCenter, MapBounds } from '../types/map.types';

/**
 * Calculate the center point of a GeoJSON polygon
 * Uses simple centroid calculation (average of all coordinates)
 */
export const calculatePolygonCenter = (boundary: FieldBoundary): MapCenter => {
  if (boundary.type === 'MultiPolygon') {
    // For MultiPolygon, use the first polygon
    const coordinates = boundary.coordinates[0]?.[0];
    if (!coordinates || coordinates.length === 0) {
      return { lat: 7.9403, lng: 81.0188 };
    }
    
    let sumLat = 0;
    let sumLng = 0;
    const count = coordinates.length;

    coordinates.forEach((coord) => {
      const [lng, lat] = coord;
      sumLat += lat;
      sumLng += lng;
    });

    return {
      lat: sumLat / count,
      lng: sumLng / count,
    };
  }
  
  // For Polygon
  const coordinates = boundary.coordinates[0]; // Get outer ring
  
  if (!coordinates || coordinates.length === 0) {
    // Default to Sri Lanka center if no coordinates
    return { lat: 7.9403, lng: 81.0188 };
  }

  let sumLat = 0;
  let sumLng = 0;
  const count = coordinates.length;

  coordinates.forEach((coord) => {
    const [lng, lat] = coord;
    sumLat += lat;
    sumLng += lng;
  });

  return {
    lat: sumLat / count,
    lng: sumLng / count,
  };
};

/**
 * Calculate bounding box for a polygon
 * Returns the min/max lat/lng bounds
 */
export const calculateBounds = (boundary: FieldBoundary): MapBounds => {
  const coordinates = boundary.type === 'Polygon' 
    ? boundary.coordinates[0] 
    : boundary.coordinates[0]?.[0];

  if (!coordinates || coordinates.length === 0) {
    // Return default bounds for Sri Lanka
    return {
      northEast: { lat: 9.8, lng: 82.0 },
      southWest: { lat: 6.0, lng: 79.5 },
    };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  coordinates.forEach((coord) => {
    const [lng, lat] = coord;
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });

  return {
    northEast: { lat: maxLat, lng: maxLng },
    southWest: { lat: minLat, lng: minLng },
  };
};

/**
 * Convert backend GeoJSON to Leaflet format
 * Handles various GeoJSON formats and normalizes them
 */
export const normalizeGeoJson = (geoJson: any): FieldBoundary => {
  if (!geoJson) {
    throw new Error('GeoJSON cannot be null or undefined');
  }

  // If it's already in the correct format (Polygon or MultiPolygon)
  if ((geoJson.type === 'Polygon' || geoJson.type === 'MultiPolygon') && geoJson.coordinates) {
    return geoJson as FieldBoundary;
  }

  // If it's wrapped in a Feature
  if (geoJson.type === 'Feature' && geoJson.geometry) {
    return geoJson.geometry as FieldBoundary;
  }

  throw new Error('Invalid GeoJSON format');
};

/**
 * Validate if a GeoJSON polygon is valid
 */
export const isValidPolygon = (boundary: FieldBoundary): boolean => {
  if (!boundary || (boundary.type !== 'Polygon' && boundary.type !== 'MultiPolygon')) {
    return false;
  }

  if (!boundary.coordinates || boundary.coordinates.length === 0) {
    return false;
  }

  if (boundary.type === 'MultiPolygon') {
    // For MultiPolygon, check the first polygon
    const outerRing = boundary.coordinates[0]?.[0];
    if (!outerRing || outerRing.length < 4) {
      return false;
    }
    const first = outerRing[0];
    const last = outerRing[outerRing.length - 1];
    return first[0] === last[0] && first[1] === last[1];
  }

  // For Polygon
  const outerRing = boundary.coordinates[0];
  
  // Must have at least 4 points (3 unique + 1 closing point)
  if (outerRing.length < 4) {
    return false;
  }

  // First and last points must be the same (closed polygon)
  const first = outerRing[0];
  const last = outerRing[outerRing.length - 1];
  
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return false;
  }

  return true;
};

/**
 * Calculate the area of a polygon in hectares
 * Uses simple approximation for small fields
 * Note: For production, consider using turf.js for accurate geodesic calculations
 */
export const calculatePolygonArea = (boundary: FieldBoundary): number => {
  const coordinates = boundary.type === 'Polygon' 
    ? boundary.coordinates[0] 
    : boundary.coordinates[0]?.[0];
  
  if (!coordinates || coordinates.length < 4) {
    return 0;
  }

  // Simple shoelace formula (works well for small fields)
  let area = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [x1, y1] = coordinates[i];
    const [x2, y2] = coordinates[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  area = Math.abs(area) / 2;

  // Convert to hectares (approximate)
  // 1 degree ≈ 111 km at equator
  // For Sri Lanka (lat ~7°), use correction factor
  const kmPerDegree = 111.32;
  const areaInKm2 = area * kmPerDegree * kmPerDegree * Math.cos((7 * Math.PI) / 180);
  const areaInHectares = areaInKm2 * 100; // 1 km² = 100 hectares

  return areaInHectares;
};


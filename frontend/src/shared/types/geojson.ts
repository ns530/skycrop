// Shared GeoJSON types used across feature APIs

export type GeoJSONPosition = [number, number] | [number, number, number];
export type GeoJSONLinearRing = GeoJSONPosition[];

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: GeoJSONLinearRing[];
}

export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: GeoJSONLinearRing[][];
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: GeoJSONPosition;
}

export type GeoJSONPolygonLike = GeoJSONPolygon | GeoJSONMultiPolygon;

/**
 * Frontend alias for field boundary geometries.
 */
export type FieldGeometry = GeoJSONPolygonLike;
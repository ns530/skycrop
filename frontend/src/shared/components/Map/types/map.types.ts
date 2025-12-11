/**
 * Map-related TypeScript type definitions
 * Used across all map components in SkyCrop
 */

import type { GeoJSONPolygonLike } from "../../../../shared/types/geojson";

export interface MapCenter {
  lat: number;
  lng: number;
}

/**
 * Field boundary - compatible with GeoJSON Polygon format
 * Supports both 2D and 3D coordinates
 */
export type FieldBoundary = GeoJSONPolygonLike;

export interface FieldWithBoundary {
  id: string;
  name: string;
  boundary: FieldBoundary;
  area: number; // in hectares
  healthStatus?: "excellent" | "good" | "fair" | "poor";
  ndvi?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MapBounds {
  northEast: MapCenter;
  southWest: MapCenter;
}

export interface TileProvider {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export interface MapInteractionEvent {
  lat: number;
  lng: number;
  originalEvent: MouseEvent | TouchEvent;
}

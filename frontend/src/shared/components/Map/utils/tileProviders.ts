/**
 * Map tile provider configurations
 * Free satellite and street map tiles for SkyCrop
 */

import type { TileProvider } from "../types/map.types";

/**
 * Esri World Imagery - Free satellite tiles
 * Best for agricultural field visualization
 */
export const SATELLITE_TILES: TileProvider = {
  name: "Esri World Imagery",
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution:
    "&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  maxZoom: 18,
};

/**
 * OpenStreetMap - Free street map tiles
 * Useful for navigation and location context
 */
export const STREET_TILES: TileProvider = {
  name: "OpenStreetMap",
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
};

/**
 * Google Hybrid alternative - Esri with labels
 * Satellite imagery with street labels overlay
 */
export const HYBRID_TILES: TileProvider = {
  name: "Esri Hybrid",
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "&copy; Esri",
  maxZoom: 18,
};

/**
 * Default tile provider for SkyCrop
 * Satellite view is best for agricultural monitoring
 */
export const DEFAULT_TILE_PROVIDER = SATELLITE_TILES;

/**
 * Sri Lanka default map center
 * Polonnaruwa district - major paddy cultivation area
 */
export const SRI_LANKA_CENTER = {
  lat: 7.9403,
  lng: 81.0188,
};

/**
 * Default zoom level for field views
 */
export const DEFAULT_ZOOM = 14;

/**
 * Zoom levels for different use cases
 */
export const ZOOM_LEVELS = {
  COUNTRY: 7, // View entire Sri Lanka
  DISTRICT: 10, // View district level
  FIELD: 14, // View field area
  DETAIL: 16, // Detailed field view
  MAX: 18, // Maximum zoom
} as const;

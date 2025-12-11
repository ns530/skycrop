/**
 * Map components exports
 */

export { BaseMap } from "./BaseMap";
export { FieldBoundaryLayer } from "./FieldBoundaryLayer";
export { MapControls } from "./MapControls";
export { FieldMapView } from "./FieldMapView";

// Hooks
export { useMapCenter } from "./hooks/useMapCenter";

// Types
export type {
  MapCenter,
  FieldBoundary,
  FieldWithBoundary,
  MapBounds,
  TileProvider,
  MapInteractionEvent,
} from "./types/map.types";

// Utils
export {
  calculatePolygonCenter,
  calculateBounds,
  normalizeGeoJson,
  isValidPolygon,
  calculatePolygonArea,
} from "./utils/geoJsonUtils";

export {
  SATELLITE_TILES,
  STREET_TILES,
  HYBRID_TILES,
  DEFAULT_TILE_PROVIDER,
  SRI_LANKA_CENTER,
  DEFAULT_ZOOM,
  ZOOM_LEVELS,
} from "./utils/tileProviders";

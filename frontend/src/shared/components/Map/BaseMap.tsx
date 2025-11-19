/**
 * BaseMap Component
 * Core map component using Leaflet for SkyCrop
 */

import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';
import { DEFAULT_TILE_PROVIDER } from './utils/tileProviders';

interface BaseMapProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
  onMapReady?: (map: LeafletMap) => void;
  children?: React.ReactNode;
  className?: string;
  scrollWheelZoom?: boolean;
}

/**
 * Helper component to access map instance and trigger callback
 */
function MapReadyHandler({ onReady }: { onReady?: (map: LeafletMap) => void }) {
  const map = useMap();

  useEffect(() => {
    if (onReady && map) {
      onReady(map);
    }
  }, [map, onReady]);

  return null;
}

/**
 * BaseMap
 * 
 * Core interactive map component for SkyCrop
 * Displays satellite imagery using free Esri World Imagery tiles
 * 
 * @example
 * ```tsx
 * <BaseMap center={[7.94, 81.02]} zoom={14}>
 *   <FieldBoundaryLayer fields={fields} />
 *   <MapControls />
 * </BaseMap>
 * ```
 */
export const BaseMap: React.FC<BaseMapProps> = ({
  center,
  zoom = 14,
  onMapReady,
  children,
  className = 'h-full w-full',
  scrollWheelZoom = true,
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      zoomControl={false} // We'll add custom controls
      scrollWheelZoom={scrollWheelZoom}
      style={{ height: '100%', width: '100%' }}
    >
      {/* Satellite Tiles */}
      <TileLayer
        url={DEFAULT_TILE_PROVIDER.url}
        attribution={DEFAULT_TILE_PROVIDER.attribution}
        maxZoom={DEFAULT_TILE_PROVIDER.maxZoom}
      />

      {/* Child components (layers, markers, controls, etc.) */}
      {children}

      {/* Map ready callback handler */}
      <MapReadyHandler onReady={onMapReady} />
    </MapContainer>
  );
};

export default BaseMap;


/**
 * Mock for react-leaflet components
 * Used in Jest tests to avoid requiring actual Leaflet library
 */

import React from "react";

// Mock MapContainer
export const MapContainer: React.FC<{
  children?: React.ReactNode;
  center: [number, number];
  zoom?: number;
  className?: string;
  scrollWheelZoom?: boolean;
}> = ({ children, className }) => (
  <div data-testid="map-container" className={className}>
    {children}
  </div>
);

// Mock TileLayer
export const TileLayer: React.FC<{
  url: string;
  attribution?: string;
}> = () => <div data-testid="tile-layer" />;

// Mock GeoJSON
export const GeoJSON: React.FC<{
  data: unknown;
  style?: unknown;
  onEachFeature?: unknown;
}> = () => <div data-testid="geo-json" />;

// Mock useMap hook
export const useMap = () => ({
  setView: jest.fn(),
  flyTo: jest.fn(),
  zoomIn: jest.fn(),
  zoomOut: jest.fn(),
  setZoom: jest.fn(),
  getZoom: () => 15,
  getCenter: () => ({ lat: 7.5, lng: 80.7 }),
});

// Mock Marker
export const Marker: React.FC<{
  position: [number, number];
  children?: React.ReactNode;
}> = ({ children }) => <div data-testid="marker">{children}</div>;

// Mock Popup
export const Popup: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <div data-testid="popup">{children}</div>;

// Mock Circle
export const Circle: React.FC<{
  center: [number, number];
  radius: number;
}> = () => <div data-testid="circle" />;

// Mock Polygon
export const Polygon: React.FC<{
  positions: number[][];
}> = () => <div data-testid="polygon" />;

// Export default
export default {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  Marker,
  Popup,
  Circle,
  Polygon,
};


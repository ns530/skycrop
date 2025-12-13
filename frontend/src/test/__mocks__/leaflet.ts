/**
 * Mock for leaflet library
 * Used in Jest tests to avoid requiring actual Leaflet library
 */

// Mock Leaflet map instance
export const Map = jest.fn().mockImplementation(() => ({
  setView: jest.fn(),
  flyTo: jest.fn(),
  zoomIn: jest.fn(),
  zoomOut: jest.fn(),
  setZoom: jest.fn(),
  getZoom: jest.fn(() => 15),
  getCenter: jest.fn(() => ({ lat: 7.5, lng: 80.7 })),
  on: jest.fn(),
  off: jest.fn(),
  remove: jest.fn(),
  invalidateSize: jest.fn(),
  fitBounds: jest.fn(),
  setMaxBounds: jest.fn(),
}));

// Mock icon
export const Icon = jest.fn().mockImplementation(() => ({}));

// Mock iconDefault (for default marker icon)
export const iconDefault = {
  iconUrl: "",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
};

// Mock latLng
export const latLng = jest.fn((lat: number, lng: number) => ({
  lat,
  lng,
  toString: () => `LatLng(${lat}, ${lng})`,
}));

// Mock latLngBounds
export const latLngBounds = jest.fn(() => ({
  extend: jest.fn(),
  getNorthEast: jest.fn(),
  getSouthWest: jest.fn(),
}));

// Mock control
export const control = {
  zoom: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
  })),
  layers: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
  })),
};

// Mock DomUtil
export const DomUtil = {
  create: jest.fn((tag: string) => document.createElement(tag)),
  addClass: jest.fn(),
  removeClass: jest.fn(),
  hasClass: jest.fn(),
};

// Mock default export
const Leaflet = {
  Map,
  Icon,
  iconDefault,
  latLng,
  latLngBounds,
  control,
  DomUtil,
};

export default Leaflet;


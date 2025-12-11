/**
 * FieldLocationSelector Component
 * Interactive map for selecting field center location
 */

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import React, { useState } from "react";
import { Marker, useMapEvents } from "react-leaflet";

import {
  BaseMap,
  MapControls,
  useMapCenter,
  type MapCenter,
} from "../../../shared/components/Map";
import { Button } from "../../../shared/ui/Button";

// Fix for default marker icons in Leaflet

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface FieldLocationSelectorProps {
  onLocationConfirmed: (location: MapCenter) => void;
  onCancel: () => void;
}

/**
 * Helper component to handle map clicks
 */
function LocationPicker({
  onLocationSelected,
}: {
  onLocationSelected: (loc: MapCenter) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelected({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });
  return null;
}

/**
 * FieldLocationSelector
 *
 * Interactive map for farmers to select their field center
 * Step 1 of the field creation workflow
 *
 * Flow:
 * 1. Farmer taps on map to select field center
 * 2. Marker appears at selected location
 * 3. Coordinates displayed
 * 4. Farmer confirms location
 * 5. Proceeds to AI boundary detection
 */
export const FieldLocationSelector: React.FC<FieldLocationSelectorProps> = ({
  onLocationConfirmed,
  onCancel,
}) => {
  const { center: defaultCenter, getUserLocation } = useMapCenter();
  const [selectedLocation, setSelectedLocation] = useState<MapCenter | null>(
    null,
  );

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationConfirmed(selectedLocation);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Instructions Banner */}
      <header className="bg-brand-blue text-white p-4 shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-1">
              Step 1: Select Field Location
            </h2>
            <p className="text-sm text-white/90">
              Tap the center of your field on the satellite map
            </p>
            <p className="text-xs text-white/70 mt-1">
              💡 Tip: Zoom in for better accuracy
            </p>
          </div>
          <Button
            onClick={onCancel}
            variant="secondary"
            size="sm"
            className="shrink-0"
          >
            Cancel
          </Button>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <BaseMap center={[defaultCenter.lat, defaultCenter.lng]} zoom={14}>
          <LocationPicker onLocationSelected={setSelectedLocation} />
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
          )}
          <MapControls onCenterOnUser={getUserLocation} />
        </BaseMap>

        {/* Selected location indicator */}
        {!selectedLocation && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 pointer-events-none">
            <p className="text-sm text-gray-700 text-center">
              👆 Tap on the map to select your field location
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Panel */}
      {selectedLocation && (
        <footer className="bg-white border-t shadow-lg">
          <div className="p-4 space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-900 mb-1">
                ✓ Location Selected
              </p>
              <p className="text-xs text-gray-600 font-mono">
                {selectedLocation.lat.toFixed(6)},{" "}
                {selectedLocation.lng.toFixed(6)}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirm} className="flex-1" size="lg">
                Confirm & Detect Boundary
              </Button>
              <Button
                onClick={() => setSelectedLocation(null)}
                variant="secondary"
                size="lg"
              >
                Clear
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              After confirmation, our AI will detect your field boundary
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default FieldLocationSelector;

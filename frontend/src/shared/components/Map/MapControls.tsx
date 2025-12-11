/**
 * MapControls Component
 * Provides zoom and location controls for the map
 */

import React from "react";
import { useMap } from "react-leaflet";

import { Button } from "../../ui/Button";

interface MapControlsProps {
  onCenterOnUser?: () => void;
  showLocationButton?: boolean;
}

/**
 * MapControls
 *
 * Custom map control buttons for zoom and location
 * Positioned in the top-right corner by default
 * Mobile-friendly with large touch targets
 *
 * @example
 * ```tsx
 * <BaseMap center={[7.94, 81.02]}>
 *   <MapControls onCenterOnUser={handleCenterOnUser} />
 * </BaseMap>
 * ```
 */
export const MapControls: React.FC<MapControlsProps> = ({
  onCenterOnUser,
  showLocationButton = true,
}) => {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      {/* Zoom Controls */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <Button
          onClick={handleZoomIn}
          variant="secondary"
          size="sm"
          className="rounded-b-none border-b w-10 h-10 p-0 text-xl"
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </Button>
        <Button
          onClick={handleZoomOut}
          variant="secondary"
          size="sm"
          className="rounded-t-none w-10 h-10 p-0 text-xl"
          aria-label="Zoom out"
          title="Zoom out"
        >
          −
        </Button>
      </div>

      {/* Center on User Location */}
      {showLocationButton && onCenterOnUser && (
        <Button
          onClick={onCenterOnUser}
          variant="secondary"
          size="sm"
          className="bg-white shadow-lg w-10 h-10 p-0"
          aria-label="Center on my location"
          title="Center on my location"
        >
          📍
        </Button>
      )}
    </div>
  );
};

export default MapControls;

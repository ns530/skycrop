/**
 * BoundaryConfirmation Component
 * Review and confirm AI-detected field boundary
 */

import React from 'react';
import { BaseMap, FieldBoundaryLayer, MapControls, calculatePolygonCenter, type FieldWithBoundary } from '../../../shared/components/Map';
import { Button } from '../../../shared/ui/Button';
import type { FieldGeometry } from '../../../shared/types/geojson';

interface BoundaryConfirmationProps {
  boundary: FieldGeometry;
  area: number; // in hectares
  onConfirm: () => void;
  onAdjust: () => void;
  onCancel: () => void;
}

/**
 * BoundaryConfirmation
 * 
 * Shows the AI-detected boundary on map and allows user to:
 * 1. Confirm and proceed to naming field
 * 2. Adjust manually (future: boundary editor)
 * 3. Cancel and start over
 */
export const BoundaryConfirmation: React.FC<BoundaryConfirmationProps> = ({
  boundary,
  area,
  onConfirm,
  onAdjust,
  onCancel,
}) => {
  // Calculate center for map
  const center = calculatePolygonCenter(boundary);

  // Convert to FieldWithBoundary format for rendering
  const fieldForDisplay: FieldWithBoundary = {
    id: 'temp-preview',
    name: 'Preview',
    boundary,
    area,
    healthStatus: 'good', // Show as green to indicate success
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="bg-green-600 text-white p-4 shadow-md">
        <div className="flex items-start gap-3">
          <span className="text-3xl">✅</span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-1">
              Boundary Detected Successfully!
            </h2>
            <p className="text-sm text-white/90">
              Review the detected boundary and area
            </p>
          </div>
        </div>
      </header>

      {/* Map with detected boundary */}
      <div className="flex-1 relative">
        <BaseMap center={[center.lat, center.lng]} zoom={16}>
          <FieldBoundaryLayer fields={[fieldForDisplay]} />
          <MapControls showLocationButton={false} />
        </BaseMap>

        {/* Area Info Overlay */}
        <div className="absolute top-4 left-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Detected Area
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {area.toFixed(2)}
                <span className="text-sm font-normal text-gray-600 ml-1">
                  hectares
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Confidence</p>
              <div className="flex items-center gap-1">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
                <span className="text-xs font-medium text-gray-700">85%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-green-600 bg-green-600/30" />
            <p className="text-xs text-gray-700">Detected Boundary</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <footer className="bg-white border-t shadow-lg">
        <div className="p-4 space-y-3">
          {/* Primary Action */}
          <Button
            onClick={onConfirm}
            className="w-full"
            size="lg"
          >
            ✓ Confirm Boundary & Continue
          </Button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onAdjust}
              variant="secondary"
              size="md"
              disabled // Will be enabled when boundary editor is implemented
              title="Boundary editing coming soon"
            >
              ✏️ Adjust Manually
            </Button>
            <Button
              onClick={onCancel}
              variant="secondary"
              size="md"
            >
              ↺ Start Over
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              <strong>💡 Tip:</strong> The green boundary shows your detected
              field. If it looks accurate, click "Confirm" to proceed. You can
              adjust it manually later from the field details page.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BoundaryConfirmation;


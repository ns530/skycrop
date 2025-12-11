/**
 * FieldMapView Component
 * Complete map view for field visualization with health overlays
 */

import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { useFieldDetail } from '../../../features/fields/hooks/useFields';
import { ErrorState } from '../../ui/ErrorState';
import { LoadingState } from '../../ui/LoadingState';

import { BaseMap } from './BaseMap';
import { FieldBoundaryLayer } from './FieldBoundaryLayer';
import { useMapCenter } from './hooks/useMapCenter';
import { MapControls } from './MapControls';
import type { FieldWithBoundary } from './types/map.types';
import { calculatePolygonCenter } from './utils/geoJsonUtils';


interface FieldMapViewProps {
  /** Optional: Override field ID from route params */
  fieldId?: string;
  /** Optional: Show health data overlay */
  showHealthOverlay?: boolean;
  /** Optional: Additional fields to display */
  additionalFields?: FieldWithBoundary[];
  /** Optional: Callback when field is clicked */
  onFieldClick?: (fieldId: string) => void;
}

/**
 * FieldMapView
 * 
 * Map view component for displaying field boundaries and health data
 * Automatically centers on the current field and displays boundaries
 * 
 * @example
 * ```tsx
 * <FieldMapView fieldId="field-123" showHealthOverlay />
 * ```
 */
export const FieldMapView: React.FC<FieldMapViewProps> = ({
  fieldId: propsFieldId,
  showHealthOverlay = true,
  additionalFields = [],
  onFieldClick,
}) => {
  const params = useParams<{ fieldId: string }>();
  const fieldId = propsFieldId ?? params.fieldId;

  const { center: defaultCenter, getUserLocation } = useMapCenter();

  // Fetch field details to get boundary
  const {
    data: field,
    isLoading,
    isError,
    error,
    refetch,
  } = useFieldDetail(fieldId ?? '');

  // Calculate map center from field geometry
  const mapCenter = useMemo(() => {
    if (field?.geometry) {
      const center = calculatePolygonCenter(field.geometry);
      return [center.lat, center.lng] as [number, number];
    }
    return [defaultCenter.lat, defaultCenter.lng] as [number, number];
  }, [field, defaultCenter]);

  // Convert field to FieldWithBoundary format
  const fieldsToDisplay = useMemo(() => {
    const fields: FieldWithBoundary[] = [];
    
    if (field?.geometry) {
      fields.push({
        id: field.id,
        name: field.name,
        boundary: field.geometry,
        area: field.areaHa,
        healthStatus: field.latestHealthStatus,
      });
    }

    // Add any additional fields
    fields.push(...additionalFields);

    return fields;
  }, [field, additionalFields]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900">
        <LoadingState message="Loading map data..." />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900 p-6">
        <ErrorState
          title="Unable to load map"
          message={error?.message ?? 'Failed to load field data for map display'}
          onRetry={refetch}
        />
      </div>
    );
  }

  // No field selected
  if (!field) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-white/70 max-w-md px-4">
          <div className="mb-4 text-4xl">🗺️</div>
          <p className="text-sm">
            No field selected. Select a field to view its location on the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <BaseMap center={mapCenter} zoom={15}>
        <FieldBoundaryLayer
          fields={fieldsToDisplay}
          selectedFieldId={fieldId}
          onFieldClick={onFieldClick}
        />
        <MapControls onCenterOnUser={getUserLocation} />
      </BaseMap>

      {/* Field info overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 max-w-xs">
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
          Current Field
        </p>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          {field.name}
        </h3>
        <p className="text-xs text-gray-600">
          {field.areaHa.toFixed(2)} hectares
        </p>
        {field.centroidLatLon && (
          <p className="text-[10px] text-gray-500 mt-1 font-mono">
            {field.centroidLatLon.lat.toFixed(5)}, {field.centroidLatLon.lon.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
};

export default FieldMapView;


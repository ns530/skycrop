/**
 * FieldBoundaryLayer Component
 * Renders field boundaries as GeoJSON polygons on the map
 */

import type { PathOptions } from 'leaflet';
import React from 'react';
import { GeoJSON } from 'react-leaflet';

import type { FieldWithBoundary } from './types/map.types';

interface FieldBoundaryLayerProps {
  fields: FieldWithBoundary[];
  selectedFieldId?: string;
  onFieldClick?: (fieldId: string) => void;
  showLabels?: boolean;
}

/**
 * Health status to color mapping
 * Matches SkyCrop design system colors
 */
const getFieldColor = (field: FieldWithBoundary): string => {
  if (!field.healthStatus) {
    return '#3B82F6'; // Blue (default/no data)
  }

  const colorMap: Record<string, string> = {
    excellent: '#059669', // Dark Green (status-excellent)
    good: '#10B981',      // Green (status-good)
    fair: '#F59E0B',      // Yellow (status-fair)
    poor: '#EF4444',      // Red (status-poor)
  };

  return colorMap[field.healthStatus] || '#3B82F6';
};

/**
 * FieldBoundaryLayer
 * 
 * Renders field boundaries as interactive polygons
 * Colors based on health status (excellent/good/fair/poor)
 * Supports selection highlighting and click events
 * 
 * @example
 * ```tsx
 * <BaseMap center={[7.94, 81.02]}>
 *   <FieldBoundaryLayer
 *     fields={userFields}
 *     selectedFieldId={currentFieldId}
 *     onFieldClick={handleFieldClick}
 *   />
 * </BaseMap>
 * ```
 */
export const FieldBoundaryLayer: React.FC<FieldBoundaryLayerProps> = ({
  fields,
  selectedFieldId,
  onFieldClick,
}) => {
  if (!fields || fields.length === 0) {
    return null;
  }

  return (
    <>
      {fields.map((field) => {
        const isSelected = selectedFieldId === field.id;
        const fieldColor = getFieldColor(field);

        // Style for the polygon
        const style: PathOptions = {
          color: fieldColor,
          weight: isSelected ? 3 : 2,
          fillOpacity: isSelected ? 0.4 : 0.3,
          fillColor: fieldColor,
        };

        // Hover style
        const hoverStyle: PathOptions = {
          weight: 3,
          fillOpacity: 0.5,
        };

        return (
          <GeoJSON
            key={field.id}
            data={field.boundary}
            style={style}
            eventHandlers={{
              click: () => {
                if (onFieldClick) {
                  onFieldClick(field.id);
                }
              },
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle(hoverStyle);
              },
              mouseout: (e) => {
                const layer = e.target;
                layer.setStyle(style);
              },
            }}
          />
        );
      })}
    </>
  );
};

export default FieldBoundaryLayer;


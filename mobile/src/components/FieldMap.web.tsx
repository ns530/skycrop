/**
 * FieldMap Component - Web Version
 * 
 * Web fallback that shows a placeholder since react-native-maps doesn't work on web
 */

import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as GeoJSON from 'geojson';

interface FieldMapProps {
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  boundary?: GeoJSON.Polygon;
  center?: { latitude: number; longitude: number };
  editable?: boolean;
  onBoundaryChange?: (boundary: GeoJSON.Polygon) => void;
  height?: number;
}

export const FieldMap: React.FC<FieldMapProps> = ({
  center,
  height = 300,
}) => {
  return (
    <View style={[styles.container, styles.webPlaceholder, { height }]}>
      <Icon name="map" size={48} color="#9ca3af" />
      <Text style={styles.webPlaceholderText}>Map view is only available on mobile devices</Text>
      {center && (
        <Text style={styles.webCoordinates}>
          Location: {center.latitude.toFixed(6)}°, {center.longitude.toFixed(6)}°
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  webPlaceholder: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  webPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  webCoordinates: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
});


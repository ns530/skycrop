/**
 * FieldMap Component - Native Version (iOS/Android)
 * 
 * Native map component using react-native-maps.
 * Falls back to a placeholder if react-native-maps is not available (e.g., in Expo Go).
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons as Icon } from '@expo/vector-icons';
import { config } from '../config/env';
import type { Polygon as GeoPolygon, MultiPolygon as GeoMultiPolygon, Position } from 'geojson';

// Safely try to import react-native-maps (may not be available in Expo Go)
let RNMapView: any = null;
let RNMarker: any = null;
let RNPolygon: any = null;
let RN_PROVIDER_GOOGLE: any = null;
let mapsAvailable = false;

try {
  const maps = require('react-native-maps');
  RNMapView = maps.default || maps.MapView;
  RNMarker = maps.Marker;
  RNPolygon = maps.Polygon;
  RN_PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  mapsAvailable = !!RNMapView;
} catch (e) {
  console.warn('[FieldMap] react-native-maps not available, using placeholder');
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface FieldMapProps {
  initialRegion?: MapRegion;
  boundary?: GeoPolygon | GeoMultiPolygon;
  center?: { latitude: number; longitude: number };
  editable?: boolean;
  onBoundaryChange?: (boundary: GeoPolygon) => void;
  height?: number;
}

export const FieldMap: React.FC<FieldMapProps> = ({
  initialRegion,
  boundary,
  center,
  editable = false,
  onBoundaryChange,
  height = 300,
}) => {
  // All hooks MUST be called before any conditional returns (Rules of Hooks)
  const [region, setRegion] = useState<MapRegion>(
    initialRegion || config.mapInitialRegion
  );
  const [currentBoundary, setCurrentBoundary] = useState<GeoPolygon | GeoMultiPolygon | undefined>(boundary);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | undefined>(center);

  useEffect(() => {
    if (boundary) {
      setCurrentBoundary(boundary);
    }
  }, [boundary]);

  useEffect(() => {
    if (center) {
      setMapCenter(center);
      setRegion({
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [center]);

  // ---- Placeholder when maps are not available ----
  if (!mapsAvailable) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.placeholderContent}>
          <Icon name="map-outline" size={48} color="#9ca3af" />
          <Text style={styles.placeholderTitle}>Map View</Text>
          {center ? (
            <Text style={styles.placeholderText}>
              📍 {center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}
            </Text>
          ) : (
            <Text style={styles.placeholderText}>
              Map requires a development build
            </Text>
          )}
          {editable && (
            <Text style={styles.placeholderHint}>
              Enter coordinates manually below
            </Text>
          )}
        </View>
      </View>
    );
  }

  // ---- Map handlers ----
  const handleMapPress = (event: any) => {
    if (!editable || !onBoundaryChange) return;

    const { latitude, longitude } = event.nativeEvent.coordinate;

    const newBoundary: GeoPolygon = {
      type: 'Polygon',
      coordinates: [[
        [longitude - 0.001, latitude - 0.001],
        [longitude + 0.001, latitude - 0.001],
        [longitude + 0.001, latitude + 0.001],
        [longitude - 0.001, latitude + 0.001],
        [longitude - 0.001, latitude - 0.001],
      ]],
    };

    setCurrentBoundary(newBoundary);
    onBoundaryChange(newBoundary);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;

      setMapCenter({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.warn('Location unavailable, user can tap on map:', error);
    }
  };

  // Convert GeoJSON coordinates to map coordinates
  const getPolygonCoordinates = (polygon: GeoPolygon | GeoMultiPolygon | undefined) => {
    if (!polygon) return [];

    try {
      let outerRing: Position[] = [];

      if (polygon.type === 'Polygon') {
        if (!polygon.coordinates || polygon.coordinates.length === 0) return [];
        outerRing = polygon.coordinates[0];
      } else if (polygon.type === 'MultiPolygon') {
        if (!polygon.coordinates || polygon.coordinates.length === 0) return [];
        const firstPolygon = polygon.coordinates[0];
        if (!firstPolygon || firstPolygon.length === 0) return [];
        outerRing = firstPolygon[0];
      }

      if (!Array.isArray(outerRing) || outerRing.length === 0) return [];

      return outerRing
        .filter((coord) => Array.isArray(coord) && coord.length >= 2)
        .map((coord) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
    } catch (error) {
      console.error('[FieldMap] Error converting polygon coordinates:', error);
      return [];
    }
  };

  // ---- Render actual map ----
  const polygonCoords = getPolygonCoordinates(currentBoundary);

  return (
    <View style={[styles.container, { height }]}>
      <RNMapView
        provider={RN_PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        mapType="satellite"
      >
        {mapCenter && (
          <RNMarker
            coordinate={mapCenter}
            title="Field Center"
            pinColor="#16A34A"
          />
        )}

        {polygonCoords.length >= 3 && (
          <RNPolygon
            coordinates={polygonCoords}
            fillColor="rgba(22, 163, 74, 0.3)"
            strokeColor="#16A34A"
            strokeWidth={2}
          />
        )}
      </RNMapView>

      {editable && (
        <TouchableOpacity
          style={styles.locationButton}
          onPress={getCurrentLocation}
        >
          <Icon name="locate" size={24} color="#16A34A" />
        </TouchableOpacity>
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
  map: {
    flex: 1,
  },
  locationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
  },
  placeholderText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  placeholderHint: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

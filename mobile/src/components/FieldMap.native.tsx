/**
 * FieldMap Component - Native Version (iOS/Android)
 * 
 * Native map component using react-native-maps
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polygon, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons as Icon } from '@expo/vector-icons';
import { config } from '../config/env';
import * as GeoJSON from 'geojson';

interface FieldMapProps {
  initialRegion?: Region;
  boundary?: GeoJSON.Polygon;
  center?: { latitude: number; longitude: number };
  editable?: boolean;
  onBoundaryChange?: (boundary: GeoJSON.Polygon) => void;
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
  const [region, setRegion] = useState<Region>(
    initialRegion || config.mapInitialRegion
  );
  const [currentBoundary, setCurrentBoundary] = useState<GeoJSON.Polygon | undefined>(boundary);
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

  const handleMapPress = (event: any) => {
    if (!editable || !onBoundaryChange) return;

    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    // Create a simple square boundary around the tapped point
    const newBoundary: GeoJSON.Polygon = {
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
      // Silently fail - user can tap on map instead
      console.warn('Location unavailable, user can tap on map:', error);
    }
  };

  // Convert GeoJSON coordinates to map coordinates
  const getPolygonCoordinates = (polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined) => {
    if (!polygon) {
      return [];
    }
    try {
      // Handle Polygon
      if (polygon.type === 'Polygon' && 'coordinates' in polygon) {
        const polygonData = polygon as GeoJSON.Polygon;
        if (!polygonData.coordinates || !Array.isArray(polygonData.coordinates) || polygonData.coordinates.length === 0) {
          console.warn('[FieldMap] Invalid Polygon coordinates');
          return [];
        }
        
        const outerRing = polygonData.coordinates[0];
        if (!Array.isArray(outerRing) || outerRing.length === 0) {
          console.warn('[FieldMap] Invalid outer ring');
          return [];
        }

        return outerRing.map((coord) => {
          // Handle both [lng, lat] and [lng, lat, elevation] formats
          if (!Array.isArray(coord) || coord.length < 2) {
            console.warn('[FieldMap] Invalid coordinate:', coord);
            return { latitude: 0, longitude: 0 };
          }
          
          const [lng, lat] = coord;
          // Validate coordinates are numbers
          if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
            console.warn('[FieldMap] Invalid coordinate values:', coord);
            return { latitude: 0, longitude: 0 };
          }
          
          return {
            latitude: lat,
            longitude: lng,
          };
        });
      }
      
      // Handle MultiPolygon - take first polygon
      if (polygon.type === 'MultiPolygon' && 'coordinates' in polygon) {
        const multiPolygonData = polygon as GeoJSON.MultiPolygon;
        if (!multiPolygonData.coordinates || !Array.isArray(multiPolygonData.coordinates) || multiPolygonData.coordinates.length === 0) {
          console.warn('[FieldMap] Invalid MultiPolygon coordinates');
          return [];
        }
        
        const firstPolygon = multiPolygonData.coordinates[0];
        if (!Array.isArray(firstPolygon) || firstPolygon.length === 0) {
          console.warn('[FieldMap] Invalid first polygon in MultiPolygon');
          return [];
        }
        
        const outerRing = firstPolygon[0];
        if (!Array.isArray(outerRing) || outerRing.length === 0) {
          console.warn('[FieldMap] Invalid outer ring in MultiPolygon');
          return [];
        }

        return outerRing.map((coord) => {
          if (!Array.isArray(coord) || coord.length < 2) {
            console.warn('[FieldMap] Invalid coordinate:', coord);
            return { latitude: 0, longitude: 0 };
          }
          
          const [lng, lat] = coord;
          if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
            console.warn('[FieldMap] Invalid coordinate values:', coord);
            return { latitude: 0, longitude: 0 };
          }
          
          return {
            latitude: lat,
            longitude: lng,
          };
        });
      }
      
      // Fallback for unsupported types
      const geometryType = (polygon as any).type || 'unknown';
      console.warn('[FieldMap] Unsupported geometry type:', geometryType);
      return [];
    } catch (error) {
      console.error('[FieldMap] Error converting polygon coordinates:', error);
      return [];
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        mapType="satellite"
      >
        {mapCenter && (
          <Marker
            coordinate={mapCenter}
            title="Field Center"
            pinColor="#16A34A"
          />
        )}
        
        {currentBoundary && (() => {
          const polygonCoords = getPolygonCoordinates(currentBoundary);
          // Only render if we have valid coordinates
          if (polygonCoords.length >= 3) {
            return (
              <Polygon
                coordinates={polygonCoords}
                fillColor="rgba(22, 163, 74, 0.3)"
                strokeColor="#16A34A"
                strokeWidth={2}
              />
            );
          }
          return null;
        })()}
      </MapView>

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
});


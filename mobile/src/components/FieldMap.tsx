/**
 * FieldMap Component
 * 
 * Reusable map component for displaying and drawing field boundaries
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
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
        timeout: 10000,
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
  const getPolygonCoordinates = (polygon: GeoJSON.Polygon) => {
    return polygon.coordinates[0].map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));
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
        
        {currentBoundary && (
          <Polygon
            coordinates={getPolygonCoordinates(currentBoundary)}
            fillColor="rgba(22, 163, 74, 0.3)"
            strokeColor="#16A34A"
            strokeWidth={2}
          />
        )}
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


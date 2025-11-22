import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { Marker, Polygon, LatLng, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation } from '@react-navigation/native';
import { useCreateField } from '../../hooks/useFields';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface FieldFormData {
  name: string;
  location: string;
  area: string;
  crop_type: string;
  planting_date: string;
}

export const CreateFieldScreen: React.FC = () => {
  const navigation = useNavigation();
  const createFieldMutation = useCreateField();
  const mapRef = useRef<MapView>(null);

  // Form state
  const [formData, setFormData] = useState<FieldFormData>({
    name: '',
    location: '',
    area: '',
    crop_type: '',
    planting_date: new Date().toISOString().split('T')[0],
  });

  // Map state
  const [mapRegion, setMapRegion] = useState({
    latitude: 31.5204, // Default: Lahore, Pakistan (adjust to your region)
    longitude: 74.3587,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
  const [boundaryPoints, setBoundaryPoints] = useState<LatLng[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Get user's current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setMapRegion(newRegion);
        setSelectedLocation({ latitude, longitude });
        setIsLoadingLocation(false);
      },
      (error) => {
        console.warn('Location error:', error);
        Alert.alert('Location Error', 'Could not get your location. Using default location.');
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleMapPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    
    if (isDrawingMode) {
      // Add point to boundary
      setBoundaryPoints([...boundaryPoints, coordinate]);
    } else {
      // Set field center location
      setSelectedLocation(coordinate);
      updateLocationName(coordinate.latitude, coordinate.longitude);
    }
  };

  const updateLocationName = (latitude: number, longitude: number) => {
    // Simple location name based on coordinates
    // In production, you'd use Geocoding API
    const locationName = `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
    setFormData({ ...formData, location: locationName });
  };

  const toggleDrawingMode = () => {
    if (isDrawingMode && boundaryPoints.length > 0) {
      // Calculate approximate area (simple calculation)
      const area = calculatePolygonArea(boundaryPoints);
      setFormData({ ...formData, area: area.toFixed(2) });
    }
    setIsDrawingMode(!isDrawingMode);
  };

  const clearBoundary = () => {
    setBoundaryPoints([]);
    setFormData({ ...formData, area: '' });
  };

  const calculatePolygonArea = (points: LatLng[]): number => {
    if (points.length < 3) return 0;

    // Haversine formula for approximate area calculation
    // This is a simplified version - for production, use a proper geospatial library
    let area = 0;
    const earthRadius = 6371000; // meters

    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const lat1 = (points[i].latitude * Math.PI) / 180;
      const lat2 = (points[j].latitude * Math.PI) / 180;
      const lon1 = (points[i].longitude * Math.PI) / 180;
      const lon2 = (points[j].longitude * Math.PI) / 180;
      
      area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs((area * earthRadius * earthRadius) / 2);
    return area / 10000; // Convert to hectares
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter a field name');
      return false;
    }
    if (!selectedLocation) {
      Alert.alert('Validation Error', 'Please select a location on the map');
      return false;
    }
    if (!formData.crop_type.trim()) {
      Alert.alert('Validation Error', 'Please enter a crop type');
      return false;
    }
    if (!formData.area || parseFloat(formData.area) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid area or draw boundaries');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Determine boundary: use drawn points if available, otherwise create a simple square
    let boundary: { type: 'Polygon'; coordinates: number[][][] };
    
    if (boundaryPoints.length >= 3) {
      // Use drawn boundary
      const coordinates = boundaryPoints.map(p => [p.longitude, p.latitude]);
      // Close the polygon by adding the first point at the end
      coordinates.push(coordinates[0]);
      boundary = {
        type: 'Polygon',
        coordinates: [coordinates],
      };
    } else if (selectedLocation) {
      // Create a simple square boundary around the selected location
      // Using approximate 100m offset (0.001 degrees ≈ 111m)
      const offset = 0.001 * Math.sqrt(parseFloat(formData.area) || 1);
      const { latitude, longitude } = selectedLocation;
      boundary = {
        type: 'Polygon',
        coordinates: [
          [
            [longitude - offset, latitude - offset],
            [longitude + offset, latitude - offset],
            [longitude + offset, latitude + offset],
            [longitude - offset, latitude + offset],
            [longitude - offset, latitude - offset], // Close the polygon
          ],
        ],
      };
    } else {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    const fieldData = {
      name: formData.name,
      boundary,
    };

    createFieldMutation.mutate(fieldData, {
      onSuccess: () => {
        Alert.alert('Success', 'Field created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to create field');
      },
    });
  };

  if (isLoadingLocation) {
    return <LoadingSpinner message="Getting your location..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Map Section */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            onPress={handleMapPress}
            mapType="hybrid"
          >
            {/* Selected Location Marker */}
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Field Location"
                description={formData.name || 'New Field'}
                pinColor="#10b981"
              />
            )}

            {/* Boundary Polygon */}
            {boundaryPoints.length > 2 && (
              <Polygon
                coordinates={boundaryPoints}
                fillColor="rgba(16, 185, 129, 0.3)"
                strokeColor="#10b981"
                strokeWidth={2}
              />
            )}

            {/* Boundary Points */}
            {boundaryPoints.map((point, index) => (
              <Marker
                key={index}
                coordinate={point}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.boundaryMarker}>
                  <Text style={styles.boundaryMarkerText}>{index + 1}</Text>
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Map Controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.controlButton} onPress={getCurrentLocation}>
              <Text style={styles.controlButtonText}>📍 My Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, isDrawingMode && styles.controlButtonActive]}
              onPress={toggleDrawingMode}
            >
              <Text style={styles.controlButtonText}>
                {isDrawingMode ? '✓ Done Drawing' : '✏️ Draw Boundary'}
              </Text>
            </TouchableOpacity>
            {boundaryPoints.length > 0 && (
              <TouchableOpacity style={[styles.controlButton, styles.clearButton]} onPress={clearBoundary}>
                <Text style={styles.controlButtonText}>🗑️ Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Drawing Instructions */}
          {isDrawingMode && (
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsText}>
                👆 Tap on the map to add boundary points ({boundaryPoints.length} points)
              </Text>
            </View>
          )}
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Field Information</Text>

          {/* Field Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Field Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., North Field, Field A"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          {/* Location (Auto-filled from map) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={[styles.input, styles.inputReadonly]}
              placeholder="Select location on map"
              value={formData.location}
              editable={false}
            />
          </View>

          {/* Area */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Area (hectares) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 5.5"
              value={formData.area}
              onChangeText={(text) => setFormData({ ...formData, area: text })}
              keyboardType="decimal-pad"
            />
            {boundaryPoints.length > 0 && (
              <Text style={styles.helperText}>
                Calculated from boundary: ~{formData.area} ha
              </Text>
            )}
          </View>

          {/* Crop Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Crop Type *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Wheat, Rice, Corn"
              value={formData.crop_type}
              onChangeText={(text) => setFormData({ ...formData, crop_type: text })}
            />
          </View>

          {/* Planting Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Planting Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.planting_date}
              onChangeText={(text) => setFormData({ ...formData, planting_date: text })}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, createFieldMutation.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={createFieldMutation.isPending}
          >
            <Text style={styles.submitButtonText}>
              {createFieldMutation.isPending ? 'Creating...' : 'Create Field'}
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  mapContainer: {
    height: 400,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  controlButtonActive: {
    backgroundColor: '#10b981',
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  boundaryMarker: {
    backgroundColor: '#10b981',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  boundaryMarkerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  instructionsBox: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
    padding: 12,
    borderRadius: 8,
  },
  instructionsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  inputReadonly: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
});

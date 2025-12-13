/**
 * CreateFieldScreen - With Map Integration
 * 
 * Field creation with interactive map for boundary drawing
 */

import React, { useState } from 'react';
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
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useCreateField } from '../../hooks/useFields';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { FieldMap } from '../../components/FieldMap';
import * as GeoJSON from 'geojson';

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

  // Form state
  const [formData, setFormData] = useState<FieldFormData>({
    name: '',
    location: '',
    area: '',
    crop_type: '',
    planting_date: new Date().toISOString().split('T')[0],
  });

  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [fieldBoundary, setFieldBoundary] = useState<GeoJSON.Polygon | undefined>();
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | undefined>();

  // Get current location using Expo Location
  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied', 
          'Location permission is required. Please enable location services in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Try to get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = location.coords;
      
      setCurrentLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      updateFormData('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      setMapCenter({ latitude, longitude });
      
      // Create default boundary around current location
      const defaultBoundary: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [[
          [longitude - 0.001, latitude - 0.001],
          [longitude + 0.001, latitude - 0.001],
          [longitude + 0.001, latitude + 0.001],
          [longitude - 0.001, latitude + 0.001],
          [longitude - 0.001, latitude - 0.001],
        ]],
      };
      setFieldBoundary(defaultBoundary);
      
      Alert.alert('Success', 'Current location captured!');
    } catch (error: any) {
      console.error('Error getting location:', error);
      
      // Provide helpful error messages
      let errorMessage = 'Failed to get current location.';
      if (error.message?.includes('unavailable')) {
        errorMessage = 'Location services are unavailable. Please:\n\n1. Enable location services on your device\n2. Make sure you are outdoors or have GPS signal\n3. Try tapping on the map to set location manually';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Location request timed out. Please try again or tap on the map to set location manually.';
      }
      
      Alert.alert(
        'Location Error',
        errorMessage,
        [
          { text: 'Use Map Instead', style: 'cancel' },
          { text: 'Try Again', onPress: getCurrentLocation },
        ]
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const updateFormData = (key: keyof FieldFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter field name');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Validation Error', 'Please enter or capture field location');
      return false;
    }
    if (!formData.area || parseFloat(formData.area) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid area');
      return false;
    }
    if (!formData.crop_type.trim()) {
      Alert.alert('Validation Error', 'Please enter crop type');
      return false;
    }
    if (!formData.planting_date) {
      Alert.alert('Validation Error', 'Please enter planting date');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Ensure we have a boundary from map or create one
      let finalBoundary: GeoJSON.Polygon;
      
      if (fieldBoundary) {
        finalBoundary = fieldBoundary;
      } else if (formData.location.trim()) {
        // Convert location string to coordinates
        const [lat, lng] = formData.location.split(',').map(coord => parseFloat(coord.trim()));
        
        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          Alert.alert('Invalid Location', 'Please enter valid coordinates in format: latitude, longitude');
          return;
        }
        
        // Create boundary from coordinates
        finalBoundary = {
          type: 'Polygon',
          coordinates: [[
            [lng - 0.001, lat - 0.001],
            [lng + 0.001, lat - 0.001],
            [lng + 0.001, lat + 0.001],
            [lng - 0.001, lat + 0.001],
            [lng - 0.001, lat - 0.001],
          ]],
        };
      } else {
        Alert.alert('Validation Error', 'Please set field location on the map or enter coordinates');
        return;
      }

      // Validate boundary has at least 4 points (closed polygon)
      if (!finalBoundary.coordinates[0] || finalBoundary.coordinates[0].length < 4) {
        Alert.alert('Invalid Boundary', 'Field boundary must have at least 4 points');
        return;
      }

      await createFieldMutation.mutateAsync({
        name: formData.name,
        boundary: finalBoundary,
      });

      Alert.alert('Success', 'Field created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating field:', error);
      Alert.alert('Error', 'Failed to create field. Please try again.');
    }
  };

  if (createFieldMutation.isPending) {
    return <LoadingSpinner message="Creating field..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Field Information</Text>
          
          {/* Map for Field Boundary */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Field Location & Boundary</Text>
            <Text style={styles.helperText}>
              Tap on the map to set field center, or use GPS button
            </Text>
            <FieldMap
              center={mapCenter}
              boundary={fieldBoundary}
              editable={true}
              onBoundaryChange={(boundary: GeoJSON.Polygon) => {
                setFieldBoundary(boundary);
                // Update location from boundary center
                const centerCoords = boundary.coordinates[0];
                const centerLng = centerCoords.reduce((sum: number, coord: GeoJSON.Position) => sum + coord[0], 0) / centerCoords.length;
                const centerLat = centerCoords.reduce((sum: number, coord: GeoJSON.Position) => sum + coord[1], 0) / centerCoords.length;
                setMapCenter({ latitude: centerLat, longitude: centerLng });
                updateFormData('location', `${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`);
              }}
              height={250}
            />
          </View>

          {/* Field Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Field Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              placeholder="e.g., North Field, Plot 12"
              placeholderTextColor="#999"
            />
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location (Coordinates) *</Text>
            <View style={styles.locationInputRow}>
              <TextInput
                style={[styles.input, styles.locationInput]}
                value={formData.location}
                onChangeText={(value) => updateFormData('location', value)}
                placeholder="Enter coordinates or use GPS"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={loadingLocation}
              >
                <Text style={styles.locationButtonText}>
                  {loadingLocation ? '📍...' : '📍 GPS'}
                </Text>
              </TouchableOpacity>
            </View>
            {currentLocation && (
              <Text style={styles.helperText}>Current: {currentLocation}</Text>
            )}
          </View>

          {/* Area */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Area (hectares) *</Text>
            <TextInput
              style={styles.input}
              value={formData.area}
              onChangeText={(value) => updateFormData('area', value)}
              placeholder="e.g., 2.5"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>

          {/* Crop Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Crop Type *</Text>
            <TextInput
              style={styles.input}
              value={formData.crop_type}
              onChangeText={(value) => updateFormData('crop_type', value)}
              placeholder="e.g., Rice, Wheat"
              placeholderTextColor="#999"
            />
          </View>

          {/* Planting Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Planting Date *</Text>
            <TextInput
              style={styles.input}
              value={formData.planting_date}
              onChangeText={(value) => updateFormData('planting_date', value)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
            <Text style={styles.helperText}>Format: YYYY-MM-DD</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={createFieldMutation.isPending}
          >
            <Text style={styles.submitButtonText}>Create Field</Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
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
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFF',
  },
  locationInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  locationInput: {
    flex: 1,
  },
  locationButton: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  locationButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

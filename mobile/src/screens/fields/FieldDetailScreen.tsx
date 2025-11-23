/**
 * FieldDetailScreen - Detailed view of a single field
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons as Icon } from '@expo/vector-icons';

import { useFieldDetail, useDeleteField } from '../../hooks/useFields';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FieldMap } from '../../components/FieldMap';
import type { FieldsStackParamList } from '../../navigation/FieldsNavigator';

type RouteProps = RouteProp<FieldsStackParamList, 'FieldDetail'>;
type NavigationProp = StackNavigationProp<FieldsStackParamList, 'FieldDetail'>;

const FieldDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { fieldId } = route.params;

  const { data: field, isLoading, isError, error, refetch } = useFieldDetail(fieldId);
  const deleteFieldMutation = useDeleteField();

  const handleHealthPress = () => {
    navigation.navigate('FieldHealth', { fieldId });
  };

  const handleRecommendationsPress = () => {
    navigation.navigate('FieldRecommendations', { fieldId });
  };

  const handleYieldPress = () => {
    navigation.navigate('FieldYield', { fieldId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Field',
      `Are you sure you want to delete "${field?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFieldMutation.mutateAsync(fieldId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete field. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading field details..." />;
  }

  if (isError || !field) {
    return (
      <ErrorMessage
        message={error?.message || 'Failed to load field details'}
        onRetry={() => refetch()}
      />
    );
  }

  const createdDate = new Date(field.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Field Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Icon name="leaf" size={32} color="#2563eb" />
            <View style={styles.headerText}>
              <Text style={styles.name}>{field.name}</Text>
              <Text style={styles.created}>Created {createdDate}</Text>
            </View>
          </View>
        </View>

        {/* Field Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Field Information</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Icon name="resize" size={24} color="#6b7280" />
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Area</Text>
                <Text style={styles.statValue}>{field.area_ha.toFixed(2)} ha</Text>
                <Text style={styles.statSubtext}>
                  ({field.area_sqm.toLocaleString()} m²)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Icon name="location" size={24} color="#6b7280" />
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Center Point</Text>
                <Text style={styles.statValue}>
                  {field.center.coordinates[1].toFixed(6)}°, {field.center.coordinates[0].toFixed(6)}°
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Icon name="information-circle" size={24} color="#6b7280" />
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Status</Text>
                <Text style={[styles.statValue, styles.statusActive]}>
                  {field.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Field Map */}
        <View style={styles.mapCard}>
          <Text style={styles.sectionTitle}>Field Location</Text>
          <FieldMap
            center={{
              latitude: field.center.coordinates[1],
              longitude: field.center.coordinates[0],
            }}
            boundary={field.boundary}
            editable={false}
            height={250}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleHealthPress}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#10b98120' }]}>
                <Icon name="pulse" size={24} color="#10b981" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Crop Health</Text>
                <Text style={styles.actionSubtitle}>View NDVI, NDWI, TDVI indices</Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleRecommendationsPress}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#3b82f620' }]}>
                <Icon name="bulb" size={24} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Recommendations</Text>
                <Text style={styles.actionSubtitle}>AI-powered farming tips</Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleYieldPress}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#f59e0b20' }]}>
                <Icon name="stats-chart" size={24} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Yield Forecast</Text>
                <Text style={styles.actionSubtitle}>Harvest predictions</Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerCard}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
            disabled={deleteFieldMutation.isPending}
          >
            <Icon name="trash" size={20} color="#ef4444" />
            <Text style={styles.deleteButtonText}>
              {deleteFieldMutation.isPending ? 'Deleting...' : 'Delete Field'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  created: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsCard: {
    backgroundColor: '#fff',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statRow: {
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusActive: {
    color: '#10b981',
  },
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 8,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  dangerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerTitle: {
    color: '#ef4444',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});

export default FieldDetailScreen;



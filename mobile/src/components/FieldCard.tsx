/**
 * FieldCard Component
 * 
 * Card component for displaying field summary in list view
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type { FieldSummary } from '../api/fieldsApi';

interface FieldCardProps {
  field: FieldSummary;
  onPress: (fieldId: string) => void;
}

export const FieldCard: React.FC<FieldCardProps> = ({ field, onPress }) => {
  const getHealthColor = (status?: string) => {
    switch (status) {
      case 'excellent':
        return '#10b981'; // green
      case 'good':
        return '#3b82f6'; // blue
      case 'fair':
        return '#f59e0b'; // yellow
      case 'poor':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getHealthIcon = (status?: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'checkmark-circle';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(field.field_id)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="leaf" size={20} color="#2563eb" />
          <Text style={styles.name}>{field.name}</Text>
        </View>
        {field.health_status && (
          <View style={[styles.healthBadge, { backgroundColor: getHealthColor(field.health_status) + '20' }]}>
            <Icon
              name={getHealthIcon(field.health_status)}
              size={14}
              color={getHealthColor(field.health_status)}
            />
            <Text style={[styles.healthText, { color: getHealthColor(field.health_status) }]}>
              {field.health_status}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Icon name="resize" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{field.area_ha.toFixed(2)} ha</Text>
        </View>

        {field.health_score !== undefined && (
          <View style={styles.detailItem}>
            <Icon name="analytics" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Score: {field.health_score}/100</Text>
          </View>
        )}

        {field.last_health_update && (
          <View style={styles.detailItem}>
            <Icon name="time" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              Updated {getRelativeTime(field.last_health_update)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.viewDetails}>View Details</Text>
        <Icon name="chevron-forward" size={16} color="#2563eb" />
      </View>
    </TouchableOpacity>
  );
};

const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  viewDetails: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
});


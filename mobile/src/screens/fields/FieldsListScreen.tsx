/**
 * FieldsListScreen - Display all user's fields
 */

import React, { useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

import { useFields } from '../../hooks/useFields';
import { FieldCard } from '../../components/FieldCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { EmptyState } from '../../components/EmptyState';
import type { FieldsStackParamList } from '../../navigation/FieldsNavigator';
import type { FieldSummary } from '../../api/fieldsApi';

type NavigationProp = StackNavigationProp<FieldsStackParamList, 'FieldsList'>;

const FieldsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, error, refetch } = useFields({
    status: 'active',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleFieldPress = (fieldId: string) => {
    navigation.navigate('FieldDetail', { fieldId });
  };

  const handleCreateField = () => {
    navigation.navigate('CreateField');
  };

  // Loading state
  if (isLoading && !data) {
    return <LoadingSpinner message="Loading your fields..." />;
  }

  // Error state
  if (isError) {
    return (
      <ErrorMessage
        message={error?.message || 'Failed to load fields'}
        onRetry={() => refetch()}
      />
    );
  }

  // Empty state
  if (!data?.data || data.data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="leaf-outline"
          title="No Fields Yet"
          message="Start by adding your first paddy field to monitor its health and get recommendations."
          action={
            <TouchableOpacity style={styles.createButton} onPress={handleCreateField}>
              <Icon name="add-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Add First Field</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Fields</Text>
          <Text style={styles.subtitle}>
            {data.pagination.total} {data.pagination.total === 1 ? 'field' : 'fields'} total
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateField}>
          <Icon name="add-circle" size={28} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={data.data}
        keyExtractor={(item: FieldSummary) => item.field_id}
        renderItem={({ item }) => (
          <FieldCard field={item} onPress={handleFieldPress} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        ListFooterComponent={() => {
          if (data.pagination.total > data.data.length) {
            return (
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Showing {data.data.length} of {data.pagination.total} fields
                </Text>
              </View>
            );
          }
          return null;
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default FieldsListScreen;


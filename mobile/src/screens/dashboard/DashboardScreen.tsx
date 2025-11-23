/**
 * DashboardScreen - Overview of all fields and stats
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons as Icon } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { useFields } from '../../hooks/useFields';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { MainTabParamList } from '../../navigation/MainNavigator';
import type { FieldsStackParamList } from '../../navigation/FieldsNavigator';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  StackNavigationProp<FieldsStackParamList>
>;

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: fieldsData, isLoading, isError, error, refetch } = useFields({
    status: 'active',
    limit: 100,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (isError) {
    return (
      <ErrorMessage
        message={error?.message || 'Failed to load dashboard'}
        onRetry={() => refetch()}
      />
    );
  }

  const fields = fieldsData?.data || [];
  const totalFields = fields.length;
  const totalArea = fields.reduce((sum, field) => sum + field.area_ha, 0);
  
  // Calculate health summary
  const healthCounts = fields.reduce((counts, field) => {
    const status = field.health_status || 'unknown';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const excellentFields = healthCounts.excellent || 0;
  const goodFields = healthCounts.good || 0;
  const fairFields = healthCounts.fair || 0;
  const poorFields = healthCounts.poor || 0;

  const greeting = getGreeting();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{user?.name || 'Farmer'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="notifications-outline" size={24} color="#111827" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
            <Icon name="leaf" size={28} color="#2563eb" />
            <Text style={styles.statValue}>{totalFields}</Text>
            <Text style={styles.statLabel}>Fields</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
            <Icon name="resize" size={28} color="#10b981" />
            <Text style={styles.statValue}>{totalArea.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Hectares</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <Icon name="water" size={28} color="#f59e0b" />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#fce7f3' }]}>
            <Icon name="stats-chart" size={28} color="#ec4899" />
            <Text style={styles.statValue}>4.2</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>

        {/* Health Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Field Health Summary</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.healthBars}>
            <HealthBar label="Excellent" count={excellentFields} color="#10b981" />
            <HealthBar label="Good" count={goodFields} color="#3b82f6" />
            <HealthBar label="Fair" count={fairFields} color="#f59e0b" />
            <HealthBar label="Poor" count={poorFields} color="#ef4444" />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          
          <ActivityItem
            icon="checkmark-circle"
            iconColor="#10b981"
            title="Health data updated"
            subtitle="3 fields analyzed"
            time="2 hours ago"
          />
          <ActivityItem
            icon="bulb"
            iconColor="#3b82f6"
            title="New recommendations"
            subtitle="Fertilizer application tips"
            time="5 hours ago"
          />
          <ActivityItem
            icon="cloud-download"
            iconColor="#6b7280"
            title="Satellite data fetched"
            subtitle="Latest imagery available"
            time="Yesterday"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <QuickAction
              icon="add-circle"
              label="Add Field"
              color="#2563eb"
              onPress={() => {
                // @ts-ignore - Nested navigation typing issue
                navigation.navigate('Fields', { screen: 'CreateField' });
              }}
            />
            <QuickAction
              icon="pulse"
              label="Check Health"
              color="#10b981"
              onPress={() => navigation.navigate('Fields')}
            />
            <QuickAction
              icon="cloud"
              label="Weather"
              color="#3b82f6"
              onPress={() => navigation.navigate('Weather')}
            />
            <QuickAction
              icon="bulb"
              label="Tips"
              color="#f59e0b"
              onPress={() => navigation.navigate('Fields')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const HealthBar: React.FC<{ label: string; count: number; color: string }> = ({
  label,
  count,
  color,
}) => (
  <View style={styles.healthBarRow}>
    <View style={styles.healthBarLeft}>
      <View style={[styles.healthBarIndicator, { backgroundColor: color }]} />
      <Text style={styles.healthBarLabel}>{label}</Text>
    </View>
    <Text style={styles.healthBarCount}>{count}</Text>
  </View>
);

const ActivityItem: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  iconColor: string;
  title: string;
  subtitle: string;
  time: string;
}> = ({ icon, iconColor, title, subtitle, time }) => (
  <View style={styles.activityItem}>
    <View style={[styles.activityIcon, { backgroundColor: iconColor + '20' }]}>
      <Icon name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activitySubtitle}>{subtitle}</Text>
    </View>
    <Text style={styles.activityTime}>{time}</Text>
  </View>
);

const QuickAction: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  color: string;
  onPress: () => void;
}> = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={24} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  viewAllLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  healthBars: {
    gap: 12,
  },
  healthBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthBarIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  healthBarLabel: {
    fontSize: 16,
    color: '#111827',
  },
  healthBarCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

export default DashboardScreen;



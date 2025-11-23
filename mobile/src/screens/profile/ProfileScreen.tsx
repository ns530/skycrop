/**
 * ProfileScreen - User profile and settings
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
import { Ionicons as Icon } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const ProfileScreen: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const { hasPermission, requestPermission, fcmToken } = useNotifications();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const handleRequestNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      Alert.alert('Success', 'Push notifications enabled!');
    } else {
      Alert.alert('Permission Denied', 'Please enable notifications in settings.');
    }
  };

  if (isLoading || !user) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Icon name="person" size={48} color="#fff" />
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => Alert.alert('Coming Soon', 'Edit profile feature')}
          />
          <MenuItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => Alert.alert('Coming Soon', 'Change password feature')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            onPress={() => Alert.alert('Coming Soon', 'Privacy settings')}
            showBadge={false}
          />
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <MenuItem
            icon="notifications-outline"
            label="Push Notifications"
            onPress={handleRequestNotifications}
            rightContent={
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: hasPermission ? '#10b981' : '#ef4444' },
                ]}
              >
                <Text style={styles.statusText}>
                  {hasPermission ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            }
          />
          <MenuItem
            icon="mail-outline"
            label="Email Notifications"
            onPress={() => Alert.alert('Coming Soon', 'Email settings')}
          />
          <MenuItem
            icon="chatbubble-ellipses-outline"
            label="SMS Alerts"
            onPress={() => Alert.alert('Coming Soon', 'SMS settings')}
          />
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <MenuItem
            icon="language-outline"
            label="Language"
            onPress={() => Alert.alert('Coming Soon', 'Language selection')}
            rightContent={<Text style={styles.rightText}>English</Text>}
          />
          <MenuItem
            icon="color-palette-outline"
            label="Theme"
            onPress={() => Alert.alert('Coming Soon', 'Theme selection')}
            rightContent={<Text style={styles.rightText}>Light</Text>}
          />
          <MenuItem
            icon="cloud-download-outline"
            label="Offline Mode"
            onPress={() => Alert.alert('Coming Soon', 'Offline settings')}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => Alert.alert('Coming Soon', 'Help center')}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms & Conditions"
            onPress={() => Alert.alert('Coming Soon', 'Terms & conditions')}
          />
          <MenuItem
            icon="information-circle-outline"
            label="About SkyCrop"
            onPress={() => Alert.alert('SkyCrop', 'Version 0.1.0\n\nSmart Paddy Field Management System')}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Debug Info (Dev only) */}
        {__DEV__ && fcmToken && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Debug Info</Text>
            <Text style={styles.debugText}>FCM Token:</Text>
            <Text style={styles.debugToken} numberOfLines={1} ellipsizeMode="middle">
              {fcmToken}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const MenuItem: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  onPress: () => void;
  rightContent?: React.ReactNode;
  showBadge?: boolean;
}> = ({ icon, label, onPress, rightContent, showBadge = false }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <Icon name={icon} size={24} color="#6b7280" />
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <View style={styles.menuRight}>
      {rightContent}
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>New</Text>
        </View>
      )}
      <Icon name="chevron-forward" size={20} color="#9ca3af" />
    </View>
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#9ca3af',
  },
  section: {
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    color: '#111827',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  debugSection: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  debugToken: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
});

export default ProfileScreen;



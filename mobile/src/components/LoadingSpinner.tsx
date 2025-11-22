/**
 * LoadingSpinner Component
 * 
 * Centered loading indicator with support for full-page and inline variants
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  variant?: 'full' | 'inline';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'large',
  variant = 'full'
}) => {
  const containerStyle = variant === 'inline' ? styles.inlineContainer : styles.container;
  const messageStyle = variant === 'inline' ? styles.inlineMessage : styles.message;
  const indicatorSize = variant === 'inline' ? 'small' : size;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={indicatorSize} color="#2563eb" />
      {message && <Text style={messageStyle}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  inlineMessage: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
});


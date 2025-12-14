/**
 * SkyCrop Mobile App
 * 
 * Root component with providers and navigation
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, LogBox } from 'react-native';

import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { RootNavigator } from './navigation/RootNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';

// Configure LogBox for debugging
if (__DEV__) {
  LogBox.ignoreAllLogs(false); // Show all logs in development
  
  // Enhanced error logging
  const originalError = console.error;
  console.error = (...args) => {
    originalError('[APP ERROR]', ...args);
  };
  
  // Log app startup
  console.log('🚀 SkyCrop Mobile App starting...');
  console.log('📱 Platform:', require('react-native').Platform.OS);
  console.log('🔧 Dev Mode:', __DEV__);
  
  // Log unhandled promise rejections
  if (typeof global !== 'undefined') {
    const originalUnhandledRejection = global.onunhandledrejection;
    global.onunhandledrejection = (event) => {
      console.error('[UNHANDLED PROMISE REJECTION]', event.reason);
      if (originalUnhandledRejection) {
        originalUnhandledRejection(event);
      }
    };
  }
}

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60_000, // 1 minute
      gcTime: 300_000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <NotificationProvider>
                <RootNavigator />
              </NotificationProvider>
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;


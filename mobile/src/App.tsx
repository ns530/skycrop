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
  console.log('SkyCrop Mobile App starting...');
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


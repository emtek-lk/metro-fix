import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';

import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/components/ui/Toast';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';
import { ThemeProvider, ThemeBoundary, ThemedStatusBar, useTheme } from './src/theme/ThemeProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Navigation chrome that follows the app theme (read after the scheme is set, per mount). */
function ThemedNavigation({ children }: { children: React.ReactNode }) {
  const { scheme } = useTheme();
  const navigationTheme: Theme = {
    ...DefaultTheme,
    dark: scheme === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: colors.brand,
      background: colors.bg,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.brand,
    },
  };
  return <NavigationContainer theme={navigationTheme}>{children}</NavigationContainer>;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ThemedStatusBar />
            <AuthProvider>
              {/* Remounts the UI when the theme changes; auth and the query cache stay above it. */}
              <ThemeBoundary>
                <ToastProvider>
                  <ThemedNavigation>
                    <AppNavigator />
                  </ThemedNavigation>
                </ToastProvider>
              </ThemeBoundary>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

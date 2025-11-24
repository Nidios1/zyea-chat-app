import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { ErrorBoundary } from './src/components/Common/ErrorBoundary';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { FontSizeProvider } from './src/contexts/FontSizeContext';
import { TabBarProvider } from './src/contexts/TabBarContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import SplashScreen from './src/components/Splash/SplashScreen';
import { useUpdates } from './src/hooks/useUpdates';
import { UpdateModal } from './src/components/Common/UpdateModal';
import IncomingCallModal from './src/components/Chat/IncomingCallModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // 0 = data is immediately stale, always fetch fresh data for instant updates
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for instant display while fetching
      retry: 1, // Retry once for faster failure detection
      retryDelay: (attemptIndex) => Math.min(300 * 2 ** attemptIndex, 3000), // Faster exponential backoff (max 3s)
      refetchOnWindowFocus: false, // Don't refetch on focus to reduce unnecessary requests
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Always refetch on mount for fresh data (no delay)
      refetchInterval: false, // Disable automatic polling (use socket for real-time updates)
      structuralSharing: true, // Enable structural sharing to prevent unnecessary re-renders
      networkMode: 'online', // Only refetch when online
      placeholderData: (previousData) => previousData, // Show cached data instantly while fetching
    },
    mutations: {
      retry: 0, // Don't retry mutations - fail fast for better UX
      networkMode: 'online',
    },
  },
});

// Wrapper component to pass theme to PaperProvider
const PaperWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isDarkMode, colors } = useTheme();
  
  const paperTheme = {
    ...require('react-native-paper').MD3LightTheme,
    colors: {
      ...require('react-native-paper').MD3LightTheme.colors,
      primary: colors.primary,
      background: colors.background,
      surface: colors.surface,
      text: colors.text,
      onSurface: colors.text,
      onBackground: colors.text,
      error: colors.error,
      onError: '#FFFFFF',
      outline: colors.border,
    },
    dark: isDarkMode,
  };
  
  return (
    <PaperProvider theme={paperTheme}>
      {children}
    </PaperProvider>
  );
};

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // Check for live updates (chỉ chạy trong production build)
  // Tự động check khi app mở, check lại mỗi 5 phút khi app ở foreground
  const {
    showUpdateModal,
    isDownloading,
    downloadProgress,
    error,
    handleUpdate,
    handleCancel,
    handleRetry,
  } = useUpdates({
    checkOnMount: true,
    checkInterval: 5 * 60 * 1000, // 5 phút
    autoDownload: true,
  });

  // Ensure loading and isAuthenticated are always boolean, not string
  const isLoading = Boolean(loading);
  const authenticated = Boolean(isAuthenticated);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <TabBarProvider>
      <NavigationContainer
        onReady={() => console.log('Navigation ready')}
        onStateChange={() => {}}
      >
        {authenticated ? <MainNavigator /> : <AuthNavigator />}
        <Toast position="bottom" />
        
        {/* Update Modal - Hiển thị khi có phiên bản mới */}
        <UpdateModal
          visible={showUpdateModal}
          onUpdate={handleUpdate}
          onCancel={handleCancel}
          onRetry={handleRetry}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          error={error}
          showProgress={true}
        />
        
        {/* Incoming Call Modal - Hiển thị khi có cuộc gọi đến */}
        {authenticated && <IncomingCallModal />}
      </NavigationContainer>
    </TabBarProvider>
  );
};

const App = () => {
  useEffect(() => {
    // Setup notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 as const }}>
          <QueryClientProvider client={queryClient}>
            <LanguageProvider>
              <ThemeProvider>
                <FontSizeProvider>
                  <PaperWrapper>
                    <AuthProvider>
                      <AppContent />
                    </AuthProvider>
                  </PaperWrapper>
                </FontSizeProvider>
              </ThemeProvider>
            </LanguageProvider>
          </QueryClientProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;

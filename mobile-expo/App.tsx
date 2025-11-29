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
import { NetworkProvider } from './src/contexts/NetworkContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import SplashScreen from './src/components/Splash/SplashScreen';
import { useUpdates } from './src/hooks/useUpdates';
import { UpdateModal } from './src/components/Common/UpdateModal';
import IncomingCallModal from './src/components/Chat/IncomingCallModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tối ưu staleTime: Cache data trong 30s-2 phút tùy loại để giảm refetch không cần thiết
      // Data vẫn hiển thị từ cache ngay lập tức, chỉ refetch khi cần
      staleTime: 30 * 1000, // 30 giây - data vẫn fresh trong 30s, không refetch
      gcTime: 15 * 60 * 1000, // 15 phút - giữ cache lâu hơn để hiển thị nhanh
      retry: 1, // Retry once for faster failure detection
      retryDelay: (attemptIndex) => Math.min(200 * 2 ** attemptIndex, 2000), // Faster exponential backoff (max 2s)
      refetchOnWindowFocus: false, // Don't refetch on focus to reduce unnecessary requests
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchInterval: false, // Disable automatic polling (use socket for real-time updates)
      structuralSharing: true, // Enable structural sharing to prevent unnecessary re-renders
      networkMode: 'online', // Only refetch when online
      placeholderData: (previousData) => previousData, // Show cached data instantly while fetching
      // Tối ưu: Chỉ refetch khi data thực sự stale, không refetch mỗi lần mount
      refetchOnMount: (query) => {
        // Chỉ refetch nếu data đã stale (quá staleTime) hoặc chưa có data
        return query.state.dataUpdatedAt === 0 || 
               Date.now() - query.state.dataUpdatedAt > (query.options.staleTime as number || 30000);
      },
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
                  <NetworkProvider>
                    <PaperWrapper>
                      <AuthProvider>
                        <AppContent />
                      </AuthProvider>
                    </PaperWrapper>
                  </NetworkProvider>
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

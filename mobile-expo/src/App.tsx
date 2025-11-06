import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { TabBarProvider } from './contexts/TabBarContext';
import AuthNavigator from './navigation/AuthNavigator';
import MainNavigator from './navigation/MainNavigator';
import SplashScreen from './components/Splash/SplashScreen';
import { useUpdates } from './hooks/useUpdates';
import { UpdateModal } from './components/Common/UpdateModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Number(5 * 60 * 1000),
      gcTime: Number(10 * 60 * 1000),
      retry: Number(3),
    },
  },
});

// Wrapper component to pass theme to PaperProvider and update StatusBar
const PaperWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isDarkMode, colors } = useTheme();
  
  return (
    <PaperProvider>
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
      </NavigationContainer>
    </TabBarProvider>
  );
};

const App = () => {
  useEffect(() => {
    // Setup notification handler with proper boolean values to avoid type mismatch errors
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
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 as const }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <PaperWrapper>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </PaperWrapper>
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

export default App;

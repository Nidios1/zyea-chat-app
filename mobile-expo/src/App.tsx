import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient } from './utils/queryClient';
import { NavigationContainer, useNavigation, CommonActions, NavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { TabBarProvider } from './contexts/TabBarContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { LightboxProvider } from './contexts/LightboxContext';
import { Lightbox } from './components/Common/Lightbox';
import AuthNavigator from './navigation/AuthNavigator';
import MainNavigator from './navigation/MainNavigator';
import { useUpdates } from './hooks/useUpdates';
import { UpdateModal } from './components/Common/UpdateModal';
import MessageNotificationBanner from './components/Common/MessageNotificationBanner';
import useSocket from './hooks/useSocket';
import { chatAPI } from './utils/api';


// Wrapper component to pass theme to PaperProvider and update StatusBar
const PaperWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isDarkMode, colors } = useTheme();
  
  return (
    <PaperProvider>
      {children}
    </PaperProvider>
  );
};

// Component để xử lý message notifications (phải ở trong NavigationContainer)
const MessageNotificationHandler = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigation = useNavigation<any>();
  
  // Guard check: return null nếu không có user
  if (!user || !user.id) {
    return null;
  }
  
  const [notificationMessage, setNotificationMessage] = React.useState<{
    senderName: string;
    senderAvatar?: string;
    content: string;
    conversationId?: string | number;
    senderId?: string | number;
  } | null>(null);
  const [showNotification, setShowNotification] = React.useState(false);

  // Fetch conversations để lấy thông tin người gửi
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await chatAPI.getConversations();
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    enabled: !!user && !!user.id,
  });

  // Listen for new messages via socket
  React.useEffect(() => {
    if (!socket || !user || !user.id) return;

    const handleReceiveMessage = (data: any) => {
      // Chỉ hiển thị notification nếu không phải tin nhắn của chính mình
      if (data.senderId && String(data.senderId) !== String(user.id)) {
        // Tìm conversation để lấy thông tin người gửi
        const conversation = conversations.find((conv: any) => {
          const otherUserId = conv?.other_user_id || conv?.otherUserId;
          return String(otherUserId) === String(data.senderId);
        });

        const senderName = conversation?.full_name || conversation?.username || data.senderName || data.full_name || 'Người dùng';
        const senderAvatar = conversation?.avatar_url || conversation?.avatar || data.avatar_url || data.avatar;
        const content = data.message || data.content || '';
        const conversationId = data.conversationId || data.conversation_id || conversation?.id;
        const senderId = data.senderId;

        setNotificationMessage({
          senderName,
          senderAvatar,
          content,
          conversationId,
          senderId,
        });
        setShowNotification(true);
      }
    };

    if (socket) {
      socket.on('receiveMessage', handleReceiveMessage);
    }

    return () => {
      if (socket) {
        socket.off('receiveMessage', handleReceiveMessage);
      }
    };
  }, [socket, user?.id, conversations]);

  const handleNotificationPress = () => {
    if (notificationMessage?.conversationId) {
      // Navigate to chat detail screen
      navigation.navigate('Chat', {
        screen: 'ChatDetail',
        params: {
          conversationId: notificationMessage.conversationId,
          userName: notificationMessage.senderName,
          userAvatar: notificationMessage.senderAvatar,
          userId: notificationMessage.senderId,
        },
      });
    } else if (notificationMessage?.senderId) {
      // Navigate to chat list first, then to chat detail
      navigation.navigate('Chat', {
        screen: 'ChatList',
      });
      // Try to navigate to chat detail after a short delay
      setTimeout(() => {
        navigation.navigate('Chat', {
          screen: 'ChatDetail',
          params: {
            userId: notificationMessage.senderId,
            userName: notificationMessage.senderName,
            userAvatar: notificationMessage.senderAvatar,
          },
        });
      }, 500);
    }
  };

  const handleNotificationDismiss = () => {
    setShowNotification(false);
    setNotificationMessage(null);
  };

  return (
    <MessageNotificationBanner
      visible={showNotification}
      message={notificationMessage}
      onPress={handleNotificationPress}
      onDismiss={handleNotificationDismiss}
    />
  );
};

const AppContent = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const navigationRef = React.useRef<NavigationContainerRef<any>>(null);
  
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
  const authenticated = Boolean(isAuthenticated) && !!user; // Đảm bảo user tồn tại

  if (isLoading) {
    return null;
  }

  return (
    <TabBarProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => console.log('Navigation ready')}
        onStateChange={() => {}}
      >
        {authenticated && user ? (
          <MainNavigator key={`main-${user.id}`} />
        ) : (
          <AuthNavigator key="auth" />
        )}
        <Toast position="bottom" />
        
        {/* Message Notification Banner - Hiển thị khi có tin nhắn mới */}
        {authenticated && <MessageNotificationHandler />}
        
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
        
        {/* Lightbox - Hiển thị fullscreen image viewer */}
        <Lightbox />
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
          <LanguageProvider>
            <ThemeProvider>
              <FontSizeProvider>
                <NetworkProvider>
                  <LightboxProvider>
                    <PaperWrapper>
                      <AuthProvider>
                        <AppContent />
                      </AuthProvider>
                    </PaperWrapper>
                  </LightboxProvider>
                </NetworkProvider>
              </FontSizeProvider>
            </ThemeProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

export default App;

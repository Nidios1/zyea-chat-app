import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Modal, Text, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import apiClient from '../utils/api';

interface NetworkContextType {
  isConnected: boolean;
  isChecking: boolean;
  checkConnection: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const { colors, isDarkMode } = useTheme();

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      // Thử gọi một endpoint đơn giản để kiểm tra kết nối
      await apiClient.get('/api/app/health', { timeout: 5000 });
      console.log('✅ [Network] Connection OK');
      setIsConnected(true);
      setShowModal(false);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Đảm bảo modal ẩn sau animation
        if (isConnected) {
          setShowModal(false);
        }
      });
    } catch (error: any) {
      console.log('❌ [Network] Connection check failed:', {
        code: error.code,
        message: error.message,
        response: error.response?.status,
      });
      
      // Kiểm tra xem có phải lỗi network không
      const isNetworkError = 
        !error.response && // Không có response từ server
        (error.code === 'ECONNABORTED' || // Timeout
         error.code === 'ENOTFOUND' || // DNS error
         error.code === 'ECONNREFUSED' || // Connection refused
         error.code === 'ETIMEDOUT' || // Timeout
         error.message?.toLowerCase().includes('network error') ||
         error.message?.toLowerCase().includes('timeout') ||
         error.message?.toLowerCase().includes('err_network') ||
         error.message?.toLowerCase().includes('network request failed') ||
         error.message?.toLowerCase().includes('failed to fetch'));

      if (isNetworkError) {
        console.log('⚠️ [Network] Network error detected, showing modal');
        setIsConnected(false);
        // Set fadeAnim về 1 ngay lập tức trước khi set showModal
        fadeAnim.setValue(1);
        setShowModal(true);
        // Animation không cần thiết nữa vì đã setValue(1)
      } else {
        // Lỗi khác (401, 500, etc.) - vẫn coi là có kết nối
        console.log('ℹ️ [Network] Server error but connection exists');
        setIsConnected(true);
        setShowModal(false);
      }
    } finally {
      setIsChecking(false);
    }
  }, [fadeAnim, isConnected]);

  // Kiểm tra kết nối định kỳ
  useEffect(() => {
    const interval = setInterval(() => {
      checkConnection();
    }, 10000); // Kiểm tra mỗi 10 giây

    // Kiểm tra ngay khi mount
    checkConnection();

    return () => clearInterval(interval);
  }, [checkConnection]);

  // Lắng nghe lỗi từ API interceptor - chỉ setup một lần
  useEffect(() => {
    let responseInterceptorId: number | null = null;

    const handleError = async (error: any) => {
      // Kiểm tra network error
      const isNetworkError = 
        !error.response &&
        (error.code === 'ECONNABORTED' ||
         error.code === 'ENOTFOUND' ||
         error.code === 'ECONNREFUSED' ||
         error.code === 'ETIMEDOUT' ||
         error.message?.toLowerCase().includes('network error') ||
         error.message?.toLowerCase().includes('timeout') ||
         error.message?.toLowerCase().includes('err_network') ||
         error.message?.toLowerCase().includes('network request failed') ||
         error.message?.toLowerCase().includes('failed to fetch'));

      if (isNetworkError) {
        console.log('⚠️ [Network] Network error from API interceptor, showing modal');
        setIsConnected(false);
        // Set fadeAnim về 1 ngay lập tức trước khi set showModal
        fadeAnim.setValue(1);
        setShowModal(true);
      }

      return Promise.reject(error);
    };

    // Chỉ thêm interceptor nếu chưa có
    try {
      responseInterceptorId = apiClient.interceptors.response.use(
        (response) => response,
        handleError
      );
    } catch (e) {
      console.warn('Failed to setup network error interceptor:', e);
    }

    return () => {
      if (responseInterceptorId !== null) {
        try {
          apiClient.interceptors.response.eject(responseInterceptorId);
        } catch (e) {
          // Ignore errors when ejecting
        }
      }
    };
  }, [fadeAnim]);

  const handleRetry = () => {
    checkConnection();
  };

  // Debug: Log state changes
  useEffect(() => {
    console.log('🔍 [Network] State changed:', {
      isConnected,
      showModal,
      isChecking,
    });
  }, [isConnected, showModal, isChecking]);

  return (
    <NetworkContext.Provider value={{ isConnected, isChecking, checkConnection }}>
      {children}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface || '#FFFFFF',
              },
            ]}
          >
            <MaterialCommunityIcons
              name="wifi-off"
              size={64}
              color={colors.error || '#e74c3c'}
            />
            <Text
              style={[
                styles.title,
                {
                  color: colors.text || '#000000',
                },
              ]}
            >
              Mất kết nối
            </Text>
            <Text
              style={[
                styles.message,
                {
                  color: colors.textSecondary || '#666666',
                },
              ]}
            >
              Không thể kết nối đến server.{'\n'}
              Vui lòng kiểm tra kết nối mạng của bạn.
            </Text>
            {isChecking ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary || '#0084ff'} />
                <Text
                  style={[
                    styles.loadingText,
                    {
                      color: colors.textSecondary || '#666666',
                    },
                  ]}
                >
                  Đang kiểm tra kết nối...
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  {
                    backgroundColor: colors.primary || '#0084ff',
                  },
                ]}
                onPress={handleRetry}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </NetworkContext.Provider>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10000,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    minWidth: 120,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});


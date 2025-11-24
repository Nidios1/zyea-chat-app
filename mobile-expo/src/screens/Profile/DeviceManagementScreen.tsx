import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../hooks/useAlert';

type DeviceManagementScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'DeviceManagement'>;

interface DeviceInfo {
  id: string;
  name: string;
  type: string;
  appVersion?: string;
  location?: string;
  status?: string;
  isCurrent: boolean;
  lastActive: string;
  browser?: string;
  browserVersion?: string;
}

interface SessionInfo {
  id: string;
  sessionId: string; // Full token for logout
  browser: string;
  browserVersion: string;
  appVersion: string;
  location: string;
  lastActive: string;
}

const DeviceManagementScreen = () => {
  const navigation = useNavigation<DeviceManagementScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useAlert();
  const [currentDevice, setCurrentDevice] = useState<DeviceInfo | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [justLoggedOut, setJustLoggedOut] = useState(false); // Flag to prevent reload after logout

  // Tính toán màu chữ và nền với độ tương phản tốt hơn
  const textColors = useMemo(() => {
    // Đảm bảo màu chữ luôn có độ tương phản tốt
    const primaryText = isDarkMode ? '#ffffff' : '#333333';
    const secondaryText = isDarkMode ? '#d0d0d0' : '#555555'; // Tăng độ tương phản
    const sectionTitleText = isDarkMode ? '#c0c0c0' : '#777777';
    
    return {
      text: primaryText,
      secondary: secondaryText,
      sectionTitle: sectionTitleText,
    };
  }, [isDarkMode]);

  // Tính toán màu nền cho card/surface - đảm bảo luôn tối trong dark mode
  const cardBackgroundColor = useMemo(() => {
    return isDarkMode ? '#242424' : colors.surface;
  }, [isDarkMode, colors.surface]);

  // Màu nút primary - luôn là màu xanh trong cả light và dark mode
  const primaryButtonColor = useMemo(() => {
    return '#0084ff'; // Màu xanh cố định
  }, []);

  useEffect(() => {
    loadDevices();
  }, []);

  // Reload devices when screen comes into focus (e.g., after QR login)
  // But skip reload if we just logged out (to prevent showing sessions again)
  useFocusEffect(
    React.useCallback(() => {
      if (!justLoggedOut) {
        loadDevices();
      } else {
        // Reset flag after a short delay
        setTimeout(() => {
          setJustLoggedOut(false);
        }, 1000);
      }
    }, [justLoggedOut])
  );

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      
      // Get current device info
      const deviceName = Device.modelName || `${Platform.OS === 'ios' ? 'iPhone' : 'Android'} Device`;
      const deviceType = Platform.OS === 'ios' ? 'iOS' : 'Android';
      const appVersion = Constants.expoConfig?.version || '1.0.0';
      
      const current: DeviceInfo = {
        id: 'current',
        name: deviceName,
        type: deviceType,
        appVersion: `Zyea+ ${deviceType} ${appVersion}`,
        location: 'Hanoi, Vietnam', // TODO: Get from geolocation API
        status: 'trực tuyến',
        isCurrent: true,
        lastActive: 'Đang sử dụng',
      };

      setCurrentDevice(current);

      // Fetch active sessions from API
      try {
        const response = await authAPI.getActiveSessions();
        console.log('📱 DeviceManagement - API Response type:', typeof response?.data);
        console.log('📱 DeviceManagement - API Response:', response?.data);
        
        // Check if response is HTML (error case)
        if (typeof response?.data === 'string' && response.data.includes('<!doctype html>')) {
          console.error('❌ API returned HTML instead of JSON - endpoint may not exist');
          setSessions([]);
          return;
        }
        
        // Safely extract sessions array from response
        let activeSessions: any[] = [];
        if (response?.data) {
          if (Array.isArray(response.data)) {
            activeSessions = response.data;
          } else if (Array.isArray(response.data.sessions)) {
            activeSessions = response.data.sessions;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            activeSessions = response.data.data;
          }
        }
        
        console.log('📱 DeviceManagement - Extracted sessions:', activeSessions.length, activeSessions);
        
        // Ensure activeSessions is always an array
        if (!Array.isArray(activeSessions)) {
          console.warn('📱 DeviceManagement - activeSessions is not an array:', activeSessions);
          activeSessions = [];
        }
        
        // Transform API response to SessionInfo format
        const formattedSessions: SessionInfo[] = activeSessions.map((session: any, index: number) => {
          const browser = session.browser || session.deviceInfo?.browser || 'Unknown Browser';
          const browserVersion = session.browserVersion || session.deviceInfo?.browserVersion || '';
          const appVersion = session.appVersion || session.deviceInfo?.version || 'Zyea+ Web';
          const location = session.location || session.deviceInfo?.location || 'Unknown';
          
          // Format last active time
          let lastActive = 'Unknown';
          if (session.lastActive) {
            const lastActiveDate = new Date(session.lastActive);
            const now = new Date();
            const diffMs = now.getTime() - lastActiveDate.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) {
              lastActive = 'Vừa xong';
            } else if (diffMins < 60) {
              lastActive = `${diffMins} phút trước`;
            } else if (diffHours < 24) {
              lastActive = `${diffHours} giờ trước`;
            } else if (diffDays === 1) {
              lastActive = 'Hôm qua';
            } else if (diffDays < 7) {
              lastActive = `${diffDays} ngày trước`;
            } else {
              const day = lastActiveDate.getDate();
              const month = lastActiveDate.getMonth() + 1;
              const year = lastActiveDate.getFullYear();
              lastActive = `${day}/${month}/${year}`;
            }
          }
          
          // Ensure we have sessionId (full token) for logout
          const fullSessionId = session.sessionId || session.id || '';
          
          return {
            id: session.id || (fullSessionId ? fullSessionId.substring(0, 20) + '...' : `session-${index}`),
            sessionId: fullSessionId, // Full token for logout - MUST have this
            browser: `${browser} ${browserVersion}`.trim(),
            browserVersion: browserVersion || '',
            appVersion: appVersion,
            location: location,
            lastActive: lastActive,
          };
        });
        
        console.log('📱 DeviceManagement - Formatted sessions:', formattedSessions.length, formattedSessions);
        setSessions(formattedSessions);
      } catch (error: any) {
        console.error('📱 DeviceManagement - Error fetching active sessions:', error);
        console.error('📱 DeviceManagement - Error details:', {
          status: error.response?.status,
          message: error.response?.data?.message,
          data: error.response?.data
        });
        // If API fails, show empty sessions list
        setSessions([]);
        // Don't show error alert if endpoint doesn't exist yet
        if (error.response?.status !== 404) {
          showAlert('Lỗi', 'Không thể tải danh sách phiên đăng nhập', undefined, 'OK', 'error');
        }
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSession = async (sessionId: string) => {
    Alert.alert(
      'Đăng xuất phiên',
      'Bạn có chắc chắn muốn đăng xuất phiên này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            // Update local state IMMEDIATELY for instant UI feedback (no reload needed)
            const updatedSessions = sessions.filter(s => s.id !== sessionId);
            setSessions(updatedSessions);
            
            // Set flag to prevent reload after logout
            setJustLoggedOut(true);
            
            // Show success alert immediately
            showAlert('Thành công', 'Đã đăng xuất phiên', undefined, 'OK', 'success');
            
            // Call API in background (non-blocking)
            try {
              // Find the session to get full sessionId (token)
              const session = sessions.find(s => s.id === sessionId);
              if (session && session.sessionId) {
                // Fire and forget - don't await, just log errors
                authAPI.logoutSession(session.sessionId).catch((error: any) => {
                  console.error('Background logout error:', error);
                  // Only show error if it's not 404 (endpoint doesn't exist)
                  if (error.response?.status && error.response.status !== 404) {
                    // Silently reload to sync with server if there's a real error
                    loadDevices().catch(err => console.error('Failed to reload:', err));
                  }
                });
              }
            } catch (error: any) {
              console.error('Error in logout handler:', error);
              // If there's an error, silently reload to sync
              if (error.response?.status && error.response.status !== 404) {
                loadDevices().catch(err => console.error('Failed to reload:', err));
              }
            }
          },
        },
      ]
    );
  };

  const handleLogoutAllOtherSessions = async () => {
    Alert.alert(
      'Đăng xuất tất cả phiên khác',
      'Bạn có chắc chắn muốn đăng xuất khỏi tất cả các phiên đăng nhập khác?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            // Update local state IMMEDIATELY for instant UI feedback (no reload needed)
            setSessions([]);
            
            // Set flag to prevent reload after logout
            setJustLoggedOut(true);
            
            // Show success alert immediately
            showAlert('Thành công', 'Đã đăng xuất tất cả phiên khác', undefined, 'OK', 'success');
            
            // Call API in background (non-blocking)
            try {
              // Fire and forget - don't await, just log errors
              authAPI.logoutAllOtherSessions().catch((error: any) => {
                console.error('Background logout all error:', error);
                // Only reload if it's not 404 (endpoint doesn't exist)
                if (error.response?.status && error.response.status !== 404) {
                  // Silently reload to sync with server if there's a real error
                  loadDevices().catch(err => console.error('Failed to reload:', err));
                }
              });
            } catch (error: any) {
              console.error('Error in logout all handler:', error);
              // If there's an error, silently reload to sync
              if (error.response?.status && error.response.status !== 404) {
                loadDevices().catch(err => console.error('Failed to reload:', err));
              }
            }
          },
        },
      ]
    );
  };

  const handleConnectComputer = () => {
    navigation.navigate('QRScanner');
  };

  const dynamicStyles = createStyles(colors);

  return (
    <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={textColors.text} />
        </TouchableOpacity>
        <Text style={[dynamicStyles.headerTitle, { color: textColors.text }]}>
          Thiết bị
        </Text>
        <TouchableOpacity
          style={dynamicStyles.editButton}
          onPress={() => setIsEditMode(!isEditMode)}
        >
          <Text style={[dynamicStyles.editButtonText, { color: colors.primary }]}>
            {isEditMode ? 'Xong' : 'Sửa'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={dynamicStyles.content}
        contentContainerStyle={[
          dynamicStyles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Code Connection Section */}
        <View style={dynamicStyles.qrSection}>
          <View style={dynamicStyles.laptopIllustration}>
            <MaterialCommunityIcons 
              name="laptop" 
              size={120} 
              color={textColors.secondary} 
              style={{ opacity: isDarkMode ? 0.4 : 0.25 }}
            />
          </View>
          <Text style={[dynamicStyles.qrInstruction, { color: textColors.secondary }]}>
            Truy cập ZYEA Chat trên Desktop và Trình duyệt bằng phương thức quét mã QR
          </Text>
          <TouchableOpacity
            style={[dynamicStyles.connectButton, { backgroundColor: primaryButtonColor }]}
            onPress={handleConnectComputer}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={dynamicStyles.connectButtonText}>Quét mã QR để liên kết thiết bị Desktop</Text>
          </TouchableOpacity>
        </View>

        {/* Current Device Section */}
        <View style={dynamicStyles.sectionContainer}>
          <Text style={[dynamicStyles.sectionTitle, { color: textColors.sectionTitle }]}>
            THIẾT BỊ NÀY
          </Text>
          
          {currentDevice && (
            <View style={[dynamicStyles.deviceCard, { backgroundColor: cardBackgroundColor }]}>
              <View style={dynamicStyles.deviceInfo}>
                <View style={[dynamicStyles.deviceIcon, { backgroundColor: colors.primary + '20' }]}>
                  <MaterialCommunityIcons
                    name={currentDevice.type === 'iOS' ? 'cellphone' : 'cellphone'}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={dynamicStyles.deviceDetails}>
                  <Text style={[dynamicStyles.deviceName, { color: textColors.text }]}>
                    {currentDevice.name}
                  </Text>
                  <Text style={[dynamicStyles.deviceType, { color: textColors.secondary }]}>
                    {currentDevice.appVersion}
                  </Text>
                  <Text style={[dynamicStyles.deviceLocation, { color: textColors.secondary }]}>
                    {currentDevice.location} • {currentDevice.status}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[dynamicStyles.logoutAllCard, { backgroundColor: cardBackgroundColor }]}
            onPress={handleLogoutAllOtherSessions}
          >
            <MaterialCommunityIcons name="hand-back-left" size={20} color={colors.error || '#ff4444'} style={{ marginRight: 12 }} />
            <Text style={[dynamicStyles.logoutAllText, { color: colors.error || '#ff4444' }]}>
              Đăng xuất tất cả phiên khác
            </Text>
          </TouchableOpacity>

          <Text style={[dynamicStyles.logoutAllDescription, { color: textColors.secondary }]}>
            Đăng xuất khỏi tất cả trừ thiết bị này.
          </Text>
        </View>

        {/* Active Sessions Section */}
        {sessions.length > 0 && (
          <View style={dynamicStyles.sectionContainer}>
            <Text style={[dynamicStyles.sectionTitle, { color: textColors.sectionTitle }]}>
              PHIÊN ĐĂNG NHẬP
            </Text>
            
            {sessions.map((session) => (
              <View
                key={session.id}
                style={[dynamicStyles.sessionCard, { backgroundColor: cardBackgroundColor }]}
              >
                <View style={dynamicStyles.deviceInfo}>
                  <View style={[dynamicStyles.browserIcon, { backgroundColor: '#4CAF50' + '20' }]}>
                    <MaterialCommunityIcons
                      name="web"
                      size={20}
                      color="#4CAF50"
                    />
                  </View>
                  <View style={dynamicStyles.deviceDetails}>
                    <Text style={[dynamicStyles.deviceName, { color: textColors.text }]}>
                      {session.browser}
                    </Text>
                    <Text style={[dynamicStyles.deviceType, { color: textColors.secondary }]}>
                      {session.appVersion}
                    </Text>
                    <Text style={[dynamicStyles.deviceLocation, { color: textColors.secondary }]}>
                      {session.location} {session.lastActive.includes('•') ? '•' : '-'} {session.lastActive}
                    </Text>
                  </View>
                </View>
                {isEditMode && (
                  <TouchableOpacity
                    style={dynamicStyles.removeButton}
                    onPress={() => handleRemoveSession(session.id)}
                  >
                    <MaterialCommunityIcons name="close" size={20} color={colors.error || '#ff4444'} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          )}
        </ScrollView>
        <AlertComponent />
      </SafeAreaView>
    );
  };

const createStyles = (colors: typeof PWATheme.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
    minWidth: 50,
    alignItems: 'flex-end',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  laptopIllustration: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrInstruction: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContainer: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  browserIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 14,
    marginBottom: 4,
  },
  deviceLocation: {
    fontSize: 13,
  },
  logoutAllCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  logoutAllText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutAllDescription: {
    fontSize: 13,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default DeviceManagementScreen;


import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { authAPI } from '../../utils/api';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRLoginConfirmModal, { DeviceInfo } from '../../components/Common/QRLoginConfirmModal';

// Lazy import expo-constants to avoid TurboModule errors
let Constants: any = null;
try {
  Constants = require('expo-constants').default || require('expo-constants');
} catch (e) {
  Constants = { appOwnership: 'expo' };
}

// Try to import camera modules with fallback
// Prefer expo-barcode-scanner for Expo Go compatibility
let CameraView: any = null;
let CameraType: any = null;
let useCameraPermissions: any = null;
let BarcodeScanningResult: any = null;
let BarCodeScanner: any = null;
let requestPermissionsAsync: any = null;

// Try expo-barcode-scanner first (better Expo Go support)
try {
  const barcodeModule = require('expo-barcode-scanner');
  BarCodeScanner = barcodeModule.BarCodeScanner;
  requestPermissionsAsync = barcodeModule.requestPermissionsAsync;
} catch (e) {
  console.warn('expo-barcode-scanner not available');
}

// Fallback to expo-camera if barcode-scanner not available
if (!BarCodeScanner) {
  try {
    const cameraModule = require('expo-camera');
    CameraView = cameraModule.CameraView;
    CameraType = cameraModule.CameraType;
    useCameraPermissions = cameraModule.useCameraPermissions;
    BarcodeScanningResult = cameraModule.BarcodeScanningResult;
  } catch (e) {
    console.warn('expo-camera not available');
  }
}

type QRScannerScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'QRScanner'>;

const QRScannerScreen = () => {
  const navigation = useNavigation<QRScannerScreenNavigationProp>();
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  // Use hook if available (must be called unconditionally)
  let cameraPermissions: [any, any] = [null, null];
  try {
    if (useCameraPermissions) {
      cameraPermissions = useCameraPermissions();
    }
  } catch (e) {
    // Hook not available, use state instead
  }
  const [permission, setPermission] = useState<any>(cameraPermissions[0]);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [pendingQrToken, setPendingQrToken] = useState<string | null>(null);
  const lastScannedToken = React.useRef<string | null>(null);
  const scanTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if running in Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    
    if (isExpoGo && !CameraView && !BarCodeScanner) {
      setError('Tính năng quét QR code không khả dụng trong Expo Go. Vui lòng build development build để sử dụng tính năng này.');
      return;
    }

    // Request permission
    const requestPermission = async () => {
      try {
        if (useCameraPermissions && cameraPermissions[0]) {
          // Use expo-camera permissions (from hook)
          const perm = cameraPermissions[0];
          setPermission(perm);
          setHasPermission(perm.granted);
        } else if (requestPermissionsAsync) {
          // Use expo-barcode-scanner permissions
          const { status } = await requestPermissionsAsync();
          setHasPermission(status === 'granted');
          setPermission({ granted: status === 'granted', status });
        } else if (useCameraPermissions && cameraPermissions[1]) {
          // Request permission if not granted
          const requestPerm = cameraPermissions[1];
          const result = await requestPerm();
          setPermission(result);
          setHasPermission(result.granted);
        }
      } catch (e) {
        console.error('Permission request error:', e);
        setHasPermission(false);
        setPermission({ granted: false });
      }
    };

    requestPermission();
  }, [navigation, cameraPermissions]);

  // System notification message is now handled by backend
  // No need for this function anymore

  const handleBarCodeScanned = async (result: any) => {
    // Handle both expo-camera and expo-barcode-scanner formats
    const data = result?.data || result?.raw || result;
    if (scanned || isProcessing || !data) return;

    // Extract token to check if it's the same QR code
    const qrToken = data.startsWith('zyea-login-session:') 
      ? data.replace('zyea-login-session:', '').trim() 
      : null;

    // Prevent scanning the same QR code multiple times
    if (qrToken && lastScannedToken.current === qrToken) {
      return; // Ignore duplicate scans
    }

    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    console.log('QR Code detected:', data);

    // Check if it's a valid Zyea+ login QR
    if (!data || typeof data !== 'string' || !data.startsWith('zyea-login-session:')) {
      Toast.show({
        type: 'error',
        text1: 'Mã QR không hợp lệ',
        text2: 'Vui lòng quét mã QR đăng nhập từ PC',
        position: 'bottom',
      });
      // Reset scanned state after a delay to allow scanning again
      setTimeout(() => {
        setScanned(false);
      }, 2000);
      return;
    }

    if (!user?.id) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.',
        position: 'bottom',
      });
      setScanned(false);
      return;
    }

    // Mark this token as scanned to prevent duplicate scans
    if (qrToken) {
      lastScannedToken.current = qrToken;
    }

    setIsProcessing(true);
    setScanned(true);

    try {
      // Token already extracted above
      if (!qrToken) {
        throw new Error('Mã QR không hợp lệ - không tìm thấy token');
      }

      console.log('QR Login - Fetching device info:', { 
        qrToken: qrToken.substring(0, 20) + '...'
      });

      // First, get device info from backend
      const statusResponse = await authAPI.qrLoginStatus(qrToken);

      console.log('QR status response:', {
        status: statusResponse.data.status,
        hasDeviceInfo: !!statusResponse.data.deviceInfo,
        deviceInfo: statusResponse.data.deviceInfo
      });

      if (statusResponse.data.status === 'expired') {
        throw new Error('Mã QR đã hết hạn');
      }

      if (statusResponse.data.status !== 'pending') {
        throw new Error('Mã QR không còn hợp lệ');
      }

      // Get device info from response
      let deviceInfoData = statusResponse.data.deviceInfo;
      
      // If deviceInfo is null or missing, create default device info
      // This can happen if QR was scanned before PC initialized the session
      if (!deviceInfoData) {
        console.log('Device info not available, using default values');
        deviceInfoData = {
          device: 'Desktop',
          deviceType: 'Desktop',
          browser: 'Chrome',
          browserVersion: 'Unknown',
          version: 'Unknown',
          os: 'Windows',
          osName: 'Windows',
          ip: 'Unknown',
          location: 'Unknown'
        };
      }

      console.log('Using device info:', deviceInfoData);

      // Set device info and show confirmation modal
      setDeviceInfo(deviceInfoData);
      setPendingQrToken(qrToken);
      setShowConfirmModal(true);
      setIsProcessing(false);
      // Keep scanned state to prevent re-scanning while modal is open
      
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Không thể lấy thông tin thiết bị. Vui lòng thử lại.';

      console.error('QR status error:', error);

      if (error.response?.status === 404 || errorMsg.includes('hết hạn') || errorMsg.includes('expired')) {
        Toast.show({
          type: 'error',
          text1: 'Mã QR đã hết hạn',
          text2: 'Vui lòng làm mới mã QR trên PC và thử lại',
          position: 'bottom',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: errorMsg,
          position: 'bottom',
        });
      }

      // Reset states after a delay to allow scanning again
      setTimeout(() => {
        setScanned(false);
        setIsProcessing(false);
        lastScannedToken.current = null;
      }, 3000);
    }
  };

  // Handle confirm login from modal
  const handleConfirmLogin = async () => {
    if (!pendingQrToken || !user?.id) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Thông tin không hợp lệ',
        position: 'bottom',
      });
      setShowConfirmModal(false);
      setDeviceInfo(null);
      setPendingQrToken(null);
      setScanned(false);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    try {
      const userId = user.id.toString();

      console.log('QR Login - Sending confirmation:', { 
        qrToken: pendingQrToken.substring(0, 20) + '...', 
        userId,
        userEmail: user.email 
      });

      // Send confirmation to backend
      const response = await authAPI.qrLoginConfirm(pendingQrToken, userId);

      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Đăng nhập thành công!',
          text2: 'Bạn đã đăng nhập trên PC thành công',
          position: 'bottom',
        });

        // Close modal and reset states
        setShowConfirmModal(false);
        setDeviceInfo(null);
        setPendingQrToken(null);
        setIsProcessing(false);

        // Keep scanned state to prevent re-scanning while navigating
        // Wait a bit then navigate back safely
        setTimeout(() => {
          // Reset scanned state before navigating
          setScanned(false);
          lastScannedToken.current = null;
          
          // Check if we can go back, otherwise navigate to Profile
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            // If can't go back, navigate to Profile screen
            navigation.navigate('Profile');
          }
        }, 1500);
        
        return;
      } else {
        throw new Error(response.data.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Không thể đăng nhập. Vui lòng thử lại.';

      // Check if it's "already used" error - this usually means duplicate scan
      const isAlreadyUsed = error.response?.status === 400 && 
        (error.response?.data?.message?.includes('already used') || 
         error.response?.data?.message?.includes('đã được sử dụng') ||
         error.response?.data?.message?.includes('already used or expired'));

      if (isAlreadyUsed) {
        Toast.show({
          type: 'info',
          text1: 'Mã QR đã được sử dụng',
          text2: 'Mã QR này đã được sử dụng. Vui lòng làm mới mã QR trên PC nếu cần đăng nhập lại.',
          position: 'bottom',
          visibilityTime: 2000,
        });
      } else if (error.response?.status === 404) {
        Toast.show({
          type: 'error',
          text1: 'Mã QR đã hết hạn',
          text2: 'Vui lòng làm mới mã QR trên PC và thử lại',
          position: 'bottom',
        });
      } else if (error.response?.status === 400) {
        const specificMsg = error.response?.data?.message || errorMsg;
        const isExpired = specificMsg.includes('expired') || specificMsg.includes('hết hạn');
        
        Toast.show({
          type: 'error',
          text1: isExpired ? 'Mã QR đã hết hạn' : 'Lỗi xác thực',
          text2: isExpired 
            ? 'Mã QR đã hết hạn. Vui lòng làm mới mã QR trên PC và quét lại.'
            : (specificMsg || 'Mã QR không hợp lệ'),
          position: 'bottom',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Lỗi đăng nhập',
          text2: errorMsg,
          position: 'bottom',
        });
      }

      // Close modal and reset states
      setShowConfirmModal(false);
      setDeviceInfo(null);
      setPendingQrToken(null);
      
      setTimeout(() => {
        setScanned(false);
        setIsProcessing(false);
        lastScannedToken.current = null;
      }, 2000);
    }
  };

  // Handle reject from modal
  const handleRejectLogin = () => {
    // Close modal
    setShowConfirmModal(false);
    
    // Reset all states to allow scanning again
    setDeviceInfo(null);
    setPendingQrToken(null);
    setScanned(false);
    setIsProcessing(false);
    lastScannedToken.current = null;
    
    // Show info message to user
    Toast.show({
      type: 'info',
      text1: 'Đã từ chối đăng nhập',
      text2: 'Bạn có thể quét lại mã QR khác nếu cần',
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  // Create styles early
  const dynamicStyles = createStyles(colors, insets);
  const baseStyles = StyleSheet.create({
    container: {
      flex: 1,
    },
    permissionContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    permissionIcon: {
      marginBottom: 24,
    },
    permissionTitle: {
      marginBottom: 12,
      textAlign: 'center',
    },
    permissionText: {
      marginBottom: 32,
      textAlign: 'center',
    },
    permissionButton: {
      marginBottom: 16,
      minWidth: 200,
    },
    cancelButton: {
      minWidth: 200,
    },
  });

  // Show error if camera modules not available
  if (error) {
    return (
      <View style={[baseStyles.container, { backgroundColor: colors.background }]}>
        <View style={baseStyles.permissionContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={64}
            color={colors.error}
            style={baseStyles.permissionIcon}
          />
          <Text
            variant="headlineSmall"
            style={[baseStyles.permissionTitle, { color: colors.text }]}
          >
            Không khả dụng
          </Text>
          <Text
            variant="bodyMedium"
            style={[baseStyles.permissionText, { color: colors.textSecondary }]}
          >
            {error}
          </Text>
          <Button
            mode="contained"
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Profile');
              }
            }}
            style={baseStyles.permissionButton}
            buttonColor={colors.primary}
          >
            Quay lại
          </Button>
        </View>
      </View>
    );
  }

  if (!permission && !BarCodeScanner) {
    return (
      <View style={[baseStyles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (permission && !permission.granted) {
    return (
      <View style={[baseStyles.container, { backgroundColor: colors.background }]}>
        <View style={baseStyles.permissionContainer}>
          <MaterialCommunityIcons
            name="camera-off"
            size={64}
            color={colors.textSecondary}
            style={baseStyles.permissionIcon}
          />
          <Text
            variant="headlineSmall"
            style={[baseStyles.permissionTitle, { color: colors.text }]}
          >
            Quyền truy cập camera
          </Text>
          <Text
            variant="bodyMedium"
            style={[baseStyles.permissionText, { color: colors.textSecondary }]}
          >
            Ứng dụng cần quyền truy cập camera để quét mã QR đăng nhập
          </Text>
          <Button
            mode="contained"
            onPress={async () => {
              try {
                if (useCameraPermissions && cameraPermissions[1]) {
                  const requestPerm = cameraPermissions[1];
                  const result = await requestPerm();
                  setPermission(result);
                  setHasPermission(result.granted);
                } else if (requestPermissionsAsync) {
                  const { status } = await requestPermissionsAsync();
                  setHasPermission(status === 'granted');
                  setPermission({ granted: status === 'granted', status });
                }
              } catch (e) {
                console.error('Permission request error:', e);
                Alert.alert('Lỗi', 'Không thể yêu cầu quyền camera. Vui lòng kiểm tra cài đặt.');
              }
            }}
            style={baseStyles.permissionButton}
            buttonColor={colors.primary}
          >
            Cấp quyền
          </Button>
          <Button
            mode="outlined"
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Profile');
              }
            }}
            style={baseStyles.cancelButton}
            textColor={colors.text}
          >
            Hủy
          </Button>
        </View>
      </View>
    );
  }

  // Check if we have permission
  const canScan = (permission?.granted) || (hasPermission === true);

  if (!canScan && hasPermission === false) {
    return (
      <View style={[baseStyles.container, { backgroundColor: colors.background }]}>
        <View style={baseStyles.permissionContainer}>
          <MaterialCommunityIcons
            name="camera-off"
            size={64}
            color={colors.textSecondary}
            style={baseStyles.permissionIcon}
          />
          <Text
            variant="headlineSmall"
            style={[baseStyles.permissionTitle, { color: colors.text }]}
          >
            Quyền truy cập camera
          </Text>
          <Text
            variant="bodyMedium"
            style={[baseStyles.permissionText, { color: colors.textSecondary }]}
          >
            Ứng dụng cần quyền truy cập camera để quét mã QR đăng nhập
          </Text>
          <Button
            mode="contained"
            onPress={async () => {
              try {
                if (useCameraPermissions && cameraPermissions[1]) {
                  const requestPerm = cameraPermissions[1];
                  const result = await requestPerm();
                  setPermission(result);
                  setHasPermission(result.granted);
                } else if (requestPermissionsAsync) {
                  const { status } = await requestPermissionsAsync();
                  setHasPermission(status === 'granted');
                  setPermission({ granted: status === 'granted', status });
                }
              } catch (e) {
                console.error('Permission request error:', e);
                Alert.alert('Lỗi', 'Không thể yêu cầu quyền camera. Vui lòng kiểm tra cài đặt.');
              }
            }}
            style={baseStyles.permissionButton}
            buttonColor={colors.primary}
          >
            Cấp quyền
          </Button>
          <Button
            mode="outlined"
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Profile');
              }
            }}
            style={baseStyles.cancelButton}
            textColor={colors.text}
          >
            Hủy
          </Button>
        </View>
      </View>
    );
  }

  // Render camera view
  return (
    <View style={dynamicStyles.container}>
      {CameraView ? (
        <CameraView
          style={dynamicStyles.camera}
          facing={CameraType?.back}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
        <View style={dynamicStyles.overlay}>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <TouchableOpacity
              style={dynamicStyles.backButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Profile');
                }
              }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={dynamicStyles.headerTitle}>Quét mã QR đăng nhập</Text>
            <View style={dynamicStyles.headerSpacer} />
          </View>

          {/* Scanning area */}
          <View style={dynamicStyles.scanArea}>
            <View style={dynamicStyles.scanFrame}>
              <View style={[dynamicStyles.corner, dynamicStyles.topLeft]} />
              <View style={[dynamicStyles.corner, dynamicStyles.topRight]} />
              <View style={[dynamicStyles.corner, dynamicStyles.bottomLeft]} />
              <View style={[dynamicStyles.corner, dynamicStyles.bottomRight]} />
            </View>
          </View>

          {/* Instructions */}
          <View style={dynamicStyles.instructions}>
            <Text style={dynamicStyles.instructionText}>
              Đặt mã QR trong khung để quét
            </Text>
            <Text style={dynamicStyles.instructionSubtext}>
              Mở trang đăng nhập trên PC và quét mã QR hiển thị
            </Text>
          </View>

          {/* Processing overlay */}
          {isProcessing && (
            <View style={dynamicStyles.processingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={dynamicStyles.processingText}>Đang xử lý...</Text>
            </View>
          )}
        </View>
      </CameraView>
      ) : BarCodeScanner ? (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={dynamicStyles.camera}
          barCodeTypes={BarCodeScanner.Constants?.BarCodeType ? [BarCodeScanner.Constants.BarCodeType.qr] : ['qr']}
        >
          <View style={dynamicStyles.overlay}>
            {/* Header */}
            <View style={dynamicStyles.header}>
              <TouchableOpacity
                style={dynamicStyles.backButton}
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate('Profile');
                  }
                }}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={dynamicStyles.headerTitle}>Quét mã QR đăng nhập</Text>
              <View style={dynamicStyles.headerSpacer} />
            </View>

            {/* Scanning area */}
            <View style={dynamicStyles.scanArea}>
              <View style={dynamicStyles.scanFrame}>
                <View style={[dynamicStyles.corner, dynamicStyles.topLeft]} />
                <View style={[dynamicStyles.corner, dynamicStyles.topRight]} />
                <View style={[dynamicStyles.corner, dynamicStyles.bottomLeft]} />
                <View style={[dynamicStyles.corner, dynamicStyles.bottomRight]} />
              </View>
            </View>

            {/* Instructions */}
            <View style={dynamicStyles.instructions}>
              <Text style={dynamicStyles.instructionText}>
                Đặt mã QR trong khung để quét
              </Text>
              <Text style={dynamicStyles.instructionSubtext}>
                Mở trang đăng nhập trên PC và quét mã QR hiển thị
              </Text>
            </View>

            {/* Processing overlay */}
            {isProcessing && (
              <View style={dynamicStyles.processingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={dynamicStyles.processingText}>Đang xử lý...</Text>
              </View>
            )}
          </View>
        </BarCodeScanner>
      ) : (
        <View style={[dynamicStyles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <MaterialCommunityIcons name="camera-off" size={64} color={colors.textSecondary} />
          <Text style={[dynamicStyles.instructionText, { color: colors.text, marginTop: 16 }]}>
            Camera không khả dụng
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={[baseStyles.permissionButton, { marginTop: 24 }]}
            buttonColor={colors.primary}
          >
            Quay lại
          </Button>
        </View>
      )}

      {/* QR Login Confirmation Modal */}
      <QRLoginConfirmModal
        visible={showConfirmModal}
        deviceInfo={deviceInfo}
        onConfirm={handleConfirmLogin}
        onReject={handleRejectLogin}
        isProcessing={isProcessing}
      />
    </View>
  );
};

const createStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    camera: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: insets.top + 8,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#fff',
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    scanArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scanFrame: {
      width: 250,
      height: 250,
      position: 'relative',
    },
    corner: {
      position: 'absolute',
      width: 30,
      height: 30,
      borderColor: '#fff',
    },
    topLeft: {
      top: 0,
      left: 0,
      borderTopWidth: 4,
      borderLeftWidth: 4,
    },
    topRight: {
      top: 0,
      right: 0,
      borderTopWidth: 4,
      borderRightWidth: 4,
    },
    bottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
    },
    bottomRight: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 4,
      borderRightWidth: 4,
    },
    instructions: {
      paddingHorizontal: 32,
      paddingBottom: insets.bottom + 32,
      alignItems: 'center',
    },
    instructionText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
      marginBottom: 8,
      textAlign: 'center',
    },
    instructionSubtext: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
    processingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    processingText: {
      marginTop: 16,
      fontSize: 16,
      color: '#fff',
      fontWeight: '500',
    },
    permissionContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    permissionIcon: {
      marginBottom: 24,
    },
    permissionTitle: {
      marginBottom: 12,
      textAlign: 'center',
    },
    permissionText: {
      marginBottom: 32,
      textAlign: 'center',
    },
    permissionButton: {
      marginBottom: 16,
      minWidth: 200,
    },
    cancelButton: {
      minWidth: 200,
    },
  });

export default QRScannerScreen;


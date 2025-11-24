import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export interface DeviceInfo {
  device?: string;
  deviceType?: string;
  browser?: string;
  browserVersion?: string;
  version?: string;
  os?: string;
  osName?: string;
  ip?: string;
  location?: string;
}

export interface QRLoginConfirmModalProps {
  visible: boolean;
  deviceInfo: DeviceInfo | null;
  onConfirm: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

const QRLoginConfirmModal: React.FC<QRLoginConfirmModalProps> = ({
  visible,
  deviceInfo,
  onConfirm,
  onReject,
  isProcessing = false,
}) => {
  const { isDarkMode, colors } = useTheme();

  if (!deviceInfo) {
    return null;
  }

  // Format device string
  const deviceType = deviceInfo.device || deviceInfo.deviceType || 'Desktop';
  const browser = deviceInfo.browser || 'Chrome';
  const browserVersion = deviceInfo.browserVersion || deviceInfo.version || 'Unknown';
  const os = deviceInfo.os || deviceInfo.osName || 'Windows';
  const deviceString = `${deviceType} - ${browser} - ${browserVersion} - ${os}`;

  // Format IP address (can be multiple IPs separated by comma)
  const ipAddress = deviceInfo.ip || 'Unknown';
  const location = deviceInfo.location || 'Unknown';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onReject}
      statusBarTranslucent
    >
      <Pressable
        style={[
          styles.modalOverlay,
          { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }
        ]}
        onPress={onReject}
      >
        <Pressable
          style={[
            styles.modalContent,
            {
              backgroundColor: isDarkMode ? '#1c1c1e' : '#FFFFFF',
            }
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <Text style={[
            styles.title,
            { color: isDarkMode ? '#ffffff' : '#000000' }
          ]}>
            Thiết bị mới
          </Text>

          {/* Device Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="monitor"
              size={64}
              color={isDarkMode ? '#ffffff' : '#000000'}
            />
          </View>

          {/* Question */}
          <Text style={[
            styles.question,
            { color: isDarkMode ? '#a1a1a6' : '#6b6b6b' }
          ]}>
            Đăng nhập ChatX bằng mã QR?
          </Text>

          {/* Device Info Card */}
          <View style={[
            styles.infoCard,
            {
              backgroundColor: isDarkMode ? '#2c2c2e' : '#FFFFFF',
              borderColor: isDarkMode ? '#38383a' : '#E5E5EA',
            }
          ]}>
            {/* Device */}
            <View style={styles.infoRow}>
              <Text style={[
                styles.infoLabel,
                { color: isDarkMode ? '#a1a1a6' : '#6b6b6b' }
              ]}>
                Thiết bị
              </Text>
              <Text style={[
                styles.infoValue,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                {deviceString}
              </Text>
            </View>

            {/* IP Address */}
            <View style={styles.infoRow}>
              <Text style={[
                styles.infoLabel,
                { color: isDarkMode ? '#a1a1a6' : '#6b6b6b' }
              ]}>
                Địa chỉ IP
              </Text>
              <Text style={[
                styles.infoValue,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                {ipAddress}
              </Text>
            </View>

            {/* Location */}
            <View style={styles.infoRow}>
              <Text style={[
                styles.infoLabel,
                { color: isDarkMode ? '#a1a1a6' : '#6b6b6b' }
              ]}>
                Địa điểm truy cập
              </Text>
              <Text style={[
                styles.infoValue,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                {location}
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Login Button */}
            <Pressable
              onPress={onConfirm}
              disabled={isProcessing}
              style={({ pressed }) => [
                styles.loginButton,
                {
                  backgroundColor: isDarkMode ? '#ffffff' : '#000000',
                  opacity: (isProcessing || pressed) ? 0.6 : 1,
                }
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={isDarkMode ? '#000000' : '#FFFFFF'} />
              ) : (
                <Text style={[
                  styles.loginButtonText,
                  { color: isDarkMode ? '#000000' : '#FFFFFF' }
                ]}>
                  Đăng nhập
                </Text>
              )}
            </Pressable>

            {/* Reject Button */}
            <Pressable
              onPress={onReject}
              disabled={isProcessing}
              style={({ pressed }) => [
                styles.rejectButton,
                {
                  backgroundColor: isDarkMode ? '#2c2c2e' : '#FFFFFF',
                  borderColor: isDarkMode ? '#38383a' : '#E5E5EA',
                  opacity: (isProcessing || pressed) ? 0.6 : 1,
                }
              ]}
            >
              <Text style={[
                styles.rejectButtonText,
                { color: '#FF3B30' }
              ]}>
                Từ chối
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoRowLast: {
    marginBottom: 0,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '400',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRLoginConfirmModal;


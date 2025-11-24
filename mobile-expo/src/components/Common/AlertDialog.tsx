import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export interface AlertDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  type?: 'error' | 'success' | 'info' | 'warning';
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  visible,
  title,
  message,
  onConfirm,
  confirmText = 'OK',
  type = 'info',
}) => {
  const { isDarkMode, colors } = useTheme();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  // Màu nút dựa trên type
  const getButtonColor = () => {
    switch (type) {
      case 'error':
        return '#007AFF'; // Blue như iOS
      case 'success':
        return '#34C759'; // Green
      case 'warning':
        return '#FF9500'; // Orange
      default:
        return '#007AFF'; // Blue mặc định
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleConfirm}
      statusBarTranslucent
    >
      <Pressable 
        style={[
          styles.modalOverlay,
          { backgroundColor: 'rgba(0, 0, 0, 0.5)' } // Consistent overlay
        ]} 
        onPress={handleConfirm}
      >
        <Pressable 
          style={[
            styles.alertDialog,
            { 
              backgroundColor: isDarkMode ? '#2c2c2e' : '#2c2c2e', // Dark grey like in image
            }
          ]} 
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.contentContainer}>
            <Text style={[
              styles.alertTitle,
              { color: '#ffffff' } // Always white like in image
            ]}>
              {title}
            </Text>
            <Text style={[
              styles.alertMessage,
              { color: '#ffffff' } // Always white like in image
            ]}>
              {message}
            </Text>
          </View>
          <View style={[
            styles.alertButtonContainer,
            { borderTopColor: '#38383a' } // Dark border
          ]}>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.alertButton,
                pressed && styles.alertButtonPressed
              ]}
            >
              <Text style={[
                styles.alertButtonText,
                { color: '#ffffff' } // White text like in image
              ]}>
                {confirmText}
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
  alertDialog: {
    borderRadius: 14,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  alertButtonContainer: {
    borderTopWidth: 0.5,
    flexDirection: 'column',
  },
  alertButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  alertButtonPressed: {
    opacity: 0.6,
  },
  alertButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});

export default AlertDialog;


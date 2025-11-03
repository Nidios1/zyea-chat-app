import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface UpdateModalProps {
  visible: boolean;
  onUpdate: () => void;
  onCancel?: () => void;
  title?: string;
  message?: string;
  updateButtonText?: string;
  cancelButtonText?: string;
}

/**
 * Modal thông báo có phiên bản mới - Giống design trong ảnh
 */
export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  onUpdate,
  onCancel,
  title = 'Ứng dụng đã có phiên bản mới',
  message = 'Bạn vui lòng cập nhật Ứng dụng lên phiên bản mới nhất. Nếu không cập nhật, Bạn sẽ không chạy được phiên bản hiện tại trên điện thoại',
  updateButtonText = 'Cập nhật',
  cancelButtonText = 'Để sau',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon với megaphone và sound waves */}
          <View style={styles.iconContainer}>
            <View style={styles.megaphoneContainer}>
              <Text style={styles.megaphoneIcon}>📢</Text>
              {/* Sound waves */}
              <View style={styles.soundWaves}>
                <View style={[styles.wave, styles.wave1]} />
                <View style={[styles.wave, styles.wave2]} />
                <View style={[styles.wave, styles.wave3]} />
              </View>
              {/* Confetti */}
              <View style={styles.confetti}>
                <View style={[styles.confettiPiece, styles.confetti1]} />
                <View style={[styles.confettiPiece, styles.confetti2]} />
                <View style={[styles.confettiPiece, styles.confetti3]} />
                <View style={[styles.confettiPiece, styles.confetti4]} />
              </View>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {onCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{cancelButtonText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.updateButton}
              onPress={onUpdate}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF8C00', '#FF6B00']}
                style={styles.updateButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.updateButtonText}>{updateButtonText}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  megaphoneContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  megaphoneIcon: {
    fontSize: 48,
    zIndex: 2,
  },
  soundWaves: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 50,
    opacity: 0.3,
  },
  wave1: {
    width: 60,
    height: 60,
    borderColor: '#FF8C00',
    top: 20,
    left: 20,
  },
  wave2: {
    width: 80,
    height: 80,
    borderColor: '#FFB84D',
    top: 10,
    left: 10,
  },
  wave3: {
    width: 100,
    height: 100,
    borderColor: '#FFD9A6',
    top: 0,
    left: 0,
  },
  confetti: {
    position: 'absolute',
    width: 120,
    height: 120,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confetti1: {
    backgroundColor: '#FF8C00',
    top: 10,
    left: 20,
  },
  confetti2: {
    backgroundColor: '#FFB84D',
    top: 30,
    right: 15,
  },
  confetti3: {
    backgroundColor: '#FF6B00',
    bottom: 20,
    left: 10,
  },
  confetti4: {
    backgroundColor: '#FFD9A6',
    bottom: 10,
    right: 25,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  updateButton: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  updateButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
});


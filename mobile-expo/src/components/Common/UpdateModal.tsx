import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface UpdateModalProps {
  visible: boolean;
  onUpdate: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  title?: string;
  message?: string;
  updateButtonText?: string;
  cancelButtonText?: string;
  isDownloading?: boolean;
  downloadProgress?: number;
  error?: string | null;
  showProgress?: boolean;
}

/**
 * Modal thông báo có phiên bản mới - Giống design trong ảnh
 * Hỗ trợ hiển thị progress download và error handling
 */
export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  onUpdate,
  onCancel,
  onRetry,
  title = 'Ứng dụng đã có phiên bản mới',
  message = 'Bạn vui lòng cập nhật Ứng dụng lên phiên bản mới nhất. Nếu không cập nhật, Bạn sẽ không chạy được phiên bản hiện tại trên điện thoại',
  updateButtonText = 'Cập nhật',
  cancelButtonText = 'Để sau',
  isDownloading = false,
  downloadProgress = 0,
  error = null,
  showProgress = true,
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
              {/* Megaphone Icon - Custom design giống ảnh */}
              <View style={styles.megaphoneIcon}>
                {/* Megaphone body - hình thang mở rộng */}
                <View style={styles.megaphoneBody}>
                  <View style={styles.megaphoneBodyInner} />
                </View>
                {/* Megaphone handle - màu cam */}
                <View style={styles.megaphoneHandle} />
                {/* Megaphone opening - hình tròn cong */}
                <View style={styles.megaphoneOpening} />
                {/* Orange circle near mouthpiece */}
                <View style={styles.megaphoneCircle} />
              </View>
              
              {/* Sound waves - 3 orange arcs */}
              <View style={styles.soundWaves}>
                <View style={[styles.wave, styles.wave1]} />
                <View style={[styles.wave, styles.wave2]} />
                <View style={[styles.wave, styles.wave3]} />
              </View>
              
              {/* Confetti pieces */}
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

          {/* Message - Left aligned như trong ảnh */}
          <Text style={styles.message}>{message}</Text>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              {onRetry && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={onRetry}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Download Progress */}
          {isDownloading && showProgress && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color="#FF8C00" />
              <Text style={styles.progressText}>
                Đang tải cập nhật... {downloadProgress > 0 ? `${Math.round(downloadProgress)}%` : ''}
              </Text>
              {downloadProgress > 0 && (
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
                </View>
              )}
            </View>
          )}

          {/* Button - Chỉ có nút Cập nhật, không có Cancel như trong ảnh */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.updateButton, (isDownloading || error) && styles.updateButtonDisabled]}
              onPress={onUpdate}
              activeOpacity={0.8}
              disabled={isDownloading || !!error}
            >
              <LinearGradient
                colors={isDownloading || error ? ['#CCCCCC', '#AAAAAA'] : ['#FF8C00', '#FF6B00']}
                style={styles.updateButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isDownloading ? (
                  <View style={styles.updateButtonContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonLoader} />
                    <Text style={styles.updateButtonText}>Đang tải...</Text>
                  </View>
                ) : (
                  <Text style={styles.updateButtonText}>{updateButtonText}</Text>
                )}
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
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  megaphoneContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  megaphoneIcon: {
    position: 'absolute',
    width: 70,
    height: 55,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  megaphoneBody: {
    position: 'absolute',
    width: 40,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#1A1A1A',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    left: 15,
    top: 10,
    transform: [{ skewY: '-2deg' }],
  },
  megaphoneBodyInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  megaphoneHandle: {
    position: 'absolute',
    width: 10,
    height: 14,
    backgroundColor: '#FF8C00',
    borderRadius: 3,
    right: 10,
    top: 16,
    transform: [{ rotate: '-5deg' }],
  },
  megaphoneOpening: {
    position: 'absolute',
    width: 24,
    height: 24,
    left: 8,
    top: 8,
    borderWidth: 2.5,
    borderColor: '#1A1A1A',
    borderRightWidth: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  megaphoneCircle: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF8C00',
    left: 6,
    top: 18,
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
    textAlign: 'left', // Left aligned như trong ảnh
    lineHeight: 20,
    marginBottom: 24,
    width: '100%',
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
  errorContainer: {
    width: '100%',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF3F3',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  progressText: {
    color: '#666666',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF8C00',
    borderRadius: 2,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoader: {
    marginRight: 8,
  },
});


import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Modal, TextInput, Button, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { feedbackAPI } from '../../utils/api';
import { spacing, typography, borderRadius } from '../../config/designTokens';
import Toast from 'react-native-toast-message';

interface ReportUserModalProps {
  visible: boolean;
  onClose: () => void;
  reportedUserId: string | number;
  reportedUserName?: string;
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam hoặc lừa đảo', icon: 'alert-circle' },
  { id: 'harassment', label: 'Quấy rối hoặc bắt nạt', icon: 'account-alert' },
  { id: 'inappropriate', label: 'Nội dung không phù hợp', icon: 'content-copy' },
  { id: 'fake', label: 'Tài khoản giả mạo', icon: 'account-off' },
  { id: 'violence', label: 'Bạo lực hoặc đe dọa', icon: 'shield-alert' },
  { id: 'other', label: 'Lý do khác', icon: 'dots-horizontal' },
];

export function ReportUserModal({
  visible,
  onClose,
  reportedUserId,
  reportedUserName,
}: ReportUserModalProps) {
  const { colors, isDarkMode } = useTheme();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng chọn lý do báo cáo',
      });
      return;
    }

    if (selectedReason === 'other' && !description.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng mô tả lý do báo cáo',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const reasonText = REPORT_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;
      const content = selectedReason === 'other'
        ? `Báo cáo tài khoản: ${reasonText}\n\nMô tả: ${description.trim()}`
        : `Báo cáo tài khoản: ${reasonText}${description.trim() ? '\n\nMô tả thêm: ' + description.trim() : ''}`;

      await feedbackAPI.submitFeedback(
        content,
        'report',
        null,
        reportedUserId
      );

      Toast.show({
        type: 'success',
        text1: 'Đã gửi báo cáo',
        text2: 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét và xử lý.',
      });

      // Reset form
      setSelectedReason('');
      setDescription('');
      onClose();
    } catch (error: any) {
      console.error('Error reporting user:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error?.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại sau.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: colors.surface }
        ]}
        style={styles.modal}
      >
        <ScrollView>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Báo cáo tài khoản
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isSubmitting}
              style={styles.closeButton}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {reportedUserName && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Bạn đang báo cáo: {reportedUserName}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>
            Vui lòng chọn lý do báo cáo:
          </Text>

          <View style={styles.reasonsContainer}>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonButton,
                  {
                    backgroundColor: selectedReason === reason.id
                      ? colors.primary + '20'
                      : colors.background,
                    borderColor: selectedReason === reason.id
                      ? colors.primary
                      : colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  },
                ]}
                onPress={() => setSelectedReason(reason.id)}
                disabled={isSubmitting}
              >
                <MaterialCommunityIcons
                  name={reason.icon as any}
                  size={20}
                  color={selectedReason === reason.id ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.reasonText,
                    {
                      color: selectedReason === reason.id ? colors.primary : colors.text,
                      fontWeight: selectedReason === reason.id ? '600' : '400',
                    },
                  ]}
                >
                  {reason.label}
                </Text>
                {selectedReason === reason.id && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={colors.primary}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: spacing.md }]}>
            Mô tả thêm (tùy chọn):
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="Cung cấp thêm thông tin về vấn đề này..."
            style={styles.input}
            disabled={isSubmitting}
            theme={{ colors: { primary: colors.primary } }}
          />

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={handleClose}
              disabled={isSubmitting}
              style={styles.button}
            >
              Hủy
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || !selectedReason}
              style={styles.button}
            >
              Gửi báo cáo
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    zIndex: 9999,
    elevation: 9999,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  reasonsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  reasonText: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  input: {
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
  },
});


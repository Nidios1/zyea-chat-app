import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Modal, Portal, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, typography, borderRadius } from '../../config/designTokens';

interface VerificationModalProps {
  visible: boolean;
  onClose: () => void;
  isVerified: boolean;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

export function VerificationModal({
  visible,
  onClose,
  isVerified,
  verifiedBy,
  verifiedAt,
}: VerificationModalProps) {
  const { colors, isDarkMode } = useTheme();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: colors.surface }
        ]}
      >
        <ScrollView>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons
                name="check-circle"
                size={32}
                color="#1DA1F2"
                style={styles.verifiedIcon}
              />
              <Text style={[styles.title, { color: colors.text }]}>
                {isVerified ? 'Đã được xác minh' : 'Chưa được xác minh'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {isVerified ? (
              <>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  Tài khoản này có dấu tích vì nó được xác minh bởi nguồn đáng tin cậy.
                </Text>

                {verifiedBy && (
                  <>
                    <Text style={[styles.label, { color: colors.text, marginTop: spacing.md }]}>
                      Xác minh bởi:
                    </Text>
                    <View style={styles.verifiedByContainer}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color="#1DA1F2"
                      />
                      <Text style={[styles.verifiedByText, { color: colors.text }]}>
                        {verifiedBy}
                      </Text>
                    </View>
                  </>
                )}

                {verifiedAt && (
                  <Text style={[styles.dateText, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                    {formatDate(verifiedAt)}
                  </Text>
                )}
              </>
            ) : (
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Tài khoản này chưa được xác minh. Bạn có thể gửi yêu cầu xác minh trong phần cài đặt.
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={onClose}
              style={[styles.button, { backgroundColor: colors.primary }]}
              labelStyle={{ color: '#FFFFFF' }}
            >
              Đóng
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  verifiedIcon: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * 1.5,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  verifiedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  verifiedByText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
  },
  actions: {
    marginTop: spacing.md,
  },
  button: {
    paddingVertical: spacing.xs,
  },
});


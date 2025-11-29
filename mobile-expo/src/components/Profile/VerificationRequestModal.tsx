import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking } from 'react-native';
import { Text, Modal, Portal, TextInput, Button, Checkbox } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { verificationAPI, uploadAPI } from '../../utils/api';
import { launchImageLibrary } from '../../utils/imagePicker';
import { spacing, typography, borderRadius } from '../../config/designTokens';
import Toast from 'react-native-toast-message';

interface VerificationRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { id: 'individual', label: 'Cá nhân', icon: 'account' },
  { id: 'organization', label: 'Tổ chức', icon: 'office-building' },
  { id: 'brand', label: 'Thương hiệu', icon: 'store' },
  { id: 'public_figure', label: 'Nhân vật công chúng', icon: 'star' },
  { id: 'other', label: 'Khác', icon: 'dots-horizontal' },
];

export function VerificationRequestModal({
  visible,
  onClose,
  onSuccess,
}: VerificationRequestModalProps) {
  const { colors, isDarkMode } = useTheme();
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState<'individual' | 'organization' | 'brand' | 'public_figure' | 'other'>('individual');
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState('');
  const [idCardImage, setIdCardImage] = useState<string | null>(null);
  const [idCardImageUri, setIdCardImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickIdCard = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (response.didCancel || !response.assets?.[0]?.uri) {
        if (response.didCancel) {
          // User cancelled, no error needed
          return;
        }
        Toast.show({ type: 'error', text1: 'Không thể chọn ảnh' });
        return;
      }

      const imageUri = response.assets[0].uri;
      console.log('📸 Selected image URI:', imageUri);
      setIdCardImageUri(imageUri);
      setIsUploadingImage(true);

      // Upload image - sử dụng format giống EditProfileScreen
      const formData = new FormData();
      // Format cho React Native
      const filename = imageUri.split('/').pop() || 'id_card.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: imageUri,
        type: type,
        name: filename,
      } as any);

      console.log('📤 Uploading image...');
      const uploadResult = await uploadAPI.uploadImage(formData);
      console.log('✅ Upload result:', uploadResult);
      
      if (uploadResult.data?.url || uploadResult.data?.imageUrl) {
        const imageUrl = uploadResult.data?.url || uploadResult.data?.imageUrl;
        setIdCardImage(imageUrl);
        Toast.show({ type: 'success', text1: 'Đã tải ảnh lên thành công' });
      } else {
        console.error('❌ Upload failed - no URL in response:', uploadResult);
        throw new Error('Upload failed - no URL returned');
      }
    } catch (error: any) {
      console.error('❌ Error picking/uploading ID card image:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.';
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: errorMessage,
      });
      setIdCardImageUri(null);
      setIdCardImage(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveIdCard = () => {
    Alert.alert(
      'Xóa ảnh',
      'Bạn có chắc chắn muốn xóa ảnh này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setIdCardImage(null);
            setIdCardImageUri(null);
          },
        },
      ]
    );
  };

  const handleOpenTerms = () => {
    // Mở link điều khoản - có thể là webview hoặc external browser
    const termsUrl = 'https://zyea.com/terms/verification'; // Thay bằng URL thực tế
    Linking.openURL(termsUrl).catch((err) => {
      console.error('Error opening terms URL:', err);
      Toast.show({
        type: 'error',
        text1: 'Không thể mở liên kết',
        text2: 'Vui lòng kiểm tra kết nối internet',
      });
    });
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập tên đầy đủ' });
      return;
    }

    if (!reason.trim()) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập lý do xác minh' });
      return;
    }

    if (reason.trim().length < 20) {
      Toast.show({ type: 'error', text1: 'Lý do phải có ít nhất 20 ký tự' });
      return;
    }

    if (!idCardImage) {
      Toast.show({ type: 'error', text1: 'Vui lòng tải lên ảnh hộ chiếu hoặc CCCD' });
      return;
    }

    if (!email.trim()) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập email' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Toast.show({ type: 'error', text1: 'Email không hợp lệ' });
      return;
    }

    if (!agreedToTerms) {
      Toast.show({ type: 'error', text1: 'Vui lòng đọc và đồng ý với điều khoản xác minh' });
      return;
    }

    setIsSubmitting(true);
    try {
      await verificationAPI.submitRequest({
        full_name: fullName.trim(),
        category,
        reason: reason.trim(),
        email: email.trim(),
        id_card_image: idCardImage,
      });

      Toast.show({
        type: 'success',
        text1: 'Yêu cầu đã được gửi',
        text2: 'Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất',
      });

      // Reset form
      setFullName('');
      setCategory('individual');
      setReason('');
      setEmail('');
      setIdCardImage(null);
      setIdCardImageUri(null);
      setAgreedToTerms(false);

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error submitting verification request:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error?.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại sau.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
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
      >
        <ScrollView>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Yêu cầu xác minh tài khoản
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

          <View style={styles.content}>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Gửi yêu cầu xác minh tài khoản của bạn. Admin sẽ xem xét và phản hồi trong thời gian sớm nhất.
            </Text>

            <Text style={[styles.label, { color: colors.text, marginTop: spacing.md }]}>
              Tên đầy đủ <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              placeholder="Nhập tên đầy đủ của bạn"
              style={[styles.input, { backgroundColor: colors.background }]}
              theme={{ colors: { text: colors.text, primary: colors.primary, placeholder: colors.textSecondary } }}
              disabled={isSubmitting}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: spacing.md }]}>
              Loại tài khoản <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: category === cat.id
                        ? colors.primary + '20'
                        : colors.background,
                      borderColor: category === cat.id
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => setCategory(cat.id as any)}
                  disabled={isSubmitting}
                >
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={20}
                    color={category === cat.id ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color: category === cat.id ? colors.primary : colors.text,
                        fontWeight: category === cat.id ? '600' : '400',
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                  {category === cat.id && (
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
              Lý do xác minh <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              (Tối thiểu 20 ký tự)
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Giải thích tại sao bạn cần xác minh tài khoản..."
              style={[styles.input, styles.textArea, { backgroundColor: colors.background }]}
              theme={{ colors: { text: colors.text, primary: colors.primary, placeholder: colors.textSecondary } }}
              disabled={isSubmitting}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: spacing.md }]}>
              Ảnh hộ chiếu hoặc CCCD <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Vui lòng tải lên ảnh rõ ràng, đầy đủ thông tin của hộ chiếu hoặc CCCD
            </Text>
            {idCardImageUri || idCardImage ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: idCardImageUri || idCardImage || '' }}
                  style={styles.idCardImage}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                  onPress={handleRemoveIdCard}
                  disabled={isSubmitting || isUploadingImage}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={handlePickIdCard}
                disabled={isSubmitting || isUploadingImage}
              >
                {isUploadingImage ? (
                  <>
                    <MaterialCommunityIcons name="loading" size={24} color={colors.primary} />
                    <Text style={[styles.uploadButtonText, { color: colors.text }]}>
                      Đang tải lên...
                    </Text>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons name="camera-plus" size={24} color={colors.primary} />
                    <Text style={[styles.uploadButtonText, { color: colors.text }]}>
                      Chọn ảnh hộ chiếu/CCCD
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <Text style={[styles.label, { color: colors.text, marginTop: spacing.md }]}>
              Email <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Email để nhận thông báo về kết quả xác minh
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              placeholder="Nhập email của bạn"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { backgroundColor: colors.background }]}
              theme={{ colors: { text: colors.text, primary: colors.primary, placeholder: colors.textSecondary } }}
              disabled={isSubmitting}
            />

            {/* Điều khoản */}
            <View style={styles.termsContainer}>
              <Checkbox
                status={agreedToTerms ? 'checked' : 'unchecked'}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                disabled={isSubmitting}
                color={colors.primary}
              />
              <View style={styles.termsTextContainer}>
                <Text style={[styles.termsText, { color: colors.text }]}>
                  Tôi đã đọc và đồng ý với{' '}
                </Text>
                <TouchableOpacity onPress={handleOpenTerms} disabled={isSubmitting}>
                  <Text style={[styles.termsLink, { color: colors.primary }]}>
                    Điều khoản xác minh tài khoản
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

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
              disabled={
                isSubmitting ||
                !fullName.trim() ||
                !reason.trim() ||
                reason.trim().length < 20 ||
                !idCardImage ||
                !agreedToTerms
              }
              style={styles.button}
            >
              Gửi yêu cầu
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
  content: {
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.5,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
  },
  input: {
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: 100,
  },
  categoriesContainer: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  categoryText: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  checkIcon: {
    marginLeft: 'auto',
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  uploadButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  idCardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  termsText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * 1.5,
  },
  termsLink: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },
});


import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput, useTheme, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { usersAPI, uploadAPI } from '../../utils/api';
import { launchImageLibrary, launchCamera } from '../../utils/imagePicker';
import { getAvatarURL, getInitials, getImageURL } from '../../utils/imageUtils';
import { spacing, typography, borderRadius } from '../../config/designTokens';
import Toast from 'react-native-toast-message';

const DISPLAY_NAME_MAX_LENGTH = 64;
const DESCRIPTION_MAX_LENGTH = 256;

const EditProfileScreen = () => {
  const theme = useTheme();
  const { user, updateUser, refreshUser } = useAuth();
  const navigation = useNavigation();
  const { colors, isDarkMode } = useAppTheme();

  // Initial values
  const initialDisplayName = user?.full_name || '';
  const initialDescription = user?.bio || '';
  const initialAvatar = user?.avatar_url || null;
  const initialBanner = user?.banner_url || null;

  // Form state
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [description, setDescription] = useState(initialDescription);
  const [userAvatar, setUserAvatar] = useState<string | null>(initialAvatar);
  const [userBanner, setUserBanner] = useState<string | null>(initialBanner);
  const [newUserAvatar, setNewUserAvatar] = useState<string | null>(null);
  const [newUserBanner, setNewUserBanner] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Check if form is dirty
  const isDirty =
    displayName !== initialDisplayName ||
    description !== initialDescription ||
    userAvatar !== initialAvatar ||
    userBanner !== initialBanner;

  // Validation
  const displayNameTooLong = displayName.length > DISPLAY_NAME_MAX_LENGTH;
  const descriptionTooLong = description.length > DESCRIPTION_MAX_LENGTH;

  // Handle banner selection
  const handleSelectBanner = useCallback(async () => {
    Alert.alert(
      'Chọn ảnh bìa',
      'Bạn muốn chọn ảnh từ đâu?',
      [
        {
          text: 'Thư viện',
          onPress: async () => {
            try {
              const response = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 1200,
                maxHeight: 400,
              });
              if (response.assets?.[0]?.uri) {
                setImageError('');
                setNewUserBanner(response.assets[0].uri);
                setUserBanner(response.assets[0].uri);
              }
            } catch (err: any) {
              setImageError('Không thể chọn ảnh từ thư viện');
            }
          },
        },
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const response = await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
              });
              if (response.assets?.[0]?.uri) {
                setImageError('');
                setNewUserBanner(response.assets[0].uri);
                setUserBanner(response.assets[0].uri);
              }
            } catch (err: any) {
              setImageError('Không thể chụp ảnh');
            }
          },
        },
        {
          text: 'Xóa ảnh',
          style: 'destructive',
          onPress: () => {
            setNewUserBanner(null);
            setUserBanner(null);
          },
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }, []);

  // Handle avatar selection
  const handleSelectAvatar = useCallback(async () => {
    Alert.alert(
      'Chọn ảnh đại diện',
      'Bạn muốn chọn ảnh từ đâu?',
      [
        {
          text: 'Thư viện',
          onPress: async () => {
            try {
              const response = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 512,
                maxHeight: 512,
              });
              if (response.assets?.[0]?.uri) {
                setImageError('');
                setNewUserAvatar(response.assets[0].uri);
                setUserAvatar(response.assets[0].uri);
              }
            } catch (err: any) {
              setImageError('Không thể chọn ảnh từ thư viện');
            }
          },
        },
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const response = await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
              });
              if (response.assets?.[0]?.uri) {
                setImageError('');
                setNewUserAvatar(response.assets[0].uri);
                setUserAvatar(response.assets[0].uri);
              }
            } catch (err: any) {
              setImageError('Không thể chụp ảnh');
            }
          },
        },
        {
          text: 'Xóa ảnh',
          style: 'destructive',
          onPress: () => {
            setNewUserAvatar(null);
            setUserAvatar(null);
          },
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (displayNameTooLong || descriptionTooLong) {
      setError('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setLoading(true);
    setError('');
    setImageError('');

    try {
      // Upload banner first if changed
      if (newUserBanner !== null) {
        setUploadingBanner(true);
        try {
          const formData = new FormData();
          formData.append('banner', {
            uri: newUserBanner || '',
            type: 'image/jpeg',
            name: 'banner.jpg',
          } as any);

          // Use uploadImage as fallback if uploadBanner doesn't exist
          const response = await uploadAPI.uploadImage(formData);
          if (response.data?.url || response.data?.path) {
            // Banner uploaded successfully
          }
        } catch (bannerError: any) {
          setImageError(bannerError.response?.data?.message || 'Không thể tải ảnh bìa lên');
          setUploadingBanner(false);
          setLoading(false);
          return;
        }
        setUploadingBanner(false);
      }

      // Upload avatar if changed
      if (newUserAvatar) {
        setUploadingAvatar(true);
        try {
          const formData = new FormData();
          formData.append('avatar', {
            uri: newUserAvatar,
            type: 'image/jpeg',
            name: 'avatar.jpg',
          } as any);

          await uploadAPI.uploadAvatar(formData);
        } catch (avatarError: any) {
          setImageError(avatarError.response?.data?.message || 'Không thể tải ảnh đại diện lên');
          setUploadingAvatar(false);
          setLoading(false);
          return;
        }
        setUploadingAvatar(false);
      }

      // Update profile
      const updateData: any = {
        full_name: displayName.trim(),
        bio: description.trim(),
      };

      if (newUserBanner !== null) {
        // Include banner update if changed
        updateData.banner_url = newUserBanner ? 'updated' : null;
      }

      await usersAPI.updateProfile(updateData);

      // Refresh user data
      try {
        await refreshUser();
      } catch (refreshError) {
        console.error('Error refreshing user data:', refreshError);
        // Fallback: update user locally with known changes
        updateUser({
          full_name: displayName.trim(),
          bio: description.trim(),
          ...(newUserAvatar && { avatar_url: newUserAvatar }),
          ...(newUserBanner !== null && { banner_url: newUserBanner }),
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Đã cập nhật hồ sơ',
      });

      navigation.goBack();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
      setUploadingAvatar(false);
      setUploadingBanner(false);
    }
  }, [
    displayName,
    description,
    newUserAvatar,
    newUserBanner,
    displayNameTooLong,
    descriptionTooLong,
    navigation,
    refreshUser,
    updateUser,
  ]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (isDirty) {
      Alert.alert(
        'Hủy thay đổi?',
        'Bạn có chắc chắn muốn hủy các thay đổi?',
        [
          {
            text: 'Tiếp tục chỉnh sửa',
            style: 'cancel',
          },
          {
            text: 'Hủy bỏ',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [isDirty, navigation]);

  // Prevent back navigation if dirty
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        'Hủy thay đổi?',
        'Bạn có chắc chắn muốn rời khỏi màn hình này? Các thay đổi sẽ không được lưu.',
        [
          {
            text: 'Tiếp tục chỉnh sửa',
            style: 'cancel',
            onPress: () => {},
          },
          {
            text: 'Hủy bỏ',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isDirty]);

  const canSave = isDirty && !displayNameTooLong && !descriptionTooLong && !loading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: colors.primary || '#0084ff' }]}>Hủy bỏ</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Chỉnh sửa hồ sơ</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
            style={[styles.headerButton, !canSave && styles.headerButtonDisabled]}
          >
            <Text
              style={[
                styles.headerButtonText,
                styles.headerButtonSave,
                { color: canSave ? (colors.primary || '#0084ff') : colors.textSecondary },
              ]}
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner and Avatar Section */}
          <View style={styles.bannerSection}>
            {/* Banner */}
            <TouchableOpacity
              onPress={handleSelectBanner}
              disabled={uploadingBanner}
              style={styles.bannerContainer}
              activeOpacity={0.8}
            >
              {userBanner ? (
                <Image
                  source={{
                    uri: userBanner.startsWith('http') ? userBanner : getImageURL(userBanner),
                  }}
                  style={styles.banner}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.bannerPlaceholder, { backgroundColor: colors.border || '#e0e0e0' }]}>
                  <MaterialCommunityIcons name="image-outline" size={48} color={colors.textSecondary} />
                </View>
              )}
              <View style={[styles.bannerOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}>
                {uploadingBanner ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="camera" size={24} color="#fff" />
                )}
              </View>
            </TouchableOpacity>

            {/* Avatar - positioned over banner */}
            <View style={styles.avatarWrapper}>
              <TouchableOpacity
                onPress={handleSelectAvatar}
                disabled={uploadingAvatar}
                style={styles.avatarContainer}
                activeOpacity={0.7}
              >
                {userAvatar ? (
                  <Image
                    source={{
                      uri: userAvatar.startsWith('http') ? userAvatar : getAvatarURL(userAvatar),
                    }}
                    style={styles.avatar}
                  />
                ) : (
                  <Avatar.Text
                    size={80}
                    label={getInitials(displayName || user?.username || 'U')}
                    style={[styles.avatar, { backgroundColor: colors.primary || '#0084ff' }]}
                  />
                )}
                <View style={[styles.avatarOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialCommunityIcons name="camera" size={20} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Messages */}
          {(error || imageError) && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error || imageError}
              </Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={[styles.formSection, { marginTop: 60 }]}>
            {/* Display Name */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Tên hiển thị</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                mode="outlined"
                placeholder="e.g. Alice Lastname"
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                error={displayNameTooLong}
                style={[styles.input, { backgroundColor: colors.surface }]}
                contentStyle={{ color: colors.text }}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {displayNameTooLong && (
                <Text style={[styles.errorHint, { color: colors.error }]}>
                  Tên hiển thị quá dài. Tối đa {DISPLAY_NAME_MAX_LENGTH} ký tự.
                </Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Mô tả</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                placeholder="Kể một chút về bạn"
                multiline
                numberOfLines={4}
                maxLength={DESCRIPTION_MAX_LENGTH}
                error={descriptionTooLong}
                style={[styles.input, styles.textArea, { backgroundColor: colors.surface }]}
                contentStyle={{ color: colors.text }}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {descriptionTooLong && (
                <Text style={[styles.errorHint, { color: colors.error }]}>
                  Mô tả quá dài. Tối đa {DESCRIPTION_MAX_LENGTH} ký tự.
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  headerButton: {
    padding: spacing.xs,
    minWidth: 60,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonText: {
    fontSize: typography.fontSize.base,
  },
  headerButtonSave: {
    fontWeight: typography.fontWeight.semiBold,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  bannerSection: {
    position: 'relative',
    marginBottom: spacing.base,
  },
  bannerContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: spacing.base,
    right: spacing.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
  },
  formSection: {
    paddingHorizontal: spacing.base,
  },
  fieldContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  input: {
    marginBottom: spacing.xs,
  },
  textArea: {
    minHeight: 100,
  },
  errorHint: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
});

export default EditProfileScreen;

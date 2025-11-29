import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { useTabBar } from '../../contexts/TabBarContext';
import { newsfeedAPI, uploadAPI } from '../../utils/api';
import { getAvatarURL, getInitials } from '../../utils/imageUtils';
import { Avatar } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { isAdmin } from '../../utils/adminUtils';

const CreatePostScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDarkMode } = useAppTheme();
  const { setIsVisible } = useTabBar();
  const insets = useSafeAreaInsets();
  
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Vietnamese');
  const [interactionSetting, setInteractionSetting] = useState('Anyone can interact');
  
  // Admin có thể đăng nhiều ký tự hơn (5000), user thường giới hạn 300
  const MAX_CHARACTERS = isAdmin(user) ? 5000 : 300;
  const characterCount = content.length;
  const remainingChars = MAX_CHARACTERS - characterCount;

  // Ẩn bottom tab bar khi vào màn hình CreatePost
  useFocusEffect(
    React.useCallback(() => {
      setIsVisible(false);
      return () => {
        setIsVisible(true);
      };
    }, [setIsVisible])
  );

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Cần cấp quyền truy cập thư viện ảnh',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...newImages].slice(0, 4)); // Max 4 images like social-app-main
        setSelectedVideo(null); // Clear video if images selected
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Không thể chọn ảnh',
      });
    }
  };

  const handlePickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Cần cấp quyền truy cập thư viện video',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedVideo(result.assets[0].uri);
        setSelectedImages([]); // Clear images if video is selected
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Toast.show({
        type: 'error',
        text1: 'Không thể chọn video',
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = () => {
    setSelectedVideo(null);
  };

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSubmit = async () => {
    if (!content.trim() && selectedImages.length === 0 && !selectedVideo) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng nhập nội dung hoặc chọn ảnh/video',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedImageUrls: string[] = [];
      let uploadedVideoUrl: string | null = null;

      // Upload images first
      if (selectedImages.length > 0) {
        try {
          for (const imageUri of selectedImages) {
            const formData = new FormData();
            const imageName = imageUri.split('/').pop() || 'image.jpg';
            const imageType = imageUri.includes('.png') ? 'image/png' : 'image/jpeg';
            
            formData.append('image', {
              uri: imageUri,
              type: imageType,
              name: imageName,
            } as any);

            const uploadRes = await uploadAPI.uploadPostImage(formData);
            if (uploadRes?.data?.url) {
              uploadedImageUrls.push(uploadRes.data.url);
            } else {
              throw new Error('Không nhận được URL ảnh từ server');
            }
          }
        } catch (uploadError: any) {
          setIsSubmitting(false);
          const errorMsg = uploadError.response?.data?.message || uploadError.message || 'Không thể tải ảnh lên. Vui lòng thử lại.';
          Toast.show({
            type: 'error',
            text1: 'Tải ảnh thất bại',
            text2: errorMsg,
          });
          return;
        }
      }

      // Upload video if exists
      if (selectedVideo) {
        try {
          const formData = new FormData();
          const videoType = selectedVideo.includes('.mp4') ? 'video/mp4' : 'video/quicktime';
          const videoName = selectedVideo.split('/').pop() || 'video.mp4';
          
          formData.append('video', {
            uri: selectedVideo,
            type: videoType,
            name: videoName,
          } as any);

          const uploadRes = await uploadAPI.uploadVideo(formData);
          
          if (uploadRes?.data?.url) {
            uploadedVideoUrl = uploadRes.data.url;
          } else {
            throw new Error('Không nhận được URL video từ server');
          }
        } catch (uploadError: any) {
          setIsSubmitting(false);
          const errorMsg = uploadError.response?.data?.message || uploadError.message || 'Không thể tải video lên. Vui lòng thử lại.';
          Toast.show({
            type: 'error',
            text1: 'Tải video thất bại',
            text2: errorMsg,
          });
          return;
        }
      }

      // Create post with uploaded URLs
      await newsfeedAPI.createPost(
        content.trim(),
        uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
        uploadedVideoUrl || undefined
      );

      Toast.show({
        type: 'success',
        text1: 'Đăng bài thành công!',
      });

      setContent('');
      setSelectedImages([]);
      setSelectedVideo(null);
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating post:', error);
      Toast.show({
        type: 'error',
        text1: 'Không thể đăng bài',
        text2: error?.response?.data?.message || error?.message || 'Vui lòng thử lại',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canPost = content.trim().length > 0 || selectedImages.length > 0 || !!selectedVideo;
  const isMaxImages = selectedImages.length >= 4;
  const isMaxVideos = !!selectedVideo;
  const isMediaSelectionDisabled = isMaxImages || isMaxVideos;
  
  const styles = createStyles(colors, isDarkMode, insets);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 10 : 20}
      >
        {/* Header - Giống y hệt social-app-main */}
        <View style={styles.topbarInner}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.cancelButton}
            accessibilityLabel="Hủy bỏ"
          >
            <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
          </TouchableOpacity>
          
          <View style={styles.headerSpacer} />
          
          {isSubmitting ? (
            <>
              <Text style={styles.publishingStage}>Đang đăng...</Text>
              <View style={styles.postBtn}>
                <ActivityIndicator size="small" color={colors.primary || '#0084ff'} />
              </View>
            </>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.postBtn,
                !canPost && styles.postBtnDisabled,
                canPost && { backgroundColor: '#0084ff' } // Màu xanh primary cố định khi enabled
              ]}
              disabled={!canPost}
              accessibilityLabel="Đăng bài"
            >
              <Text style={[styles.postBtnText, !canPost && styles.postBtnTextDisabled]}>
                Đăng
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Post Container - Giống y hệt social-app-main */}
          <View style={styles.postContainer}>
            <View style={styles.avatarWrapper}>
              {user?.avatar_url ? (
                <Image
                  source={{ uri: getAvatarURL(user.avatar_url) }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text
                  size={42}
                  label={getInitials(user?.full_name || user?.username || 'U')}
                  style={styles.avatar}
                />
              )}
            </View>
            
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Có gì mới?"
                placeholderTextColor={colors.textSecondary || '#999'}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                autoFocus
                maxLength={MAX_CHARACTERS}
              />
            </View>
          </View>

          {/* Gallery - Giống social-app-main */}
          {selectedImages.length > 0 && (
            <View style={styles.gallery}>
              {selectedImages.map((uri, index) => {
                // Tính toán width dựa trên số lượng ảnh (giống social-app-main)
                const itemWidth = selectedImages.length === 1 
                  ? '100%' 
                  : selectedImages.length === 2 
                    ? '48%' 
                    : '31%';
                
                return (
                  <View 
                    key={index} 
                    style={[
                      styles.galleryItem,
                      { width: itemWidth }
                    ]}
                  >
                    <Image source={{ uri }} style={styles.galleryImage} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => handleRemoveImage(index)}
                      accessibilityLabel="Xóa ảnh"
                    >
                      <MaterialCommunityIcons name="close-circle" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* Video Preview - Giống social-app-main */}
          {selectedVideo && (
            <View style={styles.videoContainer}>
              <Image source={{ uri: selectedVideo }} style={styles.videoThumbnail} />
              <TouchableOpacity
                style={styles.removeVideoBtn}
                onPress={handleRemoveVideo}
                accessibilityLabel="Xóa video"
              >
                <MaterialCommunityIcons name="close-circle" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Interaction Settings - Giống social-app-main */}
          <View style={styles.interactionSection}>
            <TouchableOpacity
              style={styles.interactionButton}
              onPress={() => {
                // TODO: Mở dialog chọn interaction settings
                Toast.show({
                  type: 'info',
                  text1: 'Tính năng đang phát triển',
                });
              }}
              accessibilityLabel="Cài đặt tương tác"
            >
              <MaterialCommunityIcons 
                name="earth" 
                size={18} 
                color={colors.primary || '#0084ff'} 
              />
              <Text style={[styles.interactionButtonText, { color: colors.text }]}>
                {interactionSetting}
              </Text>
              <MaterialCommunityIcons 
                name="chevron-down" 
                size={16} 
                color={colors.textSecondary || '#999'} 
              />
            </TouchableOpacity>
          </View>

          {/* Footer - Giống y hệt social-app-main */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <TouchableOpacity
                style={[styles.footerButton, isMediaSelectionDisabled && styles.footerButtonDisabled]}
                onPress={handlePickImage}
                disabled={isMediaSelectionDisabled}
                accessibilityLabel="Chọn ảnh"
              >
                <MaterialCommunityIcons 
                  name="image-multiple" 
                  size={24} 
                  color={isMediaSelectionDisabled ? (colors.textSecondary || '#999') : (colors.primary || '#0084ff')} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.footerButton, isMediaSelectionDisabled && styles.footerButtonDisabled]}
                onPress={async () => {
                  try {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                      Toast.show({
                        type: 'error',
                        text1: 'Cần cấp quyền truy cập camera',
                      });
                      return;
                    }
                    const result = await ImagePicker.launchCameraAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsEditing: false,
                      quality: 0.8,
                    });
                    if (!result.canceled && result.assets && result.assets.length > 0) {
                      const newImages = result.assets.map(asset => asset.uri);
                      setSelectedImages(prev => [...prev, ...newImages].slice(0, 4));
                      setSelectedVideo(null);
                    }
                  } catch (error) {
                    console.error('Error taking picture:', error);
                    Toast.show({
                      type: 'error',
                      text1: 'Không thể mở camera',
                    });
                  }
                }}
                disabled={isMediaSelectionDisabled}
                accessibilityLabel="Chụp ảnh"
              >
                <MaterialCommunityIcons 
                  name="camera" 
                  size={24} 
                  color={isMediaSelectionDisabled ? (colors.textSecondary || '#999') : (colors.primary || '#0084ff')} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.footerButton, isMediaSelectionDisabled && styles.footerButtonDisabled]}
                onPress={handlePickVideo}
                disabled={isMediaSelectionDisabled}
                accessibilityLabel="Chọn video"
              >
                <MaterialCommunityIcons 
                  name="video" 
                  size={24} 
                  color={isMediaSelectionDisabled ? (colors.textSecondary || '#999') : (colors.primary || '#0084ff')} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.footerButton, isMediaSelectionDisabled && styles.footerButtonDisabled]}
                onPress={() => {
                  // TODO: Mở GIF picker
                  Toast.show({
                    type: 'info',
                    text1: 'Tính năng GIF đang phát triển',
                  });
                }}
                disabled={isMediaSelectionDisabled}
                accessibilityLabel="Chọn GIF"
              >
                <Text style={[styles.gifButtonText, { color: isMediaSelectionDisabled ? (colors.textSecondary || '#999') : (colors.primary || '#0084ff') }]}>
                  GIF
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.footerRight}>
              {/* Language Selection */}
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => {
                  // TODO: Mở dialog chọn ngôn ngữ
                  Toast.show({
                    type: 'info',
                    text1: 'Tính năng đang phát triển',
                  });
                }}
                accessibilityLabel="Chọn ngôn ngữ"
              >
                <Text style={[styles.languageButtonText, { color: colors.primary || '#0084ff' }]}>
                  {selectedLanguage}
                </Text>
              </TouchableOpacity>
              
              {/* Character Count - Giống social-app-main (hiển thị số còn lại) */}
              {/* Chỉ hiển thị character count nếu không phải admin hoặc nếu admin và đã gần giới hạn */}
              {(MAX_CHARACTERS <= 1000 || characterCount > MAX_CHARACTERS * 0.8) && (
                <View style={styles.charCountContainer}>
                  <Text style={[
                    styles.charCountText,
                    { 
                      color: characterCount > MAX_CHARACTERS 
                        ? '#e60000' 
                        : (remainingChars < 50 && MAX_CHARACTERS <= 1000)
                          ? '#ff9500' // Màu cam khi còn ít ký tự (chỉ cho user thường)
                          : (colors.text || (isDarkMode ? '#FFFFFF' : '#000000'))
                    }
                  ]}>
                    {remainingChars < 0 ? 0 : remainingChars}
                  </Text>
                  <View style={[
                    styles.charProgressCircle,
                    {
                      borderColor: characterCount > MAX_CHARACTERS 
                        ? '#e60000' 
                        : (remainingChars < 50 && MAX_CHARACTERS <= 1000)
                          ? '#ff9500' // Màu cam khi còn ít ký tự (chỉ cho user thường)
                          : (colors.primary || '#0084ff'),
                      backgroundColor: 'transparent',
                    }
                  ]} />
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDarkMode: boolean, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || (isDarkMode ? '#000000' : '#FFFFFF'),
  },
  keyboardView: {
    flex: 1,
  },
  // Header styles - Giống y hệt social-app-main
  topbarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8, // px_sm - giống social-app-main
    height: 54, // Giống social-app-main
    gap: 4, // gap_xs - giống social-app-main
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
  },
  cancelButton: {
    borderRadius: 20, // rounded-full - giống social-app-main
    paddingVertical: 6, // py_sm - giống social-app-main
    paddingLeft: 7, // pl_xs - giống social-app-main
    paddingRight: 7, // pr_xs - giống social-app-main
  },
  cancelButtonText: {
    fontSize: 17, // text_md - giống social-app-main
    color: colors.primary || '#0084ff',
    fontWeight: '400', // font-normal - giống social-app-main
  },
  headerSpacer: {
    flex: 1,
  },
  publishingStage: {
    fontSize: 15,
    color: colors.textSecondary || '#999',
    marginRight: 12,
  },
  postBtn: {
    borderRadius: 20, // rounded-full - giống social-app-main
    paddingHorizontal: 20, // px_lg - giống social-app-main
    paddingVertical: 6, // py_sm - giống social-app-main
    marginLeft: 12, // ml_md - giống social-app-main
    backgroundColor: '#0084ff', // Màu xanh primary cố định, không phụ thuộc vào theme
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnDisabled: {
    backgroundColor: isDarkMode 
      ? 'rgba(255, 255, 255, 0.15)' // Màu xám nhạt trong dark mode khi disabled
      : 'rgba(0, 0, 0, 0.08)', // Màu xám nhạt trong light mode khi disabled
  },
  postBtnText: {
    fontSize: 17, // text_md - giống social-app-main
    fontWeight: '600', // font-semibold - giống social-app-main
    color: '#FFFFFF', // Màu trắng luôn hiển thị rõ trên nền primary
  },
  postBtnTextDisabled: {
    color: isDarkMode 
      ? 'rgba(255, 255, 255, 0.4)' // Màu trắng mờ trong dark mode khi disabled
      : 'rgba(0, 0, 0, 0.4)', // Màu đen mờ trong light mode khi disabled
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Post container - Giống y hệt social-app-main (mx_lg = 16, mb_sm = 8)
  postContainer: {
    flexDirection: 'row',
    marginHorizontal: 16, // mx_lg
    marginBottom: 8, // mb_sm
    gap: 12, // gap giữa avatar và input
  },
  avatarWrapper: {
    marginTop: 4, // mt_xs - giống social-app-main
  },
  avatar: {
    width: 42, // size 42 - giống social-app-main
    height: 42,
    borderRadius: 21,
  },
  inputWrapper: {
    flex: 1,
    paddingTop: 4, // pt_xs - giống social-app-main
  },
  textInput: {
    fontSize: 17, // text_md - giống social-app-main
    lineHeight: 24,
    color: colors.text || (isDarkMode ? '#FFFFFF' : '#000000'),
    minHeight: 100,
    padding: 0, // Không có padding - giống social-app-main
  },
  // Gallery - Giống social-app-main (gap: IMAGE_GAP = 8, marginTop: 16)
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16, // mx_lg
    marginTop: 16, // mt_lg - giống social-app-main
    gap: 8, // IMAGE_GAP - giống social-app-main
  },
  galleryItem: {
    position: 'relative',
    flex: 1,
    minWidth: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 2,
  },
  // Video - Giống social-app-main
  videoContainer: {
    position: 'relative',
    width: '100%',
    marginHorizontal: 16, // mx_lg - giống social-app-main
    marginTop: 16, // mt_lg - giống social-app-main
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  removeVideoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 14,
    padding: 4,
  },
  // Footer - Giống y hệt social-app-main
  // Interaction Section - Giống social-app-main
  interactionSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: isDarkMode 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20, // pill-shaped
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  interactionButtonText: {
    fontSize: 15,
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    paddingVertical: 4, // py_xs
    paddingLeft: 7,
    paddingRight: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
    marginTop: 16,
    backgroundColor: colors.background || (isDarkMode ? '#000000' : '#FFFFFF'),
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // gap_xs
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerButton: {
    padding: 12, // p_sm
    borderRadius: 20, // rounded-full
  },
  footerButtonDisabled: {
    opacity: 0.5,
  },
  gifButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  languageButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  languageButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  charCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 65,
    justifyContent: 'flex-end',
  },
  charCountText: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    fontWeight: '400',
  },
  charProgressCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    backgroundColor: 'transparent', // Empty circle như trong ảnh
  },
});

export default CreatePostScreen;

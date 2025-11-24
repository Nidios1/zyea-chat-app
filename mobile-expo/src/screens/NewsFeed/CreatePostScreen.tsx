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
            accessibilityLabel="Hủy"
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
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
              style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
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
                placeholder="Bạn đang nghĩ gì?"
                placeholderTextColor={colors.textSecondary || '#999'}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                autoFocus
              />
            </View>
          </View>

          {/* Gallery - Giống social-app-main */}
          {selectedImages.length > 0 && (
            <View style={styles.gallery}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.galleryItem}>
                  <Image source={{ uri }} style={styles.galleryImage} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => handleRemoveImage(index)}
                    accessibilityLabel="Xóa ảnh"
                  >
                    <MaterialCommunityIcons name="close-circle" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
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
    paddingHorizontal: 8,
    height: 54,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
  },
  cancelButton: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 7,
    paddingRight: 7,
  },
  cancelButtonText: {
    fontSize: 17,
    color: colors.primary || '#0084ff',
    fontWeight: '400',
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
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginLeft: 12,
    backgroundColor: colors.primary || '#0084ff',
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnDisabled: {
    backgroundColor: isDarkMode 
      ? 'rgba(255, 255, 255, 0.2)' // Tăng opacity để rõ hơn trong dark mode
      : 'rgba(0, 0, 0, 0.1)',
  },
  postBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postBtnTextDisabled: {
    color: isDarkMode 
      ? 'rgba(255, 255, 255, 0.6)' // Tăng opacity text để rõ hơn
      : (colors.textSecondary || '#999'),
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
    gap: 12,
  },
  avatarWrapper: {
    marginTop: 4, // mt_xs
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  inputWrapper: {
    flex: 1,
    paddingTop: 4, // pt_xs
  },
  textInput: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.text || (isDarkMode ? '#FFFFFF' : '#000000'),
    minHeight: 100,
    padding: 0,
  },
  // Gallery - Giống social-app-main
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  galleryItem: {
    position: 'relative',
    width: '31%',
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
    marginHorizontal: 16,
    marginTop: 12,
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
  footer: {
    flexDirection: 'row',
    paddingVertical: 4,
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
    gap: 4,
  },
  footerButton: {
    padding: 12, // p_sm
    borderRadius: 20, // rounded-full
  },
  footerButtonDisabled: {
    opacity: 0.5,
  },
});

export default CreatePostScreen;

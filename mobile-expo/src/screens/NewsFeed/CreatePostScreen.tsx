import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Image,
  TextInput,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { launchImageLibrary, launchCamera } from '../../utils/imagePicker';
import { newsfeedAPI, uploadAPI } from '../../utils/api';
import { useNavigation } from '@react-navigation/native';
import { useAlert } from '../../hooks/useAlert';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials, getAvatarURL } from '../../utils/imageUtils';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';

const screenWidth = Dimensions.get('window').width;

const CreatePostScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDarkMode } = useAppTheme();
  const { showAlert, AlertComponent } = useAlert();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<{ uri: string; duration?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [privacy, setPrivacy] = useState<'public' | 'friends'>('public');
  
  // Giới hạn video ngắn: 60 giây
  const MAX_VIDEO_DURATION = 60; // seconds

  const handlePickImage = async () => {
    // Nếu đã có video, không cho chọn ảnh
    if (video) {
      showAlert('Thông báo', 'Vui lòng xóa video trước khi chọn ảnh');
      return;
    }
    
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 5,
      });
      if (response.assets) {
        const newImages = response.assets.map((asset) => asset.uri!);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  const handlePickVideo = async () => {
    // Nếu đã có ảnh, không cho chọn video
    if (images.length > 0) {
      showAlert('Thông báo', 'Vui lòng xóa ảnh trước khi chọn video');
      return;
    }
    
    try {
      const response = await launchImageLibrary({
        mediaType: 'video',
        quality: 0.8,
        selectionLimit: 1,
      });
      
      if (response.assets && response.assets.length > 0) {
        const videoAsset = response.assets[0];
        const videoUri = videoAsset.uri;
        
        if (!videoUri) {
          showAlert('Lỗi', 'Không thể lấy video');
          return;
        }
        
        // Lưu video - duration sẽ được check sau khi load vào preview
        setVideo({ uri: videoUri });
      }
    } catch (error: any) {
      console.log('Error picking video:', error);
      if (error.message?.includes('Permission')) {
        showAlert('Lỗi', 'Cần cấp quyền truy cập video');
      }
    }
  };

  const handleRecordVideo = async () => {
    // Nếu đã có ảnh, không cho quay video
    if (images.length > 0) {
      showAlert('Thông báo', 'Vui lòng xóa ảnh trước khi quay video');
      return;
    }
    
    try {
      const response = await launchCamera({
        mediaType: 'video',
        quality: 0.8,
      });
      
      if (response.assets && response.assets.length > 0) {
        const videoAsset = response.assets[0];
        const videoUri = videoAsset.uri;
        
        if (!videoUri) {
          showAlert('Lỗi', 'Không thể lấy video');
          return;
        }
        
        // Lưu video - duration sẽ được check sau khi load vào preview
        setVideo({ uri: videoUri });
      }
    } catch (error: any) {
      console.log('Error recording video:', error);
      if (error.message?.includes('Permission')) {
        showAlert('Lỗi', 'Cần cấp quyền camera');
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = () => {
    setVideo(null);
  };

  // Ref để check video duration khi load
  const videoRef = React.useRef<Video>(null);

  const handleVideoLoad = async () => {
    if (videoRef.current && video) {
      try {
        const status = await videoRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          const durationSeconds = status.durationMillis / 1000;
          
          if (durationSeconds > MAX_VIDEO_DURATION) {
            showAlert(
              'Video quá dài',
              `Video không được vượt quá ${MAX_VIDEO_DURATION} giây. Video của bạn dài ${Math.round(durationSeconds)} giây.`
            );
            setVideo(null);
            return;
          }
          
          setVideo({ ...video, duration: durationSeconds });
        }
      } catch (error) {
        console.log('Could not check video duration:', error);
      }
    }
  };

  const handlePost = async () => {
    if (!content.trim() && images.length === 0 && !video) {
      showAlert('Đăng bài thất bại', 'Vui lòng nhập nội dung, chọn ảnh hoặc video');
      return;
    }

    setLoading(true);

    try {
      // Upload images first (nếu có)
      let uploadedImageUrls: string[] = [];
      let uploadedVideoUrl: string | null = null;

      if (images.length > 0) {
        try {
          for (const imageUri of images) {
            const formData = new FormData();
            formData.append('image', {
              uri: imageUri,
              type: 'image/jpeg',
              name: 'image.jpg',
            } as any);

            const uploadRes = await uploadAPI.uploadPostImage(formData);
            console.log('Upload response:', uploadRes?.data);
            
            if (uploadRes?.data?.url) {
              uploadedImageUrls.push(uploadRes.data.url);
            } else {
              console.error('No URL in upload response:', uploadRes?.data);
              throw new Error('Không nhận được URL ảnh từ server');
            }
          }
        } catch (uploadError: any) {
          console.error('Upload error details:', {
            message: uploadError.message,
            response: uploadError.response?.data,
            status: uploadError.response?.status,
          });
          setLoading(false);
          const errorMsg = uploadError.response?.data?.message || uploadError.message || 'Không thể tải ảnh lên. Vui lòng thử lại.';
          showAlert('Tải ảnh thất bại', errorMsg);
          return;
        }
      }

      // Upload video (nếu có)
      if (video) {
        setUploadingVideo(true);
        try {
          const formData = new FormData();
          const videoType = video.uri.includes('.mp4') ? 'video/mp4' : 'video/quicktime';
          const videoName = video.uri.split('/').pop() || 'video.mp4';
          
          formData.append('video', {
            uri: video.uri,
            type: videoType,
            name: videoName,
          } as any);

          const uploadRes = await uploadAPI.uploadVideo(formData);
          console.log('Video upload response:', uploadRes?.data);
          
          if (uploadRes?.data?.url) {
            uploadedVideoUrl = uploadRes.data.url;
          } else {
            console.error('No URL in video upload response:', uploadRes?.data);
            throw new Error('Không nhận được URL video từ server');
          }
        } catch (uploadError: any) {
          console.error('Video upload error details:', {
            message: uploadError.message,
            response: uploadError.response?.data,
            status: uploadError.response?.status,
          });
          setLoading(false);
          setUploadingVideo(false);
          const errorMsg = uploadError.response?.data?.message || uploadError.message || 'Không thể tải video lên. Vui lòng thử lại.';
          showAlert('Tải video thất bại', errorMsg);
          return;
        } finally {
          setUploadingVideo(false);
        }
      }

      // Create post
      console.log('Creating post with content:', content?.substring(0, 50), 'images count:', uploadedImageUrls.length, 'video:', !!uploadedVideoUrl);
      const createRes = await newsfeedAPI.createPost(content, uploadedImageUrls, uploadedVideoUrl);
      console.log('Post created successfully:', createRes?.data);

      showAlert('Đăng bài thành công', 'Đã đăng bài viết của bạn', () => {
        navigation.goBack();
      });
    } catch (error: any) {
      console.error('Create post error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage = error.response?.data?.message || error.message || 'Đăng bài thất bại';
      showAlert('Đăng bài thất bại', errorMessage);
    } finally {
      setLoading(false);
      setUploadingVideo(false);
    }
  };

  const canPost = content.trim().length > 0 || images.length > 0 || !!video;
  const userName = user?.full_name || user?.username || 'User';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { 
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: colors.primary }]}>Hủy</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Zyea+ mới</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialCommunityIcons name="dots-horizontal" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* User Info Section */}
          <View style={styles.userSection}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: getAvatarURL(user.avatar_url) }}
                style={styles.userAvatar}
              />
            ) : (
              <Avatar.Text
                size={40}
                label={getInitials(userName)}
                style={styles.userAvatar}
              />
            )}
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
              <TouchableOpacity style={styles.topicButton}>
                <Text style={[styles.topicText, { color: colors.textSecondary }]}>Thêm chủ đề</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Input */}
          <View style={styles.contentSection}>
            <TextInput
              placeholder="Có gì mới?"
              placeholderTextColor={colors.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              style={[styles.textInput, { color: colors.text }]}
              textAlignVertical="top"
              autoFocus
            />

            {/* Thread Line */}
            <View style={styles.threadLine}>
              <View style={[styles.threadVerticalLine, { backgroundColor: colors.border }]} />
              <View style={styles.threadAvatar}>
                <Avatar.Text
                  size={24}
                  label={getInitials(userName)}
                  style={{ backgroundColor: colors.border }}
                  color={colors.text}
                />
                <Text style={[styles.threadText, { color: colors.textSecondary }]}>Thêm vào thread</Text>
              </View>
            </View>
          </View>

          {/* Images Preview */}
          {images.length > 0 && (
            <View style={styles.imagesPreview}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <MaterialCommunityIcons name="close-circle" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Video Preview */}
          {video && (
            <View style={styles.videoPreviewContainer}>
              <Video
                ref={videoRef}
                source={{ uri: video.uri }}
                style={styles.previewVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                useNativeControls
                isMuted={false}
                onLoad={handleVideoLoad}
              />
              <TouchableOpacity
                style={styles.removeVideoButton}
                onPress={handleRemoveVideo}
              >
                <MaterialCommunityIcons name="close-circle" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              {video.duration && (
                <View style={styles.videoDurationBadge}>
                  <Text style={styles.videoDurationText}>
                    {Math.round(video.duration)}s
                  </Text>
                </View>
              )}
              {uploadingVideo && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.uploadingText}>Đang tải video...</Text>
                </View>
              )}
            </View>
          )}

          {/* Attachment Icons */}
          <View style={styles.attachmentBar}>
            <TouchableOpacity 
              style={[styles.attachmentButton, video && styles.attachmentButtonDisabled]} 
              onPress={handlePickImage}
              disabled={!!video}
            >
              <MaterialCommunityIcons 
                name="image-outline" 
                size={24} 
                color={video ? colors.border : colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.attachmentButton, images.length > 0 && styles.attachmentButtonDisabled]} 
              onPress={handlePickVideo}
              disabled={images.length > 0}
            >
              <MaterialCommunityIcons 
                name="video-outline" 
                size={24} 
                color={images.length > 0 ? colors.border : colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.attachmentButton, images.length > 0 && styles.attachmentButtonDisabled]} 
              onPress={handleRecordVideo}
              disabled={images.length > 0}
            >
              <MaterialCommunityIcons 
                name="video-plus-outline" 
                size={24} 
                color={images.length > 0 ? colors.border : colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentButton}>
              <MaterialCommunityIcons name="animation-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentButton}>
              <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={[styles.bottomBar, { 
          borderTopColor: colors.border, 
          backgroundColor: colors.surface 
        }]}>
          <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
            {privacy === 'public'
              ? 'Bất kỳ ai cũng có thể trả lời và trích dẫn'
              : 'Chỉ bạn bè có thể trả lời'}
          </Text>
          <TouchableOpacity
            style={[styles.privacyToggle, { backgroundColor: colors.border }]}
            onPress={() => setPrivacy(privacy === 'public' ? 'friends' : 'public')}
          >
            <View style={[
              styles.toggleCircle,
              {
                backgroundColor: privacy === 'public' ? colors.surface : colors.text,
                alignSelf: privacy === 'public' ? 'flex-start' : 'flex-end',
              }
            ]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.postButton, 
              { 
                backgroundColor: canPost && !loading ? colors.primary : colors.border,
                opacity: canPost && !loading ? 1 : 0.5 
              }
            ]}
            onPress={handlePost}
            disabled={!canPost || loading}
          >
            <Text style={[styles.postButtonText, { 
              color: canPost && !loading ? '#FFFFFF' : colors.textSecondary 
            }]}>
              {loading ? (uploadingVideo ? 'Đang tải video...' : 'Đang đăng...') : 'Đăng'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <AlertComponent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelButton: {
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    padding: 4,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  topicButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicText: {
    fontSize: 14,
  },
  contentSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    padding: 0,
  },
  threadLine: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  threadVerticalLine: {
    width: 2,
    height: 40,
    marginLeft: 19,
    marginRight: 12,
  },
  threadAvatar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  threadText: {
    fontSize: 14,
  },
  imagesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: (screenWidth - 40) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000000', // Preview background should be dark for images
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 14,
  },
  attachmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  attachmentButton: {
    padding: 4,
  },
  attachmentButtonDisabled: {
    opacity: 0.5,
  },
  videoPreviewContainer: {
    position: 'relative',
    width: screenWidth - 32,
    height: 300,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  removeVideoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 14,
    zIndex: 10,
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  uploadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    marginRight: 12,
  },
  privacyToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginRight: 12,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  postButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  postButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CreatePostScreen;

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { getInitials, getAvatarURL } from '../../utils/imageUtils';
import { launchImageLibrary, launchCamera } from '../../utils/imagePicker';
import { useAlert } from '../../hooks/useAlert';
import { newsfeedAPI, uploadAPI } from '../../utils/api';
import { MAX_VIDEO_DURATION, formatVideoDuration } from '../../config/videoConstants';

const screenWidth = Dimensions.get('window').width;

const SelfDestructPostScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { showAlert, AlertComponent } = useAlert();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<{ uri: string; duration?: number } | null>(null);
  const [showInfoBox, setShowInfoBox] = useState(true);
  const [replyRestriction, setReplyRestriction] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoRef = useRef<Video>(null);

  const userName = user?.full_name || user?.username || 'Người dùng';

  const dynamicStyles = createStyles(colors);

  const canPost = content.trim().length > 0 || images.length > 0 || !!video;

  const handlePickImage = async () => {
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

  const handleVideoLoad = async () => {
    if (videoRef.current && video) {
      try {
        const status = await videoRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          const durationSeconds = status.durationMillis / 1000;
          
          if (durationSeconds > MAX_VIDEO_DURATION) {
            showAlert(
              'Video quá dài',
              `Video không được vượt quá ${formatVideoDuration(MAX_VIDEO_DURATION)}. Video của bạn dài ${formatVideoDuration(durationSeconds)}.`
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
            if (uploadRes?.data?.url) {
              uploadedImageUrls.push(uploadRes.data.url);
            } else {
              throw new Error('Không nhận được URL ảnh từ server');
            }
          }
        } catch (uploadError: any) {
          setLoading(false);
          const errorMsg = uploadError.response?.data?.message || uploadError.message || 'Không thể tải ảnh lên. Vui lòng thử lại.';
          showAlert('Tải ảnh thất bại', errorMsg);
          return;
        }
      }

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
          
          if (uploadRes?.data?.url) {
            uploadedVideoUrl = uploadRes.data.url;
          } else {
            throw new Error('Không nhận được URL video từ server');
          }
        } catch (uploadError: any) {
          setLoading(false);
          setUploadingVideo(false);
          const errorMsg = uploadError.response?.data?.message || uploadError.message || 'Không thể tải video lên. Vui lòng thử lại.';
          showAlert('Tải video thất bại', errorMsg);
          return;
        } finally {
          setUploadingVideo(false);
        }
      }

      // Create self-destruct post
      const createRes = await newsfeedAPI.createPost(content, uploadedImageUrls, uploadedVideoUrl);
      
      showAlert('Đăng bài thành công', 'Đã đăng bài viết tự hủy của bạn', () => {
        navigation.goBack();
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Đăng bài thất bại';
      showAlert('Đăng bài thất bại', errorMessage);
    } finally {
      setLoading(false);
      setUploadingVideo(false);
    }
  };

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={dynamicStyles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[dynamicStyles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={dynamicStyles.headerButton}
          >
            <Text style={[dynamicStyles.headerButtonText, { color: colors.primary }]}>
              Hủy
            </Text>
          </TouchableOpacity>
          
          <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>
            Bài viết tự hủy mới
          </Text>
          
          <TouchableOpacity
            style={dynamicStyles.headerButton}
            onPress={() => {
              // TODO: Open menu
            }}
          >
            <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={dynamicStyles.scrollView}
          contentContainerStyle={dynamicStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* User Info and Input */}
          <View style={dynamicStyles.contentSection}>
            <View style={dynamicStyles.userSection}>
              {user?.avatar_url ? (
                <Avatar.Image
                  size={40}
                  source={{ uri: getAvatarURL(user.avatar_url) }}
                />
              ) : (
                <Avatar.Text
                  size={40}
                  label={getInitials(userName)}
                />
              )}
              <Text style={[dynamicStyles.username, { color: colors.text }]}>
                {userName}
              </Text>
            </View>

            <View style={[dynamicStyles.inputWrapper]}>
              <View style={[dynamicStyles.inputContainer, { 
                borderColor: colors.border,
                backgroundColor: colors.background,
              }]}>
                <TextInput
                  style={[dynamicStyles.input, { color: colors.text }]}
                  placeholder="Chia sẻ suy nghĩ..."
                  placeholderTextColor={colors.textSecondary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  autoFocus
                />
              </View>
            </View>

            {/* Media Preview */}
            {images.length > 0 && (
              <View style={dynamicStyles.mediaPreview}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {images.map((uri, index) => (
                    <View key={index} style={dynamicStyles.mediaItem}>
                      <Image source={{ uri }} style={dynamicStyles.mediaImage} />
                      <TouchableOpacity
                        style={dynamicStyles.removeMediaButton}
                        onPress={() => handleRemoveImage(index)}
                      >
                        <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {video && (
              <View style={dynamicStyles.videoPreview}>
                <Video
                  ref={videoRef}
                  source={{ uri: video.uri }}
                  style={dynamicStyles.videoPlayer}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  onLoad={handleVideoLoad}
                />
                <TouchableOpacity
                  style={dynamicStyles.removeMediaButton}
                  onPress={handleRemoveVideo}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Media Actions */}
            <View style={dynamicStyles.mediaActions}>
              <TouchableOpacity
                style={[dynamicStyles.mediaActionButton, { backgroundColor: colors.surface }]}
                onPress={handlePickImage}
              >
                <MaterialCommunityIcons name="image" size={24} color={colors.primary} />
                <Text style={[dynamicStyles.mediaActionText, { color: colors.text }]}>
                  Ảnh
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.mediaActionButton, { backgroundColor: colors.surface }]}
                onPress={handlePickVideo}
              >
                <MaterialCommunityIcons name="video" size={24} color={colors.primary} />
                <Text style={[dynamicStyles.mediaActionText, { color: colors.text }]}>
                  Video
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.mediaActionButton, { backgroundColor: colors.surface }]}
                onPress={handleRecordVideo}
              >
                <MaterialCommunityIcons name="camera" size={24} color={colors.primary} />
                <Text style={[dynamicStyles.mediaActionText, { color: colors.text }]}>
                  Quay video
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Information Box */}
          {showInfoBox && (
            <View style={[dynamicStyles.infoBox, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={dynamicStyles.infoBoxClose}
                onPress={() => setShowInfoBox(false)}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[dynamicStyles.infoBoxText, { color: colors.text }]}>
                Hệ thống sẽ lưu trữ bài viết tự hủy sau 24 giờ và chuyển thread trả lời vào tin nhắn. Chỉ mình bạn xem được ai đã thích và trả lời.
              </Text>
            </View>
          )}

          {/* Privacy Settings */}
          <View style={dynamicStyles.privacySection}>
            <View style={dynamicStyles.privacyRow}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={colors.text}
                style={dynamicStyles.privacyIcon}
              />
              <Text style={[dynamicStyles.privacyText, { color: colors.text }]}>
                Chỉ những người mà bạn theo dõi mới có thể trả lời, còn những người khác phải yêu cầu
              </Text>
              <Switch
                value={replyRestriction}
                onValueChange={setReplyRestriction}
                trackColor={{ 
                  false: colors.border, 
                  true: colors.primary 
                }}
                thumbColor={isDarkMode ? colors.surface : '#fff'}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={[dynamicStyles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              dynamicStyles.postButton,
              {
                backgroundColor: canPost 
                  ? (isDarkMode ? '#0084ff' : colors.primary)  // Dùng màu xanh trong dark mode thay vì trắng
                  : colors.border,
              },
            ]}
            onPress={handlePost}
            disabled={!canPost || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text
                style={[
                  dynamicStyles.postButtonText,
                  { 
                    color: canPost 
                      ? '#FFFFFF'  // Chữ trắng trên nền xanh (dark mode) hoặc primary (light mode)
                      : isDarkMode 
                        ? 'rgba(255, 255, 255, 0.6)'  // Trắng mờ trên nền xám đen
                        : 'rgba(0, 0, 0, 0.5)'  // Đen mờ trên nền xám sáng
                  },
                ]}
              >
                {uploadingVideo ? 'Đang tải video...' : 'Đăng'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <AlertComponent />
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof PWATheme.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    padding: 8,
    minWidth: 50,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  contentSection: {
    marginBottom: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputWrapper: {
    marginLeft: 52,
  },
  inputContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
  },
  input: {
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  mediaPreview: {
    marginTop: 12,
    marginLeft: 52,
  },
  mediaItem: {
    marginRight: 8,
    position: 'relative',
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  videoPreview: {
    marginTop: 12,
    marginLeft: 52,
    position: 'relative',
  },
  videoPlayer: {
    width: screenWidth - 84,
    height: 300,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  mediaActions: {
    flexDirection: 'row',
    marginTop: 12,
    marginLeft: 52,
    gap: 12,
  },
  mediaActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  mediaActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    position: 'relative',
  },
  infoBoxClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  infoBoxText: {
    fontSize: 13,
    lineHeight: 18,
    paddingRight: 24,
  },
  privacySection: {
    marginTop: 8,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  privacyIcon: {
    marginRight: 4,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  postButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  postButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SelfDestructPostScreen;

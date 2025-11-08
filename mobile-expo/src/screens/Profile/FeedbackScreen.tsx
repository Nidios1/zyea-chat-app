import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { feedbackAPI, uploadAPI } from '../../utils/api';
import { launchImageLibrary } from '../../utils/imagePicker';
import { Video, ResizeMode } from 'expo-av';

type FeedbackScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Feedback'>;

// Giới hạn video: 30 giây và 50MB
const MAX_VIDEO_DURATION = 30; // seconds
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const FeedbackScreen = () => {
  const navigation = useNavigation<FeedbackScreenNavigationProp>();
  const { colors, themeMode, isDarkMode } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'report' | 'bug'>('feedback');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: 'image' | 'video'; fileSize?: number } | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const videoRef = useRef<Video>(null);

  const handlePickMedia = async () => {
    try {
      Alert.alert(
        'Chọn media',
        'Bạn muốn chọn hình ảnh hay video?',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Hình ảnh',
            onPress: async () => {
              const response = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
              });
              if (response.assets && response.assets[0]) {
                setSelectedMedia({
                  uri: response.assets[0].uri!,
                  type: 'image',
                });
              }
            },
          },
          {
            text: 'Video',
            onPress: async () => {
              const response = await launchImageLibrary({
                mediaType: 'video',
                quality: 0.8,
              });
              if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                
                // Kiểm tra file size
                if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE) {
                  Alert.alert(
                    'Video quá lớn',
                    `Video không được vượt quá ${MAX_VIDEO_SIZE / (1024 * 1024)}MB. Video của bạn có kích thước ${(asset.fileSize / (1024 * 1024)).toFixed(2)}MB.`
                  );
                  return;
                }
                
                setSelectedMedia({
                  uri: asset.uri!,
                  type: 'video',
                  fileSize: asset.fileSize,
                });
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error: any) {
      console.error('Error picking media:', error);
      Alert.alert('Lỗi', 'Không thể mở thư viện media.');
    }
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
  };

  const handleVideoLoad = async () => {
    if (videoRef.current && selectedMedia?.type === 'video') {
      try {
        const status = await videoRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          const durationSeconds = status.durationMillis / 1000;
          
          if (durationSeconds > MAX_VIDEO_DURATION) {
            Alert.alert(
              'Video quá dài',
              `Video không được vượt quá ${MAX_VIDEO_DURATION} giây. Video của bạn dài ${Math.round(durationSeconds)} giây.`
            );
            setSelectedMedia(null);
            return;
          }
        }
      } catch (error) {
        console.log('Could not check video duration:', error);
      }
    }
  };

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung góp ý');
      return;
    }

    if (feedback.trim().length < 10) {
      Alert.alert('Lỗi', 'Nội dung góp ý phải có ít nhất 10 ký tự');
      return;
    }

    setIsSubmitting(true);
    setIsUploadingMedia(true);
    try {
      let mediaUrl: string | null = null;

      // Upload media if selected
      if (selectedMedia) {
        try {
          if (selectedMedia.type === 'image') {
            const formData = new FormData();
            formData.append('image', {
              uri: selectedMedia.uri,
              type: 'image/jpeg',
              name: 'feedback-image.jpg',
            } as any);

            const uploadRes = await uploadAPI.uploadPostImage(formData);
            if (uploadRes?.data?.url) {
              mediaUrl = uploadRes.data.url;
            }
          } else if (selectedMedia.type === 'video') {
            const formData = new FormData();
            const videoType = selectedMedia.uri.includes('.mp4') ? 'video/mp4' : 'video/quicktime';
            const videoName = selectedMedia.uri.split('/').pop() || 'feedback-video.mp4';
            
            formData.append('video', {
              uri: selectedMedia.uri,
              type: videoType,
              name: videoName,
            } as any);

            const uploadRes = await uploadAPI.uploadVideo(formData);
            if (uploadRes?.data?.url) {
              mediaUrl = uploadRes.data.url;
            }
          }
        } catch (uploadError: any) {
          console.error('Error uploading media:', uploadError);
          Alert.alert(
            'Lỗi',
            'Không thể tải media lên. Vui lòng thử lại.'
          );
          setIsSubmitting(false);
          setIsUploadingMedia(false);
          return;
        }
      }

      setIsUploadingMedia(false);
      
      // Submit feedback with media URL
      await feedbackAPI.submitFeedback(feedback, feedbackType, mediaUrl);
      
      Alert.alert(
        'Thành công',
        'Cảm ơn bạn đã góp ý! Chúng tôi sẽ xem xét và cải thiện ứng dụng.',
        [
          {
            text: 'OK',
            onPress: () => {
              setFeedback('');
              setSelectedMedia(null);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || 'Không thể gửi góp ý. Vui lòng thử lại sau.'
      );
    } finally {
      setIsSubmitting(false);
      setIsUploadingMedia(false);
    }
  };

  const dynamicStyles = createStyles(colors);

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={dynamicStyles.header}>
          <TouchableOpacity
            style={dynamicStyles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>
            Góp ý & phản hồi
          </Text>
          <View style={dynamicStyles.headerRight} />
        </View>

        <ScrollView
          style={dynamicStyles.content}
          contentContainerStyle={[
            dynamicStyles.contentContainer,
            { paddingBottom: Math.max(insets.bottom, 20) + 100 }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[dynamicStyles.card, { backgroundColor: colors.surface }]}>
            <Text style={[dynamicStyles.label, { color: colors.text }]}>
              Chúng tôi rất mong nhận được phản hồi từ bạn!
            </Text>
            <Text style={[dynamicStyles.description, { color: colors.textSecondary }]}>
              Hãy chia sẻ ý kiến, đề xuất hoặc báo cáo lỗi để chúng tôi có thể cải thiện ứng dụng tốt hơn.
            </Text>

            {/* Feedback Type Selection */}
            <View style={dynamicStyles.typeContainer}>
              <TouchableOpacity
                style={[
                  dynamicStyles.typeButton,
                  {
                    backgroundColor: feedbackType === 'feedback' ? (isDarkMode ? '#0084ff' : colors.primary) : 'transparent',
                    borderColor: feedbackType === 'feedback' ? (isDarkMode ? '#0084ff' : colors.primary) : colors.border,
                  }
                ]}
                onPress={() => setFeedbackType('feedback')}
              >
                <Text
                  style={[
                    dynamicStyles.typeButtonText,
                    {
                      color: feedbackType === 'feedback' ? '#FFFFFF' : colors.text,
                    }
                  ]}
                >
                  Góp ý
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  dynamicStyles.typeButton,
                  {
                    backgroundColor: feedbackType === 'report' ? (isDarkMode ? '#0084ff' : colors.primary) : 'transparent',
                    borderColor: feedbackType === 'report' ? (isDarkMode ? '#0084ff' : colors.primary) : colors.border,
                  }
                ]}
                onPress={() => setFeedbackType('report')}
              >
                <Text
                  style={[
                    dynamicStyles.typeButtonText,
                    {
                      color: feedbackType === 'report' ? '#FFFFFF' : colors.text,
                    }
                  ]}
                >
                  Báo cáo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  dynamicStyles.typeButton,
                  {
                    backgroundColor: feedbackType === 'bug' ? (isDarkMode ? '#0084ff' : colors.primary) : 'transparent',
                    borderColor: feedbackType === 'bug' ? (isDarkMode ? '#0084ff' : colors.primary) : colors.border,
                  }
                ]}
                onPress={() => setFeedbackType('bug')}
              >
                <Text
                  style={[
                    dynamicStyles.typeButtonText,
                    {
                      color: feedbackType === 'bug' ? '#FFFFFF' : colors.text,
                    }
                  ]}
                >
                  Lỗi
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[dynamicStyles.inputContainer, { backgroundColor: colors.background }]}>
              <TextInput
                style={[dynamicStyles.input, { color: colors.text }]}
                placeholder="Nhập nội dung góp ý của bạn..."
                placeholderTextColor={colors.textSecondary}
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={[dynamicStyles.charCount, { color: colors.textSecondary }]}>
                {feedback.length}/1000
              </Text>
            </View>

            {/* Media Attachment */}
            <View style={dynamicStyles.mediaSection}>
              <TouchableOpacity
                style={[
                  dynamicStyles.attachButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  }
                ]}
                onPress={handlePickMedia}
                disabled={isSubmitting}
              >
                <MaterialCommunityIcons 
                  name="attachment" 
                  size={20} 
                  color={colors.textSecondary} 
                />
                <Text style={[dynamicStyles.attachButtonText, { color: colors.textSecondary }]}>
                  Đính kèm hình ảnh/video
                </Text>
              </TouchableOpacity>

              {/* Media Preview */}
              {selectedMedia && (
                <View style={[dynamicStyles.mediaPreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {selectedMedia.type === 'image' ? (
                    <Image
                      source={{ uri: selectedMedia.uri }}
                      style={dynamicStyles.mediaImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Video
                      ref={videoRef}
                      source={{ uri: selectedMedia.uri }}
                      style={dynamicStyles.mediaVideo}
                      resizeMode={ResizeMode.COVER}
                      useNativeControls
                      shouldPlay={false}
                      onLoad={handleVideoLoad}
                    />
                  )}
                  <TouchableOpacity
                    style={[dynamicStyles.removeMediaButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
                    onPress={handleRemoveMedia}
                  >
                    <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                dynamicStyles.submitButton,
                {
                  backgroundColor: isDarkMode ? '#0084ff' : colors.primary,
                  opacity: isSubmitting || !feedback.trim() ? 0.5 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !feedback.trim()}
            >
              <Text style={dynamicStyles.submitButtonText}>
                {isUploadingMedia ? 'Đang tải media...' : isSubmitting ? 'Đang gửi...' : 'Gửi góp ý'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof PWATheme.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    fontSize: 15,
    lineHeight: 22,
    padding: 16,
    minHeight: 150,
    maxHeight: 300,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mediaSection: {
    marginBottom: 16,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  attachButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mediaPreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: 8,
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  mediaVideo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FeedbackScreen;


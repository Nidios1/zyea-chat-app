import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  FlatList,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { getAvatarURL, getImageURL } from '../../utils/imageUtils';
import { getInitials } from '../../utils/nameUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { API_BASE_URL } from '../../config/constants';
import * as ImagePicker from 'expo-image-picker';
import { getStoredToken } from '../../utils/auth';
import { newsfeedAPI, usersAPI } from '../../utils/api';
import { NewsFeedStackParamList } from '../../navigation/types';

type ProfileInformationScreenNavigationProp = StackNavigationProp<ProfileStackParamList>;
type ProfileInformationScreenRouteProp = RouteProp<ProfileStackParamList, 'ProfileInformation'>;

const ProfileInformationScreen = () => {
  const { user: currentUser } = useAuth();
  const navigation = useNavigation<ProfileInformationScreenNavigationProp>();
  const route = useRoute<ProfileInformationScreenRouteProp>();
  const { colors, isDarkMode } = useTheme();
  
  // Get userId from route params, or use current user
  const targetUserId = route.params?.userId;
  const isOwnProfile = !targetUserId || targetUserId === currentUser?.id?.toString();
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'photo' | 'video' | 'album'>('photo');
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [showAvatarActionSheet, setShowAvatarActionSheet] = useState(false);
  const [showCoverActionSheet, setShowCoverActionSheet] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string>('');

  // Load target user info if viewing other user's profile
  useEffect(() => {
    const loadTargetUser = async () => {
      if (targetUserId && targetUserId !== currentUser?.id?.toString()) {
        try {
          const response = await usersAPI.getProfile(targetUserId);
          setTargetUser(response.data);
        } catch (error) {
          console.error('Error loading user profile:', error);
          Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
        }
      } else {
        setTargetUser(null);
      }
    };

    loadTargetUser();
  }, [targetUserId, currentUser?.id]);

  // Use targetUser if viewing other profile, otherwise use currentUser
  const user = targetUser || currentUser;

  useEffect(() => {
    if (user?.avatar_url) {
      setAvatarUrl(getAvatarURL(user.avatar_url));
    }
    if (user?.cover_url) {
      const coverPath = user.cover_url.startsWith('http')
        ? user.cover_url
        : `${API_BASE_URL.replace('/api', '')}${user.cover_url}`;
      setCoverUrl(coverPath);
    }
  }, [user]);

  const loadPosts = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await newsfeedAPI.getPosts();
      const allPosts = Array.isArray(response.data) ? response.data : response.data?.posts || [];
      
      // Filter posts for target user (could be current user or another user)
      const userIdToFilter = user.id;
      const userPosts = allPosts.filter((post: any) => 
        post.user_id === userIdToFilter || 
        post.authorId === userIdToFilter ||
        post.user?.id === userIdToFilter ||
        post.user_id?.toString() === userIdToFilter?.toString() ||
        post.authorId?.toString() === userIdToFilter?.toString()
      );
      setPosts(userPosts);
      
      // Load media files
      loadMediaFiles(userPosts, user);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMediaFiles = (userPosts: any[], targetUserData?: any) => {
    const media: any[] = [];
    const userData = targetUserData || user;
    
    // Add avatar - use userData first, then fallback to avatarUrl state
    const avatarToUse = userData?.avatar_url ? getAvatarURL(userData.avatar_url) : avatarUrl;
    if (avatarToUse) {
      media.push({
        type: 'photo',
        url: avatarToUse,
        id: 'avatar'
      });
    }
    
    // Add cover photo - use userData first, then fallback to coverUrl state
    let coverToUse = coverUrl;
    if (userData?.cover_url) {
      coverToUse = userData.cover_url.startsWith('http')
        ? userData.cover_url
        : `${API_BASE_URL.replace('/api', '')}${userData.cover_url}`;
    }
    if (coverToUse) {
      media.push({
        type: 'photo',
        url: coverToUse,
        id: 'cover'
      });
    }
    
    // Add media from posts
    userPosts.forEach(post => {
      if (post.image_url) {
        media.push({
          type: 'photo',
          url: post.image_url,
          id: `post_${post.id || Date.now()}_${Math.random()}`,
          postId: post.id
        });
      }
      if (post.video_url) {
        media.push({
          type: 'video',
          url: post.video_url,
          id: `post_${post.id || Date.now()}_video_${Math.random()}`,
          postId: post.id
        });
      }
    });
    
    setMediaFiles(media);
  };

  useEffect(() => {
    if (posts.length > 0 || user?.avatar_url || user?.cover_url) {
      loadMediaFiles(posts, user);
    }
  }, [avatarUrl, coverUrl, posts.length, user?.avatar_url, user?.cover_url]);

  useEffect(() => {
    if (user?.id) {
      loadPosts();
    }
  }, [user?.id, targetUserId]);

  const formatTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const period = hours < 12 ? 'sáng' : now.getHours() < 18 ? 'chiều' : 'tối';
    return `${hours}:${minutes} ${period} Giờ địa phương`;
  };

  const handlePickImage = async (type: 'avatar' | 'cover') => {
    try {
      // Ensure permission is granted (prevents silent failure on iOS)
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Quyền bị từ chối', 'Vui lòng cho phép truy cập Ảnh để chọn ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri, type);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh.');
    }
  };

  const uploadImage = async (imageUri: string, type: 'avatar' | 'cover') => {
    try {
      if (type === 'avatar') {
        setIsUploadingAvatar(true);
      } else {
        setIsUploadingCover(true);
      }

      const formData = new FormData();
      const fileType = imageUri.substring(imageUri.lastIndexOf('.') + 1);
      const fileName = `${type}_${Date.now()}.${fileType}`;

      formData.append(type, {
        uri: imageUri,
        type: `image/${fileType}`,
        name: fileName,
      } as any);

      const token = await getStoredToken();
      if (!token) {
        throw new Error('Không tìm thấy token đăng nhập');
      }

      const endpoint = type === 'avatar' ? '/profile/avatar' : '/profile/cover';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        // Let fetch set the multipart boundary; do not set Content-Type manually
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const url = type === 'avatar' ? data.avatar_url : data.cover_url;

      if (url) {
        const fullUrl = url.startsWith('http')
          ? url
          : `${API_BASE_URL.replace('/api', '')}${url}`;

        if (type === 'avatar') {
          setAvatarUrl(fullUrl);
        } else {
          setCoverUrl(fullUrl);
        }

        Alert.alert('Thành công', `Cập nhật ảnh ${type === 'avatar' ? 'đại diện' : 'bìa'} thành công!`);
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      Alert.alert('Lỗi', `Không thể tải lên ảnh ${type === 'avatar' ? 'đại diện' : 'bìa'}. Vui lòng thử lại.`);
    } finally {
      if (type === 'avatar') {
        setIsUploadingAvatar(false);
      } else {
        setIsUploadingCover(false);
      }
    }
  };


  const userName = user?.full_name || user?.username || 'Người dùng';
  const userUsername = user?.username || '';
  const userEmail = user?.email || '';
  const userDepartment = user?.department || '';

  const dynamicStyles = createStyles(colors);

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>
          Hồ sơ
        </Text>
        <TouchableOpacity style={dynamicStyles.searchButton}>
          <MaterialCommunityIcons name="magnify" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={dynamicStyles.scrollView}>
        {/* Cover Photo */}
        <TouchableOpacity 
          style={dynamicStyles.coverContainer}
          activeOpacity={0.9}
          onPress={() => {
            if (coverUrl) {
              setShowCoverActionSheet(true);
            } else if (isOwnProfile) {
              setShowCoverActionSheet(true);
            }
          }}
        >
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={dynamicStyles.coverImage} />
          ) : (
            <View style={[dynamicStyles.coverImage, dynamicStyles.coverPlaceholder]}>
              <Text style={dynamicStyles.coverText}>Zyea+</Text>
            </View>
          )}
          {isOwnProfile && (
            <TouchableOpacity
              style={[
                dynamicStyles.coverCameraButton,
                {
                  backgroundColor: isDarkMode ? '#0084ff' : 'rgba(255, 255, 255, 0.9)',
                }
              ]}
              onPress={(e) => {
                e.stopPropagation();
                setShowCoverActionSheet(true);
              }}
              disabled={isUploadingCover}
            >
            {isUploadingCover ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="camera" size={18} color="#fff" />
            )}
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Profile Section */}
        <View style={[dynamicStyles.profileSection, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={dynamicStyles.avatarContainer}
            activeOpacity={0.9}
            onPress={() => {
              if (avatarUrl) {
                setShowAvatarActionSheet(true);
              } else if (isOwnProfile) {
                setShowAvatarActionSheet(true);
              }
            }}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={dynamicStyles.avatar} />
            ) : (
              <Avatar.Text
                size={130}
                label={getInitials(userName)}
                style={dynamicStyles.avatar}
              />
            )}
            {isOwnProfile && (
              <TouchableOpacity
                style={[dynamicStyles.avatarCameraButton, { backgroundColor: '#FF9800' }]}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowAvatarActionSheet(true);
                }}
                disabled={isUploadingAvatar}
              >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="camera" size={14} color="#fff" />
              )}
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <Text style={[dynamicStyles.userName, { color: colors.text }]}>
            {userName}
          </Text>

          {/* Action Buttons */}
          {isOwnProfile && (
            <View style={dynamicStyles.actionButtons}>
              <TouchableOpacity
                style={[dynamicStyles.editButton, { backgroundColor: '#FF9800' }]}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                <Text style={dynamicStyles.editButtonText}>Chỉnh sửa thông tin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.moreButton, { backgroundColor: colors.backgroundSecondary }]}
              >
                <MaterialCommunityIcons name="dots-horizontal" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}

          {/* Info Section */}
          <View style={dynamicStyles.infoSection}>
            <TouchableOpacity 
              style={[dynamicStyles.infoItem, dynamicStyles.mediaButtonContainer, dynamicStyles.mediaButtonItem]}
              onPress={() => setShowMediaModal(true)}
            >
              <View style={[dynamicStyles.infoIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <MaterialCommunityIcons name="image" size={16} color={colors.textSecondary} />
              </View>
              <Text style={[dynamicStyles.infoText, dynamicStyles.mediaButtonText, { color: colors.textSecondary }]}>
                File phương tiện
              </Text>
            </TouchableOpacity>

            <View style={dynamicStyles.infoItem}>
              <View style={[dynamicStyles.infoIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
              </View>
              <Text style={[dynamicStyles.infoText, { color: colors.textSecondary }]}>
                {formatTime()}
              </Text>
            </View>

            {userDepartment && (
              <View style={dynamicStyles.infoItem}>
                <View style={[dynamicStyles.infoIcon, { backgroundColor: colors.backgroundSecondary }]}>
                  <MaterialCommunityIcons name="briefcase-outline" size={16} color={colors.textSecondary} />
                </View>
                <Text style={[dynamicStyles.infoText, { color: colors.textSecondary }]}>
                  {userDepartment}
                </Text>
              </View>
            )}

            {userEmail && (
              <View style={dynamicStyles.infoItem}>
                <View style={[dynamicStyles.infoIcon, { backgroundColor: colors.backgroundSecondary }]}>
                  <MaterialCommunityIcons name="email-outline" size={16} color={colors.textSecondary} />
                </View>
                <Text style={[dynamicStyles.infoText, { color: colors.textSecondary }]}>
                  {userEmail}
                </Text>
              </View>
            )}

            <View style={dynamicStyles.infoItem}>
              <View style={[dynamicStyles.infoIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <MaterialCommunityIcons name="account-outline" size={16} color={colors.textSecondary} />
              </View>
              <Text style={[dynamicStyles.infoText, { color: colors.textSecondary }]}>
                Có {user?.followers?.length || 0} người theo dõi
              </Text>
            </View>

            <TouchableOpacity style={dynamicStyles.infoItem}>
              <View style={[dynamicStyles.infoIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <MaterialCommunityIcons name="account-group-outline" size={16} color={colors.textSecondary} />
              </View>
              <Text style={[dynamicStyles.infoText, { color: colors.textSecondary }]}>
                Sơ đồ tổ chức
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Post Input Section - Only show for own profile */}
        {isOwnProfile && (
          <View style={[dynamicStyles.postInputSection, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[dynamicStyles.postInput, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => {
                // Navigate to CreatePost in NewsFeed stack
                (navigation as any).navigate('NewsFeed', { screen: 'CreatePost' });
              }}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={dynamicStyles.postInputAvatar} />
              ) : (
                <Avatar.Text
                  size={36}
                  label={getInitials(userName)}
                  style={dynamicStyles.postInputAvatar}
                />
              )}
              <Text style={[dynamicStyles.postInputText, { color: colors.textSecondary }]}>
                Bạn đang nghĩ gì?
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[dynamicStyles.mediaButton, { borderColor: '#4CAF50' }]}
              onPress={() => {
                (navigation as any).navigate('NewsFeed', { screen: 'CreatePost' });
              }}
            >
              <MaterialCommunityIcons name="image" size={16} color="#4CAF50" />
              <Text style={[dynamicStyles.mediaButtonText, { color: '#4CAF50' }]}>
                Hình ảnh / Video
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Posts List */}
        {loading ? (
          <View style={dynamicStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[dynamicStyles.loadingText, { color: colors.textSecondary }]}>
              Đang tải...
            </Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={[dynamicStyles.endOfPosts, { backgroundColor: colors.surface }]}>
            <Text style={[dynamicStyles.endOfPostsTitle, { color: colors.textSecondary }]}>
              Đã xem hết các bài viết
            </Text>
            <Text style={[dynamicStyles.endOfPostsMessage, { color: colors.textSecondary }]}>
              Bạn đã xem hết các bài viết hiện có. Tạo bài viết mới để bắt đầu!
            </Text>
          </View>
        ) : (
          posts.map((post, index) => (
            <View
              key={post.id || index}
              style={[dynamicStyles.postItem, { backgroundColor: colors.surface }]}
            >
              <View style={dynamicStyles.postContent}>
                <Text style={[dynamicStyles.postText, { color: colors.text }]}>
                  {post.content || 'Bài viết'}
                </Text>
                {post.image_url && (
                  <Image
                    source={{ uri: post.image_url }}
                    style={dynamicStyles.postImage}
                    resizeMode="cover"
                  />
                )}
                <Text style={[dynamicStyles.postDate, { color: colors.textSecondary }]}>
                  {post.created_at
                    ? new Date(post.created_at).toLocaleString('vi-VN')
                    : ''}
                </Text>
              </View>
            </View>
          ))
        )}

        {posts.length > 0 && (
          <View style={[dynamicStyles.endOfPosts, { backgroundColor: colors.surface }]}>
            <Text style={[dynamicStyles.endOfPostsTitle, { color: colors.textSecondary }]}>
              Đã xem hết các bài viết
            </Text>
            <Text style={[dynamicStyles.endOfPostsMessage, { color: colors.textSecondary }]}>
              Bạn đã xem hết các bài viết hiện có.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Media Modal */}
      <Modal
        visible={showMediaModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMediaModal(false)}
      >
        <SafeAreaView style={[dynamicStyles.modalContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[dynamicStyles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={dynamicStyles.modalBackButton}
              onPress={() => setShowMediaModal(false)}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>
              File phương tiện
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Tabs */}
          <View style={[dynamicStyles.tabsContainer, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[
                dynamicStyles.tab,
                activeMediaTab === 'photo' && { backgroundColor: '#FF9800' },
                activeMediaTab !== 'photo' && { backgroundColor: colors.backgroundSecondary }
              ]}
              onPress={() => setActiveMediaTab('photo')}
            >
              <Text
                style={[
                  dynamicStyles.tabText,
                  { color: activeMediaTab === 'photo' ? '#fff' : colors.textSecondary }
                ]}
              >
                Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dynamicStyles.tab,
                activeMediaTab === 'video' && { backgroundColor: '#FF9800' },
                activeMediaTab !== 'video' && { backgroundColor: colors.backgroundSecondary }
              ]}
              onPress={() => setActiveMediaTab('video')}
            >
              <Text
                style={[
                  dynamicStyles.tabText,
                  { color: activeMediaTab === 'video' ? '#fff' : colors.textSecondary }
                ]}
              >
                Video
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dynamicStyles.tab,
                activeMediaTab === 'album' && { backgroundColor: '#FF9800' },
                activeMediaTab !== 'album' && { backgroundColor: colors.backgroundSecondary }
              ]}
              onPress={() => setActiveMediaTab('album')}
            >
              <Text
                style={[
                  dynamicStyles.tabText,
                  { color: activeMediaTab === 'album' ? '#fff' : colors.textSecondary }
                ]}
              >
                Album
              </Text>
            </TouchableOpacity>
          </View>

          {/* Media Grid */}
          <FlatList
            data={
              activeMediaTab === 'photo'
                ? mediaFiles.filter((m) => m.type === 'photo')
                : activeMediaTab === 'video'
                ? mediaFiles.filter((m) => m.type === 'video')
                : []
            }
            numColumns={3}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={dynamicStyles.mediaGrid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={dynamicStyles.mediaItem}
                onPress={() => {
                  // TODO: Open full screen viewer
                  Alert.alert('Media', `Viewing ${item.type}: ${item.url}`);
                }}
              >
                {item.type === 'photo' ? (
                  <Image
                    source={{ uri: item.id === 'avatar' || item.id === 'cover' ? getAvatarURL(item.url) : getImageURL(item.url) }}
                    style={dynamicStyles.mediaImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[dynamicStyles.mediaImage, dynamicStyles.videoPlaceholder]}>
                    <MaterialCommunityIcons name="play-circle" size={40} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={dynamicStyles.emptyMedia}>
                <MaterialCommunityIcons
                  name={activeMediaTab === 'photo' ? 'image-off' : 'video-off'}
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={[dynamicStyles.emptyMediaText, { color: colors.textSecondary }]}>
                  Không có {activeMediaTab === 'photo' ? 'ảnh' : 'video'} nào
                </Text>
              </View>
            }
          />

          {activeMediaTab === 'album' && (
            <View style={dynamicStyles.emptyMedia}>
              <MaterialCommunityIcons name="folder-off" size={48} color={colors.textSecondary} />
              <Text style={[dynamicStyles.emptyMediaText, { color: colors.textSecondary }]}>
                Tính năng Album sẽ sớm có mặt
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Avatar Action Sheet */}
      <Modal
        visible={showAvatarActionSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvatarActionSheet(false)}
      >
        <TouchableOpacity
          style={dynamicStyles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => setShowAvatarActionSheet(false)}
        >
          <View 
            style={[dynamicStyles.actionSheet, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            {/* Drag Handle */}
            <View style={[dynamicStyles.actionSheetHandle, { backgroundColor: colors.border }]} />
            
            {/* Options */}
            {avatarUrl && (
              <TouchableOpacity
                style={dynamicStyles.actionSheetOption}
                onPress={() => {
                  setShowAvatarActionSheet(false);
                  setImageViewerUrl(avatarUrl);
                  setShowImageViewer(true);
                }}
              >
                <View style={[dynamicStyles.actionSheetOptionIcon, { backgroundColor: colors.backgroundSecondary }]}>
                  <MaterialCommunityIcons name="image-outline" size={20} color={colors.text} />
                </View>
                <Text style={[dynamicStyles.actionSheetOptionText, { color: colors.text }]}>
                  Xem ảnh đại diện
                </Text>
              </TouchableOpacity>
            )}
            
            {isOwnProfile && (
              <TouchableOpacity
                style={dynamicStyles.actionSheetOption}
                onPress={() => {
                  setShowAvatarActionSheet(false);
                  handlePickImage('avatar');
                }}
              >
                <View style={[dynamicStyles.actionSheetOptionIcon, { backgroundColor: colors.backgroundSecondary }]}>
                  <MaterialCommunityIcons name="camera-outline" size={20} color={colors.text} />
                </View>
                <Text style={[dynamicStyles.actionSheetOptionText, { color: colors.text }]}>
                  Chọn ảnh đại diện
                </Text>
              </TouchableOpacity>
            )}

            {/* Cancel Button */}
            <TouchableOpacity
              style={[dynamicStyles.actionSheetCancel, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
              onPress={() => setShowAvatarActionSheet(false)}
            >
              <Text style={[dynamicStyles.actionSheetCancelText, { color: colors.text }]}>
                Hủy
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Cover Action Sheet */}
      <Modal
        visible={showCoverActionSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCoverActionSheet(false)}
      >
        <TouchableOpacity
          style={dynamicStyles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => setShowCoverActionSheet(false)}
        >
          <View 
            style={[dynamicStyles.actionSheet, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            {/* Drag Handle */}
            <View style={[dynamicStyles.actionSheetHandle, { backgroundColor: colors.border }]} />
            
            {/* Options */}
            {coverUrl && (
              <TouchableOpacity
                style={dynamicStyles.actionSheetOption}
                onPress={() => {
                  setShowCoverActionSheet(false);
                  setImageViewerUrl(coverUrl);
                  setShowImageViewer(true);
                }}
              >
                <View style={[dynamicStyles.actionSheetOptionIcon, { backgroundColor: colors.backgroundSecondary }]}>
                  <MaterialCommunityIcons name="image-outline" size={20} color={colors.text} />
                </View>
                <Text style={[dynamicStyles.actionSheetOptionText, { color: colors.text }]}>
                  Xem ảnh bìa
                </Text>
              </TouchableOpacity>
            )}
            
            {isOwnProfile && (
              <TouchableOpacity
                style={dynamicStyles.actionSheetOption}
                onPress={() => {
                  setShowCoverActionSheet(false);
                  handlePickImage('cover');
                }}
              >
                <View style={[dynamicStyles.actionSheetOptionIcon, { backgroundColor: colors.backgroundSecondary }]}>
                  <MaterialCommunityIcons name="camera-outline" size={20} color={colors.text} />
                </View>
                <Text style={[dynamicStyles.actionSheetOptionText, { color: colors.text }]}>
                  Chọn ảnh bìa
                </Text>
              </TouchableOpacity>
            )}

            {/* Cancel Button */}
            <TouchableOpacity
              style={[dynamicStyles.actionSheetCancel, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
              onPress={() => setShowCoverActionSheet(false)}
            >
              <Text style={[dynamicStyles.actionSheetCancelText, { color: colors.text }]}>
                Hủy
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View style={dynamicStyles.imageViewerContainer}>
          <TouchableOpacity
            style={dynamicStyles.imageViewerClose}
            onPress={() => setShowImageViewer(false)}
          >
            <MaterialCommunityIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: imageViewerUrl }}
            style={dynamicStyles.imageViewerImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  searchButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  coverContainer: {
    position: 'relative',
    height: 180,
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    backgroundColor: '#B3E5FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  coverCameraButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    paddingTop: 70,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'absolute',
    width: 130,
    height: 130,
    top: -65,
    left: 16,
    zIndex: 10,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: colors.surface,
  },
  avatarCameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 16,
    marginLeft: 16,
    textAlign: 'left',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mediaButtonContainer: {
    borderWidth: 1.5,
    borderColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
    alignSelf: 'flex-start',
  },
  mediaButtonItem: {
    gap: 6,
  },
  mediaButtonText: {
    fontWeight: '600',
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
  },
  postInputSection: {
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  postInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  postInputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  postInputText: {
    flex: 1,
    fontSize: 15,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: 'white',
  },
  mediaButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  postItem: {
    padding: 8,
    marginBottom: 8,
  },
  postContent: {
    padding: 16,
  },
  postText: {
    fontSize: 15,
    marginBottom: 8,
    lineHeight: 20,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  postDate: {
    fontSize: 12,
    marginTop: 4,
  },
  endOfPosts: {
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  endOfPostsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  endOfPostsMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalBackButton: {
    padding: 8,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  mediaGrid: {
    padding: 4,
  },
  mediaItem: {
    width: (Dimensions.get('window').width - 12) / 3,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMedia: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyMediaText: {
    marginTop: 16,
    fontSize: 16,
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  actionSheetHandle: {
    width: 36,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  actionSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionSheetOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetOptionText: {
    fontSize: 15,
    fontWeight: '400',
    flex: 1,
  },
  actionSheetCancel: {
    marginTop: 6,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  actionSheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

export default ProfileInformationScreen;
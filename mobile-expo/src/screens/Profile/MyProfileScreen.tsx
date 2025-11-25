import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Text, Avatar, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { usersAPI, newsfeedAPI, friendsAPI } from '../../utils/api';
import ProfileHeader from '../../components/Profile/ProfileHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spacing, typography, borderRadius } from '../../config/designTokens';
import { getInitials, getAvatarURL, getVideoURL } from '../../utils/imageUtils';
import PostContent from '../../components/NewsFeed/PostContent';
import PostImagesCarousel from '../../components/NewsFeed/PostImagesCarousel';
import PostVideoPlayer from '../../components/NewsFeed/PostVideoPlayer';
import { PostControls } from '../../components/PostControls/PostControls';
import { formatTimeAgo } from '../../utils/dateUtils';
import FullScreenImageViewer from '../../components/Common/FullScreenImageViewer';
import { getImageURL } from '../../utils/imageUtils';

type MyProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList>;

const MyProfileScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<MyProfileScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Guard check: return null nếu user không tồn tại
  if (!user || !user.id) {
    return null;
  }
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'videos' | 'likes'>('posts');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const lastScrollY = useRef(0);

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const res = await usersAPI.getUserStats(user.id);
        return res.data;
      } catch (error) {
        console.error('Error fetching user stats:', error);
        return null;
      }
    },
    enabled: !!user?.id,
  });

  // Fetch followers and following counts
  const { data: followersData } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: async () => {
      try {
        const res = await friendsAPI.getFollowers();
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch (error) {
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const { data: followingData } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      try {
        const res = await friendsAPI.getFollowing();
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch (error) {
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Fetch user posts
  const { data: userPosts = [], isLoading: isLoadingPosts, refetch } = useQuery({
    queryKey: ['userPosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const res = await newsfeedAPI.getPosts(1, 'all');
        const allPosts = Array.isArray(res.data) ? res.data : (res.data?.posts || []);
        return allPosts.filter((post: any) => {
          const postUserId = post.user_id || post.user?.id || post.author?.id;
          return String(postUserId) === String(user.id);
        });
      } catch (error) {
        console.error('Error fetching user posts:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const stats = {
    posts: userStats?.posts_count || userPosts.length || 0,
    followers: userStats?.followers_count || followersData?.length || 0,
    following: userStats?.following_count || followingData?.length || 0,
  };

  // Like mutation
  const likePostMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string | number }) => {
      const post = userPosts.find((p: any) => (p.id || p._id || p.post_id) === postId);
      if (post?.isLiked) {
        await newsfeedAPI.unlikePost(postId.toString());
      } else {
        await newsfeedAPI.likePost(postId.toString());
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPosts', user?.id] });
    },
  });

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleCreatePost = useCallback(() => {
    try {
      const rootNavigation = navigation.getParent()?.getParent()?.getParent();
      if (rootNavigation) {
        rootNavigation.navigate('NewsFeed', {
          screen: 'CreatePost',
        });
      } else {
        (navigation as any).navigate('CreatePost');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigation]);

  const handleVideoPress = useCallback((postId: string, videoUrl: string) => {
    setPlayingVideoId(postId === playingVideoId ? null : postId);
  }, [playingVideoId]);

  const handlePostCollapse = useCallback((postId: string | number) => {
    // Handle post collapse
  }, []);

  const handleQuickLike = useCallback((postId: string | number) => {
    likePostMutation.mutate({ postId });
  }, [likePostMutation]);

  // Fetch replies (posts with comments/replies)
  const repliesPosts = userPosts.filter((post: any) => {
    // Posts that have replies or are replies themselves
    return post.comments_count > 0 || post.parent_id || post.reply_to;
  });

  // Fetch liked posts (posts that user has liked)
  const { data: likedPosts = [] } = useQuery({
    queryKey: ['likedPosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const res = await newsfeedAPI.getPosts(1, 'all');
        const allPosts = Array.isArray(res.data) ? res.data : (res.data?.posts || []);
        return allPosts.filter((post: any) => post.isLiked === true);
      } catch (error) {
        return [];
      }
    },
    enabled: !!user?.id && activeTab === 'likes',
  });

  // Filter posts based on active tab
  const filteredPosts = (() => {
    if (activeTab === 'replies') {
      return repliesPosts;
    }
    if (activeTab === 'media') {
      return userPosts.filter((post: any) =>
        (post.images && post.images.length > 0) || post.image_url
      );
    }
    if (activeTab === 'videos') {
      return userPosts.filter((post: any) =>
        post.video_url || post.videoUrl || post.videos?.length > 0
      );
    }
    if (activeTab === 'likes') {
      return likedPosts;
    }
    return userPosts; // posts tab shows all
  })();

  const renderPost = ({ item, index }: { item: any, index: number }) => {
    const authorName = item.full_name || item.username || 'Unknown';
    const authorAvatar = item.avatar_url || '';
    const authorId = item.user_id || item.user?.id;
    const postTime = item.created_at ? formatTimeAgo(new Date(item.created_at)) : '';

    // Get video
    let postVideoUrl: string | undefined = undefined;
    let hasVideo = false;
    if (item.videoUrl && item.videoUrl.trim() !== '') {
      postVideoUrl = getVideoURL(item.videoUrl);
      hasVideo = !!(postVideoUrl && postVideoUrl.trim() !== '');
    } else if (item.video_url && item.video_url.trim() !== '') {
      postVideoUrl = getVideoURL(item.video_url);
      hasVideo = !!(postVideoUrl && postVideoUrl.trim() !== '');
    }

    // Get images (only if no video)
    const postImages: string[] = [];
    if (!hasVideo) {
      if (item.images && Array.isArray(item.images)) {
        postImages.push(...item.images);
      } else if (item.image_url) {
        postImages.push(item.image_url);
      }
    }

    const videoThumbnail = item.thumbnailUrl || item.thumbnail_url ||
      (postImages.length > 0 ? postImages[0] : undefined);
    const videoAspectRatio = item.video_aspect_ratio ||
      (item.video_width && item.video_height ? item.video_width / item.video_height : undefined);

    return (
      <View style={[dynamicStyles.postContainer, { backgroundColor: colors.background }]}>
        <View style={dynamicStyles.postLayout}>
          <View style={dynamicStyles.layoutAvi}>
            <TouchableOpacity style={dynamicStyles.avatarContainer}>
              {authorAvatar ? (
                <Image
                  source={{ uri: getAvatarURL(authorAvatar) }}
                  style={dynamicStyles.authorAvatar}
                />
              ) : (
                <Avatar.Text
                  size={42}
                  label={getInitials(authorName)}
                  style={dynamicStyles.authorAvatar}
                />
              )}
            </TouchableOpacity>
          </View>
          <View style={dynamicStyles.layoutContent}>
            <View style={dynamicStyles.postMeta}>
              <TouchableOpacity style={dynamicStyles.authorSection}>
                <Text style={[dynamicStyles.authorName, { color: colors.text }]} numberOfLines={1}>
                  {authorName}
                </Text>
                <Text style={[dynamicStyles.authorHandle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {' @' + (item.username || 'user')}
                </Text>
                {postTime && (
                  <Text style={[dynamicStyles.postTime, { color: colors.textSecondary }]}>
                    · {postTime}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {item.content && (
              <PostContent
                content={item.content}
                postId={item.id || item._id || item.post_id || item.postId}
                onCollapse={handlePostCollapse}
              />
            )}

            {postVideoUrl && postVideoUrl.trim() !== '' && (
              <View style={dynamicStyles.videoContainer}>
                <PostVideoPlayer
                  videoUrl={postVideoUrl}
                  thumbnailUrl={videoThumbnail}
                  postId={String(item.id || item._id || item.post_id || item.postId)}
                  isPlaying={playingVideoId === String(item.id || item._id || item.post_id || item.postId)}
                  onPress={() => {
                    const postId = String(item.id || item._id || item.post_id || item.postId);
                    if (postId && postVideoUrl) {
                      handleVideoPress(postId, postVideoUrl);
                    }
                  }}
                  aspectRatio={videoAspectRatio}
                />
              </View>
            )}

            {postImages.length > 0 && (
              <View style={dynamicStyles.imagesContainer}>
                <PostImagesCarousel
                  images={postImages}
                  onPressImage={(idx) => {
                    setImageViewerImages(postImages);
                    setImageViewerIndex(idx);
                    setShowImageViewer(true);
                  }}
                />
              </View>
            )}

            <View style={dynamicStyles.postActions}>
              <PostControls
                post={{
                  id: item.id || item._id || item.post_id || item.postId,
                  isLiked: item.isLiked,
                  likes_count: item.likes_count || 0,
                  comments_count: item.comments_count || 0,
                  reposts_count: item.reposts_count || 0,
                  isReposted: item.isReposted,
                }}
                onPressLike={() => {
                  const postId = item.id || item._id || item.post_id || item.postId;
                  if (postId) {
                    handleQuickLike(postId);
                  }
                }}
                onPressReply={() => {
                  const pid = item?.id || item?._id || item?.post_id || item?.postId || null;
                  if (pid) {
                    // Navigate to Comments in FeedStack
                    (navigation as any).navigate('NewsFeed', {
                      screen: 'Comments',
                      params: {
                        postId: pid,
                        postData: item,
                      },
                    });
                  }
                }}
                onPressRepost={() => { }}
                onPressShare={() => { }}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Handle avatar press
  const handleAvatarPress = useCallback(() => {
    if (user?.avatar_url) {
      // Nếu có avatar, mở image viewer
      setImageViewerImages([user.avatar_url]);
      setImageViewerIndex(0);
      setShowImageViewer(true);
    } else {
      // Nếu chưa có avatar, mở màn hình chỉnh sửa hồ sơ
      handleEditProfile();
    }
  }, [user?.avatar_url, handleEditProfile]);

  // Handle navigate to settings
  const handleSettingsPress = useCallback(() => {
    try {
      navigation.navigate('Profile');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigation]);

  // Memoize header để tránh re-render khi scroll
  const renderHeader = useCallback(() => {
    // Guard: Đảm bảo user tồn tại
    if (!user) {
      return null;
    }
    return (
      <ProfileHeader
        user={user}
        stats={stats}
        onEditPress={handleEditProfile}
        onSettingsPress={handleSettingsPress}
        onAvatarPress={handleAvatarPress}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isMe={true} // Đây là profile của chính mình
      />
    );
  }, [user, stats, handleEditProfile, handleSettingsPress, handleAvatarPress, activeTab]);

  // Handle scroll để hiện sticky header
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDifference = currentScrollY - lastScrollY.current;

    if (Math.abs(scrollDifference) > 10) {
      if (currentScrollY > 200) {
        // Scroll xuống quá 200px - hiện sticky header
        if (!isScrolledDown) {
          setIsScrolledDown(true);
        }
      } else {
        // Scroll lên trên 200px - ẩn sticky header
        if (isScrolledDown) {
          setIsScrolledDown(false);
        }
      }
    }

    lastScrollY.current = currentScrollY;

    // Update animated value
    scrollY.setValue(currentScrollY);
  };

  // Sticky header opacity
  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [150, 250],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const stickyHeaderTranslateY = scrollY.interpolate({
    inputRange: [150, 250],
    outputRange: [-60, 0],
    extrapolate: 'clamp',
  });

  const dynamicStyles = createStyles(colors, isDarkMode, insets);

  // Guard: Nếu không có user, hiển thị loading hoặc error
  if (!user) {
    return (
      <SafeAreaView style={dynamicStyles.container} edges={['top', 'bottom']}>
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top', 'bottom']}>
      {/* Sticky Header - Hiện khi scroll xuống (giống ảnh) */}
      {isScrolledDown && (
        <Animated.View
          style={[
            dynamicStyles.stickyHeader,
            {
              opacity: stickyHeaderOpacity,
              transform: [{ translateY: stickyHeaderTranslateY }],
              paddingTop: insets.top + spacing.sm, // Thêm safe area top để không bị đè bởi notch
            },
          ]}
        >
          <View style={dynamicStyles.stickyHeaderContent}>
            {/* Left: Back button */}
            <TouchableOpacity
              style={dynamicStyles.stickyMenuButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Center: Name and Handle */}
            <View style={dynamicStyles.stickyHeaderCenter}>
              <Text style={[dynamicStyles.stickyName, { color: colors.text }]}>
                {user?.full_name || user?.username || 'Người dùng'}
              </Text>
              <View style={dynamicStyles.stickyHandleRow}>
                <MaterialCommunityIcons
                  name="white-balance-sunny"
                  size={14}
                  color={colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text style={[dynamicStyles.stickyHandle, { color: colors.textSecondary }]}>
                  {user?.username || ''}
                </Text>
              </View>
            </View>

            {/* Right: Action Buttons */}
            <View style={dynamicStyles.stickyHeaderRight}>
              <TouchableOpacity
                style={[dynamicStyles.stickyEditButton, { backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#F5F5F5') }]}
                onPress={handleEditProfile}
              >
                <Text style={[dynamicStyles.stickyEditButtonText, { color: colors.text }]}>
                  Chỉnh sửa hồ sơ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.stickyMenuButtonSmall, { backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#F5F5F5') }]}
                onPress={() => { }}
              >
                <MaterialCommunityIcons name="dots-horizontal" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Posts List with Header */}
      {isLoadingPosts ? (
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredPosts.length === 0 ? (
        <View style={dynamicStyles.emptyContainer}>
          <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>
            {activeTab === 'replies' ? 'Chưa có trả lời nào' :
              activeTab === 'media' ? 'Chưa có ảnh nào' :
                activeTab === 'videos' ? 'Chưa có video nào' :
                  activeTab === 'likes' ? 'Chưa có lượt thích nào' :
                    'Chưa có bài viết nào'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredPosts}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderPost}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          initialNumToRender={10}
          onScroll={(e) => {
            handleScroll(e);
            Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )(e);
          }}
          scrollEventThrottle={16}
        />
      )}

      {/* Full Screen Image Viewer */}
      <FullScreenImageViewer
        visible={showImageViewer}
        images={imageViewerImages.map(img => getImageURL(img))}
        initialIndex={imageViewerIndex}
        onClose={() => setShowImageViewer(false)}
      />

      {/* FAB để compose post (giống social-app-main) */}
      <FAB
        icon="pencil"
        style={[dynamicStyles.fab, { backgroundColor: colors.primary || '#0084ff' }]}
        onPress={handleCreatePost}
        color="#FFFFFF"
        accessibilityLabel="Tạo bài viết mới"
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean, insets?: { bottom: number }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
    // paddingTop sẽ được set động với safe area insets
    paddingBottom: spacing.sm,
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  stickyMenuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyHeaderCenter: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  stickyName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  stickyHandleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  stickyHandle: {
    fontSize: typography.fontSize.sm,
  },
  stickyHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stickyEditButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
  },
  stickyEditButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  stickyMenuButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['2xl'],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing['2xl'],
  },
  emptyText: {
    fontSize: typography.fontSize.base,
  },
  postContainer: {
    paddingTop: spacing.md,
    paddingRight: spacing.base,
    paddingBottom: spacing.sm,
    paddingLeft: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
  },
  postLayout: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 1,
  },
  layoutAvi: {
    paddingLeft: 8,
    paddingRight: 10,
    position: 'relative',
    zIndex: 999,
  },
  layoutContent: {
    flex: 1,
    position: 'relative',
    zIndex: 0,
  },
  avatarContainer: {
    position: 'relative',
    width: 42,
    height: 42,
  },
  authorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
    gap: 4,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  authorName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.tight,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  },
  authorHandle: {
    fontSize: 16,
    marginLeft: 4,
  },
  postTime: {
    fontSize: typography.fontSize.base,
    marginLeft: 4,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.regular,
  },
  videoContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  imagesContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  postActions: {
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: 80 + ((insets && insets.bottom) || 0), // Phía trên bottom tab bar + safe area
    backgroundColor: colors.primary || '#0084ff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default MyProfileScreen;

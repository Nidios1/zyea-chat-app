import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { newsfeedAPI, friendsAPI } from '../../utils/api';
import { getInitials, getImageURL, getAvatarURL } from '../../utils/imageUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTabBar } from '../../contexts/TabBarContext';
import PostImagesCarousel from '../../components/NewsFeed/PostImagesCarousel';
import CommentsBottomSheet from '../../components/NewsFeed/CommentsBottomSheet';
import ExpandableText from '../../components/Common/ExpandableText';
import FeedTabBar from '../../components/Common/FeedTabBar';

const createStyles = (colors: typeof PWATheme.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  // Threads-style minimal header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerRight: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  // Threads-style post card
  postContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  authorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  postTime: {
    fontSize: 13,
    marginLeft: 4,
  },
  postMoreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  followButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2c2c2c', // Dark background for both light and dark mode
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    marginTop: -2,
  },
  // Threads-style content
  postContent: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  imagesContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postImage: {
    borderRadius: 12,
    width: '100%',
  },
  fullWidthImage: {
    width: '100%',
    minHeight: 200,
    maxHeight: 500,
  },
  halfWidthImage: {
    flex: 1,
    minHeight: 200,
    maxHeight: 500,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.border || '#1a1a1a',
  },
  // Threads-style actions (simpler, cleaner)
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 40,
  },
  actionCount: {
    fontSize: 13,
    marginLeft: 2,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  // Threads-style FAB
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 24,
  },
});

const PostsListScreen = () => {
  const { user } = useAuth();
  const { colors, isDarkMode } = useAppTheme();
  const navigation = useNavigation();
  const { setIsVisible } = useTabBar();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
  const [showComments, setShowComments] = useState(false);
  const [activePostId, setActivePostId] = useState<string | number | null>(null);
  const [fabVisible, setFabVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const fabOpacity = useRef(new Animated.Value(0)).current;

  // Reset tab bar visibility when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setIsVisible(true);
      return () => {
        // Optional: cleanup when screen loses focus
      };
    }, [setIsVisible])
  );

  // Fetch following list for filtering and checking follow status
  const { data: followingList = [], isLoading: isLoadingFollowing, refetch: refetchFollowing } = useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      const res = await friendsAPI.getFollowing();
      // Handle both array response and object with data property
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    // Always fetch to check follow status for all posts
  });

  // Create a Set of following IDs for quick lookup
  const followingIds = new Set(
    followingList.map((f: any) => f.following_id || f.id || f.user_id)
  );

  const {
    data: posts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['posts', activeTab],
    queryFn: async () => {
      // Pass type to API: 'all' for all public posts, 'following' for following posts
      const type = activeTab === 'following' ? 'following' : 'all';
      console.log('📱 Fetching posts with type:', type, 'activeTab:', activeTab);
      const res = await newsfeedAPI.getPosts(1, type);
      // Filter out posts with videos - videos should only appear in Video tab
      const allPosts = Array.isArray(res.data) ? res.data : (res.data?.posts || []);
      console.log('📱 Received posts:', allPosts.length, 'posts');
      if (allPosts.length > 0) {
        const userIds = [...new Set(allPosts.map((p: any) => p.user_id))];
        console.log('📱 Posts from', userIds.length, 'different users:', userIds);
        console.log('📱 Current user id:', user?.id);
      }
      
      const filtered = allPosts.filter((post: any) => {
        // Exclude posts that have video (videoUrl, video_url, or videos field)
        return !post.videoUrl && 
               !post.video_url && 
               !post.videos && 
               !(post.videos && Array.isArray(post.videos) && post.videos.length > 0);
      });
      console.log('📱 Filtered posts (no videos):', filtered.length, 'posts');
      if (filtered.length > 0) {
        console.log('📱 Sample filtered posts user_ids:', filtered.slice(0, 5).map((p: any) => ({ id: p.id, user_id: p.user_id, username: p.username || p.full_name })));
      }
      return filtered;
    },
    enabled: activeTab === 'all' || (activeTab === 'following' && !isLoadingFollowing),
    staleTime: 0, // Always consider data stale to allow refetch
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (formerly cacheTime)
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Invalidate cache to force fresh data
      await queryClient.invalidateQueries({ queryKey: ['posts', activeTab] });
      await queryClient.invalidateQueries({ queryKey: ['following'] });
      
      // Always refresh following list to get latest follow status
      await refetchFollowing();
      
      // Refetch posts with current activeTab
      await refetch();
      
      console.log('📱 Refresh completed for tab:', activeTab);
    } catch (error) {
      console.error('❌ Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFollow = async (userId: string | number) => {
    try {
      await friendsAPI.follow(userId.toString());
      // Refresh following list to update UI
      await refetchFollowing();
    } catch (error: any) {
      console.error('Error following user:', error);
      // Show error message if needed
    }
  };

  const handleUnfollow = async (userId: string | number) => {
    try {
      await friendsAPI.unfollow(userId.toString());
      // Refresh following list to update UI
      await refetchFollowing();
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      // Show error message if needed
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} giây`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày`;
    return date.toLocaleDateString('vi-VN');
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDifference = currentScrollY - lastScrollY.current;
    
    // Chỉ ẩn/hiện khi scroll đủ lớn để tránh flicker
    if (Math.abs(scrollDifference) > 10) {
      if (scrollDifference > 0 && currentScrollY > 50) {
        // Cuộn xuống - ẩn tab bar và hiện FAB
        setIsVisible(false);
        if (!fabVisible) {
          setFabVisible(true);
          Animated.timing(fabOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      } else if (scrollDifference < 0) {
        // Cuộn lên - hiện tab bar và ẩn FAB
        setIsVisible(true);
        if (fabVisible) {
          setFabVisible(false);
          Animated.timing(fabOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      }
    }
    
    // Xử lý trường hợp scroll về đầu trang
    if (currentScrollY <= 50 && fabVisible) {
      setFabVisible(false);
      Animated.timing(fabOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    
    lastScrollY.current = currentScrollY;
    scrollY.current = currentScrollY;
  };

  const dynamicStyles = createStyles(colors);

  const renderPost = ({ item, index }: { item: any, index: number }) => {
    // Get author info - API returns user fields directly on post object
    const authorName = item.full_name || item.username || 'Unknown';
    const authorAvatar = item.avatar_url || '';
    const authorId = item.user_id || item.user?.id;
    const postTime = item.created_at ? formatTimeAgo(new Date(item.created_at)) : '';

    // Check if user is following this author
    const isFollowing = authorId && followingIds.has(authorId);
    const isOwnPost = authorId === user?.id;
    const showFollowButton = !isOwnPost && !isFollowing && activeTab === 'all';

    // Format images - show 2 side by side if available
    // Check for image_url (single image) or images (array)
    const postImages = [];
    if (item.images && Array.isArray(item.images)) {
      postImages.push(...item.images);
    } else if (item.image_url) {
      postImages.push(item.image_url);
    }
    
    return (
      <View style={[dynamicStyles.postContainer, { borderBottomColor: colors.border }]}>
        {/* Threads-style Post Header */}
        <View style={dynamicStyles.postHeader}>
          <View style={dynamicStyles.authorSection}>
            {authorAvatar ? (
              <Image
                source={{ uri: getAvatarURL(authorAvatar) }}
                style={dynamicStyles.authorAvatar}
              />
            ) : (
              <Avatar.Text
                size={28}
                label={getInitials(authorName)}
                style={dynamicStyles.authorAvatar}
              />
            )}
            <View style={dynamicStyles.authorInfo}>
              <Text style={[dynamicStyles.authorName, { color: colors.text }]}>{authorName}</Text>
              {showFollowButton && (
                <TouchableOpacity
                  style={dynamicStyles.followButton}
                  onPress={() => authorId && handleFollow(authorId)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              <Text style={[dynamicStyles.postTime, { color: colors.textSecondary }]}>· {postTime}</Text>
            </View>
          </View>
          <TouchableOpacity style={dynamicStyles.postMoreButton}>
            <MaterialCommunityIcons name="dots-horizontal" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Threads-style Post Content */}
        {item.content && (
          <View style={{ marginBottom: postImages.length > 0 ? 12 : 0 }}>
            <ExpandableText
              text={item.content}
              numberOfLines={5}
              color={colors.text}
              backgroundColor={colors.surface}
              linkColor={colors.primary || '#3b82f6'}
              charLimitFallback={200}
            />
          </View>
        )}

        {/* Post Images */}
        {postImages.length > 0 && (
          <View style={dynamicStyles.imagesContainer}>
            <PostImagesCarousel
              images={postImages}
              onPressImage={(idx) => {
                // navigation.navigate('PostDetail' as never, { postId: item.id } as never);
              }}
            />
          </View>
        )}

        {/* Threads-style Post Actions */}
        <View style={dynamicStyles.postActions}>
          <TouchableOpacity style={dynamicStyles.actionButton}>
            <MaterialCommunityIcons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isLiked ? '#e74c3c' : colors.textSecondary}
            />
            {(item.likes_count || 0) > 0 && (
              <Text style={[dynamicStyles.actionCount, { color: colors.textSecondary }]}>
                {item.likes_count || 0}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={dynamicStyles.actionButton}
            onPress={() => {
              const pid = item?.id || item?._id || item?.post_id || item?.postId || null;
              setActivePostId(pid);
              setShowComments(true);
            }}
          >
            <MaterialCommunityIcons name="message-outline" size={20} color={colors.textSecondary} />
            {(item.comments_count || 0) > 0 && (
              <Text style={[dynamicStyles.actionCount, { color: colors.textSecondary }]}>
                {item.comments_count || 0}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.actionButton}>
            <MaterialCommunityIcons name="repeat" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.actionButton}>
            <MaterialCommunityIcons name="send-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Threads-style Minimal Header */}
      <View style={[dynamicStyles.headerBar, { borderBottomColor: colors.border }]}>
        <View style={dynamicStyles.logoSection}>
          <Image
            source={require('../../../assets/icon.png')}
            style={dynamicStyles.logoImage}
          />
          <Text style={[dynamicStyles.logoText, { color: colors.text }]}>Zyea+</Text>
        </View>
        <TouchableOpacity style={dynamicStyles.headerRight}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Feed Tabs */}
      <FeedTabBar 
        activeTab={activeTab} 
        onTabChange={(tabId) => setActiveTab(tabId as 'all' | 'following')} 
      />

      {/* Posts List */}
      {isLoading && !refreshing ? (
        <View style={[dynamicStyles.emptyContainer, { paddingTop: 100 }]}>
          <ActivityIndicator size="large" color={colors.primary || '#0084ff'} />
          <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary, marginTop: 16 }]}>
            Đang tải bài viết...
          </Text>
        </View>
      ) : isError ? (
        <View style={[dynamicStyles.emptyContainer, { paddingTop: 100 }]}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error || '#e74c3c'} />
          <Text style={[dynamicStyles.emptyText, { color: colors.error || '#e74c3c', marginTop: 16 }]}>
            Không thể tải bài viết
          </Text>
          <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary, marginTop: 8, fontSize: 13 }]}>
            {error instanceof Error ? error.message : 'Đã xảy ra lỗi'}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              marginTop: 16,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: colors.primary || '#0084ff',
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderPost}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={dynamicStyles.listContent}
          ListEmptyComponent={
            <View style={dynamicStyles.emptyContainer}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={48} color={colors.textSecondary} />
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary, marginTop: 16 }]}>
                Chưa có bài viết nào
              </Text>
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary, marginTop: 8, fontSize: 13 }]}>
                Kéo xuống để làm mới
              </Text>
            </View>
          }
        />
      )}

      <CommentsBottomSheet
        postId={activePostId}
        visible={showComments}
        onClose={() => setShowComments(false)}
        placeholder={`Bình luận cho ${user?.username || 'bài viết'}`}
      />

      {/* Floating Action Button */}
      <Animated.View
        style={[
          dynamicStyles.fab,
          {
            backgroundColor: colors.primary || '#0084ff',
            opacity: fabOpacity,
            transform: [
              {
                scale: fabOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
        pointerEvents={fabVisible ? 'auto' : 'none'}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('CreatePost' as never)}
          style={{
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="plus"
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default PostsListScreen;

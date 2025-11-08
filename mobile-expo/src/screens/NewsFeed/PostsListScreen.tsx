import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { newsfeedAPI, friendsAPI } from '../../utils/api';
import { getInitials, getImageURL, getAvatarURL, getVideoURL } from '../../utils/imageUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useTabBar } from '../../contexts/TabBarContext';
import PostImagesCarousel from '../../components/NewsFeed/PostImagesCarousel';
import CommentsBottomSheet from '../../components/NewsFeed/CommentsBottomSheet';
import ExpandableText from '../../components/Common/ExpandableText';
import FullScreenImageViewer from '../../components/Common/FullScreenImageViewer';
import { Video, ResizeMode } from 'expo-av';

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
  },
  headerLeft: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeftWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '400',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  authorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  postTime: {
    fontSize: 12,
    marginLeft: 0,
    lineHeight: 18,
  },
  postMoreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  followButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  // Threads-style content wrapper - aligns with username
  postContentWrapper: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 0,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
    marginLeft: 52, // Align with username (40px avatar + 12px gap)
  },
  imagesContainer: {
    marginTop: 8,
    marginBottom: 0,
    borderRadius: 0,
    overflow: 'hidden',
    width: '100%',
  },
  videoContainer: {
    marginTop: 8,
    marginBottom: 0,
    width: '100%',
    overflow: 'hidden',
  },
  videoWrapper: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 200,
    maxHeight: 600,
  },
  videoPlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    gap: 20,
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 40,
    paddingVertical: 4,
  },
  actionCount: {
    fontSize: 12,
    marginLeft: 0,
    lineHeight: 16,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  // "Có gì mới?" section
  newPostSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  newPostContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newPostAvatarContainer: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  newPostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  newPostTextContainer: {
    flex: 1,
  },
  newPostUsername: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  newPostPrompt: {
    fontSize: 13,
    letterSpacing: -0.1,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 24,
  },
  // Menu Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 20,
    maxHeight: 300,
  },
  menuHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  menuContent: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemText: {
    fontSize: 16,
  },
});

const PostsListScreen = () => {
  const { user } = useAuth();
  const { colors, isDarkMode } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { setIsVisible } = useTabBar();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const lastRefreshParam = useRef<number | null>(null);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
  const [showComments, setShowComments] = useState(false);
  const [activePostId, setActivePostId] = useState<string | number | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const [fabVisible, setFabVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');
  const [showMenu, setShowMenu] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [imageViewerPostData, setImageViewerPostData] = useState<any>(null);
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const fabOpacity = useRef(new Animated.Value(0)).current;
  const menuButtonScale = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);

  // Reset tab bar visibility when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setIsVisible(true);
      return () => {
        // Optional: cleanup when screen loses focus
      };
    }, [setIsVisible])
  );

  // Listen for navigation params to trigger refresh when Home tab is pressed
  useEffect(() => {
    const params = route.params as any;
    if (params?.refresh && params.refresh !== lastRefreshParam.current) {
      lastRefreshParam.current = params.refresh;
      
      // Immediately show refresh indicator
      setRefreshing(true);
      
      // Scroll to top with animation
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      
      // Small delay to show scroll animation, then trigger refresh
      setTimeout(() => {
        handleRefresh();
      }, 200);
    }
  }, [route.params, handleRefresh]);

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
      // Include all posts (including videos) in news feed
      const allPosts = Array.isArray(res.data) ? res.data : (res.data?.posts || []);
      console.log('📱 Received posts:', allPosts.length, 'posts');
      if (allPosts.length > 0) {
        const userIds = [...new Set(allPosts.map((p: any) => p.user_id))];
        console.log('📱 Posts from', userIds.length, 'different users:', userIds);
        console.log('📱 Current user id:', user?.id);
      }
      
      // Return all posts (including videos) - videos will be displayed in news feed
      console.log('📱 Posts with videos:', allPosts.filter((p: any) => p.videoUrl || p.video_url || p.videos).length);
      return allPosts;
    },
    enabled: activeTab === 'all' || (activeTab === 'following' && !isLoadingFollowing),
    staleTime: 0, // Always consider data stale to allow refetch
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (formerly cacheTime)
  });

  const handleRefresh = useCallback(async () => {
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
  }, [queryClient, activeTab, refetchFollowing, refetch]);

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

  const handleVideoPress = async (postId: string, videoUrl: string) => {
    try {
      // If this video is already playing, pause it
      if (playingVideoId === postId) {
        setPlayingVideoId(null);
        return;
      }
      
      // Set the new playing video ID - useEffect will handle playing
      const videoRef = videoRefs.current[postId];
      if (videoRef) {
        try {
          const status = await videoRef.getStatusAsync();
          if (status.isLoaded) {
            // Reset to beginning before playing
            await videoRef.setPositionAsync(0);
          }
        } catch (error) {
          // Ignore errors - video might not be loaded yet
        }
      }
      
      // Set playing video ID - useEffect will handle playing
      setPlayingVideoId(postId);
    } catch (error) {
      console.error('Error handling video press:', error);
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

  // Effect to play/pause video when playingVideoId changes
  useEffect(() => {
    const playVideo = async () => {
      const currentPlayingId = playingVideoId;
      
      if (currentPlayingId) {
        const videoRef = videoRefs.current[currentPlayingId];
        if (videoRef) {
          try {
            // Check if video is loaded
            const status = await videoRef.getStatusAsync();
            if (status.isLoaded) {
              // Reset to beginning and play
              await videoRef.setPositionAsync(0);
              await videoRef.playAsync();
            } else {
              // Video not loaded yet, wait a bit and retry
              setTimeout(async () => {
                // Check if still the same video
                if (playingVideoId === currentPlayingId) {
                  try {
                    const retryStatus = await videoRef.getStatusAsync();
                    if (retryStatus.isLoaded) {
                      await videoRef.setPositionAsync(0);
                      await videoRef.playAsync();
                    }
                  } catch (error) {
                    console.error('Error playing video on retry:', error);
                    if (playingVideoId === currentPlayingId) {
                      setPlayingVideoId(null);
                    }
                  }
                }
              }, 200);
            }
          } catch (error) {
            console.error('Error playing video:', error);
            if (playingVideoId === currentPlayingId) {
              setPlayingVideoId(null);
            }
          }
        }
      } else {
        // Pause all videos when playingVideoId is null
        Object.values(videoRefs.current).forEach(async (ref) => {
          if (ref) {
            try {
              const status = await ref.getStatusAsync();
              if (status.isLoaded && status.isPlaying) {
                await ref.pauseAsync();
              }
            } catch (error) {
              // Ignore errors
            }
          }
        });
      }
    };
    
    playVideo();
  }, [playingVideoId]);

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
    
    // Get video URL - check for videoUrl, video_url, or videos field
    let postVideoUrl = item.videoUrl || item.video_url;
    if (!postVideoUrl && item.videos) {
      postVideoUrl = Array.isArray(item.videos) ? item.videos[0] : item.videos;
    }
    if (postVideoUrl) {
      postVideoUrl = getVideoURL(postVideoUrl);
    }
    
    // Get video thumbnail
    const videoThumbnail = item.thumbnailUrl || 
                          (item.images && item.images[0]) || 
                          item.image_url || 
                          undefined;
    
    return (
      <View style={[dynamicStyles.postContainer, { borderBottomColor: colors.border }]}>
        {/* Threads-style Post Header */}
        <View style={dynamicStyles.postHeader}>
          <View style={dynamicStyles.authorSection}>
            <TouchableOpacity
              style={dynamicStyles.avatarContainer}
              onPress={() => {
                if (authorId && authorId !== user?.id) {
                  navigation.navigate('OtherUserProfile' as never, { userId: authorId.toString() } as never);
                }
              }}
              activeOpacity={0.7}
            >
              {authorAvatar ? (
                <Image
                  source={{ uri: getAvatarURL(authorAvatar) }}
                  style={dynamicStyles.authorAvatar}
                />
              ) : (
                <Avatar.Text
                  size={40}
                  label={getInitials(authorName)}
                  style={dynamicStyles.authorAvatar}
                />
              )}
              {showFollowButton && (
                <TouchableOpacity
                  style={dynamicStyles.followButton}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    if (authorId) {
                      handleFollow(authorId);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="plus" size={10} color="#000000" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={dynamicStyles.authorInfo}
              onPress={() => {
                if (authorId && authorId !== user?.id) {
                  navigation.navigate('OtherUserProfile' as never, { userId: authorId.toString() } as never);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[dynamicStyles.authorName, { color: colors.text }]}>{authorName}</Text>
              <Text style={[dynamicStyles.postTime, { color: colors.textSecondary }]}>· {postTime}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={dynamicStyles.postMoreButton}>
            <MaterialCommunityIcons name="dots-horizontal" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Threads-style Post Content - Align with username */}
        {item.content && (
          <View style={[dynamicStyles.postContentWrapper, { marginBottom: (postImages.length > 0 || postVideoUrl) ? 0 : 0 }]}>
            <View style={dynamicStyles.postContent}>
              <ExpandableText
                text={item.content}
                numberOfLines={5}
                color={colors.text}
                backgroundColor={colors.surface}
                linkColor={colors.primary || '#3b82f6'}
                charLimitFallback={200}
              />
            </View>
          </View>
        )}

        {/* Post Video */}
        {postVideoUrl && (
          <View style={dynamicStyles.videoContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={dynamicStyles.videoWrapper}
              onPress={() => handleVideoPress(String(item.id), postVideoUrl)}
            >
              <Video
                ref={(ref) => {
                  videoRefs.current[String(item.id)] = ref;
                }}
                source={{ uri: postVideoUrl }}
                style={dynamicStyles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                useNativeControls={false}
                isMuted={false}
                isLooping={false}
                posterSource={videoThumbnail ? { uri: getImageURL(videoThumbnail) } : undefined}
                onLoad={async () => {
                  // Video loaded
                  const videoRef = videoRefs.current[String(item.id)];
                  if (videoRef) {
                    try {
                      if (playingVideoId === String(item.id)) {
                        // If this video should be playing, play it now
                        await videoRef.setPositionAsync(0);
                        await videoRef.playAsync();
                      } else {
                        // Reset to beginning if not playing
                        await videoRef.setPositionAsync(0);
                      }
                    } catch (error) {
                      // Ignore errors
                    }
                  }
                }}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded) {
                    if (status.didJustFinish) {
                      // Video finished playing, reset state
                      setPlayingVideoId(null);
                    } else if (status.error) {
                      // Video error, reset state
                      console.error('Video playback error:', status.error);
                      setPlayingVideoId(null);
                    }
                  }
                }}
              />
              {/* Play Button Overlay - Hide when playing */}
              {playingVideoId !== String(item.id) && (
                <View style={dynamicStyles.videoPlayButton}>
                  <MaterialCommunityIcons name="play-circle" size={64} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Post Images */}
        {postImages.length > 0 && (
          <View style={dynamicStyles.imagesContainer}>
            <PostImagesCarousel
              images={postImages}
              onPressImage={(idx) => {
                // Open full screen image viewer
                setImageViewerImages(postImages);
                setImageViewerIndex(idx);
                setImageViewerPostData({
                  id: item.id,
                  likes: item.likes_count || 0,
                  comments: item.comments_count || 0,
                  isLiked: item.isLiked || false,
                  onLike: () => {
                    // Handle like - you can implement this based on your API
                    console.log('Like post:', item.id);
                  },
                  onComment: () => {
                    // Open comments
                    setActivePostId(item.id);
                    setShowComments(true);
                    setShowImageViewer(false);
                  },
                  onRepost: () => {
                    // Handle repost
                    console.log('Repost post:', item.id);
                  },
                  onShare: () => {
                    // Handle share
                    console.log('Share post:', item.id);
                  },
                });
                setShowImageViewer(true);
              }}
            />
          </View>
        )}

        {/* Threads-style Post Actions */}
        <View style={dynamicStyles.postActions}>
          <TouchableOpacity style={dynamicStyles.actionButton}>
            <MaterialCommunityIcons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={22}
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
            <MaterialCommunityIcons name="message-outline" size={22} color={colors.textSecondary} />
            {(item.comments_count || 0) > 0 && (
              <Text style={[dynamicStyles.actionCount, { color: colors.textSecondary }]}>
                {item.comments_count || 0}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.actionButton}>
            <MaterialCommunityIcons name="repeat" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.actionButton}>
            <MaterialCommunityIcons name="send-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Threads-style Minimal Header */}
      <View style={dynamicStyles.headerBar}>
        {activeTab === 'following' ? (
          <>
            <TouchableOpacity 
              style={dynamicStyles.headerLeftWithText}
              onPress={() => setActiveTab('all')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
              <Text style={[dynamicStyles.backButtonText, { color: colors.text }]}>Quay lại</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Đang theo dõi</Text>
            </View>
            <View style={dynamicStyles.headerRight} />
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={dynamicStyles.headerLeft}
              onPressIn={() => {
                Animated.spring(menuButtonScale, {
                  toValue: 0.9,
                  useNativeDriver: true,
                  tension: 300,
                  friction: 10,
                }).start();
              }}
              onPressOut={() => {
                Animated.spring(menuButtonScale, {
                  toValue: 1,
                  useNativeDriver: true,
                  tension: 300,
                  friction: 10,
                }).start();
              }}
              onPress={() => {
                setShowMenu(true);
              }}
              activeOpacity={1}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Animated.View style={{ transform: [{ scale: menuButtonScale }] }}>
                <MaterialCommunityIcons name="menu" size={24} color={colors.text} />
              </Animated.View>
            </TouchableOpacity>
            <View style={dynamicStyles.logoSection}>
              <Image
                source={require('../../../assets/icon.png')}
                style={dynamicStyles.logoImage}
              />
            </View>
            <TouchableOpacity style={dynamicStyles.headerRight}>
              <MaterialCommunityIcons name="magnify" size={22} color={colors.text} />
            </TouchableOpacity>
          </>
        )}
      </View>

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
          ref={flatListRef}
          data={posts}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderPost}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary || '#0084ff'}
              colors={[colors.primary || '#0084ff']}
              progressBackgroundColor={colors.surface || '#FFFFFF'}
              title="Đang làm mới..."
              titleColor={colors.textSecondary || '#666666'}
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={dynamicStyles.listContent}
          ListHeaderComponent={
            activeTab === 'all' ? (
              <TouchableOpacity
                style={[dynamicStyles.newPostSection, { borderBottomColor: colors.border }]}
                onPress={() => navigation.navigate('CreatePost' as never)}
                activeOpacity={0.7}
              >
                <View style={dynamicStyles.newPostContent}>
                  <View style={dynamicStyles.newPostAvatarContainer}>
                    {user?.avatar_url ? (
                      <Image
                        source={{ uri: getAvatarURL(user.avatar_url) }}
                        style={dynamicStyles.newPostAvatar}
                      />
                    ) : (
                      <Avatar.Text
                        size={48}
                        label={getInitials(user?.full_name || user?.username || 'U')}
                        style={dynamicStyles.newPostAvatar}
                      />
                    )}
                  </View>
                  <View style={dynamicStyles.newPostTextContainer}>
                    <Text style={[dynamicStyles.newPostUsername, { color: colors.text }]}>
                      {user?.full_name || user?.username || 'Bạn'}
                    </Text>
                    <Text style={[dynamicStyles.newPostPrompt, { color: colors.textSecondary }]}>
                      Có gì mới?
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : null
          }
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

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View 
            style={[dynamicStyles.menuContainer, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
          >
            <View style={[dynamicStyles.menuHandle, { backgroundColor: colors.border }]} />
            <View style={dynamicStyles.menuContent}>
              <TouchableOpacity
                style={[
                  dynamicStyles.menuItem,
                  activeTab === 'all' && { backgroundColor: colors.primary + '20' },
                  { borderBottomColor: colors.border }
                ]}
                onPress={() => {
                  setActiveTab('all');
                  setShowMenu(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[dynamicStyles.menuItemText, { 
                  color: activeTab === 'all' ? colors.primary : colors.text,
                  fontWeight: activeTab === 'all' ? '600' : '400'
                }]}>
                  Tất cả
                </Text>
                {activeTab === 'all' && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.menuItem,
                  activeTab === 'following' && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => {
                  setActiveTab('following');
                  setShowMenu(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[dynamicStyles.menuItemText, { 
                  color: activeTab === 'following' ? colors.primary : colors.text,
                  fontWeight: activeTab === 'following' ? '600' : '400'
                }]}>
                  Đang theo dõi
                </Text>
                {activeTab === 'following' && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Floating Action Button */}
      <Animated.View
        style={[
          dynamicStyles.fab,
          {
            backgroundColor: colors.primary || '#0084ff',
            shadowColor: isDarkMode ? '#000000' : '#000000',
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
            color={isDarkMode ? '#000000' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Full Screen Image Viewer */}
      <FullScreenImageViewer
        visible={showImageViewer}
        images={imageViewerImages}
        initialIndex={imageViewerIndex}
        onClose={() => setShowImageViewer(false)}
        postData={imageViewerPostData}
      />
    </SafeAreaView>
  );
};

export default PostsListScreen;

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { newsfeedAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAvatarURL, getImageURL, getVideoURL } from '../../utils/imageUtils';
import { API_BASE_URL } from '../../config/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoItem {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
    full_name?: string;
  };
  caption?: string;
  overlayCaption?: string; // Large caption for overlay
  likes: number;
  comments: number;
  shares?: number; // For remix/share count
  isLiked: boolean;
  createdAt: string;
}

const VideoFeedScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playingIndex, setPlayingIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const [expandedCaptions, setExpandedCaptions] = useState<{ [key: string]: boolean }>({});
  const [videoLoadingStates, setVideoLoadingStates] = useState<{ [key: string]: boolean }>({});
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pullDistance = useRef(new Animated.Value(0)).current;
  const [isPulling, setIsPulling] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Reload videos when screen is focused (after posting new video)
  useFocusEffect(
    React.useCallback(() => {
      loadVideos();
    }, [])
  );

  useEffect(() => {
    // Play video when index changes, but only if videos are loaded
    if (videos.length > 0 && playingIndex >= 0 && playingIndex < videos.length) {
      // Play immediately without delay for faster response
      playVideo(playingIndex);
    }
  }, [playingIndex, videos.length]);

  const loadVideos = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      // Load posts from API and filter for videos
      const response = await newsfeedAPI.getPosts(1);
      // Handle both array response and object with posts property
      const posts = Array.isArray(response.data) ? response.data : (response.data?.posts || []);
      
      console.log('Loaded posts:', posts.length);
      console.log('Posts with video:', posts.filter((p: any) => p.videoUrl || p.video_url).length);
      
      // Filter posts with videos
      // Check for videoUrl, video_url, or videos field
      const videoPosts: VideoItem[] = posts
        .filter((post: any) => {
          return post.videoUrl || 
                 post.video_url || 
                 post.videos || 
                 (post.videos && Array.isArray(post.videos) && post.videos.length > 0);
        })
        .map((post: any) => {
          // Determine video URL from various possible fields
          let videoUrl = post.videoUrl || post.video_url;
          if (!videoUrl && post.videos) {
            videoUrl = Array.isArray(post.videos) ? post.videos[0] : post.videos;
          }
          
          // Format video URL using utility function
          if (videoUrl) {
            videoUrl = getVideoURL(videoUrl);
            console.log('Video URL formatted:', {
              original: post.videoUrl || post.video_url,
              formatted: videoUrl,
              postId: post.id
            });
          } else {
            console.warn('No video URL found for post:', post.id);
          }

          // Get user info - handle different response structures
          const userInfo = post.user || {
            id: post.user_id,
            username: post.username,
            full_name: post.full_name,
            avatar: post.avatar_url,
          };

          const videoItem = {
            id: String(post.id),
            videoUrl: videoUrl || '',
            thumbnailUrl: post.thumbnailUrl || 
                         (post.images && post.images[0]) || 
                         post.image_url || 
                         undefined,
            user: {
              id: String(userInfo.id || post.user_id),
              username: userInfo.username || '',
              full_name: userInfo.full_name || '',
              avatar: getAvatarURL(userInfo.avatar || userInfo.avatar_url),
            },
            caption: post.content || '',
            overlayCaption: post.content || '', // Use same caption for overlay
            likes: post.likes_count || post.likes || 0,
            comments: post.comments_count || post.comments || 0,
            shares: post.shares_count || post.shares || 0,
            isLiked: post.isLiked || false,
            createdAt: post.created_at || post.createdAt || new Date().toISOString(),
          };
          
          console.log('Mapped video item:', {
            id: videoItem.id,
            videoUrl: videoItem.videoUrl,
            hasVideoUrl: !!videoItem.videoUrl
          });
          
          return videoItem;
        });

      setVideos(videoPosts);
      
      // If refreshing, scroll to top (newest video)
      if (isRefresh && videoPosts.length > 0 && flatListRef.current) {
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index: 0,
              animated: true,
            });
            setCurrentIndex(0);
            setPlayingIndex(0);
          } catch (error) {
            // Fallback if scrollToIndex fails
            flatListRef.current?.scrollToOffset({
              offset: 0,
              animated: true,
            });
            setCurrentIndex(0);
            setPlayingIndex(0);
          }
        }, 300);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Start rotation animation
    rotateAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
    
    await loadVideos(true);
    
    // Stop rotation animation
    rotateAnim.stopAnimation();
    rotateAnim.setValue(0);
    
    // Reset pull distance
    Animated.spring(pullDistance, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
    
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const playVideo = async (index: number) => {
    // Validate index
    if (index < 0 || index >= videos.length || !videos[index]) {
      console.warn('Invalid video index:', index);
      return;
    }

    // Pause all videos first (except the one we want to play)
    const pausePromises = Object.entries(videoRefs.current).map(async ([id, ref]) => {
      if (ref && id !== videos[index].id) {
        try {
          const status = await ref.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await ref.pauseAsync();
          }
        } catch (error) {
          // Ignore errors when pausing other videos
        }
      }
    });
    await Promise.all(pausePromises);

    // Play current video
    const videoId = videos[index].id;
    const videoRef = videoRefs.current[videoId];
    if (videoRef) {
      try {
        // Check if video is loaded before playing
        const status = await videoRef.getStatusAsync();
        if (status.isLoaded) {
          // Reset video to beginning (like Instagram) before playing
          try {
            await videoRef.setPositionAsync(0);
          } catch (seekError) {
            // Ignore seek errors - video might be at beginning already
          }
          
          // Set looping first
          await videoRef.setIsLoopingAsync(true);
          
          // Then play from beginning
          if (!status.isPlaying) {
            await videoRef.playAsync();
          } else {
            // If already playing, restart from beginning
            await videoRef.pauseAsync();
            await videoRef.setPositionAsync(0);
            await videoRef.playAsync();
          }
        } else {
          // Video not loaded yet, wait a bit and retry (reduced delay)
          setTimeout(async () => {
            try {
              const retryStatus = await videoRef.getStatusAsync();
              if (retryStatus.isLoaded) {
                // Reset to beginning
                try {
                  await videoRef.setPositionAsync(0);
                } catch (seekError) {
                  // Ignore seek errors
                }
                await videoRef.setIsLoopingAsync(true);
                if (!retryStatus.isPlaying) {
                  await videoRef.playAsync();
                } else {
                  await videoRef.pauseAsync();
                  await videoRef.setPositionAsync(0);
                  await videoRef.playAsync();
                }
              }
            } catch (error) {
              console.error('Error playing video on retry:', error);
            }
          }, 100); // Reduced from 500ms to 100ms for faster loading
        }
      } catch (error) {
        console.error('Error playing video:', error);
      }
    } else {
      console.warn('Video ref not found for index:', index, 'videoId:', videoId);
    }
  };

  const pauseVideo = async (index: number) => {
    if (index < 0 || index >= videos.length || !videos[index]) {
      return;
    }
    const videoId = videos[index].id;
    const videoRef = videoRefs.current[videoId];
    if (videoRef) {
      try {
        const status = await videoRef.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await videoRef.pauseAsync();
          // Reset to beginning when pausing (so it starts from beginning next time, like Instagram)
          try {
            await videoRef.setPositionAsync(0);
          } catch (seekError) {
            // Ignore seek errors
          }
        }
      } catch (error) {
        // Silently ignore errors when pausing (video might be unmounted)
      }
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const viewableItem = viewableItems[0];
      const index = viewableItem.index;
      if (index !== null && index !== undefined && viewableItem.isViewable && viewableItem.item) {
        // Only update if the index actually changed to avoid unnecessary updates
        setCurrentIndex((prevIndex) => {
          if (prevIndex !== index && prevIndex >= 0 && prevIndex < videos.length) {
            // Pause previous video when switching (async, don't wait)
            pauseVideo(prevIndex).catch(err => {
              console.error('Error pausing previous video:', err);
            });
            return index;
          }
          return prevIndex;
        });
        // Update playing index separately to trigger useEffect
        setPlayingIndex((prevIndex) => {
          if (prevIndex !== index) {
            return index;
          }
          return prevIndex;
        });
      }
    } else {
      // No viewable items - pause current video
      setCurrentIndex((prevIndex) => {
        if (prevIndex >= 0 && prevIndex < videos.length) {
          pauseVideo(prevIndex).catch(err => {
            console.error('Error pausing video:', err);
          });
        }
        return prevIndex;
      });
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 30, // Video must be 30% visible to be considered viewable (lowered for faster preloading)
    minimumViewTime: 0, // No minimum view time for immediate response
    waitForInteraction: false,
  }).current;

  const formatCount = (count: number): string => {
    // Format like: 4495 -> 4.495, 75 -> 75
    if (count >= 1000) {
      return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    return count.toString();
  };

  const handleLike = async (videoId: string, index: number) => {
    try {
      const video = videos[index];
      const newVideos = [...videos];
      newVideos[index] = {
        ...video,
        isLiked: !video.isLiked,
        likes: video.isLiked ? video.likes - 1 : video.likes + 1,
      };
      setVideos(newVideos);

      // Call API to like/unlike
      if (!video.isLiked) {
        await newsfeedAPI.likePost(videoId);
      } else {
        await newsfeedAPI.unlikePost(videoId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const renderVideoItem = ({ item, index }: { item: VideoItem; index: number }) => {
    const isActive = index === currentIndex;

    return (
      <View style={styles.videoContainer}>
        {item.videoUrl ? (
          <Video
            ref={(ref) => {
              videoRefs.current[item.id] = ref;
            }}
            source={{ uri: item.videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isLooping
            isMuted={false}
            useNativeControls={false}
            progressUpdateIntervalMillis={1000}
            posterSource={item.thumbnailUrl ? { uri: item.thumbnailUrl } : undefined}
            onLoadStart={() => {
              console.log('Video load start:', item.videoUrl, 'index:', index);
              setVideoLoadingStates(prev => ({ ...prev, [item.id]: true }));
              // Don't pause on load start - let viewability handler manage it
            }}
            onLoad={async () => {
              console.log('Video loaded:', item.videoUrl, 'index:', index, 'isActive:', isActive, 'currentIndex:', currentIndex);
              setVideoLoadingStates(prev => ({ ...prev, [item.id]: false }));
              
              // Reset video to beginning when loaded (if not active, reset anyway for next time)
              const videoRef = videoRefs.current[item.id];
              if (videoRef) {
                try {
                  const status = await videoRef.getStatusAsync();
                  if (status.isLoaded) {
                    // Always reset to beginning when video loads
                    await videoRef.setPositionAsync(0);
                  }
                } catch (error) {
                  // Ignore errors
                }
              }
              
              // Only play if this video is currently active and matches current index
              if (isActive && index === currentIndex && index === playingIndex) {
                // Play immediately - video is already loaded
                playVideo(index);
              } else if (!isActive) {
                // Ensure video is paused if not active
                pauseVideo(index);
              }
            }}
            onError={(error) => {
              console.error('Video load error:', {
                videoUrl: item.videoUrl,
                postId: item.id,
                error: error
              });
            }}
          />
        ) : (
          <View style={[styles.video, styles.videoErrorContainer]}>
            <MaterialCommunityIcons name="video-off" size={64} color="#FFFFFF" />
            <Text style={styles.videoErrorText}>Video không khả dụng</Text>
          </View>
        )}

        {/* Only show overlays and content for active video */}
        {isActive && (
          <>
            {/* Loading Spinner */}
            {videoLoadingStates[item.id] && (
              <View style={styles.loadingSpinnerContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}

            {/* Username on Left Side (TikTok style) */}
            <View style={styles.leftUsername}>
              <Text style={styles.leftUsernameText}>@{item.user.username}</Text>
            </View>

            {/* Caption Overlay - Large text in top-middle */}
            {(item.overlayCaption || item.caption) && (
              <View style={styles.captionOverlay}>
                <Text style={styles.captionOverlayText}>{item.overlayCaption || item.caption}</Text>
              </View>
            )}

            {/* Bottom Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.bottomGradient}
            />

            {/* Bottom Content */}
            <View 
              style={[
                styles.bottomContent, 
                { 
                  paddingBottom: Math.max(insets.bottom + 10, 15),
                  bottom: 0,
                }
              ]}
            >
              {/* Left Side - User Info & Follow Button */}
              <View style={styles.leftContent}>
                <View style={styles.userInfoRow}>
                  <Image
                    source={{
                      uri: item.user.avatar || getAvatarURL(item.user.avatar) || 'https://via.placeholder.com/40',
                    }}
                    style={styles.userAvatarSmall}
                  />
                  <Text style={styles.usernameSmall}>{item.user.full_name || item.user.username}</Text>
                  <TouchableOpacity style={styles.followButton}>
                    <Text style={styles.followButtonText}>Theo dõi</Text>
                  </TouchableOpacity>
                </View>
                {item.caption && (
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    onPress={() => {
                      setExpandedCaptions(prev => ({
                        ...prev,
                        [item.id]: !prev[item.id]
                      }));
                    }}
                    style={styles.captionTouchable}
                  >
                    <Text style={styles.captionSmall} numberOfLines={expandedCaptions[item.id] ? undefined : 2}>
                      {item.caption}
                      {!expandedCaptions[item.id] && item.caption.length > 80 && (
                        <Text style={styles.seeMoreText}>... xem thêm</Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Right Side - Actions */}
              <View style={styles.rightActions}>
                {/* Like Button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleLike(item.id, index)}
                >
                  <MaterialCommunityIcons
                    name={item.isLiked ? 'heart' : 'heart-outline'}
                    size={28}
                    color={item.isLiked ? '#ff3040' : '#fff'}
                  />
                  <Text style={styles.actionCount}>{formatCount(item.likes)}</Text>
                </TouchableOpacity>

                {/* Comment Button */}
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialCommunityIcons name="comment-outline" size={28} color="#fff" />
                  <Text style={styles.actionCount}>{formatCount(item.comments)}</Text>
                </TouchableOpacity>

                {/* Share/Remix Button */}
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialCommunityIcons name="sync" size={28} color="#fff" />
                  <Text style={styles.actionCount}>{formatCount(item.shares || 274)}</Text>
                </TouchableOpacity>

                {/* Send Button */}
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialCommunityIcons name="send-outline" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  // Video feed background - black for video viewing experience (like Instagram/TikTok)
  // But empty/loading states follow user's theme preference
  const videoBackground = '#000000';
  
  // Theme-based colors for empty and loading states
  const emptyStateBg = colors.background;
  const emptyStateHeaderBg = colors.surface;
  const emptyStateTextColor = colors.text;
  const emptyStateIconColor = colors.text;
  const emptyStateButtonBg = colors.border;
  
  // Header colors for video feed (always dark overlay for video)
  const videoHeaderBg = 'rgba(0, 0, 0, 0.3)';
  const videoHeaderTextColor = '#FFFFFF';
  const videoHeaderButtonBg = 'rgba(0, 0, 0, 0.5)';

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: emptyStateBg }]}>
        {/* Header with Back Button */}
        <View style={[styles.header, { 
          paddingTop: insets.top + 10, 
          backgroundColor: emptyStateHeaderBg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: emptyStateButtonBg }]}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={emptyStateIconColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: emptyStateTextColor }]}>Video</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: emptyStateBg }]}>
        {/* Header with Back Button */}
        <View style={[styles.header, { 
          paddingTop: insets.top + 10, 
          backgroundColor: emptyStateHeaderBg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: emptyStateButtonBg }]}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={emptyStateIconColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: emptyStateTextColor }]}>Video</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="video-outline" 
            size={64} 
            color={colors.textSecondary} 
            style={{ marginBottom: 16 }}
          />
          <Text style={[styles.emptyText, { color: emptyStateTextColor }]}>
            Không có video
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
            Đăng video đầu tiên của bạn để bắt đầu
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: videoBackground }]}>
      {/* Back Button Header - Fixed, only one */}
      <View style={[styles.backHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backHeaderButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.reloadButton}
          onPress={onRefresh}
          disabled={refreshing}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ rotate: refreshing ? spin : '0deg' }] }}>
            <MaterialCommunityIcons 
              name="refresh" 
              size={24} 
              color="#FFFFFF"
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Custom Pull to Refresh Indicator */}
      {currentIndex === 0 && (
        <Animated.View 
          style={[
            styles.pullToRefreshIndicator,
            {
              opacity: pullDistance.interpolate({
                inputRange: [0, 30, 60],
                outputRange: [0, 0.5, 1],
              }),
              transform: [{
                translateY: pullDistance.interpolate({
                  inputRange: [0, 60],
                  outputRange: [-60, 0],
                }),
              }],
            }
          ]}
        >
          <Animated.View
            style={{
              transform: [{
                rotate: pullDistance.interpolate({
                  inputRange: [0, 60],
                  outputRange: ['0deg', '180deg'],
                }),
              }],
            }}
          >
            <MaterialCommunityIcons 
              name={refreshing ? "loading" : "arrow-down"} 
              size={24} 
              color="#FFFFFF" 
            />
          </Animated.View>
          {refreshing && (
            <Text style={styles.pullToRefreshText}>
              Đang làm mới...
            </Text>
          )}
        </Animated.View>
      )}
      
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        contentContainerStyle={{ 
          paddingTop: 0,
          paddingBottom: 0,
        }}
        style={{ flex: 1 }}
        removeClippedSubviews={false}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
        updateCellsBatchingPeriod={50}
        overScrollMode={currentIndex === 0 ? "auto" : "never"}
        bounces={currentIndex === 0}
        scrollEnabled={videos.length > 0}
        refreshControl={
          currentIndex === 0 ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
              progressViewOffset={insets.top}
              title="Đang làm mới..."
              titleColor="#FFFFFF"
              onRefreshStateChange={(isRefreshing) => {
                if (isRefreshing) {
                  setIsPulling(true);
                } else {
                  setIsPulling(false);
                }
              }}
            />
          ) : undefined
        }
        onScroll={(event) => {
          // Prevent over-scrolling - snap to exact positions
          const offsetY = event.nativeEvent.contentOffset.y;
          const maxScroll = (videos.length - 1) * SCREEN_HEIGHT;
          
          // Update pull distance for animation (only at top)
          if (currentIndex === 0 && offsetY < 0) {
            pullDistance.setValue(Math.min(Math.abs(offsetY), 60));
          } else if (offsetY >= 0) {
            pullDistance.setValue(0);
          }
          
          // Clamp scroll position to valid range
          if (offsetY < 0 || offsetY > maxScroll) {
            // Will be handled by snapToInterval
          }
        }}
        onScrollBeginDrag={() => {
          if (currentIndex === 0) {
            setIsPulling(true);
          }
        }}
        onScrollEndDrag={() => {
          if (!refreshing) {
            setIsPulling(false);
            Animated.spring(pullDistance, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }).start();
          }
        }}
        scrollEventThrottle={16}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
    backgroundColor: '#000000',
    overflow: 'hidden',
    zIndex: 1,
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  backHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  backHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotating: {
    transform: [{ rotate: '0deg' }],
  },
  loadingSpinnerContainer: {
    position: 'absolute',
    top: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  leftUsername: {
    position: 'absolute',
    left: 8,
    top: '45%',
    zIndex: 40,
    pointerEvents: 'none',
  },
  leftUsernameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    transform: [{ rotate: '-90deg' }],
  },
  captionOverlay: {
    position: 'absolute',
    top: '35%',
    left: 16,
    right: 70, // Leave space for right action bar
    zIndex: 50,
    pointerEvents: 'none',
  },
  captionOverlayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    lineHeight: 24,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 280,
    zIndex: 10,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 50,
    minHeight: 120,
  },
  leftContent: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'flex-end',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  userAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  usernameSmall: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  followButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 10,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  captionTouchable: {
    marginTop: 0,
  },
  captionSmall: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 0,
  },
  seeMoreText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
  rightActions: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 50,
    paddingRight: 4,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
    minWidth: 50,
  },
  actionCount: {
    color: '#fff',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60, // Account for header
    paddingHorizontal: 32,
  },
  videoErrorContainer: {
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoErrorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60, // Account for header
  },
  pullToRefreshIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 99,
    flexDirection: 'row',
    gap: 8,
  },
  pullToRefreshText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default VideoFeedScreen;


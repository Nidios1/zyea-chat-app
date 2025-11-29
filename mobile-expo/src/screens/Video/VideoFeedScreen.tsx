import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { newsfeedAPI, friendsAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTabBar } from '../../contexts/TabBarContext';
import { getAvatarURL, getImageURL, getVideoURL } from '../../utils/imageUtils';
import { API_BASE_URL } from '../../config/constants';
import { VerifiedBadge } from '../../components/Common/VerifiedBadge';

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
    is_verified?: boolean; // Verified status
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
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { setIsVisible } = useTabBar();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playingIndex, setPlayingIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isFocused, setIsFocused] = useState(true); // Track if screen is focused
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const [expandedCaptions, setExpandedCaptions] = useState<{ [key: string]: boolean }>({});
  const [videoLoadingStates, setVideoLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [mutedStates, setMutedStates] = useState<{ [key: string]: boolean }>({}); // Mute state for each video
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: { position: number; duration: number } }>({}); // Progress and duration for each video
  const [videoPlayingStates, setVideoPlayingStates] = useState<{ [key: string]: boolean }>({}); // Track if video is playing or paused
  const [isDragging, setIsDragging] = useState<{ [key: string]: boolean }>({}); // Track if user is dragging to seek
  const [videoErrors, setVideoErrors] = useState<{ [key: string]: boolean }>({}); // Track video load errors
  const [videoRetryCount, setVideoRetryCount] = useState<{ [key: string]: number }>({}); // Track retry count for each video
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pullDistance = useRef(new Animated.Value(0)).current;
  const [isPulling, setIsPulling] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const progressBarWidths = useRef<{ [key: string]: number }>({}); // Store progress bar widths for seek calculation
  const initialSeekPositions = useRef<{ [key: string]: number }>({}); // Store initial seek positions when drag starts
  
  // Get initialPostId from route params - update when route params change
  const [initialPostId, setInitialPostId] = useState<string | number | undefined>(
    (route.params as any)?.initialPostId
  );
  
  // Update initialPostId when route params change (e.g., when navigating from different videos)
  useEffect(() => {
    const params = (route.params as any);
    if (params?.initialPostId !== undefined) {
      setInitialPostId(params.initialPostId);
      console.log('📹 [VideoFeedScreen] Initial post ID updated:', params.initialPostId);
    }
  }, [(route.params as any)?.initialPostId]);

  // Load following list to check if user is already following video authors
  const { data: followingListData } = useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      try {
        const response = await friendsAPI.getFollowing();
        return response.data || [];
      } catch (error) {
        console.error('Error loading following list:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Ensure followingList is always an array
  const followingList = Array.isArray(followingListData) ? followingListData : [];
  
  // Helper function to check if current user is following a user
  const isFollowing = (userId: string | number): boolean => {
    if (!userId || !followingList.length) return false;
    const userIdStr = String(userId);
    return followingList.some((follow: any) => {
      const followId = String(follow.id || follow.user_id || follow.following_id || follow.followingId);
      return followId === userIdStr;
    });
  };

  // Toggle mute/unmute for a video
  const toggleMute = (videoId: string) => {
    setMutedStates(prev => ({
      ...prev,
      [videoId]: !prev[videoId], // Toggle: if undefined, set to true (muted), else toggle
    }));
  };

  // Get mute state for a video (default: false = unmuted)
  const isMuted = (videoId: string): boolean => {
    return mutedStates[videoId] ?? false; // Default to false (unmuted)
  };

  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Seek video to specific position
  const seekVideo = async (videoId: string, positionSeconds: number) => {
    const videoRef = videoRefs.current[videoId];
    if (videoRef) {
      try {
        const status = await videoRef.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          // Clamp position to valid range
          const maxPosition = status.durationMillis / 1000;
          const clampedPosition = Math.max(0, Math.min(positionSeconds, maxPosition));
          
          // Check if video is currently playing
          const wasPlaying = status.isPlaying;
          
          // Seek to position
          await videoRef.setPositionAsync(clampedPosition * 1000);
          
          // If video was playing, continue playing from new position
          if (wasPlaying) {
            await videoRef.playAsync();
          }
          
          // Update progress immediately
          setVideoProgress(prev => ({
            ...prev,
            [videoId]: {
              ...prev[videoId],
              position: clampedPosition,
            },
          }));
        }
      } catch (error) {
        console.error('Error seeking video:', error);
      }
    }
  };

  // Check if video is playing
  const isVideoPlaying = (videoId: string): boolean => {
    return videoPlayingStates[videoId] ?? false;
  };

  // Helper function to check if video author is current user
  const isCurrentUser = (userId: string | number): boolean => {
    if (!user || !userId) return false;
    return String(userId) === String(user.id);
  };

  // Ẩn bottom tab bar khi vào màn hình video
  useLayoutEffect(() => {
    // Ẩn tab bar sử dụng TabBarContext
    setIsVisible(false);

    // Restore tab bar khi rời màn hình
    return () => {
      setIsVisible(true);
    };
  }, [setIsVisible]);

  // Reload videos when screen is focused (after posting new video)
  // But don't reload if we have initialPostId - let useEffect handle scrolling to that video
  useFocusEffect(
    React.useCallback(() => {
      // Ẩn tab bar khi vào màn hình
      setIsVisible(false);
      
      setIsFocused(true);
      
      // Only reload videos if we don't have an initialPostId
      // If we have initialPostId, videos are already loaded and useEffect will scroll to it
      if (!initialPostId || videos.length === 0) {
        loadVideos();
      }
      
      // Cleanup: Pause all videos and restore tab bar when screen loses focus
      return () => {
        setIsFocused(false);
        
        // Restore tab bar khi rời màn hình
        setIsVisible(true);
        
        // Pause all videos when leaving the video tab
        Object.values(videoRefs.current).forEach(async (ref) => {
          if (ref) {
            try {
              const status = await ref.getStatusAsync();
              if (status.isLoaded && status.isPlaying) {
                await ref.pauseAsync();
              }
            } catch (error) {
              // Ignore errors when pausing
            }
          }
        });
      };
    }, [setIsVisible, initialPostId, videos.length])
  );

  useEffect(() => {
    // Play video when index changes, but only if videos are loaded and screen is focused
    if (isFocused && videos.length > 0 && playingIndex >= 0 && playingIndex < videos.length) {
      // Play immediately - video should already be loaded and ready
      playVideo(playingIndex);
    } else if (!isFocused) {
      // Pause all videos if screen is not focused
      Object.values(videoRefs.current).forEach(async (ref) => {
        if (ref) {
          try {
            const status = await ref.getStatusAsync();
            if (status.isLoaded && status.isPlaying) {
              await ref.pauseAsync();
            }
          } catch (error) {
            // Ignore errors when pausing
          }
        }
      });
    }
  }, [playingIndex, videos.length, isFocused]);

  // Scroll to initial video when videos are loaded and initialPostId is provided
  useEffect(() => {
    if (initialPostId && videos.length > 0) {
      // Try multiple ways to find the video (by string ID, number ID, etc.)
      const targetIndex = videos.findIndex(v => 
        String(v.id) === String(initialPostId) || 
        v.id === initialPostId ||
        Number(v.id) === Number(initialPostId)
      );
      
      if (targetIndex >= 0) {
        console.log('🎯 [VideoFeedScreen] useEffect: Found target video:', {
          initialPostId,
          targetIndex,
          currentIndex,
          videoId: videos[targetIndex].id,
          totalVideos: videos.length,
        });
        
        // Set indices immediately - this is critical to prevent showing first video
        setCurrentIndex(targetIndex);
        setPlayingIndex(targetIndex);
        
        // Scroll to video - use multiple attempts to ensure it works
        const scrollToVideo = () => {
          if (flatListRef.current) {
            try {
              flatListRef.current.scrollToIndex({
                index: targetIndex,
                animated: false, // Don't animate for instant display
                viewPosition: 0, // Scroll to top of item
              });
              console.log('✅ [VideoFeedScreen] useEffect: Scrolled to video index:', targetIndex);
            } catch (error) {
              console.error('❌ [VideoFeedScreen] useEffect: Error scrolling to initial video:', error);
              // Fallback: scroll by offset
              try {
                flatListRef.current.scrollToOffset({
                  offset: targetIndex * SCREEN_HEIGHT,
                  animated: false,
                });
                console.log('✅ [VideoFeedScreen] useEffect: Fallback: Scrolled by offset');
              } catch (offsetError) {
                console.error('❌ [VideoFeedScreen] useEffect: Fallback scroll also failed:', offsetError);
                // Second fallback: try again after a short delay
                setTimeout(() => {
                  if (flatListRef.current) {
                    try {
                      flatListRef.current.scrollToOffset({
                        offset: targetIndex * SCREEN_HEIGHT,
                        animated: false,
                      });
                      console.log('✅ [VideoFeedScreen] useEffect: Second fallback: Scrolled by offset');
                    } catch (e) {
                      console.error('❌ [VideoFeedScreen] useEffect: Second fallback also failed:', e);
                    }
                  }
                }, 100);
              }
            }
          }
        };
        
        // Try immediately
        scrollToVideo();
        
        // Also try after delays to ensure FlatList is ready
        const timeoutId1 = setTimeout(scrollToVideo, 100);
        const timeoutId2 = setTimeout(scrollToVideo, 300);
        const timeoutId3 = setTimeout(scrollToVideo, 500);
        
        return () => {
          clearTimeout(timeoutId1);
          clearTimeout(timeoutId2);
          clearTimeout(timeoutId3);
        };
      } else {
        console.warn('⚠️ [VideoFeedScreen] useEffect: Target video not found:', {
          initialPostId,
          availableIds: videos.map(v => v.id).slice(0, 10),
          totalVideos: videos.length,
        });
      }
    }
  }, [initialPostId, videos.length]); // Run when videos are loaded or initialPostId changes

  const loadVideos = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      // Load ALL public posts from API (type: 'all' to show all posts from everyone)
      const response = await newsfeedAPI.getPosts(1, 'all');
      // Handle both array response and object with posts property
      const posts = Array.isArray(response.data) ? response.data : (response.data?.posts || []);
      
      console.log('Loaded posts:', posts.length);
      console.log('Posts with video:', posts.filter((p: any) => p.videoUrl || p.video_url).length);
      
      // Filter posts with videos - show ONLY public videos from everyone
      // Check for videoUrl, video_url, or videos field AND ensure privacy is 'public'
      const videoPosts: VideoItem[] = posts
        .filter((post: any) => {
          // Check if post has video
          const hasVideo = post.videoUrl || 
                 post.video_url || 
                 post.videos || 
                 (post.videos && Array.isArray(post.videos) && post.videos.length > 0);
          
          // IMPORTANT: Only include PUBLIC videos (privacy = 'public')
          // Backend returns both public posts and user's own posts, but for video feed
          // we only want to show public videos that everyone can see
          const isPublic = post.privacy === 'public' || post.privacy_setting === 'public';
          
          return hasVideo && isPublic;
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
          // Đảm bảo mỗi video luôn có đầy đủ thông tin user, kể cả khi một tài khoản đăng nhiều video
          const userInfo = post.user || {
            id: post.user_id,
            username: post.username,
            full_name: post.full_name,
            avatar: post.avatar_url,
          };

          // Lấy user info từ nhiều nguồn để đảm bảo luôn có dữ liệu
          const userId = userInfo.id || post.user_id || post.userId || '';
          const username = userInfo.username || post.username || post.handle || 'user';
          const fullName = userInfo.full_name || post.full_name || post.displayName || username;
          const avatar = userInfo.avatar || userInfo.avatar_url || post.avatar_url || post.avatar || '';

          // Validate và log nếu thiếu thông tin user
          if (!userId || !username) {
            console.warn('⚠️ [VideoFeedScreen] Missing user info for post:', {
              postId: post.id,
              userId,
              username,
              hasUser: !!post.user,
              hasUserId: !!post.user_id,
              hasUsername: !!post.username,
            });
          }

          // Check if user is verified - API returns is_verified directly on item or in user object
          // Check multiple sources: post.is_verified, post.user?.is_verified, or userInfo.is_verified
          const isVerified = Boolean(
            post.is_verified || 
            post.user?.is_verified || 
            (userInfo && typeof userInfo === 'object' && 'is_verified' in userInfo ? userInfo.is_verified : false)
          );

          const videoItem = {
            id: String(post.id),
            videoUrl: videoUrl || '',
            thumbnailUrl: post.thumbnailUrl || 
                         (post.images && post.images[0]) || 
                         post.image_url || 
                         undefined,
            user: {
              id: String(userId || 'unknown'),
              username: username || 'user',
              full_name: fullName || username || 'User',
              avatar: avatar ? getAvatarURL(avatar) : '',
              is_verified: isVerified, // Add verified status
            },
            caption: post.content || '',
            overlayCaption: post.content || '', // Use same caption for overlay
            likes: post.likes_count || post.likes || 0,
            comments: post.comments_count || post.comments || 0,
            shares: post.shares_count || post.shares || 0,
            isLiked: post.isLiked || false,
            createdAt: post.created_at || post.createdAt || new Date().toISOString(),
          };
          
          // Log để debug - đảm bảo mỗi video có user info
          if (__DEV__) {
            console.log('✅ [VideoFeedScreen] Mapped video item:', {
              id: videoItem.id,
              userId: videoItem.user.id,
              username: videoItem.user.username,
              fullName: videoItem.user.full_name,
              hasAvatar: !!videoItem.user.avatar,
              hasVideoUrl: !!videoItem.videoUrl,
            });
          }
          
          return videoItem;
        });

      // Validate: Đảm bảo mỗi video có đầy đủ user info trước khi set vào state
      const videosWithUserInfo = videoPosts.filter((v: VideoItem) => {
        const hasUser = v.user && (v.user.id || v.user.username);
        if (!hasUser) {
          console.error('❌ [VideoFeedScreen] Video missing user info:', {
            videoId: v.id,
            user: v.user,
          });
        }
        return hasUser;
      });

      if (videosWithUserInfo.length !== videoPosts.length) {
        console.warn('⚠️ [VideoFeedScreen] Some videos were filtered out due to missing user info:', {
          total: videoPosts.length,
          withUserInfo: videosWithUserInfo.length,
          filtered: videoPosts.length - videosWithUserInfo.length,
        });
      }

      setVideos(videosWithUserInfo);
      
      // Note: Scrolling to initial video is now handled by useEffect
      // This ensures it works even if videos are already loaded when navigating
      
      // If refreshing, scroll to top (newest video)
      if (isRefresh && videosWithUserInfo.length > 0 && flatListRef.current) {
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

  // spin animation removed - no longer needed after removing reload button

  const playVideo = async (index: number) => {
    // Don't play if screen is not focused (tab is not active)
    if (!isFocused) {
      return;
    }
    
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
          // Get current position from progress state (if user has seeked)
          const currentProgress = videoProgress[videoId];
          const startPosition = currentProgress?.position || 0;
          
          // Only reset to beginning if video hasn't been seeked (position is 0 or very close)
          // If user has seeked, play from seeked position
          if (startPosition < 0.5) {
            // Reset video to beginning only if near start
            try {
              await videoRef.setPositionAsync(0);
            } catch (seekError) {
              // Ignore seek errors - video might be at beginning already
            }
          } else {
            // Play from seeked position
            try {
              await videoRef.setPositionAsync(startPosition * 1000);
            } catch (seekError) {
              // Ignore seek errors
            }
          }
          
          // Set looping first
          await videoRef.setIsLoopingAsync(true);
          
          // Then play from current position (beginning or seeked position)
          if (!status.isPlaying) {
            await videoRef.playAsync();
            // Update playing state
            setVideoPlayingStates(prev => ({
              ...prev,
              [videoId]: true,
            }));
          } else {
            // If already playing, just ensure it's playing from current position
            await videoRef.playAsync();
            // Update playing state
            setVideoPlayingStates(prev => ({
              ...prev,
              [videoId]: true,
            }));
          }
        } else {
          // Video not loaded yet, try to load it immediately
          try {
            await videoRef.loadAsync({ uri: videos[index].videoUrl }, { shouldPlay: false });
            const retryStatus = await videoRef.getStatusAsync();
            if (retryStatus.isLoaded) {
              // Get current position from progress state (if user has seeked)
              const currentProgress = videoProgress[videoId];
              const startPosition = currentProgress?.position || 0;
              
              // Only reset to beginning if video hasn't been seeked
              if (startPosition < 0.5) {
                try {
                  await videoRef.setPositionAsync(0);
                } catch (seekError) {
                  // Ignore seek errors
                }
              } else {
                // Play from seeked position
                try {
                  await videoRef.setPositionAsync(startPosition * 1000);
                } catch (seekError) {
                  // Ignore seek errors
                }
              }
              
              await videoRef.setIsLoopingAsync(true);
              await videoRef.playAsync();
              // Update playing state
              setVideoPlayingStates(prev => ({
                ...prev,
                [videoId]: true,
              }));
            }
          } catch (error) {
            console.error('Error loading and playing video:', error);
            // Fallback: retry after very short delay
            setTimeout(async () => {
              try {
                const retryStatus = await videoRef.getStatusAsync();
                if (retryStatus.isLoaded) {
                  const currentProgress = videoProgress[videoId];
                  const startPosition = currentProgress?.position || 0;
                  
                  if (startPosition < 0.5) {
                    await videoRef.setPositionAsync(0);
                  } else {
                    await videoRef.setPositionAsync(startPosition * 1000);
                  }
                  
                  await videoRef.setIsLoopingAsync(true);
                  await videoRef.playAsync();
                  setVideoPlayingStates(prev => ({
                    ...prev,
                    [videoId]: true,
                  }));
                }
              } catch (retryError) {
                console.error('Error playing video on retry:', retryError);
              }
            }, 50); // Very short delay for retry
          }
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
          // Update playing state
          setVideoPlayingStates(prev => ({
            ...prev,
            [videoId]: false,
          }));
          // Don't reset position when pausing - keep current position for resume
          // This allows user to seek and then play from seeked position
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
      
      // Preload adjacent videos for smoother experience
      if (index !== null && index !== undefined && videos.length > 0) {
        // Preload next video
        if (index + 1 < videos.length) {
          const nextVideo = videos[index + 1];
          const nextVideoRef = videoRefs.current[nextVideo.id];
          if (nextVideoRef && nextVideo.videoUrl) {
            // Preload next video without playing - use requestAnimationFrame for non-blocking
            requestAnimationFrame(() => {
              nextVideoRef.loadAsync({ uri: nextVideo.videoUrl }, { shouldPlay: false }).catch(() => {
                // Ignore preload errors
              });
            });
          }
        }
        
        // Preload previous video
        if (index - 1 >= 0) {
          const prevVideo = videos[index - 1];
          const prevVideoRef = videoRefs.current[prevVideo.id];
          if (prevVideoRef && prevVideo.videoUrl) {
            // Preload previous video without playing - use requestAnimationFrame for non-blocking
            requestAnimationFrame(() => {
              prevVideoRef.loadAsync({ uri: prevVideo.videoUrl }, { shouldPlay: false }).catch(() => {
                // Ignore preload errors
              });
            });
          }
        }
      }
      
      if (index !== null && index !== undefined && viewableItem.isViewable && viewableItem.item) {
        // Debug log để kiểm tra khi scroll
        if (__DEV__) {
          console.log('📹 [VideoFeedScreen] Viewable item changed:', {
            index,
            videoId: viewableItem.item.id,
            userId: viewableItem.item.user?.id,
            username: viewableItem.item.user?.username,
            fullName: viewableItem.item.user?.full_name,
            hasUserInfo: !!(viewableItem.item.user && (viewableItem.item.user.id || viewableItem.item.user.username)),
          });
        }
        
        // Always update currentIndex immediately when viewable item changes
        // Use functional update to ensure we get the latest state
        setCurrentIndex((prevIndex) => {
          if (prevIndex !== index) {
            // Pause previous video when switching (async, don't wait)
            if (prevIndex >= 0 && prevIndex < videos.length) {
              pauseVideo(prevIndex).catch(err => {
                console.error('Error pausing previous video:', err);
              });
            }
            return index;
          }
          return prevIndex;
        });
        
        // Update playing index separately to trigger useEffect
        // Use requestAnimationFrame for immediate update
        requestAnimationFrame(() => {
          setPlayingIndex((prevIndex) => {
            if (prevIndex !== index) {
              return index;
            }
            return prevIndex;
          });
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
    itemVisiblePercentThreshold: 30, // Lower threshold for faster detection
    minimumViewTime: 0, // No delay - instant detection
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

    // Debug: Log user info for each video to ensure it's present
    if (__DEV__) {
      if (isActive) {
        console.log('📹 [VideoFeedScreen] Rendering ACTIVE video:', {
          index,
          currentIndex,
          videoId: item.id,
          userId: item.user?.id,
          username: item.user?.username,
          fullName: item.user?.full_name,
          hasAvatar: !!item.user?.avatar,
          hasUsername: !!(item.user?.username || item.user?.full_name),
          hasUser: !!item.user,
        });
      }
    }

    // PanResponder for dragging progress bar to seek video
    // Create PanResponder directly (not using hooks since renderVideoItem is not a component)
    const progressBarPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true, // Always capture movement for dragging
      onPanResponderGrant: (evt) => {
        // Store initial position when drag starts
        const progress = videoProgress[item.id];
        if (progress) {
          initialSeekPositions.current[item.id] = progress.position;
          setIsDragging(prev => ({ ...prev, [item.id]: true }));
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        // Calculate seek position based on drag location
        const progress = videoProgress[item.id];
        const barWidth = progressBarWidths.current[item.id];
        if (progress && progress.duration > 0 && barWidth && barWidth > 0) {
          // Use locationX from the event relative to the progress bar
          const { locationX } = evt.nativeEvent;
          // Clamp locationX to valid range
          const clampedX = Math.max(0, Math.min(locationX, barWidth));
          const seekPosition = (clampedX / barWidth) * progress.duration;
          // Update progress immediately for visual feedback
          setVideoProgress(prev => ({
            ...prev,
            [item.id]: {
              ...prev[item.id],
              position: seekPosition,
            },
          }));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const progress = videoProgress[item.id];
        const barWidth = progressBarWidths.current[item.id];
        
        // Stop dragging
        setIsDragging(prev => ({ ...prev, [item.id]: false }));
        
        // Check if it was a tap (no significant movement) or a drag
        const isTap = Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10;
        
        if (progress && progress.duration > 0 && barWidth && barWidth > 0) {
          if (!isTap) {
            // It was a drag - seek to final position
            const { locationX } = evt.nativeEvent;
            // Clamp locationX to valid range
            const clampedX = Math.max(0, Math.min(locationX, barWidth));
            const seekPosition = (clampedX / barWidth) * progress.duration;
            seekVideo(item.id, seekPosition);
          }
          // If it was a tap, onPress of TouchableOpacity will handle it
        }
      },
      onPanResponderTerminate: () => {
        // Stop dragging if gesture is cancelled
        setIsDragging(prev => ({ ...prev, [item.id]: false }));
      },
    });
    
    // Separate PanResponder for time display area (can drag horizontally)
    const timeDisplayPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true, // Always capture movement for better responsiveness
      onPanResponderGrant: (evt) => {
        // Store initial position when drag starts
        const progress = videoProgress[item.id];
        if (progress) {
          initialSeekPositions.current[item.id] = progress.position;
          setIsDragging(prev => ({ ...prev, [item.id]: true }));
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        // Calculate seek position based on drag movement relative to progress bar
        const progress = videoProgress[item.id];
        const barWidth = progressBarWidths.current[item.id];
        if (progress && progress.duration > 0 && barWidth && barWidth > 0) {
          // Calculate new position based on horizontal drag movement
          // dx is in pixels, convert to seconds based on progress bar width
          const initialPosition = initialSeekPositions.current[item.id] || progress.position;
          const deltaSeconds = (gestureState.dx / barWidth) * progress.duration;
          const newPosition = Math.max(0, Math.min(initialPosition + deltaSeconds, progress.duration));
          
          // Update progress immediately for visual feedback
          setVideoProgress(prev => ({
            ...prev,
            [item.id]: {
              ...prev[item.id],
              position: newPosition,
            },
          }));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const progress = videoProgress[item.id];
        const barWidth = progressBarWidths.current[item.id];
        
        // Stop dragging
        setIsDragging(prev => ({ ...prev, [item.id]: false }));
        
        // Check if it was a tap (no significant movement) or a drag
        const isTap = Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10;
        
        if (progress && progress.duration > 0 && barWidth && barWidth > 0) {
          if (isTap) {
            // It was a tap - toggle play/pause
            const videoIndex = videos.findIndex(v => v.id === item.id);
            if (videoIndex >= 0) {
              if (isVideoPlaying(item.id)) {
                pauseVideo(videoIndex);
              } else {
                playVideo(videoIndex);
              }
            }
          } else {
            // It was a drag - seek to final position
            const initialPosition = initialSeekPositions.current[item.id] || progress.position;
            const deltaSeconds = (gestureState.dx / barWidth) * progress.duration;
            const finalPosition = Math.max(0, Math.min(initialPosition + deltaSeconds, progress.duration));
            seekVideo(item.id, finalPosition);
          }
        }
      },
      onPanResponderTerminate: () => {
        // Stop dragging if gesture is cancelled
        setIsDragging(prev => ({ ...prev, [item.id]: false }));
      },
    });

    // Handle tap on video to play/pause
    const handleVideoTap = () => {
      if (isActive) {
        if (isVideoPlaying(item.id)) {
          pauseVideo(index);
        } else {
          playVideo(index);
        }
      }
    };

    return (
      <View style={styles.videoContainer}>
        {/* Show thumbnail immediately while video loads - hide when video is loaded */}
        {/* Always show thumbnail if video is loading or has error */}
        {item.thumbnailUrl && (videoLoadingStates[item.id] || videoErrors[item.id]) && (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={[styles.video, styles.videoThumbnail]}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            transition={0}
          />
        )}
        {/* Tap overlay for play/pause */}
        <TouchableOpacity
          style={styles.videoTapOverlay}
          activeOpacity={1}
          onPress={handleVideoTap}
        />
        {item.videoUrl ? (
          <Video
            ref={(ref) => {
              videoRefs.current[item.id] = ref;
              // Preload video immediately when ref is set for faster loading
              if (ref && item.videoUrl) {
                // Use requestAnimationFrame to avoid blocking main thread
                requestAnimationFrame(() => {
                  ref.loadAsync({ uri: item.videoUrl }, { 
                    shouldPlay: false,
                  }).catch(() => {
                    // Ignore preload errors - video will load on mount
                  });
                });
              }
            }}
            source={{ uri: item.videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping
            isMuted={isMuted(item.id)}
            useNativeControls={false}
            progressUpdateIntervalMillis={100} // Update more frequently for smoother progress bar
            posterSource={item.thumbnailUrl ? { uri: item.thumbnailUrl } : undefined}
            usePoster={!!item.thumbnailUrl} // Use poster if thumbnail is available
            shouldCorrectPitch={true}
            volume={1.0}
            onPlaybackStatusUpdate={(status) => {
              // Only update if video is loaded to reduce unnecessary state updates
              if (status.isLoaded) {
                // Batch state updates for better performance
                const position = status.positionMillis / 1000;
                const duration = status.durationMillis ? status.durationMillis / 1000 : 0;
                const isPlaying = status.isPlaying || false;
                
                // Update progress and duration - use functional update to avoid stale closures
                setVideoProgress(prev => {
                  const current = prev[item.id];
                  // Only update if values changed significantly (reduce re-renders)
                  if (!current || Math.abs(current.position - position) > 0.1 || current.duration !== duration) {
                    return {
                      ...prev,
                      [item.id]: { position, duration },
                    };
                  }
                  return prev;
                });
                
                // Update playing state - only if changed
                setVideoPlayingStates(prev => {
                  if (prev[item.id] !== isPlaying) {
                    return {
                      ...prev,
                      [item.id]: isPlaying,
                    };
                  }
                  return prev;
                });
              }
            }}
            // Đảm bảo video không bị cắt - sử dụng CONTAIN để hiển thị toàn bộ video
            onLoadStart={() => {
              // Don't log on every load start to reduce overhead
              setVideoLoadingStates(prev => ({ ...prev, [item.id]: true }));
              // Clear error state when starting to load
              setVideoErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[item.id];
                return newErrors;
              });
              // Reset retry count when starting new load
              setVideoRetryCount(prev => {
                const newCounts = { ...prev };
                delete newCounts[item.id];
                return newCounts;
              });
            }}
            onLoad={async () => {
              console.log('✅ [VideoFeedScreen] Video loaded:', item.videoUrl, 'index:', index);
              setVideoLoadingStates(prev => ({ ...prev, [item.id]: false }));
              
              // Prepare video immediately when loaded (even if not active)
              const videoRef = videoRefs.current[item.id];
              if (videoRef) {
                try {
                  // Ensure video is ready to play immediately - don't await, do in parallel
                  const statusPromise = videoRef.getStatusAsync();
                  const loopingPromise = videoRef.setIsLoopingAsync(true);
                  
                  // Wait for both in parallel for faster preparation
                  const [status] = await Promise.all([statusPromise, loopingPromise]);
                  
                  if (status.isLoaded && !status.isPlaying) {
                    // Pre-buffer video for instant playback - don't await
                    videoRef.setPositionAsync(0).catch(() => {
                      // Ignore position errors
                    });
                  }
                } catch (error) {
                  // Ignore errors
                }
              }
              
              // Only play if this video is currently active, matches current index, and screen is focused
              if (isFocused && isActive && index === currentIndex && index === playingIndex) {
                // Play immediately - video is already loaded
                playVideo(index);
              } else {
                // Ensure video is paused if not active or screen is not focused
                pauseVideo(index);
              }
            }}
            onError={(error) => {
              console.error('❌ [VideoFeedScreen] Video load error:', {
                videoUrl: item.videoUrl,
                postId: item.id,
                error: error,
                errorCode: (error as any)?.code,
                errorDomain: (error as any)?.domain,
              });
              
              // Mark video as error
              setVideoErrors(prev => ({ ...prev, [item.id]: true }));
              setVideoLoadingStates(prev => ({ ...prev, [item.id]: false }));
              
              // Retry loading video if not exceeded max retries (3 times)
              const retryCount = videoRetryCount[item.id] || 0;
              if (retryCount < 3) {
                const videoRef = videoRefs.current[item.id];
                if (videoRef && item.videoUrl) {
                  setTimeout(async () => {
                    try {
                      console.log(`🔄 [VideoFeedScreen] Retrying video load (attempt ${retryCount + 1}/3):`, item.id);
                      await videoRef.loadAsync({ uri: item.videoUrl }, { shouldPlay: false });
                      setVideoRetryCount(prev => ({ ...prev, [item.id]: retryCount + 1 }));
                      setVideoErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[item.id];
                        return newErrors;
                      });
                    } catch (retryError) {
                      console.error('❌ [VideoFeedScreen] Retry failed:', retryError);
                      setVideoRetryCount(prev => ({ ...prev, [item.id]: retryCount + 1 }));
                    }
                  }, 2000 * (retryCount + 1)); // Exponential backoff: 2s, 4s, 6s
                }
              } else {
                console.error('❌ [VideoFeedScreen] Max retries exceeded for video:', item.id);
              }
            }}
          />
        ) : (
          <View style={[styles.video, styles.videoErrorContainer]}>
            <MaterialCommunityIcons name="video-off" size={64} color="#FFFFFF" />
            <Text style={styles.videoErrorText}>Video không khả dụng</Text>
          </View>
        )}
        
        {/* Show error message if video failed to load after retries */}
        {videoErrors[item.id] && (videoRetryCount[item.id] || 0) >= 3 && (
          <View style={styles.videoErrorOverlay}>
            <MaterialCommunityIcons name="alert-circle" size={32} color="#FF6B6B" />
            <Text style={styles.videoErrorOverlayText}>Không thể tải video</Text>
            <Text style={styles.videoErrorOverlaySubText}>Vui lòng thử lại sau</Text>
          </View>
        )}

        {/* Loading Spinner - show for all videos when loading */}
        {videoLoadingStates[item.id] && (
          <View style={styles.loadingSpinnerContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}

        {/* Only show overlays and content for active video */}
        {isActive && (
          <>
            {/* Play/Pause Button - Facebook style (only show when paused) */}
            {!isVideoPlaying(item.id) && (
              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={() => playVideo(index)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="play"
                  size={64}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}

            {/* Bottom Gradient Overlay - Facebook style (stronger gradient for better text readability) */}
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
              style={styles.bottomGradient}
            />

            {/* Bottom Content */}
            <View 
              style={[
                styles.bottomContent, 
                { 
                  // Tab bar đã được ẩn hoàn toàn, chỉ cần paddingBottom cho safe area
                  paddingBottom: Math.max(insets.bottom + 10, 15),
                  bottom: 0,
                }
              ]}
            >
              {/* Content Row - User Info, Caption, and Actions */}
              <View style={styles.bottomContentRow}>
                {/* Left Side - User Info & Caption - Facebook style */}
                {/* Đảm bảo mỗi video luôn hiển thị đầy đủ user info khi active */}
                <View style={styles.leftContent}>
                {/* User Info Row - Avatar, Username, Follow Button */}
                {/* Luôn hiển thị user info cho mỗi video, kể cả khi một tài khoản đăng nhiều video */}
                {item.user && (item.user.id || item.user.username) ? (
                  <View style={styles.userInfoRow}>
                    {item.user.avatar ? (
                      <Image
                        source={{
                          uri: item.user.avatar || getAvatarURL(item.user.avatar),
                        }}
                        style={styles.userAvatarSmall}
                        onError={() => {
                          console.warn('⚠️ [VideoFeedScreen] Failed to load avatar for video:', item.id);
                        }}
                      />
                    ) : (
                      <View style={[styles.userAvatarSmall, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarPlaceholderText}>
                          {(item.user.full_name || item.user.username || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.usernameRow}>
                      <Text style={styles.usernameSmall} numberOfLines={1}>
                        {item.user.full_name || item.user.username || 'User'}
                      </Text>
                      {/* Verified badge - hiển thị ngay sau tên nếu user đã xác minh */}
                      {item.user.is_verified && (
                        <VerifiedBadge size={16} />
                      )}
                    </View>
                    {/* Chỉ hiển thị nút "Theo dõi" nếu:
                        1. Không phải tài khoản chính (item.user.id !== user.id)
                        2. Chưa follow (không có trong following list)
                    */}
                    {!isCurrentUser(item.user.id) && !isFollowing(item.user.id) && (
                      <TouchableOpacity 
                        style={styles.followButton}
                        activeOpacity={0.7}
                        onPress={async () => {
                          try {
                            await friendsAPI.follow(String(item.user.id));
                            // Invalidate following query to update UI immediately
                            queryClient.invalidateQueries({ queryKey: ['following'] });
                          } catch (error) {
                            console.error('Error following user:', error);
                          }
                        }}
                      >
                        <Text style={styles.followButtonText}>Theo dõi</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  // Fallback: Hiển thị placeholder nếu không có user info
                  <View style={styles.userInfoRow}>
                    <View style={[styles.userAvatarSmall, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarPlaceholderText}>U</Text>
                    </View>
                    <Text style={styles.usernameSmall}>User</Text>
                    {/* Fallback: Không hiển thị nút theo dõi cho placeholder user */}
                  </View>
                )}
                
                {/* Caption - Below user info */}
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

              {/* Right Side - Actions - Facebook style */}
              <View style={styles.rightActions}>
                {/* Like Button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleLike(item.id, index)}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons
                    name={item.isLiked ? 'heart' : 'heart-outline'}
                    size={36}
                    color={item.isLiked ? '#ff3040' : '#fff'}
                  />
                  {item.likes > 0 ? (
                    <Text style={styles.actionCount}>{formatCount(item.likes)}</Text>
                  ) : null}
                </TouchableOpacity>

                {/* Comment Button */}
                <TouchableOpacity 
                  style={styles.actionButton}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons name="comment-outline" size={36} color="#fff" />
                  {item.comments > 0 ? (
                    <Text style={styles.actionCount}>{formatCount(item.comments)}</Text>
                  ) : null}
                </TouchableOpacity>

                {/* Share Button - Facebook style */}
                <TouchableOpacity 
                  style={styles.actionButton}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons name="share-outline" size={36} color="#fff" />
                  {item.shares && item.shares > 0 ? (
                    <Text style={styles.actionCount}>{formatCount(item.shares)}</Text>
                  ) : null}
                </TouchableOpacity>

                {/* Send Button */}
                <TouchableOpacity 
                  style={styles.actionButton}
                  activeOpacity={0.6}
                >
                  <MaterialCommunityIcons name="send-outline" size={36} color="#fff" />
                </TouchableOpacity>
              </View>
              </View>

              {/* Progress Bar with Time and Speaker Control - Facebook style (only show when paused) */}
              {videoProgress[item.id] && !isVideoPlaying(item.id) && (
                <View style={styles.progressBarContainer}>
                  {/* Progress Bar - Seekable with drag support */}
                  <View style={styles.progressBarWrapper}>
                    <View
                      style={styles.progressBarBackground}
                      onLayout={(e) => {
                        // Store progress bar width for seek calculation
                        const { width } = e.nativeEvent.layout;
                        progressBarWidths.current[item.id] = width;
                      }}
                    >
                      {/* Touchable overlay for tap to seek */}
                      <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={(e) => {
                          // Calculate seek position based on touch location
                          const { locationX } = e.nativeEvent;
                          const progress = videoProgress[item.id];
                          const barWidth = progressBarWidths.current[item.id];
                          if (progress && progress.duration > 0 && barWidth && barWidth > 0) {
                            const clampedX = Math.max(0, Math.min(locationX, barWidth));
                            const seekPosition = (clampedX / barWidth) * progress.duration;
                            seekVideo(item.id, seekPosition);
                          }
                        }}
                        {...progressBarPanResponder.panHandlers}
                      />
                      <View 
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${videoProgress[item.id].duration > 0 
                              ? (videoProgress[item.id].position / videoProgress[item.id].duration) * 100 
                              : 0}%`
                          }
                        ]}
                      />
                    </View>
                    {/* Time Display - Tap to play/pause, also draggable */}
                    <View
                      style={[
                        styles.timeDisplay,
                        isDragging[item.id] && styles.timeDisplayDragging
                      ]}
                      {...timeDisplayPanResponder.panHandlers}
                    >
                      <Text style={[
                        styles.timeText,
                        isDragging[item.id] && styles.timeTextDragging
                      ]}>
                        {formatTime(videoProgress[item.id].position)} / {formatTime(videoProgress[item.id].duration)}
                      </Text>
                    </View>
                  </View>
                  {/* Speaker Icon - Only show when video is paused - Facebook style (bottom right) */}
                  {!isVideoPlaying(item.id) && (
                    <TouchableOpacity
                      style={styles.speakerButton}
                      onPress={() => toggleMute(item.id)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={isMuted(item.id) ? 'volume-off' : 'volume-high'}
                        size={20}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
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
      {/* Header với back button - giống Facebook (đơn giản hơn) */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backHeaderButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        {/* Facebook style: chỉ có back button, không có title và reload button */}
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
          // Đảm bảo không có padding để video vừa màn hình
        }}
        style={{ 
          flex: 1,
          // Đảm bảo FlatList fill toàn bộ màn hình
        }}
        removeClippedSubviews={false} // CRITICAL: Keep all videos rendered - never clip videos
        maxToRenderPerBatch={3} // Render 3 videos per batch for faster initial load
        windowSize={10} // Keep 10 videos in memory for smoother scrolling
        initialNumToRender={5} // Render first 5 videos immediately to ensure visibility
        updateCellsBatchingPeriod={50} // Update frequently for smoother scrolling
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
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
    backgroundColor: '#000000',
    overflow: 'hidden',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Đảm bảo video container vừa màn hình, không bị overflow
  },
  videoTapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5, // Above video but below UI elements
    backgroundColor: 'transparent',
  },
  video: {
    width: '100%',
    height: '100%',
    // Sử dụng percentage để đảm bảo video fill container
    // ResizeMode.CONTAIN sẽ đảm bảo toàn bộ video hiển thị, không bị cắt
    // Background đen sẽ fill phần còn lại nếu aspect ratio không khớp
  },
  videoThumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0, // Behind video, will be hidden when video loads
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
    // Facebook style: không có background, chỉ có back button
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
  backHeaderButton: {
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
  playPauseButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30, // Above video but below UI elements
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
    height: 300, // Increased for better text readability
    zIndex: 10,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'column', // Changed to column to stack progress bar below
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    zIndex: 50,
    minHeight: 140,
    // Đảm bảo không đè lên nhau - sử dụng gap thay vì margin
    gap: 12,
  },
  bottomContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingRight: 8,
    // Đảm bảo không overflow và không đè lên rightActions
    minWidth: 0, // Cho phép shrink nếu cần
    maxWidth: '75%', // Giới hạn width để không đè lên rightActions
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6, // Giảm gap để nút sát tên hơn
    // Đảm bảo các elements không đè lên nhau
    flexShrink: 1,
  },
  userAvatarSmall: {
    width: 40, // Slightly larger for better visibility
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  usernameSmall: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  followButton: {
    backgroundColor: 'rgba(24, 119, 242, 0.9)', // Facebook blue
    borderWidth: 0,
    paddingHorizontal: 10, // Giảm padding ngang
    paddingVertical: 4, // Giảm padding dọc
    borderRadius: 4, // Bo tròn nhỏ hơn
    minHeight: 24, // Giảm chiều cao
    justifyContent: 'center',
    marginLeft: 4, // Thêm marginLeft nhỏ để sát tên
  },
  followButtonText: {
    color: '#fff',
    fontSize: 11, // Giảm font size
    fontWeight: '600',
  },
  captionTouchable: {
    marginTop: 4,
  },
  captionSmall: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 0,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seeMoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  rightActions: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 56, // Slightly wider for better touch target
    paddingRight: 0,
    // Đảm bảo không bị đè bởi leftContent
    flexShrink: 0, // Không cho phép shrink
    zIndex: 51, // Cao hơn leftContent một chút để đảm bảo không bị đè
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 28, // Increased spacing between buttons
    minWidth: 56,
    paddingVertical: 4,
  },
  actionCount: {
    color: '#fff',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  videoErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    gap: 12,
  },
  videoErrorOverlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  videoErrorOverlaySubText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
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
  // Progress Bar Container - Facebook style
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  progressBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  timeDisplay: {
    minWidth: 80,
    paddingVertical: 8,
    paddingHorizontal: 4,
    // Increase touch area for better dragging
  },
  timeDisplayDragging: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeTextDragging: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  speakerButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});

export default VideoFeedScreen;


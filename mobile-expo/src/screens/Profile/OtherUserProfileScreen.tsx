import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  PanResponder,
  Animated,
  Modal,
  Clipboard,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { usersAPI, friendsAPI, newsfeedAPI, chatAPI } from '../../utils/api';
import CommentsBottomSheet from '../../components/NewsFeed/CommentsBottomSheet';
import { getAvatarURL, getImageURL, getVideoURL } from '../../utils/imageUtils';
import { getInitials } from '../../utils/nameUtils';
import { useTabBar } from '../../contexts/TabBarContext';
import FullScreenImageViewer from '../../components/Common/FullScreenImageViewer';

const { width } = Dimensions.get('window');
const GAP = 2; // Gap between images (2 gaps for 3 images)
const POST_GRID_SIZE = (width - (GAP * 2)) / 3; // 3 columns: width = 3*image + 2*gap

type OtherUserProfileScreenRouteProp = RouteProp<
  { OtherUserProfile: { userId: string } },
  'OtherUserProfile'
>;

type TabType = 'posts' | 'reels' | 'reposts' | 'tagged';

const OtherUserProfileScreen = () => {
  const { user: currentUser } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<OtherUserProfileScreenRouteProp>();
  const { colors, isDarkMode } = useTheme();
  const { setIsVisible } = useTabBar();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  
  const userId = route.params?.userId;
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [imageViewerPostData, setImageViewerPostData] = useState<any>(null);
  const [showComments, setShowComments] = useState(false);
  const [activePostId, setActivePostId] = useState<string | number | null>(null);
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Tab order for swipe navigation
  const tabs: TabType[] = ['posts', 'reels', 'reposts', 'tagged'];
  const tabTranslateX = useRef(new Animated.Value(0)).current;
  const tabOpacity = useRef(new Animated.Value(1)).current;
  const swipeThreshold = 80; // Minimum distance for swipe (increased for better UX)
  const isSwiping = useRef(false);

  // Hide tab bar when screen is focused
  useEffect(() => {
    setIsVisible(false);
    return () => {
      setIsVisible(true);
    };
  }, [setIsVisible]);

  // Redirect to own profile if viewing own profile
  useEffect(() => {
    if (userId && currentUser?.id?.toString() === userId.toString()) {
      navigation.goBack();
    }
  }, [userId, currentUser?.id, navigation]);

  // Fetch user profile
  const {
    data: userProfile,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const res = await usersAPI.getProfile(userId);
      const profileData = res.data;
      console.log('📱 User profile loaded:', {
        id: profileData?.id,
        username: profileData?.username,
        full_name: profileData?.full_name,
        avatar_url: profileData?.avatar_url,
        avatar_url_type: typeof profileData?.avatar_url,
        avatar_url_length: profileData?.avatar_url?.length,
        hasAvatar: !!profileData?.avatar_url,
        constructedURL: profileData?.avatar_url ? getAvatarURL(profileData.avatar_url) : 'N/A',
      });
      // Reset avatar load error when profile changes
      setAvatarLoadError(false);
      return profileData;
    },
    enabled: !!userId,
  });

  // Fetch following list to check if following this user
  const { data: followingList = [], refetch: refetchFollowing, isLoading: isLoadingFollowing } = useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      try {
        const res = await friendsAPI.getFollowing();
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        console.log('📋 Following list loaded:', {
          count: data.length,
          userIds: data.map((f: any) => f.following_id || f.id || f.user_id)
        });
        return data;
      } catch (error) {
        console.error('Error fetching following list:', error);
        return [];
      }
    },
    retry: 2,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Fetch followers and following counts for this user
  const { data: userStats, refetch: refetchUserStats } = useQuery({
    queryKey: ['userStats', userId],
    queryFn: async () => {
      if (!userId) return { followersCount: 0, followingCount: 0 };
      try {
        const res = await usersAPI.getUserStats(userId);
        return {
          followersCount: res.data?.followersCount || res.data?.followers_count || 0,
          followingCount: res.data?.followingCount || res.data?.following_count || 0,
        };
      } catch (error) {
        console.error('Error fetching user stats:', error);
        // Fallback: try to get from userProfile
        return {
          followersCount: userProfile?.followers_count || 0,
          followingCount: userProfile?.following_count || 0,
        };
      }
    },
    enabled: !!userId,
  });

  // Check friendship status (blocked, muted, restricted)
  const { data: friendshipStatus } = useQuery({
    queryKey: ['friendshipStatus', userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const res = await friendsAPI.checkFriendshipStatus(userId);
        return res.data;
      } catch (error) {
        console.error('Error checking friendship status:', error);
        return null;
      }
    },
    enabled: !!userId,
  });

  // Update states based on friendship status
  useEffect(() => {
    if (friendshipStatus) {
      setIsBlocked(friendshipStatus.friendship_status === 'blocked_by_me');
      setIsMuted(friendshipStatus.isMuted || false);
      setIsRestricted(friendshipStatus.isRestricted || false);
    }
  }, [friendshipStatus]);

  // Get counts from userStats or userProfile
  const followersCount = userStats?.followersCount || userProfile?.followers_count || 0;
  const followingCount = userStats?.followingCount || userProfile?.following_count || 0;

  // Refetch following list when userId changes
  useEffect(() => {
    if (userId) {
      refetchFollowing();
    }
  }, [userId, refetchFollowing]);

  // Update isFollowing state when followingList changes
  useEffect(() => {
    if (!userId) {
      setIsFollowing(false);
      return;
    }
    
    // Normalize userId to string for comparison
    const normalizedUserId = String(userId);
    
    if (followingList.length > 0) {
      // Get all following IDs and normalize them to strings
      const followingIds = followingList.map((f: any) => {
        const id = f.following_id || f.id || f.user_id;
        return id ? String(id) : null;
      }).filter(Boolean);
      
      // Check if current userId is in the following list
      const isCurrentlyFollowing = followingIds.includes(normalizedUserId);
      setIsFollowing(isCurrentlyFollowing);
      
      console.log('🔍 Follow status check:', {
        userId: normalizedUserId,
        followingIds,
        isFollowing: isCurrentlyFollowing,
        followingListLength: followingList.length,
        sampleFollowing: followingList.slice(0, 2).map((f: any) => ({
          following_id: f.following_id,
          id: f.id,
          user_id: f.user_id
        }))
      });
    } else if (!isLoadingFollowing) {
      // Only set to false if we've finished loading and the list is empty
      // This prevents flickering while data is loading
      setIsFollowing(false);
    }
  }, [followingList, userId, isLoadingFollowing]);

  // Fetch posts for this user with pagination
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ['userPosts', userId, page],
    queryFn: async () => {
      const res = await newsfeedAPI.getPosts(page, 'all');
      const fetchedPosts = Array.isArray(res.data) ? res.data : (res.data?.posts || []);
      // Filter posts for this user
      const userPosts = fetchedPosts.filter((post: any) => {
        const postUserId = post.user_id || post.user?.id;
        return postUserId?.toString() === userId?.toString();
      });
      return userPosts;
    },
    enabled: !!userId,
  });

  // Update allPosts when new data is fetched
  useEffect(() => {
    if (postsData) {
      if (page === 1) {
        // First page - replace all posts, but use Set to avoid duplicates
        const seenPostIds = new Set<string | number>();
        const uniquePosts = postsData.filter((post: any) => {
          const postId = post.id;
          if (postId && seenPostIds.has(postId)) {
            return false;
          }
          if (postId) {
            seenPostIds.add(postId);
          }
          return true;
        });
        setAllPosts(uniquePosts);
      } else {
        // Subsequent pages - append to existing posts, but avoid duplicates
        setAllPosts(prev => {
          const existingIds = new Set(prev.map((p: any) => p.id).filter(Boolean));
          const newPosts = postsData.filter((post: any) => {
            const postId = post.id;
            return !postId || !existingIds.has(postId);
          });
          return [...prev, ...newPosts];
        });
      }
      // Check if there are more posts to load
      setHasMore(postsData.length > 0);
      setIsLoadingMore(false);
    }
  }, [postsData, page]);

  // Reset when userId changes
  useEffect(() => {
    if (userId) {
      setPage(1);
      setAllPosts([]);
      setHasMore(true);
    }
  }, [userId]);

  const posts = allPosts;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setAllPosts([]);
    setHasMore(true);
    try {
      await Promise.all([
        refetchProfile(),
        refetchPosts(),
        queryClient.invalidateQueries({ queryKey: ['following'] }),
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchProfile, refetchPosts, queryClient]);

  // Load more posts when scrolling to bottom
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoadingPosts) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
    }
  }, [isLoadingMore, hasMore, isLoadingPosts]);

  // Handle tab change with smooth animation
  const changeTab = useCallback((newTab: TabType, direction: 'left' | 'right' = 'left') => {
    const currentIndex = tabs.indexOf(activeTab);
    const newIndex = tabs.indexOf(newTab);
    
    if (currentIndex === newIndex) return;
    
    isSwiping.current = false;
    
    // Smooth fade and slide animation
    Animated.parallel([
      Animated.spring(tabTranslateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(tabOpacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
    
    setActiveTab(newTab);
    // Reset pagination when changing tabs
    setPage(1);
    setAllPosts([]);
    setHasMore(true);
  }, [activeTab, tabs, tabTranslateX, tabOpacity]);

  // PanResponder for smooth swipe gestures on content area
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Don't capture initially - let move decide
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only capture horizontal swipes, ignore vertical scrolling
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        const hasEnoughMovement = Math.abs(gestureState.dx) > 15;
        return isHorizontalSwipe && hasEnoughMovement;
      },
      onPanResponderGrant: () => {
        // Mark as swiping and reset values
        isSwiping.current = true;
        tabTranslateX.setValue(0);
        tabOpacity.setValue(1);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!isSwiping.current) return;
        
        const { dx } = gestureState;
        const screenWidth = width;
        
        // Smooth real-time animation following finger
        // Limit movement to prevent over-swiping
        const maxOffset = screenWidth * 0.3;
        const offset = Math.max(-maxOffset, Math.min(maxOffset, dx * 0.5));
        
        // Calculate opacity based on swipe distance
        const opacity = Math.max(0.7, 1 - Math.abs(dx) / screenWidth * 0.5);
        
        // Apply animations immediately for smooth feel
        tabTranslateX.setValue(offset);
        tabOpacity.setValue(opacity);
      },
      onPanResponderTerminate: () => {
        // Reset if gesture is cancelled
        isSwiping.current = false;
        Animated.parallel([
          Animated.spring(tabTranslateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(tabOpacity, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!isSwiping.current) return;
        
        const { dx, vx } = gestureState;
        const screenWidth = width;
        
        // Check if swipe is significant enough (distance or velocity)
        const isSignificantSwipe = Math.abs(dx) > swipeThreshold || Math.abs(vx) > 0.3;
        
        if (isSignificantSwipe) {
          const currentIndex = tabs.indexOf(activeTab);
          
          if (dx < 0) {
            // Swipe left - go to next tab
            const nextIndex = (currentIndex + 1) % tabs.length;
            changeTab(tabs[nextIndex], 'left');
          } else if (dx > 0) {
            // Swipe right - go to previous tab
            const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            changeTab(tabs[prevIndex], 'right');
          } else {
            // Reset if no direction
            Animated.parallel([
              Animated.spring(tabTranslateX, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
              }),
              Animated.spring(tabOpacity, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
              }),
            ]).start();
          }
        } else {
          // Reset animation if swipe wasn't significant - smooth spring back
          Animated.parallel([
            Animated.spring(tabTranslateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
            Animated.spring(tabOpacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
          ]).start();
        }
        
        isSwiping.current = false;
      },
    })
  ).current;

  const handleFollow = async () => {
    if (!userId) return;
    
    // If already following, show confirmation dialog
    if (isFollowing) {
      Alert.alert(
        'Hủy theo dõi',
        `Bạn có chắc chắn muốn hủy theo dõi ${userProfile?.full_name || userProfile?.username || 'người dùng này'} không?`,
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Hủy theo dõi',
            style: 'destructive',
            onPress: async () => {
              await performUnfollow();
            },
          },
        ],
        { cancelable: true }
      );
      return;
    }
    
    // If not following, follow directly
    await performFollow();
  };

  const performFollow = async () => {
    if (!userId) return;
    
    setIsLoadingFollow(true);
    const wasFollowing = isFollowing;
    
    try {
      // Follow user
      await friendsAPI.follow(userId);
      setIsFollowing(true);
      
      // Invalidate and refetch following list to update UI
      await queryClient.invalidateQueries({ queryKey: ['following'] });
      await refetchFollowing();
      
      // Refetch user profile and stats to get updated counts from server
      await refetchProfile();
      await refetchUserStats();
      
      // Also invalidate user stats query
      await queryClient.invalidateQueries({ queryKey: ['userStats', userId] });
      
    } catch (error: any) {
      console.error('Error following user:', error);
      
      const errorMessage = error?.response?.data?.message || error?.message || '';
      const isAlreadyFollowingError = errorMessage.includes('Already following') || 
                                      errorMessage.includes('already following');
      
      if (isAlreadyFollowingError) {
        // If already following, just sync the state - don't show error
        console.log('⚠️ User already following - syncing state');
        setIsFollowing(true);
        // Refetch following list to ensure state is correct
        await refetchFollowing();
        await queryClient.invalidateQueries({ queryKey: ['following'] });
        await refetchProfile();
        await refetchUserStats();
      } else {
        // For other errors, revert state and show error
        setIsFollowing(wasFollowing);
        Alert.alert('Lỗi', errorMessage || 'Không thể thực hiện thao tác này');
      }
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const performUnfollow = async () => {
    if (!userId) return;
    
    setIsLoadingFollow(true);
    const wasFollowing = isFollowing;
    
    try {
      // Unfollow user
      await friendsAPI.unfollow(userId);
      setIsFollowing(false);
      
      // Invalidate and refetch following list to update UI
      await queryClient.invalidateQueries({ queryKey: ['following'] });
      await refetchFollowing();
      
      // Refetch user profile and stats to get updated counts from server
      await refetchProfile();
      await refetchUserStats();
      
      // Also invalidate user stats query
      await queryClient.invalidateQueries({ queryKey: ['userStats', userId] });
      
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      
      // Revert state on error
      setIsFollowing(wasFollowing);
      const errorMessage = error?.response?.data?.message || error?.message || '';
      Alert.alert('Lỗi', errorMessage || 'Không thể hủy theo dõi');
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const handleMessage = async () => {
    if (!userId || !userProfile) return;
    
    try {
      // Create or get conversation with this user
      const response = await chatAPI.createConversation(userId);
      const conversationId = response.conversationId || response.data?.conversationId;
      
      if (!conversationId) {
        Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện');
        return;
      }
      
      // Navigate to ChatDetail using CommonActions for nested navigation
      // This will automatically switch to Chat tab and open ChatDetail
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Chat',
          params: {
            screen: 'ChatDetail',
            params: {
              conversationId: String(conversationId),
              userName: userProfile.full_name || userProfile.username || 'Người dùng',
              userAvatarUrl: userProfile.avatar_url,
              otherUserId: userId,
              isOnline: userProfile.status === 'online',
            },
          },
        })
      );
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tạo cuộc trò chuyện');
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      const formatted = (num / 1000000).toFixed(1);
      const cleaned = formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
      return cleaned.replace('.', ',') + 'M';
    }
    if (num >= 1000) {
      const formatted = (num / 1000).toFixed(1);
      const cleaned = formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
      return cleaned.replace('.', ',') + 'K';
    }
    // Format numbers with dots as thousands separators (e.g., 2.478)
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const dynamicStyles = createStyles(colors);

  if (isLoadingProfile) {
    return (
      <SafeAreaView style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary || '#0084ff'} />
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[dynamicStyles.errorText, { color: colors.error }]}>
          Không tìm thấy người dùng
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[dynamicStyles.backButton, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const postsCount = posts.length;

  // Filter posts based on active tab
  const filteredPosts = posts.filter((post: any) => {
    switch (activeTab) {
      case 'reels':
        // Check for video in various formats
        const hasVideo = !!(
          post.video_url || 
          post.videoUrl || 
          (post.videos && (Array.isArray(post.videos) ? post.videos.length > 0 : true))
        );
        return hasVideo;
      case 'reposts':
        return post.is_repost || post.repost_id;
      case 'tagged':
        return false; // TODO: Implement tagged posts
      default:
        // For 'posts' tab, show only image posts (no video)
        return !(post.video_url || post.videoUrl || post.videos);
    }
  });

  // Get post media for grid (images or video thumbnails)
  // For video posts, we include them even if no thumbnail (we'll show placeholder)
  const postMediaWithPosts = filteredPosts.map((post: any) => {
    const isVideo = !!(post.video_url || post.videoUrl || post.videos);
    
    // For video posts, use thumbnail or first image as preview
    if (isVideo) {
      // Use video thumbnail if available, otherwise use first image
      const thumbnail = post.thumbnailUrl || 
             (post.images && Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : null) || 
             post.image_url ||
             null;
      // Return object with post and media URL (can be null for video without thumbnail)
      return { post, mediaUrl: thumbnail, isVideo: true };
    }
    
    // For image posts, use first image
    let mediaUrl = null;
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      mediaUrl = post.images[0];
    } else if (post.image_url) {
      mediaUrl = post.image_url;
    }
    
    // Only include if we have media URL for image posts
    if (!mediaUrl) {
      return null;
    }
    
    return { post, mediaUrl, isVideo: false };
  }).filter(Boolean) as Array<{ post: any; mediaUrl: string | null; isVideo: boolean }>;

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[dynamicStyles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {userProfile?.username || userProfile?.full_name || 'Người dùng'}
        </Text>
        <TouchableOpacity 
          style={dynamicStyles.headerButton}
          onPress={() => setShowProfileMenu(true)}
        >
          <MaterialCommunityIcons name="dots-horizontal" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={dynamicStyles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary || '#0084ff'}
            colors={[colors.primary || '#0084ff']}
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          // Load more when user scrolls near bottom
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 500; // Trigger load more when 500px from bottom
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Cover Photo */}
        {userProfile?.cover_url && (
          <TouchableOpacity 
            style={dynamicStyles.coverContainer}
            activeOpacity={0.9}
            onPress={() => {
              // Open cover image in full screen viewer
              setImageViewerImages([getImageURL(userProfile.cover_url)]);
              setImageViewerIndex(0);
              setImageViewerPostData(null);
              setShowImageViewer(true);
            }}
          >
            <Image 
              source={{ uri: getImageURL(userProfile.cover_url) }} 
              style={dynamicStyles.coverImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        
        {/* Profile Section */}
        <View style={[dynamicStyles.profileSection, userProfile?.cover_url && dynamicStyles.profileSectionWithCover]}>
          {/* Avatar - positioned absolutely when cover exists */}
          {userProfile?.cover_url && (
            <TouchableOpacity 
              style={dynamicStyles.avatarWrapperWithCover}
              activeOpacity={0.9}
              onPress={() => {
                if (userProfile?.avatar_url) {
                  // Open avatar in full screen viewer
                  setImageViewerImages([getAvatarURL(userProfile.avatar_url)]);
                  setImageViewerIndex(0);
                  setImageViewerPostData(null);
                  setShowImageViewer(true);
                }
              }}
            >
              <LinearGradient
                colors={['#FF6B9D', '#C44569', '#FF8E53', '#FFA07A', '#FFD700', '#98D8C8', '#FF6B9D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={dynamicStyles.avatarGradient}
              >
                <View style={[dynamicStyles.avatarInner, { backgroundColor: colors.surface }]}>
                  {userProfile?.avatar_url ? (
                    <Image
                      key={`avatar-${userProfile?.id}`}
                      source={{ uri: getAvatarURL(userProfile.avatar_url) }}
                      style={dynamicStyles.avatar}
                      resizeMode="cover"
                      onError={(e) => {
                        console.error('❌ Avatar image load error:', {
                          uri: getAvatarURL(userProfile.avatar_url),
                          originalUrl: userProfile.avatar_url,
                          error: e.nativeEvent.error,
                        });
                        setAvatarLoadError(true);
                      }}
                      onLoad={() => {
                        console.log('✅ Avatar loaded:', getAvatarURL(userProfile.avatar_url));
                        setAvatarLoadError(false);
                      }}
                      onLoadStart={() => {
                        console.log('🔄 Loading avatar:', getAvatarURL(userProfile.avatar_url));
                      }}
                    />
                  ) : (
                    <View style={[dynamicStyles.avatar, { 
                      backgroundColor: '#9C27B0', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                    }]}>
                      <Text style={{ fontSize: 42, fontWeight: '600', color: '#FFFFFF' }}>
                        {getInitials(userProfile?.full_name || userProfile?.username || 'Người dùng')}
                      </Text>
                    </View>
                  )}
                  {avatarLoadError && userProfile?.avatar_url && (
                    <View style={[StyleSheet.absoluteFill, { 
                      backgroundColor: '#9C27B0', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      borderRadius: 56.5,
                    }]}>
                      <Text style={{ fontSize: 42, fontWeight: '600', color: '#FFFFFF' }}>
                        {getInitials(userProfile?.full_name || userProfile?.username || 'Người dùng')}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {/* Top Row: Avatar (Left) and Stats (Right) */}
          <View style={dynamicStyles.topRow}>
            {/* Profile Picture with Gradient Border - Left Side (only when no cover) */}
            {!userProfile?.cover_url && (
              <TouchableOpacity 
                style={dynamicStyles.avatarWrapper}
                activeOpacity={0.9}
                onPress={() => {
                  if (userProfile?.avatar_url) {
                    // Open avatar in full screen viewer
                    setImageViewerImages([getAvatarURL(userProfile.avatar_url)]);
                    setImageViewerIndex(0);
                    setImageViewerPostData(null);
                    setShowImageViewer(true);
                  }
                }}
              >
                <LinearGradient
                  colors={['#FF6B9D', '#C44569', '#FF8E53', '#FFA07A', '#FFD700', '#98D8C8', '#FF6B9D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={dynamicStyles.avatarGradient}
                >
                  <View style={[dynamicStyles.avatarInner, { backgroundColor: colors.surface }]}>
                    {userProfile?.avatar_url ? (
                      <Image
                        key={`avatar-${userProfile?.id}`}
                        source={{ uri: getAvatarURL(userProfile.avatar_url) }}
                        style={dynamicStyles.avatar}
                        resizeMode="cover"
                        onError={(e) => {
                          console.error('❌ Avatar image load error:', {
                            uri: getAvatarURL(userProfile.avatar_url),
                            originalUrl: userProfile.avatar_url,
                            error: e.nativeEvent.error,
                          });
                          setAvatarLoadError(true);
                        }}
                        onLoad={() => {
                          console.log('✅ Avatar loaded:', getAvatarURL(userProfile.avatar_url));
                          setAvatarLoadError(false);
                        }}
                        onLoadStart={() => {
                          console.log('🔄 Loading avatar:', getAvatarURL(userProfile.avatar_url));
                        }}
                      />
                    ) : (
                      <View style={[dynamicStyles.avatar, { 
                        backgroundColor: '#9C27B0', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                      }]}>
                        <Text style={{ fontSize: 42, fontWeight: '600', color: '#FFFFFF' }}>
                          {getInitials(userProfile?.full_name || userProfile?.username || 'Người dùng')}
                        </Text>
                      </View>
                    )}
                    {avatarLoadError && userProfile?.avatar_url && (
                      <View style={[StyleSheet.absoluteFill, { 
                        backgroundColor: '#9C27B0', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        borderRadius: 56.5,
                      }]}>
                        <Text style={{ fontSize: 42, fontWeight: '600', color: '#FFFFFF' }}>
                          {getInitials(userProfile?.full_name || userProfile?.username || 'Người dùng')}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Stats - Right Side, aligned with avatar top */}
            {!userProfile?.cover_url && (
              <View style={dynamicStyles.statsContainer}>
              <View style={dynamicStyles.statItem}>
                <Text style={[dynamicStyles.statNumber, { color: colors.text }]}>
                  {formatNumber(postsCount)}
                </Text>
                <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>
                  bài viết
                </Text>
              </View>
              <View style={dynamicStyles.statItem}>
                <Text style={[dynamicStyles.statNumber, { color: colors.text }]}>
                  {formatNumber(followersCount)}
                </Text>
                <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>
                  người theo dõi
                </Text>
              </View>
              <View style={dynamicStyles.statItem}>
                <Text style={[dynamicStyles.statNumber, { color: colors.text }]}>
                  {formatNumber(followingCount)}
                </Text>
                <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>
                  đang theo dõi
                </Text>
              </View>
            </View>
            )}
            
            {/* Stats when cover exists - positioned to the right of avatar */}
            {userProfile?.cover_url && (
              <View style={dynamicStyles.statsContainerWithCover}>
                <View style={dynamicStyles.statItem}>
                  <Text style={[dynamicStyles.statNumber, { color: colors.text }]}>
                    {formatNumber(postsCount)}
                  </Text>
                  <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>
                    bài viết
                  </Text>
                </View>
                <View style={dynamicStyles.statItem}>
                  <Text style={[dynamicStyles.statNumber, { color: colors.text }]}>
                    {formatNumber(followersCount)}
                  </Text>
                  <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>
                    người theo dõi
                  </Text>
                </View>
                <View style={dynamicStyles.statItem}>
                  <Text style={[dynamicStyles.statNumber, { color: colors.text }]}>
                    {formatNumber(followingCount)}
                  </Text>
                  <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>
                    đang theo dõi
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* User Name with Ribbon Icon - Below avatar, aligned left */}
          {userProfile && (
            <View style={dynamicStyles.nameContainer}>
              <Text 
                style={[dynamicStyles.userName, { color: colors.text }]} 
                numberOfLines={1}
              >
                {userProfile.full_name || userProfile.username || 'Người dùng'}
              </Text>
              {(userProfile.full_name || userProfile.username) && (
                <MaterialCommunityIcons 
                  name="ribbon" 
                  size={16} 
                  color="#FF69B4" 
                  style={dynamicStyles.ribbonIcon}
                />
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={dynamicStyles.actionButtons}>
            <TouchableOpacity
              style={[
                dynamicStyles.followButton,
                {
                  backgroundColor: isFollowing 
                    ? (isDarkMode ? colors.border : colors.surface)
                    : (isDarkMode ? colors.primary : '#FFFFFF'),
                  borderColor: isFollowing 
                    ? colors.border 
                    : (isDarkMode ? colors.primary : colors.primary),
                  borderWidth: 1,
                },
              ]}
              onPress={handleFollow}
              disabled={isLoadingFollow || isLoadingFollowing}
            >
              {(isLoadingFollow || isLoadingFollowing) ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowing 
                    ? colors.text 
                    : (isDarkMode ? '#000000' : colors.primary)
                  }
                />
              ) : (
                <Text
                  style={[
                    dynamicStyles.followButtonText,
                    { 
                      color: isFollowing 
                        ? colors.text 
                        : (isDarkMode ? '#000000' : colors.primary),
                    },
                  ]}
                >
                  {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dynamicStyles.messageButton,
                { 
                  backgroundColor: colors.border,
                },
              ]}
              onPress={handleMessage}
            >
              <Text style={[dynamicStyles.messageButtonText, { color: colors.text }]}>
                Nhắn tin
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dynamicStyles.addButton,
                { 
                  backgroundColor: colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons name="account-plus" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Story Highlights (Optional - can be empty for now) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={dynamicStyles.storyHighlights}
            contentContainerStyle={dynamicStyles.storyHighlightsContent}
          >
            {/* Story highlights would go here */}
          </ScrollView>

          {/* Swipeable Content Area - Tabs and Posts Grid */}
          <Animated.View
            style={[
              {
                transform: [{ translateX: tabTranslateX }],
                opacity: tabOpacity,
              },
            ]}
            {...panResponder.panHandlers}
          >
            {/* Navigation Tabs */}
            <View style={[dynamicStyles.tabsContainer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  dynamicStyles.tab,
                  activeTab === 'posts' && dynamicStyles.activeTab,
                  { borderBottomColor: activeTab === 'posts' ? colors.text : 'transparent' },
                ]}
                onPress={() => changeTab('posts')}
              >
                <MaterialCommunityIcons
                  name="grid"
                  size={24}
                  color={activeTab === 'posts' ? colors.text : colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.tab,
                  activeTab === 'reels' && dynamicStyles.activeTab,
                  { borderBottomColor: activeTab === 'reels' ? colors.text : 'transparent' },
                ]}
                onPress={() => changeTab('reels')}
              >
                <MaterialCommunityIcons
                  name="play-circle"
                  size={24}
                  color={activeTab === 'reels' ? colors.text : colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.tab,
                  activeTab === 'reposts' && dynamicStyles.activeTab,
                  { borderBottomColor: activeTab === 'reposts' ? colors.text : 'transparent' },
                ]}
                onPress={() => changeTab('reposts')}
              >
                <MaterialCommunityIcons
                  name="repeat"
                  size={24}
                  color={activeTab === 'reposts' ? colors.text : colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.tab,
                  activeTab === 'tagged' && dynamicStyles.activeTab,
                  { borderBottomColor: activeTab === 'tagged' ? colors.text : 'transparent' },
                ]}
                onPress={() => changeTab('tagged')}
              >
                <MaterialCommunityIcons
                  name="account-tag"
                  size={24}
                  color={activeTab === 'tagged' ? colors.text : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Posts Grid */}
            {isLoadingPosts && page === 1 ? (
            <View style={dynamicStyles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary || '#0084ff'} />
            </View>
          ) : postMediaWithPosts.length === 0 ? (
            <View style={dynamicStyles.emptyContainer}>
              <MaterialCommunityIcons
                name={activeTab === 'reels' ? "video-off-outline" : "image-off-outline"}
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>
                {activeTab === 'reels' ? 'Chưa có video nào' : 'Chưa có bài viết nào'}
              </Text>
            </View>
          ) : (
            <View style={dynamicStyles.postsGrid}>
              {/* Group media (images/videos) into rows of 3 */}
              {Array.from({ length: Math.ceil(postMediaWithPosts.length / 3) }).map((_, rowIndex) => {
                const startIndex = rowIndex * 3;
                const rowItems = postMediaWithPosts.slice(startIndex, startIndex + 3);
                
                return (
                  <View key={rowIndex} style={dynamicStyles.postRow}>
                    {rowItems.map((mediaItem, colIndex: number) => {
                      if (!mediaItem) return null;
                      
                      const { post, mediaUrl, isVideo } = mediaItem;
                      
                      // Get all images for image viewer (for image posts) or video thumbnail + images
                      let postAllImages: string[] = [];
                      if (isVideo) {
                        // For video posts, show video thumbnail first, then images if any
                        const videoThumbnail = post.thumbnailUrl || 
                                             (post.images && Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : null) || 
                                             post.image_url;
                        if (videoThumbnail) {
                          postAllImages = [videoThumbnail];
                        }
                        if (post.images && Array.isArray(post.images) && post.images.length > 0) {
                          postAllImages = [...postAllImages, ...post.images];
                        }
                      } else {
                        // For image posts
                        postAllImages = post?.images && Array.isArray(post.images) && post.images.length > 0
                          ? post.images 
                          : (post?.image_url ? [post.image_url] : (mediaUrl ? [mediaUrl] : []));
                      }
                      
                      // Find the index of the clicked media in the post's media array
                      const clickedMediaIndex = postAllImages.findIndex(img => 
                        getImageURL(img) === getImageURL(mediaUrl)
                      );
                      
                      // Check if this is the last item in the row
                      const isLastInRow = colIndex === rowItems.length - 1;
                      
                      const handleVideoPress = () => {
                        // Open video player when video icon is clicked
                        const videoUrl = post.video_url || post.videoUrl || (post.videos && (Array.isArray(post.videos) ? post.videos[0] : post.videos));
                        if (videoUrl) {
                          // Navigate to Video tab which will show videos
                          // The VideoFeedScreen will handle video playback
                          navigation.navigate('Video' as never);
                        }
                      };

                      const handleImagePress = () => {
                        if (isVideo) {
                          // For video posts, clicking on the image area should also open video
                          handleVideoPress();
                          return;
                        }
                        // Open full screen image viewer with all images from this post
                        if (postAllImages.length > 0) {
                          setImageViewerImages(postAllImages);
                          setImageViewerIndex(clickedMediaIndex >= 0 ? clickedMediaIndex : 0);
                          // Set post data for bottom bar interactions
                          setImageViewerPostData({
                            id: post?.id,
                            likes: post?.likes_count || 0,
                            comments: post?.comments_count || 0,
                            isLiked: post?.isLiked || false,
                            onLike: async () => {
                              if (!post?.id) return;
                              try {
                                const wasLiked = post.isLiked;
                                if (wasLiked) {
                                  await newsfeedAPI.unlikePost(String(post.id));
                                } else {
                                  await newsfeedAPI.likePost(String(post.id));
                                }
                                // Update postData immediately for instant UI feedback
                                setImageViewerPostData((prev: any) => ({
                                  ...prev,
                                  isLiked: !wasLiked,
                                  likes: wasLiked ? (prev.likes - 1) : (prev.likes + 1),
                                }));
                                // Also refresh posts to sync with server
                                await refetchPosts();
                              } catch (error) {
                                console.error('Error toggling like:', error);
                                Alert.alert('Lỗi', 'Không thể thực hiện thao tác này');
                              }
                            },
                            onComment: () => {
                              if (post?.id) {
                                setActivePostId(post.id);
                                setShowComments(true);
                                setShowImageViewer(false);
                              }
                            },
                            onRepost: () => {
                              Alert.alert('Thông báo', 'Tính năng repost sẽ được thêm sau');
                            },
                            onShare: () => {
                              Alert.alert('Thông báo', 'Tính năng chia sẻ sẽ được thêm sau');
                            },
                          });
                          setShowImageViewer(true);
                        }
                      };

                      // Get display URL - for videos, mediaUrl can be null (no thumbnail)
                      const displayUrl = mediaUrl;

                      return (
                        <View
                          key={`${post.id}-${colIndex}`}
                          style={[
                            dynamicStyles.postGridItem,
                            isLastInRow && { marginRight: 0 }
                          ]}
                        >
                          {displayUrl ? (
                            <TouchableOpacity
                              style={StyleSheet.absoluteFill}
                              onPress={handleImagePress}
                              activeOpacity={0.9}
                            >
                              <Image
                                source={{ uri: getImageURL(displayUrl) }}
                                style={dynamicStyles.postGridImage}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          ) : isVideo ? (
                            // Video without thumbnail - show placeholder with video icon
                            <View style={[StyleSheet.absoluteFill, dynamicStyles.videoPlaceholder]}>
                              <MaterialCommunityIcons
                                name="video"
                                size={48}
                                color={colors.textSecondary}
                              />
                            </View>
                          ) : null}
                          {/* Video indicator - clickable */}
                          {isVideo && (
                            <TouchableOpacity
                              style={dynamicStyles.videoIndicator}
                              onPress={handleVideoPress}
                              activeOpacity={0.8}
                            >
                              <View style={dynamicStyles.videoIconContainer}>
                                <MaterialCommunityIcons
                                  name="play-circle"
                                  size={48}
                                  color="#FFFFFF"
                                />
                              </View>
                            </TouchableOpacity>
                          )}
                          {/* Multi-image indicator */}
                          {!isVideo && postAllImages.length > 1 && (
                            <View style={dynamicStyles.multiImageIndicator}>
                              <MaterialCommunityIcons
                                name="layers"
                                size={16}
                                color="#FFFFFF"
                              />
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
              
              {/* Loading indicator for load more */}
              {isLoadingMore && (
                <View style={dynamicStyles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={colors.primary || '#0084ff'} />
                  <Text style={[dynamicStyles.loadingMoreText, { color: colors.textSecondary }]}>
                    Đang tải thêm...
                  </Text>
                </View>
              )}
              
              {/* End of list indicator */}
              {!hasMore && postMediaWithPosts.length > 0 && (
                <View style={dynamicStyles.endOfListContainer}>
                  <Text style={[dynamicStyles.endOfListText, { color: colors.textSecondary }]}>
                    Đã xem hết
                  </Text>
                </View>
              )}
            </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Full Screen Image Viewer */}
      <FullScreenImageViewer
        visible={showImageViewer}
        images={imageViewerImages}
        initialIndex={imageViewerIndex}
        onClose={() => setShowImageViewer(false)}
        postData={imageViewerPostData}
      />

      {/* Comments Bottom Sheet */}
      <CommentsBottomSheet
        visible={showComments}
        postId={activePostId}
        onClose={() => {
          setShowComments(false);
          setActivePostId(null);
        }}
      />

      {/* Profile Menu Bottom Sheet */}
      <Modal
        visible={showProfileMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity
          style={dynamicStyles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View
            style={[
              dynamicStyles.menuSheet, 
              { 
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 20),
              }
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Handle bar */}
            <View style={[dynamicStyles.menuHandle, { backgroundColor: colors.border }]} />

            {/* Group 1: Copy Link */}
            <View style={[dynamicStyles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[dynamicStyles.menuItem, dynamicStyles.menuItemFirst, dynamicStyles.menuItemLast]}
                onPress={async () => {
                  setShowProfileMenu(false);
                  try {
                    const profileLink = `zyea://profile/${userId}`;
                    await Clipboard.setString(profileLink);
                    Alert.alert('Thành công', 'Đã sao chép liên kết');
                  } catch (error) {
                    Alert.alert('Lỗi', 'Không thể sao chép liên kết');
                  }
                }}
              >
                <Text style={[dynamicStyles.menuItemText, { color: colors.text }]}>
                  Sao chép liên kết
                </Text>
                <MaterialCommunityIcons name="link-variant" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Spacing between groups */}
            <View style={dynamicStyles.menuGroupSpacing} />

            {/* Group 2: Privacy Actions */}
            <View style={[dynamicStyles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[dynamicStyles.menuItem, dynamicStyles.menuItemFirst, { borderBottomColor: colors.border }]}
                onPress={async () => {
                  setShowProfileMenu(false);
                  if (isMuted) {
                    // Unmute
                    Alert.alert(
                      'Bỏ tắt thông báo',
                      `Bạn có muốn bật lại thông báo từ ${userProfile?.full_name || userProfile?.username || 'người dùng này'} không?`,
                      [
                        { text: 'Hủy', style: 'cancel' },
                        {
                          text: 'Bật lại',
                          onPress: async () => {
                            try {
                              await friendsAPI.unmute(userId);
                              setIsMuted(false);
                              Alert.alert('Thành công', 'Đã bật lại thông báo');
                            } catch (error: any) {
                              Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể bật lại thông báo');
                            }
                          },
                        },
                      ]
                    );
                  } else {
                    // Mute
                    Alert.alert(
                      'Tắt thông báo',
                      `Bạn có muốn tắt thông báo từ ${userProfile?.full_name || userProfile?.username || 'người dùng này'} không?`,
                      [
                        { text: 'Hủy', style: 'cancel' },
                        {
                          text: 'Tắt',
                          onPress: async () => {
                            try {
                              await friendsAPI.mute(userId);
                              setIsMuted(true);
                              Alert.alert('Thành công', 'Đã tắt thông báo');
                            } catch (error: any) {
                              Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tắt thông báo');
                            }
                          },
                        },
                      ]
                    );
                  }
                }}
              >
                <Text style={[dynamicStyles.menuItemText, { color: colors.text }]}>
                  {isMuted ? 'Bật lại thông báo' : 'Tắt thông báo'}
                </Text>
                <MaterialCommunityIcons 
                  name={isMuted ? "bell-outline" : "bell-off-outline"} 
                  size={24} 
                  color={colors.text} 
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[dynamicStyles.menuItem, dynamicStyles.menuItemLast]}
                onPress={async () => {
                  setShowProfileMenu(false);
                  if (isRestricted) {
                    // Unrestrict
                    Alert.alert(
                      'Bỏ hạn chế',
                      `Bạn có muốn bỏ hạn chế ${userProfile?.full_name || userProfile?.username || 'người dùng này'} không?`,
                      [
                        { text: 'Hủy', style: 'cancel' },
                        {
                          text: 'Bỏ hạn chế',
                          onPress: async () => {
                            try {
                              await friendsAPI.unrestrict(userId);
                              setIsRestricted(false);
                              Alert.alert('Thành công', 'Đã bỏ hạn chế');
                            } catch (error: any) {
                              Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể bỏ hạn chế');
                            }
                          },
                        },
                      ]
                    );
                  } else {
                    // Restrict
                    Alert.alert(
                      'Hạn chế',
                      `Bạn có muốn hạn chế ${userProfile?.full_name || userProfile?.username || 'người dùng này'} không? Người dùng bị hạn chế sẽ không thể xem khi bạn online và không thể nhắn tin cho bạn.`,
                      [
                        { text: 'Hủy', style: 'cancel' },
                        {
                          text: 'Hạn chế',
                          onPress: async () => {
                            try {
                              await friendsAPI.restrict(userId);
                              setIsRestricted(true);
                              Alert.alert('Thành công', 'Đã hạn chế người dùng');
                            } catch (error: any) {
                              Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể hạn chế');
                            }
                          },
                        },
                      ]
                    );
                  }
                }}
              >
                <Text style={[dynamicStyles.menuItemText, { color: colors.text }]}>
                  {isRestricted ? 'Bỏ hạn chế' : 'Hạn chế'}
                </Text>
                <MaterialCommunityIcons 
                  name={isRestricted ? "lock-open-outline" : "lock-outline"} 
                  size={24} 
                  color={colors.text} 
                />
              </TouchableOpacity>
            </View>

            {/* Spacing between groups */}
            <View style={dynamicStyles.menuGroupSpacing} />

            {/* Group 3: Block & Report (Red actions) */}
            <View style={[dynamicStyles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[dynamicStyles.menuItem, dynamicStyles.menuItemFirst, { borderBottomColor: colors.border }]}
                onPress={async () => {
                  setShowProfileMenu(false);
                  if (isBlocked) {
                    // Unblock
                    Alert.alert(
                      'Bỏ chặn người dùng',
                      `Bạn có chắc chắn muốn bỏ chặn ${userProfile?.full_name || userProfile?.username || 'người dùng này'} không?`,
                      [
                        { text: 'Hủy', style: 'cancel' },
                        {
                          text: 'Bỏ chặn',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await friendsAPI.unblock(userId);
                              setIsBlocked(false);
                              Alert.alert('Thành công', 'Đã bỏ chặn người dùng');
                              // Refresh profile to update UI
                              await refetchProfile();
                            } catch (error: any) {
                              Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể bỏ chặn');
                            }
                          },
                        },
                      ]
                    );
                  } else {
                    // Block
                    Alert.alert(
                      'Chặn người dùng',
                      `Bạn có chắc chắn muốn chặn ${userProfile?.full_name || userProfile?.username || 'người dùng này'} không? Người dùng bị chặn sẽ không thể xem bài viết của bạn, nhắn tin cho bạn hoặc tìm kiếm bạn.`,
                      [
                        { text: 'Hủy', style: 'cancel' },
                        {
                          text: 'Chặn',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await friendsAPI.block(userId);
                              setIsBlocked(true);
                              Alert.alert('Thành công', 'Đã chặn người dùng');
                              // Refresh profile to update UI
                              await refetchProfile();
                            } catch (error: any) {
                              Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể chặn người dùng');
                            }
                          },
                        },
                      ]
                    );
                  }
                }}
              >
                <Text style={[dynamicStyles.menuItemText, { color: '#FF3B30' }]}>
                  {isBlocked ? 'Bỏ chặn' : 'Chặn'}
                </Text>
                <MaterialCommunityIcons 
                  name={isBlocked ? "account-check-outline" : "block-helper"} 
                  size={24} 
                  color="#FF3B30" 
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[dynamicStyles.menuItem, dynamicStyles.menuItemLast]}
                onPress={async () => {
                  setShowProfileMenu(false);
                  Alert.alert(
                    'Báo cáo tài khoản',
                    `Bạn có chắc chắn muốn báo cáo ${userProfile?.full_name || userProfile?.username || 'người dùng này'} không?`,
                    [
                      { text: 'Hủy', style: 'cancel' },
                      {
                        text: 'Báo cáo',
                        style: 'destructive',
                        onPress: async () => {
                          // Show reason selection
                          Alert.alert(
                            'Lý do báo cáo',
                            'Vui lòng chọn lý do báo cáo:',
                            [
                              { text: 'Hủy', style: 'cancel' },
                              {
                                text: 'Spam',
                                onPress: async () => {
                                  try {
                                    await friendsAPI.report(userId, 'spam', '');
                                    Alert.alert('Thành công', 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét và xử lý.');
                                  } catch (error: any) {
                                    Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể gửi báo cáo');
                                  }
                                },
                              },
                              {
                                text: 'Nội dung không phù hợp',
                                onPress: async () => {
                                  try {
                                    await friendsAPI.report(userId, 'inappropriate', '');
                                    Alert.alert('Thành công', 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét và xử lý.');
                                  } catch (error: any) {
                                    Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể gửi báo cáo');
                                  }
                                },
                              },
                              {
                                text: 'Quấy rối',
                                onPress: async () => {
                                  try {
                                    await friendsAPI.report(userId, 'harassment', '');
                                    Alert.alert('Thành công', 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét và xử lý.');
                                  } catch (error: any) {
                                    Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể gửi báo cáo');
                                  }
                                },
                              },
                              {
                                text: 'Khác',
                                onPress: async () => {
                                  try {
                                    await friendsAPI.report(userId, 'other', '');
                                    Alert.alert('Thành công', 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét và xử lý.');
                                  } catch (error: any) {
                                    Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể gửi báo cáo');
                                  }
                                },
                              },
                            ],
                            { cancelable: true }
                          );
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={[dynamicStyles.menuItemText, { color: '#FF3B30' }]}>
                  Báo cáo
                </Text>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof PWATheme.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 8,
    },
    scrollView: {
      flex: 1,
    },
    coverContainer: {
      position: 'relative',
      height: 180, // Same height as ProfileInformationScreen for consistency
      width: '100%',
      backgroundColor: colors.border,
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    profileSection: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    profileSectionWithCover: {
      paddingTop: 60, // Space for bottom half of avatar (avatar height 120, so 60px below cover)
      marginTop: 0,
      backgroundColor: colors.surface, // Ensure background for avatar overlap
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
      position: 'relative',
    },
    avatarWrapper: {
      marginRight: 20,
    },
    avatarWrapperWithCover: {
      position: 'absolute',
      top: -60, // Position avatar so half is on cover (avatar height 120, so half = 60)
      left: 16, // Same as ProfileInformationScreen
      zIndex: 10,
      marginRight: 0, // Remove margin when positioned absolutely
    },
    avatarGradient: {
      width: 120,
      height: 120,
      borderRadius: 60,
      padding: 3.5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInner: {
      width: 113,
      height: 113,
      borderRadius: 56.5,
      overflow: 'hidden',
      backgroundColor: 'transparent',
    },
    avatar: {
      width: 113,
      height: 113,
      borderRadius: 56.5,
      backgroundColor: 'transparent',
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 0,
      marginTop: 4, // Reduced from 8 to push name up closer to avatar
      marginBottom: 12,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    ribbonIcon: {
      marginLeft: 6,
    },
    statsContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      paddingTop: 8,
    },
    statsContainerWithCover: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      paddingTop: 8,
      marginLeft: 140, // Space for larger avatar (120 + 20 padding) when it's positioned absolutely
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
      marginBottom: 16,
    },
    followButton: {
      flex: 1,
      height: 36,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 100,
      borderWidth: 1,
    },
    followButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    messageButton: {
      flex: 1,
      height: 36,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 100,
    },
    messageButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    storyHighlights: {
      marginBottom: 16,
    },
    storyHighlightsContent: {
      paddingHorizontal: 4,
    },
    tabsContainer: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      marginTop: 8,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderBottomWidth: 2,
    },
    activeTab: {
      // Active state handled by border color
    },
    postsGrid: {
      marginTop: 8,
    },
    postRow: {
      flexDirection: 'row',
      marginBottom: GAP,
      justifyContent: 'flex-start',
    },
    postGridItem: {
      width: POST_GRID_SIZE,
      height: POST_GRID_SIZE,
      marginRight: GAP,
      backgroundColor: colors.border,
      position: 'relative',
      overflow: 'hidden',
    },
    postGridImage: {
      width: '100%',
      height: '100%',
    },
    multiImageIndicator: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    videoIndicator: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    videoIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    videoPlaceholder: {
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingMoreContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
      gap: 8,
    },
    loadingMoreText: {
      fontSize: 14,
    },
    endOfListContainer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    endOfListText: {
      fontSize: 12,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      marginTop: 12,
    },
    errorText: {
      fontSize: 16,
      marginBottom: 16,
    },
    backButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    menuOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    menuSheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
    },
    menuHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 8,
    },
    menuGroup: {
      marginHorizontal: 12,
      marginTop: 8,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: 'transparent',
      borderWidth: StyleSheet.hairlineWidth,
    },
    menuGroupSpacing: {
      height: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      backgroundColor: 'transparent',
    },
    menuItemFirst: {
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    menuItemLast: {
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      borderBottomWidth: 0,
    },
    menuItemText: {
      fontSize: 16,
      flex: 1,
    },
  });

export default OtherUserProfileScreen;


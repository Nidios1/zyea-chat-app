import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions, useFocusEffect } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTabBar } from '../../contexts/TabBarContext';
import { PWATheme } from '../../config/PWATheme';
import { usersAPI, friendsAPI, newsfeedAPI, chatAPI, verificationAPI } from '../../utils/api';
import { getAvatarURL, getImageURL, getVideoURL, getInitials } from '../../utils/imageUtils';
import { formatTimeAgo } from '../../utils/dateUtils';
import { spacing, typography, borderRadius } from '../../config/designTokens';
import { ProfileStackParamList } from '../../navigation/types';

import ProfileHeader from '../../components/Profile/ProfileHeader';
import { ProfileMenu } from '../../components/Profile/ProfileMenu';
import { ReportUserModal } from '../../components/Profile/ReportUserModal';
import { VerificationModal } from '../../components/Profile/VerificationModal';
import { VerificationRequestModal } from '../../components/Profile/VerificationRequestModal';
import PostContent from '../../components/NewsFeed/PostContent';
import PostImagesCarousel from '../../components/NewsFeed/PostImagesCarousel';
import PostVideoPlayer from '../../components/NewsFeed/PostVideoPlayer';
import { PostControls } from '../../components/PostControls/PostControls';
import FullScreenImageViewer from '../../components/Common/FullScreenImageViewer';

// Route có thể đến từ ProfileStack hoặc FeedStack (OtherUserProfile)
type ProfileScreenRouteProp = RouteProp<
  { Profile: { userId?: string }; OtherUserProfile: { userId: string } },
  'Profile' | 'OtherUserProfile'
>;
type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Profile'>;

// Styles sẽ được tạo bên trong component để có access đến insets và isDarkMode

const ProfileScreen = () => {
  const { user: currentUser } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const route = useRoute<ProfileScreenRouteProp>();
  const { colors, isDarkMode } = useTheme();
  const { setIsVisible } = useTabBar();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  // Xác định userId và isMe (giống social-app-main)
  // Route có thể là 'Profile' (từ ProfileStack) hoặc 'OtherUserProfile' (từ FeedStack)
  const userId = route.name === 'OtherUserProfile' 
    ? (route.params as { userId: string })?.userId
    : (route.params as { userId?: string })?.userId;
  const isMe = !userId || currentUser?.id?.toString() === userId?.toString();
  const targetUserId = isMe ? currentUser?.id : userId;

  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'videos' | 'likes'>('posts');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const lastScrollY = useRef(0);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showVerificationRequestModal, setShowVerificationRequestModal] = useState(false);
  const [verificationInfo, setVerificationInfo] = useState<{
    isVerified: boolean;
    verifiedBy?: string | null;
    verifiedAt?: string | null;
  } | null>(null);

  // Hide tab bar when viewing other user's profile
  useEffect(() => {
    if (!isMe) {
      setIsVisible(false);
      return () => {
        setIsVisible(true);
      };
    }
  }, [isMe, setIsVisible]);

  // Đóng tab Chat và reset Chat stack về ChatList khi quay lại ProfileScreen
  // Đồng thời invalidate queries để refetch data ngay lập tức
  useFocusEffect(
    useCallback(() => {
      // Khi quay lại ProfileScreen, reset Chat stack về ChatList để đảm bảo khi click icon tin nhắn sẽ hiện ChatList
      const tabNavigator = navigation.getParent()?.getParent();
      if (tabNavigator) {
        const state = tabNavigator.getState();
        const chatRoute = state?.routes.find((r: any) => r.name === 'Chat');
        
        // Nếu Chat stack đang có ChatDetail, reset về ChatList
        if (chatRoute?.state && chatRoute.state.index > 0) {
          tabNavigator.dispatch(
            CommonActions.reset({
              index: state.index,
              routes: state.routes.map((route: any) => {
                if (route.name === 'Chat') {
                  // Reset Chat stack về ChatList
                  return {
                    ...route,
                    state: {
                      ...route.state,
                      index: 0,
                      routes: route.state?.routes?.slice(0, 1) || [{ name: 'ChatList' }],
                    },
                  };
                }
                return route;
              }),
            })
          );
        }
      }

      // Invalidate queries khi quay lại màn hình để đảm bảo data mới nhất hiển thị ngay lập tức
      // React Query sẽ tự động refetch nếu query đang active
      queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['userPosts', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['userStats', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['likedPosts', targetUserId] });
      
      // Refetch ngay lập tức
      refetchProfile();
      refetchPosts();
      refetchUserStats();
    }, [navigation, queryClient, targetUserId, refetchProfile, refetchPosts, refetchUserStats])
  );

  // Redirect if viewing own profile with userId
  useEffect(() => {
    if (userId && currentUser?.id?.toString() === userId.toString()) {
      // Already viewing own profile, no redirect needed
    }
  }, [userId, currentUser?.id]);

  // Fetch user profile
  const {
    data: userProfile,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['userProfile', targetUserId],
    queryFn: async () => {
      if (isMe && currentUser) {
        return currentUser;
      }
      if (!targetUserId) return null;
      const res = await usersAPI.getProfile(targetUserId);
      return res.data;
    },
    enabled: !!targetUserId || isMe,
    staleTime: 2 * 60 * 1000, // 2 phút - profile không thay đổi thường xuyên
    gcTime: 10 * 60 * 1000, // 10 phút cache
  });

  // Fetch following list to check if following this user (only for other users)
  const { data: followingList = [], refetch: refetchFollowing } = useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      try {
        const res = await friendsAPI.getFollowing();
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch (error) {
        return [];
      }
    },
    enabled: !isMe && !!targetUserId,
  });

  // Update isFollowing state (only for other users)
  useEffect(() => {
    if (isMe || !targetUserId || !followingList) {
      setIsFollowing(false);
      return;
    }
    const normalizedUserId = String(targetUserId);
    const followingIds = followingList.map((f: any) => {
      const id = f.following_id || f.id || f.user_id;
      return id ? String(id) : null;
    }).filter(Boolean);

    setIsFollowing(followingIds.includes(normalizedUserId));
  }, [followingList, targetUserId, isMe]);

  // Fetch verification info
  const { data: verificationData } = useQuery({
    queryKey: ['verification', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      try {
        const res = await verificationAPI.getUserVerification(targetUserId);
        return res.data;
      } catch (error) {
        console.error('Error fetching verification info:', error);
        return { isVerified: false, verifiedBy: null, verifiedAt: null };
      }
    },
    onSuccess: (data) => {
      console.log('✅ Verification API response:', data);
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5 phút - verification không thay đổi thường xuyên
  });

  // Update verification info state
  useEffect(() => {
    if (verificationData) {
      // Ensure isVerified is a boolean (API might return 1/0 from MySQL)
      const isVerified = Boolean(verificationData.isVerified);
      setVerificationInfo({
        isVerified,
        verifiedBy: verificationData.verifiedBy || null,
        verifiedAt: verificationData.verifiedAt || null,
      });
      console.log('✅ Verification info updated:', { isVerified, verifiedBy: verificationData.verifiedBy, verifiedAt: verificationData.verifiedAt });
    } else {
      // Reset if no data
      setVerificationInfo({
        isVerified: false,
        verifiedBy: null,
        verifiedAt: null,
      });
    }
  }, [verificationData]);

  // Fetch blocked/muted status (only for other users)
  const { data: friendshipStatus } = useQuery({
    queryKey: ['friendshipStatus', targetUserId],
    queryFn: async () => {
      if (isMe || !targetUserId) return null;
      try {
        const res = await friendsAPI.checkFriendshipStatus(targetUserId);
        return res.data;
      } catch (error) {
        console.error('Error checking friendship status:', error);
        return null;
      }
    },
    enabled: !isMe && !!targetUserId,
  });

  // Update blocked/muted state
  useEffect(() => {
    if (isMe || !friendshipStatus) {
      setIsBlocked(false);
      setIsMuted(false);
      return;
    }
    setIsBlocked(friendshipStatus.is_blocked || friendshipStatus.blocked || false);
    setIsMuted(friendshipStatus.is_muted || friendshipStatus.muted || false);
  }, [friendshipStatus, isMe]);

  // Fetch user stats
  const { data: userStats, refetch: refetchUserStats } = useQuery({
    queryKey: ['userStats', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return { followersCount: 0, followingCount: 0, postsCount: 0 };
      try {
        const res = await usersAPI.getUserStats(targetUserId);
        return {
          followersCount: res.data?.followersCount || res.data?.followers_count || 0,
          followingCount: res.data?.followingCount || res.data?.following_count || 0,
          postsCount: res.data?.postsCount || res.data?.posts_count || 0,
        };
      } catch (error) {
        return {
          followersCount: userProfile?.followers_count || 0,
          followingCount: userProfile?.following_count || 0,
          postsCount: 0,
        };
      }
    },
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2 phút - stats không thay đổi thường xuyên
    gcTime: 10 * 60 * 1000, // 10 phút cache
  });

  // Fetch followers and following counts (for my profile)
  const { data: followersData } = useQuery({
    queryKey: ['followers', targetUserId],
    queryFn: async () => {
      try {
        const res = await friendsAPI.getFollowers();
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch (error) {
        return [];
      }
    },
    enabled: isMe && !!targetUserId,
  });

  const { data: followingData } = useQuery({
    queryKey: ['following', targetUserId],
    queryFn: async () => {
      try {
        const res = await friendsAPI.getFollowing();
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch (error) {
        return [];
      }
    },
    enabled: isMe && !!targetUserId,
  });

  // Fetch user posts
  const { data: userPosts = [], isLoading: isLoadingPosts, refetch: refetchPosts } = useQuery({
    queryKey: ['userPosts', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      try {
        const res = await newsfeedAPI.getPosts(1, 'all');
        const allPosts = Array.isArray(res.data) ? res.data : (res.data?.posts || []);
        return allPosts.filter((post: any) => {
          const postUserId = post.user_id || post.user?.id || post.author?.id;
          return String(postUserId) === String(targetUserId);
        });
      } catch (error) {
        console.error('Error fetching user posts:', error);
        return [];
      }
    },
    enabled: !!targetUserId,
    staleTime: 30 * 1000, // 30 giây - posts cần refresh thường xuyên hơn
    gcTime: 10 * 60 * 1000, // 10 phút cache
  });

  const stats = {
    posts: userStats?.postsCount || userPosts.length || 0,
    followers: userStats?.followersCount || (isMe ? (followersData?.length || 0) : 0),
    following: userStats?.followingCount || (isMe ? (followingData?.length || 0) : 0),
  };

  // Like mutation với optimistic update
  // Backend sử dụng POST cho cả like và unlike (nếu đã like thì unlike)
  const likePostMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string | number; isLiked: boolean }) => {
      // Backend tự động xử lý: nếu đã like thì unlike, chưa like thì like
      await newsfeedAPI.likePost(postId.toString(), 'like');
    },
    onMutate: async ({ postId, isLiked }) => {
      // Cancel outgoing refetches để tránh overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['userPosts', targetUserId] });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(['userPosts', targetUserId]);

      // Optimistically update
      queryClient.setQueryData(['userPosts', targetUserId], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((post: any) => {
          const postIdMatch = (post.id || post._id || post.post_id || post.postId) === postId;
          if (postIdMatch) {
            return {
              ...post,
              isLiked: !isLiked,
              likes_count: isLiked 
                ? Math.max(0, (post.likes_count || 0) - 1)
                : (post.likes_count || 0) + 1,
            };
          }
          return post;
        });
      });

      // Return context với previous value để rollback nếu cần
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Rollback nếu có lỗi
      if (context?.previousPosts) {
        queryClient.setQueryData(['userPosts', targetUserId], context.previousPosts);
      }
    },
    onSuccess: () => {
      // Invalidate để đảm bảo data sync với server
      queryClient.invalidateQueries({ queryKey: ['userPosts', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] }); // Cũng invalidate posts list để sync
    },
  });

  // Follow/Unfollow handlers (only for other users)
  const handleFollow = async () => {
    if (!targetUserId || isMe) return;

    if (isFollowing) {
    Alert.alert(
        'Hủy theo dõi',
        `Bạn có chắc chắn muốn hủy theo dõi ${userProfile?.full_name || userProfile?.username || 'người dùng này'} không?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Hủy theo dõi',
          style: 'destructive',
          onPress: async () => {
              await performUnfollow();
            },
          },
        ]
      );
    } else {
      await performFollow();
    }
  };

  const performFollow = async () => {
    if (!targetUserId || isMe) return;
    setIsLoadingFollow(true);
    try {
      await friendsAPI.follow(targetUserId);
      await Promise.all([
        refetchFollowing(),
        refetchProfile(),
        refetchUserStats(),
      ]);
    } catch (error: any) {
      console.error('Error following:', error);
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể theo dõi');
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const performUnfollow = async () => {
    if (!targetUserId || isMe) return;
    setIsLoadingFollow(true);
    try {
      await friendsAPI.unfollow(targetUserId);
      await Promise.all([
        refetchFollowing(),
        refetchProfile(),
        refetchUserStats(),
      ]);
    } catch (error: any) {
      console.error('Error unfollowing:', error);
      Alert.alert('Lỗi', 'Không thể hủy theo dõi');
    } finally {
      setIsLoadingFollow(false);
    }
  };

  // Message handler (only for other users)
  const handleMessage = async () => {
    if (!targetUserId || !userProfile || isMe) return;
    try {
      const response = await chatAPI.createConversation(targetUserId);
      const conversationId = response.data?.conversationId || (response as any).conversationId;

      if (!conversationId) {
        Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện');
        return;
      }

      navigation.dispatch(
        CommonActions.navigate({
          name: 'Chat' as never,
          params: {
            screen: 'ChatDetail',
            params: {
              conversationId: String(conversationId),
              userName: userProfile.full_name || userProfile.username || 'Người dùng',
              userAvatarUrl: userProfile.avatar_url,
              otherUserId: targetUserId,
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

  // Edit profile handler (only for my profile)
  const handleEditProfile = useCallback(() => {
    if (!isMe) return;
    navigation.navigate('EditProfile');
  }, [isMe, navigation]);

  // Create post handler (only for my profile)
  const handleCreatePost = useCallback(() => {
    if (!isMe) return;
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
  }, [isMe, navigation]);

  // Avatar press handler
  const handleAvatarPress = useCallback(() => {
    if (!isMe) return;
    if (userProfile?.avatar_url) {
      setImageViewerImages([userProfile.avatar_url]);
      setImageViewerIndex(0);
      setShowImageViewer(true);
    } else {
      handleEditProfile();
    }
  }, [isMe, userProfile?.avatar_url, handleEditProfile]);

  // Settings handler - show menu instead of direct navigation
  const handleSettingsPress = useCallback(() => {
    setShowProfileMenu(true);
  }, []);

  const handleVideoPress = useCallback((postId: string, videoUrl: string) => {
    setPlayingVideoId(postId === playingVideoId ? null : postId);
  }, [playingVideoId]);

  const handleQuickLike = useCallback((postId: string | number) => {
    // Tìm post hiện tại để lấy isLiked state
    const post = userPosts.find((p: any) => {
      const pId = p.id || p._id || p.post_id || p.postId;
      return String(pId) === String(postId);
    });
    const currentIsLiked = post?.isLiked || false;
    
    // Mutate với optimistic update
    likePostMutation.mutate({ postId, isLiked: currentIsLiked });
  }, [likePostMutation, userPosts]);

  // Fetch replies (posts with comments/replies)
  const repliesPosts = userPosts.filter((post: any) => {
    return post.comments_count > 0 || post.parent_id || post.reply_to;
  });

  // Fetch liked posts (only for my profile)
  // Luôn gọi hook này, nhưng chỉ enable khi cần thiết
  const { data: likedPosts = [] } = useQuery({
    queryKey: ['likedPosts', targetUserId, activeTab],
    queryFn: async () => {
      if (!targetUserId) return [];
      try {
        const res = await newsfeedAPI.getPosts(1, 'all');
        const allPosts = Array.isArray(res.data) ? res.data : (res.data?.posts || []);
        return allPosts.filter((post: any) => post.isLiked === true);
      } catch (error) {
        return [];
      }
    },
    enabled: !!targetUserId && isMe && activeTab === 'likes',
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
    if (activeTab === 'likes' && isMe) {
      return likedPosts;
    }
    return userPosts; // posts tab shows all
  })();

  // Handle scroll để hiện sticky header
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDifference = currentScrollY - lastScrollY.current;

    if (Math.abs(scrollDifference) > 10) {
      if (currentScrollY > 200) {
        if (!isScrolledDown) {
          setIsScrolledDown(true);
        }
      } else {
        if (isScrolledDown) {
          setIsScrolledDown(false);
        }
      }
    }

    lastScrollY.current = currentScrollY;
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

  // Tất cả hooks phải được gọi trước early returns
  // Create styles bên trong component để có access đến insets và isDarkMode
  const dynamicStyles = useMemo(() => StyleSheet.create({
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
    stickyFollowButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.md,
    },
    stickyFollowButtonText: {
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
      paddingTop: spacing.xxl,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing.xxl,
      minHeight: 200,
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
    fabContainer: {
      position: 'absolute',
      right: spacing.base,
      bottom: 80 + (insets.bottom || 0),
      zIndex: 1000,
    },
    fab: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: isDarkMode ? 8 : 4,
      shadowColor: isDarkMode ? '#000000' : '#000',
      shadowOffset: { width: 0, height: isDarkMode ? 4 : 2 },
      shadowOpacity: isDarkMode ? 0.5 : 0.25,
      shadowRadius: isDarkMode ? 6 : 3.84,
    },
  }), [colors, isDarkMode, insets.bottom]);

  // Render header - Phải được định nghĩa trước early returns (vì là hook useCallback)
  const renderHeader = useCallback(() => {
    if (!userProfile) return null;
    return (
      <ProfileHeader
        isOnline={userProfile?.status === 'online'}
        isVerified={verificationInfo?.isVerified || false}
        verifiedBy={verificationInfo?.verifiedBy || null}
        verifiedAt={verificationInfo?.verifiedAt || null}
        onVerifiedBadgePress={() => setShowVerificationModal(true)}
        user={userProfile}
        stats={stats}
        isMe={isMe}
        isFollowing={isFollowing}
        onEditPress={isMe ? handleEditProfile : undefined}
        onSettingsPress={handleSettingsPress} // Truyền cho cả isMe và !isMe
        onAvatarPress={isMe ? handleAvatarPress : undefined}
        onFollowPress={!isMe ? handleFollow : undefined}
        onMessagePress={!isMe ? handleMessage : undefined}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  }, [userProfile, stats, isMe, isFollowing, handleEditProfile, handleSettingsPress, handleAvatarPress, handleFollow, handleMessage, activeTab, userProfile?.status]);

  // Early returns - SAU khi tất cả hooks đã được gọi
  if (isLoadingProfile) {
    return (
      <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={dynamicStyles.emptyContainer}>
          <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>
            {isMe ? 'Đang tải...' : 'Không tìm thấy người dùng'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render post
  const renderPost = ({ item }: { item: any }) => {
    const authorName = item.full_name || item.username || 'Unknown';
    const authorAvatar = item.avatar_url || '';
    const postTime = item.created_at ? formatTimeAgo(new Date(item.created_at)) : '';

    let postVideoUrl: string | undefined = undefined;
    let hasVideo = false;
    if (item.videoUrl && item.videoUrl.trim() !== '') {
      postVideoUrl = getVideoURL(item.videoUrl);
      hasVideo = !!(postVideoUrl && postVideoUrl.trim() !== '');
    } else if (item.video_url && item.video_url.trim() !== '') {
      postVideoUrl = getVideoURL(item.video_url);
      hasVideo = !!(postVideoUrl && postVideoUrl.trim() !== '');
    }

    const postImages: string[] = [];
    if (!hasVideo) {
      if (item.images && Array.isArray(item.images)) {
        postImages.push(...item.images);
      } else if (item.image_url) {
        postImages.push(item.image_url);
      }
    }

    const videoThumbnail = item.thumbnailUrl || item.thumbnail_url || (postImages.length > 0 ? postImages[0] : undefined);
    const videoAspectRatio = item.video_aspect_ratio || (item.video_width && item.video_height ? item.video_width / item.video_height : undefined);

  return (
        <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          const pid = item?.id || item?._id || item?.post_id || item?.postId || null;
          if (pid) {
            (navigation as any).navigate('NewsFeed', {
              screen: 'Comments',
              params: { postId: pid, postData: item },
            });
          }
        }}
      >
        <View style={[dynamicStyles.postContainer, { backgroundColor: colors.background }]}>
          <View style={dynamicStyles.postLayout}>
            <View style={dynamicStyles.layoutAvi}>
              <TouchableOpacity style={dynamicStyles.avatarContainer}>
                {authorAvatar ? (
                  <Image source={{ uri: getAvatarURL(authorAvatar) }} style={dynamicStyles.authorAvatar} />
                ) : (
                  <Avatar.Text size={42} label={getInitials(authorName)} style={dynamicStyles.authorAvatar} />
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
                  onCollapse={() => { }}
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
                      if (postId && postVideoUrl) handleVideoPress(postId, postVideoUrl);
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
                    if (postId) handleQuickLike(postId);
                  }}
                  onPressReply={() => {
                    const pid = item?.id || item?._id || item?.post_id || item?.postId || null;
                    if (pid) {
                      (navigation as any).navigate('NewsFeed', {
                        screen: 'Comments',
                        params: { postId: pid, postData: item },
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
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Sticky Header */}
      {isScrolledDown && (
        <Animated.View
          style={[
            dynamicStyles.stickyHeader,
            {
              opacity: stickyHeaderOpacity,
              transform: [{ translateY: stickyHeaderTranslateY }],
              paddingTop: insets.top + spacing.sm,
            },
          ]}
        >
          <View style={dynamicStyles.stickyHeaderContent}>
            <TouchableOpacity
              style={dynamicStyles.stickyMenuButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={dynamicStyles.stickyHeaderCenter}>
              <Text style={[dynamicStyles.stickyName, { color: colors.text }]}>
                {userProfile?.full_name || userProfile?.username || 'Người dùng'}
              </Text>
              <View style={dynamicStyles.stickyHandleRow}>
            <MaterialCommunityIcons
                  name="white-balance-sunny"
                  size={14}
              color={colors.textSecondary}
                  style={{ marginRight: 4 }}
            />
                <Text style={[dynamicStyles.stickyHandle, { color: colors.textSecondary }]}>
                  {userProfile?.username || ''}
                </Text>
              </View>
          </View>

            <View style={dynamicStyles.stickyHeaderRight}>
              {isMe ? (
                <>
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
                    onPress={handleSettingsPress}
                  >
                    <MaterialCommunityIcons name="dots-horizontal" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <ProfileMenu
                    visible={showProfileMenu}
                    onClose={() => setShowProfileMenu(false)}
                    isMe={isMe}
                    isVerified={verificationInfo?.isVerified || false}
                    onVerificationRequest={() => {
                      if (isMe) {
                        setShowProfileMenu(false);
                        setTimeout(() => {
                          setShowVerificationRequestModal(true);
                        }, 400);
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <TouchableOpacity
            style={[
                      dynamicStyles.stickyFollowButton,
                      {
                        backgroundColor: isFollowing
                          ? (colors.surface || (isDarkMode ? '#1E1E1E' : '#F5F5F5'))
                          : '#0084ff',
                      },
                      isFollowing && { borderWidth: 1, borderColor: colors.border }
                    ]}
                    onPress={handleFollow}
                    disabled={isLoadingFollow}
                  >
                    <Text style={[
                      dynamicStyles.stickyFollowButtonText,
                      { color: isFollowing ? colors.text : '#FFFFFF' }
                    ]}>
                      {isLoadingFollow ? '...' : (isFollowing ? 'Đang theo dõi' : 'Theo dõi')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dynamicStyles.stickyMenuButtonSmall, { backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#F5F5F5') }]}
                    onPress={handleMessage}
                  >
                    <MaterialCommunityIcons name="message-text-outline" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dynamicStyles.stickyMenuButtonSmall, { backgroundColor: colors.surface || (isDarkMode ? '#1E1E1E' : '#F5F5F5') }]}
                    onPress={() => setShowProfileMenu(true)}
                  >
                    <MaterialCommunityIcons name="dots-horizontal" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <ProfileMenu
                    visible={showProfileMenu}
                    onClose={() => setShowProfileMenu(false)}
                    isMe={isMe}
                    profileUserId={!isMe ? targetUserId?.toString() : undefined}
                    userName={!isMe ? (userProfile?.full_name || userProfile?.username) : undefined}
                    isVerified={verificationInfo?.isVerified || false}
                    onVerificationRequest={() => {
                      if (isMe) {
                        setShowProfileMenu(false);
                        setTimeout(() => {
                          setShowVerificationRequestModal(true);
                        }, 400);
                      }
                    }}
                    isBlocked={!isMe ? isBlocked : false}
                    isMuted={!isMe ? isMuted : false}
                    onBlockChange={() => {
                      refetchProfile();
                      refetchFollowing();
                    }}
                    onMuteChange={() => {
                      refetchProfile();
                    }}
                  />
                </>
                  )}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Posts List */}
      {isLoadingPosts ? (
        <FlatList
          ref={flatListRef}
          data={[]}
          keyExtractor={() => 'loading'}
          renderItem={() => null}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={dynamicStyles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          }
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            handleScroll(e);
            Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )(e);
          }}
          scrollEventThrottle={16}
        />
      ) : filteredPosts.length === 0 ? (
        <FlatList
          ref={flatListRef}
          data={[]}
          keyExtractor={() => 'empty'}
          renderItem={() => null}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={[dynamicStyles.emptyContainer, { paddingTop: 100 }]}>
              <MaterialCommunityIcons 
                name={
                  activeTab === 'replies' ? 'comment-outline' :
                  activeTab === 'media' ? 'image-outline' :
                  activeTab === 'videos' ? 'video-outline' :
                  activeTab === 'likes' ? 'heart-outline' :
                  'file-document-outline'
                }
                size={64} 
                color={colors.textSecondary || (isDarkMode ? '#B0B3B8' : '#65676B')} 
                style={{ marginBottom: 16, opacity: 0.5 }}
              />
              <Text style={[dynamicStyles.emptyText, { 
                color: colors.textSecondary || (isDarkMode ? '#B0B3B8' : '#65676B'),
                fontSize: 18,
                fontWeight: '500',
                marginBottom: 8,
              }]}>
                {activeTab === 'replies' ? 'Chưa có trả lời nào' :
                  activeTab === 'media' ? 'Chưa có ảnh nào' :
                    activeTab === 'videos' ? 'Chưa có video nào' :
                      activeTab === 'likes' ? 'Chưa có lượt thích nào' :
                        isMe ? 'Bạn chưa đăng bài viết nào' : 'Chưa có bài viết nào'}
              </Text>
              {isMe && activeTab === 'posts' && (
                <Text style={[dynamicStyles.emptyText, { 
                  color: colors.textSecondary || (isDarkMode ? '#B0B3B8' : '#65676B'),
                  fontSize: 14,
                  textAlign: 'center',
                  paddingHorizontal: 40,
                }]}>
                  Hãy bắt đầu chia sẻ những khoảnh khắc của bạn với mọi người
                </Text>
              )}
            </View>
          }
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            handleScroll(e);
            Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )(e);
          }}
          scrollEventThrottle={16}
        />
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

      {/* FAB để compose post (chỉ hiển thị khi là profile của mình) */}
      {isMe && (
        <TouchableOpacity
          style={dynamicStyles.fabContainer}
          onPress={handleCreatePost}
          activeOpacity={0.8}
          accessibilityLabel="Tạo bài viết mới"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={['#5A71FA', '#0085ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={dynamicStyles.fab}
          >
            <MaterialCommunityIcons name="pencil" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
      <ProfileMenu
        visible={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        isMe={isMe}
        profileUserId={!isMe ? targetUserId?.toString() : undefined}
        userName={!isMe ? (userProfile?.full_name || userProfile?.username) : undefined}
        isVerified={verificationInfo?.isVerified || false}
        isBlocked={!isMe ? (userProfile?.viewer?.blocking || userProfile?.viewer?.blockedBy) : false}
        isMuted={!isMe ? (userProfile?.viewer?.muted || false) : false}
        onBlockChange={() => {
          refetchProfile();
          refetchFollowing();
        }}
        onMuteChange={() => {
          refetchProfile();
        }}
        onReport={() => {
          if (!isMe && targetUserId) {
            // Đảm bảo ProfileMenu đóng trước
            setShowProfileMenu(false);
            // Đợi một chút để ProfileMenu đóng hoàn toàn
            setTimeout(() => {
              setShowReportModal(true);
            }, 400);
          }
        }}
        onVerificationRequest={() => {
          if (isMe) {
            setShowProfileMenu(false);
            setTimeout(() => {
              setShowVerificationRequestModal(true);
            }, 400);
          }
        }}
      />
      
      {!isMe && targetUserId && (
        <ReportUserModal
          visible={showReportModal && !showProfileMenu}
          onClose={() => setShowReportModal(false)}
          reportedUserId={targetUserId}
          reportedUserName={userProfile?.full_name || userProfile?.username}
        />
      )}

      {/* Verification Modal - hiển thị thông tin xác minh khi click vào badge */}
      <VerificationModal
        visible={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        isVerified={verificationInfo?.isVerified || false}
        verifiedBy={verificationInfo?.verifiedBy || null}
        verifiedAt={verificationInfo?.verifiedAt || null}
      />

      {/* Verification Request Modal - để user gửi yêu cầu xác minh */}
      {isMe && (
        <VerificationRequestModal
          visible={showVerificationRequestModal}
          onClose={() => setShowVerificationRequestModal(false)}
          onSuccess={() => {
            // Refetch verification status after successful submission
            queryClient.invalidateQueries({ queryKey: ['verification', targetUserId] });
            refetchProfile();
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default ProfileScreen;

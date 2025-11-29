import React, { useState, useRef, useCallback, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  ActivityIndicator,
  Modal,
  RefreshControl,
  InteractionManager,
  Platform,
  ViewToken,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Avatar, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { newsfeedAPI, friendsAPI, chatAPI, usersAPI } from '../../utils/api';
import { getInitials, getAvatarURL, getVideoURL } from '../../utils/imageUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { PWATheme } from '../../config/PWATheme';
import { useNavigation, useFocusEffect, useRoute, CommonActions } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useTabBar } from '../../contexts/TabBarContext';
import PostImagesCarousel from '../../components/NewsFeed/PostImagesCarousel';
import PostVideoPlayer from '../../components/NewsFeed/PostVideoPlayer';
import PostContent from '../../components/NewsFeed/PostContent';
import FullScreenImageViewer from '../../components/Common/FullScreenImageViewer';
import { Lightbox } from '../../components/Common/Lightbox';
import { VerifiedBadge } from '../../components/Common/VerifiedBadge';
import SplashScreen from '../../components/Splash/SplashScreen';
import ReactionPicker from '../../components/NewsFeed/ReactionPicker';
import StoriesSection from '../../components/NewsFeed/StoriesSection';
import FriendsSuggestions from '../../components/NewsFeed/FriendsSuggestions';
import { Image as RNImage, Linking } from 'react-native';
import { HomeHeader } from '../../components/NewsFeed/HomeHeader';
import { useSharedValue } from 'react-native-reanimated';
import { Button } from '../../components/UI';
import { spacing, typography, borderRadius, shadows, touchTargets, borderWidth } from '../../config/designTokens';
import { PostControls } from '../../components/PostControls/PostControls';

const createStyles = (colors: typeof PWATheme.light, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || (isDarkMode ? '#000000' : '#f8f9fa'), // Đồng màu với background
  },
  // iOS-style minimal header - giống social-app-main
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    paddingTop: Platform.OS === 'ios' ? spacing.md : spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.md,
    minHeight: Platform.OS === 'ios' ? touchTargets.lg : touchTargets.xl,
    // Không có border bottom - giống social-app-main noBottomBorder
  },
  headerLeft: {
    width: 34, // Giống social-app-main HEADER_SLOT_SIZE
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerLeftWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 100,
    zIndex: 10,
  },
  backButton: {
    width: Math.max(40, touchTargets.md),
    height: Math.max(40, touchTargets.md),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
    pointerEvents: 'box-none',
    minHeight: 34, // Giống social-app-main HEADER_SLOT_SIZE
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: typography.letterSpacing.tight,
  },
  logoImage: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.md,
  },
  logoText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0, // Không có gap giữa các buttons
    zIndex: 10,
    justifyContent: 'flex-end',
  },
  headerIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  messageIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadge: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    backgroundColor: '#FF3B30', // iOS red
    borderRadius: borderRadius.badge,
    paddingHorizontal: spacing.xs + 1,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...shadows.getShadow('md'),
  },
  messageBadgeText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background || (isDarkMode ? '#000000' : '#f8f9fa'),
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  refreshIndicatorText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  // Facebook style: Nội dung bắt đầu từ bên trái
  postContainer: {
    paddingTop: spacing.md,
    paddingRight: spacing.base,
    paddingBottom: spacing.sm,
    paddingLeft: 0,
    backgroundColor: colors.background || (isDarkMode ? '#000000' : '#f8f9fa'),
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
  },
  // Layout: row with avatar left, content right (Facebook style)
  postLayout: {
    flexDirection: 'row',
    gap: 10, // Giống social-app-main
    marginTop: 1, // Giống social-app-main
  },
  layoutAvi: {
    paddingLeft: 8, // Giống social-app-main
    paddingRight: 10, // Giống social-app-main
    position: 'relative',
    zIndex: 999, // Giống social-app-main
  },
  layoutContent: {
    flex: 1, // Giống social-app-main
    position: 'relative',
    zIndex: 0, // Giống social-app-main
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
    gap: 4,
  },
  authorHandle: {
    fontSize: 16,
    color: colors.textSecondary || (isDarkMode ? '#B0B3B8' : '#65676B'),
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  authorAvatar: {
    width: 42, // social-app-main uses 42
    height: 42,
    borderRadius: 21,
  },
  avatarContainer: {
    position: 'relative',
    width: 42,
    height: 42,
  },
  authorInfo: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  authorName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.tight,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  },
  postTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  postTime: {
    fontSize: typography.fontSize.base,
    marginLeft: 0,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    fontWeight: typography.fontWeight.regular,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12, // Adjusted for 42px avatar
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: '#34C759', // iOS green
    borderColor: colors.background || colors.surface || '#FFFFFF',
  },
  privacyIcon: {
    marginLeft: 4,
  },
  postMoreButton: {
    width: Math.max(36, touchTargets.sm),
    height: Math.max(36, touchTargets.sm),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    ...Platform.select({
      ios: {
        // Subtle press effect
      },
    }),
  },
  followButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: isDarkMode ? colors.background || '#000000' : colors.background || '#FFFFFF', // Đồng màu với background
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
    shadowColor: isDarkMode ? '#000' : 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  // Social-app-main style: Content in layoutContent - Facebook style
  postContentWrapper: {
    marginTop: 8, // Tăng spacing giống Facebook
    marginBottom: 4,
  },
  postContent: {
    fontSize: 16, // Facebook post text size
    lineHeight: 24, // Tăng line height cho dễ đọc hơn
    letterSpacing: -0.1, // Slightly tighter
    fontWeight: '400', // Regular weight for normal text
  },
  imagesContainer: {
    marginTop: 8, // Tăng spacing giống Facebook
    marginBottom: 4,
    borderRadius: 12, // Rounded corners for images
    overflow: 'hidden',
    width: '100%',
    backgroundColor: 'transparent', // Xóa nền để đồng bộ
    alignItems: 'center', // Căn giữa ảnh giống Facebook
  },
  videoContainer: {
    marginTop: 8, // Tăng spacing giống Facebook
    marginBottom: 4,
    width: '100%',
    overflow: 'hidden',
    minHeight: 200, // Đảm bảo video container luôn có chiều cao tối thiểu
    backgroundColor: 'transparent',
  },
  videoWrapper: {
    width: '100%',
    position: 'relative',
    backgroundColor: 'transparent', // Xóa nền để đồng bộ
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
    backgroundColor: 'transparent', // Xóa nền để đồng bộ
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    paddingBottom: 6,
    marginTop: 0,
  },
  // Social-app-main PostControlButton style
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // gap_xs (giống social-app-main)
    backgroundColor: 'transparent',
    padding: 5, // Giống social-app-main
    borderRadius: 20, // Giống social-app-main (shape="round")
  },
  actionText: {
    fontSize: 15, // iOS standard size
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  actionCount: {
    fontSize: 13,
    marginLeft: 0,
    lineHeight: 18,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  // iOS-style "Có gì mới?" section
  newPostSection: {
    marginTop: 0, // Sẽ được set động trong component
    marginBottom: 0,
    paddingHorizontal: 12,
    paddingTop: 12, // Padding top cho phần "Bạn đang nghĩ gì?"
    paddingBottom: 10,
    backgroundColor: isDarkMode ? colors.background || '#1a1a1a' : colors.background || '#f8f9fa', // Đồng màu với background chính
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
  },
  newPostContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // Tăng khoảng cách giữa avatar và input
  },
  newPostAvatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  newPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  newPostTextContainer: {
    flex: 1,
    backgroundColor: isDarkMode 
      ? (colors.border || 'rgba(255, 255, 255, 0.1)')
      : (colors.border || '#E4E6EB'),
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: touchTargets.md,
    justifyContent: 'center',
  },
  newPostPrompt: {
    fontSize: typography.fontSize.md,
    letterSpacing: typography.letterSpacing.tight,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  },
  newPostIconButton: {
    width: Math.max(36, touchTargets.sm),
    height: Math.max(36, touchTargets.sm),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  // Menu Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
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
  // Search Modal
  searchModalOverlay: {
    flex: 1,
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
  },
  searchModalContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInputContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchResultAvatar: {
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  searchResultEmail: {
    fontSize: 14,
  },
  searchResultActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  searchResultButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchResultButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  searchEmptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});

interface PostsListScreenProps {
  feedType?: 'discover' | 'following' | 'video';
}

export interface PostsListScreenRef {
  scrollToTop: () => void;
  refresh: () => void;
}

const PostsListScreen = forwardRef<PostsListScreenRef, PostsListScreenProps>((props, ref) => {
  const { feedType = 'discover' } = props;
  const { user } = useAuth();
  const { colors, isDarkMode } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { setIsVisible } = useTabBar();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const lastRefreshParam = useRef<number | null>(null);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const [activePostId, setActivePostId] = useState<string | number | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  
  // Helper function to count lines in text (like social-app-main)
  // This counts explicit newlines (\n), not wrapped lines
  const countLines = useCallback((text: string | undefined): number => {
    if (!text) return 0;
    // Count newlines - same as social-app-main: str.match(/\n/g)?.length ?? 0
    const matches = text.match(/\n/g);
    return matches ? matches.length : 0;
  }, []);
  
  // Helper function to get image dimensions
  const getImageDimensions = useCallback((imageUrl: string): Promise<{ width: number; height: number } | null> => {
    return new Promise((resolve) => {
      if (imageDimensions[imageUrl]) {
        resolve(imageDimensions[imageUrl]);
        return;
      }
      
      RNImage.getSize(
        imageUrl,
        (width, height) => {
          const dims = { width, height };
          setImageDimensions(prev => ({ ...prev, [imageUrl]: dims }));
          resolve(dims);
        },
        (error) => {
          console.log('Failed to get image dimensions:', error);
          resolve(null);
        }
      );
    });
  }, [imageDimensions]);
  // Use feedType prop if provided, otherwise use local state for standalone mode
  const [localActiveTab, setLocalActiveTab] = useState<'all' | 'following'>('all');
  const activeTab = feedType || localActiveTab;
  const setActiveTab = feedType ? undefined : setLocalActiveTab;
  const [showMenu, setShowMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [imageViewerPostData, setImageViewerPostData] = useState<any>(null);
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const flatListRef = useRef<FlatList>(null);
  const [headerHeight, setHeaderHeight] = useState(72); // Default header height
  const [followingHeaderHeight, setFollowingHeaderHeight] = useState(56); // Default following header height
  const [isChangingTab, setIsChangingTab] = useState(false); // Prevent multiple tab changes
  const [isHeaderVisible, setIsHeaderVisible] = useState(true); // Track header visibility
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerHeightShared = useSharedValue(72); // For HomeHeader
  
  // Track visible items để tự động pause video khi scroll ra khỏi view
  const [visiblePostIds, setVisiblePostIds] = useState<Set<string>>(new Set());
  // Track các post đã được view để tránh track nhiều lần
  const viewedPostIds = useRef<Set<string>>(new Set());
  
  // Callback để track các post đang visible
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const visibleIds = new Set<string>();
    viewableItems.forEach((item: ViewToken) => {
      if (item.item?.id) {
        visibleIds.add(String(item.item.id));
      }
    });
    setVisiblePostIds(visibleIds);
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Item phải visible ít nhất 50% mới được tính
    minimumViewTime: 100, // Phải visible ít nhất 100ms
  }).current;
  
  // Tự động pause video khi scroll ra khỏi view
  useEffect(() => {
    if (playingVideoId && !visiblePostIds.has(playingVideoId)) {
      // Video đang play nhưng không còn visible -> pause ngay
      setPlayingVideoId(null);
    }
  }, [visiblePostIds, playingVideoId]);

  // KHÔNG reset viewedPostIds khi posts thay đổi - mỗi user chỉ track 1 lần
  // Backend đã xử lý việc kiểm tra user đã xem chưa, nên không cần clear ở đây
  // Chỉ clear khi user logout hoặc app restart

  // Track post views khi post được hiển thị
  useEffect(() => {
    visiblePostIds.forEach((postId) => {
      // Chỉ track nếu chưa track trước đó
      if (!viewedPostIds.current.has(postId)) {
        viewedPostIds.current.add(postId);
        // Gọi API để track view
        newsfeedAPI.trackPostView(postId)
          .then((response) => {
            // Cập nhật views_count ngay lập tức từ response
            if (response?.data?.views_count !== undefined) {
              // Update optimistic trong cache
              queryClient.setQueryData(['posts', activeTab], (old: any) => {
                if (!old) return old;
                return old.map((post: any) => {
                  if (String(post.id) === String(postId) || 
                      String(post._id) === String(postId) || 
                      String(post.post_id) === String(postId)) {
                    return {
                      ...post,
                      views_count: response.data.views_count,
                    };
                  }
                  return post;
                });
              });
            }
            // Invalidate query để đảm bảo sync với server
            queryClient.invalidateQueries({ queryKey: ['posts', activeTab] });
          })
          .catch((error) => {
            // Nếu lỗi, remove khỏi viewed để có thể retry sau
            viewedPostIds.current.delete(postId);
            console.log('Failed to track post view:', error);
          });
      }
    });
  }, [visiblePostIds, activeTab, queryClient]);
  
  // Animation values cho hiệu ứng chuyển app (từ NewsFeed -> Chat)
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isNavigatingToChat, setIsNavigatingToChat] = useState(false);
  const [showSplashScreen, setShowSplashScreen] = useState(false);
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [reactionPickerPosition, setReactionPickerPosition] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset tab bar visibility when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Chỉ hiện bottom bar nếu không đang navigate sang Chat
      if (!isNavigatingToChat) {
        setIsVisible(true);
      }
      
      // Invalidate queries khi quay lại màn hình để đảm bảo data mới nhất
      // React Query sẽ tự động refetch nếu query đang active
      queryClient.invalidateQueries({ queryKey: ['posts', activeTab] });
      
      return () => {
        // Optional: cleanup when screen loses focus
      };
    }, [setIsVisible, isNavigatingToChat, queryClient, activeTab])
  );

  // Listen for navigation params to trigger refresh when Home tab is pressed (like Facebook)
  useEffect(() => {
    const params = route.params as any;
    if (params?.refresh && params.refresh !== lastRefreshParam.current) {
      lastRefreshParam.current = params.refresh;
      
      if (params.scrollToTop && flatListRef.current) {
        // First, scroll to a small negative offset to trigger pull-to-refresh indicator
        // Then scroll to top and show refresh
        flatListRef.current.scrollToOffset({ offset: -50, animated: false });
        
        // Immediately show refresh indicator
        setRefreshing(true);
        
        // Then scroll to top with animation
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          
          // Trigger the actual refresh
          setTimeout(() => {
            handleRefresh();
          }, 200);
        }, 50);
      } else {
        // If no scrollToTop, just refresh normally
        setRefreshing(true);
        setTimeout(() => {
          handleRefresh();
        }, 100);
      }
    }
  }, [route.params, handleRefresh]);

  // Fetch following list for filtering and checking follow status
  // Tối ưu: Cache 2 phút vì following list không thay đổi thường xuyên
  const { data: followingListData, isLoading: isLoadingFollowing, refetch: refetchFollowing } = useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      const res = await friendsAPI.getFollowing();
      // Handle both array response and object with data property
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    },
    staleTime: 2 * 60 * 1000, // 2 phút - following list không thay đổi thường xuyên
    gcTime: 10 * 60 * 1000, // 10 phút cache
  });

  // Ensure followingList is always an array
  const followingList = Array.isArray(followingListData) ? followingListData : [];

  // Create a Set of following IDs for quick lookup
  const followingIds = new Set(
    (Array.isArray(followingList) ? followingList : []).map((f: any) => f.following_id || f.id || f.user_id)
  );

  // Fetch conversations to get unread count
  // Socket will handle real-time updates, no polling needed
  // Tối ưu: Cache 1 phút, socket sẽ update real-time
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await chatAPI.getConversations();
      return Array.isArray(res.data) ? res.data : (res.data?.conversations || []);
    },
    staleTime: 60 * 1000, // 1 phút - socket sẽ update real-time nên không cần refetch liên tục
    gcTime: 10 * 60 * 1000, // 10 minutes cache for instant display
    refetchInterval: false, // No polling - use socket for real-time updates
  });

  // Fetch friend suggestions (chỉ hiển thị ở discover tab)
  // Lấy suggestions từ các users đã đăng bài trong feed + search users nếu cần
  const { data: friendSuggestions = [], refetch: refetchSuggestions } = useQuery({
    queryKey: ['friendSuggestions', (posts?.length || 0), followingIds.size, user?.id],
    queryFn: async () => {
      try {
        const allSuggestions: any[] = [];
        const currentUserId = user?.id ? String(user.id) : null;
        
        // 1. Ưu tiên lấy từ search API (có nhiều users hơn)
        try {
          const searchResponse = await usersAPI.searchUsers('');
          if (searchResponse.data && Array.isArray(searchResponse.data)) {
            console.log('🔍 Search API returned', searchResponse.data.length, 'users');
            
            const searchCandidates = searchResponse.data
              .filter((u: any) => {
                const uId = u.id || u.user_id;
                const uIdString = uId ? String(uId) : null;
                if (!uIdString || !currentUserId) return false;
                
                // Loại bỏ: chính user hiện tại, đã follow
                const isCurrentUser = uIdString === currentUserId;
                const isFollowing = followingIds.has(uId) || followingIds.has(uIdString);
                
                return !isCurrentUser && !isFollowing;
              })
              .map((u: any) => ({
                id: u.id || u.user_id,
                user_id: u.id || u.user_id,
                full_name: u.full_name || u.name || u.username,
                username: u.username || u.email,
                avatar_url: u.avatar_url || u.avatar,
              }));
            
            console.log('🔍 After filter:', {
              total: searchResponse.data.length,
              filtered: searchCandidates.length,
              followingCount: followingIds.size,
              currentUserId,
            });
            
            allSuggestions.push(...searchCandidates);
          }
        } catch (searchError) {
          console.error('🔍 Error fetching from search API:', searchError);
        }
        
        // 2. Bổ sung từ posts trong feed (nếu chưa có trong allSuggestions)
        if (posts && Array.isArray(posts) && posts.length > 0) {
          const usersFromPosts = new Map<string | number, any>();
          
          posts.forEach((post: any) => {
            const userId = post.user_id || post.user?.id;
            const userName = post.full_name || post.username;
            const userAvatar = post.avatar_url || post.user?.avatar_url;
            const postUserId = userId ? String(userId) : null;
            
            // Loại bỏ: chính user hiện tại, đã follow, hoặc đã có trong allSuggestions
            if (
              postUserId && 
              currentUserId && 
              postUserId !== currentUserId && 
              !followingIds.has(userId) &&
              !followingIds.has(postUserId) &&
              !allSuggestions.some((s: any) => String(s.id) === postUserId)
            ) {
              if (!usersFromPosts.has(userId) && !usersFromPosts.has(postUserId)) {
                usersFromPosts.set(userId, {
                  id: userId,
                  user_id: userId,
                  full_name: userName,
                  username: post.username || post.user?.username,
                  avatar_url: userAvatar,
                });
              }
            }
          });
          
          const postsSuggestions = Array.from(usersFromPosts.values());
          allSuggestions.push(...postsSuggestions);
          console.log('🔍 Added', postsSuggestions.length, 'suggestions from posts');
        }
        
        // Shuffle tất cả suggestions để mỗi lần load lại sẽ có thứ tự khác nhau
        const shuffled = allSuggestions.sort(() => Math.random() - 0.5);
        
        // Lấy tối đa 15 suggestions
        const suggestions = shuffled.slice(0, 15);
        
        console.log('🔍 Friend suggestions fetched:', {
          fromSearch: allSuggestions.length,
          total: suggestions.length,
          followingCount: followingIds.size,
          suggestions: suggestions.map((s: any) => ({ id: s.id, name: s.full_name || s.username })),
        });
        return suggestions;
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
      }
    },
    enabled: (activeTab === 'discover' || activeTab === 'all') && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 phút - suggestions không cần refresh quá thường xuyên
    gcTime: 10 * 60 * 1000, // 10 phút cache
  });

  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string | number>>(new Set());
  const visibleSuggestions = useMemo(() => {
    if (!friendSuggestions || !Array.isArray(friendSuggestions)) {
      console.log('🔍 Suggestions: friendSuggestions is empty or not array');
      return [];
    }
    
    // Chuyển đổi user.id sang string để so sánh chính xác
    const currentUserId = user?.id ? String(user.id) : null;
    
    const filtered = friendSuggestions.filter((s: any) => {
      const suggestionId = s.id || s.user_id;
      const suggestionIdString = suggestionId ? String(suggestionId) : null;
      
      // Loại bỏ: đã dismiss, chính user hiện tại, hoặc đã follow
      const isDismissed = dismissedSuggestions.has(suggestionId) || dismissedSuggestions.has(suggestionIdString);
      const isCurrentUser = currentUserId && suggestionIdString && suggestionIdString === currentUserId;
      const isFollowing = followingIds.has(suggestionId) || followingIds.has(suggestionIdString);
      
      return !isDismissed && !isCurrentUser && !isFollowing;
    });
    
    console.log('🔍 Suggestions filtered:', {
      total: friendSuggestions.length,
      visible: filtered.length,
      dismissed: dismissedSuggestions.size,
      currentUserId,
      filteredIds: filtered.map((s: any) => ({ id: s.id, name: s.full_name || s.username })),
    });
    return filtered;
  }, [friendSuggestions, dismissedSuggestions, activeTab, user?.id, followingIds]);

  // Calculate unread count from conversations
  const unreadCount = useMemo(() => {
    return conversations.reduce((total: number, conv: any) => {
      return total + (conv.unread_count || conv.unreadCount || 0);
    }, 0);
  }, [conversations]);

  // Debounce search query để tránh quá nhiều API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search users query với debounced query
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['searchUsers', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim()) return [];
      const res = await usersAPI.searchUsers(debouncedSearchQuery);
      return Array.isArray(res.data) ? res.data : (res.data?.users || res.data?.data || []);
    },
    enabled: debouncedSearchQuery.trim().length > 0,
    staleTime: 60000, // 1 minute - tăng cache time
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const {
    data: posts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['posts', activeTab],
    queryFn: async () => {
      // Pass type to API: 'discover' for all public posts, 'following' for following posts, 'video' for video posts
      let type: 'all' | 'following' | 'video';
      if (activeTab === 'following') {
        type = 'following';
      } else if (activeTab === 'video') {
        type = 'video';
      } else {
        type = 'all'; // 'discover' maps to 'all' in API
      }
      console.log('📱 Fetching posts with type:', type, 'activeTab:', activeTab);
      const res = await newsfeedAPI.getPosts(1, type);
      // Include all posts (including videos) in news feed
      const allPosts = Array.isArray(res.data) ? res.data : (res.data?.posts || []);
      console.log('📱 Received posts:', allPosts.length, 'posts');
      
      // Debug: Check for video posts in allPosts
      const videoPosts = allPosts.filter((p: any) => {
        return p.videoUrl || p.video_url || p.videos || p.video || (p.media_type === 'video' && p.media_url);
      });
      console.log('📱 Video posts found in response:', videoPosts.length, 'out of', allPosts.length);
      if (videoPosts.length > 0) {
        console.log('📱 Sample video post:', {
          id: videoPosts[0].id,
          videoUrl: videoPosts[0].videoUrl,
          video_url: videoPosts[0].video_url,
          videos: videoPosts[0].videos,
          video: videoPosts[0].video,
          media_type: videoPosts[0].media_type,
          media_url: videoPosts[0].media_url,
        });
      }
      
      if (allPosts.length > 0) {
        const userIds = [...new Set(allPosts.map((p: any) => p.user_id))];
        console.log('📱 Posts from', userIds.length, 'different users:', userIds);
        console.log('📱 Current user id:', user?.id);
        // Debug: Log views count for first post
        if (allPosts[0]) {
          console.log('📱 First post views data:', {
            views_count: allPosts[0].views_count,
            view_count: allPosts[0].view_count,
            views: allPosts[0].views,
            post_views: allPosts[0].post_views,
            fullItem: Object.keys(allPosts[0])
          });
        }
      }
      
      // Filter video posts if activeTab is 'video'
      if (activeTab === 'video') {
        const postsWithVideos = allPosts.filter((p: any) => {
          // Check multiple possible video fields
          const hasVideo = p.videoUrl || 
                          p.video_url || 
                          (Array.isArray(p.videos) && p.videos.length > 0) || 
                          p.video || 
                          (p.media_type === 'video' && p.media_url);
          return hasVideo;
        });
        console.log('📱 Video tab - Total posts:', allPosts.length, 'Video posts:', postsWithVideos.length);
        if (postsWithVideos.length > 0) {
          const samplePost = postsWithVideos[0];
          console.log('📱 Sample video post data:', {
            id: samplePost.id,
            videoUrl: samplePost.videoUrl,
            video_url: samplePost.video_url,
            videos: samplePost.videos,
            video: samplePost.video,
            media_type: samplePost.media_type,
            media_url: samplePost.media_url,
            // Thumbnail fields
            thumbnailUrl: samplePost.thumbnailUrl,
            thumbnail_url: samplePost.thumbnail_url,
            video_thumbnail: samplePost.video_thumbnail,
            images: samplePost.images,
            image_url: samplePost.image_url,
            imagesCount: samplePost.images ? samplePost.images.length : 0,
            allKeys: Object.keys(samplePost),
          });
        } else {
          console.log('⚠️ No video posts found. Sample post keys:', allPosts.length > 0 ? Object.keys(allPosts[0]) : 'No posts');
        }
        return postsWithVideos;
      }
      
      // For other tabs, return all posts
      return allPosts;
    },
    enabled: activeTab === 'discover' || activeTab === 'video' || (activeTab === 'following' && !isLoadingFollowing),
    staleTime: 30 * 1000, // 30 giây - posts cần refresh thường xuyên hơn nhưng không cần mỗi lần mount
    gcTime: 10 * 60 * 1000, // 10 phút - giữ cache lâu hơn để hiển thị nhanh
    refetchOnWindowFocus: false, // Don't refetch on focus
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Reset dismissed suggestions khi refresh để có suggestions mới
      setDismissedSuggestions(new Set());
      
      // Invalidate cache to force fresh data
      await queryClient.invalidateQueries({ queryKey: ['posts', activeTab] });
      await queryClient.invalidateQueries({ queryKey: ['following'] });
      await queryClient.invalidateQueries({ queryKey: ['friendSuggestions'] });
      
      // Always refresh following list to get latest follow status
      await refetchFollowing();
      
      // Refetch posts with current activeTab
      await refetch();
      
      // Refresh suggestions để có suggestions mới
      await refetchSuggestions();
      
      console.log('📱 Refresh completed for tab:', activeTab);
    } catch (error) {
      console.error('❌ Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, activeTab, refetchFollowing, refetch, refetchSuggestions]);

  // Handler để navigate đến Chat với hiệu ứng chuyển app (giống Messenger)
  const handleNavigateToChat = () => {
    // Đánh dấu đang navigate để useFocusEffect không set isVisible(true)
    setIsNavigatingToChat(true);
    // Ẩn bottom bar ngay lập tức khi bắt đầu navigate
    setIsVisible(false);
    
    // Bước 1: Fade out màn hình hiện tại
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Bước 2: Hiển thị splash screen (giống Messenger)
      setShowSplashScreen(true);
      splashOpacity.setValue(0);
      
      Animated.timing(splashOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Preload dữ liệu cho Chat trong thời gian splash screen
        Promise.all([
          // Prefetch conversations
          queryClient.prefetchQuery({
            queryKey: ['conversations'],
            queryFn: async () => {
              const response = await chatAPI.getConversations();
              return response.data || [];
            },
          }),
          // Prefetch following list (cho stories và online status)
          queryClient.prefetchQuery({
            queryKey: ['following'],
            queryFn: async () => {
              const res = await friendsAPI.getFollowing();
              return Array.isArray(res.data) ? res.data : (res.data?.data || []);
            },
          }),
        ]).catch((error) => {
          console.log('Preload data error (non-critical):', error);
        });
        
        // Bước 3: Giữ splash screen trong 1.2 giây (giống Messenger)
        setTimeout(() => {
          // Bước 4: Fade out splash screen và navigate
          Animated.timing(splashOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowSplashScreen(false);
            
            // Navigate đến Chat tab
            InteractionManager.runAfterInteractions(() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('Chat' as never);
              } else {
                navigation.dispatch(
                  CommonActions.navigate({
                    name: 'Chat',
                  })
                );
              }
            });
            
            // Reset animation và flag
            setTimeout(() => {
              fadeAnim.setValue(1);
              setIsNavigatingToChat(false);
            }, 100);
          });
        }, 1200); // Giữ splash screen 1.2 giây
      });
    });
  };

  const handleFollow = async (userId: string | number) => {
    try {
      await friendsAPI.follow(userId.toString());
      // Refresh following list to update UI
      await refetchFollowing();
      // Refresh suggestions để loại bỏ user đã follow và lấy suggestions mới
      // Delay một chút để following list được update trước
      setTimeout(() => {
        refetchSuggestions();
      }, 500);
      Toast.show({
        type: 'success',
        text1: 'Đã theo dõi',
      });
    } catch (error: any) {
      console.error('Error following user:', error);
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể theo dõi',
      });
    }
  };

  const handleDismissSuggestion = useCallback((userId: string | number) => {
    setDismissedSuggestions(prev => new Set([...prev, userId]));
    // Refresh suggestions sau khi dismiss để có suggestions mới thay thế
    setTimeout(() => {
      refetchSuggestions();
    }, 300);
  }, [refetchSuggestions]);

  const handlePressSuggestionUser = useCallback((userId: string | number) => {
    navigation.navigate('OtherUserProfile' as never, { userId: userId.toString() } as never);
  }, [navigation]);

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

  // Mutation for follow/unfollow in search results
  const followMutation = useMutation({
    mutationFn: (userId: string) => friendsAPI.follow(userId),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Đã theo dõi',
      });
      refetchFollowing();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể theo dõi',
      });
    },
  });

  // Mutation for like/unlike post
  const likePostMutation = useMutation({
    mutationFn: async ({ postId, reactionType = 'like' }: { postId: string | number; reactionType?: string }) => {
      // Server tự động toggle like/unlike dựa trên trạng thái hiện tại
      return await newsfeedAPI.likePost(postId.toString(), reactionType);
    },
    onMutate: async ({ postId, reactionType = 'like' }) => {
      // Optimistic update - cập nhật UI ngay lập tức
      await queryClient.cancelQueries({ queryKey: ['posts', activeTab] });
      
      const previousPosts = queryClient.getQueryData(['posts', activeTab]);
      
      queryClient.setQueryData(['posts', activeTab], (old: any) => {
        if (!old) return old;
        return old.map((post: any) => {
          if (post.id === postId || post._id === postId || post.post_id === postId) {
            const currentIsLiked = post.isLiked || false;
            const currentReactionType = post.reactionType || 'like';
            
            // Nếu đã like với cùng reaction type thì unlike, ngược lại thì like với reaction mới
            const willBeLiked = !currentIsLiked || currentReactionType !== reactionType;
            
            return {
              ...post,
              isLiked: willBeLiked,
              reactionType: willBeLiked ? reactionType : null,
              likes_count: willBeLiked
                ? (currentIsLiked && currentReactionType !== reactionType 
                    ? post.likes_count || 0 // Giữ nguyên nếu chỉ đổi reaction
                    : (post.likes_count || 0) + 1) // Tăng nếu chưa like
                : Math.max(0, (post.likes_count || 0) - 1), // Giảm nếu unlike
            };
          }
          return post;
        });
      });
      
      return { previousPosts };
    },
    onSuccess: (data: any, variables) => {
      // Invalidate query ngay lập tức để cập nhật reactions_breakdown và các thông tin khác từ server
      queryClient.invalidateQueries({ queryKey: ['posts', activeTab] });
      
      // Luôn invalidate notifications queries khi like thành công (bất kể liked true/false)
      // Vì khi like/unlike, có thể đã tạo hoặc xóa notification
      // Đặc biệt khi update reaction (từ like sang love), notification mới được tạo
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      console.log('✅ [Like Post] Invalidated notifications queries');
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', activeTab], context.previousPosts);
      }
      console.error('❌ Error liking post:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        variables,
      });
      Toast.show({
        type: 'error',
        text1: 'Không thể thực hiện thao tác',
        text2: error?.response?.data?.message || error?.message || 'Vui lòng thử lại',
      });
    },
    onSettled: () => {
      // Đã có onSuccess để invalidate ngay lập tức
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (userId: string) => friendsAPI.unfollow(userId),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Đã bỏ theo dõi',
      });
      refetchFollowing();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể bỏ theo dõi',
      });
    },
  });

  // Handlers cho reaction picker
  const handleLongPressStart = useCallback((postId: string | number, event: any) => {
    // Lấy vị trí của nút like từ event
    if (event?.nativeEvent) {
      const { pageX, pageY } = event.nativeEvent;
      setReactionPickerPosition({ 
        x: pageX, // Vị trí X của touch
        y: pageY  // Vị trí Y của touch
      });
    }
    
    // Hiển thị reaction picker sau 300ms
    longPressTimerRef.current = setTimeout(() => {
      setShowReactionPicker(String(postId));
    }, 300);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleReactionSelect = useCallback((postId: string | number, reactionType: string) => {
    setShowReactionPicker(null);
    likePostMutation.mutate({ postId, reactionType });
  }, [likePostMutation]);

  const handleQuickLike = useCallback((postId: string | number) => {
    // Nếu đã like, unlike. Nếu chưa like, like với reaction mặc định
    likePostMutation.mutate({ postId, reactionType: 'like' });
  }, [likePostMutation]);

  // Mutation for creating conversation
  const createConversationMutation = useMutation({
    mutationFn: (userId: string) => chatAPI.createConversation(userId),
    onSuccess: (response, userId) => {
      const conversationId = response.conversationId || response.data?.conversationId;
      if (!conversationId) {
        Toast.show({
          type: 'error',
          text1: 'Không thể tạo cuộc trò chuyện',
        });
        return;
      }
      
      // Find user info from search results
      const userInfo = searchResults.find((item: any) => (item.id || item.user_id)?.toString() === userId);
      const userName = userInfo?.full_name || userInfo?.username || 'Người dùng';
      const userAvatarUrl = userInfo?.avatar_url;
      
      // Navigate to ChatDetail
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Chat',
          params: {
            screen: 'ChatDetail',
            params: {
              conversationId: String(conversationId),
              userName: userName,
              userAvatarUrl: userAvatarUrl,
              otherUserId: userId,
              isOnline: false,
            },
          },
        })
      );
      
      // Close search modal
      setShowSearchModal(false);
      setSearchQuery('');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Không thể tạo cuộc trò chuyện',
      });
    },
  });

  const handleVideoPress = (postId: string, videoUrl: string) => {
    // If this video is already playing, pause it
    if (playingVideoId === postId) {
      setPlayingVideoId(null);
      return;
    }
    
    // Set the new playing video ID - PostVideoPlayer will handle playing via isPlaying prop
    setPlayingVideoId(postId);
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

  // Xử lý scroll - ẩn/hiện header và tab bar khi cuộn
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = Math.max(0, event.nativeEvent.contentOffset.y);
    const scrollDifference = currentScrollY - lastScrollY.current;
    
    // Xử lý ẩn/hiện header và tab bar khi cuộn
    if (Math.abs(scrollDifference) > 10) {
      if (scrollDifference > 0 && currentScrollY > 100) {
        // Cuộn xuống - ẩn header và tab bar
        if (isHeaderVisible) {
          setIsHeaderVisible(false);
          setIsVisible(false);
          Animated.parallel([
            Animated.timing(headerOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(headerTranslateY, {
              toValue: -headerHeight,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      } else if (scrollDifference < 0) {
        // Cuộn lên - hiện header và tab bar
        if (!isHeaderVisible) {
          setIsHeaderVisible(true);
          setIsVisible(true);
          Animated.parallel([
            Animated.timing(headerOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(headerTranslateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    }
    
    lastScrollY.current = currentScrollY;
    scrollY.current = currentScrollY;
  };


  const dynamicStyles = createStyles(colors, isDarkMode);

  // PostVideoPlayer tự quản lý playback dựa trên isPlaying prop
  // Không cần useEffect này nữa vì PostVideoPlayer đã xử lý

  // Tạo data array với suggestions chèn vào giữa (sau 2-3 posts đầu tiên)
  // Note: Video tab không hiển thị suggestions, chỉ hiển thị video posts trong grid
  const postsWithSuggestions = useMemo(() => {
    // Kiểm tra posts có tồn tại và là array
    if (!posts || !Array.isArray(posts)) {
      console.log('🔍 postsWithSuggestions: posts is empty or not array');
      return [];
    }

    console.log('🔍 postsWithSuggestions check:', {
      activeTab,
      visibleSuggestionsLength: visibleSuggestions?.length || 0,
      postsLength: posts.length,
    });

    // Video tab: không hiển thị suggestions, chỉ trả về posts
    if (activeTab === 'video') {
      return posts;
    }

    // Hiển thị suggestions cho cả 'discover' và 'all' (nếu activeTab là 'all' thì cũng là discover tab)
    const isDiscoverTab = activeTab === 'discover' || activeTab === 'all';
    
    if (!isDiscoverTab || !visibleSuggestions || visibleSuggestions.length === 0) {
      console.log('🔍 postsWithSuggestions: Not inserting suggestions (conditions not met)', {
        isDiscoverTab,
        hasVisibleSuggestions: !!visibleSuggestions,
        visibleSuggestionsLength: visibleSuggestions?.length || 0,
      });
      return posts;
    }
    
    const suggestionsInsertIndex = Math.min(2, posts.length); // Chèn sau 2 posts đầu tiên
    const result = [...posts];
    
    // Chèn suggestions vào vị trí cụ thể
    result.splice(suggestionsInsertIndex, 0, {
      id: 'suggestions',
      type: 'suggestions',
      suggestions: visibleSuggestions,
    });
    
    console.log('🔍 postsWithSuggestions: Inserted suggestions at index', suggestionsInsertIndex, 'Total items:', result.length);
    return result;
  }, [posts, visibleSuggestions, activeTab]);

  // Callback để scroll đến post khi thu gọn
  const handlePostCollapse = useCallback((postId: string | number) => {
    if (!flatListRef.current || !posts || posts.length === 0) return;
    
    // Tìm index của post trong danh sách
    const postIndex = posts.findIndex((p: any) => 
      String(p.id || p._id || p.post_id || p.postId) === String(postId)
    );
    
    if (postIndex >= 0) {
      // Delay một chút để đảm bảo layout đã cập nhật
      setTimeout(() => {
        try {
          // Scroll đến post với offset để đảm bảo post hiển thị đầy đủ
          flatListRef.current?.scrollToIndex({
            index: postIndex,
            animated: true,
            viewPosition: 0.1, // Scroll để post ở khoảng 10% từ top
          });
        } catch (error) {
          // Fallback: scroll đến offset nếu scrollToIndex thất bại
          console.log('Scroll to index failed, using offset instead:', error);
        }
      }, 150);
    }
  }, [posts]);

  // Render video post card for grid layout (video tab)
  const renderVideoPostCard = useCallback(({ item, index }: { item: any, index: number }) => {
    // Import VideoPostCard dynamically
    const VideoPostCard = require('../../components/NewsFeed/VideoPostCard').VideoPostCard;
    
    return (
      <VideoPostCard
        post={item}
        onPress={() => {
          // Navigate to video feed or play video
          const postId = item.id || item._id || item.post_id || item.postId;
          if (postId) {
            navigation.navigate('VideoFeed' as never, {
              initialPostId: postId,
            } as never);
          }
        }}
      />
    );
  }, [navigation]);

  // Memoize renderPost để tránh re-render không cần thiết
  const renderPost = useCallback(({ item, index }: { item: any, index: number }) => {
    // Kiểm tra nếu item là suggestions thì render component FriendsSuggestions
    if (item.type === 'suggestions' && item.suggestions) {
      console.log('🔍 Rendering FriendsSuggestions with', item.suggestions.length, 'suggestions');
      return (
        <FriendsSuggestions
          suggestions={item.suggestions}
          onFollow={handleFollow}
          onDismiss={handleDismissSuggestion}
          onPressUser={handlePressSuggestionUser}
        />
      );
    }

    // For video tab, use grid layout - render as video card
    if (activeTab === 'video') {
      return renderVideoPostCard({ item, index });
    }

    // Get author info - API returns user fields directly on post object
    const authorName = item.full_name || item.username || 'Unknown';
    const authorAvatar = item.avatar_url || '';
    const authorId = item.user_id || item.user?.id;
    // Check if author is verified - API returns is_verified directly on item (MySQL returns 1/0, convert to boolean)
    // Debug: Log all verification-related fields for ALL posts
    if (__DEV__) {
      console.log('🔍 [Post Debug]', {
        postId: item.id,
        authorName: item.full_name || item.username,
        authorId,
        'item.is_verified': item.is_verified,
        'item.user?.is_verified': item.user?.is_verified,
        'typeof item.is_verified': typeof item.is_verified,
        'Boolean(item.is_verified)': Boolean(item.is_verified),
      });
    }
    const isAuthorVerified = Boolean(item.is_verified || item.user?.is_verified);
    
    // Debug log for verified users (only in development)
    if (__DEV__ && isAuthorVerified) {
      console.log('✅ [Verified Badge] Should show for:', {
        postId: item.id,
        authorName,
        authorId,
        is_verified: item.is_verified,
        user_is_verified: item.user?.is_verified,
        isAuthorVerified,
      });
    }
    
    const postTime = item.created_at ? formatTimeAgo(new Date(item.created_at)) : '';
    
    // Get online status - check multiple sources
    const authorIdString = authorId?.toString();
    let isAuthorOnline = false;
    if (authorIdString) {
      // Check from following list first (most reliable)
      const followingUser = (Array.isArray(followingList) ? followingList : []).find((f: any) => {
        const fId = f.following_id || f.id || f.user_id;
        return String(fId) === authorIdString;
      });
      if (followingUser?.status === 'online') {
        isAuthorOnline = true;
      } else if (item.status === 'online' || item.user?.status === 'online') {
        isAuthorOnline = true;
      }
    }
    
    // Get privacy setting - default to 'public' if not specified
    const privacy = item.privacy || item.visibility || 'public';

    // Check if user is following this author
    const isFollowing = authorId && followingIds.has(authorId);
    const isOwnPost = authorId === user?.id;
    const showFollowButton = !isOwnPost && !isFollowing && (activeTab === 'discover' || activeTab === 'video');
    
    // Get privacy icon based on privacy setting
    const getPrivacyIcon = () => {
      switch (privacy) {
        case 'friends':
          return 'account-multiple-outline';
        case 'private':
          return 'lock-outline';
        case 'public':
        default:
          return 'earth';
      }
    };

    // Format images - show 2 side by side if available
    // Check for image_url (single image) or images (array)
    // IMPORTANT: Exclude images if this post has a video (videos should not show images)
    const postImages = [];
    let hasVideo = false;
    
    // First, check for video - if video exists, don't show images
    // Get video URL - check for videoUrl, video_url, or videos field
    let postVideoUrl: string | undefined = undefined;
    let rawVideoPath: string | undefined = undefined;
    
    // Check multiple possible field names for video
    if (item.videoUrl && item.videoUrl.trim() !== '') {
      rawVideoPath = item.videoUrl;
      postVideoUrl = getVideoURL(item.videoUrl);
      hasVideo = !!(postVideoUrl && postVideoUrl.trim() !== '');
    } else if (item.video_url && item.video_url.trim() !== '') {
      rawVideoPath = item.video_url;
      postVideoUrl = getVideoURL(item.video_url);
      hasVideo = !!(postVideoUrl && postVideoUrl.trim() !== '');
    } else if (item.videos) {
      const videos = Array.isArray(item.videos) ? item.videos : [item.videos];
      if (videos.length > 0 && videos[0] && videos[0].trim() !== '') {
        rawVideoPath = videos[0];
        postVideoUrl = getVideoURL(videos[0]);
        hasVideo = !!(postVideoUrl && postVideoUrl.trim() !== '');
      }
    } else if (item.video && item.video.trim() !== '') {
      rawVideoPath = item.video;
      postVideoUrl = getVideoURL(item.video);
      hasVideo = !!(postVideoUrl && postVideoUrl.trim() !== '');
    } else if (item.media_type === 'video' && item.media_url && item.media_url.trim() !== '') {
      rawVideoPath = item.media_url;
      postVideoUrl = getVideoURL(item.media_url);
      hasVideo = !!(postVideoUrl && postVideoUrl.trim() !== '');
    }
    
    // Debug: Log video detection with more details
    if (postVideoUrl && postVideoUrl.trim() !== '') {
      console.log('🎥 [DISCOVER TAB] Video detected for post:', item.id, 'URL:', postVideoUrl, 'activeTab:', activeTab);
      console.log('🎥 [DISCOVER TAB] Video fields:', {
        rawVideoPath,
        processedUrl: postVideoUrl,
        videoUrl: item.videoUrl,
        video_url: item.video_url,
        videos: item.videos,
        video: item.video,
        media_type: item.media_type,
        media_url: item.media_url,
        activeTab,
      });
    } else {
      // Debug: Log when video is NOT detected to help troubleshoot
      if (item.videoUrl || item.video_url || item.videos || item.video || item.media_type === 'video') {
        console.log('⚠️ [DISCOVER TAB] Video field exists but URL is empty or invalid for post:', item.id, {
          rawVideoPath,
          processedUrl: postVideoUrl,
          videoUrl: item.videoUrl,
          video_url: item.video_url,
          videos: item.videos,
          video: item.video,
          media_type: item.media_type,
          media_url: item.media_url,
          hasVideo,
          activeTab,
        });
      }
    }
    
    // Only add images if there's no video
    if (!hasVideo) {
      if (item.images && Array.isArray(item.images)) {
        postImages.push(...item.images);
      } else if (item.image_url) {
        postImages.push(item.image_url);
      }
    }
    
    // Get video thumbnail
    const videoThumbnail = item.thumbnailUrl || 
                          item.thumbnail_url ||
                          item.video_thumbnail ||
                          (item.images && Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : undefined) || 
                          item.image_url || 
                          undefined;
    
    // Get video aspect ratio if available
    const videoAspectRatio = item.video_aspect_ratio || 
                            item.aspect_ratio || 
                            (item.video_width && item.video_height ? item.video_width / item.video_height : undefined) ||
                            undefined;
    
    return (
      <View style={dynamicStyles.postContainer}>
        {/* Social-app-main style: row layout with avatar left, content right */}
        <View style={dynamicStyles.postLayout}>
          <View style={dynamicStyles.layoutAvi}>
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
                  size={42}
                  label={getInitials(authorName)}
                  style={dynamicStyles.authorAvatar}
                />
              )}
              {/* Online status indicator - chấm xanh */}
              {isAuthorOnline && (
                <View style={[
                  dynamicStyles.onlineIndicator,
                  { borderColor: colors.background || colors.surface }
                ]} />
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
                  <MaterialCommunityIcons name="plus" size={10} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
          <View style={dynamicStyles.layoutContent}>
            {/* Post Meta: Author name, handle, time (giống social-app-main) */}
            <View style={[dynamicStyles.postMeta, { 
              flexDirection: 'row',
              alignItems: 'center',
              paddingBottom: 4, // Giống social-app-main (pb_xs)
              gap: 4, // Giống social-app-main (gap_xs)
            }]}>
              <TouchableOpacity
                style={[dynamicStyles.authorSection, { flexDirection: 'row', alignItems: 'center', flexShrink: 1 }]}
                onPress={() => {
                  if (authorId && authorId !== user?.id) {
                    navigation.navigate('OtherUserProfile' as never, { userId: authorId.toString() } as never);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[dynamicStyles.authorName, { color: colors.text, maxWidth: '70%' }]} numberOfLines={1}>
                  {authorName}
                </Text>
                {/* Verified badge - hiển thị ngay sau tên */}
                {isAuthorVerified && (
                  <VerifiedBadge size={16} />
                )}
                <Text style={[dynamicStyles.authorHandle, { 
                  color: colors.textSecondary || (isDarkMode ? '#B0B3B8' : '#65676B'),
                  fontSize: 16,
                  marginLeft: 4,
                  flexShrink: 10,
                }]} numberOfLines={1}>
                  {' @' + (item.username || item.handle || 'user')}
                </Text>
                {postTime && (
                  <Text style={[dynamicStyles.postTime, { 
                    color: colors.textSecondary || (isDarkMode ? '#B0B3B8' : '#65676B'),
                    fontSize: 16,
                    marginLeft: 4,
                  }]}>
                    · {postTime}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Post Content - Social-app-main style */}
            {item.content && <PostContent 
              content={item.content}
              postId={item.id || item._id || item.post_id || item.postId}
              onCollapse={handlePostCollapse}
            />}

            {/* Post Video - Render BEFORE images */}
            {postVideoUrl && postVideoUrl.trim() !== '' ? (
              <View 
                style={[
                  dynamicStyles.videoContainer,
                  { 
                    backgroundColor: '#000000', // Debug: Black background to see container
                    minHeight: 200, // Ensure minimum height
                  }
                ]}
                onLayout={(event) => {
                  const { width, height } = event.nativeEvent.layout;
                  console.log('📐 Video container layout:', { postId: item.id, width, height });
                }}
              >
                {(() => {
                  // Debug: Log before rendering video
                  const postIdString = String(item.id || item._id || item.post_id || item.postId || 'unknown');
                  console.log('🎬 [RENDER] Rendering PostVideoPlayer for post:', item.id, {
                    postVideoUrl: postVideoUrl.substring(0, 50) + '...',
                    videoThumbnail: videoThumbnail ? 'exists' : 'none',
                    videoAspectRatio,
                    postId: postIdString,
                    isPlaying: playingVideoId === postIdString,
                    hasVideo,
                    activeTab,
                  });
                  return (
                    <PostVideoPlayer
                      videoUrl={postVideoUrl}
                      thumbnailUrl={videoThumbnail}
                      postId={postIdString}
                      isPlaying={playingVideoId === postIdString}
                      onPress={() => {
                        const postId = String(item.id || item._id || item.post_id || item.postId);
                        if (postId && postVideoUrl) {
                          console.log('🎬 Video pressed for post:', postId);
                          handleVideoPress(postId, postVideoUrl);
                        }
                      }}
                      aspectRatio={videoAspectRatio}
                      onPlaybackStatusUpdate={(status) => {
                        if (status.isLoaded) {
                          if (status.didJustFinish) {
                            setPlayingVideoId(null);
                          } else if (!status.isLoaded && 'error' in status) {
                            const errorStatus = status as any;
                            if (errorStatus.error) {
                              console.error('Video playback error:', errorStatus.error);
                              setPlayingVideoId(null);
                            }
                          }
                        }
                      }}
                    />
                  );
                })()}
              </View>
            ) : hasVideo ? (
              // Debug: Log when video should render but URL is invalid
              (() => {
                console.warn('⚠️ Video detected but URL is invalid for post:', item.id, {
                  postVideoUrl,
                  hasVideo,
                  videoFields: {
                    videoUrl: item.videoUrl,
                    video_url: item.video_url,
                    videos: item.videos,
                    video: item.video,
                    media_type: item.media_type,
                    media_url: item.media_url,
                  },
                });
                return null;
              })()
            ) : null}

            {/* Post Images */}
            {postImages.length > 0 && (
              <View style={dynamicStyles.imagesContainer}>
                <PostImagesCarousel
                  images={postImages}
                  onPressImage={(idx) => {
                    // Open full screen image viewer với đầy đủ thông tin bài viết
                    setImageViewerImages(postImages);
                    setImageViewerIndex(idx);
                    setImageViewerPostData({
                      id: item.id,
                      likes: item.likes_count || 0,
                      comments: item.comments_count || 0,
                      isLiked: item.isLiked || false,
                      // Thông tin bài viết
                      authorName: authorName,
                      authorAvatar: authorAvatar,
                      authorId: authorId,
                      content: item.content,
                      postTime: postTime,
                      privacy: privacy,
                      isAuthorOnline: isAuthorOnline,
                      onLike: () => {
                        const postId = item.id || item._id || item.post_id || item.postId;
                        if (postId) {
                          likePostMutation.mutate({ postId });
                        }
                      },
                      onComment: () => {
                        // Navigate to comments screen
                        const pid = item?.id || item?._id || item?.post_id || item?.postId || null;
                        if (pid) {
                          navigation.navigate('Comments' as never, {
                            postId: pid,
                            postData: item,
                          } as never);
                        }
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


            {/* Post Controls (giống social-app-main) */}
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
                    navigation.navigate('Comments' as never, {
                      postId: pid,
                      postData: item,
                    } as never);
                  }
                }}
                onPressRepost={() => {
                  // Handle repost
                  console.log('Repost post:', item.id);
                }}
                onPressShare={() => {
                  // Handle share
                  console.log('Share post:', item.id);
                }}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }, [
    user,
    followingList,
    followingIds,
    activeTab,
    navigation,
    handleFollow,
    handleDismissSuggestion,
    handlePressSuggestionUser,
    colors,
    isDarkMode,
    handleQuickLike,
    likePostMutation,
    handleReactionSelect,
    setShowImageViewer,
    setImageViewerImages,
    setImageViewerIndex,
    setImageViewerPostData,
    dynamicStyles,
    playingVideoId,
    handleVideoPress,
    setPlayingVideoId,
    handlePostCollapse,
    renderVideoPostCard,
  ]);

  // Handle logo press - scroll to top
  const handleLogoPress = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  // Expose methods via ref (for HomeScreen to call when tab is pressed)
  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      if (flatListRef.current) {
        // Scroll to a small negative offset first to trigger pull-to-refresh indicator
        flatListRef.current.scrollToOffset({ offset: -50, animated: false });
        // Immediately show refresh indicator
        setRefreshing(true);
        // Then scroll to top with animation
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          // Trigger refresh after scroll animation
          setTimeout(() => {
            handleRefresh();
          }, 200);
        }, 50);
      }
    },
    refresh: async () => {
      // Show refresh indicator
      setRefreshing(true);
      // Trigger refresh
      setTimeout(() => {
        handleRefresh();
      }, 100);
    },
  }), [handleRefresh]);

  // Handle menu press
  const handleMenuPress = useCallback(() => {
    if (activeTab === 'following') {
      if (setActiveTab) setActiveTab('all');
    } else {
      setShowMenu(true);
    }
  }, [activeTab, setActiveTab]);

  // Handle search press
  const handleSearchPress = useCallback(() => {
    setShowSearchModal(true);
  }, []);

  // Debug: Log active tab
  React.useEffect(() => {
    console.log('PostsListScreen - activeTab:', activeTab);
  }, [activeTab]);

  return (
    <View style={dynamicStyles.container}>
        {/* Fixed Header - Social-app-main style */}
        {/* Only show header when used standalone (no feedType prop) */}
        {!feedType && (
          <>
            {(activeTab === 'discover' || activeTab === 'video') ? (
              <HomeHeader
                onMenuPress={handleMenuPress}
                onLogoPress={handleLogoPress}
                onSearchPress={handleSearchPress}
                unreadCount={unreadCount}
                headerHeight={headerHeightShared}
                onHeaderHeightChange={(height) => {
                  setHeaderHeight(height);
                  headerHeightShared.value = height;
                }}
              />
            ) : (
          <View 
            style={[dynamicStyles.headerBar, { 
              paddingTop: insets.top, 
              position: 'absolute', 
              top: 48, // Thêm 48px để hiển thị dưới tabs
              left: 0, 
              right: 0, 
              zIndex: 1000,
              elevation: Platform.OS === 'android' ? 4 : 0,
              backgroundColor: isDarkMode ? colors.background || '#000000' : colors.surface || '#FFFFFF' 
            }]}
            onLayout={(e) => {
              const height = e.nativeEvent.layout.height;
              setFollowingHeaderHeight(height);
            }}
          >
          <TouchableOpacity 
            style={dynamicStyles.headerLeftWithText}
            onPress={() => setActiveTab && setActiveTab('all')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            <Text style={[dynamicStyles.backButtonText, { color: colors.text }]}>Quay lại</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Đang theo dõi</Text>
          </View>
          <View style={dynamicStyles.headerRight} />
              </View>
            )}
          </>
        )}
        
        <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <Animated.View
          style={[
              { flex: 1, backgroundColor: colors.background || (isDarkMode ? '#000000' : '#f8f9fa') },
            {
              opacity: fadeAnim,
            }
          ]}
        >
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
          <Button
            title="Thử lại"
            onPress={() => refetch()}
            variant="primary"
            style={{ marginTop: 16 }}
          />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={postsWithSuggestions}
          keyExtractor={(item) => {
            if (item.type === 'suggestions') {
              return 'suggestions';
            }
            return item.id?.toString() || Math.random().toString();
          }}
          renderItem={renderPost}
          numColumns={activeTab === 'video' ? 2 : 1}
          columnWrapperStyle={activeTab === 'video' ? { paddingHorizontal: 8, gap: 8 } : undefined}
          ItemSeparatorComponent={() => null}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: colors.background || (isDarkMode ? '#000000' : '#f8f9fa') }}
          {...(Platform.OS === 'ios' && {
            contentInsetAdjustmentBehavior: 'automatic',
          })}
          nestedScrollEnabled={true}
          scrollEnabled={true}
          // Performance optimizations - tối ưu để giảm delay và tăng smooth scrolling
          removeClippedSubviews={Platform.OS === 'android'} // Better on Android, can cause issues on iOS
          maxToRenderPerBatch={8} // Reduced for faster initial render
          updateCellsBatchingPeriod={100} // Increased to reduce render frequency
          initialNumToRender={8} // Reduced for faster initial load
          windowSize={5} // Reduced window size for better memory management
          getItemLayout={undefined} // Can't use with dynamic heights
          maintainVisibleContentPosition={null} // Disable to improve performance
          legacyImplementation={false} // Use new implementation
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              {...(Platform.OS === 'ios' 
                ? {
                    tintColor: colors.primary || '#0084ff',
                    titleColor: colors.text || '#000000',
                    progressViewOffset: 
                      (activeTab === 'discover' || activeTab === 'video')
                        ? Math.max(insets.top + headerHeight - 10, 0) // iOS: Tính header height, trừ 10px để icon hiển thị rõ hơn
                        : activeTab === 'following'
                        ? Math.max(insets.top + followingHeaderHeight + 48 - 10, 0) // iOS: Following tab, trừ 10px
                        : 0
                  }
                : {
                    colors: [colors.primary || '#0084ff'],
                    progressBackgroundColor: colors.surface || '#FFFFFF',
                    progressViewOffset: 
                      (activeTab === 'discover' || activeTab === 'video')
                        ? Math.max(insets.top + headerHeight - 5, 0) // Android: Tính header height, trừ 5px để icon hiển thị rõ hơn
                        : activeTab === 'following'
                        ? Math.max(insets.top + followingHeaderHeight + 48 - 5, 0) // Android: Following tab, trừ 5px
                        : 0
                  }
              )}
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={(info) => {
            // Xử lý khi scroll to index thất bại
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({ 
                index: info.index, 
                animated: true,
                viewPosition: 0.1 
              });
            });
          }}
          contentContainerStyle={[
            dynamicStyles.listContent,
            { 
              paddingTop: activeTab === 'following' 
                ? Math.max(followingHeaderHeight + 48, 0) // Following: header + tabs height
                : 0 // Discover/Video: ListHeaderComponent sẽ tự xử lý spacing
            }
          ]}
          ListHeaderComponent={
            <View style={{ marginTop: 0, paddingTop: 0, marginBottom: 0 }}>
              {/* Chỉ hiển thị newPostSection và StoriesSection cho discover tab, không hiển thị cho video tab */}
              {activeTab === 'discover' ? (
                <>
                <TouchableOpacity
                  style={[
                    dynamicStyles.newPostSection,
                    {
                      marginTop: Math.max(headerHeight + 48, 0), // Thêm marginTop để hiển thị dưới header + tabs (header ~72px + tabs ~48px)
                    }
                  ]}
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
                          size={40}
                          label={getInitials(user?.full_name || user?.username || 'U')}
                          style={dynamicStyles.newPostAvatar}
                        />
                      )}
                    </View>
                    <View style={[dynamicStyles.newPostTextContainer, { backgroundColor: colors.border || '#E4E6EB' }]}>
                      <Text style={[dynamicStyles.newPostPrompt, { color: colors.textSecondary }]}>
                        Bạn đang nghĩ gì?
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={dynamicStyles.newPostIconButton}
                      onPress={() => navigation.navigate('CreatePost' as never)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons 
                        name="image-multiple-outline" 
                        size={24} 
                        color={colors.primary || '#1877F2'} 
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                <StoriesSection
                  stories={[]} // TODO: Load stories from API
                  onPressStory={(story) => {
                    // TODO: Navigate to story viewer
                    console.log('Press story:', story);
                  }}
                  onCreateStory={() => {
                    console.log('Navigating to CreateStory');
                    try {
                      navigation.navigate('CreateStory' as never);
                    } catch (error) {
                      console.error('Navigation error:', error);
                    }
                  }}
                />
                </>
              ) : activeTab === 'video' ? (
                // Video tab: chỉ có spacing để content không bị che bởi header
                <View style={{ marginTop: Math.max(headerHeight + 48, 0), height: 0 }} />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <View style={dynamicStyles.emptyContainer}>
              <MaterialCommunityIcons 
                name={activeTab === 'video' ? 'video-outline' : 'newspaper-variant-outline'} 
                size={48} 
                color={colors.textSecondary} 
              />
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary, marginTop: 16 }]}>
                {activeTab === 'video' 
                  ? 'Chưa có video nào' 
                  : activeTab === 'following'
                  ? 'Chưa có bài viết từ người bạn đang theo dõi'
                  : 'Chưa có bài viết nào'}
              </Text>
              <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary, marginTop: 8, fontSize: 13 }]}>
                {activeTab === 'video' 
                  ? 'Video sẽ xuất hiện ở đây khi có người đăng video'
                  : 'Kéo xuống để làm mới'}
              </Text>
            </View>
          }
        />
      )}

      {/* Menu Modal - Chỉ hiển thị khi dùng standalone (không có feedType prop) */}
      {!feedType && (
        <Modal
          visible={showMenu}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMenu(false)}
          statusBarTranslucent={true}
        >
          <Pressable
            style={dynamicStyles.modalOverlay}
            onPress={() => setShowMenu(false)}
          >
            <Pressable 
              style={[dynamicStyles.menuContainer, { backgroundColor: colors.surface }]}
              onPress={() => {}} // Prevent closing when pressing on menu content
            >
              <View style={[dynamicStyles.menuHandle, { backgroundColor: colors.border }]} />
              <View style={dynamicStyles.menuContent}>
                <TouchableOpacity
                  style={[
                    dynamicStyles.menuItem,
                    activeTab === 'discover' && { backgroundColor: colors.primary + '20' },
                    { borderBottomColor: colors.border },
                    isChangingTab && { opacity: 0.6 }
                  ]}
                  onPress={() => {
                    if (isChangingTab) return;
                    if (activeTab === 'discover') {
                      setShowMenu(false);
                      return;
                    }
                    setIsChangingTab(true);
                    if (setActiveTab) setActiveTab('discover');
                    setShowMenu(false);
                    // Reset flag after a short delay
                    setTimeout(() => {
                      setIsChangingTab(false);
                    }, 300);
                  }}
                  activeOpacity={0.7}
                  disabled={isChangingTab}
                >
                  <Text style={[dynamicStyles.menuItemText, { 
                    color: activeTab === 'discover' ? colors.primary : colors.text,
                    fontWeight: activeTab === 'discover' ? '600' : '400'
                  }]}>
                    Dành cho bạn
                  </Text>
                  {activeTab === 'discover' && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    dynamicStyles.menuItem,
                    activeTab === 'following' && { backgroundColor: colors.primary + '20' },
                    { borderBottomColor: colors.border },
                    isChangingTab && { opacity: 0.6 }
                  ]}
                  onPress={() => {
                    if (isChangingTab) return;
                    if (activeTab === 'following') {
                      setShowMenu(false);
                      return;
                    }
                    setIsChangingTab(true);
                    if (setActiveTab) setActiveTab('following');
                    setShowMenu(false);
                    // Reset flag after a short delay
                    setTimeout(() => {
                      setIsChangingTab(false);
                    }, 300);
                  }}
                  activeOpacity={0.7}
                  disabled={isChangingTab}
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
                <TouchableOpacity
                  style={[
                    dynamicStyles.menuItem,
                    activeTab === 'video' && { backgroundColor: colors.primary + '20' },
                    isChangingTab && { opacity: 0.6 }
                  ]}
                  onPress={() => {
                    if (isChangingTab) return;
                    if (activeTab === 'video') {
                      setShowMenu(false);
                      return;
                    }
                    setIsChangingTab(true);
                    if (setActiveTab) setActiveTab('video');
                    setShowMenu(false);
                    // Reset flag after a short delay
                    setTimeout(() => {
                      setIsChangingTab(false);
                    }, 300);
                  }}
                  activeOpacity={0.7}
                  disabled={isChangingTab}
                >
                  <Text style={[dynamicStyles.menuItemText, { 
                    color: activeTab === 'video' ? colors.primary : colors.text,
                    fontWeight: activeTab === 'video' ? '600' : '400'
                  }]}>
                    Video
                  </Text>
                  {activeTab === 'video' && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowSearchModal(false);
          setSearchQuery('');
        }}
      >
        <Pressable 
          style={dynamicStyles.searchModalOverlay}
          onPress={() => {
            setShowSearchModal(false);
            setSearchQuery('');
          }}
        >
          <Pressable 
            style={[
              dynamicStyles.searchModalContainer,
              { backgroundColor: colors.background }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
              {/* Search Header */}
              <View style={[
                dynamicStyles.searchModalHeader,
                { borderBottomColor: colors.border || '#E0E0E0' }
              ]}>
                <View style={dynamicStyles.searchInputContainer}>
                  <Searchbar
                    placeholder="Tìm kiếm email hoặc tên người dùng..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={[
                      { backgroundColor: isDarkMode ? '#2a2a2b' : '#f0f0f0' },
                      { elevation: 0 }
                    ]}
                    inputStyle={{ color: colors.text }}
                    iconColor={colors.textSecondary}
                    placeholderTextColor={colors.textSecondary}
                    autoFocus={true}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowSearchModal(false);
                    setSearchQuery('');
                  }}
                  style={{ padding: 8 }}
                >
                  <Text style={{ color: colors.primary || '#0084ff', fontSize: 16, fontWeight: '600' }}>
                    Hủy
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Results */}
              {isSearching ? (
                <View style={dynamicStyles.searchEmptyContainer}>
                  <ActivityIndicator size="large" color={colors.primary || '#0084ff'} />
                  <Text style={[dynamicStyles.searchEmptyText, { color: colors.textSecondary }]}>
                    Đang tìm kiếm...
                  </Text>
                </View>
              ) : searchQuery.trim().length === 0 ? (
                <View style={dynamicStyles.searchEmptyContainer}>
                  <MaterialCommunityIcons 
                    name="magnify" 
                    size={64} 
                    color={colors.textSecondary || '#999'} 
                  />
                  <Text style={[dynamicStyles.searchEmptyText, { color: colors.textSecondary }]}>
                    Nhập email hoặc tên người dùng để tìm kiếm
                  </Text>
                </View>
              ) : searchResults.length === 0 ? (
                <View style={dynamicStyles.searchEmptyContainer}>
                  <MaterialCommunityIcons 
                    name="account-search-outline" 
                    size={64} 
                    color={colors.textSecondary || '#999'} 
                  />
                  <Text style={[dynamicStyles.searchEmptyText, { color: colors.textSecondary }]}>
                    Không tìm thấy người dùng
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id?.toString() || item.user_id?.toString() || Math.random().toString()}
                  // Performance optimizations
                  removeClippedSubviews={Platform.OS === 'android'}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  updateCellsBatchingPeriod={50}
                  renderItem={({ item }) => {
                    const userId = item.id || item.user_id;
                    const userIdString = userId?.toString();
                    const userName = item.full_name || item.username || 'Người dùng';
                    const userEmail = item.email || '';
                    const userAvatar = item.avatar_url;
                    const isFollowingUser = userIdString && followingIds.has(userIdString);
                    const isCurrentUser = userIdString === user?.id?.toString();
                    
                    return (
                      <View
                        style={[
                          dynamicStyles.searchResultItem,
                          { borderBottomColor: colors.border || '#E0E0E0' }
                        ]}
                      >
                        <TouchableOpacity
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                          onPress={() => {
                            setShowSearchModal(false);
                            setSearchQuery('');
                            // Navigate to user profile
                            navigation.navigate('OtherUserProfile' as never, { 
                              userId: userIdString 
                            } as never);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={dynamicStyles.searchResultAvatar}>
                            {userAvatar ? (
                              <Avatar.Image
                                size={50}
                                source={{ uri: getAvatarURL(userAvatar) }}
                              />
                            ) : (
                              <Avatar.Text
                                size={50}
                                label={getInitials(userName)}
                                style={{ backgroundColor: colors.primary || '#0084ff' }}
                              />
                            )}
                          </View>
                          <View style={dynamicStyles.searchResultInfo}>
                            <Text style={[
                              dynamicStyles.searchResultName,
                              { color: colors.text }
                            ]}>
                              {userName}
                            </Text>
                            {userEmail && (
                              <Text style={[
                                dynamicStyles.searchResultEmail,
                                { color: colors.textSecondary }
                              ]}>
                                {userEmail}
                              </Text>
                            )}
                            {item.username && item.username !== userName && (
                              <Text style={[
                                dynamicStyles.searchResultEmail,
                                { color: colors.textSecondary }
                              ]}>
                                @{item.username}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                        
                        {/* Action Buttons */}
                        {!isCurrentUser && (
                          <View style={dynamicStyles.searchResultActions}>
                            {/* Message Button */}
                            <Button
                              title="Nhắn tin"
                              onPress={() => {
                                if (userIdString) {
                                  createConversationMutation.mutate(userIdString);
                                }
                              }}
                              variant="primary"
                              size="small"
                              loading={createConversationMutation.isPending}
                              disabled={createConversationMutation.isPending}
                              style={{ minWidth: 90 }}
                            />
                            
                            {/* Follow/Unfollow Button */}
                            <Button
                              title={isFollowingUser ? 'Đang theo dõi' : 'Theo dõi'}
                              onPress={() => {
                                if (!userIdString) return;
                                if (isFollowingUser) {
                                  unfollowMutation.mutate(userIdString);
                                } else {
                                  followMutation.mutate(userIdString);
                                }
                              }}
                              variant={isFollowingUser ? 'secondary' : 'primary'}
                              size="small"
                              loading={followMutation.isPending || unfollowMutation.isPending}
                              disabled={followMutation.isPending || unfollowMutation.isPending}
                              style={{ minWidth: 90 }}
                            />
                          </View>
                        )}
                      </View>
                    );
                  }}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              )}
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Full Screen Image Viewer - Legacy (backward compatible) */}
      <FullScreenImageViewer
        visible={showImageViewer}
        images={imageViewerImages}
        initialIndex={imageViewerIndex}
        onClose={() => setShowImageViewer(false)}
        postData={imageViewerPostData}
      />

      {/* Lightbox - New implementation with animation */}
      <Lightbox />
      </Animated.View>
        </SafeAreaView>
      
      {/* Splash Screen khi chuyển sang Chat (giống Messenger) */}
      {showSplashScreen && (
        <Modal
          visible={showSplashScreen}
          transparent={true}
          animationType="none"
          statusBarTranslucent={true}
        >
          <Animated.View
            style={{
              flex: 1,
              opacity: splashOpacity,
            }}
          >
            <SplashScreen />
          </Animated.View>
        </Modal>
      )}

      {/* Reaction Picker - Hiển thị khi long press nút like */}
      <ReactionPicker
        visible={!!showReactionPicker}
        onSelect={(reactionType) => {
          if (showReactionPicker) {
            handleReactionSelect(showReactionPicker, reactionType);
          }
        }}
        onClose={() => setShowReactionPicker(null)}
        position={reactionPickerPosition}
      />
    </View>
  );
});

PostsListScreen.displayName = 'PostsListScreen';

export default PostsListScreen;

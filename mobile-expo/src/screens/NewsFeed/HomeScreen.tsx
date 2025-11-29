import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Dimensions, Platform, Animated, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { HomeHeader } from '../../components/NewsFeed/HomeHeader';
import PostsListScreen, { PostsListScreenRef } from './PostsListScreen';
import SidebarDrawer from '../../components/Common/SidebarDrawer';

// Feed types
type FeedType = 'discover' | 'following' | 'video';

interface FeedInfo {
  id: FeedType;
  displayName: string;
}

const FEEDS: FeedInfo[] = [
  { id: 'discover', displayName: 'Dành cho bạn' },
  { id: 'following', displayName: 'Đang theo dõi' },
  { id: 'video', displayName: 'Video' },
];

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [tabBarWidth, setTabBarWidth] = useState(screenWidth); // Lưu actual width của tab bar
  const headerHeight = 72;
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const selectedIndexRef = useRef(0); // Dùng ref để tránh delay
  const scrollX = useRef(new Animated.Value(0)).current; // Dùng để animate tab indicator mượt mà
  const postsListRefs = useRef<{ [key: string]: React.RefObject<PostsListScreenRef> | null }>({}); // Refs cho các PostsListScreen
  const lastRefreshParam = useRef<number | null>(null);

  const handleSelect = useCallback(
    (index: number) => {
      selectedIndexRef.current = index;
      setSelectedIndex(index);
      // Scroll to the selected page
      scrollViewRef.current?.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    },
    [screenWidth],
  );

  const handleScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    // Tính index dựa trên vị trí scroll hiện tại - cập nhật real-time
    const progress = offsetX / screenWidth;
    const index = Math.round(progress);
    
    // Cập nhật ngay lập tức khi scroll, không chờ scroll kết thúc
    // Dùng ref để tránh delay và nhảy lung tung
    if (index !== selectedIndexRef.current && index >= 0 && index < FEEDS.length) {
      selectedIndexRef.current = index;
      setSelectedIndex(index);
    }
  }, [screenWidth]);

  const handleScrollBeginDrag = useCallback(() => {
    // Bắt đầu scroll - không cần xử lý gì
  }, []);

  const handleScrollEndDrag = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    // Đảm bảo snap về đúng tab khi scroll kết thúc
    if (index >= 0 && index < FEEDS.length && index !== selectedIndexRef.current) {
      selectedIndexRef.current = index;
      setSelectedIndex(index);
      // Snap về đúng vị trí nếu scroll chưa đúng
      scrollViewRef.current?.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    }
  }, [screenWidth]);

  const handlePressSelected = useCallback(() => {
    // Scroll to top or refresh feed
    // This will be handled by individual FeedPage components
  }, []);

  const handleLogoPress = useCallback(() => {
    // Scroll to top - will be handled by FeedPage
    // Không cần xử lý gì ở đây, FeedPage sẽ tự xử lý
  }, []);

  const handleMenuPress = useCallback(() => {
    // Show menu modal
    setShowMenu(true);
  }, []);

  const handleSearchPress = useCallback(() => {
    // TODO: Implement search functionality
    // Hiện tại không có Search screen, có thể hiển thị modal hoặc search overlay
    console.log('Search pressed - Search screen not implemented yet');
  }, []);

  const handleAddPress = useCallback(() => {
    navigation.navigate('CreatePost' as never);
  }, [navigation]);

  const handleMessengerPress = useCallback(() => {
    navigation.dispatch(
      require('@react-navigation/native').CommonActions.navigate({
        name: 'Chat',
      } as never)
    );
  }, [navigation]);

  // Track scroll position to only allow swipe when at start
  const scrollPositionRef = useRef(0);
  // Track initial touch position for swipe detection
  const initialTouchXRef = useRef<number | null>(null);

  // PanResponder for swipe gesture - more reliable than Gesture.Pan for this use case
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        // Only respond to touches that start from the left edge (within 30px from left)
        const startX = evt.nativeEvent.pageX;
        initialTouchXRef.current = startX;
        
        // Only start if sidebar is closed and scroll is at start
        const shouldRespond = startX <= 30 && !showMenu && scrollPositionRef.current === 0;
        if (!shouldRespond) {
          initialTouchXRef.current = null;
        }
        return shouldRespond;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond if swiping from left edge and moving right
        // And horizontal movement is greater than vertical (to avoid conflict with scroll)
        const startX = initialTouchXRef.current ?? evt.nativeEvent.pageX;
        return (
          startX <= 30 &&
          gestureState.dx > 3 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.1 &&
          !showMenu &&
          scrollPositionRef.current === 0
        );
      },
      onPanResponderGrant: () => {
        // Touch started - gesture is active
      },
      onPanResponderMove: (evt, gestureState) => {
        // User is dragging - could add visual feedback here if needed
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Check if we started from left edge
        if (initialTouchXRef.current === null || initialTouchXRef.current > 30) {
          initialTouchXRef.current = null;
          return;
        }
        
        // Check if swipe was significant enough
        // Use velocity for faster swipes (if velocity > 0.3, reduce threshold to 20px)
        // Otherwise require 30px movement
        const threshold = Math.abs(gestureState.vx) > 0.3 ? 20 : 30;
        
        if (
          gestureState.dx > threshold &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.1 &&
          !showMenu
        ) {
          setShowMenu(true);
        }
        
        // Reset initial touch position
        initialTouchXRef.current = null;
      },
      onPanResponderTerminate: () => {
        // Gesture was cancelled
        initialTouchXRef.current = null;
      },
    })
  ).current;

  // Listen for navigation params to trigger scroll to top and refresh (like social-app-main)
  useEffect(() => {
    const params = route.params as any;
    if (params?.refresh && params.refresh !== lastRefreshParam.current) {
      lastRefreshParam.current = params.refresh;
      
      // Get current feed type based on selected index
      const currentFeedType = FEEDS[selectedIndex]?.id || 'discover';
      const postsListRef = postsListRefs.current[currentFeedType];
      
      if (params.scrollToTop && postsListRef) {
        // Trigger scroll to top and refresh for current PostsListScreen
        // Use a small delay to ensure ref is ready
        setTimeout(() => {
          if (postsListRef && typeof postsListRef.scrollToTop === 'function') {
            console.log('Triggering scrollToTop for feed:', currentFeedType);
            postsListRef.scrollToTop();
          } else {
            console.log('PostsListRef not ready or scrollToTop not available:', {
              hasRef: !!postsListRef,
              hasMethod: postsListRef && typeof postsListRef.scrollToTop === 'function',
              feedType: currentFeedType,
            });
          }
        }, 150);
      }
    }
  }, [route.params, selectedIndex]);

  // Also listen for focus events to trigger refresh when tab is pressed
  useFocusEffect(
    useCallback(() => {
      const params = route.params as any;
      if (params?.refresh && params.refresh !== lastRefreshParam.current) {
        lastRefreshParam.current = params.refresh;
        
        // Get current feed type based on selected index
        const currentFeedType = FEEDS[selectedIndex]?.id || 'discover';
        const postsListRef = postsListRefs.current[currentFeedType];
        
        if (params.scrollToTop && postsListRef) {
          // Trigger scroll to top and refresh for current PostsListScreen
          setTimeout(() => {
            if (postsListRef && typeof postsListRef.scrollToTop === 'function') {
              console.log('Triggering scrollToTop from focus effect for feed:', currentFeedType);
              postsListRef.scrollToTop();
            }
          }, 150);
        }
      }
    }, [route.params, selectedIndex])
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
      {/* Swipe gesture detector - overlay on left edge with high zIndex */}
      <View 
        style={styles.swipeDetector}
        {...panResponder.panHandlers}
      />
      
      <HomeHeader
        onMenuPress={handleMenuPress}
        onLogoPress={handleLogoPress}
        onSearchPress={handleSearchPress}
        onAddPress={handleAddPress}
        onMessengerPress={handleMessengerPress}
        headerHeight={headerHeight}
        tabBar={
          <View 
            style={[styles.tabBarContainer, { 
              backgroundColor: isDarkMode ? colors.background || '#000000' : colors.surface || '#FFFFFF',
              borderBottomColor: colors.border 
            }]}
            onLayout={(e) => {
              // Lưu actual width của tab bar để tính toán chính xác
              const width = e.nativeEvent.layout.width;
              if (width > 0 && width !== tabBarWidth) {
                setTabBarWidth(width);
              }
            }}
          >
            {/* Animated indicator - di chuyển mượt mà theo scroll */}
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  backgroundColor: isDarkMode ? '#0084ff' : colors.primary,
                  transform: [
                    {
                      translateX: scrollX.interpolate({
                        inputRange: FEEDS.map((_, i) => i * screenWidth),
                        outputRange: FEEDS.map((_, i) => {
                          // Tính toán vị trí indicator dựa trên tab item width
                          // Mỗi tab có flex: 1, nên width = tabBarWidth / FEEDS.length
                          const tabItemWidth = tabBarWidth / FEEDS.length;
                          return i * tabItemWidth;
                        }),
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                },
              ]}
            />
            {FEEDS.map((feed, index) => {
              // Animated opacity cho text
              const opacity = scrollX.interpolate({
                inputRange: [
                  (index - 1) * screenWidth,
                  index * screenWidth,
                  (index + 1) * screenWidth,
                ],
                outputRange: [0.6, 1, 0.6],
                extrapolate: 'clamp',
              });
              
              // Animated color cho text
              const textColor = scrollX.interpolate({
                inputRange: [
                  (index - 1) * screenWidth,
                  index * screenWidth,
                  (index + 1) * screenWidth,
                ],
                outputRange: [
                  colors.textSecondary,
                  isDarkMode ? '#0084ff' : colors.primary,
                  colors.textSecondary,
                ],
                extrapolate: 'clamp',
              });
              
              return (
                <TouchableOpacity
                  key={feed.id}
                  style={[styles.tabItem, selectedIndex === index && styles.tabItemActive]}
                  onPress={() => handleSelect(index)}
                  activeOpacity={0.7}
                >
                  <Animated.Text
                    style={[
                      styles.tabText,
                      { 
                        color: textColor,
                        opacity: opacity,
                      },
                      selectedIndex === index && styles.tabTextActive,
                    ]}
                  >
                    {feed.displayName}
                  </Animated.Text>
                </TouchableOpacity>
              );
            })}
          </View>
        }
      />
      {/* Render content with Animated.ScrollView for swipe - không dùng PagerView để tránh lỗi trong Expo */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          // Chỉ cập nhật index khi momentum scroll kết thúc, không gọi handleScroll để tránh double update
          const offsetX = event.nativeEvent.contentOffset.x;
          const index = Math.round(offsetX / screenWidth);
          if (index >= 0 && index < FEEDS.length && index !== selectedIndexRef.current) {
            selectedIndexRef.current = index;
            setSelectedIndex(index);
          }
        }}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { 
            useNativeDriver: false, // Cần false vì đang dùng cho layout animation
            listener: (event: any) => {
              // Update scroll position for swipe gesture detection
              scrollPositionRef.current = event.nativeEvent.contentOffset.x;
              handleScroll(event);
            },
          }
        )}
        scrollEventThrottle={16} // Tăng lên 16 để mượt mà hơn
        style={styles.contentContainer}
        contentContainerStyle={styles.contentContainerStyle}
        nestedScrollEnabled={Platform.OS === 'android'}
        scrollEnabled={true}
        bounces={true} // Cho phép bounce để mượt hơn
        decelerationRate={0.9} // Giảm từ "fast" để mượt mà hơn
        snapToInterval={screenWidth}
        snapToAlignment="start"
        disableIntervalMomentum={false} // Cho phép momentum để mượt hơn
      >
        {FEEDS.map((feed, index) => (
          <View
            key={feed.id}
            style={[styles.feedPage, { width: screenWidth }]}
            collapsable={false}
          >
            <PostsListScreen 
              feedType={feed.id}
              ref={(ref: PostsListScreenRef | null) => {
                if (ref) {
                  // Store ref directly (forwardRef returns the component instance, not a ref object)
                  postsListRefs.current[feed.id] = ref as any;
                } else {
                  delete postsListRefs.current[feed.id];
                }
              }}
            />
          </View>
        ))}
      </Animated.ScrollView>

      {/* Sidebar Drawer */}
      <SidebarDrawer
        visible={showMenu}
        onClose={() => setShowMenu(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabItemActive: {
    // Active state styling
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '33.333%', // Mỗi tab chiếm 1/3 (vì có 3 tabs)
    height: 2,
    borderRadius: 1,
  },
  contentContainer: {
    flex: 1,
  },
  contentContainerStyle: {
    flexDirection: 'row',
  },
  feedPage: {
    flex: 1,
    height: '100%',
  },
  swipeDetector: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 30, // 30px wide area on left edge to detect swipe (increased for better detection)
    zIndex: 999,
    backgroundColor: 'transparent',
  },
});


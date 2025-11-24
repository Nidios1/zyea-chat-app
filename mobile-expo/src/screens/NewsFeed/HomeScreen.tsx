import React, { useCallback, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Modal, Pressable, TouchableOpacity, Text, Dimensions, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { HomeHeader } from '../../components/NewsFeed/HomeHeader';
import PostsListScreen from './PostsListScreen';

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [tabBarWidth, setTabBarWidth] = useState(screenWidth); // Lưu actual width của tab bar
  const headerHeight = 72;
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const selectedIndexRef = useRef(0); // Dùng ref để tránh delay
  const scrollX = useRef(new Animated.Value(0)).current; // Dùng để animate tab indicator mượt mà

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
      <HomeHeader
        onMenuPress={handleMenuPress}
        onLogoPress={handleLogoPress}
        onSearchPress={handleSearchPress}
        onAddPress={handleAddPress}
        onMessengerPress={handleMessengerPress}
        headerHeight={headerHeight}
        tabBar={
          <View 
            style={[styles.tabBarContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
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
            listener: handleScroll,
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
            <PostsListScreen feedType={feed.id} />
          </View>
        ))}
      </Animated.ScrollView>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
        statusBarTranslucent={true}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMenu(false)}
        >
          <Pressable 
            style={[styles.menuContainer, { backgroundColor: colors.surface }]}
            onPress={() => {}} // Prevent closing when pressing on menu content
          >
            <View style={[styles.menuHandle, { backgroundColor: colors.border || (isDarkMode ? '#3A3B3C' : '#E4E6EB') }]} />
            <View style={styles.menuContent}>
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  selectedIndex === 0 && { backgroundColor: (colors.primary || '#1877F2') + '20' },
                  { borderBottomColor: colors.border || (isDarkMode ? '#3A3B3C' : '#E4E6EB') },
                ]}
                onPress={() => {
                  if (selectedIndex !== 0) {
                    handleSelect(0);
                  }
                  setShowMenu(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.menuItemText, { 
                  color: selectedIndex === 0 ? (colors.primary || '#1877F2') : colors.text,
                  fontWeight: selectedIndex === 0 ? '600' : '400'
                }]}>
                  Dành cho bạn
                </Text>
                {selectedIndex === 0 && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary || '#1877F2'} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  selectedIndex === 1 && { backgroundColor: (colors.primary || '#1877F2') + '20' },
                  { borderBottomColor: colors.border || (isDarkMode ? '#3A3B3C' : '#E4E6EB') },
                ]}
                onPress={() => {
                  if (selectedIndex !== 1) {
                    handleSelect(1);
                  }
                  setShowMenu(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.menuItemText, { 
                  color: selectedIndex === 1 ? (colors.primary || '#1877F2') : colors.text,
                  fontWeight: selectedIndex === 1 ? '600' : '400'
                }]}>
                  Đang theo dõi
                </Text>
                {selectedIndex === 1 && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary || '#1877F2'} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  selectedIndex === 2 && { backgroundColor: (colors.primary || '#1877F2') + '20' },
                ]}
                onPress={() => {
                  if (selectedIndex !== 2) {
                    handleSelect(2);
                  }
                  setShowMenu(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.menuItemText, { 
                  color: selectedIndex === 2 ? (colors.primary || '#1877F2') : colors.text,
                  fontWeight: selectedIndex === 2 ? '600' : '400'
                }]}>
                  Video
                </Text>
                {selectedIndex === 2 && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary || '#1877F2'} />
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '50%',
  },
  menuHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
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
    borderRadius: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemText: {
    fontSize: 16,
  },
});


import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBar } from '../../contexts/TabBarContext';
import { Feather } from '@expo/vector-icons';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  badge?: number | 'dot' | null;
}

interface BottomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_WIDTH = SCREEN_WIDTH * 0.8;   // 80% width
const BAR_RADIUS = 32;                  // pill/capsule, nên >= 1/2 bar height

// Màu icon tối ưu cho glassmorphism với contrast cao
const getIconColors = (isDarkMode: boolean, isActive: boolean) => {
  if (isActive) {
    // Icon active: màu đậm, contrast cao để nổi bật
    return isDarkMode ? '#FFFFFF' : '#000000'; // Trắng trên dark, đen trên light
  } else {
    // Icon inactive: xám đủ contrast, không quá nhạt
    return isDarkMode ? '#A0A0A0' : '#707070'; // Xám sáng hơn trên dark, xám đậm hơn trên light
  }
};

const BottomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { isVisible } = useTabBar();
  const { isDarkMode } = useAppTheme(); // Lấy từ ThemeContext thật

  // Helper: get focused nested route name for a tab
  const getFocusedNestedRouteName = (route: any): string | undefined => {
    const nestedState = route?.state || descriptors?.[route?.key]?.state;
    if (!nestedState) return undefined;
    const nestedRoute = nestedState.routes?.[nestedState.index];
    if (!nestedRoute) return undefined;
    // Dive deeper if there are multiple levels
    return getFocusedNestedRouteName(nestedRoute) || nestedRoute.name;
  };

  // Khai báo lại tabItems tránh lỗi không tìm thấy
  const tabItems: TabItem[] = [
    { id: 'NewsFeed', label: '', icon: 'home-variant-outline', badge: null },
    { id: 'Video', label: '', icon: 'video-outline', badge: null },
    { id: 'Chat', label: '', icon: 'send', badge: null },
    { id: 'Notifications', label: '', icon: 'heart-outline', badge: 0 },
    { id: 'Profile', label: '', icon: 'account-circle', badge: null },
  ];

  // 1) Ẩn khi ở tab Profile hoặc Video (fullscreen experience)
  const currentRoute = state.routes[state.index];
  const nestedFocused = getFocusedNestedRouteName(currentRoute);
  if (currentRoute?.name === 'Profile' || currentRoute?.name === 'Video') {
    return null;
  }

  // Ẩn hoàn toàn khi đang ở màn hình đọc tin nhắn (ChatDetail)
  if (currentRoute?.name === 'Chat' && nestedFocused === 'ChatDetail') {
    return null;
  }

  // 2) Ẩn/hiện dựa trên context (dùng cho NewsFeed khi cuộn)
  if (!isVisible) {
    return null;
  }
  return (
    <View pointerEvents="box-none" style={[styles.absolute]}>
      <BlurView
        intensity={24}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[
          styles.blurBackground,
          {
            width: BAR_WIDTH,
            borderRadius: BAR_RADIUS,
            height: 54, // strict pill height
            marginBottom: insets.bottom ? insets.bottom + 8 : 14,
            borderWidth: 1,
            borderColor: isDarkMode 
              ? 'rgba(255,255,255,0.15)'  // viền nhẹ hơn trên dark
              : 'rgba(255,255,255,0.22)', // viền kính mờ nhẹ trên light
            backgroundColor: isDarkMode
              ? 'rgba(0,0,0,0.25)'        // nền tối trên dark mode
              : 'rgba(255,255,255,0.06)', // lớp nền sữa rất nhẹ trên light
          },
        ]}
      >
        {/* Highlight mép trên kiểu kính */}
        <LinearGradient
          colors={isDarkMode 
            ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']
            : ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topHighlight}
          pointerEvents="none"
        />
        {/* Vignette viền để tạo chiều sâu kính */}
        <LinearGradient
          colors={isDarkMode
            ? ['rgba(0,0,0,0.20)', 'rgba(0,0,0,0.00)']
            : ['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.00)']
          }
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.bottomVignette}
          pointerEvents="none"
        />
        <View style={styles.tabsContainer}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const tabItem = tabItems.find(item => item.id === route.name);
            if (!tabItem) return null;
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  {tabItem.id === 'Chat' ? (
                    <View style={{ transform: [{ rotate: '-20deg' }], marginTop: -2 }}>
                      <MaterialCommunityIcons
                        name={tabItem.icon as any}
                        size={34}
                        color={getIconColors(isDarkMode, isFocused)}
                      />
                    </View>
                  ) : (
                    <MaterialCommunityIcons
                      name={tabItem.icon as any}
                      size={34}
                      color={getIconColors(isDarkMode, isFocused)}
                    />
                  )}
                  {tabItem.badge !== null && tabItem.badge !== undefined && typeof tabItem.badge === 'number' && tabItem.badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{tabItem.badge > 99 ? '99+' : tabItem.badge}</Text>
                    </View>
                  )}
                  {tabItem.badge === 'dot' && !isFocused && (
                    <View style={styles.dot} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
  },
  blurBackground: {
    overflow: 'hidden',
    borderTopWidth: 0,
    borderRadius: BAR_RADIUS,
    backgroundColor: 'transparent',
    height: 54,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 0, // sát mép dọc
    paddingHorizontal: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',    // đảm bảo icon ở giữa viên capsule
    paddingHorizontal: 0,
    // bỏ hoàn toàn minHeight, gap
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Hide label entirely for IG style
  label: { display: 'none' },
  // Active underline indicator
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  tiltWrapper: {
    transform: [{ rotate: '45deg' }],
  },
  profileActiveWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0f0f10',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlusWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#2a2a2d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  topHighlight: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: 2,
    height: 14,
    borderTopLeftRadius: BAR_RADIUS - 2,
    borderTopRightRadius: BAR_RADIUS - 2,
  },
  bottomVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 12,
  },
});

export default BottomTabBar;


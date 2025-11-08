import React, { useEffect, useMemo, useRef } from 'react';
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
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { chatAPI } from '../../utils/api';

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

// Màu icon giống Threads - active màu primary, inactive màu textSecondary
const getIconColors = (colors: any, isActive: boolean) => {
  if (isActive) {
    // Icon active: màu primary
    return colors.primary || '#E74C3C';
  } else {
    // Icon inactive: textSecondary
    return colors.textSecondary || '#707070';
  }
};

const BottomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { isVisible } = useTabBar();
  const { isDarkMode, colors } = useAppTheme(); // Lấy từ ThemeContext thật
  
  // Fetch conversations to get unread count
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await chatAPI.getConversations();
      return Array.isArray(res.data) ? res.data : (res.data?.conversations || []);
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Calculate unread count from conversations
  const unreadCount = useMemo(() => {
    return conversations.reduce((total: number, conv: any) => {
      return total + (conv.unread_count || conv.unreadCount || 0);
    }, 0);
  }, [conversations]);
  
  // Animation for badge pulse effect
  const badgeScale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (unreadCount > 0) {
      // Pulse animation when there are unread messages
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(badgeScale, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(badgeScale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      
      return () => {
        pulseAnimation.stop();
      };
    } else {
      badgeScale.setValue(1);
    }
  }, [unreadCount, badgeScale]);

  // Helper: get focused nested route name for a tab
  const getFocusedNestedRouteName = (route: any): string | undefined => {
    const nestedState = route?.state || descriptors?.[route?.key]?.state;
    if (!nestedState) return undefined;
    const nestedRoute = nestedState.routes?.[nestedState.index];
    if (!nestedRoute) return undefined;
    // Dive deeper if there are multiple levels
    return getFocusedNestedRouteName(nestedRoute) || nestedRoute.name;
  };

  // Khai báo lại tabItems tránh lỗi không tìm thấy - giống Threads
  const tabItems: TabItem[] = [
    { id: 'NewsFeed', label: '', icon: 'home', badge: null },
    { id: 'Video', label: '', icon: 'eye-outline', badge: null },
    { id: 'Party', label: 'Party', icon: '', badge: null }, // Text ở giữa
    { id: 'Chat', label: '', icon: 'message-outline', badge: unreadCount > 0 ? unreadCount : null }, // Badge từ unread count thực tế
    { id: 'Profile', label: '', icon: 'account-circle-outline', badge: null },
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
      <View
        style={[
          styles.tabBarBackground,
          {
            paddingBottom: insets.bottom || 0,
            backgroundColor: colors.surface || colors.background, // Sử dụng theme colors
            borderTopColor: colors.border || '#E0E0E0',
          },
        ]}
      >
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
              } else if (isFocused && route.name === 'NewsFeed') {
                // If already on NewsFeed tab, navigate to FeedStack and set refresh param
                const feedStack = navigation.getParent();
                if (feedStack) {
                  feedStack.navigate('Feed', { refresh: Date.now() });
                } else {
                  // Fallback: navigate with refresh param
                  navigation.navigate(route.name, { refresh: Date.now() });
                }
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            // Nếu là tab "Party", hiển thị text thay vì icon
            if (tabItem.id === 'Party') {
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
                  <Text style={[styles.partyText, { color: isFocused ? colors.primary || '#E74C3C' : colors.textSecondary || '#707070' }]}>
                    {tabItem.label}
                  </Text>
                </TouchableOpacity>
              );
            }

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
                  <MaterialCommunityIcons
                    name={tabItem.icon as any}
                    size={28}
                    color={getIconColors(colors, isFocused)}
                  />
                  {tabItem.badge !== null && tabItem.badge !== undefined && typeof tabItem.badge === 'number' && tabItem.badge > 0 && (
                    <Animated.View 
                      style={[
                        styles.badge,
                        {
                          transform: [{ scale: badgeScale }],
                        },
                      ]}
                    >
                      <Text style={styles.badgeText}>{tabItem.badge > 99 ? '99+' : tabItem.badge}</Text>
                    </Animated.View>
                  )}
                  {tabItem.badge === 'dot' && !isFocused && (
                    <Animated.View 
                      style={[
                        styles.dot,
                        {
                          transform: [{ scale: badgeScale }],
                        },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
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
  },
  tabBarBackground: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -10,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
});

export default BottomTabBar;

